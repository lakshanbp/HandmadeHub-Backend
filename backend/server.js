console.log('Server starting...');

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const app = express();
app.use(helmet());

// Log request origin for CORS debugging
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

<<<<<<< HEAD
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
=======
// Connect to MongoDB (with recommended options)
mongoose.connect(process.env.MONGO_URI, {
>>>>>>> ca1ebe64bc49df0b370c70c17db28976b4fb5139
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if DB connection fails
});

// Import your actual Product model
const Product = require('./models/Product');

// Sample /api/products route with error handling
app.get('/api/products', async (req, res, next) => {
  try {
    console.log('GET /api/products called');
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Error in /api/products:', err);
    next(err);
  }
});

// Swagger setup
const setupSwagger = require('./swagger');
setupSwagger(app);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const artisanRequestRoutes = require('./routes/artisanRequests');
const paymentRoutes = require('./routes/payments');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes); // Commented out to avoid duplicate route
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/artisan-requests', artisanRequestRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('✅ Handmade Hub backend is running');
});


// 404 handler
app.use((req, res) => {
  console.log('404 handler hit for:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error handler:', err.stack || err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
const PORT = process.env.PORT || 3000; // fallback doesn't matter much
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
