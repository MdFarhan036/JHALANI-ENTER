
import React, { useEffect, useState } from "react";
import MasterModal from "../components/common/Modal";
import api from "../api/axios";
import "../styles/vehicles.css";

const EMPTY_FORM = {
  vehicle_no: "",
  transporter_id: "",
  vehicle_type: "TRUCK",
  model: "",
  manufacturer: "",
  capacity: "",
  capacity_unit: "KG",
  registration_date: "",
  insurance_expiry: "",
  fitness_expiry: "",
  permit_expiry: "",
  pollution_expiry: "",
  status: "ACTIVE",
  remarks: "",
};

const getArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
};

const getObject = (response) => {
  const data = response?.data;

  if (data?.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [transporters, setTransporters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  /* ============================================================
     LOAD VEHICLES
     ============================================================ */

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vehicles");

      setVehicles(getArray(response));
    } catch (err) {
      console.error("Load vehicles error:", err);

      setVehicles([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load vehicles"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOAD TRANSPORTERS
     ============================================================ */

  const loadTransporters = async () => {
    try {
      const response = await api.get("/transport");

      setTransporters(getArray(response));
    } catch (err) {
      console.error("Load transporters error:", err);

      setTransporters([]);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadTransporters();
  }, []);

  /* ============================================================
     OPEN ADD
     ============================================================ */

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  /* ============================================================
     OPEN EDIT
     ============================================================ */

  const openEditModal = async (vehicle) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(
        `/vehicles/${vehicle.id}`
      );

      const data = getObject(response);

      setEditingId(vehicle.id);

      setForm({
        vehicle_no: data?.vehicle_no || "",
        transporter_id:
          data?.transporter_id ?? "",
        vehicle_type:
          data?.vehicle_type || "TRUCK",
        model: data?.model || "",
        manufacturer:
          data?.manufacturer || "",
        capacity:
          data?.capacity ?? "",
        capacity_unit:
          data?.capacity_unit || "KG",
        registration_date:
          data?.registration_date
            ? String(data.registration_date).slice(0, 10)
            : "",
        insurance_expiry:
          data?.insurance_expiry
            ? String(data.insurance_expiry).slice(0, 10)
            : "",
        fitness_expiry:
          data?.fitness_expiry
            ? String(data.fitness_expiry).slice(0, 10)
            : "",
        permit_expiry:
          data?.permit_expiry
            ? String(data.permit_expiry).slice(0, 10)
            : "",
        pollution_expiry:
          data?.pollution_expiry
            ? String(data.pollution_expiry).slice(0, 10)
            : "",
        status:
          data?.status || "ACTIVE",
        remarks:
          data?.remarks || "",
      });

      setModalOpen(true);
    } catch (err) {
      console.error("Get vehicle error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load vehicle details"
      );
    }
  };

  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  /* ============================================================
     SAVE VEHICLE
     ============================================================ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.vehicle_no?.trim()) {
      setError("Vehicle number is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,

        vehicle_no:
          form.vehicle_no.trim(),

        transporter_id:
          form.transporter_id === ""
            ? null
            : Number(form.transporter_id),

        capacity:
          form.capacity === ""
            ? null
            : Number(form.capacity),

        registration_date:
          form.registration_date || null,

        insurance_expiry:
          form.insurance_expiry || null,

        fitness_expiry:
          form.fitness_expiry || null,

        permit_expiry:
          form.permit_expiry || null,

        pollution_expiry:
          form.pollution_expiry || null,

        model:
          form.model?.trim() || null,

        manufacturer:
          form.manufacturer?.trim() || null,

        remarks:
          form.remarks?.trim() || null,
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/vehicles/${editingId}`,
          payload
        );
      } else {
        response = await api.post(
          "/vehicles",
          payload
        );
      }

      const message =
        response?.data?.message ||
        (editingId
          ? "Vehicle updated successfully"
          : "Vehicle created successfully");

      setSuccess(message);

      closeModal();

      await loadVehicles();
    } catch (err) {
      console.error("Save vehicle error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to save vehicle"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     STATUS UPDATE
     ============================================================ */

  const handleStatusChange = async (
    vehicle,
    status
  ) => {
    if (!vehicle?.id) return;

    try {
      setError("");

      await api.patch(
        `/vehicles/${vehicle.id}/status`,
        { status }
      );

      await loadVehicles();

      setSuccess(
        "Vehicle status updated successfully"
      );
    } catch (err) {
      console.error(
        "Vehicle status error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update vehicle status"
      );
    }
  };

  /* ============================================================
     DELETE
     ============================================================ */

  const handleDelete = async (vehicle) => {
    if (!vehicle?.id) return;

    const confirmed = window.confirm(
      `Delete vehicle "${vehicle.vehicle_no}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/vehicles/${vehicle.id}`
      );

      await loadVehicles();

      setSuccess(
        "Vehicle deleted successfully"
      );
    } catch (err) {
      console.error(
        "Delete vehicle error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to delete vehicle"
      );
    }
  };

  /* ============================================================
     FILTER
     ============================================================ */

  const filteredVehicles = vehicles.filter(
    (vehicle) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        vehicle.vehicle_no
          ?.toLowerCase()
          .includes(searchText) ||
        vehicle.vehicle_type
          ?.toLowerCase()
          .includes(searchText) ||
        vehicle.model
          ?.toLowerCase()
          .includes(searchText) ||
        vehicle.manufacturer
          ?.toLowerCase()
          .includes(searchText) ||
        vehicle.transporter_name
          ?.toLowerCase()
          .includes(searchText) ||
        vehicle.transporter_code
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        !statusFilter ||
        vehicle.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  /* ============================================================
     HELPERS
     ============================================================ */

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "vehicle-status active";

      case "INACTIVE":
        return "vehicle-status inactive";

      case "MAINTENANCE":
        return "vehicle-status maintenance";

      default:
        return "vehicle-status";
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="vehicles-page">

      {/* HEADER */}

      <div className="vehicles-header">

        <div>
          <h1>Vehicles</h1>

          <p>
            Manage company vehicles,
            transporters and vehicle
            compliance details.
          </p>
        </div>

        <button
          type="button"
          className="vehicle-add-btn"
          onClick={openAddModal}
        >
          + Add Vehicle
        </button>

      </div>


      {/* ALERTS */}

      {error && (
        <div className="vehicle-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="vehicle-alert success">
          {success}
        </div>
      )}


      {/* FILTER BAR */}

      <div className="vehicles-filter">

        <div className="vehicle-search">
          <input
            type="text"
            placeholder="Search vehicle, transporter, model..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="vehicle-status-filter">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="">
              All Status
            </option>

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


      {/* TABLE */}

      <div className="vehicles-card">

        {loading ? (
          <div className="vehicles-loading">
            Loading vehicles...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="vehicles-empty">

            <div className="vehicles-empty-icon">
              🚚
            </div>

            <h3>
              No vehicles found
            </h3>

            <p>
              Add your first vehicle to
              start managing transport.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="vehicle-empty-btn"
            >
              + Add Vehicle
            </button>

          </div>
        ) : (
          <div className="vehicles-table-wrapper">

            <table className="vehicles-table">

              <thead>
                <tr>
                  <th>Vehicle No.</th>
                  <th>Transporter</th>
                  <th>Type</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Insurance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredVehicles.map(
                  (vehicle) => (
                    <tr key={vehicle.id}>

                      <td>
                        <strong>
                          {vehicle.vehicle_no ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        <div className="transporter-cell">

                          <span>
                            {vehicle.transporter_name ||
                              "—"}
                          </span>

                          {vehicle.transporter_code && (
                            <small>
                              {
                                vehicle.transporter_code
                              }
                            </small>
                          )}

                        </div>
                      </td>

                      <td>
                        <span className="vehicle-type">
                          {vehicle.vehicle_type ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        <div>
                          {vehicle.model ||
                            "—"}
                        </div>

                        {vehicle.manufacturer && (
                          <small className="vehicle-subtext">
                            {
                              vehicle.manufacturer
                            }
                          </small>
                        )}
                      </td>

                      <td>
                        {vehicle.capacity !==
                        null &&
                        vehicle.capacity !==
                        undefined &&
                        vehicle.capacity !==
                        "" ? (
                          <>
                            {vehicle.capacity}{" "}
                            {
                              vehicle.capacity_unit
                            }
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {formatDate(
                          vehicle.insurance_expiry
                        )}
                      </td>

                      <td>
                        <select
                          className={getStatusClass(
                            vehicle.status
                          )}
                          value={
                            vehicle.status ||
                            "ACTIVE"
                          }
                          onChange={(event) =>
                            handleStatusChange(
                              vehicle,
                              event.target.value
                            )
                          }
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
                      </td>

                      <td>
                        <div className="vehicle-actions">

                          <button
                            type="button"
                            className="vehicle-action edit"
                            onClick={() =>
                              openEditModal(vehicle)
                            }
                            title="Edit Vehicle"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="vehicle-action delete"
                            onClick={() =>
                              handleDelete(vehicle)
                            }
                            title="Delete Vehicle"
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* MODAL */}

      <MasterModal
        open={modalOpen}
        title={
          editingId
            ? "Edit Vehicle"
            : "Add Vehicle"
        }
        subtitle={
          editingId
            ? "Update vehicle information."
            : "Enter the vehicle information below."
        }
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onClose={closeModal}
        loading={saving}
        type="vehicle"
        transporters={transporters}
        error={error}
      />

    </div>
  );
}