const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const c = require('../controllers/produceController');

router.get('/', c.listProduce);
router.get('/mine', protect, authorize('farmer'), c.myProduce);
router.get('/:id', c.getProduce);
router.get('/:id/related', c.relatedProduce);

router.post('/', protect, authorize('farmer'), c.createProduce);
router.post('/:id/images', protect, authorize('farmer'), upload.array('images', 5), c.uploadImages);
router.put('/:id', protect, c.updateProduce);
router.patch('/:id/status', protect, authorize('farmer'), c.updateStatus);
router.delete('/:id', protect, c.deleteProduce);

module.exports = router;
