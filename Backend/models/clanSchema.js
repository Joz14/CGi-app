const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // For joining clan
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League' }, // Optional if needed
}, { timestamps: true });

clanSchema.index({ code: 1 });
clanSchema.index({ leader: 1 });

module.exports = mongoose.model('Clan', clanSchema);