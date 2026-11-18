const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { sequelize, testConnection } = require('./config/db');

const PORT = process.env.PORT || 5004;

const startServer = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('MySQL connection was not established. Server startup aborted.');
    }

    const server = app.listen(PORT, () => {
      console.log(`[sales-service] Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    let isShuttingDown = false;
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`[sales-service] Received ${signal}. Shutting down gracefully...`);
      let shutdownError;
      try {
        await new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
        });
        console.log('[sales-service] HTTP server closed.');
      } catch (error) {
        shutdownError = error;
        console.error(`[sales-service] Error closing HTTP server: ${error.message}`);
      }
      try {
        await sequelize.close();
        console.log('[sales-service] MySQL connection closed.');
      } catch (error) {
        shutdownError = shutdownError || error;
        console.error(`[sales-service] Error closing MySQL connection: ${error.message}`);
      }
      if (shutdownError) {
        process.exit(1);
        return;
      }
      console.log('[sales-service] Shutdown completed successfully.');
      process.exit(0);
    };

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    return server;
  } catch (error) {
    const cause = error && (error.original || error.parent || error.cause);
    const code = (error && error.code) || (cause && cause.code);
    const name = (error && error.name) || 'Error';
    const summary = code ? `${name} (${code})` : name;
    console.error(`[sales-service] Failed to start server: ${summary}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

app.startServer = startServer;
module.exports = app;
