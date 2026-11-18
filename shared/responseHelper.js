/**
 * Standard API response helpers.
 * Format: { success: true, data, meta: { page, total } }
 *    or:  { success: false, message, errors }
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {*} data - Response payload
 * @param {number} statusCode - HTTP status (default 200)
 * @param {object} meta - Pagination meta { page, limit, total, totalPages }
 */
const sendSuccess = (res, data, statusCode = 200, meta = null) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status (default 500)
 * @param {Array} errors - Validation errors array
 */
const sendError = (res, message, statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };

