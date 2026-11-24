const express = require('express');
const router = express.Router();
const c = require('../controllers/activityController');

router.get('/recent', c.recent);

module.exports = router;
