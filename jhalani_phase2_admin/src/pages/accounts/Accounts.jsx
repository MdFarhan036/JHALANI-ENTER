import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/master.css";


import MasterModal from "../../components/common/Modal";
import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import api from "../../api/axios";


const EMPTY_FORM = {
  account_name: "",
  account_type: "CASH",
  account_number: "",
  bank_name: "",
  opening_balance: "0",
  status: "1",
  remarks: "",
};


export default function Accounts() {

  /* ============================================================
     STATE
     ============================================================ */

  const [accounts, setAccounts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    fetchAccounts();
  }, []);


  /* ============================================================
     FETCH ACCOUNTS
     ============================================================ */

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/accounts");

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load accounts"
        );
      }

      setAccounts(
        Array.isArray(result.data)
          ? result.data
          : []
      );

    } catch (err) {
      console.error(
        "Fetch accounts error:",
        err
      );

      setAccounts([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load accounts"
      );

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     OPEN ADD MODAL
     ============================================================ */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");

    setModalOpen(true);
  };


  /* ============================================================
     OPEN EDIT MODAL
     ============================================================ */

  const openEditModal = async (account) => {
    try {
      setError("");

      const response =
        await api.get(
          `/accounts/${account.id}`
        );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load account"
        );
      }

      const data =
        result.data || account;

      setEditingId(data.id);

      setForm({
        account_name:
          data.account_name || "",

        account_type:
          data.account_type || "CASH",

        account_number:
          data.account_number || "",

        bank_name:
          data.bank_name || "",

        opening_balance: String(
          data.opening_balance ?? 0
        ),

        status: String(
          data.status ?? 1
        ),

        remarks:
          data.remarks || "",
      });

      setModalOpen(true);

    } catch (err) {
      console.error(
        "Get account error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load account"
      );
    }
  };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });
  };


  /* ============================================================
     HANDLE FORM CHANGE
     ============================================================ */

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


  /* ============================================================
     SAVE ACCOUNT
     ============================================================ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.account_name.trim()) {
      setError(
        "Account name is required"
      );
      return;
    }

    if (!form.account_type) {
      setError(
        "Account type is required"
      );
      return;
    }

    if (
      form.opening_balance === "" ||
      Number(form.opening_balance) < 0
    ) {
      setError(
        "Opening balance cannot be negative"
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,

        opening_balance: Number(
          form.opening_balance || 0
        ),

        status: Number(
          form.status
        ),
      };

      let response;

      if (editingId) {
        response =
          await api.put(
            `/accounts/${editingId}`,
            payload
          );
      } else {
        response =
          await api.post(
            "/accounts",
            payload
          );
      }

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save account"
        );
      }

      setModalOpen(false);

      setEditingId(null);

      setForm({
        ...EMPTY_FORM,
      });

      await fetchAccounts();

    } catch (err) {
      console.error(
        "Save account error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save account"
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     DELETE ACCOUNT
     ============================================================ */

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this account?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await api.delete(
          `/accounts/${id}`
        );

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete account"
        );
      }

      await fetchAccounts();

    } catch (err) {
      console.error(
        "Delete account error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete account"
      );
    }
  };


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredAccounts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return accounts;
      }

      return accounts.filter(
        (account) => {

          const accountName =
            account.account_name
              ?.toLowerCase() || "";

          const accountType =
            account.account_type
              ?.toLowerCase() || "";

          const accountNumber =
            account.account_number
              ?.toLowerCase() || "";

          const bankName =
            account.bank_name
              ?.toLowerCase() || "";

          return (
            accountName.includes(
              query
            ) ||
            accountType.includes(
              query
            ) ||
            accountNumber.includes(
              query
            ) ||
            bankName.includes(
              query
            )
          );
        }
      );
    }, [
      accounts,
      search,
    ]);


  /* ============================================================
     TOTAL BALANCE
     ============================================================ */

  const totalBalance =
    useMemo(() => {
      return accounts.reduce(
        (total, account) =>
          total +
          Number(
            account.current_balance ||
              0
          ),
        0
      );
    }, [accounts]);


  /* ============================================================
     FORMAT MONEY
     ============================================================ */

  const formatMoney = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
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
      key: "account_name",
      label: "Account",

      render: (
        value,
        row
      ) => (
        <>
          <strong>
            {row.account_name}
          </strong>

          {row.account_number && (
            <div className="table-subtext">
              A/C:{" "}
              {row.account_number}
            </div>
          )}
        </>
      ),
    },

    {
      key: "account_type",
      label: "Type",

      render: (value) => (
        <span className="account-type">
          {value || "-"}
        </span>
      ),
    },

    {
      key: "bank_name",
      label: "Bank / Details",

      render: (
        value,
        row
      ) => (
        <>
          <strong>
            {row.bank_name || "-"}
          </strong>

          {row.remarks && (
            <div className="table-subtext">
              {row.remarks}
            </div>
          )}
        </>
      ),
    },

    {
      key: "opening_balance",
      label: "Opening Balance",

      render: (value) =>
        formatMoney(value),
    },

    {
      key: "transaction_balance",
      label: "Transaction Balance",

      render: (
        value,
        row
      ) => (
        <span
          className={
            Number(
              row.transaction_balance
            ) >= 0
              ? "balance-positive"
              : "balance-negative"
          }
        >
          {formatMoney(
            row.transaction_balance
          )}
        </span>
      ),
    },

    {
      key: "current_balance",
      label: "Current Balance",

      render: (
        value,
        row
      ) => (
        <strong className="current-balance">
          {formatMoney(
            row.current_balance
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
      ) => (
        <span
          className={`status ${
            Number(row.status) === 1
              ? "active"
              : "inactive"
          }`}
        >
          {Number(row.status) === 1
            ? "Active"
            : "Inactive"}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      width: "120px",

      render: (
        value,
        row
      ) => (
        <TableActions
          showView={false}
          showEdit
          showDelete

          onEdit={() =>
            openEditModal(row)
          }

          onDelete={() =>
            handleDelete(row.id)
          }
        />
      ),
    },
  ];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="master-page">

      {/* HEADER */}

      <div className="master-header">

        <div>

          <h1>
            Accounts
          </h1>

          <p>
            Manage cash, bank, UPI
            and other business
            accounts
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Account
        </button>

      </div>


      {/* ERROR */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* SUMMARY */}

      <div className="account-summary">

        <div className="account-summary-card">

          <span>
            Total Accounts
          </span>

          <strong>
            {accounts.length}
          </strong>

        </div>


        <div className="account-summary-card">

          <span>
            Total Current Balance
          </span>

          <strong>
            {formatMoney(
              totalBalance
            )}
          </strong>

        </div>

      </div>


      {/* COMMON FILTER */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search accounts..."

        filters={[]}

        values={{}}

        onReset={() =>
          setSearch("")
        }
      />


      {/* TABLE */}

      <div className="table-card">

        {loading ? (

          <LoadingState
            message="Loading accounts..."
          />

        ) : filteredAccounts.length ===
          0 ? (

          <EmptyState
            title="No accounts found"

            message={
              search
                ? "Try changing your search."
                : "No business accounts have been created yet."
            }

            actionLabel={
              search
                ? "Clear Search"
                : "Add Account"
            }

            onAction={
              search
                ? () =>
                    setSearch("")
                : openAddModal
            }
          />

        ) : (

          <CommonTable
            columns={columns}
            data={filteredAccounts}
            rowKey="id"
          />

        )}

      </div>


      {/* ACCOUNT MODAL */}

      {modalOpen && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit Account"
                    : "Add Account"}
                </h2>

                <p>
                  {editingId
                    ? "Update account details"
                    : "Create a new business account"}
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

              {/* ACCOUNT NAME */}

              <div className="form-field">

                <label>
                  Account Name *
                </label>

                <input
                  type="text"
                  name="account_name"
                  value={
                    form.account_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. HDFC Bank Account"
                  required
                  autoFocus
                />

              </div>


              {/* ACCOUNT TYPE */}

              <div className="form-field">

                <label>
                  Account Type *
                </label>

                <select
                  name="account_type"
                  value={
                    form.account_type
                  }
                  onChange={
                    handleChange
                  }
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


              {/* ACCOUNT NUMBER + BANK */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Account Number
                  </label>

                  <input
                    type="text"
                    name="account_number"
                    value={
                      form.account_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Account number"
                  />

                </div>


                <div className="form-field">

                  <label>
                    Bank Name
                  </label>

                  <input
                    type="text"
                    name="bank_name"
                    value={
                      form.bank_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Bank name"
                  />

                </div>

              </div>


              {/* BALANCE + STATUS */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Opening Balance
                  </label>

                  <input
                    type="number"
                    name="opening_balance"
                    value={
                      form.opening_balance
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />

                </div>


                <div className="form-field">

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

                    <option value="1">
                      Active
                    </option>

                    <option value="0">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>


              {/* REMARKS */}

              <div className="form-field">

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
                  placeholder="Optional remarks"
                  rows="3"
                />

              </div>


              {/* ERROR */}

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}


              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Account"
                    : "Save Account"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}