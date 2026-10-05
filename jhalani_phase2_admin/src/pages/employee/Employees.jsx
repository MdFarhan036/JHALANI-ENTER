import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/master.css";

import MasterModal from "../../components/common/Modal";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../api/employeeService";

import {
  getDepartments,
} from "../../api/departmentService";

import {
  getDesignations,
} from "../../api/designationService";


const EMPTY_FORM = {
  employee_code: "",
  name: "",
  department_id: "",
  designation: "",
  mobile: "",
  email: "",
  joining_date: "",
  basic_salary: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  pan_number: "",
  remarks: "",
  status: "1",
};


export default function Employees() {
  const [employees, setEmployees] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [designations, setDesignations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadInitialData();
  }, []);


  const loadInitialData = async () => {
    await Promise.all([
      fetchEmployees(),
      fetchDepartments(),
      fetchDesignations(),
    ]);
  };


  /* ============================================================
     EMPLOYEES
     ============================================================ */

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getEmployees();

      const result =
        response.data;

      if (result?.success === false) {
        throw new Error(
          result.message ||
            "Failed to load employees"
        );
      }

      /*
       * Preserve compatibility with
       * the existing backend response.
       */

      const employeeData =
        Array.isArray(result?.data)
          ? result.data
          : Array.isArray(
              result?.employees
            )
          ? result.employees
          : Array.isArray(result)
          ? result
          : [];

      setEmployees(employeeData);

    } catch (err) {
      console.error(
        "Employees:",
        err
      );

      setEmployees([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load employees"
      );

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     DEPARTMENTS
     ============================================================ */

  const fetchDepartments = async () => {
    try {
      const response =
        await getDepartments();

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load departments"
        );
      }

      setDepartments(
        result.data || []
      );

    } catch (err) {
      console.error(
        "Departments:",
        err
      );

      setDepartments([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load departments"
      );
    }
  };


  /* ============================================================
     DESIGNATIONS
     ============================================================ */

  const fetchDesignations = async () => {
    try {
      const response =
        await getDesignations();

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load designations"
        );
      }

      setDesignations(
        result.data || []
      );

    } catch (err) {
      console.error(
        "Designations:",
        err
      );

      setDesignations([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load designations"
      );
    }
  };


  /* ============================================================
     FORM CHANGE
     ============================================================ */

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


  /* ============================================================
     ADD
     ============================================================ */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setModalOpen(true);
  };


  /* ============================================================
     EDIT
     ============================================================ */

  const openEditModal = (
    employee
  ) => {
    setEditingId(
      employee.id
    );

    setForm({
      employee_code:
        employee.employee_code || "",

      name:
        employee.name || "",

      department_id:
        employee.department_id
          ? String(
              employee.department_id
            )
          : "",

      designation:
        employee.designation || "",

      mobile:
        employee.mobile || "",

      email:
        employee.email || "",

      joining_date:
        employee.joining_date
          ? String(
              employee.joining_date
            ).slice(0, 10)
          : "",

      basic_salary:
        employee.basic_salary ?? "",

      bank_name:
        employee.bank_name || "",

      account_number:
        employee.account_number || "",

      ifsc_code:
        employee.ifsc_code || "",

      pan_number:
        employee.pan_number || "",

      remarks:
        employee.remarks || "",

      status: String(
        employee.status ?? 1
      ),
    });

    setError("");
    setModalOpen(true);
  };


  /* ============================================================
     CLOSE
     ============================================================ */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  };


  /* ============================================================
     SAVE
     ============================================================ */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.employee_code.trim()) {
      setError(
        "Employee code is required"
      );
      return;
    }

    if (!form.name.trim()) {
      setError(
        "Employee name is required"
      );
      return;
    }

    if (!form.department_id) {
      setError(
        "Department is required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,

        employee_code:
          form.employee_code.trim(),

        name:
          form.name.trim(),

        department_id:
          Number(
            form.department_id
          ),

        designation:
          form.designation.trim(),

        mobile:
          form.mobile.trim(),

        email:
          form.email.trim(),

        joining_date:
          form.joining_date ||
          null,

        basic_salary:
          form.basic_salary === ""
            ? 0
            : Number(
                form.basic_salary
              ),

        bank_name:
          form.bank_name.trim(),

        account_number:
          form.account_number.trim(),

        ifsc_code:
          form.ifsc_code.trim(),

        pan_number:
          form.pan_number.trim(),

        remarks:
          form.remarks.trim(),

        status:
          Number(form.status),
      };

      let response;

      if (editingId) {
        response =
          await updateEmployee(
            editingId,
            payload
          );
      } else {
        response =
          await createEmployee(
            payload
          );
      }

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save employee"
        );
      }

      closeModal();

      await fetchEmployees();

    } catch (err) {
      console.error(
        "Save employee:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save employee"
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     DELETE
     ============================================================ */

  const handleDelete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this employee?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await deleteEmployee(id);

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete employee"
        );
      }

      await fetchEmployees();

    } catch (err) {
      console.error(
        "Delete employee:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete employee"
      );
    }
  };


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredEmployees =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return employees.filter(
        (employee) => {

          const matchesSearch =
            !query ||
            employee.employee_code
              ?.toLowerCase()
              .includes(query) ||

            employee.name
              ?.toLowerCase()
              .includes(query) ||

            employee.department_name
              ?.toLowerCase()
              .includes(query) ||

            employee.department
              ?.toLowerCase()
              .includes(query) ||

            employee.designation
              ?.toLowerCase()
              .includes(query) ||

            employee.mobile
              ?.toLowerCase()
              .includes(query) ||

            employee.email
              ?.toLowerCase()
              .includes(query);


          const matchesStatus =
            !statusFilter ||
            String(
              employee.status
            ) === statusFilter;


          const matchesDepartment =
            !departmentFilter ||
            String(
              employee.department_id
            ) === departmentFilter;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesDepartment
          );
        }
      );
    }, [
      employees,
      search,
      statusFilter,
      departmentFilter,
    ]);


  /* ============================================================
     RESET FILTERS
     ============================================================ */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDepartmentFilter("");
  };


  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = [
    {
      key: "id",
      label: "#",
      width: "60px",

      render: (
        value,
        row,
        index
      ) => index + 1,
    },

    {
      key: "name",
      label: "Employee",

      render: (
        value,
        row
      ) => (
        <div>
          <strong>
            {value || "-"}
          </strong>

          {row.email && (
            <div className="table-subtext">
              {row.email}
            </div>
          )}
        </div>
      ),
    },

    {
      key: "employee_code",
      label: "Code",

      render: (value) =>
        value || "-",
    },

    {
      key: "department_name",
      label: "Department",

      render: (
        value,
        row
      ) =>
        value ||
        row.department ||
        "-",
    },

    {
      key: "designation",
      label: "Designation",

      render: (value) =>
        value || "-",
    },

    {
      key: "mobile",
      label: "Mobile",

      render: (value) =>
        value || "-",
    },

    {
      key: "basic_salary",
      label: "Salary",

      render: (value) => (
        <>
          ₹
          {Number(
            value || 0
          ).toLocaleString(
            "en-IN"
          )}
        </>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (value) => {
        const active =
          Number(value) === 1;

        return (
          <span
            className={`status ${
              active
                ? "active"
                : "inactive"
            }`}
          >
            {active
              ? "Active"
              : "Inactive"}
          </span>
        );
      },
    },

    {
      key: "actions",
      label: "Actions",
      width: "170px",

      render: (
        value,
        row
      ) => (
        <TableActions
          showView={false}
          showEdit={true}
          showDelete={true}
          showStatus={false}

          onEdit={() =>
            openEditModal(row)
          }

          onDelete={() =>
            handleDelete(row.id)
          }
        />
      ),
    },
  ];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="master-page">

      {/* HEADER */}

      <div className="master-header">

        <div>
          <h1>
            Employees
          </h1>

          <p>
            Manage employees, salary and
            employment information
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Employee
        </button>

      </div>


      {/* ERROR */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* FILTERS */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employees..."

        filters={[
          {
            name: "department",
            label: "Department",
            type: "select",
            placeholder: "All Departments",

            options:
              departments.map(
                (department) => ({
                  value: String(
                    department.id
                  ),

                  label:
                    department.name,
                })
              ),
          },

          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",

            options: [
              {
                value: "1",
                label: "Active",
              },

              {
                value: "0",
                label: "Inactive",
              },
            ],
          },
        ]}

        values={{
          department:
            departmentFilter,

          status:
            statusFilter,
        }}

        onChange={(values) => {
          setDepartmentFilter(
            values.department
          );

          setStatusFilter(
            values.status
          );
        }}

        onReset={resetFilters}
      />


      {/* TABLE */}

      <div className="table-card">

        {loading ? (

          <LoadingState
            message="Loading employees..."
          />

        ) : filteredEmployees.length ===
          0 ? (

          <EmptyState
            title="No employees found"

            message={
              search ||
              statusFilter ||
              departmentFilter
                ? "Try changing your search or filters."
                : "Create your first employee."
            }

            actionLabel={
              search ||
              statusFilter ||
              departmentFilter
                ? "Reset Filters"
                : "Add Employee"
            }

            onAction={
              search ||
              statusFilter ||
              departmentFilter
                ? resetFilters
                : openAddModal
            }
          />

        ) : (

          <CommonTable
            columns={columns}
            data={filteredEmployees}
            rowKey="id"
          />

        )}

      </div>


      {/* EMPLOYEE MODAL */}

      <MasterModal
        open={modalOpen}

        title={
          editingId
            ? "Edit Employee"
            : "Add Employee"
        }

        subtitle={
          editingId
            ? "Update employee information"
            : "Create a new employee"
        }

        type="employee"

        form={form}
        setForm={setForm}

        departments={departments}
        designations={designations}

        onSubmit={handleSubmit}
        onClose={closeModal}

        loading={saving}
        error={error}
      />

    </div>
  );
}