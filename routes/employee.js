const express = require('express');
const router = express.Router();
const employee = require('../controllers/employee_control');
const { isAdmin } = require('../middleware/auth');

// Apply admin-only access control
// Only admin users can access employee management
router.use(isAdmin);

// Route for employee page - now using EJS template with data
router.get('/', employee.getemployee);

// Route to get employee details by ID
router.get('/details/:id', employee.getEmployeeById);

// Route to render edit employee form
router.get('/edit/:id', employee.renderEditEmployeeForm);

// Route to update employee
router.post('/update/:id', employee.updateEmployee);

// Route to delete employee
router.delete('/delete/:id', employee.deleteEmployee);

// Route to get list of all employees (basic info for dropdowns)
router.get('/list', employee.getAllEmployeesBasic);

// Salary management routes
router.get('/salary/list', employee.getAllSalaryRecords);
router.get('/salary/:id', employee.getSalaryById);
router.post('/salary', employee.createSalaryRecord);
router.put('/salary/:id', employee.updateSalaryRecord);
router.post('/salary/:id/pay', employee.markSalaryAsPaid);

module.exports = router;
