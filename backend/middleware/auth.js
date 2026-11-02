const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the access token from the Authorization: Bearer <token> header.
 * Attaches req.user (safe fields only) on success.
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated. No token provided.' });
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message = err.name === 'TokenExpiredError' ? 'Session expired, please log in again.' : 'Invalid token.';
      return res.status(401).json({ success: false, message });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is disabled.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restricts a route to specific roles, e.g. authorize('admin', 'manager').
 * Use after `protect`.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { protect, authorize };
