const express = require('express');
const router = express.Router();
const emp_dt_controller = require('../controllers/emp_dt_control');
const { isAdmin } = require('../middleware/auth');

// Allow both admin and HR employees to view employee details
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
        error: { status: 403, stack: 'You do not have permission to access employee details.' }
    });
});

// Route to show employee details page
router.get('/:id', emp_dt_controller.getEmployeeDetails);

module.exports = router;
