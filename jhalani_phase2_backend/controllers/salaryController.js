const { pool } = require("../db.js");

// =====================================================
// HELPERS
// =====================================================

const toNumber = (value) => Number(value || 0);

const normalizeSalary = (
  salary,
  expenseDeduction = 0
) => {
  const basic = toNumber(salary.basic_salary);
  const allowances = toNumber(salary.allowances);
  const credits = toNumber(salary.credit_total);

  const gross =
    salary.gross_salary !== null &&
    salary.gross_salary !== undefined
      ? toNumber(salary.gross_salary)
      : basic + allowances + credits;

  const storedDebit = toNumber(
    salary.debit_total
  );

  /*
   * Prevent salary expenses from being
   * deducted twice if debit_total already
   * contains the same expense.
   */
  const manualDebit = Math.max(
    storedDebit - expenseDeduction,
    0
  );

  const totalDeductions =
    expenseDeduction + manualDebit;

  const calculatedNet =
    gross - totalDeductions;

  return {
    ...salary,

    basic_salary: basic,
    allowances,
    credit_total: credits,
    debit_total: storedDebit,

    gross_salary: gross,

    // Actual employee expense deduction
    salary_expense_deductions:
      expenseDeduction,

    // Other deductions
    other_deductions: manualDebit,

    total_deductions:
      totalDeductions,

    net_salary:
      calculatedNet,

    // Backward compatibility
    expense_deductions:
      expenseDeduction,

    payment_status:
      salary.status || "DRAFT",
  };
};


// =====================================================
// GET SALARY EXPENSE DEDUCTION
// =====================================================
//
// Reads employee_expenses.
//
// Conditions:
// employee_id matches
// deduct_from_salary = 1
// status = 1
// salary_month matches
//
// deduction_status is intentionally NOT checked.
// Newly-created salary deductions are PENDING,
// but they should still appear in salary calculation.
// =====================================================

const getSalaryExpenseDeduction = async (
  employeeId,
  salaryMonth
) => {
  if (!employeeId || !salaryMonth) {
    return 0;
  }

  const [rows] = await pool.query(
    `
    SELECT
      COALESCE(
        SUM(ee.amount),
        0
      ) AS expense_deductions

    FROM employee_expenses ee

    WHERE ee.employee_id = ?
      AND ee.deduct_from_salary = 1
      AND ee.status = 1

      AND DATE_FORMAT(
        ee.salary_month,
        '%Y-%m'
      ) = DATE_FORMAT(
        ?,
        '%Y-%m'
      )
    `,
    [
      employeeId,
      salaryMonth,
    ]
  );

  return toNumber(
    rows[0]?.expense_deductions
  );
};


// =====================================================
// GET ALL SALARIES
// =====================================================

const getSalaries = async (
  req,
  res
) => {
  try {
    const [salaries] =
      await pool.query(`
        SELECT
          s.id,
          s.employee_id,
          s.salary_month,
          s.basic_salary,
          s.allowances,
          s.credit_total,
          s.debit_total,
          s.gross_salary,
          s.net_salary,
          s.payment_date,
          s.payment_mode,
          s.payment_reference,
          s.status,
          s.remarks,
          s.created_at,
          s.updated_at,

          e.employee_code,
          e.name AS employee_name,
          e.designation,

          d.name AS department_name

        FROM employee_salaries s

        LEFT JOIN employees e
          ON e.id = s.employee_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        ORDER BY
          s.salary_month DESC,
          s.id DESC
      `);

    const data =
      await Promise.all(
        salaries.map(
          async (salary) => {
            const expenseDeduction =
              await getSalaryExpenseDeduction(
                salary.employee_id,
                salary.salary_month
              );

            return normalizeSalary(
              salary,
              expenseDeduction
            );
          }
        )
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get salaries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load salaries",
    });
  }
};


// =====================================================
// GET CURRENT SALARY
// =====================================================

const getCurrentSalary = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
    } = req.params;

    const [rows] =
      await pool.query(
        `
        SELECT
          s.id,
          s.employee_id,
          s.salary_month,
          s.basic_salary,
          s.allowances,
          s.credit_total,
          s.debit_total,
          s.gross_salary,
          s.net_salary,
          s.payment_date,
          s.payment_mode,
          s.payment_reference,
          s.status,
          s.remarks,
          s.created_at,
          s.updated_at,

          e.employee_code,
          e.name AS employee_name,
          e.designation,

          d.name AS department_name

        FROM employee_salaries s

        LEFT JOIN employees e
          ON e.id = s.employee_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE s.employee_id = ?

        ORDER BY
          s.salary_month DESC,
          s.id DESC

        LIMIT 1
        `,
        [employeeId]
      );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Salary record not found",
      });
    }

    const salary = rows[0];

    const expenseDeduction =
      await getSalaryExpenseDeduction(
        salary.employee_id,
        salary.salary_month
      );

    return res.json({
      success: true,
      data: normalizeSalary(
        salary,
        expenseDeduction
      ),
    });
  } catch (error) {
    console.error(
      "Get current salary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load current salary",
    });
  }
};


// =====================================================
// GET SALARY HISTORY
// =====================================================

const getSalaryHistory = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
    } = req.params;

    const [rows] =
      await pool.query(
        `
        SELECT
          s.id,
          s.employee_id,
          s.salary_month,
          s.basic_salary,
          s.allowances,
          s.credit_total,
          s.debit_total,
          s.gross_salary,
          s.net_salary,
          s.payment_date,
          s.payment_mode,
          s.payment_reference,
          s.status,
          s.remarks,
          s.created_at,
          s.updated_at,

          e.employee_code,
          e.name AS employee_name,

          d.name AS department_name

        FROM employee_salaries s

        LEFT JOIN employees e
          ON e.id = s.employee_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE s.employee_id = ?

        ORDER BY
          s.salary_month DESC,
          s.id DESC
        `,
        [employeeId]
      );

    const data =
      await Promise.all(
        rows.map(
          async (salary) => {
            const expenseDeduction =
              await getSalaryExpenseDeduction(
                salary.employee_id,
                salary.salary_month
              );

            return normalizeSalary(
              salary,
              expenseDeduction
            );
          }
        )
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get salary history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load salary history",
    });
  }
};


// =====================================================
// CREATE SALARY
// =====================================================

const createSalary = async (
  req,
  res
) => {
  try {
    const {
      employee_id,
      salary_month,
      basic_salary,
      allowances,
      credit_total,
      debit_total,
      gross_salary,
      net_salary,
      payment_date,
      payment_mode,
      payment_reference,
      status,
      remarks,
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message:
          "Employee is required",
      });
    }

    if (!salary_month) {
      return res.status(400).json({
        success: false,
        message:
          "Salary month is required",
      });
    }

    // Salary is already stored in employees.
    let basic =
      basic_salary === undefined ||
      basic_salary === null ||
      basic_salary === ""
        ? 0
        : toNumber(basic_salary);

    if (
      basic_salary === undefined ||
      basic_salary === null ||
      basic_salary === ""
    ) {
      const [employees] =
        await pool.query(
          `
          SELECT
            basic_salary
          FROM employees
          WHERE id = ?
          LIMIT 1
          `,
          [employee_id]
        );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      basic =
        toNumber(
          employees[0].basic_salary
        );
    }

    const allowance =
      toNumber(allowances);

    const credit =
      toNumber(credit_total);

    const expenseDeduction =
      await getSalaryExpenseDeduction(
        employee_id,
        salary_month
      );

    const storedDebit =
      toNumber(debit_total);

    const manualDebit =
      Math.max(
        storedDebit -
          expenseDeduction,
        0
      );

    const gross =
      gross_salary !== undefined &&
      gross_salary !== null &&
      gross_salary !== ""
        ? toNumber(gross_salary)
        : basic +
          allowance +
          credit;

    const totalDeductions =
      expenseDeduction +
      manualDebit;

    const net =
      net_salary !== undefined &&
      net_salary !== null &&
      net_salary !== ""
        ? toNumber(net_salary)
        : gross -
          totalDeductions;

    const [existing] =
      await pool.query(
        `
        SELECT id
        FROM employee_salaries
        WHERE employee_id = ?
          AND salary_month = ?
        LIMIT 1
        `,
        [
          employee_id,
          salary_month,
        ]
      );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Salary already exists for this employee and month",
      });
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO employee_salaries
        (
          employee_id,
          salary_month,
          basic_salary,
          allowances,
          credit_total,
          debit_total,
          gross_salary,
          net_salary,
          payment_date,
          payment_mode,
          payment_reference,
          status,
          remarks,
          created_by
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          employee_id,
          salary_month,
          basic,
          allowance,
          credit,
          totalDeductions,
          gross,
          net,
          payment_date || null,
          payment_mode || null,
          payment_reference || null,
          status || "DRAFT",
          remarks || null,
          req.user?.id || null,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Salary created successfully",

      data: {
        id: result.insertId,

        expense_deductions:
          expenseDeduction,

        total_deductions:
          totalDeductions,

        gross_salary:
          gross,

        net_salary:
          net,
      },
    });
  } catch (error) {
    console.error(
      "Create salary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create salary",
    });
  }
};


// =====================================================
// UPDATE SALARY
// =====================================================

const updateSalary = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      employee_id,
      salary_month,
      basic_salary,
      allowances,
      credit_total,
      debit_total,
      gross_salary,
      net_salary,
      payment_date,
      payment_mode,
      payment_reference,
      status,
      remarks,
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message:
          "Employee is required",
      });
    }

    if (!salary_month) {
      return res.status(400).json({
        success: false,
        message:
          "Salary month is required",
      });
    }

    const [existing] =
      await pool.query(
        `
        SELECT id
        FROM employee_salaries
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Salary not found",
      });
    }

    const basic =
      toNumber(basic_salary);

    const allowance =
      toNumber(allowances);

    const credit =
      toNumber(credit_total);

    const expenseDeduction =
      await getSalaryExpenseDeduction(
        employee_id,
        salary_month
      );

    const storedDebit =
      toNumber(debit_total);

    const manualDebit =
      Math.max(
        storedDebit -
          expenseDeduction,
        0
      );

    const gross =
      gross_salary !== undefined &&
      gross_salary !== null &&
      gross_salary !== ""
        ? toNumber(gross_salary)
        : basic +
          allowance +
          credit;

    const totalDeductions =
      expenseDeduction +
      manualDebit;

    const net =
      net_salary !== undefined &&
      net_salary !== null &&
      net_salary !== ""
        ? toNumber(net_salary)
        : gross -
          totalDeductions;

    await pool.query(
      `
      UPDATE employee_salaries
      SET
        employee_id = ?,
        salary_month = ?,
        basic_salary = ?,
        allowances = ?,
        credit_total = ?,
        debit_total = ?,
        gross_salary = ?,
        net_salary = ?,
        payment_date = ?,
        payment_mode = ?,
        payment_reference = ?,
        status = ?,
        remarks = ?

      WHERE id = ?
      `,
      [
        employee_id,
        salary_month,
        basic,
        allowance,
        credit,
        totalDeductions,
        gross,
        net,
        payment_date || null,
        payment_mode || null,
        payment_reference || null,
        status || "DRAFT",
        remarks || null,
        id,
      ]
    );

    return res.json({
      success: true,
      message:
        "Salary updated successfully",

      data: {
        expense_deductions:
          expenseDeduction,

        total_deductions:
          totalDeductions,

        gross_salary:
          gross,

        net_salary:
          net,
      },
    });
  } catch (error) {
    console.error(
      "Update salary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update salary",
    });
  }
};


// =====================================================
// DEACTIVATE / CANCEL SALARY
// =====================================================

const deactivateSalary = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const [result] =
      await pool.query(
        `
        UPDATE employee_salaries
        SET status = 'CANCELLED'
        WHERE id = ?
        `,
        [id]
      );

    if (
      result.affectedRows === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Salary not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Salary cancelled successfully",
    });
  } catch (error) {
    console.error(
      "Deactivate salary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel salary",
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getSalaries,
  getCurrentSalary,
  getSalaryHistory,
  createSalary,
  updateSalary,
  deactivateSalary,
};