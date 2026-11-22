const test = require('node:test');
const assert = require('node:assert/strict');
const argon2 = require('argon2');
const { TEST_ACCOUNTS, bootstrapTestAccounts } = require('../src/modules/dev/bootstrap-test-accounts');
const { createService: createAuthService } = require('../src/modules/auth/auth.service');

function fakePool({ existing = [], failInsertAt = -1 } = {}) {
  const state = { rows: [], committed: false, rolledBack: false, released: false, insertCount: 0 };
  const connection = {
    async beginTransaction() {},
    async execute(sql, params) {
      if (sql.startsWith('SELECT email FROM users')) return [existing.map((email) => ({ email }))];
      if (sql.startsWith('INSERT INTO users')) {
        const index = state.insertCount++;
        if (index === failInsertAt) throw Object.assign(new Error('test insert failure'), { code: 'TEST_INSERT_FAILURE' });
        state.rows.push({ id: state.rows.length + 1, fullName: params[0], email: params[1], phone: null, password_hash: params[2], role: params[3], account_status: 'active', email_verified_at: new Date() });
        return [{ affectedRows: 1 }];
      }
      throw new Error('Unexpected SQL in test fixture.');
    },
    async commit() { state.committed = true; },
    async rollback() { state.rolledBack = true; state.rows = []; },
    release() { state.released = true; },
  };
  return { pool: { async getConnection() { return connection; } }, state };
}

const testCredentials = {
  NODE_ENV: 'development',
  BOOTSTRAP_ADMIN_PASSWORD: 'fixture-admin-password',
  BOOTSTRAP_CONTENT_STAFF_PASSWORD: 'fixture-content-password',
  BOOTSTRAP_ORDER_STAFF_PASSWORD: 'fixture-order-password',
};

test('bootstrap rejects every non-development environment before database access', async () => {
  let connected = false;
  await assert.rejects(
    bootstrapTestAccounts({ env: { NODE_ENV: 'production' }, pool: { async getConnection() { connected = true; } } }),
    (error) => error.code === 'BOOTSTRAP_DEVELOPMENT_ONLY',
  );
  assert.equal(connected, false);
});

test('bootstrap atomically creates all three active, verified roles with Argon2id hashes and Auth login works', async () => {
  const { pool, state } = fakePool();
  const result = await bootstrapTestAccounts({ env: testCredentials, pool });
  assert.equal(result.created.length, 3);
  assert.equal(state.committed, true);
  assert.equal(state.rolledBack, false);
  assert.equal(state.released, true);
  assert.deepEqual(state.rows.map((row) => [row.email, row.role]), TEST_ACCOUNTS.map((account) => [account.email, account.role]));
  for (let index = 0; index < state.rows.length; index += 1) {
    const row = state.rows[index];
    assert.equal(row.account_status, 'active');
    assert.ok(row.email_verified_at);
    assert.equal(row.phone, null);
    assert.match(row.password_hash, /^\$argon2id\$/);
    assert.equal(await argon2.verify(row.password_hash, testCredentials[TEST_ACCOUNTS[index].passwordEnv]), true);
  }

  const sessionUsers = [];
  const authModel = {
    async findUserByEmail(email) { return state.rows.find((row) => row.email === email) || null; },
    async createSession({ userId }) { sessionUsers.push(String(userId)); return `session-${userId}`; },
  };
  const auth = createAuthService({ model: authModel });
  for (const [index, account] of TEST_ACCOUNTS.entries()) {
    const result = await auth.login({ identity: account.email, password: testCredentials[account.passwordEnv], rememberMe: false }, 'test agent');
    assert.equal(result.user.role, account.role);
    assert.equal(result.user.accountStatus, 'active');
    assert.match(result.sessionToken, /^[a-f0-9]{64}$/);
  }
  assert.deepEqual(sessionUsers, ['1', '2', '3']);
});

test('bootstrap reports existing account email and does not modify or replace it', async () => {
  const { pool, state } = fakePool({ existing: ['content.staff@example.com'] });
  await assert.rejects(bootstrapTestAccounts({ env: testCredentials, pool }), (error) => {
    assert.equal(error.code, 'BOOTSTRAP_EMAIL_CONFLICT');
    assert.match(error.message, /Nhân viên nội dung \(content\.staff@example\.com\)/);
    return true;
  });
  assert.equal(state.rolledBack, true);
  assert.equal(state.rows.length, 0);
  assert.equal(state.insertCount, 0);
});

test('bootstrap rolls back all inserts if one insert fails', async () => {
  const { pool, state } = fakePool({ failInsertAt: 1 });
  await assert.rejects(bootstrapTestAccounts({ env: testCredentials, pool }), (error) => error.code === 'TEST_INSERT_FAILURE');
  assert.equal(state.rolledBack, true);
  assert.equal(state.committed, false);
  assert.equal(state.rows.length, 0);
  assert.equal(state.released, true);
});

test('bootstrap requires process environment passwords without displaying their values', async () => {
  const { pool } = fakePool();
  await assert.rejects(bootstrapTestAccounts({ env: { NODE_ENV: 'development' }, pool }), (error) => {
    assert.equal(error.code, 'BOOTSTRAP_PASSWORDS_REQUIRED');
    assert.match(error.message, /BOOTSTRAP_ADMIN_PASSWORD/);
    assert.doesNotMatch(error.message, /fixture-/);
    return true;
  });
});
