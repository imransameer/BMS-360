const db = require('./mainModel');
const employeeModel = require('./employeeModel');

/**
 * Add a new employee to the database
 * @param {Object} employeeData - Employee data from the form
 * @param {string} employeeData.name - Full name of the employee
 * @param {string} employeeData.email - Email address of the employee
 * @param {string} employeeData.phone - Phone number of the employee
 * @param {string} employeeData.department - Department of the employee
 * @param {number} employeeData.salary - Salary of the employee
 * @param {string} employeeData.date_of_joining - Date of joining (YYYY-MM-DD)
 * @param {string} employeeData.status - Status of employee (Active, On Leave, Resigned)
 * @returns {Promise<Object>} Result of the operation
 */
const addEmployee = async (employeeData) => {
    try {
        // Validate required fields
        if (!employeeData.name || !employeeData.email) {
            return {
                success: false,
                error: "Name and email are required fields"
            };
        }

        // Set default status if not provided
        if (!employeeData.status) {
            employeeData.status = 'Active';
        }

        // SQL query to insert employee data
        const query = `
            INSERT INTO employees (
                name, 
                email, 
                phone, 
                department, 
                salary, 
                date_of_joining, 
                status,
                password
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the query with the provided data
        const [result] = await db.query(query, [
            employeeData.name,
            employeeData.email,
            employeeData.phone || null,
            employeeData.department || null,
            employeeData.salary || null,
            employeeData.date_of_joining || null,
            employeeData.status,
            employeeData.password
        ]);

        // Create initial salary entry for the new employee
        if (result.insertId && employeeData.salary) {
            await employeeModel.createInitialSalaryEntry(result.insertId, employeeData.salary);
        }

        // Return success response with the inserted ID
        return {
            success: true,
            message: "Employee added successfully",
            employeeId: result.insertId
        };
    } catch (error) {
        console.error("Error adding employee:", error);
        
        // Handle unique email constraint violation
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                error: "An employee with this email already exists"
            };
        }
        
        // Return generic error message
        return {
            success: false,
            error: error.message || "Failed to add employee"
        };
    }
};

/**
 * Check if an email already exists in the database
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
const checkEmailExists = async (email) => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM employees WHERE email = ?', [email]);
        return rows[0].count > 0;
    } catch (error) {
        console.error("Error checking email existence:", error);
        throw error;
    }
};

module.exports = {
    addEmployee,
    checkEmailExists
};