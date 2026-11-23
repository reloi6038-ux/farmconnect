const FilterPreset = require('../models/FilterPreset');

const list = async (req, res, next) => {
  try {
    const presets = await FilterPreset.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: presets });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { name, filters } = req.body;
    if (!name || !filters || typeof filters !== 'object') {
      return res.status(400).json({ success: false, message: 'name and filters are required' });
    }
    const count = await FilterPreset.countDocuments({ user: req.user._id });
    if (count >= 10) {
      return res.status(400).json({ success: false, message: 'Maximum of 10 presets per account' });
    }
    const preset = await FilterPreset.create({ user: req.user._id, name, filters });
    res.status(201).json({ success: true, data: preset });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const p = await FilterPreset.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!p) return res.status(404).json({ success: false, message: 'Preset not found' });
    res.json({ success: true, message: 'Preset deleted' });
  } catch (e) { next(e); }
};

module.exports = { list, create, remove };
