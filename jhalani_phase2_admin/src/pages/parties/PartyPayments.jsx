import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/PartyManagement.css";

import api from "../../api/axios";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

const INITIAL_FORM = {
  party_id: "",
  payment_date: new Date()
    .toISOString()
    .split("T")[0],
  amount: "",
  payment_mode: "CASH",
  account_id: "",
  reference_no: "",
  remarks: "",
  status: "COMPLETED",
};

const PartyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  ============================================================
  FETCH PAYMENTS
  ============================================================
  */

  const fetchPayments = async () => {
    try {
      const response = await api.get(
        "/party-payments"
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load party payments"
        );
      }

      setPayments(
        Array.isArray(response.data.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "FETCH PAYMENTS ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load party payments"
      );

      setPayments([]);
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

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load parties"
        );
      }

      setParties(
        Array.isArray(response.data.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "FETCH PARTIES ERROR:",
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

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load accounts"
        );
      }

      setAccounts(
        Array.isArray(response.data.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "FETCH ACCOUNTS ERROR:",
        err
      );
    }
  };

  /*
  ============================================================
  LOAD ALL DATA
  ============================================================
  */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchPayments(),
        fetchParties(),
        fetchAccounts(),
      ]);
    } catch (err) {
      console.error(
        "LOAD PARTY PAYMENTS ERROR:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
  ============================================================
  FORM CHANGE
  ============================================================
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
  ============================================================
  OPEN ADD MODAL
  ============================================================
  */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...INITIAL_FORM,
      payment_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setSuccess("");

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
    setEditingId(null);

    setForm({
      ...INITIAL_FORM,
    });
  };

  /*
  ============================================================
  EDIT PAYMENT
  ============================================================
  */

  const handleEdit = async (id) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(
        `/party-payments/${id}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to load payment"
        );
      }

      const payment =
        response.data.data;

      setEditingId(payment.id);

      setForm({
        party_id:
          payment.party_id || "",

        payment_date:
          payment.payment_date
            ?.substring(0, 10) || "",

        amount:
          payment.amount || "",

        payment_mode:
          payment.payment_mode ||
          "CASH",

        account_id:
          payment.account_id || "",

        reference_no:
          payment.reference_no || "",

        remarks:
          payment.remarks || "",

        status:
          payment.status || "DRAFT",
      });

      setShowModal(true);
    } catch (err) {
      console.error(
        "EDIT PAYMENT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load payment"
      );
    }
  };

  /*
  ============================================================
  SAVE PAYMENT
  ============================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.party_id) {
      setError(
        "Please select a party."
      );
      return;
    }

    if (!form.payment_date) {
      setError(
        "Please select payment date."
      );
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      setError(
        "Please enter a valid amount."
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

      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/party-payments/${editingId}`,
          payload
        );
      } else {
        response = await api.post(
          "/party-payments",
          payload
        );
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to save payment"
        );
      }

      setSuccess(
        editingId
          ? "Payment updated successfully."
          : "Payment created successfully."
      );

      setShowModal(false);
      setEditingId(null);

      setForm({
        ...INITIAL_FORM,
      });

      await fetchPayments();
    } catch (err) {
      console.error(
        "SAVE PAYMENT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save payment"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ============================================================
  CANCEL PAYMENT
  ============================================================
  */

  const handleCancel = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this payment?"
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.put(
        `/party-payments/${id}/cancel`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to cancel payment"
        );
      }

      setSuccess(
        "Party payment cancelled successfully."
      );

      await fetchPayments();
    } catch (err) {
      console.error(
        "CANCEL PAYMENT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to cancel payment"
      );
    }
  };

  /*
  ============================================================
  FILTER
  ============================================================
  */

  const filteredPayments = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return payments.filter(
      (payment) => {
        const matchesSearch =
          !searchText ||
          payment.payment_no
            ?.toLowerCase()
            .includes(searchText) ||
          payment.party_name
            ?.toLowerCase()
            .includes(searchText) ||
          payment.reference_no
            ?.toLowerCase()
            .includes(searchText);

        const matchesStatus =
          !statusFilter ||
          payment.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    payments,
    search,
    statusFilter,
  ]);

  /*
  ============================================================
  SUMMARY
  ============================================================
  */

  const totalAmount =
    filteredPayments.reduce(
      (sum, payment) => {
        if (
          payment.status ===
          "CANCELLED"
        ) {
          return sum;
        }

        return (
          sum +
          Number(
            payment.amount || 0
          )
        );
      },
      0
    );

  const completedCount =
    filteredPayments.filter(
      (item) =>
        item.status ===
        "COMPLETED"
    ).length;

  const cancelledCount =
    filteredPayments.filter(
      (item) =>
        item.status ===
        "CANCELLED"
    ).length;

  /*
  ============================================================
  HELPERS
  ============================================================
  */

  const formatAmount = (amount) =>
    Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString("en-IN");
  };

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "COMPLETED":
        return "status-badge completed";

      case "DRAFT":
        return "status-badge draft";

      case "CANCELLED":
        return "status-badge cancelled";

      default:
        return "status-badge";
    }
  };

  /*
  ============================================================
  RESET FILTERS
  ============================================================
  */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  /*
  ============================================================
  TABLE COLUMNS
  ============================================================
  */

  const columns = useMemo(
    () => [
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
        key: "payment_no",
        label: "Payment No.",

        render: (value) => (
          <strong>
            {value || "-"}
          </strong>
        ),
      },

      {
        key: "payment_date",
        label: "Date",

        render: (value) =>
          formatDate(value),
      },

      {
        key: "party_name",
        label: "Party",

        render: (value) => (
          <strong>
            {value || "-"}
          </strong>
        ),
      },

      {
        key: "payment_mode",
        label: "Payment Mode",

        render: (value) =>
          value || "-",
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

        render: (value) => (
          <strong>
            ₹ {formatAmount(value)}
          </strong>
        ),
      },

      {
        key: "status",
        label: "Status",

        render: (value) => (
          <span
            className={getStatusClass(
              value
            )}
          >
            {value || "-"}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Actions",
        width: "180px",

        render: (
          value,
          payment
        ) => (
          <TableActions
            showView={false}
            showEdit={
              payment.status ===
              "DRAFT"
            }
            showDelete={false}
            showStatus={false}
            showMore={false}
            onEdit={() =>
              handleEdit(
                payment.id
              )
            }
          />
        ),
      },

      {
        key: "cancel",
        label: "",
        width: "100px",

        render: (
          value,
          payment
        ) =>
          payment.status !==
          "CANCELLED" ? (
            <button
              type="button"
              className="table-action-btn delete"
              onClick={() =>
                handleCancel(
                  payment.id
                )
              }
            >
              Cancel
            </button>
          ) : null,
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
    <div className="party-payments-page">

      {/* HEADER */}

      <div className="page-header">
        <div>
          <h2>
            Party Payments
          </h2>

          <p>
            Manage payments made to
            parties and suppliers.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openAddModal}
        >
          + New Payment
        </button>
      </div>


      {/* ALERTS */}

      {error && !showModal && (
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
            Total Payments
          </span>

          <strong>
            {filteredPayments.length}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Total Amount
          </span>

          <strong>
            ₹ {formatAmount(
              totalAmount
            )}
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

      </div>


      {/* COMMON FILTER */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment, party or reference..."
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",
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
          status: statusFilter,
        }}
        onChange={(values) => {
          setStatusFilter(
            values.status || ""
          );
        }}
        onReset={resetFilters}
      />


      {/* TABLE */}

      <div className="table-card">

        {loading ? (
          <LoadingState
            message="Loading party payments..."
          />
        ) : filteredPayments.length ===
          0 ? (
          <EmptyState
            title="No party payments found"
            message={
              search ||
              statusFilter
                ? "Try changing your search or filters."
                : "Create your first party payment to get started."
            }
            actionLabel={
              search ||
              statusFilter
                ? "Reset Filters"
                : "New Payment"
            }
            onAction={
              search ||
              statusFilter
                ? resetFilters
                : openAddModal
            }
          />
        ) : (
          <CommonTable
            columns={columns}
            data={filteredPayments}
            rowKey="id"
          />
        )}

      </div>


      {/* PAYMENT MODAL */}

      {showModal && (
        <div className="modal-overlay">

          <div className="payment-modal">

            <div className="modal-header">

              <div>
                <h3>
                  {editingId
                    ? "Edit Party Payment"
                    : "New Party Payment"}
                </h3>

                <p>
                  Record payment made
                  to a party.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                {/* PARTY */}

                <div className="form-group">
                  <label>
                    Party *
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

                    {parties.map(
                      (party) => (
                        <option
                          key={
                            party.id
                          }
                          value={
                            party.id
                          }
                        >
                          {party.name}
                        </option>
                      )
                    )}
                  </select>
                </div>


                {/* DATE */}

                <div className="form-group">
                  <label>
                    Payment Date *
                  </label>

                  <input
                    type="date"
                    name="payment_date"
                    value={
                      form.payment_date
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
                    Amount *
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
                    Payment Mode *
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
                    Account *
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

                    {accounts
                      .filter(
                        (account) =>
                          account.status !==
                          0
                      )
                      .map(
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
                          </option>
                        )
                      )}
                  </select>
                </div>


                {/* REFERENCE */}

                <div className="form-group">
                  <label>
                    Reference No.
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
                    placeholder="Cheque / UTR / Transaction No."
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
                    placeholder="Enter remarks..."
                  />
                </div>


                {/* STATUS */}

                {editingId && (
                  <div className="form-group">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="DRAFT">
                        Draft
                      </option>

                      <option value="COMPLETED">
                        Completed
                      </option>
                    </select>
                  </div>
                )}

              </div>


              {/* MODAL FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Payment"
                    : "Save Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default PartyPayments;