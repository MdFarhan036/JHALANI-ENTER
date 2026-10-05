import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./Reports.css";

/* ============================================================
   HELPERS
   ============================================================ */

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 3,
  });

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN");
};

const formatStatus = (status) => {
  if (!status) return "-";

  return String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const getData = (response) => {
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


/* ============================================================
   COMPONENT
   ============================================================ */

const Reports = () => {
  /* ==========================================================
     ACTIVE REPORT
     ========================================================== */

  const [activeReport, setActiveReport] =
    useState("sales");

  /* ==========================================================
     COMMON
     ========================================================== */

  const [parties, setParties] = useState([]);
  const [error, setError] = useState("");

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  const [dashboard, setDashboard] = useState({
    sales: {
      orders: 0,
      amount: 0,
    },

    purchases: {
      count: 0,
      amount: 0,
    },

    sales_returns: {
      count: 0,
      amount: 0,
    },

    purchase_returns: {
      count: 0,
      amount: 0,
    },

    stock: {
      quantity: 0,
      value: 0,
    },

    accounts: {
      balance: 0,
    },
  });

  const [loadingDashboard, setLoadingDashboard] =
    useState(false);


  /* ==========================================================
     SALES
     ========================================================== */

  const [salesReport, setSalesReport] =
    useState([]);

  const [salesSummary, setSalesSummary] =
    useState({
      total_orders: 0,
      total_quantity: 0,
      total_amount: 0,
    });

  const [salesFilters, setSalesFilters] =
    useState({
      from_date: "",
      to_date: "",
      party_id: "",
      status: "",
    });

  const [loadingSales, setLoadingSales] =
    useState(false);


  /* ==========================================================
     SALES RETURNS
     ========================================================== */

  const [salesReturns, setSalesReturns] =
    useState([]);

  const [salesReturnSummary, setSalesReturnSummary] =
    useState({
      count: 0,
      amount: 0,
    });

  const [salesReturnFilters, setSalesReturnFilters] =
    useState({
      from_date: "",
      to_date: "",
      party_id: "",
      status: "",
    });

  const [loadingSalesReturns, setLoadingSalesReturns] =
    useState(false);


  /* ==========================================================
     PURCHASES
     ========================================================== */

  const [purchaseReport, setPurchaseReport] =
    useState([]);

  const [purchaseSummary, setPurchaseSummary] =
    useState({
      count: 0,
      quantity: 0,
      amount: 0,
    });

  const [purchaseFilters, setPurchaseFilters] =
    useState({
      from_date: "",
      to_date: "",
      party_id: "",
      status: "",
    });

  const [loadingPurchases, setLoadingPurchases] =
    useState(false);


  /* ==========================================================
     PURCHASE RETURNS
     ========================================================== */

  const [purchaseReturns, setPurchaseReturns] =
    useState([]);

  const [purchaseReturnSummary, setPurchaseReturnSummary] =
    useState({
      count: 0,
      amount: 0,
    });

  const [purchaseReturnFilters, setPurchaseReturnFilters] =
    useState({
      from_date: "",
      to_date: "",
      status: "",
    });

  const [loadingPurchaseReturns, setLoadingPurchaseReturns] =
    useState(false);


  /* ==========================================================
     STOCK
     ========================================================== */

  const [stockReport, setStockReport] =
    useState([]);

  const [stockSummary, setStockSummary] =
    useState({
      quantity: 0,
      value: 0,
    });

  const [stockFilters, setStockFilters] =
    useState({
      category_id: "",
      status: "",
    });

  const [loadingStock, setLoadingStock] =
    useState(false);


  /* ==========================================================
     ACCOUNTS
     ========================================================== */

  const [accountReport, setAccountReport] =
    useState([]);

  const [accountSummary, setAccountSummary] =
    useState({
      credit: 0,
      debit: 0,
      balance: 0,
    });

  const [accountFilters, setAccountFilters] =
    useState({
      from_date: "",
      to_date: "",
      transaction_type: "",
    });

  const [loadingAccounts, setLoadingAccounts] =
    useState(false);


  /* ==========================================================
     PARTY OUTSTANDING
     ========================================================== */

  const [partyOutstanding, setPartyOutstanding] =
    useState([]);

  const [outstandingSummary, setOutstandingSummary] =
    useState({
      debit: 0,
      credit: 0,
      outstanding: 0,
    });

  const [loadingOutstanding, setLoadingOutstanding] =
    useState(false);


  /* ==========================================================
     PARTY LEDGER
     ========================================================== */

  const [partyLedger, setPartyLedger] =
    useState([]);

  const [partyLedgerSummary, setPartyLedgerSummary] =
    useState({
      debit: 0,
      credit: 0,
      balance: 0,
    });

  const [partyLedgerFilters, setPartyLedgerFilters] =
    useState({
      party_id: "",
      from_date: "",
      to_date: "",
    });

  const [loadingPartyLedger, setLoadingPartyLedger] =
    useState(false);


  /* ==========================================================
     EMPLOYEE REPORT
     ========================================================== */

  const [employeeReport, setEmployeeReport] =
    useState([]);

  const [employeeSummary, setEmployeeSummary] =
    useState({
      salary: 0,
      expenses: 0,
      deductions: 0,
      net: 0,
    });

  const [employeeFilters, setEmployeeFilters] =
    useState({
      from_date: "",
      to_date: "",
      employee_id: "",
    });

  const [loadingEmployees, setLoadingEmployees] =
    useState(false);


  /* ==========================================================
     LOAD DASHBOARD
     ========================================================== */

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      setError("");

      const response = await api.get(
        "/reports/dashboard"
      );

      if (response.data?.success) {
        setDashboard(
          response.data.data || {}
        );
      }
    } catch (err) {
      console.error(
        "Dashboard report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load dashboard report."
      );
    } finally {
      setLoadingDashboard(false);
    }
  };


  /* ==========================================================
     LOAD PARTIES
     ========================================================== */

  const loadParties = async () => {
    try {
      const response = await api.get(
        "/parties"
      );

      setParties(getData(response));
    } catch (err) {
      console.error(
        "Party loading error:",
        err
      );
    }
  };


  /* ==========================================================
     QUERY BUILDER
     ========================================================== */

  const createQuery = (filters) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          params.append(key, value);
        }
      }
    );

    const query = params.toString();

    return query ? `?${query}` : "";
  };


  /* ==========================================================
     SALES REPORT
     ========================================================== */

  const loadSalesReport = async () => {
    try {
      setLoadingSales(true);
      setError("");

      const response = await api.get(
        `/reports/sales${createQuery(
          salesFilters
        )}`
      );

      if (response.data?.success) {
        setSalesReport(
          response.data.data || []
        );

        setSalesSummary(
          response.data.summary || {
            total_orders: 0,
            total_quantity: 0,
            total_amount: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Sales report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load sales report."
      );
    } finally {
      setLoadingSales(false);
    }
  };


  /* ==========================================================
     SALES RETURNS
     ========================================================== */

  const loadSalesReturns = async () => {
    try {
      setLoadingSalesReturns(true);
      setError("");

      const response = await api.get(
        `/reports/sales-returns${createQuery(
          salesReturnFilters
        )}`
      );

      if (response.data?.success) {
        setSalesReturns(
          response.data.data || []
        );

        setSalesReturnSummary(
          response.data.summary || {
            count: 0,
            amount: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Sales return report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load sales return report."
      );
    } finally {
      setLoadingSalesReturns(false);
    }
  };


  /* ==========================================================
     PURCHASE REPORT
     ========================================================== */

  const loadPurchaseReport = async () => {
    try {
      setLoadingPurchases(true);
      setError("");

      const response = await api.get(
        `/reports/purchases${createQuery(
          purchaseFilters
        )}`
      );

      if (response.data?.success) {
        setPurchaseReport(
          response.data.data || []
        );

        setPurchaseSummary(
          response.data.summary || {
            count: 0,
            quantity: 0,
            amount: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Purchase report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load purchase report."
      );
    } finally {
      setLoadingPurchases(false);
    }
  };


  /* ==========================================================
     PURCHASE RETURNS
     ========================================================== */

  const loadPurchaseReturns = async () => {
    try {
      setLoadingPurchaseReturns(true);
      setError("");

      const response = await api.get(
        `/reports/purchase-returns${createQuery(
          purchaseReturnFilters
        )}`
      );

      if (response.data?.success) {
        setPurchaseReturns(
          response.data.data || []
        );

        setPurchaseReturnSummary(
          response.data.summary || {
            count: 0,
            amount: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Purchase return report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load purchase return report."
      );
    } finally {
      setLoadingPurchaseReturns(false);
    }
  };


  /* ==========================================================
     STOCK REPORT
     ========================================================== */

  const loadStockReport = async () => {
    try {
      setLoadingStock(true);
      setError("");

      const response = await api.get(
        `/reports/stock${createQuery(
          stockFilters
        )}`
      );

      if (response.data?.success) {
        setStockReport(
          response.data.data || []
        );

        setStockSummary(
          response.data.summary || {
            quantity: 0,
            value: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Stock report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load stock report."
      );
    } finally {
      setLoadingStock(false);
    }
  };


  /* ==========================================================
     ACCOUNTS REPORT
     ========================================================== */

  const loadAccountReport = async () => {
    try {
      setLoadingAccounts(true);
      setError("");

      const response = await api.get(
        `/reports/accounts${createQuery(
          accountFilters
        )}`
      );

      if (response.data?.success) {
        setAccountReport(
          response.data.data || []
        );

        setAccountSummary(
          response.data.summary || {
            credit: 0,
            debit: 0,
            balance: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Account report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load account report."
      );
    } finally {
      setLoadingAccounts(false);
    }
  };


  /* ==========================================================
     PARTY OUTSTANDING
     ========================================================== */

  const loadOutstandingReport = async () => {
    try {
      setLoadingOutstanding(true);
      setError("");

      const response = await api.get(
        "/reports/party-outstanding"
      );

      if (response.data?.success) {
        setPartyOutstanding(
          response.data.data || []
        );

        setOutstandingSummary(
          response.data.summary || {
            debit: 0,
            credit: 0,
            outstanding: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Outstanding report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load outstanding report."
      );
    } finally {
      setLoadingOutstanding(false);
    }
  };


  /* ==========================================================
     PARTY LEDGER
     ========================================================== */

  const loadPartyLedger = async () => {
    try {
      setLoadingPartyLedger(true);
      setError("");

      if (!partyLedgerFilters.party_id) {
        setPartyLedger([]);
        setPartyLedgerSummary({
          debit: 0,
          credit: 0,
          balance: 0,
        });

        return;
      }

      const response = await api.get(
        `/reports/party-ledger${createQuery(
          partyLedgerFilters
        )}`
      );

      if (response.data?.success) {
        setPartyLedger(
          response.data.data || []
        );

        setPartyLedgerSummary(
          response.data.summary || {
            debit: 0,
            credit: 0,
            balance: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Party ledger error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load party ledger."
      );
    } finally {
      setLoadingPartyLedger(false);
    }
  };


  /* ==========================================================
     EMPLOYEE REPORT
     ========================================================== */

  const loadEmployeeReport = async () => {
    try {
      setLoadingEmployees(true);
      setError("");

      const response = await api.get(
        `/reports/employee${createQuery(
          employeeFilters
        )}`
      );

      if (response.data?.success) {
        setEmployeeReport(
          response.data.data || []
        );

        setEmployeeSummary(
          response.data.summary || {
            salary: 0,
            expenses: 0,
            deductions: 0,
            net: 0,
          }
        );
      }
    } catch (err) {
      console.error(
        "Employee report error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load employee report."
      );
    } finally {
      setLoadingEmployees(false);
    }
  };


  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    loadDashboard();
    loadParties();
  }, []);


  /* ==========================================================
     LOAD ACTIVE REPORT
     ========================================================== */

  useEffect(() => {
    if (activeReport === "sales") {
      loadSalesReport();
    }

    if (activeReport === "sales-returns") {
      loadSalesReturns();
    }

    if (activeReport === "purchases") {
      loadPurchaseReport();
    }

    if (activeReport === "purchase-returns") {
      loadPurchaseReturns();
    }

    if (activeReport === "stock") {
      loadStockReport();
    }

    if (activeReport === "accounts") {
      loadAccountReport();
    }

    if (activeReport === "outstanding") {
      loadOutstandingReport();
    }

    if (activeReport === "party-ledger") {
      loadPartyLedger();
    }

    if (activeReport === "employees") {
      loadEmployeeReport();
    }
  }, [activeReport]);


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="reports-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="reports-header">

        <div>
          <h1>Reports & Analytics</h1>

          <p>
            Complete business reports for
            Jhalani Enterprises.
          </p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={() => {
            loadDashboard();

            if (activeReport === "sales")
              loadSalesReport();

            if (activeReport === "sales-returns")
              loadSalesReturns();

            if (activeReport === "purchases")
              loadPurchaseReport();

            if (activeReport === "purchase-returns")
              loadPurchaseReturns();

            if (activeReport === "stock")
              loadStockReport();

            if (activeReport === "accounts")
              loadAccountReport();

            if (activeReport === "outstanding")
              loadOutstandingReport();

            if (activeReport === "party-ledger")
              loadPartyLedger();

            if (activeReport === "employees")
              loadEmployeeReport();
          }}
        >
          {loadingDashboard
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="report-error">
          {error}
        </div>
      )}


      {/* ======================================================
          DASHBOARD
          ====================================================== */}

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <div className="card-icon">₹</div>

          <div>
            <span>Total Sales</span>

            <strong>
              {formatCurrency(
                dashboard.sales?.amount
              )}
            </strong>

            <small>
              {formatNumber(
                dashboard.sales?.orders
              )} Orders
            </small>
          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-icon">P</div>

          <div>
            <span>Total Purchases</span>

            <strong>
              {formatCurrency(
                dashboard.purchases?.amount
              )}
            </strong>

            <small>
              {formatNumber(
                dashboard.purchases?.count
              )} Purchases
            </small>
          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-icon">SR</div>

          <div>
            <span>Sales Returns</span>

            <strong>
              {formatCurrency(
                dashboard.sales_returns?.amount
              )}
            </strong>

            <small>
              {formatNumber(
                dashboard.sales_returns?.count
              )} Returns
            </small>
          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-icon">PR</div>

          <div>
            <span>Purchase Returns</span>

            <strong>
              {formatCurrency(
                dashboard.purchase_returns?.amount
              )}
            </strong>

            <small>
              {formatNumber(
                dashboard.purchase_returns?.count
              )} Returns
            </small>
          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-icon">S</div>

          <div>
            <span>Stock Value</span>

            <strong>
              {formatCurrency(
                dashboard.stock?.value
              )}
            </strong>

            <small>
              Qty:{" "}
              {formatNumber(
                dashboard.stock?.quantity
              )}
            </small>
          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-icon">A</div>

          <div>
            <span>Account Balance</span>

            <strong>
              {formatCurrency(
                dashboard.accounts?.balance
              )}
            </strong>

            <small>
              Current Balance
            </small>
          </div>
        </div>

      </div>


      {/* ======================================================
          REPORT NAVIGATION
          ====================================================== */}

      <div className="report-navigation">

        <button
          className={
            activeReport === "sales"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("sales")
          }
        >
          Sales
        </button>

        <button
          className={
            activeReport === "sales-returns"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport(
              "sales-returns"
            )
          }
        >
          Sales Returns
        </button>

        <button
          className={
            activeReport === "purchases"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("purchases")
          }
        >
          Purchases
        </button>

        <button
          className={
            activeReport === "purchase-returns"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport(
              "purchase-returns"
            )
          }
        >
          Purchase Returns
        </button>

        <button
          className={
            activeReport === "stock"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("stock")
          }
        >
          Stock
        </button>

        <button
          className={
            activeReport === "accounts"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("accounts")
          }
        >
          Accounts
        </button>

        <button
          className={
            activeReport === "outstanding"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("outstanding")
          }
        >
          Outstanding
        </button>

        <button
          className={
            activeReport === "party-ledger"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("party-ledger")
          }
        >
          Party Ledger
        </button>

        <button
          className={
            activeReport === "employees"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveReport("employees")
          }
        >
          Employees
        </button>

      </div>


      {/* ======================================================
          SALES REPORT
          ====================================================== */}

      {activeReport === "sales" && (
        <section className="report-section">

          <h2>Sales Report</h2>

          <div className="report-filters">

            <input
              type="date"
              value={salesFilters.from_date}
              onChange={(e) =>
                setSalesFilters({
                  ...salesFilters,
                  from_date:
                    e.target.value,
                })
              }
            />

            <input
              type="date"
              value={salesFilters.to_date}
              onChange={(e) =>
                setSalesFilters({
                  ...salesFilters,
                  to_date:
                    e.target.value,
                })
              }
            />

            <select
              value={salesFilters.party_id}
              onChange={(e) =>
                setSalesFilters({
                  ...salesFilters,
                  party_id:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Parties
              </option>

              {parties.map((party) => (
                <option
                  key={party.id}
                  value={party.id}
                >
                  {party.name}
                </option>
              ))}
            </select>

            <select
              value={salesFilters.status}
              onChange={(e) =>
                setSalesFilters({
                  ...salesFilters,
                  status:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Status
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="PARTIALLY_DISPATCHED">
                Partially Dispatched
              </option>

              <option value="FULLY_DISPATCHED">
                Fully Dispatched
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <button
              onClick={loadSalesReport}
              className="apply-btn"
            >
              Apply
            </button>

          </div>


          <div className="report-summary">

            <div>
              <span>Orders</span>
              <strong>
                {formatNumber(
                  salesSummary.total_orders
                )}
              </strong>
            </div>

            <div>
              <span>Quantity</span>
              <strong>
                {formatNumber(
                  salesSummary.total_quantity
                )}
              </strong>
            </div>

            <div>
              <span>Sales</span>
              <strong>
                {formatCurrency(
                  salesSummary.total_amount
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Order No.</th>
                  <th>PO Number</th>
                  <th>Party</th>
                  <th>Date</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {loadingSales ? (
                  <tr>
                    <td colSpan="8">
                      Loading...
                    </td>
                  </tr>
                ) : salesReport.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  salesReport.map(
                    (item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>

                        <td>
                          {item.order_no ||
                            "-"}
                        </td>

                        <td>
                          {item.po_number ||
                            "-"}
                        </td>

                        <td>
                          {item.party_name ||
                            "-"}
                        </td>

                        <td>
                          {formatDate(
                            item.order_date
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            item.total_quantity
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.total_amount
                          )}
                        </td>

                        <td>
                          {formatStatus(
                            item.status
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          SALES RETURNS
          ====================================================== */}

      {activeReport === "sales-returns" && (
        <section className="report-section">

          <h2>Sales Return Report</h2>

          <div className="report-filters">

            <input
              type="date"
              value={
                salesReturnFilters.from_date
              }
              onChange={(e) =>
                setSalesReturnFilters({
                  ...salesReturnFilters,
                  from_date:
                    e.target.value,
                })
              }
            />

            <input
              type="date"
              value={
                salesReturnFilters.to_date
              }
              onChange={(e) =>
                setSalesReturnFilters({
                  ...salesReturnFilters,
                  to_date:
                    e.target.value,
                })
              }
            />

            <select
              value={
                salesReturnFilters.party_id
              }
              onChange={(e) =>
                setSalesReturnFilters({
                  ...salesReturnFilters,
                  party_id:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Parties
              </option>

              {parties.map((party) => (
                <option
                  key={party.id}
                  value={party.id}
                >
                  {party.name}
                </option>
              ))}
            </select>

            <select
              value={
                salesReturnFilters.status
              }
              onChange={(e) =>
                setSalesReturnFilters({
                  ...salesReturnFilters,
                  status:
                    e.target.value,
                })
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

            <button
              onClick={loadSalesReturns}
              className="apply-btn"
            >
              Apply
            </button>

          </div>


          <div className="report-summary">

            <div>
              <span>Total Returns</span>

              <strong>
                {formatNumber(
                  salesReturnSummary.count
                )}
              </strong>
            </div>

            <div>
              <span>Return Amount</span>

              <strong>
                {formatCurrency(
                  salesReturnSummary.amount
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Return No.</th>
                  <th>Order No.</th>
                  <th>Party</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {loadingSalesReturns ? (
                  <tr>
                    <td colSpan="8">
                      Loading...
                    </td>
                  </tr>
                ) : salesReturns.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  salesReturns.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.return_no ||
                            "-"}
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
                          {formatDate(
                            item.return_date
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.total_amount
                          )}
                        </td>

                        <td>
                          {item.reason ||
                            "-"}
                        </td>

                        <td>
                          {formatStatus(
                            item.status
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          PURCHASE REPORT
          ====================================================== */}

      {activeReport === "purchases" && (
        <section className="report-section">

          <h2>Purchase Report</h2>

          <div className="report-filters">

            <input
              type="date"
              value={
                purchaseFilters.from_date
              }
              onChange={(e) =>
                setPurchaseFilters({
                  ...purchaseFilters,
                  from_date:
                    e.target.value,
                })
              }
            />

            <input
              type="date"
              value={
                purchaseFilters.to_date
              }
              onChange={(e) =>
                setPurchaseFilters({
                  ...purchaseFilters,
                  to_date:
                    e.target.value,
                })
              }
            />

            <select
              value={
                purchaseFilters.party_id
              }
              onChange={(e) =>
                setPurchaseFilters({
                  ...purchaseFilters,
                  party_id:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Suppliers
              </option>

              {parties.map((party) => (
                <option
                  key={party.id}
                  value={party.id}
                >
                  {party.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadPurchaseReport}
              className="apply-btn"
            >
              Apply
            </button>

          </div>


          <div className="report-summary">

            <div>
              <span>Purchases</span>

              <strong>
                {formatNumber(
                  purchaseSummary.count
                )}
              </strong>
            </div>

            <div>
              <span>Quantity</span>

              <strong>
                {formatNumber(
                  purchaseSummary.quantity
                )}
              </strong>
            </div>

            <div>
              <span>Total Amount</span>

              <strong>
                {formatCurrency(
                  purchaseSummary.amount
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Purchase No.</th>
                  <th>Supplier</th>
                  <th>Purchase Date</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {loadingPurchases ? (
                  <tr>
                    <td colSpan="7">
                      Loading...
                    </td>
                  </tr>
                ) : purchaseReport.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  purchaseReport.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.purchase_no ||
                            "-"}
                        </td>

                        <td>
                          {item.supplier_name ||
                            item.party_name ||
                            "-"}
                        </td>

                        <td>
                          {formatDate(
                            item.purchase_date
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            item.total_quantity
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.total_amount
                          )}
                        </td>

                        <td>
                          {formatStatus(
                            item.status
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          PURCHASE RETURNS
          ====================================================== */}

      {activeReport === "purchase-returns" && (
        <section className="report-section">

          <h2>Purchase Return Report</h2>

          <div className="report-filters">

            <input
              type="date"
              value={
                purchaseReturnFilters.from_date
              }
              onChange={(e) =>
                setPurchaseReturnFilters({
                  ...purchaseReturnFilters,
                  from_date:
                    e.target.value,
                })
              }
            />

            <input
              type="date"
              value={
                purchaseReturnFilters.to_date
              }
              onChange={(e) =>
                setPurchaseReturnFilters({
                  ...purchaseReturnFilters,
                  to_date:
                    e.target.value,
                })
              }
            />

            <select
              value={
                purchaseReturnFilters.status
              }
              onChange={(e) =>
                setPurchaseReturnFilters({
                  ...purchaseReturnFilters,
                  status:
                    e.target.value,
                })
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

            <button
              onClick={loadPurchaseReturns}
              className="apply-btn"
            >
              Apply
            </button>

          </div>


          <div className="report-summary">

            <div>
              <span>Total Returns</span>

              <strong>
                {formatNumber(
                  purchaseReturnSummary.count
                )}
              </strong>
            </div>

            <div>
              <span>Return Amount</span>

              <strong>
                {formatCurrency(
                  purchaseReturnSummary.amount
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Return ID</th>
                  <th>Purchase ID</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {loadingPurchaseReturns ? (
                  <tr>
                    <td colSpan="7">
                      Loading...
                    </td>
                  </tr>
                ) : purchaseReturns.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  purchaseReturns.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.id}
                        </td>

                        <td>
                          {item.purchase_id ||
                            "-"}
                        </td>

                        <td>
                          {item.supplier_name ||
                            "-"}
                        </td>

                        <td>
                          {formatDate(
                            item.return_date
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.total_amount
                          )}
                        </td>

                        <td>
                          {formatStatus(
                            item.status
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          STOCK REPORT
          ====================================================== */}

      {activeReport === "stock" && (
        <section className="report-section">

          <h2>Stock Report</h2>

          <div className="report-summary">

            <div>
              <span>Total Quantity</span>

              <strong>
                {formatNumber(
                  stockSummary.quantity
                )}
              </strong>
            </div>

            <div>
              <span>Total Stock Value</span>

              <strong>
                {formatCurrency(
                  stockSummary.value
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Purchase Rate</th>
                  <th>Sale Rate</th>
                  <th>Stock Value</th>
                </tr>
              </thead>

              <tbody>

                {loadingStock ? (
                  <tr>
                    <td colSpan="7">
                      Loading...
                    </td>
                  </tr>
                ) : stockReport.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No stock records found.
                    </td>
                  </tr>
                ) : (
                  stockReport.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.product_name ||
                            "-"}
                        </td>

                        <td>
                          {item.sku || "-"}
                        </td>

                        <td>
                          {formatNumber(
                            item.current_stock
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.purchase_rate
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.sale_rate
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.stock_value
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          ACCOUNTS
          ====================================================== */}

      {activeReport === "accounts" && (
        <section className="report-section">

          <h2>Accounts Report</h2>

          <div className="report-summary">

            <div>
              <span>Total Credit</span>

              <strong>
                {formatCurrency(
                  accountSummary.credit
                )}
              </strong>
            </div>

            <div>
              <span>Total Debit</span>

              <strong>
                {formatCurrency(
                  accountSummary.debit
                )}
              </strong>
            </div>

            <div>
              <span>Balance</span>

              <strong>
                {formatCurrency(
                  accountSummary.balance
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Transaction No.</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>

              <tbody>

                {loadingAccounts ? (
                  <tr>
                    <td colSpan="8">
                      Loading...
                    </td>
                  </tr>
                ) : accountReport.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      No account transactions found.
                    </td>
                  </tr>
                ) : (
                  accountReport.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {formatDate(
                            item.transaction_date
                          )}
                        </td>

                        <td>
                          {item.transaction_no ||
                            "-"}
                        </td>

                        <td>
                          {item.account_name ||
                            "-"}
                        </td>

                        <td>
                          {item.transaction_type ||
                            "-"}
                        </td>

                        <td>
                          {item.category ||
                            "-"}
                        </td>

                        <td>
                          {formatCurrency(
                            item.amount
                          )}
                        </td>

                        <td>
                          {item.reference_no ||
                            "-"}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          PARTY OUTSTANDING
          ====================================================== */}

      {activeReport === "outstanding" && (
        <section className="report-section">

          <h2>Party Outstanding</h2>

          <div className="report-summary">

            <div>
              <span>Total Debit</span>

              <strong>
                {formatCurrency(
                  outstandingSummary.debit
                )}
              </strong>
            </div>

            <div>
              <span>Total Credit</span>

              <strong>
                {formatCurrency(
                  outstandingSummary.credit
                )}
              </strong>
            </div>

            <div>
              <span>Outstanding</span>

              <strong>
                {formatCurrency(
                  outstandingSummary.outstanding
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Party</th>
                  <th>Mobile</th>
                  <th>Opening Balance</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Outstanding</th>
                </tr>
              </thead>

              <tbody>

                {loadingOutstanding ? (
                  <tr>
                    <td colSpan="7">
                      Loading...
                    </td>
                  </tr>
                ) : partyOutstanding.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No outstanding records found.
                    </td>
                  </tr>
                ) : (
                  partyOutstanding.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.name ||
                            item.party_name ||
                            "-"}
                        </td>

                        <td>
                          {item.mobile ||
                            "-"}
                        </td>

                        <td>
                          {formatCurrency(
                            item.opening_balance
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.debit
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.credit
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.outstanding
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          PARTY LEDGER
          ====================================================== */}

      {activeReport === "party-ledger" && (
        <section className="report-section">

          <h2>Party Ledger</h2>

          <div className="report-filters">

            <select
              value={
                partyLedgerFilters.party_id
              }
              onChange={(e) =>
                setPartyLedgerFilters({
                  ...partyLedgerFilters,
                  party_id:
                    e.target.value,
                })
              }
            >

              <option value="">
                Select Party
              </option>

              {parties.map((party) => (
                <option
                  key={party.id}
                  value={party.id}
                >
                  {party.name}
                </option>
              ))}

            </select>

            <input
              type="date"
              value={
                partyLedgerFilters.from_date
              }
              onChange={(e) =>
                setPartyLedgerFilters({
                  ...partyLedgerFilters,
                  from_date:
                    e.target.value,
                })
              }
            />

            <input
              type="date"
              value={
                partyLedgerFilters.to_date
              }
              onChange={(e) =>
                setPartyLedgerFilters({
                  ...partyLedgerFilters,
                  to_date:
                    e.target.value,
                })
              }
            />

            <button
              className="apply-btn"
              onClick={loadPartyLedger}
            >
              View Ledger
            </button>

          </div>


          <div className="report-summary">

            <div>
              <span>Debit</span>

              <strong>
                {formatCurrency(
                  partyLedgerSummary.debit
                )}
              </strong>
            </div>

            <div>
              <span>Credit</span>

              <strong>
                {formatCurrency(
                  partyLedgerSummary.credit
                )}
              </strong>
            </div>

            <div>
              <span>Balance</span>

              <strong>
                {formatCurrency(
                  partyLedgerSummary.balance
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>

              <tbody>

                {loadingPartyLedger ? (
                  <tr>
                    <td colSpan="7">
                      Loading...
                    </td>
                  </tr>
                ) : partyLedger.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      Select a party to view ledger.
                    </td>
                  </tr>
                ) : (
                  partyLedger.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {formatDate(
                            item.transaction_date ||
                              item.date
                          )}
                        </td>

                        <td>
                          {item.reference_no ||
                            item.reference ||
                            "-"}
                        </td>

                        <td>
                          {item.description ||
                            "-"}
                        </td>

                        <td>
                          {formatCurrency(
                            item.debit
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.credit
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.balance
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {/* ======================================================
          EMPLOYEE REPORT
          ====================================================== */}

      {activeReport === "employees" && (
        <section className="report-section">

          <h2>Employee Salary & Expense Report</h2>

          <div className="report-summary">

            <div>
              <span>Total Salary</span>

              <strong>
                {formatCurrency(
                  employeeSummary.salary
                )}
              </strong>
            </div>

            <div>
              <span>Expenses</span>

              <strong>
                {formatCurrency(
                  employeeSummary.expenses
                )}
              </strong>
            </div>

            <div>
              <span>Deductions</span>

              <strong>
                {formatCurrency(
                  employeeSummary.deductions
                )}
              </strong>
            </div>

            <div>
              <span>Net</span>

              <strong>
                {formatCurrency(
                  employeeSummary.net
                )}
              </strong>
            </div>

          </div>


          <div className="report-table-container">

            <table className="report-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Salary</th>
                  <th>Expenses</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                </tr>
              </thead>

              <tbody>

                {loadingEmployees ? (
                  <tr>
                    <td colSpan="6">
                      Loading...
                    </td>
                  </tr>
                ) : employeeReport.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  employeeReport.map(
                    (item, index) => (
                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.employee_name ||
                            item.name ||
                            "-"}
                        </td>

                        <td>
                          {formatCurrency(
                            item.salary
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.expenses
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.deductions
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            item.net_salary ||
                              item.net
                          )}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}

    </div>
  );
};

export default Reports;