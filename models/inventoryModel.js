const db = require("./mainModel");

// Function to Fetch inventory items
const getinvmodel = async () => {
    const sql = "SELECT id, item_name, item_code, category, stock_qty, purchase_price, selling_price, created_at, updated_at FROM inventory_items";
    const [results] = await db.query(sql);
    return results;
};

// Function to Search inventory items
const searchInvModel = async (search, category) => {
    let sql = "SELECT * FROM inventory_items WHERE 1=1";
    let params = [];
    if (search) {
        sql += " AND (item_name LIKE ? OR item_code LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }
    const [results] = await db.query(sql, params);
    return results;
};

// Check stock for a given item code
const checkStock = async (item_code) => {
    const sql = "SELECT stock_qty FROM inventory_items WHERE item_code = ?";
    const [results] = await db.query(sql, [item_code]);
    if (results.length === 0) return 0;
    return results[0].stock_qty;
};

// Update stock for a given item code (decrement by qty)
const updateStock = async (item_code, qty) => {
    const sql = "UPDATE inventory_items SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE item_code = ? AND stock_qty >= ?";
    const [result] = await db.query(sql, [qty, item_code, qty]);
    if (result.affectedRows === 0) throw new Error('Not enough stock or item not found');
};

// Increment stock for a given item code
const incrementStock = async (item_code, qty) => {
    const sql = "UPDATE inventory_items SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE item_code = ?";
    const [result] = await db.query(sql, [qty, item_code]);
    if (result.affectedRows === 0) throw new Error('Item not found');
    return result.affectedRows;
};

// Add a new product to inventory
const addProduct = async (product) => {
    const { item_name, item_code, category, stock_qty, purchase_price, selling_price } = product;
    
    // Check if product with same code already exists
    const [existing] = await db.query("SELECT item_code FROM inventory_items WHERE item_code = ?", [item_code]);
    if (existing.length > 0) {
        throw new Error('Product with this code already exists');
    }
    
    const sql = `
        INSERT INTO inventory_items 
        (item_name, item_code, category, stock_qty, purchase_price, selling_price, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.query(sql, [
        item_name, 
        item_code, 
        category, 
        stock_qty, 
        purchase_price, 
        selling_price
    ]);
    
    return result.insertId;
};

// Delete a product from inventory
const deleteProduct = async (item_code) => {
    const sql = "DELETE FROM inventory_items WHERE item_code = ?";
    const [result] = await db.query(sql, [item_code]);
    if (result.affectedRows === 0) {
        throw new Error('Product not found');
    }
    return result.affectedRows;
};

// Get all unique categories from the inventory
const getAllCategories = async () => {
    const sql = "SELECT DISTINCT category FROM inventory_items ORDER BY category";
    const [results] = await db.query(sql);
    return results.map(row => row.category);
};

// Get product details by item code
const getProductByCode = async (item_code) => {
    const sql = "SELECT * FROM inventory_items WHERE item_code = ?";
    const [results] = await db.query(sql, [item_code]);
    if (results.length === 0) throw new Error('Product not found');
    return results[0];
};

// Update product details
const updateProduct = async (item_code, updates) => {
    const { item_name, category, purchase_price, selling_price } = updates;
    const sql = `
        UPDATE inventory_items 
        SET item_name = ?, category = ?, purchase_price = ?, 
            selling_price = ?, updated_at = NOW()
        WHERE item_code = ?
    `;
    const [result] = await db.query(sql, [
        item_name, 
        category, 
        purchase_price, 
        selling_price,
        item_code
    ]);
    if (result.affectedRows === 0) throw new Error('Product not found');
    return result.affectedRows;
};

module.exports = { getinvmodel, searchInvModel, checkStock, updateStock, incrementStock, addProduct, deleteProduct, getAllCategories, getProductByCode, updateProduct };