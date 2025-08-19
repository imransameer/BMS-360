const db = require('./models/mainModel');
const fs = require('fs');
const path = require('path');

const setupMaintenanceTable = async () => {
    try {
        console.log('Setting up maintenance_expenses table...');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'create_maintenance_table.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Split by semicolon to handle multiple statements
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        
        for (const statement of statements) {
            if (statement.trim()) {
                await db.query(statement.trim());
                console.log('Executed:', statement.substring(0, 50) + '...');
            }
        }
        
        console.log('Maintenance expenses table setup completed successfully');
        
        // Test the today's expenses functionality
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) AS today_expenses FROM maintenance_expenses WHERE DATE(entry_date) = CURDATE()'
        );
        console.log(`Today's expenses total: ₹${rows[0].today_expenses}`);
        
    } catch (error) {
        console.error('Error setting up maintenance table:', error);
    } finally {
        // Close the database connection
        db.end();
    }
};

// Run the setup function
setupMaintenanceTable();
