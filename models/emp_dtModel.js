const db = require("./mainModel");

// Function to fetch employee profile by ID
const getEmployeeProfile = async (employeeId) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                name, 
                email, 
                phone, 
                department, 
                salary, 
                date_of_joining, 
                status 
            FROM employees 
            WHERE id = ?
        `, [employeeId]);
        
        if (rows.length === 0) {
            return { success: false, error: "Employee not found" };
        }
        
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        return { success: false, error: error.message };
    }
};

// Function to fetch employee salary details by employee ID
const getEmployeeSalary = async (employeeId) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                month_year,
                base_salary,
                bonus,
                deductions,
                leave_deduction,
                net_salary,
                final_salary,
                payment_date
            FROM salary_details 
            WHERE employee_id = ?
            ORDER BY month_year DESC
        `, [employeeId]);
        
        return { success: true, data: rows };
    } catch (error) {
        console.error("Error fetching employee salary details:", error);
        return { success: false, error: error.message };
    }
};

// Function to fetch employee attendance details by employee ID
const getEmployeeAttendance = async (employeeId) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                date,
                status,
                leave_type,
                reason
            FROM attendance_leaves 
            WHERE employee_id = ?
            ORDER BY date DESC
        `, [employeeId]);
        
        return { success: true, data: rows };
    } catch (error) {
        console.error("Error fetching employee attendance details:", error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    getEmployeeProfile,
    getEmployeeSalary,
    getEmployeeAttendance
};
