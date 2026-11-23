const Review = require('../models/Review');

const list = async (req, res, next) => {
  try {
    const { limit = 6, status = 'approved', featured, minRating } = req.query;
    const q = {};
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
      { $match: { status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const average = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const total = agg[0] ? agg[0].count : 0;
    res.json({ success: true, data: items, average, total });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Login required to leave a review' });
    const existing = await Review.findOne({ user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already left a review' });
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
      status: 'pending'
    });
    res.status(201).json({ success: true, message: 'Thank you! Your review is being reviewed.', data: review });
  } catch (e) { next(e); }
};

const mine = async (req, res, next) => {
  try {
    const r = await Review.findOne({ user: req.user._id });
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

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
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const r = await Review.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
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

module.exports = { list, create, mine, moderate, remove, markHelpful };
