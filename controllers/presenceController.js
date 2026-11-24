const User = require('../models/User');
const Produce = require('../models/Produce');
const { PRESENCE_WINDOW_MINUTES } = require('../middleware/presenceMiddleware');

const farmersOnline = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - PRESENCE_WINDOW_MINUTES * 60 * 1000);

    const [count, farmers] = await Promise.all([
      User.countDocuments({
        role: 'farmer',
        accountStatus: 'active',
        lastSeen: { $gte: since }
      }),
      User.find({
        role: 'farmer',
        accountStatus: 'active',
        lastSeen: { $gte: since }
      })
        .sort({ lastSeen: -1 })
        .limit(8)
        .select('name state location verified lastSeen avatar')
    ]);

    // Get active listing count for each online farmer
    const farmerIds = farmers.map((f) => f._id);
    const listingCounts = await Produce.aggregate([
      { $match: { farmer: { $in: farmerIds }, availabilityStatus: 'available', approved: true } },
      { $group: { _id: '$farmer', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    listingCounts.forEach((l) => { countMap[l._id.toString()] = l.count; });

    const list = farmers.map((f) => ({
      _id: f._id,
      name: f.name,
      state: f.state,
      location: f.location,
      verified: f.verified,
      lastSeen: f.lastSeen,
      activeListings: countMap[f._id.toString()] || 0
    }));

    res.json({
      success: true,
      count,
      farmers: list,
      windowMinutes: PRESENCE_WINDOW_MINUTES
    });
  } catch (e) { next(e); }
};

module.exports = { farmersOnline };
