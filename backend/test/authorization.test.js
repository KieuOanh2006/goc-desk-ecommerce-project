const test = require('node:test');
const assert = require('node:assert/strict');
const { authorizeRoles } = require('../src/middlewares/authorization');
const { isOwner, requireOwnership } = require('../src/middlewares/ownership');
const { assertRoleChangePermitted, assertStatusChangePermitted } = require('../src/modules/admin/staff.policy');

async function runMiddleware(middleware, req) {
  let error;
  let passed = false;
  await middleware(req, {}, (nextError) => { error = nextError; passed = !nextError; });
  return { error, passed };
}

function authenticatedUser(id, role) {
  return { id, role, accountStatus: 'active', emailVerifiedAt: new Date() };
}

test('role authorization denies guests and non-admin roles and permits only assigned roles', async () => {
  const requireAdmin = authorizeRoles('admin');
  assert.equal((await runMiddleware(requireAdmin, {})).error.statusCode, 401);
  for (const role of ['member', 'product_content_staff', 'order_support_staff']) {
    assert.equal((await runMiddleware(requireAdmin, { auth: { user: authenticatedUser('8', role) } })).error.statusCode, 403);
  }
  assert.equal((await runMiddleware(requireAdmin, { auth: { user: authenticatedUser('1', 'admin') } })).passed, true);
  assert.equal((await runMiddleware(requireAdmin, { auth: { user: { ...authenticatedUser('8', 'admin'), accountStatus: 'locked' } } })).error.statusCode, 401);
  assert.throws(() => authorizeRoles('superuser'), TypeError);
});

test('ownership middleware rejects missing auth and foreign resources and permits the owner', async () => {
  const ownerOnly = requireOwnership((req) => req.resource.ownerId);
  assert.equal((await runMiddleware(ownerOnly, { resource: { ownerId: '42' } })).error.statusCode, 401);
  assert.equal((await runMiddleware(ownerOnly, { auth: { user: authenticatedUser('42', 'member') }, resource: { ownerId: '43' } })).error.statusCode, 403);
  assert.equal((await runMiddleware(ownerOnly, { auth: { user: authenticatedUser(42, 'member') }, resource: { ownerId: '42' } })).passed, true);
  assert.equal(isOwner(null, 42), false);
  assert.equal((await runMiddleware(requireOwnership(async () => 43, { allowAdmin: true }), { auth: { user: authenticatedUser('1', 'admin') } })).passed, true);
});

test('self-demotion, self-lock and last active Admin protections fail closed', () => {
  const forbidden = (operation) => assert.throws(operation, (error) => error instanceof Error && error.statusCode === 403);
  forbidden(() => assertRoleChangePermitted({ actorId: 1, targetId: '1', targetRole: 'admin', targetStatus: 'active', nextRole: 'member', activeAdminIds: ['1', '2'] }));
  forbidden(() => assertStatusChangePermitted({ actorId: 1, targetId: '1', targetRole: 'admin', targetStatus: 'active', nextStatus: 'locked', activeAdminIds: ['1', '2'], emailVerifiedAt: new Date() }));

  for (const operation of [
    () => assertRoleChangePermitted({ actorId: 2, targetId: 1, targetRole: 'admin', targetStatus: 'active', nextRole: 'member', activeAdminIds: ['1'] }),
    () => assertStatusChangePermitted({ actorId: 2, targetId: 1, targetRole: 'admin', targetStatus: 'active', nextStatus: 'locked', activeAdminIds: ['1'], emailVerifiedAt: new Date() }),
  ]) assert.throws(operation, (error) => error.code === 'LAST_ACTIVE_ADMIN' && error.statusCode === 409);

  assert.doesNotThrow(() => assertRoleChangePermitted({ actorId: 2, targetId: 1, targetRole: 'admin', targetStatus: 'active', nextRole: 'member', activeAdminIds: ['1', '2'] }));
});

test('status policy will not activate an unverified or pending account', () => {
  assert.throws(() => assertStatusChangePermitted({ actorId: 1, targetId: 2, targetRole: 'product_content_staff', targetStatus: 'pending', nextStatus: 'active', activeAdminIds: ['1'], emailVerifiedAt: null }), (error) => error.code === 'PENDING_ACCOUNT_STATUS_CHANGE');
  assert.throws(() => assertStatusChangePermitted({ actorId: 1, targetId: 2, targetRole: 'product_content_staff', targetStatus: 'locked', nextStatus: 'active', activeAdminIds: ['1'], emailVerifiedAt: null }), (error) => error.code === 'ACCOUNT_NOT_VERIFIED');
});

test('invitation-pending account cannot be promoted to Admin before acceptance', () => {
  assert.throws(() => assertRoleChangePermitted({ actorId: 1, targetId: 2, targetRole: 'product_content_staff', targetStatus: 'pending', nextRole: 'admin', activeAdminIds: ['1'] }), (error) => error.code === 'PENDING_ADMIN_ROLE_FORBIDDEN');
});
