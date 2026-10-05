const { pool } = require("../db");

/*
============================================================
GET STOCK ALERTS
============================================================
*/

const getStockAlerts = async (req, res) => {
  try {
    const sql = `
      SELECT
        pv.id AS variant_id,
        pv.product_id,

        p.product_name,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,

        pv.current_stock,
        pv.reserved_stock,

        pv.status

      FROM product_variants pv

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      WHERE pv.status = 1

      ORDER BY
        pv.current_stock ASC,
        p.product_name ASC
    `;

    const [rows] = await pool.query(sql);

    const data = rows.map((row) => {
      const currentStock = Number(
        row.current_stock || 0
      );

      const reservedStock = Number(
        row.reserved_stock || 0
      );

      let alertStatus = "IN_STOCK";

      if (currentStock <= 0) {
        alertStatus = "OUT_OF_STOCK";
      }

      return {
        variant_id: row.variant_id,
        product_id: row.product_id,

        product_name: row.product_name,

        sku: row.sku,
        variant_name: row.variant_name,
        pack_size: row.pack_size,

        unit_id: row.unit_id,
        unit_name: row.unit_name,
        unit_symbol: row.unit_symbol,

        current_stock: currentStock.toFixed(3),
        reserved_stock: reservedStock.toFixed(3),

        available_stock: (
          currentStock - reservedStock
        ).toFixed(3),

        alert_status: alertStatus,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get stock alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load stock alerts",
      error: error.message,
    });
  }
};


/*
============================================================
GET OUT OF STOCK
============================================================
*/

const getOutOfStock = async (req, res) => {
  try {
    const sql = `
      SELECT
        pv.id AS variant_id,
        pv.product_id,

        p.product_name,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,

        pv.current_stock,
        pv.reserved_stock

      FROM product_variants pv

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      WHERE
        pv.status = 1
        AND pv.current_stock <= 0

      ORDER BY
        p.product_name ASC,
        pv.variant_name ASC
    `;

    const [rows] = await pool.query(sql);

    const data = rows.map((row) => ({
      variant_id: row.variant_id,
      product_id: row.product_id,

      product_name: row.product_name,

      sku: row.sku,
      variant_name: row.variant_name,
      pack_size: row.pack_size,

      unit_id: row.unit_id,
      unit_name: row.unit_name,
      unit_symbol: row.unit_symbol,

      current_stock: Number(
        row.current_stock || 0
      ).toFixed(3),

      reserved_stock: Number(
        row.reserved_stock || 0
      ).toFixed(3),

      alert_status: "OUT_OF_STOCK",
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Get out of stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load out of stock items",
      error: error.message,
    });
  }
};


module.exports = {
  getStockAlerts,
  getOutOfStock,
};