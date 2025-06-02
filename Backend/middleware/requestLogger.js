const logger = require('../utils/logger');

/**
 * Middleware for logging HTTP requests
 * Logs method, path, user (if available), and response time
 * 
 * Environment variables:
 * - LOG_REQUESTS: true | false (default: true in development)
 */
const requestLogger = (req, res, next) => {
  // Skip logging if LOG_REQUESTS is explicitly set to false
  if (process.env.LOG_REQUESTS === 'false') {
    return next();
  }

  // Get start time
  const start = Date.now();

  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.sub || 'anonymous';
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.originalUrl || req.url;

    // Determine log level based on status code
    const level = statusCode >= 500 ? 'error' :
                 statusCode >= 400 ? 'warn' :
                 'info';

    // Create the log message
    const message = `${method} ${path} - ${statusCode} - user:${userId} - ${duration}ms`;

    // Log with appropriate level and include request details in metadata
    logger[level](message, {
      statusCode,
      duration,
      userId,
      ip: req.ip
    }, 'HTTP');
  });

  next();
};

module.exports = requestLogger; 