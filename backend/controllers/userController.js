const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Get single user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// Get all artisans
exports.getAllArtisans = async (req, res, next) => {
  try {
    const artisans = await User.find({ role: 'artisan', artisanStatus: 'approved' }).select('-password');
    res.json(artisans);
  } catch (error) {
    next(error);
  }
};
