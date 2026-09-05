import React, { useState } from "react";
import ColumnFlagsMini from "./ColumnFlagsMini";
import LivePreview from "./LivePreview";
import { IMetricEntry, IModelRegistryEntry, IReportColumn } from "./ReportBuilderController";
import { SLOT_LABELS } from "./generalFilterAdapter";
import { useReportBuilderStore } from "./useReportBuilderStore";

// Mirrors ReportBuilderView.tsx's own copy — small enough that duplicating
// it beats importing a page-level component's local constant.
const AGGREGATE_LABELS: Record<string, string> = {
  sum: "Sum",
  avg: "Average",
  min: "Min",
  max: "Max",
  count: "Count",
};

// Same card treatment as Step 1's source picker / Step 4's icon grid —
// applied here to every field toggle (base/relation/nested-relation
// columns, composite metrics) so "What to show" doesn't read as a step
// behind the other three. Group-by and general-filters-to-show (both
// Advanced-only, secondary) stay plain checkboxes — a deliberate scope
// line, not an oversight: they're tucked behind a toggle already, less
// visually prominent than the default field list.
const FieldChip: React.FC<{ label: string; picked: boolean; onClick: () => void; custom?: boolean }> = ({ label, picked, onClick, custom }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 20,
      border: `1.5px solid ${picked ? "#F58634" : "#e5e7eb"}`,
      background: picked ? "#fff3eb" : "#fff",
      fontSize: 13,
      fontWeight: picked ? 600 : 400,
      color: picked ? "#DC6A1C" : "#1a1a1a",
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {label}
    {custom && <span className="badge bg-info text-dark" style={{ fontSize: 10 }}>Custom</span>}
  </button>
);

// One consistent zone treatment for every group of controls on this step
// (Fields / Related tables / Group by / Default filters) — a small
// uppercase label + selected-count badge, in a lightly-tinted card. Fixes
// the earlier flat, unlabeled layout (base fields had no heading at all,
// relation cards had a bare border, group-by/general-filters were just
// bold text with no container) that read as noticeably less finished than
// Steps 1/4's card treatment.
const Section: React.FC<{ title: string; count?: number; hint?: string; children: React.ReactNode }> = ({ title, count, hint, children }) => (
  <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hint ? 4 : 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8a8a" }}>{title}</span>
      {!!count && (
        <span className="badge" style={{ fontSize: 10, background: "#fff3eb", color: "#DC6A1C", fontWeight: 600 }}>
          {count} selected
        </span>
      )}
    </div>
    {hint && <div className="text-muted" style={{ fontSize: 11, marginBottom: 10 }}>{hint}</div>}
    {children}
  </div>
);

const ChipRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{children}</div>
);

interface StepColumnsProps {
  selectedModel?: IModelRegistryEntry;
  metrics: IMetricEntry[];
  // Group-by and the general-filters-to-show defaults are secondary,
  // author-facing decisions a first-time non-technical user doesn't need
  // to see up front — tucked behind the same Advanced-mode toggle Step 1's
  // type switch uses, not a separate concept.
  advanced: boolean;
}

// Step 2 of the wizard, query-type shape — ported field-for-field from
// ReportBuilderView.tsx's existing column/relation/group-by/general-filter
// picker (the "Filters" section right after it moves to Step 3 instead,
// see StepFilters.tsx). Composite-type renders the metric picker instead;
// plugin-type never mounts this at all (Step 2 is skipped for it, handled
// by ReportBuilderWizardView.tsx's notApplicableSteps).
const StepColumns: React.FC<StepColumnsProps> = ({ selectedModel, metrics, advanced }) => {
  const store = useReportBuilderStore();
  const [columnSearch, setColumnSearch] = useState("");
  const [expandedRelKeys, setExpandedRelKeys] = useState<Set<string>>(new Set());
  const toggleRelExpanded = (key: string) =>
    setExpandedRelKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const matchesSearch = (label: string) => !columnSearch.trim() || label.toLowerCase().includes(columnSearch.trim().toLowerCase());

  if (store.type === "composite") {
    return (
      <Section title="Metrics" count={store.metricKeys.length}>
        <ChipRow>
          {metrics.map((m) => (
            <FieldChip key={m.key} label={m.label} picked={store.metricKeys.includes(m.key)} onClick={() => store.toggleMetric(m.key)} />
          ))}
        </ChipRow>
      </Section>
    );
  }

  if (!selectedModel) {
    return <p className="text-muted" style={{ fontSize: 13 }}>Pick a data source on Step 1 first.</p>;
  }

  const baseColumns = selectedModel.columns.filter((col) => matchesSearch(col.label));
  const basePickedCount = selectedModel.columns.filter((col) => store.columns.some((c) => c.column === col.key)).length;

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search fields (e.g. contact, label, amount)..."
          value={columnSearch}
          onChange={(e) => setColumnSearch(e.target.value)}
          style={{ maxWidth: 320, marginBottom: 16 }}
        />

        <Section title="Fields" count={basePickedCount}>
          <ChipRow>
            {baseColumns.map((col: IReportColumn) => {
              const picked = store.columns.find((c) => c.column === col.key);
              return (
                <div key={col.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FieldChip label={col.label} picked={!!picked} custom={col.dynamic} onClick={() => store.toggleColumn(col.key)} />
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
                  {picked && (
                    <ColumnFlagsMini
                      pick={picked}
                      allowTotal={col.type === "number" || col.type === "currency"}
                      onFlag={(flag, value) => store.setColumnFlag(col.key, flag, value)}
                    />
                  )}
                </div>
              );
            })}
          </ChipRow>
        </Section>

        {/* Whitelisted joins — select/display only, no aggregate, never
            appear in the filter/group-by pickers below. Collapsed by
            default — a section only renders its field checkboxes once
            expanded, or once a search term matches something inside it.
            One more hop (e.g. Contact -> Labels) renders as its own nested
            collapsed section, never flattened into the parent relation's
            own field list. */}
        {selectedModel.relations && selectedModel.relations.length > 0 && (
          <Section title="Related tables">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedModel.relations.map((rel) => {
                const filteredCols = rel.columns.filter((col) => matchesSearch(col.label));
                const nestedRels = (rel.relations || []).map((sub) => ({
                  sub,
                  filteredCols: sub.columns.filter((col) => matchesSearch(col.label)),
                }));
                const hasSearchMatch = columnSearch.trim() && (filteredCols.length > 0 || nestedRels.some((n) => n.filteredCols.length > 0));
                const isOpen = expandedRelKeys.has(rel.key) || !!hasSearchMatch;
                const pickedCount = rel.columns.filter((col) => store.columns.some((c) => c.column === col.key)).length;
                return (
                  <div key={rel.key} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", background: "#fff" }}>
                    <div
                      onClick={() => toggleRelExpanded(rel.key)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}
                    >
                      <span style={{ color: "#8a8a8a", fontSize: 11 }}>{isOpen ? "▾" : "▸"}</span>
                      <span>{rel.label}</span>
                      {pickedCount > 0 && (
                        <span className="badge" style={{ fontSize: 10, background: "#fff3eb", color: "#DC6A1C", fontWeight: 600 }}>
                          {pickedCount} selected
                        </span>
                      )}
                    </div>
                    {isOpen && (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                          {filteredCols.map((col: IReportColumn) => {
                            const picked = store.columns.find((c) => c.column === col.key);
                            return (
                              <div key={col.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <FieldChip label={col.label} picked={!!picked} onClick={() => store.toggleColumn(col.key)} />
                                {picked && (
                                  <ColumnFlagsMini pick={picked} allowTotal={false} onFlag={(flag, value) => store.setColumnFlag(col.key, flag, value)} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {nestedRels.map(({ sub, filteredCols: subFilteredCols }) => {
                          const subKey = `${rel.key}.${sub.key}`;
                          const subPickedCount = sub.columns.filter((col) => store.columns.some((c) => c.column === col.key)).length;
                          const subOpen = expandedRelKeys.has(subKey) || !!(columnSearch.trim() && subFilteredCols.length > 0);
                          return (
                            <div key={subKey} style={{ marginTop: 10, marginLeft: 18, borderLeft: "2px solid #e5e7eb", paddingLeft: 10 }}>
                              <div
                                onClick={() => toggleRelExpanded(subKey)}
                                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#666" }}
                              >
                                <span style={{ color: "#8a8a8a", fontSize: 11 }}>{subOpen ? "▾" : "▸"}</span>
                                <span>{rel.label} → {sub.label}</span>
                                {subPickedCount > 0 && (
                                  <span className="badge" style={{ fontSize: 10, background: "#fff3eb", color: "#DC6A1C", fontWeight: 600 }}>
                                    {subPickedCount} selected
                                  </span>
                                )}
                              </div>
                              {subOpen && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                                  {subFilteredCols.map((col: IReportColumn) => {
                                    const picked = store.columns.find((c) => c.column === col.key);
                                    return (
                                      <div key={col.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <FieldChip label={col.label} picked={!!picked} onClick={() => store.toggleColumn(col.key)} />
                                        {picked && (
                                          <ColumnFlagsMini pick={picked} allowTotal={false} onFlag={(flag, value) => store.setColumnFlag(col.key, flag, value)} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {advanced && (
          <Section title="Group by">
            <ChipRow>
              {selectedModel.columns
                .filter((c) => c.groupable)
                .map((col) => (
                  <FieldChip key={col.key} label={col.label} picked={store.groupBy.includes(col.key)} onClick={() => store.toggleGroupBy(col.key)} />
                ))}
            </ChipRow>
          </Section>
        )}

        {advanced && selectedModel.generalFilters && Object.keys(selectedModel.generalFilters).length > 0 && (
          <Section
            title="Default filters shown to viewers"
            hint="A viewer running this report can still widen or narrow this for themselves — this only picks what they start with."
          >
            <ChipRow>
              {Object.keys(selectedModel.generalFilters)
                .map(Number)
                .sort((a, b) => a - b)
                .map((slot) => (
                  <FieldChip
                    key={slot}
                    label={SLOT_LABELS[slot] || `Slot ${slot}`}
                    picked={store.filtersToShow.includes(slot)}
                    onClick={() => store.toggleFilterSlot(slot)}
                  />
                ))}
            </ChipRow>
          </Section>
        )}
      </div>
      <LivePreview />
    </div>
  );
};

export default StepColumns;
