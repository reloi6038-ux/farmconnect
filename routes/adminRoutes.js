const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', c.stats);
router.get('/analytics', c.analytics);

router.get('/users', c.listUsers);
router.get('/users/:id', c.getUser);
router.patch('/users/:id/toggle-status', c.toggleUserStatus);
router.delete('/users/:id', c.deleteUser);
router.patch('/users/:id/verify', c.verifyUser);
router.patch('/users/:id/unverify', c.unverifyUser);

router.get('/produce', c.listAllProduce);
router.patch('/produce/:id/feature', c.featureProduce);
router.patch('/produce/:id/approve', c.approveProduce);
router.delete('/produce/:id', c.deleteProduceAdmin);

router.get('/enquiries', c.listAllEnquiries);
router.get('/reviews', c.listAllReviews);

module.exports = router;


