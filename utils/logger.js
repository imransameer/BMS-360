const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: config.app.env === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: config.app.name },
    transports: [
        // Error log
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Combined log
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Security events log
        new winston.transports.File({
            filename: path.join(logDir, 'security.log'),
            level: 'warn',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ]
});

// Add console logging in development
if (config.app.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Security logging functions
const security = {
    loginAttempt: (email, ip, success, reason = '') => {
        logger.warn('Login attempt', {
            event: 'login_attempt',
            email,
            ip,
            success,
            reason,
            timestamp: new Date().toISOString()
        });
    },

    loginSuccess: (userId, email, ip) => {
        logger.info('Login successful', {
            event: 'login_success',
            userId,
            email,
            ip,
            timestamp: new Date().toISOString()
        });
    },

    loginFailure: (email, ip, reason) => {
        logger.warn('Login failed', {
            event: 'login_failure',
            email,
            ip,
            reason,
            timestamp: new Date().toISOString()
        });
    },

    logout: (userId, ip) => {
        logger.info('User logout', {
            event: 'logout',
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    },

    passwordChange: (userId, ip) => {
        logger.info('Password changed', {
            event: 'password_change',
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    },

    profileUpdate: (userId, ip, fields) => {
        logger.info('Profile updated', {
            event: 'profile_update',
            userId,
            ip,
            fields,
            timestamp: new Date().toISOString()
        });
    },

    suspiciousActivity: (ip, activity, details) => {
        logger.warn('Suspicious activity detected', {
            event: 'suspicious_activity',
            ip,
            activity,
            details,
            timestamp: new Date().toISOString()
        });
    },

    rateLimitExceeded: (ip, path, attempts) => {
        logger.warn('Rate limit exceeded', {
            event: 'rate_limit_exceeded',
            ip,
            path,
            attempts,
            timestamp: new Date().toISOString()
        });
    }
};

// Express middleware for request logging
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.session?.user?.id
        };

        if (res.statusCode >= 400) {
            logger.error('HTTP Error', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });

    next();
};

module.exports = {
    logger,
    security,
    requestLogger
};
