const db = require('./mainModel');
const bcrypt = require('bcrypt');
const { logger } = require('../utils/logger');
const loggerModule = require('../utils/logger');
const config = require('../config/config');

class AuthModel {
    /**
     * Authenticate user with email and password
     * @param {string} email - User email
     * @param {string} password - Plain text password
     * @returns {Object} Authentication result
     */
    async authenticate(email, password) {
        try {
            // First, try user_details table
            let [users] = await db.query(`
                SELECT 
                    id, 
                    first_name as name,
                    last_name,
                    email, 
                    password,
                    active,
                    login_attempts,
                    locked_until,
                    'admin' as user_type
                FROM user_details 
                WHERE email = ? AND active = TRUE
            `, [email]);

            // If not found in user_details, try employees table
            if (users.length === 0) {
                [users] = await db.query(`
                    SELECT 
                        id, 
                        name,
                        email, 
                        password,
                        status,
                        department,
                        login_attempts,
                        locked_until,
                        'employee' as user_type
                    FROM employees 
                    WHERE email = ? AND status = 'active'
                `, [email]);
            }

            if (users.length === 0) {
                loggerModule.security.loginFailure(null, null, `User not found: ${email}`);
                return { 
                    success: false, 
                    error: 'Invalid email or password',
                    user: null 
                };
            }

            const user = users[0];

            // Check if account is locked
            if (user.locked_until && new Date() < new Date(user.locked_until)) {
                const lockTimeRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
                loggerModule.security.loginFailure(user.id, null, `Account locked, ${lockTimeRemaining} minutes remaining`);
                return { 
                    success: false, 
                    error: `Account is locked. Try again in ${lockTimeRemaining} minutes.`,
                    user: null 
                };
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                // Increment failed login attempts
                await this.recordFailedAttempt(user.id, user.user_type);
                loggerModule.security.loginFailure(user.id, null, 'Invalid password');
                return { 
                    success: false, 
                    error: 'Invalid email or password',
                    user: null 
                };
            }

            // Clear any previous failed attempts on successful login
            await this.clearFailedAttempts(user.id, user.user_type);

            // Return successful authentication
            const userData = {
                id: user.id,
                name: user.name || `${user.first_name} ${user.last_name}`.trim(),
                email: user.email,
                isAdmin: user.user_type === 'admin',
                department: user.department || null
            };

            loggerModule.security.loginSuccess(user.id, user.email, null);
            
            return { 
                success: true, 
                error: null,
                user: userData 
            };

        } catch (error) {
            logger.error('Authentication error:', error);
            return { 
                success: false, 
                error: 'Authentication failed',
                user: null 
            };
        }
    }

    /**
     * Record a failed login attempt
     * @param {number} userId - User ID
     * @param {string} userType - 'admin' or 'employee'
     */
    async recordFailedAttempt(userId, userType) {
        try {
            const tableName = userType === 'admin' ? 'user_details' : 'employees';
            const maxAttempts = config.security.maxLoginAttempts || 5;
            const lockoutTime = config.security.lockoutDuration || 900000; // 15 minutes

            // Get current attempt count
            const [results] = await db.query(`
                SELECT login_attempts FROM ${tableName} WHERE id = ?
            `, [userId]);

            if (results.length === 0) return;

            const currentAttempts = (results[0].login_attempts || 0) + 1;
            let updateQuery;
            let params;

            if (currentAttempts >= maxAttempts) {
                // Lock the account
                const lockUntil = new Date(Date.now() + lockoutTime);
                updateQuery = `
                    UPDATE ${tableName} 
                    SET login_attempts = ?, locked_until = ? 
                    WHERE id = ?
                `;
                params = [currentAttempts, lockUntil, userId];
                loggerModule.security.accountLocked(userId, null, `Account locked after ${currentAttempts} failed attempts`);
            } else {
                // Just increment attempts
                updateQuery = `
                    UPDATE ${tableName} 
                    SET login_attempts = ? 
                    WHERE id = ?
                `;
                params = [currentAttempts, userId];
            }

            await db.query(updateQuery, params);

        } catch (error) {
            logger.error('Error recording failed attempt:', error);
        }
    }

    /**
     * Clear failed login attempts
     * @param {number} userId - User ID
     * @param {string} userType - 'admin' or 'employee'
     */
    async clearFailedAttempts(userId, userType) {
        try {
            const tableName = userType === 'admin' ? 'user_details' : 'employees';
            
            await db.query(`
                UPDATE ${tableName} 
                SET login_attempts = 0, locked_until = NULL 
                WHERE id = ?
            `, [userId]);

        } catch (error) {
            logger.error('Error clearing failed attempts:', error);
        }
    }

    /**
     * Update last login information
     * @param {number} userId - User ID
     * @param {string} ipAddress - Client IP address
     */
    async updateLastLogin(userId, ipAddress) {
        try {
            // Try to update in user_details first
            const [result1] = await db.query(`
                UPDATE user_details 
                SET last_login_ip = ? 
                WHERE id = ?
            `, [ipAddress, userId]);

            // If no rows affected, try employees table
            if (result1.affectedRows === 0) {
                await db.query(`
                    UPDATE employees 
                    SET last_login = NOW(), last_login_ip = ? 
                    WHERE id = ?
                `, [ipAddress, userId]);
            }

        } catch (error) {
            logger.error('Error updating last login:', error);
        }
    }

    /**
     * Change user password
     * @param {number} userId - User ID
     * @param {string} newHashedPassword - New bcrypt hashed password
     * @returns {Object} Result of password change
     */
    async changePassword(userId, newHashedPassword) {
        try {
            // Try user_details first
            const [result1] = await db.query(`
                UPDATE user_details 
                SET password = ?, password_updated_at = NOW() 
                WHERE id = ?
            `, [newHashedPassword, userId]);

            // If no rows affected, try employees table
            if (result1.affectedRows === 0) {
                const [result2] = await db.query(`
                    UPDATE employees 
                    SET password = ?, password_updated_at = NOW() 
                    WHERE id = ?
                `, [newHashedPassword, userId]);

                if (result2.affectedRows === 0) {
                    return { 
                        success: false, 
                        error: 'User not found' 
                    };
                }
            }

            loggerModule.security.passwordChange(userId, null, 'Password changed successfully');
            
            return { 
                success: true, 
                message: 'Password changed successfully' 
            };

        } catch (error) {
            logger.error('Error changing password:', error);
            return { 
                success: false, 
                error: 'Failed to change password' 
            };
        }
    }

    /**
     * Get user by ID
     * @param {number} userId - User ID
     * @returns {Object} User data
     */
    async getUserById(userId) {
        try {
            // Try user_details first
            let [users] = await db.query(`
                SELECT 
                    id, 
                    first_name,
                    last_name,
                    email, 
                    password,
                    business_name,
                    active,
                    'admin' as user_type
                FROM user_details 
                WHERE id = ? AND active = TRUE
            `, [userId]);

            // If not found, try employees table
            if (users.length === 0) {
                [users] = await db.query(`
                    SELECT 
                        id, 
                        name,
                        email, 
                        password,
                        department,
                        status,
                        'employee' as user_type
                    FROM employees 
                    WHERE id = ? AND status = 'active'
                `, [userId]);
            }

            if (users.length === 0) {
                return { 
                    success: false, 
                    error: 'User not found' 
                };
            }

            return { 
                success: true, 
                data: users[0] 
            };

        } catch (error) {
            logger.error('Error getting user by ID:', error);
            return { 
                success: false, 
                error: 'Database error' 
            };
        }
    }
}

module.exports = new AuthModel();
