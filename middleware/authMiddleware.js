const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { trackPresence } = require('./presenceMiddleware');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }
    req.user = user;
    next();
      // Presence tracking (fire-and-forget)
      if (trackPresence) trackPresence(req, res, () => {});
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  next();
};

module.exports = { protect, authorize };

