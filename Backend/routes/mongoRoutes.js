
// External Modules
const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const router = express.Router();

async function connectDB() {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    }
  }
  


router.get('/testdb', async (req, res) => {
    try {
      // Run a simple admin command to confirm connection
      const db = mongoose.connection.db;
      const admin = db.admin();
      const serverStatus = await admin.serverStatus();
  
      res.json({
        status: 'success',
        message: 'MongoDB connected!',
        serverInfo: {
          host: serverStatus.host,
          version: serverStatus.version
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to connect to MongoDB',
        error: error.message
      });
    }
  });




// === Export Both ===
module.exports = {
    mongoRoutes: router,
    connectDB
  };