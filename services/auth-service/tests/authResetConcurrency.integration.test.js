/**
 * Real MySQL Password Reset Concurrency Integration Test
 *
 * Exercises true MySQL InnoDB row-locking and transaction isolation
 * through overlapping HTTP requests to POST /auth/reset.
 *
 * SAFETY GUARDRAIL:
 * This test MUST ONLY run against the dedicated test database 'crm_auth_test'.
 * If the database name is anything else, execution aborts immediately.
 */

// Configure environment for real test database before loading application modules
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'crm_auth_test';
process.env.JWT_SECRET = 'real_mysql_integration_test_jwt_access_secret_2026';
process.env.JWT_RESET_SECRET = 'real_mysql_integration_test_jwt_reset_secret_2026';
process.env.RESET_TOKEN_EXPIRES_IN = '1h';
process.env.EMAIL_SIMULATION = 'true';

const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, RefreshToken, AuditLog } = require('../src/models');
const passwordUtils = require('../src/utils/password');
const jwtUtils = require('../src/utils/jwt');

// Set Jest timeout for real database operations
jest.setTimeout(30000);

describe('Auth Service — Real MySQL Concurrency Integration Test (crm_auth_test)', () => {
  let testUser = null;
  let resetToken = null;
  let tokenHash = null;

  const initialPassword = 'InitialSecurePassword@123';
  const newPasswordAlpha = 'WinningPassword@Alpha2026';
  const newPasswordBeta = 'WinningPassword@Beta2026';

  beforeAll(async () => {
    // 1. Database isolation verification: strictly require crm_auth_test
    const activeDatabase = sequelize.getDatabaseName();
    if (activeDatabase !== 'crm_auth_test') {
      throw new Error(
        `FATAL SAFETY CHECK: Active database is "${activeDatabase}". This integration test MUST ONLY execute against "crm_auth_test". Aborting before any write operation.`
      );
    }

    // Authenticate real database connection
    await sequelize.authenticate();

    // 2. Create uniquely named temporary test user using existing Admin role (role_id: 1)
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const testEmail = `integration.test.user.${uniqueSuffix}@leadflow.in`;
    const initialPasswordHash = await passwordUtils.hashPassword(initialPassword);

    testUser = await User.create({
      name: `Integration Test User ${uniqueSuffix}`,
      email: testEmail,
      password_hash: initialPasswordHash,
      role_id: 1, // Pre-seeded Admin reference role in crm_auth_test
      is_active: true,
    });

    // 3. Create at least two active refresh-token records for this user in MySQL
    const rawRefreshToken1 = jwtUtils.generateRefreshToken();
    const rawRefreshToken2 = jwtUtils.generateRefreshToken();

    await RefreshToken.create({
      user_id: testUser.id,
      token_hash: jwtUtils.hashToken(rawRefreshToken1),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked_at: null,
    });

    await RefreshToken.create({
      user_id: testUser.id,
      token_hash: jwtUtils.hashToken(rawRefreshToken2),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked_at: null,
    });

    // Verify initial active refresh tokens exist in database
    const initialActiveTokens = await RefreshToken.findAll({
      where: { user_id: testUser.id, revoked_at: null },
    });
    expect(initialActiveTokens).toHaveLength(2);

    // 4. Generate one genuine password-reset token
    resetToken = jwtUtils.generateResetToken({ id: testUser.id });
    tokenHash = jwtUtils.hashToken(resetToken);
  });

  afterAll(async () => {
    try {
      // Clean up only records belonging to the uniquely created test user
      if (testUser && testUser.id) {
        await AuditLog.destroy({ where: { user_id: testUser.id } });
        await RefreshToken.destroy({ where: { user_id: testUser.id } });
        await User.destroy({ where: { id: testUser.id } });
      }
    } finally {
      // Close the Sequelize connection pool
      await sequelize.close();
    }
  });

  test('Simultaneous password-reset requests with the same token result in exactly one 200 and one 401 via InnoDB row locking', async () => {
    // Confirm zero mocking: verify models and sequelize are real instances
    expect(jest.isMockFunction(sequelize.transaction)).toBe(false);
    expect(jest.isMockFunction(User.findByPk)).toBe(false);
    expect(jest.isMockFunction(AuditLog.findOne)).toBe(false);
    expect(jest.isMockFunction(RefreshToken.update)).toBe(false);

    // Send two concurrent HTTP requests using the exact same reset token
    const [resAlpha, resBeta] = await Promise.all([
      request(app).post('/auth/reset').send({
        token: resetToken,
        newPassword: newPasswordAlpha,
      }),
      request(app).post('/auth/reset').send({
        token: resetToken,
        newPassword: newPasswordBeta,
      }),
    ]);

    const results = [resAlpha, resBeta];
    const successRes = results.find((r) => r.status === 200);
    const failureRes = results.find((r) => r.status === 401);

    // 1. Verify exactly one request succeeded with 200 and one was rejected with 401
    expect(successRes).toBeDefined();
    expect(failureRes).toBeDefined();

    expect(successRes.body).toEqual({
      success: true,
      data: {
        message: 'Password reset successfully',
      },
    });

    expect(failureRes.body).toEqual({
      success: false,
      message: 'Invalid or expired reset token',
    });

    // Determine winning and losing passwords
    const winningPassword = resAlpha.status === 200 ? newPasswordAlpha : newPasswordBeta;
    const losingPassword = resAlpha.status === 200 ? newPasswordBeta : newPasswordAlpha;

    // 2. Verify exactly one PASSWORD_RESET audit record exists in MySQL for this token hash
    const auditLogs = await AuditLog.findAll({
      where: {
        user_id: testUser.id,
        action: 'PASSWORD_RESET',
        details: tokenHash,
      },
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].entity).toBe('User');
    expect(auditLogs[0].entity_id).toBe(String(testUser.id));

    // 3. Verify all active refresh tokens for this user have been revoked
    const activeRefreshTokens = await RefreshToken.findAll({
      where: {
        user_id: testUser.id,
        revoked_at: null,
      },
    });
    expect(activeRefreshTokens).toHaveLength(0);

    const allRefreshTokens = await RefreshToken.findAll({
      where: { user_id: testUser.id },
    });
    expect(allRefreshTokens).toHaveLength(2);
    expect(allRefreshTokens[0].revoked_at).not.toBeNull();
    expect(allRefreshTokens[1].revoked_at).not.toBeNull();

    // 4. Verify the stored password hash in MySQL matches the winning request password
    await testUser.reload();
    const isWinningMatch = await passwordUtils.comparePassword(
      winningPassword,
      testUser.password_hash
    );
    expect(isWinningMatch).toBe(true);

    // 5. Verify the password hash does NOT match the losing request password
    const isLosingMatch = await passwordUtils.comparePassword(
      losingPassword,
      testUser.password_hash
    );
    expect(isLosingMatch).toBe(false);

    // 6. Verify password does not match original password
    const isInitialMatch = await passwordUtils.comparePassword(
      initialPassword,
      testUser.password_hash
    );
    expect(isInitialMatch).toBe(false);
  });
});
