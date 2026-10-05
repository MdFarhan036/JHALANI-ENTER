const { pool } = require("../db");

/*
============================================================
GENERATE RETURN NUMBER
============================================================
*/

const generateReturnNo = async (connection) => {
  const [rows] = await connection.query(`
    SELECT return_no
    FROM sales_returns
    ORDER BY id DESC
    LIMIT 1
  `);

  let nextNumber = 1;

  if (rows.length > 0 && rows[0].return_no) {
    const match = rows[0].return_no.match(/(\d+)$/);

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `SR-${String(nextNumber).padStart(5, "0")}`;
};


/*
============================================================
GET SALES RETURNS
============================================================
*/

exports.getSalesReturns = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        sr.id,
        sr.return_no,
        sr.order_id,
        sr.party_id,
        sr.return_date,
        sr.total_amount,
        sr.reason,
        sr.remarks,
        sr.status,
        sr.created_by,
        sr.created_at,
        sr.updated_at,

        o.order_no,

        p.name AS party_name,
        p.mobile AS party_mobile

      FROM sales_returns sr

      LEFT JOIN orders o
        ON o.id = sr.order_id

      LEFT JOIN parties p
        ON p.id = sr.party_id

      ORDER BY sr.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Get sales returns error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch sales returns.",
      error: error.message,
    });
  }
};


/*
============================================================
GET SINGLE SALES RETURN
============================================================
*/

exports.getSalesReturnById = async (req, res) => {
  const { id } = req.params;

  try {
    const [returns] = await pool.query(
      `
      SELECT
        sr.*,
        o.order_no,
        p.name AS party_name,
        p.mobile AS party_mobile,
        p.delivery_address AS party_delivery_address

      FROM sales_returns sr

      LEFT JOIN orders o
        ON o.id = sr.order_id

      LEFT JOIN parties p
        ON p.id = sr.party_id

      WHERE sr.id = ?
      `,
      [id]
    );

    if (returns.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sales return not found.",
      });
    }

    const [items] = await pool.query(
      `
      SELECT
        sri.id,
        sri.sales_return_id,
        sri.order_item_id,
        sri.dispatch_item_id,
        sri.variant_id,
        sri.quantity,
        sri.rate,
        sri.amount,
        sri.reason,

        oi.description AS order_item_description,
        oi.ordered_quantity,
        oi.dispatched_quantity,
        oi.pending_quantity,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pr.product_name

      FROM sales_return_items sri

      LEFT JOIN order_items oi
        ON oi.id = sri.order_item_id

      LEFT JOIN product_variants pv
        ON pv.id = sri.variant_id

      LEFT JOIN products pr
        ON pr.id = pv.product_id

      WHERE sri.sales_return_id = ?

      ORDER BY sri.id ASC
      `,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...returns[0],
        items,
      },
    });
  } catch (error) {
    console.error(
      "Get sales return details error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch sales return details.",
      error: error.message,
    });
  }
};


/*
============================================================
GET ORDERS AVAILABLE FOR RETURN
============================================================
*/

exports.getReturnableOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        o.id,
        o.order_no,
        o.order_date,
        o.party_id,
        o.delivery_address,
        o.status,
        o.total_quantity,
        o.total_amount,

        p.name AS party_name,
        p.mobile AS party_mobile

      FROM orders o

      INNER JOIN parties p
        ON p.id = o.party_id

      WHERE o.status IN (
        'PARTIALLY_DISPATCHED',
        'FULLY_DISPATCHED'
      )

      ORDER BY o.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Get returnable orders error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch returnable orders.",
      error: error.message,
    });
  }
};


/*
============================================================
GET RETURNABLE ITEMS FOR ORDER
============================================================
*/

exports.getReturnableOrderItems = async (
  req,
  res
) => {
  const { orderId } = req.params;

  try {
    /*
    --------------------------------------------------------
    Get order items and calculate already returned quantity
    --------------------------------------------------------
    */

    const [rows] = await pool.query(
      `
      SELECT
        oi.id AS order_item_id,
        oi.order_id,
        oi.variant_id,

        oi.description,

        oi.ordered_quantity,
        oi.dispatched_quantity,
        oi.pending_quantity,

        oi.rate,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pr.product_name,

        COALESCE(
          (
            SELECT SUM(sri.quantity)
            FROM sales_return_items sri

            INNER JOIN sales_returns sr
              ON sr.id = sri.sales_return_id

            WHERE sri.order_item_id = oi.id
              AND sr.status = 'COMPLETED'
          ),
          0
        ) AS returned_quantity

      FROM order_items oi

      INNER JOIN product_variants pv
        ON pv.id = oi.variant_id

      INNER JOIN products pr
        ON pr.id = pv.product_id

      WHERE oi.order_id = ?

      ORDER BY oi.id ASC
      `,
      [orderId]
    );

    const items = rows.map((item) => {
      const dispatched =
        Number(item.dispatched_quantity) || 0;

      const returned =
        Number(item.returned_quantity) || 0;

      const available =
        Math.max(dispatched - returned, 0);

      return {
        ...item,

        dispatched_quantity: dispatched,
        returned_quantity: returned,
        available_return_quantity: available,

        rate: Number(item.rate) || 0,
      };
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error(
      "Get returnable items error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch returnable order items.",
      error: error.message,
    });
  }
};


/*
============================================================
CREATE SALES RETURN
============================================================
*/

exports.createSalesReturn = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      order_id,
      party_id,
      return_date,
      reason,
      remarks,
      status = "DRAFT",
      items = [],
    } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order is required.",
      });
    }

    if (!party_id) {
      return res.status(400).json({
        success: false,
        message: "Party is required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one return item is required.",
      });
    }

    await connection.beginTransaction();

    /*
    --------------------------------------------------------
    Verify order
    --------------------------------------------------------
    */

    const [orders] = await connection.query(
      `
      SELECT
        id,
        party_id,
        status
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [order_id]
    );

    if (orders.length === 0) {
      throw new Error("Order not found.");
    }

    if (Number(orders[0].party_id) !== Number(party_id)) {
      throw new Error(
        "Selected party does not belong to this order."
      );
    }

    if (
      ![
        "PARTIALLY_DISPATCHED",
        "FULLY_DISPATCHED",
      ].includes(orders[0].status)
    ) {
      throw new Error(
        "This order is not eligible for sales return."
      );
    }

    /*
    --------------------------------------------------------
    Generate return number
    --------------------------------------------------------
    */

    const returnNo =
      await generateReturnNo(connection);

    /*
    --------------------------------------------------------
    Validate items
    --------------------------------------------------------
    */

    let totalAmount = 0;

    const validatedItems = [];

    for (const item of items) {
      const orderItemId =
        Number(item.order_item_id);

      const quantity =
        Number(item.quantity);

      if (!orderItemId) {
        throw new Error(
          "Invalid order item."
        );
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          "Return quantity must be greater than zero."
        );
      }

      /*
      ------------------------------------------------------
      Lock order item
      ------------------------------------------------------
      */

      const [orderItems] =
        await connection.query(
          `
          SELECT
            id,
            order_id,
            variant_id,
            rate,
            dispatched_quantity

          FROM order_items

          WHERE id = ?
            AND order_id = ?

          FOR UPDATE
          `,
          [orderItemId, order_id]
        );

      if (orderItems.length === 0) {
        throw new Error(
          `Order item ${orderItemId} not found.`
        );
      }

      const orderItem = orderItems[0];

      /*
      ------------------------------------------------------
      Already completed returns
      ------------------------------------------------------
      */

      const [returnedRows] =
        await connection.query(
          `
          SELECT
            COALESCE(
              SUM(quantity),
              0
            ) AS returned_quantity

          FROM sales_return_items sri

          INNER JOIN sales_returns sr
            ON sr.id = sri.sales_return_id

          WHERE sri.order_item_id = ?
            AND sr.status = 'COMPLETED'
          `,
          [orderItemId]
        );

      const alreadyReturned =
        Number(
          returnedRows[0].returned_quantity
        ) || 0;

      const dispatchedQuantity =
        Number(
          orderItem.dispatched_quantity
        ) || 0;

      const availableQuantity =
        Math.max(
          dispatchedQuantity -
            alreadyReturned,
          0
        );

      if (quantity > availableQuantity) {
        throw new Error(
          `Return quantity for item ${orderItemId} cannot exceed available return quantity (${availableQuantity}).`
        );
      }

      /*
      ------------------------------------------------------
      Find optional dispatch item
      ------------------------------------------------------
      */

      let dispatchItemId =
        item.dispatch_item_id || null;

      if (dispatchItemId) {
        const [dispatchItems] =
          await connection.query(
            `
            SELECT id
            FROM dispatch_items
            WHERE id = ?
              AND order_item_id = ?
              AND variant_id = ?
            `,
            [
              dispatchItemId,
              orderItemId,
              orderItem.variant_id,
            ]
          );

        if (dispatchItems.length === 0) {
          throw new Error(
            `Invalid dispatch item for order item ${orderItemId}.`
          );
        }
      }

      const rate =
        Number(item.rate ?? orderItem.rate) || 0;

      const amount =
        Number(
          (quantity * rate).toFixed(2)
        );

      totalAmount += amount;

      validatedItems.push({
        orderItemId,
        dispatchItemId,
        variantId: orderItem.variant_id,
        quantity,
        rate,
        amount,
        reason: item.reason || null,
      });
    }

    /*
    --------------------------------------------------------
    Insert return header
    --------------------------------------------------------
    */

    const [returnResult] =
      await connection.query(
        `
        INSERT INTO sales_returns
        (
          return_no,
          order_id,
          party_id,
          return_date,
          total_amount,
          reason,
          remarks,
          status,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          returnNo,
          order_id,
          party_id,
          return_date || null,
          Number(totalAmount.toFixed(2)),
          reason || null,
          remarks || null,
          status,
          req.user?.id || null,
        ]
      );

    const salesReturnId =
      returnResult.insertId;

    /*
    --------------------------------------------------------
    Insert return items
    --------------------------------------------------------
    */

    for (const item of validatedItems) {
      await connection.query(
        `
        INSERT INTO sales_return_items
        (
          sales_return_id,
          order_item_id,
          dispatch_item_id,
          variant_id,
          quantity,
          rate,
          amount,
          reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          salesReturnId,
          item.orderItemId,
          item.dispatchItemId,
          item.variantId,
          item.quantity,
          item.rate,
          item.amount,
          item.reason,
        ]
      );
    }

    /*
    --------------------------------------------------------
    If created directly as COMPLETED,
    apply stock immediately.
    --------------------------------------------------------
    */

    if (status === "COMPLETED") {
      await completeReturnTransaction(
        connection,
        salesReturnId
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message:
        status === "COMPLETED"
          ? "Sales return completed successfully."
          : "Sales return created successfully.",
      data: {
        id: salesReturnId,
        return_no: returnNo,
        total_amount:
          Number(totalAmount.toFixed(2)),
        status,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Create sales return error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create sales return.",
    });
  } finally {
    connection.release();
  }
};


/*
============================================================
COMPLETE SALES RETURN
============================================================
*/

const completeReturnTransaction = async (
  connection,
  salesReturnId
) => {
  /*
  ----------------------------------------------------------
  Lock return
  ----------------------------------------------------------
  */

  const [returns] =
    await connection.query(
      `
      SELECT *
      FROM sales_returns
      WHERE id = ?
      FOR UPDATE
      `,
      [salesReturnId]
    );

  if (returns.length === 0) {
    throw new Error(
      "Sales return not found."
    );
  }

  const salesReturn = returns[0];

  if (salesReturn.status === "COMPLETED") {
    throw new Error(
      "Sales return is already completed."
    );
  }

  if (salesReturn.status === "CANCELLED") {
    throw new Error(
      "Cancelled sales return cannot be completed."
    );
  }

  /*
  ----------------------------------------------------------
  Get items
  ----------------------------------------------------------
  */

  const [items] =
    await connection.query(
      `
      SELECT
        sri.*,
        pv.current_stock,
        oi.dispatched_quantity

      FROM sales_return_items sri

      INNER JOIN product_variants pv
        ON pv.id = sri.variant_id

      INNER JOIN order_items oi
        ON oi.id = sri.order_item_id

      WHERE sri.sales_return_id = ?

      FOR UPDATE
      `,
      [salesReturnId]
    );

  if (items.length === 0) {
    throw new Error(
      "Sales return has no items."
    );
  }

  /*
  ----------------------------------------------------------
  Process every item
  ----------------------------------------------------------
  */

  for (const item of items) {
    const quantity =
      Number(item.quantity) || 0;

    if (quantity <= 0) {
      throw new Error(
        "Invalid return quantity."
      );
    }

    /*
    --------------------------------------------------------
    Re-check already returned quantity
    --------------------------------------------------------
    */

    const [returnedRows] =
      await connection.query(
        `
        SELECT
          COALESCE(
            SUM(quantity),
            0
          ) AS returned_quantity

        FROM sales_return_items sri

        INNER JOIN sales_returns sr
          ON sr.id = sri.sales_return_id

        WHERE sri.order_item_id = ?
          AND sr.status = 'COMPLETED'
          AND sr.id <> ?
        `,
        [
          item.order_item_id,
          salesReturnId,
        ]
      );

    const alreadyReturned =
      Number(
        returnedRows[0].returned_quantity
      ) || 0;

    const dispatched =
      Number(
        item.dispatched_quantity
      ) || 0;

    const available =
      Math.max(
        dispatched - alreadyReturned,
        0
      );

    if (quantity > available) {
      throw new Error(
        `Return quantity exceeds available quantity for order item ${item.order_item_id}.`
      );
    }

    /*
    --------------------------------------------------------
    Increase stock
    --------------------------------------------------------
    */

    await connection.query(
      `
      UPDATE product_variants
      SET current_stock =
        current_stock + ?
      WHERE id = ?
      `,
      [
        quantity,
        item.variant_id,
      ]
    );

    /*
    --------------------------------------------------------
    Create stock transaction
    --------------------------------------------------------
    
    The controller checks the columns dynamically so
    this module does not assume extra stock fields that
    may not exist in your current table.
    */

    const [stockColumns] =
      await connection.query(
        `
        SHOW COLUMNS FROM stock_transactions
        `
      );

    const columnNames =
      stockColumns.map(
        (column) => column.Field
      );

    const insertColumns = [];
    const insertValues = [];
    const placeholders = [];

    const addColumn = (
      column,
      value
    ) => {
      if (columnNames.includes(column)) {
        insertColumns.push(column);
        insertValues.push(value);
        placeholders.push("?");
      }
    };

    addColumn(
      "variant_id",
      item.variant_id
    );

    addColumn(
      "quantity",
      quantity
    );

    addColumn(
      "transaction_type",
      "RETURN_IN"
    );

    addColumn(
      "reference_id",
      salesReturnId
    );

    addColumn(
      "reference_type",
      "SALES_RETURN"
    );

    addColumn(
      "remarks",
      `Sales Return ${salesReturn.return_no}`
    );

    addColumn(
      "created_by",
      salesReturn.created_by
    );

    if (insertColumns.length > 0) {
      await connection.query(
        `
        INSERT INTO stock_transactions
        (${insertColumns.join(", ")})
        VALUES (${placeholders.join(", ")})
        `,
        insertValues
      );
    }
  }

  /*
  ----------------------------------------------------------
  Mark completed
  ----------------------------------------------------------
  */

  await connection.query(
    `
    UPDATE sales_returns
    SET status = 'COMPLETED'
    WHERE id = ?
    `,
    [salesReturnId]
  );
};


/*
============================================================
COMPLETE ENDPOINT
============================================================
*/

exports.completeSalesReturn = async (
  req,
  res
) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    await completeReturnTransaction(
      connection,
      id
    );

    await connection.commit();

    res.json({
      success: true,
      message:
        "Sales return completed successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Complete sales return error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to complete sales return.",
    });
  } finally {
    connection.release();
  }
};


/*
============================================================
CANCEL SALES RETURN
============================================================
*/

exports.cancelSalesReturn = async (
  req,
  res
) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
        SELECT id, status
        FROM sales_returns
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

    if (rows.length === 0) {
      throw new Error(
        "Sales return not found."
      );
    }

    if (rows[0].status === "COMPLETED") {
      throw new Error(
        "Completed sales return cannot be cancelled."
      );
    }

    if (rows[0].status === "CANCELLED") {
      throw new Error(
        "Sales return is already cancelled."
      );
    }

    await connection.query(
      `
      UPDATE sales_returns
      SET status = 'CANCELLED'
      WHERE id = ?
      `,
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message:
        "Sales return cancelled successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Cancel sales return error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to cancel sales return.",
    });
  } finally {
    connection.release();
  }
};


/*
============================================================
UPDATE DRAFT SALES RETURN
============================================================
*/

exports.updateSalesReturn = async (
  req,
  res
) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const {
      return_date,
      reason,
      remarks,
    } = req.body;

    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
        SELECT id, status
        FROM sales_returns
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

    if (rows.length === 0) {
      throw new Error(
        "Sales return not found."
      );
    }

    if (rows[0].status !== "DRAFT") {
      throw new Error(
        "Only draft sales returns can be edited."
      );
    }

    await connection.query(
      `
      UPDATE sales_returns
      SET
        return_date = COALESCE(
          ?,
          return_date
        ),
        reason = ?,
        remarks = ?
      WHERE id = ?
      `,
      [
        return_date || null,
        reason || null,
        remarks || null,
        id,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message:
        "Sales return updated successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Update sales return error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update sales return.",
    });
  } finally {
    connection.release();
  }
};