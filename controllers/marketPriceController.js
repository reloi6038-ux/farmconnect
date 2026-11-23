const MarketPrice = require('../models/MarketPrice');

const list = async (req, res, next) => {
  try {
    const { search, category, location, state, market, from, to, sort, page = 1, limit = 20 } = req.query;
    const q = {};
    if (search) q.product = { $regex: search, $options: 'i' };
    if (category) q.category = category;
    if (location) q.location = { $regex: location, $options: 'i' };
    if (state) q.state = state;
    if (market) q.market = { $regex: market, $options: 'i' };
    if (from || to) q.priceDate = {};
    if (from) q.priceDate.$gte = new Date(from);
    if (to) q.priceDate.$lte = new Date(to);

    const sortMap = {
      newest: { priceDate: -1 },
      oldest: { priceDate: 1 },
      'price-asc': { averagePrice: 1 },
      'price-desc': { averagePrice: -1 }
    };
    const sortBy = sortMap[sort] || { priceDate: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const total = await MarketPrice.countDocuments(q);
    const items = await MarketPrice.find(q)
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalItems: total,
        hasNextPage: pageNum * limitNum < total,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (e) {
    next(e);
  }
};

const getOne = async (req, res, next) => {
  try {
    const p = await MarketPrice.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Market price not found' });
    res.json({ success: true, data: p });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    const required = ['product', 'category', 'market', 'location', 'state', 'minPrice', 'maxPrice', 'priceDate'];
    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === '') {
        return res.status(400).json({ success: false, message: `Missing field: ${f}` });
      }
    }
    const data = { ...req.body };
    data.minPrice = Number(data.minPrice);
    data.maxPrice = Number(data.maxPrice);
    data.averagePrice = Math.round((data.minPrice + data.maxPrice) / 2);
    const created = await MarketPrice.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.minPrice !== undefined) payload.minPrice = Number(payload.minPrice);
    if (payload.maxPrice !== undefined) payload.maxPrice = Number(payload.maxPrice);
    if (payload.minPrice !== undefined && payload.maxPrice !== undefined) {
      payload.averagePrice = Math.round((payload.minPrice + payload.maxPrice) / 2);
    }
    const updated = await MarketPrice.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Market price not found' });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const removed = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Market price not found' });
    res.json({ success: true, message: 'Market price deleted' });
  } catch (e) {
    next(e);
  }
};

module.exports = { list, getOne, create, update, remove };
