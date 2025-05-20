require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Routes
const clashRoutes = require('./routes/clashRoutes');
const { authRouter, logoutRouter } = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',   // ✅ allow your React frontend
    credentials: true                 // ✅ allow cookies/sessions to be sent
  }));

app.use(express.json());

// Route middleware
app.use(logoutRouter);
app.use(authRouter); // will mount the Auth0 middleware AFTER logout is processed
app.use(clashRoutes);   // custom logic routes
app.use(profileRoutes);  // profile setup

app.get('/', (req, res) => {
    res.send('Backend is up.');
    
  });
  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
