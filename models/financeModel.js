const db = require("./mainModel");
// Total Revenue: Total money earned (sales only, as per schema)
async function getTotalRevenue() {
    const [rows] = await db.query('SELECT SUM(grand_total) AS total_revenue FROM bills');
    return rows[0]?.total_revenue || 0;
}

// Total Expenses: Inventory purchases + salaries + other expenses
async function getTotalExpenses() {
    // Inventory expenses: sum of (purchase_price * stock_qty) for all items
    const [invRows] = await db.query('SELECT SUM(purchase_price * stock_qty) AS inventory_expense FROM inventory_items');
    const inventoryExpense = invRows[0]?.inventory_expense || 0;

    // Salary expenses: sum of all final_salary from salary_details for the current month
    let salaryExpense = 0;
    try {
        const date = new Date();
        const currentMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const [salRows] = await db.query(
            'SELECT COALESCE(SUM(COALESCE(final_salary, 0)), 0) AS salary_expense FROM salary_details WHERE month_year = ?', 
            [currentMonthYear]
        );
        salaryExpense = salRows[0]?.salary_expense || 0;
    } catch (e) {
        console.error('Error fetching salary expense data:', e);
    }

    // Add maintenance expenses if the table exists
    let maintenanceExpense = 0;
    try {
        const [maintRows] = await db.query('SELECT COALESCE(SUM(amount), 0) AS maintenance_expense FROM maintenance_expenses');
        maintenanceExpense = maintRows[0]?.maintenance_expense || 0;
    } catch (e) {
        // If maintenance_expenses table does not exist, ignore
    }

    // Return the total of all expense types
    return parseFloat(inventoryExpense) + parseFloat(salaryExpense) + parseFloat(maintenanceExpense);
}

// Net Profit / Loss: Total profit from sales (selling price - purchase price)
async function getNetProfitOrLoss() {
    const sql = `
        SELECT COALESCE(SUM((bi.item_price - ii.purchase_price) * bi.quantity), 0) AS total_profit
        FROM bill_items bi
        JOIN inventory_items ii ON bi.item_code = ii.item_code
        WHERE bi.item_price IS NOT NULL AND ii.purchase_price IS NOT NULL;
    `;
    const [rows] = await db.query(sql);
    return rows[0]?.total_profit || 0;
}

// Get inventory cost (sum of inventory purchases)
async function getInventoryCost() {
    const [rows] = await db.query('SELECT SUM(purchase_price * stock_qty) AS inventory_cost FROM inventory_items');
    return rows[0]?.inventory_cost || 0;
}

// Get total salaries for the current month
async function getTotalSalaries() {
    try {
        // Get current month and year in 'YYYY-MM' format for filtering
        const date = new Date();
        const currentMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Query to get sum of final_salary for the current month
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(COALESCE(final_salary, 0)), 0) AS total_salaries FROM salary_details WHERE month_year = ?', 
            [currentMonthYear]
        );
        return rows[0]?.total_salaries || 0;
    } catch (e) {
        console.error('Error fetching salary data:', e);
        return 0;
    }
}

// For demonstration purposes - you can implement these later with actual data
async function getTodayIncome() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const [rows] = await db.query('SELECT SUM(grand_total) AS today_income FROM bills WHERE DATE(bill_date) = ?', [today]);
    return rows[0]?.today_income || 0;
}

async function getTodayExpenses() {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) AS today_expenses FROM maintenance_expenses WHERE DATE(entry_date) = ?', 
            [today]
        );
        return rows[0]?.today_expenses || 0;
    } catch (e) {
        console.error('Error fetching today\'s expenses:', e);
        return 0;
    }
}

// Get total discount given
async function getTotalDiscount() {
    const [rows] = await db.query('SELECT SUM(discount) AS total_discount FROM bills');
    return rows[0]?.total_discount || 0;
}

// Get total GST collected
async function getTotalGST() {
    const [rows] = await db.query('SELECT SUM(gst) AS total_gst FROM bills');
    return rows[0]?.total_gst || 0;
}

// Get total customer khata pending (bills with payment_method = 'Credit')
async function getTotalCustomerKhataPending() {
    const [rows] = await db.query("SELECT SUM(grand_total) AS total_khata FROM bills WHERE payment_method = 'Credit'");
    return rows[0]?.total_khata || 0;
}

// Get salary details for a specific month with employee names
async function getSalaryDetailsByMonth(monthYear) {
    try {
        const query = `
            SELECT 
                sd.id,
                e.name AS employee_name,
                COALESCE(sd.base_salary, 0) AS base_salary,
                COALESCE(sd.bonus, 0) AS bonus,
                COALESCE(sd.deductions, 0) AS deductions,
                COALESCE(sd.leave_deduction, 0) AS leave_deduction,
                COALESCE(sd.net_salary, 0) AS net_salary,
                COALESCE(sd.final_salary, 0) AS final_salary,
                sd.payment_date
            FROM 
                salary_details sd
            JOIN 
                employees e ON sd.employee_id = e.id
            WHERE 
                sd.month_year = ?
            ORDER BY 
                e.name ASC
        `;
        
        const [rows] = await db.query(query, [monthYear]);
        return rows;
    } catch (err) {
        console.error('Error fetching salary details by month:', err);
        throw err;
    }
}

// Add a new maintenance expense
async function addMaintenanceExpense(expenseData) {
    try {
        const { entry_date, expense_type, brief, amount } = expenseData;
        
        const query = `
            INSERT INTO maintenance_expenses 
            (entry_date, expense_type, brief, amount) 
            VALUES (?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [
            entry_date, 
            expense_type, 
            brief, 
            amount
        ]);
        
        return result.insertId;
    } catch (err) {
        console.error('Error adding maintenance expense:', err);
        throw err;
    }
}

// Get all maintenance expenses
async function getAllMaintenanceExpenses() {
    try {
        const query = `
            SELECT 
                id,
                entry_date,
                expense_type,
                brief,
                amount,
                created_at
            FROM 
                maintenance_expenses
            ORDER BY 
                entry_date DESC
        `;
        
        const [rows] = await db.query(query);
        return rows;
    } catch (err) {
        console.error('Error fetching maintenance expenses:', err);
        throw err;
    }
}

// Get today's expense details
async function getTodayExpensesDetails() {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const query = `
            SELECT 
                id,
                entry_date,
                expense_type,
                brief,
                amount,
                created_at
            FROM 
                maintenance_expenses
            WHERE DATE(entry_date) = ?
            ORDER BY 
                created_at DESC
        `;
        
        const [rows] = await db.query(query, [today]);
        return rows;
    } catch (err) {
        console.error('Error fetching today\'s expense details:', err);
        throw err;
    }
}

// Get total supplier khata amount
async function getTotalSupplierKhataPending() {
    try {
        const [rows] = await db.query('SELECT SUM(amount) AS total_pending FROM supplier_khata');
        return rows[0]?.total_pending || 0;
    } catch (err) {
        console.error('Error fetching total supplier khata pending:', err);
        return 0;
    }
}

// Add a new supplier khata entry
async function addSupplierKhata(khataData) {
    try {
        const { entry_date, supplier_name, phone_number, amount, due_date, khata_cycle } = khataData;
        
        const query = `
            INSERT INTO supplier_khata 
            (entry_date, supplier_name, phone_number, amount, due_date, khata_cycle) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [
            entry_date, 
            supplier_name, 
            phone_number, 
            amount, 
            due_date, 
            khata_cycle
        ]);
        
        return result.insertId;
    } catch (err) {
        console.error('Error adding supplier khata:', err);
        throw err;
    }
}

// Get all supplier khata entries
async function getAllSupplierKhata() {
    try {
        const query = `
            SELECT 
                id,
                entry_date,
                supplier_name,
                phone_number,
                amount,
                due_date,
                khata_cycle,
                created_at
            FROM 
                supplier_khata
            ORDER BY 
                due_date ASC
        `;
        
        const [rows] = await db.query(query);
        return rows;
    } catch (err) {
        console.error('Error fetching supplier khata entries:', err);
        throw err;
    }
}

// Get upcoming due dates (for the next 3 days)
async function getUpcomingDueDates() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const threeDaysLater = new Date();
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);
        const formattedThreeDaysLater = threeDaysLater.toISOString().split('T')[0];
        
        const query = `
            SELECT 
                id,
                supplier_name,
                amount,
                due_date
            FROM 
                supplier_khata
            WHERE 
                due_date BETWEEN ? AND ?
            ORDER BY 
                due_date ASC
        `;
        
        const [rows] = await db.query(query, [today, formattedThreeDaysLater]);
        return rows;
    } catch (err) {
        console.error('Error fetching upcoming due dates:', err);
        throw err;
    }
}

// Get customer khata details (customers with pending credit)
async function getCustomerKhataDetails() {
    try {
        const query = `
            SELECT 
                bill_id,
                bill_date,
                customer_name,
                customer_phone,
                grand_total
            FROM 
                bills
            WHERE 
                payment_method = 'Credit'
            ORDER BY 
                bill_date DESC
        `;
        
        const [rows] = await db.query(query);
        return rows;
    } catch (err) {
        console.error('Error fetching customer khata details:', err);
        throw err;
    }
}

// Update bill payment method (change from Credit to another payment method)
async function updateBillPaymentMethod(billId, newPaymentMethod) {
    try {
        if (!['Cash', 'UPI'].includes(newPaymentMethod)) {
            throw new Error('Invalid payment method. Must be Cash or UPI');
        }
        
        const query = `
            UPDATE bills
            SET payment_method = ?
            WHERE bill_id = ? AND payment_method = 'Credit'
        `;
        
        const [result] = await db.query(query, [newPaymentMethod, billId]);
        
        return result.affectedRows > 0;
    } catch (err) {
        console.error('Error updating bill payment method:', err);
        throw err;
    }
}

// Pay a specific supplier khata entry
async function paySupplierKhata(khataId) {
    try {
        // First, get the khata entry
        const [khataEntry] = await db.query('SELECT * FROM supplier_khata WHERE id = ?', [khataId]);
        
        if (khataEntry.length === 0) {
            throw new Error('Supplier khata entry not found');
        }
        
        // Just delete the record - we can skip the history table for now
        // to simplify the implementation
        const deleteQuery = 'DELETE FROM supplier_khata WHERE id = ?';
        const [result] = await db.query(deleteQuery, [khataId]);
        
        return result.affectedRows;
    } catch (err) {
        console.error('Error paying supplier khata:', err);
        throw err;
    }
}

// Clear all supplier khata entries
async function clearAllSupplierKhata() {
    try {
        // Keeping a log of cleared khata entries in a history table is a good practice
        // First, move all records to history table
        const insertHistoryQuery = `
            INSERT INTO supplier_khata_history (khata_id, entry_date, supplier_name, phone_number, amount, due_date, khata_cycle, cleared_date)
            SELECT id, entry_date, supplier_name, phone_number, amount, due_date, khata_cycle, NOW() 
            FROM supplier_khata
        `;
        
        await db.query(insertHistoryQuery);
        
        // Then delete all records from the main table
        const clearQuery = 'DELETE FROM supplier_khata';
        const [result] = await db.query(clearQuery);
        
        return result.affectedRows;
    } catch (err) {
        console.error('Error clearing supplier khata:', err);
        throw err;
    }
}

module.exports = {
    getTotalRevenue,
    getTotalExpenses,
    getNetProfitOrLoss,
    getInventoryCost,
    getTotalSalaries,
    getTodayIncome,
    getTodayExpenses,
    getTodayExpensesDetails,
    getTotalDiscount,
    getTotalGST,
    getTotalCustomerKhataPending,
    getSalaryDetailsByMonth,
    addMaintenanceExpense,
    getAllMaintenanceExpenses,
    getTotalSupplierKhataPending,
    addSupplierKhata,
    getAllSupplierKhata,
    getUpcomingDueDates,
    getCustomerKhataDetails,
    updateBillPaymentMethod,
    clearAllSupplierKhata,
    paySupplierKhata
};