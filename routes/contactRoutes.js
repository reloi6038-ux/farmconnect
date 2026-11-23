const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/contactController');

router.post('/', c.create);
router.get('/', protect, authorize('admin'), c.list);
router.patch('/:id/status', protect, authorize('admin'), c.updateStatus);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;
