import React, { useEffect, useState } from "react";
import { REPORT_ICON_PATHS, ReportIcon } from "../../../side-view/reportIcons";
import ManageGroupsModal from "./ManageGroupsModal";
import { IMetricEntry, IModelRegistryEntry, IReportGroup, listReportGroups } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";

interface StepOrganizeProps {
  selectedModel?: IModelRegistryEntry;
  metrics: IMetricEntry[];
}

// Resolves a picked column/metric key back to a human label for the
// reorder list — checks base columns, then one hop of relations, then a
// second hop of nested relations (same traversal StepColumns.tsx already
// does to render them), falling back to the raw key so an unresolved
// key still shows something instead of going blank.
const buildColumnLabelMap = (selectedModel?: IModelRegistryEntry): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!selectedModel) return map;
  selectedModel.columns.forEach((c) => (map[c.key] = c.label));
  (selectedModel.relations || []).forEach((rel) => {
    rel.columns.forEach((c) => (map[c.key] = `${rel.label} → ${c.label}`));
    (rel.relations || []).forEach((sub) => {
      sub.columns.forEach((c) => (map[c.key] = `${rel.label} → ${sub.label} → ${c.label}`));
    });
  });
  return map;
};

// Up/down reorder list, shared shape for query-type columns and
// composite-type metrics — no drag library, just two buttons per row.
// This sets the AUTHOR's saved default display order (columns_json's own
// array order), separate from and unrelated to the run screen's own
// per-viewer ColumnsButton/useColumnPreferences reorder.
const ReorderList: React.FC<{ items: { key: string; label: string }[]; onMove: (index: number, direction: -1 | 1) => void }> = ({ items, onMove }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
    {items.map((item, index) => (
      <div
        key={item.key}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          fontSize: 13,
        }}
      >
        <span style={{ flex: 1 }}>{item.label}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          title="Move up"
          style={{ padding: "0 8px", lineHeight: "22px" }}
        >
          ↑
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={index === items.length - 1}
          onClick={() => onMove(index, 1)}
          title="Move down"
          style={{ padding: "0 8px", lineHeight: "22px" }}
        >
          ↓
        </button>
      </div>
    ))}
  </div>
);

// Step 4 of the wizard — ported field-for-field from ReportBuilderView.tsx's
// existing group-select + icon-picker row. Fetches its own report_groups
// list (small, per-company, same "list is already scoped and small"
// reasoning the Saved Reports search box relies on) rather than threading
// it down from ReportBuilderWizardView.tsx, so ManageGroupsModal's own
// create/rename/delete only has to refresh state that lives right here.
const StepOrganize: React.FC<StepOrganizeProps> = ({ selectedModel, metrics }) => {
  const store = useReportBuilderStore();
  const [reportGroups, setReportGroups] = useState<IReportGroup[]>([]);
  const [showManageGroups, setShowManageGroups] = useState(false);

  const loadReportGroups = async () => setReportGroups(await listReportGroups());
  useEffect(() => {
    loadReportGroups();
  }, []);

  const columnLabelMap = buildColumnLabelMap(selectedModel);
  const metricLabelMap: Record<string, string> = {};
  metrics.forEach((m) => (metricLabelMap[m.key] = m.label));

  return (
    <div>
      {store.type === "query" && store.columns.length > 0 && (
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
            Column order
          </label>
          <div className="text-muted" style={{ fontSize: 11, marginBottom: 8 }}>
            Sets the default order columns appear in on the grid and in exports. Viewers can still reorder their own view.
          </div>
          <ReorderList
            items={store.columns.map((c) => ({ key: c.column, label: columnLabelMap[c.column] || c.column }))}
            onMove={store.moveColumn}
          />
        </div>
      )}

      {store.type === "composite" && store.metricKeys.length > 0 && (
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
            Metric order
          </label>
          <div className="text-muted" style={{ fontSize: 11, marginBottom: 8 }}>
            Sets the default order metrics appear in on the grid and in exports.
          </div>
          <ReorderList
            items={store.metricKeys.map((k) => ({ key: k, label: metricLabelMap[k] || k }))}
            onMove={store.moveMetric}
          />
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          Group
        </label>
        <div className="d-flex gap-1">
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 260 }}
            value={store.reportGroupId ?? ""}
            onChange={(e) => store.setReportGroupId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Ungrouped</option>
            {reportGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowManageGroups(true)}>
            Groups
          </button>
        </div>
      </div>

      <div className="mb-2">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          Icon
        </label>
        {/* Clickable icon grid — matches the approved wizard mock's own
            icon-grid design, over this app's real REPORT_ICON_PATHS set
            (every icon the old <select> offered, none dropped) rather than
            the mock's own smaller placeholder set. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8, maxWidth: 420 }}>
          <button
            type="button"
            title="Default"
            aria-label="Default icon"
            onClick={() => store.setIcon("")}
            style={{
              aspectRatio: "1",
              borderRadius: 9,
              border: `1.5px solid ${!store.icon ? "#F58634" : "#e5e7eb"}`,
              background: !store.icon ? "#fff3eb" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ReportIcon name="report" size={15} color={!store.icon ? "#F58634" : "#6b7280"} />
          </button>
          {Object.keys(REPORT_ICON_PATHS).map((iconName) => {
            const selected = store.icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                title={iconName}
                aria-label={iconName}
                onClick={() => store.setIcon(iconName)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 9,
                  border: `1.5px solid ${selected ? "#F58634" : "#e5e7eb"}`,
                  background: selected ? "#fff3eb" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ReportIcon name={iconName} size={15} color={selected ? "#F58634" : "#6b7280"} />
              </button>
            );
          })}
        </div>
      </div>

      <ManageGroupsModal show={showManageGroups} onClose={() => setShowManageGroups(false)} onChanged={loadReportGroups} />
    </div>
  );
};

export default StepOrganize;
