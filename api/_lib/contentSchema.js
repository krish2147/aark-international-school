// Which fields each admin-managed resource may store (D15: no mass assignment).
// Anything else in a request body is dropped before it reaches storage.

const RESOURCES = {
  gallery: { text: { event: 120, date: 60, caption: 240 }, urls: ['photoUrl'], required: ['event'] },
  staff: { text: { name: 120, role: 120, bio: 600 }, urls: ['photoUrl'], required: ['name', 'role'] },
  // Site popups: an announcement of one of these kinds, with an optional photo and button.
  events: { text: { title: 160, message: 600, buttonText: 40 }, choices: { kind: ['admission', 'scheme', 'event', 'notice'] }, links: ['link'], urls: ['photoUrl'], bools: ['active'], required: ['title', 'message'] },
  schemes: { text: { title: 160, description: 800 }, bools: ['active'], required: ['title', 'description'] },
  fees: { text: { className: 80, amount: 80 }, required: ['className', 'amount'] },
};

// Uploaded photos live on Vercel Blob; nothing else is accepted as an image URL.
function isBlobImageUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && /\.public\.blob\.vercel-storage\.com$/.test(u.hostname);
  } catch {
    return false;
  }
}

// Popup links: a page on this site (e.g. "admissions.html#fees") or an https URL.
function isSafeLink(value) {
  if (/^[a-z0-9][a-z0-9\-/]*\.html(#[\w-]+)?$/i.test(value)) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// Returns { item } with only allowed, cleaned fields, or { error }.
function sanitize(resource, body, { partial = false } = {}) {
  const schema = RESOURCES[resource];
  if (!schema) return { error: 'Unknown resource.' };
  const item = {};
  for (const [key, max] of Object.entries(schema.text || {})) {
    if (body[key] === undefined) continue;
    item[key] = String(body[key]).replace(/\s+/g, ' ').trim().slice(0, max);
  }
  for (const [key, allowed] of Object.entries(schema.choices || {})) {
    if (body[key] === undefined) continue;
    if (!allowed.includes(String(body[key]))) return { error: `Unknown ${key}.` };
    item[key] = String(body[key]);
  }
  for (const key of schema.urls || []) {
    if (body[key] === undefined) continue;
    if (body[key] === '') { item[key] = ''; continue; } // photo removed
    if (!isBlobImageUrl(String(body[key]))) return { error: 'Photos must be uploaded through the admin panel.' };
    item[key] = String(body[key]);
  }
  for (const key of schema.links || []) {
    if (body[key] === undefined || body[key] === '') { if (body[key] === '') item[key] = ''; continue; }
    const link = String(body[key]).trim();
    if (!isSafeLink(link)) return { error: 'Links must be a page on this site (like admissions.html) or start with https://.' };
    item[key] = link;
  }
  for (const key of schema.bools || []) {
    if (body[key] !== undefined) item[key] = body[key] === true || body[key] === 'true';
  }
  if (!partial) {
    const missing = schema.required.filter(k => !item[k]);
    if (missing.length) return { error: `Missing required field: ${missing.join(', ')}.` };
  }
  return { item };
}

module.exports = { RESOURCES, sanitize, isBlobImageUrl, isSafeLink };
