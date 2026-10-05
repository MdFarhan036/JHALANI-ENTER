import React, { useEffect, useMemo, useState } from "react";

import api from "../../api/axios";
import {
  createStockAdjustment,
} from "../../api/stockAdjustmentApi";

import "../../styles/stockAdjustment.css";

const StockAdjustment = () => {
  const [variants, setVariants] = useState([]);

  const [loadingVariants, setLoadingVariants] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    variant_id: "",
    transaction_type: "ADJUSTMENT_IN",
    quantity: "",
    rate: "",
    transaction_date: "",
    remarks: "",
  });


  /*
  ============================================================
  LOAD CURRENT STOCK / VARIANTS
  ============================================================
  */

  const loadVariants = async () => {
    try {
      setLoadingVariants(true);
      setError("");

      const response = await api.get("/stock");

      const data = response?.data?.data;

      setVariants(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Get variants for adjustment error:",
        err
      );

      setVariants([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load stock variants"
      );
    } finally {
      setLoadingVariants(false);
    }
  };


  useEffect(() => {
    loadVariants();
  }, []);


  /*
  ============================================================
  SELECTED VARIANT
  ============================================================
  */

  const selectedVariant = useMemo(() => {
    return variants.find(
      (item) =>
        String(item.variant_id) ===
        String(form.variant_id)
    );
  }, [variants, form.variant_id]);


  /*
  ============================================================
  FILTER VARIANTS
  ============================================================
  */

  const filteredVariants = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return variants;
    }

    return variants.filter((item) => {
      return [
        item.product_name,
        item.variant_name,
        item.sku,
        item.unit_name,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field)
            .toLowerCase()
            .includes(value)
        );
    });
  }, [variants, search]);


  /*
  ============================================================
  HANDLE INPUT
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

    setError("");
    setSuccess("");
  };


  /*
  ============================================================
  HANDLE VARIANT
  ============================================================
  */

  const handleVariantChange = (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      variant_id: value,
    }));

    setError("");
    setSuccess("");
  };


  /*
  ============================================================
  CURRENT STOCK
  ============================================================
  */

  const currentStock = Number(
    selectedVariant?.current_stock || 0
  );

  const quantity = Number(
    form.quantity || 0
  );

  const projectedStock =
    form.transaction_type === "ADJUSTMENT_IN"
      ? currentStock + quantity
      : currentStock - quantity;


  /*
  ============================================================
  SUBMIT
  ============================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");


    /*
    ----------------------------------------------------------
    VALIDATE VARIANT
    ----------------------------------------------------------
    */

    if (!form.variant_id) {
      setError(
        "Please select a product variant."
      );

      return;
    }


    /*
    ----------------------------------------------------------
    VALIDATE QUANTITY
    ----------------------------------------------------------
    */

    if (
      !form.quantity ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Quantity must be greater than zero."
      );

      return;
    }


    /*
    ----------------------------------------------------------
    PREVENT NEGATIVE STOCK
    ----------------------------------------------------------
    */

    if (
      form.transaction_type ===
        "ADJUSTMENT_OUT" &&
      quantity > currentStock
    ) {
      setError(
        `Insufficient stock. Current stock is ${currentStock.toFixed(
          3
        )}.`
      );

      return;
    }


    /*
    ----------------------------------------------------------
    RATE
    ----------------------------------------------------------
    */

    const rate =
      form.rate === ""
        ? 0
        : Number(form.rate);

    if (
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      setError(
        "Please enter a valid rate."
      );

      return;
    }


    try {
      setSubmitting(true);

      const payload = {
        variant_id: Number(
          form.variant_id
        ),

        transaction_type:
          form.transaction_type,

        quantity,

        rate,

        transaction_date:
          form.transaction_date || null,

        remarks:
          form.remarks.trim() || null,
      };


      const response =
        await createStockAdjustment(
          payload
        );


      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message ||
            "Failed to create adjustment"
        );
      }


      /*
      --------------------------------------------------------
      SUCCESS
      --------------------------------------------------------
      */

      const result =
        response.data.data;


      setSuccess(
        response?.data?.message ||
          "Stock adjustment created successfully."
      );


      /*
      --------------------------------------------------------
      RESET FORM
      --------------------------------------------------------
      */

      setForm({
        variant_id: "",
        transaction_type:
          "ADJUSTMENT_IN",
        quantity: "",
        rate: "",
        transaction_date: "",
        remarks: "",
      });


      /*
      --------------------------------------------------------
      REFRESH STOCK
      --------------------------------------------------------
      */

      await loadVariants();

      console.log(
        "Stock adjustment result:",
        result
      );
    } catch (err) {
      console.error(
        "Create stock adjustment error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create stock adjustment."
      );
    } finally {
      setSubmitting(false);
    }
  };


  /*
  ============================================================
  RESET
  ============================================================
  */

  const handleReset = () => {
    setForm({
      variant_id: "",
      transaction_type:
        "ADJUSTMENT_IN",
      quantity: "",
      rate: "",
      transaction_date: "",
      remarks: "",
    });

    setSearch("");
    setError("");
    setSuccess("");
  };


  return (
    <div className="stock-adjustment-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="stock-adjustment-header">

        <div>
          <h1>Stock Adjustment</h1>

          <p>
            Increase or decrease inventory through
            controlled stock adjustments.
          </p>
        </div>

        <button
          type="button"
          className="sa-header-refresh"
          onClick={loadVariants}
          disabled={loadingVariants}
        >
          {loadingVariants
            ? "Refreshing..."
            : "Refresh Stock"}
        </button>

      </div>


      {/* ====================================================
          ALERTS
      ==================================================== */}

      {error && (
        <div className="sa-alert sa-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="sa-alert sa-alert-success">
          {success}
        </div>
      )}


      {/* ====================================================
          MAIN
      ==================================================== */}

      <div className="stock-adjustment-layout">


        {/* ==================================================
            FORM
        ================================================== */}

        <div className="stock-adjustment-card">

          <div className="sa-card-header">

            <div>
              <h2>Create Adjustment</h2>

              <p>
                Record a physical stock correction.
              </p>
            </div>

          </div>


          <form
            onSubmit={handleSubmit}
            className="stock-adjustment-form"
          >


            {/* ==============================================
                PRODUCT VARIANT
            ============================================== */}

            <div className="sa-form-group sa-full">

              <label>
                Product / Variant
                <span>*</span>
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search product, variant or SKU..."
                className="sa-variant-search"
              />

              <select
                name="variant_id"
                value={form.variant_id}
                onChange={
                  handleVariantChange
                }
                disabled={
                  loadingVariants
                }
              >

                <option value="">
                  {loadingVariants
                    ? "Loading variants..."
                    : "Select product variant"}
                </option>

                {filteredVariants.map(
                  (item) => (
                    <option
                      key={item.variant_id}
                      value={item.variant_id}
                    >
                      {item.product_name}
                      {" — "}
                      {item.variant_name ||
                        "Default"}
                      {" — SKU: "}
                      {item.sku}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* ==============================================
                SELECTED VARIANT INFORMATION
            ============================================== */}

            {selectedVariant && (
              <div className="sa-variant-info">

                <div>
                  <span>
                    Product
                  </span>

                  <strong>
                    {selectedVariant.product_name ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Variant
                  </span>

                  <strong>
                    {selectedVariant.variant_name ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    SKU
                  </span>

                  <strong>
                    {selectedVariant.sku ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Unit
                  </span>

                  <strong>
                    {selectedVariant.unit_name ||
                      "-"}
                    {selectedVariant.unit_symbol
                      ? ` (${selectedVariant.unit_symbol})`
                      : ""}
                  </strong>
                </div>

              </div>
            )}


            {/* ==============================================
                ADJUSTMENT TYPE
            ============================================== */}

            <div className="sa-form-group">

              <label>
                Adjustment Type
                <span>*</span>
              </label>

              <select
                name="transaction_type"
                value={
                  form.transaction_type
                }
                onChange={handleChange}
              >

                <option value="ADJUSTMENT_IN">
                  Adjustment In
                </option>

                <option value="ADJUSTMENT_OUT">
                  Adjustment Out
                </option>

              </select>

            </div>


            {/* ==============================================
                QUANTITY
            ============================================== */}

            <div className="sa-form-group">

              <label>
                Quantity
                <span>*</span>
              </label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0.001"
                step="0.001"
                placeholder="0.000"
              />

            </div>


            {/* ==============================================
                RATE
            ============================================== */}

            <div className="sa-form-group">

              <label>
                Rate
              </label>

              <input
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />

            </div>


            {/* ==============================================
                DATE
            ============================================== */}

            <div className="sa-form-group">

              <label>
                Transaction Date
              </label>

              <input
                type="datetime-local"
                name="transaction_date"
                value={
                  form.transaction_date
                }
                onChange={handleChange}
              />

            </div>


            {/* ==============================================
                REMARKS
            ============================================== */}

            <div className="sa-form-group sa-full">

              <label>
                Remarks
              </label>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows="4"
                placeholder="Enter reason for stock adjustment..."
              />

            </div>


            {/* ==============================================
                ACTIONS
            ============================================== */}

            <div className="sa-form-actions">

              <button
                type="button"
                className="sa-reset-btn"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset
              </button>

              <button
                type="submit"
                className={
                  form.transaction_type ===
                  "ADJUSTMENT_OUT"
                    ? "sa-submit-btn sa-submit-out"
                    : "sa-submit-btn"
                }
                disabled={
                  submitting ||
                  loadingVariants
                }
              >
                {submitting
                  ? "Saving..."
                  : "Save Adjustment"}
              </button>

            </div>

          </form>

        </div>


        {/* ==================================================
            STOCK PREVIEW
        ================================================== */}

        <div className="stock-adjustment-preview">

          <div className="sa-preview-card">

            <div className="sa-preview-header">
              <h2>Stock Preview</h2>

              <span>
                Live
              </span>
            </div>


            {!selectedVariant ? (

              <div className="sa-preview-empty">

                <div>
                  📦
                </div>

                <p>
                  Select a product variant to
                  view stock information.
                </p>

              </div>

            ) : (

              <>

                <div className="sa-preview-product">

                  <strong>
                    {selectedVariant.product_name}
                  </strong>

                  <span>
                    {selectedVariant.variant_name ||
                      "Default Variant"}
                  </span>

                  <small>
                    SKU:{" "}
                    {selectedVariant.sku}
                  </small>

                </div>


                <div className="sa-stock-box">

                  <span>
                    Current Stock
                  </span>

                  <strong>
                    {currentStock.toFixed(3)}
                  </strong>

                  <small>
                    {selectedVariant.unit_symbol ||
                      selectedVariant.unit_name ||
                      ""}
                  </small>

                </div>


                {quantity > 0 && (
                  <div
                    className={
                      projectedStock < 0
                        ? "sa-projected sa-projected-danger"
                        : "sa-projected"
                    }
                  >

                    <div>
                      <span>
                        After Adjustment
                      </span>

                      <strong>
                        {projectedStock.toFixed(
                          3
                        )}
                      </strong>
                    </div>

                    <small>
                      {form.transaction_type ===
                      "ADJUSTMENT_IN"
                        ? `+${quantity.toFixed(
                            3
                          )}`
                        : `-${quantity.toFixed(
                            3
                          )}`}
                    </small>

                  </div>
                )}


                {form.transaction_type ===
                  "ADJUSTMENT_OUT" &&
                  quantity >
                    currentStock && (
                    <div className="sa-preview-warning">
                      Adjustment quantity exceeds
                      current stock.
                    </div>
                  )}

              </>

            )}

          </div>


          {/* INFO */}

          <div className="sa-info-card">

            <h3>
              Adjustment Information
            </h3>

            <ul>
              <li>
                <strong>
                  Adjustment In
                </strong>{" "}
                increases available stock.
              </li>

              <li>
                <strong>
                  Adjustment Out
                </strong>{" "}
                decreases available stock.
              </li>

              <li>
                Stock cannot be reduced below
                zero.
              </li>

              <li>
                Every adjustment creates a
                stock transaction.
              </li>

              <li>
                Current stock is updated
                automatically.
              </li>
            </ul>

          </div>

        </div>

      </div>

    </div>
  );
};

export default StockAdjustment;