const express = require('express');
const router = express.Router();
const inventory = require('../controllers/inventory_control');
const { isEmployee } = require('../middleware/auth');

// Apply simple authentication - both admin and employees can access inventory
router.use(isEmployee);

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