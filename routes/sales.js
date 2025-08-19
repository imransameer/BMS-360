const express = require('express');
const router = express.Router();
const sales = require('../controllers/sales_control');
const { hasAccess } = require('../middleware/auth');

// Apply department-based access control - allow admin, sales, and finance employees
router.use((req, res, next) => {
    const user = req.session.user;
    
    // If user is admin, allow access
    if (user && user.isAdmin) {
        console.log('User is admin, access granted to sales');
        return next();
    }
    
    // If user is Sales employee, allow access
    if (user && user.department === 'Sales') {
        console.log('User is sales employee, access granted');
        return next();
    }
    
    // If user is Finance employee, allow access (they need sales data for financial analysis)
    if (user && user.department === 'Finance') {
        console.log('User is finance employee, access granted to sales');
        return next();
    }
    
    console.log('Access denied for user to sales');
    // Otherwise, deny access
    res.status(403).render('error', {
        message: 'Access Denied',
        error: { status: 403, stack: 'You do not have permission to access sales management.' }
    });
});

// Main dashboard route: renders sales.ejs with all metrics
router.get('/', async (req, res) => {
    try {
        const [
            totalProfit,
            totalSales,
            numberOfBills,
            paymentTypeSplits,
            top5Products,
            bottom5Products,
            cashInHand,
            categorySales,
            ageGroupTrends,
            customerLoyaltyData,
            averageBasketSize,
            paymentPreferences
        ] = await Promise.all([
            sales.totalProfitRaw(),
            sales.totalSalesRaw(),
            sales.numberOfBillsRaw(),
            sales.paymentTypeSplitsRaw(),
            sales.top5ProductsRaw(),
            sales.bottom5ProductsRaw(),
            sales.cashInHandRaw(),
            sales.categorySalesRaw(),
            sales.ageGroupTrendsRaw(),
            sales.customerLoyaltyDataRaw(),
            sales.averageBasketSizeRaw(),
            sales.paymentPreferencesRaw()
        ]);
        res.render('sales', {
            totalProfit,
            totalSales,
            numberOfBills,
            paymentTypeSplits,
            top5Products,
            bottom5Products,
            cashInHand,
            categorySales,
            ageGroupTrends,
            customerLoyaltyData,
            averageBasketSize,
            paymentPreferences
        });
    } catch (err) {
        res.status(500).send('Error loading sales dashboard: ' + err.message);
    }
});

// API endpoints for each metric (optional, keep if needed)
router.get('/total-profit', sales.totalProfit);
router.get('/total-sales', sales.totalSales);
router.get('/number-of-bills', sales.numberOfBills);
router.get('/payment-type-splits', sales.paymentTypeSplits);
router.get('/top5-products', sales.top5Products);
router.get('/bottom5-products', sales.bottom5Products);
router.get('/cash-in-hand', sales.cashInHand);
router.get('/category-sales', sales.categorySales);

// API endpoints for customer behavior analysis
router.get('/age-group-trends', sales.ageGroupTrends);
router.get('/customer-loyalty-data', sales.customerLoyaltyData);
router.get('/average-basket-size', sales.averageBasketSize);
router.get('/payment-preferences', sales.paymentPreferences);

module.exports = router;
