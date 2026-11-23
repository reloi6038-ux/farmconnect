const ContactMessage = require('../models/ContactMessage');

const create = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const c = await ContactMessage.create({ name, email, phone, subject, message });
    res.status(201).json({ success: true, message: 'Message received', data: c });
  } catch (e) {
    next(e);
  }
};

const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const items = await ContactMessage.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const c = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: c });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const removed = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (e) {
    next(e);
  }
};

module.exports = { create, list, updateStatus, remove };
