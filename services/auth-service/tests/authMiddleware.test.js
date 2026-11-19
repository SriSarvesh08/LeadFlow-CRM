const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../../../shared');
const { generateAccessToken } = require('../src/utils/jwt');
const { authenticate, authorize, checkPermission } = require('../src/middleware');

describe('Auth Service — Authentication & Authorization Middleware Unit Tests', () => {
  const originalEnv = process.env;
  const testSecret = 'auth_middleware_test_secret_key_12345';

  const validUserData = {
    id: 10,
    email: 'test@leadflow.in',
    role: 'Sales Manager',
    permissions: ['leads:read', 'leads:create', 'leads:update'],
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: testSecret,
      JWT_EXPIRES_IN: '15m',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // Helper to construct mock req, res, next
  const createMockReqRes = (headers = {}, user = null) => {
    const req = {
      headers: { ...headers },
      user,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  describe('authenticate Middleware', () => {
    test('1. Valid Bearer token populates req.user and calls next()', () => {
      const token = generateAccessToken(validUserData);
      const { req, res, next } = createMockReqRes({ authorization: `Bearer ${token}` });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // called with no error
      expect(req.user).toEqual({
        id: validUserData.id,
        email: validUserData.email,
        role: validUserData.role,
        permissions: validUserData.permissions,
      });
    });

    test('2. Missing Authorization header returns UnauthorizedError', () => {
      const { req, res, next } = createMockReqRes({});

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Authentication token required');
    });

    test('3. Empty Authorization header returns UnauthorizedError', () => {
      const { req, res, next } = createMockReqRes({ authorization: '' });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
    });

    test('4. Malformed Bearer header returns UnauthorizedError', () => {
      // Missing Bearer prefix
      const { req: req1, res: res1, next: next1 } = createMockReqRes({ authorization: 'Basic dXNlcjpwYXNz' });
      authenticate(req1, res1, next1);
      expect(next1.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);

      // Bearer with no token
      const { req: req2, res: res2, next: next2 } = createMockReqRes({ authorization: 'Bearer   ' });
      authenticate(req2, res2, next2);
      expect(next2.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    });

    test('5. Invalid JWT returns UnauthorizedError', () => {
      const { req, res, next } = createMockReqRes({ authorization: 'Bearer invalid.tampered.token' });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
    });

    test('6. Expired JWT returns UnauthorizedError', () => {
      const expiredToken = jwt.sign(validUserData, testSecret, { expiresIn: '0s' });
      const { req, res, next } = createMockReqRes({ authorization: `Bearer ${expiredToken}` });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toContain('jwt expired');
    });

    test('7. Invalid payload is rejected with UnauthorizedError', () => {
      // Missing role and permissions is not an array
      const malformedPayloadToken = jwt.sign({ id: 1, email: 'user@leadflow.in' }, testSecret);
      const { req, res, next } = createMockReqRes({ authorization: `Bearer ${malformedPayloadToken}` });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid authentication token payload');
    });

    test('8. Missing JWT configuration is passed to the central error handler as a server error', () => {
      delete process.env.JWT_SECRET;
      const { req, res, next } = createMockReqRes({ authorization: 'Bearer some.mock.jwt' });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).not.toBeInstanceOf(UnauthorizedError);
      expect(err.message).toBe('JWT_SECRET is not configured');
    });

    test('9. Spoofed x-user-* headers without a valid Bearer token are rejected', () => {
      const { req, res, next } = createMockReqRes({
        'x-user-id': '1',
        'x-user-email': 'admin@leadflow.in',
        'x-user-role': 'Admin',
        'x-user-permissions': JSON.stringify(['*']),
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(req.user).toBeFalsy();
    });

    test('10. Valid Bearer token takes precedence over any supplied x-user-* headers', () => {
      const token = generateAccessToken(validUserData);
      const { req, res, next } = createMockReqRes({
        authorization: `Bearer ${token}`,
        'x-user-id': '999',
        'x-user-role': 'Admin',
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.user.id).toBe(validUserData.id); // 10, not 999
      expect(req.user.role).toBe(validUserData.role); // 'Sales Manager', not 'Admin'
    });
  });

  describe('authorize Middleware (Role Guard)', () => {
    test('11. Matching role is allowed and calls next()', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, role: 'Sales Manager' });
      const roleMiddleware = authorize('Sales Manager');

      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('12. Non-matching role returns ForbiddenError (403)', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, role: 'Sales Executive' });
      const roleMiddleware = authorize('Admin', 'Sales Manager');

      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Access forbidden: insufficient role permissions');
    });

    test('13. Multiple allowed roles work correctly', () => {
      const roleMiddleware = authorize('Admin', 'Sales Manager', 'Accounts (Finance)');

      const { req: req1, res: res1, next: next1 } = createMockReqRes({}, { role: 'Accounts (Finance)' });
      roleMiddleware(req1, res1, next1);
      expect(next1).toHaveBeenCalledWith();

      const { req: req2, res: res2, next: next2 } = createMockReqRes({}, { role: 'Support Agent' });
      roleMiddleware(req2, res2, next2);
      expect(next2.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    });

    test('14. Array-based role arguments work correctly', () => {
      const roleMiddleware = authorize(['Admin', 'Support Agent']);

      const { req, res, next } = createMockReqRes({}, { role: 'Support Agent' });
      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('15. Missing req.user returns UnauthorizedError (401)', () => {
      const { req, res, next } = createMockReqRes({}, null);
      const roleMiddleware = authorize('Admin');

      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Authentication required');
    });

    test('15a. authorize() with no arguments does not grant access', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, role: 'Admin' });
      const roleMiddleware = authorize();

      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    test('15b. authorize([]) does not grant access', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, role: 'Admin' });
      const roleMiddleware = authorize([]);

      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    test('15c. authorize("") does not grant access', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, role: 'Admin' });
      const roleMiddleware = authorize('');

      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });

  describe('checkPermission Middleware (Permission Guard)', () => {
    test('16. User with the required permission is allowed', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, permissions: ['users:read', 'users:create'] });
      const permMiddleware = checkPermission('users:read');

      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('17. User without the required permission receives ForbiddenError (403)', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, permissions: ['users:read'] });
      const permMiddleware = checkPermission('users:delete');

      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Access forbidden: insufficient permissions');
    });

    test('18. Multiple permissions require all permissions to be present', () => {
      const permMiddleware = checkPermission('invoices:read', 'invoices:approve');

      // Possesses only one
      const { req: req1, res: res1, next: next1 } = createMockReqRes({}, { permissions: ['invoices:read'] });
      permMiddleware(req1, res1, next1);
      expect(next1.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);

      // Possesses both
      const { req: req2, res: res2, next: next2 } = createMockReqRes({}, { permissions: ['invoices:read', 'invoices:approve'] });
      permMiddleware(req2, res2, next2);
      expect(next2).toHaveBeenCalledWith();
    });

    test('19. Missing or non-array permissions is handled safely with ForbiddenError (403)', () => {
      const permMiddleware = checkPermission('leads:read');

      const { req: req1, res: res1, next: next1 } = createMockReqRes({}, { role: 'Admin', permissions: null });
      permMiddleware(req1, res1, next1);
      expect(next1.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);

      const { req: req2, res: res2, next: next2 } = createMockReqRes({}, { role: 'Admin' });
      permMiddleware(req2, res2, next2);
      expect(next2.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    });

    test('20. Admin does not bypass missing permissions', () => {
      // User is Admin, but does not possess 'super_secret:execute'
      const { req, res, next } = createMockReqRes({}, {
        id: 1,
        email: 'admin@leadflow.in',
        role: 'Admin',
        permissions: ['users:read', 'users:create', 'roles:manage'],
      });

      const permMiddleware = checkPermission('super_secret:execute');
      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    test('21. Missing req.user in checkPermission returns UnauthorizedError (401)', () => {
      const { req, res, next } = createMockReqRes({}, null);
      const permMiddleware = checkPermission('users:read');

      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Authentication required');
    });

    test('22. checkPermission() with no arguments does not grant access', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, permissions: ['users:read', 'users:create'] });
      const permMiddleware = checkPermission();

      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    test('23. checkPermission([]) does not grant access', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, permissions: ['users:read', 'users:create'] });
      const permMiddleware = checkPermission([]);

      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    test('24. checkPermission("") does not grant access', () => {
      const { req, res, next } = createMockReqRes({}, { ...validUserData, permissions: ['users:read', 'users:create'] });
      const permMiddleware = checkPermission('');

      permMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });
});
