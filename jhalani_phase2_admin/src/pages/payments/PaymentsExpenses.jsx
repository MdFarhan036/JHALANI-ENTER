import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/payments.css";


import MasterModal from "../../components/common/Modal";
import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import api from "../../api/axios";


const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60000
  )
    .toISOString()
    .split("T")[0];
};


const EMPTY_FORM = {
  account_id: "",
  transaction_date: getToday(),
  transaction_type: "DEBIT",
  amount: "",
  category: "",
  description: "",
  reference_no: "",
  related_account_id: "",
  employee_id: "",
  deduct_from_salary: "0",
  salary_month: "",
};


export default function PaymentsExpenses() {

  /* ============================================================
     STATE
     ============================================================ */

  const [transactions, setTransactions] =
    useState([]);

  const [accounts, setAccounts] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [accountFilter, setAccountFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadData();
  }, []);


  /* ============================================================
     LOAD ALL DATA
     ============================================================ */

  const loadData = async () => {
    setLoading(true);
    setError("");

    const results =
      await Promise.allSettled([
        fetchTransactions(),
        fetchAccounts(),
        fetchEmployees(),
      ]);

    const failed = results.filter(
      (result) =>
        result.status === "rejected"
    );

    if (failed.length > 0) {
      console.error(
        "Payment page loading errors:",
        failed
      );

      setError(
        failed
          .map(
            (item) =>
              item.reason?.message ||
              "Failed to load data"
          )
          .join(" | ")
      );
    }

    setLoading(false);
  };


  /* ============================================================
     TRANSACTIONS
     ============================================================ */

  const fetchTransactions = async () => {
    try {
      const response = await api.get(
        "/account-transactions"
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load transactions"
        );
      }

      setTransactions(
        Array.isArray(result.data)
          ? result.data
          : []
      );

    } catch (err) {
      console.error(
        "Fetch transactions error:",
        err
      );

      setTransactions([]);

      throw err;
    }
  };


  /* ============================================================
     ACCOUNTS
     ============================================================ */

  const fetchAccounts = async () => {
    try {
      const response = await api.get(
        "/accounts"
      );

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

      throw err;
    }
  };


  /* ============================================================
     EMPLOYEES
     ============================================================ */

  const fetchEmployees = async () => {
    try {
      const response = await api.get(
        "/employees"
      );

      const result = response.data;

      if (result?.success === false) {
        throw new Error(
          result?.message ||
            "Failed to load employees"
        );
      }

      const employeeData =
        Array.isArray(result?.employees)
          ? result.employees
          : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
          ? result
          : [];

      setEmployees(employeeData);

    } catch (err) {
      console.error(
        "Fetch employees error:",
        err
      );

      setEmployees([]);

      throw err;
    }
  };


  /* ============================================================
     OPEN MODAL
     ============================================================ */

  const openAddModal = () => {
    setForm({
      ...EMPTY_FORM,
      transaction_date: getToday(),
    });

    setError("");
    setModalOpen(true);
  };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setForm({
      ...EMPTY_FORM,
      transaction_date: getToday(),
    });

    setError("");
  };


  /* ============================================================
     SUBMIT TRANSACTION
     ============================================================ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.account_id) {
      setError(
        "Please select an account."
      );
      return;
    }

    if (!form.transaction_date) {
      setError(
        "Please select transaction date."
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

    if (
      form.transaction_type ===
        "TRANSFER" &&
      !form.related_account_id
    ) {
      setError(
        "Please select the account to transfer money to."
      );
      return;
    }

    if (
      form.transaction_type ===
        "TRANSFER" &&
      String(form.account_id) ===
        String(form.related_account_id)
    ) {
      setError(
        "Source and destination accounts cannot be the same."
      );
      return;
    }

    if (
      form.deduct_from_salary === "1" &&
      !form.employee_id
    ) {
      setError(
        "Please select an employee for salary deduction."
      );
      return;
    }

    if (
      form.deduct_from_salary === "1" &&
      !form.salary_month
    ) {
      setError(
        "Please select the salary month."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,

        account_id:
          Number(form.account_id),

        amount:
          Number(form.amount),

        related_account_id:
          form.related_account_id
            ? Number(
                form.related_account_id
              )
            : null,

        employee_id:
          form.employee_id
            ? Number(form.employee_id)
            : null,

        deduct_from_salary:
          Number(
            form.deduct_from_salary
          ),

        salary_month:
          form.salary_month || null,
      };

      const response = await api.post(
        "/account-transactions",
        payload
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save transaction"
        );
      }

      setModalOpen(false);

      setForm({
        ...EMPTY_FORM,
        transaction_date: getToday(),
      });

      await Promise.allSettled([
        fetchTransactions(),
        fetchAccounts(),
      ]);

    } catch (err) {
      console.error(
        "Save transaction error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save transaction."
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     DELETE TRANSACTION
     ============================================================ */

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this transaction?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await api.delete(
          `/account-transactions/${id}`
        );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete transaction"
        );
      }

      await Promise.allSettled([
        fetchTransactions(),
        fetchAccounts(),
      ]);

    } catch (err) {
      console.error(
        "Delete transaction error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete transaction."
      );
    }
  };


  /* ============================================================
     FILTER TRANSACTIONS
     ============================================================ */

  const filteredTransactions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {

          const searchableText = [
            transaction.account_name,
            transaction.employee_name,
            transaction.name,
            transaction.category,
            transaction.description,
            transaction.reference_no,
            transaction.transaction_no,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );


          const matchesType =
            !typeFilter ||
            transaction.transaction_type ===
              typeFilter;


          const matchesAccount =
            !accountFilter ||
            String(
              transaction.account_id
            ) ===
              String(accountFilter);


          return (
            matchesSearch &&
            matchesType &&
            matchesAccount
          );
        }
      );
    }, [
      transactions,
      search,
      typeFilter,
      accountFilter,
    ]);


  /* ============================================================
     SUMMARY
     ============================================================ */

  const summary = useMemo(() => {

    let credit = 0;
    let debit = 0;

    transactions.forEach(
      (transaction) => {

        const amount =
          Number(
            transaction.amount || 0
          );

        if (
          transaction.transaction_type ===
          "CREDIT"
        ) {
          credit += amount;
        }

        if (
          transaction.transaction_type ===
          "DEBIT"
        ) {
          debit += amount;
        }
      }
    );

    return {
      credit,
      debit,
      net: credit - debit,
    };

  }, [transactions]);


  /* ============================================================
     FORMAT MONEY
     ============================================================ */

  const formatMoney = (value) =>
    Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );


  /* ============================================================
     FORMAT DATE
     ============================================================ */

  const formatDate = (value) => {

    if (!value) return "-";

    const dateString =
      String(value).slice(
        0,
        10
      );

    const parts =
      dateString.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };


  /* ============================================================
     RESET FILTERS
     ============================================================ */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setAccountFilter("");
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
      key: "transaction_date",
      label: "Date",

      render: (value) =>
        formatDate(value),
    },

    {
      key: "account_name",
      label: "Account",

      render: (
        value,
        row
      ) => (
        <strong>
          {row.account_name ||
            "-"}
        </strong>
      ),
    },

    {
      key: "transaction_type",
      label: "Type",

      render: (
        value,
        row
      ) => (
        <span
          className={`transaction-type ${String(
            row.transaction_type ||
              ""
          ).toLowerCase()}`}
        >
          {row.transaction_type ||
            "-"}
        </span>
      ),
    },

    {
      key: "category",
      label: "Category",

      render: (value) =>
        value || "-",
    },

    {
      key: "employee_name",
      label: "Employee",

      render: (
        value,
        row
      ) =>
        row.employee_name ||
        row.employee_name_full ||
        row.employee ||
        "-",
    },

    {
      key: "amount",
      label: "Amount",

      render: (
        value,
        row
      ) => (
        <strong>
          ₹
          {formatMoney(
            row.amount
          )}
        </strong>
      ),
    },

    {
      key: "deduct_from_salary",
      label: "Salary Deduction",

      render: (
        value,
        row
      ) =>
        Number(
          row.deduct_from_salary
        ) === 1 ? (
          <span className="status pending">
            Yes
          </span>
        ) : (
          <span className="muted">
            No
          </span>
        ),
    },

    {
      key: "reference_no",
      label: "Reference",

      render: (value) =>
        value || "-",
    },

    {
      key: "actions",
      label: "Actions",
      width: "110px",

      render: (
        value,
        row
      ) => (
        <TableActions
          showView={false}
          showEdit={false}
          showDelete
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
    <div className="payments-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="payments-header">

        <div>
          <h1>
            Payments / Expenses
          </h1>

          <p>
            Manage accounts, payments,
            expenses and employee salary
            deductions
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Transaction
        </button>

      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* ======================================================
          SUMMARY
          ====================================================== */}

      <div className="payment-summary">

        <div className="summary-card">
          <span>
            Total Credits
          </span>

          <strong className="credit-text">
            ₹
            {formatMoney(
              summary.credit
            )}
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Total Debits
          </span>

          <strong className="debit-text">
            ₹
            {formatMoney(
              summary.debit
            )}
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Net Movement
          </span>

          <strong>
            ₹
            {formatMoney(
              summary.net
            )}
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Accounts
          </span>

          <strong>
            {accounts.length}
          </strong>
        </div>

      </div>


      {/* ======================================================
          ACCOUNT BALANCES
          ====================================================== */}

      <div className="accounts-section">

        <div className="section-heading">

          <div>

            <h2>
              Account Balances
            </h2>

            <p>
              Current balance based on
              opening balance and
              recorded transactions
            </p>

          </div>

        </div>


        <div className="account-cards">

          {accounts.length === 0 ? (

            <EmptyState
              title="No accounts found"
              message="Create an account before recording transactions."
            />

          ) : (

            accounts.map(
              (account) => (

                <div
                  className="account-card"
                  key={account.id}
                >

                  <div className="account-card-top">

                    <div>

                      <strong>
                        {
                          account.account_name
                        }
                      </strong>

                      <span>
                        {
                          account.account_type
                        }
                      </span>

                    </div>


                    <span
                      className={
                        Number(
                          account.status
                        ) === 1
                          ? "status active"
                          : "status inactive"
                      }
                    >
                      {Number(
                        account.status
                      ) === 1
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>


                  <div className="account-balance">
                    ₹
                    {formatMoney(
                      account.current_balance
                    )}
                  </div>


                  <div className="account-details">
                    Opening: ₹
                    {formatMoney(
                      account.opening_balance
                    )}
                  </div>


                  <div className="account-details">
                    Transactions: ₹
                    {formatMoney(
                      account.transaction_balance
                    )}
                  </div>


                  {account.bank_name && (
                    <div className="account-details">
                      {
                        account.bank_name
                      }
                    </div>
                  )}

                </div>
              )
            )
          )}

        </div>

      </div>


      {/* ======================================================
          COMMON FILTER BAR
          ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search transactions..."

        filters={[
          {
            name: "type",
            label: "Type",
            type: "select",
            placeholder: "All Types",

            options: [
              {
                value: "CREDIT",
                label: "Credit",
              },
              {
                value: "DEBIT",
                label: "Debit",
              },
              {
                value: "TRANSFER",
                label: "Transfer",
              },
            ],
          },

          {
            name: "account",
            label: "Account",
            type: "select",
            placeholder: "All Accounts",

            options:
              accounts.map(
                (account) => ({
                  value: String(
                    account.id
                  ),
                  label:
                    account.account_name,
                })
              ),
          },
        ]}

        values={{
          type: typeFilter,
          account: accountFilter,
        }}

        onChange={(values) => {
          setTypeFilter(
            values.type || ""
          );

          setAccountFilter(
            values.account || ""
          );
        }}

        onReset={clearFilters}
      />


      {/* ======================================================
          TRANSACTION TABLE
          ====================================================== */}

      <div className="table-card">

        {loading ? (

          <LoadingState
            message="Loading transactions..."
          />

        ) : filteredTransactions.length ===
          0 ? (

          <EmptyState
            title="No transactions found"

            message={
              search ||
              typeFilter ||
              accountFilter
                ? "Try changing your search or filters."
                : "No payment or expense transactions have been recorded yet."
            }

            actionLabel={
              search ||
              typeFilter ||
              accountFilter
                ? "Reset Filters"
                : "Add Transaction"
            }

            onAction={
              search ||
              typeFilter ||
              accountFilter
                ? clearFilters
                : openAddModal
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


      {/* ======================================================
          COMMON MODAL
          ====================================================== */}

      <MasterModal
        open={modalOpen}

        title="Add Payment / Expense"

        subtitle="Record a credit, debit or account transfer"

        form={form}

        setForm={setForm}

        onSubmit={handleSubmit}

        onClose={closeModal}

        loading={saving}

        type="transaction"

        accounts={accounts}

        employees={employees}

        error={modalOpen ? error : ""}
      />

    </div>
  );
}