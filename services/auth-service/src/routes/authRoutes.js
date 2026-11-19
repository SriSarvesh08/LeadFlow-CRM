const express = require('express');
const router = express.Router();

const {
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  logoutValidation,
} = require('../validators');
const { authenticate, validate } = require('../middleware');
const {
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Public authentication routes
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refreshTokenValidation, validate, refreshToken);
router.post('/forgot', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset', resetPasswordValidation, validate, resetPassword);

// Authenticated user & session management routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logoutValidation, validate, logout);

module.exports = router;
