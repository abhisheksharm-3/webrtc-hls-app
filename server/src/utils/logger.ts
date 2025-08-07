import winston from 'winston';
import env from '../config/environment';

/**
 * A map of colors for different log levels, used for console output.
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(logColors);

/**
 * A custom format for console logging in development.
 * It combines colorizing, timestamps, and a simple, readable layout.
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

/**
 * A custom format for file logging in production.
 * It combines timestamps and structured JSON output for easy parsing by log management systems.
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Ensures error stacks are included
  winston.format.json()
);

/**
 * The main logger instance for the application, configured with Winston.
 */
export const logger = winston.createLogger({
  // Set the minimum log level. In production, we only log 'info' and above.
  // In development, we log everything down to 'debug'.
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  
  // The default format for file transports.
  format: fileFormat,
  
  // Default metadata to be included in every log entry.
  defaultMeta: { service: 'webrtc-hls-server' },
  
  // Define where the logs should be sent (the "transports").
  transports: [
    // Write all logs with level 'error' or less to `error.log`.
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with the configured level or less to `combined.log`.
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in a production environment, also add a console logger
// with a simple, colorized format for easy reading during development.
if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}