import React from "react";
import LivePreview from "./LivePreview";
import { IModelRegistryEntry, IPluginRegistryEntry } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";

// Mirrors ReportBuilderView.tsx's own copy exactly (queryEngine.js's
// ALLOWED_OPERATORS, backend/src/services/report_builder/queryEngine.js)
// — plugin-type filters skip this entirely, one value per filterSchema
// key, no operator picker.
const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  string: [
    { value: "eq", label: "equals" },
    { value: "like", label: "contains" },
  ],
  number: [
    { value: "eq", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less or equal" },
  ],
  currency: [
    { value: "eq", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less or equal" },
  ],
  date: [
    { value: "eq", label: "on" },
    { value: "gte", label: "on or after" },
    { value: "lte", label: "on or before" },
  ],
  lookup: [
    { value: "eq", label: "equals" },
    { value: "in", label: "is one of" },
  ],
};

interface StepFiltersProps {
  selectedModel?: IModelRegistryEntry;
  selectedPlugin?: IPluginRegistryEntry;
}

// Step 3 of the wizard — ported field-for-field from ReportBuilderView.tsx's
// existing "Filters" block. query-type gets the {column,op,value} row
// builder; plugin-type gets one input per its own filterSchema key (no
// operator picker — a plugin's own service decides how each param is
// matched). composite-type never mounts this — no filters exist for it
// today, ReportBuilderWizardView.tsx marks Step 3 not-applicable for it.
const StepFilters: React.FC<StepFiltersProps> = ({ selectedModel, selectedPlugin }) => {
  const store = useReportBuilderStore();

  const addFilterRow = () => {
    if (!selectedModel) return;
    const firstFilterable = selectedModel.columns.find((c) => c.filterable);
    if (!firstFilterable) return;
    store.addFilterRow({ column: firstFilterable.key, op: OPERATORS_BY_TYPE[firstFilterable.type]?.[0]?.value || "eq", value: "" });
  };

  if (store.type === "plugin") {
    if (!selectedPlugin) return <p className="text-muted" style={{ fontSize: 13 }}>Pick a report on Step 1 first.</p>;
    return (
      <div>
        <div className="row g-2">
          {selectedPlugin.filterSchema.map((field) => (
            <div className="col-md-4" key={field.key}>
              <label style={{ fontSize: 12, display: "block" }}>{field.label}</label>
              <input
                className="form-control form-control-sm"
                type="text"
                placeholder={field.type === "date" ? "YYYY-MM-DD,YYYY-MM-DD" : field.label}
                value={store.filters.find((f) => f.column === field.key)?.value || ""}
                onChange={(e) => store.setFilterValue(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
          Date range fields take a comma-separated pair (e.g. 2026-01-01,2026-01-31).
        </div>
      </div>
    );
  }

  if (!selectedModel) {
    return <p className="text-muted" style={{ fontSize: 13 }}>Pick a data source on Step 1 first.</p>;
  }

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-sm btn-link" onClick={addFilterRow}>
          + Add condition
        </button>
      </div>
      {store.filters.length === 0 && (
        <p className="text-muted" style={{ fontSize: 13 }}>No conditions yet — leave empty to include everything.</p>
      )}
      {store.filters.map((f, idx) => {
        const col = selectedModel.columns.find((c) => c.key === f.column);
        const operators = OPERATORS_BY_TYPE[col?.type || "string"] || OPERATORS_BY_TYPE.string;
        return (
          <div key={idx} className="row g-2 mb-1 align-items-center">
            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={f.column}
                onChange={(e) => {
                  const nextCol = selectedModel.columns.find((c) => c.key === e.target.value);
                  store.updateFilterRow(idx, { column: e.target.value, op: OPERATORS_BY_TYPE[nextCol?.type || "string"]?.[0]?.value || "eq" });
                }}
              >
                {selectedModel.columns
                  .filter((c) => c.filterable)
                  .map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={f.op} onChange={(e) => store.updateFilterRow(idx, { op: e.target.value })}>
                {operators.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                value={f.value}
                onChange={(e) => store.updateFilterRow(idx, { value: e.target.value })}
                placeholder="Value"
              />
            </div>
            <div className="col-md-1">
              <button className="btn btn-sm btn-outline-danger" onClick={() => store.removeFilterRow(idx)}>
                &times;
              </button>
            </div>
          </div>
        );
      })}
      </div>
      <LivePreview />
    </div>
  );
};

export default StepFilters;
