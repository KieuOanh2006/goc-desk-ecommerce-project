const pool = require('../../config/database');
const { createHash } = require('node:crypto');
const { getSessionPolicy } = require('./auth.security');
const { normalizeVietnamMobilePhone } = require('./phone');

async function withConnection(callback) {
  const connection = await pool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

async function withTransaction(callback) {
  return withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

function toSafeUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at,
  };
}

function isMemberRegistrationToken(token) {
  return token?.purpose === 'member_registration';
}

async function acquireRegistrationLocks(connection, names) {
  const lockNames = [...new Set(names)]
    .map((name) => `authreg:${createHash('sha256').update(name).digest('hex').slice(0, 56)}`)
    .sort();
  const acquired = [];
  try {
    for (const name of lockNames) {
      const [rows] = await connection.execute('SELECT GET_LOCK(?, 5) AS acquired', [name]);
      if (Number(rows[0]?.acquired) !== 1) {
        const error = new Error('Registration lock unavailable.');
        error.code = 'AUTH_LOCK_UNAVAILABLE';
        throw error;
      }
      acquired.push(name);
    }
  } catch (error) {
    if (!await releaseRegistrationLocks(connection, acquired)) {
      connection.destroy();
      error.connectionDestroyed = true;
    }
    throw error;
  }
  return acquired;
}

async function releaseRegistrationLocks(connection, names) {
  let allReleased = true;
  for (const name of [...names].reverse()) {
    try {
      const [rows] = await connection.execute('SELECT RELEASE_LOCK(?) AS released', [name]);
      if (Number(rows[0]?.released) !== 1) allReleased = false;
    } catch {
      allReleased = false;
    }
  }
  return allReleased;
}

async function createPendingMember({ fullName, email, phone, passwordHash, tokenHash }) {
  phone = normalizeVietnamMobilePhone(phone);
  if (!phone) {
    const error = new Error('Invalid Vietnamese mobile number.');
    error.code = 'INVALID_PHONE';
    throw error;
  }
  const connection = await pool.getConnection();
  let lockNames = [];
  let connectionDestroyed = false;
  try {
    await connection.beginTransaction();
    lockNames = await acquireRegistrationLocks(connection, [
      `gocdesk:register:email:${email}`,
      `gocdesk:register:phone:${phone}`,
    ]);
    const [duplicateRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1 FOR UPDATE',
      [email, phone],
    );
    if (duplicateRows.length > 0) {
      const error = new Error('Account identity is already registered.');
      error.code = 'AUTH_IDENTITY_CONFLICT';
      throw error;
    }

    const [insertUser] = await connection.execute(
      `INSERT INTO users
        (full_name, email, phone, password_hash, role, account_status, email_verified_at)
       VALUES (?, ?, ?, ?, 'member', 'pending', NULL)`,
      [fullName, email, phone, passwordHash],
    );
    await connection.execute(
      `INSERT INTO email_verification_tokens (user_id, purpose, token_hash, expires_at)
       VALUES (?, 'member_registration', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR))`,
      [insertUser.insertId, tokenHash],
    );
    await connection.commit();
    return { id: String(insertUser.insertId), fullName, email, phone, role: 'member', accountStatus: 'pending' };
  } catch (error) {
    if (error.connectionDestroyed) connectionDestroyed = true;
    else await connection.rollback();
    throw error;
  } finally {
    if (!connectionDestroyed) {
      const locksReleased = await releaseRegistrationLocks(connection, lockNames);
      if (locksReleased) connection.release();
      else connection.destroy();
    }
  }
}

async function findUserByEmail(email) {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT id, full_name, email, phone, password_hash, role, account_status, email_verified_at
       FROM users WHERE email = ? LIMIT 1`, [email],
    );
    return rows[0] || null;
  });
}

async function findUserByPhone(phone) {
  const normalizedPhone = normalizeVietnamMobilePhone(phone);
  if (!normalizedPhone) return null;
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT id, full_name, email, phone, password_hash, role, account_status, email_verified_at
       FROM users WHERE phone = ? LIMIT 1`, [normalizedPhone],
    );
    return rows[0] || null;
  });
}

async function createResentVerificationToken({ userId, tokenHash, maxTokensPerHour }) {
  return withTransaction(async (connection) => {
    const [userRows] = await connection.execute(
      `SELECT id FROM users
       WHERE id = ? AND role = 'member' AND account_status = 'pending' AND email_verified_at IS NULL
       LIMIT 1 FOR UPDATE`, [userId],
    );
    if (!userRows[0]) return false;
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) AS token_count FROM email_verification_tokens
       WHERE user_id = ? AND purpose = 'member_registration'
         AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR)`, [userId],
    );
    if (Number(countRows[0]?.token_count || 0) >= maxTokensPerHour) return false;
    await connection.execute(
      `UPDATE email_verification_tokens SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND purpose = 'member_registration'
         AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`, [userId],
    );
    await connection.execute(
      `INSERT INTO email_verification_tokens (user_id, purpose, token_hash, expires_at)
       VALUES (?, 'member_registration', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR))`, [userId, tokenHash],
    );
    return true;
  });
}

async function consumeVerificationToken({ tokenHash, session }) {
  return withTransaction(async (connection) => {
    const [tokenRows] = await connection.execute(
      `SELECT id, user_id, purpose FROM email_verification_tokens
       WHERE token_hash = ? AND consumed_at IS NULL AND revoked_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP LIMIT 1 FOR UPDATE`, [tokenHash],
    );
    const token = tokenRows[0];
    if (!isMemberRegistrationToken(token)) return null;

    const [userRows] = await connection.execute(
      `SELECT id, full_name, email, phone, role, account_status, email_verified_at
       FROM users WHERE id = ? LIMIT 1 FOR UPDATE`, [token.user_id],
    );
    const user = userRows[0];
    if (!user || user.account_status !== 'pending' || user.email_verified_at !== null) return null;
    if (user.role !== 'member') return null;

    await connection.execute(
      `UPDATE email_verification_tokens SET consumed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND consumed_at IS NULL`, [token.id],
    );
    await connection.execute(
      `UPDATE users SET email_verified_at = CURRENT_TIMESTAMP, account_status = 'active'
       WHERE id = ? AND account_status = 'pending'`, [user.id],
    );

    let sessionId = null;
    if (user.role === 'member' && session) {
      const [insertSession] = await connection.execute(
        `INSERT INTO auth_sessions
          (user_id, token_hash, session_data, user_agent, idle_expires_at, absolute_expires_at, remember_me)
         VALUES (?, ?, NULL, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND),
                 DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND), FALSE)`,
        [user.id, session.tokenHash, session.userAgent, session.idleSeconds, session.absoluteSeconds],
      );
      sessionId = String(insertSession.insertId);
    }
    return { user: toSafeUser({ ...user, account_status: 'active' }), sessionId };
  });
}

async function getActiveSession(tokenHash) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT s.id, s.user_id, s.remember_me, u.full_name, u.email, u.phone,
              u.role, u.account_status, u.email_verified_at
       FROM auth_sessions AS s INNER JOIN users AS u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL
         AND s.idle_expires_at > CURRENT_TIMESTAMP AND s.absolute_expires_at > CURRENT_TIMESTAMP
         AND u.account_status = 'active' AND u.email_verified_at IS NOT NULL
         AND u.role IN ('member', 'admin', 'product_content_staff', 'order_support_staff')
       LIMIT 1 FOR UPDATE`, [tokenHash],
    );
    const session = rows[0];
    if (!session) return null;
    const policy = getSessionPolicy(
      session.role,
      session.role === 'member' && Boolean(session.remember_me),
    );
    if (!policy) return null;
    await connection.execute(
      `UPDATE auth_sessions AS s
       INNER JOIN users AS u ON u.id = s.user_id
       SET s.absolute_expires_at = LEAST(
             s.absolute_expires_at,
             DATE_ADD(s.created_at, INTERVAL ? SECOND)
           ),
           s.last_activity_at = CURRENT_TIMESTAMP,
           s.idle_expires_at = LEAST(
             DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND),
             s.absolute_expires_at,
             DATE_ADD(s.created_at, INTERVAL ? SECOND)
           )
       WHERE s.id = ? AND s.revoked_at IS NULL
         AND s.idle_expires_at > CURRENT_TIMESTAMP AND s.absolute_expires_at > CURRENT_TIMESTAMP
         AND u.account_status = 'active' AND u.email_verified_at IS NOT NULL
         AND u.role IN ('member', 'admin', 'product_content_staff', 'order_support_staff')`,
      [policy.absoluteSeconds, policy.idleSeconds, policy.absoluteSeconds, session.id],
    );
    const [expiryRows] = await connection.execute(
      `SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP, idle_expires_at)) AS idle_remaining_seconds,
              GREATEST(0, TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP, absolute_expires_at)) AS absolute_remaining_seconds
       FROM auth_sessions WHERE id = ? AND revoked_at IS NULL
         AND idle_expires_at > CURRENT_TIMESTAMP AND absolute_expires_at > CURRENT_TIMESTAMP`, [session.id],
    );
    if (!expiryRows[0]) return null;
    return {
      id: String(session.id),
      user: toSafeUser(session),
      rememberMe: Boolean(session.remember_me),
      idleRemainingSeconds: Number(expiryRows[0].idle_remaining_seconds),
      absoluteRemainingSeconds: Number(expiryRows[0].absolute_remaining_seconds),
    };
  });
}

async function createSession({ userId, tokenHash, userAgent, idleSeconds, absoluteSeconds, rememberMe }) {
  return withConnection(async (connection) => {
    const [result] = await connection.execute(
      `INSERT INTO auth_sessions
        (user_id, token_hash, session_data, user_agent, idle_expires_at, absolute_expires_at, remember_me)
       VALUES (?, ?, NULL, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND),
               DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND), ?)`,
      [userId, tokenHash, userAgent, idleSeconds, absoluteSeconds, rememberMe],
    );
    return String(result.insertId);
  });
}

async function listActiveSessions(userId) {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT id, user_agent, created_at, last_activity_at, remember_me
       FROM auth_sessions WHERE user_id = ? AND revoked_at IS NULL
         AND idle_expires_at > CURRENT_TIMESTAMP AND absolute_expires_at > CURRENT_TIMESTAMP
       ORDER BY last_activity_at DESC`, [userId],
    );
    return rows;
  });
}

async function revokeSession(userId, sessionId, reason) {
  return withConnection(async (connection) => {
    const [result] = await connection.execute(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ?
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`, [reason, sessionId, userId],
    );
    return result.affectedRows > 0;
  });
}

async function revokeOtherSessions(userId, currentSessionId, reason) {
  return withConnection(async (connection) => {
    const [result] = await connection.execute(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ?
       WHERE user_id = ? AND id <> ? AND revoked_at IS NULL`, [reason, userId, currentSessionId],
    );
    return result.affectedRows;
  });
}

async function revokeAllSessions(userId, reason) {
  return withConnection(async (connection) => {
    const [result] = await connection.execute(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ?
       WHERE user_id = ? AND revoked_at IS NULL`, [reason, userId],
    );
    return result.affectedRows;
  });
}

async function revokeSessionByHash(tokenHash, reason) {
  return withConnection(async (connection) => {
    await connection.execute(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ?
       WHERE token_hash = ? AND revoked_at IS NULL`, [reason, tokenHash],
    );
  });
}

async function getPasswordCredentialByUserId(userId) {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT id, password_hash, role, account_status, email_verified_at
       FROM users WHERE id = ? AND role IN ('member', 'admin', 'product_content_staff', 'order_support_staff') LIMIT 1`, [userId],
    );
    return rows[0] || null;
  });
}

async function updatePasswordAndRevokeSessions({ userId, passwordHash }) {
  return withTransaction(async (connection) => {
    const [users] = await connection.execute(
      `SELECT id FROM users WHERE id = ? AND account_status = 'active'
         AND email_verified_at IS NOT NULL LIMIT 1 FOR UPDATE`, [userId],
    );
    if (!users[0]) return false;
    await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    await connection.execute(
      `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND consumed_at IS NULL`, [userId],
    );
    await connection.execute(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = 'password_changed'
       WHERE user_id = ? AND revoked_at IS NULL`, [userId],
    );
    return true;
  });
}

async function createPasswordResetToken({ userId, tokenHash, maxTokensPerHour, lifetimeMinutes }) {
  return withTransaction(async (connection) => {
    const [users] = await connection.execute(
      `SELECT id FROM users WHERE id = ? AND account_status = 'active'
         AND email_verified_at IS NOT NULL LIMIT 1 FOR UPDATE`, [userId],
    );
    if (!users[0]) return false;
    const [counts] = await connection.execute(
      `SELECT COUNT(*) AS token_count FROM password_reset_tokens
       WHERE user_id = ? AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR)`, [userId],
    );
    if (Number(counts[0]?.token_count || 0) >= maxTokensPerHour) return false;
    await connection.execute(
      `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND consumed_at IS NULL`, [userId],
    );
    await connection.execute(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE))`,
      [userId, tokenHash, lifetimeMinutes],
    );
    return true;
  });
}

async function revokePasswordResetTokens(userId) {
  await withConnection((connection) => connection.execute(
    `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND consumed_at IS NULL`, [userId],
  ));
}

async function consumePasswordResetToken({ tokenHash, passwordHash }) {
  return withTransaction(async (connection) => {
    const [tokens] = await connection.execute(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1 FOR UPDATE`, [tokenHash],
    );
    const token = tokens[0];
    if (!token) return null;
    const [users] = await connection.execute(
      `SELECT id, full_name, email, phone, role, account_status, email_verified_at
       FROM users WHERE id = ? AND account_status = 'active' AND email_verified_at IS NOT NULL
       LIMIT 1 FOR UPDATE`, [token.user_id],
    );
    const user = users[0];
    if (!user || !['member', 'admin', 'product_content_staff', 'order_support_staff'].includes(user.role)) return null;
    const [consumed] = await connection.execute(
      `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND consumed_at IS NULL`, [token.id],
    );
    if (consumed.affectedRows !== 1) return null;
    await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
    await connection.execute(
      `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND id <> ? AND consumed_at IS NULL`, [user.id, token.id],
    );
    await connection.execute(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = 'password_reset'
       WHERE user_id = ? AND revoked_at IS NULL`, [user.id],
    );
    return toSafeUser(user);
  });
}

module.exports = {
  createPendingMember, createResentVerificationToken, createSession,
  consumeVerificationToken, findUserByEmail, findUserByPhone,
  getActiveSession, listActiveSessions, revokeAllSessions, revokeOtherSessions,
  revokeSession, revokeSessionByHash,
  isMemberRegistrationToken,
  getPasswordCredentialByUserId,
  updatePasswordAndRevokeSessions,
  createPasswordResetToken,
  revokePasswordResetTokens,
  consumePasswordResetToken,
};
