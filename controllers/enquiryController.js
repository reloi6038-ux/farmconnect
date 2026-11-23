const Enquiry = require('../models/Enquiry');
const Produce = require('../models/Produce');
const Notification = require('../models/Notification');

const create = async (req, res, next) => {
  try {
    const { produceId, subject, message, quantityRequested, offerPrice } = req.body;
    if (!produceId || !subject || !message || !quantityRequested) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const produce = await Produce.findById(produceId);
    if (!produce) return res.status(404).json({ success: false, message: 'Produce not found' });
    if (produce.farmer.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot enquire on your own listing' });
    }
    const duplicate = await Enquiry.findOne({
      buyer: req.user._id,
      produce: produce._id,
      status: 'pending'
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'You already have a pending enquiry on this produce' });
    }

    const enquiry = await Enquiry.create({
      buyer: req.user._id,
      farmer: produce.farmer,
      produce: produce._id,
      subject,
      message,
      quantityRequested: Number(quantityRequested),
      offerPrice: offerPrice ? Number(offerPrice) : undefined
    });

    await Notification.create({
      recipient: produce.farmer,
      title: 'New enquiry received',
      message: `You have a new enquiry for ${produce.productName}`,
      type: 'enquiry',
      relatedId: enquiry._id
    });

    res.status(201).json({ success: true, data: enquiry });
  } catch (err) {
    next(err);
  }
};

const myEnquiries = async (req, res, next) => {
  try {
    const q = req.user.role === 'farmer' ? { farmer: req.user._id } : { buyer: req.user._id };
    if (req.query.status) q.status = req.query.status;
    const items = await Enquiry.find(q)
      .populate('produce', 'productName price unit images location state')
      .populate('buyer', 'name email phone state location')
      .populate('farmer', 'name email phone state location')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const e = await Enquiry.findById(req.params.id)
      .populate('produce', 'productName price unit images location state farmer')
      .populate('buyer', 'name email phone state location')
      .populate('farmer', 'name email phone state location');
    if (!e) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    const isBuyer = e.buyer._id.toString() === req.user._id.toString();
    const isFarmer = e.farmer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: e });
  } catch (err) {
    next(err);
  }
};

const respond = async (req, res, next) => {
  try {
    const { response, status } = req.body;
    const e = await Enquiry.findById(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    if (e.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!response) return res.status(400).json({ success: false, message: 'Response text required' });

    e.farmerResponse = response;
    e.status = ['responded', 'accepted', 'rejected'].includes(status) ? status : 'responded';
    await e.save();

    await Notification.create({
      recipient: e.buyer,
      title: 'Farmer responded to your enquiry',
      message: `Status: ${e.status}. Message: ${response.substring(0, 120)}`,
      type: e.status === 'accepted' ? 'accept' : e.status === 'rejected' ? 'reject' : 'response',
      relatedId: e._id
    });

    res.json({ success: true, data: e });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'responded', 'accepted', 'rejected', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const e = await Enquiry.findById(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    const isBuyer = e.buyer.toString() === req.user._id.toString();
    const isFarmer = e.farmer.toString() === req.user._id.toString();
    if (!isBuyer && !isFarmer) return res.status(403).json({ success: false, message: 'Not authorized' });

    e.status = status;
    await e.save();
    res.json({ success: true, data: e });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, myEnquiries, getOne, respond, updateStatus };
