const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../db");

const router = express.Router();

/* ============================================================
   ADMIN LOGIN
   POST /api/auth/login
   ============================================================ */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        password,
        role,
        status
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [email.trim()]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    if (Number(user.status) !== 1) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
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

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});


/* ============================================================
   CHECK AUTH
   GET /api/auth/check-auth
   ============================================================ */

router.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        role,
        status
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (Number(user.status) !== 1) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
});


/* ============================================================
   LOGOUT
   POST /api/auth/logout
   ============================================================ */

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});


module.exports = router;