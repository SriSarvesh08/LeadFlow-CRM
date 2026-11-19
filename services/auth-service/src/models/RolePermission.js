const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * RolePermission Model
 * Corresponds to the 'role_permissions' junction table in MySQL (crm_auth).
 * Maps many-to-many relationships between roles and permissions using a composite primary key.
 */
const RolePermission = sequelize.define(
  'RolePermission',
  {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
  },
  {
    tableName: 'role_permissions',
    timestamps: false,
  }
);

module.exports = RolePermission;
