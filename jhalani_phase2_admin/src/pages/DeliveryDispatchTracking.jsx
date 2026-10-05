import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDeliveryDispatches,
  getDeliveryDispatchById,
  updateDeliveryDispatchStatus,
} from "../api/deliveryDispatchApi";

import CommonTable from "../components/common/CommonTable";
import TableFilterBar from "../components/common/TableFilterBar";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TableActions from "../components/common/TableActions";

import "../styles/deliveryDispatchTracking.css";

const STATUS_OPTIONS = [
  "DRAFT",
  "READY",
  "DISPATCHED",
  "CANCELLED",
];

const DeliveryDispatchTracking = () => {
  const [dispatches, setDispatches] =
    useState([]);

  const [selectedDispatch, setSelectedDispatch] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  ============================================================
  LOAD DISPATCHES
  ============================================================
  */

  const loadDispatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDeliveryDispatches();

      const rows =
        response?.data?.data ||
        response?.data?.dispatches ||
        response?.data ||
        [];

      setDispatches(
        Array.isArray(rows)
          ? rows
          : []
      );
    } catch (err) {
      console.error(
        "Delivery dispatch load error:",
        err
      );

      setDispatches([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load dispatches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  /*
  ============================================================
  FILTER
  ============================================================
  */

  const filteredDispatches = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return dispatches.filter((item) => {
      const matchesSearch =
        !keyword ||
        String(
          item.dispatch_no || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          item.order_no || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          item.party_name || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          item.transporter_name || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          item.vehicle_number || ""
        )
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        !statusFilter ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    dispatches,
    search,
    statusFilter,
  ]);

  /*
  ============================================================
  VIEW DETAILS
  ============================================================
  */

  const openDetails = async (id) => {
    try {
      setDetailsLoading(true);
      setError("");
      setSuccess("");

      const response =
        await getDeliveryDispatchById(id);

      const data =
        response?.data?.data ||
        response?.data?.dispatch ||
        response?.data ||
        null;

      setSelectedDispatch(data);
    } catch (err) {
      console.error(
        "Delivery dispatch details error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load dispatch details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    if (updating) return;

    setSelectedDispatch(null);
  };

  /*
  ============================================================
  UPDATE STATUS
  ============================================================
  */

  const updateStatus = async (
    id,
    status
  ) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response =
        await updateDeliveryDispatchStatus(
          id,
          status
        );

      setSuccess(
        response?.data?.message ||
          `Dispatch marked as ${status}.`
      );

      await loadDispatches();

      const detailsResponse =
        await getDeliveryDispatchById(
          id
        );

      const updated =
        detailsResponse?.data?.data ||
        detailsResponse?.data?.dispatch ||
        detailsResponse?.data ||
        null;

      setSelectedDispatch(updated);
    } catch (err) {
      console.error(
        "Update dispatch status error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update dispatch status."
      );
    } finally {
      setUpdating(false);
    }
  };

  /*
  ============================================================
  STATUS CLASS
  ============================================================
  */

  const statusClass = (status) =>
    `delivery-status delivery-status-${String(
      status || ""
    ).toLowerCase()}`;

  /*
  ============================================================
  DATE
  ============================================================
  */

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
  ============================================================
  RESET
  ============================================================
  */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  /*
  ============================================================
  COMMON TABLE COLUMNS
  ============================================================
  */

  const columns = useMemo(
    () => [
      {
        key: "dispatch_no",
        label: "Dispatch No.",

        render: (value) => (
          <strong>
            {value || "-"}
          </strong>
        ),
      },

      {
        key: "order_no",
        label: "Order No.",

        render: (value) =>
          value || "-",
      },

      {
        key: "party_name",
        label: "Party",

        render: (value) =>
          value || "-",
      },

      {
        key: "dispatch_date",
        label: "Dispatch Date",

        render: (value) =>
          formatDate(value),
      },

      {
        key: "transporter_name",
        label: "Transporter",

        render: (value) =>
          value || "-",
      },

      {
        key: "vehicle_number",
        label: "Vehicle",

        render: (value) =>
          value || "-",
      },

      {
        key: "status",
        label: "Status",

        render: (value) => (
          <span
            className={statusClass(
              value
            )}
          >
            {String(
              value || "-"
            ).replaceAll(
              "_",
              " "
            )}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Action",

        render: (
          value,
          row
        ) => (
          <TableActions
            showView
            showEdit={false}
            showDelete={false}
            showStatus={false}
            onView={() =>
              openDetails(
                row.id
              )
            }
          />
        ),
      },
    ],
    []
  );

  /*
  ============================================================
  STATUS ACTIONS
  ============================================================
  */

const renderStatusActions = () => {
  if (!selectedDispatch) {
    return null;
  }

  const status = selectedDispatch.status;

  if (status === "CANCELLED") {
    return (
      <div className="delivery-status-message cancelled">
        This dispatch has been cancelled.
      </div>
    );
  }

  if (status === "DISPATCHED") {
    return (
      <div className="delivery-status-message dispatched">
        This dispatch is ready for delivery assignment.
      </div>
    );
  }

  return (
    <div className="delivery-action-buttons">

      {status === "DRAFT" && (
        <button
          type="button"
          className="delivery-action ready"
          disabled={updating}
          onClick={() =>
            updateStatus(
              selectedDispatch.id,
              "READY"
            )
          }
        >
          Mark Ready
        </button>
      )}

      {status === "READY" && (
        <button
          type="button"
          className="delivery-action dispatched"
          disabled={updating}
          onClick={() =>
            updateStatus(
              selectedDispatch.id,
              "DISPATCHED"
            )
          }
        >
          Mark Dispatched
        </button>
      )}

      {status !== "CANCELLED" && (
        <button
          type="button"
          className="delivery-action cancel"
          disabled={updating}
          onClick={() => {
            const confirmed = window.confirm(
              "Are you sure you want to cancel this dispatch?"
            );

            if (confirmed) {
              updateStatus(
                selectedDispatch.id,
                "CANCELLED"
              );
            }
          }}
        >
          Cancel Dispatch
        </button>
      )}

    </div>
  );
};
  return (
    <div className="delivery-tracking-page">

      {/* HEADER */}

      <div className="delivery-tracking-header">

        <div>
          <h1>
            Delivery / Dispatch Tracking
          </h1>

          <p>
            Track dispatched orders and
            update their delivery status.
          </p>
        </div>

        <div className="delivery-count-card">
          <span>
            Total Dispatches
          </span>

          <strong>
            {dispatches.length}
          </strong>
        </div>

      </div>


      {/* ALERTS */}

      {error && (
        <div className="delivery-alert delivery-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="delivery-alert delivery-alert-success">
          {success}
        </div>
      )}


      {/* COMMON FILTER */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Dispatch no, order no, party, vehicle..."
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Statuses",
            options:
              STATUS_OPTIONS.map(
                (status) => ({
                  value: status,
                  label: status.replaceAll(
                    "_",
                    " "
                  ),
                })
              ),
          },
        ]}
        values={{
          status:
            statusFilter,
        }}
        onChange={(values) => {
          setStatusFilter(
            values.status || ""
          );
        }}
        onReset={clearFilters}
      />


      {/* TABLE */}

      <div className="delivery-table-card">

        <div className="delivery-table-heading">
          <div>
            <h2>
              Dispatch Tracking
            </h2>

            <span>
              {filteredDispatches.length}{" "}
              record
              {filteredDispatches.length ===
              1
                ? ""
                : "s"}{" "}
              found
            </span>
          </div>
        </div>


        {loading ? (
          <LoadingState
            message="Loading dispatches..."
          />
        ) : filteredDispatches.length ===
          0 ? (
          <EmptyState
            title="No dispatch records found"
            message={
              search ||
              statusFilter
                ? "No dispatch records match the current search or status filter."
                : "There are no dispatch records available."
            }
            actionLabel={
              search ||
              statusFilter
                ? "Clear Filters"
                : ""
            }
            onAction={
              clearFilters
            }
          />
        ) : (
          <CommonTable
            columns={columns}
            data={filteredDispatches}
            rowKey="id"
          />
        )}

      </div>


      {/* DETAILS MODAL */}

      {selectedDispatch && (
        <div
          className="delivery-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >

          <div className="delivery-details-modal">

            <div className="delivery-modal-header">

              <div>
                <span>
                  Dispatch Tracking
                </span>

                <h2>
                  {
                    selectedDispatch.dispatch_no
                  }
                </h2>
              </div>

              <button
                type="button"
                className="delivery-close-button"
                onClick={
                  closeDetails
                }
                disabled={updating}
              >
                ×
              </button>

            </div>


            {detailsLoading ? (
              <LoadingState
                message="Loading dispatch details..."
              />
            ) : (
              <>

                {/* CURRENT STATUS */}

                <div className="delivery-current-status">

                  <span>
                    Current Status
                  </span>

                  <strong
                    className={statusClass(
                      selectedDispatch.status
                    )}
                  >
                    {String(
                      selectedDispatch.status ||
                        "-"
                    ).replaceAll(
                      "_",
                      " "
                    )}
                  </strong>

                </div>


                {/* DISPATCH INFORMATION */}

                <div className="delivery-detail-section">

                  <div className="delivery-section-title">
                    <h3>
                      Dispatch Information
                    </h3>
                  </div>

                  <div className="delivery-info-grid">

                    <div>
                      <label>
                        Dispatch No.
                      </label>

                      <strong>
                        {
                          selectedDispatch.dispatch_no
                        }
                      </strong>
                    </div>

                    <div>
                      <label>
                        Order No.
                      </label>

                      <strong>
                        {
                          selectedDispatch.order_no ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div>
                      <label>
                        Party
                      </label>

                      <strong>
                        {
                          selectedDispatch.party_name ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div>
                      <label>
                        Dispatch Date
                      </label>

                      <strong>
                        {formatDate(
                          selectedDispatch.dispatch_date
                        )}
                      </strong>
                    </div>

                    <div>
                      <label>
                        Transporter
                      </label>

                      <strong>
                        {
                          selectedDispatch.transporter_name ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div>
                      <label>
                        Vehicle Number
                      </label>

                      <strong>
                        {
                          selectedDispatch.vehicle_number ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div>
                      <label>
                        LR / GR Number
                      </label>

                      <strong>
                        {
                          selectedDispatch.lr_gr_number ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div>
                      <label>
                        LR / GR Date
                      </label>

                      <strong>
                        {formatDate(
                          selectedDispatch.lr_gr_date
                        )}
                      </strong>
                    </div>

                    <div>
                      <label>
                        E-Way Bill
                      </label>

                      <strong>
                        {
                          selectedDispatch.eway_bill_number ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div className="delivery-full-width">
                      <label>
                        Delivery Address
                      </label>

                      <strong>
                        {
                          selectedDispatch.delivery_address ||
                          "-"
                        }
                      </strong>
                    </div>

                    <div className="delivery-full-width">
                      <label>
                        Remarks
                      </label>

                      <strong>
                        {
                          selectedDispatch.remarks ||
                          "-"
                        }
                      </strong>
                    </div>

                  </div>

                </div>


                {/* ITEMS */}

                <div className="delivery-detail-section">

                  <div className="delivery-section-title">
                    <h3>
                      Dispatch Items
                    </h3>
                  </div>

                  {Array.isArray(
                    selectedDispatch.items
                  ) &&
                  selectedDispatch.items.length >
                    0 ? (
                    <CommonTable
                      columns={[
                        {
                          key: "product_name",
                          label: "Product",
                          render: (
                            value
                          ) =>
                            value || "-",
                        },
                        {
                          key: "sku",
                          label: "SKU",
                          render: (
                            value
                          ) =>
                            value || "-",
                        },
                        {
                          key: "quantity",
                          label: "Quantity",
                          render: (
                            value
                          ) =>
                            Number(
                              value || 0
                            ).toFixed(
                              3
                            ),
                        },
                        {
                          key: "description",
                          label: "Description",
                          render: (
                            value
                          ) =>
                            value || "-",
                        },
                      ]}
                      data={
                        selectedDispatch.items
                      }
                      rowKey="id"
                    />
                  ) : (
                    <EmptyState
                      title="No dispatch items"
                      message="No items are associated with this dispatch."
                    />
                  )}

                </div>


                {/* DELIVERY STATUS */}

                <div className="delivery-detail-section">

                  <div className="delivery-section-title">

                    <h3>
                      Delivery Status
                    </h3>

                    {updating && (
                      <span>
                        Updating...
                      </span>
                    )}

                  </div>

                  {renderStatusActions()}

                </div>

              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default DeliveryDispatchTracking;