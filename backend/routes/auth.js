const express = require('express');
const router = express.Router();
const { registerUser, loginUser, requestArtisanRole, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-artisan', authMiddleware, checkRole(['customer']), requestArtisanRole);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;