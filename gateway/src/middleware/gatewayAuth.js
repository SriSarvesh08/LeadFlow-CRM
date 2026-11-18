const jwt = require('jsonwebtoken');
const { AppError, UnauthorizedError } = require('../../../shared');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server configuration error: JWT_SECRET is not set', 500);
  }
  return secret;
};

// Whitelist of public endpoints that do not require JWT authentication
const PUBLIC_ROUTES = [
  '/health',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/public/lead-form',
  '/api/leads/public/lead-form',
];

/**
 * Gateway Authentication & Permission Verification Middleware
 */
const gatewayAuth = (req, res, next) => {
  // Check if current path matches any whitelisted public route
  const isPublic = PUBLIC_ROUTES.includes(req.path);
  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];
  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (err) {
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    // Forward user context to downstream microservices via trusted headers
    req.headers['x-user-id'] = String(decoded.id);
    req.headers['x-user-email'] = decoded.email || '';
    req.headers['x-user-role'] = decoded.role || '';
    if (Array.isArray(decoded.permissions)) {
      req.headers['x-user-permissions'] = JSON.stringify(decoded.permissions);
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token expired'));
    }
    return next(new UnauthorizedError('Failed to authenticate token'));
  }
};

module.exports = gatewayAuth;
