const express = require('express');
const router = express.Router();

const userProfiles = {}; // In-memory store or use Mongo later

router.get('/profileauth', (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.sendStatus(401);
  }

  const { email, picture } = req.oidc.user;
  res.json({ email, picture });
});

router.get('/profile', (req, res) => {
  console.log('\n--- 🧠 PROFILE ROUTE HIT ---');

  // ✅ Log basic request info
  console.log('🔐 Authenticated:', req.oidc.isAuthenticated());
  console.log('👤 OIDC User:', req.oidc.user);
  console.log('📦 Session:', req.session);
  console.log('🍪 Cookies:', req.cookies);

  if (!req.oidc.isAuthenticated()) {
    console.log('❌ Not authenticated — sending 401\n');
    return res.sendStatus(401);
  }

  console.log('✅ Authenticated — sending user profile\n');

  const { email, picture } = req.oidc.user;
  const appProfile = userProfiles[email] || {};

  res.json({
    email,
    picture,
    displayName: appProfile.displayName || req.oidc.user.nickname,
    clashTag: appProfile.clashTag || null
  });
});


router.post('/profile/setup', (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.sendStatus(401);

  console.log('Profile setup request:', req.body);

  const email = req.oidc.user.email;

  userProfiles[email] = {
    displayName: req.body.displayName,
    clashTag: req.body.clashTag
  };

  console.log(`Profile updated for ${email}:`, userProfiles[email]);

  res.json({ status: 'saved' });
});


module.exports = router;
