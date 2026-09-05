import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableSortEvent } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEscapeKey } from "../../../../common/SharedFunction";
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

// The content pane for ONE report_definition_id — mounted by BottomView.tsx
// exactly like every legacy report (all_visit_report, all_call_report,
// etc.): a plain {definitionId, onHide} component, not its own route. A
// Custom Reports tile sets appliedReportType to `custom_report:${id}` (see
// ReportsTileView.tsx's onCustomReportClick) instead of one of the ~50
// fixed names handleSingleReportShow (SideView.tsx) already switches on —
// that function's fallback branch toasts a permission error for anything
// it doesn't recognize, so a dynamic numeric id could never route through
// it directly. onHide mirrors every legacy report's own closing convention
// (BottomView's handleonHide: back to the Insights dashboard), and
// useEscapeKey(onHide) matches allVisitReportView.tsx's own Escape-to-close.
//
// Visual chrome deliberately matches the legacy toolbar shell exactly
// (report_card/report_button/custom-centered-table/dash-board-text-count —
// see allVisitReportView.tsx), not a bespoke Report-Builder-only style.
// One deliberate divergence: row-level per-column filters stay a separate
// server-side input row (below) rather than PrimeReact's own
// filterDisplay="row" mechanism legacy reports use — that mechanism
// filters only the rows already loaded into the browser, which is wrong
// for a scroll-paginated report where most rows haven't been fetched yet;
// these filters instead go to the server as an extra WHERE clause, same as
// the free-text search and general filter already do.
interface ReportRunnerViewProps {
  definitionId: number;
  onHide: () => void;
}

const PAGE_SIZE = 50; // matches the legacy convention exactly (inquiryView.tsx's loadTasks(offset, 50))
const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ReportRunnerView: React.FC<ReportRunnerViewProps> = ({ definitionId, onHide }) => {
  const dt = useRef<DataTable<any[]>>(null);
  useEscapeKey(onHide);

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
  const [globalSearchText, setGlobalSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleGlobalSearch = () => setGlobalSearchText(searchInputRef.current?.value || "");

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
  const hasActiveFilters = generalFilters.length > 0 || columnFilterList.length > 0;

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
      runReportDefinition(definitionId, { limit: 500, offset: 0, search: globalSearchText || undefined, filters: [...nonDateEffectiveFilters, ...effectiveFilters.filter((f) => f.column === dateColumn)] }),
      runReportDefinition(definitionId, { limit: 500, offset: 0, search: globalSearchText || undefined, filters: [...nonDateEffectiveFilters, ...shiftedDateFilters(compareMode)] }),
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
  }, [compareMode, canCompare, definitionId, globalSearchText, JSON.stringify(effectiveFilters)]);

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
      search: globalSearchText || undefined,
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
      search: globalSearchText || undefined,
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
    // Switching to a different report_definition_id (a new Custom Reports
    // tile click while this pane is already mounted) must not carry over
    // the prior report's applied filters/sort/search — a stale filter on a
    // column this new report can't filter would make its first run throw.
    setGeneralFilters([]);
    setAppliedPayload(null);
    setColumnFilterValues({});
    setSelectedPresetName("");
    setCompareMode("");
    setDrillDownRow(null);
    setGlobalSearchText("");
    if (searchInputRef.current) searchInputRef.current.value = "";
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
  // menu isn't that component. Matches legacy's own ellipsis dropdown
  // (allVisitReportView.tsx's isExportDropdownOpen) — same
  // pi-ellipsis-v / "labelDropLeft" trigger shape, different content.
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

  // Same debounce, separate effect — a column filter keystroke shouldn't
  // re-fire on every character either.
  const columnFilterKey = columnFilterList.map((f) => `${f.column}=${f.value}`).join("|");
  useEffect(() => {
    if (!definition) return;
    const handler = setTimeout(() => runFromStart(), 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilterKey]);

  useEffect(() => {
    if (!definition) return;
    runFromStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearchText]);

  const onSort = (e: DataTableSortEvent) => {
    setSortField(e.sortField || undefined);
    setSortOrder((e.sortOrder as 1 | -1 | null) ?? null);
  };

  // Build-time showInGrid:false picks — the row data still carries these
  // keys (queryEngine.js is untouched, still returns every selected
  // column), they just never become a Column/ColumnsButton option here.
  const hiddenGridKeys = useMemo(() => new Set(definition?.hidden_grid_columns || []), [definition?.hidden_grid_columns]);
  const columns = rows.length > 0 ? Object.keys(rows[0]).filter((k) => !hiddenGridKeys.has(k)) : [];
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
      search: globalSearchText || undefined,
      filters: effectiveFilters.length > 0 ? effectiveFilters : undefined,
    });
    setExportingPdf(false);
    if (url) window.open(url, "_blank");
  };

  if (accessError) {
    return (
      <div>
        <h3 style={{ fontSize: "20px", paddingLeft: "12px" }} className="dash-board-text-count">
          {definition?.name || "Report"}
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{accessError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <h3 style={{ fontSize: "20px" }} className="dash-board-text-count">
          {definition?.name || (loadingMeta ? "Loading..." : "Report")}
        </h3>

        <div className="d-flex gap-2 align-items-center" style={{ position: "relative" }}>
          <div className="d-flex gap-2 align-items-center" style={{ width: 355, zIndex: 999, position: "relative" }}>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control"
              placeholder="Search Anything in This Report"
              style={{ width: 300, marginTop: 10 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGlobalSearch();
              }}
            />
            {globalSearchText && (
              <span className="clear-icon" onClick={() => { setGlobalSearchText(""); if (searchInputRef.current) searchInputRef.current.value = ""; }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            )}
            <Button
              icon="pi pi-search"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleGlobalSearch}
              tooltip="Search"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />
          </div>
          <div className="d-flex gap-2 align-items-center">
            {allFilterSlots.length > 0 && (
              <Button
                icon={hasActiveFilters ? "pi pi-filter-slash" : "pi pi-filter"}
                className="report_button"
                style={{ backgroundColor: "#4C4C4C" }}
                rounded
                onClick={() => setShowFilterModal(true)}
                tooltip="Filter Report"
                tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
              />
            )}
            <Button
              icon="pi pi-ellipsis-v"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu((v) => !v);
              }}
              tooltip="More Options"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />
            <div ref={moreMenuRef} style={{ position: "relative" }}>
              {showMoreMenu && (
                <ul
                  className="labelDropLeft isVisible"
                  style={{ width: 260, position: "absolute", right: 0, top: 0, zIndex: 1000, maxHeight: "calc(100vh - 120px)", overflowY: "auto", scrollbarWidth: "none", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {authorDefaultSlots.length > 0 && authorDefaultSlots.length < allFilterSlots.length && (
                    <label style={{ fontSize: 13, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={showAllFilterSlots} onChange={(e) => setShowAllFilterSlots(e.target.checked)} />
                      Show all filters
                    </label>
                  )}
                  {allFilterSlots.length > 0 && appliedPayload && (
                    <li className="listItem text-start" role="button" onClick={handleSaveFilterPreset} title="Save the currently applied filter for reuse">
                      <i className="pi pi-save" style={{ marginRight: 4 }} />
                      Save filter...
                    </li>
                  )}
                  {allFilterSlots.length > 0 && Object.keys(presets).length > 0 && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <select className="form-select form-select-sm" value={selectedPresetName} onChange={(e) => handleApplyPreset(e.target.value)}>
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
                    <select className="form-select form-select-sm" value={compareMode} onChange={(e) => setCompareMode(e.target.value as "" | "previous" | "lastYear")}>
                      <option value="">Compare to...</option>
                      <option value="previous">Previous period</option>
                      <option value="lastYear">Same period last year</option>
                    </select>
                  )}
                  <ExportExcelMenuItem
                    reportType="report_builder"
                    // genericReportExportService.js sends this object as the
                    // ENTIRE request body to fetchReportBuilderExportPage —
                    // not merged with anything else — so the applied general
                    // filters and search term must ride along here too, or
                    // the export would silently return every row regardless
                    // of what the on-screen grid is currently filtered to.
                    filters={{
                      a_application_login_id: localStorage.getItem("UUID"),
                      report_definition_id: definitionId,
                      filters: effectiveFilters.length > 0 ? effectiveFilters : undefined,
                      search: globalSearchText || undefined,
                    }}
                    columns={exportColumns}
                    fileName={definition?.name || "report"}
                    disabled={exportColumns.length === 0}
                    // Checking specific rows exports exactly those instead
                    // of the full filtered/searched result set — same
                    // convention every legacy report's own export already has.
                    selectedRows={selectedRows.length > 0 ? selectedRows : undefined}
                    onSelect={() => setShowMoreMenu(false)}
                  />
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExportPdf();
                    }}
                  >
                    <i className="pi pi-file-pdf" style={{ marginRight: 4 }} />
                    {exportingPdf ? "Exporting..." : "PDF / Print"}
                  </li>
                </ul>
              )}
            </div>
            <Button
              icon="pi pi-refresh"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={() => runFromStart()}
              tooltip="Refresh"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />
            <ColumnsButton columns={orderedColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} onReorder={reorderColumns} onReset={resetColumns} />
          </div>
        </div>
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

      {/* Row-level per-column filters — a separate, finer-grained layer
          from the general filter modal above (Step 5's plan), shipped
          alongside it rather than instead of it. Deliberately a plain
          input row here rather than PrimeReact's own filterDisplay="row"
          (see this file's own header comment) — these go to the server as
          an extra WHERE clause, not a client-side filter over whatever
          page happens to be loaded. Only offered for a visible column
          that's in filterConfig.filterableColumns (real, queryEngine-
          whitelisted base columns) — an aggregate alias or relation-dotted
          display column simply gets no input here, since filtering on
          either would make the run throw. */}
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
        <div style={{ marginBottom: 12, padding: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8a8a", marginBottom: 8 }}>
            Compare — {compareMode === "previous" ? "Previous period" : "Same period last year"}
          </div>
          {loadingCompare && <span className="text-muted" style={{ fontSize: 12 }}>Comparing...</span>}
          {!loadingCompare && currentTotalsRows && compareRows && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {numericColumnKeys(currentTotalsRows).length === 0 ? (
                <span className="text-muted" style={{ fontSize: 12 }}>No numeric columns to compare.</span>
              ) : (
                numericColumnKeys(currentTotalsRows).map((key) => {
                  const currentTotal = sumColumn(currentTotalsRows, key);
                  const compareTotal = sumColumn(compareRows, key);
                  const pctChange = compareTotal !== 0 ? ((currentTotal - compareTotal) / Math.abs(compareTotal)) * 100 : null;
                  return (
                    <div key={key} style={{ fontSize: 13 }}>
                      <div style={{ fontSize: 11, color: "#8a8a8a" }}>{humanize(key)}</div>
                      <div>
                        <strong>{currentTotal.toLocaleString()}</strong>
                        <span className="text-muted"> vs {compareTotal.toLocaleString()}</span>{" "}
                        {pctChange !== null && (
                          <span style={{ color: pctChange >= 0 ? "#198754" : "#dc3545", fontWeight: 600 }}>
                            ({pctChange >= 0 ? "+" : ""}
                            {pctChange.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {!accessError && definition && (
        <div className="report_card" style={{ height: "90vh", display: "flex", flexDirection: "column" }}>
          <DataTable
            ref={dt}
            value={rows}
            scrollable
            resizableColumns
            columnResizeMode="fit"
            className="custom-centered-table"
            scrollHeight="90vh"
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
            emptyMessage="No data found"
            selectionMode="checkbox"
            selection={selectedRows}
            // No dataKey — row identity varies per report (no field name
            // is guaranteed present across every model_key's columns_json
            // picks), so this relies on PrimeReact's default reference
            // equality instead, which works because `rows` state is only
            // ever appended to, never recreated per render.
            onSelectionChange={(e) => setSelectedRows(e.value as any[])}
            onRowClick={canDrillDown ? handleRowClick : undefined}
            footer={
              <div style={{ padding: 10, background: "#f8f9fa", position: "sticky", bottom: 0, zIndex: 1 }}>
                <div style={{ textAlign: "right" }}>
                  {rowCount !== null ? `${rows.length} of ${rowCount}+ row(s) loaded${durationMs !== null ? ` · ${durationMs}ms` : ""}` : ""}
                </div>
              </div>
            }
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem", position: "sticky", top: 0, zIndex: 1 }} bodyStyle={{ textAlign: "center" }} />
            {visibleColumns.map((c) => (
              <Column
                key={c.key}
                field={c.key}
                header={c.label}
                sortable
                headerStyle={{ width: "150px", whiteSpace: "pre-wrap", position: "sticky", top: 0, zIndex: 1, fontSize: "14px" }}
                bodyStyle={{ fontSize: "14px" }}
                body={(row) => String(row[c.key] ?? "")}
              />
            ))}
          </DataTable>
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
