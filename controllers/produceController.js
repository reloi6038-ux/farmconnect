const Produce = require('../models/Produce');
const Category = require('../models/Category');

const createProduce = async (req, res, next) => {
  try {
    const required = ['productName', 'category', 'quantity', 'unit', 'price', 'location', 'state'];
    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === '') {
        return res.status(400).json({ success: false, message: `Missing field: ${f}` });
      }
    }
    const cat = await Category.findById(req.body.category);
    if (!cat) return res.status(400).json({ success: false, message: 'Invalid category' });

    // Build a clean payload: copy body, force farmer to the authenticated user,
    // and strip fields the client should never control.
    const { _id, farmer, views, favoriteCount, ...rest } = req.body;
    const payload = { ...rest, farmer: req.user._id };

    const produce = await Produce.create(payload);
    const populated = await Produce.findById(produce._id).populate('category', 'name slug');
    res.status(201).json({ success: true, message: 'Produce listed', data: populated });
  } catch (err) {
    next(err);
  }
};

const listProduce = async (req, res, next) => {
  try {
    const {
      search, category, location, state, minPrice, maxPrice,
      availability, organic, sort, page = 1, limit = 12
    } = req.query;

    const q = { approved: true };
    if (search) q.productName = { $regex: search, $options: 'i' };
    if (category) q.category = category;
    if (location) q.location = { $regex: location, $options: 'i' };
    if (state) q.state = state;
    if (minPrice || maxPrice) q.price = {};
    if (minPrice) q.price.$gte = Number(minPrice);
    if (maxPrice) q.price.$lte = Number(maxPrice);
    if (availability) q.availabilityStatus = availability;
    if (organic === 'true') q.organic = true;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { views: -1 }
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const total = await Produce.countDocuments(q);
    const items = await Produce.find(q)
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('farmer', 'name state location verified avatar')
      .populate('category', 'name slug');

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
  } catch (err) {
    next(err);
  }
};

const getProduce = async (req, res, next) => {
  try {
    const p = await Produce.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('farmer', 'name state location verified phone email avatar bio')
      .populate('category', 'name slug');
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};

const updateProduce = async (req, res, next) => {
  try {
    const p = await Produce.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (p.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const forbidden = ['farmer', '_id', 'views', 'favoriteCount'];
    forbidden.forEach((f) => delete req.body[f]);
    Object.assign(p, req.body);
    await p.save();
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};

const deleteProduce = async (req, res, next) => {
  try {
    const p = await Produce.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (p.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await p.deleteOne();
    res.json({ success: true, message: 'Produce removed' });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['available', 'sold', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const p = await Produce.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (p.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    p.availabilityStatus = status;
    await p.save();
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};

const myProduce = async (req, res, next) => {
  try {
    const items = await Produce.find({ farmer: req.user._id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

const relatedProduce = async (req, res, next) => {
  try {
    const p = await Produce.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Produce not found' });
    const items = await Produce.find({
      _id: { $ne: p._id },
      category: p.category,
      availabilityStatus: 'available',
      approved: true
    })
      .limit(4)
      .populate('farmer', 'name state verified')
      .populate('category', 'name slug');
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    const produce = await Produce.findById(req.params.id);
    if (!produce) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (produce.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }
    const newPaths = req.files.map((f) => `/uploads/${f.filename}`);
    produce.images = [...(produce.images || []), ...newPaths].slice(0, 8);
    await produce.save();
    res.json({ success: true, message: 'Images uploaded', data: produce });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduce,
  listProduce,
  getProduce,
  updateProduce,
  deleteProduce,
  updateStatus,
  myProduce,
  relatedProduce,
  uploadImages
};
