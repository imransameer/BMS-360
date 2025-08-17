const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/att_emp_control');
const { isAdmin } = require('../middleware/auth');

// Apply admin-only access control - only admins can manage attendance
router.use(isAdmin);

// GET attendance page
router.get('/', AttendanceController.getAttendancePage);

// Save attendance record
router.post('/save', AttendanceController.saveAttendance);

module.exports = router;
