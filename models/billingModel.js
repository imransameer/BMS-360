const db = require("./mainModel");


// Function to insert a new bill person data (bills table)
async function insertBillPersonData({ bill_date, customer_name, customer_phone, customer_age_group, subtotal, gst, discount, grand_total, payment_method }) {
    const sql = `INSERT INTO bills (bill_date, customer_name, customer_phone, customer_age_group, subtotal, gst, discount, grand_total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [bill_date, customer_name, customer_phone, customer_age_group, subtotal, gst, discount, grand_total, payment_method];
    try {
        const [result] = await db.query(sql, params);
        return result;
    } catch (error) {
        throw error;
    }
}


// Function to get the last inserted bill ID
async function getLastInsertedBillId() {
    const sql = `SELECT LAST_INSERT_ID() as lastId`;
    try {
        const [results] = await db.query(sql);
        return results[0].lastId;
    } catch (error) {
        throw error;
    }
}


// Function to insert bill details (bill_items table)
async function insertBillItemData({ bill_id, item_code, item_name, item_price, quantity, total }) {
    const sql = `INSERT INTO bill_items (bill_id, item_code, item_name, item_price, quantity, total) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [bill_id, item_code, item_name, item_price, quantity, total];
    try {
        const [result] = await db.query(sql, params);
        return result;
    } catch (error) {
        throw error;
    }
}


// Function to save a complete bill with its items
async function saveCompleteBill(billData, billItems) {
    try {
        // Start transaction
        await db.beginTransaction();
        
        // Insert bill person data
        const billSql = `INSERT INTO bills (bill_date, customer_name, customer_phone, customer_age_group, subtotal, gst, discount, grand_total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const billParams = [
            billData.bill_date, 
            billData.customer_name, 
            billData.customer_phone, 
            billData.customer_age_group, 
            billData.subtotal, 
            billData.gst, 
            billData.discount, 
            billData.grand_total, 
            billData.payment_method
        ];
        
        const [result] = await db.query(billSql, billParams);
        const bill_id = result.insertId;
        
        // If no items, commit and return
        if (!billItems || billItems.length === 0) {
            await db.commit();
            return { bill_id };
        }
        
        // Insert each bill item
        for (const item of billItems) {
            const itemSql = `INSERT INTO bill_items (bill_id, item_code, item_name, item_price, quantity, total) VALUES (?, ?, ?, ?, ?, ?)`;
            const itemParams = [
                bill_id,
                item.item_code,
                item.item_name,
                item.item_price,
                item.quantity,
                item.total
            ];
            await db.query(itemSql, itemParams);
        }
        
        // Commit transaction
        await db.commit();
        return { bill_id };
    } catch (error) {
        // Rollback in case of error
        await db.rollback();
        throw error;
    }
}


// function to export 
module.exports = {
    insertBillPersonData,
    insertBillItemData,
    getLastInsertedBillId,
    saveCompleteBill
};