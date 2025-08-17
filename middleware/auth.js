const isAuthenticated = (req, res, next) => {
    // Allow access to login and register pages
    if (req.path === '/login' || req.path === '/register' || 
        req.path === '/auth/login' || req.path === '/auth/register') {
        return next();
    }
    
    // Check if user is authenticated
    if (req.session && req.session.user) {
        return next();
    }
    
    // If not authenticated, redirect to login page
    res.redirect('/login');
};

// Middleware for employee routing restrictions
const employeeRoutingRestrictions = (req, res, next) => {
    const user = req.session.user;
    
    // Skip restriction for admin users
    if (user && user.isAdmin) {
        return next();
    }
    
    // If user is an employee (not admin)
    if (user && !user.isAdmin) {
        console.log('Employee routing check for path:', req.path);
        
        // Root path (dashboard) should redirect to their department
        if (req.path === '/') {
            console.log('Employee tried to access dashboard, redirecting to department:', user.department);
            
            // Redirect based on department
            switch(user.department) {
                case 'Sales':
                    return res.redirect('/sales');
                case 'Inventory':
                    return res.redirect('/inventory');
                case 'Billing':
                    return res.redirect('/billing');
                case 'Finance':
                    return res.redirect('/finance');
                default:
                    // If department doesn't match any route, show error
                    return res.status(403).render('error', {
                        message: 'Department Access Not Configured',
                        error: { 
                            status: 403, 
                            stack: 'Your department is not configured for any specific access. Please contact administrator.' 
                        }
                    });
            }
        }
        
        // Profile access is restricted for employees
        if (req.path === '/profile' || req.path.startsWith('/profile/')) {
            console.log('Employee tried to access profile, access denied');
            return res.status(403).render('error', {
                message: 'Access Denied',
                error: { 
                    status: 403, 
                    stack: 'Employees do not have access to profile management.' 
                }
            });
        }
    }
    
    // Continue for other cases
    next();
};

const isAdmin = (req, res, next) => {
    // Check if user is authenticated and is an admin (from user_details table)
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }
    
    // If not admin, send forbidden response
    res.status(403).render('error', {
        message: 'Access Denied',
        error: { status: 403, stack: 'You do not have permission to access this resource.' }
    });
};

const hasAccess = (department) => {
    return (req, res, next) => {
        console.log('Checking access for department:', department);
        console.log('User session:', req.session.user);
        
        // If the user is admin, they have access to everything
        if (req.session && req.session.user && req.session.user.isAdmin) {
            console.log('User is admin, access granted');
            return next();
        }
        
        // Check if user is authenticated and has the required department
        if (req.session && req.session.user && req.session.user.department === department) {
            console.log('User department matches, access granted');
            return next();
        }
        
        console.log('Access denied for user');
        // If not authorized, send forbidden response
        res.status(403).render('error', {
            message: 'Access Denied',
            error: { status: 403, stack: 'You do not have permission to access this resource.' }
        });
    };
};

// Middleware to check if user is authenticated (both admin and employee)
const isEmployee = (req, res, next) => {
    // Check if user is authenticated
    if (req.session && req.session.user) {
        return next();
    }
    
    // If not authenticated, redirect to login page
    res.redirect('/login');
};

module.exports = {
    isAuthenticated,
    isAdmin,
    hasAccess,
    employeeRoutingRestrictions,
    isEmployee
};
