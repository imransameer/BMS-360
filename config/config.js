require('dotenv').config();

const config = {
    // Application settings
    app: {
        name: process.env.APP_NAME || 'BMS360',
        port: parseInt(process.env.PORT) || 3000,
        env: process.env.NODE_ENV || 'development'
    },

    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME || 'bms360',
        port: parseInt(process.env.DB_PORT) || 3306
    },

    // Security settings
    security: {
        sessionSecret: process.env.SESSION_SECRET || generateSecureSecret(),
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 900000, // 15 minutes
        httpsEnabled: process.env.HTTPS_ENABLED === 'true',
        sslKeyPath: process.env.SSL_KEY_PATH,
        sslCertPath: process.env.SSL_CERT_PATH
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000 // Increased for development
    },

    // CORS settings
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    }
};

function generateSecureSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

// Validate critical configuration
function validateConfig() {
    const errors = [];

    if (!config.database.password) {
        errors.push('Database password (DB_PASSWORD) is required');
    }

    if (config.security.sessionSecret.length < 32) {
        errors.push('Session secret must be at least 32 characters long');
    }

    if (config.app.env === 'production') {
        if (!config.security.httpsEnabled) {
            console.warn('⚠️  WARNING: HTTPS is not enabled in production');
        }
        
        if (config.security.sessionSecret === generateSecureSecret()) {
            errors.push('Custom SESSION_SECRET is required in production');
        }
    }

    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        throw new Error('Invalid configuration');
    }

    console.log('✅ Configuration validated successfully');
}

validateConfig();

module.exports = config;
