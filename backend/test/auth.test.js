const test = require('node:test');
const assert = require('node:assert/strict');
const argon2 = require('argon2');
const {
  createOpaqueToken,
  describeUserAgent,
  getSessionPolicy,
  hashToken,
  parseSessionCookie,
  sessionCookieOptions,
} = require('../src/modules/auth/auth.security');
const { createService, normalizeLoginIdentity } = require('../src/modules/auth/auth.service');
const emailService = require('../src/modules/auth/email.service');
const { loginSchema, registerSchema } = require('../src/modules/auth/auth.schemas');
const { normalizeVietnamMobilePhone } = require('../src/modules/auth/phone');

const activeMember = {
  id: 42,
  full_name: 'Member Test',
  email: 'member@example.test',
  phone: '+84901234567',
  role: 'member',
  account_status: 'active',
  email_verified_at: new Date('2026-01-01T00:00:00.000Z'),
};

test('session tokens are random hex and only their SHA-256 hash is used for storage', () => {
  const token = createOpaqueToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token).length, 64);
  assert.notEqual(createOpaqueToken(), token);
});

test('session timeout policies enforce both member modes and staff limits', () => {
  assert.deepEqual(getSessionPolicy('member', false), {
    idleSeconds: 7 * 86400, absoluteSeconds: 30 * 86400, rememberMe: false,
  });
  assert.deepEqual(getSessionPolicy('member', true), {
    idleSeconds: 30 * 86400, absoluteSeconds: 180 * 86400, rememberMe: true,
  });
  for (const role of ['admin', 'product_content_staff', 'order_support_staff']) {
    assert.deepEqual(getSessionPolicy(role, true), {
      idleSeconds: 1800, absoluteSeconds: 28800, rememberMe: false,
    });
  }
});

test('session cookie parser rejects malformed IDs and cookie policy is HttpOnly and SameSite=Lax', () => {
  assert.equal(parseSessionCookie('other=value; gocdesk.sid=not-a-token', 'gocdesk.sid'), null);
  assert.equal(parseSessionCookie(`gocdesk.sid=${'a'.repeat(64)}`, 'gocdesk.sid'), 'a'.repeat(64));
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.deepEqual(sessionCookieOptions(60), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/api', maxAge: 60000,
  });
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test('Vietnamese mobile inputs normalize to one E.164 value and reject malformed numbers', () => {
  for (const input of ['0912345678', '84912345678', '+84912345678', '912345678']) {
    assert.equal(normalizeVietnamMobilePhone(input), '+84912345678');
  }
  for (const input of ['91234567', '9123456780', '09123456789', '+8491234567', '91234a678', '0123456789', '212345678']) {
    assert.equal(normalizeVietnamMobilePhone(input), null, input);
  }
  assert.deepEqual(normalizeLoginIdentity('Member@Example.test'), { email: 'member@example.test' });
  assert.deepEqual(normalizeLoginIdentity('0912345678'), { phone: '+84912345678' });
  assert.deepEqual(normalizeLoginIdentity('+84912345678'), { phone: '+84912345678' });
});

test('registration and login request schemas return canonical phone values', () => {
  for (const input of ['0912345678', '84912345678', '+84912345678', '912345678']) {
    assert.equal(registerSchema.parse({
      name: 'Member Test', email: 'member@example.test', phone: input, password: 'password123',
    }).phone, '+84912345678');
    assert.equal(loginSchema.parse({ identity: input, password: 'password123' }).identity, '+84912345678');
  }
  for (const input of ['91234567', '9123456780', '+8491234567', '91234a678', '212345678']) {
    assert.equal(registerSchema.safeParse({
      name: 'Member Test', email: 'member@example.test', phone: input, password: 'password123',
    }).success, false, input);
  }
});

test('registration validation rejects a Client supplied role', () => {
  const result = registerSchema.safeParse({
    name: 'Member Test', email: 'member@example.test', phone: '+84901234567', password: 'password123', role: 'admin',
  });
  assert.equal(result.success, false);
});

test('SMTP configuration is required and missing configuration is never treated as delivered email', () => {
  const names = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'SMTP_FROM', 'CLIENT_ORIGIN', 'EMAIL_VERIFICATION_URL'];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
  try {
    assert.throws(emailService.assertConfigured, (error) => error.statusCode === 503 && error.code === 'EMAIL_SERVICE_UNAVAILABLE');
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('Gmail SMTP reads MAIL_FROM, removes App Password grouping spaces, and builds the verification URL from CLIENT_ORIGIN', () => {
  const names = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'SMTP_FROM', 'CLIENT_ORIGIN', 'EMAIL_VERIFICATION_URL', 'NODE_ENV'];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_SECURE: 'false',
    SMTP_USER: 'gocdesk.official@gmail.com', SMTP_PASSWORD: 'abcd efgh ijkl mnop',
    MAIL_FROM: 'Góc Desk <gocdesk.official@gmail.com>', SMTP_FROM: 'legacy@example.test',
    CLIENT_ORIGIN: 'http://127.0.0.1:5500', NODE_ENV: 'development',
  });
  delete process.env.EMAIL_VERIFICATION_URL;
  try {
    const config = emailService.getMailConfiguration();
    assert.equal(config.from, process.env.MAIL_FROM);
    assert.equal(config.password.length, 16);
    assert.equal(/\s/.test(config.password), false);
    assert.equal(config.verificationUrl.toString(), 'http://127.0.0.1:5500/account.html');
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('user agent is mapped to a useful browser and operating system label', () => {
  assert.deepEqual(
    describeUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'),
    { browser: 'Edge', operatingSystem: 'Windows' },
  );
});

test('registration stores a pending Member hash and never returns the verification token', async () => {
  let created;
  let delivered;
  const model = {
    async createPendingMember(input) {
      created = input;
      return { id: '17', email: input.email, fullName: input.fullName, accountStatus: 'pending' };
    },
  };
  const mailer = {
    assertConfigured() {},
    async sendVerificationEmail(message) { delivered = message; },
  };
  const service = createService({ model, mailer, logger: { error() {} } });
  const result = await service.register({
    name: 'Member Test', email: 'member@example.test', phone: '0912345678', password: 'password123',
  });

  assert.equal(created.phone, '+84912345678');
  assert.match(created.passwordHash, /^\$argon2id\$/);
  assert.equal(created.tokenHash, hashToken(delivered.token));
  assert.equal(result.accountStatus, 'pending');
  assert.equal(result.emailVerificationRequired, true);
  assert.equal('token' in result, false);
  assert.notEqual(created.tokenHash, delivered.token);
});

test('registration maps duplicate email or phone to a stable conflict response', async () => {
  const service = createService({
    model: { async createPendingMember() { const error = new Error(); error.code = 'AUTH_IDENTITY_CONFLICT'; throw error; } },
    mailer: { assertConfigured() {}, async sendVerificationEmail() {} },
    logger: { error() {} },
  });
  await assert.rejects(
    service.register({ name: 'Member Test', email: 'member@example.test', phone: '0901234567', password: 'password123' }),
    (error) => error.statusCode === 409 && error.code === 'ACCOUNT_ALREADY_EXISTS',
  );
});

test('registration detects the same phone when submitted in different supported forms', async () => {
  const phones = new Set();
  const service = createService({
    model: {
      async createPendingMember(input) {
        if (phones.has(input.phone)) {
          const error = new Error();
          error.code = 'AUTH_IDENTITY_CONFLICT';
          throw error;
        }
        phones.add(input.phone);
        return { id: '31', email: 'member@example.test', fullName: input.fullName, phone: input.phone };
      },
    },
    mailer: { assertConfigured() {}, async sendVerificationEmail() {} },
    logger: { error() {} },
  });
  const input = { name: 'Member Test', email: 'member@example.test', password: 'password123' };
  await service.register({ ...input, phone: '0912345678' });
  await assert.rejects(
    service.register({ ...input, phone: '+84912345678' }),
    (error) => error.statusCode === 409 && error.code === 'ACCOUNT_ALREADY_EXISTS',
  );
  assert.deepEqual([...phones], ['+84912345678']);
});

test('email verification consumes a hashed token and starts a non-remember Member session', async () => {
  let consumed;
  const model = {
    async consumeVerificationToken(input) {
      consumed = input;
      return { user: { ...activeMember, accountStatus: 'active' }, sessionId: '55' };
    },
  };
  const service = createService({ model, mailer: {}, logger: { error() {} } });
  const result = await service.verifyEmail('b'.repeat(64), 'Browser UA');
  assert.equal(consumed.tokenHash, hashToken('b'.repeat(64)));
  assert.equal(result.sessionPolicy.idleSeconds, 7 * 86400);
  assert.equal(result.sessionPolicy.absoluteSeconds, 30 * 86400);
  assert.match(result.sessionToken, /^[a-f0-9]{64}$/);
  assert.equal(result.sessionId, '55');
});

test('expired or previously used verification tokens cannot be consumed', async () => {
  const service = createService({
    model: { async consumeVerificationToken() { return null; } },
    mailer: {},
    logger: { error() {} },
  });
  await assert.rejects(
    service.verifyEmail('c'.repeat(64)),
    (error) => error.statusCode === 400 && error.code === 'EMAIL_VERIFICATION_INVALID',
  );
});

test('login creates independent sessions with correct remember and role policies', async () => {
  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id });
  const sessions = [];
  const model = {
    async findUserByEmail() { return { ...activeMember, password_hash: passwordHash }; },
    async createSession(input) { sessions.push(input); return String(sessions.length); },
  };
  const service = createService({ model, mailer: {}, logger: { error() {} } });
  const first = await service.login({ identity: activeMember.email, password: 'password123', rememberMe: true }, 'UA 1');
  const second = await service.login({ identity: activeMember.email, password: 'password123', rememberMe: false }, 'UA 2');
  assert.equal(first.sessionPolicy.absoluteSeconds, 180 * 86400);
  assert.equal(second.sessionPolicy.absoluteSeconds, 30 * 86400);
  assert.notEqual(sessions[0].tokenHash, sessions[1].tokenHash);
  assert.notEqual(first.sessionToken, second.sessionToken);
  assert.equal(sessions[0].userAgent, 'UA 1');
  assert.equal('password_hash' in first.user, false);
});

test('login normalizes a phone identity before looking up the account', async () => {
  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id });
  let searchedPhone;
  const model = {
    async findUserByEmail() { assert.fail('Phone login must query by phone.'); },
    async findUserByPhone(phone) { searchedPhone = phone; return { ...activeMember, phone, password_hash: passwordHash }; },
    async createSession() { return '91'; },
  };
  const service = createService({ model, mailer: {}, logger: { error() {} } });
  const result = await service.login({ identity: '0912345678', password: 'password123', rememberMe: false }, 'UA');
  assert.equal(searchedPhone, '+84912345678');
  assert.equal(result.user.phone, searchedPhone);
});

test('login rejects incorrect passwords and pending users', async () => {
  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id });
  const model = {
    async findUserByEmail() { return { ...activeMember, password_hash: passwordHash }; },
    async createSession() { assert.fail('No session should be created.'); },
  };
  const service = createService({ model, mailer: {}, logger: { error() {} } });
  await assert.rejects(
    service.login({ identity: activeMember.email, password: 'wrongpass', rememberMe: false }),
    (error) => error.statusCode === 401,
  );
  model.findUserByEmail = async () => ({ ...activeMember, account_status: 'pending', password_hash: passwordHash });
  await assert.rejects(
    service.login({ identity: activeMember.email, password: 'password123', rememberMe: false }),
    (error) => error.statusCode === 401,
  );
});

test('unknown email login returns the same generic failure without querying by phone', async () => {
  let queriedEmail;
  const service = createService({
    model: {
      async findUserByEmail(email) { queriedEmail = email; return null; },
      async findUserByPhone() { assert.fail('Phone lookup must remain disabled.'); },
    },
    mailer: {},
    logger: { error() {} },
  });
  await assert.rejects(
    service.login({ identity: 'Unknown@Example.test', password: 'password123', rememberMe: false }),
    (error) => error.statusCode === 401 && error.code === 'AUTHENTICATION_FAILED',
  );
  assert.equal(queriedEmail, 'unknown@example.test');
});

test('authenticated requests hash the cookie token before loading the session', async () => {
  let storedHash;
  const service = createService({
    model: {
      async getActiveSession(tokenHash) {
        storedHash = tokenHash;
        return {
          id: '12', user: activeMember, rememberMe: true,
          idleRemainingSeconds: 100, absoluteRemainingSeconds: 60,
        };
      },
    },
    mailer: {},
    logger: { error() {} },
  });
  const sessionToken = 'd'.repeat(64);
  const auth = await service.authenticate(sessionToken);
  assert.equal(storedHash, hashToken(sessionToken));
  assert.equal(auth.cookieMaxAgeSeconds, 60);
  assert.equal('sessionToken' in auth, false);
});

test('failed email delivery returns a safe service error without exposing the token', async () => {
  let logged;
  const service = createService({
    model: {
      async createPendingMember(input) { return { id: '9', email: input.email, fullName: input.fullName }; },
    },
    mailer: {
      assertConfigured() {},
      async sendVerificationEmail({ token }) { throw Object.assign(new Error(token), { code: 'EAUTH' }); },
    },
    logger: { error(...args) { logged = args; } },
  });
  await assert.rejects(
    service.register({ name: 'Member Test', email: 'member@example.test', phone: '0901234567', password: 'password123' }),
    (error) => error.statusCode === 503 && error.code === 'EMAIL_SERVICE_UNAVAILABLE' && !error.message.includes('EAUTH'),
  );
  assert.equal(JSON.stringify(logged).includes('token'), false);
  assert.equal(JSON.stringify(logged).includes('EAUTH'), true);
});

test('verification resend response is identical for unknown email and rate-limited users', async () => {
  let lookupCount = 0;
  let sentCount = 0;
  const model = {
    async findUserByEmail() { lookupCount += 1; return null; },
    async createResentVerificationToken() { sentCount += 1; return true; },
  };
  const mailer = { assertConfigured() {}, async sendVerificationEmail() { sentCount += 1; } };
  const service = createService({ model, mailer, logger: { error() {} } });
  assert.deepEqual(await service.resendVerification('unknown@example.test'), { accepted: true });
  assert.deepEqual(await service.resendVerification('known@example.test', true), { accepted: true });
  assert.equal(lookupCount, 1);
  assert.equal(sentCount, 0);
});

test('per-user resend limit is enforced before revocation and delivery', async () => {
  let createCount = 0;
  let sentCount = 0;
  const model = {
    async findUserByEmail() {
      return { id: 42, email: 'member@example.test', full_name: 'Member Test', role: 'member', account_status: 'pending' };
    },
    async createResentVerificationToken(input) {
      assert.equal(input.maxTokensPerHour, 3);
      createCount += 1;
      return createCount > 1;
    },
  };
  const service = createService({
    model,
    mailer: { assertConfigured() {}, async sendVerificationEmail() { sentCount += 1; } },
    logger: { error() {} },
  });
  assert.deepEqual(await service.resendVerification('member@example.test'), { accepted: true });
  assert.deepEqual(await service.resendVerification('member@example.test'), { accepted: true });
  assert.equal(createCount, 2);
  assert.equal(sentCount, 1);
});

test('device management scopes every change to the authenticated account and never returns a credential', async () => {
  const calls = [];
  const model = {
    async listActiveSessions(userId) {
      calls.push(['list', userId]);
      return [{ id: 8, user_agent: 'Firefox/125.0 (X11; Linux x86_64)', created_at: null, last_activity_at: null, remember_me: false }];
    },
    async revokeSession(...args) { calls.push(['revoke', ...args]); return true; },
    async revokeOtherSessions(...args) { calls.push(['others', ...args]); return 2; },
    async revokeAllSessions(...args) { calls.push(['all', ...args]); return 3; },
  };
  const service = createService({ model, mailer: {}, logger: { error() {} } });
  const auth = { id: '7', user: { id: '42' } };
  const sessions = await service.listSessions(auth);
  assert.deepEqual(sessions[0], {
    sessionId: '8', browser: 'Firefox', operatingSystem: 'Linux',
    userAgent: 'Firefox/125.0 (X11; Linux x86_64)',
    createdAt: null, lastActivityAt: null, rememberMe: false, isCurrent: false,
  });
  assert.deepEqual(await service.revokeOneSession(auth, '8'), { revoked: true, isCurrent: false });
  assert.deepEqual(await service.logoutOthers(auth), { revokedCount: 2 });
  assert.deepEqual(await service.logoutAll(auth), { revokedCount: 3 });
  assert.deepEqual(calls, [
    ['list', '42'],
    ['revoke', '42', '8', 'user_revoked'],
    ['others', '42', '7', 'logout_others'],
    ['all', '42', 'logout_all'],
  ]);
});
