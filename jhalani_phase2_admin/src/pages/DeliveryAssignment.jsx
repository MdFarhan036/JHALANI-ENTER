import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getReadyDeliveries,
  assignDelivery,
} from "../api/deliveryApi";

import CommonTable from "../components/common/CommonTable";
import TableFilterBar from "../components/common/TableFilterBar";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TableActions from "../components/common/TableActions";

import "../styles/deliveryAssignment.css";


/* ============================================================
   DATE FORMAT
============================================================ */

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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


/* ============================================================
   DELIVERY ASSIGNMENT
============================================================ */

const DeliveryAssignment = () => {

  const [dispatches, setDispatches] =
    useState([]);

  const [selectedDispatch, setSelectedDispatch] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] = useState({
    delivery_person_id: "",
    expected_delivery_date: "",
    delivery_remarks: "",
  });


  /* ==========================================================
     LOAD READY DELIVERIES
  ========================================================== */

  const loadDispatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getReadyDeliveries();

      const rows =
        response?.data?.data ||
        response?.data?.deliveries ||
        response?.data ||
        [];

      setDispatches(
        Array.isArray(rows)
          ? rows
          : []
      );

    } catch (err) {
      console.error(
        "Ready deliveries error:",
        err
      );

      setDispatches([]);

      setError(
        err?.response?.data?.message ||
        "Failed to load ready deliveries."
      );

    } finally {
      setLoading(false);
    }
  };


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadDispatches();
  }, []);


  /* ==========================================================
     SEARCH
  ========================================================== */

  const filteredDispatches = useMemo(() => {

    const keyword =
      search.trim().toLowerCase();

    return dispatches.filter((item) => {

      if (!keyword) {
        return true;
      }

      return (
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
          item.vehicle_number || ""
        )
          .toLowerCase()
          .includes(keyword)
      );
    });

  }, [
    dispatches,
    search,
  ]);


  /* ==========================================================
     SELECT DISPATCH
  ========================================================== */

  const selectDispatch = (dispatch) => {

    setSelectedDispatch(dispatch);

    setError("");
    setSuccess("");

    setForm({
      delivery_person_id: "",
      expected_delivery_date: "",
      delivery_remarks: "",
    });
  };


  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {

    if (saving) return;

    setSelectedDispatch(null);
  };


  /* ==========================================================
     FORM CHANGE
  ========================================================== */

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


  /* ==========================================================
     ASSIGN DELIVERY
  ========================================================== */

  const handleAssign = async (event) => {

    event.preventDefault();

    if (!selectedDispatch) {
      return;
    }

    if (!form.delivery_person_id) {
      setError(
        "Please select a delivery person."
      );
      return;
    }

    try {

      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        dispatch_id:
          Number(selectedDispatch.id),

        delivery_person_id:
          Number(
            form.delivery_person_id
          ),

        expected_delivery_date:
          form.expected_delivery_date ||
          null,

        delivery_remarks:
          form.delivery_remarks.trim() ||
          null,
      };

      const response =
        await assignDelivery(payload);

      setSuccess(
        response?.data?.message ||
        "Delivery assigned successfully."
      );

      setSelectedDispatch(null);

      await loadDispatches();

    } catch (err) {

      console.error(
        "Assign delivery error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Failed to assign delivery."
      );

    } finally {
      setSaving(false);
    }
  };


  /* ==========================================================
     TABLE COLUMNS
  ========================================================== */

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
        key: "vehicle_number",
        label: "Vehicle",

        render: (value) =>
          value || "-",
      },


      {
        key: "delivery_address",
        label: "Delivery Address",

        render: (value) => (
          <span
            className="delivery-address-cell"
            title={value || ""}
          >
            {value || "-"}
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
              selectDispatch(row)
            }
          />
        ),
      },

    ],
    []
  );


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="delivery-assignment-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="delivery-assignment-header">

        <div>

          <h1>
            Delivery Assignment
          </h1>

          <p>
            Assign dispatched orders to
            delivery personnel.
          </p>

        </div>


        <div className="delivery-count-card">

          <span>
            Ready for Delivery
          </span>

          <strong>
            {dispatches.length}
          </strong>

        </div>

      </div>


      {/* ======================================================
          ALERTS
      ====================================================== */}

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


      {/* ======================================================
          FILTER
      ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Dispatch no, order no, party, vehicle..."
        filters={[]}
        values={{}}
        onChange={() => {}}
        onReset={() => setSearch("")}
      />


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="delivery-assignment-table-card">

        {loading ? (

          <LoadingState
            message="Loading ready deliveries..."
          />

        ) : filteredDispatches.length === 0 ? (

          <EmptyState
            title="No deliveries ready for assignment"
            message={
              search
                ? "No dispatch records match your search."
                : "There are currently no dispatched orders waiting for delivery assignment."
            }
            actionLabel={
              search
                ? "Clear Search"
                : ""
            }
            onAction={() =>
              setSearch("")
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


      {/* ======================================================
          ASSIGN MODAL
      ====================================================== */}

      {selectedDispatch && (

        <div
          className="delivery-assignment-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="delivery-assignment-modal">

            {/* HEADER */}

            <div className="delivery-assignment-modal-header">

              <div>

                <span>
                  Assign Delivery
                </span>

                <h2>
                  {
                    selectedDispatch.dispatch_no ||
                    `Dispatch #${selectedDispatch.id}`
                  }
                </h2>

              </div>


              <button
                type="button"
                className="delivery-close-button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* DISPATCH INFO */}

            <div className="delivery-assignment-info">

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
                  Vehicle
                </label>

                <strong>
                  {
                    selectedDispatch.vehicle_number ||
                    "-"
                  }
                </strong>
              </div>


              <div className="delivery-assignment-full">

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

            </div>


            {/* FORM */}

            <form
              onSubmit={handleAssign}
              className="delivery-assignment-form"
            >

              <div className="delivery-form-group">

                <label>
                  Delivery Person
                  <span>*</span>
                </label>

                <select
                  name="delivery_person_id"
                  value={
                    form.delivery_person_id
                  }
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select Delivery Person
                  </option>

                  {/*
                    IMPORTANT:
                    We will connect your existing
                    employee API here next.
                  */}

                </select>

              </div>


              <div className="delivery-form-group">

                <label>
                  Expected Delivery Date
                </label>

                <input
                  type="date"
                  name="expected_delivery_date"
                  value={
                    form.expected_delivery_date
                  }
                  onChange={handleChange}
                />

              </div>


              <div className="delivery-form-group delivery-form-full">

                <label>
                  Delivery Remarks
                </label>

                <textarea
                  name="delivery_remarks"
                  rows="3"
                  value={
                    form.delivery_remarks
                  }
                  onChange={handleChange}
                  placeholder="Enter any delivery instructions or remarks..."
                />

              </div>


              <div className="delivery-form-actions">

                <button
                  type="button"
                  className="delivery-button-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="delivery-button-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Assigning..."
                    : "Assign Delivery"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default DeliveryAssignment;