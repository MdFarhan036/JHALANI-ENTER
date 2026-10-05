const bcrypt = require("bcryptjs");
const { pool } = require("./db");

async function createAdmin() {
  try {
    const password = "Admin@123";

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const [existing] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE username = ?
      `,
      ["admin"]
    );

    if (existing.length > 0) {
      console.log("⚠️ Admin user already exists");
      process.exit(0);
    }

    await pool.query(
      `
      INSERT INTO users (
        name,
        username,
        email,
        password,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        "System Administrator",
        "admin",
        "admin@jhalani.local",
        hashedPassword,
        "SUPER_ADMIN",
        1,
      ]
    );

    console.log("========================================");
    console.log("✅ Admin created successfully");
    console.log("Username: admin");
    console.log("Password: Admin@123");
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin");
    console.error(error.message);

    process.exit(1);
  }
}

createAdmin();