const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productName: { type: String, required: true, trim: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  description: { type: String, maxlength: 2000 },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, default: 'kg' },
  price: { type: Number, required: true, min: 0, index: true },
  priceType: { type: String, enum: ['per-unit', 'per-bag', 'per-crate', 'negotiable'], default: 'per-unit' },
  minimumOrder: { type: Number, default: 1 },
  location: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  availabilityStatus: { type: String, enum: ['available', 'sold', 'paused'], default: 'available', index: true },
  harvestDate: { type: Date },
  expectedAvailability: { type: Date },
  images: [{ type: String }],
  organic: { type: Boolean, default: false },
  qualityGrade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
  views: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  approved: { type: Boolean, default: true }
}, { timestamps: true });

produceSchema.index({ productName: 'text', description: 'text' });

module.exports = mongoose.model('Produce', produceSchema);
