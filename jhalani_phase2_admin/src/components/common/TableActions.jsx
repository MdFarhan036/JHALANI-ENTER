import React from "react";

export default function TableActions({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onMore,
  showView = true,
  showEdit = true,
  showDelete = true,
  showStatus = false,
  showMore = false,
  statusLabel = "Status",
  disabled = false,
}) {
  return (
    <div className="table-actions">

      {showView && onView && (
        <button
          type="button"
          className="table-action-btn view"
          onClick={onView}
          disabled={disabled}
          title="View"
        >
          View
        </button>
      )}

      {showEdit && onEdit && (
        <button
          type="button"
          className="table-action-btn edit"
          onClick={onEdit}
          disabled={disabled}
          title="Edit"
        >
          Edit
        </button>
      )}

      {showStatus && onToggleStatus && (
        <button
          type="button"
          className="table-action-btn status"
          onClick={onToggleStatus}
          disabled={disabled}
          title={statusLabel}
        >
          {statusLabel}
        </button>
      )}

      {showDelete && onDelete && (
        <button
          type="button"
          className="table-action-btn delete"
          onClick={onDelete}
          disabled={disabled}
          title="Delete"
        >
          Delete
        </button>
      )}

      {showMore && onMore && (
        <button
          type="button"
          className="table-action-btn more"
          onClick={onMore}
          disabled={disabled}
          title="More"
        >
          More
        </button>
      )}

    </div>
  );
}