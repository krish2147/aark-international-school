function normaliseUrl(value, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      const error = new Error('A URL is required.');
      error.statusCode = 400;
      throw error;
    }
    return undefined;
  }
  const raw = String(value).trim().slice(0, 500);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    const error = new Error('Please provide a valid URL.');
    error.statusCode = 400;
    throw error;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const error = new Error('Only HTTP and HTTPS URLs are allowed.');
    error.statusCode = 400;
    throw error;
  }
  return parsed.toString();
}

module.exports = { normaliseUrl };
