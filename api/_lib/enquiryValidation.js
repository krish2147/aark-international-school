// Validation + normalisation for public enquiry submissions.

const TYPES = { visit: 'Campus Visit Request', admission: 'Admissions Enquiry' };
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
  const requestId = UUID_RE.test(String(body.requestId || '')) ? String(body.requestId).toLowerCase() : null;

  if (!name || !body.phone || !grade) return { error: 'Please enter your name, phone number and the grade you are interested in.' };
  if (!phone) return { error: 'Please enter a valid phone number, for example 98765 43210.' };
  if (email && !EMAIL_RE.test(email)) return { error: 'That email address looks incorrect. Please check it, or leave it blank.' };

  return { value: { type, typeLabel: TYPES[type], name, phone, child, grade, email, requestId } };
}

module.exports = { validateEnquiry, normalisePhone, TYPES };
