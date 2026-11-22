const { createApiError } = require('../../middlewares/error-handler');
const defaultModel = require('./loyalty.model').createLoyaltyModel();
function createService({ model = defaultModel } = {}) {
  async function overview(userId) {
    const data = await model.getOverview(userId);
    if (!data) throw createApiError(404, 'MEMBER_NOT_FOUND', 'Không tìm thấy tài khoản thành viên.');
    return data;
  }
  async function redeem(userId, rewardId) {
    const result = await model.redeem(userId, rewardId);
    if (!result) throw createApiError(404, 'MEMBER_NOT_FOUND', 'Không tìm thấy tài khoản thành viên.');
    if (result.error === 'REWARD_NOT_FOUND') throw createApiError(404, 'REWARD_NOT_FOUND', 'Phần thưởng không còn khả dụng.');
    if (result.error === 'INSUFFICIENT_POINTS') throw createApiError(409, 'INSUFFICIENT_POINTS', 'Bạn chưa có đủ điểm để đổi phần thưởng này.');
    return result;
  }
  return { overview, redeem, listRedemptions: (id) => model.listRedemptions(id), listRewards: () => model.listRewards(), listTiers: () => model.listTiers(), listTransactions: (id) => model.listTransactions(id) };
}
module.exports = { createService };
