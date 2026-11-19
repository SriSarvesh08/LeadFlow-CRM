const { body, checkExact } = require('express-validator');

// 1. Login Validation Rules
const loginRules = [
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
    .withMessage('Password is required'),
];

const loginValidation = [
  ...loginRules,
  checkExact(loginRules, { message: 'Unexpected field in request body' }),
];

// 2. Refresh Token Validation Rules
const refreshTokenRules = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token must be a string')
    .notEmpty()
    .withMessage('Refresh token is required')
    .matches(/^[0-9a-fA-F]{64}$/)
    .withMessage('Refresh token must be exactly 64 hexadecimal characters'),
];

const refreshTokenValidation = [
  ...refreshTokenRules,
  checkExact(refreshTokenRules, { message: 'Unexpected field in request body' }),
];

// 3. Forgot Password Validation Rules
const forgotPasswordRules = [
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
];

const forgotPasswordValidation = [
  ...forgotPasswordRules,
  checkExact(forgotPasswordRules, { message: 'Unexpected field in request body' }),
];

// 4. Reset Password Validation Rules
const resetPasswordRules = [
  body('token')
    .isString()
    .withMessage('Reset token must be a string')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    .withMessage('Reset token must be a valid JWT structure'),
  body('newPassword')
    .isString()
    .withMessage('New password must be a string')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 100 })
    .withMessage('New password must be between 8 and 100 characters')
    .matches(/[A-Za-z]/)
    .withMessage('New password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

const resetPasswordValidation = [
  ...resetPasswordRules,
  checkExact(resetPasswordRules, { message: 'Unexpected field in request body' }),
];

// 5. Logout Validation Rules
const logoutRules = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token must be a string')
    .notEmpty()
    .withMessage('Refresh token is required')
    .matches(/^[0-9a-fA-F]{64}$/)
    .withMessage('Refresh token must be exactly 64 hexadecimal characters'),
];

const logoutValidation = [
  ...logoutRules,
  checkExact(logoutRules, { message: 'Unexpected field in request body' }),
];

module.exports = {
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  logoutValidation,
};
