/**
 * Centralized logger with Winston (and safe console fallback).
 * Each service imports this and logs with its service name.
 */
let winston;
try {
  winston = require('winston');
} catch (e) {
  // Graceful fallback when winston is not yet installed
  winston = null;
}

const createLogger = (serviceName = 'app') => {
  if (winston) {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${serviceName}] ${level.toUpperCase()}: ${message}`;
          if (stack) log += `\n${stack}`;
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          return log;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  // Native console fallback
  return {
    info: (msg, meta) => console.log(`[${serviceName}] INFO: ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[${serviceName}] WARN: ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[${serviceName}] ERROR: ${msg}`, meta || ''),
    debug: (msg, meta) => console.debug(`[${serviceName}] DEBUG: ${msg}`, meta || ''),
  };
};

module.exports = createLogger;
