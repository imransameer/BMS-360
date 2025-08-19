const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/att_emp_control');
const { isAdmin } = require('../middleware/auth');

// Allow both admin and HR employees to manage attendance
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
        error: { status: 403, stack: 'You do not have permission to access attendance management.' }
    });
});

// GET attendance page
router.get('/', AttendanceController.getAttendancePage);

// Save attendance record
router.post('/save', AttendanceController.saveAttendance);

module.exports = router;
