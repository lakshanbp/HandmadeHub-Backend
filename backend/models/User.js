const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'artisan', 'customer'],
    default: 'customer',
  },
  artisanStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'none'],
    default: 'none',
  },
  bio: { type: String, default: '' },
  portfolioLink: { type: String, default: '' },
  instagram: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  logoImage: { type: String, default: '' },
  storeColor: { type: String, default: '#fff' },
  storeAnnouncement: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);