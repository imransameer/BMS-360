const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_control');

// Simple login route
router.post('/login', authController.login);

// Logout route
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// Get current user info
router.get('/user', authController.getCurrentUser);

// Simple change password route
router.post('/change-password', authController.changePassword);

module.exports = router;
