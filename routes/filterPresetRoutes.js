const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/filterPresetController');

router.get('/', protect, c.list);
router.post('/', protect, c.create);
router.delete('/:id', protect, c.remove);

module.exports = router;
