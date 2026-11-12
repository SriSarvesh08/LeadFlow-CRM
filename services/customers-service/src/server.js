const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');

const PORT = process.env.PORT || 5003;

const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`[customers-service] Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    let isShuttingDown = false;
    const gracefulShutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`[customers-service] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[customers-service] Server closed.');
        process.exit(0);
      });
    };

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error(`[customers-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
