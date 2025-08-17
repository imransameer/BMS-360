const db = require('./models/mainModel');
const bcrypt = require('bcrypt');

const checkEmployees = async () => {
    try {
        console.log('Checking employee records...');
        
        // Get all employees
        const [employees] = await db.query(`
            SELECT 
                id, 
                name, 
                email, 
                department, 
                password
            FROM employees
        `);
        
        console.log(`Found ${employees.length} employee records`);
        
        // Check if passwords are set
        for (const employee of employees) {
            console.log(`\nEmployee ID: ${employee.id}`);
            console.log(`Name: ${employee.name}`);
            console.log(`Email: ${employee.email}`);
            console.log(`Department: ${employee.department || 'Not set'}`);
            console.log(`Password: ${employee.password ? 'Set' : 'Not set'}`);
            
            if (employee.password) {
                // Check if the password is hashed (bcrypt hashes start with $2b$)
                const isHashed = employee.password.startsWith('$2');
                console.log(`Password appears to be ${isHashed ? 'hashed' : 'plaintext'}`);
                
                // If not hashed, hash it now
                if (!isHashed) {
                    console.log(`Hashing password for employee ${employee.id}`);
                    const hashedPassword = await bcrypt.hash(employee.password, 10);
                    
                    // Update the employee record with the hashed password
                    await db.query(`
                        UPDATE employees
                        SET password = ?
                        WHERE id = ?
                    `, [hashedPassword, employee.id]);
                    
                    console.log(`Password hashed and updated for employee ${employee.id}`);
                }
            } else {
                // Set a default password
                console.log(`Setting default password for employee ${employee.id}`);
                const hashedPassword = await bcrypt.hash('password123', 10);
                
                // Update the employee record with the hashed password
                await db.query(`
                    UPDATE employees
                    SET password = ?
                    WHERE id = ?
                `, [hashedPassword, employee.id]);
                
                console.log(`Default password set for employee ${employee.id}`);
            }
        }
        
        console.log('\nEmployee password check complete');
    } catch (error) {
        console.error('Error checking employees:', error);
    } finally {
        // Close the database connection
        db.end();
    }
};

// Run the function
checkEmployees();
