const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/farmerController');

router.get('/', c.listFarmers);
router.get('/me/profile', protect, authorize('farmer'), c.getMyProfile);
router.put('/me/profile', protect, authorize('farmer'), c.updateProfile);
router.get('/me/stats', protect, authorize('farmer'), c.stats);
router.get('/me/rating', protect, authorize('farmer'), c.getMyRating);
router.get('/:userId', c.getProfile);

module.exports = router;

