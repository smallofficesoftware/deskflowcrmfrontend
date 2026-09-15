import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import React from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";

// Same registration pattern CRMDashboardView.tsx already uses (specific
// elements, not the full registerables bundle) — chart.js/react-chartjs-2
// are already a dependency of this app, reused as-is, not a new library.
ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const PALETTE = ["#f58634", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ef4444", "#14b8a6", "#6366f1"];

export interface IChartConfig {
  labelColumn?: string;
  valueColumn?: string;
}

interface IChartWidgetProps {
  widgetType: "bar" | "line" | "pie" | "doughnut";
  rows: Record<string, unknown>[];
  config: IChartConfig;
}

// Single-series MVP — one label column + one value column. A widget's
// underlying report_definition can have more columns than this, but the
// widget itself only ever plots the one pair picked in the Add-Widget
// modal; a report needing a richer breakdown is better viewed as a Table
// widget instead.
const ChartWidget: React.FC<IChartWidgetProps> = ({ widgetType, rows, config }) => {
  if (!config.labelColumn || !config.valueColumn) {
    return <div className="text-muted small p-2">Chart not configured — edit this widget to pick a label and value column.</div>;
  }

  const labels = rows.map((r) => String(r[config.labelColumn as string] ?? ""));
  const values = rows.map((r) => Number(r[config.valueColumn as string]) || 0);
  const isSliced = widgetType === "pie" || widgetType === "doughnut";

  const data = {
    labels,
    datasets: [
      {
        label: config.valueColumn,
        data: values,
        backgroundColor: isSliced ? PALETTE : PALETTE[0],
        borderColor: isSliced ? "#fff" : PALETTE[0],
        borderWidth: isSliced ? 1 : 0,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: isSliced, position: "bottom" as const } },
  };

  if (rows.length === 0) {
    return <div className="text-muted small p-2">No data</div>;
  }
  if (widgetType === "bar") return <Bar data={data} options={options} />;
  if (widgetType === "line") return <Line data={data} options={options} />;
  if (widgetType === "pie") return <Pie data={data} options={options} />;
  return <Doughnut data={data} options={options} />;
};

export default ChartWidget;
