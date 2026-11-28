// Validation + normalisation for public enquiry submissions.

const TYPES = { visit: 'Campus Visit Request', admission: 'Admissions Enquiry', career: 'Job Application' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@()<>,;:"[\]\\]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

// Single line, no control characters (keeps CR/LF out of email headers).
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Indian numbers become +91XXXXXXXXXX; other international numbers keep their +.
function normalisePhone(raw) {
  const s = clean(raw, 40);
  const plus = s.startsWith('+');
  let digits = s.replace(/\D/g, '');
  if (!plus && digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!plus && digits.length === 10) return `+91${digits}`;
  if (!plus && digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (plus && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

// Returns { value } or { error } (a message safe to show the parent).
function validateEnquiry(body) {
  const type = TYPES[body.type] ? body.type : 'admission';
  const name = clean(body.name, 100);
  const phone = normalisePhone(body.phone);
  const child = clean(body.child, 100);
  const grade = clean(body.grade, 60);
  const email = clean(body.email, 200).toLowerCase();
  // Job applications: "grade" carries the role applied for, "child" stays empty,
  // and the applicant's experience note goes in "message".
  const message = type === 'career' ? String(body.message == null ? '' : body.message).replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1500) : '';
  const requestId = UUID_RE.test(String(body.requestId || '')) ? String(body.requestId).toLowerCase() : null;

  if (type === 'career') {
    if (!name || !body.phone || !grade) return { error: 'Please enter your name, phone number and the role you are applying for.' };
    if (!email) return { error: 'Please enter your email address so HR can reply to you.' };
  }
  if (!name || !body.phone || !grade) return { error: 'Please enter your name, phone number and the grade you are interested in.' };
  if (!phone) return { error: 'Please enter a valid phone number, for example 98765 43210.' };
  if (email && !EMAIL_RE.test(email)) return { error: 'That email address looks incorrect. Please check it, or leave it blank.' };

  return { value: { type, typeLabel: TYPES[type], name, phone, child: type === 'career' ? '' : child, grade, email, message, requestId } };
}

module.exports = { validateEnquiry, normalisePhone, TYPES };
