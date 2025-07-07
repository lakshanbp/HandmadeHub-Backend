console.log('Handmade Hub backend starting...');
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
const helmet = require('helmet'); // Security middleware

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Security headers
app.use(helmet());

// Log request origin for CORS debugging
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});

// Use only the correct CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://orange-moss-001332f00.2.azurestaticapps.net',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Connect to MongoDB (with recommended options)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
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
app.use('/api/products', productRoutes);
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
  console.error('Error handler:', err);
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
