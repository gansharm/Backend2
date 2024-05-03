const nodeMailer = require('nodemailer')
const { options } = require('../app')

exports.sendEmail = async (options) =>{
    const transporter = nodeMailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "71d5cba45aa5f5",
          pass: "865ad5f01b7591"
        }
      });

    const mailOptions = {
        from:process.env.SMPT_MAIL,
        to:options.email,
        subject:options.subject,
        text:options.message
    }
    await transporter.sendMail(mailOptions);
}