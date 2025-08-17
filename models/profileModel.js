const db = require("./mainModel");

// Function to get user details by ID
const getUserById = async (userId) => {
    try {
        // First, try user_details table (for admin users)
        let [rows] = await db.query(`
            SELECT 
                id, 
                first_name, 
                last_name, 
                email, 
                password,
                business_name, 
                tagline, 
                contact_address, 
                created_at,
                'admin' as user_type
            FROM user_details 
            WHERE id = ?
        `, [userId]);
        
        // If not found in user_details, try employees table
        if (rows.length === 0) {
            [rows] = await db.query(`
                SELECT 
                    id, 
                    name as first_name,
                    '' as last_name,
                    email, 
                    password,
                    '' as business_name,
                    '' as tagline,
                    '' as contact_address,
                    created_at,
                    'employee' as user_type
                FROM employees 
                WHERE id = ?
            `, [userId]);
        }
        
        if (rows.length === 0) {
            return { success: false, error: "User not found" };
        }
        
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return { success: false, error: error.message };
    }
};

// Function to get user details by email
const getUserByEmail = async (email) => {
    try {
        // First, try user_details table (for admin users)
        let [rows] = await db.query(`
            SELECT 
                id, 
                first_name, 
                last_name, 
                email, 
                password, 
                business_name, 
                tagline, 
                contact_address, 
                created_at,
                'admin' as user_type
            FROM user_details 
            WHERE email = ?
        `, [email]);
        
        // If not found in user_details, try employees table
        if (rows.length === 0) {
            [rows] = await db.query(`
                SELECT 
                    id, 
                    name as first_name,
                    '' as last_name,
                    email, 
                    password,
                    '' as business_name,
                    '' as tagline,
                    '' as contact_address,
                    created_at,
                    'employee' as user_type
                FROM employees 
                WHERE email = ?
            `, [email]);
        }
        
        if (rows.length === 0) {
            return { success: false, error: "User not found" };
        }
        
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return { success: false, error: error.message };
    }
};

// Function to create new user
const createUser = async (userData) => {
    try {
        const { first_name, last_name, email, password, business_name, tagline, contact_address } = userData;
        
        const [result] = await db.query(`
            INSERT INTO user_details (
                first_name, 
                last_name, 
                email, 
                password, 
                business_name, 
                tagline, 
                contact_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [first_name, last_name, email, password, business_name, tagline, contact_address]);
        
        if (result.affectedRows === 0) {
            return { success: false, error: "Failed to create user" };
        }
        
        return { success: true, data: { id: result.insertId, ...userData } };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: error.message };
    }
};

// Function to update user profile
const updateUserProfile = async (userId, userData) => {
    try {
        const { first_name, last_name, email } = userData;
        
        const [result] = await db.query(`
            UPDATE user_details 
            SET 
                first_name = ?, 
                last_name = ?, 
                email = ?
            WHERE id = ?
        `, [first_name, last_name, email, userId]);
        
        if (result.affectedRows === 0) {
            return { success: false, error: "User not found or no changes made" };
        }
        
        return { success: true, data: { id: userId, ...userData } };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { success: false, error: error.message };
    }
};

// Function to update business details
const updateBusinessDetails = async (userId, businessData) => {
    try {
        const { business_name, tagline, contact_address } = businessData;
        
        const [result] = await db.query(`
            UPDATE user_details 
            SET 
                business_name = ?, 
                tagline = ?, 
                contact_address = ?
            WHERE id = ?
        `, [business_name, tagline, contact_address, userId]);
        
        if (result.affectedRows === 0) {
            return { success: false, error: "User not found or no changes made" };
        }
        
        return { success: true, data: { id: userId, ...businessData } };
    } catch (error) {
        console.error("Error updating business details:", error);
        return { success: false, error: error.message };
    }
};

// Function to update password
const updatePassword = async (userId, password) => {
    try {
        const [result] = await db.query(`
            UPDATE user_details 
            SET password = ? 
            WHERE id = ?
        `, [password, userId]);
        
        if (result.affectedRows === 0) {
            return { success: false, error: "User not found or no changes made" };
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error updating password:", error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    updateUserProfile,
    updateBusinessDetails,
    updatePassword
};
