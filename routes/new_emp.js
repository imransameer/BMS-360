const express = require('express');
const router = express.Router();
const newEmpController = require('../controllers/new_emp_control');
const { isAdmin } = require('../middleware/auth');

// Allow both admin and HR employees to add new employees
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
        error: { status: 403, stack: 'You do not have permission to add new employees.' }
    });
});

// Route to render the add employee form
router.get('/', newEmpController.renderAddEmployeePage);

// Route to handle adding a new employee
router.post('/add', newEmpController.addNewEmployee);

module.exports = router;