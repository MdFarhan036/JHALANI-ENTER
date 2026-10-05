const { pool } = require("../db");

/* ============================================================
   GENERATE DISPATCH NUMBER
============================================================ */

const generateDispatchNo = async (connection) => {
  const [rows] = await connection.query(`
    SELECT dispatch_no
    FROM dispatches
    ORDER BY id DESC
    LIMIT 1
  `);

  let nextNumber = 1;

  if (
    rows.length > 0 &&
    rows[0].dispatch_no
  ) {
    const match =
      rows[0].dispatch_no.match(
        /(\d+)$/
      );

    if (match) {
      nextNumber =
        parseInt(match[1], 10) + 1;
    }
  }

  return `DISP-${String(
    nextNumber
  ).padStart(5, "0")}`;
};

/* ============================================================
   GET ALL DISPATCHES
============================================================ */

exports.getDispatches = async (
  req,
  res
) => {
  try {
    const [rows] =
      await pool.query(`
        SELECT
          d.id,
          d.dispatch_no,
          d.order_id,
          d.party_id,
          d.dispatch_date,
          d.delivery_address,
          d.transporter_name,
          d.vehicle_number,
          d.lr_gr_number,
          d.lr_gr_date,
          d.eway_bill_number,
          d.dispatch_by,
          d.remarks,
          d.status,
          d.created_at,

          o.order_no,

          p.party_code,
          p.name AS party_name,
          p.mobile AS party_mobile

        FROM dispatches d

        LEFT JOIN orders o
          ON o.id = d.order_id

        LEFT JOIN parties p
          ON p.id = d.party_id

        ORDER BY d.id DESC
      `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Get dispatches error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dispatches",
      error: error.message,
    });
  }
};

/* ============================================================
   GET SINGLE DISPATCH
============================================================ */

exports.getDispatchById = async (
  req,
  res
) => {
  const { id } = req.params;

  try {
    const [dispatchRows] =
      await pool.query(
        `
        SELECT
          d.*,
          o.order_no,
          p.party_code,
          p.name AS party_name,
          p.mobile AS party_mobile

        FROM dispatches d

        LEFT JOIN orders o
          ON o.id = d.order_id

        LEFT JOIN parties p
          ON p.id = d.party_id

        WHERE d.id = ?
        `,
        [id]
      );

    if (!dispatchRows.length) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    const [itemRows] =
      await pool.query(
        `
        SELECT
          di.id,
          di.dispatch_id,
          di.order_item_id,
          di.variant_id,
          di.quantity,
          di.description,

          oi.ordered_quantity,
          oi.dispatched_quantity,
          oi.pending_quantity,
          oi.rate,

          pv.sku,
          pv.variant_name,

          pr.product_name

        FROM dispatch_items di

        LEFT JOIN order_items oi
          ON oi.id = di.order_item_id

        LEFT JOIN product_variants pv
          ON pv.id = di.variant_id

        LEFT JOIN products pr
          ON pr.id = pv.product_id

        WHERE di.dispatch_id = ?

        ORDER BY di.id ASC
        `,
        [id]
      );

    res.json({
      success: true,
      data: {
        ...dispatchRows[0],
        items: itemRows,
      },
    });
  } catch (error) {
    console.error(
      "Get dispatch error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dispatch",
      error: error.message,
    });
  }
};

/* ============================================================
   GET ORDERS HAVING PENDING QUANTITY
============================================================ */

exports.getPendingOrders = async (
  req,
  res
) => {
  try {
    const [rows] =
      await pool.query(`
        SELECT
          o.id,
          o.order_no,
          o.party_id,
          o.po_number,
          o.po_date,
          o.order_date,
          o.delivery_address,
          o.status,
          o.total_quantity,
          o.total_amount,

          p.party_code,
          p.name AS party_name,
          p.mobile AS party_mobile

        FROM orders o

        LEFT JOIN parties p
          ON p.id = o.party_id

        WHERE
          o.status IN (
            'CONFIRMED',
            'PARTIALLY_DISPATCHED'
          )

          AND EXISTS (
            SELECT 1
            FROM order_items oi
            WHERE oi.order_id = o.id
              AND oi.pending_quantity > 0
          )

        ORDER BY o.id DESC
      `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Get pending orders error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch pending orders",
      error: error.message,
    });
  }
};

/* ============================================================
   GET PENDING ITEMS FOR ORDER
============================================================ */

exports.getPendingOrderItems =
  async (req, res) => {
    const { orderId } =
      req.params;

    try {
      const [rows] =
        await pool.query(
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
            oi.amount,

            pv.sku,
            pv.variant_name,
            pv.pack_size,
            pv.current_stock,
            pv.sale_rate,
            pv.mrp,

            pr.id AS product_id,
            pr.product_name,

            u.id AS unit_id,
            u.name AS unit_name

          FROM order_items oi

          INNER JOIN product_variants pv
            ON pv.id = oi.variant_id

          INNER JOIN products pr
            ON pr.id = pv.product_id

          LEFT JOIN units u
            ON u.id = pv.unit_id

          WHERE
            oi.order_id = ?
            AND oi.pending_quantity > 0

          ORDER BY oi.id ASC
          `,
          [orderId]
        );

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error(
        "Get pending order items error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch pending order items",
        error: error.message,
      });
    }
  };

/* ============================================================
   CREATE DISPATCH
============================================================ */

exports.createDispatch = async (
  req,
  res
) => {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      order_id,
      dispatch_date,
      delivery_address,
      transporter_name,
      vehicle_number,
      lr_gr_number,
      lr_gr_date,
      eway_bill_number,
      dispatch_by,
      remarks,
      items,
    } = req.body;

    /* --------------------------------------------------------
       BASIC VALIDATION
    -------------------------------------------------------- */

    if (!order_id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Order is required",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "At least one dispatch item is required",
      });
    }

    /* --------------------------------------------------------
       GET ORDER
    -------------------------------------------------------- */

    const [orderRows] =
      await connection.query(
        `
        SELECT *
        FROM orders
        WHERE id = ?
        FOR UPDATE
        `,
        [order_id]
      );

    if (!orderRows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order =
      orderRows[0];

    /* --------------------------------------------------------
       ORDER STATUS VALIDATION
    -------------------------------------------------------- */

    if (
      ![
        "CONFIRMED",
        "PARTIALLY_DISPATCHED",
      ].includes(order.status)
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Only confirmed or partially dispatched orders can be dispatched",
      });
    }

    /* --------------------------------------------------------
       PARTY
    -------------------------------------------------------- */

    const [partyRows] =
      await connection.query(
        `
        SELECT *
        FROM parties
        WHERE id = ?
        LIMIT 1
        `,
        [order.party_id]
      );

    if (!partyRows.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Party not found",
      });
    }

    const party =
      partyRows[0];

    /* --------------------------------------------------------
       GENERATE DISPATCH NUMBER
    -------------------------------------------------------- */

    const dispatchNo =
      await generateDispatchNo(
        connection
      );

    /* --------------------------------------------------------
       CREATE DISPATCH HEADER
    -------------------------------------------------------- */

    const [dispatchResult] =
      await connection.query(
        `
        INSERT INTO dispatches
        (
          dispatch_no,
          order_id,
          party_id,
          dispatch_date,
          delivery_address,
          transporter_name,
          vehicle_number,
          lr_gr_number,
          lr_gr_date,
          eway_bill_number,
          dispatch_by,
          remarks,
          status,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISPATCHED', ?)
        `,
        [
          dispatchNo,

          order.id,

          order.party_id,

          dispatch_date ||
            new Date(),

          delivery_address ||
            order.delivery_address ||
            party.delivery_address ||
            null,

          transporter_name ||
            null,

          vehicle_number ||
            null,

          lr_gr_number ||
            null,

          lr_gr_date ||
            null,

          eway_bill_number ||
            null,

          dispatch_by ||
            null,

          remarks ||
            null,

          req.user?.id ||
            null,
        ]
      );

    const dispatchId =
      dispatchResult.insertId;

    /* --------------------------------------------------------
       PROCESS ITEMS
    -------------------------------------------------------- */

    let totalDispatchQuantity = 0;

    for (const item of items) {
      const orderItemId =
        Number(
          item.order_item_id
        );

      const quantity =
        Number(item.quantity);

      /* ------------------------------------------------------
         VALIDATE ITEM
      ------------------------------------------------------ */

      if (
        !orderItemId ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          "Invalid dispatch item or quantity"
        );
      }

      /* ------------------------------------------------------
         LOCK ORDER ITEM
      ------------------------------------------------------ */

      const [orderItemRows] =
        await connection.query(
          `
          SELECT *
          FROM order_items
          WHERE id = ?
            AND order_id = ?
          FOR UPDATE
          `,
          [
            orderItemId,
            order.id,
          ]
        );

      if (
        !orderItemRows.length
      ) {
        throw new Error(
          `Order item ${orderItemId} not found`
        );
      }

      const orderItem =
        orderItemRows[0];

      /* ------------------------------------------------------
         VALIDATE PENDING
      ------------------------------------------------------ */

      if (
        quantity >
        Number(
          orderItem.pending_quantity
        )
      ) {
        throw new Error(
          `Dispatch quantity for order item ${orderItemId} cannot exceed pending quantity ${orderItem.pending_quantity}`
        );
      }

      /* ------------------------------------------------------
         LOCK VARIANT
      ------------------------------------------------------ */

      const [variantRows] =
        await connection.query(
          `
          SELECT *
          FROM product_variants
          WHERE id = ?
          FOR UPDATE
          `,
          [orderItem.variant_id]
        );

      if (
        !variantRows.length
      ) {
        throw new Error(
          `Product variant ${orderItem.variant_id} not found`
        );
      }

      const variant =
        variantRows[0];

      /* ------------------------------------------------------
         VALIDATE STOCK
      ------------------------------------------------------ */

      if (
        quantity >
        Number(
          variant.current_stock
        )
      ) {
        throw new Error(
          `Insufficient stock for SKU ${variant.sku}. Available stock: ${variant.current_stock}`
        );
      }

      /* ------------------------------------------------------
         INSERT DISPATCH ITEM
      ------------------------------------------------------ */

      await connection.query(
        `
        INSERT INTO dispatch_items
        (
          dispatch_id,
          order_item_id,
          variant_id,
          quantity,
          description
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          dispatchId,

          orderItem.id,

          orderItem.variant_id,

          quantity,

          item.description ||
            orderItem.description ||
            null,
        ]
      );

      /* ------------------------------------------------------
         UPDATE ORDER ITEM
      ------------------------------------------------------ */

      await connection.query(
        `
        UPDATE order_items
        SET
          dispatched_quantity =
            dispatched_quantity + ?,

          pending_quantity =
            pending_quantity - ?

        WHERE id = ?
        `,
        [
          quantity,
          quantity,
          orderItem.id,
        ]
      );

      /* ------------------------------------------------------
         DEDUCT STOCK
      ------------------------------------------------------ */

      await connection.query(
        `
        UPDATE product_variants
        SET
          current_stock =
            current_stock - ?

        WHERE id = ?
        `,
        [
          quantity,
          variant.id,
        ]
      );

      totalDispatchQuantity +=
        quantity;
    }

    /* --------------------------------------------------------
       CHECK REMAINING PENDENCY
    -------------------------------------------------------- */

    const [pendingRows] =
      await connection.query(
        `
        SELECT
          COALESCE(
            SUM(pending_quantity),
            0
          ) AS pending_quantity

        FROM order_items

        WHERE order_id = ?
        `,
        [order.id]
      );

    const pendingQuantity =
      Number(
        pendingRows[0]
          .pending_quantity || 0
      );

    /* --------------------------------------------------------
       UPDATE ORDER STATUS
    -------------------------------------------------------- */

    let orderStatus;

    if (
      pendingQuantity <= 0
    ) {
      orderStatus =
        "FULLY_DISPATCHED";
    } else {
      orderStatus =
        "PARTIALLY_DISPATCHED";
    }

    await connection.query(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [
        orderStatus,
        order.id,
      ]
    );

    /* --------------------------------------------------------
       COMMIT
    -------------------------------------------------------- */

    await connection.commit();

    res.status(201).json({
      success: true,

      message:
        "Sales dispatch created successfully",

      data: {
        id: dispatchId,

        dispatch_no:
          dispatchNo,

        order_id:
          order.id,

        order_no:
          order.order_no,

        party_id:
          order.party_id,

        party_name:
          party.name,

        total_dispatch_quantity:
          totalDispatchQuantity,

        pending_quantity:
          pendingQuantity,

        order_status:
          orderStatus,
      },
    });

  } catch (error) {
    await connection.rollback();

    console.error(
      "Create dispatch error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create dispatch",
    });

  } finally {
    connection.release();
  }
};

/* ============================================================
   UPDATE DISPATCH STATUS
============================================================ */

exports.updateDispatchStatus =
  async (req, res) => {
    const { id } =
      req.params;

    const { status } =
      req.body;
const allowedStatuses = [
  "DRAFT",
  "READY",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
];
    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid dispatch status",
      });
    }

    try {
      const [result] =
        await pool.query(
          `
          UPDATE dispatches
          SET status = ?
          WHERE id = ?
          `,
          [
            status,
            id,
          ]
        );

      if (
        !result.affectedRows
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Dispatch not found",
        });
      }

      res.json({
        success: true,
        message:
          "Dispatch status updated successfully",
      });

    } catch (error) {
      console.error(
        "Update dispatch status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update dispatch status",
        error:
          error.message,
      });
    }
  };