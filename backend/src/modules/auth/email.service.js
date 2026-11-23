const nodemailer = require('nodemailer');
const { createApiError } = require('../../middlewares/error-handler');

function getSmtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_FROM?.trim();
  const username = process.env.SMTP_USER?.trim();
  const rawPort = process.env.SMTP_PORT?.trim();
  const rawSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
  const port = Number(rawPort);
  const secure = rawSecure === 'true';
  const password = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!rawPort || !Number.isInteger(port) || port < 1 || port > 65535) missing.push('SMTP_PORT');
  if (!['true', 'false'].includes(rawSecure)) missing.push('SMTP_SECURE');
  if (!username) missing.push('SMTP_USER');
  if (!password) missing.push('SMTP_PASSWORD');
  if (!from) missing.push('MAIL_FROM');
  if (missing.length) {
    const error = createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Email service is not configured.');
    error.missing = missing;
    throw error;
  }
  if (host.toLowerCase() === 'smtp.gmail.com' && !/^[A-Za-z]{16}$/.test(password)) {
    const error = createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Email service is not configured.');
    error.missing = ['SMTP_PASSWORD (Google App Password must contain 16 characters)'];
    throw error;
  }

  return { host, from, port, secure, username, password };
}

function getVerificationUrl() {
  const clientOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = [];
  for (const value of clientOrigins) {
    try {
      const origin = new URL(value);
      if (['http:', 'https:'].includes(origin.protocol) && !origin.username && !origin.password) {
        allowedOrigins.push(origin.origin);
      }
    } catch { /* Invalid origins are excluded from verification links. */ }
  }

  let verificationUrl;
  try {
    verificationUrl = process.env.EMAIL_VERIFICATION_URL
      ? new URL(process.env.EMAIL_VERIFICATION_URL)
      : new URL('/account.html', allowedOrigins[0]);
  } catch {
    const error = createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Email service is not configured.');
    error.missing = ['CLIENT_ORIGIN or EMAIL_VERIFICATION_URL'];
    throw error;
  }

  if (!['http:', 'https:'].includes(verificationUrl.protocol)
    || verificationUrl.username || verificationUrl.password
    || !allowedOrigins.includes(verificationUrl.origin)
    || (process.env.NODE_ENV === 'production' && verificationUrl.protocol !== 'https:')) {
    const error = createApiError(503, 'EMAIL_SERVICE_UNAVAILABLE', 'Email service is not configured.');
    error.missing = ['EMAIL_VERIFICATION_URL must use an allowed CLIENT_ORIGIN'];
    throw error;
  }

  return verificationUrl;
}

function getMailConfiguration() {
  return { ...getSmtpConfiguration(), verificationUrl: getVerificationUrl() };
}

function createTransport(configuration = getSmtpConfiguration()) {
  return nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    requireTLS: !configuration.secure,
    tls: { minVersion: 'TLSv1.2' },
    auth: { user: configuration.username, pass: configuration.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
}

function assertConfigured() {
  getMailConfiguration();
}

async function sendVerificationEmail({ email, fullName, token }) {
  const config = getMailConfiguration();
  const verificationUrl = new URL(config.verificationUrl);
  verificationUrl.searchParams.set('token', token);

  const transport = createTransport(config);

  try {
    await transport.sendMail({
      from: config.from,
      to: email,
      subject: 'Xác minh email Góc Desk',
      text: `Xin chào ${fullName},\n\nMở liên kết sau trong vòng 24 giờ để xác minh email:\n${verificationUrl.toString()}\n\nNếu bạn không yêu cầu đăng ký, hãy bỏ qua thư này.`,
    });
  } finally {
    transport.close();
  }
}

async function sendStaffInvitationEmail({ email, fullName, token }) {
  const config = getMailConfiguration();
  const invitationUrl = new URL(config.verificationUrl);
  invitationUrl.searchParams.set('invitation', token);
  const transport = createTransport(config);

  try {
    await transport.sendMail({
      from: config.from,
      to: email,
      subject: 'Lời mời tham gia đội ngũ GÓC Desk',
      text: `Xin chào ${fullName},\n\nBạn được mời tham gia đội ngũ GÓC Desk. Mở liên kết sau trong vòng 24 giờ để xác nhận lời mời và đặt mật khẩu ban đầu:\n${invitationUrl.toString()}\n\nNếu bạn không mong đợi lời mời này, hãy bỏ qua email.`,
    });
  } finally {
    transport.close();
  }
}

async function sendPasswordResetEmail({ email, fullName, token }) {
  const config = getMailConfiguration();
  const resetUrl = new URL(config.verificationUrl);
  resetUrl.searchParams.set('resetPassword', token);
  const transport = createTransport(config);
  try {
    await transport.sendMail({
      from: config.from,
      to: email,
      subject: '[GÓC Desk] Đặt lại mật khẩu',
      text: `Xin chào ${fullName},\n\nMở liên kết sau trong vòng 60 phút để đặt lại mật khẩu GÓC Desk:\n${resetUrl.toString()}\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    });
  } finally {
    transport.close();
  }
}

module.exports = {
  assertConfigured,
  createTransport,
  getMailConfiguration,
  getSmtpConfiguration,
  sendStaffInvitationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
