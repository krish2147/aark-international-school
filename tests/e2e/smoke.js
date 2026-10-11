#!/usr/bin/env node
/*
  Browser smoke test for the static site (no network writes, no production calls).
  Serves the repo locally, stubs every /api/* request, and checks each public page
  at 375 / 768 / 1024 / 1440 px.

  Run:  node tests/e2e/smoke.js            (SMOKE_BLOCK_FONTS=1 to test fallback fonts)
  Needs the `playwright` package (resolved locally, or via PLAYWRIGHT_MODULE) and a
  Chromium build (CHROMIUM_PATH, defaulting to Playwright's own).
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PAGES = ['admin.html', 'index.html', 'about.html', 'admissions.html', 'curriculum.html', 'campus-detail.html',
  'student-life.html', 'careers.html', 'staff.html', 'gallery.html', 'transport.html', 'disclosures.html',
  'circulars.html', 'policies.html', '404.html'];
const WIDTHS = [375, 768, 1024, 1440];
const BANNED_CLAIMS = [/\b12\+/, /1:15/, /founding philosophy/i, /name to be added with permission/i];
const PLACEHOLDER_PAGES = ['staff.html', 'gallery.html', 'transport.html'];

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch {} }
  throw new Error('playwright not found — set PLAYWRIGHT_MODULE');
}

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
// Apply vercel.json's global headers (including the CSP) so the local run enforces them too.
const VERCEL_HEADERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers
  .filter(h => h.source === '/(.*)').flatMap(h => h.headers);

function serve() {
  const server = http.createServer((req, res) => {
    for (const h of VERCEL_HEADERS) res.setHeader(h.key, h.value);
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

(async () => {
  const { chromium } = loadPlaywright();
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const failures = [];
  const fail = (msg) => failures.push(msg);
  const warnings = new Set();
  const ids = {};

  for (const page of PAGES) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      // Third-party media is irrelevant to these checks and slow/flaky offline.
      await p.route(/images\.unsplash\.com|maps\.google|google\.com\/maps/, r => r.abort());
      // SMOKE_BLOCK_FONTS=1 checks the worst case: layout with fallback fonts only.
      if (process.env.SMOKE_BLOCK_FONTS) await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      await p.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"items":[]}' }));
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(() => document.addEventListener('securitypolicyviolation', e => (window.__csp = window.__csp || []).push(`${e.violatedDirective} ${e.blockedURI}`)));
      await p.goto(base + page, { waitUntil: 'load' });
      // Layout checks are only meaningful with the real web font (a fallback font is wider).
      const fontOk = await p.evaluate(() => document.fonts.load('600 14px "Work Sans"').then(f => f.length > 0).catch(() => false));
      if (!fontOk) warnings.add('Work Sans did not load on some runs — nav measured with the Arial-metric fallback');
      const m = await p.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        ids: [...document.querySelectorAll('[id]')].map(e => e.id),
        hrefs: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
        text: document.body.innerText,
        csp: window.__csp || [],
        navLinks: [...document.querySelectorAll('.site-header a, #mobile-menu a')].map(a => a.getAttribute('href')),
        pill: (() => { const a = document.querySelector('.apply-pill'); return a ? getComputedStyle(a).backgroundColor : null; })(),
        navOverlap: (() => {
          const cta = document.querySelector('.header-cta'); const links = [...document.querySelectorAll('.desktop-nav > a, .desktop-nav .nav-drop-button')];
          if (!cta || getComputedStyle(cta).display === 'none') return 0;
          const c = cta.getBoundingClientRect();
          return links.filter(l => { const r = l.getBoundingClientRect(); return r.width && r.right > c.left - 4 && r.left < c.right; }).length;
        })(),
      }));
      ids[page] = new Set(m.ids);
      if (m.csp.length) fail(`${page}@${width}: CSP violations ${[...new Set(m.csp)].join(' | ')}`);
      if (errors.length) fail(`${page}@${width}: JS errors ${errors.join(' | ')}`);
      if (m.overflow > 0) fail(`${page}@${width}: horizontal overflow ${m.overflow}px`);
      if (m.navOverlap) fail(`${page}@${width}: ${m.navOverlap} nav item(s) overlap the header CTA`);
      if (m.pill && /rgba\(0, 0, 0, 0\)|transparent/.test(m.pill)) fail(`${page}@${width}: Apply Now pill has transparent background`);
      for (const re of BANNED_CLAIMS) if (re.test(m.text)) fail(`${page}@${width}: unverified claim ${re}`);
      for (const ph of PLACEHOLDER_PAGES) if (m.navLinks.includes(ph)) fail(`${page}@${width}: nav links to placeholder page ${ph}`);
      if (width === 1440) ids[page].hrefs = m.hrefs;
      await ctx.close();
    }
  }

  // Every in-site fragment link must land on an id that exists on its target page.
  for (const page of PAGES) {
    for (const href of ids[page].hrefs || []) {
      if (/^(https?:|mailto:|tel:)/.test(href) || !href.includes('#')) continue;
      const [file, frag] = href.split('#');
      const target = (file || page).split('?')[0];
      if (!frag || frag === 'top') continue;
      if (!ids[target]) { fail(`${page}: link to unknown page ${href}`); continue; }
      if (!ids[target].has(frag)) fail(`${page}: broken anchor ${href}`);
    }
  }

  // Enquiry failure path: the parent must be given a working phone and email link.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.route(/images\.unsplash\.com|maps\.google|google\.com\/maps/, r => r.abort());
    await p.route('**/api/enquiry', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"Server email is not configured."}' }));
    await p.route('**/api/content/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"items":[]}' }));
    await p.goto(base + 'index.html');
    const form = p.locator('form[data-school-form="visit"]');
    await form.locator('[name=name]').fill('Smoke Test');
    await form.locator('[name=phone]').fill('9000000000');
    await form.locator('[name=grade]').selectOption({ index: 1 });
    await form.locator('button[type=submit]').click();
    await p.waitForFunction(() => document.querySelector('form[data-school-form="visit"] .form-status')?.classList.contains('is-error'));
    const links = await form.locator('.form-status a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    if (!links.includes('tel:+919909115550') || !links.includes('mailto:info@theaarkinternational.com')) fail(`enquiry error state lacks phone/email links: ${links}`);
    await ctx.close();
  }

  // Success path: payload carries a UUID requestId, which rotates after a successful send.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.route(/images\.unsplash\.com|maps\.google|google\.com\/maps|fonts\./, r => r.abort());
    await p.route('**/api/content/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"items":[]}' }));
    await p.route('**/api/public-config', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"turnstileSiteKey":null}' }));
    const payloads = [];
    await p.route('**/api/enquiry', r => { payloads.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"confirmationSent":false}' }); });
    await p.goto(base + 'admissions.html');
    const form = p.locator('form[data-school-form="admission"]');
    for (let i = 0; i < 2; i++) {
      await form.locator('[name=name]').fill('Smoke Test');
      await form.locator('[name=phone]').fill('9000000000');
      await form.locator('[name=grade]').fill('Grade 4');
      await form.locator('button[type=submit]').click();
      await p.waitForFunction(() => document.querySelector('form[data-school-form="admission"] .form-status')?.classList.contains('is-success'));
    }
    const uuid = /^[0-9a-f-]{36}$/;
    if (payloads.length !== 2 || !payloads.every(x => uuid.test(x.requestId))) fail(`enquiry payloads lack requestId: ${JSON.stringify(payloads)}`);
    else if (payloads[0].requestId === payloads[1].requestId) fail('requestId did not rotate after a successful submission');
    if (payloads[0] && payloads[0].type !== 'admission') fail('admissions form sent the wrong enquiry type');
    await ctx.close();
  }

  // Placeholder pages stay out of search until real content exists.
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const ph of PLACEHOLDER_PAGES) {
    if (sitemap.includes(ph)) fail(`sitemap still lists ${ph}`);
    if (!/name="robots" content="noindex"/.test(fs.readFileSync(path.join(ROOT, ph), 'utf8'))) fail(`${ph} missing noindex`);
  }

  await browser.close();
  server.close();
  for (const w of warnings) console.warn('WARN: ' + w);
  if (failures.length) { console.error(`FAIL (${failures.length})\n- ` + failures.join('\n- ')); process.exit(1); }
  console.log(`PASS: ${PAGES.length} pages × ${WIDTHS.length} widths, anchors, claims, nav, sitemap, enquiry fallback`);
})().catch(e => { console.error(e); process.exit(1); });
