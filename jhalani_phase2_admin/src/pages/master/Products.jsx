import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
} from "../../api/productApi";

import {
  getCategories,
} from "../../api/categoryApi";

import {
  getUnits,
} from "../../api/unitApi";

import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import TableActions from "../../components/common/TableActions";

import "../../styles/master.css";


const EMPTY_FORM = {
  product_code: "",
  product_name: "",
  short_name: "",
  description: "",

  category_id: "",
  unit_id: "",
  base_unit_id: "",

  brand: "",
  manufacturer: "",
  hsn_code: "",
  gst_rate: 0,

  reorder_level: 0,
  min_stock: 0,
  max_stock: 0,

  is_batch_tracked: false,
  is_expiry_tracked: false,

  status: 1,
  remarks: "",
};


export default function Products() {
  /* ============================================================
     DATA
     ============================================================ */

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  /* ============================================================
     STATES
     ============================================================ */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* ============================================================
     FILTERS
     ============================================================ */

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ============================================================
     PAGINATION
     ============================================================ */

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  /* ============================================================
     MODAL
     ============================================================ */

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);


  /* ============================================================
     LOAD DATA
     ============================================================ */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productsResponse,
        categoriesResponse,
        unitsResponse,
      ] = await Promise.all([
        getProducts(),
        getCategories(),
        getUnits(),
      ]);

      if (productsResponse.data?.success) {
        setProducts(
          productsResponse.data.data || []
        );
      }

      if (categoriesResponse.data?.success) {
        setCategories(
          categoriesResponse.data.data || []
        );
      }

      if (unitsResponse.data?.success) {
        setUnits(
          unitsResponse.data.data || []
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load products"
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

  const filteredProducts = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchText ||
        product.product_name
          ?.toLowerCase()
          .includes(searchText) ||
        product.product_code
          ?.toLowerCase()
          .includes(searchText) ||
        product.brand
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category_id) ===
          String(categoryFilter);

      const matchesStatus =
        statusFilter === "all" ||
        Number(product.status) ===
          Number(statusFilter);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);


  /* ============================================================
     RESET PAGINATION WHEN FILTER CHANGES
     ============================================================ */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoryFilter,
    statusFilter,
  ]);


  /* ============================================================
     PAGINATION DATA
     ============================================================ */

  const totalItems = filteredProducts.length;

  const totalPages = Math.ceil(
    totalItems / itemsPerPage
  );

  const paginatedProducts = useMemo(() => {
    const startIndex =
      (currentPage - 1) * itemsPerPage;

    return filteredProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [
    filteredProducts,
    currentPage,
    itemsPerPage,
  ]);


  /* ============================================================
     FORM
     ============================================================ */

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
    });
  };


  const openAdd = () => {
    setEditingProduct(null);
    resetForm();
    setError("");
    setShowModal(true);
  };


  const openEdit = (product) => {
    setEditingProduct(product);

    setForm({
      product_code:
        product.product_code || "",

      product_name:
        product.product_name || "",

      short_name:
        product.short_name || "",

      description:
        product.description || "",

      category_id:
        product.category_id || "",

      unit_id:
        product.unit_id || "",

      base_unit_id:
        product.base_unit_id || "",

      brand:
        product.brand || "",

      manufacturer:
        product.manufacturer || "",

      hsn_code:
        product.hsn_code || "",

      gst_rate:
        product.gst_rate ?? 0,

      reorder_level:
        product.reorder_level ?? 0,

      min_stock:
        product.min_stock ?? 0,

      max_stock:
        product.max_stock ?? 0,

      is_batch_tracked:
        Number(product.is_batch_tracked) === 1,

      is_expiry_tracked:
        Number(product.is_expiry_tracked) === 1,

      status:
        Number(product.status) === 1
          ? 1
          : 0,

      remarks:
        product.remarks || "",
    });

    setError("");
    setShowModal(true);
  };


  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);
    resetForm();
    setError("");
  };


  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  /* ============================================================
     SAVE PRODUCT
     ============================================================ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.product_name.trim()) {
      setError(
        "Product name is required"
      );
      return;
    }

    if (!form.product_code.trim()) {
      setError(
        "Product code is required"
      );
      return;
    }

    if (!form.category_id) {
      setError(
        "Category is required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        product_code:
          form.product_code.trim(),

        product_name:
          form.product_name.trim(),

        short_name:
          form.short_name.trim(),

        description:
          form.description.trim(),

        category_id:
          form.category_id
            ? Number(form.category_id)
            : null,

        unit_id:
          form.unit_id
            ? Number(form.unit_id)
            : null,

        base_unit_id:
          form.base_unit_id
            ? Number(form.base_unit_id)
            : null,

        brand:
          form.brand.trim(),

        manufacturer:
          form.manufacturer.trim(),

        hsn_code:
          form.hsn_code.trim(),

        gst_rate:
          Number(form.gst_rate) || 0,

        reorder_level:
          Number(form.reorder_level) || 0,

        min_stock:
          Number(form.min_stock) || 0,

        max_stock:
          Number(form.max_stock) || 0,

        is_batch_tracked:
          form.is_batch_tracked
            ? 1
            : 0,

        is_expiry_tracked:
          form.is_expiry_tracked
            ? 1
            : 0,

        status:
          Number(form.status) === 1
            ? 1
            : 0,

        remarks:
          form.remarks.trim(),
      };

      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          payload
        );
      } else {
        await createProduct(payload);
      }

      closeModal();

      await loadData();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     STATUS
     ============================================================ */

  const handleStatus = async (product) => {
    const newStatus =
      Number(product.status) === 1
        ? 0
        : 1;

    try {
      await updateProductStatus(
        product.id,
        newStatus
      );

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to update product"
      );
    }
  };


  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = useMemo(
    () => [
      {
        key: "index",
        label: "#",
        width: "60px",

        render: (_, __, index) =>
          (currentPage - 1) *
            itemsPerPage +
          index +
          1,
      },

      {
        key: "product_name",
        label: "Product",

        render: (value, product) => (
          <div>
            <strong>
              {value || "—"}
            </strong>

            {product.short_name && (
              <div className="table-subtext">
                {product.short_name}
              </div>
            )}
          </div>
        ),
      },

      {
        key: "product_code",
        label: "Code",

        render: (value) =>
          value || "—",
      },

      {
        key: "category_name",
        label: "Category",

        render: (value) =>
          value || "—",
      },

      {
        key: "unit_name",
        label: "Unit",

        render: (_, product) => {
          if (!product.unit_name) {
            return "—";
          }

          return `${product.unit_name}${
            product.unit_symbol
              ? ` (${product.unit_symbol})`
              : ""
          }`;
        },
      },

      {
        key: "brand",
        label: "Brand",

        render: (value) =>
          value || "—",
      },

      {
        key: "reorder_level",
        label: "Reorder",

        render: (value) =>
          value ?? 0,
      },

      {
        key: "status",
        label: "Status",

        render: (value) => (
          <StatusBadge
            status={value}
          />
        ),
      },

      {
        key: "actions",
        label: "Actions",

        render: (_, product) => (
          <TableActions
            showView={false}
            showDelete={false}
            showEdit={true}
            showStatus={true}
            statusLabel={
              Number(product.status) === 1
                ? "Deactivate"
                : "Activate"
            }
            onEdit={() =>
              openEdit(product)
            }
            onToggleStatus={() =>
              handleStatus(product)
            }
          />
        ),
      },
    ],
    [
      currentPage,
      itemsPerPage,
    ]
  );


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
            Product Master
          </h1>

          <p>
            Manage products, units,
            inventory settings and
            product information.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAdd}
        >
          + Add Product
        </button>

      </div>


      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product, code or brand..."
        filters={[
          {
            name: "category",
            label: "Category",
            type: "select",

            options: [
              {
                value: "all",
                label: "All Categories",
              },

              ...categories.map(
                (category) => ({
                  value: String(
                    category.id
                  ),

                  label:
                    category.name,
                })
              ),
            ],
          },

          {
            name: "status",
            label: "Status",
            type: "select",

            options: [
              {
                value: "all",
                label: "All Status",
              },

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
          category:
            categoryFilter,

          status:
            statusFilter,
        }}
        onChange={(values) => {
          setCategoryFilter(
            values.category
          );

          setStatusFilter(
            values.status
          );
        }}
        onReset={() => {
          setSearch("");
          setCategoryFilter("all");
          setStatusFilter("all");
        }}
      />


      {/* ======================================================
          PAGE ERROR
      ====================================================== */}

      {error && !showModal && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="table-card">

        <CommonTable
          columns={columns}
          data={paginatedProducts}
          loading={loading}
          emptyMessage="No products found."
          rowKey="id"
        />

      </div>


      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {!loading && (
        <Pagination
          currentPage={
            currentPage
          }
          totalPages={
            totalPages
          }
          totalItems={
            totalItems
          }
          itemsPerPage={
            itemsPerPage
          }
          onPageChange={
            setCurrentPage
          }
        />
      )}


      {/* ======================================================
          PRODUCT MODAL
      ====================================================== */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal product-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  Enter complete product
                  master information.
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

                {/* PRODUCT CODE */}

                <div className="form-field">

                  <label>
                    Product Code *
                  </label>

                  <input
                    name="product_code"
                    value={
                      form.product_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. PROD-001"
                  />

                </div>


                {/* PRODUCT NAME */}

                <div className="form-field">

                  <label>
                    Product Name *
                  </label>

                  <input
                    name="product_name"
                    value={
                      form.product_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter product name"
                  />

                </div>


                {/* SHORT NAME */}

                <div className="form-field">

                  <label>
                    Short Name
                  </label>

                  <input
                    name="short_name"
                    value={
                      form.short_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Short name"
                  />

                </div>


                {/* CATEGORY */}

                <div className="form-field">

                  <label>
                    Category *
                  </label>

                  <select
                    name="category_id"
                    value={
                      form.category_id
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {category.name}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* SALES UNIT */}

                <div className="form-field">

                  <label>
                    Sales Unit
                  </label>

                  <select
                    name="unit_id"
                    value={
                      form.unit_id
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Unit
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


                {/* BASE UNIT */}

                <div className="form-field">

                  <label>
                    Base Unit
                  </label>

                  <select
                    name="base_unit_id"
                    value={
                      form.base_unit_id
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Base Unit
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


                {/* BRAND */}

                <div className="form-field">

                  <label>
                    Brand
                  </label>

                  <input
                    name="brand"
                    value={
                      form.brand
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Brand"
                  />

                </div>


                {/* MANUFACTURER */}

                <div className="form-field">

                  <label>
                    Manufacturer
                  </label>

                  <input
                    name="manufacturer"
                    value={
                      form.manufacturer
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Manufacturer"
                  />

                </div>


                {/* HSN */}

                <div className="form-field">

                  <label>
                    HSN Code
                  </label>

                  <input
                    name="hsn_code"
                    value={
                      form.hsn_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="HSN Code"
                  />

                </div>


                {/* GST */}

                <div className="form-field">

                  <label>
                    GST Rate (%)
                  </label>

                  <input
                    name="gst_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      form.gst_rate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                {/* REORDER */}

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


                {/* MIN STOCK */}

                <div className="form-field">

                  <label>
                    Minimum Stock
                  </label>

                  <input
                    name="min_stock"
                    type="number"
                    min="0"
                    step="0.001"
                    value={
                      form.min_stock
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                {/* MAX STOCK */}

                <div className="form-field">

                  <label>
                    Maximum Stock
                  </label>

                  <input
                    name="max_stock"
                    type="number"
                    min="0"
                    step="0.001"
                    value={
                      form.max_stock
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                {/* BATCH */}

                <div className="form-field checkbox-field">

                  <label>

                    <input
                      type="checkbox"
                      name="is_batch_tracked"
                      checked={
                        form.is_batch_tracked
                      }
                      onChange={
                        handleChange
                      }
                    />

                    Track Batch

                  </label>

                </div>


                {/* EXPIRY */}

                <div className="form-field checkbox-field">

                  <label>

                    <input
                      type="checkbox"
                      name="is_expiry_tracked"
                      checked={
                        form.is_expiry_tracked
                      }
                      onChange={
                        handleChange
                      }
                    />

                    Track Expiry

                  </label>

                </div>


                {/* STATUS */}

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

                    <option value={1}>
                      Active
                    </option>

                    <option value={0}>
                      Inactive
                    </option>

                  </select>

                </div>


                {/* DESCRIPTION */}

                <div className="form-field form-field-full">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    rows="4"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter product description"
                  />

                </div>


                {/* REMARKS */}

                <div className="form-field form-field-full">

                  <label>
                    Remarks
                  </label>

                  <textarea
                    name="remarks"
                    rows="3"
                    value={
                      form.remarks
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Additional remarks"
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
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}