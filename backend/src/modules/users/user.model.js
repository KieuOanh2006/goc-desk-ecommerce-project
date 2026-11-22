const defaultPool = require('../../config/database');
const { normalizeVietnamMobilePhone } = require('../auth/phone');

function profileFromRow(row) {
  if (!row) return null;
  return { id: String(row.id), fullName: row.full_name, email: row.email, phone: row.phone };
}

function addressFromRow(row) {
  return {
    id: String(row.id),
    recipientName: row.recipient_name,
    phone: row.phone,
    addressLine: row.address_line,
    ward: row.ward,
    district: row.district,
    province: row.province,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createUserModel(pool = defaultPool) {
  async function withTransaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
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

  async function getProfile(userId) {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone FROM users WHERE id = ? AND role = \'member\' AND account_status = \'active\' LIMIT 1',
      [userId],
    );
    return profileFromRow(rows[0]);
  }

  async function updateProfile(userId, patch) {
    const assignments = [];
    const values = [];
    if (Object.hasOwn(patch, 'fullName')) { assignments.push('full_name = ?'); values.push(patch.fullName); }
    if (Object.hasOwn(patch, 'phone')) {
      const phone = normalizeVietnamMobilePhone(patch.phone);
      if (!phone) {
        const error = new Error('Invalid Vietnamese mobile number.');
        error.code = 'INVALID_PHONE';
        throw error;
      }
      assignments.push('phone = ?');
      values.push(phone);
    }
    values.push(userId);
    try {
      await pool.execute(
        `UPDATE users SET ${assignments.join(', ')} WHERE id = ? AND role = 'member' AND account_status = 'active'`, values,
      );
      return getProfile(userId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') error.code = 'PROFILE_PHONE_CONFLICT';
      throw error;
    }
  }

  async function listAddresses(userId) {
    const [rows] = await pool.execute(
      `SELECT id, recipient_name, phone, address_line, ward, district, province,
              is_default, created_at, updated_at
       FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC, id DESC`, [userId],
    );
    return rows.map(addressFromRow);
  }

  async function lockMember(connection, userId) {
    const [rows] = await connection.execute(
      `SELECT id FROM users WHERE id = ? AND role = 'member' AND account_status = 'active' LIMIT 1 FOR UPDATE`,
      [userId],
    );
    return Boolean(rows[0]);
  }

  async function createAddress(userId, address) {
    return withTransaction(async (connection) => {
      if (!await lockMember(connection, userId)) return null;
      if (address.isDefault) {
        await connection.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
      }
      const [result] = await connection.execute(
        `INSERT INTO user_addresses
          (user_id, recipient_name, phone, address_line, ward, district, province, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, address.recipientName, address.phone, address.addressLine, address.ward || null,
          address.district, address.province, address.isDefault],
      );
      const [rows] = await connection.execute(
        `SELECT id, recipient_name, phone, address_line, ward, district, province,
                is_default, created_at, updated_at
         FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1`, [result.insertId, userId],
      );
      return addressFromRow(rows[0]);
    });
  }

  async function updateAddress(userId, addressId, address) {
    return withTransaction(async (connection) => {
      if (!await lockMember(connection, userId)) return null;
      const [existingRows] = await connection.execute(
        `SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE`, [addressId, userId],
      );
      if (!existingRows[0]) return null;
      if (address.isDefault) {
        await connection.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id <> ?', [userId, addressId]);
      }
      await connection.execute(
        `UPDATE user_addresses SET recipient_name = ?, phone = ?, address_line = ?, ward = ?,
           district = ?, province = ?, is_default = ? WHERE id = ? AND user_id = ?`,
        [address.recipientName, address.phone, address.addressLine, address.ward || null,
          address.district, address.province, address.isDefault, addressId, userId],
      );
      const [rows] = await connection.execute(
        `SELECT id, recipient_name, phone, address_line, ward, district, province,
                is_default, created_at, updated_at
         FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1`, [addressId, userId],
      );
      return addressFromRow(rows[0]);
    });
  }

  async function deleteAddress(userId, addressId) {
    return withTransaction(async (connection) => {
      if (!await lockMember(connection, userId)) return false;
      const [result] = await connection.execute(
        'DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId],
      );
      return result.affectedRows === 1;
    });
  }

  return { createAddress, deleteAddress, getProfile, listAddresses, updateAddress, updateProfile };
}

module.exports = { addressFromRow, createUserModel, profileFromRow };
