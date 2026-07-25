import React from "react";
import { SingleValue } from "react-select";
import { IOption } from "../JobCardController";
import {
  IProductionEntryRow,
  IWarehouseOption,
  stockKey,
  WarehouseStockMap,
} from "../JobCardTypes";
import CustomSearchDropdown from "../../../../../../components/CustomSearchDropdown";

interface IProps {
  rows: IProductionEntryRow[];
  warehouseOptions: IWarehouseOption[];
  defaultWarehouse: IOption | null;
  accentColor: string; // "#f58634" for consumption, "#dc3545" for rejection
  stockMap: WarehouseStockMap;
  loadingStock: boolean;
  // Only Consumption enforces the "can't use more than you have" rule —
  // Rejection just displays stock informationally, no error styling.
  enforceStockLimit: boolean;
  onQtyChange: (materialId: number, qty: number) => void;
  onWarehouseChange: (materialId: number, warehouseId: number | null) => void;
}

const ProductionEntryMaterialTable = ({
  rows,
  warehouseOptions,
  defaultWarehouse,
  accentColor,
  stockMap,
  loadingStock,
  enforceStockLimit,
  onQtyChange,
  onWarehouseChange,
}: IProps) => {
  if (rows.length === 0) {
    return (
      <p className="text-muted fst-italic" style={{ fontSize: "0.78rem" }}>
        No materials
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        className="table table-sm table-hover mb-0"
        style={{ fontSize: "0.78rem", minWidth: 480 }}
      >
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            <th style={{ width: 30 }}>#</th>
            <th>Material</th>
            <th style={{ width: 60 }}>Unit</th>
            <th style={{ width: 90 }}>Stock</th>
            <th style={{ width: 110, color: accentColor }}>Qty</th>
            <th style={{ width: 190 }}>Warehouse</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const selectedOption =
              warehouseOptions.find((w) => w.value === row.warehouse_id) ||
              (row.warehouse_id == null ? defaultWarehouse : null);

            const availableQty =
              row.warehouse_id != null
                ? stockMap[stockKey(row.material_id, row.warehouse_id)]
                : undefined;
            const hasShortage =
              enforceStockLimit &&
              availableQty != null &&
              row.qty > availableQty;

            return (
              <tr key={row.material_id}>
                <td className="text-muted">{idx + 1}</td>
                <td className="fw-semibold">{row.material_name}</td>
                <td>{row.unit}</td>
                <td>
                  {!row.warehouse_id ? (
                    <span
                      className="text-muted"
                      style={{ fontSize: "0.72rem" }}
                    >
                      —
                    </span>
                  ) : loadingStock && availableQty == null ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{
                        width: 12,
                        height: 12,
                        borderWidth: 2,
                        color: "#adb5bd",
                      }}
                    />
                  ) : availableQty == null ? (
                    <span
                      className="text-muted"
                      style={{ fontSize: "0.72rem" }}
                    >
                      —
                    </span>
                  ) : (
                    <span
                      className="badge"
                      style={{
                        background: hasShortage ? "#fee2e2" : "#f1f5f9",
                        color: hasShortage ? "#b91c1c" : "#475569",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                      }}
                    >
                      {availableQty.toFixed(2)}
                    </span>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{
                      fontSize: "0.78rem",
                      borderColor: row.edited ? accentColor : undefined,
                      color: accentColor,
                      fontWeight: 600,
                    }}
                    min={0}
                    step="0.001"
                    value={row.qty}
                    onChange={(e) =>
                      onQtyChange(
                        row.material_id,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    title={
                      row.edited
                        ? "Manually adjusted — does not affect Production Qty"
                        : ""
                    }
                  />
                  {hasShortage && (
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#dc3545",
                        marginTop: 2,
                      }}
                    >
                      ⚠ Insufficient stock (avail: {availableQty!.toFixed(2)})
                    </div>
                  )}
                </td>
                <td>
                  <CustomSearchDropdown
                    options={warehouseOptions}
                    value={selectedOption as SingleValue<IOption>}
                    onChange={(selected: SingleValue<IOption>) =>
                      onWarehouseChange(
                        row.material_id,
                        selected ? Number(selected.value) : null,
                      )
                    }
                    placeholder="Warehouse..."
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

export default ProductionEntryMaterialTable;
