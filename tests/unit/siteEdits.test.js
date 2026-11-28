const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeHtml, sanitizePageEdits, isSafeHref, DEFAULT_SITE } = require('../../api/_lib/siteEdits');
const { createSiteEditsHandler } = require('../../api/_lib/siteEditsHandler');
const { createContentStore } = require('../../api/_lib/contentStore');
const { createFakeBlob, createReq, createRes, sameOrigin, fakeAuth, silentLogger } = require('./helpers');

const BLOB_IMG = 'https://abc.public.blob.vercel-storage.com/uploads/1-photo.webp';

test('sanitizeHtml keeps simple formatting and drops everything else', () => {
  assert.equal(sanitizeHtml('Hello <b>bold</b> and <em>soft</em><br>next'), 'Hello <b>bold</b> and <em>soft</em><br>next');
  assert.equal(sanitizeHtml('<script>alert(1)</script>Hi'), 'alert(1)Hi');
  assert.equal(sanitizeHtml('<img src=x onerror=alert(1)>Hi'), 'Hi');
  assert.equal(sanitizeHtml('<b onclick="x()">Hi</b>'), '<b>Hi</b>');
  assert.equal(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assert.equal(sanitizeHtml('<a href="admissions.html#fees" title="t">Fees</a>'), '<a href="admissions.html#fees">Fees</a>');
  assert.equal(sanitizeHtml('<b>open'), '<b>open</b>');
  assert.equal(sanitizeHtml('a <!-- c --> b'), 'a  b');
  assert.equal(sanitizeHtml('5 > 3'), '5 &gt; 3');
  assert.equal(sanitizeHtml('<span class="num" style="color:red" onclick="x">1</span>'), '<span class="num">1</span>');
  assert.equal(sanitizeHtml('<a class="doc-link" href="assets/x.html" target="_blank">PDF <span aria-hidden="true">↗</span></a>'), '<a href="assets/x.html" class="doc-link" target="_blank" rel="noopener">PDF <span aria-hidden="true">↗</span></a>');
  assert.equal(sanitizeHtml('<b class="x" onload="y">z</b>'), '<b class="x">z</b>');
  assert.equal(sanitizeHtml('<b class="x;y">z</b>'), '<b>z</b>');
});

test('isSafeHref allows site pages, anchors, https, tel and mailto only', () => {
  for (const ok of ['index.html', 'campus-detail.html?area=arts', 'about.html#chairperson-message', '#visit', 'https://aarkintschool-forms.zeroq.net', 'tel:+919909115550', 'mailto:info@theaarkinternational.com']) {
    assert.equal(isSafeHref(ok), true, ok);
  }
  for (const bad of ['javascript:alert(1)', 'http://evil.example', 'data:text/html,x', '//evil.example', '']) {
    assert.equal(isSafeHref(bad), false, bad);
  }
});

test('page edits are validated: keys, photo sources and header/footer scope', () => {
  const ok = sanitizePageEdits('index', { 'main:0/2/1': { tag: 'H1', fp: 'abc123', html: 'New <i>title</i>' } });
  assert.deepEqual(ok, { edits: { 'main:0/2/1': { tag: 'H1', fp: 'abc123', html: 'New <i>title</i>' } } });
  assert.ok(sanitizePageEdits('index', { 'main:1': { tag: 'IMG', fp: 'a1', src: BLOB_IMG, alt: 'x' } }).edits);
  assert.ok(sanitizePageEdits('index', { 'main:1': { tag: 'IMG', fp: 'a1', src: 'assets/photos/home/04-reading.webp' } }).edits);
  assert.ok(sanitizePageEdits('index', { 'main:1': { tag: 'IMG', fp: 'a1', src: 'https://evil.example/x.jpg' } }).error);
  assert.ok(sanitizePageEdits('index', { 'header:0': { tag: 'A', fp: 'a1', html: 'x' } }).error, 'header edits only under _global');
  assert.ok(sanitizePageEdits('_global', { 'main:0': { tag: 'P', fp: 'a1', html: 'x' } }).error, 'main edits never under _global');
  assert.ok(sanitizePageEdits('_global', { 'footer:0/1': { tag: 'P', fp: 'a1', html: 'x' } }).edits);
  assert.ok(sanitizePageEdits('../etc', { 'main:0': { tag: 'P', fp: 'a1', html: 'x' } }).error);
  assert.ok(sanitizePageEdits('index', { 'main:0': { tag: 'P', fp: 'a1', href: 'javascript:x' } }).error);
  assert.ok(sanitizePageEdits('campus-detail?area=arts', {}).edits, 'campus area pages are their own page');
});

const setup = () => {
  const fake = createFakeBlob();
  const store = createContentStore({ blob: fake.blob, fetchImpl: fake.fetchImpl, token: 't', prefix: 'site', defaults: DEFAULT_SITE });
  return { ...fake, store, handler: createSiteEditsHandler({ store, auth: fakeAuth, logger: silentLogger }) };
};

test('publishing saves a new version; the public GET returns it; restore copies an old version forward', async () => {
  const { handler, blob } = setup();
  const pub = createRes();
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: sameOrigin, body: { baseVersion: 0, pages: { index: { 'main:0/1': { tag: 'H1', fp: 'f1', html: 'First' } } } } }), pub);
  assert.equal(pub.statusCode, 200);
  assert.equal(pub.body.version, 1);
  assert.ok(blob.files.has('site/versions/000001.json'));

  const pub2 = createRes();
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: sameOrigin, body: { baseVersion: 1, pages: { index: { 'main:0/1': { tag: 'H1', fp: 'f1', html: 'Second' } } } } }), pub2);
  assert.equal(pub2.body.version, 2);

  const get = createRes();
  await handler(createReq({ method: 'GET' }), get);
  assert.equal(get.body.pages.index['main:0/1'].html, 'Second');
  assert.match(get.headers['cache-control'], /s-maxage/);

  const restore = createRes();
  await handler(createReq({ method: 'POST', cookieAdmin: true, headers: sameOrigin, body: { restore: 1 } }), restore);
  assert.equal(restore.body.version, 3);
  const after = createRes();
  await handler(createReq({ method: 'GET' }), after);
  assert.equal(after.body.pages.index['main:0/1'].html, 'First');
});

test('a publish based on an old version is refused, and signed-out or cross-site writes are blocked', async () => {
  const { handler } = setup();
  const body = { baseVersion: 0, pages: { index: { 'main:0': { tag: 'P', fp: 'f1', html: 'x' } } } };
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: sameOrigin, body }), createRes());
  const stale = createRes();
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: sameOrigin, body }), stale);
  assert.equal(stale.statusCode, 409);

  const anon = createRes();
  await handler(createReq({ method: 'PUT', headers: sameOrigin, body: { ...body, baseVersion: 1 } }), anon);
  assert.equal(anon.statusCode, 401);
  const cross = createRes();
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: { origin: 'https://evil.example' }, body: { ...body, baseVersion: 1 } }), cross);
  assert.equal(cross.statusCode, 403);
  const hist = createRes();
  await handler(createReq({ method: 'GET', query: { history: '1' } }), hist);
  assert.equal(hist.statusCode, 401, 'history is admin-only');
});

test('publishing an empty set removes that page’s edits', async () => {
  const { handler } = setup();
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: sameOrigin, body: { baseVersion: 0, pages: { about: { 'main:0': { tag: 'P', fp: 'f1', html: 'x' } } } } }), createRes());
  await handler(createReq({ method: 'PUT', cookieAdmin: true, headers: sameOrigin, body: { baseVersion: 1, pages: { about: {} } } }), createRes());
  const get = createRes();
  await handler(createReq({ method: 'GET' }), get);
  assert.deepEqual(get.body.pages, {});
});
