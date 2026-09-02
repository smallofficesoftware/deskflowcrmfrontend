import { Column } from "primereact/column";
import { DataTable, DataTableSortEvent } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import {
  exportReportPdf,
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
// not a bespoke table. Row-level per-column filters, ColumnsButton, and
// AppliedFilterBar aren't wired in yet (Step 5's remaining pieces).
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
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | -1 | null>(null);

  const [exportingPdf, setExportingPdf] = useState(false);

  // Fresh run — resets pagination to page 1. Called on mount and whenever
  // sort changes (a new order invalidates the relative position of
  // whatever pages were already loaded, same reset rule search/filter
  // changes already follow elsewhere in this app).
  const runFromStart = async () => {
    setLoading(true);
    offsetRef.current = 0;
    const sort = sortField ? { column: sortField, direction: (sortOrder === -1 ? "DESC" : "ASC") as "ASC" | "DESC" } : undefined;
    const data = await runReportDefinition(definitionId, { limit: PAGE_SIZE, offset: 0, sort });
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
    const data = await runReportDefinition(definitionId, { limit: PAGE_SIZE, offset: offsetRef.current, sort });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId]);

  useEffect(() => {
    if (definition) runFromStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, sortField, sortOrder]);

  const onSort = (e: DataTableSortEvent) => {
    setSortField(e.sortField || undefined);
    setSortOrder((e.sortOrder as 1 | -1 | null) ?? null);
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const exportColumns = columns.map((key) => ({ key, label: humanize(key) }));

  const handleExportPdf = async () => {
    setExportingPdf(true);
    const url = await exportReportPdf(definitionId);
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
            <div style={{ display: "flex", gap: 8 }}>
              <ul style={{ display: "contents", listStyle: "none", margin: 0, padding: 0 }}>
                <ExportExcelMenuItem
                  reportType="report_builder"
                  filters={{ a_application_login_id: localStorage.getItem("UUID"), report_definition_id: definitionId }}
                  columns={exportColumns}
                  fileName={definition.name}
                  disabled={exportColumns.length === 0}
                />
              </ul>
              <button className="btn btn-sm btn-outline-dark" disabled={exportingPdf} onClick={handleExportPdf}>
                {exportingPdf ? "Exporting..." : "PDF / Print"}
              </button>
            </div>
          </div>

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
            >
              {columns.map((c) => (
                <Column key={c} field={c} header={humanize(c)} sortable body={(row) => String(row[c] ?? "")} />
              ))}
            </DataTable>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportRunnerView;
