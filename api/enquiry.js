const nodemailer = require('nodemailer');

const ENQUIRY_TYPES = {
  visit: 'Campus Visit Request',
  admission: 'Admissions Enquiry',
};

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars');
    return res.status(500).json({ ok: false, error: 'Server email is not configured.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = (body.name || '').toString().trim().slice(0, 200);
  const phone = (body.phone || '').toString().trim().slice(0, 40);
  const child = (body.child || '').toString().trim().slice(0, 200);
  const grade = (body.grade || '').toString().trim().slice(0, 100);
  const email = (body.email || '').toString().trim().slice(0, 200);
  const type = ENQUIRY_TYPES[body.type] ? body.type : 'admission';

  if (!name || !phone || !grade) {
    return res.status(400).json({ ok: false, error: 'Name, phone and grade are required.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'That email address looks invalid.' });
  }

  const enquiryType = ENQUIRY_TYPES[type];
  const schoolTo = process.env.SCHOOL_RECEIVING_EMAIL || process.env.GMAIL_USER;

  try {
    const mailer = getTransporter();

    await mailer.sendMail({
      from: `"AARK Website" <${process.env.GMAIL_USER}>`,
      to: schoolTo,
      replyTo: email || undefined,
      subject: `${enquiryType} — ${name}`,
      text: [
        enquiryType,
        '',
        `Parent/Guardian: ${name}`,
        `Phone: ${phone}`,
        `Child: ${child || '—'}`,
        `Grade interested in: ${grade}`,
        `Email: ${email || '—'}`,
        '',
        'Submitted from theaarkinternational.com',
      ].join('\n'),
    });

    if (email) {
      await mailer.sendMail({
        from: `"AARK International School" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'We received your request — AARK International School',
        text: [
          `Dear ${name},`,
          '',
          `Thank you for reaching out to AARK International School. We've received your ${enquiryType.toLowerCase()} for ${grade}, and our admissions team will contact you shortly at ${phone}.`,
          '',
          'If you need immediate assistance, call us at +91 99091 15550.',
          '',
          'Warm regards,',
          'AARK International School',
          'Nr. Shyam Icon, Bhayli-Sevasi Ring Road, Sevasi, Vadodara – 391101',
        ].join('\n'),
        html: `<p>Dear ${escapeHtml(name)},</p><p>Thank you for reaching out to AARK International School. We've received your ${escapeHtml(enquiryType.toLowerCase())} for <strong>${escapeHtml(grade)}</strong>, and our admissions team will contact you shortly at ${escapeHtml(phone)}.</p><p>If you need immediate assistance, call us at <a href="tel:+919909115550">+91 99091 15550</a>.</p><p>Warm regards,<br>AARK International School<br>Nr. Shyam Icon, Bhayli-Sevasi Ring Road, Sevasi, Vadodara – 391101</p>`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Enquiry submission failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not send the enquiry email.' });
  }
};
