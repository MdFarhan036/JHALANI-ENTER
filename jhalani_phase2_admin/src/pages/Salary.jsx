import { useEffect, useMemo, useState } from "react";
import MasterModal from "../components/common/Modal";
import "../styles/master.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EMPTY_FORM = {
  salary_month: "",
  basic_salary: "0",
  allowances: "0",
  credit_total: "0",
  debit_total: "0",
  gross_salary: "0",
  net_salary: "0",
  payment_date: "",
  payment_mode: "",
  payment_reference: "",
  status: "DRAFT",
  remarks: "",
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatAmount = (value) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const normalizeDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const getMonthKey = (value) => {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}/.test(text)) {
    return text.slice(0, 7);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

export default function Salary() {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeeResponse, salaryResponse] =
        await Promise.all([
          fetch(`${API_URL}/employees`, {
            credentials: "include",
          }),

          fetch(`${API_URL}/salaries`, {
            credentials: "include",
          }),
        ]);

      const employeeResult =
        await employeeResponse.json();

      const salaryResult =
        await salaryResponse.json();

      if (
        !employeeResponse.ok ||
        !employeeResult.success
      ) {
        throw new Error(
          employeeResult.message ||
            "Failed to load employees"
        );
      }

      if (
        !salaryResponse.ok ||
        !salaryResult.success
      ) {
        throw new Error(
          salaryResult.message ||
            "Failed to load salaries"
        );
      }

      setEmployees(
        employeeResult.employees ||
          employeeResult.data ||
          []
      );

      setSalaries(
        salaryResult.data || []
      );
    } catch (err) {
      console.error(
        "Salary load error:",
        err
      );

      setError(
        err.message ||
          "Failed to load salary data"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SALARY ROWS
  // =====================================================

  const salaryRows = useMemo(() => {
    const activeEmployees =
      employees.filter(
        (employee) =>
          Number(employee.status ?? 1) === 1
      );

    const employeeMap = new Map();

    activeEmployees.forEach((employee) => {
      employeeMap.set(
        Number(employee.id),
        employee
      );
    });

    // -----------------------------------------------------
    // ACTUAL SALARY RECORDS
    // -----------------------------------------------------

    const actualRows = salaries
      .filter((salary) =>
        employeeMap.has(
          Number(salary.employee_id)
        )
      )
      .map((salary) => {
        const employee =
          employeeMap.get(
            Number(salary.employee_id)
          );

        const basicSalary =
          toNumber(
            salary.basic_salary ??
              employee.basic_salary
          );

        const allowances =
          toNumber(
            salary.allowances
          );

        const creditTotal =
          toNumber(
            salary.credit_total
          );

        /*
         * IMPORTANT:
         *
         * Backend now returns:
         *
         * salary_expense_deductions
         * expense_deductions
         * total_deductions
         *
         * We MUST use those values first.
         *
         * Do NOT rely only on debit_total.
         */

        const salaryExpenseDeduction =
          toNumber(
            salary.salary_expense_deductions ??
              salary.expense_deductions ??
              0
          );

        const totalDeductions =
          toNumber(
            salary.total_deductions ??
              salary.debit_total ??
              salaryExpenseDeduction
          );

        const grossSalary =
          salary.gross_salary !==
            undefined &&
          salary.gross_salary !== null
            ? toNumber(
                salary.gross_salary
              )
            : basicSalary +
              allowances +
              creditTotal;

        /*
         * Always calculate net from
         * gross - deductions.
         *
         * This prevents an old/stale net_salary
         * from hiding the deduction.
         */

        const calculatedNetSalary =
          grossSalary -
          totalDeductions;

        return {
          ...employee,

          salary_id: salary.id,

          employee_id:
            Number(employee.id),

          salary_month:
            salary.salary_month,

          salary_basic:
            basicSalary,

          allowances,

          credit_total:
            creditTotal,

          /*
           * Keep debit_total for compatibility.
           * But now it represents the actual
           * total deduction shown in the UI.
           */
          debit_total:
            totalDeductions,

          /*
           * New explicit fields.
           */
          salary_expense_deductions:
            salaryExpenseDeduction,

          expense_deductions:
            salaryExpenseDeduction,

          total_deductions:
            totalDeductions,

          gross_salary:
            grossSalary,

          net_salary:
            calculatedNetSalary,

          payment_date:
            salary.payment_date || null,

          payment_mode:
            salary.payment_mode || null,

          payment_reference:
            salary.payment_reference ||
            null,

          salary_status:
            salary.status ||
            "DRAFT",

          salary_remarks:
            salary.remarks || "",

          has_salary_record: true,
        };
      });

    // -----------------------------------------------------
    // PLACEHOLDER MONTH ROWS
    // -----------------------------------------------------

    const targetMonth =
      selectedMonth ||
      new Date()
        .toISOString()
        .slice(0, 7);

    const actualEmployeeMonthKeys =
      new Set(
        salaries.map((salary) => {
          const employeeId =
            Number(
              salary.employee_id
            );

          const month =
            getMonthKey(
              salary.salary_month
            );

          return `${employeeId}-${month}`;
        })
      );

    const placeholderRows =
      activeEmployees
        .filter((employee) => {
          const key =
            `${Number(employee.id)}-${targetMonth}`;

          return !actualEmployeeMonthKeys.has(
            key
          );
        })
        .map((employee) => {
          const basicSalary =
            toNumber(
              employee.basic_salary
            );

          return {
            ...employee,

            salary_id: null,

            employee_id:
              Number(employee.id),

            salary_month:
              `${targetMonth}-01`,

            salary_basic:
              basicSalary,

            allowances: 0,

            credit_total: 0,

            salary_expense_deductions: 0,

            expense_deductions: 0,

            total_deductions: 0,

            debit_total: 0,

            gross_salary:
              basicSalary,

            net_salary:
              basicSalary,

            payment_date: null,

            payment_mode: null,

            payment_reference: null,

            salary_status:
              "NOT PROCESSED",

            salary_remarks: "",

            has_salary_record: false,
          };
        });

    // -----------------------------------------------------
    // MONTH FILTER
    // -----------------------------------------------------

    if (selectedMonth) {
      return [
        ...actualRows.filter(
          (row) =>
            getMonthKey(
              row.salary_month
            ) === selectedMonth
        ),

        ...placeholderRows,
      ].sort((a, b) =>
        String(
          a.name || ""
        ).localeCompare(
          String(
            b.name || ""
          )
        )
      );
    }

    // -----------------------------------------------------
    // ALL MONTHS
    // -----------------------------------------------------

    return [
      ...actualRows,
      ...placeholderRows,
    ].sort((a, b) => {
      const monthA =
        new Date(
          a.salary_month ||
            "1900-01-01"
        ).getTime();

      const monthB =
        new Date(
          b.salary_month ||
            "1900-01-01"
        ).getTime();

      if (monthA !== monthB) {
        return monthB - monthA;
      }

      return String(
        a.name || ""
      ).localeCompare(
        String(
          b.name || ""
        )
      );
    });
  }, [
    employees,
    salaries,
    selectedMonth,
  ]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredRows = useMemo(() => {
    const query =
      search
        .trim()
        .toLowerCase();

    return salaryRows.filter(
      (row) => {
        const matchesSearch =
          !query ||
          String(
            row.name || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            row.employee_code || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            row.department_name ||
              row.department ||
              ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            row.designation || ""
          )
            .toLowerCase()
            .includes(query);

        const status =
          String(
            row.salary_status ||
              "DRAFT"
          ).toUpperCase();

        const matchesStatus =
          statusFilter === "ALL" ||
          status ===
            String(
              statusFilter
            ).toUpperCase();

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    salaryRows,
    search,
    statusFilter,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.employees += 1;

        acc.gross +=
          toNumber(
            row.gross_salary
          );

        acc.deductions +=
          toNumber(
            row.total_deductions
          );

        acc.net +=
          toNumber(
            row.net_salary
          );

        return acc;
      },
      {
        employees: 0,
        gross: 0,
        deductions: 0,
        net: 0,
      }
    );
  }, [filteredRows]);

  // =====================================================
  // OPEN PAYMENT MODAL
  // =====================================================

  const openPaymentModal = (
    row
  ) => {
    if (!row.salary_id) {
      setError(
        "Salary has not been processed for this employee and month."
      );
      return;
    }

    setError("");

    setEditingId(
      row.salary_id
    );

    setForm({
      salary_month:
        normalizeDate(
          row.salary_month
        ),

      basic_salary:
        String(
          row.salary_basic || 0
        ),

      allowances:
        String(
          row.allowances || 0
        ),

      credit_total:
        String(
          row.credit_total || 0
        ),

      debit_total:
        String(
          row.total_deductions ||
            0
        ),

      gross_salary:
        String(
          row.gross_salary || 0
        ),

      net_salary:
        String(
          row.net_salary || 0
        ),

      payment_date:
        normalizeDate(
          row.payment_date
        ),

      payment_mode:
        row.payment_mode || "",

      payment_reference:
        row.payment_reference ||
        "",

      status:
        row.salary_status ||
        "DRAFT",

      remarks:
        row.salary_remarks ||
        "",
    });

    setModalOpen(true);
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SUBMIT PAYMENT UPDATE
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!editingId) {
      setError(
        "No salary record selected."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/salaries/${editingId}`,
          {
            method: "PUT",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              salary_month:
                form.salary_month,

              basic_salary:
                toNumber(
                  form.basic_salary
                ),

              allowances:
                toNumber(
                  form.allowances
                ),

              credit_total:
                toNumber(
                  form.credit_total
                ),

              /*
               * This value is sent only
               * for other/manual deductions.
               *
               * Backend recalculates salary
               * expenses automatically.
               */
              debit_total:
                toNumber(
                  form.debit_total
                ),

              gross_salary:
                toNumber(
                  form.gross_salary
                ),

              net_salary:
                toNumber(
                  form.net_salary
                ),

              payment_date:
                form.payment_date ||
                null,

              payment_mode:
                form.payment_mode ||
                null,

              payment_reference:
                form.payment_reference ||
                null,

              status:
                form.status ||
                "DRAFT",

              remarks:
                form.remarks ||
                null,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to update salary"
        );
      }

      closeModal();

      await loadData();
    } catch (err) {
      console.error(
        "Update salary error:",
        err
      );

      setError(
        err.message ||
          "Failed to update salary"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // =====================================================
  // HISTORY
  // =====================================================

  const openHistory = async (
    row
  ) => {
    if (!row.employee_id) {
      setError(
        "Employee information is missing."
      );
      return;
    }

    try {
      setHistoryOpen(true);
      setHistoryLoading(true);
      setHistory([]);
      setSelectedEmployee(row);

      const response =
        await fetch(
          `${API_URL}/salaries/employee/${row.employee_id}/history`,
          {
            credentials:
              "include",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load salary history"
        );
      }

      setHistory(
        result.data || []
      );
    } catch (err) {
      console.error(
        "Salary history error:",
        err
      );

      setError(
        err.message ||
          "Failed to load salary history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryLoading(false);
    setSelectedEmployee(null);
    setHistory([]);
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status
  ) => {
    const value =
      String(
        status || ""
      ).toUpperCase();

    if (value === "PAID") {
      return "active";
    }

    if (
      value ===
        "CANCELLED" ||
      value ===
        "NOT PROCESSED"
    ) {
      return "inactive";
    }

    return "";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="master-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="master-header">
        <div>
          <h1>Salary</h1>

          <p>
            Monthly salary, deductions
            and employee payroll
          </p>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="salary-summary">

        <div className="salary-summary-card">
          <span>
            Employees
          </span>

          <strong>
            {summary.employees}
          </strong>
        </div>

        <div className="salary-summary-card">
          <span>
            Gross Salary
          </span>

          <strong>
            ₹
            {formatAmount(
              summary.gross
            )}
          </strong>
        </div>

        <div className="salary-summary-card">
          <span>
            Total Deductions
          </span>

          <strong>
            ₹
            {formatAmount(
              summary.deductions
            )}
          </strong>
        </div>

        <div className="salary-summary-card">
          <span>
            Net Salary
          </span>

          <strong>
            ₹
            {formatAmount(
              summary.net
            )}
          </strong>
        </div>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="master-toolbar">

        <div className="search-box">
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <div className="filter-group">

          <label>
            Month
          </label>

          <input
            type="month"
            value={
              selectedMonth
            }
            onChange={(event) =>
              setSelectedMonth(
                event.target.value
              )
            }
          />

        </div>

        <div className="filter-group">

          <label>
            Status
          </label>

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="PROCESSED">
              Processed
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>

            <option value="NOT PROCESSED">
              Not Processed
            </option>
          </select>

        </div>

        {selectedMonth && (
          <button
            type="button"
            className="action-button"
            onClick={() =>
              setSelectedMonth("")
            }
          >
            Clear Month
          </button>
        )}

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="table-card">

        <div className="table-wrapper">

          <table className="master-table">

            <thead>
              <tr>

                <th>#</th>

                <th>
                  Employee
                </th>

                <th>
                  Department
                </th>

                <th>
                  Basic
                </th>

                <th>
                  Allowances
                </th>

                <th>
                  Credits
                </th>

                <th>
                  Gross / Before Deduction
                </th>

                <th>
                  Deductions
                </th>

                <th>
                  Net / After Deduction
                </th>

                <th>
                  Month
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="table-empty"
                  >
                    Loading salaries...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="table-empty"
                  >
                    No salary records found
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  (row, index) => (
                    <tr
                      key={
                        row.salary_id
                          ? `salary-${row.salary_id}`
                          : `employee-${row.employee_id}-${row.salary_month}`
                      }
                    >

                      {/* # */}

                      <td>
                        {index + 1}
                      </td>

                      {/* EMPLOYEE */}

                      <td>
                        <strong>
                          {row.name ||
                            "-"}
                        </strong>

                        <div className="table-subtext">
                          {row.employee_code ||
                            "-"}
                        </div>
                      </td>

                      {/* DEPARTMENT */}

                      <td>
                        {row.department_name ||
                          row.department ||
                          "-"}
                      </td>

                      {/* BASIC */}

                      <td>
                        ₹
                        {formatAmount(
                          row.salary_basic
                        )}
                      </td>

                      {/* ALLOWANCES */}

                      <td>
                        ₹
                        {formatAmount(
                          row.allowances
                        )}
                      </td>

                      {/* CREDITS */}

                      <td>
                        ₹
                        {formatAmount(
                          row.credit_total
                        )}
                      </td>

                      {/* GROSS */}

                      <td>
                        <strong>
                          ₹
                          {formatAmount(
                            row.gross_salary
                          )}
                        </strong>

                        <div className="table-subtext">
                          Before Deduction
                        </div>
                      </td>

                      {/* DEDUCTIONS */}

                      <td>
                        <strong>
                          ₹
                          {formatAmount(
                            row.total_deductions
                          )}
                        </strong>

                        <div className="table-subtext">
                          Salary Expenses
                        </div>

                        {toNumber(
                          row.salary_expense_deductions
                        ) > 0 && (
                          <div className="table-subtext">
                            Expense: ₹
                            {formatAmount(
                              row.salary_expense_deductions
                            )}
                          </div>
                        )}
                      </td>

                      {/* NET */}

                      <td>
                        <strong>
                          ₹
                          {formatAmount(
                            row.net_salary
                          )}
                        </strong>

                        <div className="table-subtext">
                          After Deduction
                        </div>
                      </td>

                      {/* MONTH */}

                      <td>
                        {row.salary_month
                          ? formatMonth(
                              row.salary_month
                            )
                          : "Not Processed"}
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`status ${getStatusClass(
                            row.salary_status
                          )}`}
                        >
                          {row.salary_status ||
                            "DRAFT"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="table-actions">

                          {row.salary_id && (
                            <button
                              type="button"
                              className="action-button"
                              onClick={() =>
                                openPaymentModal(
                                  row
                                )
                              }
                            >
                              Payment
                            </button>
                          )}

                          <button
                            type="button"
                            className="action-button"
                            onClick={() =>
                              openHistory(
                                row
                              )
                            }
                          >
                            History
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      <MasterModal
        open={modalOpen}
        title="Salary Payment"
        subtitle="Update monthly salary payment"
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onClose={closeModal}
        loading={saving}
        type="salary"
        error={
          modalOpen
            ? error
            : ""
        }
        onChange={
          handleChange
        }
      />

      {/* =================================================
          HISTORY MODAL
      ================================================= */}

      {historyOpen && (
        <div className="modal-overlay">

          <div className="modal modal-large">

            <div className="modal-header">

              <div>

                <h2>
                  Salary History
                </h2>

                <p>
                  {selectedEmployee?.name ||
                    "Employee"}

                  {" - "}

                  {selectedEmployee?.employee_code ||
                    ""}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeHistory
                }
              >
                ×
              </button>

            </div>

            {historyLoading ? (
              <div className="table-empty">
                Loading salary history...
              </div>
            ) : history.length === 0 ? (
              <div className="table-empty">
                No salary history found
              </div>
            ) : (
              <div className="table-card">

                <div className="table-wrapper">

                  <table className="master-table">

                    <thead>
                      <tr>

                        <th>
                          Month
                        </th>

                        <th>
                          Basic
                        </th>

                        <th>
                          Gross
                        </th>

                        <th>
                          Deductions
                        </th>

                        <th>
                          Net
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Payment Date
                        </th>

                        <th>
                          Mode
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {history.map(
                        (salary) => {

                          const deductions =
                            toNumber(
                              salary.total_deductions ??
                                salary.debit_total ??
                                salary.salary_expense_deductions ??
                                0
                            );

                          const gross =
                            toNumber(
                              salary.gross_salary
                            );

                          const net =
                            gross -
                            deductions;

                          return (
                            <tr
                              key={
                                salary.id
                              }
                            >

                              <td>
                                {formatMonth(
                                  salary.salary_month
                                )}
                              </td>

                              <td>
                                ₹
                                {formatAmount(
                                  salary.basic_salary
                                )}
                              </td>

                              <td>
                                ₹
                                {formatAmount(
                                  gross
                                )}
                              </td>

                              <td>
                                ₹
                                {formatAmount(
                                  deductions
                                )}
                              </td>

                              <td>
                                <strong>
                                  ₹
                                  {formatAmount(
                                    net
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`status ${getStatusClass(
                                    salary.status
                                  )}`}
                                >
                                  {salary.status ||
                                    "DRAFT"}
                                </span>
                              </td>

                              <td>
                                {formatDate(
                                  salary.payment_date
                                )}
                              </td>

                              <td>
                                {salary.payment_mode ||
                                  "-"}
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}