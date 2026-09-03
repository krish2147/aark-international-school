const { appendRegistrationRow, isConfigured } = require('./_lib/sheets');
const { sendMail } = require('./_lib/mail');
const crypto = require('crypto');

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const {
      academicYear, grade, studentName, dateOfBirth, gender, previousSchool,
      currentGrade, parentName, relationship, mobile, email, address, remarks,
      consent, website,
    } = req.body || {};

    if (website) return res.status(200).json({ ok: true });
    if (!academicYear || !parentName || !studentName || !grade || !dateOfBirth || !gender ||
        !relationship || !mobile || !email || !address || !consent) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (String(mobile).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Please provide a valid mobile number.' });
    }
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime()) || birthDate >= new Date()) {
      return res.status(400).json({ error: 'Please provide a valid date of birth.' });
    }

    if (!isConfigured()) {
      // Fail clearly rather than silently pretending the registration was
      // stored somewhere. See README for the exact env vars to set.
      console.error('/api/admission-registration: Google Sheets is not configured.');
      return res.status(503).json({
        error: 'Admission registration isn\'t fully set up yet on the server (Google Sheets isn\'t connected). Please try again shortly, or contact the admissions office directly.',
      });
    }

    const reference = `AARK-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const fields = {
      reference,
      academicYear: String(academicYear).slice(0, 20),
      parentName: String(parentName).slice(0, 120),
      studentName: String(studentName).slice(0, 120),
      grade: String(grade).slice(0, 40),
      dateOfBirth: birthDate.toISOString().slice(0, 10),
      gender: String(gender).slice(0, 30),
      previousSchool: previousSchool ? String(previousSchool).slice(0, 160) : '',
      currentGrade: currentGrade ? String(currentGrade).slice(0, 40) : '',
      relationship: String(relationship).slice(0, 40),
      mobile: String(mobile).slice(0, 20),
      email: String(email).slice(0, 160),
      address: String(address).slice(0, 500),
      remarks: remarks ? String(remarks).slice(0, 2000) : '',
    };

    await appendRegistrationRow(fields);

    // Best-effort confirmation email — never blocks the response.
    sendMail({
      to: fields.email,
      subject: 'Your admission registration is received — AARK INTERNATIONAL SCHOOL',
      html: `<p>Hi ${escapeHtml(fields.parentName)},</p><p>We've received your admission registration for <b>${escapeHtml(fields.studentName)}</b> (${escapeHtml(fields.grade)}). Your reference is <b>${reference}</b>. Our admissions office will be in touch shortly.</p><p>&mdash; AARK International Admissions</p>`,
    }).catch(() => {});

    return res.status(201).json({ ok: true, reference });
  } catch (err) {
    console.error('/api/admission-registration error:', err.message);
    if (err.code === 'SHEETS_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Admission registration storage is not configured yet. Please contact the admissions office directly.' });
    }
    return res.status(502).json({ error: 'We could not reach the registration system just now. Please try again in a moment, or contact the admissions office directly.' });
  }
};
