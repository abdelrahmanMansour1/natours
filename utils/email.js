/* eslint-disable */
import nodemailer from 'nodemailer';
import pug from 'pug';
import * as htmlToText from 'html-to-text';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

class Email {
  constructor(user, url, message) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Abdelrahman Mansour <${process.env.EMAIL_FROM}>`;
  }

  // 1) Create a transporter
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: '7483df001@smtp-brevo.com',
          pass: 'xsmtpsib-a114553756b4198192511a12d71a36fd00fa5f2902f93444251549940e677aae-WX0JkSRGt1Iygvzm',
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    // 3) Create Transport and send Email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }
  async sendPasswordReset() {
    await this.send(
      'resetPassword',
      'Your password reset token (valid for 10 minutes)',
    );
  }
}

export default Email;
