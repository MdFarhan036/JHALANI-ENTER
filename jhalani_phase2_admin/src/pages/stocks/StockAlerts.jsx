import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getStockAlerts,
} from "../../api/stockAlertApi";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import "../../styles/stockAlerts.css";


/*
============================================================
STOCK ALERTS
============================================================
*/

const StockAlerts = () => {

  /*
  ==========================================================
  DATA
  ==========================================================
  */

  const [alerts, setAlerts] =
    useState([]);


  /*
  ==========================================================
  LOADING / ERROR
  ==========================================================
  */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [filters, setFilters] =
    useState({
      search: "",
      status: "ALL",
    });


  /*
  ==========================================================
  LOAD STOCK ALERTS
  ==========================================================
  */

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getStockAlerts();

      const data =
        response?.data?.data;

      setAlerts(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Get stock alerts error:",
        err
      );

      setAlerts([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load stock alerts"
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
    loadAlerts();
  }, []);


  /*
  ==========================================================
  FILTERED DATA
  ==========================================================
  */

  const filteredAlerts = useMemo(() => {

    const searchValue =
      filters.search
        .trim()
        .toLowerCase();

    return alerts.filter((item) => {

      /*
      --------------------------------------------------------
      STATUS
      --------------------------------------------------------
      */

      const matchesStatus =
        filters.status === "ALL" ||
        item.alert_status ===
          filters.status;

      if (!matchesStatus) {
        return false;
      }


      /*
      --------------------------------------------------------
      SEARCH
      --------------------------------------------------------
      */

      if (!searchValue) {
        return true;
      }

      return [
        item.product_name,
        item.variant_name,
        item.sku,
        item.unit_name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(searchValue)
        );
    });

  }, [
    alerts,
    filters.search,
    filters.status,
  ]);


  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const summary = useMemo(() => {

    const outOfStock =
      alerts.filter(
        (item) =>
          item.alert_status ===
          "OUT_OF_STOCK"
      ).length;


    const inStock =
      alerts.filter(
        (item) =>
          item.alert_status ===
          "IN_STOCK"
      ).length;


    return {
      total: alerts.length,
      outOfStock,
      inStock,
    };

  }, [alerts]);


  /*
  ==========================================================
  FILTER CHANGE
  ==========================================================
  */

  const handleFilterChange = (
    values
  ) => {
    setFilters(values);
  };


  /*
  ==========================================================
  RESET FILTERS
  ==========================================================
  */

  const handleResetFilters = () => {

    setFilters({
      search: "",
      status: "ALL",
    });

  };


  /*
  ==========================================================
  FORMAT NUMBER
  ==========================================================
  */

  const formatNumber = (value) =>
    Number(value || 0).toFixed(3);


  /*
  ==========================================================
  TABLE COLUMNS
  ==========================================================
  */

  const columns = useMemo(
    () => [
      {
        key: "product_name",
        label: "Product",

        render: (
          value,
          row
        ) => (
          <div className="sa-product">

            <strong>
              {value || "-"}
            </strong>

            <small>
              Product ID:{" "}
              {row.product_id || "-"}
            </small>

          </div>
        ),
      },


      {
        key: "variant_name",
        label: "Variant",

        render: (
          value,
          row
        ) => (
          <div className="sa-variant">

            <strong>
              {value || "-"}
            </strong>

            {row.pack_size && (
              <small>
                Pack:{" "}
                {row.pack_size}
              </small>
            )}

          </div>
        ),
      },


      {
        key: "sku",
        label: "SKU",

        render: (value) =>
          value || "-",
      },


      {
        key: "unit_name",
        label: "Unit",

        render: (
          value,
          row
        ) => (
          <span className="sa-unit">

            {value || "-"}

            {row.unit_symbol && (
              <small>
                ({row.unit_symbol})
              </small>
            )}

          </span>
        ),
      },


      {
        key: "current_stock",
        label: "Current Stock",

        render: (
          value,
          row
        ) => (
          <strong
            className={
              row.alert_status ===
              "OUT_OF_STOCK"
                ? "sa-stock-danger"
                : "sa-stock-normal"
            }
          >
            {formatNumber(value)}
          </strong>
        ),
      },


      {
        key: "reserved_stock",
        label: "Reserved",

        render: (value) =>
          formatNumber(value),
      },


      {
        key: "available_stock",
        label: "Available",

        render: (value) => (
          <strong>
            {formatNumber(value)}
          </strong>
        ),
      },


      {
        key: "alert_status",
        label: "Status",

        render: (value) => {

          if (
            value ===
            "OUT_OF_STOCK"
          ) {
            return (
              <span className="sa-status sa-status-danger">
                OUT OF STOCK
              </span>
            );
          }

          return (
            <span className="sa-status sa-status-success">
              IN STOCK
            </span>
          );
        },
      },
    ],
    []
  );


  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="stock-alerts-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="stock-alerts-header">

        <div>

          <h1>
            Stock Alerts
          </h1>

          <p>
            Monitor products that require
            stock attention
          </p>

        </div>


        <button
          type="button"
          className="sa-refresh-btn"
          onClick={loadAlerts}
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

      <div className="sa-summary-grid">

        <div className="sa-summary-card">

          <span>
            Total Variants
          </span>

          <strong>
            {summary.total}
          </strong>

        </div>


        <div className="sa-summary-card sa-danger-card">

          <span>
            Out of Stock
          </span>

          <strong>
            {summary.outOfStock}
          </strong>

        </div>


        <div className="sa-summary-card sa-success-card">

          <span>
            In Stock
          </span>

          <strong>
            {summary.inStock}
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

        searchPlaceholder="Product, variant or SKU..."

        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",

            placeholder:
              "All Statuses",

            options: [
              {
                value:
                  "OUT_OF_STOCK",

                label:
                  "Out of Stock",
              },

              {
                value:
                  "IN_STOCK",

                label:
                  "In Stock",
              },
            ],
          },
        ]}

        values={{
          status:
            filters.status,
        }}

        onChange={
          handleFilterChange
        }

        onReset={
          handleResetFilters
        }
      />


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="sa-error">
          {error}
        </div>
      )}


      {/* ====================================================
          TABLE CARD
      ==================================================== */}

      <div className="sa-table-card">

        <div className="sa-table-header">

          <div>

            <h2>
              Stock Status
            </h2>

            <span>
              {filteredAlerts.length} item
              {filteredAlerts.length === 1
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
            message="Loading stock alerts..."
          />

        ) : filteredAlerts.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <EmptyState
            title="No stock alerts found"
            message={
              filters.search ||
              filters.status !== "ALL"
                ? "There are no items matching the current filter."
                : "There are currently no stock alerts."
            }

            actionLabel={
              filters.search ||
              filters.status !== "ALL"
                ? "Clear Filters"
                : ""
            }

            onAction={
              handleResetFilters
            }
          />

        ) : (

          /* =================================================
             COMMON TABLE
          ================================================= */

          <CommonTable
            columns={columns}
            data={filteredAlerts}
            rowKey="variant_id"
          />

        )}

      </div>

    </div>
  );
};


export default StockAlerts;