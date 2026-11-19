const { UnauthorizedError } = require('../../../../shared');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Authentication middleware for Auth Service.
 * Verifies the incoming Bearer access token and populates req.user.
 * Does not trust or fallback to unverified headers.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers && req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    // Preserve server configuration errors for the central error handler
    if (error.message && error.message.includes('JWT_SECRET is not configured')) {
      return next(error);
    }

    return next(new UnauthorizedError(error.message || 'Invalid or expired authentication token'));
  }

  if (
    !decoded ||
    typeof decoded !== 'object' ||
    decoded.id === undefined ||
    decoded.id === null ||
    decoded.id === '' ||
    !decoded.email ||
    typeof decoded.email !== 'string' ||
    !decoded.role ||
    typeof decoded.role !== 'string' ||
    !Array.isArray(decoded.permissions)
  ) {
    return next(new UnauthorizedError('Invalid authentication token payload'));
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    permissions: decoded.permissions,
  };

  next();
};

module.exports = authenticate;
