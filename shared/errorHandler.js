/**
 * Central error handler middleware.
 * Every service uses this as the last middleware: app.use(errorHandler)
 */
const { AppError, ValidationError } = require('./AppError');
const { sendError } = require('./responseHelper');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the error
  const logger = req.app.locals.logger || console;
  if (typeof logger.error === 'function') {
    logger.error(err.message, { stack: err.stack });
  } else {
    console.error(err);
  }

  // Operational errors we threw intentionally
  if (err instanceof ValidationError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Express-validator or Joi errors
  if (err.name === 'ValidationError' && err.errors) {
    return sendError(res, 'Validation failed', 422, err.errors);
  }

  // MySQL duplicate entry (raw driver)
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry', 409);
  }

  // Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = Array.isArray(err.errors)
      ? err.errors.map((e) => ({ field: e.path, message: e.message }))
      : null;
    return sendError(res, 'Duplicate entry', 409, errors);
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = Array.isArray(err.errors)
      ? err.errors.map((e) => ({ field: e.path, message: e.message }))
      : null;
    return sendError(res, 'Validation failed', 422, errors);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return sendError(res, 'Invalid reference: related record does not exist or is in use', 400);
  }

  if (
    err.name === 'SequelizeConnectionError' ||
    err.name === 'SequelizeConnectionRefusedError' ||
    err.name === 'SequelizeAccessDeniedError'
  ) {
    return sendError(res, 'Database connection unavailable', 503);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return sendError(res, 'Duplicate entry', 409);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Unknown / unexpected error
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    500
  );
};

module.exports = errorHandler;

