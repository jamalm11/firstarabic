// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      html
    });
    console.log(`📧 Email envoyé à ${to}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email à ${to}:`, error.message);
  }
}

module.exports = { sendEmail };
