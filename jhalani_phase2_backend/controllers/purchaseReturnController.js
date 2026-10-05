const { pool } = require("../db");

/*
============================================================
GET PURCHASES AVAILABLE FOR RETURN
============================================================
*/

const getPurchasesForReturn = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.supplier_name,
        p.invoice_number,
        p.invoice_date,
        p.purchase_date,
        p.total_amount,
        p.status
      FROM purchases p
      WHERE p.status = 'COMPLETED'
      ORDER BY p.id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get purchases for return error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load purchases",
    });
  }
};


/*
============================================================
GET PURCHASE ITEMS AVAILABLE FOR RETURN
============================================================
*/

const getPurchaseItemsForReturn = async (req, res) => {
  const purchaseId = Number(req.params.purchaseId);

  if (!purchaseId) {
    return res.status(400).json({
      success: false,
      message: "Invalid purchase ID",
    });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        pi.id AS purchase_item_id,
        pi.purchase_id,
        pi.variant_id,
        pi.quantity AS purchased_quantity,
        pi.rate,

        pv.sku,
        pv.variant_name,
        pv.current_stock,

        COALESCE(
          (
            SELECT SUM(pri.quantity)
            FROM purchase_return_items pri
            INNER JOIN purchase_returns pr
              ON pr.id = pri.purchase_return_id
            WHERE pri.purchase_item_id = pi.id
              AND pr.status = 'COMPLETED'
          ),
          0
        ) AS returned_quantity

      FROM purchase_items pi

      INNER JOIN purchases p
        ON p.id = pi.purchase_id

      INNER JOIN product_variants pv
        ON pv.id = pi.variant_id

      WHERE pi.purchase_id = ?
        AND p.status = 'COMPLETED'

      ORDER BY pi.id ASC
      `,
      [purchaseId]
    );

    const data = rows.map((item) => ({
      ...item,
      purchased_quantity: Number(item.purchased_quantity),
      returned_quantity: Number(item.returned_quantity),
      current_stock: Number(item.current_stock),

      returnable_quantity: Math.max(
        0,
        Number(item.purchased_quantity) -
          Number(item.returned_quantity)
      ),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get purchase items for return error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load purchase items",
    });
  }
};


/*
============================================================
CREATE PURCHASE RETURN
============================================================
*/

const createPurchaseReturn = async (req, res) => {
  const {
    purchase_id,
    return_date,
    remarks,
    items,
  } = req.body;

  if (!purchase_id) {
    return res.status(400).json({
      success: false,
      message: "Purchase ID is required",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one return item is required",
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
      [purchase_id]
    );

    if (!purchases.length) {
      throw new Error("Purchase not found");
    }

    const purchase = purchases[0];

    if (purchase.status !== "COMPLETED") {
      throw new Error(
        "Only completed purchases can be returned"
      );
    }

    /*
    ========================================================
    CALCULATE TOTAL
    ========================================================
    */

    let totalAmount = 0;

    const validatedItems = [];

    for (const item of items) {
      const purchaseItemId = Number(
        item.purchase_item_id
      );

      const requestedQuantity = Number(
        item.quantity
      );

      if (!purchaseItemId || requestedQuantity <= 0) {
        throw new Error(
          "Invalid purchase return item"
        );
      }

      /*
      ------------------------------------------------------
      GET PURCHASE ITEM
      ------------------------------------------------------
      */

      const [purchaseItems] = await connection.query(
        `
        SELECT
          pi.id,
          pi.purchase_id,
          pi.variant_id,
          pi.quantity,
          pi.rate,

          pv.current_stock

        FROM purchase_items pi

        INNER JOIN product_variants pv
          ON pv.id = pi.variant_id

        WHERE pi.id = ?
          AND pi.purchase_id = ?

        FOR UPDATE
        `,
        [
          purchaseItemId,
          purchase_id,
        ]
      );

      if (!purchaseItems.length) {
        throw new Error(
          `Purchase item ${purchaseItemId} not found`
        );
      }

      const purchaseItem = purchaseItems[0];

      /*
      ------------------------------------------------------
      ALREADY RETURNED
      ------------------------------------------------------
      */

      const [returnedRows] =
        await connection.query(
          `
          SELECT
            COALESCE(SUM(pri.quantity), 0)
              AS returned_quantity

          FROM purchase_return_items pri

          INNER JOIN purchase_returns pr
            ON pr.id = pri.purchase_return_id

          WHERE pri.purchase_item_id = ?
            AND pr.status = 'COMPLETED'
          `,
          [purchaseItemId]
        );

      const returnedQuantity = Number(
        returnedRows[0].returned_quantity
      );

      const purchasedQuantity = Number(
        purchaseItem.quantity
      );

      const returnableQuantity =
        purchasedQuantity -
        returnedQuantity;

      /*
      ------------------------------------------------------
      VALIDATE RETURN QUANTITY
      ------------------------------------------------------
      */

      if (requestedQuantity > returnableQuantity) {
        throw new Error(
          `Cannot return ${requestedQuantity}. ` +
          `Only ${returnableQuantity} is available for return`
        );
      }

      /*
      ------------------------------------------------------
      STOCK CHECK
      ------------------------------------------------------
      */

      const currentStock = Number(
        purchaseItem.current_stock
      );

      if (requestedQuantity > currentStock) {
        throw new Error(
          `Insufficient stock for purchase item ${purchaseItemId}. ` +
          `Current stock: ${currentStock}`
        );
      }

      const rate = Number(
        purchaseItem.rate
      );

      const amount =
        requestedQuantity * rate;

      totalAmount += amount;

      validatedItems.push({
        purchase_item_id: purchaseItemId,
        variant_id: purchaseItem.variant_id,
        quantity: requestedQuantity,
        rate,
        amount,
      });
    }

    /*
    ========================================================
    CREATE RETURN HEADER
    ========================================================
    */

    const [returnResult] =
      await connection.query(
        `
        INSERT INTO purchase_returns
        (
          purchase_id,
          supplier_name,
          return_date,
          total_amount,
          remarks,
          status,
          created_by
        )
        VALUES
        (?, ?, ?, ?, ?, 'DRAFT', ?)
        `,
        [
          purchase_id,
          purchase.supplier_name,
          return_date || null,
          totalAmount,
          remarks || null,
          req.user?.id || null,
        ]
      );

    const returnId =
      returnResult.insertId;

    /*
    ========================================================
    CREATE RETURN ITEMS
    ========================================================
    */

    for (const item of validatedItems) {
      await connection.query(
        `
        INSERT INTO purchase_return_items
        (
          purchase_return_id,
          purchase_item_id,
          variant_id,
          quantity,
          rate,
          amount
        )
        VALUES
        (?, ?, ?, ?, ?, ?)
        `,
        [
          returnId,
          item.purchase_item_id,
          item.variant_id,
          item.quantity,
          item.rate,
          item.amount,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        "Purchase return created successfully",
      data: {
        id: returnId,
        purchase_id,
        total_amount: totalAmount,
        status: "DRAFT",
      },
    });

  } catch (error) {
    await connection.rollback();

    console.error(
      "Create purchase return error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create purchase return",
    });

  } finally {
    connection.release();
  }
};


/*
============================================================
COMPLETE PURCHASE RETURN
============================================================
*/

const completePurchaseReturn = async (
  req,
  res
) => {
  const returnId = Number(req.params.id);

  if (!returnId) {
    return res.status(400).json({
      success: false,
      message: "Invalid purchase return ID",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
    ========================================================
    GET RETURN
    ========================================================
    */

    const [returns] =
      await connection.query(
        `
        SELECT *
        FROM purchase_returns
        WHERE id = ?
        FOR UPDATE
        `,
        [returnId]
      );

    if (!returns.length) {
      throw new Error(
        "Purchase return not found"
      );
    }

    const purchaseReturn =
      returns[0];

    if (
      purchaseReturn.status !==
      "DRAFT"
    ) {
      throw new Error(
        `Purchase return is already ${purchaseReturn.status}`
      );
    }

    /*
    ========================================================
    GET RETURN ITEMS
    ========================================================
    */

    const [items] =
      await connection.query(
        `
        SELECT *
        FROM purchase_return_items
        WHERE purchase_return_id = ?
        `,
        [returnId]
      );

    if (!items.length) {
      throw new Error(
        "Purchase return has no items"
      );
    }

    /*
    ========================================================
    PROCESS ITEMS
    ========================================================
    */

    for (const item of items) {
      /*
      ------------------------------------------------------
      LOCK VARIANT
      ------------------------------------------------------
      */

      const [variants] =
        await connection.query(
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

      const currentStock =
        Number(
          variants[0].current_stock
        );

      const returnQuantity =
        Number(item.quantity);

      /*
      ------------------------------------------------------
      STOCK VALIDATION
      ------------------------------------------------------
      */

      if (
        returnQuantity >
        currentStock
      ) {
        throw new Error(
          `Insufficient stock for variant ${item.variant_id}`
        );
      }

      /*
      ------------------------------------------------------
      DECREASE STOCK
      ------------------------------------------------------
      */

      await connection.query(
        `
        UPDATE product_variants
        SET current_stock =
          current_stock - ?
        WHERE id = ?
        `,
        [
          returnQuantity,
          item.variant_id,
        ]
      );

      /*
      ------------------------------------------------------
      STOCK TRANSACTION
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
          'PURCHASE_RETURN',
          'PURCHASE_RETURN',
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
          returnId,
          returnQuantity,
          item.rate,
          `Purchase Return #${returnId}`,
          req.user?.id || null,
        ]
      );
    }

    /*
    ========================================================
    MARK RETURN COMPLETED
    ========================================================
    */

    await connection.query(
      `
      UPDATE purchase_returns
      SET
        status = 'COMPLETED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [returnId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Purchase return completed and stock updated successfully",
      data: {
        id: returnId,
        status: "COMPLETED",
      },
    });

  } catch (error) {
    await connection.rollback();

    console.error(
      "Complete purchase return error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to complete purchase return",
    });

  } finally {
    connection.release();
  }
};


/*
============================================================
GET PURCHASE RETURNS
============================================================
*/

const getPurchaseReturns = async (
  req,
  res
) => {
  try {
    const [rows] =
      await pool.query(`
        SELECT
          pr.id,
          pr.purchase_id,
          pr.supplier_name,
          pr.return_date,
          pr.total_amount,
          pr.remarks,
          pr.status,
          pr.created_at,

          p.invoice_number

        FROM purchase_returns pr

        LEFT JOIN purchases p
          ON p.id = pr.purchase_id

        ORDER BY pr.id DESC
      `);

    return res.json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error(
      "Get purchase returns error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load purchase returns",
    });
  }
};


module.exports = {
  getPurchasesForReturn,
  getPurchaseItemsForReturn,
  createPurchaseReturn,
  completePurchaseReturn,
  getPurchaseReturns,
};