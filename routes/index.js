const express = require('express');
const router = express.Router();
const index = require('../controllers/index_control');

// Dashboard route - admin check is handled in middleware/employeeRoutingRestrictions
router.get('/', index.getindex);

module.exports = router;
