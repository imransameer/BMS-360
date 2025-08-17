const express = require('express');
const router = express.Router();
const newEmpController = require('../controllers/new_emp_control');
const { isAdmin } = require('../middleware/auth');

// Apply admin-only access control - only admins can add new employees
router.use(isAdmin);

// Route to render the add employee form
router.get('/', newEmpController.renderAddEmployeePage);

// Route to handle adding a new employee
router.post('/add', newEmpController.addNewEmployee);

module.exports = router;