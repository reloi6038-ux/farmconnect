const mongoose = require('mongoose');

const filterPresetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  filters: { type: Object, required: true }
}, { timestamps: true });

filterPresetSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('FilterPreset', filterPresetSchema);
