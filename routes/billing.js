const express = require('express');
const router = express.Router();
const billing = require('../controllers/billing_control');
const { hasAccess } = require('../middleware/auth');

// Apply department-based access control - allow admin, billing, sales, and finance employees
router.use((req, res, next) => {
    const user = req.session.user;
    
    // If user is admin, allow access
    if (user && user.isAdmin) {
        console.log('User is admin, access granted to billing');
        return next();
    }
    
    // If user is Billing employee, allow access
    if (user && user.department === 'Billing') {
        console.log('User is billing employee, access granted');
        return next();
    }
    
    // If user is Sales employee, allow access (they need billing data for sales analytics)
    if (user && user.department === 'Sales') {
        console.log('User is sales employee, access granted to billing');
        return next();
    }
    
    // If user is Finance employee, allow access (they need billing data for financial analysis)
    if (user && user.department === 'Finance') {
        console.log('User is finance employee, access granted to billing');
        return next();
    }
    
    console.log('Access denied for user to billing');
    // Otherwise, deny access
    res.status(403).render('error', {
        message: 'Access Denied',
        error: { status: 403, stack: 'You do not have permission to access billing management.' }
    });
});

router.get('/', billing.getbilling);
router.post('/', billing.postBilling);
router.post('/generate-pdf', billing.generatePDF);
router.get('/api/business-details', billing.getBusinessDetails);

module.exports = router;
