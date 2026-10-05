import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getOrders,
  getOrderById,
  createOrder,
  confirmOrder,
} from "../api/orderApi";

import { getVariants } from "../api/productVariantApi";
import api from "../api/axios";

import CommonTable from "../components/common/CommonTable";
import TableFilterBar from "../components/common/TableFilterBar";
import TableActions from "../components/common/TableActions";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";

import "../styles/master.css";
import "../styles/layout.css";
import "../styles/salesOrders.css";

import SalesOrderModal from "./SalesOrderModal";

/* ============================================================
   HELPERS
============================================================ */

const today = () =>
  new Date().toISOString().split("T")[0];

const emptyItem = () => ({
  variant_id: "",
  description: "",
  quantity: "",
  rate: "",
});

const emptyForm = () => ({
  order_source: "PARTY_ORDER",
  party_id: "",
  po_number: "",
  po_date: "",
  order_date: today(),
  reference_number: "",
  delivery_address: "",
  delivery_contact_person: "",
  delivery_contact_number: "",
  delivery_instructions: "",
  remarks: "",
  items: [emptyItem()],
});

const STATUS_OPTIONS = [
  {
    value: "DRAFT",
    label: "Draft",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
  },
  {
    value: "PARTIALLY_DISPATCHED",
    label: "Partially Dispatched",
  },
  {
    value: "FULLY_DISPATCHED",
    label: "Fully Dispatched",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

const SOURCE_OPTIONS = [
  {
    value: "PARTY_ORDER",
    label: "Party Order",
  },
  {
    value: "COMPANY_CREATED",
    label: "Created by Company",
  },
];

/* ============================================================
   COMPONENT
============================================================ */

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [variants, setVariants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [masterLoading, setMasterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [orderSource, setOrderSource] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [showView, setShowView] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState(emptyForm());

  /* ============================================================
     SUCCESS MODAL
  ============================================================ */

  const [successModal, setSuccessModal] = useState({
    open: false,
    order: null,
  });

  /* ============================================================
     LOAD ORDERS
  ============================================================ */

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrders({
        search,
        status,
        order_source: orderSource,
        page,
        limit: 20,
      });

      const result = response?.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Failed to load orders"
        );
      }

      setOrders(
        Array.isArray(result.data)
          ? result.data
          : []
      );

      setPagination(
        result.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error("Get orders error:", err);

      setOrders([]);

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    status,
    orderSource,
    page,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* ============================================================
     LOAD PARTIES
  ============================================================ */

  const loadParties = useCallback(async () => {
    const response = await api.get("/parties");

    const result = response?.data;

    if (result?.success) {
      setParties(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } else {
      setParties(
        Array.isArray(result)
          ? result
          : []
      );
    }
  }, []);

  /* ============================================================
     LOAD PRODUCT VARIANTS
  ============================================================ */

  const loadVariants = useCallback(async () => {
    try {
      const response = await getVariants();

      console.log(
        "PRODUCT VARIANTS RESPONSE:",
        response?.data
      );

      const result = response?.data;

      let variantData = [];

      if (Array.isArray(result)) {
        variantData = result;
      } else if (Array.isArray(result?.data)) {
        variantData = result.data;
      } else if (Array.isArray(result?.variants)) {
        variantData = result.variants;
      }

      console.log(
        "PRODUCT VARIANTS LOADED:",
        variantData
      );

      setVariants(variantData);

      return variantData;
    } catch (err) {
      console.error(
        "Get product variants error:",
        err
      );

      setVariants([]);

      throw err;
    }
  }, []);

  /* ============================================================
     OPEN CREATE MODAL
  ============================================================ */

  const openCreateForm = async () => {
    setError("");
    setSuccess("");

    setForm(emptyForm());

    setModalOpen(true);

    try {
      setMasterLoading(true);

      await Promise.all([
        loadParties(),
        loadVariants(),
      ]);
    } catch (err) {
      console.error(
        "Order master data error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load order master data"
      );
    } finally {
      setMasterLoading(false);
    }
  };

  const closeForm = () => {
    if (saving) return;

    setModalOpen(false);
    setForm(emptyForm());
  };

  /* ============================================================
     PARTY CHANGE
  ============================================================ */

  const handlePartyChange = (event) => {
    const partyId = event.target.value;

    const party = parties.find(
      (item) =>
        String(item.id) === String(partyId)
    );

    setForm((previous) => ({
      ...previous,

      party_id: partyId,

      delivery_address:
        party?.delivery_address ||
        party?.address ||
        "",

      delivery_contact_person:
        party?.contact_person || "",

      delivery_contact_number:
        party?.mobile ||
        party?.phone ||
        "",
    }));
  };

  /* ============================================================
     FORM CHANGE
  ============================================================ */

  const handleFormChange = (event) => {
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
     ITEM CHANGE
  ============================================================ */

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setForm((previous) => {
      const items = [...previous.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      if (field === "variant_id") {
        const variant = variants.find(
          (item) =>
            String(
              item.variant_id ?? item.id
            ) === String(value)
        );

        if (variant) {
          items[index] = {
            ...items[index],

            description:
              variant.variant_name ||
              variant.product_name ||
              "",

            rate:
              variant.sale_rate ??
              variant.current_rate ??
              variant.rate ??
              "",
          };
        }
      }

      return {
        ...previous,
        items,
      };
    });
  };

  /* ============================================================
     ADD / REMOVE ITEMS
  ============================================================ */

  const addItem = () => {
    setForm((previous) => ({
      ...previous,

      items: [
        ...previous.items,
        emptyItem(),
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((previous) => {
      if (previous.items.length <= 1) {
        return previous;
      }

      return {
        ...previous,

        items: previous.items.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
      };
    });
  };

  /* ============================================================
     TOTALS
  ============================================================ */

  const totals = useMemo(() => {
    return form.items.reduce(
      (result, item) => {
        const quantity =
          Number(item.quantity || 0);

        const rate =
          Number(item.rate || 0);

        result.quantity += quantity;
        result.amount += quantity * rate;

        return result;
      },
      {
        quantity: 0,
        amount: 0,
      }
    );
  }, [form.items]);

  /* ============================================================
     CREATE ORDER
  ============================================================ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.party_id) {
      setError("Please select a party.");
      return;
    }

    if (!form.order_date) {
      setError(
        "Please select order date."
      );
      return;
    }

    const validItems = form.items.filter(
      (item) =>
        item.variant_id &&
        Number(item.quantity) > 0
    );

    if (!validItems.length) {
      setError(
        "Add at least one valid order item."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        order_source:
          form.order_source,

        party_id:
          Number(form.party_id),

        po_number:
          form.po_number.trim() || null,

        po_date:
          form.po_date || null,

        order_date:
          form.order_date,

        reference_number:
          form.reference_number.trim() ||
          null,

        delivery_address:
          form.delivery_address.trim() ||
          null,

        delivery_contact_person:
          form.delivery_contact_person.trim() ||
          null,

        delivery_contact_number:
          form.delivery_contact_number.trim() ||
          null,

        delivery_instructions:
          form.delivery_instructions.trim() ||
          null,

        remarks:
          form.remarks.trim() || null,

        items: validItems.map(
          (item) => ({
            variant_id:
              Number(item.variant_id),

            description:
              item.description.trim() ||
              null,

            quantity:
              Number(item.quantity),

            rate:
              Number(item.rate || 0),
          })
        ),
      };

      console.log(
        "CREATE ORDER PAYLOAD:",
        payload
      );

      const response =
        await createOrder(payload);

      const result =
        response?.data;

      console.log(
        "CREATE ORDER RESPONSE:",
        result
      );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to create order"
        );
      }

      /* ========================================================
         ORDER CREATED SUCCESSFULLY
      ======================================================== */

      const createdOrder =
        result?.data || {};

      console.log(
        "ORDER CREATED:",
        createdOrder
      );

      /*
       * Open success modal
       */
      setSuccessModal({
        open: true,
        order: {
          ...createdOrder,

          /*
           * Fallback values from the form
           * in case backend doesn't return them.
           */
          party_name:
            createdOrder.party_name ||
            parties.find(
              (party) =>
                String(party.id) ===
                String(form.party_id)
            )?.name ||
            "-",

          order_date:
            createdOrder.order_date ||
            form.order_date,

          status:
            createdOrder.status ||
            "DRAFT",

          total_quantity:
            createdOrder.total_quantity ??
            totals.quantity,

          total_amount:
            createdOrder.total_amount ??
            totals.amount,
        },
      });

      /*
       * Close create form
       */
      closeForm();

      /*
       * Refresh orders table
       */
      await loadOrders();

    } catch (err) {
      console.error(
        "Create order error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to create order"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     VIEW ORDER
  ============================================================ */

  const handleView = async (order) => {
    try {
      setViewLoading(true);
      setError("");

      setSelectedOrder(null);
      setShowView(true);

      const response =
        await getOrderById(order.id);

      const result =
        response?.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to load order"
        );
      }

      setSelectedOrder(result.data);

    } catch (err) {
      console.error(
        "Get order details error:",
        err
      );

      setShowView(false);

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load order"
      );
    } finally {
      setViewLoading(false);
    }
  };

  /* ============================================================
     CONFIRM ORDER
  ============================================================ */

  const handleConfirm = async (order) => {
    if (
      !window.confirm(
        `Confirm order ${order.order_no}?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await confirmOrder(order.id);

      setSuccess(
        `Order ${order.order_no} confirmed successfully.`
      );

      await loadOrders();

      if (
        selectedOrder?.id === order.id
      ) {
        const response =
          await getOrderById(order.id);

        if (
          response?.data?.success
        ) {
          setSelectedOrder(
            response.data.data
          );
        }
      }

    } catch (err) {
      console.error(
        "Confirm order error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to confirm order"
      );
    }
  };

  /* ============================================================
     FILTERS
  ============================================================ */

  const filters = [
    {
      name: "status",
      label: "Status",
      placeholder: "All Status",
      options: STATUS_OPTIONS,
    },
    {
      name: "order_source",
      label: "Source",
      placeholder: "All Sources",
      options: SOURCE_OPTIONS,
    },
  ];

  const filterValues = {
    status,
    order_source: orderSource,
  };

  const handleFilterChange = (
    values
  ) => {
    setPage(1);

    setStatus(
      values.status || ""
    );

    setOrderSource(
      values.order_source || ""
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setOrderSource("");
    setPage(1);
  };

  /* ============================================================
     FORMATTERS
  ============================================================ */

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN"
    );
  };

  const getStatusLabel = (value) =>
    value
      ?.replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      ) || "-";

  /* ============================================================
     TABLE COLUMNS
  ============================================================ */

  const columns = [
    {
      key: "order_no",
      label: "Order No.",
      render: (value) => (
        <strong>
          {value || "-"}
        </strong>
      ),
    },

    {
      key: "party_name",
      label: "Party",
      render: (value, row) => (
        <div className="order-party-cell">
          <strong>
            {value || "-"}
          </strong>

          {row.party_code && (
            <small>
              {row.party_code}
            </small>
          )}
        </div>
      ),
    },

    {
      key: "order_source",
      label: "Source",
      render: (value) => (
        <span className="order-source-badge">
          {value ===
          "COMPANY_CREATED"
            ? "Company Created"
            : "Party Order"}
        </span>
      ),
    },

    {
      key: "po_number",
      label: "PO Number",
      render: (value) =>
        value || "-",
    },

    {
      key: "po_date",
      label: "PO Date",
      render: (value) =>
        formatDate(value),
    },

    {
      key: "order_date",
      label: "Order Date",
      render: (value) =>
        formatDate(value),
    },

    {
      key: "total_quantity",
      label: "Qty",
      render: (value) =>
        Number(value || 0).toFixed(3),
    },

    {
      key: "total_amount",
      label: "Amount",
      render: (value) =>
        `₹ ${formatMoney(value)}`,
    },

    {
      key: "pending_quantity",
      label: "Pending",
      render: (value, row) => {
        const pending = Number(
          value ??
            row.total_pending_quantity ??
            0
        );

        return (
          <strong
            className={
              pending > 0
                ? "order-pending-value"
                : "order-complete-value"
            }
          >
            {pending.toFixed(3)}
          </strong>
        );
      },
    },

    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`common-status-badge ${String(
            value || ""
          ).toLowerCase()}`}
        >
          {getStatusLabel(value)}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <TableActions
          onView={() =>
            handleView(row)
          }
          showView
          showEdit={false}
          showDelete={false}
          showStatus={
            row.status === "DRAFT"
          }
          onToggleStatus={() =>
            handleConfirm(row)
          }
          statusLabel="Confirm"
        />
      ),
    },
  ];

  /* ============================================================
     ORDER FORM CONTENT
  ============================================================ */

  const orderFormContent = (
    <div className="common-form">

      {/* ORDER INFORMATION */}

      <div className="common-form-section">
        <h3>Order Information</h3>

        <div className="common-form-grid">

          <div className="common-form-field">
            <label>
              Order Source *
            </label>

            <select
              name="order_source"
              value={
                form.order_source
              }
              onChange={
                handleFormChange
              }
              disabled={saving}
            >
              {SOURCE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="common-form-field">
            <label>
              Party *
            </label>

            <select
              name="party_id"
              value={form.party_id}
              onChange={
                handlePartyChange
              }
              disabled={
                saving ||
                masterLoading
              }
            >
              <option value="">
                Select Party
              </option>

              {parties.map(
                (party) => (
                  <option
                    key={party.id}
                    value={party.id}
                  >
                    {party.name}
                    {party.party_code
                      ? ` (${party.party_code})`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="common-form-field">
            <label>
              Order Date *
            </label>

            <input
              type="date"
              name="order_date"
              value={
                form.order_date
              }
              onChange={
                handleFormChange
              }
              disabled={saving}
            />
          </div>

          <div className="common-form-field">
            <label>
              Reference Number
            </label>

            <input
              type="text"
              name="reference_number"
              value={
                form.reference_number
              }
              onChange={
                handleFormChange
              }
              placeholder="Internal/customer reference"
              disabled={saving}
            />
          </div>

          <div className="common-form-field">
            <label>
              PO Number
            </label>

            <input
              type="text"
              name="po_number"
              value={form.po_number}
              onChange={
                handleFormChange
              }
              placeholder="Party PO number"
              disabled={saving}
            />
          </div>

          <div className="common-form-field">
            <label>
              PO Date
            </label>

            <input
              type="date"
              name="po_date"
              value={form.po_date}
              onChange={
                handleFormChange
              }
              disabled={saving}
            />
          </div>

        </div>
      </div>

      {/* DELIVERY */}

      <div className="common-form-section">
        <h3>
          Delivery Information
        </h3>

        <div className="common-form-grid">

          <div className="common-form-field">
            <label>
              Contact Person
            </label>

            <input
              type="text"
              name="delivery_contact_person"
              value={
                form.delivery_contact_person
              }
              onChange={
                handleFormChange
              }
              placeholder="Delivery contact person"
              disabled={saving}
            />
          </div>

          <div className="common-form-field">
            <label>
              Contact Number
            </label>

            <input
              type="text"
              name="delivery_contact_number"
              value={
                form.delivery_contact_number
              }
              onChange={
                handleFormChange
              }
              placeholder="Delivery contact number"
              disabled={saving}
            />
          </div>

          <div className="common-form-field common-form-full">
            <label>
              Delivery Address
            </label>

            <textarea
              name="delivery_address"
              rows="3"
              value={
                form.delivery_address
              }
              onChange={
                handleFormChange
              }
              placeholder="Complete delivery address"
              disabled={saving}
            />
          </div>

          <div className="common-form-field common-form-full">
            <label>
              Delivery Instructions
            </label>

            <textarea
              name="delivery_instructions"
              rows="2"
              value={
                form.delivery_instructions
              }
              onChange={
                handleFormChange
              }
              placeholder="Special delivery instructions"
              disabled={saving}
            />
          </div>

        </div>
      </div>

      {/* ITEMS */}

      <div className="common-form-section">

        <div className="order-items-header">
          <div>
            <h3>Order Items</h3>

            <p>
              Add products and
              quantities requested
              by the party.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addItem}
            disabled={saving}
          >
            + Add Item
          </button>
        </div>

        {masterLoading ? (
          <LoadingState
            message="Loading parties and products..."
          />
        ) : (
          <div className="order-items-scroll">

            <table className="common-table order-items-table">

              <thead>
                <tr>
                  <th>
                    Product / Variant
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Rate
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {form.items.map(
                  (item, index) => (
                    <tr key={index}>

                      <td>
                        <select
                          value={
                            item.variant_id
                          }
                          onChange={(
                            event
                          ) =>
                            handleItemChange(
                              index,
                              "variant_id",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        >
                          <option value="">
                            Select Variant
                          </option>

                          {variants.map(
                            (variant) => {
                              const id =
                                variant.variant_id ??
                                variant.id;

                              return (
                                <option
                                  key={id}
                                  value={id}
                                >
                                  {variant.product_name ||
                                    "Product"}

                                  {" - "}

                                  {variant.variant_name ||
                                    variant.sku ||
                                    ""}
                                </option>
                              );
                            }
                          )}
                        </select>
                      </td>

                      <td>
                        <input
                          type="text"
                          value={
                            item.description
                          }
                          onChange={(
                            event
                          ) =>
                            handleItemChange(
                              index,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Description/specification"
                          disabled={saving}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={
                            item.quantity
                          }
                          onChange={(
                            event
                          ) =>
                            handleItemChange(
                              index,
                              "quantity",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.rate
                          }
                          onChange={(
                            event
                          ) =>
                            handleItemChange(
                              index,
                              "rate",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        />
                      </td>

                      <td>
                        ₹{" "}
                        {formatMoney(
                          Number(
                            item.quantity ||
                              0
                          ) *
                            Number(
                              item.rate ||
                                0
                            )
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="table-action-btn delete"
                          onClick={() =>
                            removeItem(index)
                          }
                          disabled={
                            saving ||
                            form.items.length ===
                              1
                          }
                        >
                          Remove
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>
            </table>

          </div>
        )}

        <div className="order-total-bar">

          <div>
            <span>
              Total Quantity
            </span>

            <strong>
              {totals.quantity.toFixed(
                3
              )}
            </strong>
          </div>

          <div>
            <span>
              Total Amount
            </span>

            <strong>
              ₹{" "}
              {formatMoney(
                totals.amount
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* REMARKS */}

      <div className="common-form-section">

        <div className="common-form-field">
          <label>
            Remarks
          </label>

          <textarea
            name="remarks"
            rows="3"
            value={form.remarks}
            onChange={
              handleFormChange
            }
            placeholder="Additional order notes"
            disabled={saving}
          />
        </div>

      </div>

    </div>
  );

  /* ============================================================
     RETURN
  ============================================================ */

  return (
    <div className="sales-orders-page">

      {/* HEADER */}

      <div className="sales-orders-header">

        <div>
          <h1>Orders</h1>

          <p>
            Manage party orders, PO
            details, quantities and
            dispatch pendency.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Order
        </button>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {success && (
        <div className="page-success">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <TableFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search order, PO, party or SKU..."
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={resetFilters}
      />

      {/* TABLE */}

      <div className="table-card">

        {loading ? (
          <LoadingState
            message="Loading orders..."
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            message="No orders match the current filters."
            actionLabel="Create Order"
            onAction={
              openCreateForm
            }
          />
        ) : (
          <CommonTable
            columns={columns}
            data={orders}
            loading={false}
            rowKey="id"
          />
        )}

      </div>

      {/* PAGINATION */}

      {pagination.totalPages > 1 && (
        <div className="common-pagination">

          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((value) =>
                Math.max(
                  value - 1,
                  1
                )
              )
            }
          >
            Previous
          </button>

          <span>
            Page{" "}
            <strong>
              {page}
            </strong>{" "}
            of{" "}
            <strong>
              {pagination.totalPages}
            </strong>
          </span>

          <button
            type="button"
            disabled={
              page >=
              pagination.totalPages
            }
            onClick={() =>
              setPage((value) =>
                Math.min(
                  value + 1,
                  pagination.totalPages
                )
              )
            }
          >
            Next
          </button>

        </div>
      )}

      {/* ========================================================
          CREATE ORDER MODAL
      ======================================================== */}

      <SalesOrderModal
        open={modalOpen}
        title="New Order"
        subtitle="Create an order received from a party or on behalf of a party."
        onSubmit={handleSubmit}
        onClose={closeForm}
        loading={
          saving ||
          masterLoading
        }
        error={error}
      >
        {orderFormContent}
      </SalesOrderModal>

      {/* ========================================================
          ORDER CREATED SUCCESS MODAL
      ======================================================== */}

      {successModal.open && (
        <SalesOrderModal
          open={successModal.open}
          title="Order Created Successfully"
          subtitle="The sales order has been created successfully."
          onClose={() => {
            setSuccessModal({
              open: false,
              order: null,
            });
          }}
          hideActions
        >
          <div className="order-success-content">

            <div className="order-success-icon">
              ✓
            </div>

            <h3>
              Order Created Successfully
            </h3>

            <p>
              The sales order has been
              saved successfully.
            </p>

            <div className="order-success-details">

              <div className="order-success-row">
                <span>
                  Order No.
                </span>

                <strong>
                  {successModal.order
                    ?.order_no || "-"}
                </strong>
              </div>

              <div className="order-success-row">
                <span>
                  Party
                </span>

                <strong>
                  {successModal.order
                    ?.party_name ||
                    successModal.order
                      ?.party?.name ||
                    "-"}
                </strong>
              </div>

              <div className="order-success-row">
                <span>
                  Order Date
                </span>

                <strong>
                  {formatDate(
                    successModal.order
                      ?.order_date
                  )}
                </strong>
              </div>

              <div className="order-success-row">
                <span>
                  Status
                </span>

                <strong>
                  {getStatusLabel(
                    successModal.order
                      ?.status ||
                      "DRAFT"
                  )}
                </strong>
              </div>

              <div className="order-success-row">
                <span>
                  Total Quantity
                </span>

                <strong>
                  {Number(
                    successModal.order
                      ?.total_quantity ??
                      0
                  ).toFixed(3)}
                </strong>
              </div>

              <div className="order-success-row total">
                <span>
                  Total Amount
                </span>

                <strong>
                  ₹{" "}
                  {formatMoney(
                    successModal.order
                      ?.total_amount ??
                      successModal.order
                        ?.grand_total ??
                      0
                  )}
                </strong>
              </div>

            </div>

            <button
              type="button"
              className="primary-button order-success-button"
              onClick={() => {
                setSuccessModal({
                  open: false,
                  order: null,
                });
              }}
            >
              Done
            </button>

          </div>
        </SalesOrderModal>
      )}

      {/* ========================================================
          VIEW ORDER MODAL
      ======================================================== */}

      {showView && (
        <SalesOrderModal
          open={showView}
          title="Order Details"
          subtitle={
            selectedOrder?.order_no ||
            "Order Details"
          }
          onClose={() => {
            if (!viewLoading) {
              setShowView(false);
              setSelectedOrder(null);
            }
          }}
          loading={viewLoading}
          hideActions
        >
          {viewLoading ? (
            <LoadingState
              message="Loading order..."
            />
          ) : selectedOrder ? (
            <div className="order-details">

              <div className="order-details-grid">

                <div>
                  <span>
                    Party
                  </span>

                  <strong>
                    {
                      selectedOrder.party_name ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Order Source
                  </span>

                  <strong>
                    {selectedOrder.order_source ===
                    "COMPANY_CREATED"
                      ? "Created by Company"
                      : "Party Order"}
                  </strong>
                </div>

                <div>
                  <span>
                    Order No.
                  </span>

                  <strong>
                    {
                      selectedOrder.order_no
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    PO Number
                  </span>

                  <strong>
                    {
                      selectedOrder.po_number ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    PO Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedOrder.po_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Order Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedOrder.order_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    <span className="common-status-badge">
                      {getStatusLabel(
                        selectedOrder.status
                      )}
                    </span>
                  </strong>
                </div>

                <div>
                  <span>
                    Total Amount
                  </span>

                  <strong>
                    ₹{" "}
                    {formatMoney(
                      selectedOrder.total_amount
                    )}
                  </strong>
                </div>

              </div>

              {/* DELIVERY */}

              <div className="order-details-block">

                <h3>
                  Delivery
                </h3>

                <p>
                  <strong>
                    {
                      selectedOrder.delivery_contact_person ||
                      "-"
                    }
                  </strong>

                  <br />

                  {
                    selectedOrder.delivery_contact_number ||
                    "-"
                  }

                  <br />

                  {
                    selectedOrder.delivery_address ||
                    "-"
                  }
                </p>

              </div>

              {/* ITEMS */}

              <div className="order-details-block">

                <h3>
                  Order Items
                </h3>

                <CommonTable
                  columns={[
                    {
                      key: "product_name",
                      label: "Product",
                    },
                    {
                      key: "variant_name",
                      label: "Variant",
                    },
                    {
                      key: "sku",
                      label: "SKU",
                    },
                    {
                      key: "ordered_quantity",
                      label: "Ordered",
                    },
                    {
                      key: "dispatched_quantity",
                      label: "Dispatched",
                    },
                    {
                      key: "pending_quantity",
                      label: "Pending",
                      render: (value) => (
                        <strong>
                          {Number(
                            value || 0
                          ).toFixed(3)}
                        </strong>
                      ),
                    },
                    {
                      key: "rate",
                      label: "Rate",
                      render: (value) =>
                        `₹ ${formatMoney(
                          value
                        )}`,
                    },
                    {
                      key: "amount",
                      label: "Amount",
                      render: (value) =>
                        `₹ ${formatMoney(
                          value
                        )}`,
                    },
                  ]}
                  data={
                    selectedOrder.items ||
                    []
                  }
                  rowKey="id"
                />

              </div>

              {/* CONFIRM */}

              {selectedOrder.status ===
                "DRAFT" && (
                <div className="common-form-actions">

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      handleConfirm(
                        selectedOrder
                      )
                    }
                  >
                    Confirm Order
                  </button>

                </div>
              )}

            </div>
          ) : (
            <EmptyState
              title="Order not found"
              message="Unable to load order details."
            />
          )}
        </SalesOrderModal>
      )}

    </div>
  );
};

export default SalesOrders;