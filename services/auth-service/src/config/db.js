/**
 * Database connection configuration for Auth Service.
 * Connects to MySQL (crm_auth) via Sequelize.
 */
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME || 'crm_auth';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL]: ${msg}`) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[auth-service] MySQL connected successfully to '${dbName}' on ${dbHost}:${dbPort}`);
    return true;
  } catch (error) {
    console.error(`[auth-service] MySQL connection failed: ${error.message}`);
    return false;
  }
};

module.exports = { sequelize, testConnection };
