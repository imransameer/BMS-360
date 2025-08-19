const express = require('express');
const router = express.Router();
const inventory = require('../controllers/inventory_control');
const { hasAccess } = require('../middleware/auth');

// Apply department-based access control - allow admin, inventory, billing, and finance employees
router.use((req, res, next) => {
    const user = req.session.user;
    
    // If user is admin, allow access
    if (user && user.isAdmin) {
        console.log('User is admin, access granted to inventory');
        return next();
    }
    
    // If user is Inventory employee, allow access
    if (user && user.department === 'Inventory') {
        console.log('User is inventory employee, access granted');
        return next();
    }
    
    // If user is Billing employee, allow access (they need inventory data for billing)
    if (user && user.department === 'Billing') {
        console.log('User is billing employee, access granted to inventory');
        return next();
    }
    
    // If user is Finance employee, allow access (they need inventory data for financial analysis)
    if (user && user.department === 'Finance') {
        console.log('User is finance employee, access granted to inventory');
        return next();
    }
    
    console.log('Access denied for user to inventory');
    // Otherwise, deny access
    res.status(403).render('error', {
        message: 'Access Denied',
        error: { status: 403, stack: 'You do not have permission to access inventory management.' }
    });
});

// API endpoint to update stock (optional, for admin/manual use)
router.post('/update-stock', inventory.updateStock);

router.get('/', inventory.getinventory);

router.post('/search', inventory.searchInventory);

// API endpoint to get all products for billing
router.get('/all', inventory.getAllProductsForBilling);

// API endpoint to check stock for a given item code
router.post('/check-stock', inventory.checkStock);

// API endpoint to add a new product
router.post('/add', inventory.addProduct);

// API endpoint to delete a product
router.post('/delete', inventory.deleteProduct);

// API endpoint to add stock to a product
router.post('/increment-stock', inventory.incrementStock);

// API endpoint to get product details
router.get('/product/:item_code', inventory.getProduct);

// API endpoint to update product details
router.post('/update', inventory.updateProduct);

module.exports = router;