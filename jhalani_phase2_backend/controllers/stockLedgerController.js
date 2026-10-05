
/*
============================================================
TRANSACTION MOVEMENT
============================================================
*/

const { pool } = require("../db");

const IN_TYPES = [
  "OPENING",
  "PURCHASE",
  "SALE_RETURN",
  "ADJUSTMENT_IN",
  "TRANSFER_IN",
];

const OUT_TYPES = [
  "PURCHASE_RETURN",
  "SALE",
  "ADJUSTMENT_OUT",
  "TRANSFER_OUT",
  "DAMAGE",
  "EXPIRY",
];

/*
============================================================
GET STOCK LEDGER
============================================================
*/

const getStockLedger = async (req, res) => {
  try {
    const {
      product_id,
      variant_id,
      transaction_type,
      date_from,
      date_to,
      search,
    } = req.query;

    const conditions = [];
    const params = [];

    /*
    --------------------------------------------------------
    BASE QUERY
    --------------------------------------------------------
    */

    let sql = `
      SELECT
        st.id,
        st.variant_id,

        p.id AS product_id,
        p.product_name,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        st.transaction_type,
        st.reference_type,
        st.reference_id,

        st.quantity,
        st.rate,
        st.transaction_date,
        st.remarks,

        u.name AS unit_name,
        u.symbol AS unit_symbol

      FROM stock_transactions st

      INNER JOIN product_variants pv
        ON pv.id = st.variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      WHERE 1 = 1
    `;

    /*
    --------------------------------------------------------
    FILTERS
    --------------------------------------------------------
    */

    if (product_id) {
      conditions.push("p.id = ?");
      params.push(product_id);
    }

    if (variant_id) {
      conditions.push("st.variant_id = ?");
      params.push(variant_id);
    }

    if (transaction_type) {
      conditions.push("st.transaction_type = ?");
      params.push(transaction_type);
    }

    if (date_from) {
      conditions.push("DATE(st.transaction_date) >= ?");
      params.push(date_from);
    }

    if (date_to) {
      conditions.push("DATE(st.transaction_date) <= ?");
      params.push(date_to);
    }

    if (search) {
      conditions.push(`
        (
          p.product_name LIKE ?
          OR pv.sku LIKE ?
          OR pv.variant_name LIKE ?
          OR st.reference_type LIKE ?
          OR CAST(st.reference_id AS CHAR) LIKE ?
          OR st.remarks LIKE ?
        )
      `);

      const searchValue = `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    if (conditions.length) {
      sql += ` AND ${conditions.join(" AND ")}`;
    }

    /*
    --------------------------------------------------------
    IMPORTANT:
    ASCENDING ORDER IS REQUIRED FOR RUNNING BALANCE
    --------------------------------------------------------
    */

    sql += `
      ORDER BY
        st.transaction_date ASC,
        st.id ASC
    `;

    const [rows] = await pool.query(sql, params);

    /*
    --------------------------------------------------------
    CALCULATE RUNNING BALANCE PER VARIANT
    --------------------------------------------------------
    */

    const balances = {};

    const ledger = rows.map((row) => {
      const variantId = row.variant_id;

      if (!balances[variantId]) {
        balances[variantId] = 0;
      }

      const quantity = Number(row.quantity || 0);

      let quantityIn = 0;
      let quantityOut = 0;

      if (IN_TYPES.includes(row.transaction_type)) {
        quantityIn = quantity;
        balances[variantId] += quantity;
      } else if (OUT_TYPES.includes(row.transaction_type)) {
        quantityOut = quantity;
        balances[variantId] -= quantity;
      }

      return {
        id: row.id,

        product_id: row.product_id,
        product_name: row.product_name,

        variant_id: row.variant_id,
        sku: row.sku,
        variant_name: row.variant_name,
        pack_size: row.pack_size,

        unit_name: row.unit_name,
        unit_symbol: row.unit_symbol,

        transaction_type: row.transaction_type,

        reference_type: row.reference_type,
        reference_id: row.reference_id,

        quantity: quantity.toFixed(3),

        quantity_in: quantityIn.toFixed(3),
        quantity_out: quantityOut.toFixed(3),

        balance: balances[variantId].toFixed(3),

        rate: Number(row.rate || 0).toFixed(2),

        transaction_date: row.transaction_date,

        remarks: row.remarks,
      };
    });

    /*
    --------------------------------------------------------
    RETURN LATEST FIRST
    --------------------------------------------------------
    */

    ledger.reverse();

    return res.status(200).json({
      success: true,
      count: ledger.length,
      data: ledger,
    });
  } catch (error) {
    console.error("Get stock ledger error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load stock ledger",
      error: error.message,
    });
  }
};


/*
============================================================
GET VARIANT LEDGER
============================================================
*/

const getVariantLedger = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required",
      });
    }

    const sql = `
      SELECT
        st.id,
        st.variant_id,

        p.id AS product_id,
        p.product_name,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        st.transaction_type,
        st.reference_type,
        st.reference_id,

        st.quantity,
        st.rate,
        st.transaction_date,
        st.remarks,

        u.name AS unit_name,
        u.symbol AS unit_symbol

      FROM stock_transactions st

      INNER JOIN product_variants pv
        ON pv.id = st.variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN units u
        ON u.id = pv.unit_id

      WHERE st.variant_id = ?

      ORDER BY
        st.transaction_date ASC,
        st.id ASC
    `;

    const [rows] = await pool.query(sql, [variantId]);

    let balance = 0;

    const ledger = rows.map((row) => {
      const quantity = Number(row.quantity || 0);

      let quantityIn = 0;
      let quantityOut = 0;

      if (IN_TYPES.includes(row.transaction_type)) {
        quantityIn = quantity;
        balance += quantity;
      } else if (OUT_TYPES.includes(row.transaction_type)) {
        quantityOut = quantity;
        balance -= quantity;
      }

      return {
        id: row.id,

        product_id: row.product_id,
        product_name: row.product_name,

        variant_id: row.variant_id,
        sku: row.sku,
        variant_name: row.variant_name,
        pack_size: row.pack_size,

        unit_name: row.unit_name,
        unit_symbol: row.unit_symbol,

        transaction_type: row.transaction_type,

        reference_type: row.reference_type,
        reference_id: row.reference_id,

        quantity: quantity.toFixed(3),

        quantity_in: quantityIn.toFixed(3),
        quantity_out: quantityOut.toFixed(3),

        balance: balance.toFixed(3),

        rate: Number(row.rate || 0).toFixed(2),

        transaction_date: row.transaction_date,

        remarks: row.remarks,
      };
    });

    return res.status(200).json({
      success: true,
      count: ledger.length,
      data: ledger,
    });
  } catch (error) {
    console.error("Get variant ledger error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load variant ledger",
      error: error.message,
    });
  }
};


module.exports = {
  getStockLedger,
  getVariantLedger,
};