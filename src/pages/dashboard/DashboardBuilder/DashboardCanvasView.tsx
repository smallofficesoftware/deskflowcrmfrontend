import React, { useCallback, useEffect, useState } from "react";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useNavigate, useParams } from "react-router-dom";
import AddWidgetModal from "./AddWidgetModal";
import {
  deleteWidget,
  getDashboard,
  IDashboardWidgetResult,
  IDashboardWithWidgets,
  runDashboard,
  updateWidgetPositions,
} from "./DashboardBuilderController";
import ChartWidget from "./widgets/ChartWidget";
import StatTileWidget from "./widgets/StatTileWidget";
import TableWidget from "./widgets/TableWidget";

const GRID_COLS = 12;
const ROW_HEIGHT = 60;
// Measures its own container width instead of a hardcoded pixel width —
// react-grid-layout's own documented HOC for exactly this.
const ResponsiveGridLayout = WidthProvider(GridLayout);

// One dashboard's canvas — react-grid-layout owns drag/resize (the only
// piece @dnd-kit, already used elsewhere in this app, can't do: it's
// drag-only, no resize/collision handling). Its layout shape
// [{i,x,y,w,h}] maps directly onto dashboard_widgets' own
// position_x/position_y/width/height columns, so no translation layer
// is needed between what the grid emits and what gets saved.
const DashboardCanvasView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = Number(id);

  const [dashboard, setDashboard] = useState<IDashboardWithWidgets | null>(null);
  const [results, setResults] = useState<Record<number, IDashboardWidgetResult>>({});
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [dashboardData, runData] = await Promise.all([getDashboard(dashboardId), runDashboard(dashboardId)]);
    setDashboard(dashboardData);
    if (runData) {
      const byId: Record<number, IDashboardWidgetResult> = {};
      runData.widgets.forEach((w) => {
        byId[w.widget_id as unknown as number] = w;
      });
      setResults(byId);
    }
    setLoading(false);
  }, [dashboardId]);

  useEffect(() => {
    if (dashboardId) load();
  }, [dashboardId, load]);

  const handleLayoutChange = async (layout: Layout[]) => {
    if (!dashboard) return;
    const positions = layout.map((l) => ({ id: Number(l.i), position_x: l.x, position_y: l.y, width: l.w, height: l.h }));
    await updateWidgetPositions(dashboardId, positions);
  };

  const handleDeleteWidget = async (widgetId: number) => {
    if (!window.confirm("Remove this widget from the dashboard?")) return;
    const ok = await deleteWidget(widgetId);
    if (ok) load();
  };

  if (loading || !dashboard) {
    return <div className="p-4">Loading...</div>;
  }

  const layout: Layout[] = dashboard.widgets.map((w) => ({
    i: String(w.id),
    x: w.position_x,
    y: w.position_y,
    w: w.width,
    h: w.height,
    minW: 2,
    minH: 2,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #eee" }}>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/dashboard-builder")}>
          &larr; Back
        </button>
        <strong style={{ fontSize: 14 }}>{dashboard.name}</strong>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm btn-outline-secondary" onClick={load}>
          Refresh
        </button>
        <button className="btn btn-sm" style={{ background: "#f58634", color: "#fff" }} onClick={() => setShowAddWidget(true)}>
          + Add Widget
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12, background: "#f7f7f7" }}>
        {dashboard.widgets.length === 0 ? (
          <div className="text-muted p-4 text-center">No widgets yet — click "+ Add Widget" to add your first one.</div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layout={layout}
            cols={GRID_COLS}
            rowHeight={ROW_HEIGHT}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".dashboard-widget-drag-handle"
          >
            {dashboard.widgets.map((widget) => {
              const result = results[widget.id];
              const rows = result?.data?.rows || [];
              let config: Record<string, any> = {};
              try {
                config = widget.chart_config_json ? JSON.parse(widget.chart_config_json) : {};
              } catch {
                config = {};
              }

              return (
                <div key={String(widget.id)} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div className="dashboard-widget-drag-handle" style={{ cursor: "move", padding: "4px 8px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", fontSize: 12, fontWeight: 600 }}>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {widget.title || widget.report_definition_name || "Widget"}
                    </span>
                    <button
                      className="btn btn-sm btn-link p-0 text-danger"
                      style={{ fontSize: 11 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWidget(widget.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                    {widget.source_missing ? (
                      <div className="text-danger small p-2">Source report was deleted.</div>
                    ) : result?.ack !== undefined && result.ack !== 1 ? (
                      <div className="text-danger small p-2">{result.ack_msg || "Failed to load"}</div>
                    ) : widget.widget_type === "table" ? (
                      <TableWidget rows={rows} />
                    ) : widget.widget_type === "stat_tile" ? (
                      <StatTileWidget rows={rows} config={config} title={widget.title} />
                    ) : (
                      <ChartWidget widgetType={widget.widget_type as "bar" | "line" | "pie" | "doughnut"} rows={rows} config={config} />
                    )}
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>

      {showAddWidget && (
        <AddWidgetModal
          dashboardId={dashboardId}
          onClose={() => setShowAddWidget(false)}
          onAdded={() => {
            setShowAddWidget(false);
            load();
          }}
        />
      )}
    </div>
  );
};

export default DashboardCanvasView;
