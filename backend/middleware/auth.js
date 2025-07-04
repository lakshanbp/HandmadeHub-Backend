const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received:', token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    console.log('Token valid for user:', decoded);
    next();
  } catch (err) {
    console.log('Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;