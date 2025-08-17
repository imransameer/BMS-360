const db = require('./mainModel');

const Attendance = {
    // Get all attendance records for a specific date - Promise style
    getAttendanceByDate: async (date) => {
        try {
            const [rows] = await db.query(
                `SELECT a.*, e.name, e.department 
                 FROM attendance_leaves a
                 LEFT JOIN employees e ON a.employee_id = e.id
                 WHERE DATE(a.date) = ?
                 ORDER BY e.department, e.name
                 LIMIT 500`,  // Add limit to prevent excessive data loading
                [date]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Add or update attendance record - Promise style
    saveAttendance: async (data) => {
        try {
            // Map the status values to match the database enum
            const statusMap = {
                'present': 'Present',
                'absent': 'Absent',
                'leave': 'Leave',
                'half-day': 'Half Day'
            };
            
            const mappedStatus = statusMap[data.status] || 'Present';
            
            // Use INSERT ... ON DUPLICATE KEY UPDATE for better performance
            const [result] = await db.query(
                `INSERT INTO attendance_leaves 
                 (employee_id, date, status, leave_type, reason)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 status = VALUES(status),
                 leave_type = VALUES(leave_type),
                 reason = VALUES(reason)`,
                [
                    data.employee_id, 
                    data.date, 
                    mappedStatus,
                    data.leave_type || null, 
                    data.reason || null
                ]
            );
            
            // Determine if a new record was inserted or an existing one was updated
            const isNewRecord = result.affectedRows === 1 && result.insertId > 0;
            
            return { 
                id: isNewRecord ? result.insertId : null, 
                updated: !isNewRecord 
            };
        } catch (error) {
            throw error;
        }
    },

    // Get all active employees - Promise style
    getAllEmployees: async () => {
        try {
            const [rows] = await db.query(
                `SELECT id, name, department FROM employees 
                 WHERE status = 'Active'
                 ORDER BY department, name
                 LIMIT 500`  // Add limit for performance
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Attendance;
