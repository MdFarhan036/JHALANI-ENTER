const { pool } = require("../db");

/*
============================================================
STOCK EFFECT
============================================================
Positive  = Stock In
Negative  = Stock Out
*/

const STOCK_EFFECT = {
  OPENING: 1,
  PURCHASE: 1,
  PURCHASE_RETURN: -1,
  SALE: -1,
  SALE_RETURN: 1,
  ADJUSTMENT_IN: 1,
  ADJUSTMENT_OUT: -1,
  TRANSFER_IN: 1,
  TRANSFER_OUT: -1,
  DAMAGE: -1,
  EXPIRY: -1,
};

/*
============================================================
VALID TRANSACTION TYPES
============================================================
*/

const VALID_TRANSACTION_TYPES = Object.keys(STOCK_EFFECT);

/*
============================================================
GET CURRENT STOCK
============================================================
*/

const getStock = async (req, res) => {
  try {
    const [rows] = await pool.query(`
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

        COALESCE(
          SUM(
            CASE
              WHEN st.transaction_type IN (
                'OPENING',
                'PURCHASE',
                'SALE_RETURN',
                'ADJUSTMENT_IN',
                'TRANSFER_IN'
              )
              THEN st.quantity

              WHEN st.transaction_type IN (
                'PURCHASE_RETURN',
                'SALE',
                'ADJUSTMENT_OUT',
                'TRANSFER_OUT',
                'DAMAGE',
                'EXPIRY'
              )
              THEN -st.quantity

              ELSE 0
            END
          ),
          0
        ) AS current_stock

      FROM product_variants pv

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      LEFT JOIN stock_transactions st
        ON st.variant_id = pv.id

      GROUP BY
        pv.id,
        pv.product_id,
        p.product_name,
        pv.sku,
        pv.variant_name,
        pv.pack_size,
        pv.unit_id,
        u.name,
        u.symbol

      ORDER BY pv.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get stock error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get stock",
      error: error.message,
    });
  }
};

/*
============================================================
GET STOCK OF ONE VARIANT
============================================================
*/

const getVariantStock = async (req, res) => {
  try {
    const { variantId } = req.params;

    const [rows] = await pool.query(
      `
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

        COALESCE(
          SUM(
            CASE
              WHEN st.transaction_type IN (
                'OPENING',
                'PURCHASE',
                'SALE_RETURN',
                'ADJUSTMENT_IN',
                'TRANSFER_IN'
              )
              THEN st.quantity

              WHEN st.transaction_type IN (
                'PURCHASE_RETURN',
                'SALE',
                'ADJUSTMENT_OUT',
                'TRANSFER_OUT',
                'DAMAGE',
                'EXPIRY'
              )
              THEN -st.quantity

              ELSE 0
            END
          ),
          0
        ) AS current_stock

      FROM product_variants pv

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      LEFT JOIN stock_transactions st
        ON st.variant_id = pv.id

      WHERE pv.id = ?

      GROUP BY
        pv.id,
        pv.product_id,
        p.product_name,
        pv.sku,
        pv.variant_name,
        pv.pack_size,
        pv.unit_id,
        u.name,
        u.symbol
      `,
      [variantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get variant stock error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get variant stock",
      error: error.message,
    });
  }
};

/*
============================================================
GET STOCK HISTORY
============================================================
*/

const getStockHistory = async (req, res) => {
  try {
    const { variant_id, transaction_type } = req.query;

    let sql = `
      SELECT
        st.id,

        st.variant_id,

        p.product_name,

        pv.sku,
        pv.variant_name,

        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,

        st.transaction_type,
        st.reference_type,
        st.reference_id,

        st.quantity,
        st.rate,

        st.transaction_date,
        st.remarks,

        st.created_by,
        st.created_at

      FROM stock_transactions st

      INNER JOIN product_variants pv
        ON pv.id = st.variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      WHERE 1 = 1
    `;

    const params = [];

    if (variant_id) {
      sql += ` AND st.variant_id = ?`;
      params.push(variant_id);
    }

    if (transaction_type) {
      if (!VALID_TRANSACTION_TYPES.includes(transaction_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
          valid_types: VALID_TRANSACTION_TYPES,
        });
      }

      sql += ` AND st.transaction_type = ?`;
      params.push(transaction_type);
    }

    sql += `
      ORDER BY st.transaction_date DESC, st.id DESC
    `;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get stock history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get stock history",
      error: error.message,
    });
  }
};

/*
============================================================
CREATE STOCK TRANSACTION
============================================================
*/
const createStockTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      variant_id,
      transaction_type,
      quantity,
      rate = 0,
      reference_type = null,
      reference_id = null,
      transaction_date = null,
      remarks = null,
    } = req.body;

    /*
    ============================================================
    VALIDATION
    ============================================================
    */

    if (!variant_id) {
      return res.status(400).json({
        success: false,
        message: "variant_id is required",
      });
    }

    if (!transaction_type) {
      return res.status(400).json({
        success: false,
        message: "transaction_type is required",
      });
    }

    if (!VALID_TRANSACTION_TYPES.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
        valid_types: VALID_TRANSACTION_TYPES,
      });
    }

    const quantityValue = Number(quantity);

    if (
      quantity === undefined ||
      quantity === null ||
      Number.isNaN(quantityValue) ||
      quantityValue <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    const rateValue = Number(rate || 0);

    if (
      Number.isNaN(rateValue) ||
      rateValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Rate must be zero or greater",
      });
    }

    /*
    ============================================================
    START DATABASE TRANSACTION
    ============================================================
    */

    await connection.beginTransaction();

    /*
    ============================================================
    GET VARIANT
    ============================================================
    */

    const [variantRows] = await connection.query(
      `
      SELECT
        id,
        product_id,
        unit_id,
        current_stock,
        reserved_stock,
        status
      FROM product_variants
      WHERE id = ?
      FOR UPDATE
      `,
      [variant_id]
    );

    if (variantRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const variant = variantRows[0];

    /*
    ============================================================
    CURRENT STOCK
    ============================================================
    */

    const currentStock = Number(
      variant.current_stock || 0
    );

    /*
    ============================================================
    STOCK EFFECT
    ============================================================
    */

    const effect =
      STOCK_EFFECT[transaction_type];

    if (
      effect === undefined ||
      effect === null
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Stock effect is not configured for this transaction type",
        transaction_type,
      });
    }

    const newStock =
      currentStock +
      effect * quantityValue;

    /*
    ============================================================
    PREVENT NEGATIVE STOCK
    ============================================================
    */

    if (newStock < 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
        current_stock: currentStock,
        requested_quantity: quantityValue,
        transaction_type,
      });
    }

    /*
    ============================================================
    CREATED BY
    ============================================================
    */

    const createdBy =
      req.user?.id ||
      req.user?.user_id ||
      null;

    /*
    ============================================================
    INSERT STOCK TRANSACTION
    ============================================================
    */

    const [result] =
      await connection.query(
        `
        INSERT INTO stock_transactions
        (
          variant_id,
          transaction_type,
          reference_type,
          reference_id,
          quantity,
          rate,
          transaction_date,
          remarks,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          variant_id,
          transaction_type,
          reference_type,
          reference_id,
          quantityValue,
          rateValue,
          transaction_date || new Date(),
          remarks,
          createdBy,
        ]
      );

    /*
    ============================================================
    UPDATE VARIANT CURRENT STOCK
    ============================================================
    */

    await connection.query(
      `
      UPDATE product_variants
      SET
        current_stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        newStock,
        variant_id,
      ]
    );

    /*
    ============================================================
    COMMIT
    ============================================================
    */

    await connection.commit();

    /*
    ============================================================
    RESPONSE
    ============================================================
    */

    return res.status(201).json({
      success: true,
      message:
        "Stock transaction created successfully",

      data: {
        id: result.insertId,

        variant_id:
          Number(variant_id),

        transaction_type,

        quantity:
          quantityValue,

        rate:
          rateValue,

        previous_stock:
          currentStock,

        current_stock:
          newStock,

        created_by:
          createdBy,
      },
    });

  } catch (error) {

    /*
    ============================================================
    ROLLBACK
    ============================================================
    */

    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "Create stock transaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create stock transaction",
      error: error.message,
    });

  } finally {

    connection.release();

  }
};
/*
============================================================
EXPORTS
============================================================
*/

module.exports = {
  getStock,
  getVariantStock,
  getStockHistory,
  createStockTransaction,
};