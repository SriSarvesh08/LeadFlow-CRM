const express = require('express');
const router = express.Router();

const { authenticate, checkPermission, validate } = require('../middleware');
const {
  createUserValidation,
  updateUserValidation,
  userIdParamRule,
  listUsersValidation,
} = require('../validators');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
} = require('../controllers/userController');

// All User Management routes require authentication
router.use(authenticate);

// 1. List users with pagination and filters
router.get('/', checkPermission('users:read'), listUsersValidation, validate, listUsers);

// 2. Get individual user details
router.get('/:userId', checkPermission('users:read'), userIdParamRule, validate, getUserById);

// 3. Create a new user
router.post('/', checkPermission('users:create'), createUserValidation, validate, createUser);

// 4. Update user details
router.put('/:userId', checkPermission('users:update'), updateUserValidation, validate, updateUser);

module.exports = router;
