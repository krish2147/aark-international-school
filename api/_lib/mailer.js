// Gmail (App Password) mail transport for enquiry notifications.
const nodemailer = require('nodemailer');
const { envValue } = require('./storageEnv');

// On Preview deployments only PREVIEW_GMAIL_* / PREVIEW_SCHOOL_RECEIVING_EMAIL are read,
// so a test build can never send from, or to, the school's real mailbox.
function createMailer({ env = process.env, transportFactory = nodemailer.createTransport } = {}) {
  const read = name => envValue(name, env);
  const user = read('GMAIL_USER');
  const pass = read('GMAIL_APP_PASSWORD');
  const schoolTo = read('SCHOOL_RECEIVING_EMAIL') || user;
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
