import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/stock.css";

import api from "../../api/axios";

// Common Components
import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";


/* ============================================================
   TRANSACTION TYPES
   ============================================================ */

const TRANSACTION_TYPES = [
  {
    value: "ADJUSTMENT_IN",
    label: "Adjustment In",
  },
  {
    value: "ADJUSTMENT_OUT",
    label: "Adjustment Out",
  },
  {
    value: "DAMAGE",
    label: "Damage",
  },
  {
    value: "EXPIRY",
    label: "Expiry",
  },
  {
    value: "TRANSFER_IN",
    label: "Transfer In",
  },
  {
    value: "TRANSFER_OUT",
    label: "Transfer Out",
  },
];


/* ============================================================
   STOCK STATUS
   ============================================================ */

const getStockStatus = (stock) => {
  const value = Number(stock || 0);

  if (value <= 0) {
    return {
      label: "Out of Stock",
      className: "stock-status out",
    };
  }

  return {
    label: "In Stock",
    className: "stock-status in",
  };
};


/* ============================================================
   ERROR HELPER
   ============================================================ */

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function Stock() {

  /* ============================================================
     STOCK STATE
     ============================================================ */

  const [stocks, setStocks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);


  /* ============================================================
     FILTER STATE
     ============================================================ */

  const [search, setSearch] =
    useState("");

  const [stockFilter, setStockFilter] =
    useState("all");


  /* ============================================================
     ADJUSTMENT STATE
     ============================================================ */

  const [showAdjustment, setShowAdjustment] =
    useState(false);

  const [selectedStock, setSelectedStock] =
    useState(null);

  const [
    transactionType,
    setTransactionType,
  ] = useState("ADJUSTMENT_IN");

  const [quantity, setQuantity] =
    useState("");

  const [rate, setRate] =
    useState("");

  const [remarks, setRemarks] =
    useState("");


  /* ============================================================
     COMMON STATE
     ============================================================ */

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  /* ============================================================
     LOAD STOCK
     ============================================================ */

  const loadStocks = async (
    isRefresh = false
  ) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await api.get("/stock");

      const payload =
        response?.data;

      if (Array.isArray(payload)) {
        setStocks(payload);
      } else if (
        Array.isArray(payload?.data)
      ) {
        setStocks(payload.data);
      } else {
        setStocks([]);
      }

    } catch (err) {
      console.error(
        "Get stock error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load stock information."
        )
      );

      setStocks([]);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadStocks();
  }, []);


  /* ============================================================
     FILTER STOCK
     ============================================================ */

  const filteredStocks = useMemo(() => {

    const keyword =
      search
        .trim()
        .toLowerCase();

    return stocks.filter(
      (item) => {

        const stock =
          Number(
            item.current_stock || 0
          );

        const matchesSearch =
          !keyword ||
          String(
            item.product_name || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            item.sku || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            item.variant_name || ""
          )
            .toLowerCase()
            .includes(keyword) ||
          String(
            item.unit_name || ""
          )
            .toLowerCase()
            .includes(keyword);

        let matchesFilter =
          true;

        if (
          stockFilter === "out"
        ) {
          matchesFilter =
            stock <= 0;
        }

        if (
          stockFilter === "in"
        ) {
          matchesFilter =
            stock > 0;
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  }, [
    stocks,
    search,
    stockFilter,
  ]);


  /* ============================================================
     SUMMARY
     ============================================================ */

  const summary = useMemo(() => {

    let totalItems =
      stocks.length;

    let inStock = 0;

    let outOfStock = 0;

    let totalQuantity = 0;

    stocks.forEach(
      (item) => {

        const quantityValue =
          Number(
            item.current_stock || 0
          );

        totalQuantity +=
          quantityValue;

        if (
          quantityValue > 0
        ) {
          inStock += 1;
        } else {
          outOfStock += 1;
        }
      }
    );

    return {
      totalItems,
      inStock,
      outOfStock,
      totalQuantity,
    };

  }, [stocks]);


  /* ============================================================
     OPEN ADJUSTMENT
     ============================================================ */

  const openAdjustment = (
    stock
  ) => {

    setSelectedStock(stock);

    setTransactionType(
      "ADJUSTMENT_IN"
    );

    setQuantity("");

    setRate("");

    setRemarks("");

    setError("");

    setShowAdjustment(true);
  };


  /* ============================================================
     CLOSE ADJUSTMENT
     ============================================================ */

  const closeAdjustment = () => {

    if (saving) return;

    setShowAdjustment(false);

    setSelectedStock(null);

    setQuantity("");

    setRate("");

    setRemarks("");

    setError("");
  };


  /* ============================================================
     SUBMIT ADJUSTMENT
     ============================================================ */

  const submitAdjustment = async (
    event
  ) => {

    event.preventDefault();

    if (!selectedStock) return;

    const quantityValue =
      Number(quantity);

    if (
      !quantity ||
      Number.isNaN(
        quantityValue
      ) ||
      quantityValue <= 0
    ) {
      setError(
        "Enter a valid quantity greater than zero."
      );

      return;
    }

    try {

      setSaving(true);

      setError("");

      await api.post(
        "/stock/transactions",
        {
          variant_id:
            selectedStock.variant_id,

          transaction_type:
            transactionType,

          quantity:
            quantityValue,

          rate:
            rate === ""
              ? 0
              : Number(rate),

          remarks:
            remarks.trim() ||
            null,
        }
      );

      closeAdjustment();

      await loadStocks(true);

    } catch (err) {

      console.error(
        "Stock adjustment error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to save stock adjustment."
        )
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = [
    {
      key: "id",
      label: "#",
      width: "60px",

      render: (
        value,
        row,
        index
      ) => index + 1,
    },

    {
      key: "product_name",
      label: "Product",

      render: (
        value,
        row
      ) => (
        <div className="stock-product-name">
          {row.product_name || "-"}
        </div>
      ),
    },

    {
      key: "sku",
      label: "SKU",

      render: (
        value,
        row
      ) => (
        <span className="stock-sku">
          {row.sku || "-"}
        </span>
      ),
    },

    {
      key: "variant_name",
      label: "Variant",

      render: (
        value,
        row
      ) =>
        row.variant_name || "-",
    },

    {
      key: "pack_size",
      label: "Pack Size",

      render: (
        value,
        row
      ) =>
        row.pack_size || "-",
    },

    {
      key: "unit_name",
      label: "Unit",

      render: (
        value,
        row
      ) => (
        <div className="stock-unit">

          <span>
            {row.unit_name || "-"}
          </span>

          {row.unit_symbol && (
            <small>
              {row.unit_symbol}
            </small>
          )}

        </div>
      ),
    },

    {
      key: "current_stock",
      label: "Current Stock",

      render: (
        value,
        row
      ) => (
        <strong className="stock-quantity">

          {Number(
            row.current_stock || 0
          ).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 3,
            }
          )}

        </strong>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (
        value,
        row
      ) => {

        const status =
          getStockStatus(
            row.current_stock
          );

        return (
          <span
            className={
              status.className
            }
          >
            {status.label}
          </span>
        );
      },
    },

    {
      key: "actions",
      label: "Action",

      render: (
        value,
        row
      ) => (
        <TableActions
          showView={false}
          showEdit={false}
          showDelete={false}
          showStatus={true}
          statusLabel="Adjust Stock"
          onToggleStatus={() =>
            openAdjustment(row)
          }
        />
      ),
    },
  ];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="stock-page">

      {/* ========================================================
          HEADER
          ======================================================== */}

      <div className="stock-page-header">

        <div>

          <h1>
            Stock / Inventory
          </h1>

          <p>
            Monitor current stock
            and manage inventory
            adjustments.
          </p>

        </div>

        <button
          type="button"
          className="stock-refresh-btn"
          onClick={() =>
            loadStocks(true)
          }
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>


      {/* ========================================================
          SUMMARY
          ======================================================== */}

      <div className="stock-summary-grid">

        <div className="stock-summary-card">

          <span>
            Total Items
          </span>

          <strong>
            {summary.totalItems}
          </strong>

        </div>


        <div className="stock-summary-card">

          <span>
            In Stock
          </span>

          <strong>
            {summary.inStock}
          </strong>

        </div>


        <div className="stock-summary-card">

          <span>
            Out of Stock
          </span>

          <strong>
            {summary.outOfStock}
          </strong>

        </div>


        <div className="stock-summary-card">

          <span>
            Total Quantity
          </span>

          <strong>
            {summary.totalQuantity.toLocaleString()}
          </strong>

        </div>

      </div>


      {/* ========================================================
          COMMON FILTER BAR
          ======================================================== */}

      <TableFilterBar

        search={search}

        onSearchChange={
          setSearch
        }

        searchPlaceholder={
          "Search product, SKU, variant..."
        }

        filters={[
          {
            name: "stock",
            label: "Stock",
            type: "select",

            options: [
              {
                value: "all",
                label: "All Stock",
              },
              {
                value: "in",
                label: "In Stock",
              },
              {
                value: "out",
                label: "Out of Stock",
              },
            ],
          },
        ]}

        values={{
          stock: stockFilter,
        }}

        onChange={(values) => {
          setStockFilter(
            values.stock || "all"
          );
        }}

        onReset={() => {
          setSearch("");
          setStockFilter("all");
        }}

      />


      {/* ========================================================
          ERROR
          ======================================================== */}

      {error &&
        !showAdjustment && (
          <div className="stock-alert">
            {error}
          </div>
        )}


      {/* ========================================================
          TABLE
          ======================================================== */}

      <div className="stock-table-card">

        {loading ? (

          <LoadingState
            message="Loading stock..."
          />

        ) : filteredStocks.length ===
          0 ? (

          <EmptyState

            title="No stock records found"

            message={
              search ||
              stockFilter !== "all"
                ? "No inventory records match your current search or filter."
                : "No inventory records are available."
            }

            actionLabel={
              search ||
              stockFilter !== "all"
                ? "Clear Filters"
                : ""
            }

            onAction={
              search ||
              stockFilter !== "all"
                ? () => {
                    setSearch("");
                    setStockFilter(
                      "all"
                    );
                  }
                : undefined
            }

          />

        ) : (

          <div className="stock-table-wrapper">

            <CommonTable
              columns={columns}
              data={filteredStocks}
              rowKey="variant_id"
            />

          </div>

        )}

      </div>


      {/* ========================================================
          STOCK ADJUSTMENT MODAL
          ======================================================== */}

      {showAdjustment &&
        selectedStock && (

          <div className="stock-modal-overlay">

            <div className="stock-modal">

              {/* HEADER */}

              <div className="stock-modal-header">

                <div>

                  <h2>
                    Stock Adjustment
                  </h2>

                  <p>
                    {
                      selectedStock.product_name
                    }
                  </p>

                </div>

                <button
                  type="button"
                  className="stock-modal-close"
                  onClick={
                    closeAdjustment
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>


              {/* PRODUCT INFO */}

              <div className="stock-modal-product">

                <div>

                  <span>
                    Variant
                  </span>

                  <strong>
                    {
                      selectedStock.variant_name ||
                      "-"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    SKU
                  </span>

                  <strong>
                    {
                      selectedStock.sku ||
                      "-"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Current Stock
                  </span>

                  <strong>

                    {
                      selectedStock.current_stock ||
                      0
                    }{" "}

                    {
                      selectedStock.unit_symbol ||
                      ""
                    }

                  </strong>

                </div>

              </div>


              {/* FORM */}

              <form
                className="stock-adjustment-form"
                onSubmit={
                  submitAdjustment
                }
              >

                {error && (
                  <div className="stock-alert">
                    {error}
                  </div>
                )}


                {/* TRANSACTION TYPE */}

                <div className="stock-form-group">

                  <label>
                    Transaction Type
                    <span>*</span>
                  </label>

                  <select
                    value={
                      transactionType
                    }
                    onChange={(
                      event
                    ) =>
                      setTransactionType(
                        event.target.value
                      )
                    }
                    disabled={saving}
                  >

                    {TRANSACTION_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* QUANTITY + RATE */}

                <div className="stock-form-row">

                  <div className="stock-form-group">

                    <label>
                      Quantity
                      <span>*</span>
                    </label>

                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={
                        quantity
                      }
                      onChange={(
                        event
                      ) =>
                        setQuantity(
                          event.target.value
                        )
                      }
                      placeholder="Enter quantity"
                      disabled={saving}
                    />

                  </div>


                  <div className="stock-form-group">

                    <label>
                      Rate
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        rate
                      }
                      onChange={(
                        event
                      ) =>
                        setRate(
                          event.target.value
                        )
                      }
                      placeholder="0.00"
                      disabled={saving}
                    />

                  </div>

                </div>


                {/* REMARKS */}

                <div className="stock-form-group">

                  <label>
                    Remarks
                  </label>

                  <textarea
                    rows="3"
                    value={
                      remarks
                    }
                    onChange={(
                      event
                    ) =>
                      setRemarks(
                        event.target.value
                      )
                    }
                    placeholder="Enter remarks..."
                    disabled={saving}
                  />

                </div>


                {/* FOOTER */}

                <div className="stock-modal-footer">

                  <button
                    type="button"
                    className="stock-cancel-btn"
                    onClick={
                      closeAdjustment
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="stock-save-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Adjustment"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

    </div>
  );
}