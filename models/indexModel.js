const db = require("./mainModel");

// function for Total Sales Today
const getTotalSalesToday = async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sql = `SELECT COALESCE(SUM(grand_total), 0) AS total_sales 
                FROM bills 
                WHERE DATE(bill_date) = ?`;
    const [results] = await db.query(sql, [today]);
    // Format as a number and ensure it's not null
    return parseFloat(results[0]?.total_sales || 0);
};

// function for Bills Made Today
const getBillsMadeToday = async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sql = `SELECT COUNT(bill_id) AS bill_count 
                FROM bills 
                WHERE DATE(bill_date) = ?`;
    const [results] = await db.query(sql, [today]);
    // Ensure we return a numeric value, not null
    return parseInt(results[0]?.bill_count || 0);
};

// function for Items Sold Today
const getItemsSoldToday = async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    // First check if the bill_items table has the bill_id column
    const sql = `SELECT 
                    COALESCE(SUM(bi.quantity), 0) AS items_sold
                FROM 
                    bill_items bi
                    INNER JOIN bills b ON bi.bill_id = b.bill_id
                WHERE 
                    DATE(b.bill_date) = ?`;
    
    try {
        const [results] = await db.query(sql, [today]);
        // Ensure we return a numeric value, not null
        return parseInt(results[0]?.items_sold || 0);
    } catch (error) {
        console.error("Error in getItemsSoldToday:", error.message);
        // If there's an error with the join (e.g., mismatched column names), try an alternative approach
        try {
            // Fallback: Try to get all bills from today first, then count items
            const billSql = `SELECT bill_id FROM bills WHERE DATE(bill_date) = ?`;
            const [billResults] = await db.query(billSql, [today]);
            
            if (billResults.length === 0) return 0;
            
            // Get bill IDs
            const billIds = billResults.map(bill => bill.bill_id);
            
            // Get items for these bills
            const itemsSql = `SELECT SUM(quantity) AS total_items 
                            FROM bill_items 
                            WHERE bill_id IN (?)`;
            const [itemsResults] = await db.query(itemsSql, [billIds]);
            
            return parseInt(itemsResults[0]?.total_items || 0);
        } catch (fallbackError) {
            console.error("Fallback error in getItemsSoldToday:", fallbackError.message);
            return 0;
        }
    }
};

// function for Cash in Hand
const getCashInHand = async () => {
    const sql = `
        SELECT SUM(grand_total) AS cash_in_hand
        FROM bills
        WHERE payment_method IN ('cash', 'upi');
    `;
    const [rows] = await db.query(sql);
    return rows[0]?.cash_in_hand || 0;
};

// function for Expenses Today
const getExpensesToday = async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sql = `SELECT COALESCE(SUM(amount), 0) AS total_expenses
                FROM maintenance_expenses
                WHERE DATE(entry_date) = ?`;
    const [results] = await db.query(sql, [today]);
    return parseFloat(results[0]?.total_expenses || 0);
};

// function for Pending Customer Khata
const getPendingCustomerKhata = async () => {
    // Get credit payments from bills table
    const sql = `SELECT COALESCE(SUM(grand_total), 0) AS total_pending
                FROM bills
                WHERE payment_method = 'Credit'`;
    const [results] = await db.query(sql);
    return parseFloat(results[0]?.total_pending || 0);
};

// function for Low Stock Items
const getLowStockItems = async (threshold = 10) => {
    const sql = `SELECT COUNT(*) AS low_stock_count
                FROM inventory_items
                WHERE stock_qty > 0 AND stock_qty <= ?`;
    const [results] = await db.query(sql, [threshold]);
    return results[0]?.low_stock_count || 0;
};

// function for New Stock Added (Today)
const getNewStockAddedToday = async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
        // Count items created today
        const newItemsSql = `SELECT COUNT(*) AS new_items_count
                    FROM inventory_items
                    WHERE DATE(created_at) = ?`;
        const [newItemsResults] = await db.query(newItemsSql, [today]);
        
        // Count items with updated stock today
        const updatedStockSql = `SELECT COUNT(*) AS updated_items_count
                        FROM inventory_items
                        WHERE DATE(updated_at) = ? 
                        AND DATE(updated_at) <> DATE(created_at)`;
        const [updatedStockResults] = await db.query(updatedStockSql, [today]);
        
        // Sum both counts
        const totalNewStock = parseInt(newItemsResults[0]?.new_items_count || 0) + 
                              parseInt(updatedStockResults[0]?.updated_items_count || 0);
        
        return totalNewStock;
    } catch (error) {
        console.error("Error in getNewStockAddedToday:", error);
        return 0;
    }
};

// function for Out of Stock Products
const getOutOfStockProducts = async () => {
    const sql = `SELECT COUNT(*) AS out_of_stock_count
                FROM inventory_items
                WHERE stock_qty = 0`;
    const [results] = await db.query(sql);
    return results[0]?.out_of_stock_count || 0;
};

// Export all functions
module.exports = {
    getTotalSalesToday,
    getBillsMadeToday,
    getItemsSoldToday,
    getCashInHand,
    getExpensesToday,
    getPendingCustomerKhata,
    getLowStockItems,
    getNewStockAddedToday,
    getOutOfStockProducts
};