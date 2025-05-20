const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

seasonSchema.index({ league: 1, isActive: 1 });

module.exports = mongoose.model('Season', seasonSchema);