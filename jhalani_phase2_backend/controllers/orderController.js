const { pool } = require("../db");


const ORDER_SOURCES = [
  "PARTY_ORDER",
  "COMPANY_CREATED",
];

const ORDER_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "PARTIALLY_DISPATCHED",
  "FULLY_DISPATCHED",
  "CANCELLED",
  "CLOSED",
];

/*
============================================================
HELPERS
============================================================
*/

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?.user_id ||
    req.user?.userId ||
    null
  );
};

const normalizeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const generateOrderNumber = async (
  connection
) => {
  const [rows] = await connection.query(
    `
    SELECT order_no
    FROM orders
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
    `
  );

  let nextNumber = 1;

  if (rows.length > 0 && rows[0].order_no) {
    const match =
      String(rows[0].order_no).match(
        /(\d+)$/
      );

    if (match) {
      nextNumber =
        Number(match[1]) + 1;
    }
  }

  return `ORD-${String(
    nextNumber
  ).padStart(5, "0")}`;
};

/*
============================================================
GET ORDERS
============================================================

GET /api/orders

Query parameters:

search
status
order_source
party_id
page
limit

============================================================
*/

const getOrders = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      status = "",
      order_source = "",
      party_id = "",
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const offset =
      (currentPage - 1) * perPage;

    const conditions = [];
    const params = [];

    /*
    ----------------------------------------------------------
    SEARCH
    ----------------------------------------------------------
    */

    if (search.trim()) {
      const searchValue =
        `%${search.trim()}%`;

      conditions.push(`
        (
          o.order_no LIKE ?
          OR o.po_number LIKE ?
          OR o.reference_number LIKE ?
          OR p.name LIKE ?
          OR p.party_code LIKE ?
        )
      `);

      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    /*
    ----------------------------------------------------------
    STATUS
    ----------------------------------------------------------
    */

    if (status) {
      if (
        !ORDER_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status",
          valid_statuses:
            ORDER_STATUSES,
        });
      }

      conditions.push(
        "o.status = ?"
      );

      params.push(status);
    }

    /*
    ----------------------------------------------------------
    ORDER SOURCE
    ----------------------------------------------------------
    */

    if (order_source) {
      if (
        !ORDER_SOURCES.includes(
          order_source
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order source",
          valid_sources:
            ORDER_SOURCES,
        });
      }

      conditions.push(
        "o.order_source = ?"
      );

      params.push(order_source);
    }

    /*
    ----------------------------------------------------------
    PARTY
    ----------------------------------------------------------
    */

    if (party_id) {
      conditions.push(
        "o.party_id = ?"
      );

      params.push(
        Number(party_id)
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    /*
    ----------------------------------------------------------
    COUNT
    ----------------------------------------------------------
    */

    const [countRows] =
      await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM orders o
        LEFT JOIN parties p
          ON p.id = o.party_id
        ${whereClause}
        `,
        params
      );

    const total =
      Number(
        countRows[0]?.total || 0
      );

    /*
    ----------------------------------------------------------
    ORDERS
    ----------------------------------------------------------
    */

    const [orders] =
      await pool.query(
        `
        SELECT
          o.id,
          o.order_no,
          o.party_id,

          o.order_source,

          o.po_number,
          o.po_date,
          o.order_date,
          o.reference_number,

          o.delivery_address,
          o.delivery_contact_person,
          o.delivery_contact_number,
          o.delivery_instructions,

          o.remarks,
          o.status,

          o.total_quantity,
          o.total_amount,

          o.created_by,
          o.created_at,

          o.updated_by,
          o.updated_at,

          p.name AS party_name,
          p.party_code,

          COALESCE(
            SUM(
              oi.pending_quantity
            ),
            0
          ) AS pending_quantity,

          COALESCE(
            SUM(
              oi.dispatched_quantity
            ),
            0
          ) AS dispatched_quantity

        FROM orders o

        LEFT JOIN parties p
          ON p.id = o.party_id

        LEFT JOIN order_items oi
          ON oi.order_id = o.id

        ${whereClause}

        GROUP BY
          o.id,
          o.order_no,
          o.party_id,
          o.order_source,
          o.po_number,
          o.po_date,
          o.order_date,
          o.reference_number,
          o.delivery_address,
          o.delivery_contact_person,
          o.delivery_contact_number,
          o.delivery_instructions,
          o.remarks,
          o.status,
          o.total_quantity,
          o.total_amount,
          o.created_by,
          o.created_at,
          o.updated_by,
          o.updated_at,
          p.name,
          p.party_code

        ORDER BY
          o.id DESC

        LIMIT ? OFFSET ?
        `,
        [
          ...params,
          perPage,
          offset,
        ]
      );

    /*
    ----------------------------------------------------------
    PAGINATION
    ----------------------------------------------------------
    */

    const totalPages =
      Math.ceil(
        total / perPage
      );

    res.json({
      success: true,

      data: orders,

      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch orders",
      error: error.message,
    });
  }
};

/*
============================================================
GET ORDER BY ID
============================================================

GET /api/orders/:id

Returns:

Order
Party
Delivery information
Items
Dispatched quantity
Pending quantity

============================================================
*/
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    /*
    ----------------------------------------------------------
    ORDER
    ----------------------------------------------------------
    */

    const [orders] = await pool.query(
      `
      SELECT
        o.*,

        p.name AS party_name,
        p.party_code,
        p.mobile AS party_mobile,
        p.email AS party_email,

        creator.name AS created_by_name,
        updater.name AS updated_by_name

      FROM orders o

      LEFT JOIN parties p
        ON p.id = o.party_id

      LEFT JOIN users creator
        ON creator.id = o.created_by

      LEFT JOIN users updater
        ON updater.id = o.updated_by

      WHERE o.id = ?

      LIMIT 1
      `,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    /*
    ----------------------------------------------------------
    ITEMS
    ----------------------------------------------------------
    */

    const [items] = await pool.query(
      `
      SELECT
        oi.id,
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

        pv.product_id

      FROM order_items oi

      LEFT JOIN product_variants pv
        ON pv.id = oi.variant_id

      WHERE oi.order_id = ?

      ORDER BY oi.id ASC
      `,
      [id]
    );

    /*
    ----------------------------------------------------------
    RECALCULATE PENDING
    ----------------------------------------------------------
    */

    const normalizedItems = items.map((item) => {
      const ordered = normalizeNumber(
        item.ordered_quantity
      );

      const dispatched = normalizeNumber(
        item.dispatched_quantity
      );

      const pending = Math.max(
        ordered - dispatched,
        0
      );

      return {
        ...item,

        ordered_quantity: ordered,

        dispatched_quantity: dispatched,

        pending_quantity: pending,

        rate: normalizeNumber(
          item.rate
        ),

        amount: normalizeNumber(
          item.amount
        ),
      };
    });

    /*
    ----------------------------------------------------------
    SUMMARY
    ----------------------------------------------------------
    */

    const totalQuantity =
      normalizedItems.reduce(
        (sum, item) =>
          sum + item.ordered_quantity,
        0
      );

    const dispatchedQuantity =
      normalizedItems.reduce(
        (sum, item) =>
          sum + item.dispatched_quantity,
        0
      );

    const pendingQuantity =
      normalizedItems.reduce(
        (sum, item) =>
          sum + item.pending_quantity,
        0
      );

    /*
    ----------------------------------------------------------
    RESPONSE
    ----------------------------------------------------------
    */

    return res.json({
      success: true,

      data: {
        ...order,

        total_quantity: normalizeNumber(
          order.total_quantity
        ),

        total_amount: normalizeNumber(
          order.total_amount
        ),

        total_ordered_quantity:
          totalQuantity,

        total_dispatched_quantity:
          dispatchedQuantity,

        total_pending_quantity:
          pendingQuantity,

        items: normalizedItems,
      },
    });
  } catch (error) {
    console.error(
      "Get order by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

/*
============================================================
CREATE ORDER
============================================================

POST /api/orders

Business:

Party can raise the order
OR
Company can create order on behalf of party.

Order creation DOES NOT affect physical stock.

============================================================
*/

const createOrder = async (
  req,
  res
) => {
  const connection =
    await pool.getConnection();

  try {
    const {
      order_source = "PARTY_ORDER",

      party_id,

      po_number = null,
      po_date = null,

      order_date,

      reference_number = null,

      delivery_address = null,
      delivery_contact_person = null,
      delivery_contact_number = null,
      delivery_instructions = null,

      remarks = null,

      items = [],
    } = req.body;

    /*
    ----------------------------------------------------------
    VALIDATION
    ----------------------------------------------------------
    */

    if (
      !ORDER_SOURCES.includes(
        order_source
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order source",
        valid_sources:
          ORDER_SOURCES,
      });
    }

    if (!party_id) {
      return res.status(400).json({
        success: false,
        message:
          "party_id is required",
      });
    }

    if (!order_date) {
      return res.status(400).json({
        success: false,
        message:
          "order_date is required",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one order item is required",
      });
    }

    /*
    ----------------------------------------------------------
    CHECK PARTY
    ----------------------------------------------------------
    */

    const [partyRows] =
      await connection.query(
        `
        SELECT
          id,
          name,
          status
        FROM parties
        WHERE id = ?
        LIMIT 1
        `,
        [party_id]
      );

    if (partyRows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Party not found",
      });
    }

    if (
      partyRows[0].status !== undefined &&
      Number(
        partyRows[0].status
      ) !== 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected party is inactive",
      });
    }

    /*
    ----------------------------------------------------------
    START TRANSACTION
    ----------------------------------------------------------
    */

    await connection.beginTransaction();

    /*
    ----------------------------------------------------------
    GENERATE ORDER NUMBER
    ----------------------------------------------------------
    */

    const orderNo =
      await generateOrderNumber(
        connection
      );

    /*
    ----------------------------------------------------------
    VALIDATE ITEMS
    ----------------------------------------------------------
    */

    const preparedItems = [];

    let totalQuantity = 0;
    let totalAmount = 0;

    for (
      let index = 0;
      index < items.length;
      index++
    ) {
      const item = items[index];

      const variantId =
        Number(
          item.variant_id
        );

      const quantity =
        normalizeNumber(
          item.quantity ??
            item.ordered_quantity
        );

      const rate =
        normalizeNumber(
          item.rate
        );

      const description =
        item.description
          ?.trim() || null;

      /*
      --------------------------------------------------------
      ITEM VALIDATION
      --------------------------------------------------------
      */

      if (!variantId) {
        throw new Error(
          `variant_id is required for item ${
            index + 1
          }`
        );
      }

      if (quantity <= 0) {
        throw new Error(
          `Quantity must be greater than zero for item ${
            index + 1
          }`
        );
      }

      if (rate < 0) {
        throw new Error(
          `Rate cannot be negative for item ${
            index + 1
          }`
        );
      }

      /*
      --------------------------------------------------------
      CHECK PRODUCT VARIANT
      --------------------------------------------------------
      */

    const [variantRows] = await connection.query(
  `
    SELECT
      pv.id,
      pv.product_id,
      pv.unit_id,
      pv.sku,
      pv.variant_name,
      pv.pack_size
    FROM product_variants pv
    WHERE pv.id = ?
    LIMIT 1
  `,
  [variantId]
);
      if (
        variantRows.length === 0
      ) {
        throw new Error(
          `Product variant ${variantId} not found`
        );
      }

      const variant =
        variantRows[0];

      /*
      --------------------------------------------------------
      AMOUNT
      --------------------------------------------------------
      */

      const amount =
        quantity * rate;

      totalQuantity +=
        quantity;

      totalAmount +=
        amount;

      preparedItems.push({
        variant_id:
          variant.id,

        unit_id:
          variant.unit_id,

        description,

        ordered_quantity:
          quantity,

        dispatched_quantity: 0,

        pending_quantity:
          quantity,

        rate,

        amount,
      });
    }

    /*
    ----------------------------------------------------------
    CREATED BY
    ----------------------------------------------------------
    */

    const createdBy =
      getUserId(req);

    /*
    ----------------------------------------------------------
    INSERT ORDER
    ----------------------------------------------------------
    */

    const [orderResult] =
      await connection.query(
        `
        INSERT INTO orders
        (
          order_no,

          party_id,
          order_source,

          po_number,
          po_date,
          order_date,
          reference_number,

          delivery_address,
          delivery_contact_person,
          delivery_contact_number,
          delivery_instructions,

          remarks,

          status,

          total_quantity,
          total_amount,

          created_by,
          updated_by
        )
        VALUES
        (
          ?,

          ?,
          ?,

          ?,
          ?,
          ?,
          ?,

          ?,
          ?,
          ?,
          ?,

          ?,

          'DRAFT',

          ?,
          ?,

          ?,
          ?
        )
        `,
        [
          orderNo,

          party_id,
          order_source,

          po_number,
          po_date,
          order_date,
          reference_number,

          delivery_address,
          delivery_contact_person,
          delivery_contact_number,
          delivery_instructions,

          remarks,

          totalQuantity,
          totalAmount,

          createdBy,
          createdBy,
        ]
      );

    const orderId =
      orderResult.insertId;

    /*
    ----------------------------------------------------------
    INSERT ORDER ITEMS
    ----------------------------------------------------------
    */

    for (const item of preparedItems) {
    await connection.query(
  `
    INSERT INTO order_items
    (
      order_id,
      variant_id,
      description,
      ordered_quantity,
      dispatched_quantity,
      pending_quantity,
      rate,
      amount
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    orderId,
    item.variant_id,
    item.description,
    item.ordered_quantity,
    item.dispatched_quantity,
    item.pending_quantity,
    item.rate,
    item.amount,
  ]
);
    }

    /*
    ----------------------------------------------------------
    COMMIT
    ----------------------------------------------------------
    */

    await connection.commit();

    /*
    ----------------------------------------------------------
    RESPONSE
    ----------------------------------------------------------
    */

    res.status(201).json({
      success: true,

      message:
        "Order created successfully",

      data: {
        id: orderId,

        order_no: orderNo,

        order_source,

        party_id:
          Number(party_id),

        status: "DRAFT",

        total_quantity:
          totalQuantity,

        total_amount:
          totalAmount,

        item_count:
          preparedItems.length,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create order",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/*
============================================================
CONFIRM ORDER
============================================================

PUT /api/orders/:id/confirm

Only DRAFT orders can be confirmed.

Confirming an order does NOT reduce stock.

============================================================
*/

const confirmOrder = async (
  req,
  res
) => {
  const connection =
    await pool.getConnection();

  try {
    const { id } = req.params;

    const updatedBy =
      getUserId(req);

    await connection.beginTransaction();

    /*
    ----------------------------------------------------------
    LOCK ORDER
    ----------------------------------------------------------
    */

    const [orders] =
      await connection.query(
        `
        SELECT
          id,
          order_no,
          status,
          party_id
        FROM orders
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [id]
      );

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    const order =
      orders[0];

    /*
    ----------------------------------------------------------
    STATUS VALIDATION
    ----------------------------------------------------------
    */

    if (order.status !== "DRAFT") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Only draft orders can be confirmed. Current status: ${order.status}`,
      });
    }

    /*
    ----------------------------------------------------------
    CHECK ITEMS
    ----------------------------------------------------------
    */

    const [items] =
      await connection.query(
        `
        SELECT
          id,
          ordered_quantity
        FROM order_items
        WHERE order_id = ?
        `,
        [id]
      );

    if (items.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Cannot confirm an order without items",
      });
    }

    /*
    ----------------------------------------------------------
    UPDATE
    ----------------------------------------------------------
    */

    await connection.query(
      `
      UPDATE orders

      SET
        status = 'CONFIRMED',
        updated_by = ?

      WHERE id = ?
      `,
      [
        updatedBy,
        id,
      ]
    );

    /*
    ----------------------------------------------------------
    COMMIT
    ----------------------------------------------------------
    */

    await connection.commit();

    res.json({
      success: true,

      message:
        "Order confirmed successfully",

      data: {
        id: Number(id),

        order_no:
          order.order_no,

        status:
          "CONFIRMED",
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Confirm order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to confirm order",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/*
============================================================
EXPORT
============================================================
*/

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  confirmOrder,
};