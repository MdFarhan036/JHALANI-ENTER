import React from "react";

export default function EmptyState({
  title = "No records found",
  message = "There are no records to display.",
  actionLabel = "",
  onAction,
}) {
  return (
    <div className="common-empty-state">
      <div className="common-empty-icon">
        ∅
      </div>

      <h3>{title}</h3>

      <p>{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="common-empty-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}