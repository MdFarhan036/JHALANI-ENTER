import React, { useCallback, useEffect, useMemo, useState } from "react";
import CommonTable from "../components/common/CommonTable";
import TableFilterBar from "../components/common/TableFilterBar";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TableActions from "../components/common/TableActions";

import api from "../api/axios";

import {
  getCatalogue,
  getCatalogueById,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
} from "../api/catalogueApi";

import CatalogueModal from "./CatalogueModal";

import "../../styles/catalogue.css";
import "../../styles/master.css";

const STATUS_OPTIONS = [
  {
    value: "1",
    label: "Active",
  },
  {
    value: "0",
    label: "Inactive",
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "1",
    label: "Visible",
  },
  {
    value: "0",
    label: "Hidden",
  },
];

export default function Catalogue() {
  const [catalogue, setCatalogue] = useState([]);

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [masterLoading, setMasterLoading] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedCatalogue, setSelectedCatalogue] = useState(null);

  const [saving, setSaving] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD CATALOGUE
  |--------------------------------------------------------------------------
  */

  const loadCatalogue = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCatalogue();

      setCatalogue(response?.data?.data || []);
    } catch (err) {
      console.error("Load catalogue error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load catalogue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD MASTER DATA
  |--------------------------------------------------------------------------
  */

  const loadMasterData = useCallback(async () => {
    try {
      setMasterLoading(true);

      const [categoryResponse, unitResponse] =
        await Promise.all([
          api.get("/categories"),
          api.get("/units"),
        ]);

      setCategories(
        categoryResponse?.data?.data ||
          categoryResponse?.data ||
          []
      );

      setUnits(
        unitResponse?.data?.data ||
          unitResponse?.data ||
          []
      );
    } catch (err) {
      console.error("Load catalogue master data error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load catalogue master data."
      );
    } finally {
      setMasterLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
    loadMasterData();
  }, [loadCatalogue, loadMasterData]);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredCatalogue = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return catalogue.filter((item) => {
      const matchesSearch =
        !searchText ||
        [
          item.product_name,
          item.product_code,
          item.short_name,
          item.brand,
          item.manufacturer,
          item.category_name,
          item.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(searchText)
          );

      const matchesStatus =
        !statusFilter ||
        String(item.status) === String(statusFilter);

      const matchesVisibility =
        !visibilityFilter ||
        String(item.catalogue_visible) ===
          String(visibilityFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVisibility
      );
    });
  }, [
    catalogue,
    search,
    statusFilter,
    visibilityFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setVisibilityFilter("");
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    setEditingId(null);
    setSelectedCatalogue(null);
    setError("");
    setModalOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const openEditModal = async (id) => {
    try {
      setError("");

      const response = await getCatalogueById(id);

      setSelectedCatalogue(
        response?.data?.data || null
      );

      setEditingId(id);
      setModalOpen(true);
    } catch (err) {
      console.error("Get catalogue details error:", err);

      alert(
        err?.response?.data?.message ||
          "Unable to load catalogue details."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {
    const item = catalogue.find(
      (row) => Number(row.id) === Number(id)
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        item?.product_name || "this catalogue product"
      }"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteCatalogue(id);

      await loadCatalogue();

      alert("Catalogue product deleted successfully.");
    } catch (err) {
      console.error("Delete catalogue error:", err);

      alert(
        err?.response?.data?.message ||
          "Unable to delete catalogue product."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      setError("");

      let response;

      if (editingId) {
        response = await updateCatalogue(
          editingId,
          payload
        );
      } else {
        response = await createCatalogue(payload);
      }

      const message =
        response?.data?.message ||
        (editingId
          ? "Catalogue updated successfully."
          : "Catalogue created successfully.");

      setModalOpen(false);
      setEditingId(null);
      setSelectedCatalogue(null);

      await loadCatalogue();

      alert(message);
    } catch (err) {
      console.error("Save catalogue error:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to save catalogue.";

      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TABLE COLUMNS
  |--------------------------------------------------------------------------
  */

  const columns = useMemo(
    () => [
      {
        key: "product_code",
        label: "Product Code",
        render: (value) => (
          <strong>{value || "-"}</strong>
        ),
      },

      {
        key: "product_name",
        label: "Product Name",
        render: (value, row) => (
          <div>
            <strong>{value || "-"}</strong>

            {row.short_name && (
              <div className="catalogue-table-subtext">
                {row.short_name}
              </div>
            )}
          </div>
        ),
      },

      {
        key: "category_name",
        label: "Category",
        render: (value) => value || "-",
      },

      {
        key: "brand",
        label: "Brand",
        render: (value) => value || "-",
      },

      {
        key: "temperature_min",
        label: "Temperature",
        render: (value, row) => {
          if (
            value === null ||
            value === undefined ||
            value === ""
          ) {
            return "-";
          }

          return `${value} - ${
            row.temperature_max ?? "-"
          } ${row.temperature_unit || "°C"}`;
        },
      },

      {
        key: "material_construction",
        label: "Material",
        render: (value) => (
          <span
            title={value || ""}
            className="catalogue-material-cell"
          >
            {value || "-"}
          </span>
        ),
      },

      {
        key: "catalogue_visible",
        label: "Visibility",
        render: (value) => (
          <span
            className={
              Number(value) === 1
                ? "catalogue-status active"
                : "catalogue-status inactive"
            }
          >
            {Number(value) === 1
              ? "Visible"
              : "Hidden"}
          </span>
        ),
      },

      {
        key: "status",
        label: "Status",
        render: (value) => (
          <span
            className={
              Number(value) === 1
                ? "catalogue-status active"
                : "catalogue-status inactive"
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
        label: "Action",
        render: (value, row) => (
          <TableActions
            showView
            showEdit
            showDelete
            showStatus={false}
            onView={() => openEditModal(row.id)}
            onEdit={() => openEditModal(row.id)}
            onDelete={() => handleDelete(row.id)}
          />
        ),
      },
    ],
    [catalogue]
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="catalogue-page">
      <div className="catalogue-page-header">
        <div>
          <h1>Catalogue Management</h1>

          <p>
            Manage product information, technical
            specifications, images and documents for
            quotations and customer-facing material.
          </p>
        </div>

        <button
          type="button"
          className="catalogue-primary-btn"
          onClick={openCreateModal}
        >
          + Add Catalogue Product
        </button>
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product, code, brand, category..."
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",
            options: STATUS_OPTIONS,
          },
          {
            name: "visibility",
            label: "Catalogue Visibility",
            type: "select",
            placeholder: "All Visibility",
            options: VISIBILITY_OPTIONS,
          },
        ]}
        values={{
          status: statusFilter,
          visibility: visibilityFilter,
        }}
        onChange={(values) => {
          setStatusFilter(values.status || "");
          setVisibilityFilter(values.visibility || "");
        }}
        onReset={clearFilters}
      />

      {error && !modalOpen && (
        <div className="catalogue-error">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : filteredCatalogue.length === 0 ? (
        <EmptyState
          title="No catalogue products found"
          description={
            search ||
            statusFilter ||
            visibilityFilter
              ? "Try changing your filters."
              : "Add your first catalogue product."
          }
        />
      ) : (
        <CommonTable
          columns={columns}
          data={filteredCatalogue}
          rowKey="id"
        />
      )}

      <CatalogueModal
        open={modalOpen}
        editingId={editingId}
        initialData={selectedCatalogue}
        categories={categories}
        units={units}
        saving={saving || masterLoading}
        error={error}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setSelectedCatalogue(null);
          setError("");
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}