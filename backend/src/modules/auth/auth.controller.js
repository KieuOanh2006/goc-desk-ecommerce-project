const authService = require('./auth.service').createService();
const { COOKIE_NAME } = require('../../middlewares/auth-session');
const { clearSessionCookie, parseSessionCookie, sessionCookieOptions } = require('./auth.security');

function setSessionCookie(res, token, policy) {
  res.cookie(COOKIE_NAME, token, sessionCookieOptions(policy.idleSeconds));
}

async function register(req, res, next) {
  try {
    const data = await authService.register(req.validated.body);
    return res.status(201).json({ success: true, message: 'Đăng ký thành công. Vui lòng xác minh email.', data });
  } catch (error) { return next(error); }
}

async function verifyEmail(req, res, next) {
  try {
    const result = await authService.verifyEmail(req.validated.body.token, req.get('user-agent'));
    if (result.sessionToken) setSessionCookie(res, result.sessionToken, result.sessionPolicy);
    return res.json({
      success: true,
      message: 'Email đã được xác minh.',
      data: { user: result.user, authenticated: Boolean(result.sessionToken) },
    });
  } catch (error) { return next(error); }
}

async function resendVerification(req, res, next) {
  try {
    await authService.resendVerification(
      req.validated.body.email,
      req.verificationResendRateLimitedByIp,
    );
    return res.status(202).json({
      success: true,
      message: 'Nếu tài khoản đủ điều kiện, hướng dẫn xác minh sẽ được gửi đến email đã cung cấp.',
      data: { accepted: true },
    });
  } catch (error) { return next(error); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.validated.body, req.get('user-agent'));
    setSessionCookie(res, result.sessionToken, result.sessionPolicy);
    return res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: { user: result.user },
    });
  } catch (error) { return next(error); }
}

async function logout(req, res, next) {
  try {
    const token = parseSessionCookie(req.headers.cookie, COOKIE_NAME);
    await authService.logout(token);
    clearSessionCookie(res);
    return res.json({ success: true, message: 'Đăng xuất thành công.', data: { loggedOut: true } });
  } catch (error) { return next(error); }
}

function me(req, res) {
  return res.json({
    success: true,
    message: 'Lấy thông tin tài khoản thành công.',
    data: { user: req.auth.user },
  });
}

async function listSessions(req, res, next) {
  try {
    const sessions = await authService.listSessions(req.auth);
    return res.json({ success: true, message: 'Lấy danh sách phiên thành công.', data: { sessions } });
  } catch (error) { return next(error); }
}

async function revokeSession(req, res, next) {
  try {
    const sessionId = req.validated.params.sessionId;
    const result = await authService.revokeOneSession(req.auth, sessionId);
    if (result.isCurrent) clearSessionCookie(res);
    return res.json({ success: true, message: 'Đã thu hồi phiên đăng nhập.', data: { revoked: true } });
  } catch (error) { return next(error); }
}

async function logoutOthers(req, res, next) {
  try {
    const data = await authService.logoutOthers(req.auth);
    return res.json({ success: true, message: 'Đã đăng xuất các thiết bị khác.', data });
  } catch (error) { return next(error); }
}

async function logoutAll(req, res, next) {
  try {
    const data = await authService.logoutAll(req.auth);
    clearSessionCookie(res);
    return res.json({ success: true, message: 'Đã đăng xuất tất cả thiết bị.', data });
  } catch (error) { return next(error); }
}

module.exports = { listSessions, login, logout, logoutAll, logoutOthers, me, register, resendVerification, revokeSession, verifyEmail };
