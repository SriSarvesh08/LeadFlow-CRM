/**
 * Shared module barrel export.
 * Usage: const { sendSuccess, AppError, createLogger } = require('../../shared');
 */
const { sendSuccess, sendError } = require('./responseHelper');
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} = require('./AppError');
const createLogger = require('./logger');
const errorHandler = require('./errorHandler');

module.exports = {
  sendSuccess,
  sendError,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  createLogger,
  errorHandler,
};

