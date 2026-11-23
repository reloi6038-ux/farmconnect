require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MarketPrice = require('../models/MarketPrice');

(async () => {
  await connectDB();

  const existing = await MarketPrice.countDocuments();
  if (existing > 0) {
    console.log(`ℹ️  ${existing} market prices exist, skipping`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const items = [
    { product: 'Tomatoes', category: 'Vegetables', market: 'Mile 12 Market', location: 'Lagos', state: 'Lagos', unit: 'kg', minPrice: 700, maxPrice: 1200, averagePrice: 950, priceDate: new Date(), trend: 'increasing', source: 'Market Survey' },
    { product: 'Maize', category: 'Grains', market: 'Kano Central Market', location: 'Kano', state: 'Kano', unit: 'kg', minPrice: 350, maxPrice: 450, averagePrice: 400, priceDate: new Date(), trend: 'stable', source: 'Market Survey' },
    { product: 'Yam', category: 'Tubers', market: 'Onitsha Market', location: 'Onitsha', state: 'Anambra', unit: 'kg', minPrice: 1000, maxPrice: 1500, averagePrice: 1250, priceDate: new Date(), trend: 'decreasing', source: 'Market Survey' },
    { product: 'Rice', category: 'Grains', market: 'Wuse Market', location: 'Abuja', state: 'FCT', unit: 'kg', minPrice: 1600, maxPrice: 2000, averagePrice: 1800, priceDate: new Date(), trend: 'stable', source: 'Market Survey' },
    { product: 'Beans', category: 'Legumes', market: 'Bodija Market', location: 'Ibadan', state: 'Oyo', unit: 'kg', minPrice: 1000, maxPrice: 1400, averagePrice: 1200, priceDate: new Date(), trend: 'increasing', source: 'Market Survey' },
    { product: 'Onions', category: 'Vegetables', market: 'Sokoto Central Market', location: 'Sokoto', state: 'Sokoto', unit: 'kg', minPrice: 500, maxPrice: 800, averagePrice: 650, priceDate: new Date(), trend: 'stable', source: 'Market Survey' },
    { product: 'Pepper', category: 'Spices', market: 'Mile 12 Market', location: 'Lagos', state: 'Lagos', unit: 'kg', minPrice: 1200, maxPrice: 1800, averagePrice: 1500, priceDate: new Date(), trend: 'increasing', source: 'Market Survey' },
    { product: 'Cassava', category: 'Tubers', market: 'Onitsha Market', location: 'Onitsha', state: 'Anambra', unit: 'kg', minPrice: 250, maxPrice: 400, averagePrice: 325, priceDate: new Date(), trend: 'stable', source: 'Market Survey' }
  ];

  await MarketPrice.insertMany(items);
  console.log(`✅ Inserted ${items.length} market prices`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
