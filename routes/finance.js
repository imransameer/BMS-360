const express = require('express');
const router = express.Router();
const finance = require('../controllers/finance_control');
const { isEmployee } = require('../middleware/auth');

// Apply simple authentication - both admin and employees can access finance
router.use(isEmployee);

// Main finance dashboard
router.get('/', finance.getfinance);

// API routes for finance data
router.get('/api/salary-details', finance.getSalaryDetails);

// Maintenance Expenses routes
router.post('/api/maintenance-expenses', finance.addMaintenanceExpense);
router.get('/api/maintenance-expenses', finance.getAllMaintenanceExpenses);

// Supplier Khata routes
router.post('/api/supplier-khata', finance.addSupplierKhata);
router.get('/api/supplier-khata', finance.getAllSupplierKhata);
router.post('/api/supplier-khata/clear-all', finance.clearAllSupplierKhata);
router.post('/api/supplier-khata/:id/pay', finance.paySupplierKhata);

// Customer Khata routes
router.get('/api/customer-khata', finance.getCustomerKhataDetails);
router.post('/api/customer-khata/payment', finance.updateBillPaymentMethod);

module.exports = router;
