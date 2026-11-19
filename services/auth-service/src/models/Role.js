const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Role Model
 * Corresponds to the 'roles' table in MySQL (crm_auth).
 * Defines user roles for authorization and RBAC (e.g., admin, sales_manager, sales_rep).
 */
const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'roles',
    timestamps: false,
  }
);

module.exports = Role;
