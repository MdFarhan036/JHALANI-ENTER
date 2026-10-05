const { pool } = require("../db");

/* ============================================================
   GET ALL DESIGNATIONS
   GET /api/designations
   ============================================================ */
const getDesignations = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        d.id,
        d.department_id,
        d.name,
        d.code,
        d.description,
        d.status,
        d.created_at,
        d.updated_at,
        dep.name AS department_name
      FROM designations d
      LEFT JOIN departments dep
        ON dep.id = d.department_id
      ORDER BY d.id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get designations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch designations",
    });
  }
};


/* ============================================================
   GET SINGLE DESIGNATION
   GET /api/designations/:id
   ============================================================ */
const getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        d.id,
        d.department_id,
        d.name,
        d.code,
        d.description,
        d.status,
        dep.name AS department_name
      FROM designations d
      LEFT JOIN departments dep
        ON dep.id = d.department_id
      WHERE d.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get designation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch designation",
    });
  }
};


/* ============================================================
   CREATE DESIGNATION
   POST /api/designations
   ============================================================ */
const createDesignation = async (req, res) => {
  try {
    const {
      department_id,
      name,
      code,
      description,
      status = 1,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM designations
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
      `,
      [name.trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Designation already exists",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO designations
      (
        department_id,
        name,
        code,
        description,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        department_id || null,
        name.trim(),
        code?.trim() || null,
        description?.trim() || null,
        Number(status) === 0 ? 0 : 1,
        req.user?.id || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Designation created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Create designation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create designation",
    });
  }
};


/* ============================================================
   UPDATE DESIGNATION
   PUT /api/designations/:id
   ============================================================ */
const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      department_id,
      name,
      code,
      description,
      status = 1,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM designations
      WHERE LOWER(name) = LOWER(?)
      AND id != ?
      LIMIT 1
      `,
      [name.trim(), id]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Another designation with this name already exists",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE designations
      SET
        department_id = ?,
        name = ?,
        code = ?,
        description = ?,
        status = ?
      WHERE id = ?
      `,
      [
        department_id || null,
        name.trim(),
        code?.trim() || null,
        description?.trim() || null,
        Number(status) === 0 ? 0 : 1,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    return res.json({
      success: true,
      message: "Designation updated successfully",
    });
  } catch (error) {
    console.error("Update designation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update designation",
    });
  }
};


/* ============================================================
   DELETE DESIGNATION
   DELETE /api/designations/:id
   ============================================================ */
const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM designations
      WHERE id = ?
      `,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    return res.json({
      success: true,
      message: "Designation deleted successfully",
    });
  } catch (error) {
    console.error("Delete designation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete designation",
    });
  }
};


module.exports = {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation,
};