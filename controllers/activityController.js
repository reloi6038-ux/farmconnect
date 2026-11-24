const Produce = require('../models/Produce');
const Enquiry = require('../models/Enquiry');
const Review = require('../models/Review');
const User = require('../models/User');

const recent = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));

    const [produces, enquiries, reviews, users] = await Promise.all([
      Produce.find({ approved: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('farmer', 'name state location')
        .populate('category', 'name')
        .select('productName farmer category price unit location state createdAt'),
      Enquiry.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('buyer', 'name state location')
        .populate('produce', 'productName')
        .select('buyer produce createdAt status'),
      Review.find({ status: 'approved', produce: null })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name role rating title location createdAt'),
      User.find({ role: { $in: ['farmer', 'buyer'] } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name role state location createdAt')
    ]);

    const activities = [];

    produces.forEach((p) => {
      if (!p.farmer) return;
      activities.push({
        type: 'produce',
        icon: '🌾',
        message: `${p.farmer.name} listed ${p.productName}`,
        detail: `${p.location}, ${p.state}`,
        createdAt: p.createdAt
      });
    });

    enquiries.forEach((e) => {
      if (!e.buyer || !e.produce) return;
      activities.push({
        type: 'enquiry',
        icon: '💬',
        message: `${e.buyer.name} sent an enquiry`,
        detail: `for ${e.produce.productName}`,
        createdAt: e.createdAt
      });
    });

    reviews.forEach((r) => {
      activities.push({
        type: 'review',
        icon: '⭐',
        message: `${r.name} left a ${r.rating}-star review`,
        detail: r.title || '',
        createdAt: r.createdAt
      });
    });

    users.forEach((u) => {
      const role = u.role === 'farmer' ? 'Farmer' : 'Buyer';
      activities.push({
        type: 'join',
        icon: u.role === 'farmer' ? '👨‍🌾' : '🛒',
        message: `${role} ${u.name} joined FarmConnect`,
        detail: u.state ? `${u.location || ''}, ${u.state}` : '',
        createdAt: u.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: activities.slice(0, limit),
      total: activities.length
    });
  } catch (e) {
    next(e);
  }
};

module.exports = { recent };
