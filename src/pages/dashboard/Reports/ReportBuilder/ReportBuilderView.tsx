import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PromptModal from "../../../../components/model/PromptModal";
import {
  createReportDefinition,
  deleteReportDefinition,
  exportReportExcel,
  exportReportPdf,
  getModelRegistry,
  getPluginRegistry,
  IModelRegistryEntry,
  IPluginRegistryEntry,
  IReportColumn,
  IReportDefinition,
  listReportDefinitions,
  runReportDefinition,
  updateReportDefinition,
  verifyReportPin,
} from "./ReportBuilderController";
import ReportPdfTemplateDesigner from "./ReportPdfTemplateDesigner";
import { useReportBuilderStore } from "./useReportBuilderStore";

// Operator choices per column type — mirrors queryEngine.js's ALLOWED_OPERATORS
// exactly (backend/src/services/report_builder/queryEngine.js). Only used
// for query-type filters — plugin-type filters are one value per the
// plugin's own filterSchema key, no operator picker (see PluginFilterForm).
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

const AGGREGATE_LABELS: Record<string, string> = {
  sum: "Sum",
  avg: "Average",
  min: "Min",
  max: "Max",
  count: "Count",
};

// Report Builder — query-type (Phase 1 slice) + plugin-type (wraps the 2
// proof complex-report services, unmodified) in one form. No PAGE_ID/rights
// pre-check client-side — access is entirely server-side (report_builder
// company_feature_flags key + the shared owner+PIN gate, same PIN as
// Document Designer), this page just surfaces whatever the API says.
const ReportBuilderView: React.FC = () => {
  const navigate = useNavigate();
  const store = useReportBuilderStore();

  const [pinVerified, setPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true);

  const [registry, setRegistry] = useState<IModelRegistryEntry[]>([]);
  const [plugins, setPlugins] = useState<IPluginRegistryEntry[]>([]);
  const [definitions, setDefinitions] = useState<IReportDefinition[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [saving, setSaving] = useState(false);

  const [runningId, setRunningId] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<{ definitionId: number; rows: any[]; row_count: number; duration_ms: number } | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [templatesForDef, setTemplatesForDef] = useState<IReportDefinition | null>(null);

  const selectedModel = registry.find((m) => m.key === store.modelKey);
  const selectedPlugin = plugins.find((p) => p.key === store.pluginKey);

  const loadBuildData = async () => {
    setLoadingRegistry(true);
    const [reg, plg, defs] = await Promise.all([getModelRegistry(), getPluginRegistry(), listReportDefinitions()]);
    setRegistry(reg);
    setPlugins(plg);
    setDefinitions(defs);
    setLoadingRegistry(false);
  };

  useEffect(() => {
    if (pinVerified) loadBuildData();
  }, [pinVerified]);

  const handlePinSubmit = async (pin: string) => {
    const ok = await verifyReportPin(pin);
    if (ok) {
      setPinVerified(true);
      setShowPinModal(false);
    }
  };

  const addFilterRow = () => {
    if (!selectedModel) return;
    const firstFilterable = selectedModel.columns.find((c) => c.filterable);
    if (!firstFilterable) return;
    store.addFilterRow({ column: firstFilterable.key, op: OPERATORS_BY_TYPE[firstFilterable.type]?.[0]?.value || "eq", value: "" });
  };

  const handleSave = async () => {
    if (!store.name.trim()) return;
    setSaving(true);

    let created;
    if (store.type === "plugin") {
      if (!store.pluginKey) {
        setSaving(false);
        return;
      }
      // Plugin filters are a plain object keyed to the plugin's own param
      // names, not the query-type {column,op,value}[] shape — store.filters
      // is repurposed here as [{column: paramKey, value}], flattened to an
      // object for the save payload. "date" fields (e.g. sourceReport's
      // selected_dates) go over the wire as a real 2-element array — that
      // plugin does `Array.isArray(selected_dates)` itself, a comma string
      // would fail its own validation, not something to special-case
      // per-plugin here since filterSchema already says which fields are dates.
      const filtersObject = Object.fromEntries(
        store.filters
          .filter((f) => f.value !== "")
          .map((f) => {
            const fieldDef = selectedPlugin?.filterSchema.find((s) => s.key === f.column);
            const value = fieldDef?.type === "date" ? f.value.split(",").map((v) => v.trim()) : f.value;
            return [f.column, value];
          }),
      );
      const payload = {
        name: store.name.trim(),
        type: "plugin" as const,
        plugin_key: store.pluginKey,
        // Not yet used for display — the results grid reads columns
        // straight off the run result's real keys for plugin-type
        // (Object.keys(rows[0])), since each plugin's row shape is
        // different and there's no per-column config UI for plugin mode
        // yet. Stored honestly empty rather than a fake placeholder value.
        columns_json: [],
        filters_json: filtersObject,
      };
      created = store.editingId
        ? await updateReportDefinition(store.editingId, payload)
        : await createReportDefinition(payload);
    } else {
      if (!store.modelKey || store.columns.length === 0) {
        setSaving(false);
        return;
      }
      const payload = {
        name: store.name.trim(),
        type: "query" as const,
        model_key: store.modelKey,
        columns_json: store.columns,
        filters_json: store.filters.filter((f) => f.value !== ""),
        group_by_json: store.groupBy,
      };
      created = store.editingId
        ? await updateReportDefinition(store.editingId, payload)
        : await createReportDefinition(payload);
    }

    setSaving(false);
    if (created) {
      store.reset();
      loadBuildData();
    }
  };

  const handleEdit = (definition: IReportDefinition) => {
    store.loadForEdit(definition);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (definition: IReportDefinition) => {
    const ok = await deleteReportDefinition(definition.id);
    if (ok) {
      if (store.editingId === definition.id) store.reset();
      loadBuildData();
    }
  };

  const handleRun = async (definition: IReportDefinition) => {
    setRunningId(definition.id);
    setRunResult(null);
    const result = await runReportDefinition(definition.id);
    setRunningId(null);
    if (result) setRunResult({ definitionId: definition.id, ...result });
  };

  const runResultColumns = runResult && runResult.rows.length > 0 ? Object.keys(runResult.rows[0]) : [];

  const handleExportExcel = async (definition: IReportDefinition) => {
    setExportingId(definition.id);
    const url = await exportReportExcel(definition.id);
    setExportingId(null);
    if (url) window.open(url, "_blank");
  };

  const handleExportPdf = async (definition: IReportDefinition) => {
    setExportingId(definition.id);
    const url = await exportReportPdf(definition.id);
    setExportingId(null);
    if (url) window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 20 }}>
      <PromptModal
        show={showPinModal && !pinVerified}
        onHide={() => navigate(-1)}
        onSubmit={handlePinSubmit}
        title="Owner PIN required"
        message="Report Builder is an owner-only area. Enter the shared build PIN to continue (same PIN as Document Designer)."
        placeholder="PIN"
        submitLabel="Verify"
      />

      {pinVerified && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Report Builder</h4>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>

          {/* --- build form --- */}
          <div className="card p-3 mb-4">
            <h6>{store.editingId ? "Edit Report" : "New Report"}</h6>

            <div className="row g-2 mb-2 align-items-center">
              <div className="col-md-3">
                <input
                  className="form-control form-control-sm"
                  placeholder="Report name"
                  value={store.name}
                  onChange={(e) => store.setName(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${store.type === "query" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => store.setType("query")}
                  >
                    Query
                  </button>
                  <button
                    type="button"
                    className={`btn ${store.type === "plugin" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => store.setType("plugin")}
                  >
                    Plugin
                  </button>
                </div>
              </div>
              {store.type === "query" ? (
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={store.modelKey}
                    onChange={(e) => store.setModelKey(e.target.value)}
                    disabled={loadingRegistry}
                  >
                    <option value="">Select data source...</option>
                    {registry.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={store.pluginKey}
                    onChange={(e) => store.setPluginKey(e.target.value)}
                    disabled={loadingRegistry}
                  >
                    <option value="">Select report...</option>
                    {plugins.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {store.type === "query" && selectedModel && (
              <>
                <div className="mb-2">
                  <strong style={{ fontSize: 13 }}>Columns</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                    {selectedModel.columns.map((col: IReportColumn) => {
                      const picked = store.columns.find((c) => c.column === col.key);
                      return (
                        <div key={col.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <label style={{ fontSize: 13, margin: 0 }}>
                            <input type="checkbox" checked={!!picked} onChange={() => store.toggleColumn(col.key)} style={{ marginRight: 4 }} />
                            {col.label}
                          </label>
                          {picked && col.aggregatable && col.aggregatable.length > 0 && (
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 110 }}
                              value={picked.aggregate || ""}
                              onChange={(e) => store.setColumnAggregate(col.key, e.target.value)}
                            >
                              <option value="">(no aggregate)</option>
                              {col.aggregatable.map((agg) => (
                                <option key={agg} value={agg}>
                                  {AGGREGATE_LABELS[agg] || agg}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Whitelisted joins — select/display only, no aggregate,
                    never appear in the filter/group-by pickers below (those
                    only iterate selectedModel.columns, not .relations). */}
                {selectedModel.relations && selectedModel.relations.length > 0 && (
                  <div className="mb-2">
                    {selectedModel.relations.map((rel) => (
                      <div key={rel.key} style={{ marginBottom: 6 }}>
                        <strong style={{ fontSize: 12, color: "#666" }}>Related: {rel.label}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                          {rel.columns.map((col: IReportColumn) => {
                            const picked = store.columns.some((c) => c.column === col.key);
                            return (
                              <label key={col.key} style={{ fontSize: 13, margin: 0 }}>
                                <input type="checkbox" checked={picked} onChange={() => store.toggleColumn(col.key)} style={{ marginRight: 4 }} />
                                {col.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-2">
                  <strong style={{ fontSize: 13 }}>Group by</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                    {selectedModel.columns
                      .filter((c) => c.groupable)
                      .map((col) => (
                        <label key={col.key} style={{ fontSize: 13, margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={store.groupBy.includes(col.key)}
                            onChange={() => store.toggleGroupBy(col.key)}
                            style={{ marginRight: 4 }}
                          />
                          {col.label}
                        </label>
                      ))}
                  </div>
                </div>

                <div className="mb-2">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13 }}>Filters</strong>
                    <button className="btn btn-sm btn-link" onClick={addFilterRow}>
                      + Add filter
                    </button>
                  </div>
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
              </>
            )}

            {store.type === "plugin" && selectedPlugin && (
              <div className="mb-2">
                <strong style={{ fontSize: 13 }}>Filters</strong>
                <div className="row g-2 mt-1">
                  {selectedPlugin.filterSchema.map((field) => (
                    <div className="col-md-4" key={field.key}>
                      <label style={{ fontSize: 12, display: "block" }}>{field.label}</label>
                      <input
                        className="form-control form-control-sm"
                        type={field.type === "date" ? "text" : "text"}
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
            )}

            {((store.type === "query" && selectedModel) || (store.type === "plugin" && selectedPlugin)) && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={saving || !store.name.trim() || (store.type === "query" && store.columns.length === 0)}
                  onClick={handleSave}
                >
                  {saving ? "Saving..." : store.editingId ? "Update Report" : "Save Report"}
                </button>
                {store.editingId && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => store.reset()}>
                    Cancel Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* --- saved reports --- */}
          <div className="card p-3">
            <h6>Saved Reports</h6>
            {definitions.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>No reports yet — build one above.</p>}
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((def) => (
                  <React.Fragment key={def.id}>
                    <tr>
                      <td>{def.name}</td>
                      <td>{def.type}</td>
                      <td>{def.type === "plugin" ? def.plugin_key : def.model_key}</td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm btn-outline-primary" disabled={runningId === def.id} onClick={() => handleRun(def)}>
                          {runningId === def.id ? "Running..." : "Run"}
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(def)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(def)}>
                          Delete
                        </button>
                        <button className="btn btn-sm btn-outline-success" disabled={exportingId === def.id} onClick={() => handleExportExcel(def)}>
                          Excel
                        </button>
                        <button className="btn btn-sm btn-outline-dark" disabled={exportingId === def.id} onClick={() => handleExportPdf(def)}>
                          PDF / Print
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setTemplatesForDef(def)}>
                          Manage Templates
                        </button>
                      </td>
                    </tr>
                    {runResult && runResult.definitionId === def.id && (
                      <tr>
                        <td colSpan={4}>
                          <div style={{ fontSize: 12, marginBottom: 4 }}>
                            {runResult.row_count} row(s) &middot; {runResult.duration_ms}ms
                          </div>
                          {runResult.rows.length > 0 ? (
                            <div style={{ overflowX: "auto" }}>
                              <table className="table table-sm table-bordered">
                                <thead>
                                  <tr>
                                    {runResultColumns.map((c) => (
                                      <th key={c}>{c}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {runResult.rows.map((row, i) => (
                                    <tr key={i}>
                                      {runResultColumns.map((c) => (
                                        <td key={c}>{String(row[c])}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: 12 }}>No data.</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {templatesForDef && (
        <ReportPdfTemplateDesigner
          docType={`report_${templatesForDef.id}`}
          reportName={templatesForDef.name}
          onClose={() => setTemplatesForDef(null)}
        />
      )}
    </div>
  );
};

export default ReportBuilderView;
