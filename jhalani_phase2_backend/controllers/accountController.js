
// =====================================================
// GET ALL ACCOUNTS

const { pool } = require("../db");

// =====================================================
const getAccounts = async (req, res) => {
  try {
    const [accounts] = await pool.query(`
      SELECT
        a.id,
        a.account_name,
        a.account_type,
        a.account_number,
        a.bank_name,
        a.opening_balance,
        a.status,
        a.remarks,
        a.created_at,
        a.updated_at,

        COALESCE(
          SUM(
            CASE
              WHEN t.transaction_type = 'CREDIT'
              THEN t.amount
              WHEN t.transaction_type = 'DEBIT'
              THEN -t.amount
              ELSE 0
            END
          ),
          0
        ) AS transaction_balance

      FROM accounts a

      LEFT JOIN account_transactions t
        ON t.account_id = a.id
        AND t.status = 1

      GROUP BY
        a.id,
        a.account_name,
        a.account_type,
        a.account_number,
        a.bank_name,
        a.opening_balance,
        a.status,
        a.remarks,
        a.created_at,
        a.updated_at

      ORDER BY a.id DESC
    `);

    const data = accounts.map((account) => ({
      ...account,
      opening_balance: Number(account.opening_balance || 0),
      transaction_balance: Number(
        account.transaction_balance || 0
      ),
      current_balance:
        Number(account.opening_balance || 0) +
        Number(account.transaction_balance || 0),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load accounts",
    });
  }
};


// =====================================================
// GET SINGLE ACCOUNT
// =====================================================
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const [accounts] = await pool.query(
      `
      SELECT
        id,
        account_name,
        account_type,
        account_number,
        bank_name,
        opening_balance,
        status,
        remarks,
        created_at,
        updated_at
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const account = accounts[0];

    const [transactions] = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN transaction_type = 'CREDIT'
              THEN amount
              WHEN transaction_type = 'DEBIT'
              THEN -amount
              ELSE 0
            END
          ),
          0
        ) AS transaction_balance
      FROM account_transactions
      WHERE account_id = ?
        AND status = 1
      `,
      [id]
    );

    const transactionBalance = Number(
      transactions[0]?.transaction_balance || 0
    );

    return res.json({
      success: true,
      data: {
        ...account,
        opening_balance: Number(
          account.opening_balance || 0
        ),
        transaction_balance: transactionBalance,
        current_balance:
          Number(account.opening_balance || 0) +
          transactionBalance,
      },
    });
  } catch (error) {
    console.error(
      "Get account by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load account",
    });
  }
};


// =====================================================
// CREATE ACCOUNT
// =====================================================
const createAccount = async (req, res) => {
  try {
    const {
      account_name,
      account_type,
      account_number,
      bank_name,
      opening_balance,
      status,
      remarks,
    } = req.body;

    if (!account_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account name is required",
      });
    }

    const allowedTypes = [
      "CASH",
      "BANK",
      "UPI",
      "OTHER",
    ];

    if (!allowedTypes.includes(account_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM accounts
      WHERE account_name = ?
      LIMIT 1
      `,
      [account_name.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO accounts
      (
        account_name,
        account_type,
        account_number,
        bank_name,
        opening_balance,
        status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        account_name.trim(),
        account_type,
        account_number || null,
        bank_name || null,
        Number(opening_balance || 0),
        Number(status ?? 1),
        remarks || null,
        req.user?.id || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error(
      "Create account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};


// =====================================================
// UPDATE ACCOUNT
// =====================================================
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      account_name,
      account_type,
      account_number,
      bank_name,
      opening_balance,
      status,
      remarks,
    } = req.body;

    if (!account_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account name is required",
      });
    }

    const allowedTypes = [
      "CASH",
      "BANK",
      "UPI",
      "OTHER",
    ];

    if (!allowedTypes.includes(account_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    await pool.query(
      `
      UPDATE accounts
      SET
        account_name = ?,
        account_type = ?,
        account_number = ?,
        bank_name = ?,
        opening_balance = ?,
        status = ?,
        remarks = ?
      WHERE id = ?
      `,
      [
        account_name.trim(),
        account_type,
        account_number || null,
        bank_name || null,
        Number(opening_balance || 0),
        Number(status ?? 1),
        remarks || null,
        id,
      ]
    );

    return res.json({
      success: true,
      message: "Account updated successfully",
    });
  } catch (error) {
    console.error(
      "Update account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update account",
    });
  }
};


// =====================================================
// DELETE ACCOUNT
// =====================================================
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const [transactions] = await pool.query(
      `
      SELECT id
      FROM account_transactions
      WHERE account_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (transactions.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This account has transactions and cannot be deleted.",
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM accounts
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

// =====================================================
// GET ACCOUNT TRANSACTIONS
// =====================================================
const getAccountTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    const [account] = await pool.query(
      `
      SELECT
        id,
        account_name,
        account_type,
        opening_balance
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (account.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const [transactions] = await pool.query(
      `
      SELECT
        t.id,
        t.account_id,
        t.transaction_no,
        t.transaction_date,
        t.transaction_type,
        t.amount,
        t.category,
        t.description,
        t.reference_no,
        t.related_account_id,
        t.employee_id,
        t.deduct_from_salary,
        t.salary_month,
        t.status,
        t.created_at,

        ra.account_name AS related_account_name,

        e.name AS employee_name

      FROM account_transactions t

      LEFT JOIN accounts ra
        ON ra.id = t.related_account_id

      LEFT JOIN employees e
        ON e.id = t.employee_id

      WHERE t.account_id = ?

      ORDER BY
        t.transaction_date DESC,
        t.id DESC
      `,
      [id]
    );

    let balance = Number(
      account[0].opening_balance || 0
    );

    const data = transactions
      .reverse()
      .map((transaction) => {
        const amount = Number(
          transaction.amount || 0
        );

        if (
          transaction.transaction_type ===
          "CREDIT"
        ) {
          balance += amount;
        }

        if (
          transaction.transaction_type ===
          "DEBIT"
        ) {
          balance -= amount;
        }

        return {
          ...transaction,
          amount,
          running_balance: balance,
        };
      })
      .reverse();

    return res.json({
      success: true,
      data,
      opening_balance: Number(
        account[0].opening_balance || 0
      ),
      current_balance: balance,
    });
  } catch (error) {
    console.error(
      "Get account transactions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load account transactions",
    });
  }
};


// =====================================================
// CREATE ACCOUNT TRANSACTION
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
        message:
          "Transaction date is required",
      });
    }

    if (
      !["CREDIT", "DEBIT", "TRANSFER"].includes(
        transaction_type
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid transaction type",
      });
    }

    const transactionAmount = Number(amount);

    if (
      !Number.isFinite(transactionAmount) ||
      transactionAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be greater than zero",
      });
    }

    await connection.beginTransaction();

    // -----------------------------------------------
    // CHECK SOURCE ACCOUNT
    // -----------------------------------------------
    const [accounts] = await connection.query(
      `
      SELECT
        id,
        account_name,
        account_type,
        opening_balance
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [account_id]
    );

    if (accounts.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // -----------------------------------------------
    // TRANSACTION NUMBER
    // -----------------------------------------------
    const generatedTransactionNo =
      transaction_no?.trim() ||
      `TXN-${Date.now()}`;

    // -----------------------------------------------
    // NORMAL CREDIT / DEBIT
    // -----------------------------------------------
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `,
      [
        account_id,
        generatedTransactionNo,
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
        req.user?.id || null,
      ]
    );

    // -----------------------------------------------
    // TRANSFER
    // -----------------------------------------------
    if (
      transaction_type === "TRANSFER"
    ) {
      if (!related_account_id) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Destination account is required for transfer",
        });
      }

      if (
        Number(related_account_id) ===
        Number(account_id)
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Source and destination accounts cannot be same",
        });
      }

      const [destination] =
        await connection.query(
          `
          SELECT id
          FROM accounts
          WHERE id = ?
          LIMIT 1
          `,
          [related_account_id]
        );

      if (destination.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Destination account not found",
        });
      }

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
          status,
          created_by
        )
        VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, ?, ?, 1, ?)
        `,
        [
          related_account_id,
          `${generatedTransactionNo}-IN`,
          transaction_date,
          transactionAmount,
          category || "TRANSFER",
          description ||
            `Transfer from account ${account_id}`,
          reference_no || null,
          account_id,
          req.user?.id || null,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        transaction_type === "TRANSFER"
          ? "Transfer recorded successfully"
          : "Transaction recorded successfully",
      data: {
        id: result.insertId,
        transaction_no:
          generatedTransactionNo,
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
      message:
        "Failed to create transaction",
    });
  } finally {
    connection.release();
  }
};
// =====================================================
// GET ACCOUNT BALANCE
// =====================================================
const getAccountBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        a.id,
        a.account_name,
        a.account_type,
        a.opening_balance,

        COALESCE(
          SUM(
            CASE
              WHEN t.transaction_type = 'CREDIT'
                THEN t.amount

              WHEN t.transaction_type = 'DEBIT'
                THEN -t.amount

              ELSE 0
            END
          ),
          0
        ) AS transaction_balance

      FROM accounts a

      LEFT JOIN account_transactions t
        ON t.account_id = a.id
        AND t.status = 1

      WHERE a.id = ?

      GROUP BY
        a.id,
        a.account_name,
        a.account_type,
        a.opening_balance
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const account = rows[0];

    const openingBalance = Number(
      account.opening_balance || 0
    );

    const transactionBalance = Number(
      account.transaction_balance || 0
    );

    return res.json({
      success: true,
      data: {
        ...account,
        opening_balance: openingBalance,
        transaction_balance:
          transactionBalance,
        current_balance:
          openingBalance +
          transactionBalance,
      },
    });
  } catch (error) {
    console.error(
      "Get account balance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load account balance",
    });
  }
};
module.exports = {
  getAccounts,
  getAccountById,
  getAccountTransactions,
  getAccountBalance,
  createAccount,
  updateAccount,
  deleteAccount,
  createTransaction,
};