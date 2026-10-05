const { pool } = require("../db.js");

/* ============================================================
   GET ALL EMPLOYEES
   GET /api/employees
   ============================================================ */

const getEmployees = async (req, res) => {
  try {
    const {
      search = "",
      department_id = "",
      status = "",
    } = req.query;

    let sql = `
      SELECT
        e.id,
        e.employee_code,
        e.user_id,
        e.department_id,

        e.name,
        e.first_name,
        e.last_name,
        e.father_name,

        e.mobile,
        e.email,
        e.joining_date,
        e.designation,
        e.basic_salary,

        e.bank_name,
        e.account_number,
        e.ifsc_code,
        e.pan_number,

        e.remarks,
        e.status,

        d.name AS department_name,

        u.username,
        u.role

      FROM employees e

      LEFT JOIN departments d
        ON d.id = e.department_id

      LEFT JOIN users u
        ON u.id = e.user_id

      WHERE 1 = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += `
        AND (
          e.name LIKE ?
          OR e.employee_code LIKE ?
          OR e.mobile LIKE ?
          OR e.email LIKE ?
          OR e.designation LIKE ?
        )
      `;

      const value = `%${search.trim()}%`;

      params.push(
        value,
        value,
        value,
        value,
        value
      );
    }

    if (department_id) {
      sql += ` AND e.department_id = ? `;
      params.push(department_id);
    }

    if (status !== "") {
      sql += ` AND e.status = ? `;
      params.push(status);
    }

    sql += ` ORDER BY e.id DESC `;

    const [employees] = await pool.query(
      sql,
      params
    );

    res.json({
      success: true,
      employees,
    });

  } catch (error) {
    console.error(
      "Get employees error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};


/* ============================================================
   GET SINGLE EMPLOYEE
   GET /api/employees/:id
   ============================================================ */

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        e.id,
        e.employee_code,
        e.user_id,
        e.department_id,

        e.name,
        e.first_name,
        e.last_name,
        e.father_name,

        e.mobile,
        e.email,
        e.joining_date,
        e.designation,
        e.basic_salary,

        e.bank_name,
        e.account_number,
        e.ifsc_code,
        e.pan_number,

        e.remarks,
        e.status,

        d.name AS department_name,

        u.username,
        u.role

      FROM employees e

      LEFT JOIN departments d
        ON d.id = e.department_id

      LEFT JOIN users u
        ON u.id = e.user_id

      WHERE e.id = ?

      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      employee: rows[0],
    });

  } catch (error) {
    console.error(
      "Get employee error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
};


/* ============================================================
   CREATE EMPLOYEE
   POST /api/employees
   ============================================================ */

const createEmployee = async (req, res) => {
  try {
    const {
      employee_code,
      user_id = null,
      department_id = null,

      name,
      first_name = null,
      last_name = null,
      father_name = null,

      mobile = null,
      email = null,
      joining_date = null,
      designation = null,

      basic_salary = 0,

      bank_name = null,
      account_number = null,
      ifsc_code = null,
      pan_number = null,

      remarks = null,
      status = 1,
    } = req.body;

    if (!employee_code || !employee_code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee name is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM employees
      WHERE employee_code = ?
      LIMIT 1
      `,
      [employee_code.trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Employee code already exists",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO employees
      (
        employee_code,
        user_id,
        department_id,

        name,
        first_name,
        last_name,
        father_name,

        mobile,
        email,
        joining_date,
        designation,

        basic_salary,

        bank_name,
        account_number,
        ifsc_code,
        pan_number,

        remarks,
        status,
        created_by
      )
      VALUES
      (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
      `,
      [
        employee_code.trim(),
        user_id || null,
        department_id || null,

        name.trim(),
        first_name || null,
        last_name || null,
        father_name || null,

        mobile || null,
        email || null,
        joining_date || null,
        designation || null,

        Number(basic_salary) || 0,

        bank_name || null,
        account_number || null,
        ifsc_code || null,
        pan_number || null,

        remarks || null,
        Number(status) ? 1 : 0,
        req.user?.id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee_id: result.insertId,
    });

  } catch (error) {
    console.error(
      "Create employee error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
};


/* ============================================================
   UPDATE EMPLOYEE
   PUT /api/employees/:id
   ============================================================ */

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      employee_code,
      user_id = null,
      department_id = null,

      name,
      first_name = null,
      last_name = null,
      father_name = null,

      mobile = null,
      email = null,
      joining_date = null,
      designation = null,

      basic_salary = 0,

      bank_name = null,
      account_number = null,
      ifsc_code = null,
      pan_number = null,

      remarks = null,
      status = 1,
    } = req.body;

    if (!employee_code || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Employee code and name are required",
      });
    }

    const [employee] = await pool.query(
      `
      SELECT id
      FROM employees
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!employee.length) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const [duplicate] = await pool.query(
      `
      SELECT id
      FROM employees
      WHERE employee_code = ?
      AND id <> ?
      LIMIT 1
      `,
      [
        employee_code.trim(),
        id,
      ]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "Employee code already exists",
      });
    }

    await pool.query(
      `
      UPDATE employees
      SET
        employee_code = ?,
        user_id = ?,
        department_id = ?,

        name = ?,
        first_name = ?,
        last_name = ?,
        father_name = ?,

        mobile = ?,
        email = ?,
        joining_date = ?,
        designation = ?,

        basic_salary = ?,

        bank_name = ?,
        account_number = ?,
        ifsc_code = ?,
        pan_number = ?,

        remarks = ?,
        status = ?

      WHERE id = ?
      `,
      [
        employee_code.trim(),
        user_id || null,
        department_id || null,

        name.trim(),
        first_name || null,
        last_name || null,
        father_name || null,

        mobile || null,
        email || null,
        joining_date || null,
        designation || null,

        Number(basic_salary) || 0,

        bank_name || null,
        account_number || null,
        ifsc_code || null,
        pan_number || null,

        remarks || null,
        Number(status) ? 1 : 0,

        id,
      ]
    );

    res.json({
      success: true,
      message: "Employee updated successfully",
    });

  } catch (error) {
    console.error(
      "Update employee error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};


/* ============================================================
   DEACTIVATE EMPLOYEE
   DELETE /api/employees/:id
   ============================================================ */

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      UPDATE employees
      SET status = 0
      WHERE id = ?
      `,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Employee deactivated successfully",
    });

  } catch (error) {
    console.error(
      "Delete employee error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to deactivate employee",
    });
  }
};


module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};