/**
 * Development Authentication Bypass Middleware
 * Attaches a dummy user to req.oidc when DEV_MODE is enabled
 */

const devAuth = (req, res, next) => {
  // Only apply in development mode
  if (process.env.DEV_MODE === 'true') {
    console.log('🔧 DEV_MODE enabled: Adding dummy user');
    
    // Create dummy OIDC user object similar to Auth0
    req.oidc = {
      isAuthenticated: () => true,
      user: {
        sub: 'dev-user-id-1',
        email: 'dev@example.com',
        nickname: 'Dev User',
        name: 'Dev User',
        _id: 'dev-user-id-1', 
      }
    };
    
    // Add user object that would normally come from database
    req.user = {
      _id: 'dev-user-id-1',
      name: 'Dev User',
      role: 'admin',
      clanId: 'dev-clan-id'
    };
    
    console.log('✅ DEV auth bypass applied');
  }
  
  next();
};

module.exports = devAuth; 