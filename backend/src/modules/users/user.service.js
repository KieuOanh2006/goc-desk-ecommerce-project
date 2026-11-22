const { createApiError } = require('../../middlewares/error-handler');
const defaultModel = require('./user.model').createUserModel();

function createService({ model = defaultModel } = {}) {
  async function getProfile(userId) {
    const user = await model.getProfile(userId);
    if (!user) throw createApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
    return user;
  }

  async function updateProfile(userId, patch) {
    try {
      const user = await model.updateProfile(userId, patch);
      if (!user) throw createApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
      return user;
    } catch (error) {
      if (error.code === 'PROFILE_PHONE_CONFLICT') {
        throw createApiError(409, 'PHONE_ALREADY_REGISTERED', 'Số điện thoại đã được tài khoản khác sử dụng.');
      }
      throw error;
    }
  }

  async function listAddresses(userId) {
    return model.listAddresses(userId);
  }

  async function createAddress(userId, input) {
    const address = await model.createAddress(userId, input);
    if (!address) throw createApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
    return address;
  }

  async function updateAddress(userId, addressId, input) {
    const address = await model.updateAddress(userId, addressId, input);
    if (!address) throw createApiError(404, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    return address;
  }

  async function deleteAddress(userId, addressId) {
    const deleted = await model.deleteAddress(userId, addressId);
    if (!deleted) throw createApiError(404, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    return { deleted: true };
  }

  return { createAddress, deleteAddress, getProfile, listAddresses, updateAddress, updateProfile };
}

module.exports = { createService };
