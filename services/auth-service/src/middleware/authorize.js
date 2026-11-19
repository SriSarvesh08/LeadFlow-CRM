const { UnauthorizedError, ForbiddenError } = require('../../../../shared');

/**
 * Validate and sanitize a list of roles or permissions.
 * Rejects empty lists, empty strings, nulls, and non-string inputs.
 *
 * @param {Array} items - Input array of arguments
 * @returns {string[]|null} Array of trimmed string tokens, or null if invalid
 */
const sanitizeTokens = (items) => {
  const flattened = items.flat();

  if (flattened.length === 0) {
    return null;
  }

  const hasInvalid = flattened.some(
    (item) => typeof item !== 'string' || item.trim() === ''
  );

  if (hasInvalid) {
    return null;
  }

  return flattened.map((item) => item.trim());
};

/**
 * Role-based authorization middleware factory.
 * Verifies that the authenticated user possesses an allowed role.
 * Rejects empty or invalid role configurations without granting access.
 *
 * @param {...(string|string[])} allowedRoles - One or more role names (or an array)
 * @returns {Function} Express middleware (req, res, next)
 */
const authorize = (...allowedRoles) => {
  const roles = sanitizeTokens(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles || roles.length === 0) {
      return next(new ForbiddenError('Access forbidden: insufficient role permissions'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Access forbidden: insufficient role permissions'));
    }

    next();
  };
};

/**
 * Permission-based authorization middleware factory.
 * Verifies that the authenticated user possesses ALL required permissions.
 * Rejects empty or invalid permission configurations without granting access.
 * Does not implement an automatic bypass for Admin.
 *
 * @param {...(string|string[])} requiredPermissions - One or more permission codes (or an array)
 * @returns {Function} Express middleware (req, res, next)
 */
const checkPermission = (...requiredPermissions) => {
  const permissions = sanitizeTokens(requiredPermissions);

  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!permissions || permissions.length === 0) {
      return next(new ForbiddenError('Access forbidden: insufficient permissions'));
    }

    if (!Array.isArray(req.user.permissions)) {
      return next(new ForbiddenError('Access forbidden: insufficient permissions'));
    }

    const hasAll = permissions.every((perm) => req.user.permissions.includes(perm));

    if (!hasAll) {
      return next(new ForbiddenError('Access forbidden: insufficient permissions'));
    }

    next();
  };
};

module.exports = {
  authorize,
  checkPermission,
};
