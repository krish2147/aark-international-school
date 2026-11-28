const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { sanitize } = require('../../api/_lib/contentSchema');
const { createEnquiryStore } = require('../../api/_lib/enquiryStore');
const { createAdminEnquiriesHandler } = require('../../api/admin/enquiries');
const { createFakeBlob, createReq, createRes, silentLogger, fakeAuth } = require('./helpers');

test('popups accept a type, button text and photo; unknown types and outside photos are refused', () => {
  const photo = 'https://abc.public.blob.vercel-storage.com/uploads/x.webp';
  const { item } = sanitize('events', { title: 'Admissions open', message: 'Apply now', kind: 'admission', buttonText: 'Apply now', link: 'admissions.html', photoUrl: photo, active: 'true', signup: true, extra: 'dropped' });
  assert.deepEqual(item, { title: 'Admissions open', message: 'Apply now', buttonText: 'Apply now', kind: 'admission', photoUrl: photo, link: 'admissions.html', active: true });
  assert.ok(sanitize('events', { title: 't', message: 'm', kind: 'script' }).error);
  assert.ok(sanitize('events', { title: 't', message: 'm', photoUrl: 'https://evil.example/x.jpg' }).error);
  assert.equal(sanitize('events', { photoUrl: '' }, { partial: true }).item.photoUrl, '', 'an empty photo removes it');
});

test('admin can list and export one kind of enquiry', async () => {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: { BLOB_ENQUIRY_READ_WRITE_TOKEN: 't' } });
  await store.create({ id: crypto.randomUUID(), receivedAt: '2026-11-05T10:00:00.000Z', type: 'visit', name: 'V', phone: '+919876543210', grade: 'G1', status: 'new', notification: { status: 'sent' } });
  await store.create({ id: crypto.randomUUID(), receivedAt: '2026-11-06T10:00:00.000Z', type: 'career', name: 'C', phone: '+919876543211', grade: 'PRT', status: 'new', notification: { status: 'sent' } });
  const h = createAdminEnquiriesHandler({ store, service: {}, auth: fakeAuth, logger: silentLogger });
  const list = createRes();
  await h(createReq({ query: { month: '2026-11', type: 'career' }, cookieAdmin: true }), list);
  assert.deepEqual(list.body.items.map(i => i.name), ['C']);
  const csv = createRes();
  await h(createReq({ query: { month: '2026-11', type: 'visit', format: 'csv' }, cookieAdmin: true }), csv);
  assert.match(csv.headers['content-disposition'], /aark-enquiries-visit-2026-11\.csv/);
  assert.doesNotMatch(csv.body, /"C"/);
  const bad = createRes();
  await h(createReq({ query: { month: '2026-11', type: 'nope' }, cookieAdmin: true }), bad);
  assert.equal(bad.statusCode, 400);
});
