const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviewsByProduct,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// Get reviews by product (public)
router.get('/product/:productId', getReviewsByProduct);

// Create a review (customer only)
router.post('/:productId', authMiddleware, checkRole(['customer']), createReview);

// Update a review (customer only, for their own reviews)
router.put('/:reviewId', authMiddleware, checkRole(['customer']), updateReview);

// Delete a review (customer for their own reviews, admin for any)
router.delete('/:reviewId', authMiddleware, checkRole(['customer', 'admin']), deleteReview);

module.exports = router;