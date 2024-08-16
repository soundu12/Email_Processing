require('dotenv').config();
const nodemailer = require('nodemailer');

class Gmail{
    constructor() {
        this.backupTransporter = nodemailer.createTransport({
            service: process.env.BACKUP_EMAIL_SERVICE,
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.BACKUP_EMAIL_USER,
                pass: process.env.BACKUP_EMAIL_PASS
            }
        });
    }

    async sendEmail(mailOptions, useBackup = false) {
        try {
            let info = await this.backupTransporter.sendMail(mailOptions);
            const retval = {
                id: info.messageId,
                sender: 'GMail',
                status: info.response.slice(4,9).split('.').join('')
            }
            return retval
        } catch (error) {
            console.log(`Error sending email with ${useBackup ? 'backup' : 'primary'} transporter:`, error.message);
        }
    }
}

module.exports = { Gmail }; 