const inventoryModel = require('../models/inventoryModel'); // Import the model

// Controller to fetch inventory data and render the inventory page
const getinventory = async (req, res) => {
    try {
        const inventory_items = await inventoryModel.getinvmodel();
        const categories = await inventoryModel.getAllCategories();
        res.render("inventory", { inventory_items, categories });  // Render EJS file with data
    } catch (err) {
        console.error("Database Query Error:", err);
        res.status(500).send("Error fetching inventory data.");
    }
};

// Controller to search/filter inventory items
const searchInventory = async (req, res) => {
    const { search, category } = req.body;
    try {
        const inventory_items = await inventoryModel.searchInvModel(search, category);
        res.json({ inventory_items });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
};

// API to get all products for billing
const getAllProductsForBilling = async (req, res) => {
    try {
        const inventory_items = await inventoryModel.getinvmodel();
        // Map to only needed fields for billing
        const products = inventory_items.map(item => ({
            code: item.item_code,
            name: item.item_name,
            price: item.selling_price
        }));
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
};

// API to check stock for a given item code
const checkStock = async (req, res) => {
    const { item_code } = req.body;
    if (!item_code) return res.status(400).json({ error: 'Missing item_code' });
    try {
        const stock_qty = await inventoryModel.checkStock(item_code);
        res.json({ stock_qty });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
};

// API to update stock (optional, for admin/manual use)
// Usage: POST /inventory/update-stock { item_code, qty }
const updateStock = async (req, res) => {
    const { item_code, qty } = req.body;
    if (!item_code || typeof qty !== 'number') return res.status(400).json({ error: 'Missing item_code or qty' });
    try {
        await inventoryModel.updateStock(item_code, qty);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message || 'Failed to update stock' });
    }
};

// Add a new product to inventory
const addProduct = async (req, res) => {
    try {
        // Validate required fields
        const { item_name, item_code, category, stock_qty, purchase_price, selling_price } = req.body;
        
        if (!item_name || !item_code || !category || stock_qty === undefined || 
            purchase_price === undefined || selling_price === undefined) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }
        
        // Add product to database
        const productId = await inventoryModel.addProduct(req.body);
        
        res.json({ 
            success: true, 
            message: 'Product added successfully',
            productId
        });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(400).json({ 
            success: false, 
            message: err.message || 'Failed to add product'
        });
    }
};

// Delete a product from inventory
const deleteProduct = async (req, res) => {
    try {
        const { item_code } = req.body;
        
        if (!item_code) {
            return res.status(400).json({
                success: false,
                message: 'Item code is required'
            });
        }
        
        await inventoryModel.deleteProduct(item_code);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to delete product'
        });
    }
};

// Increment stock for a product
const incrementStock = async (req, res) => {
    try {
        const { item_code, qty } = req.body;
        
        if (!item_code || !qty || isNaN(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid item code and quantity are required'
            });
        }
        
        await inventoryModel.incrementStock(item_code, parseInt(qty));
        
        // Get updated stock level
        const stock_qty = await inventoryModel.checkStock(item_code);
        
        res.json({
            success: true,
            message: 'Stock added successfully',
            stock_qty
        });
    } catch (err) {
        console.error('Error adding stock:', err);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to add stock'
        });
    }
};

// Get product by item code
const getProduct = async (req, res) => {
    try {
        const { item_code } = req.params;
        
        if (!item_code) {
            return res.status(400).json({
                success: false,
                message: 'Item code is required'
            });
        }
        
        const product = await inventoryModel.getProductByCode(item_code);
        
        res.json({
            success: true,
            product
        });
    } catch (err) {
        console.error('Error getting product:', err);
        res.status(404).json({
            success: false,
            message: err.message || 'Product not found'
        });
    }
};

// Update product details
const updateProduct = async (req, res) => {
    try {
        const { item_code, item_name, category, purchase_price, selling_price } = req.body;
        
        if (!item_code || !item_name || !category || 
            purchase_price === undefined || selling_price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        await inventoryModel.updateProduct(item_code, {
            item_name,
            category,
            purchase_price: parseFloat(purchase_price),
            selling_price: parseFloat(selling_price)
        });
        
        res.json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to update product'
        });
    }
};

//export the controller functions
module.exports = { getinventory, searchInventory, getAllProductsForBilling, checkStock, updateStock, addProduct, deleteProduct, incrementStock, getProduct, updateProduct };


