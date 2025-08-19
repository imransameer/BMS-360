const express = require('express');
const router = express.Router();
const finance = require('../controllers/finance_control');
const { hasAccess } = require('../middleware/auth');

// Apply department-based access control - only admin and finance employees can access finance
router.use((req, res, next) => {
    const user = req.session.user;
    
    // If user is admin, allow access
    if (user && user.isAdmin) {
        console.log('User is admin, access granted to finance');
        return next();
    }
    
    // If user is Finance employee, allow access
    if (user && user.department === 'Finance') {
        console.log('User is finance employee, access granted');
        return next();
    }
    
    console.log('Access denied for user to finance');
    // Otherwise, deny access
    res.status(403).render('error', {
        message: 'Access Denied',
        error: { status: 403, stack: 'You do not have permission to access finance management.' }
    });
});

// Main finance dashboard
router.get('/', finance.getfinance);

// API routes for finance data
router.get('/api/salary-details', finance.getSalaryDetails);

// Maintenance Expenses routes
router.post('/api/maintenance-expenses', finance.addMaintenanceExpense);
router.get('/api/maintenance-expenses', finance.getAllMaintenanceExpenses);
router.get('/api/today-expenses', finance.getTodayExpensesDetails);

// Supplier Khata routes
router.post('/api/supplier-khata', finance.addSupplierKhata);
router.get('/api/supplier-khata', finance.getAllSupplierKhata);
router.post('/api/supplier-khata/clear-all', finance.clearAllSupplierKhata);
router.post('/api/supplier-khata/:id/pay', finance.paySupplierKhata);

// Customer Khata routes
router.get('/api/customer-khata', finance.getCustomerKhataDetails);
router.post('/api/customer-khata/payment', finance.updateBillPaymentMethod);

module.exports = router;
