const User = require('../models/User');
const Produce = require('../models/Produce');
const Enquiry = require('../models/Enquiry');
const MarketPrice = require('../models/MarketPrice');
const ContactMessage = require('../models/ContactMessage');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const FarmerProfile = require('../models/FarmerProfile');

const stats = async (req, res, next) => {
  try {
    const [
      users, farmers, buyers, produce, activeProduce,
      enquiries, pendingEnquiries, prices, messages,
      organicCount, featuredCount, reviews, pendingReviews
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      Produce.countDocuments(),
      Produce.countDocuments({ availabilityStatus: 'available' }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'pending' }),
      MarketPrice.countDocuments(),
      ContactMessage.countDocuments({ status: 'new' }),
      Produce.countDocuments({ organic: true }),
      Produce.countDocuments({ featured: true }),
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' })
    ]);

    const produceByCategory = await Produce.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, name: '$category.name' } }
    ]);

    const produceByState = await Produce.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const enquiryByStatus = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topViewed = await Produce.find({}).sort({ views: -1 }).limit(5).select('productName views favoriteCount price state').populate('category', 'name');
    const topFavorited = await Produce.find({}).sort({ favoriteCount: -1 }).limit(5).select('productName views favoriteCount price state');
    const topFarmers = await User.find({ role: 'farmer' }).sort({ verified: -1, createdAt: -1 }).limit(5).select('name state location verified');

    const ratingAgg = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const avgRating = ratingAgg[0] ? Math.round(ratingAgg[0].avg * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        users, farmers, buyers, produce, activeProduce,
        enquiries, pendingEnquiries, prices, messages,
        organicCount, featuredCount, reviews, pendingReviews, avgRating,
        produceByCategory, produceByState, enquiryByStatus,
        topViewed, topFavorited, topFarmers
      }
    });
  } catch (e) { next(e); }
};

const analytics = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dayGroup = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [usersOverTime, produceOverTime, enquiryTrends, reviewTrends] = await Promise.all([
      User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayGroup, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Produce.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayGroup, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Enquiry.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayGroup, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Review.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayGroup, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    ]);

    res.json({ success: true, data: { usersOverTime, produceOverTime, enquiryTrends, reviewTrends } });
  } catch (e) { next(e); }
};

const listUsers = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.role) q.role = req.query.role;
    if (req.query.status) q.accountStatus = req.query.status;
    if (req.query.search) q.$or = [{ name: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }];
    const items = await User.find(q).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

const getUser = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select('-password');
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: u });
  } catch (e) { next(e); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    if (u.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot suspend admin' });
    u.accountStatus = u.accountStatus === 'active' ? 'suspended' : 'active';
    await u.save();
    res.json({ success: true, data: { _id: u._id, accountStatus: u.accountStatus } });
  } catch (e) { next(e); }
};

const verifyUser = async (req, res, next) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).select('-password');
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: u });
  } catch (e) { next(e); }
};

const unverifyUser = async (req, res, next) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { verified: false }, { new: true }).select('-password');
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: u });
  } catch (e) { next(e); }
};

const deleteUser = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    if (u.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin accounts' });
    if (u._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Cascade cleanup: everything the user owns
    const produceIds = (await Produce.find({ farmer: u._id }).select('_id')).map((p) => p._id);

    const cleanup = await Promise.all([
      Produce.deleteMany({ farmer: u._id }),
      FarmerProfile.deleteMany({ user: u._id }),
      Enquiry.deleteMany({ $or: [{ buyer: u._id }, { farmer: u._id }] }),
      Review.deleteMany({ user: u._id }),
      Favorite.deleteMany({ buyer: u._id }),
      Notification.deleteMany({ recipient: u._id })
    ]);

    // Also remove favorites + reviews that reference this user's produce
    if (produceIds.length > 0) {
      await Promise.all([
        Favorite.deleteMany({ produce: { $in: produceIds } }),
        Review.deleteMany({ produce: { $in: produceIds } })
      ]);
    }

    await u.deleteOne();

    res.json({
      success: true,
      message: 'User and all associated data deleted',
      data: {
        deletedUser: u._id,
        produceRemoved: cleanup[0].deletedCount,
        enquiriesRemoved: cleanup[2].deletedCount,
        reviewsRemoved: cleanup[3].deletedCount,
        favoritesRemoved: cleanup[4].deletedCount,
        notificationsRemoved: cleanup[5].deletedCount
      }
    });
  } catch (e) { next(e); }
};

const listAllProduce = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.state) q.state = req.query.state;
    if (req.query.availabilityStatus) q.availabilityStatus = req.query.availabilityStatus;
    if (req.query.approved === 'false') q.approved = false;
    if (req.query.featured === 'true') q.featured = true;
    const items = await Produce.find(q).populate('farmer', 'name email state verified').populate('category', 'name slug').sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

const featureProduce = async (req, res, next) => {
  try {
    const p = await Produce.findByIdAndUpdate(req.params.id, { featured: !!req.body.featured }, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
};

const approveProduce = async (req, res, next) => {
  try {
    const p = await Produce.findByIdAndUpdate(req.params.id, { approved: !!req.body.approved }, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
};

const deleteProduceAdmin = async (req, res, next) => {
  try {
    const p = await Produce.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    res.json({ success: true, message: 'Produce removed' });
  } catch (e) { next(e); }
};

const listAllEnquiries = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const items = await Enquiry.find(q).populate('buyer', 'name email state').populate('farmer', 'name email state').populate('produce', 'productName price unit').sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

const listAllReviews = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status && req.query.status !== 'all') q.status = req.query.status;
    const items = await Review.find(q)
      .populate('produce', 'productName price unit images')
      .populate('farmer', 'name email state')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

module.exports = {
  stats,
  analytics,
  listUsers,
  getUser,
  toggleUserStatus,
  verifyUser,
  unverifyUser,
  deleteUser,
  listAllProduce,
  featureProduce,
  approveProduce,
  deleteProduceAdmin,
  listAllEnquiries,
  listAllReviews
};
