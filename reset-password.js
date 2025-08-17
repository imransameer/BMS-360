const bcrypt = require('bcrypt');
const db = require('./models/mainModel');
const config = require('./config/config');

const resetPassword = async () => {
    try {
        console.log('🔄 Resetting password for sameer@retail.com...');
        
        const email = 'sameer@retail.com';
        const plainPassword = 'sania';
        
        // Hash the password using the same bcrypt rounds as the config
        const saltRounds = config.security.bcryptRounds;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        
        console.log(`📝 Original password: ${plainPassword}`);
        console.log(`🔐 Hashed password: ${hashedPassword.substring(0, 30)}...`);
        
        // Update the password in the database
        const [result] = await db.query(`
            UPDATE user_details 
            SET password = ? 
            WHERE email = ?
        `, [hashedPassword, email]);
        
        if (result.affectedRows > 0) {
            console.log('✅ Password updated successfully!');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${plainPassword}`);
            console.log('');
            console.log('You can now login with these credentials.');
        } else {
            console.log('❌ No user found with that email address.');
        }
        
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
    } finally {
        process.exit(0);
    }
};

// Run the password reset
resetPassword();
