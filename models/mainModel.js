const mysql = require("mysql2");
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
    }
}

// Create MySQL Connection (Promise-based) with environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "bms360",
    port: process.env.DB_PORT || 3306,
    // Security configurations
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // Prevent multiple statement queries (SQL injection protection)
    multipleStatements: false
}).promise();

// Test the database connection
db.execute('SELECT 1')
    .then(() => {
        console.log('✅ Database connection established successfully');
    })
    .catch((error) => {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    });

// Export the promise-based connection
module.exports = db;
