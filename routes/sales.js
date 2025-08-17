const express = require('express');
const router = express.Router();
const sales = require('../controllers/sales_control');
const { isEmployee } = require('../middleware/auth');

// Apply simple authentication - both admin and employees can access sales
router.use(isEmployee);

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
