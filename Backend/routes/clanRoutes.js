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

module.exports = router;
