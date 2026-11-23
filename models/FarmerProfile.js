const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  farmName: { type: String, required: true, trim: true },
  farmLocation: { type: String, required: true },
  farmSize: { type: String },
  farmingExperience: { type: Number, default: 0 },
  crops: [{ type: String }],
  farmingType: { type: String, enum: ['organic', 'conventional', 'mixed'], default: 'conventional' },
  description: { type: String, maxlength: 1000 },
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },
  contactPreference: { type: String, enum: ['phone', 'email', 'both'], default: 'both' }
}, { timestamps: true });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
