require('dotenv').config();

const mysql = require('mysql2/promise');
const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10);

if (!Number.isInteger(connectionLimit) || connectionLimit < 1) {
  throw new Error('DB_CONNECTION_LIMIT must be a positive integer.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
});

module.exports = pool;
