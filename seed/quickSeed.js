require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');

(async () => {
  await connectDB();

  const adminExists = await User.findOne({ email: 'admin@farmconnect.ng' });
  if (!adminExists) {
    await User.create({
      name: 'Platform Admin',
      email: 'admin@farmconnect.ng',
      password: 'Admin@1234',
      role: 'admin',
      verified: true
    });
    console.log('✅ Admin created: admin@farmconnect.ng / Admin@1234');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  const categoryNames = [
    'Grains', 'Vegetables', 'Fruits', 'Tubers', 'Legumes',
    'Poultry', 'Livestock', 'Fish', 'Dairy', 'Herbs', 'Spices', 'Seeds', 'Other'
  ];
  for (const name of categoryNames) {
    const slug = name.toLowerCase();
    const exists = await Category.findOne({ slug });
    if (!exists) {
      await Category.create({ name, slug, description: `${name} products` });
      console.log(`  + ${name}`);
    }
  }
  console.log('✅ Categories ready');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
