const Produce = require('../models/Produce');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Review = require('../models/Review');

const publicStats = async (req, res, next) => {
  try {
    const [farmers, buyers, produce, activeListings, enquiries, reviews, ratingAgg] = await Promise.all([
      User.countDocuments({ role: 'farmer', accountStatus: 'active' }),
      User.countDocuments({ role: 'buyer', accountStatus: 'active' }),
      Produce.countDocuments({ approved: true }),
      Produce.countDocuments({ approved: true, availabilityStatus: 'available' }),
      Enquiry.countDocuments(),
      Review.countDocuments({ status: 'approved' }),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ])
    ]);

    const avgRating = ratingAgg[0] ? Math.round(ratingAgg[0].avg * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        farmers,
        buyers,
        users: farmers + buyers,
        produce,
        activeListings,
        enquiries,
        reviews,
        avgRating,
        states: 36
      }
    });
  } catch (e) { next(e); }
};

module.exports = { publicStats };
