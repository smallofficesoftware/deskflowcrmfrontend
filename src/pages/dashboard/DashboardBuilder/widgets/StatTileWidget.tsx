import React from "react";

interface IStatTileConfig {
  valueColumn?: string;
  label?: string;
}

interface IStatTileWidgetProps {
  rows: Record<string, unknown>[];
  config: IStatTileConfig;
  title?: string | null;
}

// A stat tile's underlying report_definition is always a single aggregate
// column over the whole result set (createDashboard's own "quick counter"
// shortcut, or a hand-built single-aggregate query report) — one row, one
// number. Reads the first row's valueColumn.
const StatTileWidget: React.FC<IStatTileWidgetProps> = ({ rows, config, title }) => {
  const raw = config.valueColumn ? rows[0]?.[config.valueColumn] : undefined;
  const value = raw === null || raw === undefined ? "—" : typeof raw === "number" ? raw.toLocaleString() : String(raw);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 8 }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#f58634", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 4, textAlign: "center" }}>{config.label || title || ""}</div>
    </div>
  );
};

export default StatTileWidget;
