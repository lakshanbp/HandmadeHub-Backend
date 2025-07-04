const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductAnalytics,
  getMyProducts
} = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const multer = require('multer');

const checkArtisanStatus = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (req.user.role === 'artisan' && user.artisanStatus !== 'approved') {
    return res.status(403).json({ error: 'Artisan status not approved' });
  }
  next();
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Create a product (artisan or admin)
router.post('/', authMiddleware, checkRole(['artisan', 'admin']), checkArtisanStatus, upload.array('imageFile', 5), createProduct);

// Update a product (artisan for own products, admin for any)
router.put('/:id', authMiddleware, checkRole(['artisan', 'admin']), checkArtisanStatus, upload.single('imageFile'), updateProduct);

// Delete a product (artisan for own products, admin for any)
router.delete('/:id', authMiddleware, checkRole(['artisan', 'admin']), checkArtisanStatus, deleteProduct);

// Get all products (public)
router.get('/', getAllProducts);

// Get artisan's own products
router.get('/my-products', authMiddleware, checkRole(['artisan']), getMyProducts);

// Product search/filter endpoint (must come before /:id)
router.get('/search', async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice } = req.query;
    const filter = {};
    if (query) filter.name = { $regex: query, $options: 'i' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// Product analytics endpoint (must come before /:id)
router.get('/analytics', authMiddleware, checkRole(['admin']), getProductAnalytics);

// Get a single product by ID (public, allow all users) - must be last
router.get('/:id', getProductById);

module.exports = router;