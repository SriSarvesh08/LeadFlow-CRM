const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');

const REQUIRED_ENV = ['JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[api-gateway] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const startGateway = () => {
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`[api-gateway] Gateway listening on http://localhost:${PORT}`);
    console.log(`[api-gateway] Forwarding all /api/* requests to microservices`);
    console.log(`[api-gateway] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });

  let isShuttingDown = false;
  const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[api-gateway] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[api-gateway] Gateway server closed.');
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
};

if (require.main === module) {
  startGateway();
}

module.exports = app;
