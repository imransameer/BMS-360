const authModel = require('../models/authModel');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const config = require('../config/config');
const { logger } = require('../utils/logger');
const loggerModule = require('../utils/logger');

// Track failed login attempts
const loginAttempts = new Map();

// Clean up old attempts periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of loginAttempts.entries()) {
        if (now - data.lastAttempt > config.security.lockoutTime) {
            loginAttempts.delete(key);
        }
    }
}, 60000); // Clean up every minute

// Check if IP/email combination is locked out
const isLockedOut = (ip, email) => {
    const key = `${ip}:${email}`;
    const attempts = loginAttempts.get(key);
    
    if (!attempts) return false;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const isLocked = attempts.count >= config.security.maxLoginAttempts && 
                    timeSinceLastAttempt < config.security.lockoutTime;
    
    return isLocked;
};

// Record failed login attempt
const recordFailedAttempt = (ip, email) => {
    const key = `${ip}:${email}`;
    const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
    
    attempts.count++;
    attempts.lastAttempt = Date.now();
    
    loginAttempts.set(key, attempts);
    
    loggerModule.security.loginFailure(email, ip, `Failed attempt ${attempts.count}`);
    
    return attempts.count;
};

// Clear failed attempts on successful login
const clearFailedAttempts = (ip, email) => {
    const key = `${ip}:${email}`;
    loginAttempts.delete(key);
};

// Handle login requests
exports.login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        const clientIp = req.ip;
        
        // Check if IP/email is locked out
        if (isLockedOut(clientIp, email)) {
            loggerModule.security.suspiciousActivity(clientIp, 'locked_out_login_attempt', {
                email,
                remainingTime: config.security.lockoutTime / 1000
            });
            
            return res.status(429).json({
                success: false,
                message: `Too many failed attempts. Please try again in ${config.security.lockoutTime / 60000} minutes.`,
                lockoutTime: config.security.lockoutTime / 1000
            });
        }
        
        // Basic validation
        if (!email || !password) {
            recordFailedAttempt(clientIp, email || 'unknown');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Log login attempt
        loggerModule.security.loginAttempt(email, clientIp, false, 'attempt_started');
        
        // Authenticate user
        const result = await authModel.authenticate(email, password);
        
        if (!result.success) {
            const attemptCount = recordFailedAttempt(clientIp, email);
            const remainingAttempts = config.security.maxLoginAttempts - attemptCount;
            
            return res.status(401).json({
                success: false,
                message: result.error || 'Invalid email or password',
                remainingAttempts: Math.max(0, remainingAttempts)
            });
        }
        
        // Clear failed attempts on successful login
        clearFailedAttempts(clientIp, email);
        
        // Regenerate session ID to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                logger.error('Session regeneration failed:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Login failed due to session error'
                });
            }
            
            // Set user in session with additional security info
            req.session.user = {
                ...result.user,
                loginTime: new Date(),
                loginIp: clientIp,
                userAgent: req.get('User-Agent')
            };
            
            // Update last login time in database
            authModel.updateLastLogin(result.user.id, clientIp);
            
            // Log successful login
            loggerModule.security.loginSuccess(result.user.id, email, clientIp);
            
            return res.json({
                success: true,
                message: 'Login successful',
                user: {
                    name: result.user.name,
                    email: result.user.email,
                    isAdmin: result.user.isAdmin,
                    department: result.user.department
                }
            });
        });
        
    } catch (error) {
        logger.error('Login error:', {
            error: error.message,
            stack: error.stack,
            email: req.body.email,
            ip: req.ip
        });
        
        return res.status(500).json({
            success: false,
            message: 'Error during login. Please try again.',
            ...(config.app.env !== 'production' && { error: error.message })
        });
    }
};

// Handle logout requests
exports.logout = (req, res) => {
    const userId = req.session?.user?.id;
    const clientIp = req.ip;
    
    // Log the logout
    if (userId) {
        loggerModule.security.logout(userId, clientIp);
    }
    
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            logger.error('Session destruction failed:', err);
            return res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }
        
        // Clear the session cookie
        res.clearCookie('sessionId');
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
};

// Get current user information
exports.getCurrentUser = (req, res) => {
    // Check if user is authenticated
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
    
    // Check for session hijacking (IP mismatch)
    if (req.session.user.loginIp && req.session.user.loginIp !== req.ip) {
        loggerModule.security.suspiciousActivity(req.ip, 'session_ip_mismatch', {
            sessionIp: req.session.user.loginIp,
            currentIp: req.ip,
            userId: req.session.user.id
        });
        
        // Destroy potentially compromised session
        req.session.destroy();
        return res.status(401).json({
            success: false,
            message: 'Session security violation detected. Please log in again.'
        });
    }
    
    // Return user info (excluding sensitive data)
    return res.json({
        success: true,
        user: {
            id: req.session.user.id,
            name: req.session.user.name,
            email: req.session.user.email,
            isAdmin: req.session.user.isAdmin,
            department: req.session.user.department,
            loginTime: req.session.user.loginTime
        }
    });
};

// Change password endpoint
exports.changePassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;
        const clientIp = req.ip;
        
        // Verify current password
        const verifyResult = await authModel.verifyCurrentPassword(userId, currentPassword);
        if (!verifyResult.success) {
            loggerModule.security.suspiciousActivity(clientIp, 'invalid_password_change', {
                userId,
                reason: 'current_password_incorrect'
            });
            
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
        
        // Update password in database
        const updateResult = await authModel.updatePassword(userId, hashedPassword);
        if (!updateResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update password'
            });
        }
        
        // Log password change
        loggerModule.security.passwordChange(userId, clientIp);
        
        // Invalidate all sessions for this user (force re-login)
        req.session.destroy();
        
        res.json({
            success: true,
            message: 'Password changed successfully. Please log in again.',
            requireLogin: true
        });
        
    } catch (error) {
        logger.error('Password change error:', {
            error: error.message,
            userId: req.session?.user?.id,
            ip: req.ip
        });
        
        return res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
};
