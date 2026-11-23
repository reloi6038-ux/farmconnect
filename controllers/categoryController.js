const Category = require('../models/Category');

const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.includeInactive !== 'true') q.status = 'active';
    const items = await Category.find(q).sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Name required' });
    const slug = req.body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const c = await Category.create({ ...req.body, slug });
    res.status(201).json({ success: true, data: c });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.name) {
      payload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const c = await Category.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: c });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const c = await Category.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (e) {
    next(e);
  }
};

module.exports = { list, create, update, remove };
