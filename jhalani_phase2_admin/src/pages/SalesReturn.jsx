import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSalesReturns,
  getReturnableOrders,
  getReturnableOrderItems,
  getSalesReturnById,
  createSalesReturn,
  completeSalesReturn,
  cancelSalesReturn,
} from "../api/salesReturnApi";
import "../styles/salesReturn.css";


const SalesReturn = () => {
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedOrder, setSelectedOrder] =
    useState("");

  const [returnDate, setReturnDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 16)
    );

  const [reason, setReason] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [loadingItems, setLoadingItems] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedReturn, setSelectedReturn] =
    useState(null);

  /*
  ============================================================
  LOAD RETURNS
  ============================================================
  */

  const loadReturns = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getSalesReturns();

      const data =
        response?.data?.data ||
        response?.data?.returns ||
        response?.data ||
        [];

      setReturns(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Load sales returns error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load sales returns."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  ============================================================
  LOAD RETURNABLE ORDERS
  ============================================================
  */

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);

      const response =
        await getReturnableOrders();

      const data =
        response?.data?.data ||
        response?.data?.orders ||
        response?.data ||
        [];

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Load returnable orders error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  };


  useEffect(() => {
    loadReturns();
    loadOrders();
  }, []);


  /*
  ============================================================
  LOAD ORDER ITEMS
  ============================================================
  */

  const handleOrderChange = async (
    event
  ) => {
    const orderId =
      event.target.value;

    setSelectedOrder(orderId);
    setItems([]);
    setReason("");
    setRemarks("");
    setError("");
    setSuccess("");

    if (!orderId) {
      return;
    }

    try {
      setLoadingItems(true);

      const response =
        await getReturnableOrderItems(
          orderId
        );

      const data =
        response?.data?.data ||
        response?.data?.items ||
        response?.data ||
        [];

      const prepared =
        Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              return_quantity: 0,
              return_reason: "",
            }))
          : [];

      setItems(prepared);
    } catch (err) {
      console.error(
        "Load return items error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load order items."
      );
    } finally {
      setLoadingItems(false);
    }
  };


  /*
  ============================================================
  UPDATE RETURN QUANTITY
  ============================================================
  */

  const updateQuantity = (
    orderItemId,
    value
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (
          Number(item.order_item_id) !==
          Number(orderItemId)
        ) {
          return item;
        }

        const available =
          Number(
            item.available_return_quantity
          ) || 0;

        let quantity =
          Number(value);

        if (!Number.isFinite(quantity)) {
          quantity = 0;
        }

        if (quantity < 0) {
          quantity = 0;
        }

        if (quantity > available) {
          quantity = available;
        }

        return {
          ...item,
          return_quantity: quantity,
        };
      })
    );
  };


  /*
  ============================================================
  UPDATE ITEM REASON
  ============================================================
  */

  const updateItemReason = (
    orderItemId,
    value
  ) => {
    setItems((current) =>
      current.map((item) =>
        Number(item.order_item_id) ===
        Number(orderItemId)
          ? {
              ...item,
              return_reason: value,
            }
          : item
      )
    );
  };


  /*
  ============================================================
  SELECTED ORDER
  ============================================================
  */

  const selectedOrderData =
    useMemo(
      () =>
        orders.find(
          (order) =>
            Number(order.id) ===
            Number(selectedOrder)
        ),
      [orders, selectedOrder]
    );


  /*
  ============================================================
  RETURN ITEMS
  ============================================================
  */

  const selectedItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            Number(
              item.return_quantity
            ) > 0
        ),
      [items]
    );


  /*
  ============================================================
  TOTAL
  ============================================================
  */

  const totalAmount =
    useMemo(() => {
      return selectedItems.reduce(
        (total, item) => {
          const quantity =
            Number(
              item.return_quantity
            ) || 0;

          const rate =
            Number(item.rate) || 0;

          return (
            total +
            quantity * rate
          );
        },
        0
      );
    }, [selectedItems]);


  /*
  ============================================================
  VALIDATE
  ============================================================
  */

  const validateForm = () => {
    if (!selectedOrder) {
      setError(
        "Please select an order."
      );

      return false;
    }

    if (selectedItems.length === 0) {
      setError(
        "Please enter return quantity for at least one item."
      );

      return false;
    }

    for (const item of selectedItems) {
      const quantity =
        Number(
          item.return_quantity
        ) || 0;

      const available =
        Number(
          item.available_return_quantity
        ) || 0;

      if (quantity <= 0) {
        setError(
          "Return quantity must be greater than zero."
        );

        return false;
      }

      if (quantity > available) {
        setError(
          `Return quantity cannot exceed available quantity for ${item.product_name || item.sku}.`
        );

        return false;
      }
    }

    return true;
  };


  /*
  ============================================================
  CREATE DRAFT
  ============================================================
  */

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        order_id:
          selectedOrderData.id,

        party_id:
          selectedOrderData.party_id,

        return_date:
          returnDate || null,

        reason:
          reason || null,

        remarks:
          remarks || null,

        status: "DRAFT",

        items:
          selectedItems.map(
            (item) => ({
              order_item_id:
                item.order_item_id,

              dispatch_item_id:
                item.dispatch_item_id ||
                null,

              quantity:
                Number(
                  item.return_quantity
                ),

              rate:
                Number(item.rate) || 0,

              reason:
                item.return_reason ||
                null,
            })
          ),
      };

      const response =
        await createSalesReturn(
          payload
        );

      setSuccess(
        response?.data?.message ||
          "Sales return saved successfully."
      );

      await loadReturns();

      resetForm();
    } catch (err) {
      console.error(
        "Create sales return error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save sales return."
      );
    } finally {
      setSaving(false);
    }
  };


  /*
  ============================================================
  RESET FORM
  ============================================================
  */

  const resetForm = () => {
    setSelectedOrder("");
    setItems([]);
    setReason("");
    setRemarks("");

    setReturnDate(
      new Date()
        .toISOString()
        .slice(0, 16)
    );
  };


  /*
  ============================================================
  FILTER RETURNS
  ============================================================
  */

  const filteredReturns =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return returns.filter(
        (item) => {
          const matchesSearch =
            !keyword ||
            String(
              item.return_no || ""
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
              .includes(keyword);

          const matchesStatus =
            !statusFilter ||
            item.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      returns,
      search,
      statusFilter,
    ]);


  /*
  ============================================================
  COMPLETE RETURN
  ============================================================
  */

  const handleComplete =
    async (id) => {
      const confirmed =
        window.confirm(
          "Complete this sales return? Stock will be increased."
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await completeSalesReturn(
            id
          );

        setSuccess(
          response?.data?.message ||
            "Sales return completed successfully."
        );

        await loadReturns();

        if (
          selectedReturn &&
          Number(
            selectedReturn.id
          ) === Number(id)
        ) {
          setSelectedReturn(null);
        }
      } catch (err) {
        console.error(
          "Complete sales return error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to complete sales return."
        );
      } finally {
        setSaving(false);
      }
    };


  /*
  ============================================================
  CANCEL RETURN
  ============================================================
  */

  const handleCancel =
    async (id) => {
      const confirmed =
        window.confirm(
          "Cancel this sales return?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await cancelSalesReturn(
            id
          );

        setSuccess(
          response?.data?.message ||
            "Sales return cancelled."
        );

        await loadReturns();

        setSelectedReturn(null);
      } catch (err) {
        console.error(
          "Cancel sales return error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to cancel sales return."
        );
      } finally {
        setSaving(false);
      }
    };


  /*
  ============================================================
  VIEW RETURN
  ============================================================
  */
const viewReturn = async (id) => {
  try {
    setError("");

    const response =
      await getSalesReturnById(id);

    setSelectedReturn(
      response?.data?.data ||
        response?.data?.return ||
        response?.data ||
        null
    );
  } catch (err) {
    console.error(
      "Get sales return details error:",
      err
    );

    setError(
      err?.response?.data?.message ||
        "Failed to load return details."
    );
  }
};

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="sales-return-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="sales-return-header">

        <div>
          <h1>Sales Return</h1>

          <p>
            Manage returned goods from dispatched
            sales orders.
          </p>
        </div>

        <div className="sales-return-total-card">
          <span>Total Returns</span>

          <strong>
            {returns.length}
          </strong>
        </div>

      </div>


      {/* ======================================================
          ALERTS
          ====================================================== */}

      {error && (
        <div className="sales-return-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="sales-return-alert success">
          {success}
        </div>
      )}


      {/* ======================================================
          CREATE RETURN
          ====================================================== */}

      <div className="sales-return-form-card">

        <div className="sales-return-card-title">
          <div>
            <h2>Create Sales Return</h2>

            <p>
              Select a dispatched order and enter
              the returned quantities.
            </p>
          </div>
        </div>


        {/* ====================================================
            BASIC INFORMATION
            ==================================================== */}

        <div className="sales-return-form-grid">

          <div className="sales-return-field">

            <label>
              Order *
            </label>

            <select
              value={selectedOrder}
              onChange={
                handleOrderChange
              }
              disabled={
                loadingOrders ||
                saving
              }
            >
              <option value="">
                {loadingOrders
                  ? "Loading orders..."
                  : "Select Order"}
              </option>

              {orders.map(
                (order) => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    {order.order_no} —{" "}
                    {order.party_name}
                  </option>
                )
              )}
            </select>

          </div>


          <div className="sales-return-field">

            <label>
              Return Date
            </label>

            <input
              type="datetime-local"
              value={returnDate}
              onChange={(event) =>
                setReturnDate(
                  event.target.value
                )
              }
              disabled={saving}
            />

          </div>


          <div className="sales-return-field full">

            <label>
              Party
            </label>

            <input
              type="text"
              value={
                selectedOrderData
                  ?.party_name || ""
              }
              readOnly
              placeholder="Party will appear here"
            />

          </div>


          <div className="sales-return-field full">

            <label>
              Reason
            </label>

            <input
              type="text"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              placeholder="Enter return reason"
              disabled={saving}
            />

          </div>


          <div className="sales-return-field full">

            <label>
              Remarks
            </label>

            <textarea
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value
                )
              }
              placeholder="Enter remarks"
              rows="3"
              disabled={saving}
            />

          </div>

        </div>


        {/* ====================================================
            ITEMS
            ==================================================== */}

        <div className="sales-return-items-section">

          <div className="sales-return-section-heading">

            <div>
              <h3>Return Items</h3>

              <span>
                Only dispatched quantities can
                be returned.
              </span>
            </div>

          </div>


          {loadingItems ? (
            <div className="sales-return-empty">
              Loading order items...
            </div>
          ) : !selectedOrder ? (
            <div className="sales-return-empty">
              Select an order to load its
              dispatched items.
            </div>
          ) : items.length === 0 ? (
            <div className="sales-return-empty">
              No items available for return.
            </div>
          ) : (
            <div className="sales-return-items-table-wrapper">

              <table className="sales-return-items-table">

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Ordered</th>
                    <th>Dispatched</th>
                    <th>Already Returned</th>
                    <th>Available</th>
                    <th>Rate</th>
                    <th>Return Qty</th>
                    <th>Amount</th>
                    <th>Reason</th>
                  </tr>
                </thead>

                <tbody>

                  {items.map(
                    (item) => {
                      const quantity =
                        Number(
                          item.return_quantity
                        ) || 0;

                      const rate =
                        Number(
                          item.rate
                        ) || 0;

                      const amount =
                        quantity *
                        rate;

                      return (
                        <tr
                          key={
                            item.order_item_id
                          }
                        >

                          <td>
                            <strong>
                              {
                                item.product_name ||
                                "-"
                              }
                            </strong>

                            {item.variant_name && (
                              <small>
                                {
                                  item.variant_name
                                }
                              </small>
                            )}
                          </td>

                          <td>
                            {item.sku || "-"}
                          </td>

                          <td>
                            {
                              item.ordered_quantity
                            }
                          </td>

                          <td>
                            {
                              item.dispatched_quantity
                            }
                          </td>

                          <td>
                            {
                              item.returned_quantity
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                item.available_return_quantity
                              }
                            </strong>
                          </td>

                          <td>
                            ₹
                            {rate.toFixed(
                              2
                            )}
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              max={
                                item.available_return_quantity
                              }
                              step="0.001"
                              value={
                                item.return_quantity
                              }
                              onChange={(
                                event
                              ) =>
                                updateQuantity(
                                  item.order_item_id,
                                  event.target.value
                                )
                              }
                              disabled={
                                saving ||
                                Number(
                                  item.available_return_quantity
                                ) <= 0
                              }
                            />
                          </td>

                          <td>
                            ₹
                            {amount.toFixed(
                              2
                            )}
                          </td>

                          <td>
                            <input
                              type="text"
                              value={
                                item.return_reason ||
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                updateItemReason(
                                  item.order_item_id,
                                  event.target.value
                                )
                              }
                              placeholder="Reason"
                              disabled={
                                saving ||
                                quantity <= 0
                              }
                            />
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


        {/* ====================================================
            TOTAL + ACTION
            ==================================================== */}

        <div className="sales-return-form-footer">

          <div className="sales-return-total">

            <span>
              Return Total
            </span>

            <strong>
              ₹
              {totalAmount.toFixed(2)}
            </strong>

          </div>

          <div className="sales-return-buttons">

            <button
              type="button"
              className="secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>

            <button
              type="button"
              className="primary"
              onClick={
                handleSaveDraft
              }
              disabled={
                saving ||
                loadingItems
              }
            >
              {saving
                ? "Saving..."
                : "Save Draft"}
            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          RETURN LIST
          ====================================================== */}

      <div className="sales-return-list-card">

        <div className="sales-return-list-header">

          <div>
            <h2>
              Sales Returns
            </h2>

            <span>
              {filteredReturns.length} record
              {filteredReturns.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="sales-return-filters">

            <input
              type="text"
              placeholder="Search return, order, party..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="DRAFT">
                DRAFT
              </option>

              <option value="COMPLETED">
                COMPLETED
              </option>

              <option value="CANCELLED">
                CANCELLED
              </option>
            </select>

          </div>

        </div>


        {loading ? (
          <div className="sales-return-empty">
            Loading sales returns...
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="sales-return-empty">
            No sales returns found.
          </div>
        ) : (
          <div className="sales-return-table-wrapper">

            <table className="sales-return-table">

              <thead>
                <tr>
                  <th>Return No.</th>
                  <th>Order No.</th>
                  <th>Party</th>
                  <th>Return Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredReturns.map(
                  (item) => (
                    <tr key={item.id}>

                      <td>
                        <strong>
                          {item.return_no}
                        </strong>
                      </td>

                      <td>
                        {item.order_no ||
                          "-"}
                      </td>

                      <td>
                        {item.party_name ||
                          "-"}
                      </td>

                      <td>
                        {item.return_date
                          ? new Date(
                              item.return_date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.total_amount ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td>

                        <span
                          className={`sales-return-status ${String(
                            item.status ||
                              ""
                          ).toLowerCase()}`}
                        >
                          {item.status}
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="sales-return-view-button"
                          onClick={() =>
                            viewReturn(
                              item.id
                            )
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* ======================================================
          DETAILS MODAL
          ====================================================== */}

      {selectedReturn && (
        <div
          className="sales-return-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedReturn(
                null
              );
            }
          }}
        >

          <div className="sales-return-modal">

            <div className="sales-return-modal-header">

              <div>
                <span>
                  Sales Return
                </span>

                <h2>
                  {
                    selectedReturn.return_no
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReturn(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="sales-return-modal-body">

              <div className="sales-return-summary-grid">

                <div>
                  <label>
                    Order
                  </label>

                  <strong>
                    {
                      selectedReturn.order_no ||
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
                      selectedReturn.party_name ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <label>
                    Return Date
                  </label>

                  <strong>
                    {
                      selectedReturn.return_date
                        ? new Date(
                            selectedReturn.return_date
                          ).toLocaleString(
                            "en-IN"
                          )
                        : "-"
                    }
                  </strong>
                </div>

                <div>
                  <label>
                    Status
                  </label>

                  <strong>
                    {
                      selectedReturn.status
                    }
                  </strong>
                </div>

                <div>
                  <label>
                    Total
                  </label>

                  <strong>
                    ₹
                    {Number(
                      selectedReturn.total_amount ||
                        0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <label>
                    Reason
                  </label>

                  <strong>
                    {
                      selectedReturn.reason ||
                      "-"
                    }
                  </strong>
                </div>

              </div>


              {Array.isArray(
                selectedReturn.items
              ) &&
                selectedReturn.items.length >
                  0 && (
                  <div className="sales-return-modal-items">

                    <h3>
                      Returned Items
                    </h3>

                    <table>

                      <thead>
                        <tr>
                          <th>
                            Product
                          </th>

                          <th>
                            SKU
                          </th>

                          <th>
                            Quantity
                          </th>

                          <th>
                            Rate
                          </th>

                          <th>
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {selectedReturn.items.map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                            >
                              <td>
                                {
                                  item.product_name ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  item.sku ||
                                  "-"
                                }
                              </td>

                              <td>
                                {
                                  item.quantity
                                }
                              </td>

                              <td>
                                ₹
                                {Number(
                                  item.rate ||
                                    0
                                ).toFixed(
                                  2
                                )}
                              </td>

                              <td>
                                ₹
                                {Number(
                                  item.amount ||
                                    0
                                ).toFixed(
                                  2
                                )}
                              </td>
                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

            </div>


            <div className="sales-return-modal-footer">

              {selectedReturn.status ===
                "DRAFT" && (
                <>
                  <button
                    type="button"
                    className="danger"
                    disabled={saving}
                    onClick={() =>
                      handleCancel(
                        selectedReturn.id
                      )
                    }
                  >
                    Cancel Return
                  </button>

                  <button
                    type="button"
                    className="complete"
                    disabled={saving}
                    onClick={() =>
                      handleComplete(
                        selectedReturn.id
                      )
                    }
                  >
                    {saving
                      ? "Processing..."
                      : "Complete Return"}
                  </button>
                </>
              )}

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setSelectedReturn(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default SalesReturn;