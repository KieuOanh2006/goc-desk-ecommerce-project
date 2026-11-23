const { createHash, randomBytes } = require('node:crypto');

const SECOND = 1000;
const DAY = 24 * 60 * 60;

function createOpaqueToken() {
  return randomBytes(32).toString('hex');
}

function hashToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function getSessionPolicy(role, rememberMe = false) {
  if (role === 'member') {
    return rememberMe
      ? { idleSeconds: 30 * DAY, absoluteSeconds: 180 * DAY, rememberMe: true }
      : { idleSeconds: 7 * DAY, absoluteSeconds: 30 * DAY, rememberMe: false };
  }
  if (['admin', 'product_content_staff', 'order_support_staff'].includes(role)) {
    return { idleSeconds: 30 * 60, absoluteSeconds: 8 * 60 * 60, rememberMe: false };
  }
  return null;
}

function parseSessionCookie(header, cookieName) {
  if (typeof header !== 'string') return null;
  const prefix = `${cookieName}=`;
  for (const part of header.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) {
      try {
        const token = decodeURIComponent(value.slice(prefix.length));
        return /^[a-f0-9]{64}$/.test(token) ? token : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function sessionCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: Math.max(0, maxAgeSeconds) * SECOND,
  };
}

function clearSessionCookie(res) {
  res.clearCookie('gocdesk.sid', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  });
}

function describeUserAgent(userAgent) {
  const value = typeof userAgent === 'string' ? userAgent : '';
  let browser = 'Unknown browser';
  let operatingSystem = 'Unknown OS';

  if (/Edg\//i.test(value)) browser = 'Edge';
  else if (/OPR\//i.test(value)) browser = 'Opera';
  else if (/Firefox\//i.test(value)) browser = 'Firefox';
  else if (/Chrome\//i.test(value) && !/Chromium\//i.test(value)) browser = 'Chrome';
  else if (/Safari\//i.test(value)) browser = 'Safari';

  if (/Windows NT/i.test(value)) operatingSystem = 'Windows';
  else if (/Android/i.test(value)) operatingSystem = 'Android';
  else if (/(iPhone|iPad|iPod)/i.test(value)) operatingSystem = 'iOS';
  else if (/Mac OS X/i.test(value)) operatingSystem = 'macOS';
  else if (/Linux/i.test(value)) operatingSystem = 'Linux';

  return { browser, operatingSystem };
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

module.exports = {
  clearSessionCookie,
  createOpaqueToken,
  describeUserAgent,
  getSessionPolicy,
  hashToken,
  parseSessionCookie,
  sessionCookieOptions,
  toIso,
};
