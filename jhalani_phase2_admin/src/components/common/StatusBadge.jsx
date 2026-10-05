import React from "react";

export default function StatusBadge({
  status,
  labels = {},
  type = "default",
}) {
  const getStatusKey = () => {
    if (status === true) return "active";
    if (status === false) return "inactive";

    if (status === null || status === undefined || status === "") {
      return "unknown";
    }

    return String(status)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "-");
  };

  const statusKey = getStatusKey();

  const defaultLabels = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    cancelled: "Cancelled",
    maintenance: "Maintenance",
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    expired: "Expired",
    paid: "Paid",
    unpaid: "Unpaid",
    partial: "Partial",
    low: "Low",
    ouOfStock: "Out of Stock",
    instock: "In Stock",
    unknown: "Unknown",
  };

  const label =
    labels[statusKey] ||
    defaultLabels[statusKey] ||
    String(status ?? "Unknown");

  return (
    <span
      className={`status-badge status-${statusKey} status-type-${type}`}
    >
      <span className="status-badge-dot" />
      {label}
    </span>
  );
}