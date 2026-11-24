const User = require('../models/User');

const PRESENCE_WINDOW_MINUTES = 15;
const UPDATE_THROTTLE_MS = 5 * 60 * 1000; // Update at most every 5 min per user

// In-memory map of last DB update per user (avoids write on every request)
const lastUpdate = new Map();

const trackPresence = (req, res, next) => {
  if (req.user && req.user._id) {
    const userId = req.user._id.toString();
    const now = Date.now();
    const last = lastUpdate.get(userId) || 0;

    if (now - last > UPDATE_THROTTLE_MS) {
      lastUpdate.set(userId, now);
      // Fire-and-forget — don't block the response
      User.updateOne({ _id: req.user._id }, { $set: { lastSeen: new Date() } })
        .catch((e) => console.warn('[presence] update failed:', e.message));
    }
  }
  next();
};

module.exports = { trackPresence, PRESENCE_WINDOW_MINUTES };
