const express = require('express');
const router = express.Router();

// Create a payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    // Initialize Stripe inside the route to ensure env vars are loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { amount, currency = 'usd' } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
