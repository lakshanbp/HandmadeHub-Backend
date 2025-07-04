const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackingNumber: { type: String, default: '' },
  carrier: { type: String, default: '' },
  trackingStatus: { type: String, default: 'pending' },
  trackingUrl: { type: String, default: '' },
  trackingHistory: [
    {
      date: { type: Date, required: true },
      location: { type: String, default: '' },
      status: { type: String, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);