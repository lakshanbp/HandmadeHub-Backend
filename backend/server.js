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

// ✅ CORS configuration for Azure frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://orange-moss-001332f00.2.azurestaticapps.net',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ✅ Swagger setup
const setupSwagger = require('./swagger');
setupSwagger(app);

// ✅ Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const artisanRequestRoutes = require('./routes/artisanRequests');
const paymentRoutes = require('./routes/payments');

// Sample inline products route (optional)
const Product = require('./models/Product');
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

// Use routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes); // ✅ Enable this if using full productRoutes
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/artisan-requests', artisanRequestRoutes);
app.use('/api/payments', paymentRoutes);

// ✅ Default route
app.get('/', (req, res) => {
  res.send('✅ Handmade Hub backend is running');
});

// ✅ 404 Handler
app.use((req, res) => {
  console.log('404 handler hit for:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error handler:', err.stack || err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ✅ Start the server (Azure compatible)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
