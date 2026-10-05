import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getStockTransactions,
  createStockTransaction,
} from "../../api/stockTransactionApi";

import { getVariants } from "../../api/productVariantApi";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import "../../styles/StockTransactions.css";


/*
============================================================
TRANSACTION TYPES
============================================================
*/

const TRANSACTION_TYPES = [
  "OPENING",
  "PURCHASE",
  "PURCHASE_RETURN",
  "SALE",
  "SALE_RETURN",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "DAMAGE",
  "EXPIRY",
];


/*
============================================================
STOCK IN / OUT TYPES
============================================================
*/

const IN_TYPES = new Set([
  "OPENING",
  "PURCHASE",
  "SALE_RETURN",
  "ADJUSTMENT_IN",
  "TRANSFER_IN",
]);

const OUT_TYPES = new Set([
  "PURCHASE_RETURN",
  "SALE",
  "ADJUSTMENT_OUT",
  "TRANSFER_OUT",
  "DAMAGE",
  "EXPIRY",
]);


/*
============================================================
FORMATTERS
============================================================
*/

const formatNumber = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};


const formatRate = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


/*
============================================================
RESPONSE HELPERS
============================================================
*/

const getResponseData = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.transactions)) {
    return data.transactions;
  }

  return [];
};


const getTransaction = (item = {}) => ({
  ...item,

  product_name:
    item.product_name ||
    item.productName ||
    "-",

  sku:
    item.sku ||
    "-",

  variant_name:
    item.variant_name ||
    item.variantName ||
    "-",

  unit_name:
    item.unit_name ||
    item.unitName ||
    "",

  unit_symbol:
    item.unit_symbol ||
    item.unitSymbol ||
    "",

  transaction_type:
    item.transaction_type ||
    item.transactionType ||
    "-",

  quantity:
    item.quantity ?? 0,

  rate:
    item.rate ?? 0,

  reference_type:
    item.reference_type ||
    item.referenceType ||
    "",

  reference_id:
    item.reference_id ??
    item.referenceId ??
    "",

  transaction_date:
    item.transaction_date ||
    item.transactionDate ||
    item.created_at ||
    "",

  remarks:
    item.remarks ||
    "",
});


const getTypeLabel = (type) => {
  if (!type) return "-";

  return String(type)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};


/*
============================================================
COMPONENT
============================================================
*/

export default function StockTransactions() {
  /*
  ==========================================================
  TRANSACTIONS
  ==========================================================
  */

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [movementFilter, setMovementFilter] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");


  /*
  ==========================================================
  VIEW MODAL
  ==========================================================
  */

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);


  /*
  ==========================================================
  ADD TRANSACTION
  ==========================================================
  */

  const [variants, setVariants] =
    useState([]);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [selectedVariant, setSelectedVariant] =
    useState(null);


  const [transactionForm, setTransactionForm] =
    useState({
      variant_id: "",
      transaction_type: "OPENING",
      quantity: "",
      rate: "",
      reference_type: "",
      reference_id: "",
      transaction_date: "",
      remarks: "",
    });


  /*
  ==========================================================
  LOAD TRANSACTIONS
  ==========================================================
  */

  const loadTransactions = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {};

      if (typeFilter) {
        params.transaction_type =
          typeFilter;
      }

      if (dateFrom) {
        params.date_from = dateFrom;
      }

      if (dateTo) {
        params.date_to = dateTo;
      }

      const response =
        await getStockTransactions(params);

      const rows =
        getResponseData(response).map(
          getTransaction
        );

      setTransactions(rows);
    } catch (err) {
      console.error(
        "Get stock transactions error:",
        err
      );

      setTransactions([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load stock transactions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadTransactions();
  }, [
    typeFilter,
    dateFrom,
    dateTo,
  ]);


  /*
  ==========================================================
  FILTER TRANSACTIONS
  ==========================================================
  */

  const filteredTransactions =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      return transactions.filter(
        (transaction) => {
          /*
          ------------------------------
          MOVEMENT
          ------------------------------
          */

          if (
            movementFilter === "IN" &&
            !IN_TYPES.has(
              transaction.transaction_type
            )
          ) {
            return false;
          }

          if (
            movementFilter === "OUT" &&
            !OUT_TYPES.has(
              transaction.transaction_type
            )
          ) {
            return false;
          }


          /*
          ------------------------------
          SEARCH
          ------------------------------
          */

          if (!value) {
            return true;
          }

          const searchableText = [
            transaction.product_name,
            transaction.sku,
            transaction.variant_name,
            transaction.unit_name,
            transaction.unit_symbol,
            transaction.transaction_type,
            transaction.reference_type,
            transaction.reference_id,
            transaction.remarks,
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            value
          );
        }
      );
    }, [
      transactions,
      search,
      movementFilter,
    ]);


  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    filteredTransactions.forEach(
      (transaction) => {
        const quantity = Number(
          transaction.quantity || 0
        );

        if (
          IN_TYPES.has(
            transaction.transaction_type
          )
        ) {
          totalIn += quantity;
        }

        if (
          OUT_TYPES.has(
            transaction.transaction_type
          )
        ) {
          totalOut += quantity;
        }
      }
    );

    return {
      totalTransactions:
        filteredTransactions.length,

      totalIn,

      totalOut,

      net:
        totalIn - totalOut,
    };
  }, [filteredTransactions]);


  /*
  ==========================================================
  CLEAR FILTERS
  ==========================================================
  */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setMovementFilter("");
    setDateFrom("");
    setDateTo("");
  };


  /*
  ==========================================================
  MOVEMENT
  ==========================================================
  */

  const getMovement = (type) => {
    if (IN_TYPES.has(type)) {
      return "IN";
    }

    if (OUT_TYPES.has(type)) {
      return "OUT";
    }

    return "—";
  };


  /*
  ==========================================================
  LOAD VARIANTS
  ==========================================================
  */

  const loadVariants = async () => {
    try {
      const response =
        await getVariants();

      const rows =
        getResponseData(response);

      setVariants(rows);
    } catch (err) {
      console.error(
        "Get variants for stock transaction error:",
        err
      );

      setVariants([]);

      setFormError(
        err?.response?.data?.message ||
          "Unable to load product variants."
      );
    }
  };


  /*
  ==========================================================
  RESET FORM
  ==========================================================
  */

  const resetTransactionForm = () => {
    setTransactionForm({
      variant_id: "",
      transaction_type: "OPENING",
      quantity: "",
      rate: "",
      reference_type: "",
      reference_id: "",
      transaction_date: "",
      remarks: "",
    });

    setSelectedVariant(null);
    setFormError("");
  };


  /*
  ==========================================================
  OPEN ADD MODAL
  ==========================================================
  */

  const openAddTransaction = async () => {
    resetTransactionForm();

    setShowAddModal(true);

    if (variants.length === 0) {
      await loadVariants();
    }
  };


  /*
  ==========================================================
  CLOSE ADD MODAL
  ==========================================================
  */

  const closeAddTransaction = () => {
    if (saving) return;

    setShowAddModal(false);

    resetTransactionForm();
  };


  /*
  ==========================================================
  FORM CHANGE
  ==========================================================
  */

  const handleTransactionFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setTransactionForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    if (name === "variant_id") {
      const variant =
        variants.find(
          (item) =>
            String(item.id) ===
            String(value)
        );

      setSelectedVariant(
        variant || null
      );
    }

    if (formError) {
      setFormError("");
    }
  };


  /*
  ==========================================================
  CREATE TRANSACTION
  ==========================================================
  */

  const handleCreateTransaction = async (
    event
  ) => {
    event.preventDefault();

    setFormError("");

    if (!transactionForm.variant_id) {
      setFormError(
        "Variant is required."
      );
      return;
    }

    if (
      !transactionForm.transaction_type
    ) {
      setFormError(
        "Transaction type is required."
      );
      return;
    }

    const quantity = Number(
      transactionForm.quantity
    );

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setFormError(
        "Quantity must be greater than 0."
      );
      return;
    }

    const rate = Number(
      transactionForm.rate || 0
    );

    if (
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      setFormError(
        "Rate cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        variant_id: Number(
          transactionForm.variant_id
        ),

        transaction_type:
          transactionForm.transaction_type,

        quantity,

        rate,

        reference_type:
          transactionForm.reference_type.trim() ||
          null,

        reference_id:
          transactionForm.reference_id.trim()
            ? Number(
                transactionForm.reference_id
              )
            : null,

        transaction_date:
          transactionForm.transaction_date ||
          null,

        remarks:
          transactionForm.remarks.trim() ||
          null,
      };

      await createStockTransaction(
        payload
      );

      setShowAddModal(false);

      resetTransactionForm();

      await loadTransactions(true);
    } catch (err) {
      console.error(
        "Create stock transaction error:",
        err
      );

      setFormError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create stock transaction."
      );
    } finally {
      setSaving(false);
    }
  };


  /*
  ==========================================================
  TABLE COLUMNS
  ==========================================================
  */

  const columns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        width: "70px",

        render: (value) => (
          <span className="st-id">
            #{value}
          </span>
        ),
      },

      {
        key: "transaction_date",
        label: "Date",
        width: "160px",

        render: (value) => (
          <span className="st-date">
            {formatDate(value)}
          </span>
        ),
      },

      {
        key: "product_name",
        label: "Product",

        render: (value, row) => (
          <div className="st-product">
            <strong>
              {value}
            </strong>

            <small>
              {row.sku}
            </small>
          </div>
        ),
      },

      {
        key: "variant_name",
        label: "Variant",

        render: (value, row) => (
          <div className="st-variant">
            <strong>
              {value}
            </strong>

            {(row.unit_name ||
              row.unit_symbol) && (
              <small>
                {row.unit_name}

                {row.unit_symbol
                  ? ` (${row.unit_symbol})`
                  : ""}
              </small>
            )}
          </div>
        ),
      },

      {
        key: "transaction_type",
        label: "Movement",

        render: (value) => {
          const movement =
            getMovement(value);

          return movement === "IN" ? (
            <span className="st-movement st-movement-in">
              ↑ IN
            </span>
          ) : movement === "OUT" ? (
            <span className="st-movement st-movement-out">
              ↓ OUT
            </span>
          ) : (
            <span className="st-movement">
              —
            </span>
          );
        },
      },

      {
        key: "transaction_type",
        label: "Transaction",

        render: (value) => (
          <span className="st-type">
            {getTypeLabel(value)}
          </span>
        ),
      },

      {
        key: "quantity",
        label: "Quantity",

        render: (value) => (
          <strong className="st-quantity">
            {formatNumber(value)}
          </strong>
        ),
      },

      {
        key: "rate",
        label: "Rate",

        render: (value) => (
          <>
            ₹
            {formatRate(value)}
          </>
        ),
      },

      {
        key: "reference_type",
        label: "Reference",

        render: (value, row) =>
          value || row.reference_id ? (
            <div className="st-reference">
              {value && (
                <span>
                  {value}
                </span>
              )}

              {row.reference_id && (
                <small>
                  #{row.reference_id}
                </small>
              )}
            </div>
          ) : (
            "-"
          ),
      },

      {
        key: "remarks",
        label: "Remarks",

        render: (value) => (
          <span
            className="st-remarks"
            title={value || ""}
          >
            {value || "-"}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Action",

        render: (_, row) => (
          <TableActions
            onView={() =>
              setSelectedTransaction(
                getTransaction(row)
              )
            }
            showView
            showEdit={false}
            showDelete={false}
          />
        ),
      },
    ],
    []
  );


  /*
  ==========================================================
  FILTER CONFIG
  ==========================================================
  */

  const filterValues = {
    transaction_type:
      typeFilter,

    movement:
      movementFilter,

    date_from:
      dateFrom,

    date_to:
      dateTo,
  };


  const handleFilterChange = (
    values
  ) => {
    setTypeFilter(
      values.transaction_type || ""
    );

    setMovementFilter(
      values.movement || ""
    );

    setDateFrom(
      values.date_from || ""
    );

    setDateTo(
      values.date_to || ""
    );
  };


  /*
  ==========================================================
  UI
  ==========================================================
  */

  return (
    <div className="stock-transactions-page">

      {/* HEADER */}

      <div className="stock-transactions-header">

        <div>
          <h1>
            Stock Transactions
          </h1>

          <p>
            Complete history of inventory
            stock movements.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="st-refresh-btn"
            onClick={
              openAddTransaction
            }
          >
            + Add Transaction
          </button>

          <button
            type="button"
            className="st-refresh-btn"
            onClick={() =>
              loadTransactions(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

      </div>


      {/* SUMMARY */}

      <div className="st-summary-grid">

        <div className="st-summary-card">
          <span>
            Total Transactions
          </span>

          <strong>
            {summary.totalTransactions}
          </strong>
        </div>

        <div className="st-summary-card st-in-card">
          <span>
            Total Stock In
          </span>

          <strong>
            {formatNumber(
              summary.totalIn
            )}
          </strong>
        </div>

        <div className="st-summary-card st-out-card">
          <span>
            Total Stock Out
          </span>

          <strong>
            {formatNumber(
              summary.totalOut
            )}
          </strong>
        </div>

        <div className="st-summary-card">
          <span>
            Net Movement
          </span>

          <strong>
            {summary.net >= 0
              ? "+"
              : ""}
            {formatNumber(
              summary.net
            )}
          </strong>
        </div>

      </div>


      {/* COMMON FILTER BAR */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Product, SKU, variant, reference..."

        filters={[
          {
            name: "transaction_type",
            label: "Transaction Type",
            type: "select",
            placeholder: "All Types",

            options:
              TRANSACTION_TYPES.map(
                (type) => ({
                  value: type,
                  label:
                    getTypeLabel(type),
                })
              ),
          },

          {
            name: "movement",
            label: "Movement",
            type: "select",
            placeholder: "All Movement",

            options: [
              {
                value: "IN",
                label: "Stock In",
              },
              {
                value: "OUT",
                label: "Stock Out",
              },
            ],
          },

          {
            name: "date_from",
            label: "From Date",
            type: "date",
          },

          {
            name: "date_to",
            label: "To Date",
            type: "date",
          },
        ]}

        values={filterValues}

        onChange={
          handleFilterChange
        }

        onReset={
          clearFilters
        }
      />


      {/* ERROR */}

      {error && (
        <div className="st-error">
          {error}
        </div>
      )}


      {/* TABLE */}

      <div className="st-table-card">

        <div className="st-table-header">

          <div>
            <h2>
              Transaction History
            </h2>

            <span>
              Showing{" "}
              {filteredTransactions.length}{" "}
              record
              {filteredTransactions.length !==
              1
                ? "s"
                : ""}
            </span>
          </div>

        </div>


        {loading ? (
          <LoadingState
            message="Loading stock transactions..."
          />
        ) : filteredTransactions.length ===
          0 ? (
          <EmptyState
            title="No stock transactions found"
            message={
              search ||
              typeFilter ||
              movementFilter ||
              dateFrom ||
              dateTo
                ? "Try changing your search or filters."
                : "Stock movements will appear here once transactions are recorded."
            }
            actionLabel={
              search ||
              typeFilter ||
              movementFilter ||
              dateFrom ||
              dateTo
                ? "Reset Filters"
                : "Add Transaction"
            }
            onAction={
              search ||
              typeFilter ||
              movementFilter ||
              dateFrom ||
              dateTo
                ? clearFilters
                : openAddTransaction
            }
          />
        ) : (
          <CommonTable
            columns={columns}
            data={filteredTransactions}
            rowKey="id"
          />
        )}

      </div>


      {/* =====================================================
          ADD TRANSACTION MODAL
      ===================================================== */}

      {showAddModal && (
        <div
          className="st-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddTransaction();
            }
          }}
        >

          <div className="st-modal">

            <div className="st-modal-header">

              <div>
                <h2>
                  Add Stock Transaction
                </h2>

                <span>
                  Record a new inventory movement
                </span>
              </div>

              <button
                type="button"
                className="st-modal-close"
                onClick={
                  closeAddTransaction
                }
                disabled={saving}
              >
                ×
              </button>

            </div>


            {formError && (
              <div className="st-error">
                {formError}
              </div>
            )}


            <form
              onSubmit={
                handleCreateTransaction
              }
            >

              <div className="st-detail-grid">

                {/* VARIANT */}

                <div>
                  <span>
                    Variant *
                  </span>

                  <select
                    name="variant_id"
                    value={
                      transactionForm.variant_id
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                  >
                    <option value="">
                      Select Variant
                    </option>

                    {variants.map(
                      (variant) => (
                        <option
                          key={variant.id}
                          value={variant.id}
                        >
                          {variant.product_name ||
                            "Product"}
                          {" — "}
                          {variant.variant_name ||
                            "Variant"}
                          {" ("}
                          {variant.sku ||
                            "No SKU"}
                          {")"}
                        </option>
                      )
                    )}
                  </select>
                </div>


                {/* SELECTED VARIANT */}

                {selectedVariant && (
                  <div
                    style={{
                      gridColumn:
                        "1 / -1",

                      display: "grid",

                      gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",

                      gap: "12px",

                      padding: "14px",

                      borderRadius: "8px",

                      background:
                        "#f9fafb",

                      border:
                        "1px solid #e5e7eb",
                    }}
                  >

                    <div>
                      <span>
                        Product
                      </span>

                      <strong>
                        {selectedVariant.product_name ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        SKU
                      </span>

                      <strong>
                        {selectedVariant.sku ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Unit
                      </span>

                      <strong>
                        {selectedVariant.unit_name ||
                          "-"}
                        {selectedVariant.unit_symbol
                          ? ` (${selectedVariant.unit_symbol})`
                          : ""}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Variant
                      </span>

                      <strong>
                        {selectedVariant.variant_name ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Pack Size
                      </span>

                      <strong>
                        {selectedVariant.pack_size ??
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Current Stock
                      </span>

                      <strong>
                        {selectedVariant.current_stock ??
                          "0.000"}
                      </strong>
                    </div>

                  </div>
                )}


                {/* TRANSACTION TYPE */}

                <div>
                  <span>
                    Transaction Type *
                  </span>

                  <select
                    name="transaction_type"
                    value={
                      transactionForm.transaction_type
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                  >
                    {TRANSACTION_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {getTypeLabel(type)}
                        </option>
                      )
                    )}
                  </select>
                </div>


                {/* QUANTITY */}

                <div>
                  <span>
                    Quantity *
                  </span>

                  <input
                    name="quantity"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={
                      transactionForm.quantity
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                    placeholder="0.000"
                  />
                </div>


                {/* RATE */}

                <div>
                  <span>
                    Rate
                  </span>

                  <input
                    name="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      transactionForm.rate
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                    placeholder="0.00"
                  />
                </div>


                {/* REFERENCE TYPE */}

                <div>
                  <span>
                    Reference Type
                  </span>

                  <input
                    name="reference_type"
                    value={
                      transactionForm.reference_type
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                    placeholder="PO / Sale / Adjustment"
                  />
                </div>


                {/* REFERENCE ID */}

                <div>
                  <span>
                    Reference ID
                  </span>

                  <input
                    name="reference_id"
                    type="number"
                    min="1"
                    value={
                      transactionForm.reference_id
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                    placeholder="Optional"
                  />
                </div>


                {/* DATE */}

                <div>
                  <span>
                    Transaction Date
                  </span>

                  <input
                    name="transaction_date"
                    type="datetime-local"
                    value={
                      transactionForm.transaction_date
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                  />
                </div>


                {/* REMARKS */}

                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <span>
                    Remarks
                  </span>

                  <textarea
                    name="remarks"
                    rows="3"
                    value={
                      transactionForm.remarks
                    }
                    onChange={
                      handleTransactionFormChange
                    }
                    disabled={saving}
                    placeholder="Optional remarks"
                  />
                </div>

              </div>


              <div className="st-modal-actions">

                <button
                  type="button"
                  className="st-clear-btn"
                  onClick={
                    closeAddTransaction
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="st-refresh-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Transaction"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =====================================================
          VIEW TRANSACTION MODAL
      ===================================================== */}

      {selectedTransaction && (
        <div
          className="st-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedTransaction(null);
            }
          }}
        >

          <div className="st-modal">

            <div className="st-modal-header">

              <div>
                <h2>
                  Stock Transaction #
                  {selectedTransaction.id}
                </h2>

                <span>
                  {getTypeLabel(
                    selectedTransaction.transaction_type
                  )}
                </span>
              </div>

              <button
                type="button"
                className="st-modal-close"
                onClick={() =>
                  setSelectedTransaction(null)
                }
              >
                ×
              </button>

            </div>


            <div className="st-details">

              <div className="st-detail-section">

                <h3>
                  Product Information
                </h3>

                <div className="st-detail-grid">

                  <div>
                    <span>
                      Product
                    </span>

                    <strong>
                      {
                        selectedTransaction.product_name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      SKU
                    </span>

                    <strong>
                      {
                        selectedTransaction.sku
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Variant
                    </span>

                    <strong>
                      {
                        selectedTransaction.variant_name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Unit
                    </span>

                    <strong>
                      {
                        selectedTransaction.unit_name ||
                        "-"
                      }

                      {selectedTransaction.unit_symbol
                        ? ` (${selectedTransaction.unit_symbol})`
                        : ""}
                    </strong>
                  </div>

                </div>

              </div>


              <div className="st-detail-section">

                <h3>
                  Transaction Information
                </h3>

                <div className="st-detail-grid">

                  <div>
                    <span>
                      Transaction Type
                    </span>

                    <strong>
                      {getTypeLabel(
                        selectedTransaction.transaction_type
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Movement
                    </span>

                    <strong>
                      {getMovement(
                        selectedTransaction.transaction_type
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Quantity
                    </span>

                    <strong>
                      {formatNumber(
                        selectedTransaction.quantity
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Rate
                    </span>

                    <strong>
                      ₹
                      {formatRate(
                        selectedTransaction.rate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Transaction Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedTransaction.transaction_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Created By
                    </span>

                    <strong>
                      {
                        selectedTransaction.created_by ||
                        "-"
                      }
                    </strong>
                  </div>

                </div>

              </div>


              <div className="st-detail-section">

                <h3>
                  Reference
                </h3>

                <div className="st-detail-grid">

                  <div>
                    <span>
                      Reference Type
                    </span>

                    <strong>
                      {
                        selectedTransaction.reference_type ||
                        "-"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Reference ID
                    </span>

                    <strong>
                      {
                        selectedTransaction.reference_id ||
                        "-"
                      }
                    </strong>
                  </div>

                </div>

              </div>


              <div className="st-detail-section">

                <h3>
                  Remarks
                </h3>

                <div className="st-remarks-box">
                  {
                    selectedTransaction.remarks ||
                    "No remarks added."
                  }
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}