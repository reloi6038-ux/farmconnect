const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/favoriteController');

router.get('/', protect, c.mine);
router.get('/check/:produceId', protect, c.check);
router.post('/', protect, authorize('buyer'), c.add);
router.delete('/:produceId', protect, c.remove);

module.exports = router;
