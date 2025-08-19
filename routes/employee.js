const express = require('express');
const router = express.Router();
const employee = require('../controllers/employee_control');
const { isAdmin, hasAccess } = require('../middleware/auth');

// Allow both admin and HR employees to access employee management
router.use((req, res, next) => {
    // If user is admin, allow access
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }
    
    // If user is HR employee, allow access
    if (req.session && req.session.user && req.session.user.department === 'HR') {
        return next();
    }
    
    // Otherwise, deny access
    res.status(403).render('error', {
        message: 'Access Denied',
        error: { status: 403, stack: 'You do not have permission to access employee management.' }
    });
});

// Route for employee page - now using EJS template with data
router.get('/', employee.getemployee);

// Route to redirect /employee/add to /new_emp for backward compatibility
router.get('/add', (req, res) => {
    res.redirect('/new_emp');
});

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
