import React from "react";

export default function TableFilterBar({
  search = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  values = {},
  onChange,
  onReset,
  children,
}) {
  const handleFilterChange = (name, value) => {
    onChange?.({
      ...values,
      [name]: value,
    });
  };

  return (
    <div className="table-filter-bar">

      {/* SEARCH */}
      {onSearchChange && (
        <div className="table-search">
          <span className="table-search-icon">⌕</span>

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />

          {search && (
            <button
              type="button"
              className="table-search-clear"
              onClick={() => onSearchChange("")}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* FILTERS */}
      <div className="table-filters">
        {filters.map((filter) => (
          <div
            className="table-filter-item"
            key={filter.name}
          >
            {filter.label && (
              <label htmlFor={`filter-${filter.name}`}>
                {filter.label}
              </label>
            )}

            {filter.type === "select" || !filter.type ? (
              <select
                id={`filter-${filter.name}`}
                value={values[filter.name] ?? ""}
                onChange={(e) =>
                  handleFilterChange(
                    filter.name,
                    e.target.value
                  )
                }
              >
                <option value="">
                  {filter.placeholder || `All ${filter.label || ""}`}
                </option>

                {(filter.options || []).map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`filter-${filter.name}`}
                type={filter.type}
                value={values[filter.name] ?? ""}
                placeholder={filter.placeholder || ""}
                onChange={(e) =>
                  handleFilterChange(
                    filter.name,
                    e.target.value
                  )
                }
              />
            )}
          </div>
        ))}

        {/* CUSTOM CONTENT */}
        {children}

        {/* RESET */}
        {onReset && (
          <button
            type="button"
            className="table-filter-reset"
            onClick={onReset}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}