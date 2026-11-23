const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/reviewController');

router.get('/', c.list);
router.get('/mine', protect, c.mine);
router.post('/', protect, c.create);
router.post('/:id/helpful', c.markHelpful);
router.patch('/:id/moderate', protect, authorize('admin'), c.moderate);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;
