import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDeliveries,
  updateDeliveryStatus,
} from "../api/deliveryApi";

import "../styles/deliveryManagement.css";


/* ============================================================
   RESPONSE HELPER
============================================================ */

const getResponseData = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.rows)) {
    return response.data.rows;
  }

  return [];
};


/* ============================================================
   STATUS LABEL
============================================================ */

const getStatusLabel = (status) => {
  switch (status) {
    case "READY_FOR_DELIVERY":
      return "Ready for Delivery";

    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status || "-";
  }
};


/* ============================================================
   STATUS CLASS
============================================================ */

const getStatusClass = (status) => {
  switch (status) {
    case "READY_FOR_DELIVERY":
      return "ready";

    case "OUT_FOR_DELIVERY":
      return "out";

    case "DELIVERED":
      return "delivered";

    case "CANCELLED":
      return "cancelled";

    default:
      return "default";
  }
};


/* ============================================================
   DATE FORMAT
============================================================ */

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};


/* ============================================================
   DELIVERY MANAGEMENT
============================================================ */

const DeliveryManagement = () => {
  const [deliveries, setDeliveries] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [savingId, setSavingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* ==========================================================
     LOAD DELIVERIES
  ========================================================== */

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDeliveries();

      const data =
        getResponseData(response);

      setDeliveries(data);
    } catch (err) {
      console.error(
        "Get deliveries error:",
        err
      );

      setDeliveries([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load deliveries."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadDeliveries();
  }, []);


  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredDeliveries = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return deliveries.filter(
      (delivery) => {
        const matchesSearch =
          !value ||
          String(
            delivery.dispatch_no || ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            delivery.order_no || ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            delivery.party_name || ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            delivery.delivery_person_name ||
              ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            delivery.vehicle_number || ""
          )
            .toLowerCase()
            .includes(value);

        const matchesStatus =
          statusFilter === "ALL" ||
          delivery.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    deliveries,
    search,
    statusFilter,
  ]);


  /* ==========================================================
     STATUS COUNTS
  ========================================================== */

  const statusCounts = useMemo(() => {
    return {
      all: deliveries.length,

      ready: deliveries.filter(
        (item) =>
          item.status ===
          "READY_FOR_DELIVERY"
      ).length,

      out: deliveries.filter(
        (item) =>
          item.status ===
          "OUT_FOR_DELIVERY"
      ).length,

      delivered: deliveries.filter(
        (item) =>
          item.status ===
          "DELIVERED"
      ).length,

      cancelled: deliveries.filter(
        (item) =>
          item.status ===
          "CANCELLED"
      ).length,
    };
  }, [deliveries]);


  /* ==========================================================
     START DELIVERY
  ========================================================== */

  const handleStartDelivery = async (
    delivery
  ) => {
    if (
      delivery.status !==
      "READY_FOR_DELIVERY"
    ) {
      return;
    }

    try {
      setSavingId(delivery.id);
      setError("");
      setSuccess("");

      await updateDeliveryStatus(
        delivery.id,
        {
          status: "OUT_FOR_DELIVERY",
          remarks:
            "Delivery started",
        }
      );

      setSuccess(
        "Delivery started successfully."
      );

      await loadDeliveries();
    } catch (err) {
      console.error(
        "Start delivery error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to start delivery."
      );
    } finally {
      setSavingId(null);
    }
  };


  /* ==========================================================
     CANCEL DELIVERY
  ========================================================== */

  const handleCancelDelivery = async (
    delivery
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this delivery?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSavingId(delivery.id);
      setError("");
      setSuccess("");

      await updateDeliveryStatus(
        delivery.id,
        {
          status: "CANCELLED",
          remarks:
            "Delivery cancelled from admin panel",
        }
      );

      setSuccess(
        "Delivery cancelled successfully."
      );

      await loadDeliveries();
    } catch (err) {
      console.error(
        "Cancel delivery error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to cancel delivery."
      );
    } finally {
      setSavingId(null);
    }
  };


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="delivery-management-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="delivery-page-header">
        <div>
          <h1>
            Delivery Management
          </h1>

          <p>
            Manage delivery assignments,
            tracking and delivery status.
          </p>
        </div>

        <button
          type="button"
          className="delivery-refresh-btn"
          onClick={loadDeliveries}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>


      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="delivery-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="delivery-alert success">
          {success}
        </div>
      )}


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="delivery-summary-grid">

        <button
          type="button"
          className={`delivery-summary-card ${
            statusFilter === "ALL"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("ALL")
          }
        >
          <span>Total Deliveries</span>
          <strong>
            {statusCounts.all}
          </strong>
        </button>


        <button
          type="button"
          className={`delivery-summary-card ${
            statusFilter ===
            "READY_FOR_DELIVERY"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter(
              "READY_FOR_DELIVERY"
            )
          }
        >
          <span>Ready</span>
          <strong>
            {statusCounts.ready}
          </strong>
        </button>


        <button
          type="button"
          className={`delivery-summary-card ${
            statusFilter ===
            "OUT_FOR_DELIVERY"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter(
              "OUT_FOR_DELIVERY"
            )
          }
        >
          <span>Out for Delivery</span>
          <strong>
            {statusCounts.out}
          </strong>
        </button>


        <button
          type="button"
          className={`delivery-summary-card ${
            statusFilter === "DELIVERED"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("DELIVERED")
          }
        >
          <span>Delivered</span>
          <strong>
            {statusCounts.delivered}
          </strong>
        </button>


        <button
          type="button"
          className={`delivery-summary-card ${
            statusFilter === "CANCELLED"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("CANCELLED")
          }
        >
          <span>Cancelled</span>
          <strong>
            {statusCounts.cancelled}
          </strong>
        </button>

      </div>


      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="delivery-filter-bar">

        <div className="delivery-search">
          <input
            type="text"
            placeholder="Search dispatch, order, party, person or vehicle..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>


        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            All Status
          </option>

          <option value="READY_FOR_DELIVERY">
            Ready for Delivery
          </option>

          <option value="OUT_FOR_DELIVERY">
            Out for Delivery
          </option>

          <option value="DELIVERED">
            Delivered
          </option>

          <option value="CANCELLED">
            Cancelled
          </option>
        </select>

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="delivery-table-card">

        {loading ? (
          <div className="delivery-table-message">
            Loading deliveries...
          </div>
        ) : filteredDeliveries.length ===
          0 ? (
          <div className="delivery-table-message">
            No deliveries found.
          </div>
        ) : (
          <div className="delivery-table-wrapper">

            <table className="delivery-table">

              <thead>
                <tr>
                  <th>
                    Dispatch
                  </th>

                  <th>
                    Order
                  </th>

                  <th>
                    Party
                  </th>

                  <th>
                    Delivery Person
                  </th>

                  <th>
                    Vehicle
                  </th>

                  <th>
                    Expected Date
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

                {filteredDeliveries.map(
                  (delivery) => {

                    const isSaving =
                      savingId ===
                      delivery.id;

                    return (
                      <tr
                        key={delivery.id}
                      >

                        <td>
                          <strong>
                            {
                              delivery.dispatch_no ||
                              `#${delivery.dispatch_id}`
                            }
                          </strong>
                        </td>


                        <td>
                          {
                            delivery.order_no ||
                            `#${delivery.order_id}`
                          }
                        </td>


                        <td>
                          <div className="delivery-party-name">
                            {
                              delivery.party_name ||
                              "-"
                            }
                          </div>

                          {delivery.party_code && (
                            <small>
                              {
                                delivery.party_code
                              }
                            </small>
                          )}
                        </td>


                        <td>
                          {
                            delivery.delivery_person_name ||
                            "-"
                          }
                        </td>


                        <td>
                          {
                            delivery.vehicle_number ||
                            "-"
                          }
                        </td>


                        <td>
                          {formatDate(
                            delivery.expected_delivery_date
                          )}
                        </td>


                        <td>
                          <span
                            className={`delivery-status ${getStatusClass(
                              delivery.status
                            )}`}
                          >
                            {getStatusLabel(
                              delivery.status
                            )}
                          </span>
                        </td>


                        <td>

                          <div className="delivery-actions">

                            {delivery.status ===
                              "READY_FOR_DELIVERY" && (
                              <button
                                type="button"
                                className="delivery-action-primary"
                                disabled={
                                  isSaving
                                }
                                onClick={() =>
                                  handleStartDelivery(
                                    delivery
                                  )
                                }
                              >
                                {isSaving
                                  ? "Starting..."
                                  : "Start Delivery"}
                              </button>
                            )}


                            {delivery.status ===
                              "OUT_FOR_DELIVERY" && (
                              <button
                                type="button"
                                className="delivery-action-primary"
                                onClick={() =>
                                  window.location.href = `/deliveries/${delivery.id}`
                                }
                              >
                                Open Delivery
                              </button>
                            )}


                            {delivery.status ===
                              "DELIVERED" && (
                              <button
                                type="button"
                                className="delivery-action-secondary"
                                onClick={() =>
                                  window.location.href = `/deliveries/${delivery.id}`
                                }
                              >
                                View
                              </button>
                            )}


                            {delivery.status ===
                              "READY_FOR_DELIVERY" && (
                              <button
                                type="button"
                                className="delivery-action-danger"
                                disabled={
                                  isSaving
                                }
                                onClick={() =>
                                  handleCancelDelivery(
                                    delivery
                                  )
                                }
                              >
                                Cancel
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default DeliveryManagement;