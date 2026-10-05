import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/partyReceipt.css";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import api from "../../api/axios";

const emptyForm = {
  party_id: "",
  receipt_date: new Date()
    .toISOString()
    .split("T")[0],
  amount: "",
  payment_mode: "CASH",
  account_id: "",
  reference_no: "",
  remarks: "",
};

function PartyReceipt() {
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [form, setForm] = useState(
    emptyForm
  );

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  ============================================================
  FETCH RECEIPTS
  ============================================================
  */

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/party-receipts"
      );

      if (response.data?.success) {
        setReceipts(
          response.data.data || []
        );
      } else {
        setReceipts([]);
      }
    } catch (err) {
      console.error(
        "Fetch receipts error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load party receipts"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
  FETCH PARTIES
  ============================================================
  */

  const fetchParties = async () => {
    try {
      const response = await api.get(
        "/parties"
      );

      if (response.data?.success) {
        setParties(
          response.data.data || []
        );
      }
    } catch (err) {
      console.error(
        "Fetch parties error:",
        err
      );
    }
  };

  /*
  ============================================================
  FETCH ACCOUNTS
  ============================================================
  */

  const fetchAccounts = async () => {
    try {
      const response = await api.get(
        "/accounts"
      );

      if (response.data?.success) {
        setAccounts(
          response.data.data || []
        );
      }
    } catch (err) {
      console.error(
        "Fetch accounts error:",
        err
      );
    }
  };

  /*
  ============================================================
  INITIAL LOAD
  ============================================================
  */

  useEffect(() => {
    fetchReceipts();
    fetchParties();
    fetchAccounts();
  }, []);

  /*
  ============================================================
  INPUT CHANGE
  ============================================================
  */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");

    if (name === "payment_mode") {
      setForm((previous) => ({
        ...previous,
        payment_mode: value,
        account_id: "",
      }));
    }
  };

  /*
  ============================================================
  AVAILABLE ACCOUNTS
  ============================================================
  */

  const availableAccounts =
    useMemo(() => {
      if (
        form.payment_mode ===
        "OTHER"
      ) {
        return accounts;
      }

      return accounts.filter(
        (account) =>
          account.account_type ===
          form.payment_mode
      );
    }, [
      accounts,
      form.payment_mode,
    ]);

  /*
  ============================================================
  SUBMIT RECEIPT
  ============================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.party_id) {
      setError(
        "Please select a party."
      );
      return;
    }

    if (!form.receipt_date) {
      setError(
        "Please select receipt date."
      );
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      setError(
        "Amount must be greater than zero."
      );
      return;
    }

    if (!form.account_id) {
      setError(
        "Please select an account."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/party-receipts",
        {
          party_id: Number(
            form.party_id
          ),

          receipt_date:
            form.receipt_date,

          amount: Number(
            form.amount
          ),

          payment_mode:
            form.payment_mode,

          account_id: Number(
            form.account_id
          ),

          reference_no:
            form.reference_no.trim() ||
            null,

          remarks:
            form.remarks.trim() ||
            null,

          status: "COMPLETED",
        }
      );

      if (response.data?.success) {
        setSuccess(
          `Receipt ${
            response.data.data
              ?.receipt_no || ""
          } created successfully.`
        );

        setForm({
          ...emptyForm,
          receipt_date:
            new Date()
              .toISOString()
              .split("T")[0],
        });

        setShowForm(false);

        await fetchReceipts();
      }
    } catch (err) {
      console.error(
        "Create receipt error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to create receipt."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ============================================================
  CANCEL RECEIPT
  ============================================================
  */

  const handleCancel = async (
    id,
    receiptNo
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to cancel receipt ${receiptNo}?`
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response =
        await api.delete(
          `/party-receipts/${id}`
        );

      if (response.data?.success) {
        setSuccess(
          `Receipt ${receiptNo} cancelled successfully.`
        );

        await fetchReceipts();
      }
    } catch (err) {
      console.error(
        "Cancel receipt error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to cancel receipt."
      );
    }
  };

  /*
  ============================================================
  FILTER RECEIPTS
  ============================================================
  */

  const filteredReceipts =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return receipts.filter(
        (receipt) => {
          const matchesSearch =
            !keyword ||
            String(
              receipt.receipt_no || ""
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              receipt.party_name || ""
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              receipt.party_code || ""
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              receipt.reference_no || ""
            )
              .toLowerCase()
              .includes(keyword);

          const matchesStatus =
            statusFilter === "ALL" ||
            receipt.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      receipts,
      search,
      statusFilter,
    ]);

  /*
  ============================================================
  TOTAL
  ============================================================
  */

  const completedTotal =
    useMemo(() => {
      return filteredReceipts
        .filter(
          (receipt) =>
            receipt.status ===
            "COMPLETED"
        )
        .reduce(
          (total, receipt) =>
            total +
            Number(
              receipt.amount || 0
            ),
          0
        );
    }, [filteredReceipts]);

  /*
  ============================================================
  SUMMARY
  ============================================================
  */

  const completedCount =
    useMemo(
      () =>
        receipts.filter(
          (item) =>
            item.status ===
            "COMPLETED"
        ).length,
      [receipts]
    );

  const cancelledCount =
    useMemo(
      () =>
        receipts.filter(
          (item) =>
            item.status ===
            "CANCELLED"
        ).length,
      [receipts]
    );

  /*
  ============================================================
  FORM
  ============================================================
  */

  const openForm = () => {
    setForm({
      ...emptyForm,
      receipt_date:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setError("");
  };

  /*
  ============================================================
  RESET FILTERS
  ============================================================
  */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  /*
  ============================================================
  TABLE COLUMNS
  ============================================================
  */

  const columns = useMemo(
    () => [
      {
        key: "receipt_no",
        label: "Receipt No.",

        render: (value) => (
          <strong>
            {value || "-"}
          </strong>
        ),
      },

      {
        key: "receipt_date",
        label: "Date",

        render: (value) =>
          value
            ? new Date(
                value
              ).toLocaleDateString(
                "en-IN"
              )
            : "-",
      },

      {
        key: "party_name",
        label: "Party",

        render: (
          value,
          receipt
        ) => (
          <div className="party-cell">
            <strong>
              {value || "-"}
            </strong>

            {receipt.party_code && (
              <small>
                {receipt.party_code}
              </small>
            )}
          </div>
        ),
      },

      {
        key: "payment_mode",
        label: "Payment Mode",

        render: (value) => (
          <span className="mode-badge">
            {value || "-"}
          </span>
        ),
      },

      {
        key: "account_name",
        label: "Account",

        render: (value) =>
          value || "-",
      },

      {
        key: "reference_no",
        label: "Reference",

        render: (value) =>
          value || "-",
      },

      {
        key: "amount",
        label: "Amount",
        className:
          "amount-column",

        render: (value) => (
          <strong>
            ₹
            {Number(
              value || 0
            ).toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </strong>
        ),
      },

      {
        key: "status",
        label: "Status",

        render: (value) => (
          <span
            className={`status-badge status-${String(
              value || ""
            ).toLowerCase()}`}
          >
            {value || "-"}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Action",

        render: (
          value,
          receipt
        ) =>
          receipt.status !==
          "CANCELLED" ? (
            <TableActions
              showView={false}
              showEdit={false}
              showStatus={false}
              showMore={false}
              showDelete
              onDelete={() =>
                handleCancel(
                  receipt.id,
                  receipt.receipt_no
                )
              }
            />
          ) : (
            <span className="table-action-disabled">
              —
            </span>
          ),
      },
    ],
    []
  );

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="party-receipt-page">

      {/* HEADER */}
      <div className="page-header">

        <div>
          <h1>
            Party Receipts
          </h1>

          <p>
            Manage payments received
            from customers and parties.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={openForm}
        >
          + New Receipt
        </button>

      </div>


      {/* ALERTS */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}


      {/* SUMMARY */}

      <div className="summary-grid">

        <div className="summary-card">
          <span>
            Total Receipts
          </span>

          <strong>
            {receipts.length}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Completed
          </span>

          <strong>
            {completedCount}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Cancelled
          </span>

          <strong>
            {cancelledCount}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Filtered Amount
          </span>

          <strong>
            ₹
            {completedTotal.toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </strong>
        </div>

      </div>


      {/* COMMON FILTER BAR */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search receipt, party, code or reference..."
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder:
              "All Status",
            options: [
              {
                value: "COMPLETED",
                label: "Completed",
              },
              {
                value: "DRAFT",
                label: "Draft",
              },
              {
                value: "CANCELLED",
                label: "Cancelled",
              },
            ],
          },
        ]}
        values={{
          status:
            statusFilter === "ALL"
              ? ""
              : statusFilter,
        }}
        onChange={(values) => {
          setStatusFilter(
            values.status || "ALL"
          );
        }}
        onReset={resetFilters}
      >

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchReceipts}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </TableFilterBar>


      {/* TABLE CARD */}

      <div className="table-card">

        <div className="table-header">

          <div>
            <h2>
              Receipt Register
            </h2>

            <span>
              {filteredReceipts.length}{" "}
              record
              {filteredReceipts.length !==
              1
                ? "s"
                : ""}
            </span>
          </div>

        </div>


        {loading ? (
          <LoadingState
            message="Loading receipts..."
          />
        ) : filteredReceipts.length ===
          0 ? (
          <EmptyState
            title="No receipts found"
            message={
              search ||
              statusFilter !== "ALL"
                ? "Try changing your search or filters."
                : "Create your first party receipt to record money received."
            }
            actionLabel={
              search ||
              statusFilter !== "ALL"
                ? "Reset Filters"
                : "Create Receipt"
            }
            onAction={
              search ||
              statusFilter !== "ALL"
                ? resetFilters
                : openForm
            }
          />
        ) : (
          <CommonTable
            columns={columns}
            data={filteredReceipts}
            rowKey="id"
          />
        )}

      </div>


      {/* NEW RECEIPT MODAL */}

      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="receipt-modal">

            <div className="modal-header">

              <div>
                <h2>
                  New Party Receipt
                </h2>

                <p>
                  Record payment received
                  from a party.
                </p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                {/* PARTY */}

                <div className="form-group full-width">

                  <label>
                    Party{" "}
                    <span>*</span>
                  </label>

                  <select
                    name="party_id"
                    value={
                      form.party_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      Select Party
                    </option>

                    {parties
                      .filter(
                        (party) =>
                          Number(
                            party.status
                          ) === 1
                      )
                      .map((party) => (
                        <option
                          key={
                            party.id
                          }
                          value={
                            party.id
                          }
                        >
                          {party.name}
                          {party.party_code
                            ? ` (${party.party_code})`
                            : ""}
                        </option>
                      ))}
                  </select>

                </div>


                {/* DATE */}

                <div className="form-group">

                  <label>
                    Receipt Date{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="receipt_date"
                    value={
                      form.receipt_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                {/* AMOUNT */}

                <div className="form-group">

                  <label>
                    Amount{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={
                      form.amount
                    }
                    onChange={
                      handleChange
                    }
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />

                </div>


                {/* PAYMENT MODE */}

                <div className="form-group">

                  <label>
                    Payment Mode{" "}
                    <span>*</span>
                  </label>

                  <select
                    name="payment_mode"
                    value={
                      form.payment_mode
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="CASH">
                      Cash
                    </option>

                    <option value="BANK">
                      Bank
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>

                </div>


                {/* ACCOUNT */}

                <div className="form-group">

                  <label>
                    Account{" "}
                    <span>*</span>
                  </label>

                  <select
                    name="account_id"
                    value={
                      form.account_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      Select Account
                    </option>

                    {availableAccounts.map(
                      (account) => (
                        <option
                          key={
                            account.id
                          }
                          value={
                            account.id
                          }
                        >
                          {
                            account.account_name
                          }
                          {" - "}
                          {
                            account.account_type
                          }
                        </option>
                      )
                    )}
                  </select>

                  {availableAccounts.length ===
                    0 && (
                    <small className="field-warning">
                      No active{" "}
                      {
                        form.payment_mode
                      }{" "}
                      account found.
                    </small>
                  )}

                </div>


                {/* REFERENCE */}

                <div className="form-group">

                  <label>
                    Reference /
                    UTR / Cheque No.
                  </label>

                  <input
                    type="text"
                    name="reference_no"
                    value={
                      form.reference_no
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                  />

                </div>


                {/* REMARKS */}

                <div className="form-group full-width">

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
                    placeholder="Optional remarks..."
                  />

                </div>

              </div>


              {/* ACCOUNTING INFO */}

              <div className="accounting-note">

                <strong>
                  Accounting:
                </strong>

                <span>
                  This receipt will credit
                  the party ledger and
                  debit the selected
                  cash/bank account.
                </span>

              </div>


              {/* FORM ACTIONS */}

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Receipt"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default PartyReceipt;