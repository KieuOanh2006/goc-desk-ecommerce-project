const defaultPool = require('../../config/database');
const { createApiError } = require('../../middlewares/error-handler');
const { assertRoleChangePermitted, assertStatusChangePermitted } = require('./staff.policy');

const STAFF_ROLES = ['product_content_staff', 'order_support_staff'];

function safeStaff(row) {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
  };
}

function createStaffModel(pool = defaultPool) {
  async function withTransaction(callback) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async function lockActiveAdmins(connection) {
    const [rows] = await connection.execute(
      `SELECT id FROM users WHERE role = 'admin' AND account_status = 'active'
       ORDER BY id FOR UPDATE`,
    );
    return rows.map((row) => String(row.id));
  }

  async function listStaff() {
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, role, account_status, email_verified_at, created_at
       FROM users WHERE role IN (?, ?) ORDER BY created_at DESC, id DESC`, STAFF_ROLES,
    );
    return rows.map(safeStaff);
  }

  async function createPendingStaff({ fullName, email, role, passwordHash, tokenHash }) {
    return withTransaction(async (connection) => {
      const [result] = await connection.execute(
        `INSERT INTO users
          (full_name, email, phone, password_hash, role, account_status, email_verified_at)
         VALUES (?, ?, NULL, ?, ?, 'pending', NULL)`,
        [fullName, email, passwordHash, role],
      );
      await connection.execute(
        `INSERT INTO email_verification_tokens (user_id, purpose, token_hash, expires_at)
         VALUES (?, 'staff_invitation', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR))`,
        [result.insertId, tokenHash],
      );
      return { id: String(result.insertId), fullName, email, role, accountStatus: 'pending' };
    });
  }

  async function getPendingInvitationTarget(userId) {
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, role, account_status, email_verified_at
       FROM users WHERE id = ? LIMIT 1`, [userId],
    );
    const user = rows[0];
    if (!user || !STAFF_ROLES.includes(user.role) || user.account_status !== 'pending' || user.email_verified_at) {
      return null;
    }
    return user;
  }

  async function createResentStaffInvitation({ userId, tokenHash, maxTokensPerHour }) {
    return withTransaction(async (connection) => {
      const [userRows] = await connection.execute(
        `SELECT id FROM users WHERE id = ? AND role IN (?, ?)
           AND account_status = 'pending' AND email_verified_at IS NULL
         LIMIT 1 FOR UPDATE`, [userId, ...STAFF_ROLES],
      );
      if (!userRows[0]) return false;
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS token_count FROM email_verification_tokens
         WHERE user_id = ? AND purpose = 'staff_invitation'
           AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR)`, [userId],
      );
      if (Number(countRows[0]?.token_count || 0) >= maxTokensPerHour) return false;
      await connection.execute(
        `UPDATE email_verification_tokens SET revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND purpose = 'staff_invitation'
           AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`, [userId],
      );
      await connection.execute(
        `INSERT INTO email_verification_tokens (user_id, purpose, token_hash, expires_at)
         VALUES (?, 'staff_invitation', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR))`,
        [userId, tokenHash],
      );
      return true;
    });
  }

  async function revokePendingStaffInvitation(userId) {
    await pool.execute(
      `UPDATE email_verification_tokens SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND purpose = 'staff_invitation'
         AND consumed_at IS NULL AND revoked_at IS NULL`, [userId],
    );
  }

  async function acceptStaffInvitation({ tokenHash, passwordHash }) {
    return withTransaction(async (connection) => {
      const [tokenRows] = await connection.execute(
        `SELECT id, user_id FROM email_verification_tokens
         WHERE token_hash = ? AND purpose = 'staff_invitation'
           AND consumed_at IS NULL AND revoked_at IS NULL
           AND expires_at > CURRENT_TIMESTAMP LIMIT 1 FOR UPDATE`, [tokenHash],
      );
      const token = tokenRows[0];
      if (!token) return null;

      const [userRows] = await connection.execute(
        `SELECT id, full_name, email, phone, role, account_status, email_verified_at
         FROM users WHERE id = ? LIMIT 1 FOR UPDATE`, [token.user_id],
      );
      const user = userRows[0];
      if (!user || !STAFF_ROLES.includes(user.role)
        || user.account_status !== 'pending' || user.email_verified_at !== null) return null;

      const [consumed] = await connection.execute(
        `UPDATE email_verification_tokens SET consumed_at = CURRENT_TIMESTAMP
         WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL`, [token.id],
      );
      if (consumed.affectedRows !== 1) return null;
      await connection.execute(
        `UPDATE users SET password_hash = ?, email_verified_at = CURRENT_TIMESTAMP,
           account_status = 'active' WHERE id = ? AND account_status = 'pending'`,
        [passwordHash, user.id],
      );
      await connection.execute(
        `UPDATE email_verification_tokens SET revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND purpose = 'staff_invitation'
           AND id <> ? AND consumed_at IS NULL AND revoked_at IS NULL`, [user.id, token.id],
      );
      return {
        id: String(user.id), fullName: user.full_name, email: user.email, phone: user.phone,
        role: user.role, accountStatus: 'active', emailVerifiedAt: new Date().toISOString(),
      };
    });
  }

  async function findUserForAdminChange(connection, userId) {
    const [rows] = await connection.execute(
      `SELECT id, full_name, email, phone, role, account_status, email_verified_at, created_at
       FROM users WHERE id = ? LIMIT 1 FOR UPDATE`, [userId],
    );
    if (!rows[0]) throw createApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
    return rows[0];
  }

  async function updateUserRole({ actorId, userId, role }) {
    return withTransaction(async (connection) => {
      const activeAdminIds = await lockActiveAdmins(connection);
      const target = await findUserForAdminChange(connection, userId);
      assertRoleChangePermitted({
        actorId, targetId: target.id, targetRole: target.role, targetStatus: target.account_status,
        nextRole: role, activeAdminIds,
      });
      if (target.role !== role) {
        await connection.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
      }
      return safeStaff({ ...target, role });
    });
  }

  async function updateUserStatus({ actorId, userId, accountStatus }) {
    return withTransaction(async (connection) => {
      const activeAdminIds = await lockActiveAdmins(connection);
      const target = await findUserForAdminChange(connection, userId);
      assertStatusChangePermitted({
        actorId, targetId: target.id, targetRole: target.role, targetStatus: target.account_status,
        nextStatus: accountStatus, activeAdminIds, emailVerifiedAt: target.email_verified_at,
      });
      if (target.account_status !== accountStatus) {
        await connection.execute('UPDATE users SET account_status = ? WHERE id = ?', [accountStatus, userId]);
        if (accountStatus === 'locked') {
          await connection.execute(
            `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = 'account_locked'
             WHERE user_id = ? AND revoked_at IS NULL`, [userId],
          );
        }
      }
      return safeStaff({ ...target, account_status: accountStatus });
    });
  }

  return {
    acceptStaffInvitation,
    createPendingStaff,
    createResentStaffInvitation,
    getPendingInvitationTarget,
    listStaff,
    revokePendingStaffInvitation,
    updateUserRole,
    updateUserStatus,
  };
}

module.exports = { createStaffModel, safeStaff };
