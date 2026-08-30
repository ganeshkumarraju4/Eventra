require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'event_manager',
  port: Number(process.env.DB_PORT) || 3000,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
});

// Test connection on execution
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  console.log('✅ MySQL connection successful!');
  console.log(`Connected to database "${process.env.DB_NAME}" on port ${process.env.DB_PORT}`);
  
  connection.release(); // release connection back to pool
  process.exit(0);
});

module.exports = pool;