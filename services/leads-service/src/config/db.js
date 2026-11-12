const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Server configuration error: MONGO_URI is not set');
    }
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[leads-service] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[leads-service] MongoDB connection failed: ${error.message}`);
    // In local unit tests or offline environments, avoid crashing
    if (process.env.NODE_ENV === 'test') {
      console.warn('[leads-service] Running in test mode without live MongoDB');
      return null;
    }
    throw error;
  }
};

module.exports = connectDB;
