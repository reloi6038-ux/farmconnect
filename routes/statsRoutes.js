const express = require('express');
const router = express.Router();
const c = require('../controllers/statsController');

router.get('/public', c.publicStats);

module.exports = router;
