const test = require('node:test');
const assert = require('node:assert/strict');
const { createContentStore, StorageError, ConflictError, DEFAULT_DB } = require('../../api/_lib/contentStore');
const { createContentHandler } = require('../../api/_lib/contentResource');
const { createFakeBlob, createReq, createRes, sameOrigin, fakeAuth, silentLogger } = require('./helpers');

const setup = () => {
  const fake = createFakeBlob();
  return { ...fake, store: createContentStore({ blob: fake.blob, fetchImpl: fake.fetchImpl, token: 'test-token' }) };
};
const puts = blob => blob.calls.filter(c => c[0] === 'put');

test('an empty store reads as the default database at version 0', async () => {
  const { store } = setup();
  assert.deepEqual(await store.read(), { db: DEFAULT_DB, version: 0 });
});

test('the pre-versioning content/db.json is read as version 0 and never modified', async () => {
  const { blob, store } = setup();
  const legacy = JSON.stringify({ staff: [{ id: 'a', name: 'Existing' }] });
  await blob.put('content/db.json', legacy, { access: 'public' });
  const { db, version } = await store.read();
  assert.equal(version, 0);
  assert.equal(db.staff[0].name, 'Existing');

  db.staff.push({ id: 'b', name: 'New' });
  assert.equal(await store.write(db, version), 1);
  assert.equal(blob.files.get('content/db.json').body, legacy, 'legacy file untouched');
  assert.equal((await store.read()).db.staff.length, 2);
});

test('a failed list is an error, never an empty database', async () => {
  const { blob, store } = setup();
  blob.fail.list = new Error('blob outage');
  await assert.rejects(store.read(), StorageError);
});

test('a failed fetch of the latest version is an error, never an empty database', async () => {
  const { blob, store } = setup();
  await store.write({ ...DEFAULT_DB, fees: [{ id: 'f' }] }, 0);
  blob.fail.fetch = new Error('network');
  await assert.rejects(store.read(), StorageError);
});

test('two saves from the same version: the second is refused, the first survives', async () => {
  const { store } = setup();
  const { db, version } = await store.read();
  await store.write({ ...db, staff: [{ id: '1', name: 'First editor' }] }, version);
  await assert.rejects(store.write({ ...db, staff: [{ id: '2', name: 'Second editor' }] }, version), ConflictError);
  assert.equal((await store.read()).db.staff[0].name, 'First editor');
});

test('restore copies an old version forward and keeps every version', async () => {
  const { store } = setup();
  await store.write({ ...DEFAULT_DB, fees: [{ id: 'v1' }] }, 0);
  await store.write({ ...DEFAULT_DB, fees: [{ id: 'v2' }] }, 1);
  assert.equal(await store.restore(1), 3);
  const { db, version } = await store.read();
  assert.equal(version, 3);
  assert.deepEqual(db.fees, [{ id: 'v1' }]);
  assert.deepEqual((await store.listVersions()).map(v => v.seq), [1, 2, 3]);
  assert.equal(await store.restore(99), null);
});

test('restore of version 0 brings back the legacy file', async () => {
  const { blob, store } = setup();
  await blob.put('content/db.json', JSON.stringify({ fees: [{ id: 'legacy' }] }), { access: 'public' });
  await store.write({ ...DEFAULT_DB }, 0);
  await store.restore(0);
  assert.deepEqual((await store.read()).db.fees, [{ id: 'legacy' }]);
});

test('listing pages through more than 1000 versions', async () => {
  const { blob, store } = setup();
  for (let i = 1; i <= 1003; i++) blob.files.set(`content/versions/${String(i).padStart(6, '0')}.json`, { body: `{"fees":[{"id":"${i}"}]}`, etag: 'x', uploadedAt: new Date() });
  const { db, version } = await store.read();
  assert.equal(version, 1003);
  assert.equal(db.fees[0].id, '1003');
});

// ---- HTTP handler ----

const handler = (store, extra = {}) => createContentHandler({ store, auth: fakeAuth, logger: silentLogger, uuid: () => 'id-1', now: () => new Date('2026-10-10T00:00:00Z'), ...extra });

test('public GET is CDN-cacheable; an admin ?fresh=1 read is not', async () => {
  const { store } = setup();
  const res = createRes();
  await handler(store)(createReq({ query: { resource: 'staff' } }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['cache-control'], /s-maxage=60/);

  const res2 = createRes();
  await handler(store)(createReq({ query: { resource: 'staff', fresh: '1' }, cookieAdmin: true }), res2);
  assert.match(res2.headers['cache-control'], /no-store/);
});

test('unknown resources are 404', async () => {
  const { store } = setup();
  const res = createRes();
  await handler(store)(createReq({ query: { resource: 'secrets' } }), res);
  assert.equal(res.statusCode, 404);
});

test('writes need an admin session and a same-origin request', async () => {
  const { blob, store } = setup();
  const body = { name: 'A', role: 'Teacher' };
  const anon = createRes();
  await handler(store)(createReq({ method: 'POST', query: { resource: 'staff' }, body, headers: sameOrigin }), anon);
  assert.equal(anon.statusCode, 401);
  const cross = createRes();
  await handler(store)(createReq({ method: 'POST', query: { resource: 'staff' }, body, cookieAdmin: true, headers: { origin: 'https://evil.example' } }), cross);
  assert.equal(cross.statusCode, 403);
  assert.equal(puts(blob).length, 0);
});

test('a storage outage during a save returns 503 and writes nothing', async () => {
  const { blob, store } = setup();
  await blob.put('content/db.json', JSON.stringify({ staff: [{ id: 'keep', name: 'Keep me' }] }), { access: 'public' });
  const before = puts(blob).length;
  blob.fail.list = new Error('outage');
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const res = createRes();
    await handler(store)(createReq({ method, query: { resource: 'staff', id: 'keep' }, body: { id: 'keep', name: 'X', role: 'Y' }, cookieAdmin: true, headers: sameOrigin }), res);
    assert.equal(res.statusCode, 503, method);
  }
  assert.equal(puts(blob).length, before, 'no write after a failed read');
  assert.match(blob.files.get('content/db.json').body, /Keep me/);
});

test('only allowed fields are stored and photo URLs must be uploaded blobs', async () => {
  const { store } = setup();
  const res = createRes();
  await handler(store)(createReq({ method: 'POST', query: { resource: 'staff' }, cookieAdmin: true, headers: sameOrigin,
    body: { name: '  Dr.  Example ', role: 'Principal', isAdmin: true, id: 'forced', createdAt: 'x', photoUrl: 'https://abc.public.blob.vercel-storage.com/uploads/p.jpg' } }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(Object.keys(res.body.item).sort(), ['createdAt', 'id', 'name', 'photoUrl', 'role']);
  assert.equal(res.body.item.id, 'id-1');
  assert.equal(res.body.item.name, 'Dr. Example');

  const bad = createRes();
  await handler(store)(createReq({ method: 'POST', query: { resource: 'staff' }, cookieAdmin: true, headers: sameOrigin,
    body: { name: 'A', role: 'B', photoUrl: 'javascript:alert(1)' } }), bad);
  assert.equal(bad.statusCode, 400);
});

test('popup links must be a site page or https', async () => {
  const { store } = setup();
  for (const [link, code] of [['admissions.html#fees', 200], ['https://aarkintschool-forms.zeroq.net', 200], ['javascript:alert(1)', 400], ['data:text/html,x', 400]]) {
    const res = createRes();
    await handler(store)(createReq({ method: 'POST', query: { resource: 'events' }, cookieAdmin: true, headers: sameOrigin, body: { title: 'T', message: 'M', link } }), res);
    assert.equal(res.statusCode, code, link);
  }
});

test('a concurrent edit is reported as 409, not saved over', async () => {
  const { store } = setup();
  const racing = { ...store, async read() { const r = await store.read(); await store.write({ ...r.db, fees: [{ id: 'other' }] }, r.version); return r; } };
  const res = createRes();
  await handler(racing)(createReq({ method: 'POST', query: { resource: 'fees' }, cookieAdmin: true, headers: sameOrigin, body: { className: 'Nursery', amount: '₹45,000' } }), res);
  assert.equal(res.statusCode, 409);
  assert.deepEqual((await store.read()).db.fees, [{ id: 'other' }]);
});

test('PUT updates allowed fields only and DELETE removes the item', async () => {
  const { store } = setup();
  await store.write({ ...DEFAULT_DB, fees: [{ id: 'f1', className: 'Nursery', amount: '₹1' }] }, 0);
  const put = createRes();
  await handler(store)(createReq({ method: 'PUT', query: { resource: 'fees' }, cookieAdmin: true, headers: sameOrigin, body: { id: 'f1', amount: '₹45,000', evil: 1 } }), put);
  assert.equal(put.statusCode, 200);
  assert.equal(put.body.item.amount, '₹45,000');
  assert.equal(put.body.item.evil, undefined);
  const del = createRes();
  await handler(store)(createReq({ method: 'DELETE', query: { resource: 'fees', id: 'f1' }, cookieAdmin: true, headers: sameOrigin }), del);
  assert.equal(del.statusCode, 200);
  assert.deepEqual((await store.read()).db.fees, []);
});
