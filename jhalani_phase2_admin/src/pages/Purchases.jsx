import React, { useEffect, useMemo, useState } from "react";

import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  completePurchase,
  cancelPurchase,
} from "../api/purchaseApi";

import api from "../api/axios";

import "../styles/purchases.css";


/*
============================================================
HELPERS
============================================================
*/

const emptyItem = {
  variant_id: "",
  quantity: "",
  rate: "",
};

const emptyForm = {
  supplier_name: "",
  invoice_number: "",
  invoice_date: "",
  purchase_date: "",
  remarks: "",
  items: [
    {
      ...emptyItem,
    },
  ],
};


const formatNumber = (value, decimals = 2) => {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};


const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


/*
============================================================
COMPONENT
============================================================
*/

const Purchases = () => {
  /*
  ==========================================================
  PURCHASE LIST
  ==========================================================
  */

  const [purchases, setPurchases] = useState([]);

  const [loading, setLoading] = useState(false);

  /*
  ==========================================================
  VARIANTS
  ==========================================================
  */

  const [variants, setVariants] = useState([]);

  const [variantsLoading, setVariantsLoading] =
    useState(false);


  /*
  ==========================================================
  FORM
  ==========================================================
  */

  const [form, setForm] = useState({
    ...emptyForm,
    purchase_date: getToday(),
  });


  /*
  ==========================================================
  UI STATES
  ==========================================================
  */

  const [showForm, setShowForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [actionId, setActionId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /*
  ==========================================================
  SEARCH / FILTER
  ==========================================================
  */

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");


  /*
  ==========================================================
  LOAD PURCHASES
  ==========================================================
  */

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getPurchases();

      const data =
        response?.data?.data || [];

      setPurchases(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Get purchases error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load purchases"
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  ==========================================================
  LOAD VARIANTS
  ==========================================================
  */

  const loadVariants = async () => {
    try {
      setVariantsLoading(true);

      const response =
        await api.get("/stock");

      const data =
        response?.data?.data || [];

      setVariants(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Get variants error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load product variants"
      );
    } finally {
      setVariantsLoading(false);
    }
  };


  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    loadPurchases();
    loadVariants();
  }, []);


  /*
  ==========================================================
  FILTERED PURCHASES
  ==========================================================
  */

  const filteredPurchases = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return purchases.filter(
      (purchase) => {
        const matchesSearch =
          !keyword ||
          String(
            purchase.id || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            purchase.supplier_name || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            purchase.invoice_number || ""
          )
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          !statusFilter ||
          purchase.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    purchases,
    search,
    statusFilter,
  ]);


  /*
  ==========================================================
  FORM HANDLERS
  ==========================================================
  */

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


  /*
  ==========================================================
  ITEM CHANGE
  ==========================================================
  */

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setForm((previous) => {
      const items = [
        ...previous.items,
      ];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...previous,
        items,
      };
    });
  };


  /*
  ==========================================================
  ADD ITEM
  ==========================================================
  */

  const addItem = () => {
    setForm((previous) => ({
      ...previous,

      items: [
        ...previous.items,
        {
          ...emptyItem,
        },
      ],
    }));
  };


  /*
  ==========================================================
  REMOVE ITEM
  ==========================================================
  */

  const removeItem = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return previous;
      }

      return {
        ...previous,

        items: previous.items.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
      };
    });
  };


  /*
  ==========================================================
  RESET FORM
  ==========================================================
  */

  const resetForm = () => {
    setForm({
      ...emptyForm,

      purchase_date:
        getToday(),

      items: [
        {
          ...emptyItem,
        },
      ],
    });
  };


  /*
  ==========================================================
  CALCULATE ITEM AMOUNT
  ==========================================================
  */

  const getItemAmount = (item) => {
    const quantity =
      Number(item.quantity || 0);

    const rate =
      Number(item.rate || 0);

    return quantity * rate;
  };


  /*
  ==========================================================
  TOTAL
  ==========================================================
  */

  const totalAmount = useMemo(() => {
    return form.items.reduce(
      (total, item) =>
        total +
        getItemAmount(item),
      0
    );
  }, [form.items]);


  /*
  ==========================================================
  SELECTED VARIANT
  ==========================================================
  */

  const getVariant = (variantId) => {
    return variants.find(
      (variant) =>
        Number(
          variant.variant_id ??
            variant.id
        ) ===
        Number(variantId)
    );
  };


  /*
  ==========================================================
  SUBMIT PURCHASE
  ==========================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
    --------------------------------------------------------
    VALIDATION
    --------------------------------------------------------
    */

    if (
      !form.supplier_name.trim()
    ) {
      setError(
        "Supplier name is required."
      );

      return;
    }

    if (!form.items.length) {
      setError(
        "Add at least one purchase item."
      );

      return;
    }

    for (
      let index = 0;
      index < form.items.length;
      index++
    ) {
      const item =
        form.items[index];

      if (!item.variant_id) {
        setError(
          `Please select a variant for item ${index + 1}.`
        );

        return;
      }

      if (
        Number(item.quantity) <= 0
      ) {
        setError(
          `Enter a valid quantity for item ${index + 1}.`
        );

        return;
      }

      if (
        Number(item.rate) < 0 ||
        item.rate === ""
      ) {
        setError(
          `Enter a valid rate for item ${index + 1}.`
        );

        return;
      }
    }


    /*
    --------------------------------------------------------
    DUPLICATE VARIANT CHECK
    --------------------------------------------------------
    */

    const selectedVariantIds =
      form.items.map(
        (item) =>
          String(item.variant_id)
      );

    const hasDuplicate =
      new Set(
        selectedVariantIds
      ).size !==
      selectedVariantIds.length;

    if (hasDuplicate) {
      setError(
        "The same product variant cannot be added more than once."
      );

      return;
    }


    /*
    --------------------------------------------------------
    PAYLOAD
    --------------------------------------------------------
    */

    const payload = {
      supplier_name:
        form.supplier_name.trim(),

      invoice_number:
        form.invoice_number.trim() ||
        null,

      invoice_date:
        form.invoice_date ||
        null,

      purchase_date:
        form.purchase_date ||
        null,

      remarks:
        form.remarks.trim() ||
        null,

      items: form.items.map(
        (item) => ({
          variant_id:
            Number(
              item.variant_id
            ),

          quantity:
            Number(
              item.quantity
            ),

          rate:
            Number(
              item.rate
            ),
        })
      ),
    };


    try {
      setSubmitting(true);

      const response =
        await createPurchase(
          payload
        );

      if (
        response?.data?.success
      ) {
        setSuccess(
          "Purchase created successfully."
        );

        resetForm();

        setShowForm(false);

        await loadPurchases();
      } else {
        throw new Error(
          response?.data?.message ||
            "Failed to create purchase"
        );
      }
    } catch (err) {
      console.error(
        "Create purchase error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create purchase"
      );
    } finally {
      setSubmitting(false);
    }
  };


  /*
  ==========================================================
  VIEW PURCHASE
  ==========================================================
  */

  const handleView = async (id) => {
    try {
      setError("");

      const response =
        await getPurchaseById(id);

      const data =
        response?.data?.data;

      if (!data) {
        throw new Error(
          "Purchase details not found"
        );
      }

      setSelectedPurchase(data);

      setShowDetails(true);
    } catch (err) {
      console.error(
        "Get purchase details error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load purchase details"
      );
    }
  };


  /*
  ==========================================================
  COMPLETE
  ==========================================================
  */

  const handleComplete = async (
    purchase
  ) => {
    const confirmed =
      window.confirm(
        `Complete Purchase #${purchase.id}?\n\nThis will increase stock and create PURCHASE stock transactions.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(purchase.id);

      setError("");
      setSuccess("");

      const response =
        await completePurchase(
          purchase.id
        );

      if (
        response?.data?.success
      ) {
        setSuccess(
          `Purchase #${purchase.id} completed and stock updated successfully.`
        );

        await loadPurchases();

        if (
          selectedPurchase?.id ===
          purchase.id
        ) {
          await handleView(
            purchase.id
          );
        }
      } else {
        throw new Error(
          response?.data?.message ||
            "Failed to complete purchase"
        );
      }
    } catch (err) {
      console.error(
        "Complete purchase error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to complete purchase"
      );
    } finally {
      setActionId(null);
    }
  };


  /*
  ==========================================================
  CANCEL
  ==========================================================
  */

  const handleCancel = async (
    purchase
  ) => {
    const confirmed =
      window.confirm(
        `Cancel Purchase #${purchase.id}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(purchase.id);

      setError("");
      setSuccess("");

      const response =
        await cancelPurchase(
          purchase.id
        );

      if (
        response?.data?.success
      ) {
        setSuccess(
          `Purchase #${purchase.id} cancelled successfully.`
        );

        await loadPurchases();

        if (
          selectedPurchase?.id ===
          purchase.id
        ) {
          await handleView(
            purchase.id
          );
        }
      } else {
        throw new Error(
          response?.data?.message ||
            "Failed to cancel purchase"
        );
      }
    } catch (err) {
      console.error(
        "Cancel purchase error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to cancel purchase"
      );
    } finally {
      setActionId(null);
    }
  };


  /*
  ==========================================================
  STATUS CLASS
  ==========================================================
  */

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "COMPLETED":
        return "purchase-status completed";

      case "CANCELLED":
        return "purchase-status cancelled";

      default:
        return "purchase-status draft";
    }
  };


  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="purchases-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="purchases-header">

        <div>
          <h1>Purchase Management</h1>

          <p>
            Manage supplier purchases and
            inventory receiving.
          </p>
        </div>

        <button
          type="button"
          className="purchase-add-btn"
          onClick={() => {
            setError("");
            setSuccess("");

            resetForm();

            setShowForm(true);
          }}
        >
          + Add Purchase
        </button>

      </div>


      {/* ==================================================
          ALERTS
      ================================================== */}

      {error && (
        <div className="purchase-alert purchase-alert-error">
          {error}

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}


      {success && (
        <div className="purchase-alert purchase-alert-success">
          {success}

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>
        </div>
      )}


      {/* ==================================================
          LIST CARD
      ================================================== */}

      <div className="purchase-list-card">

        <div className="purchase-toolbar">

          <div className="purchase-search">

            <input
              type="text"
              placeholder="Search supplier, invoice or purchase ID..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <div className="purchase-filter">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
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

          </div>


          <button
            type="button"
            className="purchase-refresh-btn"
            onClick={loadPurchases}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>


        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="purchase-table-wrapper">

          <table className="purchase-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Invoice</th>
                <th>Invoice Date</th>
                <th>Purchase Date</th>
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
                    className="purchase-empty"
                  >
                    Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="purchase-empty"
                  >
                    No purchases found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(
                  (purchase) => (
                    <tr
                      key={
                        purchase.id
                      }
                    >

                      <td>
                        <strong>
                          #{purchase.id}
                        </strong>
                      </td>

                      <td>
                        {purchase.supplier_name ||
                          "-"}
                      </td>

                      <td>
                        {purchase.invoice_number ||
                          "-"}
                      </td>

                      <td>
                        {formatDate(
                          purchase.invoice_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          purchase.purchase_date
                        )}
                      </td>

                      <td>
                        ₹
                        {formatNumber(
                          purchase.total_amount
                        )}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            purchase.status
                          )}
                        >
                          {
                            purchase.status
                          }
                        </span>
                      </td>

                      <td>

                        <div className="purchase-actions">

                          <button
                            type="button"
                            className="purchase-view-btn"
                            onClick={() =>
                              handleView(
                                purchase.id
                              )
                            }
                          >
                            View
                          </button>


                          {purchase.status ===
                            "DRAFT" && (
                            <>
                              <button
                                type="button"
                                className="purchase-complete-btn"
                                disabled={
                                  actionId ===
                                  purchase.id
                                }
                                onClick={() =>
                                  handleComplete(
                                    purchase
                                  )
                                }
                              >
                                {actionId ===
                                purchase.id
                                  ? "..."
                                  : "Complete"}
                              </button>

                              <button
                                type="button"
                                className="purchase-cancel-btn"
                                disabled={
                                  actionId ===
                                  purchase.id
                                }
                                onClick={() =>
                                  handleCancel(
                                    purchase
                                  )
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==================================================
          CREATE PURCHASE MODAL
      ================================================== */}

      {showForm && (
        <div className="purchase-modal-overlay">

          <div className="purchase-modal">

            <div className="purchase-modal-header">

              <div>
                <h2>
                  Create Purchase
                </h2>

                <p>
                  Purchase will remain
                  <strong> DRAFT </strong>
                  until completed.
                </p>
              </div>

              <button
                type="button"
                className="purchase-close-btn"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="purchase-form"
            >

              {/* ==================================================
                  BASIC DETAILS
              ================================================== */}

              <div className="purchase-form-grid">

                <div className="purchase-form-group">

                  <label>
                    Supplier Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="supplier_name"
                    value={
                      form.supplier_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter supplier name"
                  />

                </div>


                <div className="purchase-form-group">

                  <label>
                    Invoice Number
                  </label>

                  <input
                    type="text"
                    name="invoice_number"
                    value={
                      form.invoice_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter invoice number"
                  />

                </div>


                <div className="purchase-form-group">

                  <label>
                    Invoice Date
                  </label>

                  <input
                    type="date"
                    name="invoice_date"
                    value={
                      form.invoice_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="purchase-form-group">

                  <label>
                    Purchase Date
                  </label>

                  <input
                    type="date"
                    name="purchase_date"
                    value={
                      form.purchase_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* ==================================================
                  ITEMS
              ================================================== */}

              <div className="purchase-items-section">

                <div className="purchase-items-header">

                  <div>
                    <h3>
                      Purchase Items
                    </h3>

                    <p>
                      Select product variants
                      and enter quantity and
                      purchase rate.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="purchase-add-item-btn"
                    onClick={
                      addItem
                    }
                  >
                    + Add Item
                  </button>

                </div>


                <div className="purchase-items-table-wrapper">

                  <table className="purchase-items-table">

                    <thead>
                      <tr>
                        <th>
                          Product Variant
                        </th>

                        <th>
                          Current Stock
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

                        <th></th>
                      </tr>
                    </thead>


                    <tbody>

                      {form.items.map(
                        (
                          item,
                          index
                        ) => {
                          const variant =
                            getVariant(
                              item.variant_id
                            );

                          const unit =
                            variant?.unit_symbol ||
                            "";

                          return (
                            <tr
                              key={
                                index
                              }
                            >

                              <td>

                                <select
                                  value={
                                    item.variant_id
                                  }
                                  disabled={
                                    variantsLoading
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleItemChange(
                                      index,
                                      "variant_id",
                                      event.target
                                        .value
                                    )
                                  }
                                >

                                  <option value="">
                                    {variantsLoading
                                      ? "Loading variants..."
                                      : "Select Variant"}
                                  </option>

                                  {variants.map(
                                    (
                                      variantItem
                                    ) => {

                                      const id =
                                        variantItem.variant_id ??
                                        variantItem.id;

                                      const productName =
                                        variantItem.product_name ||
                                        "Product";

                                      const variantName =
                                        variantItem.variant_name ||
                                        "";

                                      const sku =
                                        variantItem.sku ||
                                        "";

                                      return (
                                        <option
                                          key={
                                            id
                                          }
                                          value={
                                            id
                                          }
                                        >
                                          {productName}
                                          {variantName
                                            ? ` - ${variantName}`
                                            : ""}
                                          {sku
                                            ? ` (${sku})`
                                            : ""}
                                        </option>
                                      );
                                    }
                                  )}

                                </select>

                                {variant && (
                                  <small className="purchase-variant-meta">
                                    {variant.product_name ||
                                      ""}
                                    {variant.variant_name
                                      ? ` • ${variant.variant_name}`
                                      : ""}
                                    {unit
                                      ? ` • ${unit}`
                                      : ""}
                                  </small>
                                )}

                              </td>


                              <td>

                                <span className="purchase-current-stock">

                                  {formatNumber(
                                    variant?.current_stock,
                                    3
                                  )}

                                </span>

                              </td>


                              <td>

                                <div className="purchase-quantity-wrapper">

                                  <input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={
                                      item.quantity
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleItemChange(
                                        index,
                                        "quantity",
                                        event.target
                                          .value
                                      )
                                    }
                                    placeholder="0.000"
                                  />

                                  {unit && (
                                    <span>
                                      {unit}
                                    </span>
                                  )}

                                </div>

                              </td>


                              <td>

                                <div className="purchase-rate-wrapper">

                                  <span>
                                    ₹
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      item.rate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleItemChange(
                                        index,
                                        "rate",
                                        event.target
                                          .value
                                      )
                                    }
                                    placeholder="0.00"
                                  />

                                </div>

                              </td>


                              <td>

                                <strong>
                                  ₹
                                  {formatNumber(
                                    getItemAmount(
                                      item
                                    )
                                  )}
                                </strong>

                              </td>


                              <td>

                                <button
                                  type="button"
                                  className="purchase-remove-item-btn"
                                  disabled={
                                    form.items
                                      .length ===
                                    1
                                  }
                                  onClick={() =>
                                    removeItem(
                                      index
                                    )
                                  }
                                  title="Remove item"
                                >
                                  ×
                                </button>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* ==================================================
                  REMARKS
              ================================================== */}

              <div className="purchase-form-group purchase-full-width">

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
                  placeholder="Enter remarks..."
                  rows="3"
                />

              </div>


              {/* ==================================================
                  TOTAL
              ================================================== */}

              <div className="purchase-total-box">

                <span>
                  Total Purchase Amount
                </span>

                <strong>
                  ₹
                  {formatNumber(
                    totalAmount
                  )}
                </strong>

              </div>


              {/* ==================================================
                  FORM ACTIONS
              ================================================== */}

              <div className="purchase-form-actions">

                <button
                  type="button"
                  className="purchase-form-cancel"
                  onClick={() =>
                    setShowForm(false)
                  }
                  disabled={
                    submitting
                  }
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="purchase-form-submit"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Saving..."
                    : "Save Purchase"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {showDetails &&
        selectedPurchase && (
          <div className="purchase-modal-overlay">

            <div className="purchase-details-modal">

              <div className="purchase-modal-header">

                <div>
                  <h2>
                    Purchase #
                    {
                      selectedPurchase.id
                    }
                  </h2>

                  <p>
                    {
                      selectedPurchase
                        .supplier_name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="purchase-close-btn"
                  onClick={() =>
                    setShowDetails(false)
                  }
                >
                  ×
                </button>

              </div>


              <div className="purchase-details-content">

                {/* ==================================================
                    SUMMARY
                ================================================== */}

                <div className="purchase-details-summary">

                  <div>
                    <span>
                      Supplier
                    </span>

                    <strong>
                      {
                        selectedPurchase
                          .supplier_name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Invoice
                    </span>

                    <strong>
                      {
                        selectedPurchase
                          .invoice_number ||
                          "-"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Invoice Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedPurchase
                          .invoice_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Purchase Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedPurchase
                          .purchase_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      <span
                        className={getStatusClass(
                          selectedPurchase
                            .status
                        )}
                      >
                        {
                          selectedPurchase
                            .status
                        }
                      </span>
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total
                    </span>

                    <strong>
                      ₹
                      {formatNumber(
                        selectedPurchase
                          .total_amount
                      )}
                    </strong>
                  </div>

                </div>


                {/* ==================================================
                    ITEMS
                ================================================== */}

                <div className="purchase-details-items">

                  <h3>
                    Purchase Items
                  </h3>

                  <div className="purchase-table-wrapper">

                    <table className="purchase-table">

                      <thead>
                        <tr>
                          <th>
                            Product
                          </th>

                          <th>
                            SKU
                          </th>

                          <th>
                            Variant
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

                        {(
                          selectedPurchase
                            .items || []
                        ).length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="purchase-empty"
                            >
                              No items found.
                            </td>
                          </tr>
                        ) : (
                          selectedPurchase.items.map(
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
                                    item.variant_name ||
                                      "-"
                                  }
                                </td>

                                <td>
                                  {formatNumber(
                                    item.quantity,
                                    3
                                  )}
                                  {" "}
                                  {
                                    item.unit_symbol ||
                                      ""
                                  }
                                </td>

                                <td>
                                  ₹
                                  {formatNumber(
                                    item.rate
                                  )}
                                </td>

                                <td>
                                  ₹
                                  {formatNumber(
                                    item.amount
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


                {/* ==================================================
                    REMARKS
                ================================================== */}

                {selectedPurchase.remarks && (
                  <div className="purchase-details-remarks">

                    <span>
                      Remarks
                    </span>

                    <p>
                      {
                        selectedPurchase
                          .remarks
                      }
                    </p>

                  </div>
                )}


                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="purchase-details-actions">

                  {selectedPurchase.status ===
                    "DRAFT" && (
                    <>
                      <button
                        type="button"
                        className="purchase-cancel-btn"
                        disabled={
                          actionId ===
                          selectedPurchase.id
                        }
                        onClick={() =>
                          handleCancel(
                            selectedPurchase
                          )
                        }
                      >
                        Cancel Purchase
                      </button>

                      <button
                        type="button"
                        className="purchase-complete-btn"
                        disabled={
                          actionId ===
                          selectedPurchase.id
                        }
                        onClick={() =>
                          handleComplete(
                            selectedPurchase
                          )
                        }
                      >
                        {actionId ===
                        selectedPurchase.id
                          ? "Processing..."
                          : "Complete Purchase"}
                      </button>
                    </>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

export default Purchases;