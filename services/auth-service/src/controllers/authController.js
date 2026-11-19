const passwordUtils = require('../utils/password');
const jwtUtils = require('../utils/jwt');
const emailUtils = require('../utils/email');
const { sendSuccess, UnauthorizedError } = require('../../../../shared');

// Lazy-load models to prevent eager database binding when app is imported in non-DB tests (e.g. healthEndpoints)
let models = null;
const getModels = () => {
  if (!models) {
    models = require('../models');
  }
  return models;
};

/**
 * Parse a duration string (e.g. '7d', '14d', '24h', '30m', '60s') into milliseconds.
 *
 * @param {string} durationStr - Duration string to parse
 * @returns {number} Duration in milliseconds
 * @throws {Error} If duration is missing, not a string, or invalid format
 */
const parseDurationToMs = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string' || durationStr.trim() === '') {
    throw new Error('JWT_REFRESH_EXPIRES_IN is not configured');
  }

  const match = durationStr.trim().match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN configuration: unsupported format "${durationStr}"`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (value <= 0) {
    throw new Error('Invalid JWT_REFRESH_EXPIRES_IN configuration: duration must be greater than zero');
  }

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit in JWT_REFRESH_EXPIRES_IN: "${unit}"`);
  }
};

/**
 * Calculate the expiration Date for a refresh token based on JWT_REFRESH_EXPIRES_IN.
 *
 * @returns {Date} Expiration date
 */
const calculateRefreshExpiresAt = () => {
  const ms = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + ms);
};

/**
 * Handle user login: authenticate credentials, issue JWT access token and refresh token.
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { User, Role, Permission, RefreshToken } = getModels();
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : email;

    // Find user by normalized email including Role and Permissions
    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Uniform rejection message for missing and inactive users
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password against stored bcrypt hash
    const isPasswordValid = await passwordUtils.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Extract role name and string permission codes
    const roleName = user.role ? user.role.name : '';
    const permissions =
      user.role && Array.isArray(user.role.permissions)
        ? user.role.permissions.map((p) => p.code)
        : [];

    // Generate JWT access token with required Gateway fields
    const accessToken = jwtUtils.generateAccessToken({
      id: user.id,
      email: user.email,
      role: roleName,
      permissions,
    });

    // Calculate dynamic expiration date from JWT_REFRESH_EXPIRES_IN
    const expiresAt = calculateRefreshExpiresAt();

    // Generate secure random refresh token and hash it for storage
    const rawRefreshToken = jwtUtils.generateRefreshToken();
    const tokenHash = jwtUtils.hashToken(rawRefreshToken);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: roleName,
          permissions,
        },
        accessToken,
        refreshToken: rawRefreshToken,
      },
      200
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle refresh token rotation: validate existing token, revoke it, and issue new token pair.
 * Executes inside a Sequelize transaction with row-level locking and atomic conditional updates.
 * POST /auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { sequelize, RefreshToken, User, Role, Permission } = getModels();
    const { refreshToken: rawRefreshToken } = req.body;

    // Validate expiration configuration before entering transaction
    const newExpiresAt = calculateRefreshExpiresAt();

    // Hash the submitted refresh token to match against stored hash
    const tokenHash = jwtUtils.hashToken(rawRefreshToken);

    let resultData;

    await sequelize.transaction(async (t) => {
      const lockOption = t && t.LOCK && t.LOCK.UPDATE ? t.LOCK.UPDATE : true;

      // 1. Find existing refresh-token record with row lock inside transaction
      const tokenRecord = await RefreshToken.findOne({
        where: { token_hash: tokenHash },
        include: [
          {
            model: User,
            as: 'user',
            include: [
              {
                model: Role,
                as: 'role',
                include: [
                  {
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
        lock: lockOption,
      });

      // Reject missing token record
      if (!tokenRecord) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Reject already-revoked tokens (in-memory validation)
      if (tokenRecord.revoked_at !== null) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Reject expired tokens
      if (new Date() > new Date(tokenRecord.expires_at)) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Reject if user is missing or inactive
      if (!tokenRecord.user || !tokenRecord.user.is_active) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // 2. Conditional atomic update: revoke old token only if revoked_at is still null
      // Protects against concurrent reuse and race conditions
      const [affectedRows] = await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: {
            id: tokenRecord.id,
            revoked_at: null,
          },
          transaction: t,
        }
      );

      if (affectedRows === 0) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      tokenRecord.revoked_at = new Date();

      // 3. Generate new refresh token and store only its SHA-256 hash inside transaction
      const newRawRefreshToken = jwtUtils.generateRefreshToken();
      const newTokenHash = jwtUtils.hashToken(newRawRefreshToken);

      await RefreshToken.create(
        {
          user_id: tokenRecord.user_id,
          token_hash: newTokenHash,
          expires_at: newExpiresAt,
        },
        { transaction: t }
      );

      // 4. Generate fresh access token for user
      const user = tokenRecord.user;
      const roleName = user.role ? user.role.name : '';
      const permissions =
        user.role && Array.isArray(user.role.permissions)
          ? user.role.permissions.map((p) => p.code)
          : [];

      const newAccessToken = jwtUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        role: roleName,
        permissions,
      });

      resultData = {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
      };
    });

    return sendSuccess(res, resultData, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get current authenticated user profile, role, and permissions from the database.
 * GET /auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const { User, Role, Permission } = getModels();

    // Query latest user record from database using verified token user id
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Reject missing or inactive users
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or account is inactive');
    }

    const roleName = user.role ? user.role.name : '';
    const permissions =
      user.role && Array.isArray(user.role.permissions)
        ? user.role.permissions.map((p) => p.code)
        : [];

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: roleName,
          permissions,
        },
      },
      200
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle user logout: revoke single matching refresh token belonging to the authenticated user.
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { RefreshToken } = getModels();
    const { refreshToken: rawRefreshToken } = req.body;

    // Hash the submitted refresh token using SHA-256
    const tokenHash = jwtUtils.hashToken(rawRefreshToken);

    // Conditional atomic update: revoke only if matching token_hash, user_id, and revoked_at is null
    const [affectedRows] = await RefreshToken.update(
      { revoked_at: new Date() },
      {
        where: {
          token_hash: tokenHash,
          user_id: req.user.id,
          revoked_at: null,
        },
      }
    );

    if (affectedRows === 0) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    return sendSuccess(
      res,
      {
        message: 'Logged out successfully',
      },
      200
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle forgot password request: generate password reset token and dispatch email link.
 * Implements anti-enumeration: returns identical 200 response whether email exists/active or not.
 * Never exposes or logs raw reset tokens, passwords, or secrets.
 * POST /auth/forgot
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { User } = getModels();
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : email;

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (user && user.is_active) {
      const resetToken = jwtUtils.generateResetToken({ id: user.id });
      try {
        await emailUtils.sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        // Safe logging without leaking secrets or tokens
        // Do not expose email sending failure or account existence to the client
      }
    }

    return sendSuccess(
      res,
      {
        message: 'Password reset link dispatched',
      },
      200
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle password reset: verify reset token, ensure single-use via AuditLog, update password hash,
 * and revoke all existing refresh tokens in an atomic database transaction with user row lock.
 * POST /auth/reset
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    let decoded;
    try {
      decoded = jwtUtils.verifyResetToken(token);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const tokenHash = jwtUtils.hashToken(token);
    const { sequelize, User, RefreshToken, AuditLog } = getModels();

    // Fast-path pre-check outside transaction to reject early if token was already consumed
    const alreadyUsed = await AuditLog.findOne({
      where: {
        action: 'PASSWORD_RESET',
        details: tokenHash,
      },
    });

    if (alreadyUsed) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Execute atomic transaction with user row lock for strict serializable concurrency
    await sequelize.transaction(async (t) => {
      // 1. Lock the existing user row using User.findByPk() with transaction: t and lock: t.LOCK.UPDATE
      const user = await User.findByPk(decoded.id, {
        transaction: t,
        lock: t.LOCK && t.LOCK.UPDATE ? t.LOCK.UPDATE : undefined,
      });

      // 2. Perform user existence and active-account checks using the locked user record
      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // 3. After acquiring the user row lock, check audit_logs again for action: 'PASSWORD_RESET' and details: tokenHash
      const concurrentCheck = await AuditLog.findOne({
        where: {
          action: 'PASSWORD_RESET',
          details: tokenHash,
        },
        transaction: t,
      });

      // 4. If the token hash already exists, reject with UnauthorizedError
      if (concurrentCheck) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // 5. If the token has not been used:
      // Hash new password
      const newPasswordHash = await passwordUtils.hashPassword(newPassword);

      // Update the user's password
      await user.update({ password_hash: newPasswordHash }, { transaction: t });

      // Insert the PASSWORD_RESET audit record
      await AuditLog.create(
        {
          user_id: user.id,
          action: 'PASSWORD_RESET',
          entity: 'User',
          entity_id: String(user.id),
          ip: req.ip || null,
          details: tokenHash,
        },
        { transaction: t }
      );

      // Revoke all active refresh tokens belonging to that user
      await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: {
            user_id: user.id,
            revoked_at: null,
          },
          transaction: t,
        }
      );
    });

    return sendSuccess(
      res,
      {
        message: 'Password reset successfully',
      },
      200
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  parseDurationToMs,
  calculateRefreshExpiresAt,
};
