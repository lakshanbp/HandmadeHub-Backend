const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function testAnalytics() {
    try {
        // Create admin token
        const adminToken = jwt.sign(
            { id: '67582e6d2066a5efe1b27b0a', role: 'admin', name: 'Admin User' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Generated admin token:', adminToken);

        // Test analytics endpoint
        const response = await axios.get('http://localhost:5000/api/orders/analytics', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        console.log('Analytics response:', response.data);
    } catch (error) {
        console.error('Error testing analytics:', error.response?.data || error.message);
    }
}

testAnalytics();
