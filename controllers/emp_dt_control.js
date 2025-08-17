const emp_dtModel = require('../models/emp_dtModel');

// Function to get employee details including profile, salary, and attendance
const getEmployeeDetails = async (req, res) => {
    try {
        const employeeId = req.params.id;
        
        // Get employee profile details
        const profileResult = await emp_dtModel.getEmployeeProfile(employeeId);
        
        // Get employee salary details
        const salaryResult = await emp_dtModel.getEmployeeSalary(employeeId);
        
        // Get employee attendance details
        const attendanceResult = await emp_dtModel.getEmployeeAttendance(employeeId);
        
        if (profileResult.success) {
            // Render the emp_dt page with all data
            res.render('emp_dt', { 
                profile: profileResult.data,
                salary: salaryResult.success ? salaryResult.data : [],
                attendance: attendanceResult.success ? attendanceResult.data : [],
                title: 'Employee Details'
            });
        } else {
            res.status(404).render('emp_dt', { 
                error: "Employee not found",
                title: 'Employee Details'
            });
        }
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).render('emp_dt', { 
            error: "An error occurred while fetching employee details",
            title: 'Employee Details'
        });
    }
};

module.exports = {
    getEmployeeDetails
};
