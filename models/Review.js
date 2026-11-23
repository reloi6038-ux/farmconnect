const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  role: { type: String, enum: ['farmer', 'buyer'], required: true },
  location: { type: String, trim: true, maxlength: 80, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 800 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
  featured: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 }
}, { timestamps: true });

reviewSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
