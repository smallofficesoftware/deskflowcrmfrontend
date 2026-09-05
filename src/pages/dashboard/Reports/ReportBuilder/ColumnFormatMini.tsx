import React, { useState } from "react";
import { IColumnFormat, IColumnPick } from "./useReportBuilderStore";

// Curated date-fns format presets (see date-fns docs for the token
// meanings) — a picker, not free-text pattern entry, matching this app's
// existing "dropdown, not raw input" convention for report configuration.
// "relative" is handled specially by the renderer (formatDistanceToNow),
// not a date-fns format() pattern.
const DATE_FORMAT_PRESETS: { value: string; label: string }[] = [
  { value: "dd-MM-yyyy", label: "31-12-2026" },
  { value: "dd/MM/yyyy", label: "31/12/2026" },
  { value: "MM/dd/yyyy", label: "12/31/2026" },
  { value: "dd-MM-yyyy HH:mm", label: "31-12-2026 14:30" },
  { value: "MMM dd, yyyy", label: "Dec 31, 2026" },
  { value: "relative", label: "3 days ago" },
];

// Collapsed by default (a small "Format" toggle) — only rendered for
// date/number/currency-typed columns (StepColumns.tsx decides that), so it
// never adds clutter to a plain string/lookup field's chip row.
const ColumnFormatMini = ({
  pick,
  colType,
  onFormat,
}: {
  pick: IColumnPick;
  colType: string;
  onFormat: (patch: Partial<IColumnFormat>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const fmt = pick.format || {};
  const isDate = colType === "date";
  const isNumeric = colType === "number" || colType === "currency";
  if (!isDate && !isNumeric) return null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Display format"
        style={{
          fontSize: 10,
          color: open ? "#DC6A1C" : "#8a8a8a",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textDecoration: "underline",
        }}
      >
        Format
      </button>
      {open && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
          {isDate && (
            <select
              className="form-select form-select-sm"
              style={{ fontSize: 11, width: 150, padding: "2px 4px" }}
              value={fmt.date || ""}
              onChange={(e) => onFormat({ date: e.target.value || undefined })}
            >
              <option value="">Default</option>
              {DATE_FORMAT_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
          {isNumeric && (
            <>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: 0, fontSize: 10, color: "#8a8a8a" }}>
                Decimals
                <input
                  type="number"
                  min={0}
                  max={4}
                  style={{ width: 40, fontSize: 11 }}
                  className="form-control form-control-sm"
                  value={fmt.decimals ?? ""}
                  onChange={(e) => onFormat({ decimals: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: 0, fontSize: 10, color: "#8a8a8a" }}>
                <input type="checkbox" checked={!!fmt.thousands} onChange={(e) => onFormat({ thousands: e.target.checked })} />
                1,000s
              </label>
              <input
                type="text"
                placeholder="₹"
                maxLength={3}
                style={{ width: 40, fontSize: 11 }}
                className="form-control form-control-sm"
                value={fmt.currencySymbol || ""}
                onChange={(e) => onFormat({ currencySymbol: e.target.value || undefined })}
              />
            </>
          )}
        </span>
      )}
    </span>
  );
};

export default ColumnFormatMini;
