const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/enquiryController');

router.post('/', protect, authorize('buyer'), c.create);
router.get('/mine', protect, c.myEnquiries);
router.get('/:id', protect, c.getOne);
router.put('/:id/respond', protect, authorize('farmer'), c.respond);
router.patch('/:id/status', protect, c.updateStatus);

module.exports = router;
