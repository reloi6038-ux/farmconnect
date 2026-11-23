require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Produce = require('../models/Produce');

(async () => {
  await connectDB();

  const cats = await Category.find();
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c._id]));

  let farmer1 = await User.findOne({ email: 'farmer1@test.ng' });
  if (!farmer1) {
    farmer1 = await User.create({ name: 'Test Farmer', email: 'farmer1@test.ng', password: 'Farmer@1234', role: 'farmer', state: 'Kaduna', location: 'Zaria', verified: true });
  }

  let farmer2 = await User.findOne({ email: 'ada@farmconnect.ng' });
  if (!farmer2) {
    farmer2 = await User.create({ name: 'Ada Obi', email: 'ada@farmconnect.ng', password: 'Farmer@1234', role: 'farmer', state: 'Enugu', location: 'Nsukka', verified: true, phone: '08030000002' });
  }

  const existing = await Produce.countDocuments();
  if (existing > 5) {
    console.log(`ℹ️  ${existing} produce already exist, skipping`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const items = [
    { farmer: farmer1._id, productName: 'Fresh Tomatoes', category: catMap['Vegetables'], description: 'Ripe tomatoes', quantity: 500, unit: 'kg', price: 850, location: 'Zaria', state: 'Kaduna', featured: true, views: 120 },
    { farmer: farmer1._id, productName: 'Yellow Maize', category: catMap['Grains'], description: 'Dried yellow maize', quantity: 1000, unit: 'kg', price: 400, location: 'Zaria', state: 'Kaduna', views: 45 },
    { farmer: farmer1._id, productName: 'Red Pepper', category: catMap['Spices'], description: 'Hot red pepper', quantity: 100, unit: 'kg', price: 1500, location: 'Zaria', state: 'Kaduna' },
    { farmer: farmer1._id, productName: 'White Beans', category: catMap['Legumes'], description: 'Premium beans', quantity: 300, unit: 'kg', price: 1200, location: 'Zaria', state: 'Kaduna', views: 30 },
    { farmer: farmer2._id, productName: 'Organic Yam Tubers', category: catMap['Tubers'], description: 'Pesticide-free yams', quantity: 200, unit: 'kg', price: 1200, location: 'Nsukka', state: 'Enugu', organic: true, featured: true, views: 80 },
    { farmer: farmer2._id, productName: 'Fresh Okra', category: catMap['Vegetables'], description: 'Crisp okra', quantity: 150, unit: 'kg', price: 700, location: 'Nsukka', state: 'Enugu', views: 55 },
    { farmer: farmer2._id, productName: 'Cassava Tubers', category: catMap['Tubers'], description: 'Fresh cassava', quantity: 800, unit: 'kg', price: 300, location: 'Nsukka', state: 'Enugu' },
    { farmer: farmer2._id, productName: 'Plantain Bunch', category: catMap['Fruits'], description: 'Sweet plantain', quantity: 100, unit: 'bunch', price: 2500, location: 'Nsukka', state: 'Enugu', views: 65 },
    { farmer: farmer1._id, productName: 'Fresh Onions', category: catMap['Vegetables'], description: 'Red onions', quantity: 200, unit: 'kg', price: 600, location: 'Zaria', state: 'Kaduna' },
    { farmer: farmer2._id, productName: 'Local Rice', category: catMap['Grains'], description: 'Ofada rice', quantity: 500, unit: 'kg', price: 1800, location: 'Nsukka', state: 'Enugu', organic: true }
  ];

  await Produce.insertMany(items);
  console.log(`✅ Inserted ${items.length} produce listings`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
