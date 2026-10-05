
/*
============================================================
GET STOCK ADJUSTMENTS
============================================================
*/

const { pool } = require("../db");

const getStockAdjustments = async (req, res) => {
  try {
    const sql = `
      SELECT
        st.id,
        st.variant_id,

        p.id AS product_id,
        p.product_name,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,

        st.transaction_type,
        st.quantity,
        st.rate,

        st.reference_type,
        st.reference_id,

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

      WHERE st.transaction_type IN (
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT'
      )

      ORDER BY st.id DESC
    `;

    const [rows] = await pool.query(sql);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Get stock adjustments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load stock adjustments",
      error: error.message,
    });
  }
};


/*
============================================================
GET SINGLE STOCK ADJUSTMENT
============================================================
*/

const getStockAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        st.id,
        st.variant_id,

        p.id AS product_id,
        p.product_name,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pv.unit_id,
        u.name AS unit_name,
        u.symbol AS unit_symbol,

        st.transaction_type,
        st.quantity,
        st.rate,

        st.reference_type,
        st.reference_id,

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

      WHERE
        st.id = ?
        AND st.transaction_type IN (
          'ADJUSTMENT_IN',
          'ADJUSTMENT_OUT'
        )

      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(
      "Get stock adjustment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load stock adjustment",
      error: error.message,
    });
  }
};


/*
============================================================
CREATE STOCK ADJUSTMENT
============================================================
*/

const createStockAdjustment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      variant_id,
      transaction_type,
      quantity,
      rate,
      transaction_date,
      remarks,
    } = req.body;

    /*
    --------------------------------------------------------
    VALIDATION
    --------------------------------------------------------
    */

    if (!variant_id) {
      return res.status(400).json({
        success: false,
        message: "Variant is required",
      });
    }

    if (
      !["ADJUSTMENT_IN", "ADJUSTMENT_OUT"].includes(
        transaction_type
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction type must be ADJUSTMENT_IN or ADJUSTMENT_OUT",
      });
    }

    const adjustmentQuantity = Number(quantity);

    if (
      !Number.isFinite(adjustmentQuantity) ||
      adjustmentQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Adjustment quantity must be greater than zero",
      });
    }

    const adjustmentRate =
      rate === undefined ||
      rate === null ||
      rate === ""
        ? 0
        : Number(rate);

    if (
      !Number.isFinite(adjustmentRate) ||
      adjustmentRate < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment rate",
      });
    }


    /*
    --------------------------------------------------------
    START DATABASE TRANSACTION
    --------------------------------------------------------
    */

    await connection.beginTransaction();


    /*
    --------------------------------------------------------
    LOCK VARIANT
    --------------------------------------------------------
    */

    const [variants] = await connection.query(
      `
        SELECT
          id,
          current_stock,
          status
        FROM product_variants
        WHERE id = ?
        FOR UPDATE
      `,
      [variant_id]
    );

    if (!variants.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const variant = variants[0];

    if (!Number(variant.status)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Product variant is inactive",
      });
    }

    const currentStock = Number(
      variant.current_stock || 0
    );


    /*
    --------------------------------------------------------
    CALCULATE NEW STOCK
    --------------------------------------------------------
    */

    let newStock;

    if (
      transaction_type === "ADJUSTMENT_IN"
    ) {
      newStock =
        currentStock + adjustmentQuantity;
    } else {
      newStock =
        currentStock - adjustmentQuantity;

      /*
      ------------------------------------------------------
      DO NOT ALLOW NEGATIVE STOCK
      ------------------------------------------------------
      */

      if (newStock < 0) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            `Insufficient stock. Current stock is ${currentStock}`,
          current_stock: currentStock,
          requested_quantity:
            adjustmentQuantity,
        });
      }
    }


    /*
    --------------------------------------------------------
    CREATED BY
    --------------------------------------------------------
    */

    const createpooly =
      req.user?.id ||
      req.user?.user_id ||
      null;


    /*
    --------------------------------------------------------
    INSERT STOCK TRANSACTION
    --------------------------------------------------------
    */

    const [transactionResult] =
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
          VALUES
          (
            ?,
            ?,
            'STOCK_ADJUSTMENT',
            NULL,
            ?,
            ?,
            COALESCE(?, CURRENT_TIMESTAMP),
            ?,
            ?
          )
        `,
        [
          variant_id,
          transaction_type,
          adjustmentQuantity,
          adjustmentRate,
          transaction_date || null,
          remarks || null,
          createpooly,
        ]
      );


    /*
    --------------------------------------------------------
    UPDATE CURRENT STOCK
    --------------------------------------------------------
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
    --------------------------------------------------------
    COMMIT
    --------------------------------------------------------
    */

    await connection.commit();


    return res.status(201).json({
      success: true,
      message:
        transaction_type === "ADJUSTMENT_IN"
          ? "Stock added successfully"
          : "Stock reduced successfully",

      data: {
        transaction_id:
          transactionResult.insertId,

        variant_id,

        transaction_type,

        quantity: adjustmentQuantity,

        previous_stock: currentStock,

        current_stock: newStock,

        rate: adjustmentRate,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error(
      "Create stock adjustment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create stock adjustment",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


module.exports = {
  getStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
};