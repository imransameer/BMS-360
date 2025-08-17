const path = require('path');
const profileModel = require('../models/profileModel');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const loggerModule = require('../utils/logger');
const xss = require('xss');
const config = require('../config/config');

// Authentication middleware helper
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.user.id) {
        loggerModule.security.unauthorizedAccess(
            req.ip, 
            req.path, 
            'profile_access_without_auth'
        );
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

// Show profile page (requires authentication)
exports.showProfile = (req, res) => {
    try {
        // Check authentication
        if (!req.session || !req.session.user) {
            return res.redirect('/auth/login');
        }

        // Use an absolute path to ensure the file is found
        const profilePath = path.resolve(__dirname, '../views/profile.html');
        console.log('Serving profile page for user:', req.session.user.email);
        
        // Check if file exists before sending
        const fs = require('fs');
        if (fs.existsSync(profilePath)) {
            res.sendFile(profilePath);
        } else {
            console.error('Profile file does not exist at:', profilePath);
            res.status(404).render('error', {
                message: 'Profile file not found',
                error: { status: 404 }
            });
        }
    } catch (error) {
        logger.error('Error showing profile:', error);
        res.status(500).render('error', {
            message: 'Error loading profile page',
            error: error
        });
    }
};

// Get user profile data (requires authentication)
exports.getUserProfile = async (req, res) => {
    try {
        // Check authentication
        if (!req.session || !req.session.user || !req.session.user.id) {
            loggerModule.security.unauthorizedAccess(
                req.ip, 
                req.path, 
                'profile_access_without_auth'
            );
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.session.user.id;
        
        const result = await profileModel.getUserById(userId);
        
        if (!result.success) {
            loggerModule.security.dataAccess(
                userId,
                req.ip,
                'profile_fetch_failed',
                { error: result.error }
            );
            return res.status(404).json({
                success: false,
                message: result.error
            });
        }

        // Log successful profile access
        loggerModule.security.dataAccess(
            userId,
            req.ip,
            'profile_fetch_success'
        );
        
        // Return sanitized user data (exclude sensitive information)
        return res.json({
            success: true,
            data: {
                firstName: xss(result.data.first_name || ''),
                lastName: xss(result.data.last_name || ''),
                email: xss(result.data.email || ''),
                businessName: xss(result.data.business_name || ''),
                tagline: xss(result.data.tagline || ''),
                contactAddress: xss(result.data.contact_address || '')
            }
        });
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
};

// Update user profile (requires authentication and validation)
exports.updateUserProfile = async (req, res) => {
    try {
        // Check authentication
        if (!req.session || !req.session.user || !req.session.user.id) {
            loggerModule.security.unauthorizedAccess(
                req.ip, 
                req.path, 
                'profile_update_without_auth'
            );
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'profile_update_validation_failed',
                { errors: errors.array() }
            );
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.session.user.id;
        const { first_name, last_name, email } = req.body;
        
        // Sanitize inputs
        const sanitizedData = {
            first_name: xss(first_name?.trim()),
            last_name: xss(last_name?.trim()),
            email: xss(email?.trim()?.toLowerCase())
        };

        // Validate required fields
        if (!sanitizedData.first_name || !sanitizedData.last_name || !sanitizedData.email) {
            loggerModule.security.inputValidationFailure(
                userId,
                req.ip,
                'profile_update_missing_fields',
                { provided: Object.keys(sanitizedData) }
            );
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: first_name, last_name, email'
            });
        }
        
        // Check if email is already in use by another user
        const emailCheck = await profileModel.getUserByEmail(sanitizedData.email);
        if (emailCheck.success && emailCheck.data.id !== userId) {
            loggerModule.security.inputValidationFailure(
                userId,
                req.ip,
                'profile_update_email_conflict',
                { attempted_email: sanitizedData.email }
            );
            return res.status(400).json({
                success: false,
                message: 'Email is already in use by another user'
            });
        }
        
        // Update the user profile
        const result = await profileModel.updateUserProfile(userId, sanitizedData);
        
        if (!result.success) {
            loggerModule.security.dataModification(
                userId,
                req.ip,
                'profile_update_failed',
                { error: result.error }
            );
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        // Log successful profile update
        loggerModule.security.dataModification(
            userId,
            req.ip,
            'profile_update_success',
            { updated_fields: Object.keys(sanitizedData) }
        );

        return res.json({
            success: true,
            message: 'User profile updated successfully',
            data: {
                firstName: sanitizedData.first_name,
                lastName: sanitizedData.last_name,
                email: sanitizedData.email
            }
        });
    } catch (error) {
        logger.error('Error updating user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user profile'
        });
    }
};

// Update business details (requires authentication and validation)
exports.updateBusinessDetails = async (req, res) => {
    try {
        // Check authentication
        if (!req.session || !req.session.user || !req.session.user.id) {
            loggerModule.security.unauthorizedAccess(
                req.ip, 
                req.path, 
                'business_update_without_auth'
            );
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'business_update_validation_failed',
                { errors: errors.array() }
            );
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.session.user.id;
        const { business_name, tagline, business_address } = req.body;
        
        // Sanitize inputs
        const sanitizedData = {
            business_name: xss(business_name?.trim()),
            tagline: xss(tagline?.trim()),
            contact_address: xss(business_address?.trim())
        };

        // Validate required fields
        if (!sanitizedData.business_name) {
            loggerModule.security.inputValidationFailure(
                userId,
                req.ip,
                'business_update_missing_name'
            );
            return res.status(400).json({
                success: false,
                message: 'Business name is required'
            });
        }
        
        // Update the business details
        const result = await profileModel.updateBusinessDetails(userId, sanitizedData);
        
        if (!result.success) {
            loggerModule.security.dataModification(
                userId,
                req.ip,
                'business_update_failed',
                { error: result.error }
            );
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        // Log successful business update
        loggerModule.security.dataModification(
            userId,
            req.ip,
            'business_update_success',
            { updated_fields: Object.keys(sanitizedData) }
        );

        return res.json({
            success: true,
            message: 'Business details updated successfully',
            data: {
                businessName: sanitizedData.business_name,
                tagline: sanitizedData.tagline,
                contactAddress: sanitizedData.contact_address
            }
        });
    } catch (error) {
        logger.error('Error updating business details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating business details'
        });
    }
};

// Change password (requires authentication and validation)
exports.changePassword = async (req, res) => {
    try {
        // Check authentication
        if (!req.session || !req.session.user || !req.session.user.id) {
            loggerModule.security.unauthorizedAccess(
                req.ip, 
                req.path, 
                'password_change_without_auth'
            );
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'password_change_validation_failed',
                { errors: errors.array() }
            );
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.session.user.id;
        const { current_password, new_password, confirm_password } = req.body;
        
        // Validate inputs
        if (!current_password || !new_password || !confirm_password) {
            loggerModule.security.inputValidationFailure(
                userId,
                req.ip,
                'password_change_missing_fields'
            );
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }
        
        if (new_password !== confirm_password) {
            loggerModule.security.inputValidationFailure(
                userId,
                req.ip,
                'password_change_mismatch'
            );
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }
        
        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(new_password)) {
            loggerModule.security.inputValidationFailure(
                userId,
                req.ip,
                'password_change_weak_password'
            );
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Get the user to verify current password
        const user = await profileModel.getUserById(userId);
        if (!user.success) {
            loggerModule.security.dataAccess(
                userId,
                req.ip,
                'password_change_user_not_found'
            );
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify current password with bcrypt
        try {
            const passwordMatch = await bcrypt.compare(current_password, user.data.password);
            if (!passwordMatch) {
                loggerModule.security.authFailure(
                    userId,
                    req.ip,
                    'password_change_wrong_current_password'
                );
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
        } catch (error) {
            logger.error('Error verifying current password:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying current password'
            });
        }
        
        // Hash the new password
        const saltRounds = config.security.bcryptRounds;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);
        
        // Update password in database
        const result = await profileModel.changePassword(userId, hashedPassword);
        
        if (!result.success) {
            loggerModule.security.dataModification(
                userId,
                req.ip,
                'password_change_failed',
                { error: result.error }
            );
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        // Log successful password change
        loggerModule.security.passwordChange(userId, req.ip, 'password_change_success');

        return res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        logger.error('Error changing password:', error);
        return res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
};

