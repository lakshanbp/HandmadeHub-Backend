// Script to seed four sample products for Handmade Hub
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config({ path: require('path').resolve(__dirname, '.env') });

const sampleProducts = [
  {
    name: 'Handmade Ceramic Mug',
    description: 'A beautiful, artisan-crafted ceramic mug for your morning coffee.',
    price: 24.99,
    images: ['/images/image_1.jpg'],
    category: 'homeware',
  },
  {
    name: 'Macrame Wall Hanging',
    description: 'Add a boho touch to your home with this handmade macrame wall hanging.',
    price: 39.99,
    images: ['/images/image_2.jpg'],
    category: 'accessories',
  },
  {
    name: 'Wooden Serving Board',
    description: 'Perfect for cheese, charcuterie, or bread. Handcrafted from local wood.',
    price: 29.99,
    images: ['/images/image_3.jpg'],
    category: 'planters',
  },
  {
    name: 'Gift',
    description: 'Give the gift of choice with a Handmade Hub eGift Card.',
    price: 25.00,
    images: ['/images/image_7jpg'],
    category: 'gifts',
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('Admin user not found. Run setupAdmin.js first.');
    await Product.deleteMany({}); // Remove existing products for a clean slate
    for (const prod of sampleProducts) {
      const product = new Product({ ...prod, artisan: admin._id });
      await product.save();
      console.log(`Seeded: ${product.name}`);
    }
    console.log('Sample products seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedProducts();
