const { pool } = require("../db");

/* ============================================================
   GET ALL PARTY PAYMENTS
   ============================================================ */
const getPartyPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pp.*,
        p.name AS party_name,
        a.account_name,
        a.account_type
      FROM party_payments pp
      INNER JOIN parties p ON p.id = pp.party_id
      INNER JOIN accounts a ON a.id = pp.account_id
      ORDER BY pp.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET PARTY PAYMENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch party payments",
      error: error.message,
    });
  }
};


/* ============================================================
   GET SINGLE PARTY PAYMENT
   ============================================================ */
const getPartyPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        pp.*,
        p.name AS party_name,
        p.mobile AS party_mobile,
        p.gst_no AS party_gst_no,
        a.account_name,
        a.account_type
      FROM party_payments pp
      INNER JOIN parties p ON p.id = pp.party_id
      INNER JOIN accounts a ON a.id = pp.account_id
      WHERE pp.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Party payment not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("GET PARTY PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch party payment",
      error: error.message,
    });
  }
};


/* ============================================================
   GENERATE PAYMENT NUMBER
   ============================================================ */
const generatePaymentNo = async () => {
  const [rows] = await pool.query(`
    SELECT payment_no
    FROM party_payments
    ORDER BY id DESC
    LIMIT 1
  `);

  if (!rows.length) {
    return "PAY-000001";
  }

  const lastNo = rows[0].payment_no;

  const match = lastNo.match(/(\d+)$/);

  if (!match) {
    return `PAY-${Date.now()}`;
  }

  const nextNumber = parseInt(match[1], 10) + 1;

  return `PAY-${String(nextNumber).padStart(6, "0")}`;
};


/* ============================================================
   CREATE PARTY PAYMENT
   ============================================================ */
const createPartyPayment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      party_id,
      payment_date,
      amount,
      payment_mode,
      account_id,
      reference_no,
      remarks,
      status = "COMPLETED",
    } = req.body;

    /* --------------------------------------------------------
       VALIDATION
       -------------------------------------------------------- */

    if (!party_id) {
      return res.status(400).json({
        success: false,
        message: "Party is required",
      });
    }

    if (!payment_date) {
      return res.status(400).json({
        success: false,
        message: "Payment date is required",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: "Account is required",
      });
    }

    const validModes = ["CASH", "BANK", "UPI", "OTHER"];

    if (!validModes.includes(payment_mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment mode",
      });
    }

    const validStatuses = [
      "DRAFT",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    /* --------------------------------------------------------
       VERIFY PARTY
       -------------------------------------------------------- */

    const [partyRows] = await connection.query(
      `
      SELECT id, name
      FROM parties
      WHERE id = ?
      LIMIT 1
      `,
      [party_id]
    );

    if (!partyRows.length) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    /* --------------------------------------------------------
       VERIFY ACCOUNT
       -------------------------------------------------------- */

    const [accountRows] = await connection.query(
      `
      SELECT id, account_name, status
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [account_id]
    );

    if (!accountRows.length) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!accountRows[0].status) {
      return res.status(400).json({
        success: false,
        message: "Selected account is inactive",
      });
    }

    /* --------------------------------------------------------
       START TRANSACTION
       -------------------------------------------------------- */

    await connection.beginTransaction();

    const paymentNo = await generatePaymentNo();

    /* --------------------------------------------------------
       INSERT PAYMENT
       -------------------------------------------------------- */

    const [paymentResult] = await connection.query(
      `
      INSERT INTO party_payments
      (
        payment_no,
        party_id,
        payment_date,
        amount,
        payment_mode,
        account_id,
        reference_no,
        remarks,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paymentNo,
        party_id,
        payment_date,
        Number(amount),
        payment_mode,
        account_id,
        reference_no || null,
        remarks || null,
        status,
        req.user?.id || null,
      ]
    );

    /* --------------------------------------------------------
       ACCOUNTING ENTRY
       -------------------------------------------------------- */

    if (status === "COMPLETED") {
      const transactionNo = paymentNo;

      await connection.query(
        `
        INSERT INTO account_transactions
        (
          account_id,
          transaction_no,
          transaction_date,
          transaction_type,
          amount,
          category,
          description,
          reference_no,
          related_account_id,
          employee_id,
          deduct_from_salary,
          salary_month,
          status,
          created_by
        )
        VALUES (?, ?, ?, 'DEBIT', ?, ?, ?, ?, NULL, NULL, 0, NULL, 1, ?)
        `,
        [
          account_id,
          transactionNo,
          payment_date,
          Number(amount),
          "party_payment",
          `Payment to ${partyRows[0].name}`,
          reference_no || paymentNo,
          req.user?.id || null,
        ]
      );
    }

    /* --------------------------------------------------------
       UPDATE ACCOUNT BALANCE
       -------------------------------------------------------- */

    if (status === "COMPLETED") {
      await connection.query(
        `
        UPDATE accounts
        SET opening_balance = opening_balance - ?
        WHERE id = ?
        `,
        [Number(amount), account_id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Party payment created successfully",
      data: {
        id: paymentResult.insertId,
        payment_no: paymentNo,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("CREATE PARTY PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create party payment",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


/* ============================================================
   UPDATE PARTY PAYMENT
   ============================================================ */

const updatePartyPayment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const {
      party_id,
      payment_date,
      amount,
      payment_mode,
      account_id,
      reference_no,
      remarks,
      status,
    } = req.body;

    const [existingRows] = await connection.query(
      `
      SELECT *
      FROM party_payments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: "Party payment not found",
      });
    }

    const existing = existingRows[0];

    if (existing.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled payment cannot be edited",
      });
    }

    if (existing.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message:
          "Completed payment cannot be edited. Cancel it and create a new payment.",
      });
    }

    await connection.query(
      `
      UPDATE party_payments
      SET
        party_id = ?,
        payment_date = ?,
        amount = ?,
        payment_mode = ?,
        account_id = ?,
        reference_no = ?,
        remarks = ?,
        status = ?
      WHERE id = ?
      `,
      [
        party_id,
        payment_date,
        Number(amount),
        payment_mode,
        account_id,
        reference_no || null,
        remarks || null,
        status,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Party payment updated successfully",
    });
  } catch (error) {
    console.error("UPDATE PARTY PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update party payment",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


/* ============================================================
   CANCEL PARTY PAYMENT
   ============================================================ */

const cancelPartyPayment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const [rows] = await connection.query(
      `
      SELECT *
      FROM party_payments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Party payment not found",
      });
    }

    const payment = rows[0];

    if (payment.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Payment is already cancelled",
      });
    }

    await connection.beginTransaction();

    if (payment.status === "COMPLETED") {
      await connection.query(
        `
        UPDATE account_transactions
        SET status = 0
        WHERE reference_no = ?
          AND category = 'party_payment'
          AND account_id = ?
        `,
        [
          payment.reference_no || payment.payment_no,
          payment.account_id,
        ]
      );

      await connection.query(
        `
        UPDATE accounts
        SET opening_balance = opening_balance + ?
        WHERE id = ?
        `,
        [payment.amount, payment.account_id]
      );
    }

    await connection.query(
      `
      UPDATE party_payments
      SET status = 'CANCELLED'
      WHERE id = ?
      `,
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Party payment cancelled successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("CANCEL PARTY PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel party payment",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


module.exports = {
  getPartyPayments,
  getPartyPaymentById,
  createPartyPayment,
  updatePartyPayment,
  cancelPartyPayment,
};