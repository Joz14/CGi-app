const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clan' }]
});

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  groups: [groupSchema],
  seasons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Season' }]
}, { timestamps: true });

leagueSchema.index({ isActive: 1 });

module.exports = mongoose.model('League', leagueSchema); 