const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log('checkRole called for', req.originalUrl, 'user role:', req.user && req.user.role, 'allowed:', allowedRoles);
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.log('checkRole: Forbidden for user role', req.user && req.user.role);
      return res.status(403).json({ error: "Unauthorized role access" });
    }
    next();
  };
};

module.exports = checkRole;