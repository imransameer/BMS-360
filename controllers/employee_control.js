const path = require("path");
const employeeModel = require("../models/employeeModel");

const getemployee = async (req, res) => {
    try {
        const result = await employeeModel.getAllEmployees();
        
        if (result.success) {
            // Render the employees page with data
            res.render('employee', { 
                employees: result.data,
                title: 'Employee Management'
            });
        } else {
            res.status(500).render('employee', { 
                employees: [],
                error: result.error,
                title: 'Employee Management'
            });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).render('employee', { 
            employees: [],
            error: "An error occurred while fetching employees",
            title: 'Employee Management'
        });
    }
};

// Function to fetch and display all employees
const getAllEmployees = async (req, res) => {
    try {
        const result = await employeeModel.getAllEmployees();
        
        if (result.success) {
            // Render the employees page with data
            res.render('employee', { 
                employees: result.data,
                title: 'Employee Management'
            });
        } else {
            res.status(500).render('employee', { 
                employees: [],
                error: result.error,
                title: 'Employee Management'
            });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).render('employee', { 
            employees: [],
            error: "An error occurred while fetching employees",
            title: 'Employee Management'
        });
    }
};

// Function to get employee details by ID
const getEmployeeById = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await employeeModel.getEmployeeById(employeeId);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while fetching employee details" });
    }
};

// Function to delete an employee by ID
const deleteEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await employeeModel.deleteEmployeeById(employeeId);
        
        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ success: false, error: "An error occurred while deleting the employee" });
    }
};

// Function to render the edit employee form
const renderEditEmployeeForm = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await employeeModel.getEmployeeById(employeeId);
        
        if (result.success) {
            res.render('edit_employee', { 
                employee: result.data,
                title: 'Edit Employee'
            });
        } else {
            res.status(404).render('employee', { 
                employees: [],
                error: result.error,
                title: 'Employee Management'
            });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).render('employee', { 
            employees: [],
            error: "An error occurred while fetching employee details",
            title: 'Employee Management'
        });
    }
};

// Function to update an employee
const updateEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const employeeData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            department: req.body.department,
            salary: req.body.salary,
            date_of_joining: req.body.date_of_joining,
            status: req.body.status,
            password: req.body.password
        };

        // Validate required fields
        if (!employeeData.name || !employeeData.email) {
            return res.status(400).json({
                success: false,
                error: 'Name and email are required fields'
            });
        }

        const result = await employeeModel.updateEmployeeById(employeeId, employeeData);
        
        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ success: false, error: "An error occurred while updating the employee" });
    }
};

// Function to get all employee salary records
const getAllSalaryRecords = async (req, res) => {
    try {
        const result = await employeeModel.getAllSalaryRecords();
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while fetching salary records" });
    }
};

// Function to get salary record by ID
const getSalaryById = async (req, res) => {
    try {
        const salaryId = req.params.id;
        const result = await employeeModel.getSalaryById(salaryId);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while fetching salary details" });
    }
};

// Function to create a new salary record
const createSalaryRecord = async (req, res) => {
    try {
        const salaryData = req.body;
        const result = await employeeModel.createSalaryRecord(salaryData);
        
        if (result.success) {
            res.status(201).json({ message: "Salary record created successfully", id: result.id });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while creating salary record" });
    }
};

// Function to update a salary record
const updateSalaryRecord = async (req, res) => {
    try {
        const salaryId = req.params.id;
        const salaryData = req.body;
        const result = await employeeModel.updateSalaryRecord(salaryId, salaryData);
        
        if (result.success) {
            res.json({ message: "Salary record updated successfully" });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while updating salary record" });
    }
};

// Function to mark a salary as paid
const markSalaryAsPaid = async (req, res) => {
    try {
        const salaryId = req.params.id;
        const { payment_date } = req.body;
        const result = await employeeModel.markSalaryAsPaid(salaryId, payment_date);
        
        if (result.success) {
            res.json({ message: "Salary marked as paid successfully" });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while marking salary as paid" });
    }
};

// Function to get all employees for dropdowns
const getAllEmployeesBasic = async (req, res) => {
    try {
        const result = await employeeModel.getAllEmployeesBasic();
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ error: "An error occurred while fetching employees" });
    }
};

module.exports = { 
    getemployee,
    getEmployeeById,
    deleteEmployee,
    renderEditEmployeeForm,
    updateEmployee,
    getAllSalaryRecords,
    getSalaryById,
    createSalaryRecord,
    updateSalaryRecord,
    markSalaryAsPaid,
    getAllEmployeesBasic
};
