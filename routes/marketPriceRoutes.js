const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/marketPriceController');

router.get('/', c.list);
router.get('/trends', c.getTrends);
router.get('/insights', c.getInsights);
router.get('/:id', c.getOne);
router.post('/', protect, authorize('admin'), c.create);
router.put('/:id', protect, authorize('admin'), c.update);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;

