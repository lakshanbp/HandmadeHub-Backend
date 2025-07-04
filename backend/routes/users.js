const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getAllArtisans } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const multer = require('multer');
const path = require('path');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// @route   GET /api/users/cart
// @desc    Get current user's cart
router.get('/cart', authMiddleware, async (req, res) => {
  try {
    console.log('Cart route: req.user.id =', req.user.id);
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(req.user.id) }).populate('items.product');
    console.log('Cart found:', cart);
    if (!cart) return res.json({ items: [] });
    const items = cart.items
      .filter(item => item.product)
      .map(item => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        images: item.product.images,
        quantity: item.quantity
      }));
    res.json({ items });
  } catch (err) {
    console.error('Cart fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// @route   POST /api/users/cart
// @desc    Update current user's cart
router.post('/cart', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    // Filter out invalid items
    const formattedItems = (items || []).filter(item =>
      item && (item._id || item.product) && item.quantity > 0
    ).map(item => ({
      product: item._id || item.product,
      quantity: item.quantity
    }));

    const cart = await Cart.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { items: formattedItems } },
      { new: true, upsert: true }
    );
    res.json(cart);
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
router.get('/', authMiddleware, checkRole(['admin']), getAllUsers);

// @route   GET /api/users/artisans
// @desc    Get all artisans (admin only)
router.get('/artisans', authMiddleware, checkRole(['admin']), getAllArtisans);

// @route   GET /api/users/:id
// @desc    Get single user by ID (admin only)
router.get('/:id', authMiddleware, checkRole(['admin']), getUserById);

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
router.put('/:id', authMiddleware, checkRole(['admin']), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
router.delete('/:id', authMiddleware, checkRole(['admin']), deleteUser);

// Public artisan profile and their products
router.get('/artisan/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const artisan = await User.findById(req.params.id).select('name email artisanStatus bio portfolioLink instagram');
    if (!artisan || artisan.artisanStatus !== 'approved') return res.status(404).json({ error: 'Artisan not found' });
    const products = await Product.find({ artisan: artisan._id });
    res.json({ artisan, products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch artisan', details: err.message });
  }
});

// @route   GET /api/users/me
// @desc    Get current user's profile
router.get('/me', authMiddleware, checkRole(['customer', 'artisan', 'admin']), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('name email bio portfolioLink instagram');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// Multer storage for profile, banner, and logo images
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.fieldname + '-' + file.originalname);
  }
});
const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, jpeg, png images are allowed'));
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// @route   PUT /api/users/me
// @desc    Update current user's profile (with image upload and validation, now supports banner/logo/storeColor/storeAnnouncement)
router.put('/me', authMiddleware, checkRole(['customer', 'artisan', 'admin']), profileImageUpload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'logoImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const User = require('../models/User');
    const updates = (({
      name, email, bio, portfolioLink, instagram, location, phone, facebook, twitter,
      storeColor, storeAnnouncement
    }) => ({
      name, email, bio, portfolioLink, instagram, location, phone, facebook, twitter,
      storeColor, storeAnnouncement
    }))(req.body);

    // Validation
    if (!updates.name || !updates.email) return res.status(400).json({ error: 'Name and email are required.' });
    if (!/^\S+@\S+\.\S+$/.test(updates.email)) return res.status(400).json({ error: 'Invalid email format.' });
    const urlFields = ['portfolioLink', 'facebook', 'twitter'];
    for (const field of urlFields) {
      if (updates[field] && !/^https?:\/\//.test(updates[field])) {
        return res.status(400).json({ error: `${field} must be a valid URL (start with http:// or https://)` });
      }
    }
    if (updates.phone && !/^\+?[0-9\-\s]{7,20}$/.test(updates.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    // Handle image uploads
    if (req.files && req.files.profileImage) {
      updates.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
    }
    if (req.files && req.files.bannerImage) {
      updates.bannerImage = `/uploads/${req.files.bannerImage[0].filename}`;
    }
    if (req.files && req.files.logoImage) {
      updates.logoImage = `/uploads/${req.files.logoImage[0].filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select(
      'name email bio portfolioLink instagram location phone facebook twitter profileImage bannerImage logoImage storeColor storeAnnouncement'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

module.exports = router;