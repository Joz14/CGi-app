// models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  clanA: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  clanB: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'reported', 'confirmed'], default: 'pending' }
}, { timestamps: true });

matchSchema.index({ season: 1 });
matchSchema.index({ clanA: 1 });
matchSchema.index({ clanB: 1 });

module.exports = mongoose.model('Match', matchSchema);