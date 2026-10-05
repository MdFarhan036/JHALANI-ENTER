const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

/* ============================================================
   LOGIN
   ============================================================ */

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [users] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = users[0];

    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    await pool.query(
      `
      UPDATE users
      SET last_login = NOW()
      WHERE id = ?
      `,
      [user.id]
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};


/* ============================================================
   LOGOUT
   ============================================================ */

const logout = async (req, res) => {
  res.clearCookie("token");

  res.json({
    success: true,
    message: "Logout successful",
  });
};


/* ============================================================
   CHECK AUTH
   ============================================================ */

const checkAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        username,
        email,
        mobile,
        role,
        status
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Check auth error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication check failed",
    });
  }
};


/* ============================================================
   GET USERS
   ============================================================ */

const getUsers = async (req, res) => {
  try {
    const { search = "", role, status } = req.query;

    let sql = `
      SELECT
        id,
        name,
        username,
        email,
        mobile,
        role,
        status,
        last_login,
        created_at,
        updated_at
      FROM users
      WHERE 1 = 1
    `;

    const params = [];

    if (search.trim()) {
      const keyword = `%${search.trim()}%`;

      sql += `
        AND (
          name LIKE ?
          OR username LIKE ?
          OR email LIKE ?
          OR mobile LIKE ?
        )
      `;

      params.push(
        keyword,
        keyword,
        keyword,
        keyword
      );
    }

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (status !== undefined && status !== "") {
      sql += ` AND status = ?`;
      params.push(Number(status));
    }

    sql += ` ORDER BY id DESC`;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};


/* ============================================================
   CREATE USER
   ============================================================ */

const createUser = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      mobile,
      password,
      role,
    } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const [result] = await pool.query(
      `
      INSERT INTO users (
        name,
        username,
        email,
        mobile,
        password,
        role
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        username.trim(),
        email || null,
        mobile || null,
        hashedPassword,
        role || "STAFF",
      ]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};


/* ============================================================
   UPDATE USER
   ============================================================ */

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      username,
      email,
      mobile,
      role,
      status,
      password,
    } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name.trim());
    }

    if (username !== undefined) {
      fields.push("username = ?");
      values.push(username.trim());
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email || null);
    }

    if (mobile !== undefined) {
      fields.push("mobile = ?");
      values.push(mobile || null);
    }

    if (role !== undefined) {
      fields.push("role = ?");
      values.push(role);
    }

    if (status !== undefined) {
      fields.push("status = ?");
      values.push(Number(status));
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters",
        });
      }

      const hashedPassword = await bcrypt.hash(
        password,
        12
      );

      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    values.push(id);

    const [result] = await pool.query(
      `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};


/* ============================================================
   DELETE USER
   ============================================================ */

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};


module.exports = {
  login,
  logout,
  checkAuth,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};