const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, state, location, farmName, farmLocation } = req.body;
    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be farmer or buyer' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role, state, location });

    if (role === 'farmer') {
      await FarmerProfile.create({
        user: user._id,
        farmName: farmName || `${name}'s Farm`,
        farmLocation: farmLocation || location || 'Unknown'
      });
    }

    await Notification.create({
      recipient: user._id,
      title: 'Welcome to Farm-to-Market Connect',
      message: 'Your account has been created. Complete your profile to get started.',
      type: 'system'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ success: true, data: req.user });
};

const updateProfile = async (req, res, next) => {
  try {
    const fields = ['name', 'phone', 'location', 'state', 'address', 'bio', 'avatar', 'country'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) req.user[f] = req.body[f];
    });
    const updated = await req.user.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Provide current and new password (min 6 chars)' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, updateProfile, changePassword };
