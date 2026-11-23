const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const { createTransport, getSmtpConfiguration } = require('../src/modules/auth/email.service');

const SAFE_SMTP_CODES = new Set([
  'EAUTH', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'EDNS', 'ESOCKET', 'ETIMEDOUT',
]);

async function main() {
  let configuration;
  try {
    configuration = getSmtpConfiguration();
  } catch (error) {
    const missing = Array.isArray(error.missing) ? error.missing : [];
    process.stderr.write('SMTP configuration is incomplete or invalid.');
    if (missing.length) process.stderr.write(` Check: ${missing.join(', ')}.`);
    process.stderr.write('\nSet the required values in backend/.env. For Gmail, use a 16-letter App Password; spaces are removed automatically.\n');
    process.exitCode = 1;
    return;
  }

  const transporter = createTransport(configuration);
  let stage = 'SMTP verification';
  try {
    await transporter.verify();
    process.stdout.write('SMTP connection and authentication verified.\n');

    stage = 'test email delivery';
    await transporter.sendMail({
      from: configuration.from,
      to: configuration.username,
      subject: '[GÓC Desk] Kiểm tra cấu hình email',
      text: 'Đây là email kiểm tra cấu hình hệ thống GÓC Desk, không phải email xác minh tài khoản.',
    });
    process.stdout.write('Test email sent to the configured SMTP account. Check its inbox and spam folder.\n');
  } catch (error) {
    const code = SAFE_SMTP_CODES.has(error?.code) ? error.code : 'SMTP_TEST_FAILED';
    process.stderr.write(`${stage} failed (${code}). Check Gmail SMTP host/port/TLS, network access, App Password, sender settings, and Gmail sending limits. Credentials and server response details were not printed.\n`);
    process.exitCode = 1;
  } finally {
    transporter.close();
  }
}

main().catch(() => {
  process.stderr.write('SMTP test failed (SMTP_TEST_FAILED). Check the local configuration and try again.\n');
  process.exitCode = 1;
});
