import React from "react";

export default function CommonTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  rowKey = "id",
  onRowClick,
}) {
  if (loading) {
    return (
      <div className="common-table-state">
        <div className="common-table-loader">
          Loading...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="common-table-state">
        <div className="common-table-empty">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="common-table-wrapper">
      <div className="common-table-scroll">
        <table className="common-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.className || ""}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row[rowKey] ?? rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "common-table-clickable" : ""}
              >
                {columns.map((column) => {
                  const value = row[column.key];

                  return (
                    <td
                      key={column.key}
                      className={column.className || ""}
                    >
                      {column.render
                        ? column.render(value, row, rowIndex)
                        : value ?? "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}