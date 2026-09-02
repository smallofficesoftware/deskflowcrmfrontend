import React, { useEffect, useState } from "react";
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
// This is a first, functional cut — not yet Step 5's full PrimeReact
// DataTable + toolbar shell (scroll-load, click-to-sort headers, row-level
// column filters, ColumnsButton, AppliedFilterBar). Search/sort/pagination
// the backend already supports aren't wired into this page's UI yet.
const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ReportRunnerView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const definitionId = Number(id);

  const [definition, setDefinition] = useState<IRunnableReportDefinition | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [running, setRunning] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [result, setResult] = useState<{ rows: any[]; row_count: number; duration_ms: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!definitionId) return;
    setLoadingMeta(true);
    listRunnableReportDefinitions().then((rows) => {
      const found = rows.find((r) => r.id === definitionId) || null;
      setDefinition(found);
      setLoadingMeta(false);
      if (!found) {
        setError("You don't have access to this report, or it no longer exists.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId]);

  const runNow = async () => {
    setRunning(true);
    setError(null);
    const data = await runReportDefinition(definitionId);
    setRunning(false);
    if (data) {
      setResult(data);
    } else {
      setError("This report couldn't be run — you may not have access to it.");
    }
  };

  useEffect(() => {
    if (definition) runNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition]);

  const columns = result && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
  const exportColumns = columns.map((key) => ({ key, label: humanize(key) }));

  const handleExportPdf = async () => {
    setExportingPdf(true);
    const url = await exportReportPdf(definitionId);
    setExportingPdf(false);
    if (url) window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>{definition?.name || (loadingMeta ? "Loading..." : "Report")}</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {definition?.description && <p className="text-muted" style={{ fontSize: 13 }}>{definition.description}</p>}

      {error && (
        <div className="alert alert-danger" style={{ fontSize: 14 }}>
          {error}
        </div>
      )}

      {!error && (
        <div className="card p-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn btn-sm btn-outline-primary" disabled={running} onClick={runNow}>
                {running ? "Running..." : "Refresh"}
              </button>
              {result && (
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {result.row_count} row(s) &middot; {result.duration_ms}ms
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ul style={{ display: "contents", listStyle: "none", margin: 0, padding: 0 }}>
                <ExportExcelMenuItem
                  reportType="report_builder"
                  filters={{ a_application_login_id: localStorage.getItem("UUID"), report_definition_id: definitionId }}
                  columns={exportColumns}
                  fileName={definition?.name || "report"}
                  disabled={exportColumns.length === 0}
                />
              </ul>
              <button className="btn btn-sm btn-outline-dark" disabled={exportingPdf} onClick={handleExportPdf}>
                {exportingPdf ? "Exporting..." : "PDF / Print"}
              </button>
            </div>
          </div>

          {running && !result ? (
            <p className="text-muted">Running report...</p>
          ) : result && result.rows.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c}>{humanize(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td key={c}>{String(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !running && <p className="text-muted">No data.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportRunnerView;
