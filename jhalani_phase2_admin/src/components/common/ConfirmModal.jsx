import React from "react";
import "./common-table.css";

export default function ConfirmModal({
  open = false,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) {
  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onCancel?.();
    }
  };

  return (
    <div
      className="common-confirm-overlay"
      onClick={handleBackdropClick}
    >
      <div
        className="common-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="common-confirm-icon">
          {danger ? "!" : "?"}
        </div>

        <div className="common-confirm-content">
          <h3 id="confirm-modal-title">
            {title}
          </h3>

          <p>{message}</p>
        </div>

        <div className="common-confirm-actions">
          <button
            type="button"
            className="common-confirm-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`common-confirm-submit ${
              danger ? "danger" : ""
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}