import React from "react";

export default function MasterModal({
  open,
  title,
  subtitle,
  form = {},
  setForm,
  onSubmit,
  onClose,
  loading = false,
  type = "master",

  accounts = [],
  employees = [],
  departments = [],
  transporters = [],
  error = "",
}) {
  if (!open) return null;

  const safeForm =
    form && typeof form === "object"
      ? form
      : {};

  const safeAccounts = Array.isArray(accounts)
    ? accounts.filter(Boolean)
    : [];

  const safeEmployees = Array.isArray(employees)
    ? employees.filter(
      (employee) =>
        employee &&
        employee.id !== undefined &&
        employee.id !== null
    )
    : [];

  const safeDepartments = Array.isArray(departments)
    ? departments.filter(
      (department) =>
        department &&
        department.id !== undefined &&
        department.id !== null
    )
    : [];
  const safeTransporters = Array.isArray(transporters)
    ? transporters.filter(
      (transporter) =>
        transporter &&
        transporter.id !== undefined &&
        transporter.id !== null
    )
    : [];
  /* ============================================================
     COMMON CHANGE HANDLER
     ============================================================ */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...(prev || {}),
      [name]: value,
    }));
  };

  /* ============================================================
     SALARY DEDUCTION
     ============================================================ */

  const handleSalaryDeduction = (event) => {
    const checked = event.target.checked;

    if (typeof setForm !== "function") {
      return;
    }

    setForm((previous) => {
      const current = previous || {};

      return {
        ...current,
        deduct_from_salary: checked ? "1" : "0",
        employee_id: checked
          ? current.employee_id || ""
          : "",
        salary_month: checked
          ? current.salary_month || ""
          : "",
      };
    });
  };

  /* ============================================================
     EMPLOYEE NAME
     ============================================================ */

  const getEmployeeName = (employee) => {
    if (!employee) {
      return "";
    }

    return (
      employee.name ||
      employee.employee_name ||
      [
        employee.first_name,
        employee.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      `Employee #${employee.id}`
    );
  };

  /* ============================================================
     ACCOUNT NAME
     ============================================================ */

  const getAccountName = (account) => {
    if (!account) {
      return "";
    }

    return (
      account.account_name ||
      account.name ||
      `Account #${account.id}`
    );
  };

  /* ============================================================
     DEPARTMENT NAME
     ============================================================ */

  const getDepartmentName = (department) => {
    if (!department) {
      return "";
    }

    return (
      department.name ||
      department.department_name ||
      `Department #${department.id}`
    );
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="modal">

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="modal-header">

          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
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

        {/* ======================================================
            FORM
            ====================================================== */}

        <form onSubmit={onSubmit}>

          {/* ====================================================
              EMPLOYEE FORM
              ==================================================== */}
          {type === "party" ? (
            <>
              <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-row">
                  <div className="form-field">
                    <label>Party Code</label>
                    <input
                      type="text"
                      name="party_code"
                      value={form?.party_code || ""}
                      onChange={handleChange}
                      placeholder="Enter party code"
                    />
                  </div>

                  <div className="form-field">
                    <label>Party Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form?.name || ""}
                      onChange={handleChange}
                      placeholder="Enter party name"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      name="contact_person"
                      value={form?.contact_person || ""}
                      onChange={handleChange}
                      placeholder="Enter contact person"
                    />
                  </div>

                  <div className="form-field">
                    <label>Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={form?.mobile || ""}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Alternate Mobile</label>
                    <input
                      type="tel"
                      name="alternate_mobile"
                      value={form?.alternate_mobile || ""}
                      onChange={handleChange}
                      placeholder="Enter alternate mobile"
                    />
                  </div>

                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form?.email || ""}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>GST No.</label>
                  <input
                    type="text"
                    name="gst_no"
                    value={form?.gst_no || ""}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>

                <div className="form-field">
                  <label>Billing Address</label>
                  <textarea
                    name="billing_address"
                    value={form?.billing_address || ""}
                    onChange={handleChange}
                    placeholder="Enter billing address"
                    rows="3"
                  />
                </div>

                <div className="form-field">
                  <label>Delivery Address</label>
                  <textarea
                    name="delivery_address"
                    value={form?.delivery_address || ""}
                    onChange={handleChange}
                    placeholder="Enter delivery address"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={form?.city || ""}
                      onChange={handleChange}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-field">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={form?.state || ""}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="form-field">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={form?.pincode || ""}
                      onChange={handleChange}
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Financial Information</h3>

                <div className="form-row">
                  <div className="form-field">
                    <label>Credit Limit</label>
                    <input
                      type="number"
                      name="credit_limit"
                      value={form?.credit_limit ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-field">
                    <label>Opening Balance</label>
                    <input
                      type="number"
                      name="opening_balance"
                      value={form?.opening_balance ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Opening Balance Type</label>

                    <select
                      name="opening_balance_type"
                      value={form?.opening_balance_type || "DEBIT"}
                      onChange={handleChange}
                    >
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Status</label>

                    <select
                      name="status"
                      value={
                        form?.status === undefined ||
                          form?.status === null ||
                          form?.status === ""
                          ? 1
                          : form.status
                      }
                      onChange={handleChange}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>

                <div className="form-field">
                  <label>Remarks</label>

                  <textarea
                    name="remarks"
                    value={form?.remarks || ""}
                    onChange={handleChange}
                    placeholder="Enter remarks"
                    rows="3"
                  />
                </div>
              </div>
            </>
          ) : type === "employee" ? (
            <>

              {/* EMPLOYEE CODE + STATUS */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    Employee Code *
                  </label>

                  <input
                    type="text"
                    name="employee_code"
                    value={
                      safeForm.employee_code || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter employee code"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>
                    Status *
                  </label>

                  <select
                    name="status"
                    value={
                      safeForm.status ?? "1"
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="1">
                      Active
                    </option>

                    <option value="0">
                      Inactive
                    </option>
                  </select>
                </div>

              </div>


              {/* FIRST + LAST NAME */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    First Name *
                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={
                      safeForm.first_name || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={
                      safeForm.last_name || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                </div>

              </div>


              {/* FATHER NAME */}

              <div className="form-field">

                <label>
                  Father Name
                </label>

                <input
                  type="text"
                  name="father_name"
                  value={
                    safeForm.father_name || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter father's name"
                />

              </div>


              {/* FULL NAME */}

              <div className="form-field">

                <label>
                  Employee Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    safeForm.name || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter employee name"
                  required
                />

              </div>


              {/* DEPARTMENT */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Department
                  </label>

                  <select
                    name="department_id"
                    value={
                      safeForm.department_id || ""
                    }
                    onChange={handleChange}
                  >

                    <option value="">
                      Select Department
                    </option>

                    {safeDepartments.map(
                      (department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {getDepartmentName(
                            department
                          )}
                        </option>
                      )
                    )}

                  </select>

                  {safeDepartments.length ===
                    0 && (
                      <small className="field-help">
                        No departments loaded.
                      </small>
                    )}

                </div>


                <div className="form-field">

                  <label>
                    Department Name
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={
                      safeForm.department || ""
                    }
                    onChange={handleChange}
                    placeholder="Department"
                  />

                </div>

              </div>


              {/* DESIGNATION */}

              <div className="form-field">

                <label>
                  Designation
                </label>

                <input
                  type="text"
                  name="designation"
                  value={
                    safeForm.designation || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter designation"
                />

              </div>


              {/* MOBILE + EMAIL */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Mobile
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    value={
                      safeForm.mobile || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                  />

                </div>


                <div className="form-field">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      safeForm.email || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />

                </div>

              </div>


              {/* JOINING DATE + SALARY */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Joining Date
                  </label>

                  <input
                    type="date"
                    name="joining_date"
                    value={
                      safeForm.joining_date || ""
                    }
                    onChange={handleChange}
                  />

                </div>


                <div className="form-field">

                  <label>
                    Basic Salary
                  </label>

                  <input
                    type="number"
                    name="basic_salary"
                    value={
                      safeForm.basic_salary ?? ""
                    }
                    onChange={handleChange}
                    placeholder="Enter basic salary"
                    min="0"
                    step="0.01"
                  />

                </div>

              </div>


              {/* ==================================================
                  BANK DETAILS
                  ================================================== */}

              <div className="form-section-title">
                Bank Details
              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Bank Name
                  </label>

                  <input
                    type="text"
                    name="bank_name"
                    value={
                      safeForm.bank_name || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter bank name"
                  />

                </div>


                <div className="form-field">

                  <label>
                    Account Number
                  </label>

                  <input
                    type="text"
                    name="account_number"
                    value={
                      safeForm.account_number || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter account number"
                  />

                </div>

              </div>


              {/* IFSC */}

              <div className="form-field">

                <label>
                  IFSC Code
                </label>

                <input
                  type="text"
                  name="ifsc_code"
                  value={
                    safeForm.ifsc_code || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter IFSC code"
                />

              </div>


              {/* ==================================================
                  OTHER DETAILS
                  ================================================== */}

              <div className="form-section-title">
                Other Details
              </div>


              <div className="form-field">

                <label>
                  PAN Number
                </label>

                <input
                  type="text"
                  name="pan_number"
                  value={
                    safeForm.pan_number || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter PAN number"
                  style={{
                    textTransform: "uppercase",
                  }}
                />

              </div>


              <div className="form-field">

                <label>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={
                    safeForm.remarks || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter remarks"
                  rows="4"
                />

              </div>

            </>

          ) : type === "transporter" ? (
            <>
              {/* TRANSPORTER FORM */}

              <div className="form-section">
                <h3>Transporter Information</h3>

                <div className="form-row">

                  <div className="form-field">
                    <label>
                      Transporter Code *
                    </label>

                    <input
                      type="text"
                      name="transporter_code"
                      value={safeForm.transporter_code || ""}
                      onChange={handleChange}
                      placeholder="Enter transporter code"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Transporter Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={safeForm.name || ""}
                      onChange={handleChange}
                      placeholder="Enter transporter name"
                      required
                      autoFocus
                    />
                  </div>

                </div>


                <div className="form-row">

                  <div className="form-field">
                    <label>
                      Contact Person
                    </label>

                    <input
                      type="text"
                      name="contact_person"
                      value={safeForm.contact_person || ""}
                      onChange={handleChange}
                      placeholder="Enter contact person"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Mobile
                    </label>

                    <input
                      type="text"
                      name="mobile"
                      value={safeForm.mobile || ""}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                    />
                  </div>

                </div>


                <div className="form-row">

                  <div className="form-field">
                    <label>
                      Alternate Mobile
                    </label>

                    <input
                      type="text"
                      name="alternate_mobile"
                      value={safeForm.alternate_mobile || ""}
                      onChange={handleChange}
                      placeholder="Enter alternate mobile"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={safeForm.email || ""}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  </div>

                </div>


                <div className="form-row">

                  <div className="form-field">
                    <label>
                      GST No.
                    </label>

                    <input
                      type="text"
                      name="gst_no"
                      value={safeForm.gst_no || ""}
                      onChange={handleChange}
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Payment Terms
                    </label>

                    <input
                      type="text"
                      name="payment_terms"
                      value={safeForm.payment_terms || ""}
                      onChange={handleChange}
                      placeholder="e.g. 30 Days"
                    />
                  </div>

                </div>


                <div className="form-field">
                  <label>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={safeForm.address || ""}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="3"
                  />
                </div>


                <div className="form-row">

                  <div className="form-field">
                    <label>
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={safeForm.city || ""}
                      onChange={handleChange}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={safeForm.state || ""}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />
                  </div>

                </div>


                <div className="form-row">

                  <div className="form-field">
                    <label>
                      Pincode
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={safeForm.pincode || ""}
                      onChange={handleChange}
                      placeholder="Enter pincode"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        safeForm.status === undefined ||
                          safeForm.status === null
                          ? "1"
                          : String(safeForm.status)
                      }
                      onChange={handleChange}
                    >
                      <option value="1">
                        Active
                      </option>

                      <option value="0">
                        Inactive
                      </option>
                    </select>
                  </div>

                </div>


                <div className="form-field">
                  <label>
                    Remarks
                  </label>

                  <textarea
                    name="remarks"
                    value={safeForm.remarks || ""}
                    onChange={handleChange}
                    placeholder="Enter remarks"
                    rows="3"
                  />
                </div>

              </div>
            </>

          ) : type === "vehicle" ? (
            <>
              {/* ====================================================
    VEHICLE FORM
    ==================================================== */}

              <div className="form-row">

                {/* VEHICLE NUMBER */}

                <div className="form-field">
                  <label>
                    Vehicle Number *
                  </label>

                  <input
                    type="text"
                    name="vehicle_no"
                    value={safeForm.vehicle_no || ""}
                    onChange={handleChange}
                    placeholder="Enter vehicle number"
                    required
                  />
                </div>

                {/* TRANSPORTER */}

                <div className="form-field">
                  <label>
                    Transporter *
                  </label>

                  <select
                    name="transporter_id"
                    value={safeForm.transporter_id || ""}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Transporter
                    </option>

                    {safeTransporters.map(
                      (transporter) => (
                        <option
                          key={transporter.id}
                          value={transporter.id}
                        >
                          {transporter.name ||
                            transporter.transporter_name ||
                            transporter.company_name ||
                            `Transporter #${transporter.id}`}
                        </option>
                      )
                    )}
                  </select>

                  {safeTransporters.length === 0 && (
                    <small className="field-help">
                      No transporters available.
                      Create a transporter first.
                    </small>
                  )}
                </div>

              </div>


              {/* VEHICLE TYPE + STATUS */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    Vehicle Type *
                  </label>

                  <select
                    name="vehicle_type"
                    value={
                      safeForm.vehicle_type || "TRUCK"
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="TRUCK">
                      Truck
                    </option>

                    <option value="PICKUP">
                      Pickup
                    </option>

                    <option value="TEMPO">
                      Tempo
                    </option>

                    <option value="TRACTOR">
                      Tractor
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>


                <div className="form-field">
                  <label>
                    Status *
                  </label>

                  <select
                    name="status"
                    value={
                      safeForm.status || "ACTIVE"
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                    <option value="MAINTENANCE">
                      Maintenance
                    </option>
                  </select>
                </div>

              </div>


              {/* MODEL + MANUFACTURER */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    Model
                  </label>

                  <input
                    type="text"
                    name="model"
                    value={safeForm.model || ""}
                    onChange={handleChange}
                    placeholder="Enter vehicle model"
                  />
                </div>


                <div className="form-field">
                  <label>
                    Manufacturer
                  </label>

                  <input
                    type="text"
                    name="manufacturer"
                    value={
                      safeForm.manufacturer || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter manufacturer"
                  />
                </div>

              </div>


              {/* CAPACITY + UNIT */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    Capacity
                  </label>

                  <input
                    type="number"
                    name="capacity"
                    value={safeForm.capacity ?? ""}
                    onChange={handleChange}
                    placeholder="Enter capacity"
                    min="0"
                    step="0.001"
                  />
                </div>


                <div className="form-field">
                  <label>
                    Capacity Unit
                  </label>

                  <select
                    name="capacity_unit"
                    value={
                      safeForm.capacity_unit || "KG"
                    }
                    onChange={handleChange}
                  >
                    <option value="KG">
                      KG
                    </option>

                    <option value="TON">
                      Ton
                    </option>

                    <option value="LITRE">
                      Litre
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

              </div>


              {/* REGISTRATION + INSURANCE */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    Registration Date
                  </label>

                  <input
                    type="date"
                    name="registration_date"
                    value={
                      safeForm.registration_date || ""
                    }
                    onChange={handleChange}
                  />
                </div>


                <div className="form-field">
                  <label>
                    Insurance Expiry
                  </label>

                  <input
                    type="date"
                    name="insurance_expiry"
                    value={
                      safeForm.insurance_expiry || ""
                    }
                    onChange={handleChange}
                  />
                </div>

              </div>


              {/* FITNESS + PERMIT */}

              <div className="form-row">

                <div className="form-field">
                  <label>
                    Fitness Expiry
                  </label>

                  <input
                    type="date"
                    name="fitness_expiry"
                    value={
                      safeForm.fitness_expiry || ""
                    }
                    onChange={handleChange}
                  />
                </div>


                <div className="form-field">
                  <label>
                    Permit Expiry
                  </label>

                  <input
                    type="date"
                    name="permit_expiry"
                    value={
                      safeForm.permit_expiry || ""
                    }
                    onChange={handleChange}
                  />
                </div>

              </div>


              {/* POLLUTION */}

              <div className="form-field">
                <label>
                  Pollution Expiry
                </label>

                <input
                  type="date"
                  name="pollution_expiry"
                  value={
                    safeForm.pollution_expiry || ""
                  }
                  onChange={handleChange}
                />
              </div>


              {/* REMARKS */}

              <div className="form-field">
                <label>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={safeForm.remarks || ""}
                  onChange={handleChange}
                  placeholder="Enter remarks"
                  rows="4"
                />
              </div>
            </>
          ) : type === "transaction" ? (

            /* ====================================================
               TRANSACTION FORM
               ==================================================== */

            <>

              {/* ACCOUNT + TYPE */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Account *
                  </label>

                  <select
                    name="account_id"
                    value={
                      safeForm.account_id || ""
                    }
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select account
                    </option>

                    {safeAccounts
                      .filter(
                        (account) =>
                          Number(
                            account.status
                          ) === 1
                      )
                      .map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {getAccountName(account)}
                        </option>
                      ))}

                  </select>

                  {safeAccounts.length === 0 && (
                    <small className="field-help error-text">
                      No accounts available.
                      Create an account first.
                    </small>
                  )}

                </div>


                <div className="form-field">

                  <label>
                    Transaction Type *
                  </label>

                  <select
                    name="transaction_type"
                    value={
                      safeForm.transaction_type ||
                      "DEBIT"
                    }
                    onChange={handleChange}
                    required
                  >

                    <option value="DEBIT">
                      Debit / Expense
                    </option>

                    <option value="CREDIT">
                      Credit / Income
                    </option>

                    <option value="TRANSFER">
                      Transfer
                    </option>

                  </select>

                </div>

              </div>


              {/* DATE + AMOUNT */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Date *
                  </label>

                  <input
                    type="date"
                    name="transaction_date"
                    value={
                      safeForm.transaction_date ||
                      ""
                    }
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Amount *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={
                      safeForm.amount || ""
                    }
                    onChange={handleChange}
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    required
                  />

                </div>

              </div>


              {/* TRANSFER ACCOUNT */}

              {safeForm.transaction_type ===
                "TRANSFER" && (

                  <div className="form-field">

                    <label>
                      Transfer To Account *
                    </label>

                    <select
                      name="related_account_id"
                      value={
                        safeForm.related_account_id ||
                        ""
                      }
                      onChange={handleChange}
                      required
                    >

                      <option value="">
                        Select destination account
                      </option>

                      {safeAccounts
                        .filter(
                          (account) =>
                            Number(
                              account.status
                            ) === 1 &&
                            String(account.id) !==
                            String(
                              safeForm.account_id
                            )
                        )
                        .map((account) => (
                          <option
                            key={account.id}
                            value={account.id}
                          >
                            {getAccountName(account)}
                          </option>
                        ))}

                    </select>

                  </div>

                )}


              {/* CATEGORY + REFERENCE */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Category
                  </label>

                  <input
                    type="text"
                    name="category"
                    value={
                      safeForm.category || ""
                    }
                    onChange={handleChange}
                    placeholder="Salary, Office, Travel..."
                  />

                </div>


                <div className="form-field">

                  <label>
                    Reference No.
                  </label>

                  <input
                    type="text"
                    name="reference_no"
                    value={
                      safeForm.reference_no || ""
                    }
                    onChange={handleChange}
                    placeholder="Invoice / receipt no."
                  />

                </div>

              </div>


              {/* EMPLOYEE */}

              <div className="form-field">

                <label>
                  Employee
                </label>

                <select
                  name="employee_id"
                  value={
                    safeForm.employee_id || ""
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    No employee
                  </option>

                  {safeEmployees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {getEmployeeName(
                          employee
                        )}

                        {employee.employee_code
                          ? ` (${employee.employee_code})`
                          : ""}
                      </option>
                    )
                  )}

                </select>

                {safeEmployees.length === 0 && (
                  <small className="field-help">
                    No employees loaded.
                  </small>
                )}

              </div>


              {/* DESCRIPTION */}

              <div className="form-field">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    safeForm.description || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter transaction details"
                  rows="3"
                />

              </div>


              {/* SALARY DEDUCTION */}

              <div className="transaction-checkbox">

                <label>

                  <input
                    type="checkbox"
                    checked={
                      safeForm.deduct_from_salary ===
                      "1"
                    }
                    onChange={
                      handleSalaryDeduction
                    }
                  />

                  <span>
                    Deduct this expense from
                    employee salary
                  </span>

                </label>

              </div>


              {/* SALARY MONTH */}

              {safeForm.deduct_from_salary ===
                "1" && (

                  <div className="form-field">

                    <label>
                      Salary Month *
                    </label>

                    <input
                      type="month"
                      value={
                        safeForm.salary_month
                          ? String(
                            safeForm.salary_month
                          ).slice(0, 7)
                          : ""
                      }
                      onChange={(event) => {

                        const value =
                          event.target.value;

                        if (
                          typeof setForm !==
                          "function"
                        ) {
                          return;
                        }

                        setForm((previous) => ({
                          ...(previous || {}),
                          salary_month: value
                            ? `${value}-01`
                            : "",
                        }));

                      }}
                      required
                    />

                  </div>

                )}

            </>

          ) : (

            /* ====================================================
               GENERIC MASTER FORM
               ==================================================== */

            <>

              <div className="form-field">

                <label>
                  Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    safeForm.name || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter name"
                  autoFocus
                  required
                />

              </div>


              <div className="form-field">

                <label>
                  Code
                </label>

                <input
                  type="text"
                  name="code"
                  value={
                    safeForm.code || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter code"
                />

              </div>


              <div className="form-field">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    safeForm.description || ""
                  }
                  onChange={handleChange}
                  placeholder="Enter description"
                  rows="4"
                />

              </div>


              <div className="form-field">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    safeForm.status ?? "1"
                  }
                  onChange={handleChange}
                >

                  <option value="1">
                    Active
                  </option>

                  <option value="0">
                    Inactive
                  </option>

                </select>

              </div>

            </>

          )}


          {/* ====================================================
              ERROR
              ==================================================== */}

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}


          {/* ====================================================
              ACTIONS
              ==================================================== */}

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
                : "Save"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}