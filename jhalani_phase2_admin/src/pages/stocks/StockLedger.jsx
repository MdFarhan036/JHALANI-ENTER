import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../api/axios";

import {
  getStockLedger,
} from "../../api/stockLedgerApi";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import "../../styles/stockLedger.css";


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
STOCK IN TYPES
============================================================
*/

const IN_TYPES = new Set([
  "OPENING",
  "PURCHASE",
  "SALE_RETURN",
  "ADJUSTMENT_IN",
  "TRANSFER_IN",
]);


/*
============================================================
STOCK OUT TYPES
============================================================
*/

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
HELPERS
============================================================
*/

const formatTransactionType = (type) => {
  if (!type) return "-";

  return String(type)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};


const formatNumber = (value) => {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }
  );
};


const formatRate = (value) => {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
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


const getMovement = (type) => {
  if (IN_TYPES.has(type)) {
    return "IN";
  }

  if (OUT_TYPES.has(type)) {
    return "OUT";
  }

  return "-";
};


/*
============================================================
STOCK LEDGER
============================================================
*/

const StockLedger = () => {

  /*
  ==========================================================
  DATA
  ==========================================================
  */

  const [ledger, setLedger] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [variants, setVariants] =
    useState([]);


  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  const [loading, setLoading] =
    useState(true);

  const [loadingFilters, setLoadingFilters] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [filters, setFilters] =
    useState({
      product_id: "",
      variant_id: "",
      transaction_type: "",
      date_from: "",
      date_to: "",
      search: "",
    });


  /*
  ==========================================================
  LOAD PRODUCTS
  ==========================================================
  */

  const loadProducts = async () => {
    try {
      const response =
        await api.get("/products");

      const data =
        response?.data?.data;

      setProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Get products error:",
        err
      );

      setProducts([]);
    }
  };


  /*
  ==========================================================
  LOAD VARIANTS
  ==========================================================
  */

  const loadVariants = async (
    productId = ""
  ) => {
    try {
      const response =
        await api.get(
          "/product-variants",
          {
            params: productId
              ? {
                  product_id:
                    productId,
                }
              : {},
          }
        );

      const data =
        response?.data?.data;

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

      setVariants([]);
    }
  };


  /*
  ==========================================================
  LOAD LEDGER
  ==========================================================
  */

  const loadLedger = async (
    customFilters = filters
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      Object.entries(
        customFilters
      ).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {
            params[key] = value;
          }
        }
      );

      const response =
        await getStockLedger(params);

      const data =
        response?.data?.data;

      setLedger(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Get stock ledger error:",
        err
      );

      setLedger([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load stock ledger"
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        loadProducts(),
        loadVariants(),
        loadLedger(),
      ]);
    };

    initialize();
  }, []);


  /*
  ==========================================================
  COMMON FILTER CHANGE
  ==========================================================
  */

  const handleFilterChange = (
    values
  ) => {
    const productChanged =
      values.product_id !==
      filters.product_id;

    if (productChanged) {
      setFilters({
        ...values,
        variant_id: "",
      });

      loadVariants(
        values.product_id || ""
      );

      return;
    }

    setFilters(values);
  };


  /*
  ==========================================================
  APPLY FILTERS
  ==========================================================
  */

  const handleApplyFilters = async () => {
    setLoadingFilters(true);

    try {
      await loadLedger(filters);
    } finally {
      setLoadingFilters(false);
    }
  };


  /*
  ==========================================================
  CLEAR FILTERS
  ==========================================================
  */

  const handleClearFilters = async () => {
    const cleared = {
      product_id: "",
      variant_id: "",
      transaction_type: "",
      date_from: "",
      date_to: "",
      search: "",
    };

    setFilters(cleared);

    await loadVariants();

    await loadLedger(cleared);
  };


  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    await loadLedger(filters);
  };


  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    ledger.forEach((item) => {
      totalIn += Number(
        item.quantity_in || 0
      );

      totalOut += Number(
        item.quantity_out || 0
      );
    });

    return {
      transactions:
        ledger.length,

      totalIn,

      totalOut,

      net:
        totalIn - totalOut,
    };
  }, [ledger]);


  /*
  ==========================================================
  TABLE COLUMNS
  ==========================================================
  */

  const columns = useMemo(
    () => [
      {
        key: "transaction_date",
        label: "Date",
        width: "160px",

        render: (value) => (
          <span className="sl-date">
            {formatDate(value)}
          </span>
        ),
      },

      {
        key: "product_name",
        label: "Product",

        render: (value, row) => (
          <div className="sl-product">
            <strong>
              {value || "-"}
            </strong>

            <small>
              ID:{" "}
              {row.product_id || "-"}
            </small>
          </div>
        ),
      },

      {
        key: "variant_name",
        label: "Variant",

        render: (value, row) => (
          <div className="sl-variant">
            <strong>
              {value || "-"}
            </strong>

            <small>
              SKU:{" "}
              {row.sku || "-"}
            </small>
          </div>
        ),
      },

      {
        key: "transaction_type",
        label: "Type",

        render: (value) => (
          <span className="sl-type">
            {formatTransactionType(
              value
            )}
          </span>
        ),
      },

      {
        key: "transaction_type",
        label: "Movement",

        render: (value) => {
          const movement =
            getMovement(value);

          return (
            <span
              className={`sl-movement ${
                movement === "IN"
                  ? "sl-movement-in"
                  : movement === "OUT"
                  ? "sl-movement-out"
                  : ""
              }`}
            >
              {movement}
            </span>
          );
        },
      },

      {
        key: "quantity_in",
        label: "IN",

        render: (value) => (
          <span className="sl-in-value">
            {formatNumber(value)}
          </span>
        ),
      },

      {
        key: "quantity_out",
        label: "OUT",

        render: (value) => (
          <span className="sl-out-value">
            {formatNumber(value)}
          </span>
        ),
      },

      {
        key: "balance",
        label: "Balance",

        render: (value, row) => (
          <div className="sl-balance">
            <strong>
              {formatNumber(value)}
            </strong>

            {row.unit_symbol && (
              <small>
                {row.unit_symbol}
              </small>
            )}
          </div>
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

        render: (_, row) => (
          <div className="sl-reference">
            {row.reference_type && (
              <span>
                {row.reference_type}
              </span>
            )}

            {row.reference_id && (
              <small>
                #{row.reference_id}
              </small>
            )}

            {!row.reference_type &&
              !row.reference_id &&
              "-"}
          </div>
        ),
      },

      {
        key: "remarks",
        label: "Remarks",

        render: (value) => (
          <span
            className="sl-remarks"
            title={value || ""}
          >
            {value || "-"}
          </span>
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
    product_id:
      filters.product_id,

    variant_id:
      filters.variant_id,

    transaction_type:
      filters.transaction_type,

    date_from:
      filters.date_from,

    date_to:
      filters.date_to,
  };


  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="stock-ledger-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="stock-ledger-header">

        <div>
          <h1>
            Stock Ledger
          </h1>

          <p>
            Complete product and variant
            stock movement history
          </p>
        </div>

        <button
          type="button"
          className="sl-refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>


      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <div className="sl-summary-grid">

        <div className="sl-summary-card">
          <span>
            Total Transactions
          </span>

          <strong>
            {summary.transactions}
          </strong>
        </div>


        <div className="sl-summary-card sl-in-card">
          <span>
            Total IN
          </span>

          <strong>
            {formatNumber(
              summary.totalIn
            )}
          </strong>
        </div>


        <div className="sl-summary-card sl-out-card">
          <span>
            Total OUT
          </span>

          <strong>
            {formatNumber(
              summary.totalOut
            )}
          </strong>
        </div>


        <div className="sl-summary-card">
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


      {/* ====================================================
          COMMON FILTER BAR
      ==================================================== */}

      <TableFilterBar
        search={filters.search}
        onSearchChange={(value) =>
          setFilters(
            (current) => ({
              ...current,
              search: value,
            })
          )
        }
        searchPlaceholder="Product, SKU, reference..."

        filters={[
          {
            name: "product_id",
            label: "Product",
            type: "select",
            placeholder:
              "All Products",

            options:
              products.map(
                (product) => ({
                  value:
                    String(
                      product.id
                    ),

                  label:
                    product.product_name ||
                    product.name ||
                    `Product ${product.id}`,
                })
              ),
          },

          {
            name: "variant_id",
            label: "Variant",
            type: "select",
            placeholder:
              "All Variants",

            options:
              variants.map(
                (variant) => ({
                  value:
                    String(
                      variant.id
                    ),

                  label:
                    variant.variant_name ||
                    variant.sku ||
                    `Variant ${variant.id}`,
                })
              ),
          },

          {
            name: "transaction_type",
            label: "Transaction Type",
            type: "select",
            placeholder:
              "All Types",

            options:
              TRANSACTION_TYPES.map(
                (type) => ({
                  value: type,

                  label:
                    formatTransactionType(
                      type
                    ),
                })
              ),
          },

          {
            name: "date_from",
            label: "Date From",
            type: "date",
          },

          {
            name: "date_to",
            label: "Date To",
            type: "date",
          },
        ]}

        values={filterValues}

        onChange={
          handleFilterChange
        }

        onReset={
          handleClearFilters
        }

        /*
        ------------------------------------------------------
        CUSTOM APPLY BUTTON
        ------------------------------------------------------
        */

        children={
          <button
            type="button"
            className="sl-apply-btn"
            onClick={
              handleApplyFilters
            }
            disabled={loadingFilters}
          >
            {loadingFilters
              ? "Loading..."
              : "Apply"}
          </button>
        }
      />


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="sl-error">
          {error}
        </div>
      )}


      {/* ====================================================
          TABLE CARD
      ==================================================== */}

      <div className="sl-table-card">

        <div className="sl-table-header">

          <div>
            <h2>
              Ledger Entries
            </h2>

            <span>
              {ledger.length} record
              {ledger.length === 1
                ? ""
                : "s"}
            </span>
          </div>

        </div>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <LoadingState
            message="Loading stock ledger..."
          />
        ) : ledger.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <EmptyState
            title="No ledger entries found"
            message={
              filters.product_id ||
              filters.variant_id ||
              filters.transaction_type ||
              filters.date_from ||
              filters.date_to ||
              filters.search
                ? "Try changing your search or filters."
                : "Stock transactions will appear here."
            }
            actionLabel={
              filters.product_id ||
              filters.variant_id ||
              filters.transaction_type ||
              filters.date_from ||
              filters.date_to ||
              filters.search
                ? "Clear Filters"
                : ""
            }
            onAction={
              handleClearFilters
            }
          />

        ) : (

          /* =================================================
             COMMON TABLE
          ================================================= */

          <CommonTable
            columns={columns}
            data={ledger}
            rowKey="id"
          />

        )}

      </div>

    </div>
  );
};


export default StockLedger;