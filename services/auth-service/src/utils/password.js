const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password using bcrypt.
 * Uses 10 salt rounds to remain compatible with existing seeded bcrypt hashes.
 *
 * @param {string} plainPassword - The plain-text password to hash
 * @returns {Promise<string>} The resulting bcrypt password hash
 */
const hashPassword = async (plainPassword) => {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Password must be a non-empty string');
  }

  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against a stored bcrypt hash.
 *
 * @param {string} plainPassword - The plain-text password to check
 * @param {string} hashedPassword - The stored bcrypt hash to compare against
 * @returns {Promise<boolean>} True if match, false if mismatch
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Password must be a non-empty string');
  }

  if (typeof hashedPassword !== 'string' || hashedPassword.length === 0) {
    throw new Error('Hashed password must be a non-empty string');
  }

  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
