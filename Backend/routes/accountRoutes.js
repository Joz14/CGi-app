const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/userSchema.js');
const requireAuth = require('../middleware/authCheck');
const logger = require('../utils/logger');

router.get('/auth/login', requireAuth, async (req, res) => {
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
        logger.info('Created new user', {
          userId: sub,
          email,
          nickname
        }, 'USER');
      }
  
      // Redirect to frontend app after DB setup
      res.redirect('http://localhost:3001/');
    } catch (err) {
      logger.error('Failed to initialize user', {
        error: err.message,
        stack: err.stack,
        userId: sub
      }, 'USER');
      res.status(500).send('User setup failed');
    }
  });

router.get('/account', requireAuth, async (req, res) => {
    try {
      const authUser = req.oidc.user;
      
      // Check if running in DEV mode and using the dev user
      const isDev = process.env.DEV_MODE === 'true';
      if (isDev && authUser.email === 'dev@example.com') {
        logger.debug('Returning dev account data', {
          email: authUser.email
        }, 'USER');
        
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
  
      if (!user) {
        logger.warn('User not found in database', {
          auth0Id: authUser.sub,
          email: authUser.email
        }, 'USER');
        return res.status(404).json({ error: 'User not found in DB' });
      }
  
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
      logger.error('Error fetching account', {
        error: err.message,
        stack: err.stack,
        userId: req.oidc?.user?.sub
      }, 'USER');
      res.status(500).json({ error: 'Server error' });
    }
  });

router.patch('/account', requireAuth, async (req, res) => {
  const { displayName, clashTag } = req.body;
  
  // Check if running in DEV mode and using the dev user
  const isDev = process.env.DEV_MODE === 'true';
  if (isDev && req.oidc.user.email === 'dev@example.com') {
    logger.debug('Mock profile update in dev mode', {
      displayName,
      clashTag
    }, 'USER');
    
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
    logger.info('Updated user profile', {
      userId: req.oidc.user.sub,
      updates: { displayName, clashTag }
    }, 'USER');
    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    logger.error('Error updating profile', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc.user.sub
    }, 'USER');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
