const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  generateResetToken,
  verifyResetToken,
} = require('../src/utils/jwt');

describe('Auth Service — JWT & Token Utilities Unit Tests', () => {
  const originalEnv = process.env;

  const validPayload = {
    id: 1,
    email: 'admin@leadflow.in',
    role: 'Admin',
    permissions: ['users.read', 'users.create', 'users.update'],
  };

  const testAccessSecret = 'test_access_secret_key_1234567890';
  const testResetSecret = 'test_reset_secret_key_0987654321';

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: testAccessSecret,
      JWT_RESET_SECRET: testResetSecret,
      JWT_EXPIRES_IN: '15m',
      RESET_TOKEN_EXPIRES_IN: '1h',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateAccessToken & verifyAccessToken', () => {
    test('1. Access-token generation returns a valid JWT string with three parts', () => {
      const token = generateAccessToken(validPayload);

      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    test('2. Access-token payload includes id, email, role, and permissions', () => {
      const token = generateAccessToken(validPayload);
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe(validPayload.id);
      expect(decoded.email).toBe(validPayload.email);
      expect(decoded.role).toBe(validPayload.role);
      expect(decoded.permissions).toEqual(validPayload.permissions);
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });

    test('3. Access-token verification returns the expected decoded payload', () => {
      const token = generateAccessToken(validPayload);
      const verified = verifyAccessToken(token);

      expect(verified.id).toBe(validPayload.id);
      expect(verified.email).toBe(validPayload.email);
      expect(verified.role).toBe(validPayload.role);
      expect(verified.permissions).toEqual(validPayload.permissions);
    });

    test('4. Invalid access tokens are rejected with JsonWebTokenError', () => {
      expect(() => verifyAccessToken('invalid.token.structure')).toThrow(jwt.JsonWebTokenError);
      expect(() => verifyAccessToken('completely_invalid_token')).toThrow();
    });

    test('5. Expired access tokens are rejected with TokenExpiredError', () => {
      // Sign a token that is immediately expired
      const expiredToken = jwt.sign(validPayload, testAccessSecret, { expiresIn: '0s' });

      expect(() => verifyAccessToken(expiredToken)).toThrow(jwt.TokenExpiredError);
    });

    test('10a. Invalid access-token inputs and payloads are rejected', () => {
      // Invalid token inputs to verifyAccessToken
      expect(() => verifyAccessToken('')).toThrow('Token must be a non-empty string');
      expect(() => verifyAccessToken(null)).toThrow('Token must be a non-empty string');
      expect(() => verifyAccessToken(undefined)).toThrow('Token must be a non-empty string');
      expect(() => verifyAccessToken(12345)).toThrow('Token must be a non-empty string');

      // Invalid payload inputs to generateAccessToken
      expect(() => generateAccessToken(null)).toThrow('Payload must be a valid object');
      expect(() => generateAccessToken({})).toThrow('Payload must include a valid user id');
      expect(() => generateAccessToken({ id: 1 })).toThrow('Payload must include a valid email string');
      expect(() => generateAccessToken({ id: 1, email: 'a@b.com' })).toThrow('Payload must include a valid role string');
      expect(() => generateAccessToken({ id: 1, email: 'a@b.com', role: 'Admin' })).toThrow('Payload permissions must be an array');
    });
  });

  describe('generateRefreshToken & hashToken', () => {
    test('6. Refresh-token generation returns a secure random token (at least 32 bytes / 64 hex characters)', () => {
      const refreshToken = generateRefreshToken();

      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBe(64);
      expect(refreshToken).toMatch(/^[0-9a-f]{64}$/);
    });

    test('7. Two independently generated refresh tokens are distinct and non-matching', () => {
      const tokenA = generateRefreshToken();
      const tokenB = generateRefreshToken();

      expect(tokenA).not.toBe(tokenB);
    });

    test('8. hashToken() returns a 64-character SHA-256 hexadecimal hash', () => {
      const rawToken = generateRefreshToken();
      const hashed = hashToken(rawToken);

      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBe(64);
      expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    });

    test('9. Identical input tokens produce identical deterministic hashes', () => {
      const rawToken = 'my_consistent_sample_refresh_token_123';
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);

      expect(hash1).toBe(hash2);
    });

    test('10b. Invalid token inputs to hashToken are rejected', () => {
      expect(() => hashToken('')).toThrow('Token must be a non-empty string');
      expect(() => hashToken(null)).toThrow('Token must be a non-empty string');
      expect(() => hashToken(undefined)).toThrow('Token must be a non-empty string');
      expect(() => hashToken(12345)).toThrow('Token must be a non-empty string');
      expect(() => hashToken({})).toThrow('Token must be a non-empty string');
    });
  });

  describe('generateResetToken & verifyResetToken', () => {
    const resetPayload = { id: 42 };

    test('11. A valid password-reset token is accepted', () => {
      const resetToken = generateResetToken(resetPayload);

      expect(typeof resetToken).toBe('string');
      const verified = verifyResetToken(resetToken);
      expect(verified.id).toBe(resetPayload.id);
      expect(verified.type).toBe('password_reset');
    });

    test('11a. A token signed with the reset secret but without the correct type is rejected', () => {
      // Token signed with reset secret, but missing the `type` property entirely
      const tokenWithoutType = jwt.sign({ id: 42 }, testResetSecret, { expiresIn: '1h' });

      expect(() => verifyResetToken(tokenWithoutType)).toThrow('Invalid token type: expected password_reset');
    });

    test('11b. A token signed with the reset secret but with an incorrect type is rejected', () => {
      // Token signed with reset secret, but with a different `type` property
      const tokenWithWrongType = jwt.sign({ id: 42, type: 'email_verification' }, testResetSecret, { expiresIn: '1h' });

      expect(() => verifyResetToken(tokenWithWrongType)).toThrow('Invalid token type: expected password_reset');
    });

    test('12. Invalid reset tokens or tokens signed with access secret are rejected', () => {
      expect(() => verifyResetToken('invalid.reset.jwt')).toThrow();

      // Token signed with access secret should NOT verify with reset secret
      const accessSignedToken = jwt.sign(resetPayload, testAccessSecret);
      expect(() => verifyResetToken(accessSignedToken)).toThrow(jwt.JsonWebTokenError);
    });

    test('13. Expired reset tokens are rejected with TokenExpiredError', () => {
      const expiredReset = jwt.sign({ id: 42, type: 'password_reset' }, testResetSecret, { expiresIn: '0s' });

      expect(() => verifyResetToken(expiredReset)).toThrow(jwt.TokenExpiredError);
    });

    test('10c. Invalid reset-token inputs and payloads are rejected', () => {
      expect(() => verifyResetToken('')).toThrow('Token must be a non-empty string');
      expect(() => verifyResetToken(null)).toThrow('Token must be a non-empty string');
      expect(() => generateResetToken(null)).toThrow('Payload must be a valid object');
      expect(() => generateResetToken({})).toThrow('Payload must include a valid user id');
    });
  });

  describe('Configuration & Security Checks', () => {
    test('14. Missing access or reset secrets produce configuration errors', () => {
      // Missing access secret
      delete process.env.JWT_SECRET;
      expect(() => generateAccessToken(validPayload)).toThrow('JWT_SECRET is not configured');
      expect(() => verifyAccessToken('some.mock.token')).toThrow('JWT_SECRET is not configured');

      // Restore access secret, delete reset secret
      process.env.JWT_SECRET = testAccessSecret;
      delete process.env.JWT_RESET_SECRET;
      expect(() => generateResetToken({ id: 1 })).toThrow('JWT_RESET_SECRET is not configured');
      expect(() => verifyResetToken('some.mock.token')).toThrow('JWT_RESET_SECRET is not configured');
    });

    test('15. Default expiration fallbacks are used when expiration env vars are omitted', () => {
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.RESET_TOKEN_EXPIRES_IN;

      const accessToken = generateAccessToken(validPayload);
      expect(typeof accessToken).toBe('string');

      const resetToken = generateResetToken({ id: 1 });
      expect(typeof resetToken).toBe('string');
    });
  });
});
