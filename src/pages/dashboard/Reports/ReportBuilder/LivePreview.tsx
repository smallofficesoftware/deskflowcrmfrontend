import React, { useEffect, useState } from "react";
import { previewReportDefinition } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";

const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Live preview panel (Step 12 visual pass #3) — mounted on Step 2 and Step 3
// for query-type only. Debounced (500ms, same convention every legacy
// report's own search box already uses) over whatever's currently picked
// (source/columns/group-by/filters), so it doesn't fire on every keystroke.
// A non-runnable in-progress state (no source yet, an empty filter value
// mid-typing) is expected and shown as a quiet message, not an error —
// previewReportDefinition itself is deliberately silent on failure for
// exactly this reason.
const LivePreview: React.FC = () => {
  const store = useReportBuilderStore();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  const ready = store.type === "query" && !!store.modelKey && store.columns.length > 0;
  const key = JSON.stringify({ modelKey: store.modelKey, columns: store.columns, groupBy: store.groupBy, filters: store.filters });

  useEffect(() => {
    if (!ready) {
      setRows([]);
      setTried(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      const result = await previewReportDefinition({
        model_key: store.modelKey,
        columns_json: store.columns,
        filters_json: store.filters.filter((f) => f.value !== ""),
        group_by_json: store.groupBy,
      });
      setRows(result?.rows || []);
      setLoading(false);
      setTried(true);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ width: 300, flexShrink: 0 }}>
      <div className="card p-2" style={{ position: "sticky", top: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8a8a", marginBottom: 6 }}>
          Live preview
        </div>
        {!ready && (
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
            Pick a source and at least one field to see a preview.
          </p>
        )}
        {ready && loading && (
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
            Loading...
          </p>
        )}
        {ready && !loading && tried && rows.length === 0 && (
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
            No preview yet — check your filters, or this combination isn't runnable yet.
          </p>
        )}
        {ready && !loading && rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-sm" style={{ fontSize: 11, marginBottom: 0 }}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} style={{ whiteSpace: "nowrap" }}>{humanize(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c} style={{ whiteSpace: "nowrap" }}>{String(r[c] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
