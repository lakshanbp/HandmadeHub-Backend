const mongoose = require('mongoose');

const artisanRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brandName: { type: String, required: true },
  bio: { type: String, required: true },
  portfolioLink: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ArtisanRequest', artisanRequestSchema);