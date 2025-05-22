const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/userSchema.js'); // Adjust the path as necessary

router.get('/auth/login', async (req, res) => {
    if (!req.oidc.isAuthenticated()) return res.sendStatus(401);
    const { sub, nickname, email} = req.oidc.user;
  
    try {
      let user = await User.findOne({ auth0Id: sub });
  
      if (!user) {
        user = await User.create({
          auth0Id: sub,
          email: email,
          nickname: nickname,
          roles: ['user']
        });
        console.log(`✅ Created new user: ${nickname}`);
      }
  
      // Redirect to frontend app after DB setup
      res.redirect('http://localhost:3001/');
    } catch (err) {
      console.error('❌ Failed to initialize user:', err);
      res.status(500).send('User setup failed');
    }
  });

router.get('/account', async (req, res) => {
    if (!req.oidc.isAuthenticated()) return res.sendStatus(401);
  
    try {
      const authUser = req.oidc.user;
      
      // Check if running in DEV mode and using the dev user
      const isDev = process.env.DEV_MODE === 'true';
      if (isDev && authUser.email === 'dev@example.com') {
        // Return mock account data for dev user
        return res.json({
          email: authUser.email,
          picture: authUser.picture || 'https://via.placeholder.com/150',
          displayName: 'Dev User',
          clashTag: 'DEV#12345',
          roles: ['user', 'admin'],
          clan: {
            _id: 'dev-clan-id',
            name: 'Developers Clan',
            tag: 'DEVCL'
          },
          isDev: true
        });
      }
  
      // Populate the 'clan' field with name and tag (not full details)
      const user = await User.findOne({ auth0Id: authUser.sub }).populate('clan', 'name tag');
  
      if (!user) return res.status(404).json({ error: 'User not found in DB' });
  
      res.json({
        email: authUser.email,
        picture: authUser.picture,
        displayName: user.nickname,
        clashTag: user.clashRoyaleTag || null,
        roles: user.roles,
        clan: user.clan ? {
          _id: user.clan._id,
          name: user.clan.name,
          tag: user.clan.tag
        } : null
      });
    } catch (err) {
      console.error('Error fetching account:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

router.patch('/account', async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.sendStatus(401);

  const { displayName, clashTag } = req.body;
  
  // Check if running in DEV mode and using the dev user
  const isDev = process.env.DEV_MODE === 'true';
  if (isDev && req.oidc.user.email === 'dev@example.com') {
    // Mock successful update for dev user
    return res.json({ 
      message: 'Profile updated (DEV mode)', 
      user: { 
        nickname: displayName || 'Dev User',
        clashRoyaleTag: clashTag || 'DEV#12345'
      }
    });
  }

  try {
    const updated = await User.findOneAndUpdate(
      { auth0Id: req.oidc.user.sub },
      {
        ...(displayName && { nickname: displayName }),
        ...(clashTag && { clashRoyaleTag: clashTag })
      },
      { new: true }
    );
    console.log('Updated user:', updated);
    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
