// POST /api/chat — the website assistant. Answers parents' questions from the
// published school facts only (_lib/schoolKnowledge.js) and streams plain text.
//
// Request:  { messages: [{ role: 'user' | 'assistant', content: string }, ...] }
//           ending with the visitor's latest question.
// Response: 200 text/plain, streamed as it is written; JSON errors otherwise.
const Anthropic = require('@anthropic-ai/sdk');
const { parseBody, clientIp, isSameOrigin, methodNotAllowed, noStore } = require('./_lib/http');
const { createRateLimiter } = require('./_lib/rateLimit');
const { SYSTEM_PROMPT } = require('./_lib/schoolKnowledge');

const MODEL = 'claude-opus-5-5';
const FALLBACK_TEXT = "Sorry, I can't answer that right now. Please call the school on +91 99091 15550 (office 9:00 AM – 12:00 PM) or book a campus visit.";

// Abuse and cost guards. Per IP: a short burst window and a daily cap; plus one
// daily ceiling across all visitors so a flood can't run up the bill.
const LIMITS = { burst: [12, 600], daily: [60, 86400], global: [1500, 86400] };
const MAX_TURNS = 12;          // messages kept from the conversation
const MAX_USER_CHARS = 800;    // per visitor message
const MAX_TOTAL_CHARS = 9000;  // whole conversation sent to the model

function validateMessages(raw) {
  if (!Array.isArray(raw) || !raw.length) return { error: 'Please type a question.' };
  const messages = raw.slice(-MAX_TURNS).map(m => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: typeof (m && m.content) === 'string' ? m.content.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim() : '',
  }));
  while (messages.length && messages[0].role !== 'user') messages.shift();   // must start with the visitor
  if (!messages.length || messages[messages.length - 1].role !== 'user') return { error: 'Please type a question.' };
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m.content) return { error: 'Please type a question.' };
    if (i > 0 && m.role === messages[i - 1].role) return { error: 'Invalid conversation.' };
    if (m.role === 'user' && m.content.length > MAX_USER_CHARS) return { error: `Please keep your question under ${MAX_USER_CHARS} characters.` };
  }
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS) {
    return { error: 'This conversation is getting long. Please refresh the chat and ask again.' };
  }
  return { value: messages };
}

function createChatHandler({ limiter, env = process.env, clientFactory = key => new Anthropic({ apiKey: key, maxRetries: 1, timeout: 60_000 }), logger = console }) {
  let client = null;

  return async (req, res) => {
    noStore(res);
    if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
    if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });

    // One key for Production and Preview: the assistant only reads the published
    // facts, so unlike storage, email and admin sign-in it has nothing to isolate.
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(503).json({ ok: false, error: FALLBACK_TEXT });

    const checked = validateMessages(parseBody(req).messages);
    if (checked.error) return res.status(400).json({ ok: false, error: checked.error });

    const ip = clientIp(req);
    const [burst, daily, global] = await Promise.all([
      limiter.hit(`chat:burst:${ip}`, ...LIMITS.burst),
      limiter.hit(`chat:day:${ip}`, ...LIMITS.daily),
      limiter.hit('chat:day:all', ...LIMITS.global),
    ]);
    if (!burst.allowed || !daily.allowed || !global.allowed) {
      return res.status(429).json({ ok: false, error: "You've asked a lot of questions in a short time. Please wait a little, or call the school on +91 99091 15550." });
    }

    client = client || clientFactory(apiKey);
    let started = false;
    const write = text => {
      if (!started) {
        started = true;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('X-Accel-Buffering', 'no');
      }
      res.write(text);
    };

    try {
      const stream = client.beta.messages.stream({
        model: MODEL,
        // Short chat answers; thinking counts toward this, so leave headroom.
        max_tokens: 2048,
        output_config: { effort: 'low' },
        // If a safety classifier declines, the API retries on its recommended model.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // The facts are identical on every request: cache them.
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: checked.value,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta' && event.delta.text) write(event.delta.text);
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal' || !started) write(started ? `\n\n${FALLBACK_TEXT}` : FALLBACK_TEXT);
      else if (final.stop_reason === 'max_tokens') write('…');
      const u = final.usage || {};
      logger.info('chat ok', { stop: final.stop_reason, in: u.input_tokens, cached: u.cache_read_input_tokens, out: u.output_tokens });
      return res.end();
    } catch (err) {
      logger.error('chat failed:', err.name, err.status || '', err.message);
      if (started) {
        res.write(`\n\n${FALLBACK_TEXT}`);
        return res.end();
      }
      return res.status(502).json({ ok: false, error: FALLBACK_TEXT });
    }
  };
}

module.exports = createChatHandler({ limiter: createRateLimiter() });
module.exports.createChatHandler = createChatHandler;
module.exports.validateMessages = validateMessages;
module.exports.LIMITS = LIMITS;
module.exports.MODEL = MODEL;
