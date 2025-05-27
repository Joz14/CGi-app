const winston = require('winston');
const chalk = require('chalk');
require('dotenv').config();

/**
 * Comprehensive logging utility for the application
 * 
 * Environment variables:
 * - LOG_LEVEL: debug | info | warn | error (default: info)
 * - DEV_MODE: true | false (default: false) - Enables extra debug logging
 * - ENABLE_LOGS: Comma-separated list of enabled log categories (e.g., "USER,CLAN,MATCH")
 * 
 * Usage:
 * const logger = require('./utils/logger');
 * 
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database connection failed', { error: err });
 * 
 * // Category-based logging
 * logger.debug('Match created', { matchId: '456' }, 'MATCH');
 * 
 * // Performance logging
 * logger.info('Query completed', { duration: '120ms', collection: 'users' }, 'DB');
 */

// Custom format for log levels with colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  debug: 'gray'
};

// Custom format that includes timestamp and optional category
const customFormat = winston.format.printf(({ level, message, timestamp, category, ...metadata }) => {
  const categoryStr = category ? ` [${category}]` : '';
  const metaStr = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}${categoryStr}: ${message}${metaStr}`;
});

// Create the Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Enable categories based on ENABLE_LOGS environment variable
const enabledCategories = (process.env.ENABLE_LOGS || '').split(',').map(cat => cat.trim());

// Wrapper function to handle category-based logging
const logWithCategory = (level, message, metadata = {}, category = '') => {
  // Always log if no category is specified or if DEV_MODE is true
  if (!category || process.env.DEV_MODE === 'true' || enabledCategories.includes(category)) {
    logger[level](message, { ...metadata, ...(category && { category }) });
  }
};

// Export wrapped logging functions
module.exports = {
  error: (message, metadata, category) => logWithCategory('error', message, metadata, category),
  warn: (message, metadata, category) => logWithCategory('warn', message, metadata, category),
  info: (message, metadata, category) => logWithCategory('info', message, metadata, category),
  debug: (message, metadata, category) => logWithCategory('debug', message, metadata, category),
  
  // Stream for Morgan integration
  stream: {
    write: (message) => logger.info(message.trim())
  }
}; 