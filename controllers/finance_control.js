const path = require('path');
const financeModel = require('../models/financeModel');

// Render finance page with calculated values
const getfinance = async (req, res) => {
    try {
        const [
            revenue, 
            expenses, 
            netProfit, 
            inventoryCost, 
            totalSalaries,
            todayIncome,
            todayExpenses,
            totalDiscount,
            totalGST,
            totalCustomerKhataPending,
            totalSupplierKhataPending,
            upcomingDueDates,
            customerKhataDetails
        ] = await Promise.all([
            financeModel.getTotalRevenue(),
            financeModel.getTotalExpenses(),
            financeModel.getNetProfitOrLoss(),
            financeModel.getInventoryCost(),
            financeModel.getTotalSalaries(),
            financeModel.getTodayIncome(),
            financeModel.getTodayExpenses(),
            financeModel.getTotalDiscount(),
            financeModel.getTotalGST(),
            financeModel.getTotalCustomerKhataPending(),
            financeModel.getTotalSupplierKhataPending(),
            financeModel.getUpcomingDueDates(),
            financeModel.getCustomerKhataDetails()
        ]);
        
        res.render('finance.ejs', {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfitOrLoss: netProfit,
            inventoryCost: inventoryCost,
            totalSalaries: totalSalaries,
            todayIncome: todayIncome,
            todayExpenses: todayExpenses,
            totalDiscount: totalDiscount,
            totalGST: totalGST,
            totalCustomerKhataPending: totalCustomerKhataPending,
            totalSupplierKhataPending: totalSupplierKhataPending,
            upcomingDueDates: upcomingDueDates,
            customerKhataDetails: customerKhataDetails
        });
    } catch (err) {
        console.error('Finance data error:', err);
        res.status(500).send('Error fetching finance data');
    }
};

// API endpoint to get detailed salary information for a specific month
const getSalaryDetails = async (req, res) => {
    try {
        const monthYear = req.query.month_year; // Expected format: YYYY-MM
        
        if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
            return res.status(400).json({ error: 'Invalid month_year format. Use YYYY-MM' });
        }
        
        const salaryDetails = await financeModel.getSalaryDetailsByMonth(monthYear);
        res.json(salaryDetails);
    } catch (err) {
        console.error('Salary details error:', err);
        res.status(500).json({ error: 'Error fetching salary details' });
    }
};

// Add a new maintenance expense
const addMaintenanceExpense = async (req, res) => {
    try {
        const { entry_date, expense_type, brief, amount } = req.body;
        
        // Validate input
        if (!entry_date || !expense_type || !brief || !amount) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Convert amount to number and validate
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        
        // Add the expense to the database
        const expenseId = await financeModel.addMaintenanceExpense({
            entry_date, 
            expense_type, 
            brief, 
            amount: numAmount
        });
        
        // Get updated expense data
        const todayExpenses = await financeModel.getTodayExpenses();
        const totalExpenses = await financeModel.getTotalExpenses();
        
        res.status(201).json({ 
            success: true, 
            message: 'Expense added successfully',
            expenseId,
            updatedData: {
                todayExpenses,
                totalExpenses
            }
        });
    } catch (err) {
        console.error('Error adding maintenance expense:', err);
        res.status(500).json({ error: 'Failed to add expense' });
    }
};

// Get all maintenance expenses
const getAllMaintenanceExpenses = async (req, res) => {
    try {
        const expenses = await financeModel.getAllMaintenanceExpenses();
        res.json(expenses);
    } catch (err) {
        console.error('Error fetching maintenance expenses:', err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

// Get today's expense details
const getTodayExpensesDetails = async (req, res) => {
    try {
        const expenses = await financeModel.getTodayExpensesDetails();
        res.json(expenses);
    } catch (err) {
        console.error('Error fetching today\'s expense details:', err);
        res.status(500).json({ error: 'Failed to fetch today\'s expenses' });
    }
};

// Add a new supplier khata entry
const addSupplierKhata = async (req, res) => {
    try {
        const { supplier_name, phone_number, amount, due_date, khata_cycle } = req.body;
        
        // Validate input
        if (!supplier_name || !phone_number || !amount || !due_date || !khata_cycle) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate phone number
        if (!/^\d{10}$/.test(phone_number)) {
            return res.status(400).json({ error: 'Phone number must be 10 digits' });
        }
        
        // Convert amount to number and validate
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        
        // Convert khata_cycle to number and validate
        const numKhataCycle = parseInt(khata_cycle);
        if (isNaN(numKhataCycle) || numKhataCycle <= 0) {
            return res.status(400).json({ error: 'Khata cycle must be a positive number' });
        }
        
        // Add the entry to the database
        const today = new Date().toISOString().split('T')[0]; // Current date for entry_date
        const khataId = await financeModel.addSupplierKhata({
            entry_date: today,
            supplier_name,
            phone_number,
            amount: numAmount,
            due_date,
            khata_cycle: numKhataCycle
        });
        
        // Get updated supplier khata data
        const totalSupplierKhataPending = await financeModel.getTotalSupplierKhataPending();
        const upcomingDueDates = await financeModel.getUpcomingDueDates();
        
        res.status(201).json({ 
            success: true, 
            message: 'Supplier khata added successfully',
            khataId,
            updatedData: {
                totalSupplierKhataPending,
                upcomingDueDates
            }
        });
    } catch (err) {
        console.error('Error adding supplier khata:', err);
        res.status(500).json({ error: 'Failed to add supplier khata' });
    }
};

// Get all supplier khata entries
const getAllSupplierKhata = async (req, res) => {
    try {
        const khataEntries = await financeModel.getAllSupplierKhata();
        res.json(khataEntries);
    } catch (err) {
        console.error('Error fetching supplier khata entries:', err);
        res.status(500).json({ error: 'Failed to fetch supplier khata entries' });
    }
};

// Get customer khata details
const getCustomerKhataDetails = async (req, res) => {
    try {
        const khataDetails = await financeModel.getCustomerKhataDetails();
        res.json(khataDetails);
    } catch (err) {
        console.error('Error fetching customer khata details:', err);
        res.status(500).json({ error: 'Failed to fetch customer khata details' });
    }
};

// Update bill payment method (from Credit to Cash/UPI)
const updateBillPaymentMethod = async (req, res) => {
    try {
        const { billId, paymentMethod } = req.body;
        
        // Validate input
        if (!billId || !paymentMethod) {
            return res.status(400).json({ error: 'Bill ID and payment method are required' });
        }
        
        // Validate payment method
        if (!['Cash', 'UPI'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Payment method must be Cash or UPI' });
        }
        
        // Update the bill's payment method
        const success = await financeModel.updateBillPaymentMethod(billId, paymentMethod);
        
        if (!success) {
            return res.status(404).json({ error: 'Bill not found or already paid' });
        }
        
        // Get updated khata data
        const totalCustomerKhataPending = await financeModel.getTotalCustomerKhataPending();
        const customerKhataDetails = await financeModel.getCustomerKhataDetails();
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment recorded successfully',
            updatedData: {
                totalCustomerKhataPending,
                customerKhataDetails
            }
        });
    } catch (err) {
        console.error('Error updating bill payment:', err);
        res.status(500).json({ error: 'Failed to update payment' });
    }
};

// Pay a specific supplier khata entry
const paySupplierKhata = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID'
            });
        }
        
        // Pay the specific supplier khata entry
        const result = await financeModel.paySupplierKhata(id);
        
        if (result === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier khata entry not found'
            });
        }
        
        // Get the updated total supplier khata pending amount
        const updatedTotalPending = await financeModel.getTotalSupplierKhataPending();
        
        res.json({
            success: true,
            message: 'Supplier payment marked as complete',
            updatedTotalPending
        });
    } catch (error) {
        console.error('Error paying supplier khata:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process supplier payment: ' + error.message
        });
    }
};

// Clear all supplier khata entries
const clearAllSupplierKhata = async (req, res) => {
    try {
        // Clear all supplier khata entries
        await financeModel.clearAllSupplierKhata();
        
        res.json({
            success: true,
            message: 'All supplier khata entries have been cleared'
        });
    } catch (error) {
        console.error('Error clearing all supplier khata entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear all supplier khata entries'
        });
    }
};

module.exports = { 
    getfinance, 
    getSalaryDetails,
    addMaintenanceExpense,
    getAllMaintenanceExpenses,
    getTodayExpensesDetails,
    addSupplierKhata,
    getAllSupplierKhata,
    getCustomerKhataDetails,
    updateBillPaymentMethod,
    paySupplierKhata,
    clearAllSupplierKhata
};
