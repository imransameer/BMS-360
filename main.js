const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const config = require('./config/config');
const { logger } = require('./utils/logger');

// Initialize Express app
const app = express();

// Basic security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    }
}));

// Enable CORS
app.use(cors());

// Enable compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple session configuration
const sessionConfig = {
    secret: config.security.sessionSecret || 'simple-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
};

app.use(session(sessionConfig));

// Custom middleware to make user available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Simple authentication middleware
app.use((req, res, next) => {
    // Skip authentication for public routes
    const publicPaths = ['/login', '/register', '/auth/login', '/auth/register'];
    const isPublicAsset = req.path.startsWith('/assets/') || 
                         req.path.startsWith('/css/') || 
                         req.path.startsWith('/js/') ||
                         req.path.startsWith('/fonts/') ||
                         req.path.startsWith('/img/');
    
    if (publicPaths.includes(req.path) || isPublicAsset) {
        return next();
    }
    
    // Check authentication
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    
    next();
});

// Route imports
const indexroute = require('./routes/index');
const billingroute = require('./routes/billing');
const employeeroute = require('./routes/employee');
const inventoryroute = require('./routes/inventory');
const financeroute = require('./routes/finance');
const salesroute = require('./routes/sales');
const newEmproute = require('./routes/new_emp');
const empDtRoute = require('./routes/emp_dt');
const attEmpRoute = require('./routes/att_emp');
const profileRoute = require('./routes/profile');
const authRoute = require('./routes/auth');

// Route registration
app.use('/', indexroute);
app.use('/billing', billingroute);
app.use('/employee', employeeroute);
app.use('/finance', financeroute);
app.use('/inventory', inventoryroute);
app.use('/sales', salesroute);
app.use('/new_emp', newEmproute);
app.use('/emp_dt', empDtRoute);
app.use('/att_emp', attEmpRoute);
app.use('/profile', profileRoute);
app.use('/auth', authRoute);

// Simple login route
app.get('/login', (req, res) => {
    // If user is already logged in, redirect to home
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    
    try {
        const loginPath = path.join(__dirname, 'views', 'login_new.html');
        if (fs.existsSync(loginPath)) {
            res.sendFile(loginPath);
        } else {
            res.status(404).render('error', {
                message: 'Login page not found',
                error: { status: 404 }
            });
        }
    } catch (error) {
        logger.error('Error serving login page:', error);
        res.status(500).render('error', {
            message: 'Error loading login page',
            error: error
        });
    }
});

// Simple register route
app.get('/register', (req, res) => {
    try {
        const registerPath = path.join(__dirname, 'views', 'register.html');
        if (fs.existsSync(registerPath)) {
            res.sendFile(registerPath);
        } else {
            res.status(404).render('error', {
                message: 'Register page not found',
                error: { status: 404 }
            });
        }
    } catch (error) {
        logger.error('Error serving register page:', error);
        res.status(500).render('error', {
            message: 'Error loading register page',
            error: error
        });
    }
});

// Static file serving with security headers
const staticOptions = {
    dotfiles: 'deny',
    index: false,
    maxAge: config.app.env === 'production' ? '1d' : '0',
    setHeaders: (res, path) => {
        // Security headers for static files
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
};

// Serve static files
if (fs.existsSync(path.join(__dirname, 'public'))) {
    app.use(express.static(path.join(__dirname, 'public'), staticOptions));
}
app.use('/assets', express.static(path.join(__dirname, 'views/assets'), staticOptions));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Global error:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.session?.user?.id
    });

    // Don't expose error details in production
    const errorDetails = config.app.env === 'production' 
        ? { message: 'Something went wrong', status: 500 }
        : { message: err.message, status: err.status || 500, stack: err.stack };

    res.status(err.status || 500).render('error', {
        message: errorDetails.message,
        error: errorDetails
    });
});

// Handle 404 errors
app.use((req, res) => {
    logger.warn('404 Not Found:', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.status(404).render('error', {
        message: 'Page not found',
        error: { status: 404 }
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
const server = app.listen(config.app.port, () => {
    logger.info(`🚀 ${config.app.name} server started`, {
        port: config.app.port,
        environment: config.app.env,
        httpsEnabled: config.security.httpsEnabled,
        timestamp: new Date().toISOString()
    });
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.app.port} is already in use`);
    } else {
        logger.error('Server error:', error);
    }
    process.exit(1);
});

module.exports = app;
