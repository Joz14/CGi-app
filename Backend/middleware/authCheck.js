const logger = require('../utils/logger');

/**
 * Authentication check middleware that respects DEV_MODE
 * In dev mode, it will allow the request through
 * In production, it will check for proper authentication
 */
function requireAuth(req, res, next) {
  const isDev = process.env.DEV_MODE === 'true';

  if (isDev) {
    // In dev mode, check session first
    if (req.session?.isAuthenticated && req.session?.devUser) {
      // Ensure oidc object is set from session
      req.oidc = {
        isAuthenticated: () => true,
        user: req.session.devUser
      };
      return next();
    }
    
    // If no session, check if oidc was set by devAuth middleware
    if (req.oidc?.user) {
      return next();
    }
    
    logger.warn('Auth check failed in DEV_MODE', {
      path: req.path,
      method: req.method,
      hasOidc: !!req.oidc,
      hasUser: !!req.oidc?.user,
      hasSession: !!req.session,
      sessionId: req.session?.id
    }, 'AUTH');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Production mode - do actual auth check
  if (!req.oidc?.isAuthenticated?.()) {
    logger.warn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      hasSession: !!req.session,
      sessionId: req.session?.id
    }, 'AUTH');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  next();
}

module.exports = requireAuth; 