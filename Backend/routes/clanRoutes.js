const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Clan = require('../models/clanSchema.js');
const User = require('../models/userSchema.js'); // Adjust the path as necessary
// Random join code generator
const generateCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// POST /api/clans
router.post('/api/clans', async (req, res) => {
  const { name, description } = req.body;

  if (!req.oidc?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const auth0Id = req.oidc.user.sub;

  try {
    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ error: 'User not found in DB' });

    // Check if user is already in a clan
    if (user.clan) {
      return res.status(400).json({ error: 'User is already in a clan' });
    }

    // Generate a unique 5-character alphanumeric clan tag
    let finalTag;
    let existingTag;

    do {
    finalTag = `#${generateCode(5)}`;
    existingTag = await Clan.findOne({ tag: finalTag });
    } while (existingTag);

    // Generate unique join code
    let joinCode;
    do {
      joinCode = generateCode();
    } while (await Clan.findOne({ joinCode }));

    const clan = new Clan({
      name,
      tag: finalTag,
      joinCode,
      leader: user._id,
      members: [{ user: user._id }],
      description // you can add this to your schema if needed
    });

    await clan.save();

    // Update user: add clan + role
    user.clan = clan._id;
    if (!user.roles.includes('clanLeader')) {
      user.roles.push('clanLeader');
    }
    await user.save();

    res.status(201).json({
      message: 'Clan created successfully',
      clan: {
        name: clan.name,
        tag: clan.tag,
        joinCode: clan.joinCode
      }
    });
  } catch (err) {
    console.error('❌ Error creating clan:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/api/clan/join', async (req, res) => {
    if (!req.oidc.isAuthenticated()) return res.sendStatus(401);
  
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: 'Join code is required' });
    console.log('Join code:', joinCode);
    try {
      const user = await User.findOne({ auth0Id: req.oidc.user.sub });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.clan) return res.status(400).json({ error: 'User already in a clan' });
  
      const clan = await Clan.findOne({ joinCode });
      if (!clan) return res.status(404).json({ error: 'Invalid join code' });
  
      // Optional: check if clan is full
      // const members = await User.countDocuments({ clan: clan._id });
      // if (members >= 50) return res.status(403).json({ error: 'Clan is full' });
  
      user.clan = clan._id;
      await user.save();
  
      clan.members.push({ user: user._id });
      await clan.save();
  
      res.json({ success: true, clan: { name: clan.name, tag: clan.tag } });
    } catch (err) {
      console.error('Join clan error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


// routes/clanRoutes.js
router.post('/api/clan/leave', async (req, res) => {
    if (!req.oidc.isAuthenticated()) return res.sendStatus(401);
  
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user || !user.clan) return res.status(400).json({ error: 'User not in a clan' });
  
    const clan = await Clan.findById(user.clan);
    const clanMembers = await User.find({ clan: clan._id });
  
    const isLeader = user.roles.includes('clanLeader');
  
    if (isLeader) {
      const otherLeaders = clanMembers.filter(u => u._id.toString() !== user._id.toString() && u.roles.includes('clanLeader'));
      if (otherLeaders.length === 0) {
        return res.status(403).json({ error: 'You must promote another member before leaving.' });
      }
    }
  
    // Remove clan reference and role
    user.clan = null;
    user.roles = user.roles.filter(r => r !== 'clanLeader');
    await user.save();
  
    res.json({ success: true });
  });

// routes/clanRoutes.js
router.delete('/api/clan/delete', async (req, res) => {
    if (!req.oidc.isAuthenticated()) return res.sendStatus(401);
  
    const user = await User.findOne({ auth0Id: req.oidc.user.sub }).populate('clan');
    if (!user || !user.clan || !user.roles.includes('clanLeader')) {
      return res.status(403).json({ error: 'Only clan leaders can delete the clan.' });
    }
  
    const clanId = user.clan._id;
  
    // Remove clan reference from all users
    await User.updateMany({ clan: clanId }, {
      $unset: { clan: "" },
      $pull: { roles: 'clanLeader' }
    });
  
    // Delete the clan
    await Clan.findByIdAndDelete(clanId);
  
    res.json({ success: true });
  });
  
  

module.exports = router;
