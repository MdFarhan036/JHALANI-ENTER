const { pool } = require("../db");

/* ============================================================
   GET ALL PRODUCT VARIANTS
   ============================================================ */
const getVariants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pv.id,
        pv.product_id,
        p.product_name,
        pv.sku,
        pv.variant_name,
        pv.pack_size,
        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,
        pv.purchase_rate,
        pv.sale_rate,
        pv.opening_stock,
        pv.status,
        pv.created_at,
        pv.updated_at
      FROM product_variants pv
      INNER JOIN products p
        ON p.id = pv.product_id
      LEFT JOIN units u
        ON u.id = pv.unit_id
      ORDER BY pv.id DESC
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get variants error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product variants",
      error: error.message,
    });
  }
};

/* ============================================================
   GET VARIANT BY ID
   ============================================================ */
const getVariantById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        pv.id,
        pv.product_id,
        p.product_name,
        pv.sku,
        pv.variant_name,
        pv.pack_size,
        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,
        pv.purchase_rate,
        pv.sale_rate,
        pv.opening_stock,
        pv.status,
        pv.created_at,
        pv.updated_at
      FROM product_variants pv
      INNER JOIN products p
        ON p.id = pv.product_id
      LEFT JOIN units u
        ON u.id = pv.unit_id
      WHERE pv.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get variant error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product variant",
      error: error.message,
    });
  }
};

/* ============================================================
   CREATE VARIANT
   ============================================================ */
const createVariant = async (req, res) => {
  try {
    const {
      product_id,
      sku,
      variant_name,
      pack_size,
      unit_id,
      purchase_rate,
      sale_rate,
      opening_stock,
      status,
    } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required",
      });
    }

    if (!variant_name) {
      return res.status(400).json({
        success: false,
        message: "Variant name is required",
      });
    }

    const [existing] = await pool.query(
      `SELECT id FROM product_variants WHERE sku = ? LIMIT 1`,
      [sku]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO product_variants
      (
        product_id,
        sku,
        variant_name,
        pack_size,
        unit_id,
        purchase_rate,
        sale_rate,
        opening_stock,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        product_id,
        sku,
        variant_name,
        pack_size || null,
        unit_id || null,
        purchase_rate || 0,
        sale_rate || 0,
        opening_stock || 0,
        status !== undefined ? status : 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product variant created successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Create variant error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create product variant",
      error: error.message,
    });
  }
};

/* ============================================================
   UPDATE VARIANT
   ============================================================ */
const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      product_id,
      sku,
      variant_name,
      pack_size,
      unit_id,
      purchase_rate,
      sale_rate,
      opening_stock,
      status,
    } = req.body;

    const [existing] = await pool.query(
      `SELECT id FROM product_variants WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const [duplicate] = await pool.query(
      `
      SELECT id
      FROM product_variants
      WHERE sku = ?
        AND id != ?
      LIMIT 1
      `,
      [sku, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    await pool.query(
      `
      UPDATE product_variants
      SET
        product_id = ?,
        sku = ?,
        variant_name = ?,
        pack_size = ?,
        unit_id = ?,
        purchase_rate = ?,
        sale_rate = ?,
        opening_stock = ?,
        status = ?
      WHERE id = ?
      `,
      [
        product_id,
        sku,
        variant_name,
        pack_size || null,
        unit_id || null,
        purchase_rate || 0,
        sale_rate || 0,
        opening_stock || 0,
        status !== undefined ? status : 1,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Product variant updated successfully",
    });
  } catch (error) {
    console.error("Update variant error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product variant",
      error: error.message,
    });
  }
};

/* ============================================================
   DELETE VARIANT
   ============================================================ */
const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT id FROM product_variants WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    await pool.query(
      `DELETE FROM product_variants WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Product variant deleted successfully",
    });
  } catch (error) {
    console.error("Delete variant error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product variant",
      error: error.message,
    });
  }
};

module.exports = {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
};