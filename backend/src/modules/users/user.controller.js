const userService = require('./user.service').createService();

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.auth.user.id);
    return res.json({ success: true, message: 'Lấy hồ sơ thành công.', data: { user } });
  } catch (error) { return next(error); }
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.auth.user.id, req.validated.body);
    return res.json({ success: true, message: 'Đã cập nhật hồ sơ.', data: { user } });
  } catch (error) { return next(error); }
}

async function listAddresses(req, res, next) {
  try {
    const addresses = await userService.listAddresses(req.auth.user.id);
    return res.json({ success: true, message: 'Lấy danh sách địa chỉ thành công.', data: { addresses } });
  } catch (error) { return next(error); }
}

async function createAddress(req, res, next) {
  try {
    const address = await userService.createAddress(req.auth.user.id, req.validated.body);
    return res.status(201).json({ success: true, message: 'Đã thêm địa chỉ.', data: { address } });
  } catch (error) { return next(error); }
}

async function updateAddress(req, res, next) {
  try {
    const address = await userService.updateAddress(req.auth.user.id, req.validated.params.addressId, req.validated.body);
    return res.json({ success: true, message: 'Đã cập nhật địa chỉ.', data: { address } });
  } catch (error) { return next(error); }
}

async function deleteAddress(req, res, next) {
  try {
    const data = await userService.deleteAddress(req.auth.user.id, req.validated.params.addressId);
    return res.json({ success: true, message: 'Đã xóa địa chỉ.', data });
  } catch (error) { return next(error); }
}

module.exports = { createAddress, deleteAddress, getProfile, listAddresses, updateAddress, updateProfile };
