const { pool } = require("../db");

const getDashboardStats = async (req, res) => {
  try {
    const [
      [products],
      [categories],
      [parties],
      [employees],
      [stock],
      [lowStock],
      [orders],
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS total
        FROM products
        WHERE status = 1
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM categories
        WHERE status = 1
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM parties
        WHERE status = 1
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM employees
        WHERE status = 1
      `),

      pool.query(`
        SELECT
          COALESCE(
            SUM(
              current_stock * purchase_rate
            ),
            0
          ) AS total
        FROM product_variants
        WHERE status = 1
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM product_variants pv
        INNER JOIN products p
          ON p.id = pv.product_id
        WHERE
          pv.status = 1
          AND p.status = 1
          AND pv.current_stock <= p.reorder_level
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM orders
        WHERE status NOT IN (
          'CANCELLED',
          'DELIVERED',
          'COMPLETED'
        )
      `),
    ]);

    res.json({
      success: true,

      data: {
        products:
          Number(products[0]?.total) || 0,

        categories:
          Number(categories[0]?.total) || 0,

        parties:
          Number(parties[0]?.total) || 0,

        employees:
          Number(employees[0]?.total) || 0,

        stockValue:
          Number(stock[0]?.total) || 0,

        lowStock:
          Number(lowStock[0]?.total) || 0,

        pendingOrders:
          Number(orders[0]?.total) || 0,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};