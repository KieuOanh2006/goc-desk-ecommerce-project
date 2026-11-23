const pool = require('../../config/database');

function createLoyaltyModel(database = pool) {
  async function getOverview(userId) {
    const [rows] = await database.execute(
      `SELECT u.id, u.lifetime_qualifying_spend, u.membership_tier_id,
        (SELECT COALESCE(SUM(points_delta), 0) FROM point_transactions WHERE user_id = u.id) AS points_balance,
        t.name AS tier_name, t.description AS tier_description, t.benefits AS tier_benefits
       FROM users u LEFT JOIN membership_tiers t ON t.id = u.membership_tier_id AND t.is_active = TRUE
       WHERE u.id = ? AND u.role = 'member' AND u.account_status = 'active' LIMIT 1`, [userId],
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      pointsBalance: String(row.points_balance || 0),
      lifetimeQualifyingSpend: String(row.lifetime_qualifying_spend || 0),
      tier: row.tier_name ? { name: row.tier_name, description: row.tier_description, benefits: row.tier_benefits } : null,
    };
  }

  async function listTransactions(userId) {
    const [rows] = await database.execute(
      `SELECT id, transaction_type, points_delta, description, created_at
       FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`, [userId],
    );
    return rows.map((row) => ({ id: String(row.id), type: row.transaction_type, pointsDelta: String(row.points_delta), description: row.description, createdAt: row.created_at }));
  }

  async function listRedemptions(userId) {
    const [rows] = await database.execute(
      `SELECT rr.id, rr.reward_id, rr.points_spent, rr.status, rr.redeemed_at, rr.fulfilled_at, r.name AS reward_name
       FROM reward_redemptions rr JOIN rewards r ON r.id = rr.reward_id
       WHERE rr.user_id = ? ORDER BY rr.redeemed_at DESC, rr.id DESC LIMIT 100`, [userId],
    );
    return rows.map((row) => ({ id: String(row.id), rewardId: String(row.reward_id), rewardName: row.reward_name, pointsSpent: String(row.points_spent), status: row.status, redeemedAt: row.redeemed_at, fulfilledAt: row.fulfilled_at }));
  }

  async function listTiers() {
    const [rows] = await database.execute(
      `SELECT id, name, description, qualifying_spend_threshold, benefits FROM membership_tiers
       WHERE is_active = TRUE ORDER BY tier_rank ASC, id ASC`,
    );
    return rows.map((row) => ({ id: String(row.id), name: row.name, description: row.description, qualifyingSpendThreshold: row.qualifying_spend_threshold == null ? null : String(row.qualifying_spend_threshold), benefits: row.benefits }));
  }

  async function listRewards() {
    const [rows] = await database.execute(
      `SELECT id, name, description, reward_type, points_cost FROM rewards
       WHERE is_active = TRUE ORDER BY points_cost ASC, id ASC`,
    );
    return rows.map((row) => ({ id: String(row.id), name: row.name, description: row.description, type: row.reward_type, pointsCost: String(row.points_cost) }));
  }

  async function redeem(userId, rewardId) {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const [users] = await connection.execute(
        `SELECT id FROM users WHERE id = ? AND role = 'member' AND account_status = 'active' LIMIT 1 FOR UPDATE`, [userId],
      );
      if (!users[0]) return await rollbackResult(connection, null);
      const [rewards] = await connection.execute(
        `SELECT id, name, voucher_id, points_cost FROM rewards WHERE id = ? AND is_active = TRUE LIMIT 1 FOR UPDATE`, [rewardId],
      );
      const reward = rewards[0];
      if (!reward) return await rollbackResult(connection, { error: 'REWARD_NOT_FOUND' });
      const [balances] = await connection.execute(
        `SELECT COALESCE(SUM(points_delta), 0) AS balance FROM point_transactions WHERE user_id = ?`, [userId],
      );
      const balance = BigInt(balances[0]?.balance || 0);
      const cost = BigInt(reward.points_cost);
      if (cost > 9223372036854775807n) return await rollbackResult(connection, { error: 'REWARD_NOT_FOUND' });
      if (balance < cost) return await rollbackResult(connection, { error: 'INSUFFICIENT_POINTS' });
      const [inserted] = await connection.execute(
        `INSERT INTO reward_redemptions (user_id, reward_id, voucher_id, points_spent, status)
         VALUES (?, ?, ?, ?, 'pending')`, [userId, reward.id, reward.voucher_id, reward.points_cost],
      );
      await connection.execute(
        `INSERT INTO point_transactions (user_id, reward_redemption_id, transaction_type, points_delta, description)
         VALUES (?, ?, 'redeem', ?, ?)`, [userId, inserted.insertId, (-cost).toString(), `Đổi phần thưởng: ${reward.name}`],
      );
      await connection.execute('UPDATE users SET points_balance = ? WHERE id = ?', [String(balance - cost), userId]);
      await connection.commit();
      return { id: String(inserted.insertId), rewardId: String(reward.id), rewardName: reward.name, pointsSpent: String(cost), status: 'pending' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  }

  async function rollbackResult(connection, result) { await connection.rollback(); return result; }
  return { getOverview, listRedemptions, listRewards, listTiers, listTransactions, redeem };
}

module.exports = { createLoyaltyModel };
