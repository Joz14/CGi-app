const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const requireAuth = require('../middleware/authCheck');

const userProfiles = {}; // In-memory store or use Mongo later

router.get('/profileauth', requireAuth, (req, res) => {
  try {
    if (!req.oidc || !req.oidc.user) {
      logger.error('Profile auth check failed - no user object', {
        hasOidc: !!req.oidc,
        path: req.path
      }, 'USER');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const isDev = process.env.DEV_MODE === 'true';
    const user = req.oidc.user;

    logger.debug('Profile auth check successful', {
      email: user.email,
      userId: user.sub,
      isDev
    }, 'USER');

    // Return consistent user object in both modes
    res.json({
      email: user.email,
      picture: user.picture,
      nickname: user.nickname || user.name,
      sub: user.sub,
      roles: user.roles || ['user']
    });
  } catch (error) {
    logger.error('Profile auth check error', {
      error: error.message,
      stack: error.stack
    }, 'USER');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', requireAuth, (req, res) => {
  try {
    if (!req.oidc || !req.oidc.user) {
      logger.error('Profile request failed - no user object', {
        hasOidc: !!req.oidc,
        path: req.path
      }, 'USER');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.oidc.user;
    const isDev = process.env.DEV_MODE === 'true';
    const appProfile = userProfiles[user.email] || {};

    logger.debug('Profile request successful', {
      email: user.email,
      userId: user.sub,
      isDev
    }, 'USER');

    res.json({
      email: user.email,
      picture: user.picture,
      nickname: user.nickname || user.name,
      displayName: appProfile.displayName || user.nickname || user.name,
      clashTag: appProfile.clashTag || null,
      roles: user.roles || ['user'],
      isDev
    });
  } catch (error) {
    logger.error('Profile request error', {
      error: error.message,
      stack: error.stack
    }, 'USER');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add error handling middleware
router.use((err, req, res, next) => {
  logger.error('Profile route error', {
    error: err.message,
    stack: err.stack,
    userId: req.oidc?.user?.sub
  }, 'USER');
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;
