const path = require('path');
const newEmpModel = require('../models/new_empModel');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const loggerModule = require('../utils/logger');
const xss = require('xss');
const bcrypt = require('bcrypt');
const config = require('../config/config');

/**
 * Render the add employee form page (requires admin authentication)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const renderAddEmployeePage = (req, res) => {
    try {
        // Check authentication and admin privileges
        if (!req.session || !req.session.user) {
            return res.redirect('/auth/login');
        }

        // Check if user has admin privileges (assuming isAdmin field exists)
        if (!req.session.user.isAdmin) {
            loggerModule.security.unauthorizedAccess(
                req.ip,
                req.path,
                'non_admin_employee_page_access',
                { userId: req.session.user.id }
            );
            return res.status(403).render('error', {
                message: 'Access denied. Admin privileges required.',
                error: { status: 403 }
            });
        }

        res.sendFile(path.join(__dirname, '../views', 'new_emp.html'));
    } catch (error) {
        logger.error('Error rendering add employee page:', error);
        res.status(500).render('error', {
            message: 'Error loading add employee page',
            error: error
        });
    }
};

/**
 * Handle adding a new employee to the database (requires admin authentication)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const addNewEmployee = async (req, res) => {
    try {
        // Check authentication and admin privileges
        if (!req.session || !req.session.user) {
            loggerModule.security.unauthorizedAccess(
                req.ip,
                req.path,
                'add_employee_without_auth'
            );
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!req.session.user.isAdmin) {
            loggerModule.security.unauthorizedAccess(
                req.ip,
                req.path,
                'non_admin_add_employee',
                { userId: req.session.user.id }
            );
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'add_employee_validation_failed',
                { errors: errors.array() }
            );
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        // Extract and sanitize employee data from request body
        const sanitizedData = {
            name: xss(req.body.name?.trim()),
            email: xss(req.body.email?.trim()?.toLowerCase()),
            phone: xss(req.body.phone?.trim()),
            department: xss(req.body.department?.trim()),
            salary: parseFloat(req.body.salary) || 0,
            date_of_joining: req.body.date_of_joining,
            status: 'active', // Default status for new employees
            password: req.body.password?.trim()
        };

        // Check if any required fields are missing
        if (!sanitizedData.name || !sanitizedData.email || !sanitizedData.password) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'add_employee_missing_required_fields',
                { 
                    provided: Object.keys(sanitizedData).filter(key => sanitizedData[key]) 
                }
            );
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedData.email)) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'add_employee_invalid_email',
                { email: sanitizedData.email }
            );
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(sanitizedData.password)) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'add_employee_weak_password'
            );
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Validate salary
        if (sanitizedData.salary < 0) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'add_employee_invalid_salary',
                { salary: sanitizedData.salary }
            );
            return res.status(400).json({
                success: false,
                error: 'Salary must be a positive number'
            });
        }

        // Check if email already exists
        const emailExists = await newEmpModel.checkEmailExists(sanitizedData.email);
        if (emailExists) {
            loggerModule.security.inputValidationFailure(
                req.session.user.id,
                req.ip,
                'add_employee_duplicate_email',
                { email: sanitizedData.email }
            );
            return res.status(409).json({
                success: false,
                error: 'An employee with this email already exists'
            });
        }

        // Hash the password before storing
        const saltRounds = config.security.bcryptRounds;
        sanitizedData.password = await bcrypt.hash(sanitizedData.password, saltRounds);

        // Add employee to database
        const result = await newEmpModel.addEmployee(sanitizedData);

        // Return the result
        if (result.success) {
            loggerModule.security.dataModification(
                req.session.user.id,
                req.ip,
                'add_employee_success',
                { 
                    newEmployeeEmail: sanitizedData.email,
                    department: sanitizedData.department
                }
            );
            
            // Don't return the hashed password in the response
            const responseData = { ...result };
            if (responseData.data && responseData.data.password) {
                delete responseData.data.password;
            }
            
            res.status(201).json(responseData);
        } else {
            loggerModule.security.dataModification(
                req.session.user.id,
                req.ip,
                'add_employee_failed',
                { error: result.error }
            );
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Error in addNewEmployee controller:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

module.exports = {
    renderAddEmployeePage,
    addNewEmployee
};
