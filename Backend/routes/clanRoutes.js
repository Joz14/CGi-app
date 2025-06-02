const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Clan = require('../models/clanSchema.js');
const User = require('../models/userSchema.js'); // Adjust the path as necessary
const logger = require('../utils/logger');
const requireAuth = require('../middleware/authCheck');

// Random join code generator
const generateCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// POST /api/clans
router.post('/api/clans', requireAuth, async (req, res) => {
  logger.debug('Create clan request received', { 
    body: { name: req.body.name }, 
    userId: req.oidc.user.sub 
  }, 'CLAN');

  const { name, description } = req.body;
  const auth0Id = req.oidc.user.sub;

  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      logger.warn('User not found in DB during clan creation', { auth0Id }, 'CLAN');
      return res.status(404).json({ error: 'User not found in DB' });
    }

    // Check if user is already in a clan
    if (user.clan) {
      logger.warn('User attempted to create clan while in another clan', { 
        userId: user._id,
        existingClanId: user.clan 
      }, 'CLAN');
      return res.status(400).json({ error: 'User is already in a clan' });
    }

    // Generate a unique clan tag
    let finalTag;
    let existingTag;
    let attempts = 0;
    do {
      finalTag = `#${generateCode(5)}`;
      existingTag = await Clan.findOne({ tag: finalTag });
      attempts++;
    } while (existingTag && attempts < 5);

    if (attempts >= 5) {
      logger.error('Failed to generate unique clan tag after multiple attempts', {}, 'CLAN');
      return res.status(500).json({ error: 'Failed to generate unique clan tag' });
    }

    // Generate unique join code
    let joinCode;
    attempts = 0;
    do {
      joinCode = generateCode();
      attempts++;
    } while (await Clan.findOne({ joinCode }) && attempts < 5);

    if (attempts >= 5) {
      logger.error('Failed to generate unique join code after multiple attempts', {}, 'CLAN');
      return res.status(500).json({ error: 'Failed to generate unique join code' });
    }

    const clan = new Clan({
      name,
      tag: finalTag,
      joinCode,
      leader: user._id,
      members: [{ user: user._id }],
      description
    });

    logger.debug('Creating new clan', { 
      name, 
      tag: finalTag,
      leaderId: user._id 
    }, 'CLAN');

    await clan.save();

    // Update user: add clan + role
    user.clan = clan._id;
    if (!user.roles.includes('clanLeader')) {
      user.roles.push('clanLeader');
    }
    await user.save();

    logger.info('Clan created successfully', { 
      clanId: clan._id,
      name: clan.name,
      tag: clan.tag,
      leaderId: user._id
    }, 'CLAN');

    res.status(201).json({
      message: 'Clan created successfully',
      clan: {
        name: clan.name,
        tag: clan.tag,
        joinCode: clan.joinCode
      }
    });
  } catch (err) {
    logger.error('Error creating clan', { 
      error: err.message,
      stack: err.stack,
      userId: auth0Id
    }, 'CLAN');
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/clan/join', requireAuth, async (req, res) => {
  logger.debug('Clan join request received', { 
    joinCode: req.body.joinCode,
    userId: req.oidc.user.sub 
  }, 'CLAN');

  const { joinCode } = req.body;
  if (!joinCode) {
    logger.warn('Missing join code in request', { userId: req.oidc.user.sub }, 'CLAN');
    return res.status(400).json({ error: 'Join code is required' });
  }

  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user) {
      logger.warn('User not found during clan join', { auth0Id: req.oidc.user.sub }, 'CLAN');
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.clan) {
      logger.warn('User attempted to join clan while in another clan', {
        userId: user._id,
        existingClanId: user.clan
      }, 'CLAN');
      return res.status(400).json({ error: 'User already in a clan' });
    }

    const clan = await Clan.findOne({ joinCode });
    if (!clan) {
      logger.warn('Invalid join code used', { joinCode, userId: user._id }, 'CLAN');
      return res.status(404).json({ error: 'Invalid join code' });
    }

    user.clan = clan._id;
    await user.save();

    clan.members.push({ user: user._id });
    await clan.save();

    logger.info('User joined clan successfully', {
      userId: user._id,
      clanId: clan._id,
      clanName: clan.name
    }, 'CLAN');

    res.json({ success: true, clan: { name: clan.name, tag: clan.tag } });
  } catch (err) {
    logger.error('Error joining clan', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc.user.sub
    }, 'CLAN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/clan/leave', requireAuth, async (req, res) => {
  logger.debug('Clan leave request received', { 
    userId: req.oidc.user.sub 
  }, 'CLAN');

  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user || !user.clan) {
      logger.warn('User not in clan attempted to leave', { 
        userId: user?._id,
        auth0Id: req.oidc.user.sub 
      }, 'CLAN');
      return res.status(400).json({ error: 'User not in a clan' });
    }

    const clan = await Clan.findById(user.clan);
    if (!clan) {
      logger.error('Clan not found for user', { 
        userId: user._id,
        clanId: user.clan 
      }, 'CLAN');
      return res.status(404).json({ error: 'Clan not found' });
    }
    
    const clanMembers = await User.find({ clan: clan._id });
    const isLeader = user.roles.includes('clanLeader');

    if (isLeader) {
      const otherLeaders = clanMembers.filter(u => 
        u._id.toString() !== user._id.toString() && 
        u.roles.includes('clanLeader')
      );
      
      if (otherLeaders.length === 0) {
        logger.warn('Leader attempted to leave clan without promoting new leader', {
          userId: user._id,
          clanId: clan._id
        }, 'CLAN');
        return res.status(403).json({ error: 'You must promote another member before leaving.' });
      }
    }

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

      logger.info('User left clan successfully', {
        userId: user._id,
        clanId: clan._id,
        wasLeader: isLeader
      }, 'CLAN');

      res.json({ success: true });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error('Transaction error during clan leave', {
        error: err.message,
        stack: err.stack,
        userId: user._id,
        clanId: clan._id
      }, 'CLAN');
      res.status(500).json({ error: 'Failed to leave clan' });
    }
  } catch (err) {
    logger.error('Error in leave clan route', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc?.user?.sub
    }, 'CLAN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// routes/clanRoutes.js
router.delete('/api/clan/delete', requireAuth, async (req, res) => {
  logger.debug('Clan delete request received', { 
    userId: req.oidc.user.sub 
  }, 'CLAN');

  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub }).populate('clan');
    if (!user || !user.clan || !user.roles.includes('clanLeader')) {
      logger.warn('Unauthorized clan delete attempt', {
        userId: user?._id,
        hasClan: !!user?.clan,
        isLeader: user?.roles?.includes('clanLeader')
      }, 'CLAN');
      return res.status(403).json({ error: 'Only clan leaders can delete the clan.' });
    }

    const clanId = user.clan._id;
    logger.info('Initiating clan deletion', {
      clanId,
      clanName: user.clan.name,
      leaderId: user._id
    }, 'CLAN');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove clan reference from all users
      const updateResult = await User.updateMany(
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

      logger.info('Clan deleted successfully', {
        clanId,
        affectedUsers: updateResult.modifiedCount
      }, 'CLAN');

      res.json({ success: true });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error('Error during clan delete transaction', {
        error: err.message,
        stack: err.stack,
        userId: user._id,
        clanId: clanId
      }, 'CLAN');
      res.status(500).json({ error: 'Failed to delete clan' });
    }
  } catch (err) {
    logger.error('Error in delete clan route', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc?.user?.sub
    }, 'CLAN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/clan - Get clan info for authenticated user
router.get('/api/clan', requireAuth, async (req, res) => {
  logger.debug('Clan info request received', { 
    userId: req.oidc.user.sub 
  }, 'CLAN');

  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user) {
      logger.warn('User not found during clan info request', { 
        auth0Id: req.oidc.user.sub 
      }, 'CLAN');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is in a clan
    if (!user.clan) {
      logger.debug('User not in clan requested info', { 
        userId: user._id 
      }, 'CLAN');
      return res.status(404).json({ error: 'User is not in a clan' });
    }

    // Get clan with populated members
    const clan = await Clan.findById(user.clan)
      .populate('leader', 'nickname')
      .populate('members.user', 'nickname');

    if (!clan) {
      logger.error('Clan not found for user with clan ID', { 
        userId: user._id,
        clanId: user.clan 
      }, 'CLAN');
      return res.status(404).json({ error: 'Clan not found' });
    }

    logger.debug('Clan info retrieved successfully', {
      userId: user._id,
      clanId: clan._id,
      memberCount: clan.members.length
    }, 'CLAN');

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
    logger.error('Error fetching clan info', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc?.user?.sub
    }, 'CLAN');
    res.status(500).json({ error: 'Server error' });
  }
});

// Promote member to leader
router.post('/api/clan/promote', requireAuth, async (req, res) => {
  logger.debug('Clan promotion request received', { 
    userId: req.oidc.user.sub,
    targetMemberId: req.body.memberId 
  }, 'CLAN');

  try {
    const { memberId } = req.body;
    
    if (!memberId) {
      logger.warn('Missing member ID in promotion request', {
        userId: req.oidc.user.sub
      }, 'CLAN');
      return res.status(400).json({ error: 'Member ID is required' });
    }

    // Get the current user (must be clan leader)
    const currentUser = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!currentUser || !currentUser.clan || !currentUser.roles.includes('clanLeader')) {
      logger.warn('Unauthorized promotion attempt', {
        userId: currentUser?._id,
        hasClan: !!currentUser?.clan,
        isLeader: currentUser?.roles?.includes('clanLeader')
      }, 'CLAN');
      return res.status(403).json({ error: 'Only clan leaders can promote members' });
    }

    // Get the member to promote
    const memberToPromote = await User.findById(memberId);
    if (!memberToPromote || memberToPromote.clan?.toString() !== currentUser.clan.toString()) {
      logger.warn('Invalid member promotion attempt', {
        promoterId: currentUser._id,
        targetMemberId: memberId,
        targetExists: !!memberToPromote,
        targetClanId: memberToPromote?.clan
      }, 'CLAN');
      return res.status(404).json({ error: 'Member not found in clan' });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Add leader role to the member if they don't have it
      if (!memberToPromote.roles.includes('clanLeader')) {
        memberToPromote.roles.push('clanLeader');
        await memberToPromote.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      logger.info('Member promoted to leader successfully', {
        promoterId: currentUser._id,
        promotedId: memberToPromote._id,
        clanId: currentUser.clan
      }, 'CLAN');

      res.json({ 
        success: true,
        message: 'Member promoted to leader successfully'
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error('Transaction error during member promotion', {
        error: err.message,
        stack: err.stack,
        promoterId: currentUser._id,
        targetId: memberId
      }, 'CLAN');
      res.status(500).json({ error: 'Failed to promote member' });
    }
  } catch (err) {
    logger.error('Error in promote member route', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc?.user?.sub
    }, 'CLAN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Kick member from clan
router.post('/api/clan/kick', requireAuth, async (req, res) => {
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
      // Remove clan reference from kicked member
      memberToKick.clan = null;
      memberToKick.roles = memberToKick.roles.filter(r => r !== 'clanLeader');
      await memberToKick.save({ session });

      // Remove member from clan
      await Clan.updateOne(
        { _id: clan._id },
        { $pull: { members: { user: memberId } } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.json({ success: true });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    logger.error('Error in kick member route', {
      error: err.message,
      stack: err.stack,
      userId: req.oidc?.user?.sub
    }, 'CLAN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
