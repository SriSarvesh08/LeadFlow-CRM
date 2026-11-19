const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * RefreshToken Model
 * Corresponds to the 'refresh_tokens' table in MySQL (crm_auth).
 * Manages hashed refresh tokens for session rotation, expiration, and revocation.
 */
const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = RefreshToken;
