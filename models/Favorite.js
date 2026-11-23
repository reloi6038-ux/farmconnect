const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  produce: { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true, index: true }
}, { timestamps: true });

favoriteSchema.index({ buyer: 1, produce: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
