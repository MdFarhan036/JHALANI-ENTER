import React, { useEffect, useMemo, useState } from "react";

import {
  getPurchaseReturns,
  getPurchasesForReturn,
  getPurchaseItemsForReturn,
  createPurchaseReturn,
  completePurchaseReturn,
} from "../api/purchaseReturnApi";

import "../styles/purchaseReturns.css";

const PurchaseReturns = () => {
  const [returns, setReturns] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  const [selectedItems, setSelectedItems] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [itemsLoading, setItemsLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [form, setForm] = useState({
    return_date: new Date()
      .toISOString()
      .slice(0, 16),
    remarks: "",
  });


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
        await getPurchaseReturns();

      setReturns(
        response.data?.data || []
      );
    } catch (err) {
      console.error(
        "Get purchase returns error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load purchase returns"
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  ============================================================
  LOAD COMPLETED PURCHASES
  ============================================================
  */

  const loadPurchases = async () => {
    try {
      const response =
        await getPurchasesForReturn();

      setPurchases(
        response.data?.data || []
      );
    } catch (err) {
      console.error(
        "Get purchases error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load purchases"
      );
    }
  };


  useEffect(() => {
    loadReturns();
  }, []);


  /*
  ============================================================
  OPEN RETURN MODAL
  ============================================================
  */

  const openModal = async () => {
    setMessage("");
    setError("");

    setSelectedPurchase(null);
    setPurchaseItems([]);
    setSelectedItems([]);

    setForm({
      return_date: new Date()
        .toISOString()
        .slice(0, 16),
      remarks: "",
    });

    await loadPurchases();

    setShowModal(true);
  };


  /*
  ============================================================
  CLOSE MODAL
  ============================================================
  */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedPurchase(null);
    setPurchaseItems([]);
    setSelectedItems([]);
  };


  /*
  ============================================================
  PURCHASE SELECT
  ============================================================
  */

  const handlePurchaseChange = async (
    event
  ) => {
    const purchaseId =
      event.target.value;

    setSelectedItems([]);
    setPurchaseItems([]);
    setSelectedPurchase(null);

    if (!purchaseId) return;

    const purchase =
      purchases.find(
        (item) =>
          String(item.id) ===
          String(purchaseId)
      );

    setSelectedPurchase(purchase);

    try {
      setItemsLoading(true);
      setError("");

      const response =
        await getPurchaseItemsForReturn(
          purchaseId
        );

      setPurchaseItems(
        response.data?.data || []
      );
    } catch (err) {
      console.error(
        "Get purchase items error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load purchase items"
      );
    } finally {
      setItemsLoading(false);
    }
  };


  /*
  ============================================================
  SELECT ITEM
  ============================================================
  */

  const toggleItem = (item) => {
    setSelectedItems((current) => {
      const exists =
        current.find(
          (x) =>
            x.purchase_item_id ===
            item.purchase_item_id
        );

      if (exists) {
        return current.filter(
          (x) =>
            x.purchase_item_id !==
            item.purchase_item_id
        );
      }

      return [
        ...current,
        {
          purchase_item_id:
            item.purchase_item_id,
          variant_id:
            item.variant_id,
          quantity:
            Number(item.returnable_quantity),
          rate:
            Number(item.rate),
        },
      ];
    });
  };


  /*
  ============================================================
  QUANTITY
  ============================================================
  */

  const updateQuantity = (
    purchaseItemId,
    value
  ) => {
    const quantity =
      Number(value);

    const sourceItem =
      purchaseItems.find(
        (item) =>
          item.purchase_item_id ===
          purchaseItemId
      );

    if (!sourceItem) return;

    const maxQuantity =
      Number(
        sourceItem.returnable_quantity
      );

    const safeQuantity =
      Math.max(
        0,
        Math.min(
          quantity || 0,
          maxQuantity
        )
      );

    setSelectedItems(
      (current) =>
        current.map((item) =>
          item.purchase_item_id ===
          purchaseItemId
            ? {
                ...item,
                quantity:
                  safeQuantity,
              }
            : item
        )
    );
  };


  /*
  ============================================================
  TOTAL
  ============================================================
  */

  const totalAmount = useMemo(() => {
    return selectedItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0) *
          Number(item.rate || 0),
      0
    );
  }, [selectedItems]);


  /*
  ============================================================
  CREATE RETURN
  ============================================================
  */

  const handleCreate = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!selectedPurchase) {
      setError(
        "Please select a purchase"
      );
      return;
    }

    if (!selectedItems.length) {
      setError(
        "Please select at least one item"
      );
      return;
    }

    const invalid =
      selectedItems.some(
        (item) =>
          Number(item.quantity) <= 0
      );

    if (invalid) {
      setError(
        "Return quantity must be greater than zero"
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await createPurchaseReturn({
          purchase_id:
            selectedPurchase.id,

          return_date:
            form.return_date,

          remarks:
            form.remarks,

          items:
            selectedItems.map(
              (item) => ({
                purchase_item_id:
                  item.purchase_item_id,

                variant_id:
                  item.variant_id,

                quantity:
                  Number(item.quantity),

                rate:
                  Number(item.rate),
              })
            ),
        });

      setMessage(
        response.data?.message ||
          "Purchase return created successfully"
      );

      setShowModal(false);

      await loadReturns();

    } catch (err) {
      console.error(
        "Create purchase return error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create purchase return"
      );
    } finally {
      setSaving(false);
    }
  };


  /*
  ============================================================
  COMPLETE RETURN
  ============================================================
  */

  const handleComplete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Complete this purchase return? Stock will be reduced."
      );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await completePurchaseReturn(id);

      setMessage(
        "Purchase return completed and stock updated successfully"
      );

      await loadReturns();

    } catch (err) {
      console.error(
        "Complete purchase return error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to complete purchase return"
      );
    }
  };


  /*
  ============================================================
  FILTER
  ============================================================
  */

  const filteredReturns =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return returns.filter(
        (item) => {
          const matchesSearch =
            !term ||
            String(item.id)
              .toLowerCase()
              .includes(term) ||
            String(
              item.supplier_name || ""
            )
              .toLowerCase()
              .includes(term) ||
            String(
              item.invoice_number || ""
            )
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            statusFilter === "ALL" ||
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
  FORMAT
  ============================================================
  */

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;


  const formatDate = (value) => {
    if (!value) return "-";

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      "en-IN"
    );
  };


  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="purchase-returns-page">

      <div className="purchase-returns-header">
        <div>
          <h1>Purchase Returns</h1>
          <p>
            Manage returned items from completed purchases.
          </p>
        </div>

        <button
          className="purchase-return-add-btn"
          onClick={openModal}
        >
          + New Purchase Return
        </button>
      </div>


      {error && (
        <div className="purchase-return-alert error">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}


      {message && (
        <div className="purchase-return-alert success">
          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}


      <div className="purchase-return-card">

        <div className="purchase-return-toolbar">

          <input
            type="text"
            placeholder="Search supplier, invoice or return ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="ALL">
              All Status
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

          <button
            className="purchase-return-refresh"
            onClick={loadReturns}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>


        <div className="purchase-return-table-wrapper">

          <table className="purchase-return-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Purchase</th>
                <th>Supplier</th>
                <th>Invoice</th>
                <th>Return Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="purchase-return-empty"
                  >
                    Loading purchase returns...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="purchase-return-empty"
                  >
                    No purchase returns found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(
                  (item) => (
                    <tr key={item.id}>

                      <td>
                        #{item.id}
                      </td>

                      <td>
                        #{item.purchase_id}
                      </td>

                      <td>
                        {item.supplier_name}
                      </td>

                      <td>
                        {item.invoice_number ||
                          "-"}
                      </td>

                      <td>
                        {formatDate(
                          item.return_date
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            item.total_amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`purchase-return-status ${String(
                            item.status
                          ).toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>

                        {item.status ===
                          "DRAFT" && (
                          <button
                            className="purchase-return-complete-btn"
                            onClick={() =>
                              handleComplete(
                                item.id
                              )
                            }
                          >
                            Complete
                          </button>
                        )}

                        {item.status ===
                          "COMPLETED" && (
                          <span className="purchase-return-done">
                            Completed
                          </span>
                        )}

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          CREATE RETURN MODAL
      ===================================================== */}

      {showModal && (
        <div className="purchase-return-modal-overlay">

          <div className="purchase-return-modal">

            <div className="purchase-return-modal-header">

              <div>
                <h2>
                  New Purchase Return
                </h2>

                <p>
                  Select a completed purchase and return items.
                </p>
              </div>

              <button
                className="purchase-return-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleCreate}
              className="purchase-return-form"
            >

              <div className="purchase-return-form-grid">

                <div className="purchase-return-field">

                  <label>
                    Purchase
                    <span>*</span>
                  </label>

                  <select
                    value={
                      selectedPurchase?.id ||
                      ""
                    }
                    onChange={
                      handlePurchaseChange
                    }
                    required
                  >

                    <option value="">
                      Select completed purchase
                    </option>

                    {purchases.map(
                      (purchase) => (
                        <option
                          key={purchase.id}
                          value={purchase.id}
                        >
                          #{purchase.id} —{" "}
                          {purchase.supplier_name}
                          {purchase.invoice_number
                            ? ` — ${purchase.invoice_number}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="purchase-return-field">

                  <label>
                    Return Date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.return_date
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        return_date:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>


              {selectedPurchase && (
                <div className="purchase-return-purchase-info">

                  <div>
                    <span>
                      Supplier
                    </span>

                    <strong>
                      {
                        selectedPurchase.supplier_name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Invoice
                    </span>

                    <strong>
                      {
                        selectedPurchase.invoice_number ||
                        "-"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Purchase Total
                    </span>

                    <strong>
                      {formatMoney(
                        selectedPurchase.total_amount
                      )}
                    </strong>
                  </div>

                </div>
              )}


              <div className="purchase-return-items-section">

                <div className="purchase-return-items-header">

                  <div>
                    <h3>
                      Return Items
                    </h3>

                    <p>
                      Only quantities that have not already been returned can be selected.
                    </p>
                  </div>

                </div>


                {itemsLoading ? (
                  <div className="purchase-return-loading">
                    Loading purchase items...
                  </div>
                ) : purchaseItems.length ===
                  0 ? (
                  <div className="purchase-return-loading">
                    Select a purchase to load items.
                  </div>
                ) : (

                  <div className="purchase-return-items-table-wrapper">

                    <table className="purchase-return-items-table">

                      <thead>
                        <tr>
                          <th></th>
                          <th>SKU</th>
                          <th>Variant</th>
                          <th>Purchased</th>
                          <th>Returned</th>
                          <th>Returnable</th>
                          <th>Return Qty</th>
                          <th>Rate</th>
                        </tr>
                      </thead>

                      <tbody>

                        {purchaseItems.map(
                          (item) => {

                            const selected =
                              selectedItems.find(
                                (x) =>
                                  x.purchase_item_id ===
                                  item.purchase_item_id
                              );

                            const disabled =
                              Number(
                                item.returnable_quantity
                              ) <= 0;

                            return (
                              <tr
                                key={
                                  item.purchase_item_id
                                }
                              >

                                <td>
                                  <input
                                    type="checkbox"
                                    checked={
                                      Boolean(
                                        selected
                                      )
                                    }
                                    disabled={
                                      disabled
                                    }
                                    onChange={() =>
                                      toggleItem(
                                        item
                                      )
                                    }
                                  />
                                </td>

                                <td>
                                  {item.sku}
                                </td>

                                <td>
                                  <strong>
                                    {
                                      item.variant_name ||
                                      "-"
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    item.purchased_quantity
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
                                      item.returnable_quantity
                                    }
                                  </strong>
                                </td>

                                <td>

                                  <input
                                    type="number"
                                    min="0"
                                    max={
                                      item.returnable_quantity
                                    }
                                    step="0.001"
                                    value={
                                      selected
                                        ? selected.quantity
                                        : 0
                                    }
                                    disabled={
                                      !selected
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateQuantity(
                                        item.purchase_item_id,
                                        e.target.value
                                      )
                                    }
                                  />

                                </td>

                                <td>
                                  {formatMoney(
                                    item.rate
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


              <div className="purchase-return-field purchase-return-remarks">

                <label>
                  Remarks
                </label>

                <textarea
                  rows="3"
                  value={
                    form.remarks
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      remarks:
                        e.target.value,
                    })
                  }
                  placeholder="Enter return remarks..."
                />

              </div>


              <div className="purchase-return-total">

                <span>
                  Return Total
                </span>

                <strong>
                  {formatMoney(
                    totalAmount
                  )}
                </strong>

              </div>


              <div className="purchase-return-form-actions">

                <button
                  type="button"
                  className="purchase-return-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="purchase-return-submit"
                  disabled={
                    saving ||
                    !selectedPurchase ||
                    selectedItems.length === 0
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Create Return"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default PurchaseReturns;