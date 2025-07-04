const express = require('express');
const router = express.Router();
const {
  getAllArtisanRequests,
  handleArtisanRequest,
  deleteArtisanRequest,
  createArtisanRequest,
  getMyArtisanRequest
} = require('../controllers/artisanRequestController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// Get all artisan requests (admin only)
router.get('/', authMiddleware, checkRole(['admin']), getAllArtisanRequests);

// Artisan creates a request
router.post('/', authMiddleware, checkRole(['customer', 'artisan']), createArtisanRequest);

// Artisan gets their own request status
router.get('/my-request', authMiddleware, checkRole(['customer', 'artisan']), getMyArtisanRequest);

// Approve or reject artisan request (admin only)
router.put('/:requestId', authMiddleware, checkRole(['admin']), handleArtisanRequest);

// Delete artisan request (admin only)
router.delete('/:requestId', authMiddleware, checkRole(['admin']), deleteArtisanRequest);

module.exports = router;