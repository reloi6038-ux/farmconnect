const FarmerProfile = require('../models/FarmerProfile');
const User = require('../models/User');
const Produce = require('../models/Produce');

const getProfile = async (req, res, next) => {
  try {
    const p = await FarmerProfile.findOne({ user: req.params.userId })
      .populate('user', 'name email state location verified avatar bio phone');
    if (!p) return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const p = await FarmerProfile.findOne({ user: req.user._id })
      .populate('user', 'name email state location verified avatar bio phone');
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['farmName', 'farmLocation', 'farmSize', 'farmingExperience', 'crops', 'farmingType', 'description', 'contactPreference'];
    const payload = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });
    const p = await FarmerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};

const listFarmers = async (req, res, next) => {
  try {
    const q = { role: 'farmer', accountStatus: 'active' };
    if (req.query.state) q.state = req.query.state;
    if (req.query.search) q.name = { $regex: req.query.search, $options: 'i' };
    const farmers = await User.find(q).select('name state location verified avatar bio phone');
    res.json({ success: true, data: farmers });
  } catch (err) {
    next(err);
  }
};

const stats = async (req, res, next) => {
  try {
    const all = await Produce.find({ farmer: req.user._id });
    const totalListings = all.length;
    const activeListings = all.filter((p) => p.availabilityStatus === 'available').length;
    const soldListings = all.filter((p) => p.availabilityStatus === 'sold').length;
    const pausedListings = all.filter((p) => p.availabilityStatus === 'paused').length;
    const totalViews = all.reduce((s, p) => s + (p.views || 0), 0);
    const totalFavorites = all.reduce((s, p) => s + (p.favoriteCount || 0), 0);
    res.json({
      success: true,
      data: { totalListings, activeListings, soldListings, pausedListings, totalViews, totalFavorites }
    });
  } catch (err) {
    next(err);
  }
};

const getMyRating = async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const agg = await Review.aggregate([
      { $match: { farmer: req.user._id, status: 'approved', produce: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const average = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const count = agg[0] ? agg[0].count : 0;
    res.json({ success: true, average, count });
  } catch (e) { next(e); }
};

module.exports = { getProfile, getMyProfile, updateProfile, listFarmers, stats, getMyRating };

