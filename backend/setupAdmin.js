const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs'); // Add this at the top

dotenv.config({ path: require('path').resolve(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI, {
}).then(async () => {
  console.log('MongoDB connected');

  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    adminExists.password = 'password123'; // Reset password
    await adminExists.save();
    console.log('Admin user already exists, password has been reset to: password123');
  } else {
    const admin = new User({
      name: 'Admin User',
      email: 'admin@handmadehub.com',
      password: 'password123',
      role: 'admin',
      artisanStatus: 'none',
    });
    await admin.save();
    console.log('Admin user created');
  }
  mongoose.connection.close();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});