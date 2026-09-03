import React from "react";
import { IColumnPick } from "./useReportBuilderStore";

// Compact per-column presentation toggles — Grid/Excel visibility (both
// default to on, so an existing saved report with no flags at all shows
// its columns everywhere, exactly like before this feature existed) and an
// opt-in Total row for Excel exports (defaults off, independent of whether
// the column has an `aggregate` set — a column can be summed IN the grid
// and still not want a grand-total row, or vice versa). Shared by the old
// single-page form (ReportBuilderView.tsx) and the wizard's StepColumns.tsx
// — both render the same base/relation/nested-relation column pickers.
const ColumnFlagsMini = ({
  pick,
  allowTotal,
  onFlag,
}: {
  pick: IColumnPick;
  allowTotal: boolean;
  onFlag: (flag: "showInGrid" | "showInExcel" | "showTotal", value: boolean) => void;
}) => (
  <span style={{ display: "inline-flex", gap: 8, marginLeft: 8, fontSize: 10, color: "#8a8a8a" }}>
    <label style={{ display: "inline-flex", alignItems: "center", gap: 2, margin: 0 }}>
      <input type="checkbox" checked={pick.showInGrid !== false} onChange={(e) => onFlag("showInGrid", e.target.checked)} />
      Grid
    </label>
    <label style={{ display: "inline-flex", alignItems: "center", gap: 2, margin: 0 }}>
      <input type="checkbox" checked={pick.showInExcel !== false} onChange={(e) => onFlag("showInExcel", e.target.checked)} />
      Excel
    </label>
    {allowTotal && (
      <label style={{ display: "inline-flex", alignItems: "center", gap: 2, margin: 0 }}>
        <input type="checkbox" checked={!!pick.showTotal} onChange={(e) => onFlag("showTotal", e.target.checked)} />
        Total
      </label>
    )}
  </span>
);

export default ColumnFlagsMini;
