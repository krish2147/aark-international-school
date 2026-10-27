const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnquiryService, PARENT_CONFIRMATION, APPLICANT_CONFIRMATION, LIMITS } = require('../../api/_lib/enquiryService');
const { createEnquiryStore } = require('../../api/_lib/enquiryStore');
const { normalisePhone, validateEnquiry } = require('../../api/_lib/enquiryValidation');
const { createEnquiryHandler } = require('../../api/enquiry');
const { createFakeBlob, createReq, createRes, silentLogger, memoryLimiter } = require('./helpers');

const RID = '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90';
const valid = (extra = {}) => ({ type: 'visit', name: 'Test Parent', phone: '98765 43210', grade: 'Grade 1', requestId: RID, ...extra });

function setup({ storeConfigured = true, mailerConfigured = true, turnstile = { enabled: false } } = {}) {
  const fake = createFakeBlob();
  const store = createEnquiryStore({ blob: fake.blob, env: storeConfigured ? { BLOB_ENQUIRY_READ_WRITE_TOKEN: 'test' } : {} });
  const order = [];
  const sent = [];
  const mailer = {
    configured: mailerConfigured,
    failSchool: null,
    async sendToSchool(msg, replyTo) { order.push('email'); if (this.failSchool) throw this.failSchool; sent.push({ to: 'school', ...msg, replyTo }); },
    async sendToParent(to, msg) { sent.push({ to, ...msg }); },
  };
  const origCreate = store.create;
  store.create = async r => { order.push('store'); return origCreate(r); };
  const limiter = memoryLimiter();
  let id = 0;
  const service = createEnquiryService({
    store, mailer, limiter, turnstile, logger: silentLogger,
    now: () => new Date('2026-10-10T09:30:00Z'),
    uuid: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
  });
  const records = () => [...fake.blob.files.entries()].filter(([p]) => p.startsWith('enquiries/2026/')).map(([, f]) => JSON.parse(f.body));
  return { fake, store, mailer, sent, order, limiter, service, records };
}

const submit = (s, body, ip = '203.0.113.9') => s.service.submit(body, { ip });

test('phone numbers are normalised to E.164', () => {
  assert.equal(normalisePhone('98765 43210'), '+919876543210');
  assert.equal(normalisePhone('098765-43210'), '+919876543210');
  assert.equal(normalisePhone('+91 98765 43210'), '+919876543210');
  assert.equal(normalisePhone('919876543210'), '+919876543210');
  assert.equal(normalisePhone('+44 20 7946 0958'), '+442079460958');
  assert.equal(normalisePhone('12345'), null);
  assert.equal(normalisePhone('call me'), null);
});

test('validation rejects missing fields, bad phones and bad emails, and strips control characters', () => {
  assert.ok(validateEnquiry({ name: 'A', grade: 'G' }).error);
  assert.ok(validateEnquiry({ name: 'A', phone: '123', grade: 'G' }).error);
  assert.ok(validateEnquiry({ name: 'A', phone: '9876543210', grade: 'G', email: 'a@b' }).error);
  assert.ok(validateEnquiry({ name: 'A', phone: '9876543210', grade: 'G', email: 'x@y.com(evil)@z.com' }).error);
  const { value } = validateEnquiry({ name: 'A\r\nBcc: victim@example.com', phone: '9876543210', grade: 'G' });
  assert.equal(value.name, 'A Bcc: victim@example.com');
  assert.equal(value.requestId, null);
});

test('the enquiry is stored before any email is attempted', async () => {
  const s = setup();
  const r = await submit(s, valid());
  assert.equal(r.status, 200);
  assert.deepEqual(s.order, ['store', 'email']);
  const [rec] = s.records();
  assert.equal(rec.id, RID);
  assert.equal(rec.phone, '+919876543210');
  assert.equal(rec.receivedAt, '2026-10-10T09:30:00.000Z');
  assert.equal(rec.notification.status, 'sent');
  assert.equal(s.fake.blob.calls.find(c => c[0] === 'put').at(2).access, 'private');
});

test('an email failure keeps the stored enquiry and still succeeds for the parent', async () => {
  const s = setup();
  s.mailer.failSchool = Object.assign(new Error('smtp down'), { code: 'ECONNECTION' });
  const r = await submit(s, valid());
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  const [rec] = s.records();
  assert.equal(rec.notification.status, 'failed');
  assert.equal(rec.notification.error, 'ECONNECTION');
});

test('a storage failure still succeeds when the school email is sent', async () => {
  const s = setup();
  s.fake.blob.fail.put = new Error('blob outage');
  const r = await submit(s, valid());
  assert.equal(r.status, 200);
  assert.equal(s.sent.length, 1);
});

test('when neither storage nor email works the parent is told to call', async () => {
  const s = setup({ storeConfigured: false, mailerConfigured: false });
  const r = await submit(s, valid());
  assert.equal(r.status, 503);
  assert.match(r.body.error, /\+91 99091 15550/);
});

test('storage outage plus email failure is a 503, not a false success', async () => {
  const s = setup();
  s.fake.blob.fail.put = new Error('blob outage');
  s.mailer.failSchool = new Error('smtp down');
  const r = await submit(s, valid());
  assert.equal(r.status, 503);
});

test('invalid submissions are rejected and nothing is stored or sent', async () => {
  const s = setup();
  const r = await submit(s, valid({ phone: 'abc' }));
  assert.equal(r.status, 400);
  assert.equal(s.records().length, 0);
  assert.equal(s.sent.length, 0);
});

test('the honeypot field silently accepts and does nothing', async () => {
  const s = setup();
  const r = await submit(s, valid({ company: 'bot inc' }));
  assert.equal(r.status, 200);
  assert.equal(s.records().length, 0);
  assert.equal(s.sent.length, 0);
});

test('a resubmitted form (same requestId) is acknowledged without a second email', async () => {
  const s = setup();
  await submit(s, valid());
  const again = await submit(s, valid());
  assert.equal(again.status, 200);
  assert.equal(again.body.duplicate, true);
  assert.equal(s.records().length, 1);
  assert.equal(s.sent.length, 1);
});

test('a same-day repeat from the same phone is kept but does not email the school again', async () => {
  const s = setup();
  await submit(s, valid());
  const r = await submit(s, valid({ requestId: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b91', phone: '+91 98765 43210' }));
  assert.equal(r.status, 200);
  const recs = s.records();
  assert.equal(recs.length, 2);
  assert.equal(recs.filter(x => x.duplicate).length, 1);
  assert.equal(s.sent.length, 1);
});

test('more than the per-IP limit in 10 minutes gets 429 and is not stored', async () => {
  const s = setup();
  const [limit] = LIMITS.perIp;
  for (let i = 0; i < limit; i++) {
    const r = await submit(s, valid({ requestId: undefined, phone: `98765 4321${i}` }));
    assert.equal(r.status, 200);
  }
  const blocked = await submit(s, valid({ requestId: undefined, phone: '98765 99999' }));
  assert.equal(blocked.status, 429);
  assert.equal(s.records().length, limit);
  const otherIp = await submit(s, valid({ requestId: undefined, phone: '98765 88888' }), '198.51.100.7');
  assert.equal(otherIp.status, 200);
});

test('no confirmation email is ever sent without a verified human (Turnstile off)', async () => {
  const s = setup();
  const r = await submit(s, valid({ email: 'parent@example.com' }));
  assert.equal(r.body.confirmationSent, false);
  assert.equal(s.sent.filter(m => m.to === 'parent@example.com').length, 0);
});

test('with Turnstile: fixed-text confirmation, at most once per address per day', async () => {
  const s = setup({ turnstile: { enabled: true, verify: async t => t === 'good' } });
  const first = await submit(s, valid({ email: 'parent@example.com', name: 'Buy cheap pills', turnstileToken: 'good' }));
  assert.equal(first.body.confirmationSent, true);
  const msg = s.sent.find(m => m.to === 'parent@example.com');
  assert.equal(msg.text, PARENT_CONFIRMATION.text);
  assert.doesNotMatch(msg.text + msg.subject, /pills/);

  const second = await submit(s, valid({ requestId: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b92', phone: '98765 00000', email: 'parent@example.com', turnstileToken: 'good' }));
  assert.equal(second.body.confirmationSent, false);
});

test('a failed Turnstile check is rejected; an unreachable Turnstile still accepts the lead', async () => {
  const rejected = setup({ turnstile: { enabled: true, verify: async () => false } });
  assert.equal((await submit(rejected, valid())).status, 400);
  assert.equal(rejected.records().length, 0);

  const down = setup({ turnstile: { enabled: true, verify: async () => { throw new Error('timeout'); } } });
  const r = await submit(down, valid({ email: 'parent@example.com' }));
  assert.equal(r.status, 200);
  assert.equal(r.body.confirmationSent, false);
  assert.equal(down.records().length, 1);
});

test('the admin retry resends the school email and records the result', async () => {
  const s = setup();
  s.mailer.failSchool = new Error('smtp down');
  await submit(s, valid());
  s.mailer.failSchool = null;
  const r = await s.service.retryNotification(RID, '2026-10');
  assert.equal(r.status, 200);
  assert.equal(r.body.notification.status, 'sent');
  assert.equal(s.records()[0].notification.status, 'sent');
  assert.equal((await s.service.retryNotification('3f2a9c1e-5b7d-4e8a-9c21-000000000000', '2026-10')).status, 404);
});

test('the HTTP handler only accepts POST and never caches', async () => {
  const s = setup();
  const h = createEnquiryHandler(s.service, silentLogger);
  const get = createRes();
  await h(createReq({ method: 'GET' }), get);
  assert.equal(get.statusCode, 405);
  const post = createRes();
  await h(createReq({ method: 'POST', body: JSON.stringify(valid()) }), post);
  assert.equal(post.statusCode, 200);
  assert.match(post.headers['cache-control'], /no-store/);
});

const job = (extra = {}) => ({ type: 'career', name: 'Asha Teacher', phone: '98765 12345', email: 'asha@example.com', grade: 'Primary Teacher (PRT)', message: 'B.Ed, 5 years teaching Grades 3-5.\nCBSE schools.', requestId: RID, ...extra });

test('job applications need a role and an email, and keep the experience note', () => {
  assert.match(validateEnquiry(job({ grade: '' })).error, /role/);
  assert.match(validateEnquiry(job({ email: '' })).error, /email/);
  const { value } = validateEnquiry(job({ child: 'should be dropped', message: 'a\u0000b' + 'x'.repeat(2000) }));
  assert.equal(value.type, 'career');
  assert.equal(value.typeLabel, 'Job Application');
  assert.equal(value.child, '');
  assert.equal(value.message.length, 1500);
  assert.doesNotMatch(value.message, /\u0000/);
  assert.equal(validateEnquiry(valid({ message: 'ignored for parents' })).value.message, '');
});

test('a job application is stored with its note and emailed to the school as an application', async () => {
  const s = setup();
  const r = await submit(s, job());
  assert.equal(r.status, 200);
  const [rec] = s.records();
  assert.equal(rec.type, 'career');
  assert.match(rec.message, /5 years/);
  const mail = s.sent.find(m => m.to === 'school');
  assert.match(mail.subject, /^Job Application — Primary Teacher \(PRT\) — Asha Teacher$/);
  assert.match(mail.text, /Role applied for: Primary Teacher \(PRT\)/);
  assert.match(mail.text, /5 years teaching/);
  assert.equal(mail.replyTo, 'asha@example.com');
});

test('with Turnstile, applicants get the applicant confirmation, not the parent one', async () => {
  const s = setup({ turnstile: { enabled: true, verify: async t => t === 'good' } });
  await submit(s, job({ turnstileToken: 'good' }));
  const msg = s.sent.find(m => m.to === 'asha@example.com');
  assert.equal(msg.text, APPLICANT_CONFIRMATION.text);
  assert.doesNotMatch(msg.text, /admissions team/);
});
