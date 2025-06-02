/**
 * Development Authentication Bypass Middleware
 * Attaches a dev user to req.oidc when DEV_MODE is enabled
 */
const mongoose = require('mongoose');
const User = require('../models/userSchema');
const logger = require('../utils/logger');

// Cache the dev user to avoid database queries on every request
let cachedDevUser = null;

async function getDevUser() {
  try {
    // Use cached user if available
    if (cachedDevUser) {
      return cachedDevUser;
    }

    // Ensure database connection
    if (!mongoose.connection.readyState) {
      logger.warn('Database not connected in dev auth middleware', {}, 'AUTH');
      // Return a default dev user when DB is not ready
      return {
        _id: 'dev-user-id-1',
        auth0Id: 'dev-user-id-1',
        email: 'dev@example.com',
        nickname: 'Dev User',
        roles: ['admin', 'user']
      };
    }

    // Find or create the dev user
    let devUser = await User.findOne({ email: 'dev@example.com' });
    
    if (!devUser) {
      logger.info('Creating dev user in database', {}, 'AUTH');
      devUser = await User.create({
        auth0Id: 'dev-user-id-1',
        email: 'dev@example.com',
        nickname: 'Dev User',
        roles: ['admin', 'user']
      });
    }

    logger.debug('Dev user loaded from database', { 
      userId: devUser._id,
      email: devUser.email 
    }, 'AUTH');
    
    cachedDevUser = devUser;
    return devUser;
  } catch (error) {
    logger.error('Error fetching dev user', {
      error: error.message,
      stack: error.stack
    }, 'AUTH');
    
    // Return a default dev user on error
    return {
      _id: 'dev-user-id-1',
      auth0Id: 'dev-user-id-1',
      email: 'dev@example.com',
      nickname: 'Dev User',
      roles: ['admin', 'user']
    };
  }
}

const devAuth = async (req, res, next) => {
  // Only apply in development mode
  if (process.env.DEV_MODE === 'true') {
    try {
      // Check if user is already in session
      if (req.session?.devUser) {
        req.oidc = {
          isAuthenticated: () => true,
          user: req.session.devUser
        };
        return next();
      }

      logger.debug('DEV_MODE enabled: Applying auth bypass', {}, 'AUTH');
      
      const devUser = await getDevUser();
      
      // Create OIDC user object similar to Auth0
      const oidcUser = {
        sub: devUser.auth0Id || 'dev-user-id-1',
        email: devUser.email || 'dev@example.com',
        nickname: devUser.nickname || 'Dev User',
        name: devUser.nickname || 'Dev User',
        picture: null,
        _id: devUser._id || 'dev-user-id-1',
        roles: devUser.roles || ['admin', 'user']
      };

      // Store in session
      req.session.devUser = oidcUser;
      req.session.isAuthenticated = true;

      // Attach to request
      req.oidc = {
        isAuthenticated: () => true,
        user: oidcUser
      };

      logger.debug('Dev auth bypass applied', {
        userId: oidcUser._id,
        email: oidcUser.email,
        hasOidc: !!req.oidc,
        hasUser: !!req.oidc?.user,
        sessionId: req.session.id
      }, 'AUTH');
    } catch (error) {
      logger.error('Error in dev auth middleware', {
        error: error.message,
        stack: error.stack
      }, 'AUTH');
    }
  }
  
  next();
};

// Clear cache when database connection changes
mongoose.connection.on('connected', () => {
  cachedDevUser = null;
  logger.debug('Dev user cache cleared on DB connection', {}, 'AUTH');
});

module.exports = devAuth; 