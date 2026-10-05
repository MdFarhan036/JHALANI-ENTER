const { pool } = require("../db");

// ============================================================
// GET ALL ACTIVE PARTIES
// ============================================================
const getParties = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        party_code,
        name,
        mobile,
        gst_no,
        city,
        state,
        opening_balance,
        opening_balance_type,
        credit_limit,
        status
      FROM parties
      WHERE status = 1
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get party ledger parties error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch parties",
      error: error.message,
    });
  }
};

// ============================================================
// GET PARTY LEDGER
// ============================================================
const getPartyLedger = async (req, res) => {
  const { partyId } = req.params;

  try {
    // --------------------------------------------------------
    // PARTY
    // --------------------------------------------------------
    const [partyRows] = await pool.query(
      `
      SELECT
        id,
        party_code,
        name,
        contact_person,
        mobile,
        email,
        gst_no,
        billing_address,
        delivery_address,
        city,
        state,
        pincode,
        credit_limit,
        opening_balance,
        opening_balance_type,
        status
      FROM parties
      WHERE id = ?
      LIMIT 1
      `,
      [partyId]
    );

    if (!partyRows.length) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    const party = partyRows[0];

    // --------------------------------------------------------
    // OPENING BALANCE
    // --------------------------------------------------------
    let runningBalance =
      Number(party.opening_balance || 0) *
      (party.opening_balance_type === "CREDIT" ? -1 : 1);

    const transactions = [];

    if (Number(party.opening_balance || 0) !== 0) {
      transactions.push({
        id: `opening-${party.id}`,
        date: null,
        transaction_no: "OPENING",
        type: party.opening_balance_type,
        debit:
          party.opening_balance_type === "DEBIT"
            ? Number(party.opening_balance)
            : 0,
        credit:
          party.opening_balance_type === "CREDIT"
            ? Number(party.opening_balance)
            : 0,
        amount: Number(party.opening_balance),
        description: "Opening Balance",
        reference_no: null,
        source: "OPENING",
        running_balance: runningBalance,
      });
    }

    // --------------------------------------------------------
    // SALES ORDERS
    // --------------------------------------------------------
    const [sales] = await pool.query(
      `
      SELECT
        id,
        order_no,
        order_date,
        total_amount,
        status,
        remarks
      FROM orders
      WHERE party_id = ?
        AND status IN (
          'CONFIRMED',
          'PARTIALLY_DISPATCHED',
          'FULLY_DISPATCHED'
        )
      ORDER BY order_date ASC, id ASC
      `,
      [partyId]
    );

    for (const sale of sales) {
      const amount = Number(sale.total_amount || 0);

      runningBalance += amount;

      transactions.push({
        id: `sale-${sale.id}`,
        date: sale.order_date,
        transaction_no: sale.order_no,
        type: "DEBIT",
        debit: amount,
        credit: 0,
        amount,
        description: "Sales Order",
        reference_no: sale.order_no,
        source: "SALES",
        source_id: sale.id,
        status: sale.status,
        running_balance: runningBalance,
      });
    }

    // --------------------------------------------------------
    // SALES RETURNS
    // --------------------------------------------------------
    const [returns] = await pool.query(
      `
      SELECT
        id,
        return_no,
        order_id,
        return_date,
        total_amount,
        reason,
        remarks,
        status
      FROM sales_returns
      WHERE party_id = ?
        AND status = 'COMPLETED'
      ORDER BY return_date ASC, id ASC
      `,
      [partyId]
    );

    for (const salesReturn of returns) {
      const amount = Number(salesReturn.total_amount || 0);

      runningBalance -= amount;

      transactions.push({
        id: `return-${salesReturn.id}`,
        date: salesReturn.return_date,
        transaction_no: salesReturn.return_no,
        type: "CREDIT",
        debit: 0,
        credit: amount,
        amount,
        description: "Sales Return",
        reference_no: salesReturn.return_no,
        source: "SALES_RETURN",
        source_id: salesReturn.id,
        order_id: salesReturn.order_id,
        status: salesReturn.status,
        running_balance: runningBalance,
      });
    }

    // --------------------------------------------------------
    // SORT ALL TRANSACTIONS BY DATE
    // --------------------------------------------------------
    transactions.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }

      return String(a.transaction_no || "").localeCompare(
        String(b.transaction_no || "")
      );
    });

    // --------------------------------------------------------
    // RE-CALCULATE RUNNING BALANCE AFTER SORT
    // --------------------------------------------------------
    let balance = 0;

    transactions.forEach((transaction) => {
      balance +=
        Number(transaction.debit || 0) -
        Number(transaction.credit || 0);

      transaction.running_balance = balance;
    });

    // --------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------
    const totalDebit = transactions.reduce(
      (sum, item) => sum + Number(item.debit || 0),
      0
    );

    const totalCredit = transactions.reduce(
      (sum, item) => sum + Number(item.credit || 0),
      0
    );

    const closingBalance = totalDebit - totalCredit;

    let balanceType = "SETTLED";

    if (closingBalance > 0) {
      balanceType = "DEBIT";
    } else if (closingBalance < 0) {
      balanceType = "CREDIT";
    }

    res.json({
      success: true,
      data: {
        party,
        summary: {
          total_debit: totalDebit,
          total_credit: totalCredit,
          closing_balance: Math.abs(closingBalance),
          balance_type: balanceType,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error("Get party ledger error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch party ledger",
      error: error.message,
    });
  }
};

// ============================================================
// GET PARTY LEDGER SUMMARY
// ============================================================
const getPartyLedgerSummary = async (req, res) => {
  const { partyId } = req.params;

  try {
    const [partyRows] = await pool.query(
      `
      SELECT
        id,
        party_code,
        name,
        opening_balance,
        opening_balance_type,
        credit_limit
      FROM parties
      WHERE id = ?
      LIMIT 1
      `,
      [partyId]
    );

    if (!partyRows.length) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    const party = partyRows[0];

    const [salesRows] = await pool.query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_sales
      FROM orders
      WHERE party_id = ?
        AND status IN (
          'CONFIRMED',
          'PARTIALLY_DISPATCHED',
          'FULLY_DISPATCHED'
        )
      `,
      [partyId]
    );

    const [returnRows] = await pool.query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_returns
      FROM sales_returns
      WHERE party_id = ?
        AND status = 'COMPLETED'
      `,
      [partyId]
    );

    const opening =
      Number(party.opening_balance || 0) *
      (party.opening_balance_type === "CREDIT" ? -1 : 1);

    const totalSales = Number(salesRows[0].total_sales || 0);
    const totalReturns = Number(returnRows[0].total_returns || 0);

    const closing = opening + totalSales - totalReturns;

    let balanceType = "SETTLED";

    if (closing > 0) {
      balanceType = "DEBIT";
    } else if (closing < 0) {
      balanceType = "CREDIT";
    }

    res.json({
      success: true,
      data: {
        party,
        opening_balance: Math.abs(opening),
        opening_balance_type:
          opening >= 0 ? "DEBIT" : "CREDIT",
        total_sales: totalSales,
        total_returns: totalReturns,
        closing_balance: Math.abs(closing),
        balance_type: balanceType,
        credit_limit: Number(party.credit_limit || 0),
      },
    });
  } catch (error) {
    console.error("Get party ledger summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch party ledger summary",
      error: error.message,
    });
  }
};

module.exports = {
  getParties,
  getPartyLedger,
  getPartyLedgerSummary,
};