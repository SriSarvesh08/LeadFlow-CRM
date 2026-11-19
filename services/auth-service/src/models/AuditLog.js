const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * AuditLog Model
 * Corresponds to the 'audit_logs' table in MySQL (crm_auth).
 * Records an immutable security audit trail of authentication and administrative actions.
 */
const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    entity: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = AuditLog;
