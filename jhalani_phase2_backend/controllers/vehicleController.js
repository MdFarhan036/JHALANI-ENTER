const { pool } = require("../db");


/* ============================================================
   GET ALL VEHICLES
   ============================================================ */
const getVehicles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        v.*,
        t.name AS transporter_name,
        t.transporter_code
      FROM vehicles v
      LEFT JOIN transporters t
        ON v.transporter_id = t.id
      ORDER BY v.id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("getVehicles error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    });
  }
};


/* ============================================================
   GET VEHICLE BY ID
   ============================================================ */
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        v.*,
        t.name AS transporter_name,
        t.transporter_code
      FROM vehicles v
      LEFT JOIN transporters t
        ON v.transporter_id = t.id
      WHERE v.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("getVehicleById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
      error: error.message,
    });
  }
};


/* ============================================================
   CREATE VEHICLE
   ============================================================ */
const createVehicle = async (req, res) => {
  try {
    const {
      vehicle_no,
      transporter_id,
      vehicle_type,
      model,
      manufacturer,
      capacity,
      capacity_unit,
      registration_date,
      insurance_expiry,
      fitness_expiry,
      permit_expiry,
      pollution_expiry,
      status,
      remarks,
    } = req.body;

    if (!vehicle_no) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM vehicles
      WHERE vehicle_no = ?
      LIMIT 1
      `,
      [vehicle_no]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists",
      });
    }

    if (transporter_id) {
      const [transporter] = await pool.query(
        `
        SELECT id
        FROM transporters
        WHERE id = ?
        LIMIT 1
        `,
        [transporter_id]
      );

      if (!transporter.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid transporter",
        });
      }
    }

    const createpooly = req.user?.id || null;

    const [result] = await pool.query(
      `
      INSERT INTO vehicles
      (
        vehicle_no,
        transporter_id,
        vehicle_type,
        model,
        manufacturer,
        capacity,
        capacity_unit,
        registration_date,
        insurance_expiry,
        fitness_expiry,
        permit_expiry,
        pollution_expiry,
        status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        vehicle_no,
        transporter_id || null,
        vehicle_type || "TRUCK",
        model || null,
        manufacturer || null,
        capacity === "" || capacity === undefined
          ? null
          : capacity,
        capacity_unit || "KG",
        registration_date || null,
        insurance_expiry || null,
        fitness_expiry || null,
        permit_expiry || null,
        pollution_expiry || null,
        status || "ACTIVE",
        remarks || null,
        createpooly,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT
        v.*,
        t.name AS transporter_name,
        t.transporter_code
      FROM vehicles v
      LEFT JOIN transporters t
        ON v.transporter_id = t.id
      WHERE v.id = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("createVehicle error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: error.message,
    });
  }
};


/* ============================================================
   UPDATE VEHICLE
   ============================================================ */
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      vehicle_no,
      transporter_id,
      vehicle_type,
      model,
      manufacturer,
      capacity,
      capacity_unit,
      registration_date,
      insurance_expiry,
      fitness_expiry,
      permit_expiry,
      pollution_expiry,
      status,
      remarks,
    } = req.body;

    if (!vehicle_no) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM vehicles
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const [duplicate] = await pool.query(
      `
      SELECT id
      FROM vehicles
      WHERE vehicle_no = ?
        AND id != ?
      LIMIT 1
      `,
      [vehicle_no, id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists",
      });
    }

    if (transporter_id) {
      const [transporter] = await pool.query(
        `
        SELECT id
        FROM transporters
        WHERE id = ?
        LIMIT 1
        `,
        [transporter_id]
      );

      if (!transporter.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid transporter",
        });
      }
    }

    await pool.query(
      `
      UPDATE vehicles
      SET
        vehicle_no = ?,
        transporter_id = ?,
        vehicle_type = ?,
        model = ?,
        manufacturer = ?,
        capacity = ?,
        capacity_unit = ?,
        registration_date = ?,
        insurance_expiry = ?,
        fitness_expiry = ?,
        permit_expiry = ?,
        pollution_expiry = ?,
        status = ?,
        remarks = ?
      WHERE id = ?
      `,
      [
        vehicle_no,
        transporter_id || null,
        vehicle_type || "TRUCK",
        model || null,
        manufacturer || null,
        capacity === "" || capacity === undefined
          ? null
          : capacity,
        capacity_unit || "KG",
        registration_date || null,
        insurance_expiry || null,
        fitness_expiry || null,
        permit_expiry || null,
        pollution_expiry || null,
        status || "ACTIVE",
        remarks || null,
        id,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT
        v.*,
        t.name AS transporter_name,
        t.transporter_code
      FROM vehicles v
      LEFT JOIN transporters t
        ON v.transporter_id = t.id
      WHERE v.id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("updateVehicle error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: error.message,
    });
  }
};


/* ============================================================
   UPDATE VEHICLE STATUS
   ============================================================ */
const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "ACTIVE",
      "INACTIVE",
      "MAINTENANCE",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE, INACTIVE or MAINTENANCE",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE vehicles
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.json({
      success: true,
      message: "Vehicle status updated successfully",
    });
  } catch (error) {
    console.error("updateVehicleStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update vehicle status",
      error: error.message,
    });
  }
};


/* ============================================================
   DELETE VEHICLE
   ============================================================ */
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM vehicles
      WHERE id = ?
      `,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("deleteVehicle error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: error.message,
    });
  }
};


module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
};