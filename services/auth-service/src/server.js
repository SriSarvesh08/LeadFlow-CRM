const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { sequelize } = require('./config/db');

const PORT = process.env.PORT || 5001;

const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`[auth-service] Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // Graceful shutdown
    let isShuttingDown = false;
    const gracefulShutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`[auth-service] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[auth-service] Server closed.');
        try {
          await sequelize.close();
        } catch (error) {
          console.error(`[auth-service] Error closing MySQL connection: ${error.message}`);
        }
        process.exit(0);
      });
    };

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error(`[auth-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

app.startServer = startServer;
module.exports = app;
