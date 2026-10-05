const { pool } = require("../db");

/* ============================================================
   GET ALL TRANSPORTERS
   ============================================================ */
const getTransporters = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.*,
        COUNT(v.id) AS vehicle_count
      FROM transporters t
      LEFT JOIN vehicles v
        ON v.transporter_id = t.id
      GROUP BY t.id
      ORDER BY t.id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("getTransporters error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transporters",
      error: error.message,
    });
  }
};


/* ============================================================
   GET TRANSPORTER BY ID
   ============================================================ */
const getTransporterById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM transporters
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("getTransporterById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transporter",
      error: error.message,
    });
  }
};


/* ============================================================
   CREATE TRANSPORTER
   ============================================================ */
const createTransporter = async (req, res) => {
  try {
    const {
      transporter_code,
      name,
      contact_person,
      mobile,
      alternate_mobile,
      email,
      gst_no,
      address,
      city,
      state,
      pincode,
      payment_terms,
      status,
      remarks,
    } = req.body;

    if (!transporter_code || !name) {
      return res.status(400).json({
        success: false,
        message: "Transporter code and name are required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM transporters
      WHERE transporter_code = ?
      LIMIT 1
      `,
      [transporter_code]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Transporter code already exists",
      });
    }

    const createpooly = req.user?.id || null;

    const [result] = await pool.query(
      `
      INSERT INTO transporters
      (
        transporter_code,
        name,
        contact_person,
        mobile,
        alternate_mobile,
        email,
        gst_no,
        address,
        city,
        state,
        pincode,
        payment_terms,
        status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        transporter_code,
        name,
        contact_person || null,
        mobile || null,
        alternate_mobile || null,
        email || null,
        gst_no || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        payment_terms || null,
        status === undefined || status === ""
          ? 1
          : Number(status),
        remarks || null,
        createpooly,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT *
      FROM transporters
      WHERE id = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Transporter created successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("createTransporter error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create transporter",
      error: error.message,
    });
  }
};


/* ============================================================
   UPDATE TRANSPORTER
   ============================================================ */
const updateTransporter = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      transporter_code,
      name,
      contact_person,
      mobile,
      alternate_mobile,
      email,
      gst_no,
      address,
      city,
      state,
      pincode,
      payment_terms,
      status,
      remarks,
    } = req.body;

    if (!transporter_code || !name) {
      return res.status(400).json({
        success: false,
        message: "Transporter code and name are required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM transporters
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }

    const [duplicate] = await pool.query(
      `
      SELECT id
      FROM transporters
      WHERE transporter_code = ?
        AND id != ?
      LIMIT 1
      `,
      [transporter_code, id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "Transporter code already exists",
      });
    }

    await pool.query(
      `
      UPDATE transporters
      SET
        transporter_code = ?,
        name = ?,
        contact_person = ?,
        mobile = ?,
        alternate_mobile = ?,
        email = ?,
        gst_no = ?,
        address = ?,
        city = ?,
        state = ?,
        pincode = ?,
        payment_terms = ?,
        status = ?,
        remarks = ?
      WHERE id = ?
      `,
      [
        transporter_code,
        name,
        contact_person || null,
        mobile || null,
        alternate_mobile || null,
        email || null,
        gst_no || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        payment_terms || null,
        status === undefined || status === ""
          ? 1
          : Number(status),
        remarks || null,
        id,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT *
      FROM transporters
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Transporter updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("updateTransporter error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update transporter",
      error: error.message,
    });
  }
};


/* ============================================================
   UPDATE STATUS
   ============================================================ */
const updateTransporterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1, "0", "1"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 0 or 1",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE transporters
      SET status = ?
      WHERE id = ?
      `,
      [Number(status), id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }

    return res.json({
      success: true,
      message: "Transporter status updated successfully",
    });
  } catch (error) {
    console.error("updateTransporterStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update transporter status",
      error: error.message,
    });
  }
};


/* ============================================================
   DELETE TRANSPORTER
   ============================================================ */
const deleteTransporter = async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicles] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM vehicles
      WHERE transporter_id = ?
      `,
      [id]
    );

    if (Number(vehicles[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete transporter because vehicles are assigned to it. Deactivate the transporter instead.",
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM transporters
      WHERE id = ?
      `,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }

    return res.json({
      success: true,
      message: "Transporter deleted successfully",
    });
  } catch (error) {
    console.error("deleteTransporter error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete transporter",
      error: error.message,
    });
  }
};


module.exports = {
  getTransporters,
  getTransporterById,
  createTransporter,
  updateTransporter,
  updateTransporterStatus,
  deleteTransporter,
};