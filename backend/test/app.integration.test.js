const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('Express health routes remain available and Auth rejects unsafe inputs without changing the database', async (t) => {
  process.env.CLIENT_ORIGIN ||= 'http://127.0.0.1:5500';
  const app = require('../src/app');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await require('../src/config/database').end();
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const origin = process.env.CLIENT_ORIGIN.split(',')[0].trim();

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).data.status, 'ok');

  // This health check executes SELECT 1 only.
  const databaseResponse = await fetch(`${baseUrl}/api/health/db`);
  assert.equal(databaseResponse.status, 200);
  assert.equal((await databaseResponse.json()).data.status, 'ok');

  const meResponse = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(meResponse.status, 401);

  const guestStaffResponse = await fetch(`${baseUrl}/api/admin/staff`);
  assert.equal(guestStaffResponse.status, 401);
  assert.equal((await guestStaffResponse.json()).error.code, 'UNAUTHENTICATED');

  for (const endpoint of ['/api/users/me', '/api/users/me/addresses', '/api/loyalty/me', '/api/loyalty/transactions']) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    assert.equal(response.status, 401, `guest access should be rejected for ${endpoint}`);
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
  }

  const invalidInvitationResponse = await fetch(`${baseUrl}/api/auth/accept-invitation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ token: 'invalid-token', password: 'password123' }),
  });
  assert.equal(invalidInvitationResponse.status, 422);
  assert.equal((await invalidInvitationResponse.json()).error.code, 'VALIDATION_ERROR');

  const csrfResponse = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { origin: 'https://untrusted.example' },
  });
  assert.equal(csrfResponse.status, 403);

  const phoneLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ identity: '0912345678', password: 'password123', rememberMe: false }),
  });
  assert.equal(phoneLoginResponse.status, 401);
  assert.equal((await phoneLoginResponse.json()).error.code, 'AUTHENTICATION_FAILED');

  const roleInjectionResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({
      name: 'Member Test',
      email: 'member@example.test',
      phone: '+84901234567',
      password: 'password123',
      role: 'admin',
    }),
  });
  assert.equal(roleInjectionResponse.status, 422);
  assert.equal((await roleInjectionResponse.json()).error.code, 'VALIDATION_ERROR');
});
