const { sequelize } = require('../config/db');

const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');
const Setting = require('./Setting');

// 1. Role <-> User (One-to-Many)
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users',
});
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

// 2. Role <-> Permission (Many-to-Many via RolePermission)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

// 3. User <-> RefreshToken (One-to-Many)
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// 4. User <-> AuditLog (One-to-Many)
User.hasMany(AuditLog, {
  foreignKey: 'user_id',
  as: 'auditLogs',
});
AuditLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// 5. User <-> User (Manager Self-Association)
User.belongsTo(User, {
  foreignKey: 'manager_id',
  as: 'manager',
});
User.hasMany(User, {
  foreignKey: 'manager_id',
  as: 'subordinates',
});

module.exports = {
  sequelize,
  Role,
  Permission,
  RolePermission,
  User,
  RefreshToken,
  AuditLog,
  Setting,
};
