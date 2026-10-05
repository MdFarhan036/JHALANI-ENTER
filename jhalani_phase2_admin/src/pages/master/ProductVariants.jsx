import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getVariants,
  createVariant,
  updateVariant,
  updateVariantStatus,
} from "../../api/productVariantApi";

import { getProducts } from "../../api/productApi";
import { getUnits } from "../../api/unitApi";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

import "../../styles/ProductVariants.css";

export default function ProductVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const [form, setForm] = useState({
    product_id: "",
    sku: "",
    variant_name: "",
    pack_size: "",
    unit_id: "",
    purchase_rate: "",
    sale_rate: "",
    opening_stock: "",
    reorder_level: "",
  });

  /* ============================================================
     LOAD DATA
     ============================================================ */

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        variantsResult,
        productsResult,
        unitsResult,
      ] = await Promise.allSettled([
        getVariants(),
        getProducts(),
        getUnits(),
      ]);

      /* =========================
         VARIANTS
         ========================= */

      if (variantsResult.status === "fulfilled") {
        const response = variantsResult.value;

        if (response.data?.success) {
          setVariants(
            response.data.data ||
              response.data.variants ||
              []
          );
        } else {
          setVariants([]);
        }
      } else {
        console.error(
          "Get variants failed:",
          variantsResult.reason
        );

        setVariants([]);
      }

      /* =========================
         PRODUCTS
         ========================= */

      if (productsResult.status === "fulfilled") {
        const response = productsResult.value;

        if (response.data?.success) {
          setProducts(
            response.data.data ||
              response.data.products ||
              []
          );
        } else {
          setProducts([]);
        }
      } else {
        console.error(
          "Get products failed:",
          productsResult.reason
        );

        setProducts([]);
      }

      /* =========================
         UNITS
         ========================= */

      if (unitsResult.status === "fulfilled") {
        const response = unitsResult.value;

        if (response.data?.success) {
          const rawUnits =
            response.data.data ||
            response.data.units ||
            response.data.results ||
            [];

          const normalizedUnits =
            rawUnits.map((unit) => ({
              ...unit,

              id: Number(unit.id),

              name: unit.name || "",

              symbol:
                unit.symbol ||
                unit.unit_symbol ||
                "",

              status:
                unit.status === "active"
                  ? 1
                  : unit.status === "inactive"
                    ? 0
                    : Number(unit.status),
            }));

          setUnits(normalizedUnits);
        } else {
          setUnits([]);
        }
      } else {
        console.error(
          "Get units failed:",
          unitsResult.reason
        );

        setUnits([]);
      }
    } catch (err) {
      console.error("LOAD DATA ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load product variant data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ============================================================
     FILTER
     ============================================================ */

  const filteredVariants = useMemo(() => {
    const text = search.trim().toLowerCase();

    return variants.filter((variant) => {
      const matchesSearch =
        !text ||
        variant.sku
          ?.toLowerCase()
          .includes(text) ||
        variant.product_name
          ?.toLowerCase()
          .includes(text) ||
        variant.variant_name
          ?.toLowerCase()
          .includes(text);

      const matchesStatus =
        statusFilter === "" ||
        Number(variant.status) ===
          Number(statusFilter);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    variants,
    search,
    statusFilter,
  ]);

  /* ============================================================
     FILTER RESET
     ============================================================ */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  /* ============================================================
     FORM
     ============================================================ */

  const resetForm = () => {
    setForm({
      product_id: "",
      sku: "",
      variant_name: "",
      pack_size: "",
      unit_id: "",
      purchase_rate: "",
      sale_rate: "",
      opening_stock: "",
      reorder_level: "",
    });
  };

  const openAdd = () => {
    setEditingVariant(null);
    resetForm();
    setError("");
    setShowModal(true);
  };

  const openEdit = (variant) => {
    setEditingVariant(variant);

    setForm({
      product_id:
        variant.product_id || "",

      sku:
        variant.sku || "",

      variant_name:
        variant.variant_name || "",

      pack_size:
        variant.pack_size ?? "",

      unit_id:
        variant.unit_id !== null &&
        variant.unit_id !== undefined
          ? Number(variant.unit_id)
          : "",

      purchase_rate:
        variant.purchase_rate ?? "",

      sale_rate:
        variant.sale_rate ?? "",

      opening_stock:
        variant.opening_stock ?? "",

      reorder_level:
        variant.reorder_level ?? "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingVariant(null);
    resetForm();
    setError("");
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        name === "product_id" ||
        name === "unit_id"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  /* ============================================================
     SAVE
     ============================================================ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.product_id) {
      setError("Product is required");
      return;
    }

    if (!form.sku.trim()) {
      setError("SKU is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        product_id:
          Number(form.product_id),

        sku:
          form.sku.trim(),

        variant_name:
          form.variant_name.trim(),

        pack_size:
          form.pack_size === ""
            ? null
            : Number(form.pack_size),

        unit_id:
          form.unit_id
            ? Number(form.unit_id)
            : null,

        purchase_rate:
          Number(form.purchase_rate) || 0,

        sale_rate:
          Number(form.sale_rate) || 0,

        opening_stock:
          Number(form.opening_stock) || 0,

        reorder_level:
          Number(form.reorder_level) || 0,
      };

      if (editingVariant) {
        await updateVariant(
          editingVariant.id,
          payload
        );
      } else {
        await createVariant(payload);
      }

      closeModal();

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to save variant"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     STATUS
     ============================================================ */

  const handleStatus = async (variant) => {
    const newStatus =
      Number(variant.status) === 1
        ? 0
        : 1;

    try {
      await updateVariantStatus(
        variant.id,
        newStatus
      );

      setVariants((current) =>
        current.map((item) =>
          item.id === variant.id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to update status"
      );
    }
  };

  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = [
    {
      key: "id",
      label: "#",
      width: "60px",
      render: (value, row, index) =>
        index + 1,
    },

    {
      key: "product_name",
      label: "Product",
      render: (value) => (
        <strong>
          {value || "—"}
        </strong>
      ),
    },

    {
      key: "sku",
      label: "SKU",
    },

    {
      key: "variant_name",
      label: "Variant",
      render: (value) =>
        value || "—",
    },

    {
      key: "pack_size",
      label: "Pack",
      render: (value, row) =>
        value
          ? `${value} ${
              row.unit_symbol || ""
            }`
          : "—",
    },

    {
      key: "purchase_rate",
      label: "Purchase Rate",
      render: (value) =>
        `₹${Number(value || 0).toFixed(2)}`,
    },

    {
      key: "sale_rate",
      label: "Sale Rate",
      render: (value) =>
        `₹${Number(value || 0).toFixed(2)}`,
    },

    {
      key: "opening_stock",
      label: "Opening Stock",
      render: (value) =>
        value ?? 0,
    },

    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={
            Number(value) === 1
              ? "status active"
              : "status inactive"
          }
        >
          {Number(value) === 1
            ? "Active"
            : "Inactive"}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <TableActions
          showView={false}
          onEdit={() =>
            openEdit(row)
          }
          showDelete={false}
          showStatus
          statusLabel={
            Number(row.status) === 1
              ? "Deactivate"
              : "Activate"
          }
          onToggleStatus={() =>
            handleStatus(row)
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

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="master-header">
        <div>
          <h1>
            Product Variants
          </h1>

          <p>
            Manage SKU, pack size,
            pricing and opening stock.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAdd}
        >
          + Add Variant
        </button>
      </div>

      {/* ======================================================
          FILTER BAR
          ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search SKU, product or variant..."
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
            values.status
          );
        }}
        onReset={resetFilters}
      />

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && !showModal && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* ======================================================
          TABLE
          ====================================================== */}

      {loading ? (
        <LoadingState
          message="Loading variants..."
        />
      ) : filteredVariants.length === 0 ? (
        <EmptyState
          title="No variants found"
          message={
            search || statusFilter
              ? "Try changing your search or filters."
              : "Add your first product variant to get started."
          }
          actionLabel={
            search || statusFilter
              ? "Reset Filters"
              : "Add Variant"
          }
          onAction={
            search || statusFilter
              ? resetFilters
              : openAdd
          }
        />
      ) : (
        <div className="table-card">
          <CommonTable
            columns={columns}
            data={filteredVariants}
            rowKey="id"
            emptyMessage="No variants found"
          />
        </div>
      )}

      {/* ======================================================
          MODAL
          ====================================================== */}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal product-modal">

            <div className="modal-header">
              <div>
                <h2>
                  {editingVariant
                    ? "Edit Variant"
                    : "Add Variant"}
                </h2>

                <p>
                  Configure SKU and
                  inventory details.
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

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
            >
              <div className="form-grid">

                {/* PRODUCT */}

                <div className="form-field">
                  <label>
                    Product *
                  </label>

                  <select
                    name="product_id"
                    value={
                      form.product_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      Select Product
                    </option>

                    {products
                      .filter(
                        (product) =>
                          Number(
                            product.status
                          ) === 1
                      )
                      .map(
                        (product) => (
                          <option
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >
                            {
                              product.product_name
                            }
                          </option>
                        )
                      )}
                  </select>
                </div>

                {/* SKU */}

                <div className="form-field">
                  <label>
                    SKU *
                  </label>

                  <input
                    name="sku"
                    value={
                      form.sku
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. ABC-001"
                    required
                  />
                </div>

                {/* VARIANT NAME */}

                <div className="form-field">
                  <label>
                    Variant Name
                  </label>

                  <input
                    name="variant_name"
                    value={
                      form.variant_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. 500 GM Pack"
                  />
                </div>

                {/* PACK SIZE */}

                <div className="form-field">
                  <label>
                    Pack Size
                  </label>

                  <input
                    name="pack_size"
                    type="number"
                    min="0"
                    step="0.001"
                    value={
                      form.pack_size
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. 500"
                  />
                </div>

                {/* UNIT */}

                <div className="form-field">
                  <label>
                    Unit *
                  </label>

                  <select
                    name="unit_id"
                    value={
                      form.unit_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      {units.length > 0
                        ? "Select Unit"
                        : "No units available"}
                    </option>

                    {units.map(
                      (unit) => (
                        <option
                          key={unit.id}
                          value={unit.id}
                        >
                          {unit.name}

                          {unit.symbol
                            ? ` (${unit.symbol})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PURCHASE RATE */}

                <div className="form-field">
                  <label>
                    Purchase Rate
                  </label>

                  <input
                    name="purchase_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.purchase_rate
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                {/* SALE RATE */}

                <div className="form-field">
                  <label>
                    Sale Rate
                  </label>

                  <input
                    name="sale_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.sale_rate
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                {/* OPENING STOCK */}

                <div className="form-field">
                  <label>
                    Opening Stock
                  </label>

                  <input
                    name="opening_stock"
                    type="number"
                    min="0"
                    step="0.001"
                    value={
                      form.opening_stock
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                {/* REORDER LEVEL */}

                <div className="form-field">
                  <label>
                    Reorder Level
                  </label>

                  <input
                    name="reorder_level"
                    type="number"
                    min="0"
                    step="0.001"
                    value={
                      form.reorder_level
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

              </div>

              {/* MODAL ACTIONS */}

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
                    : editingVariant
                      ? "Update Variant"
                      : "Create Variant"}
                </button>

              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}