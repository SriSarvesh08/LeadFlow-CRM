const { body, param, query, checkExact } = require('express-validator');

const ALLOWED_UPDATE_FIELDS = ['name', 'email', 'password', 'role_id', 'manager_id', 'is_active'];

// 1. Create User Validation Rules
const createUserRules = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email address is required')
    .isLength({ max: 150 })
    .withMessage('Email cannot exceed 150 characters')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be between 8 and 100 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('role_id')
    .notEmpty()
    .withMessage('Role ID is required')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('manager_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('Manager ID must be a positive integer'),
  body('is_active')
    .optional()
    .isBoolean({ strict: true })
    .withMessage('is_active must be a boolean'),
];

const createUserValidation = [
  ...createUserRules,
  checkExact(createUserRules, { message: 'Unexpected field in request body' }),
];

// 2. Update User Validation Rules
const updateUserBodyRules = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isString()
    .withMessage('Email must be a string')
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Valid email address is required')
    .isLength({ max: 150 })
    .withMessage('Email cannot exceed 150 characters')
    .normalizeEmail(),
  body('password')
    .optional()
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password cannot be empty')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be between 8 and 100 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('role_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('manager_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('Manager ID must be a positive integer'),
  body('is_active')
    .optional()
    .isBoolean({ strict: true })
    .withMessage('is_active must be a boolean'),
];

const atLeastOneUpdateField = body().custom((value, { req }) => {
  const presentFields = Object.keys(req.body || {}).filter((k) =>
    ALLOWED_UPDATE_FIELDS.includes(k)
  );

  if (presentFields.length === 0) {
    throw new Error('At least one permitted update field must be provided in request body');
  }

  return true;
});

const userIdParamRule = param('userId')
  .notEmpty()
  .withMessage('User ID is required')
  .isInt({ min: 1 })
  .withMessage('User ID must be a positive integer');

const updateUserValidation = [
  userIdParamRule,
  ...updateUserBodyRules,
  checkExact(updateUserBodyRules, { message: 'Unexpected field in request body' }),
  atLeastOneUpdateField,
];

// 3. List Users Query Validation Rules
const listUsersQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  query('role_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer')
    .toInt(),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
    .toBoolean(),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim(),
];

const listUsersValidation = [
  ...listUsersQueryRules,
  checkExact(listUsersQueryRules, { message: 'Unexpected query parameter' }),
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  userIdParamRule,
  listUsersValidation,
};
