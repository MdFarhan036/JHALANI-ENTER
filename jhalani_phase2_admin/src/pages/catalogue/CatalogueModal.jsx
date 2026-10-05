import React, { useEffect, useMemo, useState } from "react";

import {
  addCatalogueImage,
  addCatalogueDocument,
  deleteCatalogueImage,
  deleteCatalogueDocument,
} from "../api/catalogueApi";

import "../../styles/catalogueModal.css";

const EMPTY_SPECIFICATION = {
  specification_name: "",
  specification_value: "",
};

const EMPTY_FORM = {
  product_code: "",
  product_name: "",
  short_name: "",
  description: "",

  temperature_min: "",
  temperature_max: "",
  temperature_unit: "°C",

  material_construction: "",

  category_id: "",
  unit_id: "",

  brand: "",
  manufacturer: "",
  hsn_code: "",
  gst_rate: "",

  status: 1,
  catalogue_visible: 1,

  remarks: "",

  specifications: [],
};

export default function CatalogueModal({
  open,
  editingId = null,
  initialData = null,
  categories = [],
  units = [],
  saving = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [newImage, setNewImage] = useState({
    image_title: "",
    image_path: "",
    is_primary: 0,
  });

  const [newDocument, setNewDocument] = useState({
    document_title: "",
    document_type: "",
    file_name: "",
    file_path: "",
  });

  const [localError, setLocalError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | INITIALIZE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalError("");

    if (initialData) {
      setForm({
        ...EMPTY_FORM,

        product_code: initialData.product_code || "",
        product_name: initialData.product_name || "",
        short_name: initialData.short_name || "",
        description: initialData.description || "",

        temperature_min:
          initialData.temperature_min ?? "",
        temperature_max:
          initialData.temperature_max ?? "",
        temperature_unit:
          initialData.temperature_unit || "°C",

        material_construction:
          initialData.material_construction || "",

        category_id:
          initialData.category_id || "",
        unit_id:
          initialData.unit_id || "",

        brand: initialData.brand || "",
        manufacturer:
          initialData.manufacturer || "",
        hsn_code: initialData.hsn_code || "",
        gst_rate: initialData.gst_rate ?? "",

        status:
          initialData.status ?? 1,

        catalogue_visible:
          initialData.catalogue_visible ?? 1,

        remarks: initialData.remarks || "",

        specifications:
          Array.isArray(initialData.specifications)
            ? initialData.specifications.map(
                (item) => ({
                  specification_name:
                    item.specification_name || "",
                  specification_value:
                    item.specification_value || "",
                })
              )
            : [],
      });

      setImages(
        Array.isArray(initialData.images)
          ? initialData.images
          : []
      );

      setDocuments(
        Array.isArray(initialData.documents)
          ? initialData.documents
          : []
      );
    } else {
      setForm(EMPTY_FORM);
      setImages([]);
      setDocuments([]);
    }

    setNewImage({
      image_title: "",
      image_path: "",
      is_primary: 0,
    });

    setNewDocument({
      document_title: "",
      document_type: "",
      file_name: "",
      file_path: "",
    });
  }, [open, initialData]);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY OPTIONS
  |--------------------------------------------------------------------------
  */

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.parent_id
        ? `↳ ${category.name}`
        : category.name,
    }));
  }, [categories]);

  /*
  |--------------------------------------------------------------------------
  | FORM UPDATE
  |--------------------------------------------------------------------------
  */

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SPECIFICATIONS
  |--------------------------------------------------------------------------
  */

  const addSpecification = () => {
    setForm((previous) => ({
      ...previous,
      specifications: [
        ...previous.specifications,
        {
          ...EMPTY_SPECIFICATION,
        },
      ],
    }));
  };

  const updateSpecification = (
    index,
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      specifications:
        previous.specifications.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  };

  const removeSpecification = (index) => {
    setForm((previous) => ({
      ...previous,
      specifications:
        previous.specifications.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (event) => {
    event.preventDefault();

    setLocalError("");

    if (!form.product_code.trim()) {
      setLocalError("Product code is required.");
      return;
    }

    if (!form.product_name.trim()) {
      setLocalError("Product name is required.");
      return;
    }

    if (!form.category_id) {
      setLocalError("Please select a category.");
      return;
    }

    if (
      form.temperature_min !== "" &&
      form.temperature_max !== "" &&
      Number(form.temperature_min) >
        Number(form.temperature_max)
    ) {
      setLocalError(
        "Temperature minimum cannot be greater than maximum."
      );
      return;
    }

    const validSpecifications =
      form.specifications.filter(
        (item) =>
          item.specification_name.trim()
      );

    const payload = {
      product_code: form.product_code.trim(),
      product_name: form.product_name.trim(),
      short_name:
        form.short_name.trim() || null,
      description:
        form.description.trim() || null,

      temperature_min:
        form.temperature_min === ""
          ? null
          : Number(form.temperature_min),

      temperature_max:
        form.temperature_max === ""
          ? null
          : Number(form.temperature_max),

      temperature_unit:
        form.temperature_unit.trim() || "°C",

      material_construction:
        form.material_construction.trim() || null,

      category_id: Number(form.category_id),

      unit_id: form.unit_id
        ? Number(form.unit_id)
        : null,

      brand: form.brand.trim() || null,
      manufacturer:
        form.manufacturer.trim() || null,

      hsn_code:
        form.hsn_code.trim() || null,

      gst_rate:
        form.gst_rate === ""
          ? 0
          : Number(form.gst_rate),

      status: Number(form.status),
      catalogue_visible:
        Number(form.catalogue_visible),

      remarks:
        form.remarks.trim() || null,

      specifications:
        validSpecifications.map(
          (item, index) => ({
            specification_name:
              item.specification_name.trim(),

            specification_value:
              item.specification_value.trim() ||
              null,

            sort_order: index,
          })
        ),
    };

    onSubmit?.(payload);
  };

  /*
  |--------------------------------------------------------------------------
  | ADD IMAGE
  |--------------------------------------------------------------------------
  */

  const handleAddImage = async () => {
    if (!editingId) {
      setLocalError(
        "Save the catalogue product first before adding images."
      );
      return;
    }

    if (!newImage.image_path.trim()) {
      setLocalError("Image path is required.");
      return;
    }

    try {
      setLocalError("");

      const response =
        await addCatalogueImage(
          editingId,
          {
            image_title:
              newImage.image_title.trim() ||
              null,

            image_path:
              newImage.image_path.trim(),

            is_primary:
              Number(newImage.is_primary),
          }
        );

      setImages((previous) => [
        ...previous,
        response?.data?.data,
      ]);

      setNewImage({
        image_title: "",
        image_path: "",
        is_primary: 0,
      });
    } catch (err) {
      setLocalError(
        err?.response?.data?.message ||
          "Unable to add image."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE IMAGE
  |--------------------------------------------------------------------------
  */

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) {
      return;
    }

    try {
      await deleteCatalogueImage(imageId);

      setImages((previous) =>
        previous.filter(
          (image) =>
            Number(image.id) !==
            Number(imageId)
        )
      );
    } catch (err) {
      setLocalError(
        err?.response?.data?.message ||
          "Unable to delete image."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ADD DOCUMENT
  |--------------------------------------------------------------------------
  */

  const handleAddDocument = async () => {
    if (!editingId) {
      setLocalError(
        "Save the catalogue product first before adding documents."
      );
      return;
    }

    if (!newDocument.document_title.trim()) {
      setLocalError(
        "Document title is required."
      );
      return;
    }

    if (!newDocument.file_name.trim()) {
      setLocalError(
        "File name is required."
      );
      return;
    }

    if (!newDocument.file_path.trim()) {
      setLocalError(
        "File path is required."
      );
      return;
    }

    try {
      setLocalError("");

      const response =
        await addCatalogueDocument(
          editingId,
          {
            document_title:
              newDocument.document_title.trim(),

            document_type:
              newDocument.document_type.trim() ||
              null,

            file_name:
              newDocument.file_name.trim(),

            file_path:
              newDocument.file_path.trim(),
          }
        );

      setDocuments((previous) => [
        ...previous,
        response?.data?.data,
      ]);

      setNewDocument({
        document_title: "",
        document_type: "",
        file_name: "",
        file_path: "",
      });
    } catch (err) {
      setLocalError(
        err?.response?.data?.message ||
          "Unable to add document."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE DOCUMENT
  |--------------------------------------------------------------------------
  */

  const handleDeleteDocument = async (
    documentId
  ) => {
    if (
      !window.confirm(
        "Delete this document?"
      )
    ) {
      return;
    }

    try {
      await deleteCatalogueDocument(
        documentId
      );

      setDocuments((previous) =>
        previous.filter(
          (document) =>
            Number(document.id) !==
            Number(documentId)
        )
      );
    } catch (err) {
      setLocalError(
        err?.response?.data?.message ||
          "Unable to delete document."
      );
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="catalogue-modal-overlay">
      <div className="catalogue-modal">
        <div className="catalogue-modal-header">
          <div>
            <h2>
              {editingId
                ? "Edit Catalogue Product"
                : "Add Catalogue Product"}
            </h2>

            <p>
              Maintain product information,
              specifications and catalogue details.
            </p>
          </div>

          <button
            type="button"
            className="catalogue-modal-close"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        {(error || localError) && (
          <div className="catalogue-modal-error">
            {localError || error}
          </div>
        )}

        <form
          className="catalogue-modal-form"
          onSubmit={handleSubmit}
        >
          <div className="catalogue-section">
            <h3>Basic Product Information</h3>

            <div className="catalogue-form-grid">
              <div className="catalogue-field">
                <label>
                  Product Code / SKU *
                </label>

                <input
                  value={form.product_code}
                  onChange={(event) =>
                    updateForm(
                      "product_code",
                      event.target.value
                    )
                  }
                  placeholder="e.g. PRD-001"
                />
              </div>

              <div className="catalogue-field">
                <label>Product Name *</label>

                <input
                  value={form.product_name}
                  onChange={(event) =>
                    updateForm(
                      "product_name",
                      event.target.value
                    )
                  }
                  placeholder="Product name"
                />
              </div>

              <div className="catalogue-field">
                <label>Short Name</label>

                <input
                  value={form.short_name}
                  onChange={(event) =>
                    updateForm(
                      "short_name",
                      event.target.value
                    )
                  }
                  placeholder="Short product name"
                />
              </div>

              <div className="catalogue-field">
                <label>Category *</label>

                <select
                  value={form.category_id}
                  onChange={(event) =>
                    updateForm(
                      "category_id",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select Category
                  </option>

                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="catalogue-field">
                <label>Unit</label>

                <select
                  value={form.unit_id}
                  onChange={(event) =>
                    updateForm(
                      "unit_id",
                      event.target.value
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
                      {unit.name}
                      {unit.symbol
                        ? ` (${unit.symbol})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="catalogue-field">
                <label>Brand</label>

                <input
                  value={form.brand}
                  onChange={(event) =>
                    updateForm(
                      "brand",
                      event.target.value
                    )
                  }
                  placeholder="Brand"
                />
              </div>

              <div className="catalogue-field">
                <label>Manufacturer</label>

                <input
                  value={form.manufacturer}
                  onChange={(event) =>
                    updateForm(
                      "manufacturer",
                      event.target.value
                    )
                  }
                  placeholder="Manufacturer"
                />
              </div>

              <div className="catalogue-field">
                <label>HSN Code</label>

                <input
                  value={form.hsn_code}
                  onChange={(event) =>
                    updateForm(
                      "hsn_code",
                      event.target.value
                    )
                  }
                  placeholder="HSN code"
                />
              </div>
            </div>

            <div className="catalogue-field">
              <label>Description</label>

              <textarea
                rows="4"
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Short and detailed product description"
              />
            </div>
          </div>

          <div className="catalogue-section">
            <h3>Technical Information</h3>

            <div className="catalogue-form-grid">
              <div className="catalogue-field">
                <label>
                  Temperature Minimum
                </label>

                <input
                  type="number"
                  value={form.temperature_min}
                  onChange={(event) =>
                    updateForm(
                      "temperature_min",
                      event.target.value
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="catalogue-field">
                <label>
                  Temperature Maximum
                </label>

                <input
                  type="number"
                  value={form.temperature_max}
                  onChange={(event) =>
                    updateForm(
                      "temperature_max",
                      event.target.value
                    )
                  }
                  placeholder="1000"
                />
              </div>

              <div className="catalogue-field">
                <label>Temperature Unit</label>

                <select
                  value={form.temperature_unit}
                  onChange={(event) =>
                    updateForm(
                      "temperature_unit",
                      event.target.value
                    )
                  }
                >
                  <option value="°C">
                    °C
                  </option>

                  <option value="°F">
                    °F
                  </option>

                  <option value="K">
                    K
                  </option>
                </select>
              </div>

              <div className="catalogue-field">
                <label>GST Rate (%)</label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.gst_rate}
                  onChange={(event) =>
                    updateForm(
                      "gst_rate",
                      event.target.value
                    )
                  }
                  placeholder="18"
                />
              </div>
            </div>

            <div className="catalogue-field">
              <label>
                Material / Construction
              </label>

              <textarea
                rows="3"
                value={
                  form.material_construction
                }
                onChange={(event) =>
                  updateForm(
                    "material_construction",
                    event.target.value
                  )
                }
                placeholder="Material and construction details"
              />
            </div>
          </div>

          <div className="catalogue-section">
            <div className="catalogue-section-heading">
              <div>
                <h3>
                  Technical Specifications
                </h3>

                <p>
                  Add configurable product
                  specifications.
                </p>
              </div>

              <button
                type="button"
                className="catalogue-secondary-btn"
                onClick={addSpecification}
              >
                + Add Specification
              </button>
            </div>

            {form.specifications.length ===
            0 ? (
              <div className="catalogue-inline-empty">
                No technical specifications added.
              </div>
            ) : (
              <div className="catalogue-spec-list">
                {form.specifications.map(
                  (specification, index) => (
                    <div
                      className="catalogue-spec-row"
                      key={index}
                    >
                      <input
                        placeholder="Specification name"
                        value={
                          specification.specification_name
                        }
                        onChange={(event) =>
                          updateSpecification(
                            index,
                            "specification_name",
                            event.target.value
                          )
                        }
                      />

                      <input
                        placeholder="Specification value"
                        value={
                          specification.specification_value
                        }
                        onChange={(event) =>
                          updateSpecification(
                            index,
                            "specification_value",
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="catalogue-danger-btn"
                        onClick={() =>
                          removeSpecification(
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="catalogue-section">
            <h3>Catalogue Settings</h3>

            <div className="catalogue-form-grid">
              <div className="catalogue-field">
                <label>Status</label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      Number(event.target.value)
                    )
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

              <div className="catalogue-field">
                <label>
                  Catalogue Visibility
                </label>

                <select
                  value={form.catalogue_visible}
                  onChange={(event) =>
                    updateForm(
                      "catalogue_visible",
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={1}>
                    Visible
                  </option>

                  <option value={0}>
                    Hidden
                  </option>
                </select>
              </div>
            </div>

            <div className="catalogue-field">
              <label>Remarks</label>

              <textarea
                rows="3"
                value={form.remarks}
                onChange={(event) =>
                  updateForm(
                    "remarks",
                    event.target.value
                  )
                }
                placeholder="Internal remarks"
              />
            </div>
          </div>

          {editingId && (
            <>
              <div className="catalogue-section">
                <h3>Product Images</h3>

                <div className="catalogue-upload-grid">
                  <input
                    placeholder="Image title"
                    value={
                      newImage.image_title
                    }
                    onChange={(event) =>
                      setNewImage(
                        (previous) => ({
                          ...previous,
                          image_title:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <input
                    placeholder="Image path / URL"
                    value={
                      newImage.image_path
                    }
                    onChange={(event) =>
                      setNewImage(
                        (previous) => ({
                          ...previous,
                          image_path:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <select
                    value={
                      newImage.is_primary
                    }
                    onChange={(event) =>
                      setNewImage(
                        (previous) => ({
                          ...previous,
                          is_primary:
                            Number(
                              event.target.value
                            ),
                        })
                      )
                    }
                  >
                    <option value={0}>
                      Normal Image
                    </option>

                    <option value={1}>
                      Primary Image
                    </option>
                  </select>

                  <button
                    type="button"
                    className="catalogue-secondary-btn"
                    onClick={handleAddImage}
                  >
                    Add Image
                  </button>
                </div>

                {images.length > 0 && (
                  <div className="catalogue-media-list">
                    {images.map((image) => (
                      <div
                        className="catalogue-media-item"
                        key={image.id}
                      >
                        <div>
                          <strong>
                            {image.image_title ||
                              "Product Image"}
                          </strong>

                          <small>
                            {image.image_path}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="catalogue-danger-btn"
                          onClick={() =>
                            handleDeleteImage(
                              image.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="catalogue-section">
                <h3>
                  Technical Documents /
                  Brochures
                </h3>

                <div className="catalogue-upload-grid">
                  <input
                    placeholder="Document title"
                    value={
                      newDocument.document_title
                    }
                    onChange={(event) =>
                      setNewDocument(
                        (previous) => ({
                          ...previous,
                          document_title:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <input
                    placeholder="Document type"
                    value={
                      newDocument.document_type
                    }
                    onChange={(event) =>
                      setNewDocument(
                        (previous) => ({
                          ...previous,
                          document_type:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <input
                    placeholder="File name"
                    value={
                      newDocument.file_name
                    }
                    onChange={(event) =>
                      setNewDocument(
                        (previous) => ({
                          ...previous,
                          file_name:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <input
                    placeholder="File path / URL"
                    value={
                      newDocument.file_path
                    }
                    onChange={(event) =>
                      setNewDocument(
                        (previous) => ({
                          ...previous,
                          file_path:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <button
                    type="button"
                    className="catalogue-secondary-btn"
                    onClick={handleAddDocument}
                  >
                    Add Document
                  </button>
                </div>

                {documents.length > 0 && (
                  <div className="catalogue-media-list">
                    {documents.map(
                      (document) => (
                        <div
                          className="catalogue-media-item"
                          key={document.id}
                        >
                          <div>
                            <strong>
                              {
                                document.document_title
                              }
                            </strong>

                            <small>
                              {
                                document.file_name
                              }
                            </small>
                          </div>

                          <button
                            type="button"
                            className="catalogue-danger-btn"
                            onClick={() =>
                              handleDeleteDocument(
                                document.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="catalogue-modal-footer">
            <button
              type="button"
              className="catalogue-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="catalogue-primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Catalogue"
                : "Save Catalogue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}