const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { createCorsOptions, errorHandler } = require('../../../shared');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Standard middleware
app.use(cors(createCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'auth-service',
    status: 'operational',
    port: process.env.PORT || 5001,
    timestamp: new Date().toISOString(),
  });
});

// Authentication and User management routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
