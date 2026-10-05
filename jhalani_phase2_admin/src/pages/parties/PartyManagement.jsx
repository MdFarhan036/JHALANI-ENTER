import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/PartyManagement.css";

import MasterModal from "../../components/common/Modal";
import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import api from "../../api/axios";

const EMPTY_FORM = {
  party_code: "",
  name: "",
  contact_person: "",
  mobile: "",
  alternate_mobile: "",
  email: "",
  gst_no: "",
  billing_address: "",
  delivery_address: "",
  city: "",
  state: "",
  pincode: "",
  credit_limit: "",
  opening_balance: "",
  opening_balance_type: "DEBIT",
  remarks: "",
  status: 1,
};

export default function PartyManagement() {
  const [parties, setParties] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedParty, setSelectedParty] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  /*
  ============================================================
  FETCH PARTIES
  ============================================================
  */

  const fetchParties = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/parties", {
        params: {
          search: search.trim(),
          status: statusFilter,
        },
      });

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load parties"
        );
      }

      setParties(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(
        "Fetch parties error:",
        err
      );

      setParties([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load parties"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [search, statusFilter]);

  /*
  ============================================================
  OPEN ADD
  ============================================================
  */

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
    });
    setError("");
    setShowModal(true);
  };

  /*
  ============================================================
  OPEN EDIT
  ============================================================
  */

  const openEditModal = async (id) => {
    try {
      setError("");

      const response = await api.get(
        `/parties/${id}`
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load party"
        );
      }

      const party = result.data;

      setEditingId(id);

      setForm({
        party_code:
          party.party_code || "",

        name:
          party.name || "",

        contact_person:
          party.contact_person || "",

        mobile:
          party.mobile || "",

        alternate_mobile:
          party.alternate_mobile || "",

        email:
          party.email || "",

        gst_no:
          party.gst_no || "",

        billing_address:
          party.billing_address || "",

        delivery_address:
          party.delivery_address || "",

        city:
          party.city || "",

        state:
          party.state || "",

        pincode:
          party.pincode || "",

        credit_limit:
          party.credit_limit ?? "",

        opening_balance:
          party.opening_balance ?? "",

        opening_balance_type:
          party.opening_balance_type ||
          "DEBIT",

        remarks:
          party.remarks || "",

        status:
          party.status === undefined
            ? 1
            : party.status,
      });

      setShowModal(true);
    } catch (err) {
      console.error(
        "Get party error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load party"
      );
    }
  };

  /*
  ============================================================
  VIEW PARTY
  ============================================================
  */

  const openViewModal = async (id) => {
    try {
      setError("");

      const response = await api.get(
        `/parties/${id}`
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load party"
        );
      }

      setSelectedParty(result.data);
      setShowViewModal(true);
    } catch (err) {
      console.error(
        "View party error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load party"
      );
    }
  };

  /*
  ============================================================
  CLOSE FORM
  ============================================================
  */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
    });
  };

  /*
  ============================================================
  SAVE PARTY
  ============================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name?.trim()) {
      setError("Party name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,

        name: form.name.trim(),

        credit_limit: Number(
          form.credit_limit || 0
        ),

        opening_balance: Number(
          form.opening_balance || 0
        ),

        status:
          form.status === "" ||
          form.status === undefined
            ? 1
            : Number(form.status),
      };

      const response = editingId
        ? await api.put(
            `/parties/${editingId}`,
            payload
          )
        : await api.post(
            "/parties",
            payload
          );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save party"
        );
      }

      closeModal();

      await fetchParties();
    } catch (err) {
      console.error(
        "Save party error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save party"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ============================================================
  TOGGLE STATUS
  ============================================================
  */

  const toggleStatus = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to change this party's status?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response = await api.patch(
        `/parties/${id}/status`
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to change party status"
        );
      }

      await fetchParties();
    } catch (err) {
      console.error(
        "Toggle status error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change party status"
      );
    }
  };

  /*
  ============================================================
  DELETE PARTY
  ============================================================
  */

  const deleteParty = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this party?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response = await api.delete(
        `/parties/${id}`
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete party"
        );
      }

      await fetchParties();
    } catch (err) {
      console.error(
        "Delete party error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete party"
      );
    }
  };

  /*
  ============================================================
  FORMAT CURRENCY
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
        key: "name",
        label: "Party",

        render: (
          value,
          row
        ) => (
          <div className="party-name-cell">
            <strong>
              {row.name || "-"}
            </strong>

            {row.party_code && (
              <span>
                {row.party_code}
              </span>
            )}
          </div>
        ),
      },

      {
        key: "contact_person",
        label: "Contact",

        render: (
          value,
          row
        ) => (
          <div className="party-contact-cell">
            <span>
              {row.contact_person ||
                "-"}
            </span>

            <small>
              {row.mobile || "-"}
            </small>
          </div>
        ),
      },

      {
        key: "gst_no",
        label: "GST No.",

        render: (value) =>
          value || "-",
      },

      {
        key: "city",
        label: "City",

        render: (value) =>
          value || "-",
      },

      {
        key: "opening_balance",
        label: "Opening Balance",

        render: (
          value,
          row
        ) => (
          <span
            className={
              row.opening_balance_type ===
              "CREDIT"
                ? "balance-credit"
                : "balance-debit"
            }
          >
            {row.opening_balance_type ||
              "DEBIT"}{" "}
            ₹
            {formatCurrency(
              row.opening_balance
            )}
          </span>
        ),
      },

      {
        key: "credit_limit",
        label: "Credit Limit",

        render: (value) => (
          <>
            ₹
            {formatCurrency(value)}
          </>
        ),
      },

      {
        key: "status",
        label: "Status",

        render: (
          value,
          row
        ) => (
          <button
            type="button"
            className={
              Number(row.status) === 1
                ? "status-active"
                : "status-inactive"
            }
            onClick={() =>
              toggleStatus(row.id)
            }
          >
            {Number(row.status) === 1
              ? "Active"
              : "Inactive"}
          </button>
        ),
      },

      {
        key: "actions",
        label: "Actions",
        width: "220px",

        render: (
          value,
          row
        ) => (
          <TableActions
            showView
            showEdit
            showDelete
            showStatus={false}
            onView={() =>
              openViewModal(row.id)
            }
            onEdit={() =>
              openEditModal(row.id)
            }
            onDelete={() =>
              deleteParty(row.id)
            }
          />
        ),
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
    setStatusFilter("");
  };

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="party-page">

      {/* HEADER */}

      <div className="party-header">
        <div>
          <h1>
            Party Management
          </h1>

          <p>
            Manage customers, dealers,
            distributors and other
            business parties.
          </p>
        </div>

        <button
          type="button"
          className="party-primary-btn"
          onClick={openAddModal}
        >
          + Add Party
        </button>
      </div>


      {/* ERROR */}

      {error && !showModal && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* FILTER */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code, mobile, GST or email..."
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",
            options: [
              {
                value: "1",
                label: "Active",
              },
              {
                value: "0",
                label: "Inactive",
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


      {/* SUMMARY */}

      <div className="party-count">
        <span>
          Total Parties
        </span>

        <strong>
          {parties.length}
        </strong>
      </div>


      {/* TABLE */}

      <div className="party-table-card">

        {loading ? (
          <LoadingState
            message="Loading parties..."
          />
        ) : parties.length === 0 ? (
          <EmptyState
            title="No parties found"
            message={
              search ||
              statusFilter
                ? "Try changing your search or filters."
                : "Add your first party to get started."
            }
            actionLabel={
              search ||
              statusFilter
                ? "Reset Filters"
                : "Add Party"
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
            data={parties}
            rowKey="id"
          />
        )}

      </div>


      {/* ADD / EDIT MODAL */}

      <MasterModal
        open={showModal}
        title={
          editingId
            ? "Edit Party"
            : "Add New Party"
        }
        subtitle={
          editingId
            ? "Update party information."
            : "Enter the party information below."
        }
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onClose={closeModal}
        loading={saving}
        type="party"
        error={error}
      />


      {/* VIEW MODAL */}

      {showViewModal &&
        selectedParty && (
          <div
            className="party-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowViewModal(false);
              }
            }}
          >
            <div className="party-view-modal">

              <div className="party-modal-header">

                <div>
                  <h2>
                    {
                      selectedParty.name
                    }
                  </h2>

                  <p>
                    Party Details
                  </p>
                </div>

                <button
                  type="button"
                  className="party-close-btn"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>


              <div className="party-details-grid">

                <Detail
                  label="Party Code"
                  value={
                    selectedParty.party_code
                  }
                />

                <Detail
                  label="Contact Person"
                  value={
                    selectedParty.contact_person
                  }
                />

                <Detail
                  label="Mobile"
                  value={
                    selectedParty.mobile
                  }
                />

                <Detail
                  label="Email"
                  value={
                    selectedParty.email
                  }
                />

                <Detail
                  label="GST No."
                  value={
                    selectedParty.gst_no
                  }
                />

                <Detail
                  label="Status"
                  value={
                    Number(
                      selectedParty.status
                    ) === 1
                      ? "Active"
                      : "Inactive"
                  }
                />

                <Detail
                  label="City"
                  value={
                    selectedParty.city
                  }
                />

                <Detail
                  label="State"
                  value={
                    selectedParty.state
                  }
                />

                <Detail
                  label="Pincode"
                  value={
                    selectedParty.pincode
                  }
                />

                <Detail
                  label="Credit Limit"
                  value={`₹${formatCurrency(
                    selectedParty.credit_limit
                  )}`}
                />

                <Detail
                  label="Opening Balance"
                  value={`${selectedParty.opening_balance_type || "DEBIT"} ₹${formatCurrency(
                    selectedParty.opening_balance
                  )}`}
                />

                <div className="party-detail-full">
                  <span>
                    Billing Address
                  </span>

                  <strong>
                    {
                      selectedParty.billing_address ||
                      "-"
                    }
                  </strong>
                </div>

                <div className="party-detail-full">
                  <span>
                    Delivery Address
                  </span>

                  <strong>
                    {
                      selectedParty.delivery_address ||
                      "-"
                    }
                  </strong>
                </div>

                <div className="party-detail-full">
                  <span>
                    Remarks
                  </span>

                  <strong>
                    {
                      selectedParty.remarks ||
                      "-"
                    }
                  </strong>
                </div>

              </div>


              <div className="party-modal-footer">

                <button
                  type="button"
                  className="party-secondary-btn"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="party-primary-btn"
                  onClick={() => {
                    setShowViewModal(
                      false
                    );

                    openEditModal(
                      selectedParty.id
                    );
                  }}
                >
                  Edit Party
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}


/*
============================================================
DETAIL COMPONENT
============================================================
*/

function Detail({
  label,
  value,
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value || "-"}
      </strong>
    </div>
  );
}