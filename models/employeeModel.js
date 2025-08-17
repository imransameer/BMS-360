const db = require("./mainModel");

// Function to fetch all employees
const getAllEmployees = async () => {
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
        `);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Error fetching employees:", error);
        return { success: false, error: error.message };
    }
};

// Function to fetch employee by ID
const getEmployeeById = async (employeeId) => {
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
        console.error("Error fetching employee by ID:", error);
        return { success: false, error: error.message };
    }
};

// Legacy function - keeping for backward compatibility
const getempmodel = (callback) => {
    const sql = "SELECT id, name, age, position, salary, email, created_at FROM employee";
    db.query(sql, (err, results) => {
        if (err) return callback(err, null);
        callback(null, results);
    });
};

// Function to create initial salary entry for a new employee
const createInitialSalaryEntry = async (employeeId, baseSalary) => {
    try {
        // Get current date in YYYY-MM format
        const today = new Date();
        const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        // Calculate default values
        const bonus = 0.00;
        const deductions = 0.00;
        const leaveDeduction = 0.00;
        const netSalary = parseFloat(baseSalary) - deductions - leaveDeduction;
        const finalSalary = netSalary + parseFloat(bonus);
        
        // Insert initial salary entry
        await db.query(`
            INSERT INTO salary_details (
                employee_id, 
                month_year, 
                base_salary, 
                bonus, 
                deductions, 
                leave_deduction, 
                net_salary, 
                final_salary, 
                payment_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `, [
            employeeId,
            monthYear,
            baseSalary,
            bonus,
            deductions,
            leaveDeduction,
            netSalary,
            finalSalary
        ]);
        
        return { success: true, message: "Initial salary entry created successfully" };
    } catch (error) {
        console.error("Error creating initial salary entry:", error);
        return { success: false, error: error.message };
    }
};

// Function to update salary details for an employee
const updateSalaryDetails = async (employeeId, salaryData) => {
    try {
        const { 
            month_year, 
            base_salary, 
            bonus = 0, 
            deductions = 0, 
            leave_deduction = 0, 
            payment_date = null 
        } = salaryData;
        
        // Calculate net and final salary
        const netSalary = parseFloat(base_salary) - parseFloat(deductions) - parseFloat(leave_deduction);
        const finalSalary = netSalary + parseFloat(bonus);
        
        // Check if an entry already exists for this employee and month
        const [existingEntries] = await db.query(
            'SELECT id FROM salary_details WHERE employee_id = ? AND month_year = ?',
            [employeeId, month_year]
        );
        
        if (existingEntries.length > 0) {
            // Update existing entry
            await db.query(`
                UPDATE salary_details 
                SET 
                    base_salary = ?,
                    bonus = ?,
                    deductions = ?,
                    leave_deduction = ?,
                    net_salary = ?,
                    final_salary = ?,
                    payment_date = ?
                WHERE employee_id = ? AND month_year = ?
            `, [
                base_salary,
                bonus,
                deductions,
                leave_deduction,
                netSalary,
                finalSalary,
                payment_date,
                employeeId,
                month_year
            ]);
            
            return { success: true, message: "Salary details updated successfully" };
        } else {
            // Create new entry
            await db.query(`
                INSERT INTO salary_details (
                    employee_id, 
                    month_year, 
                    base_salary, 
                    bonus, 
                    deductions, 
                    leave_deduction, 
                    net_salary, 
                    final_salary, 
                    payment_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                employeeId,
                month_year,
                base_salary,
                bonus,
                deductions,
                leave_deduction,
                netSalary,
                finalSalary,
                payment_date
            ]);
            
            return { success: true, message: "Salary details created successfully" };
        }
    } catch (error) {
        console.error("Error updating salary details:", error);
        return { success: false, error: error.message };
    }
};

// Function to get salary details for an employee
const getSalaryDetailsByEmployeeId = async (employeeId) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                employee_id,
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
        console.error("Error fetching salary details:", error);
        return { success: false, error: error.message };
    }
};

// Function to delete an employee by ID
const deleteEmployeeById = async (employeeId) => {
    try {
        // Check if employee exists first
        const employee = await getEmployeeById(employeeId);
        if (!employee.success) {
            return { success: false, error: "Employee not found" };
        }
        
        // Delete the employee
        const [result] = await db.query('DELETE FROM employees WHERE id = ?', [employeeId]);
        
        if (result.affectedRows === 0) {
            return { success: false, error: "Employee not found or already deleted" };
        }
        
        return { success: true, message: "Employee deleted successfully" };
    } catch (error) {
        console.error("Error deleting employee:", error);
        return { success: false, error: error.message };
    }
};

// Function to update an employee by ID
const updateEmployeeById = async (employeeId, employeeData) => {
    try {
        // Check if employee exists first
        const employee = await getEmployeeById(employeeId);
        if (!employee.success) {
            return { success: false, error: "Employee not found" };
        }
        
        // Update employee data
        const [result] = await db.query(`
            UPDATE employees
            SET 
                name = ?,
                email = ?,
                phone = ?,
                department = ?,
                salary = ?,
                date_of_joining = ?,
                status = ?
                ${employeeData.password ? ', password = ?' : ''}
            WHERE id = ?
        `, [
            employeeData.name,
            employeeData.email,
            employeeData.phone || null,
            employeeData.department || null,
            employeeData.salary || null,
            employeeData.date_of_joining || null,
            employeeData.status,
            ...(employeeData.password ? [employeeData.password] : []),
            employeeId
        ]);
        
        if (result.affectedRows === 0) {
            return { success: false, error: "Employee not found or no changes made" };
        }
        
        // If salary is updated, also update the current month's salary entry
        if (employeeData.salary !== undefined && employeeData.salary !== null) {
            // Get current month-year
            const today = new Date();
            const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            
            // Check if a salary entry exists for the current month
            const [salaryEntries] = await db.query(
                'SELECT id, base_salary FROM salary_details WHERE employee_id = ? AND month_year = ?',
                [employeeId, monthYear]
            );
            
            if (salaryEntries.length > 0) {
                // Update existing entry if the base salary has changed
                if (parseFloat(salaryEntries[0].base_salary) !== parseFloat(employeeData.salary)) {
                    await updateSalaryDetails(employeeId, {
                        month_year: monthYear,
                        base_salary: employeeData.salary
                    });
                }
            } else {
                // Create new salary entry for the current month
                await createInitialSalaryEntry(employeeId, employeeData.salary);
            }
        }
        
        return { success: true, message: "Employee updated successfully" };
    } catch (error) {
        console.error("Error updating employee:", error);
        
        // Handle unique email constraint violation
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                error: "An employee with this email already exists"
            };
        }
        
        return { success: false, error: error.message };
    }
};

// Function to get all salary records with employee names
const getAllSalaryRecords = async () => {
    try {
        const [rows] = await db.query(`
            SELECT 
                sd.id, 
                sd.employee_id, 
                e.name as employee_name,
                sd.month_year, 
                sd.base_salary, 
                sd.bonus, 
                sd.deductions, 
                sd.leave_deduction, 
                sd.net_salary, 
                sd.final_salary, 
                sd.payment_date 
            FROM salary_details sd
            JOIN employees e ON sd.employee_id = e.id
            ORDER BY sd.month_year DESC, e.name ASC
        `);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Error fetching salary records:", error);
        return { success: false, error: error.message };
    }
};

// Function to get salary record by ID
const getSalaryById = async (salaryId) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                employee_id, 
                month_year, 
                base_salary, 
                bonus, 
                deductions, 
                leave_deduction, 
                net_salary, 
                final_salary, 
                payment_date 
            FROM salary_details 
            WHERE id = ?
        `, [salaryId]);
        
        if (rows.length === 0) {
            return { success: false, error: "Salary record not found" };
        }
        
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Error fetching salary by ID:", error);
        return { success: false, error: error.message };
    }
};

// Function to create a new salary record
const createSalaryRecord = async (salaryData) => {
    try {
        // Check if a record already exists for this employee and month/year
        const [existingRecords] = await db.query(`
            SELECT id FROM salary_details 
            WHERE employee_id = ? AND month_year = ?
        `, [salaryData.employee_id, salaryData.month_year]);
        
        if (existingRecords.length > 0) {
            return { 
                success: false, 
                error: "A salary record already exists for this employee and month/year" 
            };
        }
        
        // Calculate net and final salary
        const baseSalary = parseFloat(salaryData.base_salary);
        const bonus = parseFloat(salaryData.bonus || 0);
        const deductions = parseFloat(salaryData.deductions || 0);
        const leaveDeduction = parseFloat(salaryData.leave_deduction || 0);
        const netSalary = baseSalary - deductions - leaveDeduction;
        const finalSalary = netSalary + bonus;
        
        // Set payment date based on status
        const paymentDate = salaryData.payment_status === 'Paid' ? salaryData.payment_date : null;
        
        // Insert salary record
        const [result] = await db.query(`
            INSERT INTO salary_details (
                employee_id, 
                month_year, 
                base_salary, 
                bonus, 
                deductions, 
                leave_deduction, 
                net_salary, 
                final_salary, 
                payment_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            salaryData.employee_id,
            salaryData.month_year,
            baseSalary,
            bonus,
            deductions,
            leaveDeduction,
            netSalary,
            finalSalary,
            paymentDate
        ]);
        
        return { 
            success: true, 
            message: "Salary record created successfully", 
            id: result.insertId 
        };
    } catch (error) {
        console.error("Error creating salary record:", error);
        return { success: false, error: error.message };
    }
};

// Function to update a salary record
const updateSalaryRecord = async (salaryId, salaryData) => {
    try {
        // Check if the record exists
        const [existingRecords] = await db.query(`
            SELECT id FROM salary_details WHERE id = ?
        `, [salaryId]);
        
        if (existingRecords.length === 0) {
            return { success: false, error: "Salary record not found" };
        }
        
        // Calculate net and final salary
        const baseSalary = parseFloat(salaryData.base_salary);
        const bonus = parseFloat(salaryData.bonus || 0);
        const deductions = parseFloat(salaryData.deductions || 0);
        const leaveDeduction = parseFloat(salaryData.leave_deduction || 0);
        const netSalary = baseSalary - deductions - leaveDeduction;
        const finalSalary = netSalary + bonus;
        
        // Set payment date based on status
        const paymentDate = salaryData.payment_status === 'Paid' ? salaryData.payment_date : null;
        
        // Update salary record
        await db.query(`
            UPDATE salary_details SET
                employee_id = ?,
                month_year = ?,
                base_salary = ?,
                bonus = ?,
                deductions = ?,
                leave_deduction = ?,
                net_salary = ?,
                final_salary = ?,
                payment_date = ?
            WHERE id = ?
        `, [
            salaryData.employee_id,
            salaryData.month_year,
            baseSalary,
            bonus,
            deductions,
            leaveDeduction,
            netSalary,
            finalSalary,
            paymentDate,
            salaryId
        ]);
        
        return { success: true, message: "Salary record updated successfully" };
    } catch (error) {
        console.error("Error updating salary record:", error);
        return { success: false, error: error.message };
    }
};

// Function to mark a salary as paid
const markSalaryAsPaid = async (salaryId, paymentDate) => {
    try {
        // Check if the record exists
        const [existingRecords] = await db.query(`
            SELECT id FROM salary_details WHERE id = ?
        `, [salaryId]);
        
        if (existingRecords.length === 0) {
            return { success: false, error: "Salary record not found" };
        }
        
        // Update payment date
        await db.query(`
            UPDATE salary_details SET
                payment_date = ?
            WHERE id = ?
        `, [paymentDate, salaryId]);
        
        return { success: true, message: "Salary marked as paid successfully" };
    } catch (error) {
        console.error("Error marking salary as paid:", error);
        return { success: false, error: error.message };
    }
};

// Function to get all employees for dropdowns (basic info only)
const getAllEmployeesBasic = async () => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                name, 
                salary
            FROM employees
            ORDER BY name ASC
        `);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Error fetching employees:", error);
        return { success: false, error: error.message };
    }
};

module.exports = { 
    getempmodel,
    getAllEmployees,
    getEmployeeById,
    createInitialSalaryEntry,
    updateSalaryDetails,
    getSalaryDetailsByEmployeeId,
    deleteEmployeeById,
    updateEmployeeById,
    getAllSalaryRecords,
    getSalaryById,
    createSalaryRecord,
    updateSalaryRecord,
    markSalaryAsPaid,
    getAllEmployeesBasic
};
