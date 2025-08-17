const express = require('express');
const router = express.Router();
const index = require('../controllers/index_control');

// No need for authentication middleware here as it's handled in main.js
router.get('/', index.getindex);

module.exports = router;
