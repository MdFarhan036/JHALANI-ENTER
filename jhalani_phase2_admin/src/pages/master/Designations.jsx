import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MasterModal from "../../components/common/Modal";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import "../../styles/master.css";

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../../api/designationService";

import {
  getDepartments,
} from "../../api/departmentService";


const EMPTY_FORM = {
  department_id: "",
  name: "",
  code: "",
  description: "",
  status: "1",
};


export default function Designations() {
  const [designations, setDesignations] =
    useState([]);

  const [departments, setDepartments] =
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
      fetchDesignations(),
      fetchDepartments(),
    ]);
  };


  /* ============================================================
     GET DESIGNATIONS
     ============================================================ */

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      setError("");

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
        "Fetch designations:",
        err
      );

      setDesignations([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load designations"
      );

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     GET DEPARTMENTS
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
        "Fetch departments:",
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
     OPEN ADD
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
     OPEN EDIT
     ============================================================ */

  const openEditModal = (
    designation
  ) => {
    setEditingId(
      designation.id
    );

    setForm({
      department_id:
        designation.department_id
          ? String(
              designation.department_id
            )
          : "",

      name:
        designation.name || "",

      code:
        designation.code || "",

      description:
        designation.description || "",

      status: String(
        designation.status ?? 1
      ),
    });

    setError("");
    setModalOpen(true);
  };


  /* ============================================================
     CLOSE MODAL
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
     SUBMIT
     ============================================================ */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Designation name is required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        department_id:
          form.department_id
            ? Number(
                form.department_id
              )
            : null,

        name:
          form.name.trim(),

        code:
          form.code.trim() ||
          null,

        description:
          form.description.trim() ||
          null,

        status:
          Number(form.status),
      };

      let response;

      if (editingId) {
        response =
          await updateDesignation(
            editingId,
            payload
          );
      } else {
        response =
          await createDesignation(
            payload
          );
      }

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save designation"
        );
      }

      closeModal();

      await fetchDesignations();

    } catch (err) {
      console.error(
        "Save designation:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save designation"
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
        "Are you sure you want to delete this designation?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await deleteDesignation(id);

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete designation"
        );
      }

      await fetchDesignations();

    } catch (err) {
      console.error(
        "Delete designation:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete designation"
      );
    }
  };


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredDesignations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return designations.filter(
        (designation) => {

          const matchesSearch =
            !query ||
            designation.name
              ?.toLowerCase()
              .includes(query) ||

            designation.code
              ?.toLowerCase()
              .includes(query) ||

            designation.department_name
              ?.toLowerCase()
              .includes(query) ||

            designation.description
              ?.toLowerCase()
              .includes(query);


          const matchesStatus =
            !statusFilter ||
            String(
              designation.status
            ) === statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      designations,
      search,
      statusFilter,
    ]);


  /* ============================================================
     RESET FILTERS
     ============================================================ */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
  };


  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = [
    {
      key: "id",
      label: "#",
      width: "70px",

      render: (
        value,
        row,
        index
      ) => index + 1,
    },

    {
      key: "name",
      label: "Name",

      render: (value) => (
        <strong>
          {value || "-"}
        </strong>
      ),
    },

    {
      key: "code",
      label: "Code",

      render: (value) =>
        value || "-",
    },

    {
      key: "department_name",
      label: "Department",

      render: (value) =>
        value || "-",
    },

    {
      key: "description",
      label: "Description",

      render: (value) => (
        <div className="table-subtext">
          {value || "-"}
        </div>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (value) => {
        const isActive =
          Number(value) === 1;

        return (
          <span
            className={`status ${
              isActive
                ? "active"
                : "inactive"
            }`}
          >
            {isActive
              ? "Active"
              : "Inactive"}
          </span>
        );
      },
    },

    {
      key: "actions",
      label: "Actions",
      width: "180px",

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

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="master-header">

        <div>
          <h1>
            Designations
          </h1>

          <p>
            Manage employee designations
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Designation
        </button>

      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* ======================================================
          FILTER BAR
          ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search designations..."

        filters={[
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
          status: statusFilter,
        }}

        onChange={(values) => {
          setStatusFilter(
            values.status
          );
        }}

        onReset={resetFilters}
      />


      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="table-card">

        {loading ? (

          <LoadingState
            message="Loading designations..."
          />

        ) : filteredDesignations.length ===
          0 ? (

          <EmptyState
            title="No designations found"

            message={
              search ||
              statusFilter
                ? "Try changing your search or filters."
                : "Create your first designation."
            }

            actionLabel={
              search ||
              statusFilter
                ? "Reset Filters"
                : "Add Designation"
            }

            onAction={
              search ||
              statusFilter
                ? resetFilters
                : openAddModal
            }
          />

        ) : (

          <CommonTable
            columns={columns}
            data={filteredDesignations}
            rowKey="id"
          />

        )}

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      <MasterModal
        open={modalOpen}

        title={
          editingId
            ? "Edit Designation"
            : "Add Designation"
        }

        subtitle={
          editingId
            ? "Update designation details"
            : "Create a new designation"
        }

        form={form}
        setForm={setForm}

        onSubmit={handleSubmit}
        onClose={closeModal}

        loading={saving}

        error={
          modalOpen
            ? error
            : ""
        }
      >

        {/* DEPARTMENT */}

        <div className="form-field">

          <label htmlFor="department_id">
            Department
          </label>

          <select
            id="department_id"
            name="department_id"
            value={
              form.department_id
            }
            onChange={handleChange}
          >

            <option value="">
              Select Department
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department.id}
                  value={
                    department.id
                  }
                >
                  {department.name}
                </option>
              )
            )}

          </select>

        </div>


        {/* NAME */}

        <div className="form-field">

          <label htmlFor="name">
            Designation Name *
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Sales Executive"
          />

        </div>


        {/* CODE */}

        <div className="form-field">

          <label htmlFor="code">
            Code
          </label>

          <input
            id="code"
            name="code"
            type="text"
            value={form.code}
            onChange={handleChange}
            placeholder="e.g. SE"
          />

        </div>


        {/* DESCRIPTION */}

        <div className="form-field">

          <label htmlFor="description">
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows="4"
            value={
              form.description
            }
            onChange={handleChange}
            placeholder="Enter designation description"
          />

        </div>


        {/* STATUS */}

        <div className="form-field">

          <label htmlFor="status">
            Status
          </label>

          <select
            id="status"
            name="status"
            value={form.status}
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

      </MasterModal>

    </div>
  );
}