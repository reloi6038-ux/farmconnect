const Review = require('../models/Review');
const Produce = require('../models/Produce');
const Enquiry = require('../models/Enquiry');

// Recompute and store avg rating + count on the Produce doc.
async function recomputeProduceRating(produceId) {
  const agg = await Review.aggregate([
    { $match: { produce: produceId, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const avg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
  const count = agg[0] ? agg[0].count : 0;
  await Produce.findByIdAndUpdate(produceId, { rating: avg, reviewCount: count });
}

// Public list of platform-level reviews (produce = null)
const list = async (req, res, next) => {
  try {
    const { limit = 6, status = 'approved', featured, minRating } = req.query;
    const q = { produce: null };
    if (req.user && req.user.role === 'admin') {
      if (status !== 'all') q.status = status;
    } else {
      q.status = 'approved';
    }
    if (featured === 'true') q.featured = true;
    if (minRating) q.rating = { $gte: Number(minRating) };

    const items = await Review.find(q)
      .sort({ featured: -1, createdAt: -1 })
      .limit(Math.min(50, Number(limit)));
    const agg = await Review.aggregate([
      { $match: { produce: null, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const average = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const total = agg[0] ? agg[0].count : 0;
    res.json({ success: true, data: items, average, total });
  } catch (e) { next(e); }
};

// Platform review create (produce not required)
const create = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Login required to leave a review' });
    const existing = await Review.findOne({ user: req.user._id, produce: null });
    if (existing) return res.status(400).json({ success: false, message: 'You have already left a platform review' });
    const { rating, title, body, location } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1–5 required' });
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body required' });

    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,
      role: req.user.role === 'farmer' ? 'farmer' : 'buyer',
      location: location || req.user.location || req.user.state || '',
      rating: Number(rating),
      title,
      body,
      status: 'pending',
      produce: null
    });
    res.status(201).json({ success: true, message: 'Thank you! Your review is being reviewed.', data: review });
  } catch (e) { next(e); }
};

// My platform review
const mine = async (req, res, next) => {
  try {
    const r = await Review.findOne({ user: req.user._id, produce: null });
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

// Admin moderation
const moderate = async (req, res, next) => {
  try {
    const { status, featured } = req.body;
    const update = {};
    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
      update.status = status;
    }
    if (featured !== undefined) update.featured = !!featured;
    const r = await Review.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    if (r.produce) await recomputeProduceRating(r.produce);
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const r = await Review.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    if (r.produce) await recomputeProduceRating(r.produce);
    res.json({ success: true, message: 'Review deleted' });
  } catch (e) { next(e); }
};

const markHelpful = async (req, res, next) => {
  try {
    const r = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpful: 1 } }, { new: true });
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

// -------- PRODUCE-SPECIFIC REVIEWS --------

const listForProduce = async (req, res, next) => {
  try {
    const produceId = req.params.produceId;
    const q = { produce: produceId, status: 'approved' };
    const items = await Review.find(q).sort({ helpful: -1, createdAt: -1 }).limit(20);
    const agg = await Review.aggregate([
      { $match: { produce: require('mongoose').Types.ObjectId.createFromHexString(produceId), status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const average = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const total = agg[0] ? agg[0].count : 0;
    res.json({ success: true, data: items, average, total });
  } catch (e) { next(e); }
};

const eligibility = async (req, res, next) => {
  try {
    const produceId = req.params.produceId;
    if (!req.user) return res.json({ success: true, canReview: false, reason: 'Login required' });
    const produce = await Produce.findById(produceId).select('farmer');
    if (!produce) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (produce.farmer.toString() === req.user._id.toString()) {
      return res.json({ success: true, canReview: false, reason: 'You cannot review your own listing' });
    }
    const existing = await Review.findOne({ user: req.user._id, produce: produceId });
    if (existing) return res.json({ success: true, canReview: false, reason: 'You have already reviewed this produce', existing });
    const enquiry = await Enquiry.findOne({
      buyer: req.user._id,
      produce: produceId,
      status: { $in: ['pending', 'responded', 'accepted', 'closed'] }
    });
    if (!enquiry) return res.json({ success: true, canReview: false, reason: 'You must send an enquiry on this produce before leaving a review' });
    res.json({ success: true, canReview: true });
  } catch (e) { next(e); }
};

const createForProduce = async (req, res, next) => {
  try {
    const produceId = req.params.produceId;
    if (!req.user) return res.status(401).json({ success: false, message: 'Login required' });
    const produce = await Produce.findById(produceId).select('farmer');
    if (!produce) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (produce.farmer.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review your own listing' });
    }
    const existing = await Review.findOne({ user: req.user._id, produce: produceId });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this produce' });
    const enquiry = await Enquiry.findOne({
      buyer: req.user._id,
      produce: produceId,
      status: { $in: ['pending', 'responded', 'accepted', 'closed'] }
    });
    if (!enquiry) return res.status(400).json({ success: false, message: 'You must send an enquiry on this produce before leaving a review' });

    const { rating, title, body, location } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1–5 required' });
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body required' });

    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,
      role: req.user.role === 'farmer' ? 'farmer' : 'buyer',
      location: location || req.user.location || req.user.state || '',
      rating: Number(rating),
      title,
      body,
      status: 'approved',
      produce: produceId,
      farmer: produce.farmer
    });
    await recomputeProduceRating(produceId);
    res.status(201).json({ success: true, message: 'Review submitted. Thank you!', data: review });
  } catch (e) { next(e); }
};

module.exports = {
  list,
  create,
  mine,
  moderate,
  remove,
  markHelpful,
  listForProduce,
  eligibility,
  createForProduce
};
