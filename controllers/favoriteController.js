const Favorite = require('../models/Favorite');
const Produce = require('../models/Produce');

const add = async (req, res, next) => {
  try {
    const { produceId } = req.body;
    if (!produceId) return res.status(400).json({ success: false, message: 'produceId required' });
    const produce = await Produce.findById(produceId);
    if (!produce) return res.status(404).json({ success: false, message: 'Produce not found' });

    const existing = await Favorite.findOne({ buyer: req.user._id, produce: produceId });
    if (existing) return res.status(400).json({ success: false, message: 'Already favorited' });

    await Favorite.create({ buyer: req.user._id, produce: produceId });
    await Produce.findByIdAndUpdate(produceId, { $inc: { favoriteCount: 1 } });
    res.status(201).json({ success: true, message: 'Added to favorites' });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const f = await Favorite.findOneAndDelete({ buyer: req.user._id, produce: req.params.produceId });
    if (f) await Produce.findByIdAndUpdate(req.params.produceId, { $inc: { favoriteCount: -1 } });
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (e) {
    next(e);
  }
};

const mine = async (req, res, next) => {
  try {
    const items = await Favorite.find({ buyer: req.user._id })
      .populate({
        path: 'produce',
        populate: [
          { path: 'farmer', select: 'name state verified' },
          { path: 'category', select: 'name slug' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
};

const check = async (req, res, next) => {
  try {
    const f = await Favorite.findOne({ buyer: req.user._id, produce: req.params.produceId });
    res.json({ success: true, favorited: !!f });
  } catch (e) {
    next(e);
  }
};

module.exports = { add, remove, mine, check };
