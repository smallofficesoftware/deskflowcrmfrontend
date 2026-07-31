import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IBomMaterial, IBomProcess } from "../JobCardTypes";
import MaterialActionMenu from "./MaterialActionMenu";

interface IProps {
  bomProcesses: IBomProcess[];
  loading: boolean;
  onAddStock: (materialId: number, materialName: string) => void;
  onGeneratePO: (materialId: number, materialName: string) => void;
}

// ─── Material Table ───────────────────────────────────────────────────────────

const MaterialTable = ({
  materials,
  onAddStock,
  onGeneratePO,
}: {
  materials: IBomMaterial[];
  onAddStock: (id: number, name: string) => void;
  onGeneratePO: (id: number, name: string) => void;
}) => {
  if (materials.length === 0)
    return (
      <p className="text-muted fst-italic" style={{ fontSize: "0.78rem" }}>
        No materials
      </p>
    );

  return (
    // 👇 Removed style={{ overflowX: "auto" }} here so it stops creating a scrollbar
    <div>
      <table
        className="table table-sm table-hover mb-0"
        style={{ fontSize: "0.78rem", minWidth: 560 }}
      >
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            <th style={{ width: 30 }}>#</th>
            <th>Material</th>
            <th style={{ width: 70 }}>Unit</th>
            <th style={{ width: 100 }}>Current Stock</th>
            <th style={{ width: 100 }}>Required</th>
            <th style={{ width: 100 }}>Diff</th>
            <th style={{ width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, idx) => {
            const shortage = m.qty_diff < 0;
            return (
              <tr key={m.material_id}>
                <td className="text-muted">{idx + 1}</td>
                <td className="fw-semibold">{m.material_name}</td>
                <td>{m.unit}</td>
                <td>{m.available_qty.toFixed(2)}</td>
                <td>{m.required_qty.toFixed(2)}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: shortage ? "#fee2e2" : "#d1fae5",
                      color: shortage ? "#b91c1c" : "#15803d",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                    }}
                  >
                    {shortage ? "" : "+"}
                    {m.qty_diff.toFixed(2)}
                  </span>
                </td>
                <td>
                  <MaterialActionMenu
                    onAddStock={() =>
                      onAddStock(m.material_id, m.material_name)
                    }
                    onGeneratePO={() =>
                      onGeneratePO(m.material_id, m.material_name)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Process Accordion Card ───────────────────────────────────────────────────

const ProcessCard = ({
  process,
  defaultOpen,
  onAddStock,
  onGeneratePO,
}: {
  process: IBomProcess;
  defaultOpen: boolean;
  onAddStock: (id: number, name: string) => void;
  onGeneratePO: (id: number, name: string) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [activeSection, setActiveSection] = useState<
    "consumption" | "rejection"
  >("consumption");

  const shortageCount =
    process.consumption.filter((m) => m.qty_diff < 0).length +
    process.rejection.filter((m) => m.qty_diff < 0).length;

  return (
    <div
      className="rounded-3 mb-2"
      // 👇 Removed overflow: "hidden" so the menu can escape the card
      style={{ border: "1.5px solid #e9ecef" }}
    >
      {/* Process header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: open ? "#fff5ec" : "#f8f9fa",
          border: "none",
          borderBottom: open ? "1.5px solid #f9d5b0" : "none",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderTopLeftRadius: "6px", // 👇 Added to keep corners rounded
          borderTopRightRadius: "6px", // 👇 Added to keep corners rounded
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f58634,#e0732a)",
              color: "#fff",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ⚙
          </span>
          <span
            style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}
          >
            {process.process_name}
          </span>
          {shortageCount > 0 && (
            <span
              className="badge"
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                fontSize: "0.68rem",
              }}
            >
              {shortageCount} shortage{shortageCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ color: "#adb5bd", fontSize: "0.75rem" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Collapsed content */}
      {open && (
        <div style={{ padding: "14px 16px" }}>
          {/* Sub-section tabs */}
          <div className="d-flex gap-1 mb-3">
            {(["consumption", "rejection"] as const).map((sec) => {
              const isActive = activeSection === sec;
              const color = sec === "consumption" ? "#f58634" : "#dc3545";
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  style={{
                    padding: "4px 14px",
                    borderRadius: 20,
                    border: `1.5px solid ${isActive ? color : "#e9ecef"}`,
                    background: isActive ? `${color}12` : "#f8f9fa",
                    color: isActive ? color : "#6c757d",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.76rem",
                    cursor: "pointer",
                  }}
                >
                  {sec === "consumption" ? "🔥 Consumption" : "♻️ Rejection"}
                  <span
                    className="ms-1 badge"
                    style={{
                      background: isActive ? color : "#dee2e6",
                      color: isActive ? "#fff" : "#6c757d",
                      fontSize: "0.66rem",
                    }}
                  >
                    {
                      (sec === "consumption"
                        ? process.consumption
                        : process.rejection
                      ).length
                    }
                  </span>
                </button>
              );
            })}
          </div>

          <MaterialTable
            materials={
              activeSection === "consumption"
                ? process.consumption
                : process.rejection
            }
            onAddStock={onAddStock}
            onGeneratePO={onGeneratePO}
          />
        </div>
      )}
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

const RequiredMaterialSection = ({
  bomProcesses,
  loading,
  onAddStock,
  onGeneratePO,
}: IProps) => {
  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={64} borderRadius={10} className="mb-2" />
        ))}
      </div>
    );
  }

  if (bomProcesses.length === 0) {
    return (
      <div
        className="text-center py-5 text-muted"
        style={{ fontSize: "0.85rem" }}
      >
        <div style={{ fontSize: "2.5rem" }}>🧰</div>
        <p className="mt-2">No BOM data found for this item.</p>
      </div>
    );
  }

  const totalShortages = bomProcesses.reduce(
    (acc, p) =>
      acc +
      p.consumption.filter((m) => m.qty_diff < 0).length +
      p.rejection.filter((m) => m.qty_diff < 0).length,
    0,
  );

  return (
    <div>
      {/* Summary bar */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span
          className="fw-semibold"
          style={{ fontSize: "0.85rem", color: "#374151" }}
        >
          {bomProcesses.length} Process{bomProcesses.length > 1 ? "es" : ""}
        </span>
        {totalShortages > 0 ? (
          <span
            className="badge"
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "0.75rem",
            }}
          >
            ⚠ {totalShortages} material shortage{totalShortages > 1 ? "s" : ""}
          </span>
        ) : (
          <span
            className="badge"
            style={{
              background: "#d1fae5",
              color: "#15803d",
              fontSize: "0.75rem",
            }}
          >
            ✓ All materials sufficient
          </span>
        )}
      </div>

      {/* Process cards */}
      {bomProcesses.map((p, idx) => (
        <ProcessCard
          key={p.process_id}
          process={p}
          defaultOpen={idx === 0}
          onAddStock={onAddStock}
          onGeneratePO={onGeneratePO}
        />
      ))}
    </div>
  );
};

export default RequiredMaterialSection;
