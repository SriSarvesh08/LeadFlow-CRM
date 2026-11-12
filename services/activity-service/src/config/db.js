/**
 * Database connection configuration for Activity Service.
 * Connects to MongoDB (crm_activity) via Mongoose.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('[activity-service] Missing required environment variable: MONGO_URI');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[activity-service] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[activity-service] MongoDB connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'test') {
      console.warn('[activity-service] Running in test mode without live MongoDB');
      return null;
    }
    throw error;
  }
};

module.exports = connectDB;
