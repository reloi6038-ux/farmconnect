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


const getTrends = async (req, res, next) => {
  try {
    const days = Math.min(180, Math.max(7, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const products = await MarketPrice.aggregate([
      { $match: { priceDate: { $gte: since } } },
      {
        $group: {
          _id: {
            product: '$product',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$priceDate' } }
          },
          avg: { $avg: '$averagePrice' }
        }
      },
      { $sort: { '_id.date': 1 } },
      {
        $group: {
          _id: '$_id.product',
          points: { $push: { date: '$_id.date', avg: { $round: ['$avg', 0] } } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const series = {};
    products.forEach((p) => {
      series[p._id] = p.points;
    });

    res.json({ success: true, days, series });
  } catch (e) { next(e); }
};

const getInsights = async (req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeek, lastWeek, topEnquired, topViewed] = await Promise.all([
      MarketPrice.aggregate([
        { $match: { priceDate: { $gte: weekAgo } } },
        { $group: { _id: { product: '$product', state: '$state' }, avg: { $avg: '$averagePrice' } } }
      ]),
      MarketPrice.aggregate([
        { $match: { priceDate: { $gte: twoWeeksAgo, $lt: weekAgo } } },
        { $group: { _id: { product: '$product', state: '$state' }, avg: { $avg: '$averagePrice' } } }
      ]),
      Enquiry.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $lookup: { from: 'produces', localField: 'produce', foreignField: '_id', as: 'prod' }
        },
        { $unwind: '$prod' },
        { $group: { _id: '$prod.productName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      Produce.find({ createdAt: { $gte: weekAgo } })
        .sort({ views: -1 })
        .limit(1)
        .select('productName views state')
    ]);

    const lastMap = {};
    lastWeek.forEach((r) => { lastMap[`${r._id.product}|${r._id.state}`] = r.avg; });

    const changes = thisWeek
      .map((r) => {
        const key = `${r._id.product}|${r._id.state}`;
        const prev = lastMap[key];
        if (!prev || prev === 0) return null;
        const pct = ((r.avg - prev) / prev) * 100;
        return { product: r._id.product, state: r._id.state, avg: Math.round(r.avg), pct: Math.round(pct * 10) / 10 };
      })
      .filter(Boolean);

    const insights = [];

    const biggestRise = changes.filter((c) => c.pct > 0).sort((a, b) => b.pct - a.pct)[0];
    if (biggestRise) {
      insights.push({
        type: 'rise',
        icon: '📈',
        title: `${biggestRise.product} up ${biggestRise.pct}%`,
        detail: `now ₦${biggestRise.avg.toLocaleString()}/kg in ${biggestRise.state}`,
        tone: 'rise'
      });
    }

    const biggestDrop = changes.filter((c) => c.pct < 0).sort((a, b) => a.pct - b.pct)[0];
    if (biggestDrop) {
      insights.push({
        type: 'drop',
        icon: '📉',
        title: `${biggestDrop.product} down ${Math.abs(biggestDrop.pct)}%`,
        detail: `now ₦${biggestDrop.avg.toLocaleString()}/kg in ${biggestDrop.state}`,
        tone: 'drop'
      });
    }

    if (topEnquired[0]) {
      insights.push({
        type: 'hot',
        icon: '🔥',
        title: `${topEnquired[0]._id} in demand`,
        detail: `${topEnquired[0].count} enquiries this week`,
        tone: 'hot'
      });
    }

    if (topViewed[0]) {
      insights.push({
        type: 'top',
        icon: '⭐',
        title: `Top listing: ${topViewed[0].productName}`,
        detail: `${topViewed[0].views} views this week · ${topViewed[0].state || 'Nigeria'}`,
        tone: 'top'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        icon: '📊',
        title: 'Market data is being collected',
        detail: 'New insights appear as more prices are tracked',
        tone: 'info'
      });
    }

    res.json({ success: true, data: insights });
  } catch (e) { next(e); }
};
module.exports = { list, getOne, create, update, remove, getTrends, getInsights };

