// Best-effort email sending. If SMTP env vars aren't set, this quietly does
// nothing rather than failing the request — form submissions still succeed
// and get saved to the database either way.

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

async function sendMail({ to, subject, html }) {
  if (!nodemailer || !isConfigured()) {
    console.log(`[mail] SMTP not configured — skipping email "${subject}" to ${to}`);
    return { sent: false };
  }
  try {
    const transport = getTransport();
    await transport.sendMail({
      from: process.env.NOTIFY_EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { sent: false, error: err.message };
  }
}

async function sendInquiryEmails({ parentName, email, grade, message }) {
  const adminTo = process.env.NOTIFY_EMAIL_TO;
  const safeName = escapeHtml(parentName);
  const safeEmail = escapeHtml(email);
  const safeGrade = escapeHtml(grade);
  const safeMessage = escapeHtml(message || '(no message)').replace(/\n/g, '<br>');
  await Promise.all([
    sendMail({
      to: email,
      subject: 'We received your enquiry — AARK INTERNATIONAL SCHOOL',
      html: `<p>Hi ${safeName},</p><p>Thanks for reaching out to AARK INTERNATIONAL SCHOOL${safeGrade ? ` about ${safeGrade}` : ''}. An admissions coordinator will contact you shortly.</p><p>&mdash; AARK International Admissions</p>`,
    }),
    adminTo ? sendMail({
      to: adminTo,
      subject: `New enquiry: ${String(parentName).slice(0, 120)}`,
      html: `<p><b>${safeName}</b> (${safeEmail})${safeGrade ? ` — interested in ${safeGrade}` : ''}</p><p>${safeMessage}</p>`,
    }) : Promise.resolve(),
  ]);
}

async function sendVisitEmails({ parentName, studentName, email, visitDate, timeSlot }) {
  const adminTo = process.env.NOTIFY_EMAIL_TO;
  const dateStr = new Date(visitDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const safeName = escapeHtml(parentName);
  const safeStudent = escapeHtml(studentName);
  const safeEmail = escapeHtml(email);
  const safeTime = escapeHtml(timeSlot);
  await Promise.all([
    sendMail({
      to: email,
      subject: 'Your campus visit is requested — AARK INTERNATIONAL SCHOOL',
      html: `<p>Hi ${safeName},</p><p>We've received your visit request for <b>${safeStudent}</b> on <b>${dateStr}</b>, ${safeTime}. Our admissions office will contact you to confirm.</p><p>&mdash; AARK International Admissions</p>`,
    }),
    adminTo ? sendMail({
      to: adminTo,
      subject: `New visit request: ${parentName} — ${dateStr}`,
      html: `<p><b>${safeName}</b> (${safeEmail}) requested a visit for <b>${safeStudent}</b> on ${dateStr}, ${safeTime}.</p>`,
    }) : Promise.resolve(),
  ]);
}

module.exports = { sendMail, sendInquiryEmails, sendVisitEmails, isConfigured };
