const User = require('../models/User');
const ArtisanRequest = require('../models/ArtisanRequest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Use bcryptjs everywhere
const nodemailer = require('nodemailer');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role, name: user.name, artisanStatus: user.artisanStatus }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if an admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists && role === 'admin') {
      return res.status(403).json({ error: 'Admin already exists' });
    }

    // Only allow valid roles
    const allowedRoles = ['customer', 'artisan', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const user = new User({ name, email, password, role: userRole });
    await user.save();
    // Generate token with name
    const token = generateToken(user);
    res.status(201).json({ message: `User registered as ${userRole}`, user, token });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(error);
  }
};

// Login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`[Login Attempt] Email: ${email}`); // Debug

    const user = await User.findOne({ email });
    if (!user) {
      console.log('[Login Fail] User not found.'); // Debug
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[Login] User found:', user.email); // Debug

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('[Login Fail] Password does not match.'); // Debug
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('[Login Success] Password matched.'); // Debug

    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};

// Request Artisan Role
exports.requestArtisanRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'customer') {
      return res.status(400).json({ error: 'Only customers can request artisan role' });
    }
    if (user.artisanStatus !== 'none') {
      return res.status(400).json({ error: 'Artisan request already submitted or processed' });
    }

    const artisanRequest = new ArtisanRequest({
      user: req.user.id,
      status: 'pending',
    });
    await artisanRequest.save();

    user.artisanStatus = 'pending';
    await user.save();

    res.status(201).json({ message: 'Artisan role request submitted', artisanRequest });
  } catch (error) {
    next(error);
  }
};

// Forgot Password (send reset link)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Always respond with success to prevent email enumeration
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    // Generate a reset token (JWT, expires in 1 hour)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email using nodemailer
    let transporter;
    if (process.env.NODE_ENV === 'development') {
      // Use Ethereal for development
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      // Use real SMTP in production
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    const mailOptions = {
      from: 'Handmade Hub <no-reply@handmadehub.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Hello,</p><p>You requested a password reset for your Handmade Hub account.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`
    };
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV === 'development') {
      console.log('Ethereal preview URL:', nodemailer.getTestMessageUrl(info));
    }
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// Reset Password (set new password)
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.password = password;
    await user.save();
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
};