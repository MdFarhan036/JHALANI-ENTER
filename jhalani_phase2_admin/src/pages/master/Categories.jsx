import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import "../../styles/categories.css";

import MasterModal from "../../components/common/Modal";
import CommonTable from "../../components/common/CommonTable";
import TableFilterBar from "../../components/common/TableFilterBar";
import TableActions from "../../components/common/TableActions";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";


/* ============================================================
   API
   ============================================================ */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const categoriesAPI =
  `${API_BASE_URL}/categories`;


/* ============================================================
   INITIAL FORM
   ============================================================ */

const initialForm = {
  name: "",
  code: "",
  description: "",
  status: "active",
};


/* ============================================================
   CATEGORIES
   ============================================================ */

const Categories = () => {
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const [error, setError] =
    useState("");


  /* ============================================================
     FETCH CATEGORIES
     ============================================================ */

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        categoriesAPI,
        {
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        setCategories(
          response.data.data || []
        );
      } else {
        setCategories([]);
      }

    } catch (error) {
      console.error(
        "Failed to fetch categories:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load categories."
      );

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    fetchCategories();
  }, []);


  /* ============================================================
     FILTER CATEGORIES
     ============================================================ */

  const filteredCategories = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return categories.filter(
      (category) => {

        const matchesSearch =
          !searchValue ||
          category.name
            ?.toLowerCase()
            .includes(searchValue) ||
          category.code
            ?.toLowerCase()
            .includes(searchValue) ||
          category.description
            ?.toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          !statusFilter ||
          category.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  }, [
    categories,
    search,
    statusFilter,
  ]);


  /* ============================================================
     STATISTICS
     ============================================================ */

  const totalCategories =
    categories.length;

  const activeCategories =
    categories.filter(
      (category) =>
        category.status === "active"
    ).length;

  const inactiveCategories =
    categories.filter(
      (category) =>
        category.status === "inactive"
    ).length;

  const totalProducts =
    categories.reduce(
      (total, category) =>
        total +
        Number(
          category.product_count || 0
        ),
      0
    );


  /* ============================================================
     OPEN ADD MODAL
     ============================================================ */

  const handleAdd = () => {
    setEditingCategory(null);

    setForm({
      ...initialForm,
    });

    setError("");

    setModalOpen(true);
  };


  /* ============================================================
     OPEN EDIT MODAL
     ============================================================ */

  const handleEdit = (category) => {
    setEditingCategory(category);

    setForm({
      name:
        category.name || "",

      code:
        category.code || "",

      description:
        category.description || "",

      status:
        category.status || "active",
    });

    setError("");

    setModalOpen(true);
  };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const handleCloseModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingCategory(null);

    setForm({
      ...initialForm,
    });

    setError("");
  };


  /* ============================================================
     SUBMIT ADD / EDIT
     ============================================================ */

  const handleSubmit = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Category name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name,

        code:
          form.code.trim() || null,

        description:
          form.description.trim() ||
          null,

        status:
          form.status || "active",
      };

      let response;

      if (editingCategory) {

        response = await axios.put(
          `${categoriesAPI}/${editingCategory.id}`,
          payload,
          {
            withCredentials: true,
          }
        );

      } else {

        response = await axios.post(
          categoriesAPI,
          payload,
          {
            withCredentials: true,
          }
        );
      }

      if (response.data?.success) {

        alert(
          editingCategory
            ? "Category updated successfully."
            : "Category created successfully."
        );

        handleCloseModal();

        await fetchCategories();

      } else {

        setError(
          response.data?.message ||
            "Something went wrong."
        );
      }

    } catch (error) {

      console.error(
        "Save category error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save category."
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     TOGGLE STATUS
     ============================================================ */

  const handleToggleStatus = async (
    category
  ) => {

    const newStatus =
      category.status === "active"
        ? "inactive"
        : "active";

    const actionText =
      newStatus === "active"
        ? "activate"
        : "deactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionText} "${category.name}"?`
      );

    if (!confirmed) return;

    try {

      const response =
        await axios.patch(
          `${categoriesAPI}/${category.id}/status`,
          {
            status: newStatus,
          },
          {
            withCredentials: true,
          }
        );

      if (response.data?.success) {
        await fetchCategories();
      } else {
        alert(
          response.data?.message ||
            "Failed to update category status."
        );
      }

    } catch (error) {

      console.error(
        "Update category status error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update category status."
      );
    }
  };


  /* ============================================================
     DELETE CATEGORY
     ============================================================ */

  const handleDelete = async (
    category
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${category.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) return;

    try {

      const response =
        await axios.delete(
          `${categoriesAPI}/${category.id}`,
          {
            withCredentials: true,
          }
        );

      if (response.data?.success) {

        alert(
          "Category deleted successfully."
        );

        await fetchCategories();

      } else {

        alert(
          response.data?.message ||
            "Failed to delete category."
        );
      }

    } catch (error) {

      console.error(
        "Delete category error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete category."
      );
    }
  };


  /* ============================================================
     CLEAR FILTERS
     ============================================================ */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };


  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = [
    {
      key: "id",
      label: "#",
      width: "70px",

      render: (
        value,
        row,
        index
      ) => index + 1,
    },

    {
      key: "name",
      label: "Category",

      render: (value, row) => (
        <div className="category-name-cell">

          <div className="category-avatar">
            {value
              ?.charAt(0)
              ?.toUpperCase() || "C"}
          </div>

          <div>
            <strong>
              {value || "—"}
            </strong>

            <small>
              ID: #{row.id}
            </small>
          </div>

        </div>
      ),
    },

    {
      key: "code",
      label: "Code",

      render: (value) =>
        value ? (
          <span className="category-code">
            {value}
          </span>
        ) : (
          <span className="category-no-value">
            —
          </span>
        ),
    },

    {
      key: "description",
      label: "Description",

      render: (value) => (
        <div className="category-description">
          {value || "—"}
        </div>
      ),
    },

    {
      key: "product_count",
      label: "Products",

      render: (value) => (
        <span className="category-product-count">
          {Number(value || 0)}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (value, row) => (
        <button
          type="button"
          className={`category-status-badge ${
            value === "active"
              ? "active"
              : "inactive"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            handleToggleStatus(row);
          }}
          title="Click to change status"
        >
          <span />

          {value === "active"
            ? "Active"
            : "Inactive"}
        </button>
      ),
    },

    {
      key: "created_at",
      label: "Created",

      render: (value) =>
        value
          ? new Date(
              value
            ).toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )
          : "—",
    },

    {
      key: "actions",
      label: "Actions",
      width: "180px",

      render: (_, row) => (
        <TableActions
          showView={false}
          showEdit
          showDelete
          showStatus={false}

          onEdit={() =>
            handleEdit(row)
          }

          onDelete={() =>
            handleDelete(row)
          }
        />
      ),
    },
  ];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="categories-page">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="categories-header">

        <div>
          <h1>
            Categories
          </h1>

          <p>
            Manage product categories
            for Jhalani Enterprises.
          </p>
        </div>

        <button
          type="button"
          className="category-add-btn"
          onClick={handleAdd}
        >
          <span className="category-add-icon">
            +
          </span>

          Add Category
        </button>

      </div>


      {/* ======================================================
          STAT CARDS
          ====================================================== */}

      <div className="category-stat-grid">

        <div className="category-stat-card">

          <div className="category-stat-icon category-stat-total">
            #
          </div>

          <div>
            <span>
              Total Categories
            </span>

            <strong>
              {totalCategories}
            </strong>
          </div>

        </div>


        <div className="category-stat-card">

          <div className="category-stat-icon category-stat-active">
            ✓
          </div>

          <div>
            <span>
              Active
            </span>

            <strong>
              {activeCategories}
            </strong>
          </div>

        </div>


        <div className="category-stat-card">

          <div className="category-stat-icon category-stat-inactive">
            !
          </div>

          <div>
            <span>
              Inactive
            </span>

            <strong>
              {inactiveCategories}
            </strong>
          </div>

        </div>


        <div className="category-stat-card">

          <div className="category-stat-icon category-stat-products">
            P
          </div>

          <div>
            <span>
              Products Assigned
            </span>

            <strong>
              {totalProducts}
            </strong>
          </div>

        </div>

      </div>


      {/* ======================================================
          COMMON FILTER BAR
          ====================================================== */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search category, code or description..."

        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",

            options: [
              {
                value: "active",
                label: "Active",
              },
              {
                value: "inactive",
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

        onReset={clearFilters}
      />


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* ======================================================
          TABLE CARD
          ====================================================== */}

      <div className="category-table-card">

        {/* TABLE HEADER */}

        <div className="category-table-header">

          <div>

            <h2>
              Category List
            </h2>

            <span>
              Showing{" "}
              {filteredCategories.length}{" "}
              of{" "}
              {categories.length}{" "}
              categories
            </span>

          </div>

          <button
            type="button"
            className="category-refresh-btn"
            onClick={fetchCategories}
            disabled={loading}
          >
            ↻

            <span>
              {loading
                ? "Loading..."
                : "Refresh"}
            </span>
          </button>

        </div>


        {/* COMMON TABLE STATES */}

        {loading ? (

          <LoadingState
            message="Loading categories..."
          />

        ) : filteredCategories.length === 0 ? (

          <EmptyState
            title="No categories found"

            message={
              search ||
              statusFilter
                ? "Try changing your search or filters."
                : "Create your first product category."
            }

            actionLabel={
              search ||
              statusFilter
                ? "Reset Filters"
                : "Add Category"
            }

            onAction={
              search ||
              statusFilter
                ? clearFilters
                : handleAdd
            }
          />

        ) : (

          <CommonTable
            columns={columns}
            data={filteredCategories}
            rowKey="id"
          />

        )}

      </div>


      {/* ======================================================
          MASTER MODAL
          ====================================================== */}

      <MasterModal
        open={modalOpen}

        title={
          editingCategory
            ? "Edit Category"
            : "Add Category"
        }

        subtitle={
          editingCategory
            ? "Update the category details below."
            : "Create a new product category."
        }

        form={form}

        setForm={setForm}

        onSubmit={handleSubmit}

        onClose={handleCloseModal}

        loading={saving}
      />

    </div>
  );
};


export default Categories;