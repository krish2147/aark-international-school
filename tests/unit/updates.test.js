const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { validateEnquiry, INTERESTS } = require('../../api/_lib/enquiryValidation');
const { createEnquiryService, UPDATES_CONFIRMATION } = require('../../api/_lib/enquiryService');
const { createEnquiryStore } = require('../../api/_lib/enquiryStore');
const { sanitize } = require('../../api/_lib/contentSchema');
const { createAdminEnquiriesHandler } = require('../../api/admin/enquiries');
const { createFakeBlob, createReq, createRes, silentLogger, memoryLimiter, fakeAuth } = require('./helpers');

test('update sign-ups need only a name and phone; topics are limited to the known list', () => {
  const ok = validateEnquiry({ type: 'updates', name: 'Asha', phone: '98765 43210', grade: 'Admissions, Events & news, <b>Hack</b>', child: 'ignored' });
  assert.equal(ok.value.type, 'updates');
  assert.equal(ok.value.typeLabel, 'Updates Sign-up');
  assert.equal(ok.value.grade, 'Admissions, Events & news');
  assert.equal(ok.value.child, '');
  assert.equal(validateEnquiry({ type: 'updates', name: 'Asha', phone: '98765 43210' }).value.grade, INTERESTS.join(', '), 'no topic chosen means all');
  assert.ok(validateEnquiry({ type: 'updates', name: 'Asha' }).error);
  assert.ok(validateEnquiry({ type: 'updates', phone: '98765 43210' }).error);
  assert.ok(validateEnquiry({ type: 'updates', name: 'Asha', phone: '12' }).error);
});

test('a sign-up is stored, the school is told, and the parent gets the fixed updates confirmation', async () => {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: { BLOB_ENQUIRY_READ_WRITE_TOKEN: 't' } });
  const sent = [];
  const mailer = { configured: true, async sendToSchool(msg) { sent.push({ to: 'school', ...msg }); }, async sendToParent(to, msg) { sent.push({ to, ...msg }); } };
  const service = createEnquiryService({ store, mailer, limiter: memoryLimiter(), turnstile: { enabled: true, verify: async () => true }, logger: silentLogger, now: () => new Date('2026-11-10T09:30:00Z') });
  const out = await service.submit({ type: 'updates', name: 'Asha', phone: '98765 43210', email: 'asha@example.com', grade: 'Schemes & offers', requestId: crypto.randomUUID() }, { ip: '203.0.113.9' });
  assert.equal(out.status, 200);
  assert.equal(out.body.confirmationSent, true);
  const [rec] = await store.list('2026-11');
  assert.equal(rec.type, 'updates');
  assert.equal(rec.grade, 'Schemes & offers');
  assert.match(sent[0].subject, /Updates Sign-up — Asha/);
  assert.match(sent[0].text, /Interested in: Schemes & offers/);
  assert.equal(sent[1].subject, UPDATES_CONFIRMATION.subject);
});

test('admin can list and export one kind of enquiry, e.g. only update sign-ups', async () => {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: { BLOB_ENQUIRY_READ_WRITE_TOKEN: 't' } });
  await store.create({ id: crypto.randomUUID(), receivedAt: '2026-11-05T10:00:00.000Z', type: 'visit', name: 'V', phone: '+919876543210', grade: 'G1', status: 'new', notification: { status: 'sent' } });
  await store.create({ id: crypto.randomUUID(), receivedAt: '2026-11-06T10:00:00.000Z', type: 'updates', name: 'U', phone: '+919876543211', grade: 'Admissions', status: 'new', notification: { status: 'sent' } });
  const h = createAdminEnquiriesHandler({ store, service: {}, auth: fakeAuth, logger: silentLogger });
  const list = createRes();
  await h(createReq({ query: { month: '2026-11', type: 'updates' }, cookieAdmin: true }), list);
  assert.deepEqual(list.body.items.map(i => i.name), ['U']);
  const csv = createRes();
  await h(createReq({ query: { month: '2026-11', type: 'updates', format: 'csv' }, cookieAdmin: true }), csv);
  assert.match(csv.headers['content-disposition'], /aark-update-signups-2026-11\.csv/);
  assert.doesNotMatch(csv.body, /"V"/);
  const bad = createRes();
  await h(createReq({ query: { month: '2026-11', type: 'nope' }, cookieAdmin: true }), bad);
  assert.equal(bad.statusCode, 400);
});

test('popups accept a type, button text, photo and sign-up switch; unknown types are refused', () => {
  const photo = 'https://abc.public.blob.vercel-storage.com/uploads/x.webp';
  const { item } = sanitize('events', { title: 'Admissions open', message: 'Apply now', kind: 'admission', buttonText: 'Apply now', link: 'admissions.html', photoUrl: photo, signup: true, active: 'true', extra: 'dropped' });
  assert.deepEqual(item, { title: 'Admissions open', message: 'Apply now', buttonText: 'Apply now', kind: 'admission', photoUrl: photo, link: 'admissions.html', active: true, signup: true });
  assert.ok(sanitize('events', { title: 't', message: 'm', kind: 'script' }).error);
  assert.ok(sanitize('events', { title: 't', message: 'm', photoUrl: 'https://evil.example/x.jpg' }).error);
  assert.equal(sanitize('events', { photoUrl: '' }, { partial: true }).item.photoUrl, '', 'an empty photo removes it');
});
