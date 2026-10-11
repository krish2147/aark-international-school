// POST /api/enquiry — campus visit and admission enquiries from the public site.
// The record is stored before any email is attempted; see _lib/enquiryService.js.
const { parseBody, clientIp, methodNotAllowed, noStore } = require('./_lib/http');
const { createEnquiryService } = require('./_lib/enquiryService');
const { createEnquiryStore } = require('./_lib/enquiryStore');
const { createMailer } = require('./_lib/mailer');
const { createRateLimiter } = require('./_lib/rateLimit');
const { createTurnstile } = require('./_lib/turnstile');

function createEnquiryHandler(service, logger = console) {
  return async (req, res) => {
    noStore(res);
    if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
    try {
      const result = await service.submit(parseBody(req), { ip: clientIp(req) });
      return res.status(result.status).json(result.body);
    } catch (err) {
      logger.error('enquiry handler failed:', err.name, err.message);
      return res.status(500).json({ ok: false, error: "We couldn't send your request online. Please call the school on +91 99091 15550." });
    }
  };
}

module.exports = createEnquiryHandler(createEnquiryService({
  store: createEnquiryStore(),
  mailer: createMailer(),
  limiter: createRateLimiter(),
  turnstile: createTurnstile(),
}));
module.exports.createEnquiryHandler = createEnquiryHandler;
