const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tag: { type: String, required: true, unique: true }, // Display tag, must be unique 5 Alphanumeric
  joinCode: { type: String, required: true, unique: true }, // Private invite code 8 alphanumeric characters
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League' }, // Optional
}, { timestamps: true });

clanSchema.index({ code: 1 });
clanSchema.index({ leader: 1 });

module.exports = mongoose.model('Clan', clanSchema);
