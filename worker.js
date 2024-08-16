require('dotenv').config();

const aws_obj = require('../MailTesting/aws/aws');
const { MailGun } = require('./mailservice/mailgun_email');
const { Gmail } = require('./mailservice/gmail_email')
const text = require('body-parser/lib/types/text');

const sqs = new aws_obj.SQS();

const processQueue = async () => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
  };
  try {
    const data = await sqs.receiveMessage(params).promise();
    const primarySender = new MailGun();
    if (data.Messages) {
      for (const message of data.Messages) {
        const emailData = JSON.parse(message.Body);
        const mailOptions = {
          from: "soundaryakrishna0896@gmail.com",
          to: emailData.to,
          subject: emailData.subject,
          text: emailData.text
        }
        try {
          const result = await primarySender.sendEmail(mailOptions)
          console.log(`Email sent: Mail ID - ${result.id}, Status code - ${result.status}, Sent Via: ${result.sender}`);
          delete result
          await sqs.deleteMessage({ QueueUrl: process.env.SQS_QUEUE_URL, ReceiptHandle: message.ReceiptHandle }).promise();
        } catch (emailError) {

          console.error(`Failed to send email ${emailError.message}, Retrying the mail`);
          // Move the failed job to the retry queue
          const retryParams = {
            MessageBody: JSON.stringify(emailData),
            QueueUrl: process.env.SQS_QUEUE_RETRY_URL,
          };
          await sqs.sendMessage(retryParams).promise();
          await sqs.deleteMessage({ QueueUrl: process.env.SQS_QUEUE_URL, ReceiptHandle: message.ReceiptHandle }).promise();
        }
      }
    }
  } catch (error) {
    console.error('Error processing queue:', error.message);
  }

  // Continue processing
  processQueue();
};
processQueue();



const processRetryQueue = async () => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_RETRY_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
  };

  let primaryFailureCount = 0;
  const MAX_RETRIES = 3;
  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      for (const message of data.Messages) {
        const emailData = JSON.parse(message.Body);
        const mailOptions = {
          from: "soundaryakrishna0896@gmail.com",
          to: emailData.to,
          subject: emailData.subject,
          text: emailData.text
        }
        const retryMailsend = async (mailOptions, useBackup = false) => {
          const mailSenderClass = useBackup ? Gmail : MailGun;
          const transporter = new mailSenderClass()
          try {
            const result = await transporter.sendEmail(mailOptions)
            console.log(`Email sent: Mail ID - ${result.id}, Status code - ${result.status}, Sent Via: ${result.sender}`);
            primaryFailureCount = 0;
            delete result
            await sqs.deleteMessage({ QueueUrl: process.env.SQS_QUEUE_RETRY_URL, ReceiptHandle: message.ReceiptHandle }).promise();
            return 200
          } catch (emailError) {
            console.error('Failed to send email:', emailError.message);
            if (!useBackup) {
              primaryFailureCount++;
              if (primaryFailureCount === MAX_RETRIES) {
                console.log('Switching to backup transporter...');
                await retryMailsend(mailOptions, true);

              } else {
                console.log(`Retrying with primary transporter (${primaryFailureCount}/${MAX_RETRIES})...`);
                await retryMailsend(mailOptions, false);
              }
            } else {
              console.log('Backup transporter failed.');
            }
          }
        }
        retryMailsend(mailOptions)
      }

    }
  } catch (error) {
    console.error('Error processing queue:', error.message);
  }

  // Continue processing
  processRetryQueue();
};


// Start processing

processRetryQueue();


