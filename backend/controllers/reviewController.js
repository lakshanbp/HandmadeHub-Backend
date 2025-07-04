const Review = require('../models/Review');
const Product = require('../models/Product');

// Create a review (customer only)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    const review = new Review({
      customer: req.user.id,
      product: req.params.productId,
      rating,
      comment,
    });
    await review.save();

    await Product.findByIdAndUpdate(req.params.productId, {
      $push: { reviews: review._id },
      $inc: { reviewsCount: 1, rating: review.rating }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: 'Review creation failed', details: error.message });
  }
};

// Get reviews by product (public)
exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('customer', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
};

// Update a review (customer only, for their own reviews)
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    const review = await Review.findOneAndUpdate(
      { _id: req.params.reviewId, customer: req.user.id },
      { rating, comment },
      { new: true }
    ).populate('customer', 'name');
    if (!review) return res.status(404).json({ message: 'Review not found or unauthorized' });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: 'Update failed', details: error.message });
  }
};

// Delete a review (customer for their own reviews, admin for any)
exports.deleteReview = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'customer') {
      query = { _id: req.params.reviewId, customer: req.user.id };
    } else if (req.user.role === 'admin') {
      query = { _id: req.params.reviewId };
    }
    const review = await Review.findOneAndDelete(query);
    if (!review) return res.status(404).json({ message: 'Review not found or unauthorized' });

    await Product.findByIdAndUpdate(review.product, {
      $pull: { reviews: review._id },
      $inc: { reviewsCount: -1, rating: -review.rating }
    });

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
};