const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Validation middleware
const validationRules = {
    // Login validation
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
    ],

    // Registration validation
    register: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 6 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number and one special character'),
        body('first_name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[A-Za-z\s]+$/)
            .withMessage('First name must be 2-50 characters and contain only letters'),
        body('last_name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[A-Za-z\s]+$/)
            .withMessage('Last name must be 2-50 characters and contain only letters'),
        body('business_name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Business name must be 2-100 characters')
    ],

    // Employee creation validation
    employee: [
        body('first_name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[A-Za-z\s]+$/)
            .withMessage('First name must be 2-50 characters and contain only letters'),
        body('last_name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[A-Za-z\s]+$/)
            .withMessage('Last name must be 2-50 characters and contain only letters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('salary')
            .optional()
            .isNumeric()
            .withMessage('Salary must be a number'),
        body('phone')
            .optional()
            .isMobilePhone()
            .withMessage('Please provide a valid phone number')
    ],

    // Product/Inventory validation
    product: [
        body('item_name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Product name must be 2-100 characters'),
        body('price')
            .isNumeric()
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        body('stock_qty')
            .isInt({ min: 0 })
            .withMessage('Stock quantity must be a non-negative integer')
    ]
};

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// SQL Injection protection middleware
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potentially dangerous SQL keywords and characters
                obj[key] = obj[key]
                    .replace(/['";\\]/g, '') // Remove quotes and backslashes
                    .trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
};

// CSRF protection middleware (simple token-based)
const generateCSRFToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
    if (req.method === 'GET') {
        // Generate CSRF token for GET requests
        req.session.csrfToken = generateCSRFToken();
        res.locals.csrfToken = req.session.csrfToken;
        return next();
    }

    // Verify CSRF token for POST/PUT/DELETE requests
    const token = req.body.csrfToken || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token'
        });
    }
    
    next();
};

// File upload validation
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return next();
        }

        for (let key in req.files) {
            const file = req.files[key];
            
            // Check file type
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
                });
            }
            
            // Check file size
            if (file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
                });
            }
        }
        
        next();
    };
};

module.exports = {
    validationRules,
    handleValidationErrors,
    sanitizeInput,
    csrfProtection,
    validateFileUpload
};
