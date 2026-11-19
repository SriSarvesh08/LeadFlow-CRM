const { Op } = require('sequelize');
const {
  sendSuccess,
  AppError,
  ValidationError,
  NotFoundError,
} = require('../../../../shared');
// Lazy-load models to prevent eager database binding when app is imported in non-DB tests (e.g. healthEndpoints)
let models = null;
const getModels = () => {
  if (!models) {
    models = require('../models');
  }
  return models;
};
const passwordUtils = require('../utils/password');

/**
 * Check if assigning candidateManagerId to targetUserId would create a circular reporting chain.
 * E.g., if A reports to B, B cannot report to A; or multi-hop: A -> B -> C, C cannot report to A.
 *
 * @param {number} candidateManagerId - The ID of the manager being assigned
 * @param {number} targetUserId - The ID of the user whose manager is being updated
 * @returns {Promise<boolean>} True if circular relationship detected, false otherwise
 */
const checkCircularManager = async (candidateManagerId, targetUserId) => {
  const { User } = getModels();
  let currentId = candidateManagerId;
  const visited = new Set();

  while (currentId) {
    if (currentId === targetUserId) {
      return true;
    }
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    const mgr = await User.findByPk(currentId, { attributes: ['id', 'manager_id'] });
    currentId = mgr ? mgr.manager_id : null;
  }

  return false;
};

/**
 * List users with pagination and optional filters.
 * GET /users
 */
const listUsers = async (req, res, next) => {
  try {
    const { User, Role } = getModels();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.role_id !== undefined) {
      where.role_id = parseInt(req.query.role_id, 10);
    }

    if (req.query.is_active !== undefined) {
      where.is_active = req.query.is_active === true || req.query.is_active === 'true';
    }

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim() !== '') {
      const searchTerm = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'ASC']],
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);
    const meta = {
      page,
      limit,
      total: count,
      totalPages,
    };

    return sendSuccess(res, rows, 200, meta);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get individual user details by ID.
 * GET /users/:userId
 */
const getUserById = async (req, res, next) => {
  try {
    const { User, Role } = getModels();
    const userId = parseInt(req.params.userId, 10);

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return sendSuccess(res, { user }, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new user account.
 * Requires users:create permission.
 * POST /users
 */
const createUser = async (req, res, next) => {
  try {
    const { sequelize, User, Role, AuditLog } = getModels();
    const { name, email, password, role_id, manager_id, is_active } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ValidationError('Email address is already registered', [
        { field: 'email', message: 'Email address is already in use' },
      ]);
    }

    // 2. Validate role_id exists
    const role = await Role.findByPk(role_id);
    if (!role) {
      throw new ValidationError('Validation failed', [
        { field: 'role_id', message: 'Role does not exist' },
      ]);
    }

    // 3. Validate manager_id if supplied
    if (manager_id !== undefined && manager_id !== null) {
      const manager = await User.findByPk(manager_id);
      if (!manager || !manager.is_active) {
        throw new ValidationError('Validation failed', [
          { field: 'manager_id', message: 'Manager does not exist or is inactive' },
        ]);
      }
    }

    // 4. Hash password using existing utility
    const passwordHash = await passwordUtils.hashPassword(password);

    // 5. Create user and audit log inside managed transaction
    let createdUser;
    await sequelize.transaction(async (t) => {
      const user = await User.create(
        {
          name: name.trim(),
          email: normalizedEmail,
          password_hash: passwordHash,
          role_id: parseInt(role_id, 10),
          manager_id: manager_id ? parseInt(manager_id, 10) : null,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        },
        { transaction: t }
      );

      // Audit log creation inside same transaction
      await AuditLog.create(
        {
          user_id: req.user.id,
          action: 'USER_CREATED',
          entity: 'users',
          entity_id: String(user.id),
          ip: req.ip || (req.socket && req.socket.remoteAddress) || null,
          details: JSON.stringify({
            email: user.email,
            role_id: user.role_id,
            manager_id: user.manager_id,
            is_active: user.is_active,
          }),
        },
        { transaction: t }
      );

      createdUser = user;
    });

    const userResponse = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role_id: createdUser.role_id,
      manager_id: createdUser.manager_id,
      is_active: createdUser.is_active,
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    };

    return sendSuccess(res, { user: userResponse }, 201);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(
        new ValidationError('Email address is already registered', [
          { field: 'email', message: 'Email address is already in use' },
        ])
      );
    }
    return next(error);
  }
};

/**
 * Update an existing user.
 * Requires users:update permission.
 * PUT /users/:userId
 */
const updateUser = async (req, res, next) => {
  try {
    const { sequelize, User, Role, RefreshToken, AuditLog } = getModels();
    const targetUserId = parseInt(req.params.userId, 10);
    const { name, email, password, role_id, manager_id, is_active } = req.body;

    // 1. Locate target user
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    const isSelf = Number(req.user.id) === targetUserId;

    // 2. Self-protection: Administrator cannot deactivate self
    if (isSelf && is_active === false) {
      throw new AppError('Administrators cannot deactivate their own account', 400);
    }

    // 3. Self-protection: Administrator cannot change own role
    if (isSelf && role_id !== undefined && Number(role_id) !== targetUser.role_id) {
      throw new AppError('Administrators cannot modify their own role', 400);
    }

    // 4. Duplicate email validation if email is changing
    let normalizedEmail;
    if (email !== undefined) {
      normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const existingEmail = await User.findOne({
          where: {
            email: normalizedEmail,
            id: { [Op.ne]: targetUserId },
          },
        });
        if (existingEmail) {
          throw new ValidationError('Email address is already registered', [
            { field: 'email', message: 'Email address is already in use' },
          ]);
        }
      }
    }

    // 5. Role validation if role_id is provided
    if (role_id !== undefined) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        throw new ValidationError('Validation failed', [
          { field: 'role_id', message: 'Role does not exist' },
        ]);
      }
    }

    // 6. Manager validation & circular check if manager_id is changing
    if (manager_id !== undefined && manager_id !== null) {
      const parsedManagerId = parseInt(manager_id, 10);

      // Cannot assign user as their own manager
      if (parsedManagerId === targetUserId) {
        throw new ValidationError('Validation failed', [
          { field: 'manager_id', message: 'A user cannot be assigned as their own manager' },
        ]);
      }

      // Manager must exist and be active
      const manager = await User.findByPk(parsedManagerId);
      if (!manager || !manager.is_active) {
        throw new ValidationError('Validation failed', [
          { field: 'manager_id', message: 'Manager does not exist or is inactive' },
        ]);
      }

      // Circular manager chain check
      const isCircular = await checkCircularManager(parsedManagerId, targetUserId);
      if (isCircular) {
        throw new ValidationError('Validation failed', [
          { field: 'manager_id', message: 'Circular manager relationship detected' },
        ]);
      }
    }

    // 7. Hash password if supplied
    let newPasswordHash;
    if (password !== undefined) {
      newPasswordHash = await passwordUtils.hashPassword(password);
    }

    // 8. Determine if session revocation is needed (role, password, or status change)
    const roleChanged = role_id !== undefined && Number(role_id) !== targetUser.role_id;
    const statusChanged = is_active !== undefined && Boolean(is_active) !== Boolean(targetUser.is_active);
    const passwordChanged = password !== undefined;
    const requiresTokenRevocation = roleChanged || statusChanged || passwordChanged;

    // 9. Execute update, session revocation, and audit logs inside managed transaction
    let updatedUser;
    await sequelize.transaction(async (t) => {
      // Re-fetch with row lock to avoid race conditions
      const lockedUser = await User.findByPk(targetUserId, {
        transaction: t,
        lock: t.LOCK && t.LOCK.UPDATE ? t.LOCK.UPDATE : undefined,
      });

      if (!lockedUser) {
        throw new NotFoundError('User');
      }

      const updates = {};
      const auditEntries = [];

      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) updates.email = normalizedEmail;
      if (password !== undefined) updates.password_hash = newPasswordHash;
      if (role_id !== undefined) {
        updates.role_id = parseInt(role_id, 10);
        if (Number(role_id) !== lockedUser.role_id) {
          auditEntries.push({
            action: 'USER_ROLE_CHANGED',
            details: JSON.stringify({
              previous_role_id: lockedUser.role_id,
              new_role_id: parseInt(role_id, 10),
            }),
          });
        }
      }
      if (manager_id !== undefined) {
        updates.manager_id = manager_id ? parseInt(manager_id, 10) : null;
      }
      if (is_active !== undefined) {
        updates.is_active = Boolean(is_active);
        if (Boolean(is_active) !== Boolean(lockedUser.is_active)) {
          auditEntries.push({
            action: is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            details: JSON.stringify({ is_active: Boolean(is_active) }),
          });
        }
      }

      // Update the user record
      await lockedUser.update(updates, { transaction: t });

      // Revoke all active refresh tokens if role, password, or status changed
      if (requiresTokenRevocation) {
        await RefreshToken.update(
          { revoked_at: new Date() },
          {
            where: {
              user_id: lockedUser.id,
              revoked_at: null,
            },
            transaction: t,
          }
        );
      }

      // Record main USER_UPDATED audit log entry
      const updatedFieldNames = Object.keys(updates).filter((f) => f !== 'password_hash');
      await AuditLog.create(
        {
          user_id: req.user.id,
          action: 'USER_UPDATED',
          entity: 'users',
          entity_id: String(lockedUser.id),
          ip: req.ip || (req.socket && req.socket.remoteAddress) || null,
          details: JSON.stringify({ updated_fields: updatedFieldNames }),
        },
        { transaction: t }
      );

      // Record any specific audit log entries (USER_ROLE_CHANGED, USER_ACTIVATED, USER_DEACTIVATED)
      for (const entry of auditEntries) {
        await AuditLog.create(
          {
            user_id: req.user.id,
            action: entry.action,
            entity: 'users',
            entity_id: String(lockedUser.id),
            ip: req.ip || (req.socket && req.socket.remoteAddress) || null,
            details: entry.details,
          },
          { transaction: t }
        );
      }

      updatedUser = lockedUser;
    });

    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role_id: updatedUser.role_id,
      manager_id: updatedUser.manager_id,
      is_active: updatedUser.is_active,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    };

    return sendSuccess(res, { user: userResponse }, 200);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(
        new ValidationError('Email address is already registered', [
          { field: 'email', message: 'Email address is already in use' },
        ])
      );
    }
    return next(error);
  }
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  checkCircularManager,
};
