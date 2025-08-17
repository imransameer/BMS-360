const path = require('path');
const indexModel = require('../models/indexModel');

// Controller function to render the dashboard
const getindex = async (req, res) => {
    try {
        // Gather all dashboard data using functions from indexModel
        const dashboardData = {
            // Today's Highlights
            totalSalesToday: await indexModel.getTotalSalesToday(),
            billsMadeToday: await indexModel.getBillsMadeToday(),
            itemsSoldToday: await indexModel.getItemsSoldToday(),
            
            // Finance Glance
            cashInHand: await indexModel.getCashInHand(),
            expensesToday: await indexModel.getExpensesToday(),
            pendingCustomerKhata: await indexModel.getPendingCustomerKhata(),
            
            // Inventory Watch
            lowStockItems: await indexModel.getLowStockItems(10), // items with stock ≤ 10
            newStockAddedToday: await indexModel.getNewStockAddedToday(),
            outOfStockProducts: await indexModel.getOutOfStockProducts()
        };

        // Render the index.ejs view with the dashboard data
        res.render('index', {
            ...dashboardData,
            pageTitle: 'Dashboard',
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error('Dashboard data fetch error:', error);
        // In case of error, render the page with default values
        res.render('index', {
            totalSalesToday: 0,
            billsMadeToday: 0,
            itemsSoldToday: 0,
            cashInHand: 0,
            expensesToday: 0,
            pendingCustomerKhata: 0,
            lowStockItems: 0,
            newStockAddedToday: 0,
            outOfStockProducts: 0,
            error: 'Failed to load dashboard data',
            pageTitle: 'Dashboard',
            activePage: 'dashboard'
        });
    }
};

module.exports = { getindex };
