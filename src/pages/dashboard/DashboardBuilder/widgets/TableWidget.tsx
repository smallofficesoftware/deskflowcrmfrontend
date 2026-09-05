import React from "react";

interface ITableWidgetProps {
  rows: Record<string, unknown>[];
}

// Plain <table>, same convention ReportRunnerView.tsx/LivePreview.tsx
// already use for report result grids — no shared table component exists
// in this codebase to reuse, so this follows the same simple pattern
// rather than pulling in a data-grid library for a dashboard tile.
const TableWidget: React.FC<ITableWidgetProps> = ({ rows }) => {
  if (rows.length === 0) {
    return <div className="text-muted small p-2">No data</div>;
  }
  const columns = Object.keys(rows[0]);

  return (
    <div style={{ overflow: "auto", maxHeight: "100%" }}>
      <table className="table table-sm table-bordered mb-0">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                  {row[c] === null || row[c] === undefined ? "" : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableWidget;
