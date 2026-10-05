import React from "react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  showPageInfo = true,
  maxVisiblePages = 5,
}) {
  if (totalItems === 0 || totalPages <= 1) {
    if (totalItems === 0 && showPageInfo) {
      return (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            Showing 0 of 0
          </div>
        </div>
      );
    }

    return null;
  }

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const startItem =
    (safeCurrentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    safeCurrentPage * itemsPerPage,
    totalItems
  );

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    let start = Math.max(
      2,
      safeCurrentPage - Math.floor(maxVisiblePages / 2)
    );

    let end = Math.min(
      totalPages - 1,
      start + maxVisiblePages - 3
    );

    if (end - start < maxVisiblePages - 3) {
      start = Math.max(
        2,
        end - maxVisiblePages + 3
      );
    }

    if (start > 2) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="pagination-wrapper">

      {showPageInfo && (
        <div className="pagination-info">
          Showing{" "}
          <strong>{startItem}</strong>
          {" - "}
          <strong>{endItem}</strong>
          {" of "}
          <strong>{totalItems}</strong>
        </div>
      )}

      <div className="pagination-controls">

        <button
          type="button"
          className="pagination-button"
          disabled={safeCurrentPage === 1}
          onClick={() =>
            onPageChange?.(safeCurrentPage - 1)
          }
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="pagination-ellipsis"
              >
                ...
              </span>
            );
          }

          return (
            <button
              type="button"
              key={page}
              className={`pagination-button ${
                page === safeCurrentPage
                  ? "active"
                  : ""
              }`}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          className="pagination-button"
          disabled={safeCurrentPage === totalPages}
          onClick={() =>
            onPageChange?.(safeCurrentPage + 1)
          }
        >
          Next
        </button>

      </div>
    </div>
  );
}