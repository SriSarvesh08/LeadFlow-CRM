const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { sequelize, User, RefreshToken, AuditLog } = require('../src/models');
const passwordUtils = require('../src/utils/password');
const { generateAccessToken, hashToken, generateResetToken } = require('../src/utils/jwt');
const emailUtils = require('../src/utils/email');

describe('Auth Service — Authentication Endpoints', () => {
  const originalEnv = process.env;
  let mockTransaction;

  const validTokenSecret = 'test_jwt_secret_key_for_auth_endpoints_2026';
  const validResetSecret = 'test_jwt_reset_secret_key_for_auth_endpoints_2026';

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: validTokenSecret,
      JWT_RESET_SECRET: validResetSecret,
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      RESET_TOKEN_EXPIRES_IN: '1h',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    mockTransaction = {
      LOCK: { UPDATE: 'UPDATE' },
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };

    jest.spyOn(sequelize, 'transaction').mockImplementation(async (callback) => {
      if (callback) {
        try {
          const result = await callback(mockTransaction);
          await mockTransaction.commit();
          return result;
        } catch (err) {
          await mockTransaction.rollback();
          throw err;
        }
      }
      return mockTransaction;
    });

    jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /auth/login', () => {
    const validLoginPayload = {
      email: 'admin@leadflow.in',
      password: 'StrongPassword@123',
    };

    const mockUserRecord = {
      id: 1,
      name: 'Admin User',
      email: 'admin@leadflow.in',
      password_hash: '$2b$10$hashedPasswordStringHere',
      is_active: true,
      role: {
        id: 1,
        name: 'Admin',
        permissions: [
          { id: 1, code: 'users:read' },
          { id: 2, code: 'users:create' },
          { id: 3, code: 'roles:manage' },
        ],
      },
    };

    test('1. Successful login returns 200 with user profile, accessToken, and refreshToken', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      const createTokenSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({
        id: 101,
        user_id: 1,
        token_hash: 'mocked_hash',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const { user, accessToken, refreshToken } = response.body.data;

      // User payload verification
      expect(user).toEqual({
        id: 1,
        name: 'Admin User',
        email: 'admin@leadflow.in',
        role: 'Admin',
        permissions: ['users:read', 'users:create', 'roles:manage'],
      });

      // Security check: password_hash must never be leaked
      expect(user.password_hash).toBeUndefined();
      expect(response.body.data.password_hash).toBeUndefined();

      // Token verification
      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3); // Valid JWT structure
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken).toMatch(/^[0-9a-fA-F]{64}$/); // 64-char hex

      // Database storage verification
      expect(createTokenSpy).toHaveBeenCalledTimes(1);
      const callArgs = createTokenSpy.mock.calls[0][0];
      expect(callArgs.user_id).toBe(1);
      expect(callArgs.token_hash).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(callArgs.token_hash).not.toBe(refreshToken); // Plaintext is NOT stored
      expect(callArgs.expires_at instanceof Date).toBe(true);
    });

    test('2. Missing user returns 401 with uniform error message', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const compareSpy = jest.spyOn(passwordUtils, 'comparePassword');
      const createTokenSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@leadflow.in', password: 'Password@123' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      });
      expect(compareSpy).not.toHaveBeenCalled();
      expect(createTokenSpy).not.toHaveBeenCalled();
    });

    test('3. Inactive user returns 401 with uniform error message without comparing password', async () => {
      const inactiveUser = { ...mockUserRecord, is_active: false };
      jest.spyOn(User, 'findOne').mockResolvedValue(inactiveUser);
      const compareSpy = jest.spyOn(passwordUtils, 'comparePassword');
      const createTokenSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginPayload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      });
      expect(compareSpy).not.toHaveBeenCalled();
      expect(createTokenSpy).not.toHaveBeenCalled();
    });

    test('4. Incorrect password returns 401 with uniform error message', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);
      const createTokenSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@leadflow.in', password: 'WrongPassword@999' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      });
      expect(createTokenSpy).not.toHaveBeenCalled();
    });

    test('5. User with role having no permissions returns empty permissions array safely', async () => {
      const userWithoutPermissions = {
        id: 2,
        name: 'Guest User',
        email: 'guest@leadflow.in',
        password_hash: '$2b$10$hashed',
        is_active: true,
        role: {
          id: 5,
          name: 'Guest',
          permissions: [],
        },
      };
      jest.spyOn(User, 'findOne').mockResolvedValue(userWithoutPermissions);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ id: 102 });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'guest@leadflow.in', password: 'Password@123' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('Guest');
      expect(response.body.data.user.permissions).toEqual([]);
    });

    test('6. Validation rejects missing email or password with 422', async () => {
      const resMissingEmail = await request(app)
        .post('/auth/login')
        .send({ password: 'Password@123' });
      expect(resMissingEmail.status).toBe(422);
      expect(resMissingEmail.body.success).toBe(false);

      const resMissingPassword = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@leadflow.in' });
      expect(resMissingPassword.status).toBe(422);
      expect(resMissingPassword.body.success).toBe(false);
    });

    test('7. Validation rejects malformed email with 422', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'Password@123' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('8. Validation rejects unexpected extra fields with 422', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@leadflow.in',
          password: 'Password@123',
          extraField: 'not allowed',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    const validRefreshToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

    const createMockTokenRecord = (overrides = {}) => ({
      id: 50,
      user_id: 1,
      token_hash: 'some_hashed_value',
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hr in future
      revoked_at: null,
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@leadflow.in',
        is_active: true,
        role: {
          id: 1,
          name: 'Admin',
          permissions: [
            { id: 1, code: 'users:read' },
            { id: 2, code: 'users:create' },
          ],
        },
      },
      ...overrides,
    });

    test('1. Successful refresh rotates token and returns 200 with new token pair', async () => {
      const mockRecord = createMockTokenRecord();
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockRecord);
      const updateSpy = jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);
      const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({
        id: 51,
        user_id: 1,
        token_hash: 'new_hash',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { accessToken, refreshToken } = response.body.data;

      // Access token verification
      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3);

      // New refresh token verification
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(refreshToken).not.toBe(validRefreshToken); // Must be a newly generated token

      // Single-use token rotation: old token must be revoked conditionally inside transaction
      expect(updateSpy).toHaveBeenCalledTimes(1);
      const [updateFields, updateOptions] = updateSpy.mock.calls[0];
      expect(updateFields.revoked_at instanceof Date).toBe(true);
      expect(updateOptions.where.id).toBe(50);
      expect(updateOptions.where.revoked_at).toBeNull();
      expect(updateOptions.transaction).toBe(mockTransaction);

      // New token must be saved to database inside transaction
      expect(createSpy).toHaveBeenCalledTimes(1);
      const [createArgs, createOptions] = createSpy.mock.calls[0];
      expect(createArgs.user_id).toBe(1);
      expect(createArgs.token_hash).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(createArgs.token_hash).not.toBe(refreshToken); // Plaintext is never stored
      expect(createOptions.transaction).toBe(mockTransaction);

      // Transaction committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    test('2. Missing or not found refresh token returns 401', async () => {
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(null);
      const createSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      expect(createSpy).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    test('3. Already revoked refresh token returns 401 and does not rotate', async () => {
      const revokedRecord = createMockTokenRecord({
        revoked_at: new Date(Date.now() - 3600000), // revoked 1 hour ago
      });
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(revokedRecord);
      const updateSpy = jest.spyOn(RefreshToken, 'update');
      const createSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      expect(updateSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    test('4. Expired refresh token returns 401 and does not rotate', async () => {
      const expiredRecord = createMockTokenRecord({
        expires_at: new Date(Date.now() - 3600000), // expired 1 hour ago
      });
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(expiredRecord);
      const updateSpy = jest.spyOn(RefreshToken, 'update');
      const createSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      expect(updateSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    test('5. Refresh token for inactive user returns 401', async () => {
      const inactiveUserRecord = createMockTokenRecord({
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@leadflow.in',
          is_active: false,
          role: { id: 1, name: 'Admin', permissions: [] },
        },
      });
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(inactiveUserRecord);
      const updateSpy = jest.spyOn(RefreshToken, 'update');
      const createSpy = jest.spyOn(RefreshToken, 'create');

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      expect(updateSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    test('6. Validation rejects missing refreshToken with 422', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('7. Validation rejects malformed refreshToken (not 64 hex chars) with 422', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'short_token' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('8. Validation rejects unexpected extra fields with 422', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
          extraField: 'illegal',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Step 13D: Expiration Configuration & Security Enhancements', () => {
    const validRefreshToken = 'b1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

    const createMockTokenRecord = () => ({
      id: 77,
      user_id: 1,
      token_hash: 'sample_token_hash',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      revoked_at: null,
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@leadflow.in',
        is_active: true,
        role: { id: 1, name: 'Admin', permissions: [{ id: 1, code: 'users:read' }] },
      },
    });

    test('1. Configured 7d expiry correctly calculates expires_at for login and refresh', async () => {
      process.env.JWT_REFRESH_EXPIRES_IN = '7d';
      const beforeTime = Date.now();

      // Test login expiry calculation
      jest.spyOn(User, 'findOne').mockResolvedValue({
        id: 1,
        name: 'Admin User',
        email: 'admin@leadflow.in',
        password_hash: '$2b$10$hashed',
        is_active: true,
        role: { name: 'Admin', permissions: [] },
      });
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      const loginCreateSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ id: 1 });

      await request(app)
        .post('/auth/login')
        .send({ email: 'admin@leadflow.in', password: 'Password@123' });

      expect(loginCreateSpy).toHaveBeenCalledTimes(1);
      const loginExpiresAt = loginCreateSpy.mock.calls[0][0].expires_at.getTime();
      const expected7dMs = 7 * 24 * 60 * 60 * 1000;
      expect(loginExpiresAt).toBeGreaterThanOrEqual(beforeTime + expected7dMs - 2000);
      expect(loginExpiresAt).toBeLessThanOrEqual(Date.now() + expected7dMs + 2000);

      // Test refresh expiry calculation
      loginCreateSpy.mockClear();
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(createMockTokenRecord());
      loginCreateSpy.mockResolvedValue({ id: 2 });

      await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(loginCreateSpy).toHaveBeenCalledTimes(1);
      const refreshExpiresAt = loginCreateSpy.mock.calls[0][0].expires_at.getTime();
      expect(refreshExpiresAt).toBeGreaterThanOrEqual(beforeTime + expected7dMs - 2000);
      expect(refreshExpiresAt).toBeLessThanOrEqual(Date.now() + expected7dMs + 2000);
    });

    test('2. Configured 14d expiry correctly calculates expires_at', async () => {
      process.env.JWT_REFRESH_EXPIRES_IN = '14d';
      const beforeTime = Date.now();

      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(createMockTokenRecord());
      const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ id: 3 });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(createSpy).toHaveBeenCalledTimes(1);
      const expiresAt = createSpy.mock.calls[0][0].expires_at.getTime();
      const expected14dMs = 14 * 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(beforeTime + expected14dMs - 2000);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + expected14dMs + 2000);
    });

    test('3. Configured 24h expiry correctly calculates expires_at', async () => {
      process.env.JWT_REFRESH_EXPIRES_IN = '24h';
      const beforeTime = Date.now();

      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(createMockTokenRecord());
      const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ id: 4 });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(createSpy).toHaveBeenCalledTimes(1);
      const expiresAt = createSpy.mock.calls[0][0].expires_at.getTime();
      const expected24hMs = 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(beforeTime + expected24hMs - 2000);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + expected24hMs + 2000);
    });

    test('4. Invalid or malformed expiry configuration safely rejects request with 500 without fallback', async () => {
      process.env.JWT_REFRESH_EXPIRES_IN = 'invalid_expiry_string';

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Verify missing configuration also throws
      delete process.env.JWT_REFRESH_EXPIRES_IN;

      const responseMissing = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(responseMissing.status).toBe(500);
      expect(responseMissing.body.success).toBe(false);

      // Restore valid environment variable
      process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    });

    test('5. Two concurrent refresh attempts using the same old token: exactly one succeeds and the other receives 401', async () => {
      let isRevokedInDb = false;

      // Mock row lock and conditional update behavior simulating atomic database synchronization
      jest.spyOn(RefreshToken, 'findOne').mockImplementation(async (options) => {
        expect(options.lock).toBeDefined();
        expect(options.transaction).toBe(mockTransaction);

        return {
          id: 88,
          user_id: 1,
          token_hash: 'simulated_concurrent_hash',
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
          revoked_at: isRevokedInDb ? new Date() : null,
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@leadflow.in',
            is_active: true,
            role: { id: 1, name: 'Admin', permissions: [] },
          },
        };
      });

      jest.spyOn(RefreshToken, 'update').mockImplementation(async (values, options) => {
        if (options && options.where && options.where.revoked_at === null) {
          if (!isRevokedInDb) {
            isRevokedInDb = true;
            return [1];
          }
          return [0];
        }
        return [1];
      });

      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ id: 89 });

      const [res1, res2] = await Promise.all([
        request(app).post('/auth/refresh').send({ refreshToken: validRefreshToken }),
        request(app).post('/auth/refresh').send({ refreshToken: validRefreshToken }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 401]);

      const successRes = res1.status === 200 ? res1 : res2;
      expect(successRes.body.success).toBe(true);
      expect(successRes.body.data.refreshToken).toBeDefined();

      const errorRes = res1.status === 401 ? res1 : res2;
      expect(errorRes.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    });

    test('6. Replacement-token insertion failure: the original token remains unrevoked because the transaction rolls back', async () => {
      const mockRecord = createMockTokenRecord();
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockRecord);
      jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);

      jest.spyOn(RefreshToken, 'create').mockRejectedValue(new Error('Database disk error on INSERT'));

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    test('7. Transaction is used for both revocation and replacement-token insertion', async () => {
      const mockRecord = createMockTokenRecord();
      const findOneSpy = jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockRecord);
      const updateSpy = jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);
      const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ id: 99 });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);

      expect(findOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: mockTransaction,
          lock: expect.anything(),
        })
      );

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ revoked_at: expect.any(Date) }),
        expect.objectContaining({ transaction: mockTransaction })
      );

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1 }),
        expect.objectContaining({ transaction: mockTransaction })
      );

      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
  });

  describe('GET /auth/me', () => {
    const validUserPayload = {
      id: 1,
      email: 'admin@leadflow.in',
      role: 'Admin',
      permissions: ['users:read', 'users:create'],
    };

    const mockDbUser = {
      id: 1,
      name: 'Admin User',
      email: 'admin@leadflow.in',
      password_hash: '$2b$10$verySecretHashedPasswordString',
      is_active: true,
      role: {
        id: 1,
        name: 'Admin',
        permissions: [
          { id: 1, code: 'users:read' },
          { id: 2, code: 'users:create' },
        ],
      },
    };

    test('1. Valid token returns latest user profile, role, and permissions with 200', async () => {
      const validToken = generateAccessToken(validUserPayload);
      const findByPkSpy = jest.spyOn(User, 'findByPk').mockResolvedValue(mockDbUser);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const { user } = response.body.data;
      expect(user).toEqual({
        id: 1,
        name: 'Admin User',
        email: 'admin@leadflow.in',
        role: 'Admin',
        permissions: ['users:read', 'users:create'],
      });

      expect(findByPkSpy).toHaveBeenCalledWith(1, expect.any(Object));

      // Security check: password_hash and token data are never exposed
      expect(user.password_hash).toBeUndefined();
      expect(response.body.data.password_hash).toBeUndefined();
      expect(response.body.data.token_hash).toBeUndefined();
      expect(response.body.data.refreshToken).toBeUndefined();
    });

    test('2. Missing Authorization header returns 401', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Authentication token required',
      });
    });

    test('3. Malformed Authorization header returns 401', async () => {
      const resNoBearer = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Basic 123456');

      expect(resNoBearer.status).toBe(401);
      expect(resNoBearer.body.message).toBe('Authentication token required');

      const resEmptyToken = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer ');

      expect(resEmptyToken.status).toBe(401);
      expect(resEmptyToken.body.message).toBe('Authentication token required');
    });

    test('4. Invalid or tampered access token returns 401', async () => {
      const invalidToken = jwt.sign(validUserPayload, 'wrong_secret_key_99999');

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('5. Expired access token returns 401', async () => {
      const expiredToken = jwt.sign(validUserPayload, validTokenSecret, { expiresIn: '-1s' });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('6. Deleted or non-existent user in database returns 401 with uniform message', async () => {
      const validToken = generateAccessToken(validUserPayload);
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'User not found or account is inactive',
      });
    });

    test('7. Inactive user in database returns 401 with uniform message', async () => {
      const validToken = generateAccessToken(validUserPayload);
      const inactiveDbUser = { ...mockDbUser, is_active: false };
      jest.spyOn(User, 'findByPk').mockResolvedValue(inactiveDbUser);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'User not found or account is inactive',
      });
    });

    test('8. User without role safely returns empty defaults', async () => {
      const validToken = generateAccessToken(validUserPayload);
      const userNoRole = {
        id: 1,
        name: 'User Without Role',
        email: 'norole@leadflow.in',
        is_active: true,
        role: null,
      };
      jest.spyOn(User, 'findByPk').mockResolvedValue(userNoRole);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('');
      expect(response.body.data.user.permissions).toEqual([]);
    });
  });

  describe('POST /auth/logout', () => {
    const validRefreshToken = 'c1c2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
    let validAccessToken;

    beforeEach(() => {
      validAccessToken = generateAccessToken({
        id: 1,
        email: 'admin@leadflow.in',
        role: 'Admin',
        permissions: ['users:read'],
      });
    });

    test('1. Valid token and owned refresh token revokes session and returns 200', async () => {
      const updateSpy = jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });

      // Verify single atomic update called with correct conditional where criteria
      expect(updateSpy).toHaveBeenCalledTimes(1);
      const [updateFields, updateOptions] = updateSpy.mock.calls[0];

      expect(updateFields.revoked_at instanceof Date).toBe(true);

      // Verify token is hashed using SHA-256 before database lookup
      const expectedHash = hashToken(validRefreshToken);
      expect(updateOptions.where.token_hash).toBe(expectedHash);
      expect(updateOptions.where.token_hash).not.toBe(validRefreshToken);

      // Verify update requires user_id and revoked_at: null
      expect(updateOptions.where.user_id).toBe(1);
      expect(updateOptions.where.revoked_at).toBeNull();
    });

    test('2. Missing Authorization header returns 401', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Authentication token required',
      });
    });

    test('3. Missing refreshToken in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('4. Malformed refreshToken (not 64 hex characters) returns 422', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ refreshToken: 'not_64_hex_characters' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('5. Non-string refreshToken returns 422', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ refreshToken: 1234567890 });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('6. Unexpected extra fields in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          refreshToken: validRefreshToken,
          extraField: 'unexpected',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('7. Unknown or already-revoked refresh token returns 401', async () => {
      // Simulate affectedRows = 0 (token not found or already revoked)
      jest.spyOn(RefreshToken, 'update').mockResolvedValue([0]);

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    });

    test('8. Another user refresh token cannot be revoked (returns 401 due to user_id mismatch)', async () => {
      // Caller has user id = 1, but token belongs to user id = 2 in database
      // The update query specifies user_id = 1, so MySQL updates 0 rows
      const updateSpy = jest.spyOn(RefreshToken, 'update').mockImplementation(async (values, options) => {
        if (options && options.where && options.where.user_id === 1) {
          // Token in DB belongs to user 2, so query with user_id: 1 matches 0 rows
          return [0];
        }
        return [1];
      });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      expect(updateSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 1 }),
        })
      );
    });

    test('9. Verify only one matching session is revoked (does not execute mass revocation)', async () => {
      const updateSpy = jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);

      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ refreshToken: validRefreshToken });

      const [, options] = updateSpy.mock.calls[0];
      // Assert exact single-token filter on token_hash is used, avoiding user-wide wipe
      expect(options.where.token_hash).toBeDefined();
      expect(typeof options.where.token_hash).toBe('string');
      expect(options.where.token_hash).toHaveLength(64);
    });
  });

  describe('POST /auth/forgot', () => {
    const validForgotPayload = {
      email: 'admin@leadflow.in',
    };

    const mockActiveUser = {
      id: 1,
      name: 'Admin User',
      email: 'admin@leadflow.in',
      is_active: true,
    };

    test('1. Valid registered email generates reset token, dispatches email, and returns 200 with uniform message', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockActiveUser);
      const sendEmailSpy = jest.spyOn(emailUtils, 'sendPasswordResetEmail').mockResolvedValue({
        sent: true,
        simulated: true,
      });

      const response = await request(app)
        .post('/auth/forgot')
        .send(validForgotPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Password reset link dispatched',
        },
      });

      // Assert email dispatch was invoked for the registered user with a valid JWT token
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      const [calledEmail, calledToken] = sendEmailSpy.mock.calls[0];
      expect(calledEmail).toBe('admin@leadflow.in');
      expect(typeof calledToken).toBe('string');
      expect(calledToken.split('.')).toHaveLength(3);

      // Verify the response body never exposes the reset token
      expect(response.body.data.token).toBeUndefined();
      expect(response.body.data.resetToken).toBeUndefined();
    });

    test('2. Unknown email returns identical 200 message and never dispatches email (anti-enumeration)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const sendEmailSpy = jest.spyOn(emailUtils, 'sendPasswordResetEmail').mockResolvedValue();

      const response = await request(app)
        .post('/auth/forgot')
        .send({ email: 'nonexistent@leadflow.in' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Password reset link dispatched',
        },
      });
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    test('3. Inactive user email returns identical 200 message and never dispatches email (anti-enumeration)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({
        id: 2,
        name: 'Inactive User',
        email: 'inactive@leadflow.in',
        is_active: false,
      });
      const sendEmailSpy = jest.spyOn(emailUtils, 'sendPasswordResetEmail').mockResolvedValue();

      const response = await request(app)
        .post('/auth/forgot')
        .send({ email: 'inactive@leadflow.in' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Password reset link dispatched',
        },
      });
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    test('4. Safely handles SMTP dispatch failure without exposing error or account existence', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockActiveUser);
      jest.spyOn(emailUtils, 'sendPasswordResetEmail').mockRejectedValue(new Error('SMTP Connection Failed'));

      const response = await request(app)
        .post('/auth/forgot')
        .send(validForgotPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Password reset link dispatched',
        },
      });
    });

    test('5. Missing email in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/forgot')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('6. Empty email string in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/forgot')
        .send({ email: '   ' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('7. Malformed email in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/forgot')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('8. Non-string email in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/forgot')
        .send({ email: 987654 });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('9. Unexpected extra fields in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/forgot')
        .send({
          email: 'admin@leadflow.in',
          extraField: 'unexpected',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('10. Trims and normalizes email before database query', async () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(mockActiveUser);
      jest.spyOn(emailUtils, 'sendPasswordResetEmail').mockResolvedValue({ sent: true });

      const response = await request(app)
        .post('/auth/forgot')
        .send({ email: '  ADMIN@LEADFLOW.IN  ' });

      expect(response.status).toBe(200);
      expect(findOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'admin@leadflow.in' },
        })
      );
    });
  });

  describe('POST /auth/reset', () => {
    let validResetToken;
    const strongNewPassword = 'BrandNewPassword@2026';

    const mockActiveUser = {
      id: 1,
      name: 'Admin User',
      email: 'admin@leadflow.in',
      is_active: true,
      update: jest.fn().mockResolvedValue(),
    };

    beforeEach(() => {
      validResetToken = generateResetToken({ id: 1 });
      mockActiveUser.update = jest.fn().mockResolvedValue();
    });

    test('1. Successful password reset updates password, records audit log, and revokes refresh tokens', async () => {
      const findAuditSpy = jest.spyOn(AuditLog, 'findOne').mockResolvedValue(null);
      const findUserSpy = jest.spyOn(User, 'findByPk').mockResolvedValue(mockActiveUser);
      const createAuditSpy = jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 1 });
      const hashPasswordSpy = jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('$2b$10$newlyHashedPass');
      const updateRefreshSpy = jest.spyOn(RefreshToken, 'update').mockResolvedValue([2]);

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Password reset successfully',
        },
      });

      // Verify AuditLog was checked for token hash
      const expectedTokenHash = hashToken(validResetToken);
      expect(findAuditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'PASSWORD_RESET',
            details: expectedTokenHash,
          }),
        })
      );

      // Verify User was locked inside transaction with t.LOCK.UPDATE
      expect(findUserSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          transaction: mockTransaction,
          lock: mockTransaction.LOCK.UPDATE,
        })
      );

      // Verify AuditLog creation inside transaction
      expect(createAuditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          action: 'PASSWORD_RESET',
          entity: 'User',
          entity_id: '1',
          details: expectedTokenHash,
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );

      // Verify password was hashed and user record updated inside transaction
      expect(hashPasswordSpy).toHaveBeenCalledWith(strongNewPassword);
      expect(mockActiveUser.update).toHaveBeenCalledWith(
        { password_hash: '$2b$10$newlyHashedPass' },
        expect.objectContaining({ transaction: mockTransaction })
      );

      // Verify active refresh tokens were revoked for the user inside transaction
      expect(updateRefreshSpy).toHaveBeenCalledWith(
        expect.objectContaining({ revoked_at: expect.any(Date) }),
        expect.objectContaining({
          where: { user_id: 1, revoked_at: null },
          transaction: mockTransaction,
        })
      );

      // Verify transaction committed
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('2. Reusing the same reset token returns 401 when token hash is in AuditLog', async () => {
      // Simulate token hash already recorded in AuditLog
      jest.spyOn(AuditLog, 'findOne').mockResolvedValue({
        id: 99,
        action: 'PASSWORD_RESET',
        details: hashToken(validResetToken),
      });

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
      expect(mockActiveUser.update).not.toHaveBeenCalled();
    });

    test('3. Reset token with invalid JWT signature returns 401', async () => {
      const tamperedToken = jwt.sign(
        { id: 1, type: 'password_reset' },
        'wrong_secret_key_should_fail',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: tamperedToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    test('4. Expired reset token returns 401', async () => {
      const expiredToken = jwt.sign(
        { id: 1, type: 'password_reset' },
        validResetSecret,
        { expiresIn: '-1s' }
      );

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: expiredToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    test('5. Wrong token type (access token instead of password_reset) returns 401', async () => {
      const accessTokenWrongType = jwt.sign(
        { id: 1, email: 'admin@leadflow.in', role: 'Admin', permissions: [] },
        validResetSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: accessTokenWrongType,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    test('6. Non-existent user returns 401', async () => {
      jest.spyOn(AuditLog, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('7. Inactive user returns 401', async () => {
      jest.spyOn(AuditLog, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        id: 1,
        is_active: false,
        update: jest.fn(),
      });

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('8. Missing token returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('9. Malformed token format (not a 3-part JWT) returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: 'not-a-valid-jwt-token',
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('10. Non-string token returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: 123456789,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('11. Missing newPassword returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('12. Non-string newPassword returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: { password: strongNewPassword },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('13. Short newPassword (< 8 chars) returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: 'Pass1',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('14. NewPassword without letters returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: '1234567890123',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('15. NewPassword without numbers returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: 'PureLettersOnlyPassword',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('16. Unexpected extra fields in request body returns 422', async () => {
      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
          extraField: 'unexpected',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test('17. Transaction rolls back when password update fails', async () => {
      jest.spyOn(AuditLog, 'findOne').mockResolvedValue(null);
      const failingUser = {
        id: 1,
        is_active: true,
        update: jest.fn().mockRejectedValue(new Error('Database disk write error')),
      };
      jest.spyOn(User, 'findByPk').mockResolvedValue(failingUser);
      jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 1 });
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('$2b$10$hashed');

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('18. Concurrent race condition check inside transaction rejects token reuse', async () => {
      let callCount = 0;
      jest.spyOn(AuditLog, 'findOne').mockImplementation(async (options) => {
        callCount++;
        // First check outside transaction returns null
        if (callCount === 1) {
          return null;
        }
        // Second check inside transaction detects another request just completed
        return { id: 100, action: 'PASSWORD_RESET' };
      });

      jest.spyOn(User, 'findByPk').mockResolvedValue(mockActiveUser);

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('19. Audit-log lookup happens strictly after acquiring user row lock within the transaction', async () => {
      const callSequence = [];
      jest.spyOn(AuditLog, 'findOne').mockImplementation(async (options) => {
        if (options && options.transaction) {
          callSequence.push('AuditLog.findOne(transaction)');
        } else {
          callSequence.push('AuditLog.findOne(pre-check)');
        }
        return null;
      });

      jest.spyOn(User, 'findByPk').mockImplementation(async (id, options) => {
        callSequence.push(`User.findByPk(lock:${options && options.lock})`);
        return mockActiveUser;
      });

      jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 1 });
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('$2b$10$newpass');
      jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(200);
      expect(callSequence).toEqual([
        'AuditLog.findOne(pre-check)',
        'User.findByPk(lock:UPDATE)',
        'AuditLog.findOne(transaction)',
      ]);
    });

    test('20. Concurrency (Mocked Simulation): Second concurrent request waiting on user row lock finds used token in AuditLog and returns 401', async () => {
      // NOTE: This test uses Jest mocks to simulate the serial execution guaranteed by MySQL InnoDB:
      // When Request 1 commits, Request 2 acquires the user row lock, checks audit_logs within transaction,
      // detects the PASSWORD_RESET record inserted by Request 1, and rejects with 401 Unauthorized.
      let auditRecordCommitted = false;

      // Transaction 1 succeeds and sets auditRecordCommitted = true
      // Transaction 2 begins, acquires user lock, checks audit_logs, finds the committed record
      jest.spyOn(AuditLog, 'findOne').mockImplementation(async (options) => {
        // If running within transaction for the second request, the first request has committed
        if (options && options.transaction && auditRecordCommitted) {
          return { id: 101, action: 'PASSWORD_RESET', details: hashToken(validResetToken) };
        }
        return null;
      });

      jest.spyOn(User, 'findByPk').mockResolvedValue(mockActiveUser);
      jest.spyOn(AuditLog, 'create').mockImplementation(async () => {
        auditRecordCommitted = true;
        return { id: 101 };
      });
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('$2b$10$hashed');
      jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);

      // Execute Request 1 (first request succeeds)
      const res1 = await request(app)
        .post('/auth/reset')
        .send({ token: validResetToken, newPassword: strongNewPassword });

      expect(res1.status).toBe(200);
      expect(auditRecordCommitted).toBe(true);

      // Execute Request 2 (second concurrent request using the same token after lock acquisition)
      const res2 = await request(app)
        .post('/auth/reset')
        .send({ token: validResetToken, newPassword: strongNewPassword });

      expect(res2.status).toBe(401);
      expect(res2.body).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    test('21. Transaction rolls back if AuditLog insertion fails inside transaction', async () => {
      jest.spyOn(AuditLog, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockActiveUser);
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('$2b$10$hashed');
      jest.spyOn(AuditLog, 'create').mockRejectedValue(new Error('AuditLog DB insert failure'));

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('22. Transaction rolls back if RefreshToken update fails inside transaction', async () => {
      jest.spyOn(AuditLog, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockActiveUser);
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('$2b$10$hashed');
      jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 1 });
      jest.spyOn(RefreshToken, 'update').mockRejectedValue(new Error('RefreshToken DB update failure'));

      const response = await request(app)
        .post('/auth/reset')
        .send({
          token: validResetToken,
          newPassword: strongNewPassword,
        });

      expect(response.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
