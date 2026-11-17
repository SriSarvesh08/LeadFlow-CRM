const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    const connection = await connectDB();
    if (!connection) {
      throw new Error('MongoDB connection was not established. Server startup aborted.');
    }

    const server = app.listen(PORT, () => {
      console.log(`[activity-service] Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    let isShuttingDown = false;
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`[activity-service] Received ${signal}. Shutting down gracefully...`);
      let shutdownError;
      try {
        await new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
        });
        console.log('[activity-service] HTTP server closed.');
      } catch (error) {
        shutdownError = error;
        console.error(`[activity-service] Error closing HTTP server: ${error.message}`);
      }
      try {
        await mongoose.connection.close();
        console.log('[activity-service] MongoDB connection closed.');
      } catch (error) {
        shutdownError = shutdownError || error;
        console.error(`[activity-service] Error closing MongoDB connection: ${error.message}`);
      }
      if (shutdownError) {
        process.exit(1);
        return;
      }
      console.log('[activity-service] Shutdown completed successfully.');
      process.exit(0);
    };

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    return server;
  } catch (error) {
    console.error(`[activity-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

app.startServer = startServer;
module.exports = app;
