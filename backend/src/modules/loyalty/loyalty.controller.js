const loyaltyService = require('./loyalty.service').createService();
function handler(key, dataKey = key) {
  return async (req, res, next) => {
    try {
      const data = key === 'overview' ? await loyaltyService.overview(req.auth.user.id)
        : key === 'redeem' ? await loyaltyService.redeem(req.auth.user.id, req.validated.body.rewardId)
          : key === 'listTransactions' || key === 'listRedemptions' ? await loyaltyService[key](req.auth.user.id)
            : await loyaltyService[key]();
      return res.json({ success: true, message: 'Thành công.', data: { [dataKey]: data } });
    } catch (error) { return next(error); }
  };
}
module.exports = {
  getOverview: handler('overview'), getTransactions: handler('listTransactions', 'transactions'),
  getRedemptions: handler('listRedemptions', 'redemptions'), getTiers: handler('listTiers', 'tiers'),
  getRewards: handler('listRewards', 'rewards'), redeem: handler('redeem', 'redemption'),
};
