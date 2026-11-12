/**
 * Database connection configuration for Customers Service.
 * Connects to MySQL (crm_customers) via Sequelize.
 */
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const missingVars = ['DB_HOST', 'DB_NAME', 'DB_USER'].filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(`[customers-service] Missing required MySQL environment variables: ${missingVars.join(', ')}`);
}

const sequelize = new Sequelize(dbName, dbUser, dbPassword ?? '', {
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
    console.log(`[customers-service] MySQL connected successfully to '${dbName}' on ${dbHost}:${dbPort}`);
    return true;
  } catch (error) {
    console.error(`[customers-service] MySQL connection failed: ${error.message}`);
    return false;
  }
};

module.exports = { sequelize, testConnection };
