const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  produce: { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true, maxlength: 2000 },
  quantityRequested: { type: Number, required: true, min: 1 },
  offerPrice: { type: Number },
  status: { type: String, enum: ['pending', 'responded', 'accepted', 'rejected', 'closed'], default: 'pending', index: true },
  farmerResponse: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
