const { pool } = require("../db");

/* ============================================================
   GENERATE RECEIPT NUMBER
   ============================================================ */

async function generateReceiptNo(connection) {
  const [rows] = await connection.query(`
    SELECT receipt_no
    FROM party_receipts
    ORDER BY id DESC
    LIMIT 1
  `);

  let nextNumber = 1;

  if (rows.length > 0 && rows[0].receipt_no) {
    const match = rows[0].receipt_no.match(/(\d+)$/);

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `REC-${String(nextNumber).padStart(6, "0")}`;
}

/* ============================================================
   GET ALL RECEIPTS
   ============================================================ */

exports.getReceipts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pr.*,
        p.name AS party_name,
        p.party_code,
        a.account_name,
        a.account_type
      FROM party_receipts pr

      INNER JOIN parties p
        ON p.id = pr.party_id

      INNER JOIN accounts a
        ON a.id = pr.account_id

      ORDER BY pr.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("❌ Get receipts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
      error: error.message,
    });
  }
};

/* ============================================================
   GET SINGLE RECEIPT
   ============================================================ */

exports.getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        pr.*,
        p.name AS party_name,
        p.party_code,
        p.mobile AS party_mobile,
        a.account_name,
        a.account_type
      FROM party_receipts pr

      INNER JOIN parties p
        ON p.id = pr.party_id

      INNER JOIN accounts a
        ON a.id = pr.account_id

      WHERE pr.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("❌ Get receipt error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch receipt",
      error: error.message,
    });
  }
};

/* ============================================================
   CREATE RECEIPT
   ============================================================ */

exports.createReceipt = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      party_id,
      receipt_date,
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
      throw new Error("Party is required");
    }

    if (!receipt_date) {
      throw new Error("Receipt date is required");
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    if (!account_id) {
      throw new Error("Account is required");
    }

    const validModes = [
      "CASH",
      "BANK",
      "UPI",
      "OTHER",
    ];

    if (!validModes.includes(payment_mode)) {
      throw new Error("Invalid payment mode");
    }

    /* --------------------------------------------------------
       CHECK PARTY
       -------------------------------------------------------- */

    const [partyRows] = await connection.query(
      `
      SELECT id, name
      FROM parties
      WHERE id = ?
      AND status = 1
      LIMIT 1
      `,
      [party_id]
    );

    if (partyRows.length === 0) {
      throw new Error("Party not found or inactive");
    }

    /* --------------------------------------------------------
       CHECK ACCOUNT
       -------------------------------------------------------- */

    const [accountRows] = await connection.query(
      `
      SELECT
        id,
        account_name,
        account_type,
        status
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [account_id]
    );

    if (accountRows.length === 0) {
      throw new Error("Account not found");
    }

    if (!accountRows[0].status) {
      throw new Error("Selected account is inactive");
    }

    /* --------------------------------------------------------
       PAYMENT MODE / ACCOUNT VALIDATION
       -------------------------------------------------------- */

    if (
      payment_mode !== "OTHER" &&
      accountRows[0].account_type !== payment_mode
    ) {
      throw new Error(
        `Selected account is not a ${payment_mode} account`
      );
    }

    /* --------------------------------------------------------
       GENERATE RECEIPT NUMBER
       -------------------------------------------------------- */

    const receiptNo = await generateReceiptNo(connection);

    /* --------------------------------------------------------
       CREATED BY
       -------------------------------------------------------- */

    const createpooly =
      req.user?.id ||
      req.user?.userId ||
      null;

    /* --------------------------------------------------------
       INSERT RECEIPT
       -------------------------------------------------------- */

    const [receiptResult] = await connection.query(
      `
      INSERT INTO party_receipts
      (
        receipt_no,
        party_id,
        receipt_date,
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
        receiptNo,
        party_id,
        receipt_date,
        Number(amount),
        payment_mode,
        account_id,
        reference_no || null,
        remarks || null,
        status,
        createpooly,
      ]
    );

    /* --------------------------------------------------------
       CREATE ACCOUNT TRANSACTION
       
       Money enters the company's account.
       Therefore account transaction = DEBIT.
       -------------------------------------------------------- */

    if (status === "COMPLETED") {
      const transactionNo = `REC-${receiptNo}`;

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
        VALUES (?, ?, ?, 'DEBIT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          account_id,
          transactionNo,
          receipt_date,
          Number(amount),
          "party_receipt",
          `Receipt from ${partyRows[0].name}`,
          reference_no || receiptNo,
          null,
          null,
          0,
          null,
          1,
          createpooly,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Party receipt created successfully",
      data: {
        id: receiptResult.insertId,
        receipt_no: receiptNo,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("❌ Create receipt error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create receipt",
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   UPDATE RECEIPT
   ============================================================ */

exports.updateReceipt = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const {
      party_id,
      receipt_date,
      amount,
      payment_mode,
      account_id,
      reference_no,
      remarks,
    } = req.body;

    /* --------------------------------------------------------
       FIND RECEIPT
       -------------------------------------------------------- */

    const [receiptRows] = await connection.query(
      `
      SELECT *
      FROM party_receipts
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (receiptRows.length === 0) {
      throw new Error("Receipt not found");
    }

    const existing = receiptRows[0];

    if (existing.status === "CANCELLED") {
      throw new Error(
        "Cancelled receipt cannot be updated"
      );
    }

    if (existing.status === "COMPLETED") {
      throw new Error(
        "Completed receipt cannot be edited. Cancel it and create a new receipt."
      );
    }

    /* --------------------------------------------------------
       UPDATE DRAFT
       -------------------------------------------------------- */

    await connection.query(
      `
      UPDATE party_receipts
      SET
        party_id = ?,
        receipt_date = ?,
        amount = ?,
        payment_mode = ?,
        account_id = ?,
        reference_no = ?,
        remarks = ?
      WHERE id = ?
      `,
      [
        party_id,
        receipt_date,
        amount,
        payment_mode,
        account_id,
        reference_no || null,
        remarks || null,
        id,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Receipt updated successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("❌ Update receipt error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   CANCEL RECEIPT
   ============================================================ */

exports.cancelReceipt = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [receiptRows] = await connection.query(
      `
      SELECT *
      FROM party_receipts
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (receiptRows.length === 0) {
      throw new Error("Receipt not found");
    }

    const receipt = receiptRows[0];

    if (receipt.status === "CANCELLED") {
      throw new Error("Receipt is already cancelled");
    }

    /* --------------------------------------------------------
       CANCEL RECEIPT
       -------------------------------------------------------- */

    await connection.query(
      `
      UPDATE party_receipts
      SET status = 'CANCELLED'
      WHERE id = ?
      `,
      [id]
    );

    /* --------------------------------------------------------
       DISABLE ACCOUNT TRANSACTION
       -------------------------------------------------------- */

    await connection.query(
      `
      UPDATE account_transactions
      SET status = 0
      WHERE account_id = ?
      AND reference_no = ?
      `,
      [
        receipt.account_id,
        receipt.reference_no || receipt.receipt_no,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Receipt cancelled successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("❌ Cancel receipt error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    connection.release();
  }
};