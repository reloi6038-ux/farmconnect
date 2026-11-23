const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/reviewController');

// Produce-specific reviews (must come BEFORE /:id routes)
router.get('/produce/:produceId', c.listForProduce);
router.get('/eligibility/:produceId', protect, c.eligibility);
router.post('/produce/:produceId', protect, c.createForProduce);

// Platform reviews
router.get('/', c.list);
router.get('/mine', protect, c.mine);
router.post('/', protect, c.create);
router.post('/:id/helpful', c.markHelpful);

// Admin moderation
router.patch('/:id/moderate', protect, authorize('admin'), c.moderate);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;
