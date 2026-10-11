const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { createAdminEnquiriesHandler, toCsv } = require('../../api/admin/enquiries');
const { createLoginHandler, LIMITS } = require('../../api/admin/login');
const { createUploadHandler } = require('../../api/admin/upload');
const { createHistoryHandler } = require('../../api/admin/content-history');
const { createContentStore } = require('../../api/_lib/contentStore');
const { createEnquiryStore } = require('../../api/_lib/enquiryStore');
const { createRateLimiter } = require('../../api/_lib/rateLimit');
const auth = require('../../api/_lib/auth');
const { createFakeBlob, createReq, createRes, sameOrigin, fakeAuth, silentLogger, memoryLimiter } = require('./helpers');

test('CSV export neutralises spreadsheet formulas and quotes every cell', () => {
  const csv = toCsv([{ receivedAt: '2026-10-10', type: 'visit', name: '=HYPERLINK("http://evil")', phone: '+919876543210', email: '', child: '@x', grade: '-1', status: 'new', notification: { status: 'sent' }, duplicate: false, id: 'id' }]);
  const row = csv.split('\r\n')[1];
  assert.match(row, /"'=HYPERLINK\(""http:\/\/evil""\)"/);
  assert.match(row, /"'\+919876543210"/);
  assert.match(row, /"'@x"/);
  assert.match(row, /"'-1"/);
});

test('enquiry admin endpoints require a session', async () => {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: { BLOB_ENQUIRY_READ_WRITE_TOKEN: 't' } });
  const h = createAdminEnquiriesHandler({ store, service: {}, auth: fakeAuth, logger: silentLogger });
  for (const method of ['GET', 'POST']) {
    const res = createRes();
    await h(createReq({ method, headers: sameOrigin, body: {} }), res);
    assert.equal(res.statusCode, 401, method);
  }
});

test('enquiry admin lists a month, exports CSV and updates status', async () => {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: { BLOB_ENQUIRY_READ_WRITE_TOKEN: 't' } });
  const id = crypto.randomUUID();
  await store.create({ id, receivedAt: '2026-10-05T10:00:00.000Z', type: 'visit', name: 'P', phone: '+919876543210', grade: 'G1', status: 'new', notification: { status: 'sent' } });
  const h = createAdminEnquiriesHandler({ store, service: {}, auth: fakeAuth, logger: silentLogger });

  const list = createRes();
  await h(createReq({ query: { month: '2026-10' }, cookieAdmin: true }), list);
  assert.equal(list.body.items.length, 1);
  assert.match(list.headers['cache-control'], /no-store/);

  const csv = createRes();
  await h(createReq({ query: { month: '2026-10', format: 'csv' }, cookieAdmin: true }), csv);
  assert.match(csv.headers['content-type'], /text\/csv/);
  assert.match(csv.body, /receivedAt,type,name/);

  const bad = createRes();
  await h(createReq({ query: { month: '2026-13' }, cookieAdmin: true }), bad);
  assert.equal(bad.statusCode, 400);

  const upd = createRes();
  await h(createReq({ method: 'POST', cookieAdmin: true, headers: sameOrigin, body: { action: 'status', id, month: '2026-10', status: 'contacted' } }), upd);
  assert.equal(upd.statusCode, 200);
  assert.equal((await store.get(id, '2026-10')).record.status, 'contacted');

  const cross = createRes();
  await h(createReq({ method: 'POST', cookieAdmin: true, headers: { origin: 'https://evil.example' }, body: { action: 'status', id, month: '2026-10', status: 'closed' } }), cross);
  assert.equal(cross.statusCode, 403);
});

test('enquiry status updates are ETag-guarded against concurrent changes', async () => {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: { BLOB_ENQUIRY_READ_WRITE_TOKEN: 't' } });
  const rec = { id: crypto.randomUUID(), receivedAt: '2026-10-05T10:00:00.000Z', status: 'new' };
  const { etag } = await store.create(rec);
  await store.update({ ...rec, status: 'contacted' }, etag);
  await assert.rejects(store.update({ ...rec, status: 'closed' }, etag), { name: 'BlobPreconditionFailedError' });
});

test('login: wrong password is 401, cross-site is 403, and attempts are rate limited', async () => {
  const env = { ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'correct horse', ADMIN_SESSION_SECRET: 's'.repeat(64) };
  const limiter = memoryLimiter();
  const h = createLoginHandler({ limiter, env, logger: silentLogger });

  const cross = createRes();
  await h(createReq({ method: 'POST', headers: { origin: 'https://evil.example' }, body: { username: 'admin', password: 'correct horse' } }), cross);
  assert.equal(cross.statusCode, 403);

  const wrong = createRes();
  await h(createReq({ method: 'POST', headers: sameOrigin, body: { username: 'admin', password: 'nope' } }), wrong);
  assert.equal(wrong.statusCode, 401);

  for (let i = 1; i < LIMITS.perIp[0]; i++) await h(createReq({ method: 'POST', headers: sameOrigin, body: { username: 'admin', password: 'nope' } }), createRes());
  const locked = createRes();
  await h(createReq({ method: 'POST', headers: sameOrigin, body: { username: 'admin', password: 'correct horse' } }), locked);
  assert.equal(locked.statusCode, 429, 'even the right password is refused while locked out');
});

test('login: correct credentials set an HttpOnly SameSite=Strict session cookie', async () => {
  process.env.ADMIN_SESSION_SECRET = 's'.repeat(64);
  const env = { ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'correct horse', ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET };
  const h = createLoginHandler({ limiter: memoryLimiter(), env, logger: silentLogger });
  const res = createRes();
  await h(createReq({ method: 'POST', headers: sameOrigin, body: { username: 'admin', password: 'correct horse' } }), res);
  assert.equal(res.statusCode, 200);
  const cookie = res.headers['set-cookie'];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  const token = cookie.split(';')[0].split('=')[1];
  assert.ok(auth.requireAdmin({ headers: { cookie: `${auth.COOKIE_NAME}=${token}` } }));
  const [data] = token.split('.');
  assert.equal(auth.requireAdmin({ headers: { cookie: `${auth.COOKIE_NAME}=${data}.forged` } }), null);
});

test('uploads: raster images only, and the bytes must match the declared type', async () => {
  const stored = [];
  const h = createUploadHandler({ putImpl: async (p, b, o) => { stored.push([p, o.contentType]); return { url: `https://x.public.blob.vercel-storage.com/${p}` }; }, auth: fakeAuth, logger: silentLogger, uuid: () => 'u' });
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');
  const cases = [
    ['data:image/svg+xml;base64,' + Buffer.from('<svg onload="alert(1)"/>').toString('base64'), 400],
    ['data:image/png;base64,' + Buffer.from('<html>not a png</html>').toString('base64'), 400],
    ['data:text/html;base64,PGgxPg==', 400],
    ['data:image/png;base64,' + png, 200],
  ];
  for (const [dataUrl, code] of cases) {
    const res = createRes();
    await h(createReq({ method: 'POST', cookieAdmin: true, headers: sameOrigin, body: { filename: '../../evil.svg', dataUrl } }), res);
    assert.equal(res.statusCode, code, dataUrl.slice(0, 30));
  }
  assert.deepEqual(stored, [['uploads/u-evil.png', 'image/png']]);
});

test('content history lists versions and restores without deleting anything', async () => {
  const fake = createFakeBlob();
  const store = createContentStore({ blob: fake.blob, fetchImpl: fake.fetchImpl });
  await store.write({ fees: [{ id: 'one' }] }, 0);
  await store.write({ fees: [{ id: 'two' }] }, 1);
  const h = createHistoryHandler({ store, auth: fakeAuth, logger: silentLogger });

  const list = createRes();
  await h(createReq({ cookieAdmin: true }), list);
  assert.deepEqual(list.body.versions.map(v => v.version), [2, 1]);

  const restore = createRes();
  await h(createReq({ method: 'POST', cookieAdmin: true, headers: sameOrigin, body: { version: 1 } }), restore);
  assert.equal(restore.statusCode, 200);
  assert.deepEqual((await store.read()).db.fees, [{ id: 'one' }]);
  assert.equal((await store.listVersions()).length, 3);

  const anon = createRes();
  await h(createReq({ method: 'POST', headers: sameOrigin, body: { version: 1 } }), anon);
  assert.equal(anon.statusCode, 401);
});

test('rate limiter: shared Upstash counter, falling back to memory if Upstash fails', async () => {
  let n = 0;
  const ok = createRateLimiter({ env: { UPSTASH_REDIS_REST_URL: 'https://u.example', UPSTASH_REDIS_REST_TOKEN: 't' }, fetchImpl: async () => new Response(JSON.stringify([{ result: ++n }, { result: 1 }])), logger: silentLogger });
  assert.equal(ok.shared, true);
  assert.equal((await ok.hit('k', 2, 60)).allowed, true);
  await ok.hit('k', 2, 60);
  assert.equal((await ok.hit('k', 2, 60)).allowed, false);

  const down = createRateLimiter({ env: { UPSTASH_REDIS_REST_URL: 'https://u.example', UPSTASH_REDIS_REST_TOKEN: 't' }, fetchImpl: async () => { throw new Error('down'); }, logger: silentLogger, now: () => 1e12 });
  assert.equal((await down.hit('fallback-key', 1, 60)).allowed, true);
  assert.equal((await down.hit('fallback-key', 1, 60)).allowed, false);
});
