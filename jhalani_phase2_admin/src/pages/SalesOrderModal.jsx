import React from "react";
import "../styles/master.css";
import "../styles/layout.css";
import "../styles/salesOrders.css";

const SalesOrderModal = ({
  open,
  title = "New Order",
  subtitle = "",
  onSubmit,
  onClose,
  loading = false,
  error = "",
  children,
  hideActions = false,
  submitLabel = "Save Order",
}) => {
  if (!open) return null;

  return (
    <div
      className="sales-order-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }
      }}
    >
      <div
        className="sales-order-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="sales-order-modal-header">
          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            className="sales-order-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="sales-order-modal-form"
        >
          <div className="sales-order-modal-body">
            {children}

            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}
          </div>

          {!hideActions && (
            <div className="sales-order-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : submitLabel}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SalesOrderModal;