const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try { return new URL(origin).origin; } catch { return null; }
    })
    .filter(Boolean),
);

function corsOrigin(origin, callback) {
  if (origin && allowedOrigins.has(origin)) return callback(null, true);
  return callback(null, false);
}

function isTrustedRequest(req) {
  let candidate = req.get('origin');
  if (!candidate) {
    const referer = req.get('referer');
    if (referer) {
      try { candidate = new URL(referer).origin; } catch { return false; }
    }
  }
  if (!candidate) return false;
  try { return allowedOrigins.has(new URL(candidate).origin) && new URL(candidate).origin === candidate; } catch { return false; }
}

module.exports = { allowedOrigins, corsOrigin, isTrustedRequest };
