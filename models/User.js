const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
  email: {
    type: String, required: [true, 'Email is required'], unique: true, lowercase: true, index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['farmer', 'buyer', 'admin'], default: 'buyer', index: true },
  accountStatus: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  avatar: { type: String, default: '' },
  location: { type: String, default: '' },
  state: { type: String, default: '', index: true },
  country: { type: String, default: 'Nigeria' },
  address: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  verified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lastSeen: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);

