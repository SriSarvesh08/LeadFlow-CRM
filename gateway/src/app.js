const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const corsConfig = require('./middleware/corsConfig');
const rateLimiter = require('./middleware/rateLimiter');
const blockInternal = require('./middleware/blockInternal');
const gatewayAuth = require('./middleware/gatewayAuth');
const proxyRoutes = require('./routes/proxyRoutes');
const { errorHandler } = require('../../shared');

const app = express();

// 1. CORS policy enforcement
app.use(corsConfig);

// 2. Global IP rate limiting
app.use(rateLimiter);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Gateway Health Check (bypasses auth)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'api-gateway',
    status: 'operational',
    port: process.env.PORT || 5000,
    timestamp: new Date().toISOString(),
  });
});

// 5. Security: strictly block any external calls to /internal/* routes
app.use(blockInternal);

// 6. Central Gateway Authentication (verifies JWT & whitelists public routes)
app.use(gatewayAuth);

// 7. Route /api/* to downstream microservices via reverse proxies
app.use('/api', proxyRoutes);

// 8. 404 handler for unknown gateway routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Gateway route '${req.method} ${req.originalUrl}' not found`,
  });
});

// 9. Centralized Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
