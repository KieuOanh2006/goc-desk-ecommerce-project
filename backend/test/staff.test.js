const test = require('node:test');
const assert = require('node:assert/strict');
const { createService } = require('../src/modules/admin/staff.service');
const { createStaffModel } = require('../src/modules/admin/staff.model');
const { createStaffSchema, acceptInvitationSchema } = require('../src/modules/admin/staff.schemas');
const { hashToken } = require('../src/modules/auth/auth.security');
const emailService = require('../src/modules/auth/email.service');
const nodemailer = require('nodemailer');

const fakeLogger = { error() { assert.fail('Email errors must not log secrets or raw error messages.'); } };

test('staff invitation creation accepts only staff roles and stores only token and initial password hashes', async () => {
  const invalidAdmin = createStaffSchema.safeParse({ fullName: 'A', email: 'a@example.test', role: 'admin' });
  assert.equal(invalidAdmin.success, false);
  const input = createStaffSchema.parse({ fullName: '  Nhân viên  ', email: 'STAFF@example.test', role: 'product_content_staff' });
  assert.deepEqual(input, { fullName: 'Nhân viên', email: 'staff@example.test', role: 'product_content_staff' });

  let inserted;
  let emailMessage;
  const service = createService({
    model: {
      async createPendingStaff(record) { inserted = record; return { id: '19', ...input, accountStatus: 'pending' }; },
      async revokePendingStaffInvitation() {},
    },
    mailer: {
      assertConfigured() {},
      async sendStaffInvitationEmail(message) { emailMessage = message; },
    },
    logger: fakeLogger,
    async hashPassword(raw) { return `hashed:${raw}`; },
  });
  const created = await service.createStaff(input);
  assert.equal(created.id, '19');
  assert.equal(created.accountStatus, 'pending');
  assert.equal(created.passwordHash, undefined);
  assert.equal(inserted.passwordHash.startsWith('hashed:'), true);
  assert.match(emailMessage.token, /^[a-f0-9]{64}$/);
  assert.equal(inserted.tokenHash, hashToken(emailMessage.token));
  assert.equal(JSON.stringify(created).includes(emailMessage.token), false);
});

test('staff invitation resend rotates hashes and acceptance consumes the token once', async () => {
  const oldTokenHash = 'old-hash';
  const issuedHashes = [];
  const messages = [];
  let accepted = false;
  const user = { id: '20', full_name: 'Staff User', email: 'staff@example.test', role: 'order_support_staff', account_status: 'pending' };
  const service = createService({
    model: {
      async getPendingInvitationTarget() { return user; },
      async createResentStaffInvitation({ tokenHash }) { issuedHashes.push(tokenHash); return true; },
      async revokePendingStaffInvitation() {},
      async acceptStaffInvitation({ tokenHash, passwordHash }) {
        if (tokenHash !== issuedHashes.at(-1)) return null;
        assert.equal(passwordHash, 'password-hash');
        if (accepted) return null;
        accepted = true;
        return { id: '20', fullName: user.full_name, email: user.email, role: user.role, accountStatus: 'active' };
      },
    },
    mailer: { assertConfigured() {}, async sendStaffInvitationEmail(message) { messages.push(message); } },
    logger: fakeLogger,
    async hashPassword() { return 'password-hash'; },
  });
  const result = await service.resendInvitation('20');
  assert.equal(result.accepted, true);
  assert.notEqual(issuedHashes[0], oldTokenHash);
  assert.equal(issuedHashes[0], hashToken(messages[0].token));
  assert.match(messages[0].token, /^[a-f0-9]{64}$/);

  const acceptedUser = await service.acceptInvitation({ token: messages[0].token, password: 'first-password' });
  assert.equal(acceptedUser.accountStatus, 'active');
  assert.equal(acceptedUser.role, 'order_support_staff');
  await assert.rejects(service.acceptInvitation({ token: messages[0].token, password: 'first-password' }), (error) => error.code === 'STAFF_INVITATION_INVALID');
  await assert.rejects(service.acceptInvitation({ token: 'a'.repeat(64), password: 'first-password' }), (error) => error.code === 'STAFF_INVITATION_INVALID');
});

test('invitation acceptance enforces password length and opaque token format', () => {
  assert.equal(acceptInvitationSchema.safeParse({ token: 'a'.repeat(64), password: 'password123' }).success, true);
  assert.equal(acceptInvitationSchema.safeParse({ token: 'raw-token', password: 'password123' }).success, false);
  assert.equal(acceptInvitationSchema.safeParse({ token: 'a'.repeat(64), password: 'short' }).success, false);
});

test('staff invitation email reuses configured SMTP and includes the 24-hour acceptance link', async () => {
  const variableNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'SMTP_FROM', 'CLIENT_ORIGIN', 'EMAIL_VERIFICATION_URL', 'NODE_ENV'];
  const previous = new Map(variableNames.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_SECURE: 'false',
    SMTP_USER: 'mailer@example.test', SMTP_PASSWORD: 'abcdefghijklmnop',
    MAIL_FROM: 'GÓC Desk <mailer@example.test>', CLIENT_ORIGIN: 'http://127.0.0.1:5500', NODE_ENV: 'development',
  });
  delete process.env.SMTP_FROM;
  delete process.env.EMAIL_VERIFICATION_URL;
  const originalCreateTransport = nodemailer.createTransport;
  let sent;
  nodemailer.createTransport = () => ({ async sendMail(message) { sent = message; }, close() {} });
  try {
    const token = 'c'.repeat(64);
    await emailService.sendStaffInvitationEmail({ email: 'staff@example.test', fullName: 'Staff', token });
    assert.equal(sent.to, 'staff@example.test');
    assert.match(sent.subject, /lời mời/i);
    assert.match(sent.text, new RegExp(`account\\.html\\?invitation=${token}`));
    assert.equal(sent.text.includes('24 giờ'), true);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

function fakePool({ target, admins = [], statements = [], updateError } = {}) {
  const connection = {
    async beginTransaction() { statements.push('BEGIN'); },
    async commit() { statements.push('COMMIT'); },
    async rollback() { statements.push('ROLLBACK'); },
    release() {},
    async execute(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      statements.push(normalized);
      if (normalized.startsWith('SELECT id FROM users WHERE role =')) return [admins.map((id) => ({ id }))];
      if (normalized.startsWith('SELECT id, full_name, email, phone, role, account_status')) return [[target]];
      if (normalized.startsWith('UPDATE users SET account_status')) return [{ affectedRows: 1 }];
      if (normalized.startsWith('UPDATE users SET role')) {
        if (updateError) throw updateError;
        return [{ affectedRows: 1 }];
      }
      if (normalized.startsWith('UPDATE auth_sessions')) return [{ affectedRows: 2 }];
      throw new Error(`Unexpected SQL statement: ${normalized}`);
    },
  };
  return { getConnection: async () => connection, execute: connection.execute };
}

test('locking a user revokes all active sessions in the same transaction', async () => {
  const statements = [];
  const model = createStaffModel(fakePool({
    target: { id: 8, full_name: 'Member', email: 'm@example.test', phone: null, role: 'member', account_status: 'active', email_verified_at: new Date(), created_at: new Date() },
    admins: [1], statements,
  }));
  const result = await model.updateUserStatus({ actorId: '1', userId: '8', accountStatus: 'locked' });
  assert.equal(result.accountStatus, 'locked');
  assert.equal(statements.some((sql) => sql.includes('UPDATE auth_sessions') && sql.includes("'account_locked'")), true);
  assert.equal(statements.at(-1), 'COMMIT');
});

test('model refuses to demote the last active Admin before any role update', async () => {
  const statements = [];
  const model = createStaffModel(fakePool({
    target: { id: 1, full_name: 'Admin', email: 'a@example.test', phone: null, role: 'admin', account_status: 'active', email_verified_at: new Date(), created_at: new Date() },
    admins: [1], statements,
  }));
  await assert.rejects(model.updateUserRole({ actorId: '2', userId: '1', role: 'member' }), (error) => error.code === 'LAST_ACTIVE_ADMIN');
  assert.equal(statements.some((sql) => sql.startsWith('UPDATE users SET role')), false);
  assert.equal(statements.at(-1), 'ROLLBACK');
});

function invitationModelPool({ tokenUsable = true, userRole = 'product_content_staff' } = {}) {
  const state = { consumed: false, activated: false, passwordHash: null, queries: [] };
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      state.queries.push(normalized);
      if (normalized.startsWith('SELECT id, user_id FROM email_verification_tokens')) {
        return [tokenUsable && !state.consumed ? [{ id: 4, user_id: 27 }] : []];
      }
      if (normalized.startsWith('SELECT id, full_name, email, phone, role, account_status')) {
        return [[{ id: 27, full_name: 'Staff', email: 'staff@example.test', phone: null, role: userRole, account_status: 'pending', email_verified_at: null }]];
      }
      if (normalized.startsWith('UPDATE email_verification_tokens SET consumed_at')) {
        if (state.consumed) return [{ affectedRows: 0 }];
        state.consumed = true;
        return [{ affectedRows: 1 }];
      }
      if (normalized.startsWith('UPDATE users SET password_hash')) {
        state.passwordHash = params[0];
        state.activated = true;
        return [{ affectedRows: 1 }];
      }
      if (normalized.startsWith('UPDATE email_verification_tokens SET revoked_at')) return [{ affectedRows: 0 }];
      throw new Error(`Unexpected SQL statement: ${normalized}`);
    },
  };
  return { pool: { getConnection: async () => connection }, state };
}

test('database invitation acceptance requires an unexpired, unrevoked, unused staff-purpose token', async () => {
  const active = invitationModelPool();
  const model = createStaffModel(active.pool);
  const result = await model.acceptStaffInvitation({ tokenHash: 'only-the-hash-is-queried', passwordHash: 'argon-hash' });
  assert.equal(result.accountStatus, 'active');
  assert.equal(result.role, 'product_content_staff');
  assert.equal(active.state.activated, true);
  assert.equal(active.state.passwordHash, 'argon-hash');
  assert.match(active.state.queries[0], /purpose = 'staff_invitation'/);
  assert.match(active.state.queries[0], /consumed_at IS NULL/);
  assert.match(active.state.queries[0], /revoked_at IS NULL/);
  assert.match(active.state.queries[0], /expires_at > CURRENT_TIMESTAMP/);
  assert.equal(await model.acceptStaffInvitation({ tokenHash: 'only-the-hash-is-queried', passwordHash: 'argon-hash' }), null);

  const expiredOrRevoked = invitationModelPool({ tokenUsable: false });
  assert.equal(await createStaffModel(expiredOrRevoked.pool).acceptStaffInvitation({ tokenHash: 'hash', passwordHash: 'hash' }), null);
  const adminRole = invitationModelPool({ userRole: 'admin' });
  assert.equal(await createStaffModel(adminRole.pool).acceptStaffInvitation({ tokenHash: 'hash', passwordHash: 'hash' }), null);
  assert.equal(adminRole.state.activated, false);
});

test('database staff invitation creation stores a pending account and a 24-hour token hash', async () => {
  const statements = [];
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async execute(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      statements.push({ sql: normalized, params });
      if (normalized.startsWith('INSERT INTO users')) return [{ insertId: 29 }];
      if (normalized.startsWith('INSERT INTO email_verification_tokens')) return [{ insertId: 31 }];
      throw new Error(`Unexpected SQL statement: ${normalized}`);
    },
  };
  const model = createStaffModel({ getConnection: async () => connection });
  const result = await model.createPendingStaff({
    fullName: 'New Staff', email: 'new-staff@example.test', role: 'product_content_staff',
    passwordHash: 'argon-hash', tokenHash: 'a'.repeat(64),
  });
  assert.equal(result.accountStatus, 'pending');
  assert.match(statements[0].sql, /'pending', NULL/);
  assert.equal(statements[0].params.includes('argon-hash'), true);
  assert.match(statements[1].sql, /'staff_invitation'/);
  assert.match(statements[1].sql, /INTERVAL 24 HOUR/);
  assert.equal(statements[1].params.includes('a'.repeat(64)), true);
});
