// routes/authRoutes.js
const express = require('express');
const { auth } = require('express-openid-connect');
const logger = require('../utils/logger');

const authRouter = express.Router();
const logoutRouter = express.Router(); // new router for isolated logout

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  session: {
    cookie: {
      secure: false, // localhost only
      sameSite: 'Lax',
    }
  }
};

// Apply Auth0 middleware only to authRouter
authRouter.use(auth({
  ...config,
  authorizationParams: {
    response_type: 'code',
    response_mode: 'query',
    scope: 'openid profile email',
  },
  getLoginState: () => ({
    returnTo: 'http://localhost:3000/auth/login'
  }),
  afterCallback: (req, res, session) => {
    logger.info('User logged in successfully', {
      userId: session?.user?.sub,
      email: session?.user?.email,
      loginTime: new Date().toISOString()
    }, 'AUTH');
    return session;
  }
}));

// Define logout route in a SEPARATE router without auth middleware
logoutRouter.get('/custom-logout', (req, res) => {
  logger.info('Processing logout request', {
    userId: req.oidc?.user?.sub,
    sessionExists: !!req.session
  }, 'AUTH');

  const returnTo = encodeURIComponent('http://localhost:3001/');
  const auth0Domain = 'https://dev-ap4cjr4c7rqutytk.us.auth0.com';
  const logoutUrl = `${auth0Domain}/v2/logout?returnTo=${returnTo}&client_id=${process.env.AUTH0_CLIENT_ID}`;

  // Clear all possible session cookies
  const cookies = Object.keys(req.cookies || {});
  logger.debug('Clearing cookies', { 
    cookieCount: cookies.length,
    cookieNames: cookies 
  }, 'AUTH');

  cookies.forEach(cookie => {
    res.clearCookie(cookie, { 
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production'
    });
  });

  // Clear specific Auth0 cookies
  res.clearCookie('appSession', { path: '/', httpOnly: true, sameSite: 'Lax' });
  res.clearCookie('appSession.sig', { path: '/', httpOnly: true, sameSite: 'Lax' });
  res.clearCookie('auth0.ssodata');
  res.clearCookie('auth0.is.authenticated');

  // Clear any session data
  if (req.session) {
    req.session.destroy();
    logger.debug('Session destroyed', {}, 'AUTH');
  }

  logger.info('Logout completed successfully', {
    userId: req.oidc?.user?.sub,
    redirectUrl: returnTo
  }, 'AUTH');
  
  res.redirect(logoutUrl);
});

// Add error handling middleware
authRouter.use((err, req, res, next) => {
  logger.error('Auth error occurred', {
    error: err.message,
    stack: err.stack,
    userId: req.oidc?.user?.sub
  }, 'AUTH');
  next(err);
});

module.exports = { authRouter, logoutRouter };
