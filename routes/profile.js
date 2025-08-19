const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile_control');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { body } = require('express-validator');

// Route to serve profile.html - requires authentication
router.get('/', isAuthenticated, profileController.showProfile);

// API routes for profile operations
// Get user profile data - requires authentication (not necessarily admin)
router.get('/api/user', isAuthenticated, profileController.getUserProfile);

// Update user profile with validation - allow authenticated users
router.post('/api/user', isAuthenticated, [
    body('first_name').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('last_name').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], profileController.updateUserProfile);

// Get business details - requires authentication
router.get('/api/business', isAuthenticated, profileController.getUserProfile);

// Update business details with validation - admin only
router.post('/api/business', isAdmin, [
    body('business_name').trim().isLength({ min: 1 }).withMessage('Business name is required')
], profileController.updateBusinessDetails);

// Change password with validation - requires authentication
router.post('/api/change-password', isAuthenticated, [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error('Password confirmation does not match');
        }
        return true;
    })
], profileController.changePassword);

// Test route
router.get('/test', (req, res) => {
    res.send('Profile route test working');
});

module.exports = router;
