import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/partyLedger.css";

import {
  getParties,
  getPartyLedger,
} from "../../api/partyLedgerApi";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

const PartyLedger = () => {
  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] =
    useState("");

  const [ledger, setLedger] = useState(null);

  const [loadingParties, setLoadingParties] =
    useState(true);

  const [loadingLedger, setLoadingLedger] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("ALL");

  /*
  ============================================================
  LOAD PARTIES
  ============================================================
  */

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      setLoadingParties(true);
      setError("");

      const response = await getParties();

      if (response.success) {
        setParties(response.data || []);
      } else {
        setParties([]);

        setError(
          response.message ||
            "Failed to load parties"
        );
      }
    } catch (err) {
      console.error(
        "Party loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load parties"
      );

      setParties([]);
    } finally {
      setLoadingParties(false);
    }
  };

  /*
  ============================================================
  LOAD PARTY LEDGER
  ============================================================
  */

  const handlePartyChange = async (
    partyId
  ) => {
    setSelectedPartyId(partyId);

    setLedger(null);

    setSearch("");
    setTypeFilter("ALL");

    if (!partyId) return;

    try {
      setLoadingLedger(true);
      setError("");

      const response =
        await getPartyLedger(partyId);

      if (response.success) {
        setLedger(response.data);
      } else {
        setError(
          response.message ||
            "Failed to load party ledger"
        );
      }
    } catch (err) {
      console.error(
        "Ledger loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load party ledger"
      );
    } finally {
      setLoadingLedger(false);
    }
  };

  /*
  ============================================================
  FILTER TRANSACTIONS
  ============================================================
  */

  const filteredTransactions =
    useMemo(() => {
      if (!ledger?.transactions) {
        return [];
      }

      const searchText =
        search.trim().toLowerCase();

      return ledger.transactions.filter(
        (transaction) => {
          const matchesSearch =
            !searchText ||
            String(
              transaction.transaction_no ||
                ""
            )
              .toLowerCase()
              .includes(searchText) ||
            String(
              transaction.description || ""
            )
              .toLowerCase()
              .includes(searchText) ||
            String(
              transaction.reference_no || ""
            )
              .toLowerCase()
              .includes(searchText);

          const matchesType =
            typeFilter === "ALL" ||
            transaction.type ===
              typeFilter;

          return (
            matchesSearch &&
            matchesType
          );
        }
      );
    }, [
      ledger,
      search,
      typeFilter,
    ]);

  /*
  ============================================================
  FORMATTERS
  ============================================================
  */

  const formatCurrency = (value) => {
    return Number(
      value || 0
    ).toLocaleString("en-IN", {
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

    return date.toLocaleDateString(
      "en-IN"
    );
  };

  /*
  ============================================================
  PRINT
  ============================================================
  */

  const handlePrint = () => {
    window.print();
  };

  /*
  ============================================================
  TABLE COLUMNS
  ============================================================
  */

  const columns = useMemo(
    () => [
      {
        key: "date",
        label: "Date",

        render: (value) =>
          formatDate(value),
      },

      {
        key: "transaction_no",
        label: "Transaction No.",

        render: (value) => (
          <strong>
            {value || "-"}
          </strong>
        ),
      },

      {
        key: "description",
        label: "Description",

        render: (
          value,
          transaction
        ) => (
          <div className="ledger-description">
            <span>
              {value || "-"}
            </span>

            {transaction.source && (
              <small>
                {transaction.source}
              </small>
            )}
          </div>
        ),
      },

      {
        key: "reference_no",
        label: "Reference",

        render: (value) =>
          value || "-",
      },

      {
        key: "debit",
        label: "Debit",
        className:
          "amount-column debit-text",

        render: (value) =>
          value
            ? `₹ ${formatCurrency(
                value
              )}`
            : "-",
      },

      {
        key: "credit",
        label: "Credit",
        className:
          "amount-column credit-text",

        render: (value) =>
          value
            ? `₹ ${formatCurrency(
                value
              )}`
            : "-",
      },

      {
        key: "running_balance",
        label: "Balance",
        className:
          "amount-column",

        render: (value) => {
          const balance =
            Number(value || 0);

          return (
            <div>
              <strong>
                ₹{" "}
                {formatCurrency(
                  Math.abs(balance)
                )}
              </strong>

              <small
                className={
                  balance > 0
                    ? "debit-text"
                    : balance < 0
                    ? "credit-text"
                    : ""
                }
              >
                {balance > 0
                  ? "Dr"
                  : balance < 0
                  ? "Cr"
                  : ""}
              </small>
            </div>
          );
        },
      },
    ],
    []
  );

  /*
  ============================================================
  RESET FILTERS
  ============================================================
  */

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
  };

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="party-ledger-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="party-ledger-header">

        <div>
          <h1>Party Ledger</h1>

          <p>
            View party-wise sales,
            returns and outstanding
            balances.
          </p>
        </div>

        {ledger && (
          <button
            type="button"
            className="party-ledger-print-btn"
            onClick={handlePrint}
          >
            Print Ledger
          </button>
        )}

      </div>


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="party-ledger-alert error">
          {error}
        </div>
      )}


      {/* =====================================================
          PARTY SELECTION
      ====================================================== */}

      <div className="party-ledger-selection-card">

        <div className="party-ledger-selection-field">

          <label>
            Select Party
          </label>

          <select
            value={selectedPartyId}
            onChange={(event) =>
              handlePartyChange(
                event.target.value
              )
            }
            disabled={
              loadingParties
            }
          >
            <option value="">
              {loadingParties
                ? "Loading parties..."
                : "Select a party"}
            </option>

            {parties.map((party) => (
              <option
                key={party.id}
                value={party.id}
              >
                {party.name}

                {party.party_code
                  ? ` (${party.party_code})`
                  : ""}
              </option>
            ))}
          </select>

        </div>


        {ledger?.party && (
          <div className="party-ledger-party-info">

            <strong>
              {ledger.party.name}
            </strong>

            {ledger.party.mobile && (
              <span>
                Mobile:{" "}
                {ledger.party.mobile}
              </span>
            )}

            {ledger.party.gst_no && (
              <span>
                GST:{" "}
                {ledger.party.gst_no}
              </span>
            )}

          </div>
        )}

      </div>


      {/* =====================================================
          PARTY LOADING
      ====================================================== */}

      {loadingParties && (
        <LoadingState
          message="Loading parties..."
        />
      )}


      {/* =====================================================
          LEDGER LOADING
      ====================================================== */}

      {loadingLedger && (
        <LoadingState
          message="Loading party ledger..."
        />
      )}


      {/* =====================================================
          NO PARTY SELECTED
      ====================================================== */}

      {!loadingParties &&
        !loadingLedger &&
        !selectedPartyId && (
          <EmptyState
            title="Select a party"
            message="Select a party above to view its complete ledger."
          />
        )}


      {/* =====================================================
          LEDGER
      ====================================================== */}

      {ledger && !loadingLedger && (
        <>

          {/* =================================================
              SUMMARY
          ================================================== */}

          <div className="party-ledger-summary">

            <div className="party-ledger-summary-card">

              <span>
                Opening Balance
              </span>

              <strong>
                ₹{" "}
                {formatCurrency(
                  ledger.party
                    .opening_balance
                )}
              </strong>

              <small
                className={
                  ledger.party
                    .opening_balance_type ===
                  "DEBIT"
                    ? "debit-text"
                    : "credit-text"
                }
              >
                {
                  ledger.party
                    .opening_balance_type
                }
              </small>

            </div>


            <div className="party-ledger-summary-card">

              <span>
                Total Sales
              </span>

              <strong className="debit-text">
                ₹{" "}
                {formatCurrency(
                  ledger.summary
                    .total_debit
                )}
              </strong>

              <small>
                Debit
              </small>

            </div>


            <div className="party-ledger-summary-card">

              <span>
                Total Returns
              </span>

              <strong className="credit-text">
                ₹{" "}
                {formatCurrency(
                  ledger.summary
                    .total_credit
                )}
              </strong>

              <small>
                Credit
              </small>

            </div>


            <div className="party-ledger-summary-card closing">

              <span>
                Closing Balance
              </span>

              <strong>
                ₹{" "}
                {formatCurrency(
                  ledger.summary
                    .closing_balance
                )}
              </strong>

              <small
                className={
                  ledger.summary
                    .balance_type ===
                  "DEBIT"
                    ? "debit-text"
                    : ledger.summary
                        .balance_type ===
                      "CREDIT"
                    ? "credit-text"
                    : ""
                }
              >
                {
                  ledger.summary
                    .balance_type
                }
              </small>

            </div>

          </div>


          {/* =================================================
              COMMON FILTER BAR
          ================================================== */}

          <TableFilterBar
            search={search}
            onSearchChange={
              setSearch
            }
            searchPlaceholder="Search transaction no. or description..."
            filters={[
              {
                name: "type",
                label: "Transaction Type",
                type: "select",
                placeholder:
                  "All Types",
                options: [
                  {
                    value: "DEBIT",
                    label: "Debit",
                  },
                  {
                    value: "CREDIT",
                    label: "Credit",
                  },
                ],
              },
            ]}
            values={{
              type: typeFilter === "ALL"
                ? ""
                : typeFilter,
            }}
            onChange={(values) => {
              setTypeFilter(
                values.type || "ALL"
              );
            }}
            onReset={
              resetFilters
            }
          />


          {/* =================================================
              TRANSACTION COUNT
          ================================================== */}

          <div className="party-ledger-filter-count">
            Showing{" "}
            <strong>
              {
                filteredTransactions.length
              }
            </strong>{" "}
            transaction
            {filteredTransactions.length !==
            1
              ? "s"
              : ""}
          </div>


          {/* =================================================
              TABLE
          ================================================== */}

          <div className="party-ledger-table-card">

            <div className="party-ledger-table-header">

              <div>
                <h2>
                  Ledger Transactions
                </h2>

                <span>
                  {
                    ledger.party.name
                  }
                </span>
              </div>

            </div>


            {filteredTransactions.length ===
            0 ? (
              <EmptyState
                title="No transactions found"
                message={
                  search ||
                  typeFilter !==
                    "ALL"
                    ? "Try changing your search or filters."
                    : "This party does not have any ledger transactions."
                }
                actionLabel={
                  search ||
                  typeFilter !==
                    "ALL"
                    ? "Reset Filters"
                    : ""
                }
                onAction={
                  search ||
                  typeFilter !==
                    "ALL"
                    ? resetFilters
                    : undefined
                }
              />
            ) : (
              <CommonTable
                columns={columns}
                data={
                  filteredTransactions
                }
                rowKey="id"
              />
            )}


            {/* =================================================
                FOOTER TOTAL
            ================================================== */}

            <div className="party-ledger-table-footer">

              <div>
                Total Debit:

                <strong className="debit-text">
                  ₹{" "}
                  {formatCurrency(
                    ledger.summary
                      .total_debit
                  )}
                </strong>
              </div>


              <div>
                Total Credit:

                <strong className="credit-text">
                  ₹{" "}
                  {formatCurrency(
                    ledger.summary
                      .total_credit
                  )}
                </strong>
              </div>


              <div>
                Closing:

                <strong>
                  ₹{" "}
                  {formatCurrency(
                    ledger.summary
                      .closing_balance
                  )}
                </strong>

                <span
                  className={
                    ledger.summary
                      .balance_type ===
                    "DEBIT"
                      ? "debit-text"
                      : "credit-text"
                  }
                >
                  {" "}
                  {
                    ledger.summary
                      .balance_type
                  }
                </span>

              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
};

export default PartyLedger;