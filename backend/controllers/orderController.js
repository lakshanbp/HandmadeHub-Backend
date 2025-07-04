const Order = require('../models/Order');
const Product = require('../models/Product');

// Create a new order (customer only)
exports.createOrder = async (req, res) => {
  try {
    // Get the first product to determine the artisan
    const firstProduct = await Product.findById(req.body.items[0].product);
    if (!firstProduct) {
      return res.status(400).json({ error: 'Product not found' });
    }

    console.log('Creating order for customer:', req.user.id, 'artisan:', firstProduct.artisan);

    const order = new Order({ 
      ...req.body, 
      customer: req.user.id,
      artisan: firstProduct.artisan, // Set artisan from the product
      status: 'pending' // Ensure default status
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Order creation failed', details: error.message });
  }
};

// Get orders for the logged-in user (customer only)
exports.getMyOrders = async (req, res) => {
  try {
    console.log('Fetching orders for customer:', req.user.id);
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
};

// Get orders by user ID (admin only)
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.userId })
      .populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user orders', details: error.message });
  }
};

// Get single order by ID (admin or customer)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Ensure customer can only access their own order
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to order' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
};

// Get single order by ID for artisan (artisan only)
exports.getOrderByIdForArtisan = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Ensure artisan can only access their own orders
    if (order.artisan.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to order' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update order status', details: error.message });
  }
};

// Delete order by ID (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
};

// Order analytics endpoint (admin dashboard stats)
exports.getOrderAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order analytics', details: err.message });
  }
};

// Get orders for the logged-in artisan (for dashboard tracking)
exports.getMyOrdersForArtisan = async (req, res) => {
  try {
    const orders = await Order.find({ artisan: req.user.id })
      .populate('customer', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artisan orders', details: error.message });
  }
};

// Update tracking info/status/history (artisan or admin)
exports.updateOrderTracking = async (req, res) => {
  try {
    const { trackingNumber, carrier, trackingStatus, trackingUrl, location, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only allow the artisan who owns the order or admin
    if (req.user.role === 'artisan' && order.artisan.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update status if provided
    if (status) {
      if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      order.status = status;
    }

    // Update tracking information
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (carrier !== undefined) order.carrier = carrier;
    if (trackingStatus !== undefined) order.trackingStatus = trackingStatus;
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;

    // Add to tracking history if status/location provided
    if (status || location) {
      order.trackingHistory.push({
        date: new Date(),
        location: location || '',
        status: status || order.trackingStatus
      });
    }

    await order.save();
    
    // Return populated order
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.product');
    
    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update tracking info', details: error.message });
  }
};