const Notification = require('../models/Notification');

const list = async (req, res, next) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const items = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, data: items, unread });
  } catch (e) {
    next(e);
  }
};

const unreadCount = async (req, res, next) => {
  try {
    const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, unread });
  } catch (e) {
    next(e);
  }
};

const markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: n });
  } catch (e) {
    next(e);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All marked read' });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
};

module.exports = { list, unreadCount, markRead, markAllRead, remove };
