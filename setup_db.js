const db = require('./models/mainModel');
const bcrypt = require('bcrypt');

const setupDatabase = async () => {
    try {
        console.log('Checking database tables...');
        
        // Check if password column exists in employees table
        const [columns] = await db.query(`
            SHOW COLUMNS FROM employees LIKE 'password'
        `);
        
        // If password column doesn't exist, add it
        if (columns.length === 0) {
            console.log('Adding password column to employees table...');
            await db.query(`
                ALTER TABLE employees
                ADD COLUMN password VARCHAR(255) AFTER email
            `);
            console.log('Password column added successfully');
            
            // Set default password (hashed version of "password123") for existing employees
            const hashedPassword = await bcrypt.hash('password123', 10);
            await db.query(`
                UPDATE employees
                SET password = ?
                WHERE password IS NULL
            `, [hashedPassword]);
            console.log('Default passwords set for existing employees');
        } else {
            console.log('Password column already exists in employees table');
        }
        
        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        // Close the database connection
        db.end();
    }
};

// Run the setup function
setupDatabase();
