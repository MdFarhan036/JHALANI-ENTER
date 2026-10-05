import { useEffect, useMemo, useState } from "react";

import "../../styles/master.css";

import MasterModal from "../../components/common/Modal";
import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../api/departmentService.js";


const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  status: "1",
};


export default function Departments() {
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
     FETCH
     ============================================================ */

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

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
        "Fetch departments error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load departments"
      );

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    fetchDepartments();
  }, []);


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
    department
  ) => {
    setEditingId(
      department.id
    );

    setForm({
      name:
        department.name || "",

      code:
        department.code || "",

      description:
        department.description || "",

      status: String(
        department.status ?? 1
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

    if (!form.name.trim()) {
      setError(
        "Department name is required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description:
          form.description.trim(),
        status: form.status,
      };

      let response;

      if (editingId) {
        response =
          await updateDepartment(
            editingId,
            payload
          );
      } else {
        response =
          await createDepartment(
            payload
          );
      }

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save department"
        );
      }

      closeModal();

      await fetchDepartments();

    } catch (err) {
      console.error(
        "Save department error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save department"
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
        "Are you sure you want to delete this department?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await deleteDepartment(id);

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete department"
        );
      }

      await fetchDepartments();

    } catch (err) {
      console.error(
        "Delete department error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete department"
      );
    }
  };


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredDepartments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return departments.filter(
        (department) => {

          const matchesSearch =
            !query ||
            department.name
              ?.toLowerCase()
              .includes(query) ||
            department.code
              ?.toLowerCase()
              .includes(query) ||
            department.description
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            !statusFilter ||
            String(
              department.status
            ) === statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      departments,
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

      {/* HEADER */}

      <div className="master-header">

        <div>
          <h1>
            Departments
          </h1>

          <p>
            Manage employee departments
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Department
        </button>

      </div>


      {/* ERROR */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* COMMON FILTER */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments..."

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


      {/* TABLE */}

      <div className="table-card">

        {loading ? (

          <LoadingState
            message="Loading departments..."
          />

        ) : filteredDepartments.length ===
          0 ? (

          <EmptyState
            title="No departments found"

            message={
              search ||
              statusFilter
                ? "Try changing your search or filters."
                : "Create your first department."
            }

            actionLabel={
              search ||
              statusFilter
                ? "Reset Filters"
                : "Add Department"
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
            data={filteredDepartments}
            rowKey="id"
          />

        )}

      </div>


      {/* MODAL */}

      <MasterModal
        open={modalOpen}

        title={
          editingId
            ? "Edit Department"
            : "Add Department"
        }

        subtitle={
          editingId
            ? "Update department details"
            : "Create a new department"
        }

        form={form}
        setForm={setForm}

        onSubmit={handleSubmit}
        onClose={closeModal}

        loading={saving}
      />

    </div>
  );
}