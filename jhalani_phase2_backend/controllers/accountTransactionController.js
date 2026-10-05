const { pool } = require("../db.js");

// =====================================================
// GET ALL TRANSACTIONS
// =====================================================
const getTransactions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.account_id,
        a.account_name,
        a.account_type,

        t.transaction_no,
        t.transaction_date,
        t.transaction_type,
        t.amount,
        t.category,
        t.description,
        t.reference_no,

        t.related_account_id,
        ra.account_name AS related_account_name,

        t.employee_id,
        e.name AS employee_name,

        t.deduct_from_salary,
        t.salary_month,
        t.status,
        t.created_at,
        t.updated_at

      FROM account_transactions t

      LEFT JOIN accounts a
        ON a.id = t.account_id

      LEFT JOIN accounts ra
        ON ra.id = t.related_account_id

      LEFT JOIN employees e
        ON e.id = t.employee_id

      ORDER BY t.id DESC
    `);

    const data = rows.map((row) => ({
      ...row,
      amount: Number(row.amount || 0),
      deduct_from_salary: Number(
        row.deduct_from_salary || 0
      ),
      status: Number(row.status ?? 1),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get account transactions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load transactions",
    });
  }
};


// =====================================================
// GET SINGLE TRANSACTION
// =====================================================
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        t.*,
        a.account_name,
        a.account_type,
        ra.account_name AS related_account_name,
        e.name AS employee_name

      FROM account_transactions t

      LEFT JOIN accounts a
        ON a.id = t.account_id

      LEFT JOIN accounts ra
        ON ra.id = t.related_account_id

      LEFT JOIN employees e
        ON e.id = t.employee_id

      WHERE t.id = ?

      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const transaction = rows[0];

    transaction.amount = Number(
      transaction.amount || 0
    );

    transaction.deduct_from_salary = Number(
      transaction.deduct_from_salary || 0
    );

    return res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error(
      "Get transaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load transaction",
    });
  }
};


// =====================================================
// CREATE TRANSACTION
// =====================================================
const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
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
    } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: "Account is required",
      });
    }

    if (!transaction_date) {
      return res.status(400).json({
        success: false,
        message: "Transaction date is required",
      });
    }

    if (!["CREDIT", "DEBIT", "TRANSFER"].includes(
      transaction_type
    )) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    const transactionAmount = Number(amount);

    if (
      !Number.isFinite(transactionAmount) ||
      transactionAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const [account] = await connection.query(
      `
      SELECT id
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [account_id]
    );

    if (account.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (
      transaction_type === "TRANSFER" &&
      !related_account_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Related account is required for transfer",
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        account_id,
        transaction_no || null,
        transaction_date,
        transaction_type,
        transactionAmount,
        category || null,
        description || null,
        reference_no || null,
        related_account_id || null,
        employee_id || null,
        Number(deduct_from_salary || 0),
        salary_month || null,
        Number(status ?? 1),
        req.user?.id || null,
      ]
    );

    /*
     * If this is an employee expense,
     * create/update employee expense record.
     */
    if (employee_id) {
      await connection.query(
        `
        INSERT INTO employee_expenses
        (
          employee_id,
          account_id,
          transaction_id,
          expense_date,
          expense_type,
          amount,
          description,
          reference_no,
          deduct_from_salary,
          salary_month,
          deduction_status,
          status,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          employee_id,
          account_id,
          result.insertId,
          transaction_date,
          category || "Employee Expense",
          transactionAmount,
          description || null,
          reference_no || null,
          Number(deduct_from_salary || 0),
          salary_month || null,
          Number(deduct_from_salary || 0)
            ? "PENDING"
            : "NOT_APPLICABLE",
          Number(status ?? 1),
          req.user?.id || null,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Create transaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  } finally {
    connection.release();
  }
};


// =====================================================
// DELETE TRANSACTION
// =====================================================
const deleteTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const [transaction] = await connection.query(
      `
      SELECT id
      FROM account_transactions
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (transaction.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await connection.beginTransaction();

    await connection.query(
      `
      DELETE FROM employee_expenses
      WHERE transaction_id = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM account_transactions
      WHERE id = ?
      `,
      [id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Delete transaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  } finally {
    connection.release();
  }
};


module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  deleteTransaction,
};