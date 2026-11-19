const { ValidationError } = require('../../../shared');
const {
  validate,
  authenticate,
  authorize,
  checkPermission,
} = require('../src/middleware');
const {
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  logoutValidation,
  createUserValidation,
  updateUserValidation,
} = require('../src/validators');

describe('Auth Service — Request Validation Unit Tests', () => {
  // Helper to execute validation middleware chain sequentially
  const executeValidation = async (chains, req) => {
    const next = jest.fn();
    const res = {};

    for (const mw of chains) {
      await new Promise((resolve, reject) => {
        mw(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    validate(req, res, next);
    return next;
  };

  const sampleValid64HexToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const sampleValidJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDJ9.mockSignatureString123';

  describe('Middleware Exports', () => {
    test('Exports all required middlewares including validate', () => {
      expect(typeof validate).toBe('function');
      expect(typeof authenticate).toBe('function');
      expect(typeof authorize).toBe('function');
      expect(typeof checkPermission).toBe('function');
    });
  });

  describe('Login Validation (POST /auth/login)', () => {
    test('Valid login input succeeds', async () => {
      const req = {
        body: {
          email: '  admin@leadflow.in  ',
          password: 'SecretPassword123!',
        },
      };

      const next = await executeValidation(loginValidation, req);
      expect(next).toHaveBeenCalledWith();
      expect(req.body.email).toBe('admin@leadflow.in'); // Trimmed & normalized
    });

    test('Missing or empty email fails validation', async () => {
      const req = { body: { password: 'SecretPassword123!' } };
      const next = await executeValidation(loginValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(422);
      expect(err.errors.some((e) => e.field === 'email')).toBe(true);
    });

    test('Invalid email format fails validation', async () => {
      const req = { body: { email: 'not-an-email', password: 'SecretPassword123!' } };
      const next = await executeValidation(loginValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'email')).toBe(true);
    });

    test('Missing password fails validation', async () => {
      const req = { body: { email: 'admin@leadflow.in' } };
      const next = await executeValidation(loginValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'password')).toBe(true);
    });

    test('Unexpected fields in login body are rejected by checkExact', async () => {
      const req = {
        body: {
          email: 'admin@leadflow.in',
          password: 'SecretPassword123!',
          role: 'Admin', // Unexpected field
        },
      };
      const next = await executeValidation(loginValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'role')).toBe(true);
    });
  });

  describe('Refresh Token Validation (POST /auth/refresh)', () => {
    test('Valid 64-character hex refresh token succeeds', async () => {
      const req = { body: { refreshToken: sampleValid64HexToken } };
      const next = await executeValidation(refreshTokenValidation, req);
      expect(next).toHaveBeenCalledWith();
    });

    test('Missing refreshToken fails validation', async () => {
      const req = { body: {} };
      const next = await executeValidation(refreshTokenValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'refreshToken')).toBe(true);
    });

    test('Invalid refresh token length or characters fails validation', async () => {
      // Too short
      const req1 = { body: { refreshToken: '12345abcdef' } };
      const next1 = await executeValidation(refreshTokenValidation, req1);
      expect(next1.mock.calls[0][0]).toBeInstanceOf(ValidationError);

      // Non-hex characters (contains 'z')
      const req2 = { body: { refreshToken: sampleValid64HexToken.replace(/a/g, 'z') } };
      const next2 = await executeValidation(refreshTokenValidation, req2);
      expect(next2.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    test('Unexpected fields in refresh token body are rejected', async () => {
      const req = {
        body: {
          refreshToken: sampleValid64HexToken,
          extraField: 'unexpected',
        },
      };
      const next = await executeValidation(refreshTokenValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'extraField')).toBe(true);
    });
  });

  describe('Forgot Password Validation (POST /auth/forgot)', () => {
    test('Valid forgot password email succeeds', async () => {
      const req = { body: { email: 'user@leadflow.in' } };
      const next = await executeValidation(forgotPasswordValidation, req);
      expect(next).toHaveBeenCalledWith();
    });

    test('Invalid or missing email fails validation', async () => {
      const req = { body: { email: 'invalid-email' } };
      const next = await executeValidation(forgotPasswordValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'email')).toBe(true);
    });

    test('Unexpected field in forgot password body is rejected', async () => {
      const req = {
        body: {
          email: 'user@leadflow.in',
          newPassword: 'attemptedInlinePassword',
        },
      };
      const next = await executeValidation(forgotPasswordValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'newPassword')).toBe(true);
    });
  });

  describe('Reset Password Validation (POST /auth/reset)', () => {
    test('Valid reset token and password meeting complexity succeed', async () => {
      const req = {
        body: {
          token: sampleValidJwtToken,
          newPassword: 'SecurePassword1',
        },
      };
      const next = await executeValidation(resetPasswordValidation, req);
      expect(next).toHaveBeenCalledWith();
    });

    test('Invalid JWT token structure fails validation', async () => {
      const req = {
        body: {
          token: 'not-a-valid-jwt-structure',
          newPassword: 'SecurePassword1',
        },
      };
      const next = await executeValidation(resetPasswordValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'token')).toBe(true);
    });

    test('Password failing length or complexity fails validation', async () => {
      // Too short (< 8 chars)
      const reqShort = {
        body: {
          token: sampleValidJwtToken,
          newPassword: 'Pass1',
        },
      };
      const nextShort = await executeValidation(resetPasswordValidation, reqShort);
      expect(nextShort.mock.calls[0][0]).toBeInstanceOf(ValidationError);

      // Missing number
      const reqNoNumber = {
        body: {
          token: sampleValidJwtToken,
          newPassword: 'PasswordWithoutNumbers',
        },
      };
      const nextNoNumber = await executeValidation(resetPasswordValidation, reqNoNumber);
      expect(nextNoNumber.mock.calls[0][0]).toBeInstanceOf(ValidationError);

      // Missing letter
      const reqNoLetter = {
        body: {
          token: sampleValidJwtToken,
          newPassword: '1234567890',
        },
      };
      const nextNoLetter = await executeValidation(resetPasswordValidation, reqNoLetter);
      expect(nextNoLetter.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });
  });

  describe('Logout Validation (POST /auth/logout)', () => {
    test('Valid logout request succeeds', async () => {
      const req = { body: { refreshToken: sampleValid64HexToken } };
      const next = await executeValidation(logoutValidation, req);
      expect(next).toHaveBeenCalledWith();
    });

    test('Invalid or missing refreshToken fails logout validation', async () => {
      const req = { body: { refreshToken: 'invalid' } };
      const next = await executeValidation(logoutValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'refreshToken')).toBe(true);
    });
  });

  describe('User Creation Validation (POST /users)', () => {
    test('Valid create user input succeeds with required and optional fields', async () => {
      const req = {
        body: {
          name: '  Sales Executive  ',
          email: 'exec@leadflow.in',
          password: 'Password123',
          role_id: 3,
          manager_id: 2,
          is_active: true,
        },
      };

      const next = await executeValidation(createUserValidation, req);
      expect(next).toHaveBeenCalledWith();
      expect(req.body.name).toBe('Sales Executive'); // Trimmed
    });

    test('Nullable manager_id succeeds', async () => {
      const req = {
        body: {
          name: 'Manager User',
          email: 'manager@leadflow.in',
          password: 'Password123',
          role_id: 2,
          manager_id: null,
        },
      };

      const next = await executeValidation(createUserValidation, req);
      expect(next).toHaveBeenCalledWith();
    });

    test('Missing required fields fails validation', async () => {
      const req = { body: {} };
      const next = await executeValidation(createUserValidation, req);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      const fields = err.errors.map((e) => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
      expect(fields).toContain('password');
      expect(fields).toContain('role_id');
    });

    test('Invalid role_id and manager_id are rejected', async () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@leadflow.in',
          password: 'Password123',
          role_id: -5, // Invalid negative integer
          manager_id: 'not-an-id',
        },
      };

      const next = await executeValidation(createUserValidation, req);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      const fields = err.errors.map((e) => e.field);
      expect(fields).toContain('role_id');
      expect(fields).toContain('manager_id');
    });

    test('Unexpected fields in create user are rejected by checkExact', async () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@leadflow.in',
          password: 'Password123',
          role_id: 1,
          password_hash: 'injected_hash',
        },
      };

      const next = await executeValidation(createUserValidation, req);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'password_hash')).toBe(true);
    });
  });

  describe('User Update Validation (PUT /users/:userId)', () => {
    test('Valid update input with userId param and single body field succeeds', async () => {
      const req = {
        params: { userId: '5' },
        body: { name: 'Updated Name' },
      };

      const next = await executeValidation(updateUserValidation, req);
      expect(next).toHaveBeenCalledWith();
    });

    test('Invalid userId param (negative or non-integer) is rejected', async () => {
      const req = {
        params: { userId: 'invalid_id' },
        body: { name: 'Updated Name' },
      };

      const next = await executeValidation(updateUserValidation, req);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'userId')).toBe(true);
    });

    test('Empty update body is rejected', async () => {
      const req = {
        params: { userId: '5' },
        body: {},
      };

      const next = await executeValidation(updateUserValidation, req);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'body')).toBe(true);
    });

    test('Unexpected fields in update user body are rejected', async () => {
      const req = {
        params: { userId: '5' },
        body: {
          name: 'Updated Name',
          maliciousField: 'hack',
        },
      };

      const next = await executeValidation(updateUserValidation, req);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.errors.some((e) => e.field === 'maliciousField')).toBe(true);
    });
  });

  describe('Security & Sensitive Data Scrubbing', () => {
    test('Submitted sensitive passwords or tokens never appear in validation error responses', async () => {
      const sensitivePassword = 'MySecretPlainPassword@2026';
      const sensitiveToken = 'MySecretSubmittedRefreshTokenString12345';

      const req = {
        body: {
          email: 'invalid-email',
          password: sensitivePassword, // Passed but validation fails elsewhere
          refreshToken: sensitiveToken,
        },
      };

      const next = await executeValidation(loginValidation, req);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);

      const serializedErrors = JSON.stringify(err.errors);
      expect(serializedErrors.includes(sensitivePassword)).toBe(false);
      expect(serializedErrors.includes(sensitiveToken)).toBe(false);

      // Verify every error strictly only has field and message
      err.errors.forEach((e) => {
        expect(e).toHaveProperty('field');
        expect(e).toHaveProperty('message');
        expect(e).not.toHaveProperty('value');
      });
    });
  });

  describe('Type-Safety and Strict Validation Checks', () => {
    test('Numeric or non-string email values are rejected across all email endpoints', async () => {
      // In Login
      const reqLogin = { body: { email: 12345, password: 'Password123' } };
      const nextLogin = await executeValidation(loginValidation, reqLogin);
      const errLogin = nextLogin.mock.calls[0][0];
      expect(errLogin).toBeInstanceOf(ValidationError);
      expect(errLogin.errors.some((e) => e.field === 'email' && e.message === 'Email must be a string')).toBe(true);

      // In Forgot Password
      const reqForgot = { body: { email: { address: 'user@test.com' } } };
      const nextForgot = await executeValidation(forgotPasswordValidation, reqForgot);
      const errForgot = nextForgot.mock.calls[0][0];
      expect(errForgot).toBeInstanceOf(ValidationError);
      expect(errForgot.errors.some((e) => e.field === 'email' && e.message === 'Email must be a string')).toBe(true);

      // In Create User
      const reqCreate = {
        body: {
          name: 'Valid Name',
          email: 99999,
          password: 'Password123',
          role_id: 1,
        },
      };
      const nextCreate = await executeValidation(createUserValidation, reqCreate);
      const errCreate = nextCreate.mock.calls[0][0];
      expect(errCreate).toBeInstanceOf(ValidationError);
      expect(errCreate.errors.some((e) => e.field === 'email' && e.message === 'Email must be a string')).toBe(true);
    });

    test('Object or array passwords are rejected', async () => {
      // Object password in login
      const reqLogin = { body: { email: 'user@leadflow.in', password: { pass: 'Secret123' } } };
      const nextLogin = await executeValidation(loginValidation, reqLogin);
      const errLogin = nextLogin.mock.calls[0][0];
      expect(errLogin).toBeInstanceOf(ValidationError);
      expect(errLogin.errors.some((e) => e.field === 'password' && e.message === 'Password must be a string')).toBe(true);

      // Array password in reset password
      const reqReset = {
        body: {
          token: sampleValidJwtToken,
          newPassword: ['ArrayPassword123'],
        },
      };
      const nextReset = await executeValidation(resetPasswordValidation, reqReset);
      const errReset = nextReset.mock.calls[0][0];
      expect(errReset).toBeInstanceOf(ValidationError);
      expect(errReset.errors.some((e) => e.field === 'newPassword' && e.message === 'New password must be a string')).toBe(true);
    });

    test('Numeric or object tokens are rejected', async () => {
      // Numeric refresh token
      const reqRefresh = { body: { refreshToken: 1234567890 } };
      const nextRefresh = await executeValidation(refreshTokenValidation, reqRefresh);
      const errRefresh = nextRefresh.mock.calls[0][0];
      expect(errRefresh).toBeInstanceOf(ValidationError);
      expect(errRefresh.errors.some((e) => e.field === 'refreshToken' && e.message === 'Refresh token must be a string')).toBe(true);

      // Object reset token
      const reqReset = { body: { token: { jwt: sampleValidJwtToken }, newPassword: 'Password123' } };
      const nextReset = await executeValidation(resetPasswordValidation, reqReset);
      const errReset = nextReset.mock.calls[0][0];
      expect(errReset).toBeInstanceOf(ValidationError);
      expect(errReset.errors.some((e) => e.field === 'token' && e.message === 'Reset token must be a string')).toBe(true);
    });

    test('Object or array names are rejected in create and update user', async () => {
      // Object name in create user
      const reqCreate = {
        body: {
          name: { first: 'John', last: 'Doe' },
          email: 'john@leadflow.in',
          password: 'Password123',
          role_id: 2,
        },
      };
      const nextCreate = await executeValidation(createUserValidation, reqCreate);
      const errCreate = nextCreate.mock.calls[0][0];
      expect(errCreate).toBeInstanceOf(ValidationError);
      expect(errCreate.errors.some((e) => e.field === 'name' && e.message === 'Name must be a string')).toBe(true);

      // Array name in update user
      const reqUpdate = {
        params: { userId: '3' },
        body: { name: ['Updated Name'] },
      };
      const nextUpdate = await executeValidation(updateUserValidation, reqUpdate);
      const errUpdate = nextUpdate.mock.calls[0][0];
      expect(errUpdate).toBeInstanceOf(ValidationError);
      expect(errUpdate.errors.some((e) => e.field === 'name' && e.message === 'Name must be a string')).toBe(true);
    });

    test('String "true" and numeric 1 are rejected for is_active', async () => {
      // String "true" in create user
      const reqStrTrue = {
        body: {
          name: 'Valid Name',
          email: 'valid@leadflow.in',
          password: 'Password123',
          role_id: 1,
          is_active: 'true',
        },
      };
      const nextStrTrue = await executeValidation(createUserValidation, reqStrTrue);
      const errStrTrue = nextStrTrue.mock.calls[0][0];
      expect(errStrTrue).toBeInstanceOf(ValidationError);
      expect(errStrTrue.errors.some((e) => e.field === 'is_active')).toBe(true);

      // Numeric 1 in update user
      const reqNumOne = {
        params: { userId: '2' },
        body: { is_active: 1 },
      };
      const nextNumOne = await executeValidation(updateUserValidation, reqNumOne);
      const errNumOne = nextNumOne.mock.calls[0][0];
      expect(errNumOne).toBeInstanceOf(ValidationError);
      expect(errNumOne.errors.some((e) => e.field === 'is_active')).toBe(true);
    });

    test('Actual boolean values (true and false) remain valid for is_active', async () => {
      const reqTrue = {
        body: {
          name: 'Active User',
          email: 'active@leadflow.in',
          password: 'Password123',
          role_id: 1,
          is_active: true,
        },
      };
      const nextTrue = await executeValidation(createUserValidation, reqTrue);
      expect(nextTrue).toHaveBeenCalledWith();

      const reqFalse = {
        params: { userId: '2' },
        body: { is_active: false },
      };
      const nextFalse = await executeValidation(updateUserValidation, reqFalse);
      expect(nextFalse).toHaveBeenCalledWith();
    });
  });
});
