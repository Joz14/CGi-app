require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Routes
const clashRoutes = require('./routes/clashRoutes');
const { authRouter, logoutRouter } = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const {mongoRoutes, connectDB} = require('./routes/mongoRoutes');
const accountRoutes = require('./routes/accountRoutes');
const clanRoutes = require('./routes/clanRoutes');

// Dev Mode components
const devAuth = require('./middleware/devAuth');
const devSeedDatabase = require('./dev/devSeed');

// Database connection - Use DEV URI if in DEV mode
const isDev = process.env.DEV_MODE === 'true';

// Initialize database connection
async function initializeDatabase() {
  try {
    if (isDev) {
      logger.info('Starting in DEV MODE', {}, 'SYSTEM');
      // Use development database connection
      const mongoUri = process.env.MONGO_URI_DEV || 
        (process.env.MONGO_URI ? process.env.MONGO_URI.replace(/(\w+)$/, '$1-dev') : 'mongodb://localhost:27017/cgi-dev');
      
      await mongoose.connect(mongoUri);
      logger.info('Connected to DEV database', { uri: mongoUri }, 'DB');

      // Check if seeding is needed
      try {
        await devSeedDatabase();
      } catch (seedError) {
        logger.error('Error during database seeding', {
          error: seedError.message,
          stack: seedError.stack
        }, 'SYSTEM');
        // Continue app startup even if seeding fails
      }
    } else {
      // Normal production DB connection
      logger.info('Starting in PRODUCTION MODE', {}, 'SYSTEM');
      await connectDB();
    }

    return true;
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error.message,
      stack: error.stack,
      isDev
    }, 'DB');
    return false;
  }
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));

// Add express-session before other middleware
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: isDev 
      ? (process.env.MONGO_URI_DEV || 'mongodb://localhost:27017/cgi-dev')
      : process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

app.use(express.json());

// Apply DEV auth middleware if in DEV mode - MUST come before other auth middleware
if (isDev) {
  logger.debug('Applying DEV auth middleware', {}, 'AUTH');
  app.use(devAuth);
}

// Apply request logging middleware if enabled
if (process.env.LOG_REQUESTS === 'true') {
  logger.debug('Enabling request logging middleware', {}, 'SYSTEM');
  app.use(require('./middleware/requestLogger'));
}

// Route middleware - Order matters!
app.use(logoutRouter);
app.use(authRouter); // Auth0 middleware comes after devAuth
app.use(clashRoutes);   // custom logic routes
app.use(profileRoutes);  // profile setup
app.use(mongoRoutes);  
app.use(accountRoutes);  // MongoDB connection test
app.use(clanRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend is up.');
});
  
const PORT = process.env.PORT || 3000;

// Start server only after database is initialized
async function startServer() {
  const dbInitialized = await initializeDatabase();
  
  if (!dbInitialized) {
    logger.error('Failed to initialize database, exiting', {}, 'SYSTEM');
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info('Server started', { 
      port: PORT, 
      mode: isDev ? 'development' : 'production',
      nodeEnv: process.env.NODE_ENV
    }, 'SYSTEM');
  });
}

// Handle unexpected errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', {
    error: error.message,
    stack: error.stack
  }, 'SYSTEM');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  }, 'SYSTEM');
  // Exit on uncaught exceptions as the app state might be inconsistent
  process.exit(1);
});

startServer();
