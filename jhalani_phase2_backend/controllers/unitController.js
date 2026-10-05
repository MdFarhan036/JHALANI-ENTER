const { pool } = require("../db");

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
*/

const getUnits = async (req, res) => {
  try {
    const [units] = await pool.query(`
      SELECT
        id,
        name,
        symbol,
        status,
        created_at,
        updated_at
      FROM units
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: units,
    });
  } catch (error) {
    console.error("Get units error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch units",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET UNIT BY ID
|--------------------------------------------------------------------------
*/

const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const [units] = await pool.query(
      `
      SELECT
        id,
        name,
        symbol,
        status,
        created_at,
        updated_at
      FROM units
      WHERE id = ?
      `,
      [id]
    );

    if (units.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.json({
      success: true,
      data: units[0],
    });
  } catch (error) {
    console.error("Get unit error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unit",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
*/

const createUnit = async (req, res) => {
  try {
    const { name, symbol, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit name is required",
      });
    }

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit symbol is required",
      });
    }

    const unitName = name.trim();
    const unitSymbol = symbol.trim();

    const unitStatus =
      status === "inactive" ? "inactive" : "active";

    /*
     * Prevent duplicate unit name or symbol
     */

    const [existing] = await pool.query(
      `
      SELECT id
      FROM units
      WHERE LOWER(name) = LOWER(?)
         OR LOWER(symbol) = LOWER(?)
      LIMIT 1
      `,
      [unitName, unitSymbol]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Unit name or symbol already exists",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO units
      (
        name,
        symbol,
        status
      )
      VALUES (?, ?, ?)
      `,
      [
        unitName,
        unitSymbol,
        unitStatus,
      ]
    );

    const [newUnit] = await pool.query(
      `
      SELECT
        id,
        name,
        symbol,
        status,
        created_at,
        updated_at
      FROM units
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: newUnit[0],
    });
  } catch (error) {
    console.error("Create unit error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create unit",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
*/

const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit name is required",
      });
    }

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit symbol is required",
      });
    }

    const unitName = name.trim();
    const unitSymbol = symbol.trim();

    const unitStatus =
      status === "inactive" ? "inactive" : "active";

    /*
     * Check unit exists
     */

    const [existing] = await pool.query(
      `
      SELECT id
      FROM units
      WHERE id = ?
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    /*
     * Prevent duplicate name / symbol
     */

    const [duplicate] = await pool.query(
      `
      SELECT id
      FROM units
      WHERE
        (
          LOWER(name) = LOWER(?)
          OR LOWER(symbol) = LOWER(?)
        )
        AND id != ?
      LIMIT 1
      `,
      [
        unitName,
        unitSymbol,
        id,
      ]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Unit name or symbol already exists",
      });
    }

    await pool.query(
      `
      UPDATE units
      SET
        name = ?,
        symbol = ?,
        status = ?
      WHERE id = ?
      `,
      [
        unitName,
        unitSymbol,
        unitStatus,
        id,
      ]
    );

    const [updatedUnit] = await pool.query(
      `
      SELECT
        id,
        name,
        symbol,
        status,
        created_at,
        updated_at
      FROM units
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Unit updated successfully",
      data: updatedUnit[0],
    });
  } catch (error) {
    console.error("Update unit error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update unit",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE STATUS
|--------------------------------------------------------------------------
*/

const updateUnitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE units
      SET status = ?
      WHERE id = ?
      `,
      [
        status,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.json({
      success: true,
      message:
        status === "active"
          ? "Unit activated successfully"
          : "Unit deactivated successfully",
    });
  } catch (error) {
    console.error(
      "Update unit status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update unit status",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE UNIT
|--------------------------------------------------------------------------
*/

const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `
      SELECT id, name
      FROM units
      WHERE id = ?
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    await pool.query(
      `
      DELETE FROM units
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Unit deleted successfully",
    });
  } catch (error) {
    console.error("Delete unit error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete unit",
      error: error.message,
    });
  }
};

module.exports = {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  updateUnitStatus,
  deleteUnit,
};