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

export interface MatchingRelation {
  key: string;
  label: string;
  columns: { key: string; label: string }[];
}

// Collapsed by default (a small "Format" toggle). Which controls actually
// render depends on colType — never shown at all for a plain string
// column with nothing to configure (truncate/align/width still apply to
// string, so it's not fully excluded, just date/number/boolean/status
// controls are type-gated).
const ColumnFormatMini = ({
  pick,
  colType,
  matchingRelations,
  onFormat,
}: {
  pick: IColumnPick;
  colType: string;
  // Top-level, plain-scalar relations on THIS table whose foreignKey
  // matches this column's own key — the lookup-label auto-resolve
  // candidates. Undefined/empty when there are none (most columns).
  matchingRelations?: MatchingRelation[];
  onFormat: (patch: Partial<IColumnFormat>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const fmt = pick.format || {};
  const isDate = colType === "date";
  const isNumeric = colType === "number" || colType === "currency";
  const isString = colType === "string";
  const isLookup = colType === "lookup";
  const hasLabelRelations = isLookup && matchingRelations && matchingRelations.length > 0;

  const statusColorEntries = Object.entries(fmt.statusColors || {});
  const setStatusColor = (value: string, patch: Partial<{ label: string; color: string }> | null) => {
    const next = { ...(fmt.statusColors || {}) };
    if (patch === null) {
      delete next[value];
    } else {
      const existing = next[value] || { color: "#6c757d" };
      next[value] = { ...existing, ...patch };
    }
    onFormat({ statusColors: next });
  };

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
        <span style={{ display: "inline-flex", flexDirection: "column", gap: 6, marginLeft: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
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
            {isLookup && (
              <select
                className="form-select form-select-sm"
                style={{ fontSize: 11, width: 110, padding: "2px 4px" }}
                value={fmt.boolean || ""}
                onChange={(e) => onFormat({ boolean: (e.target.value || undefined) as IColumnFormat["boolean"] })}
              >
                <option value="">Raw value</option>
                <option value="yesno">Yes / No</option>
                <option value="checkmark">✓ / ✗</option>
              </select>
            )}
            {isString && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: 0, fontSize: 10, color: "#8a8a8a" }}>
                Truncate
                <input
                  type="number"
                  min={5}
                  style={{ width: 50, fontSize: 11 }}
                  className="form-control form-control-sm"
                  placeholder="chars"
                  value={fmt.truncate ?? ""}
                  onChange={(e) => onFormat({ truncate: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </label>
            )}
            <select
              className="form-select form-select-sm"
              style={{ fontSize: 11, width: 90, padding: "2px 4px" }}
              value={fmt.align || ""}
              onChange={(e) => onFormat({ align: (e.target.value || undefined) as IColumnFormat["align"] })}
            >
              <option value="">Align: default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: 0, fontSize: 10, color: "#8a8a8a" }}>
              Width
              <input
                type="number"
                min={40}
                style={{ width: 55, fontSize: 11 }}
                className="form-control form-control-sm"
                placeholder="px"
                value={fmt.width ?? ""}
                onChange={(e) => onFormat({ width: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </label>
          </span>

          {hasLabelRelations && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#8a8a8a" }}>
              Show as label:
              <select
                className="form-select form-select-sm"
                style={{ fontSize: 11, width: 180, padding: "2px 4px" }}
                value={fmt.labelRelation || ""}
                onChange={(e) => onFormat({ labelRelation: e.target.value || undefined })}
              >
                <option value="">Raw value</option>
                {matchingRelations!.flatMap((rel) =>
                  rel.columns.map((c) => (
                    <option key={c.key} value={c.key}>
                      {rel.label} → {c.label}
                    </option>
                  )),
                )}
              </select>
            </span>
          )}

          {isLookup && (
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, color: "#8a8a8a" }}>Status colors (by raw value):</span>
              {statusColorEntries.map(([value, cfg]) => (
                <span key={value} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="text"
                    disabled
                    value={value}
                    style={{ width: 50, fontSize: 11 }}
                    className="form-control form-control-sm"
                  />
                  <input
                    type="color"
                    value={cfg.color}
                    onChange={(e) => setStatusColor(value, { color: e.target.value })}
                    style={{ width: 30, height: 24, padding: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={cfg.label || ""}
                    onChange={(e) => setStatusColor(value, { label: e.target.value || undefined })}
                    style={{ width: 100, fontSize: 11 }}
                    className="form-control form-control-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setStatusColor(value, null)}
                    style={{ border: "none", background: "none", color: "#b02a37", cursor: "pointer", fontSize: 12 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <AddStatusColorRow onAdd={(value) => setStatusColor(value, {})} />
            </span>
          )}
        </span>
      )}
    </span>
  );
};

// Small controlled input + button so typing a value doesn't add a row on
// every keystroke — only on explicit "Add".
const AddStatusColorRow: React.FC<{ onAdd: (value: string) => void }> = ({ onAdd }) => {
  const [value, setValue] = useState("");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <input
        type="text"
        placeholder="Value (e.g. 1)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: 90, fontSize: 11 }}
        className="form-control form-control-sm"
      />
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        style={{ fontSize: 10, padding: "1px 6px" }}
        disabled={!value.trim()}
        onClick={() => {
          if (!value.trim()) return;
          onAdd(value.trim());
          setValue("");
        }}
      >
        + Add
      </button>
    </span>
  );
};

export default ColumnFormatMini;
