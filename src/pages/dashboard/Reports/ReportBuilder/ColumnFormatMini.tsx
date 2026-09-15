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

// Every small input/select in this panel shares one explicit height —
// Bootstrap's form-control-sm and form-select-sm compute slightly
// different default vertical padding, so two boxes sitting side by side
// (a select next to a number input, say) came out visibly different
// heights when only fontSize/width were set per-control. An explicit
// height makes every box identical regardless of which element/class it
// is. Selects additionally need extra right padding — Bootstrap's own
// dropdown-arrow background-image needs room, or it overlaps the text
// once the element itself is this narrow.
const MINI_HEIGHT = 26;
const miniInputStyle = (width: number): React.CSSProperties => ({
  height: MINI_HEIGHT,
  fontSize: 11,
  width,
  padding: "2px 6px",
  marginBottom: 0,
  boxSizing: "border-box",
});
const miniSelectStyle = (width: number): React.CSSProperties => ({
  ...miniInputStyle(width),
  padding: "2px 20px 2px 6px",
});

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
    <>
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
          marginLeft: 6,
          textDecoration: "underline",
        }}
      >
        Format
      </button>
      {open && (
        // width:100% forces this panel onto its own line within the field
        // row's flex-wrap container, no matter how much room is left after
        // the checkbox/label/aggregate/Grid-Excel-Total controls — it never
        // crams in beside them or overlaps the next field's own row.
        <span style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 6, paddingLeft: 24 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {isDate && (
              <select
                className="form-select form-select-sm"
                style={miniSelectStyle(150)}
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
                    style={miniInputStyle(40)}
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
                  style={miniInputStyle(40)}
                  className="form-control form-control-sm"
                  value={fmt.currencySymbol || ""}
                  onChange={(e) => onFormat({ currencySymbol: e.target.value || undefined })}
                />
              </>
            )}
            {isLookup && (
              <select
                className="form-select form-select-sm"
                style={miniSelectStyle(110)}
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
                  style={miniInputStyle(50)}
                  className="form-control form-control-sm"
                  placeholder="chars"
                  value={fmt.truncate ?? ""}
                  onChange={(e) => onFormat({ truncate: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </label>
            )}
            <label style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: 0, fontSize: 10, color: "#8a8a8a" }}>
              Align
              <select
                className="form-select form-select-sm"
                style={miniSelectStyle(90)}
                value={fmt.align || ""}
                onChange={(e) => onFormat({ align: (e.target.value || undefined) as IColumnFormat["align"] })}
              >
                <option value="">Default</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: 0, fontSize: 10, color: "#8a8a8a" }}>
              Width
              <input
                type="number"
                min={40}
                style={miniInputStyle(55)}
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
                style={miniSelectStyle(180)}
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
                    style={miniInputStyle(50)}
                    className="form-control form-control-sm"
                  />
                  <input
                    type="color"
                    value={cfg.color}
                    onChange={(e) => setStatusColor(value, { color: e.target.value })}
                    style={{ width: 30, height: MINI_HEIGHT, padding: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={cfg.label || ""}
                    onChange={(e) => setStatusColor(value, { label: e.target.value || undefined })}
                    style={miniInputStyle(100)}
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
    </>
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
        style={miniInputStyle(90)}
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
