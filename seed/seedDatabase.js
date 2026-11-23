require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Category = require('../models/Category');
const Produce = require('../models/Produce');
const MarketPrice = require('../models/MarketPrice');
const Notification = require('../models/Notification');
const Review = require('../models/Review');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

(async () => {
  await connectDB();
  console.log('[seed] clearing collections...');
  await Promise.all([
    User.deleteMany({}), FarmerProfile.deleteMany({}), Category.deleteMany({}),
    Produce.deleteMany({}), MarketPrice.deleteMany({}), Notification.deleteMany({}),
    Review.deleteMany({})
  ]);

  const categoryNames = ['Grains','Vegetables','Fruits','Tubers','Legumes','Poultry','Livestock','Fish','Dairy','Herbs','Spices','Seeds','Other'];
  const categories = await Category.insertMany(categoryNames.map((name) => ({
    name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: `Fresh ${name.toLowerCase()} sourced directly from verified Nigerian farmers.`,
    status: 'active'
  })));
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c._id]));
  console.log(`[seed] ${categories.length} categories`);

  await User.create({ name: 'FarmConnect Operations', email: 'admin@farmconnect.ng', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234', role: 'admin', verified: true, state: 'FCT', location: 'Abuja' });

  const farmers = await User.create([
    { name: 'Ibrahim Musa', email: 'ibrahim@farmconnect.ng', password: process.env.SEED_FARMER_PASSWORD || 'Farmer@1234', role: 'farmer', phone: '08031234567', state: 'Kaduna', location: 'Zaria', bio: 'Third-generation farmer growing tomatoes, maize and pepper across 5 hectares in Zaria.', verified: true, createdAt: daysAgo(120) },
    { name: 'Ada Obi', email: 'ada@farmconnect.ng', password: process.env.SEED_FARMER_PASSWORD || 'Farmer@1234', role: 'farmer', phone: '08128765432', state: 'Enugu', location: 'Nsukka', bio: 'Organic grower producing yam, cassava and leafy vegetables for restaurants across the South-East.', verified: true, createdAt: daysAgo(95) },
    { name: 'Yusuf Bello', email: 'yusuf@farmconnect.ng', password: process.env.SEED_FARMER_PASSWORD || 'Farmer@1234', role: 'farmer', phone: '07061122334', state: 'Kano', location: 'Kano', bio: 'Rice and grain farmer supplying wholesalers across Northern Nigeria.', verified: true, createdAt: daysAgo(60) }
  ]);

  await FarmerProfile.insertMany([
    { user: farmers[0]._id, farmName: 'Musa Family Farms', farmLocation: 'Zaria, Kaduna', farmSize: '5 hectares', farmingExperience: 18, crops: ['Tomatoes','Maize','Pepper'], farmingType: 'conventional', verificationStatus: 'verified' },
    { user: farmers[1]._id, farmName: 'Ada Green Acres', farmLocation: 'Nsukka, Enugu', farmSize: '3 hectares', farmingExperience: 9, crops: ['Yam','Cassava','Okra'], farmingType: 'organic', verificationStatus: 'verified' },
    { user: farmers[2]._id, farmName: 'Bello Grain Estate', farmLocation: 'Kano, Kano', farmSize: '12 hectares', farmingExperience: 22, crops: ['Rice','Maize','Sorghum'], farmingType: 'conventional', verificationStatus: 'verified' }
  ]);

  const buyers = await User.create([
    { name: 'Ngozi Adeyemi', email: 'ngozi@lagostreats.ng', password: process.env.SEED_BUYER_PASSWORD || 'Buyer@1234', role: 'buyer', phone: '08055550101', state: 'Lagos', location: 'Lekki', bio: 'Procurement lead at Lagos Treats — a 12-restaurant group.', verified: true, createdAt: daysAgo(45) },
    { name: 'Emeka Nwankwo', email: 'emeka@greenbasket.ng', password: process.env.SEED_BUYER_PASSWORD || 'Buyer@1234', role: 'buyer', phone: '08166660202', state: 'Abuja', location: 'Wuse', bio: 'Owner of Green Basket grocery chain — 8 stores serving Abuja.', verified: true, createdAt: daysAgo(30) }
  ]);

  const produceData = [
    { farmer: farmers[0]._id, productName: 'Fresh Roma Tomatoes', category: catMap['Vegetables'], description: 'Vine-ripened Roma tomatoes, hand-picked this morning. Ideal for restaurants and stew production.', quantity: 850, unit: 'kg', price: 850, minimumOrder: 20, location: 'Zaria', state: 'Kaduna', qualityGrade: 'A', featured: true, views: 342, favoriteCount: 18, createdAt: daysAgo(3) },
    { farmer: farmers[0]._id, productName: 'Yellow Maize (Dried)', category: catMap['Grains'], description: 'Sun-dried yellow maize, moisture < 13%. Bulk discounts available.', quantity: 5000, unit: 'kg', price: 420, minimumOrder: 100, location: 'Zaria', state: 'Kaduna', qualityGrade: 'A', featured: true, views: 218, createdAt: daysAgo(8) },
    { farmer: farmers[1]._id, productName: 'Organic White Yam', category: catMap['Tubers'], description: 'Pesticide-free white yam tubers. Grown with compost only.', quantity: 600, unit: 'kg', price: 1350, minimumOrder: 30, location: 'Nsukka', state: 'Enugu', organic: true, qualityGrade: 'A', featured: true, views: 267, favoriteCount: 24, createdAt: daysAgo(2) },
    { farmer: farmers[1]._id, productName: 'Fresh Okra', category: catMap['Vegetables'], description: 'Tender green okra, harvested at peak.', quantity: 240, unit: 'kg', price: 750, minimumOrder: 15, location: 'Nsukka', state: 'Enugu', qualityGrade: 'A', views: 88, createdAt: daysAgo(4) },
    { farmer: farmers[1]._id, productName: 'Sweet Plantain Bunch', category: catMap['Fruits'], description: 'Mature green plantain bunches, ideal for ripening on arrival.', quantity: 80, unit: 'bunch', price: 2800, minimumOrder: 5, location: 'Nsukka', state: 'Enugu', qualityGrade: 'A', featured: true, views: 178, createdAt: daysAgo(7) },
    { farmer: farmers[2]._id, productName: 'Local Ofada Rice', category: catMap['Grains'], description: 'Unpolished Ofada rice, aromatic and stone-free.', quantity: 3000, unit: 'kg', price: 1900, minimumOrder: 50, location: 'Kano', state: 'Kano', organic: true, qualityGrade: 'A', featured: true, views: 412, favoriteCount: 31, createdAt: daysAgo(1) },
    { farmer: farmers[2]._id, productName: 'Red Onions', category: catMap['Vegetables'], description: 'Firm red onions with tight skins, good shelf life.', quantity: 1500, unit: 'kg', price: 620, minimumOrder: 50, location: 'Kano', state: 'Kano', qualityGrade: 'A', views: 156, createdAt: daysAgo(6) },
    { farmer: farmers[2]._id, productName: 'Sorghum Grain', category: catMap['Grains'], description: 'Clean white sorghum, ideal for flour and beverages.', quantity: 4000, unit: 'kg', price: 380, minimumOrder: 100, location: 'Kano', state: 'Kano', qualityGrade: 'A', views: 44, createdAt: daysAgo(20) }
  ];
  await Produce.insertMany(produceData);
  console.log(`[seed] ${produceData.length} produce listings`);

  const priceData = [
    { product: 'Tomatoes', category: 'Vegetables', market: 'Mile 12 Market', location: 'Lagos', state: 'Lagos', unit: 'kg', minPrice: 750, maxPrice: 1300, averagePrice: 1025, priceDate: daysAgo(0), trend: 'increasing', source: 'Federal Ministry of Agriculture Market Survey' },
    { product: 'Yellow Maize', category: 'Grains', market: 'Dawanau Market', location: 'Kano', state: 'Kano', unit: 'kg', minPrice: 380, maxPrice: 470, averagePrice: 425, priceDate: daysAgo(0), trend: 'stable', source: 'Kano State Agricultural Board' },
    { product: 'White Yam', category: 'Tubers', market: 'Onitsha Main Market', location: 'Onitsha', state: 'Anambra', unit: 'kg', minPrice: 1100, maxPrice: 1600, averagePrice: 1350, priceDate: daysAgo(1), trend: 'increasing', source: 'Anambra State Market Survey' },
    { product: 'Ofada Rice', category: 'Grains', market: 'Wuse Market', location: 'Abuja', state: 'FCT', unit: 'kg', minPrice: 1700, maxPrice: 2100, averagePrice: 1900, priceDate: daysAgo(1), trend: 'stable', source: 'FCT Agriculture Secretariat' },
    { product: 'Honey Beans', category: 'Legumes', market: 'Bodija Market', location: 'Ibadan', state: 'Oyo', unit: 'kg', minPrice: 1150, maxPrice: 1450, averagePrice: 1300, priceDate: daysAgo(2), trend: 'increasing', source: 'Oyo State Ministry of Agriculture' },
    { product: 'Red Onions', category: 'Vegetables', market: 'Sokoto Central Market', location: 'Sokoto', state: 'Sokoto', unit: 'kg', minPrice: 500, maxPrice: 780, averagePrice: 640, priceDate: daysAgo(1), trend: 'decreasing', source: 'Sokoto State Market Survey' },
    { product: 'Scotch Bonnet Pepper', category: 'Spices', market: 'Mile 12 Market', location: 'Lagos', state: 'Lagos', unit: 'kg', minPrice: 1300, maxPrice: 1900, averagePrice: 1600, priceDate: daysAgo(0), trend: 'increasing', source: 'Federal Ministry of Agriculture Market Survey' },
    { product: 'Cassava Tubers', category: 'Tubers', market: 'Onitsha Main Market', location: 'Onitsha', state: 'Anambra', unit: 'kg', minPrice: 280, maxPrice: 380, averagePrice: 330, priceDate: daysAgo(2), trend: 'stable', source: 'Anambra State Market Survey' },
    { product: 'Plantain', category: 'Fruits', market: 'Oja Oba Market', location: 'Ibadan', state: 'Oyo', unit: 'bunch', minPrice: 2500, maxPrice: 3200, averagePrice: 2850, priceDate: daysAgo(1), trend: 'increasing', source: 'Oyo State Ministry of Agriculture' },
    { product: 'Fresh Okra', category: 'Vegetables', market: 'Mushin Market', location: 'Lagos', state: 'Lagos', unit: 'kg', minPrice: 650, maxPrice: 850, averagePrice: 750, priceDate: daysAgo(0), trend: 'stable', source: 'Lagos State Market Survey' }
  ];
  await MarketPrice.insertMany(priceData);
  console.log(`[seed] ${priceData.length} market prices`);

  const reviewData = [
    { user: farmers[0]._id, name: 'Ibrahim Musa', role: 'farmer', location: 'Zaria, Kaduna', rating: 5, title: 'My margins are up 40%', body: 'Before FarmConnect I sold tomatoes to middlemen at whatever price they offered. Now Lagos restaurants reach me directly through enquiries. The dashboard shows me exactly which listings are getting attention and I can price confidently against the market prices page.', status: 'approved', featured: true, helpful: 34, createdAt: daysAgo(20) },
    { user: buyers[0]._id, name: 'Ngozi Adeyemi', role: 'buyer', location: 'Lekki, Lagos', rating: 5, title: 'Sourcing for 12 restaurants just got simpler', body: 'Sourcing fresh produce for 12 restaurants used to take hours of phone calls. Now I filter by state, compare prices, and send enquiries in minutes. Our food cost dropped 22% in 3 months and delivery is far more reliable.', status: 'approved', featured: true, helpful: 51, createdAt: daysAgo(15) },
    { user: farmers[1]._id, name: 'Ada Obi', role: 'farmer', location: 'Nsukka, Enugu', rating: 5, title: 'Organic buyers find me now', body: 'As an organic farmer, buyers who care about pesticide-free produce are hard to find locally. FarmConnect connects me with restaurants in Enugu and Lagos who genuinely value what I grow. My yam listings have been featured twice.', status: 'approved', featured: true, helpful: 42, createdAt: daysAgo(11) },
    { user: buyers[1]._id, name: 'Emeka Nwankwo', role: 'buyer', location: 'Wuse, Abuja', rating: 4, title: 'Great for grocery procurement', body: 'We run 8 stores and FarmConnect has become our default for grains and tubers. The market prices section lets us benchmark before we commit. Only wish the mobile app were available, but the responsive site works well.', status: 'approved', featured: false, helpful: 18, createdAt: daysAgo(9) },
    { user: farmers[2]._id, name: 'Yusuf Bello', role: 'farmer', location: 'Kano, Kano', rating: 5, title: 'Wholesalers now come to me', body: 'I used to drive my rice and sorghum to three markets looking for buyers. Now wholesalers find my listings on FarmConnect, send enquiries, and I fulfil directly. Way less time on the road, way more time on the farm.', status: 'approved', featured: false, helpful: 26, createdAt: daysAgo(6) }
  ];
  await Review.insertMany(reviewData);
  console.log(`[seed] ${reviewData.length} reviews`);

  const notifs = [];
  for (const u of [...farmers, ...buyers]) {
    notifs.push({
      recipient: u._id, title: 'Welcome to FarmConnect',
      message: `Your ${u.role} account is live. ${u.role === 'farmer' ? 'Start listing your produce to reach buyers across Nigeria.' : 'Browse verified farmers and send your first enquiry.'}`,
      type: 'system', read: false, createdAt: daysAgo(1)
    });
  }
  await Notification.insertMany(notifs);
  console.log(`[seed] ${notifs.length} welcome notifications`);

  console.log('\n✅ Seed complete.\n');
  console.log('Admin  : admin@farmconnect.ng / ' + (process.env.SEED_ADMIN_PASSWORD || 'Admin@1234'));
  console.log('Farmer : ibrahim@farmconnect.ng / ' + (process.env.SEED_FARMER_PASSWORD || 'Farmer@1234'));
  console.log('Farmer : ada@farmconnect.ng / ' + (process.env.SEED_FARMER_PASSWORD || 'Farmer@1234'));
  console.log('Farmer : yusuf@farmconnect.ng / ' + (process.env.SEED_FARMER_PASSWORD || 'Farmer@1234'));
  console.log('Buyer  : ngozi@lagostreats.ng / ' + (process.env.SEED_BUYER_PASSWORD || 'Buyer@1234'));
  console.log('Buyer  : emeka@greenbasket.ng / ' + (process.env.SEED_BUYER_PASSWORD || 'Buyer@1234'));

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
