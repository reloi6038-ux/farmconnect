const express = require('express');
const router = express.Router();
const c = require('../controllers/presenceController');

router.get('/farmers-online', c.farmersOnline);

module.exports = router;
