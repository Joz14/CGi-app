require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

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
if (isDev) {
  console.log('🔧 Starting in DEV MODE');
  // Use development database connection
  const mongoUri = process.env.MONGO_URI_DEV || 
    (process.env.MONGO_URI ? process.env.MONGO_URI.replace(/(\w+)$/, '$1-dev') : 'mongodb://localhost:27017/cgi-dev');
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ Connected to DEV database');
      // Run the seeder in development mode
      return devSeedDatabase();
    })
    .catch(error => {
      console.error('❌ MongoDB DEV connection error:', error);
      process.exit(1);
    });
} else {
  // Normal production DB connection
  connectDB();
}

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',   // ✅ allow your React frontend
    credentials: true                 // ✅ allow cookies/sessions to be sent
  }));

app.use(express.json());

// Apply DEV auth middleware if in DEV mode
if (isDev) {
  app.use(devAuth);
}

// Route middleware
app.use(logoutRouter);
app.use(authRouter); // will mount the Auth0 middleware AFTER logout is processed
app.use(clashRoutes);   // custom logic routes
app.use(profileRoutes);  // profile setup
app.use(mongoRoutes);  
app.use(accountRoutes);  // MongoDB connection test
app.use(clanRoutes)

app.get('/', (req, res) => {
    res.send('Backend is up.');
  });
  
const PORT = process.env.PORT || 3000;



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}${isDev ? ' (DEV MODE)' : ''}`);
});
