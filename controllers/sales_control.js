const salesModel = require('../models/salesModel');

// Raw helpers for rendering dashboard (return value directly, not JSON)
exports.totalProfitRaw = async () => {
    return await salesModel.getTotalProfit();
};

exports.totalSalesRaw = async () => {
    return await salesModel.getTotalSales();
};

exports.numberOfBillsRaw = async () => {
    return await salesModel.getNumberOfBills();
};

exports.paymentTypeSplitsRaw = async () => {
    const data = await salesModel.getPaymentTypeSplits();
    // Additional data validation for frontend
    if (data && Array.isArray(data)) {
        // Make sure percentage is always a valid number
        return data.map(item => ({
            ...item,
            percentage: isNaN(item.percentage) ? 0 : item.percentage
        }));
    }
    return data;
};

exports.top5ProductsRaw = async () => {
    return await salesModel.getTop5Products();
};

exports.bottom5ProductsRaw = async () => {
    return await salesModel.getBottom5Products();
};

exports.cashInHandRaw = async () => {
    return await salesModel.getCashInHand();
};

// Controller for Total Profit
exports.totalProfit = async (req, res) => {
    try {
        const profit = await salesModel.getTotalProfit();
        res.json({ totalProfit: profit });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controller for Total Sales (Revenue)
exports.totalSales = async (req, res) => {
    try {
        const sales = await salesModel.getTotalSales();
        res.json({ totalSales: sales });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controller for Number of Bills
exports.numberOfBills = async (req, res) => {
    try {
        const count = await salesModel.getNumberOfBills();
        res.json({ numberOfBills: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controller for Payment Type Splits
exports.paymentTypeSplits = async (req, res) => {
    try {
        const splits = await salesModel.getPaymentTypeSplits();
        
        // Make sure percentages are valid before sending to frontend
        const validatedSplits = splits.map(item => ({
            ...item,
            percentage: isNaN(item.percentage) ? 0 : item.percentage
        }));
        
        res.json({ paymentTypeSplits: validatedSplits });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controller for Top 5 Products (By Quantity Sold)
exports.top5Products = async (req, res) => {
    try {
        const products = await salesModel.getTop5Products();
        res.json({ top5Products: products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controller for Low Performing Products (Bottom 5 by Quantity Sold)
exports.bottom5Products = async (req, res) => {
    try {
        const products = await salesModel.getBottom5Products();
        res.json({ bottom5Products: products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Controller for Category-wise sales
exports.categorySalesRaw = async () => {
    return await salesModel.getCategorySales();
};

exports.categorySales = async (req, res) => {
    try {
        const categorySales = await salesModel.getCategorySales();
        res.json({ categorySales: categorySales });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controller for Cash in Hand (Cash + UPI only)
exports.cashInHand = async (req, res) => {
    try {
        const cash = await salesModel.getCashInHand();
        res.json({ cashInHand: cash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Raw helpers for Customer Behavior Analysis
exports.ageGroupTrendsRaw = async () => {
    return await salesModel.getAgeGroupTrends();
};

exports.customerLoyaltyDataRaw = async () => {
    return await salesModel.getCustomerLoyaltyData();
};

exports.averageBasketSizeRaw = async () => {
    return await salesModel.getAverageBasketSize();
};

exports.paymentPreferencesRaw = async () => {
    return await salesModel.getPaymentPreferences();
};

// Controllers for Customer Behavior Analysis
exports.ageGroupTrends = async (req, res) => {
    try {
        const trends = await salesModel.getAgeGroupTrends();
        res.json({ ageGroupTrends: trends });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.customerLoyaltyData = async (req, res) => {
    try {
        const loyaltyData = await salesModel.getCustomerLoyaltyData();
        res.json({ customerLoyaltyData: loyaltyData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.averageBasketSize = async (req, res) => {
    try {
        const basketSize = await salesModel.getAverageBasketSize();
        res.json({ averageBasketSize: basketSize });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.paymentPreferences = async (req, res) => {
    try {
        const preferences = await salesModel.getPaymentPreferences();
        res.json({ paymentPreferences: preferences });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};