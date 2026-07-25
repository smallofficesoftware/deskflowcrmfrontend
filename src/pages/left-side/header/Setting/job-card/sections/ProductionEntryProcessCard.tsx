import React, { useState } from "react";
import { IOption } from "../JobCardController";
import {
  IProductionEntryProcessRows,
  IWarehouseOption,
  WarehouseStockMap,
} from "../JobCardTypes";
import ProductionEntryMaterialTable from "./ProductionEntryMaterialTable";

interface IProps {
  processRows: IProductionEntryProcessRows;
  defaultOpen: boolean;
  warehouseOptions: IWarehouseOption[];
  defaultWarehouse: IOption | null;
  stockMap: WarehouseStockMap;
  loadingStock: boolean;
  isStockCheckRequired: boolean;
  onQtyChange: (
    processId: number,
    type: "consumption" | "rejection",
    materialId: number,
    qty: number,
  ) => void;
  onWarehouseChange: (
    processId: number,
    type: "consumption" | "rejection",
    materialId: number,
    warehouseId: number | null,
  ) => void;
}

const ProductionEntryProcessCard = ({
  processRows,
  defaultOpen,
  warehouseOptions,
  defaultWarehouse,
  stockMap,
  loadingStock,
  isStockCheckRequired,
  onQtyChange,
  onWarehouseChange,
}: IProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [activeSection, setActiveSection] = useState<
    "consumption" | "rejection"
  >("consumption");

  const subtotal = (type: "consumption" | "rejection") =>
    processRows[type].reduce((s, r) => s + r.qty, 0);

  return (
    <div className="rounded-3 mb-2" style={{ border: "1.5px solid #e9ecef" }}>
      {/* Header */}
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
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
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
            {processRows.process_name}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#b85c1a" }}>
            Cons: {subtotal("consumption").toFixed(3)}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#b91c1c" }}>
            Rej: {subtotal("rejection").toFixed(3)}
          </span>
        </div>
        <span style={{ color: "#adb5bd", fontSize: "0.75rem" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Body */}
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
                    {processRows[sec].length}
                  </span>
                </button>
              );
            })}
          </div>

          <ProductionEntryMaterialTable
            rows={processRows[activeSection]}
            warehouseOptions={warehouseOptions}
            defaultWarehouse={defaultWarehouse}
            accentColor={
              activeSection === "consumption" ? "#f58634" : "#dc3545"
            }
            stockMap={stockMap}
            loadingStock={loadingStock}
            enforceStockLimit={
              isStockCheckRequired && activeSection === "consumption"
            }
            onQtyChange={(materialId, qty) =>
              onQtyChange(
                processRows.process_id,
                activeSection,
                materialId,
                qty,
              )
            }
            onWarehouseChange={(materialId, warehouseId) =>
              onWarehouseChange(
                processRows.process_id,
                activeSection,
                materialId,
                warehouseId,
              )
            }
          />
        </div>
      )}
    </div>
  );
};

export default ProductionEntryProcessCard;
