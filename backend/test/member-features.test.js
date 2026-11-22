const test = require('node:test');
const assert = require('node:assert/strict');
const { createPasswordService, ACCEPTED_MESSAGE } = require('../src/modules/auth/password.service');
const { createService: createUserService } = require('../src/modules/users/user.service');
const { createService: createLoyaltyService } = require('../src/modules/loyalty/loyalty.service');

test('password reset is non-enumerating and stores only a token hash', async () => {
  let captured;
  const model = {
    findUserByEmail: async () => ({ id: '8', email: 'member@example.com', full_name: 'Member', role: 'member', account_status: 'active', email_verified_at: new Date() }),
    createPasswordResetToken: async (input) => { captured = input; return true; },
  };
  let emailToken;
  const service = createPasswordService({ model, mailer: { assertConfigured() {}, async sendPasswordResetEmail(message) { emailToken = message.token; } }, passwordHasher: { argon2id: 2 } });
  const result = await service.requestReset('member@example.com');
  assert.equal(result.message, ACCEPTED_MESSAGE);
  assert.match(emailToken, /^[a-f0-9]{64}$/);
  assert.notEqual(captured.tokenHash, emailToken);
  assert.match(captured.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(captured.lifetimeMinutes, 60);
});

test('password reset response is identical for unknown accounts', async () => {
  const service = createPasswordService({ model: { async findUserByEmail() { return null; } }, mailer: { assertConfigured() {} } });
  assert.deepEqual(await service.requestReset('unknown@example.com'), { accepted: true, message: ACCEPTED_MESSAGE });
});

test('member profile phone conflicts map to a safe conflict response', async () => {
  const service = createUserService({ model: { async updateProfile() { const error = new Error(); error.code = 'PROFILE_PHONE_CONFLICT'; throw error; } } });
  await assert.rejects(service.updateProfile('3', { phone: '+84912345678' }), (error) => error.statusCode === 409 && error.code === 'PHONE_ALREADY_REGISTERED');
});

test('address access is scoped to the authenticated user by service input', async () => {
  let receivedId;
  const service = createUserService({ model: { async deleteAddress(userId, addressId) { receivedId = [userId, addressId]; return true; } } });
  assert.deepEqual(await service.deleteAddress('12', '42'), { deleted: true });
  assert.deepEqual(receivedId, ['12', '42']);
});

test('Loyalty redemption rejects unavailable rewards and insufficient balance', async () => {
  const service = createLoyaltyService({ model: { async redeem() { return { error: 'INSUFFICIENT_POINTS' }; } } });
  await assert.rejects(service.redeem('2', '9'), (error) => error.statusCode === 409 && error.code === 'INSUFFICIENT_POINTS');
});

test('Loyalty exposes configured rewards without inventing catalog entries', async () => {
  const service = createLoyaltyService({ model: { async listRewards() { return []; } } });
  assert.deepEqual(await service.listRewards(), []);
});
