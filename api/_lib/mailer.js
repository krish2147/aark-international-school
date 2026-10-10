// Gmail (App Password) mail transport for enquiry notifications.
const nodemailer = require('nodemailer');

function createMailer({ env = process.env, transportFactory = nodemailer.createTransport } = {}) {
  const user = env.GMAIL_USER;
  const pass = env.GMAIL_APP_PASSWORD;
  const schoolTo = env.SCHOOL_RECEIVING_EMAIL || user;
  let transport;
  const getTransport = () => (transport = transport || transportFactory({ service: 'gmail', auth: { user, pass } }));

  return {
    configured: Boolean(user && pass),
    sendToSchool({ subject, text }, replyTo) {
      return getTransport().sendMail({ from: `"AARK Website" <${user}>`, to: schoolTo, replyTo, subject, text });
    },
    sendToParent(to, { subject, text }) {
      return getTransport().sendMail({ from: `"AARK International School" <${user}>`, to, subject, text });
    },
  };
}

module.exports = { createMailer };
