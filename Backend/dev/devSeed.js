/**
 * Development Database Seeder
 * Populates a development database with fake data for testing
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const logger = require('../utils/logger');

// Import models
const User = require('../models/userSchema');
const Clan = require('../models/clanSchema');
const League = require('../models/leagueSchema');
const Season = require('../models/seasonSchema');
const Match = require('../models/matchSchema');

// Random string generator for clan tags and join codes
const generateRandomString = (length, alphanumeric = true) => {
  const chars = alphanumeric 
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    : '0123456789';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Connect to development database
async function connectDevDB() {
  // Use DEV MongoDB URI or default to regular one with -dev suffix
  const mongoUri = process.env.MONGO_URI_DEV || 
    (process.env.MONGO_URI ? process.env.MONGO_URI.replace(/(\w+)$/, '$1-dev') : 'mongodb://localhost:27017/cgi-dev');
  
  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to DEV database', { uri: mongoUri }, 'DB');
    return true;
  } catch (error) {
    logger.error('Failed to connect to DEV database', { 
      error: error.message,
      uri: mongoUri 
    }, 'DB');
    return false;
  }
}

// Check if database needs seeding
async function checkNeedsSeed() {
  try {
    const [userCount, clanCount, leagueCount] = await Promise.all([
      User.countDocuments(),
      Clan.countDocuments(),
      League.countDocuments()
    ]);

    logger.debug('Checked database state', { 
      userCount, 
      clanCount, 
      leagueCount 
    }, 'SYSTEM');

    return userCount === 0 || clanCount === 0 || leagueCount === 0;
  } catch (error) {
    logger.error('Error checking database state', { 
      error: error.message 
    }, 'SYSTEM');
    throw error;
  }
}

// Clear all existing data
async function clearDatabase() {
  logger.info('Clearing existing data', {}, 'SYSTEM');
  try {
    await Promise.all([
      User.deleteMany({}),
      Clan.deleteMany({}),
      League.deleteMany({}),
      Season.deleteMany({}),
      Match.deleteMany({})
    ]);
    logger.info('Database cleared successfully', {}, 'SYSTEM');
  } catch (error) {
    logger.error('Error clearing database', { 
      error: error.message 
    }, 'SYSTEM');
    throw error;
  }
}

// Create fake users
async function createUsers(count = 100) {
  logger.info(`Creating ${count} fake users`, {}, 'SYSTEM');
  
  // First ensure dev user exists
  let devUser = await User.findOne({ email: 'dev@example.com' });
  if (!devUser) {
    logger.info('Creating dev user', {}, 'SYSTEM');
    devUser = await User.create({
      auth0Id: 'dev-user-id-1',
      email: 'dev@example.com',
      nickname: 'Dev User',
      clashRoyaleTag: 'DEV#12345',
      clashOfClansTag: 'DEV#12345',
      roles: ['user', 'admin']
    });
  }

  const usersToCreate = Array(count - 1).fill().map((_, i) => ({
    auth0Id: `dev-user-${i + 2}`,
    email: faker.internet.email(),
    nickname: faker.internet.userName(),
    clashRoyaleTag: faker.helpers.maybe(() => generateRandomString(8), { probability: 0.7 }),
    clashOfClansTag: faker.helpers.maybe(() => generateRandomString(8), { probability: 0.7 }),
    roles: i < 19 ? ['user', 'clanLeader'] : ['user'] // Adjust for dev user being first
  }));
  
  const users = await User.insertMany(usersToCreate);
  users.unshift(devUser); // Add dev user to beginning of array
  
  logger.info(`Created users successfully`, { 
    count: users.length,
    devUserCreated: !devUser 
  }, 'SYSTEM');
  
  return users;
}

// Create clans and assign users
async function createClans(users, count = 20) {
  logger.info(`Creating ${count} clans`, {}, 'SYSTEM');
  
  const clanLeaders = users.filter((_, i) => i < count);
  const remainingUsers = users.filter((_, i) => i >= count);
  
  const clansToCreate = [];
  
  for (let i = 0; i < count; i++) {
    const name = `${faker.word.adjective()} ${faker.word.noun()}`;
    const clan = {
      name,
      tag: generateRandomString(5),
      joinCode: generateRandomString(8),
      leader: clanLeaders[i]._id,
      members: [{
        user: clanLeaders[i]._id,
        joinedAt: new Date()
      }]
    };
    
    // Add 4 members to each clan
    for (let j = 0; j < 4; j++) {
      const userIndex = i * 4 + j;
      if (userIndex < remainingUsers.length) {
        clan.members.push({
          user: remainingUsers[userIndex]._id,
          joinedAt: new Date()
        });
      }
    }
    
    clansToCreate.push(clan);
  }
  
  const clans = await Clan.insertMany(clansToCreate);
  
  // Update users with clan references
  const userUpdates = [];
  
  for (let i = 0; i < clans.length; i++) {
    const clan = clans[i];
    
    // Update leader
    userUpdates.push(
      User.updateOne(
        { _id: clan.leader },
        { $set: { clan: clan._id } }
      )
    );
    
    // Update members
    for (const member of clan.members) {
      if (!member.user.equals(clan.leader)) {
        userUpdates.push(
          User.updateOne(
            { _id: member.user },
            { $set: { clan: clan._id } }
          )
        );
      }
    }
  }
  
  await Promise.all(userUpdates);
  logger.info(`Created ${clans.length} clans successfully`, {}, 'SYSTEM');
  
  return clans;
}

// Create leagues and distribute clans
async function createLeagues(clans) {
  logger.info('Creating leagues and groups', {}, 'SYSTEM');
  
  // Distribute clans into 2 leagues with 10 groups (5 groups per league)
  const leaguesData = Array(2).fill().map((_, i) => {
    const leagueName = `${faker.word.adjective()} League ${i + 1}`;
    
    // Create 5 groups per league
    const groups = Array(10).fill().map((_, j) => {
      // Calculate which clans belong to this group
      // We have 20 clans, 2 leagues, 10 groups total, so 2 clans per group
      const groupClans = clans.slice(i * 10 + j * 2, i * 10 + j * 2 + 2).map(c => c._id);
      
      return {
        name: `Group ${String.fromCharCode(65 + j)}`, // Group A, B, C, ...
        clans: groupClans
      };
    });
    
    return {
      name: leagueName,
      description: faker.lorem.sentence(),
      isActive: true,
      groups
    };
  });
  
  const leagues = await League.insertMany(leaguesData);
  logger.info(`Created ${leagues.length} leagues with ${leagues.reduce((sum, l) => sum + l.groups.length, 0)} groups successfully`, {}, 'SYSTEM');
  
  // Create a current season for each league
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);
  
  const seasonsData = leagues.map(league => ({
    name: `${league.name} Season 1`,
    league: league._id,
    startDate: now,
    endDate,
    isActive: true
  }));
  
  const seasons = await Season.insertMany(seasonsData);
  
  // Update leagues with season reference
  await Promise.all(
    leagues.map((league, i) => 
      League.updateOne(
        { _id: league._id },
        { $push: { seasons: seasons[i]._id } }
      )
    )
  );
  
  // Update clans with league reference
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    const clanIds = league.groups.flatMap(g => g.clans);
    
    await Clan.updateMany(
      { _id: { $in: clanIds } },
      { $set: { league: league._id } }
    );
  }
  
  logger.info(`Created ${seasons.length} active seasons successfully`, {}, 'SYSTEM');
  
  return { leagues, seasons };
}

// Create some example matches
async function createMatches(leagues) {
  logger.info('Creating sample matches', {}, 'SYSTEM');
  
  const matchesData = [];
  
  // For each league/season
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    
    // For each group
    for (const group of league.groups) {
      const clans = group.clans;
      
      // If there are at least 2 clans, create a match
      if (clans.length >= 2) {
        const match = {
          season: league.seasons[i]._id,
          clanA: clans[0],
          clanB: clans[1],
          scoreA: Math.floor(Math.random() * 3),
          scoreB: Math.floor(Math.random() * 3),
          status: faker.helpers.arrayElement(['pending', 'reported', 'confirmed'])
        };
        
        if (match.status !== 'pending') {
          // Get a random user from one of the clans
          const clan = await Clan.findById(clans[0]).populate('members.user');
          if (clan && clan.members.length > 0) {
            match.reportedBy = clan.members[0].user;
          }
        }
        
        matchesData.push(match);
      }
    }
  }
  
  const matches = await Match.insertMany(matchesData);
  logger.info(`Created ${matches.length} matches successfully`, {}, 'SYSTEM');
}

// Main seeding function
async function devSeedDatabase() {
  // Ensure database connection
  if (!mongoose.connection.readyState) {
    logger.info('No database connection detected, connecting...', {}, 'DB');
    const connected = await connectDevDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
  }

  try {
    // Check if seeding is needed
    const needsSeed = await checkNeedsSeed();
    
    if (!needsSeed) {
      logger.info('Database already contains data, skipping seed', {}, 'SYSTEM');
      return false;
    }

    logger.info('Starting database seeding', {}, 'SYSTEM');

    // Clear existing data
    await clearDatabase();

    // Create fake data
    const users = await createUsers(100);
    const clans = await createClans(users, 20);
    const leagues = await createLeagues(clans);
    await createMatches(leagues);

    logger.info('Database seeding completed successfully', {
      users: users.length,
      clans: clans.length,
      leagues: leagues.length
    }, 'SYSTEM');

    return true;
  } catch (error) {
    logger.error('Error during database seeding', {
      error: error.message,
      stack: error.stack
    }, 'SYSTEM');
    throw error;
  }
}

module.exports = devSeedDatabase;