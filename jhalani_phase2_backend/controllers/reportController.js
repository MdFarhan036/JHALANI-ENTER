const { pool } = require("../db");

/* ============================================================
   DASHBOARD SUMMARY
   ============================================================ */

const getDashboardSummary = async (req, res) => {
  try {
    const [[sales]] = await pool.query(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_sales
      FROM orders
      WHERE status <> 'CANCELLED'
    `);

    const [[purchases]] = await pool.query(`
      SELECT
        COUNT(*) AS total_purchases,
        COALESCE(SUM(total_amount), 0) AS total_purchase_amount
      FROM purchases
      WHERE status <> 'CANCELLED'
    `);

    const [[salesReturns]] = await pool.query(`
      SELECT
        COUNT(*) AS total_returns,
        COALESCE(SUM(total_amount), 0) AS total_return_amount
      FROM sales_returns
      WHERE status = 'COMPLETED'
    `);

    const [[purchaseReturns]] = await pool.query(`
      SELECT
        COUNT(*) AS total_returns,
        COALESCE(SUM(total_amount), 0) AS total_return_amount
      FROM purchase_returns
      WHERE status = 'COMPLETED'
    `);

    const [[stock]] = await pool.query(`
      SELECT
        COALESCE(
          SUM(current_stock * purchase_rate),
          0
        ) AS stock_value,
        COALESCE(SUM(current_stock), 0) AS total_stock
      FROM product_variants
      WHERE status = 1
    `);

    const [[accounts]] = await pool.query(`
      SELECT
        COALESCE(SUM(
          opening_balance +
          COALESCE(
            (
              SELECT SUM(
                CASE
                  WHEN at.transaction_type = 'CREDIT'
                    THEN at.amount
                  WHEN at.transaction_type = 'DEBIT'
                    THEN -at.amount
                  ELSE 0
                END
              )
              FROM account_transactions at
              WHERE at.account_id = a.id
                AND at.status = 1
            ),
            0
          )
        ), 0) AS current_balance
      FROM accounts a
      WHERE a.status = 1
    `);

    res.json({
      success: true,
      data: {
        sales: {
          orders: Number(sales.total_orders || 0),
          amount: Number(sales.total_sales || 0),
        },

        purchases: {
          count: Number(purchases.total_purchases || 0),
          amount: Number(
            purchases.total_purchase_amount || 0
          ),
        },

        sales_returns: {
          count: Number(salesReturns.total_returns || 0),
          amount: Number(
            salesReturns.total_return_amount || 0
          ),
        },

        purchase_returns: {
          count: Number(
            purchaseReturns.total_returns || 0
          ),
          amount: Number(
            purchaseReturns.total_return_amount || 0
          ),
        },

        stock: {
          quantity: Number(stock.total_stock || 0),
          value: Number(stock.stock_value || 0),
        },

        accounts: {
          balance: Number(
            accounts.current_balance || 0
          ),
        },
      },
    });
  } catch (error) {
    console.error(
      "GET DASHBOARD SUMMARY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary",
      error: error.message,
    });
  }
};


/* ============================================================
   SALES REPORT
   ============================================================ */

const getSalesReport = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      party_id,
      status,
    } = req.query;

    let sql = `
      SELECT
        o.id,
        o.order_no,
        o.order_date,
        o.party_id,
        p.name AS party_name,
        o.po_number,
        o.status,
        o.total_quantity,
        o.total_amount
      FROM orders o
      LEFT JOIN parties p
        ON p.id = o.party_id
      WHERE 1 = 1
    `;

    const params = [];

    if (from_date) {
      sql += ` AND o.order_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND o.order_date <= ?`;
      params.push(to_date);
    }

    if (party_id) {
      sql += ` AND o.party_id = ?`;
      params.push(party_id);
    }

    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY o.order_date DESC, o.id DESC`;

    const [rows] = await pool.query(sql, params);

    const summary = rows.reduce(
      (acc, row) => {
        acc.total_orders += 1;
        acc.total_quantity += Number(
          row.total_quantity || 0
        );
        acc.total_amount += Number(
          row.total_amount || 0
        );

        return acc;
      },
      {
        total_orders: 0,
        total_quantity: 0,
        total_amount: 0,
      }
    );

    res.json({
      success: true,
      summary,
      data: rows,
    });
  } catch (error) {
    console.error("SALES REPORT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load sales report",
      error: error.message,
    });
  }
};


/* ============================================================
   PURCHASE REPORT
   ============================================================ */

const getPurchaseReport = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      status,
    } = req.query;

    let sql = `
      SELECT
        id,
        supplier_name,
        invoice_number,
        invoice_date,
        purchase_date,
        total_amount,
        status,
        remarks
      FROM purchases
      WHERE 1 = 1
    `;

    const params = [];

    if (from_date) {
      sql += ` AND DATE(purchase_date) >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND DATE(purchase_date) <= ?`;
      params.push(to_date);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += `
      ORDER BY purchase_date DESC, id DESC
    `;

    const [rows] = await pool.query(sql, params);

    const summary = rows.reduce(
      (acc, row) => {
        acc.total_purchases += 1;
        acc.total_amount += Number(
          row.total_amount || 0
        );

        return acc;
      },
      {
        total_purchases: 0,
        total_amount: 0,
      }
    );

    res.json({
      success: true,
      summary,
      data: rows,
    });
  } catch (error) {
    console.error(
      "PURCHASE REPORT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load purchase report",
      error: error.message,
    });
  }
};


/* ============================================================
   SALES RETURN REPORT
   ============================================================ */

const getSalesReturnReport = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      party_id,
      status,
    } = req.query;

    let sql = `
      SELECT
        sr.id,
        sr.return_no,
        sr.order_id,
        o.order_no,
        sr.party_id,
        p.name AS party_name,
        sr.return_date,
        sr.total_amount,
        sr.reason,
        sr.status
      FROM sales_returns sr
      LEFT JOIN orders o
        ON o.id = sr.order_id
      LEFT JOIN parties p
        ON p.id = sr.party_id
      WHERE 1 = 1
    `;

    const params = [];

    if (from_date) {
      sql += ` AND DATE(sr.return_date) >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND DATE(sr.return_date) <= ?`;
      params.push(to_date);
    }

    if (party_id) {
      sql += ` AND sr.party_id = ?`;
      params.push(party_id);
    }

    if (status) {
      sql += ` AND sr.status = ?`;
      params.push(status);
    }

    sql += `
      ORDER BY sr.return_date DESC, sr.id DESC
    `;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      summary: {
        count: rows.length,
        amount: rows.reduce(
          (sum, row) =>
            sum + Number(row.total_amount || 0),
          0
        ),
      },
      data: rows,
    });
  } catch (error) {
    console.error(
      "SALES RETURN REPORT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load sales return report",
      error: error.message,
    });
  }
};


/* ============================================================
   PURCHASE RETURN REPORT
   ============================================================ */

const getPurchaseReturnReport = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      status,
    } = req.query;

    let sql = `
      SELECT
        pr.id,
        pr.purchase_id,
        pr.supplier_name,
        pr.return_date,
        pr.total_amount,
        pr.remarks,
        pr.status
      FROM purchase_returns pr
      WHERE 1 = 1
    `;

    const params = [];

    if (from_date) {
      sql += ` AND DATE(pr.return_date) >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND DATE(pr.return_date) <= ?`;
      params.push(to_date);
    }

    if (status) {
      sql += ` AND pr.status = ?`;
      params.push(status);
    }

    sql += `
      ORDER BY pr.return_date DESC, pr.id DESC
    `;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      summary: {
        count: rows.length,
        amount: rows.reduce(
          (sum, row) =>
            sum + Number(row.total_amount || 0),
          0
        ),
      },
      data: rows,
    });
  } catch (error) {
    console.error(
      "PURCHASE RETURN REPORT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load purchase return report",
      error: error.message,
    });
  }
};


/* ============================================================
   STOCK REPORT
   ============================================================ */

const getStockReport = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pv.id,
        pv.sku,
        pv.variant_name,
        pv.current_stock,
        pv.reserved_stock,
        pv.purchase_rate,
        pv.sale_rate,
        pv.mrp,
        pv.status,
        p.id AS product_id,
        p.product_code,
        p.product_name,
        p.brand,
        c.name AS category_name,
        u.name AS unit_name
      FROM product_variants pv
      LEFT JOIN products p
        ON p.id = pv.product_id
      LEFT JOIN categories c
        ON c.id = p.category_id
      LEFT JOIN units u
        ON u.id = pv.unit_id
      ORDER BY p.product_name ASC, pv.variant_name ASC
    `);

    const summary = rows.reduce(
      (acc, row) => {
        const stock =
          Number(row.current_stock || 0);

        const rate =
          Number(row.purchase_rate || 0);

        acc.total_quantity += stock;
        acc.total_value += stock * rate;

        return acc;
      },
      {
        total_quantity: 0,
        total_value: 0,
      }
    );

    res.json({
      success: true,
      summary,
      data: rows,
    });
  } catch (error) {
    console.error("STOCK REPORT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load stock report",
      error: error.message,
    });
  }
};


/* ============================================================
   ACCOUNT REPORT
   ============================================================ */

const getAccountReport = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id,
        a.account_name,
        a.account_type,
        a.account_number,
        a.bank_name,
        a.opening_balance,
        a.status,

        a.opening_balance +
        COALESCE(
          SUM(
            CASE
              WHEN at.transaction_type = 'CREDIT'
                THEN at.amount
              WHEN at.transaction_type = 'DEBIT'
                THEN -at.amount
              ELSE 0
            END
          ),
          0
        ) AS current_balance

      FROM accounts a

      LEFT JOIN account_transactions at
        ON at.account_id = a.id
        AND at.status = 1

      GROUP BY
        a.id,
        a.account_name,
        a.account_type,
        a.account_number,
        a.bank_name,
        a.opening_balance,
        a.status

      ORDER BY a.account_name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "ACCOUNT REPORT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load account report",
      error: error.message,
    });
  }
};


/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getDashboardSummary,
  getSalesReport,
  getPurchaseReport,
  getSalesReturnReport,
  getPurchaseReturnReport,
  getStockReport,
  getAccountReport,
};