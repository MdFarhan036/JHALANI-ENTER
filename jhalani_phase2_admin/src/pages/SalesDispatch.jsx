import React, { useEffect, useMemo, useState } from "react";

import {
  getPendingOrders,
  getPendingOrderItems,
  createDispatch,
  getTransporters,
  getVehicles,
} from "../api/dispatchApi";

import "../styles/salesDispatch.css";

/* ============================================================
   INITIAL FORM
============================================================ */

const getInitialForm = () => ({
  order_id: "",
  dispatch_date: new Date().toISOString().split("T")[0],
  delivery_address: "",
  transporter_id: "",
  vehicle_id: "",
  lr_gr_number: "",
  lr_gr_date: "",
  eway_bill_number: "",
  dispatch_by: "",
  remarks: "",
});

/* ============================================================
   RESPONSE HELPERS
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

const getResponseObject = (response) => {
  return (
    response?.data?.data ||
    response?.data ||
    {}
  );
};

/* ============================================================
   SALES DISPATCH
============================================================ */

const SalesDispatch = () => {
  /* ==========================================================
     DATA
  ========================================================== */

  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [transporters, setTransporters] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  /* ==========================================================
     FORM
  ========================================================== */

  const [form, setForm] = useState(getInitialForm());

  const [dispatchQuantities, setDispatchQuantities] =
    useState({});

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [loadingItems, setLoadingItems] =
    useState(false);

  const [loadingTransporters, setLoadingTransporters] =
    useState(false);

  const [loadingVehicles, setLoadingVehicles] =
    useState(false);

  const [saving, setSaving] = useState(false);

  /* ==========================================================
     SEARCH / MESSAGES
  ========================================================== */

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     LOAD PENDING ORDERS
  ========================================================== */

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      setError("");

      const response = await getPendingOrders();

      const data = getResponseData(response);

      setOrders(data);
    } catch (err) {
      console.error(
        "Get pending orders error:",
        err
      );

      setOrders([]);

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load pending orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  /* ==========================================================
     LOAD TRANSPORTERS
  ========================================================== */

  const loadTransporters = async () => {
    try {
      setLoadingTransporters(true);

      const response = await getTransporters();

      const rows = getResponseData(response);

      setTransporters(
        rows.filter(
          (transporter) =>
            Number(transporter.status) === 1
        )
      );
    } catch (err) {
      console.error(
        "Failed to fetch transporters:",
        err
      );

      setTransporters([]);
    } finally {
      setLoadingTransporters(false);
    }
  };

  /* ==========================================================
     LOAD VEHICLES
  ========================================================== */

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);

      const response = await getVehicles();

      const rows = getResponseData(response);

      setVehicles(
        rows.filter(
          (vehicle) =>
            String(
              vehicle.status || ""
            ).toUpperCase() === "ACTIVE"
        )
      );
    } catch (err) {
      console.error(
        "Failed to fetch vehicles:",
        err
      );

      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadOrders();
    loadTransporters();
    loadVehicles();
  }, []);

  /* ==========================================================
     FILTER ORDERS
  ========================================================== */

  const filteredOrders = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        String(order.order_no || "")
          .toLowerCase()
          .includes(value) ||

        String(order.order_number || "")
          .toLowerCase()
          .includes(value) ||

        String(order.party_name || "")
          .toLowerCase()
          .includes(value) ||

        String(order.customer_name || "")
          .toLowerCase()
          .includes(value) ||

        String(order.po_number || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [orders, search]);

  /* ==========================================================
     SELECT ORDER
  ========================================================== */

  const selectOrder = async (order) => {
    try {
      setSelectedOrder(order);

      setForm({
        ...getInitialForm(),

        order_id: order.id,

        delivery_address:
          order.delivery_address || "",
      });

      setItems([]);

      setDispatchQuantities({});

      setError("");

      setSuccess("");

      setLoadingItems(true);

      const response =
        await getPendingOrderItems(order.id);

      const loadedItems =
        getResponseData(response);

      setItems(loadedItems);

      /* ------------------------------------------------------
         INITIALIZE QUANTITY STATE
      ------------------------------------------------------ */

      const quantities = {};

      loadedItems.forEach((item) => {
        const itemId =
          item.order_item_id ?? item.id;

        if (
          itemId !== undefined &&
          itemId !== null
        ) {
          quantities[itemId] = "";
        }
      });

      setDispatchQuantities(quantities);
    } catch (err) {
      console.error(
        "Get pending order items error:",
        err
      );

      setItems([]);

      setDispatchQuantities({});

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load pending order items."
      );
    } finally {
      setLoadingItems(false);
    }
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

    setError("");
  };

  /* ==========================================================
     TRANSPORTER CHANGE
  ========================================================== */

  const handleTransporterChange = (event) => {
    const transporterId =
      event.target.value;

    setForm((previous) => ({
      ...previous,

      transporter_id:
        transporterId,

      vehicle_id: "",
    }));

    setError("");
  };

  /* ==========================================================
     QUANTITY CHANGE
  ========================================================== */
  const handleQuantityChange = (event, item) => {
    const itemId = String(
      item.order_item_id ?? item.id
    );

    const value = event.target.value;

    console.log("QUANTITY CHANGE:", {
      itemId,
      value,
      item,
    });

    setDispatchQuantities((previous) => {
      const updated = {
        ...previous,
        [itemId]: value,
      };

      console.log(
        "UPDATED DISPATCH QUANTITIES:",
        updated
      );

      return updated;
    });

    setError("");
  };

  /* ==========================================================
     TOTAL DISPATCH QUANTITY
  ========================================================== */
  const totalDispatchQuantity = useMemo(() => {
    return items.reduce((total, item) => {
      const itemId = String(
        item.order_item_id ?? item.id
      );

      const rawQuantity =
        dispatchQuantities[itemId];

      const quantity =
        rawQuantity === "" ||
          rawQuantity === undefined ||
          rawQuantity === null
          ? 0
          : Number(rawQuantity);

      return (
        total +
        (Number.isFinite(quantity)
          ? quantity
          : 0)
      );
    }, 0);
  }, [items, dispatchQuantities]);

  /* ==========================================================
     SELECTED TRANSPORTER
  ========================================================== */

  const selectedTransporter = useMemo(() => {
    if (!form.transporter_id) {
      return null;
    }

    return transporters.find(
      (transporter) =>
        Number(transporter.id) ===
        Number(form.transporter_id)
    );
  }, [
    transporters,
    form.transporter_id,
  ]);

  /* ==========================================================
     SELECTED VEHICLE
  ========================================================== */

  const selectedVehicle = useMemo(() => {
    if (!form.vehicle_id) {
      return null;
    }

    return vehicles.find(
      (vehicle) =>
        Number(vehicle.id) ===
        Number(form.vehicle_id)
    );
  }, [
    vehicles,
    form.vehicle_id,
  ]);

  /* ==========================================================
     SUBMIT DISPATCH
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");

      /* ------------------------------------------------------
         ORDER VALIDATION
      ------------------------------------------------------ */

      if (!selectedOrder) {
        setError(
          "Please select an order."
        );
        return;
      }

      /* ------------------------------------------------------
         ITEMS LOADING
      ------------------------------------------------------ */

      if (loadingItems) {
        setError(
          "Please wait while order items are loading."
        );
        return;
      }

      /* ------------------------------------------------------
         ITEMS EXISTENCE
      ------------------------------------------------------ */

      if (!items.length) {
        setError(
          "No pending items available for this order."
        );
        return;
      }

      /* ------------------------------------------------------
         BUILD DISPATCH ITEMS
      ------------------------------------------------------ */
      const dispatchItems = [];

      console.log(
        "========== DISPATCH SUBMIT DEBUG =========="
      );

      console.log("ITEMS:", items);

      console.log(
        "DISPATCH QUANTITIES:",
        dispatchQuantities
      );

      for (const item of items) {
        const orderItemId = String(
          item.order_item_id ?? item.id
        );

        const rawQuantity =
          dispatchQuantities[orderItemId];

        console.log("PROCESSING ITEM:", {
          item,
          orderItemId,
          rawQuantity,
        });

        const quantity =
          rawQuantity === "" ||
            rawQuantity === undefined ||
            rawQuantity === null
            ? 0
            : Number(rawQuantity);

        console.log("FINAL QUANTITY:", {
          orderItemId,
          quantity,
        });

        /* -----------------------------------------------
           EMPTY QUANTITY
        ------------------------------------------------ */

        if (
          rawQuantity === "" ||
          rawQuantity === undefined ||
          rawQuantity === null
        ) {
          continue;
        }

        /* -----------------------------------------------
           INVALID QUANTITY
        ------------------------------------------------ */

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          setError(
            `Enter a valid dispatch quantity for ${item.product_name || "product"
            }.`
          );

          return;
        }

        const pendingQuantity = Number(
          item.pending_quantity || 0
        );

        const currentStock = Number(
          item.current_stock || 0
        );

        /* -----------------------------------------------
           PENDING VALIDATION
        ------------------------------------------------ */

        if (quantity > pendingQuantity) {
          setError(
            `Dispatch quantity cannot exceed pending quantity for ${item.product_name || "product"
            }. Pending: ${pendingQuantity}`
          );

          return;
        }

        /* -----------------------------------------------
           STOCK VALIDATION
        ------------------------------------------------ */

        if (quantity > currentStock) {
          setError(
            `Insufficient stock for ${item.product_name || "product"
            }. Available stock: ${currentStock}.`
          );

          return;
        }

        /* -----------------------------------------------
           ADD ITEM
        ------------------------------------------------ */

        dispatchItems.push({
          order_item_id: Number(
            orderItemId
          ),

          variant_id:
            item.variant_id !== undefined &&
              item.variant_id !== null
              ? Number(item.variant_id)
              : null,

          quantity: quantity,

          description:
            item.description || "",
        });
      }

      console.log(
        "FINAL DISPATCH ITEMS:",
        dispatchItems
      );

      console.log(
        "============================================"
      );

      if (dispatchItems.length === 0) {
        setError(
          "Enter dispatch quantity for at least one item."
        );

        return;
      }

      /* ======================================================
         BACKEND MAPPING
      ====================================================== */

      if (
        form.transporter_id &&
        !selectedTransporter
      ) {
        setError(
          "Selected transporter is no longer available."
        );

        return;
      }

      if (
        form.vehicle_id &&
        !selectedVehicle
      ) {
        setError(
          "Selected vehicle is no longer available."
        );

        return;
      }

      /* ------------------------------------------------------
         FINAL PAYLOAD
      ------------------------------------------------------ */

      const payload = {
        order_id:
          Number(form.order_id),

        dispatch_date:
          form.dispatch_date,

        delivery_address:
          form.delivery_address ||
          null,

        transporter_name:
          selectedTransporter?.name ||
          null,

        vehicle_number:
          selectedVehicle?.vehicle_no ||
          null,

        lr_gr_number:
          form.lr_gr_number ||
          null,

        lr_gr_date:
          form.lr_gr_date ||
          null,

        eway_bill_number:
          form.eway_bill_number ||
          null,

        dispatch_by:
          form.dispatch_by
            ? Number(
              form.dispatch_by
            )
            : null,

        remarks:
          form.remarks ||
          null,

        items:
          dispatchItems,
      };

      console.log(
        "Creating Sales Dispatch:",
        payload
      );

      /* ------------------------------------------------------
         SAVE
      ------------------------------------------------------ */

      setSaving(true);

      console.log(
        "========================================"
      );

      console.log(
        "FINAL PAYLOAD SENT TO BACKEND:"
      );

      console.log(
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.log(
        "========================================"
      );

      const response =
        await createDispatch(payload);

      /* ------------------------------------------------------
         RESPONSE
      ------------------------------------------------------ */

      const responseData =
        getResponseObject(
          response
        );

      const message =
        response?.data?.message ||
        response?.message ||
        "Dispatch created successfully.";

      const dispatchNo =
        responseData?.dispatch_no ||
        responseData?.dispatch_number ||
        responseData?.dispatchNo;

      setSuccess(
        dispatchNo
          ? `${message} Dispatch No: ${dispatchNo}`
          : message
      );

      /* ------------------------------------------------------
         RESET
      ------------------------------------------------------ */

      setSelectedOrder(null);

      setItems([]);

      setDispatchQuantities({});

      setForm(
        getInitialForm()
      );

      /* ------------------------------------------------------
         REFRESH PENDING ORDERS
      ------------------------------------------------------ */

      await loadOrders();

    } catch (err) {
      console.error(
        "Create dispatch error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create dispatch."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     CANCEL
  ========================================================== */

  const handleCancel = () => {
    if (saving) {
      return;
    }

    setSelectedOrder(null);

    setItems([]);

    setDispatchQuantities({});

    setForm(
      getInitialForm()
    );

    setError("");

    setSuccess("");
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="sales-dispatch-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="sales-dispatch-header">

        <div>
          <h1>Sales Dispatch</h1>

          <p>
            Dispatch pending quantities
            against confirmed sales orders.
          </p>
        </div>

        <div className="dispatch-header-count">
          <span>
            Pending Orders
          </span>

          <strong>
            {orders.length}
          </strong>
        </div>

      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {error && (
        <div className="dispatch-alert dispatch-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="dispatch-alert dispatch-alert-success">
          {success}
        </div>
      )}

      {/* ======================================================
          MAIN LAYOUT
      ====================================================== */}

      <div className="sales-dispatch-layout">

        {/* ====================================================
            LEFT — PENDING ORDERS
        ==================================================== */}

        <section className="dispatch-orders-panel">

          <div className="panel-header">

            <div>
              <h2>
                Pending Orders
              </h2>

              <span>
                Select an order to dispatch
              </span>
            </div>

          </div>

          {/* SEARCH */}

          <div className="dispatch-search">

            <input
              type="text"
              placeholder="Search order, party or PO..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {/* ORDERS */}

          <div className="dispatch-orders-list">

            {loadingOrders ? (

              <div className="dispatch-empty">
                Loading orders...
              </div>

            ) : filteredOrders.length === 0 ? (

              <div className="dispatch-empty">
                No pending orders found.
              </div>

            ) : (

              filteredOrders.map(
                (order) => (

                  <button
                    type="button"
                    key={order.id}
                    className={`dispatch-order-card ${selectedOrder?.id ===
                      order.id
                      ? "active"
                      : ""
                      }`}
                    onClick={() =>
                      selectOrder(order)
                    }
                    disabled={saving}
                  >

                    <div className="order-card-top">

                      <strong>
                        {order.order_no ||
                          order.order_number ||
                          `Order #${order.id}`}
                      </strong>

                      <span
                        className={`order-status status-${String(
                          order.status ||
                          "pending"
                        ).toLowerCase()}`}
                      >
                        {order.status ||
                          "Pending"}
                      </span>

                    </div>

                    <div className="order-party">
                      {order.party_name ||
                        order.customer_name ||
                        "-"}
                    </div>

                    {order.po_number && (
                      <div className="order-meta">
                        PO:{" "}
                        {order.po_number}
                      </div>
                    )}

                    <div className="order-meta">
                      Order Date:{" "}
                      {order.order_date
                        ? new Date(
                          order.order_date
                        ).toLocaleDateString()
                        : "-"}
                    </div>

                    <div className="order-address">
                      {order.delivery_address ||
                        "No delivery address"}
                    </div>

                  </button>

                )
              )

            )}

          </div>

        </section>

        {/* ====================================================
            RIGHT — DISPATCH FORM
        ==================================================== */}

        <section className="dispatch-form-panel">

          {!selectedOrder ? (

            <div className="dispatch-placeholder">

              <div className="placeholder-icon">
                🚚
              </div>

              <h2>
                Select an Order
              </h2>

              <p>
                Select a pending sales
                order from the left side
                to create a dispatch.
              </p>

            </div>

          ) : (

            <form
              onSubmit={handleSubmit}
            >

              {/* ==============================================
                  ORDER INFORMATION
              ============================================== */}

              <div className="dispatch-section">

                <div className="section-title">
                  <h2>
                    Order Information
                  </h2>
                </div>

                <div className="order-info-grid">

                  <div>
                    <label>
                      Order No.
                    </label>

                    <strong>
                      {selectedOrder.order_no ||
                        selectedOrder.order_number ||
                        `#${selectedOrder.id}`}
                    </strong>
                  </div>

                  <div>
                    <label>
                      Party
                    </label>

                    <strong>
                      {selectedOrder.party_name ||
                        selectedOrder.customer_name ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <label>
                      PO Number
                    </label>

                    <strong>
                      {selectedOrder.po_number ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <label>
                      PO Date
                    </label>

                    <strong>
                      {selectedOrder.po_date
                        ? new Date(
                          selectedOrder.po_date
                        ).toLocaleDateString()
                        : "-"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* ==============================================
                  DISPATCH ITEMS
              ============================================== */}

              <div className="dispatch-section">

                <div className="section-title">

                  <div>
                    <h2>
                      Dispatch Items
                    </h2>

                    <span>
                      Enter quantities to dispatch
                    </span>
                  </div>

                  <div className="total-dispatch">

                    Total:{" "}

                    <strong>
                      {totalDispatchQuantity.toFixed(
                        3
                      )}
                    </strong>

                  </div>

                </div>

                {loadingItems ? (

                  <div className="dispatch-empty">
                    Loading items...
                  </div>

                ) : items.length === 0 ? (

                  <div className="dispatch-empty">
                    No pending items available.
                  </div>

                ) : (

                  <div className="dispatch-items-table-wrapper">

                    <table className="dispatch-items-table">

                      <thead>
                        <tr>
                          <th>
                            Product
                          </th>

                          <th>
                            SKU
                          </th>

                          <th>
                            Ordered
                          </th>

                          <th>
                            Dispatched
                          </th>

                          <th>
                            Pending
                          </th>

                          <th>
                            Stock
                          </th>

                          <th>
                            Dispatch Qty
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {items.map(
                          (item) => {

                            const orderItemId =
                              item.order_item_id ??
                              item.id;

                            const rawQuantity =
                              dispatchQuantities[
                              orderItemId
                              ];

                            const quantity =
                              rawQuantity === "" ||
                                rawQuantity ===
                                undefined ||
                                rawQuantity === null
                                ? 0
                                : Number(
                                  rawQuantity
                                );

                            const pendingQuantity =
                              Number(
                                item.pending_quantity ||
                                0
                              );

                            const currentStock =
                              Number(
                                item.current_stock ||
                                0
                              );

                            const exceedsPending =
                              quantity >
                              pendingQuantity;

                            const exceedsStock =
                              quantity >
                              currentStock;

                            return (
                              <tr
                                key={
                                  orderItemId
                                }
                              >

                                {/* PRODUCT */}

                                <td>

                                  <div className="product-name">
                                    {item.product_name ||
                                      "-"}
                                  </div>

                                  {item.variant_name && (
                                    <div className="variant-name">
                                      {
                                        item.variant_name
                                      }
                                    </div>
                                  )}

                                </td>

                                {/* SKU */}

                                <td>
                                  {item.sku ||
                                    item.variant_sku ||
                                    "-"}
                                </td>

                                {/* ORDERED */}

                                <td>
                                  {Number(
                                    item.ordered_quantity ||
                                    0
                                  ).toFixed(3)}
                                </td>

                                {/* DISPATCHED */}

                                <td>
                                  {Number(
                                    item.dispatched_quantity ||
                                    0
                                  ).toFixed(3)}
                                </td>

                                {/* PENDING */}

                                <td>
                                  <strong>
                                    {pendingQuantity.toFixed(
                                      3
                                    )}
                                  </strong>
                                </td>

                                {/* STOCK */}

                                <td>

                                  <span
                                    className={
                                      currentStock <
                                        pendingQuantity
                                        ? "stock-low"
                                        : "stock-ok"
                                    }
                                  >
                                    {currentStock.toFixed(
                                      3
                                    )}
                                  </span>

                                </td>

                                {/* DISPATCH QTY */}

                                <td>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    max={Math.min(
                                      pendingQuantity,
                                      currentStock
                                    )}
                                    value={
                                      dispatchQuantities[
                                      String(orderItemId)
                                      ] ?? ""
                                    }
                                    onChange={(event) =>
                                      handleQuantityChange(
                                        event,
                                        item
                                      )
                                    }
                                    disabled={saving}
                                    className={
                                      exceedsPending ||
                                        exceedsStock
                                        ? "input-error"
                                        : ""
                                    }
                                  />

                                  {exceedsPending && (
                                    <small className="field-error">
                                      Exceeds pending
                                    </small>
                                  )}

                                  {!exceedsPending &&
                                    exceedsStock && (
                                      <small className="field-error">
                                        Exceeds stock
                                      </small>
                                    )}

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

              {/* ==============================================
                  DISPATCH DETAILS
              ============================================== */}

              <div className="dispatch-section">

                <div className="section-title">
                  <h2>
                    Dispatch Details
                  </h2>
                </div>

                <div className="form-grid">

                  {/* DISPATCH DATE */}

                  <div className="form-group">

                    <label>
                      Dispatch Date *
                    </label>

                    <input
                      type="date"
                      name="dispatch_date"
                      value={
                        form.dispatch_date
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={saving}
                    />

                  </div>

                  {/* TRANSPORTER */}

                  <div className="form-group">

                    <label>
                      Transporter
                    </label>

                    <select
                      name="transporter_id"
                      value={
                        form.transporter_id ||
                        ""
                      }
                      onChange={
                        handleTransporterChange
                      }
                      disabled={
                        loadingTransporters ||
                        saving
                      }
                    >

                      <option value="">
                        {loadingTransporters
                          ? "Loading transporters..."
                          : "Select Transporter"}
                      </option>

                      {transporters.map(
                        (transporter) => (

                          <option
                            key={
                              transporter.id
                            }
                            value={
                              transporter.id
                            }
                          >
                            {transporter.transporter_code
                              ? `${transporter.transporter_code} - ${transporter.name}`
                              : transporter.name}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* VEHICLE */}

                  <div className="form-group">

                    <label>
                      Vehicle
                    </label>

                    <select
                      name="vehicle_id"
                      value={
                        form.vehicle_id ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        !form.transporter_id ||
                        loadingVehicles ||
                        saving
                      }
                    >

                      <option value="">
                        {!form.transporter_id
                          ? "Select transporter first"
                          : loadingVehicles
                            ? "Loading vehicles..."
                            : "Select Vehicle"}
                      </option>

                      {vehicles
                        .filter(
                          (vehicle) =>
                            Number(
                              vehicle.transporter_id
                            ) ===
                            Number(
                              form.transporter_id
                            )
                        )
                        .map(
                          (vehicle) => (

                            <option
                              key={
                                vehicle.id
                              }
                              value={
                                vehicle.id
                              }
                            >
                              {
                                vehicle.vehicle_no
                              }

                              {vehicle.vehicle_type
                                ? ` - ${vehicle.vehicle_type}`
                                : ""}
                            </option>

                          )
                        )}

                    </select>

                  </div>

                  {/* LR / GR NUMBER */}

                  <div className="form-group">

                    <label>
                      LR / GR Number
                    </label>

                    <input
                      type="text"
                      name="lr_gr_number"
                      value={
                        form.lr_gr_number
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="LR / GR number"
                      disabled={saving}
                    />

                  </div>

                  {/* LR / GR DATE */}

                  <div className="form-group">

                    <label>
                      LR / GR Date
                    </label>

                    <input
                      type="date"
                      name="lr_gr_date"
                      value={
                        form.lr_gr_date
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                    />

                  </div>

                  {/* E-WAY BILL */}

                  <div className="form-group">

                    <label>
                      E-Way Bill Number
                    </label>

                    <input
                      type="text"
                      name="eway_bill_number"
                      value={
                        form.eway_bill_number
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="E-Way Bill number"
                      disabled={saving}
                    />

                  </div>

                  {/* DELIVERY ADDRESS */}

                  <div className="form-group form-group-full">

                    <label>
                      Delivery Address
                    </label>

                    <textarea
                      name="delivery_address"
                      value={
                        form.delivery_address
                      }
                      onChange={
                        handleChange
                      }
                      rows="3"
                      placeholder="Delivery address"
                      disabled={saving}
                    />

                  </div>

                  {/* REMARKS */}

                  <div className="form-group form-group-full">

                    <label>
                      Remarks
                    </label>

                    <textarea
                      name="remarks"
                      value={
                        form.remarks
                      }
                      onChange={
                        handleChange
                      }
                      rows="3"
                      placeholder="Dispatch remarks"
                      disabled={saving}
                    />

                  </div>

                </div>

              </div>

              {/* ==============================================
                  ACTIONS
              ============================================== */}

              <div className="dispatch-actions">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    handleCancel
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    saving ||
                    loadingItems ||
                    !selectedOrder
                  }
                >
                  {saving
                    ? "Creating Dispatch..."
                    : "Create Dispatch"}
                </button>

              </div>

            </form>

          )}

        </section>

      </div>

    </div>
  );
};

export default SalesDispatch;