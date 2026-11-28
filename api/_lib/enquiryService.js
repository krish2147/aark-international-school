const crypto = require('crypto');
const { validateEnquiry } = require('./enquiryValidation');
const { DuplicateError } = require('./enquiryStore');

const SCHOOL_PHONE = '+91 99091 15550';
const FALLBACK = `Please call the school on ${SCHOOL_PHONE} or email info@theaarkinternational.com.`;

// Limits for the public endpoint (per client IP / per recipient address).
const LIMITS = { perIp: [5, 600], perIpDay: [20, 86400], replyPerAddress: [1, 86400] };

function schoolNotification(record) {
  if (record.type === 'career') {
    return {
      subject: `${record.typeLabel} — ${record.grade} — ${record.name}`,
      text: [
        record.typeLabel,
        '',
        `Applicant: ${record.name}`,
        `Phone: ${record.phone}`,
        `Email: ${record.email}`,
        `Role applied for: ${record.grade}`,
        '',
        'Experience and qualifications:',
        record.message || '—',
        '',
        'The applicant has been asked to email their CV to info@theaarkinternational.com; reply to this email to contact them.',
        '',
        `Reference: ${record.id}`,
        `Received: ${record.receivedAt}`,
        'Submitted from the school website.',
      ].join('\n'),
    };
  }
  return {
    subject: `${record.typeLabel} — ${record.name}`,
    text: [
      record.typeLabel,
      '',
      `Parent/Guardian: ${record.name}`,
      `Phone: ${record.phone}`,
      `Child: ${record.child || '—'}`,
      `Grade interested in: ${record.grade}`,
      `Email: ${record.email || '—'}`,
      '',
      `Reference: ${record.id}`,
      `Received: ${record.receivedAt}`,
      'Submitted from the school website.',
    ].join('\n'),
  };
}

// Fixed wording only: nothing the visitor typed is echoed into a message that is
// sent to an address the visitor chose (E4: no open relay for arbitrary text).
const PARENT_CONFIRMATION = {
  subject: 'We received your request — AARK International School',
  text: [
    'Thank you for contacting AARK International School.',
    '',
    'We have received your request and our admissions team will call you on the number you provided.',
    '',
    `If you need help sooner, call us on ${SCHOOL_PHONE}.`,
    '',
    'AARK International School',
    'Nr. Shyam Icon, Bhayli-Sevasi Ring Road, Sevasi, Vadodara – 391101',
    '',
    'If you did not make this request, you can ignore this email.',
  ].join('\n'),
};

const APPLICANT_CONFIRMATION = {
  subject: 'We received your application — AARK International School',
  text: [
    'Thank you for applying to AARK International School.',
    '',
    'We have received your application. If you have not already done so, please email your CV to info@theaarkinternational.com with the role you are applying for in the subject line.',
    '',
    'Our HR team reviews every application and will contact shortlisted candidates.',
    '',
    'AARK International School',
    'Nr. Shyam Icon, Bhayli-Sevasi Ring Road, Sevasi, Vadodara – 391101',
    '',
    'If you did not make this application, you can ignore this email.',
  ].join('\n'),
};

/*
  Order of operations, chosen so a lead is never silently lost:
    validate → rate-limit → (Turnstile) → STORE → email school → record delivery status → optional confirmation
  - Stored but email failed → success for the parent; the admin list shows "email failed" and can retry.
  - Storage failed but email sent → success (the school still has it in its inbox).
  - Both failed → 503 with the phone/email fallback, so the parent knows to call.
*/
function createEnquiryService({ store, mailer, limiter, turnstile, logger = console, now = () => new Date(), uuid = crypto.randomUUID }) {
  async function notifySchool(record) {
    if (!mailer.configured) return { status: 'not_configured' };
    try {
      await mailer.sendToSchool(schoolNotification(record), record.email || undefined);
      return { status: 'sent', at: now().toISOString() };
    } catch (err) {
      logger.error(`enquiry ${record.id}: school email failed:`, err.code || err.name);
      return { status: 'failed', at: now().toISOString(), error: String(err.code || err.name || 'error').slice(0, 60) };
    }
  }

  async function submit(body, { ip }) {
    if (body.company) return { status: 200, body: { ok: true } }; // honeypot: pretend success, store nothing

    const { value, error } = validateEnquiry(body);
    if (error) return { status: 400, body: { ok: false, error } };

    const [ipLimit, ipWindow] = LIMITS.perIp;
    const [dayLimit, dayWindow] = LIMITS.perIpDay;
    const burst = await limiter.hit(`enq:ip:${ip}`, ipLimit, ipWindow);
    const daily = await limiter.hit(`enq:ipday:${ip}`, dayLimit, dayWindow);
    if (!burst.allowed || !daily.allowed) {
      return { status: 429, body: { ok: false, error: `Too many requests from this connection. ${FALLBACK}` } };
    }

    // Turnstile decides whether a confirmation email may go out. A failed check is
    // rejected; if Cloudflare itself is unreachable the enquiry is still accepted
    // (a lead matters more than the check) but no confirmation is sent.
    let human = false;
    if (turnstile.enabled) {
      let reachable = true;
      try {
        human = await turnstile.verify(body.turnstileToken, ip);
      } catch (err) {
        reachable = false;
        logger.error('turnstile unreachable, accepting without confirmation email:', err.message);
      }
      if (reachable && !human) return { status: 400, body: { ok: false, error: 'We could not verify this request. Please reload the page and try again.' } };
    }

    const receivedAt = now().toISOString();
    const record = {
      id: value.requestId || uuid(),
      receivedAt,
      type: value.type,
      typeLabel: value.typeLabel,
      name: value.name,
      phone: value.phone,
      child: value.child,
      grade: value.grade,
      email: value.email,
      ...(value.message ? { message: value.message } : {}),
      status: 'new',
      duplicate: false,
      notification: { status: 'pending' },
    };

    let stored = false;
    let etag;
    if (store.configured) {
      try {
        const fresh = await store.claimFingerprint(receivedAt.slice(0, 10), [value.type, value.phone, value.grade.toLowerCase()]);
        record.duplicate = !fresh;
        ({ etag } = await store.create(record));
        stored = true;
      } catch (err) {
        if (err instanceof DuplicateError) {
          // The same form submission arrived twice (double click, retry): already handled.
          return { status: 200, body: { ok: true, id: record.id, duplicate: true } };
        }
        logger.error(`enquiry ${record.id}: storage failed:`, err.name, err.message);
      }
    }

    // A same-day repeat from the same phone for the same grade is kept for the
    // record but does not email the school again.
    record.notification = record.duplicate ? { status: 'skipped_duplicate' } : await notifySchool(record);

    if (stored) {
      try {
        await store.update(record, etag);
      } catch (err) {
        logger.error(`enquiry ${record.id}: status update failed:`, err.name);
      }
    }

    const schoolHasIt = stored || record.notification.status === 'sent';
    if (!schoolHasIt) {
      return { status: 503, body: { ok: false, error: `We couldn't send your request online. ${FALLBACK}` } };
    }

    let confirmationSent = false;
    if (record.email && human && !record.duplicate && mailer.configured) {
      const perAddress = await limiter.hit(`enq:reply:${record.email}`, ...LIMITS.replyPerAddress);
      if (perAddress.allowed) {
        try {
          await mailer.sendToParent(record.email, record.type === 'career' ? APPLICANT_CONFIRMATION : PARENT_CONFIRMATION);
          confirmationSent = true;
        } catch (err) {
          logger.error(`enquiry ${record.id}: confirmation email failed:`, err.code || err.name);
        }
      }
    }

    return { status: 200, body: { ok: true, id: record.id, confirmationSent } };
  }

  // Resend the school notification for a stored enquiry (admin "Retry email").
  async function retryNotification(id, month) {
    const found = await store.get(id, month);
    if (!found) return { status: 404, body: { ok: false, error: 'Enquiry not found.' } };
    const record = found.record;
    record.notification = await notifySchool(record);
    await store.update(record, found.etag);
    return { status: 200, body: { ok: record.notification.status === 'sent', notification: record.notification, error: record.notification.status === 'sent' ? undefined : 'Email could not be sent.' } };
  }

  return { submit, retryNotification };
}

module.exports = { createEnquiryService, PARENT_CONFIRMATION, APPLICANT_CONFIRMATION, LIMITS, schoolNotification };
