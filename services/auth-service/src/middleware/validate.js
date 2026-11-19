const { validationResult } = require('express-validator');
const { ValidationError } = require('../../../../shared');

/**
 * Express middleware that checks for express-validator errors.
 * Formats validation errors into { field, message } shape.
 * Never includes submitted values, passwords, or tokens in error outputs.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const formattedErrors = result.array().flatMap((err) => {
      // Handle unexpected fields detected by checkExact()
      if (err.type === 'unknown_fields' && Array.isArray(err.fields)) {
        return err.fields.map((f) => ({
          field: f.path || 'unknown',
          message: err.msg || `Unexpected field '${f.path}'`,
        }));
      }

      return [
        {
          field: err.path || err.param || 'body',
          message: err.msg,
        },
      ];
    });

    return next(new ValidationError('Validation failed', formattedErrors));
  }

  next();
};

module.exports = validate;
