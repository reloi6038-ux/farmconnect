const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  product: { type: String, required: true, trim: true, index: true },
  category: { type: String, required: true, index: true },
  market: { type: String, required: true },
  location: { type: String, required: true },
  state: { type: String, required: true, index: true },
  unit: { type: String, default: 'kg' },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, required: true, min: 0 },
  averagePrice: { type: Number, required: true, min: 0 },
  priceDate: { type: Date, required: true, index: true },
  trend: { type: String, enum: ['increasing', 'decreasing', 'stable'], default: 'stable' },
  source: { type: String, default: 'Market Survey' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
