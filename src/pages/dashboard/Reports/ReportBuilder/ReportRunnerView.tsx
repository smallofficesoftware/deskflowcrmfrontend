import { Column } from "primereact/column";
import { DataTable, DataTableSortEvent } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { PAGE_ID } from "../../../../helpers/AppEnum";
import { IFilterPayload } from "../../../../helpers/AppInterface";
import { useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import { useReportFilterPresetsStore } from "../../../../store/report/useReportFilterPresetsStore";
import { formatDateForBackend, mapColumnTypeToExportFormat, parseFilterDate, translateGeneralFilters, IGeneralFilter } from "./generalFilterAdapter";
import {
  exportReportPdf,
  getGeneralFilterConfig,
  IGeneralFilterConfig,
  IRunnableReportDefinition,
  listRunnableReportDefinitions,
  runReportDefinition,
} from "./ReportBuilderController";

// The run screen for ONE report_definition_id, reached only from a
// "Custom Reports" tile click (ReportsTileView.tsx) — own routed URL
// (/report-builder/run/:id), matching how every legacy report is already
// its own route: deep-linkable, shareable, browser back works naturally.
// No PIN here at all — reachability itself is already the gate (a login
// with no report_definition_team_rights grant for this id never gets a
// tile to click, and the backend's own getReportDataScope check denies
// the run regardless of how someone got here).
//
// Reuses the same DataTable + virtualScrollerOptions (scroll-load) +
// onSort pattern every legacy report already uses (see inquiryView.tsx) —
// not a bespoke table. Full toolbar shell: free-text search, the
// CheckBoxFilterModal general filter (Step 2) + Save Filter presets
// (Step 9), row-level per-column filters, ColumnsButton, row selection +
// selected-rows export, AppliedFilterBar, and Compare Period (Step 9,
// aggregated reports only) are all wired in.
const PAGE_SIZE = 50; // matches the legacy convention exactly (inquiryView.tsx's loadTasks(offset, 50))
const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ReportRunnerView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const definitionId = Number(id);
  const dt = useRef<DataTable<any[]>>(null);

  const [definition, setDefinition] = useState<IRunnableReportDefinition | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | -1 | null>(null);
  const [search, setSearch] = useState("");

  const [exportingPdf, setExportingPdf] = useState(false);

  // Step 2 — CheckBoxFilterModal integration. Reused as-is (no edits to the
  // shared component/store/bar — legacy reports keep working unchanged);
  // this view only computes filtersToShow, translates the submitted
  // payload, and merges it into the run call as an extra `filters` array
  // alongside the definition's own saved filters_json (merged server-side).
  const [filterConfig, setFilterConfig] = useState<IGeneralFilterConfig | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedPayload, setAppliedPayload] = useState<IFilterPayload | null>(null);
  const [generalFilters, setGeneralFilters] = useState<IGeneralFilter[]>([]);
  // "Show all filters" widens past the author's default set — a per-session
  // choice, never written back to the definition (Step 2's "default, not a
  // cap" decision).
  const [showAllFilterSlots, setShowAllFilterSlots] = useState(false);
  const allFilterSlots = filterConfig ? Object.keys(filterConfig.generalFilters).map(Number) : [];
  const authorDefaultSlots = definition?.filters_to_show ? (JSON.parse(definition.filters_to_show) as number[]) : [];
  const filtersToShow = showAllFilterSlots || authorDefaultSlots.length === 0 ? allFilterSlots : authorDefaultSlots.filter((s) => allFilterSlots.includes(s));

  // Row-level per-column filters — a separate, finer-grained layer from
  // the general filter above (Step 5's plan), not a replacement for it.
  // Only offered on a column that's both currently visible AND in
  // filterConfig.filterableColumns — csv-type columns are excluded
  // entirely (findInSet needs a value picker this simple text input can't
  // provide) since a plain "contains" against a comma-joined string would
  // silently match partial/wrong values.
  const [columnFilterValues, setColumnFilterValues] = useState<Record<string, string>>({});
  const columnFilterList: IGeneralFilter[] = Object.entries(columnFilterValues)
    // filterConfig?.filterableColumns is the only source of truth for what
    // queryEngine.js will accept — a stale value left over from switching
    // to a different report (different filterableColumns set) must be
    // dropped here, not just relied on the input no longer being rendered,
    // or a leftover value could send a filter on a column this report
    // can't filter at all and make the whole run throw.
    .filter(([column, value]) => value.trim() !== "" && !!filterConfig?.filterableColumns[column])
    .map(([column, value]) => {
      const type = filterConfig?.filterableColumns[column]?.type;
      return { column, op: type === "string" ? "like" : "eq", value: value.trim() };
    });
  const effectiveFilters = [...generalFilters, ...columnFilterList];

  // Step 9 — Compare Period, scoped to aggregated reports only
  // (definition.is_aggregated) with an active date-range filter applied —
  // there's no period to shift otherwise. Simplified from the plan's
  // per-row "each aggregate column renders as two values + a delta"
  // design down to a period-TOTALS comparison (sum each numeric column
  // across the whole result set, current vs. shifted period) —
  // deliberately: matching individual rows between two independently
  // fetched result sets (which team member is "the same" row across two
  // periods, for an arbitrary grouped query-type report with no known
  // dimension-column metadata here) is real, correctness-sensitive work
  // this run screen doesn't have enough column metadata to do safely yet;
  // a wrong per-row delta on a financial-style report is worse than not
  // offering per-row deltas at all. Totals-level comparison needs none of
  // that — just two full-set fetches and a sum per column.
  const dateColumn = typeof filterConfig?.generalFilters["1"] === "string" ? (filterConfig.generalFilters["1"] as string) : undefined;
  const canCompare = !!definition?.is_aggregated && !!dateColumn && !!appliedPayload?.startSearchDate && !!appliedPayload?.endSearchDate;
  const [compareMode, setCompareMode] = useState<"" | "previous" | "lastYear">("");
  const [compareRows, setCompareRows] = useState<any[] | null>(null);
  const [currentTotalsRows, setCurrentTotalsRows] = useState<any[] | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const shiftedDateFilters = (mode: "previous" | "lastYear"): IGeneralFilter[] => {
    const start = parseFilterDate(appliedPayload?.startSearchDate);
    const end = parseFilterDate(appliedPayload?.endSearchDate);
    if (!start || !end || !dateColumn) return [];
    let newStart: Date, newEnd: Date;
    if (mode === "lastYear") {
      newStart = new Date(start);
      newStart.setFullYear(newStart.getFullYear() - 1);
      newEnd = new Date(end);
      newEnd.setFullYear(newEnd.getFullYear() - 1);
    } else {
      const spanMs = end.getTime() - start.getTime();
      newEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000); // day before current start
      newStart = new Date(newEnd.getTime() - spanMs);
    }
    return [
      { column: dateColumn, op: "gte", value: formatDateForBackend(newStart) },
      { column: dateColumn, op: "lte", value: formatDateForBackend(newEnd) },
    ];
  };

  // Non-date filters (general + column) carry over unchanged into both
  // the comparison fetch and the current-period totals fetch — only the
  // date range itself differs between the three.
  const nonDateEffectiveFilters = effectiveFilters.filter((f) => f.column !== dateColumn);

  useEffect(() => {
    if (!compareMode || !canCompare) {
      setCompareRows(null);
      setCurrentTotalsRows(null);
      return;
    }
    let cancelled = false;
    setLoadingCompare(true);
    Promise.all([
      runReportDefinition(definitionId, { limit: 500, offset: 0, search: search || undefined, filters: [...nonDateEffectiveFilters, ...effectiveFilters.filter((f) => f.column === dateColumn)] }),
      runReportDefinition(definitionId, { limit: 500, offset: 0, search: search || undefined, filters: [...nonDateEffectiveFilters, ...shiftedDateFilters(compareMode)] }),
    ]).then(([current, compare]) => {
      if (cancelled) return;
      setCurrentTotalsRows(current?.rows || []);
      setCompareRows(compare?.rows || []);
      setLoadingCompare(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode, canCompare, definitionId, search, JSON.stringify(effectiveFilters)]);

  const numericColumnKeys = (rows: any[]): string[] =>
    rows.length === 0 ? [] : Object.keys(rows[0]).filter((k) => typeof rows[0][k] === "number");
  const sumColumn = (rows: any[], key: string) => rows.reduce((acc, r) => acc + (typeof r[key] === "number" ? r[key] : 0), 0);

  // Step 9 — Drill Down, scoped to query-type reports with group_by_json
  // set (definition.group_by_columns.length > 0), per the plan's v1 scope
  // ("composite could extend the same idea later, not designed further
  // here"). Reuses /report-definitions/:id/run unchanged — no new
  // endpoint — with the clicked group row's own group-by column values
  // merged in as equality filters, and suppressGroupBy:true so
  // queryEngine.js returns the underlying raw rows instead of another
  // aggregate for that one call.
  const canDrillDown = definition?.type === "query" && (definition?.group_by_columns?.length ?? 0) > 0;
  const [drillDownRow, setDrillDownRow] = useState<any | null>(null);
  const [drillDownRows, setDrillDownRows] = useState<any[] | null>(null);
  const [loadingDrillDown, setLoadingDrillDown] = useState(false);

  const handleRowClick = async (e: { data: any }) => {
    if (!canDrillDown || !definition) return;
    const row = e.data;
    setDrillDownRow(row);
    setDrillDownRows(null);
    setLoadingDrillDown(true);
    const groupFilters: IGeneralFilter[] = definition.group_by_columns
      .filter((col) => row[col] !== undefined && row[col] !== null)
      .map((col) => ({ column: col, op: "eq", value: row[col] }));
    const data = await runReportDefinition(definitionId, {
      limit: 200,
      offset: 0,
      filters: [...effectiveFilters, ...groupFilters],
      suppressGroupBy: true,
    });
    setDrillDownRows(data?.rows || []);
    setLoadingDrillDown(false);
  };

  // Fresh run — resets pagination to page 1. Called on mount and whenever
  // sort or search changes (a new order/term invalidates the relative
  // position of whatever pages were already loaded, same reset rule
  // search/filter changes already follow elsewhere in this app).
  const runFromStart = async () => {
    setLoading(true);
    setSelectedRows([]); // a re-run invalidates any prior selection's row objects
    offsetRef.current = 0;
    const sort = sortField ? { column: sortField, direction: (sortOrder === -1 ? "DESC" : "ASC") as "ASC" | "DESC" } : undefined;
    const data = await runReportDefinition(definitionId, {
      limit: PAGE_SIZE,
      offset: 0,
      sort,
      search: search || undefined,
      filters: effectiveFilters.length > 0 ? effectiveFilters : undefined,
    });
    setLoading(false);
    if (!data) {
      setAccessError("This report couldn't be run — you may not have access to it.");
      setRows([]);
      setHasMore(false);
      return;
    }
    setRows(data.rows);
    setRowCount(data.row_count);
    setDurationMs(data.duration_ms);
    setHasMore(data.rows.length === PAGE_SIZE);
    offsetRef.current = data.rows.length;
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const sort = sortField ? { column: sortField, direction: (sortOrder === -1 ? "DESC" : "ASC") as "ASC" | "DESC" } : undefined;
    const data = await runReportDefinition(definitionId, {
      limit: PAGE_SIZE,
      offset: offsetRef.current,
      sort,
      search: search || undefined,
      filters: effectiveFilters.length > 0 ? effectiveFilters : undefined,
    });
    setLoading(false);
    if (!data) return;
    setRows((prev) => [...prev, ...data.rows]);
    setHasMore(data.rows.length === PAGE_SIZE);
    offsetRef.current += data.rows.length;
  };

  useEffect(() => {
    if (!definitionId) return;
    setLoadingMeta(true);
    listRunnableReportDefinitions().then((defs) => {
      const found = defs.find((d) => d.id === definitionId) || null;
      setDefinition(found);
      setLoadingMeta(false);
      if (!found) {
        setAccessError("You don't have access to this report, or it no longer exists.");
      }
    });
    // Navigating from one report's run screen straight to another's
    // (same routed component, no remount) must not carry over the prior
    // report's applied filters/sort/search — a stale filter on a column
    // this new report can't filter would make its first run throw.
    setGeneralFilters([]);
    setAppliedPayload(null);
    setColumnFilterValues({});
    setSelectedPresetName("");
    setCompareMode("");
    setDrillDownRow(null);
    setSearch("");
    setSortField(undefined);
    setSortOrder(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId]);

  // Only query-type definitions have a MODEL_REGISTRY model_key to look up
  // generalFilters against — plugin/composite types have their own filter
  // shape (filterSchema) or no general-filter concept at all, so the
  // filter button simply doesn't appear for them (filtersToShow stays []).
  useEffect(() => {
    if (definition?.type === "query" && definition.model_key) {
      getGeneralFilterConfig(definition.model_key).then(setFilterConfig);
    } else {
      setFilterConfig(null);
    }
  }, [definition]);

  useEffect(() => {
    if (definition) runFromStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, sortField, sortOrder, generalFilters]);

  const columnType = (column: string) => filterConfig?.columnTypes[column];

  const handleApplyGeneralFilters = (payload: IFilterPayload) => {
    if (!filterConfig) return;
    setAppliedPayload(payload);
    setGeneralFilters(translateGeneralFilters(payload, filterConfig.generalFilters, columnType));
    setShowFilterModal(false);
  };

  // Step 9 — Save Filter. Presets hold the raw submitted IFilterPayload
  // verbatim (see useReportFilterPresetsStore's own comment on why), so
  // applying one goes through the exact same translate path a fresh
  // modal submission does — no separate "load a preset" code path to
  // drift out of sync with the adapter.
  const presetsStore = useReportFilterPresetsStore();
  const presetReportKey = `report_${definitionId}`;
  const presets = presetsStore.getPresets(presetReportKey);
  const handleSaveFilterPreset = () => {
    if (!appliedPayload) return;
    const name = window.prompt("Save current filter as:");
    if (!name || !name.trim()) return;
    presetsStore.savePreset(presetReportKey, name.trim(), appliedPayload);
  };
  const [selectedPresetName, setSelectedPresetName] = useState("");

  // Toolbar "More" dropdown — same click-outside-to-close pattern
  // ColumnsButton.tsx already uses internally, replicated here since this
  // menu isn't that component.
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleApplyPreset = (name: string) => {
    setSelectedPresetName(name);
    const payload = presets[name];
    if (payload) handleApplyGeneralFilters(payload);
  };
  const handleDeleteSelectedPreset = () => {
    if (!selectedPresetName) return;
    presetsStore.deletePreset(presetReportKey, selectedPresetName);
    setSelectedPresetName("");
  };

  // Debounced (300ms, same convention every legacy report's own search box
  // already uses) — separate effect from the sort/definition one above so
  // typing doesn't re-fire on every keystroke.
  useEffect(() => {
    if (!definition) return;
    const handler = setTimeout(() => runFromStart(), 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Same debounce, separate effect — a column filter keystroke shouldn't
  // re-fire on every character either.
  const columnFilterKey = columnFilterList.map((f) => `${f.column}=${f.value}`).join("|");
  useEffect(() => {
    if (!definition) return;
    const handler = setTimeout(() => runFromStart(), 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilterKey]);

  const onSort = (e: DataTableSortEvent) => {
    setSortField(e.sortField || undefined);
    setSortOrder((e.sortOrder as 1 | -1 | null) ?? null);
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const defaultColumns = columns.map((key) => ({ key, label: humanize(key) }));
  // Same reportKey convention useCommonFilterStore's slot would use
  // (report_${id}) — server-persisted show/hide/reorder per report, shared
  // with every legacy report through the same hook/component, not a
  // bespoke picker.
  const { orderedColumns, visibleColumns, hiddenKeys, toggleColumn, reorderColumns, resetColumns } = useColumnPreferences(
    `report_${definitionId}`,
    defaultColumns,
  );
  const exportColumns = visibleColumns.map((c) => ({
    key: c.key,
    label: c.label,
    // Only known for a real base column (filterConfig.filterableColumns) —
    // an aggregate alias or relation-dotted display column has no type
    // info available here, so it falls back to unformatted (unchanged).
    format: mapColumnTypeToExportFormat(filterConfig?.filterableColumns[c.key]?.type),
  }));

  const handleExportPdf = async () => {
    setExportingPdf(true);
    const url = await exportReportPdf(definitionId, {
      search: search || undefined,
      filters: effectiveFilters.length > 0 ? effectiveFilters : undefined,
    });
    setExportingPdf(false);
    if (url) window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 20, height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>{definition?.name || (loadingMeta ? "Loading..." : "Report")}</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {definition?.description && <p className="text-muted" style={{ fontSize: 13 }}>{definition.description}</p>}
      {canDrillDown && <p className="text-muted" style={{ fontSize: 12 }}>Click a row to see its underlying detail rows.</p>}

      {filtersToShow.length > 0 && (
        <AppliedFilterBar
          summary={appliedPayload?.appliedFilterSummary}
          startDate={appliedPayload?.startSearchDate}
          endDate={appliedPayload?.endSearchDate}
        />
      )}

      {accessError && (
        <div className="alert alert-danger" style={{ fontSize: 14 }}>
          {accessError}
        </div>
      )}

      {!accessError && definition && (
        <div className="card p-3" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {rowCount !== null ? `${rows.length} of ${rowCount}+ row(s) loaded · ${durationMs}ms` : ""}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="form-control form-control-sm"
                style={{ width: 200 }}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {allFilterSlots.length > 0 && (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowFilterModal(true)}>
                  Filter{generalFilters.length > 0 ? ` (${generalFilters.length})` : ""}
                </button>
              )}
              {/* Everything below is secondary/less-frequent — collapsed into
                  one "More" dropdown (the plan's own canonical toolbar shell:
                  search + filter + an ellipsis "more" menu + columns, not a
                  flat row of every action) instead of competing for space
                  with Search/Filter/Columns on every render. */}
              <div ref={moreMenuRef} style={{ position: "relative" }}>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowMoreMenu((v) => !v)}>
                  &#8942; More
                </button>
                {showMoreMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 34,
                      zIndex: 1000,
                      width: 260,
                      background: "#fff",
                      borderRadius: 8,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {authorDefaultSlots.length > 0 && authorDefaultSlots.length < allFilterSlots.length && (
                      <label style={{ fontSize: 13, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="checkbox" checked={showAllFilterSlots} onChange={(e) => setShowAllFilterSlots(e.target.checked)} />
                        Show all filters
                      </label>
                    )}
                    {allFilterSlots.length > 0 && appliedPayload && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={handleSaveFilterPreset} title="Save the currently applied filter for reuse">
                        Save filter...
                      </button>
                    )}
                    {allFilterSlots.length > 0 && Object.keys(presets).length > 0 && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <select
                          className="form-select form-select-sm"
                          value={selectedPresetName}
                          onChange={(e) => handleApplyPreset(e.target.value)}
                        >
                          <option value="" disabled>
                            Saved filters...
                          </option>
                          {Object.keys(presets).map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        {selectedPresetName && (
                          <button className="btn btn-sm btn-outline-danger" title="Delete this saved filter" onClick={handleDeleteSelectedPreset}>
                            &times;
                          </button>
                        )}
                      </div>
                    )}
                    {canCompare && (
                      <select
                        className="form-select form-select-sm"
                        value={compareMode}
                        onChange={(e) => setCompareMode(e.target.value as "" | "previous" | "lastYear")}
                      >
                        <option value="">Compare to...</option>
                        <option value="previous">Previous period</option>
                        <option value="lastYear">Same period last year</option>
                      </select>
                    )}
                    <hr style={{ margin: "2px 0" }} />
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      <ExportExcelMenuItem
                        reportType="report_builder"
                        // genericReportExportService.js sends this object as
                        // the ENTIRE request body to
                        // fetchReportBuilderExportPage — not merged with
                        // anything else — so the applied general filters and
                        // search term must ride along here too, or the
                        // export would silently return every row regardless
                        // of what the on-screen grid is currently filtered to.
                        filters={{
                          a_application_login_id: localStorage.getItem("UUID"),
                          report_definition_id: definitionId,
                          filters: effectiveFilters.length > 0 ? effectiveFilters : undefined,
                          search: search || undefined,
                        }}
                        columns={exportColumns}
                        fileName={definition.name}
                        disabled={exportColumns.length === 0}
                        // Checking specific rows exports exactly those
                        // instead of the full filtered/searched result set —
                        // same convention every legacy report's own export
                        // already has.
                        selectedRows={selectedRows.length > 0 ? selectedRows : undefined}
                        onSelect={() => setShowMoreMenu(false)}
                      />
                    </ul>
                    <button
                      className="btn btn-sm btn-outline-dark"
                      disabled={exportingPdf}
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleExportPdf();
                      }}
                    >
                      {exportingPdf ? "Exporting..." : "PDF / Print"}
                    </button>
                  </div>
                )}
              </div>
              <ColumnsButton columns={orderedColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} onReorder={reorderColumns} onReset={resetColumns} />
            </div>
          </div>

          {/* Row-level per-column filters — a separate, finer-grained layer
              from the general filter modal above (Step 5's plan), shipped
              alongside it rather than instead of it. Only offered for a
              visible column that's in filterConfig.filterableColumns (real,
              queryEngine-whitelisted base columns) — an aggregate alias or
              relation-dotted display column simply gets no input here,
              since filtering on either would make the run throw. */}
          {filterConfig && visibleColumns.some((c) => filterConfig.filterableColumns[c.key]) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {visibleColumns
                .filter((c) => filterConfig.filterableColumns[c.key])
                .map((c) => (
                  <input
                    key={c.key}
                    className="form-control form-control-sm"
                    style={{ width: 140 }}
                    placeholder={c.label}
                    value={columnFilterValues[c.key] || ""}
                    onChange={(e) => setColumnFilterValues((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  />
                ))}
            </div>
          )}

          {compareMode && (
            <div className="card p-2" style={{ marginBottom: 8, fontSize: 12 }}>
              {loadingCompare && <span>Comparing...</span>}
              {!loadingCompare && currentTotalsRows && compareRows && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {numericColumnKeys(currentTotalsRows).length === 0 ? (
                    <span className="text-muted">No numeric columns to compare.</span>
                  ) : (
                    numericColumnKeys(currentTotalsRows).map((key) => {
                      const currentTotal = sumColumn(currentTotalsRows, key);
                      const compareTotal = sumColumn(compareRows, key);
                      const pctChange = compareTotal !== 0 ? ((currentTotal - compareTotal) / Math.abs(compareTotal)) * 100 : null;
                      return (
                        <div key={key}>
                          <strong>{humanize(key)}:</strong> {currentTotal.toLocaleString()} vs {compareTotal.toLocaleString()}{" "}
                          {pctChange !== null && (
                            <span style={{ color: pctChange >= 0 ? "#198754" : "#dc3545" }}>
                              ({pctChange >= 0 ? "+" : ""}
                              {pctChange.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0 }}>
            <DataTable
              ref={dt}
              value={rows}
              resizableColumns
              columnResizeMode="fit"
              scrollable
              scrollHeight="flex"
              virtualScrollerOptions={{
                itemSize: 46,
                lazy: true,
                onLazyLoad: (e: { last: number }) => {
                  if (e.last >= rows.length - 1 && hasMore && !loading) loadMore();
                },
                appendOnly: true,
                showLoader: true,
                delay: 0,
              }}
              onSort={onSort}
              sortField={sortField}
              sortOrder={sortOrder}
              sortMode="single"
              loading={loading && rows.length === 0}
              tableStyle={{ tableLayout: "fixed", width: "100%" }}
              emptyMessage="No data."
              selectionMode="checkbox"
              selection={selectedRows}
              // No dataKey — row identity varies per report (no field name
              // is guaranteed present across every model_key's columns_json
              // picks), so this relies on PrimeReact's default reference
              // equality instead, which works because `rows` state is only
              // ever appended to, never recreated per render.
              onSelectionChange={(e) => setSelectedRows(e.value as any[])}
              onRowClick={canDrillDown ? handleRowClick : undefined}
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
              {visibleColumns.map((c) => (
                <Column key={c.key} field={c.key} header={c.label} sortable body={(row) => String(row[c.key] ?? "")} />
              ))}
            </DataTable>
          </div>
        </div>
      )}

      {showFilterModal && filterConfig && (
        <CheckBoxFilterModal
          show={showFilterModal}
          onHide={() => setShowFilterModal(false)}
          handleSubmit={handleApplyGeneralFilters}
          title="Filter"
          message="Apply filters to this report"
          btn1="Cancel"
          btn2="Apply"
          filtersToShow={filtersToShow}
          pageId={PAGE_ID.REPORT_BUILDER}
          initialFilterData={appliedPayload?.filterData}
          initialCheckedOptions={appliedPayload?.checkedOptionsLabel}
          initialCheckedSourceTypes={appliedPayload?.checkedOptionsSourceType}
          initialCheckedExpenseTypes={appliedPayload?.checkedOptionsExpenseType}
          initialCheckedPaymentType={appliedPayload?.checkedPaymentType}
          initialStartSearchDate={appliedPayload?.startSearchDate}
          initialEndSearchDate={appliedPayload?.endSearchDate}
          initialCheckedOptionsStageStatus={appliedPayload?.checkedOptionsStageStatus}
          initialCheckedOptionsExpenseStatus={appliedPayload?.checkedOptionsExpenseStatus}
          initialCheckedOptionsTaskType={appliedPayload?.checkedOptionsTaskType}
          initialCheckedOptionsUser={appliedPayload?.checkedOptionsUser}
          initialSelectedStockTypeId={appliedPayload?.selectedStockTypeId}
          initialCheckedOptionsTaskAssignOrnot={appliedPayload?.checkedOptionsTaskassignOrNot}
          labelFilderApplyAndOr={appliedPayload?.labelAndOr}
          initialCheckedShowCreditData={appliedPayload?.initialCheckedShowCreditData}
          initialCheckedShowDebitData={appliedPayload?.initialCheckedShowDebitData}
          initialCheckedOptionsContactAssignOrnot={appliedPayload?.checkedOptionsContactassignOrNot}
          initialReferenceWiseContact={appliedPayload?.referenceWiseContact}
        />
      )}

      {drillDownRow && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 800, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Detail Rows</h5>
              <span className="close" onClick={() => setDrillDownRow(null)}>&times;</span>
            </div>
            {loadingDrillDown && <p>Loading...</p>}
            {!loadingDrillDown && drillDownRows && drillDownRows.length === 0 && <p className="text-muted">No underlying rows found.</p>}
            {!loadingDrillDown && drillDownRows && drillDownRows.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      {Object.keys(drillDownRows[0]).map((key) => (
                        <th key={key}>{humanize(key)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drillDownRows.map((row, idx) => (
                      <tr key={idx}>
                        {Object.keys(drillDownRows[0]).map((key) => (
                          <td key={key}>{String(row[key] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportRunnerView;
