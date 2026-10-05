import React, { useMemo } from "react";

export default function SalaryModal({
  open,
  title,
  subtitle,
  form,
  setForm,
  employees,
  onSubmit,
  onClose,
  loading,
  error,
}) {
  if (!open) return null;

  const selectedEmployee = employees.find(
    (employee) =>
      String(employee.id) ===
      String(form.employee_id)
  );

  const basicSalary = Number(
    form.basic_salary || 0
  );

  const allowances = Number(
    form.allowances || 0
  );

  const otherDeductions = Number(
    form.other_deductions || 0
  );

  const expenseDeduction = Number(
    form.expense_deductions || 0
  );

  const totalDeductions = useMemo(
    () =>
      expenseDeduction +
      otherDeductions,
    [
      expenseDeduction,
      otherDeductions,
    ]
  );

  const netSalary =
    basicSalary +
    allowances -
    totalDeductions;

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeChange = (
    event
  ) => {
    const employeeId =
      event.target.value;

    const employee =
      employees.find(
        (item) =>
          String(item.id) ===
          String(employeeId)
      );

    setForm((prev) => ({
      ...prev,
      employee_id: employeeId,
      basic_salary:
        employee?.basic_salary ??
        "",
    }));
  };

  const money = (value) =>
    Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  return (
    <div className="modal-overlay">

      <div className="modal salary-modal">

        <div className="modal-header">

          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>

        </div>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>

          {/* EMPLOYEE */}
          <div className="form-field">

            <label>
              Employee *
            </label>

            <select
              name="employee_id"
              value={form.employee_id}
              onChange={
                handleEmployeeChange
              }
              required
              disabled={loading}
            >

              <option value="">
                Select employee
              </option>

              {employees.map(
                (employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                    {employee.employee_code
                      ? ` (${employee.employee_code})`
                      : ""}
                  </option>
                )
              )}

            </select>

            {selectedEmployee && (
              <small className="field-help">
                {selectedEmployee.designation ||
                  "Employee"}
              </small>
            )}

          </div>

          {/* MONTH */}
          <div className="form-field">

            <label>
              Salary Month *
            </label>

            <input
              type="month"
              value={
                form.salary_month
                  ? String(
                      form.salary_month
                    ).slice(0, 7)
                  : ""
              }
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  salary_month:
                    `${event.target.value}-01`,
                }))
              }
              required
              disabled={loading}
            />

          </div>

          <div className="salary-form-grid">

            {/* BASIC */}
            <div className="form-field">

              <label>
                Basic Salary *
              </label>

              <input
                type="number"
                name="basic_salary"
                value={
                  form.basic_salary
                }
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />

            </div>

            {/* ALLOWANCES */}
            <div className="form-field">

              <label>
                Allowances
              </label>

              <input
                type="number"
                name="allowances"
                value={
                  form.allowances
                }
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
              />

            </div>

            {/* OTHER DEDUCTIONS */}
            <div className="form-field">

              <label>
                Other Deductions
              </label>

              <input
                type="number"
                name="other_deductions"
                value={
                  form.other_deductions
                }
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
              />

            </div>

          </div>

          {/* CALCULATION */}
          <div className="salary-calculation">

            <div>
              <span>
                Expense Deductions
              </span>

              <strong>
                ₹
                {money(
                  expenseDeduction
                )}
              </strong>
            </div>

            <div>
              <span>
                Total Deductions
              </span>

              <strong>
                ₹
                {money(
                  totalDeductions
                )}
              </strong>
            </div>

            <div className="net-salary-row">

              <span>
                Net Salary
              </span>

              <strong>
                ₹
                {money(netSalary)}
              </strong>

            </div>

          </div>

          {/* PAYMENT STATUS */}
          <div className="salary-form-grid">

            <div className="form-field">

              <label>
                Payment Status
              </label>

              <select
                name="payment_status"
                value={
                  form.payment_status
                }
                onChange={handleChange}
                disabled={loading}
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="PAID">
                  Paid
                </option>
              </select>

            </div>

            <div className="form-field">

              <label>
                Payment Date
              </label>

              <input
                type="date"
                name="payment_date"
                value={
                  form.payment_date
                }
                onChange={handleChange}
                disabled={loading}
              />

            </div>

          </div>

          {/* REMARKS */}
          <div className="form-field">

            <label>
              Remarks
            </label>

            <textarea
              name="remarks"
              value={
                form.remarks
              }
              onChange={handleChange}
              rows="3"
              placeholder="Enter remarks"
              disabled={loading}
            />

          </div>

          {/* ACTIONS */}
          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save Salary"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}