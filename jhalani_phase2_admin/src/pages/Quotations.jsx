import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";



import MasterModal from "../components/common/Modal";
import CommonTable from "../components/common/CommonTable";
import TableFilterBar from "../components/common/TableFilterBar";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TableActions from "../components/common/TableActions";

import api from "../api/axios";



import {

  getQuotations,

  getQuotationById,

  createQuotation,

  updateQuotation,

  deleteQuotation,

  updateQuotationStatus,

} from "../api/quotationApi";



import "../styles/quotations.css";

import "../styles/master.css";
import QuotationModal from "./QuotationModal";



/* ============================================================

   CONSTANTS

   ============================================================ */



const STATUS_OPTIONS = [

  "DRAFT",

  "SENT",

  "VIEWED",

  "ACCEPTED",

  "REJECTED",

  "EXPIRED",

  "CANCELLED",

];



const EMPTY_ITEM = {

  variant_id: "",

  description: "",

  specification: "",

  quantity: 1,

  unit_id: "",

  rate: 0,

  tax_rate: 0,

  tax_amount: 0,

  amount: 0,

};



const EMPTY_FORM = {

  quotation_no: "",

  party_id: "",

  quotation_date: new Date().toISOString().split("T")[0],

  valid_until: "",

  revision_no: 1,

  status: "DRAFT",



  payment_terms: "",

  delivery_terms: "",

  freight_terms: "",

  notes: "",

  exclusions: "",



  items: [EMPTY_ITEM],

};



/* ============================================================

   HELPERS

   ============================================================ */



const formatCurrency = (value) =>

  `₹${Number(value || 0).toLocaleString("en-IN", {

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  })}`;



const formatDate = (value) => {

  if (!value) return "-";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return value;

  }



  return date.toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  });

};



const formatStatus = (status) => {

  if (!status) return "-";



  return String(status)

    .replaceAll("_", " ")

    .toLowerCase()

    .replace(/\b\w/g, (letter) => letter.toUpperCase());

};



const getResponseData = (response) => {

  const payload = response?.data;



  if (Array.isArray(payload)) {

    return payload;

  }



  if (Array.isArray(payload?.data)) {

    return payload.data;

  }



  if (Array.isArray(payload?.parties)) {

    return payload.parties;

  }



  if (Array.isArray(payload?.variants)) {

    return payload.variants;

  }



  if (Array.isArray(payload?.products)) {

    return payload.products;

  }



  return [];

};



const getObjectData = (response) => {

  const payload = response?.data;



  return (

    payload?.data ||

    payload?.quotation ||

    payload ||

    null

  );

};



/* ============================================================

   COMPONENT

   ============================================================ */



export default function Quotations() {

  const navigate = useNavigate();



  /* ==========================================================

     LIST STATE

     ========================================================== */



  const [quotations, setQuotations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");



  /* ==========================================================

     MODAL STATE

     ========================================================== */



  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving] = useState(false);



  const [form, setForm] = useState(EMPTY_FORM);



  /* ==========================================================

     MASTER DATA

     ========================================================== */



  const [parties, setParties] = useState([]);

  const [variants, setVariants] = useState([]);

  const [units, setUnits] = useState([]);



  const [masterLoading, setMasterLoading] = useState(false);



  /* ==========================================================

     LOAD QUOTATIONS

     ========================================================== */



  const loadQuotations = async () => {

    try {

      setLoading(true);

      setError("");



      const response = await getQuotations();



      const payload = response?.data;



      if (Array.isArray(payload)) {

        setQuotations(payload);

      } else if (Array.isArray(payload?.data)) {

        setQuotations(payload.data);

      } else if (Array.isArray(payload?.quotations)) {

        setQuotations(payload.quotations);

      } else {

        setQuotations([]);

      }

    } catch (err) {

      console.error("Quotation load error:", err);



      setError(

        err?.response?.data?.message ||

        "Failed to load quotations."

      );

    } finally {

      setLoading(false);

    }

  };



  /* ==========================================================

     LOAD MASTER DATA

     ========================================================== */



  const loadMasterData = async () => {

    try {

      setMasterLoading(true);



      const [partyResponse, variantResponse, unitResponse] =

        await Promise.all([

          api.get("/parties"),

          api.get("/product-variants"),

          api.get("/units"),

        ]);



      setParties(getResponseData(partyResponse));

      setVariants(getResponseData(variantResponse));

      setUnits(getResponseData(unitResponse));

    } catch (err) {

      console.error("Quotation master data error:", err);



      setError(

        err?.response?.data?.message ||

        "Failed to load quotation master data."

      );

    } finally {

      setMasterLoading(false);

    }

  };



  /* ==========================================================

     INITIAL LOAD

     ========================================================== */



  useEffect(() => {

    loadQuotations();

    loadMasterData();

  }, []);



  /* ==========================================================

     FILTER

     ========================================================== */



  const filteredQuotations = useMemo(() => {

    const keyword = search.trim().toLowerCase();



    return quotations.filter((quotation) => {

      const matchesStatus =

        statusFilter === "ALL" ||

        quotation.status === statusFilter;



      const matchesSearch =

        !keyword ||

        String(quotation.quotation_no || "")

          .toLowerCase()

          .includes(keyword) ||

        String(quotation.party_name || "")

          .toLowerCase()

          .includes(keyword) ||

        String(quotation.party_code || "")

          .toLowerCase()

          .includes(keyword);



      return matchesStatus && matchesSearch;

    });

  }, [quotations, search, statusFilter]);



  /* ==========================================================

     FORM HELPERS

     ========================================================== */



  const updateForm = (field, value) => {

    setForm((previous) => ({

      ...previous,

      [field]: value,

    }));

  };



  const updateItem = (index, field, value) => {

    setForm((previous) => {

      const items = [...previous.items];



      items[index] = {

        ...items[index],

        [field]: value,

      };



      return {

        ...previous,

        items,

      };

    });

  };



  /* ==========================================================

     ITEM CALCULATION

     ========================================================== */



  const calculateItem = (item) => {

    const quantity = Number(item.quantity || 0);

    const rate = Number(item.rate || 0);

    const taxRate = Number(item.tax_rate || 0);



    const amount = quantity * rate;

    const taxAmount = (amount * taxRate) / 100;



    return {

      ...item,

      amount: Number(amount.toFixed(2)),

      tax_amount: Number(taxAmount.toFixed(2)),

    };

  };



  const recalculateItem = (index) => {

    setForm((previous) => {

      const items = [...previous.items];



      items[index] = calculateItem(items[index]);



      return {

        ...previous,

        items,

      };

    });

  };



  const addItem = () => {

    setForm((previous) => ({

      ...previous,

      items: [

        ...previous.items,

        {

          ...EMPTY_ITEM,

        },

      ],

    }));

  };



  const removeItem = (index) => {

    setForm((previous) => {

      if (previous.items.length === 1) {

        return previous;

      }



      return {

        ...previous,

        items: previous.items.filter(

          (_, itemIndex) => itemIndex !== index

        ),

      };

    });

  };



  /* ==========================================================
  
     TOTALS
  
     ========================================================== */



  const totals = useMemo(() => {

    let subtotal = 0;

    let taxAmount = 0;



    form.items.forEach((item) => {

      const quantity = Number(item.quantity || 0);

      const rate = Number(item.rate || 0);

      const taxRate = Number(item.tax_rate || 0);



      const amount = quantity * rate;

      const tax = (amount * taxRate) / 100;



      subtotal += amount;

      taxAmount += tax;

    });



    return {

      subtotal,

      taxAmount,

      totalAmount: subtotal + taxAmount,

    };

  }, [form.items]);



  /* ==========================================================
  
     VARIANT SELECTION
  
     ========================================================== */



  const handleVariantChange = (index, variantId) => {

    const selectedVariant = variants.find(

      (variant) =>

        String(variant.id) === String(variantId)

    );



    setForm((previous) => {

      const items = [...previous.items];



      const currentItem = items[index];



      items[index] = {

        ...currentItem,

        variant_id: variantId,



        description:

          currentItem.description ||

          selectedVariant?.variant_name ||

          selectedVariant?.product_name ||

          "",



        rate:

          currentItem.rate ||

          selectedVariant?.sale_rate ||

          selectedVariant?.mrp ||

          0,



        tax_rate:

          currentItem.tax_rate ||

          selectedVariant?.gst_rate ||

          0,



        unit_id:

          currentItem.unit_id ||

          selectedVariant?.unit_id ||

          "",

      };



      items[index] = calculateItem(items[index]);



      return {

        ...previous,

        items,

      };

    });

  };



  /* ==========================================================
  
     OPEN CREATE
  
     ========================================================== */



  const openCreateModal = () => {

    setEditingId(null);



    setForm({

      ...EMPTY_FORM,

      quotation_date: new Date()

        .toISOString()

        .split("T")[0],

      items: [

        {

          ...EMPTY_ITEM,

        },

      ],

    });



    setModalOpen(true);

  };



  /* ==========================================================
  
     OPEN EDIT
  
     ========================================================== */



  const openEditModal = async (id) => {

    try {

      setSaving(true);

      setError("");



      const response = await getQuotationById(id);



      const quotation = getObjectData(response);



      if (!quotation) {

        throw new Error(

          "Quotation details could not be loaded."

        );

      }



      const quotationItems =

        quotation.items ||

        quotation.quotation_items ||

        [];



      setEditingId(id);



      setForm({

        quotation_no:

          quotation.quotation_no || "",



        party_id:

          quotation.party_id || "",



        quotation_date:

          quotation.quotation_date

            ? String(

              quotation.quotation_date

            ).substring(0, 10)

            : "",



        valid_until:

          quotation.valid_until

            ? String(

              quotation.valid_until

            ).substring(0, 10)

            : "",



        revision_no:

          quotation.revision_no || 1,



        status:

          quotation.status || "DRAFT",



        payment_terms:

          quotation.payment_terms || "",



        delivery_terms:

          quotation.delivery_terms || "",



        freight_terms:

          quotation.freight_terms || "",



        notes:

          quotation.notes || "",



        exclusions:

          quotation.exclusions || "",



        items:

          quotationItems.length

            ? quotationItems.map((item) =>

              calculateItem({

                variant_id:

                  item.variant_id || "",

                description:

                  item.description || "",

                specification:

                  item.specification || "",

                quantity:

                  item.quantity || 0,

                unit_id:

                  item.unit_id || "",

                rate:

                  item.rate || 0,

                tax_rate:

                  item.tax_rate || 0,

                tax_amount:

                  item.tax_amount || 0,

                amount:

                  item.amount || 0,

              })

            )

            : [

              {

                ...EMPTY_ITEM,

              },

            ],

      });



      setModalOpen(true);

    } catch (err) {

      console.error(

        "Quotation details error:",

        err

      );



      alert(

        err?.response?.data?.message ||

        err?.message ||

        "Unable to load quotation."

      );

    } finally {

      setSaving(false);

    }

  };



  /* ==========================================================
  
     CLOSE MODAL
  
     ========================================================== */



  const closeModal = () => {

    if (saving) return;



    setModalOpen(false);

    setEditingId(null);



    setForm({

      ...EMPTY_FORM,

      items: [

        {

          ...EMPTY_ITEM,

        },

      ],

    });

  };



  /* ==========================================================
  
     SAVE QUOTATION
  
     ========================================================== */

const handleSubmit = async (payload) => {
  try {
    setSaving(true);
    setError("");

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!payload?.party_id) {
      setError("Please select a party.");
      return;
    }

    if (!payload?.quotation_date) {
      setError("Please select quotation date.");
      return;
    }

    if (!Array.isArray(payload?.items) || payload.items.length === 0) {
      setError("Please add at least one quotation item.");
      return;
    }

    const validItems = payload.items.every(
      (item) =>
        Number(item.quantity) > 0 &&
        Number(item.rate) >= 0
    );

    if (!validItems) {
      setError(
        "Please enter valid quantity and rate for all items."
      );
      return;
    }

    // -----------------------------
    // API PAYLOAD
    // -----------------------------

    const apiPayload = {
      quotation_no:
        payload.quotation_no?.trim() || undefined,

      party_id:
        Number(payload.party_id),

      quotation_date:
        payload.quotation_date,

      valid_until:
        payload.valid_until || null,

      revision_no:
        Number(payload.revision_no || 1),

      status:
        payload.status || "DRAFT",

      subtotal:
        Number(payload.subtotal || 0),

      tax_amount:
        Number(payload.tax_amount || 0),

      total_amount:
        Number(payload.total_amount || 0),

      payment_terms:
        payload.payment_terms?.trim() || null,

      delivery_terms:
        payload.delivery_terms?.trim() || null,

      freight_terms:
        payload.freight_terms?.trim() || null,

      notes:
        payload.notes?.trim() || null,

      exclusions:
        payload.exclusions?.trim() || null,

      items: payload.items.map((item) => ({
        variant_id: item.variant_id
          ? Number(item.variant_id)
          : null,

        description:
          item.description?.trim() || null,

        specification:
          item.specification?.trim() || null,

        quantity:
          Number(item.quantity || 0),

        unit_id: item.unit_id
          ? Number(item.unit_id)
          : null,

        rate:
          Number(item.rate || 0),

        tax_rate:
          Number(item.tax_rate || 0),

        tax_amount:
          Number(item.tax_amount || 0),

        amount:
          Number(item.amount || 0),
      })),
    };

    console.log(
      "Saving quotation payload:",
      apiPayload
    );

    // -----------------------------
    // CREATE / UPDATE
    // -----------------------------

    let response;

    if (editingId) {
      response = await updateQuotation(
        editingId,
        apiPayload
      );
    } else {
      response = await createQuotation(
        apiPayload
      );
    }

    console.log(
      "Quotation API response:",
      response?.data
    );

    // -----------------------------
    // SUCCESS
    // -----------------------------

    const successMessage =
      response?.data?.message ||
      (
        editingId
          ? "Quotation updated successfully."
          : "Quotation created successfully."
      );

    closeModal();

    await loadQuotations();

    alert(successMessage);

  } catch (err) {
    console.error(
      "Quotation save error:",
      err
    );

    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Unable to save quotation.";

    setError(message);

    // Modal stays open
    alert(message);

  } finally {
    setSaving(false);
  }
};


  /* ==========================================================
  
     DELETE
  
     ========================================================== */



  const handleDelete = async (id) => {

    const confirmed = window.confirm(

      "Are you sure you want to delete this quotation?"

    );



    if (!confirmed) return;



    try {

      await deleteQuotation(id);

      await loadQuotations();

    } catch (err) {

      alert(

        err?.response?.data?.message ||

        "Unable to delete quotation."

      );

    }

  };



  /* ==========================================================
  
     STATUS
  
     ========================================================== */



  const handleStatusChange = async (

    id,

    status

  ) => {

    try {

      await updateQuotationStatus(

        id,

        status

      );



      await loadQuotations();

    } catch (err) {

      alert(

        err?.response?.data?.message ||

        "Unable to update quotation status."

      );

    }

  };



  /* ==========================================================
  
     MASTER MODAL CONTENT
  
     ========================================================== */


  const quotationModalContent = (
    <form onSubmit={handleSubmit} className="quotation-form">

      {/* =========================================================
        QUOTATION DETAILS
       ========================================================= */}
      <div className="form-section">
        <div className="form-section-title">
          Quotation Details
        </div>

        <div className="form-grid">

          <div className="form-group">
            <label>Quotation No.</label>
            <input
              type="text"
              value={form.quotation_no}
              onChange={(e) =>
                updateForm("quotation_no", e.target.value)
              }
              placeholder="Auto generated / quotation number"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                updateForm("status", e.target.value)
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quotation Date *</label>
            <input
              type="date"
              value={form.quotation_date}
              onChange={(e) =>
                updateForm("quotation_date", e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Valid Until *</label>
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) =>
                updateForm("valid_until", e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Revision No.</label>
            <input
              type="number"
              min="1"
              value={form.revision_no}
              onChange={(e) =>
                updateForm(
                  "revision_no",
                  Number(e.target.value) || 1
                )
              }
            />
          </div>

        </div>
      </div>

      {/* =========================================================
        CUSTOMER / PARTY
       ========================================================= */}
      <div className="form-section">
        <div className="form-section-title">
          Customer / Party
        </div>

        <div className="form-grid">

          <div className="form-group form-group-full">
            <label>Customer / Party *</label>

            <select
              value={form.party_id}
              onChange={(e) =>
                updateForm("party_id", e.target.value)
              }
              required
            >
              <option value="">
                Select Customer / Party
              </option>

              {parties.map((party) => (
                <option
                  key={party.id}
                  value={party.id}
                >
                  {party.name ||
                    party.party_name ||
                    party.company_name ||
                    `Party #${party.id}`}
                  {party.party_code
                    ? ` (${party.party_code})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* =========================================================
        ITEMS
       ========================================================= */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-title">
            Quotation Items
          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={addItem}
          >
            + Add Item
          </button>
        </div>

        <div className="quotation-items">

          {form.items.map((item, index) => (
            <div
              className="quotation-item-card"
              key={index}
            >

              <div className="quotation-item-header">
                <strong>
                  Item #{index + 1}
                </strong>

                {form.items.length > 1 && (
                  <button
                    type="button"
                    className="action-btn delete"
                    onClick={() =>
                      removeItem(index)
                    }
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-grid">

                {/* Product / Variant */}
                <div className="form-group form-group-full">
                  <label>
                    Product / Inventory
                  </label>

                  <select
                    value={item.variant_id}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Product
                    </option>

                    {variants.map((variant) => (
                      <option
                        key={variant.id}
                        value={variant.id}
                      >
                        {variant.name ||
                          variant.variant_name ||
                          variant.product_name ||
                          `Variant #${variant.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>
                    Description
                  </label>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Item description"
                  />
                </div>

                {/* Specification */}
                <div className="form-group">
                  <label>
                    Specification
                  </label>

                  <input
                    type="text"
                    value={item.specification}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "specification",
                        e.target.value
                      )
                    }
                    placeholder="Specification"
                  />
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) => {
                      updateItem(
                        index,
                        "quantity",
                        e.target.value
                      );

                      setTimeout(
                        () => recalculateItem(index),
                        0
                      );
                    }}
                    required
                  />
                </div>

                {/* Unit */}
                <div className="form-group">
                  <label>
                    Unit
                  </label>

                  <select
                    value={item.unit_id}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "unit_id",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Unit
                    </option>

                    {units.map((unit) => (
                      <option
                        key={unit.id}
                        value={unit.id}
                      >
                        {unit.name ||
                          unit.unit_name ||
                          unit.code ||
                          `Unit #${unit.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rate */}
                <div className="form-group">
                  <label>
                    Rate *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => {
                      updateItem(
                        index,
                        "rate",
                        e.target.value
                      );

                      setTimeout(
                        () => recalculateItem(index),
                        0
                      );
                    }}
                    required
                  />
                </div>

                {/* Tax */}
                <div className="form-group">
                  <label>
                    Tax %
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.tax_rate}
                    onChange={(e) => {
                      updateItem(
                        index,
                        "tax_rate",
                        e.target.value
                      );

                      setTimeout(
                        () => recalculateItem(index),
                        0
                      );
                    }}
                  />
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label>
                    Amount
                  </label>

                  <input
                    type="text"
                    value={formatCurrency(item.amount)}
                    readOnly
                  />
                </div>

                {/* Tax Amount */}
                <div className="form-group">
                  <label>
                    Tax Amount
                  </label>

                  <input
                    type="text"
                    value={formatCurrency(item.tax_amount)}
                    readOnly
                  />
                </div>

              </div>
            </div>
          ))}

        </div>

        {/* =======================================================
          TOTALS
         ======================================================= */}
        <div className="quotation-total-box">

          <div>
            <span>Subtotal</span>

            <strong>
              {formatCurrency(totals.subtotal)}
            </strong>
          </div>

          <div>
            <span>Tax</span>

            <strong>
              {formatCurrency(totals.taxAmount)}
            </strong>
          </div>

          <div className="quotation-grand-total">
            <span>Total</span>

            <strong>
              {formatCurrency(totals.totalAmount)}
            </strong>
          </div>

        </div>
      </div>

      {/* =========================================================
        COMMERCIAL TERMS
       ========================================================= */}
      <div className="form-section">

        <div className="form-section-title">
          Commercial Terms
        </div>

        <div className="form-grid">

          {/* Payment */}
          <div className="form-group">
            <label>
              Payment Terms
            </label>

            <textarea
              rows="3"
              value={form.payment_terms}
              onChange={(e) =>
                updateForm(
                  "payment_terms",
                  e.target.value
                )
              }
              placeholder="Payment terms"
            />
          </div>

          {/* Delivery */}
          <div className="form-group">
            <label>
              Delivery Terms
            </label>

            <textarea
              rows="3"
              value={form.delivery_terms}
              onChange={(e) =>
                updateForm(
                  "delivery_terms",
                  e.target.value
                )
              }
              placeholder="Delivery terms"
            />
          </div>

          {/* Freight */}
          <div className="form-group">
            <label>
              Freight / Transport Terms
            </label>

            <textarea
              rows="3"
              value={form.freight_terms}
              onChange={(e) =>
                updateForm(
                  "freight_terms",
                  e.target.value
                )
              }
              placeholder="Freight / transport terms"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>
              Notes
            </label>

            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) =>
                updateForm(
                  "notes",
                  e.target.value
                )
              }
              placeholder="Additional notes"
            />
          </div>

          {/* Exclusions */}
          <div className="form-group form-group-full">
            <label>
              Exclusions
            </label>

            <textarea
              rows="3"
              value={form.exclusions}
              onChange={(e) =>
                updateForm(
                  "exclusions",
                  e.target.value
                )
              }
              placeholder="Excluded items or conditions"
            />
          </div>

        </div>
      </div>

      {/* Hidden submit for MasterModal */}
      <button
        type="submit"
        style={{ display: "none" }}
        aria-hidden="true"
      >
        Save
      </button>

    </form>
  );



  /* ============================================================
     COMMON TABLE COLUMNS
     ============================================================ */

  const columns = useMemo(
    () => [
      {
        key: "quotation_no",
        label: "Quotation No.",
        render: (value) => <strong>{value || "-"}</strong>,
      },
      {
        key: "party_name",
        label: "Party",
        render: (value, row) => (
          <div>
            <div>{value || "-"}</div>
            {row.party_code && <small>{row.party_code}</small>}
          </div>
        ),
      },
      {
        key: "quotation_date",
        label: "Quotation Date",
        render: (value) => formatDate(value),
      },
      {
        key: "valid_until",
        label: "Valid Until",
        render: (value) => formatDate(value),
      },
      {
        key: "revision_no",
        label: "Revision",
        render: (value) => `Rev. ${value || 1}`,
      },
      {
        key: "total_amount",
        label: "Total",
        render: (value) => formatCurrency(value),
      },
      {
        key: "status",
        label: "Status",
        render: (value, row) => (
          <select
            className={`status-select status-${String(
              value || ""
            ).toLowerCase()}`}
            value={value || "DRAFT"}
            onChange={(event) =>
              handleStatusChange(row.id, event.target.value)
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <TableActions
            showView
            showEdit
            showDelete
            showStatus={false}
            onView={() => navigate(`/quotations/${row.id}`)}
            onEdit={() => openEditModal(row.id)}
            onDelete={() => handleDelete(row.id)}
          />
        ),
      },
    ],
    [navigate]
  );

  /* ==========================================================
  
     RENDER
  
     ========================================================== */



  return (

    <div className="quotations-page">

      {/* ======================================================

          HEADER

          ====================================================== */}



      <div className="quotations-header">

        <div>

          <h1>Quotations</h1>



          <p>

            Manage customer quotations,

            revisions and status.

          </p>

        </div>



        <button

          className="primary-btn"

          onClick={openCreateModal}

        >

          + New Quotation

        </button>

      </div>



      {/* ======================================================

          ERROR

          ====================================================== */}



      {error && (

        <div className="quotation-error">

          {error}

        </div>

      )}
      {/* ======================================================
          COMMON FILTER
          ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search quotation no. or party..."
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",
            options: STATUS_OPTIONS.map((status) => ({
              value: status,
              label: formatStatus(status),
            })),
          },
        ]}
        values={{
          status: statusFilter === "ALL" ? "" : statusFilter,
        }}
        onChange={(values) => {
          setStatusFilter(values.status || "ALL");
        }}
        onReset={() => {
          setSearch("");
          setStatusFilter("ALL");
        }}
      />

      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="quotation-card">
        <div className="quotation-table-wrapper">
          {loading ? (
            <LoadingState message="Loading quotations..." />
          ) : filteredQuotations.length === 0 ? (
            <EmptyState
              title="No quotations found"
              message={
                search || statusFilter !== "ALL"
                  ? "No quotations match the current search or status filter."
                  : "There are no quotations available."
              }
              actionLabel={
                search || statusFilter !== "ALL"
                  ? "Clear Filters"
                  : ""
              }
              onAction={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
            />
          ) : (
            <CommonTable
              columns={columns}
              data={filteredQuotations}
              rowKey="id"
            />
          )}
        </div>
      </div>




      {/* ======================================================

          MASTER MODAL

          ====================================================== */}

      <QuotationModal
        open={modalOpen}
        editingId={editingId}
        initialData={editingId ? form : null}
        parties={parties}
        variants={variants}
        units={units}
        saving={saving || masterLoading}
        error={error}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

    </div>

  );

}