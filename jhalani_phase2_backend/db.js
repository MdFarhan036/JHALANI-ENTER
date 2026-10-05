const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("Database configuration:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "********" : "(empty)"
);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stock_management_dtb",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query("SELECT 1");
    console.log("✅ MySQL database connected");
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testDatabase,
};