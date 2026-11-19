const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Permission Model
 * Corresponds to the 'permissions' table in MySQL (crm_auth).
 * Defines granular privileges for authorization (e.g., 'leads:create', 'deals:delete').
 */
const Permission = sequelize.define(
  'Permission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'permissions',
    timestamps: false,
  }
);

module.exports = Permission;
