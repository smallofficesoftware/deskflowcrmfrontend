import React, { useEffect, useState } from "react";
import {
  getModelRegistry,
  IModelRegistryEntry,
  IReportDefinition,
  listReportDefinitions,
  runReportDefinition,
} from "../Reports/ReportBuilder/ReportBuilderController";
import { addQuickCounterWidget, addWidget, IDashboardWidget } from "./DashboardBuilderController";

const CHART_WIDGET_TYPES: { value: IDashboardWidget["widget_type"]; label: string }[] = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "doughnut", label: "Doughnut Chart" },
  { value: "table", label: "Table" },
];

const AGGREGATES: { value: "sum" | "avg" | "min" | "max" | "count"; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

interface IAddWidgetModalProps {
  dashboardId: number;
  onClose: () => void;
  onAdded: () => void;
}

// Two ways to add a widget: pick an EXISTING report (any type), or the
// "quick counter" shortcut (model_key + column + aggregate, no Report
// Builder wizard trip — see dashboardWidgetServices.js's
// addQuickCounterWidget). Both end up as a real dashboard_widgets row
// pointing at a real report_definitions row either way.
const AddWidgetModal: React.FC<IAddWidgetModalProps> = ({ dashboardId, onClose, onAdded }) => {
  const [mode, setMode] = useState<"existing" | "quick_counter">("existing");
  const [saving, setSaving] = useState(false);

  // --- Existing Report tab ---
  const [reports, setReports] = useState<IReportDefinition[]>([]);
  const [reportId, setReportId] = useState<number | "">("");
  const [widgetType, setWidgetType] = useState<IDashboardWidget["widget_type"]>("bar");
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);
  const [labelColumn, setLabelColumn] = useState("");
  const [valueColumn, setValueColumn] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (mode !== "existing") return;
    listReportDefinitions().then(setReports);
  }, [mode]);

  useEffect(() => {
    if (!reportId) {
      setSampleColumns([]);
      return;
    }
    // Runs the picked report once, small, just to discover its REAL output
    // row keys — the same keys regardless of query/composite/plugin type,
    // rather than re-deriving per-type columns_json parsing rules here.
    runReportDefinition(Number(reportId), { limit: 5 }).then((result) => {
      const rows = result?.rows || [];
      setSampleColumns(rows.length > 0 ? Object.keys(rows[0]) : []);
    });
  }, [reportId]);

  const needsChartMapping = widgetType !== "table";

  const handleAddExisting = async () => {
    if (!reportId) return;
    if (needsChartMapping && (!labelColumn || !valueColumn)) return;
    setSaving(true);
    try {
      const created = await addWidget(dashboardId, {
        report_definition_id: Number(reportId),
        widget_type: widgetType,
        title: title || undefined,
        chart_config_json: needsChartMapping ? { labelColumn, valueColumn } : undefined,
        width: widgetType === "table" ? 6 : 4,
        height: widgetType === "table" ? 4 : 3,
      });
      if (created) onAdded();
    } finally {
      setSaving(false);
    }
  };

  // --- Quick Counter tab ---
  const [models, setModels] = useState<IModelRegistryEntry[]>([]);
  const [modelKey, setModelKey] = useState("");
  const [column, setColumn] = useState("");
  const [aggregate, setAggregate] = useState<"sum" | "avg" | "min" | "max" | "count">("count");
  const [counterLabel, setCounterLabel] = useState("");

  useEffect(() => {
    if (mode !== "quick_counter") return;
    getModelRegistry().then(setModels);
  }, [mode]);

  const selectedModel = models.find((m) => m.key === modelKey);
  const aggregatableColumns = (selectedModel?.columns || []).filter((c) => !c.aggregatable || c.aggregatable.length > 0);
  const selectedColumn = aggregatableColumns.find((c) => c.key === column);
  const allowedAggregates = selectedColumn?.aggregatable && selectedColumn.aggregatable.length > 0 ? AGGREGATES.filter((a) => selectedColumn.aggregatable!.includes(a.value)) : AGGREGATES;

  const handleAddQuickCounter = async () => {
    if (!modelKey || !column || !aggregate) return;
    setSaving(true);
    try {
      const created = await addQuickCounterWidget(dashboardId, {
        model_key: modelKey,
        column,
        aggregate,
        label: counterLabel || undefined,
        title: counterLabel || undefined,
      });
      if (created) onAdded();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: 460, maxHeight: "85vh", overflowY: "auto", borderRadius: 6, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong>Add Widget</strong>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="btn-group btn-group-sm mb-3 w-100" role="group">
          <button type="button" className={`btn ${mode === "existing" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setMode("existing")}>
            Existing Report
          </button>
          <button type="button" className={`btn ${mode === "quick_counter" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setMode("quick_counter")}>
            Quick Counter
          </button>
        </div>

        {mode === "existing" ? (
          <div className="d-flex flex-column gap-2">
            <label className="form-label small mb-0">Report</label>
            <select className="form-select form-select-sm" value={reportId} onChange={(e) => setReportId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Select a report...</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <label className="form-label small mb-0 mt-1">Widget type</label>
            <select className="form-select form-select-sm" value={widgetType} onChange={(e) => setWidgetType(e.target.value as IDashboardWidget["widget_type"])}>
              {CHART_WIDGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {needsChartMapping && (
              <>
                <label className="form-label small mb-0 mt-1">Label column (X-axis / slice name)</label>
                <select className="form-select form-select-sm" value={labelColumn} onChange={(e) => setLabelColumn(e.target.value)} disabled={sampleColumns.length === 0}>
                  <option value="">Select...</option>
                  {sampleColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <label className="form-label small mb-0 mt-1">Value column</label>
                <select className="form-select form-select-sm" value={valueColumn} onChange={(e) => setValueColumn(e.target.value)} disabled={sampleColumns.length === 0}>
                  <option value="">Select...</option>
                  {sampleColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {reportId && sampleColumns.length === 0 && (
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    This report returned no rows to detect columns from — save it with real data first.
                  </div>
                )}
              </>
            )}

            <label className="form-label small mb-0 mt-1">Widget title (optional)</label>
            <input className="form-control form-control-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={reports.find((r) => r.id === reportId)?.name || ""} />

            <button className="btn btn-sm btn-primary mt-3" onClick={handleAddExisting} disabled={saving || !reportId || (needsChartMapping && (!labelColumn || !valueColumn))}>
              {saving ? "Adding..." : "Add Widget"}
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            <label className="form-label small mb-0">Data source</label>
            <select className="form-select form-select-sm" value={modelKey} onChange={(e) => { setModelKey(e.target.value); setColumn(""); }}>
              <option value="">Select...</option>
              {models.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className="form-label small mb-0 mt-1">Column</label>
            <select className="form-select form-select-sm" value={column} onChange={(e) => setColumn(e.target.value)} disabled={!modelKey}>
              <option value="">Select...</option>
              {aggregatableColumns.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="form-label small mb-0 mt-1">Aggregate</label>
            <select className="form-select form-select-sm" value={aggregate} onChange={(e) => setAggregate(e.target.value as typeof aggregate)} disabled={!column}>
              {allowedAggregates.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>

            <label className="form-label small mb-0 mt-1">Label (optional)</label>
            <input className="form-control form-control-sm" value={counterLabel} onChange={(e) => setCounterLabel(e.target.value)} placeholder="e.g. Total Open Tasks" />

            <button className="btn btn-sm btn-primary mt-3" onClick={handleAddQuickCounter} disabled={saving || !modelKey || !column || !aggregate}>
              {saving ? "Adding..." : "Add Counter"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetModal;
