require('dotenv').config()

const express = require('express')
const aws_obj = require('../MailTesting/aws/aws')
const bodyParser = require('body-parser');

const app = express()
app.use(express.json())
app.use(bodyParser.json());

const PORT = 3045

const sqs = new aws_obj.SQS();

app.post('/api/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Before Implementing Queue
    // const emailOptions = {
    //     from: 'soundaryakrishna0896@gmail.com',
    //     to,
    //     subject,
    //     text
    // };



    // try {
    //     await sendEmail(emailOptions);
    //     return res.status(200).json({ message: 'Email sent successfully' });
    // } catch (error) {
    //     // Check the type of error and respond with the appropriate status code
    //     console.log(error)
    //     if (error.status == 400) {
    //         return res.status(400).json({ error: 'Sender/Reciepent Mail Address is not valid' });
    //     } else if (error.status == 401 ) {
    //         return res.status(401).json({ error: 'Unauthorized access' });
    //     } else if (error.status == 422) {
    //         return res.status(422).json({ error: 'Invalid email address' });
    //     } else {
    //         // For all other errors, respond with a generic 500 Internal Server Error
    //         return res.status(500).json({ error: 'Internal Server Error' });
    //     }
    // }

    const params = {
        MessageBody: JSON.stringify({ to, subject, text }),
        QueueUrl: process.env.SQS_QUEUE_URL,
    };

    try {
        const result = await sqs.sendMessage(params).promise();
        res.status(202).json({ message: 'Email enqueued', messageId: result.MessageId });
    } catch (error) {
        console.error('Error enqueuing email:', error);
        res.status(500).json({ message: 'Failed to enqueue email', error: error.message });
    }




})

app.get('/api/get-mails-status', async (req, res) => {
    try {
        await getDomainDetails()
        return res.status(200).json({ message: res });
    } catch (error) {
        return res.status(400).json({ error: error })
    }
})



app.listen(PORT, () => {
    console.log('server is running on port', PORT)
})