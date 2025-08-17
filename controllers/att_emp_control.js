const AttendanceModel = require('../models/att_empModel');

const AttendanceController = {
    // Get the attendance page with data - using async/await
    getAttendancePage: async (req, res) => {
        try {
            // Get the date from query params or use current date
            const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];
            
            // Start both queries in parallel for faster response
            const [attendanceRecords, allEmployees] = await Promise.all([
                AttendanceModel.getAttendanceByDate(date),
                AttendanceModel.getAllEmployees()
            ]);
            
            // Create a map for faster lookups (O(1) instead of O(n))
            const attendanceMap = new Map();
            attendanceRecords.forEach(record => {
                attendanceMap.set(record.employee_id, record);
            });
            
            // Map database enum values to frontend values
            const statusMap = {
                'Present': 'present',
                'Absent': 'absent', 
                'Leave': 'leave',
                'Half Day': 'half-day'
            };
            
            // Process employee data with attendance info
            const attendanceData = allEmployees.map(emp => {
                // Get attendance record if exists
                const record = attendanceMap.get(emp.id);
                
                // Default data with destructuring for cleaner code
                const data = {
                    employee_id: emp.id,
                    name: emp.name,
                    department: emp.department,
                    date: date,
                    status: 'present',
                    leave_type: null,
                    reason: null
                };
                
                // If record exists, update with actual data
                if (record) {
                    data.status = statusMap[record.status] || 'present';
                    data.leave_type = record.leave_type;
                    data.reason = record.reason;
                }
                
                return data;
            });
            
            // Format date for display
            const displayDate = new Date(date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            });
            
            res.render('att_emp', {
                title: 'Employee Attendance',
                attendance: attendanceData,
                currentDate: date,
                displayDate: displayDate
            });
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            res.status(500).render('error', { 
                message: 'Error loading attendance data', 
                error: error 
            });
        }
    },
    
    // Save attendance record - using async/await
    saveAttendance: async (req, res) => {
        try {
            const { employee_id, date, status, leave_type, reason } = req.body;
            
            // Validate required fields
            if (!employee_id || !date || !status) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required fields' 
                });
            }
            
            // Save attendance record
            const savedRecord = await AttendanceModel.saveAttendance({
                employee_id,
                date,
                status,
                leave_type: status !== 'present' ? leave_type : null,
                reason: status !== 'present' ? reason : null
            });
            
            res.json({
                success: true,
                message: 'Attendance record saved successfully',
                data: savedRecord
            });
        } catch (error) {
            console.error('Error saving attendance record:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error saving attendance record', 
                error: error.message 
            });
        }
    }
};

module.exports = AttendanceController;
