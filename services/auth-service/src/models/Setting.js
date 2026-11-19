const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Setting Model
 * Corresponds to the 'settings' table in MySQL (crm_auth).
 * Stores system-wide configuration keys and authentication settings.
 */
const Setting = sequelize.define(
  'Setting',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    setting_value: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'settings',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
    underscored: true,
  }
);

module.exports = Setting;
