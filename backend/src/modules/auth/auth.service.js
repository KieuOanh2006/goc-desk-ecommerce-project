const argon2 = require('argon2');
const { createApiError } = require('../../middlewares/error-handler');
const authModel = require('./auth.model');
const emailService = require('./email.service');
const { normalizeVietnamMobilePhone } = require('./phone');
const {
  createOpaqueToken,
  describeUserAgent,
  getSessionPolicy,
  hashToken,
  toIso,
} = require('./auth.security');

const MAX_VERIFICATION_TOKENS_PER_USER_PER_HOUR = 3;
const ROLES = new Set(['member', 'admin', 'product_content_staff', 'order_support_staff']);
let dummyPasswordHashPromise;

async function verifyDummyPassword(password) {
  dummyPasswordHashPromise ||= argon2.hash('goc-desk-invalid-account-password', { type: argon2.argon2id });
  try { await argon2.verify(await dummyPasswordHashPromise, password); } catch { /* Keep the generic login failure. */ }
}

function normalizeLoginIdentity(identity) {
  const value = identity.trim();
  if (value.includes('@')) return { email: value.toLowerCase() };
  const phone = normalizeVietnamMobilePhone(value);
  if (phone) return { phone };
  throw createApiError(401, 'AUTHENTICATION_FAILED', 'Thông tin đăng nhập không hợp lệ.');
}

function createService({ model = authModel, mailer = emailService, logger = console } = {}) {
  async function sendVerification(user, token) {
    try {
      await mailer.sendVerificationEmail({ email: user.email, fullName: user.fullName, token });
    } catch (error) {
      logger.error('[auth-email]', { code: error.code || 'DELIVERY_FAILED' });
      throw createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Chưa thể gửi email xác minh. Vui lòng thử lại sau.');
    }
  }

  async function register(input) {
    const phone = normalizeVietnamMobilePhone(input.phone);
    if (!phone) throw createApiError(422, 'INVALID_PHONE', 'Số điện thoại di động Việt Nam không hợp lệ.');
    mailer.assertConfigured();
    const token = createOpaqueToken();
    let user;
    try {
      user = await model.createPendingMember({
        fullName: input.name,
        email: input.email,
        phone,
        passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
        tokenHash: hashToken(token),
      });
    } catch (error) {
      if (error.code === 'AUTH_IDENTITY_CONFLICT' || error.code === 'ER_DUP_ENTRY') {
        throw createApiError(409, 'ACCOUNT_ALREADY_EXISTS', 'Email hoặc số điện thoại đã được đăng ký.');
      }
      if (error.code === 'AUTH_LOCK_UNAVAILABLE') {
        throw createApiError(503, 'AUTH_TEMPORARILY_UNAVAILABLE', 'Chưa thể xử lý đăng ký lúc này.');
      }
      throw error;
    }
    await sendVerification(user, token);
    return {
      id: user.id,
      email: user.email,
      accountStatus: 'pending',
      emailVerificationRequired: true,
    };
  }

  async function resendVerification(email, rateLimitedByIp = false) {
    mailer.assertConfigured();
    if (rateLimitedByIp) return { accepted: true };

    const user = await model.findUserByEmail(email);
    if (!user || user.account_status !== 'pending' || user.role !== 'member' || user.email_verified_at) {
      return { accepted: true };
    }
    const token = createOpaqueToken();
    const tokenCreated = await model.createResentVerificationToken({
      userId: user.id,
      tokenHash: hashToken(token),
      maxTokensPerHour: MAX_VERIFICATION_TOKENS_PER_USER_PER_HOUR,
    });
    if (!tokenCreated) return { accepted: true };
    await sendVerification({ email: user.email, fullName: user.full_name }, token);
    return { accepted: true };
  }

  async function verifyEmail(token, userAgent) {
    const sessionToken = createOpaqueToken();
    const sessionPolicy = getSessionPolicy('member', false);
    const result = await model.consumeVerificationToken({
      tokenHash: hashToken(token),
      session: {
        tokenHash: hashToken(sessionToken),
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 512) : null,
        idleSeconds: sessionPolicy.idleSeconds,
        absoluteSeconds: sessionPolicy.absoluteSeconds,
      },
    });
    if (!result) {
      throw createApiError(400, 'EMAIL_VERIFICATION_INVALID', 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
    }
    return {
      user: result.user,
      ...(result.sessionId ? { sessionToken, sessionPolicy, sessionId: result.sessionId } : {}),
    };
  }

  async function login({ identity, password, rememberMe }, userAgent) {
    const normalizedIdentity = normalizeLoginIdentity(identity);
    const user = normalizedIdentity.email
      ? await model.findUserByEmail(normalizedIdentity.email)
      : await model.findUserByPhone(normalizedIdentity.phone);
    let passwordMatches = false;
    if (user?.password_hash) {
      try {
        passwordMatches = await argon2.verify(user.password_hash, password);
      } catch {
        passwordMatches = false;
        await verifyDummyPassword(password);
      }
    } else await verifyDummyPassword(password);
    if (!user || !passwordMatches || user.account_status !== 'active' || !user.email_verified_at) {
      throw createApiError(401, 'AUTHENTICATION_FAILED', 'Thông tin đăng nhập không hợp lệ.');
    }
    if (!ROLES.has(user.role)) {
      throw createApiError(403, 'ACCOUNT_NOT_ALLOWED', 'Tài khoản không được phép đăng nhập.');
    }

    const sessionPolicy = getSessionPolicy(user.role, user.role === 'member' && rememberMe);
    const sessionToken = createOpaqueToken();
    const userAgentValue = typeof userAgent === 'string' ? userAgent.slice(0, 512) : null;
    const sessionId = await model.createSession({
      userId: user.id,
      tokenHash: hashToken(sessionToken),
      userAgent: userAgentValue,
      idleSeconds: sessionPolicy.idleSeconds,
      absoluteSeconds: sessionPolicy.absoluteSeconds,
      rememberMe: sessionPolicy.rememberMe,
    });
    return { user: safeUser(user), sessionToken, sessionPolicy, sessionId };
  }

  async function authenticate(sessionToken) {
    if (!sessionToken) throw createApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    const refreshed = await model.getActiveSession(hashToken(sessionToken));
    if (!refreshed) throw createApiError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn hoặc bị thu hồi.');
    if (!getSessionPolicy(refreshed.user.role, refreshed.user.role === 'member' && refreshed.rememberMe)) {
      throw createApiError(403, 'ACCOUNT_NOT_ALLOWED', 'Tài khoản không được phép truy cập.');
    }
    return {
      ...refreshed,
      cookieMaxAgeSeconds: Math.min(refreshed.idleRemainingSeconds, refreshed.absoluteRemainingSeconds),
    };
  }

  async function logout(sessionToken) {
    if (sessionToken) await model.revokeSessionByHash(hashToken(sessionToken), 'logout');
  }

  async function listSessions(auth) {
    const rows = await model.listActiveSessions(auth.user.id);
    return rows.map((row) => {
      const { browser, operatingSystem } = describeUserAgent(row.user_agent);
      return {
        sessionId: String(row.id),
        browser,
        operatingSystem,
        ...(row.user_agent ? { userAgent: row.user_agent } : {}),
        createdAt: toIso(row.created_at),
        lastActivityAt: toIso(row.last_activity_at),
        rememberMe: Boolean(row.remember_me),
        isCurrent: String(row.id) === auth.id,
      };
    });
  }

  async function revokeOneSession(auth, sessionId) {
    const revoked = await model.revokeSession(auth.user.id, sessionId, 'user_revoked');
    if (!revoked) throw createApiError(404, 'SESSION_NOT_FOUND', 'Không tìm thấy phiên đăng nhập.');
    return { revoked: true, isCurrent: sessionId === auth.id };
  }

  async function logoutOthers(auth) {
    const revokedCount = await model.revokeOtherSessions(auth.user.id, auth.id, 'logout_others');
    return { revokedCount };
  }

  async function logoutAll(auth) {
    const revokedCount = await model.revokeAllSessions(auth.user.id, 'logout_all');
    return { revokedCount };
  }

  return { authenticate, listSessions, login, logout, logoutAll, logoutOthers, register, resendVerification, revokeOneSession, verifyEmail };
}

function safeUser(user) {
  return {
    id: String(user.id),
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.account_status,
    emailVerifiedAt: user.email_verified_at,
  };
}

module.exports = { createService, normalizeLoginIdentity };
