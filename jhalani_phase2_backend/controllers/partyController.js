const { pool } = require("../db");

/* ============================================================
   GET ALL PARTIES
   ============================================================ */

const getParties = async (req, res) => {
  try {
    const { search = "", status } = req.query;

    let sql = `
      SELECT *
      FROM parties
      WHERE 1 = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += `
        AND (
          name LIKE ?
          OR party_code LIKE ?
          OR mobile LIKE ?
          OR gst_no LIKE ?
          OR email LIKE ?
        )
      `;

      const keyword = `%${search.trim()}%`;

      params.push(
        keyword,
        keyword,
        keyword,
        keyword,
        keyword
      );
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
    console.error("Get parties error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch parties",
      error: error.message,
    });
  }
};


/* ============================================================
   GET SINGLE PARTY
   ============================================================ */

const getPartyById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM parties WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get party error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch party",
      error: error.message,
    });
  }
};


/* ============================================================
   CREATE PARTY
   ============================================================ */

const createParty = async (req, res) => {
  try {
    const {
      party_code,
      name,
      contact_person,
      mobile,
      alternate_mobile,
      email,
      gst_no,
      billing_address,
      delivery_address,
      city,
      state,
      pincode,
      credit_limit,
      opening_balance,
      opening_balance_type,
      remarks,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Party name is required",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO parties (
        party_code,
        name,
        contact_person,
        mobile,
        alternate_mobile,
        email,
        gst_no,
        billing_address,
        delivery_address,
        city,
        state,
        pincode,
        credit_limit,
        opening_balance,
        opening_balance_type,
        remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        party_code || null,
        name.trim(),
        contact_person || null,
        mobile || null,
        alternate_mobile || null,
        email || null,
        gst_no || null,
        billing_address || null,
        delivery_address || null,
        city || null,
        state || null,
        pincode || null,
        Number(credit_limit || 0),
        Number(opening_balance || 0),
        opening_balance_type || "DEBIT",
        remarks || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Party created successfully",
      partyId: result.insertId,
    });
  } catch (error) {
    console.error("Create party error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Party code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create party",
      error: error.message,
    });
  }
};


/* ============================================================
   UPDATE PARTY
   ============================================================ */

const updateParty = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      party_code,
      name,
      contact_person,
      mobile,
      alternate_mobile,
      email,
      gst_no,
      billing_address,
      delivery_address,
      city,
      state,
      pincode,
      credit_limit,
      opening_balance,
      opening_balance_type,
      remarks,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Party name is required",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE parties
      SET
        party_code = ?,
        name = ?,
        contact_person = ?,
        mobile = ?,
        alternate_mobile = ?,
        email = ?,
        gst_no = ?,
        billing_address = ?,
        delivery_address = ?,
        city = ?,
        state = ?,
        pincode = ?,
        credit_limit = ?,
        opening_balance = ?,
        opening_balance_type = ?,
        remarks = ?,
        status = ?
      WHERE id = ?
      `,
      [
        party_code || null,
        name.trim(),
        contact_person || null,
        mobile || null,
        alternate_mobile || null,
        email || null,
        gst_no || null,
        billing_address || null,
        delivery_address || null,
        city || null,
        state || null,
        pincode || null,
        Number(credit_limit || 0),
        Number(opening_balance || 0),
        opening_balance_type || "DEBIT",
        remarks || null,
        status === undefined ? 1 : Number(status),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    res.json({
      success: true,
      message: "Party updated successfully",
    });
  } catch (error) {
    console.error("Update party error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update party",
      error: error.message,
    });
  }
};


/* ============================================================
   CHANGE PARTY STATUS
   ============================================================ */

const togglePartyStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT status FROM parties WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    const newStatus = rows[0].status === 1 ? 0 : 1;

    await pool.query(
      `UPDATE parties SET status = ? WHERE id = ?`,
      [newStatus, id]
    );

    res.json({
      success: true,
      message: newStatus
        ? "Party activated successfully"
        : "Party deactivated successfully",
      status: newStatus,
    });
  } catch (error) {
    console.error("Toggle party status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change party status",
      error: error.message,
    });
  }
};


/* ============================================================
   DELETE PARTY
   ============================================================ */

const deleteParty = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM parties WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    res.json({
      success: true,
      message: "Party deleted successfully",
    });
  } catch (error) {
    console.error("Delete party error:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message: "Party cannot be deleted because it is linked with orders",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete party",
      error: error.message,
    });
  }
};


module.exports = {
  getParties,
  getPartyById,
  createParty,
  updateParty,
  togglePartyStatus,
  deleteParty,
};