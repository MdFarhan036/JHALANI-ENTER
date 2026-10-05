const { pool } = require("../db");

/*
============================================================
GET ALL PURCHASES
============================================================
*/

const getPurchases = async (req, res) => {
  try {
    const [purchases] = await pool.query(`
      SELECT
        p.id,
        p.supplier_name,
        p.invoice_number,
        p.invoice_date,
        p.purchase_date,
        p.total_amount,
        p.remarks,
        p.status,
        p.created_by,
        p.created_at,
        p.updated_at
      FROM purchases p
      ORDER BY p.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    console.error("Get purchases error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load purchases",
      error: error.message,
    });
  }
};


/*
============================================================
GET PURCHASE BY ID
============================================================
*/

const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [purchases] = await pool.query(
      `
        SELECT
          p.id,
          p.supplier_name,
          p.invoice_number,
          p.invoice_date,
          p.purchase_date,
          p.total_amount,
          p.remarks,
          p.status,
          p.created_by,
          p.created_at,
          p.updated_at
        FROM purchases p
        WHERE p.id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!purchases.length) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const [items] = await pool.query(
      `
        SELECT
          pi.id,
          pi.purchase_id,
          pi.variant_id,

          p.id AS product_id,
          p.product_name,

          pv.sku,
          pv.variant_name,
          pv.pack_size,

          pv.unit_id,
          u.name AS unit_name,
          u.symbol AS unit_symbol,

          pi.quantity,
          pi.rate,
          pi.amount,

          pi.created_at,
          pi.updated_at

        FROM purchase_items pi

        INNER JOIN product_variants pv
          ON pv.id = pi.variant_id

        INNER JOIN products p
          ON p.id = pv.product_id

        LEFT JOIN units u
          ON u.id = pv.unit_id

        WHERE pi.purchase_id = ?

        ORDER BY pi.id ASC
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...purchases[0],
        items,
      },
    });
  } catch (error) {
    console.error("Get purchase error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load purchase",
      error: error.message,
    });
  }
};


/*
============================================================
CREATE PURCHASE
============================================================

Creates the purchase as DRAFT.

Stock is NOT updated here.

Stock is updated only when the purchase is completed.
============================================================
*/

const createPurchase = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      supplier_name,
      invoice_number,
      invoice_date,
      purchase_date,
      remarks,
      items,
    } = req.body;

    /*
    --------------------------------------------------------
    VALIDATION
    --------------------------------------------------------
    */

    if (!supplier_name || !supplier_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required",
      });
    }

    /*
    --------------------------------------------------------
    NORMALIZE ITEMS
    --------------------------------------------------------
    */

    const normalizedItems = [];

    let totalAmount = 0;

    for (const item of items) {
      const variantId = Number(item.variant_id);
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      if (
        !Number.isInteger(variantId) ||
        variantId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product variant",
        });
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Purchase quantity must be greater than zero",
        });
      }

      if (
        !Number.isFinite(rate) ||
        rate < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase rate",
        });
      }

      const amount = quantity * rate;

      totalAmount += amount;

      normalizedItems.push({
        variantId,
        quantity,
        rate,
        amount,
      });
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
    START TRANSACTION
    --------------------------------------------------------
    */

    await connection.beginTransaction();

    /*
    --------------------------------------------------------
    CREATE PURCHASE
    --------------------------------------------------------
    */

    const [purchaseResult] =
      await connection.query(
        `
          INSERT INTO purchases
          (
            supplier_name,
            invoice_number,
            invoice_date,
            purchase_date,
            total_amount,
            remarks,
            status,
            created_by
          )
          VALUES
          (
            ?,
            ?,
            ?,
            COALESCE(?, CURRENT_TIMESTAMP),
            ?,
            ?,
            'DRAFT',
            ?
          )
        `,
        [
          supplier_name.trim(),
          invoice_number || null,
          invoice_date || null,
          purchase_date || null,
          totalAmount,
          remarks || null,
          createpooly,
        ]
      );

    const purchaseId =
      purchaseResult.insertId;

    /*
    --------------------------------------------------------
    INSERT ITEMS
    --------------------------------------------------------
    */

    for (const item of normalizedItems) {
      await connection.query(
        `
          INSERT INTO purchase_items
          (
            purchase_id,
            variant_id,
            quantity,
            rate,
            amount
          )
          VALUES
          (?, ?, ?, ?, ?)
        `,
        [
          purchaseId,
          item.variantId,
          item.quantity,
          item.rate,
          item.amount,
        ]
      );
    }

    /*
    --------------------------------------------------------
    COMMIT
    --------------------------------------------------------
    */

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: {
        id: purchaseId,
        total_amount: totalAmount,
        status: "DRAFT",
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error("Create purchase error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


/*
============================================================
COMPLETE PURCHASE
============================================================

IMPORTANT:

Only COMPLETING a purchase changes stock.

For every item:

product_variants.current_stock
        +
purchase quantity

AND

stock_transactions
transaction_type = PURCHASE
============================================================
*/


const completePurchase = async (req, res) => {
  const purchaseId = Number(req.params.id);

  if (!purchaseId) {
    return res.status(400).json({
      success: false,
      message: "Invalid purchase ID",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
    ========================================================
    GET PURCHASE
    ========================================================
    */

    const [purchases] = await connection.query(
      `
      SELECT *
      FROM purchases
      WHERE id = ?
      FOR UPDATE
      `,
      [purchaseId]
    );

    if (!purchases.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const purchase = purchases[0];

    /*
    ========================================================
    ONLY DRAFT CAN BE COMPLETED
    ========================================================
    */

    if (purchase.status !== "DRAFT") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `Purchase is already ${purchase.status}`,
      });
    }

    /*
    ========================================================
    GET PURCHASE ITEMS
    ========================================================
    */

    const [items] = await connection.query(
      `
      SELECT
        id,
        purchase_id,
        variant_id,
        quantity,
        rate,
        amount
      FROM purchase_items
      WHERE purchase_id = ?
      `,
      [purchaseId]
    );

    if (!items.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Purchase has no items",
      });
    }

    /*
    ========================================================
    PROCESS EACH ITEM
    ========================================================
    */

    for (const item of items) {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      if (quantity <= 0) {
        throw new Error(
          `Invalid quantity for variant ${item.variant_id}`
        );
      }

      /*
      ------------------------------------------------------
      LOCK VARIANT
      ------------------------------------------------------
      */

      const [variants] = await connection.query(
        `
        SELECT
          id,
          current_stock
        FROM product_variants
        WHERE id = ?
        FOR UPDATE
        `,
        [item.variant_id]
      );

      if (!variants.length) {
        throw new Error(
          `Variant ${item.variant_id} not found`
        );
      }

      /*
      ------------------------------------------------------
      UPDATE STOCK
      ------------------------------------------------------
      */

      await connection.query(
        `
        UPDATE product_variants
        SET current_stock = current_stock + ?
        WHERE id = ?
        `,
        [
          quantity,
          item.variant_id,
        ]
      );

      /*
      ------------------------------------------------------
      CREATE STOCK LEDGER ENTRY
      ------------------------------------------------------
      */

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
          'PURCHASE',
          'PURCHASE',
          ?,
          ?,
          ?,
          NOW(),
          ?,
          ?
        )
        `,
        [
          item.variant_id,
          purchaseId,
          quantity,
          rate,
          `Purchase #${purchaseId}`,
          req.user?.id || null,
        ]
      );
    }

    /*
    ========================================================
    COMPLETE PURCHASE
    ========================================================
    */

    await connection.query(
      `
      UPDATE purchases
      SET
        status = 'COMPLETED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [purchaseId]
    );

    /*
    ========================================================
    COMMIT
    ========================================================
    */

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Purchase completed and stock updated successfully",
      data: {
        purchase_id: purchaseId,
        status: "COMPLETED",
      },
    });

  } catch (error) {
    await connection.rollback();

    console.error(
      "Complete purchase error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to complete purchase",
    });

  } finally {
    connection.release();
  }
};


/*
============================================================
CANCEL PURCHASE
============================================================

Only DRAFT purchases can be cancelled.

Because DRAFT purchases have not affected stock,
cancelling them does not modify inventory.
============================================================
*/

const cancelPurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
        UPDATE purchases
        SET
          status = 'CANCELLED',
          updated_at = CURRENT_TIMESTAMP
        WHERE
          id = ?
          AND status = 'DRAFT'
      `,
      [id]
    );

    if (!result.affectedRows) {
      const [rows] = await pool.query(
        `
          SELECT id, status
          FROM purchases
          WHERE id = ?
          LIMIT 1
        `,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          `Purchase cannot be cancelled because its current status is ${rows[0].status}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Purchase cancelled successfully",
    });
  } catch (error) {
    console.error(
      "Cancel purchase error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel purchase",
      error: error.message,
    });
  }
};


module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  completePurchase,
  cancelPurchase,
};

