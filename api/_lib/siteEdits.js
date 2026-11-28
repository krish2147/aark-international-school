// Website edits made in the admin's click-to-edit mode.
//
// The pages themselves stay as static HTML; an edit records what to change on
// one element, found again on the page by its position (path) and a fingerprint
// of what it originally said or showed (fp). The public script
// assets/js/site-edits.js applies them. Everything here is checked again on
// the way in, so a forged request can only ever store plain formatted text,
// safe links and photos from this site's own storage.

const { isBlobImageUrl } = require('./contentSchema');

const DEFAULT_SITE = { pages: {} };
const MAX_EDITS_PER_PAGE = 600;
const MAX_HTML = 6000;

// "index", "about", "campus-detail?area=robotics", or "_global" (header and footer).
const PAGE_KEY = /^(?:_global|[a-z0-9][a-z0-9-]{0,40}(?:\?area=[a-z]{1,20})?)$/;
// "<root>:<path>", where root is main, header or footer and path is child indexes.
const EDIT_KEY = /^(main|header|footer):\d{1,3}(?:\/\d{1,3}){0,40}$/;
const TAG = /^[A-Z][A-Z0-9]{0,9}$/;
const FP = /^[a-z0-9]{1,16}$/;

const INLINE_TAGS = new Set(['b', 'strong', 'i', 'em', 'br', 'a', 'span', 'small', 'sup', 'sub', 'u']);

// Links an editor may set: a page on this site (optionally with ?query or #anchor),
// an in-page #anchor, https://, tel: or mailto:.
function isSafeHref(value) {
  const v = String(value || '').trim();
  if (!v || v.length > 500) return false;
  if (/^#[\w-]{1,60}$/.test(v)) return true;
  if (/^[a-z0-9][a-z0-9\-/]*\.html(\?[\w=&-]{1,80})?(#[\w-]{1,60})?$/i.test(v)) return true;
  if (/^tel:\+?[0-9 ()-]{3,20}$/.test(v)) return true;
  if (/^mailto:[^\s"'<>]{3,200}$/i.test(v)) return true;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

// A photo is either the site's own original (assets/...) or one uploaded through
// the admin (Vercel Blob). Nothing else, so nobody can hot-link outside images.
function isSafeImageSrc(value) {
  const v = String(value || '');
  return /^assets\/[a-z0-9\-/_.]{1,200}\.(?:webp|jpe?g|png|avif)$/i.test(v) || isBlobImageUrl(v);
}

const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decodeAttr = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Keeps only simple inline formatting. Every tag outside INLINE_TAGS is dropped
// (its text stays); attributes are dropped except a safe href, a class name,
// aria-hidden and a new-tab target; any stray "<" or ">" in the text is escaped.
function sanitizeHtml(input) {
  const html = String(input || '').slice(0, MAX_HTML);
  const out = [];
  const open = [];
  for (const part of html.split(/(<[^<>]*>)/)) {
    if (!part) continue;
    const tag = /^<(\/?)([a-z][a-z0-9]*)\b([^>]*)>$/i.exec(part);
    if (!tag) {
      if (part.startsWith('<')) continue; // comments, doctype, broken tags
      out.push(part.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }
    const [, closing, rawName, attrs] = tag;
    const name = rawName.toLowerCase();
    if (!INLINE_TAGS.has(name)) continue;
    if (name === 'br') { out.push('<br>'); continue; }
    if (closing) {
      const idx = open.lastIndexOf(name);
      if (idx === -1) continue;
      while (open.length > idx) out.push(`</${open.pop()}>`);
      continue;
    }
    // Styling hooks the page already uses are kept: class, aria-hidden, and a
    // new-tab target (always with rel="noopener").
    const attr = n => { const m = new RegExp(`\\b${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(attrs); return m ? decodeAttr(m[1] ?? m[2]).trim() : ''; };
    let kept = '';
    const cls = attr('class');
    if (/^[\w -]{1,120}$/.test(cls)) kept += ` class="${escapeAttr(cls)}"`;
    if (/^(true|false)$/.test(attr('aria-hidden'))) kept += ` aria-hidden="${attr('aria-hidden')}"`;
    if (name === 'a') {
      const href = attr('href');
      if (isSafeHref(href)) kept = ` href="${escapeAttr(href)}"` + kept;
      if (attr('target') === '_blank') kept += ' target="_blank" rel="noopener"';
    }
    out.push(`<${name}${kept}>`);
    open.push(name);
  }
  while (open.length) out.push(`</${open.pop()}>`);
  return out.join('').trim();
}

const cleanText = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

// One edit record → a cleaned copy, or null if it is not acceptable.
function sanitizeEdit(key, rec) {
  if (!EDIT_KEY.test(key) || !rec || typeof rec !== 'object') return null;
  const tag = String(rec.tag || '');
  const fp = String(rec.fp || '');
  if (!TAG.test(tag) || !FP.test(fp)) return null;
  const out = { tag, fp };
  if (rec.html !== undefined) out.html = sanitizeHtml(rec.html);
  if (rec.href !== undefined) {
    if (!isSafeHref(rec.href)) return null;
    out.href = String(rec.href).trim();
  }
  if (rec.src !== undefined) {
    if (tag !== 'IMG' || !isSafeImageSrc(rec.src)) return null;
    out.src = String(rec.src);
  }
  if (rec.alt !== undefined) out.alt = cleanText(rec.alt, 300);
  if (rec.label !== undefined) out.label = cleanText(rec.label, 140);
  if (out.html === undefined && out.href === undefined && out.src === undefined && out.alt === undefined) return null;
  return out;
}

// Validates a whole page's edits. Returns { edits } or { error }.
function sanitizePageEdits(page, edits) {
  if (!PAGE_KEY.test(String(page || ''))) return { error: 'Unknown page.' };
  if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return { error: 'Edits are missing.' };
  const keys = Object.keys(edits);
  if (keys.length > MAX_EDITS_PER_PAGE) return { error: 'Too many changes on one page.' };
  const clean = {};
  for (const key of keys) {
    const rec = sanitizeEdit(key, edits[key]);
    if (!rec) return { error: 'One of the changes could not be saved (an unsupported link or photo).' };
    if (page === '_global' ? key.startsWith('main:') : !key.startsWith('main:')) {
      return { error: 'Header and footer changes belong to the whole site.' };
    }
    clean[key] = rec;
  }
  return { edits: clean };
}

module.exports = { DEFAULT_SITE, sanitizeHtml, sanitizeEdit, sanitizePageEdits, isSafeHref, isSafeImageSrc, PAGE_KEY };
