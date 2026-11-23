const staffService = require('./staff.service').createService();

async function listStaff(req, res, next) {
  try {
    const staff = await staffService.listStaff();
    return res.json({ success: true, message: 'Lấy danh sách nhân viên thành công.', data: { staff } });
  } catch (error) { return next(error); }
}

async function createStaff(req, res, next) {
  try {
    const staff = await staffService.createStaff(req.validated.body);
    return res.status(201).json({ success: true, message: 'Đã tạo nhân viên và gửi lời mời.', data: { staff } });
  } catch (error) { return next(error); }
}

async function resendInvitation(req, res, next) {
  try {
    const result = await staffService.resendInvitation(req.validated.params.userId);
    return res.status(202).json({ success: true, message: result.message, data: { accepted: result.accepted } });
  } catch (error) { return next(error); }
}

async function changeRole(req, res, next) {
  try {
    const staff = await staffService.changeRole(
      req.auth.user.id,
      req.validated.params.userId,
      req.validated.body.role,
    );
    return res.json({ success: true, message: 'Đã cập nhật quyền tài khoản.', data: { user: staff } });
  } catch (error) { return next(error); }
}

async function changeStatus(req, res, next) {
  try {
    const user = await staffService.changeStatus(
      req.auth.user.id,
      req.validated.params.userId,
      req.validated.body.accountStatus,
    );
    return res.json({ success: true, message: 'Đã cập nhật trạng thái tài khoản.', data: { user } });
  } catch (error) { return next(error); }
}

module.exports = { changeRole, changeStatus, createStaff, listStaff, resendInvitation };
