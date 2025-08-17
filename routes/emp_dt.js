const express = require('express');
const router = express.Router();
const emp_dt_controller = require('../controllers/emp_dt_control');
const { isAdmin } = require('../middleware/auth');

// Apply admin-only access control - only admins can view employee details
router.use(isAdmin);

// Route to show employee details page
router.get('/:id', emp_dt_controller.getEmployeeDetails);

module.exports = router;
