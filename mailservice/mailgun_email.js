require('dotenv').config()
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = process.env.MAILGUN_DOMAIN
// const mg = mailgun.client({
//     username: 'api',
//     key: process.env.MAILGUN_API_KEY, // Replace with your Mailgun API key
// });

class MailGun{
    constructor() {
        this.mg = mailgun.client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY, // Replace with your Mailgun API key
        });
    }
    // Send email
    async sendEmail(mailOptions, useBackup = false) {
        let messageId
        try {
            let info = await this.mg.messages.create(domain, mailOptions)
            //console.log(info)
            messageId=info.id
            info.sender='MailGun'
            return info

        }
        catch (error) {
            throw error
        }

        // await getDomainDetails()
        //await trackEmail(messageId)


    }

    async trackEmail(messageId) {
        const trackingQuery = {
            begin: 'Thu, 15 Aug 2024 16:00:00 -0000',
            end: 'Thu, 15 Aug 2024 17:00:00 -0000',
            ascending: 'yes',
            limit: 1,
            'message-id': messageId,
        };
        this.mg.events.get(domain, trackingQuery)
        .then((data) =>{
            console.log(data.items[0])
        })
        .catch((err) => {
            console.log(err);
        })
    }
    async getDomainDetails() {
        //mg.stats.getDomain('sandboxbc4ae013bb204c0d803b6df36a87c700.mailgun.org', { event: ['delivered', 'accepted', 'failed', 'complained'] }).then(msg => console.log(msg)).catch(err => console.error(err)); // logs any error
        const date = new Date(2024, 8, 15, 16, 0, 0, 0);
        const events = await this.mg.events.get(domain, {
            begin: date.toUTCString(), // 'Tue, 01 Aug 2023 21:00:00 GMT'
            ascending: 'yes',
            limit: 5,
            event: 'delivered'
        });
        console.log(events)
    }
}

module.exports = { MailGun }; 