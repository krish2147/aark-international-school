// GET /api/public-config — non-secret settings the static pages need at runtime.
// Only the Turnstile SITE key (designed to be public) is exposed; never a secret.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return res.status(200).json({
    ok: true,
    // True only when the AI key is set; Sahay then sends questions it can't answer
    // from its built-in answers to /api/chat. Never reveals the key itself.
    assistantAi: Boolean(process.env.ANTHROPIC_API_KEY),
    turnstileSiteKey: process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY ? process.env.TURNSTILE_SITE_KEY : null,
  });
};
