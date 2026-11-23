const { createApiError } = require('./error-handler');
const authService = require('../modules/auth/auth.service').createService();
const {
  clearSessionCookie,
  parseSessionCookie,
  sessionCookieOptions,
} = require('../modules/auth/auth.security');

const COOKIE_NAME = 'gocdesk.sid';

async function requireAuthSession(req, res, next) {
  const token = parseSessionCookie(req.headers.cookie, COOKIE_NAME);
  if (!token) {
    if (req.headers.cookie?.split(';').some((part) => part.trim().startsWith(`${COOKIE_NAME}=`))) {
      clearSessionCookie(res);
    }
    return next(createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.'));
  }

  try {
    const auth = await authService.authenticate(token);
    req.auth = auth;
    res.cookie(COOKIE_NAME, token, sessionCookieOptions(auth.cookieMaxAgeSeconds));
    return next();
  } catch (error) {
    if (error.statusCode === 401) clearSessionCookie(res);
    return next(error);
  }
}

module.exports = { COOKIE_NAME, requireAuthSession };
