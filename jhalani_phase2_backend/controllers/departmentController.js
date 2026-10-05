const { pool } = require("../db");

/* ============================================================
   GET ALL DEPARTMENTS
   GET /api/departments
   ============================================================ */

const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM departments
      ORDER BY id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};


/* ============================================================
   GET SINGLE DEPARTMENT
   GET /api/departments/:id
   ============================================================ */

const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM departments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get department error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch department",
    });
  }
};


/* ============================================================
   CREATE DEPARTMENT
   POST /api/departments
   ============================================================ */

const createDepartment = async (req, res) => {
  try {
    const {
      name,
      description,
      status = 1,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM departments
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
      `,
      [name.trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO departments
      (
        name,
        description,
        status
      )
      VALUES (?, ?, ?)
      `,
      [
        name.trim(),
        description?.trim() || null,
        Number(status) ? 1 : 0,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM departments
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Create department error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create department",
    });
  }
};


/* ============================================================
   UPDATE DEPARTMENT
   PUT /api/departments/:id
   ============================================================ */

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM departments
      WHERE LOWER(name) = LOWER(?)
      AND id <> ?
      LIMIT 1
      `,
      [name.trim(), id]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Another department with this name already exists",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE departments
      SET
        name = ?,
        description = ?,
        status = ?
      WHERE id = ?
      `,
      [
        name.trim(),
        description?.trim() || null,
        Number(status) ? 1 : 0,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM departments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Department updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Update department error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update department",
    });
  }
};


/* ============================================================
   DELETE DEPARTMENT
   DELETE /api/departments/:id
   ============================================================ */

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    /*
      Check whether employees are using this department.
    */

    const [employees] = await pool.query(
      `
      SELECT id
      FROM employees
      WHERE department_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (employees.length) {
      return res.status(409).json({
        success: false,
        message:
          "This department is assigned to an employee and cannot be deleted. Deactivate it instead.",
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM departments
      WHERE id = ?
      `,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
};


/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};