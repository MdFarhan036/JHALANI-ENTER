import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import "../../styles/Units.css";

import MasterModal from "../../components/common/Modal";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const API_URL = `${API_BASE_URL}/units`;


const EMPTY_FORM = {
  name: "",
  symbol: "",
  description: "",
  status: "active",
};


export default function Units() {
  const [units, setUnits] = useState([]);

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

  const [showModal, setShowModal] =
    useState(false);

  const [editingUnit, setEditingUnit] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);


  /* ============================================================
     FETCH UNITS
     ============================================================ */

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        API_URL,
        {
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        setUnits(
          response.data.data || []
        );
      } else {
        setUnits([]);
      }

    } catch (err) {
      console.error(
        "Get units error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load units."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUnits();
  }, []);


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredUnits = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return units.filter((unit) => {

      const matchesSearch =
        !searchText ||
        unit.name
          ?.toLowerCase()
          .includes(searchText) ||
        unit.symbol
          ?.toLowerCase()
          .includes(searchText) ||
        unit.description
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        !statusFilter ||
        unit.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  }, [
    units,
    search,
    statusFilter,
  ]);


  /* ============================================================
     RESET FILTERS
     ============================================================ */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };


  /* ============================================================
     ADD UNIT
     ============================================================ */

  const handleAdd = () => {
    setEditingUnit(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");

    setShowModal(true);
  };


  /* ============================================================
     EDIT UNIT
     ============================================================ */

  const handleEdit = (unit) => {
    setEditingUnit(unit);

    setForm({
      name:
        unit.name || "",

      symbol:
        unit.symbol || "",

      description:
        unit.description || "",

      status:
        unit.status || "active",
    });

    setError("");

    setShowModal(true);
  };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const handleClose = () => {
    if (saving) return;

    setShowModal(false);

    setEditingUnit(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  };


  /* ============================================================
     FORM CHANGE
     ============================================================ */

  const handleChange = (event) => {
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
     SAVE UNIT
     ============================================================ */

  const handleSubmit = async (event) => {
    event?.preventDefault();

    const name =
      form.name.trim();

    const symbol =
      form.symbol.trim();

    if (!name) {
      alert(
        "Unit name is required."
      );
      return;
    }

    if (!symbol) {
      alert(
        "Unit symbol is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name,
        symbol,
        description:
          form.description.trim(),
        status:
          form.status,
      };

      if (editingUnit) {

        await axios.put(
          `${API_URL}/${editingUnit.id}`,
          payload,
          {
            withCredentials: true,
          }
        );

      } else {

        await axios.post(
          API_URL,
          payload,
          {
            withCredentials: true,
          }
        );

      }

      alert(
        editingUnit
          ? "Unit updated successfully."
          : "Unit created successfully."
      );

      handleClose();

      await fetchUnits();

    } catch (err) {
      console.error(
        "Save unit error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save unit."
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     STATUS TOGGLE
     ============================================================ */

  const handleStatusToggle = async (
    unit
  ) => {

    const newStatus =
      unit.status === "active"
        ? "inactive"
        : "active";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${
          newStatus === "active"
            ? "activate"
            : "deactivate"
        } "${unit.name}"?`
      );

    if (!confirmed) return;

    try {

      await axios.patch(
        `${API_URL}/${unit.id}/status`,
        {
          status: newStatus,
        },
        {
          withCredentials: true,
        }
      );

      await fetchUnits();

    } catch (err) {

      console.error(
        "Update unit status error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update unit status."
      );
    }
  };


  /* ============================================================
     DELETE
     ============================================================ */

  const handleDelete = async (
    unit
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${unit.name}"?`
      );

    if (!confirmed) return;

    try {

      await axios.delete(
        `${API_URL}/${unit.id}`,
        {
          withCredentials: true,
        }
      );

      alert(
        "Unit deleted successfully."
      );

      await fetchUnits();

    } catch (err) {

      console.error(
        "Delete unit error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to delete unit."
      );
    }
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
      label: "Unit Name",

      render: (value) => (
        <strong>
          {value || "-"}
        </strong>
      ),
    },

    {
      key: "symbol",
      label: "Symbol",

      render: (value) => (
        <span className="unit-symbol">
          {value || "-"}
        </span>
      ),
    },

    {
      key: "description",
      label: "Description",

      render: (value) =>
        value || "-",
    },

    {
      key: "status",
      label: "Status",

      render: (value) => (
        <span
          className={
            value === "active"
              ? "status active"
              : "status inactive"
          }
        >
          {value === "active"
            ? "Active"
            : "Inactive"}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      width: "220px",

      render: (
        value,
        row
      ) => (
        <TableActions
          showView={false}
          showEdit
          showDelete
          showStatus

          onEdit={() =>
            handleEdit(row)
          }

          onDelete={() =>
            handleDelete(row)
          }

          onToggleStatus={() =>
            handleStatusToggle(row)
          }

          statusLabel={
            row.status === "active"
              ? "Deactivate"
              : "Activate"
          }
        />
      ),
    },
  ];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="units-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="units-header">

        <div>
          <h1>
            Units
          </h1>

          <p>
            Manage product measurement
            units and symbols.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAdd}
        >
          + Add Unit
        </button>

      </div>


      {/* ======================================================
          FILTER BAR
          ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search unit name, symbol or description..."

        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",

            options: [
              {
                value: "active",
                label: "Active",
              },

              {
                value: "inactive",
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

        onReset={clearFilters}
      />


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && !showModal && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* ======================================================
          TABLE
          ====================================================== */}

      {loading ? (

        <LoadingState
          message="Loading units..."
        />

      ) : filteredUnits.length === 0 ? (

        <EmptyState
          title="No units found"

          message={
            search ||
            statusFilter
              ? "Try changing your search or filters."
              : "Add your first unit to get started."
          }

          actionLabel={
            search ||
            statusFilter
              ? "Reset Filters"
              : "Add Unit"
          }

          onAction={
            search ||
            statusFilter
              ? clearFilters
              : handleAdd
          }
        />

      ) : (

        <div className="table-card">

          <CommonTable
            columns={columns}
            data={filteredUnits}
            rowKey="id"
          />

        </div>

      )}


      {/* ======================================================
          MODAL
          ====================================================== */}

      {showModal && (
        <MasterModal
          type="unit"
          title={
            editingUnit
              ? "Edit Unit"
              : "Add Unit"
          }
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={handleClose}
          saving={saving}
        />
      )}

    </div>
  );
}