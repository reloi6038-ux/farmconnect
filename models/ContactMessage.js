const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true, maxlength: 3000 },
  status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new', index: true }
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
