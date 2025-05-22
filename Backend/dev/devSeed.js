/**
 * Development Database Seeder
 * Populates a development database with fake data for testing
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

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
    console.log('✅ Connected to DEV database:', mongoUri);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to DEV database:', error);
    return false;
  }
}

// Clear all existing data
async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Clan.deleteMany({}),
    League.deleteMany({}),
    Season.deleteMany({}),
    Match.deleteMany({})
  ]);
  console.log('✅ Database cleared');
}

// Create fake users
async function createUsers(count = 100) {
  console.log(`👥 Creating ${count} fake users...`);
  
  const usersToCreate = Array(count).fill().map((_, i) => ({
    auth0Id: `dev-user-${i + 1}`,
    email: faker.internet.email(),
    nickname: faker.internet.userName(),
    clashRoyaleTag: faker.helpers.maybe(() => generateRandomString(8), { probability: 0.7 }),
    clashOfClansTag: faker.helpers.maybe(() => generateRandomString(8), { probability: 0.7 }),
    roles: i < 20 ? ['user', 'clanLeader'] : ['user']
  }));
  
  const users = await User.insertMany(usersToCreate);
  console.log(`✅ Created ${users.length} users`);
  
  return users;
}

// Create clans and assign users
async function createClans(users, count = 20) {
  console.log(`🏰 Creating ${count} clans...`);
  
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
  console.log(`✅ Created ${clans.length} clans`);
  
  return clans;
}

// Create leagues and distribute clans
async function createLeagues(clans) {
  console.log('🏆 Creating leagues and groups...');
  
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
  console.log(`✅ Created ${leagues.length} leagues with ${leagues.reduce((sum, l) => sum + l.groups.length, 0)} groups`);
  
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
  
  console.log(`✅ Created ${seasons.length} active seasons`);
  
  return { leagues, seasons };
}

// Create some example matches
async function createMatches(leagues, seasons) {
  console.log('⚔️ Creating sample matches...');
  
  const matchesData = [];
  
  // For each league/season
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    const season = seasons[i];
    
    // For each group
    for (const group of league.groups) {
      const clans = group.clans;
      
      // If there are at least 2 clans, create a match
      if (clans.length >= 2) {
        const match = {
          season: season._id,
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
  console.log(`✅ Created ${matches.length} matches`);
}

// Main seeder function
async function devSeedDatabase() {
  console.log('🌱 Starting DEV database seeder...');
  
  // Connect to database
  const connected = await connectDevDB();
  if (!connected) return;
  
  try {
    // Clear existing data
    await clearDatabase();
    
    // Create fake data
    const users = await createUsers(100);
    const clans = await createClans(users, 20);
    const { leagues, seasons } = await createLeagues(clans);
    await createMatches(leagues, seasons);
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('📝 Database connection closed');
  }
}

// Run the seeder if called directly
if (require.main === module) {
  // Running as standalone script
  devSeedDatabase();
} else {
  // Exported as a module
  module.exports = devSeedDatabase; 
}