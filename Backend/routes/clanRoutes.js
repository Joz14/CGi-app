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
  
    try {
      const user = await User.findOne({ auth0Id: req.oidc.user.sub });
      if (!user || !user.clan) return res.status(400).json({ error: 'User not in a clan' });
    
      const clan = await Clan.findById(user.clan);
      if (!clan) return res.status(404).json({ error: 'Clan not found' });
      
      const clanMembers = await User.find({ clan: clan._id });
    
      const isLeader = user.roles.includes('clanLeader');
    
      if (isLeader) {
        const otherLeaders = clanMembers.filter(u => u._id.toString() !== user._id.toString() && u.roles.includes('clanLeader'));
        if (otherLeaders.length === 0) {
          return res.status(403).json({ error: 'You must promote another member before leaving.' });
        }
      }
    
      // Start a session to ensure atomic operations
      const session = await mongoose.startSession();
      session.startTransaction();
    
      try {
        // Remove clan reference and role from user
        user.clan = null;
        user.roles = user.roles.filter(r => r !== 'clanLeader');
        await user.save({ session });
    
        // Remove user from clan's members array
        await Clan.updateOne(
          { _id: clan._id },
          { $pull: { members: { user: user._id } } },
          { session }
        );
    
        await session.commitTransaction();
        session.endSession();
    
        res.json({ success: true });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error during clan leave transaction:', err);
        res.status(500).json({ error: 'Failed to leave clan' });
      }
    } catch (err) {
      console.error('Error in leave clan route:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// routes/clanRoutes.js
router.delete('/api/clan/delete', async (req, res) => {
    if (!req.oidc.isAuthenticated()) return res.sendStatus(401);
  
    try {
      const user = await User.findOne({ auth0Id: req.oidc.user.sub }).populate('clan');
      if (!user || !user.clan || !user.roles.includes('clanLeader')) {
        return res.status(403).json({ error: 'Only clan leaders can delete the clan.' });
      }
    
      const clanId = user.clan._id;
    
      // Use a session to ensure atomicity
      const session = await mongoose.startSession();
      session.startTransaction();
    
      try {
        // Remove clan reference from all users
        await User.updateMany(
          { clan: clanId }, 
          {
            $unset: { clan: "" },
            $pull: { roles: 'clanLeader' }
          },
          { session }
        );
    
        // Delete the clan
        await Clan.findByIdAndDelete(clanId, { session });
    
        await session.commitTransaction();
        session.endSession();
    
        res.json({ success: true });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error during clan delete transaction:', err);
        res.status(500).json({ error: 'Failed to delete clan' });
      }
    } catch (err) {
      console.error('Error in delete clan route:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  

// GET /api/clan - Get clan info for authenticated user
router.get('/api/clan', async (req, res) => {
  if (!req.oidc?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if user is in a clan
    if (!user.clan) {
      return res.status(404).json({ error: 'User is not in a clan' });
    }

    // Get clan with populated members
    const clan = await Clan.findById(user.clan)
      .populate('leader', 'nickname')
      .populate('members.user', 'nickname');

    if (!clan) {
      return res.status(404).json({ error: 'Clan not found' });
    }

    res.json({
      name: clan.name,
      tag: clan.tag,
      joinCode: clan.joinCode,
      leader: clan.leader,
      members: clan.members,
      createdAt: clan.createdAt,
      updatedAt: clan.updatedAt
    });
  } catch (err) {
    console.error('Error fetching clan:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Promote member to leader
router.post('/api/clan/promote', async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.sendStatus(401);

  try {
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    
    // Get current user
    const currentUser = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    
    // Check if user is clan leader
    if (!currentUser.roles.includes('clanLeader')) {
      return res.status(403).json({ error: 'Only clan leaders can promote members' });
    }
    
    // Get clan
    const clan = await Clan.findById(currentUser.clan);
    if (!clan) return res.status(404).json({ error: 'Clan not found' });
    
    // Check if member to promote exists and is in the clan
    const memberToPromote = await User.findById(memberId);
    if (!memberToPromote) return res.status(404).json({ error: 'Member not found' });
    
    if (!memberToPromote.clan || memberToPromote.clan.toString() !== clan._id.toString()) {
      return res.status(400).json({ error: 'User is not a member of this clan' });
    }
    
    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Remove leader role from current leader
      currentUser.roles = currentUser.roles.filter(role => role !== 'clanLeader');
      await currentUser.save({ session });
      
      // Add leader role to new leader if they don't have it
      if (!memberToPromote.roles.includes('clanLeader')) {
        memberToPromote.roles.push('clanLeader');
      }
      await memberToPromote.save({ session });
      
      // Update clan leader
      clan.leader = memberToPromote._id;
      await clan.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      res.json({ 
        success: true, 
        message: `${memberToPromote.nickname} is now the clan leader`
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error during promotion transaction:', err);
      res.status(500).json({ error: 'Failed to promote member' });
    }
  } catch (err) {
    console.error('Error in promote route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Kick member from clan
router.post('/api/clan/kick', async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.sendStatus(401);

  try {
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    
    // Get current user
    const currentUser = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    
    // Check if user is clan leader
    if (!currentUser.roles.includes('clanLeader')) {
      return res.status(403).json({ error: 'Only clan leaders can kick members' });
    }
    
    // Get clan
    const clan = await Clan.findById(currentUser.clan);
    if (!clan) return res.status(404).json({ error: 'Clan not found' });
    
    // Prevent kicking yourself
    if (memberId === currentUser._id.toString()) {
      return res.status(400).json({ error: 'You cannot kick yourself from the clan' });
    }
    
    // Check if member to kick exists and is in the clan
    const memberToKick = await User.findById(memberId);
    if (!memberToKick) return res.status(404).json({ error: 'Member not found' });
    
    if (!memberToKick.clan || memberToKick.clan.toString() !== clan._id.toString()) {
      return res.status(400).json({ error: 'User is not a member of this clan' });
    }
    
    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Remove clan reference and leader role from member
      memberToKick.clan = null;
      memberToKick.roles = memberToKick.roles.filter(role => role !== 'clanLeader');
      await memberToKick.save({ session });
      
      // Remove member from clan's members array
      await Clan.updateOne(
        { _id: clan._id },
        { $pull: { members: { user: memberToKick._id } } },
        { session }
      );
      
      await session.commitTransaction();
      session.endSession();
      
      res.json({ 
        success: true, 
        message: `${memberToKick.nickname} has been removed from the clan`
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error during kick transaction:', err);
      res.status(500).json({ error: 'Failed to kick member' });
    }
  } catch (err) {
    console.error('Error in kick route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
