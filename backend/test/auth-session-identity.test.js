const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/database');
const { getActiveSession } = require('../src/modules/auth/auth.model');

test('authenticated user identity is the account ID even when the session ID differs', async (t) => {
  let committed = false;
  let released = false;
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { committed = true; },
    rollback: async () => {},
    release: () => { released = true; },
    execute: async (sql, params) => {
      if (sql.includes('SELECT s.id, s.user_id')) return [[{
        id: '81', user_id: '2', remember_me: 0, full_name: 'Content staff',
        email: 'staff@example.test', phone: null, role: 'product_content_staff',
        account_status: 'active', email_verified_at: new Date(),
      }]];
      if (sql.includes('UPDATE auth_sessions')) {
        assert.equal(params.at(-1), '81');
        return [{ affectedRows: 1 }];
      }
      return [[{ idle_remaining_seconds: 1800, absolute_remaining_seconds: 28800 }]];
    },
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  const session = await getActiveSession('a'.repeat(64));
  assert.equal(session.id, '81');
  assert.equal(session.user.id, '2');
  assert.equal(session.user.role, 'product_content_staff');
  assert.equal(committed, true);
  assert.equal(released, true);
});
