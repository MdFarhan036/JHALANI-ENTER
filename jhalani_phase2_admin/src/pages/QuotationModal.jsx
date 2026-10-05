import React, { useEffect, useMemo, useState } from "react";
import "../styles/quotationModal.css";

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
  quotation_date: "",
  valid_until: "",
  revision_no: 0,
  status: "DRAFT",

  payment_terms: "",
  delivery_terms: "",
  freight_terms: "",
  notes: "",
  exclusions: "",

  items: [{ ...EMPTY_ITEM }],
};

export default function QuotationModal({
  open,
  editingId = null,
  initialData = null,

  parties = [],
  variants = [],
  units = [],

  saving = "false",
  error = "",

  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        quotation_no: initialData.quotation_no || "",
        party_id: initialData.party_id || "",
        quotation_date:
          initialData.quotation_date
            ? String(initialData.quotation_date).slice(0, 10)
            : "",
        valid_until:
          initialData.valid_until
            ? String(initialData.valid_until).slice(0, 10)
            : "",
        revision_no: initialData.revision_no ?? 0,
        status: initialData.status || "DRAFT",

        payment_terms: initialData.payment_terms || "",
        delivery_terms: initialData.delivery_terms || "",
        freight_terms: initialData.freight_terms || "",
        notes: initialData.notes || "",
        exclusions: initialData.exclusions || "",

        items:
          Array.isArray(initialData.items) && initialData.items.length
            ? initialData.items.map((item) => ({
                ...EMPTY_ITEM,
                ...item,
                variant_id: item.variant_id || "",
                unit_id: item.unit_id || "",
                quantity: item.quantity ?? 1,
                rate: item.rate ?? 0,
                tax_rate: item.tax_rate ?? 0,
                tax_amount: item.tax_amount ?? 0,
                amount: item.amount ?? 0,
              }))
            : [{ ...EMPTY_ITEM }],
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        quotation_date: new Date().toISOString().slice(0, 10),
        items: [{ ...EMPTY_ITEM }],
      });
    }
  }, [open, initialData]);

  const updateForm = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateItem = (index, name, value) => {
    setForm((prev) => {
      const items = [...prev.items];

      const item = {
        ...items[index],
        [name]: value,
      };

      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const taxRate = Number(item.tax_rate) || 0;

      const baseAmount = quantity * rate;
      const taxAmount = (baseAmount * taxRate) / 100;
      const amount = baseAmount + taxAmount;

      item.tax_amount = Number(taxAmount.toFixed(2));
      item.amount = Number(amount.toFixed(2));

      items[index] = item;

      return {
        ...prev,
        items,
      };
    });
  };

  const handleVariantChange = (index, variantId) => {
    const variant = variants.find(
      (item) => String(item.id) === String(variantId)
    );

    setForm((prev) => {
      const items = [...prev.items];

      const item = {
        ...items[index],
        variant_id: variantId,
      };

      if (variant) {
        item.description =
          variant.description ||
          variant.product_name ||
          variant.name ||
          "";

        item.specification =
          variant.specification ||
          variant.variant_name ||
          variant.sku ||
          "";

        item.unit_id = variant.unit_id || item.unit_id || "";

        if (
          variant.rate !== undefined &&
          variant.rate !== null
        ) {
          item.rate = variant.rate;
        }
      }

      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const taxRate = Number(item.tax_rate) || 0;

      const baseAmount = quantity * rate;
      const taxAmount = (baseAmount * taxRate) / 100;

      item.tax_amount = Number(taxAmount.toFixed(2));
      item.amount = Number(
        (baseAmount + taxAmount).toFixed(2)
      );

      items[index] = item;

      return {
        ...prev,
        items,
      };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...EMPTY_ITEM,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => {
      if (prev.items.length === 1) {
        return prev;
      }

      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const subtotal = useMemo(() => {
    return form.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;

      return total + quantity * rate;
    }, 0);
  }, [form.items]);

  const taxTotal = useMemo(() => {
    return form.items.reduce((total, item) => {
      return total + (Number(item.tax_amount) || 0);
    }, 0);
  }, [form.items]);

  const grandTotal = useMemo(() => {
    return subtotal + taxTotal;
  }, [subtotal, taxTotal]);
const handleSubmit = (event) => {
  event.preventDefault();

  const payload = {
    ...form,

    party_id: form.party_id
      ? Number(form.party_id)
      : null,

    revision_no:
      Number(form.revision_no) || 1,

    subtotal:
      Number(subtotal.toFixed(2)),

    tax_amount:
      Number(taxTotal.toFixed(2)),

    total_amount:
      Number(grandTotal.toFixed(2)),

    items: form.items.map((item) => ({
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

  onSubmit?.(payload);
};

  if (!open) {
    return null;
  }

  return (
    <div
      className="quotation-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose?.();
        }
      }}
    >
      <div className="quotation-modal">
        {/* HEADER */}
        <div className="quotation-modal-header">
          <div>
            <h2>
              {editingId
                ? "Edit Quotation"
                : "Create New Quotation"}
            </h2>

            <p>
              {editingId
                ? "Update quotation details and items."
                : "Create a new quotation for your customer."}
            </p>
          </div>

          <button
            type="button"
            className="quotation-modal-close"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="quotation-modal-body">
            {/* BASIC INFORMATION */}
            <section className="quotation-form-section">
              <div className="quotation-section-title">
                <h3>Quotation Information</h3>
              </div>

              <div className="quotation-form-grid">
                <div className="quotation-field">
                  <label>Quotation No.</label>

                  <input
                    type="text"
                    value={form.quotation_no}
                    onChange={(e) =>
                      updateForm(
                        "quotation_no",
                        e.target.value
                      )
                    }
                    placeholder="Enter quotation number"
                  />
                </div>

                <div className="quotation-field">
                  <label>Customer / Party *</label>

                  <select
                    value={form.party_id}
                    onChange={(e) =>
                      updateForm(
                        "party_id",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select customer / party
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

                <div className="quotation-field">
                  <label>Quotation Date *</label>

                  <input
                    type="date"
                    value={form.quotation_date}
                    onChange={(e) =>
                      updateForm(
                        "quotation_date",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="quotation-field">
                  <label>Valid Until</label>

                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) =>
                      updateForm(
                        "valid_until",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="quotation-field">
                  <label>Revision No.</label>

                  <input
                    type="number"
                    min="0"
                    value={form.revision_no}
                    onChange={(e) =>
                      updateForm(
                        "revision_no",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="quotation-field">
                  <label>Status</label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateForm(
                        "status",
                        e.target.value
                      )
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="VIEWED">Viewed</option>
                    <option value="ACCEPTED">
                      Accepted
                    </option>
                    <option value="REJECTED">
                      Rejected
                    </option>
                    <option value="EXPIRED">
                      Expired
                    </option>
                    <option value="CANCELLED">
                      Cancelled
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* ITEMS */}
            <section className="quotation-form-section">
              <div className="quotation-section-header">
                <div>
                  <h3>Quotation Items</h3>
                  <p>
                    Select products or manually enter item
                    details.
                  </p>
                </div>

                <button
                  type="button"
                  className="quotation-add-item-btn"
                  onClick={addItem}
                >
                  + Add Item
                </button>
              </div>

              <div className="quotation-items-table-wrapper">
                <table className="quotation-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Description</th>
                      <th>Specification</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Rate</th>
                      <th>Tax %</th>
                      <th>Tax</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>

                        <td>
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
                              Select product
                            </option>

                            {variants.map((variant) => (
                              <option
                                key={variant.id}
                                value={variant.id}
                              >
                                {variant.name ||
                                  variant.product_name ||
                                  variant.variant_name ||
                                  variant.sku ||
                                  `Product ${variant.id}`}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
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
                            placeholder="Description"
                          />
                        </td>

                        <td>
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
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
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
                              Unit
                            </option>

                            {units.map((unit) => (
                              <option
                                key={unit.id}
                                value={unit.id}
                              >
                                {unit.name ||
                                  unit.unit_name ||
                                  unit.symbol ||
                                  `Unit ${unit.id}`}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "rate",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.tax_rate}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "tax_rate",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td className="quotation-number-cell">
                          ₹
                          {Number(
                            item.tax_amount || 0
                          ).toFixed(2)}
                        </td>

                        <td className="quotation-number-cell">
                          ₹
                          {Number(
                            item.amount || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="quotation-remove-item-btn"
                            onClick={() =>
                              removeItem(index)
                            }
                            disabled={
                              form.items.length === 1
                            }
                            title="Remove item"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TOTALS */}
            <section className="quotation-summary-section">
              <div className="quotation-summary">
                <div className="quotation-summary-row">
                  <span>Subtotal</span>
                  <strong>
                    ₹{subtotal.toFixed(2)}
                  </strong>
                </div>

                <div className="quotation-summary-row">
                  <span>Total Tax</span>
                  <strong>
                    ₹{taxTotal.toFixed(2)}
                  </strong>
                </div>

                <div className="quotation-summary-row quotation-grand-total">
                  <span>Grand Total</span>
                  <strong>
                    ₹{grandTotal.toFixed(2)}
                  </strong>
                </div>
              </div>
            </section>

            {/* COMMERCIAL DETAILS */}
            <section className="quotation-form-section">
              <div className="quotation-section-title">
                <h3>Commercial Details</h3>
              </div>

              <div className="quotation-form-grid">
                <div className="quotation-field">
                  <label>Payment Terms</label>

                  <textarea
                    rows="3"
                    value={form.payment_terms}
                    onChange={(e) =>
                      updateForm(
                        "payment_terms",
                        e.target.value
                      )
                    }
                    placeholder="Enter payment terms"
                  />
                </div>

                <div className="quotation-field">
                  <label>Delivery Terms</label>

                  <textarea
                    rows="3"
                    value={form.delivery_terms}
                    onChange={(e) =>
                      updateForm(
                        "delivery_terms",
                        e.target.value
                      )
                    }
                    placeholder="Enter delivery terms"
                  />
                </div>

                <div className="quotation-field">
                  <label>Freight / Transport Terms</label>

                  <textarea
                    rows="3"
                    value={form.freight_terms}
                    onChange={(e) =>
                      updateForm(
                        "freight_terms",
                        e.target.value
                      )
                    }
                    placeholder="Enter freight / transport terms"
                  />
                </div>

                <div className="quotation-field">
                  <label>Notes</label>

                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={(e) =>
                      updateForm(
                        "notes",
                        e.target.value
                      )
                    }
                    placeholder="Enter notes"
                  />
                </div>

                <div className="quotation-field quotation-full-width">
                  <label>Exclusions</label>

                  <textarea
                    rows="3"
                    value={form.exclusions}
                    onChange={(e) =>
                      updateForm(
                        "exclusions",
                        e.target.value
                      )
                    }
                    placeholder="Enter exclusions"
                  />
                </div>
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div className="quotation-form-error">
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="quotation-modal-footer">
            <button
              type="button"
              className="quotation-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="quotation-save-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Quotation"
                : "Save Quotation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}