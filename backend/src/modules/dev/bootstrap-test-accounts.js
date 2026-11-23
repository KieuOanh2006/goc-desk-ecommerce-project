const argon2 = require('argon2');

const TEST_ACCOUNTS = Object.freeze([
  Object.freeze({ fullName: 'Admin GÓC Desk', email: 'admin@example.com', role: 'admin', passwordEnv: 'BOOTSTRAP_ADMIN_PASSWORD' }),
  Object.freeze({ fullName: 'Nhân viên nội dung', email: 'content.staff@example.com', role: 'product_content_staff', passwordEnv: 'BOOTSTRAP_CONTENT_STAFF_PASSWORD' }),
  Object.freeze({ fullName: 'Nhân viên hỗ trợ đơn hàng', email: 'order.staff@example.com', role: 'order_support_staff', passwordEnv: 'BOOTSTRAP_ORDER_STAFF_PASSWORD' }),
]);

function createBootstrapError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function bootstrapTestAccounts({ env = process.env, pool, passwordHasher = argon2, accounts = TEST_ACCOUNTS } = {}) {
  if (env.NODE_ENV !== 'development') {
    throw createBootstrapError('BOOTSTRAP_DEVELOPMENT_ONLY', 'Test-account bootstrap is available only when NODE_ENV=development.');
  }
  if (!pool || typeof pool.getConnection !== 'function') {
    throw createBootstrapError('BOOTSTRAP_DATABASE_REQUIRED', 'A database connection pool is required.');
  }

  const missing = accounts.filter((account) => typeof env[account.passwordEnv] !== 'string' || !env[account.passwordEnv]);
  if (missing.length) {
    throw createBootstrapError('BOOTSTRAP_PASSWORDS_REQUIRED', `Set these process environment variables before running: ${missing.map((account) => account.passwordEnv).join(', ')}.`);
  }

  const prepared = await Promise.all(accounts.map(async (account) => ({
    fullName: account.fullName,
    email: account.email,
    role: account.role,
    passwordHash: await passwordHasher.hash(env[account.passwordEnv], { type: passwordHasher.argon2id }),
  })));

  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const emails = prepared.map((account) => account.email);
    const placeholders = emails.map(() => '?').join(', ');
    const [existingRows] = await connection.execute(
      `SELECT email FROM users WHERE email IN (${placeholders}) FOR UPDATE`, emails,
    );
    if (existingRows.length) {
      const existing = new Set(existingRows.map((row) => String(row.email).toLowerCase()));
      const collisions = accounts.filter((account) => existing.has(account.email.toLowerCase()));
      throw createBootstrapError(
        'BOOTSTRAP_EMAIL_CONFLICT',
        `No accounts were created. These test account emails already exist: ${collisions.map((account) => `${account.fullName} (${account.email})`).join(', ')}.`,
      );
    }

    for (const account of prepared) {
      await connection.execute(
        `INSERT INTO users
          (full_name, email, phone, password_hash, role, account_status, email_verified_at)
         VALUES (?, ?, NULL, ?, ?, 'active', CURRENT_TIMESTAMP)`,
        [account.fullName, account.email, account.passwordHash, account.role],
      );
    }
    await connection.commit();
    transactionStarted = false;
    return { created: prepared.map(({ fullName, email, role }) => ({ fullName, email, role })) };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { TEST_ACCOUNTS, bootstrapTestAccounts };
