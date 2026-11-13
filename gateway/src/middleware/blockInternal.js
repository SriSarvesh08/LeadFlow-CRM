const { ForbiddenError } = require('../../../shared');

/**
 * Firewall middleware: strictly forbids any external call targeting internal service routes.
 * Internal routes are private to the microservices network mesh and only accessible via x-internal-key.
 */
const blockInternal = (req, res, next) => {
  if (req.originalUrl.includes('/internal/') || req.path.includes('/internal/')) {
    return next(new ForbiddenError('Access to internal service-to-service endpoints is prohibited through the API Gateway.'));
  }
  next();
};

module.exports = blockInternal;

