const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/notificationController');

router.get('/', protect, c.list);
router.get('/unread-count', protect, c.unreadCount);
router.patch('/read-all', protect, c.markAllRead);
router.patch('/:id/read', protect, c.markRead);
router.delete('/:id', protect, c.remove);

module.exports = router;
