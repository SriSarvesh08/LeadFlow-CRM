const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Retrieve the JWT Access Token secret from environment.
 * @throws {Error} If JWT_SECRET is not configured.
 */
const getAccessSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

/**
 * Retrieve the JWT Reset Token secret from environment.
 * @throws {Error} If JWT_RESET_SECRET is not configured.
 */
const getResetSecret = () => {
  const secret = process.env.JWT_RESET_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('JWT_RESET_SECRET is not configured');
  }
  return secret;
};

/**
 * Generate a signed JWT Access Token compatible with the API Gateway.
 *
 * @param {object} payload - Token payload
 * @param {number|string} payload.id - User ID
 * @param {string} payload.email - User email address
 * @param {string} payload.role - User role name
 * @param {string[]} payload.permissions - Array of permission codes
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object');
  }

  const { id, email, role, permissions } = payload;

  if (id === undefined || id === null || id === '') {
    throw new Error('Payload must include a valid user id');
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('Payload must include a valid email string');
  }

  if (!role || typeof role !== 'string' || role.trim() === '') {
    throw new Error('Payload must include a valid role string');
  }

  if (!Array.isArray(permissions)) {
    throw new Error('Payload permissions must be an array');
  }

  const secret = getAccessSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(
    {
      id,
      email: email.trim(),
      role: role.trim(),
      permissions,
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verify and decode a JWT Access Token.
 *
 * @param {string} token - The raw JWT access token string
 * @returns {object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Token must be a non-empty string');
  }

  const secret = getAccessSecret();
  return jwt.verify(token, secret);
};

/**
 * Generate a cryptographically secure random refresh token.
 * Generates 32 random bytes returned as a 64-character hexadecimal string.
 *
 * @returns {string} Raw random refresh token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Compute a SHA-256 hexadecimal hash of an input token.
 * Used to securely store refresh tokens in refresh_tokens.token_hash.
 *
 * @param {string} token - Raw token string to hash
 * @returns {string} 64-character SHA-256 hexadecimal hash
 */
const hashToken = (token) => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Token must be a non-empty string');
  }

  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a signed Password Reset JWT token.
 *
 * @param {object} payload - Reset payload
 * @param {number|string} payload.id - User ID
 * @returns {string} Signed password reset token
 */
const generateResetToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object');
  }

  const { id } = payload;
  if (id === undefined || id === null || id === '') {
    throw new Error('Payload must include a valid user id');
  }

  const secret = getResetSecret();
  const expiresIn = process.env.RESET_TOKEN_EXPIRES_IN || '1h';

  return jwt.sign(
    {
      id,
      type: 'password_reset',
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verify and decode a Password Reset JWT token.
 *
 * @param {string} token - Raw reset token string
 * @returns {object} Decoded token payload
 */
const verifyResetToken = (token) => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Token must be a non-empty string');
  }

  const secret = getResetSecret();
  const decoded = jwt.verify(token, secret);

  if (!decoded || decoded.type !== 'password_reset') {
    throw new Error('Invalid token type: expected password_reset');
  }

  return decoded;
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  generateResetToken,
  verifyResetToken,
};
