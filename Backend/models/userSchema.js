const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true }, // Auth0 `sub`
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  clashRoyaleTag: { type: String },
  clashOfClansTag: { type: String },
  roles: [{ type: String, enum: ['user', 'clanLeader', 'moderator', 'admin'], default: 'user' }],
  clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan' },
}, { timestamps: true });


userSchema.index({ clan: 1 });

module.exports = mongoose.model('User', userSchema);