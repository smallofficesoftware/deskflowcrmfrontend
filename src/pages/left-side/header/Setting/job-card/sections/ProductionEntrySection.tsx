import React, { useEffect, useMemo, useState } from "react";
import { SingleValue } from "react-select";
import { fetchWarehouseStockBatch, IOption } from "../JobCardController";
import {
  IBomMaterial,
  IBomProcess,
  IProductionEntryMaterialPayload,
  IProductionEntryProcessRows,
  IProductionEntryProcessTimePayload,
  IProductionEntryRow,
  IProductionEntrySavePayload,
  ITeamMemberOption,
  IWarehouseOption,
  stockKey,
  WarehouseStockMap,
} from "../JobCardTypes";
import CustomSearchDropdown from "../../../../../../components/CustomSearchDropdown";
import { formatSecondsToHms } from "../../product/bom-master/bom-process/BomProcessFieldController";
import ProductionEntryProcessCard from "./ProductionEntryProcessCard";

interface IProps {
  jobId: number;
  order_item_id: number;
  productId?: number; // canonical finished-good product id
  bomProcesses: IBomProcess[];
  orderQty: number;
  itemName?: string;
  warehouseOptions: IWarehouseOption[];
  teamMemberOptions: ITeamMemberOption[];
  loadingWarehouse: boolean;
  loadingTeamMembers: boolean;
  saving: boolean;
  isStockCheckRequired: boolean; // true = insufficient consumption stock blocks Save
  onSave: (payload: IProductionEntrySavePayload) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

// ─── Build / refresh editable rows from raw BOM materials ─────────────────────
// Recalculates qty for any row the user hasn't manually edited; rows marked
// `edited` keep their custom value untouched even if Production Qty changes.

const buildRows = (
  materials: IBomMaterial[],
  producedQty: number,
  orderQty: number,
  defaultWarehouseId: number | null,
  prevRows: IProductionEntryRow[] | undefined,
): IProductionEntryRow[] =>
  materials.map((m) => {
    const prevRow = prevRows?.find((r) => r.material_id === m.material_id);
    if (prevRow?.edited) return { ...prevRow };

    const rate = orderQty > 0 ? m.required_qty / orderQty : 0;
    return {
      material_id: m.material_id,
      material_name: m.material_name,
      unit: m.unit,
      qty: parseFloat((rate * producedQty).toFixed(3)),
      warehouse_id: prevRow?.warehouse_id ?? defaultWarehouseId,
      edited: false,
    };
  });

const buildEntries = (
  bomProcesses: IBomProcess[],
  producedQty: number,
  orderQty: number,
  defaultWarehouseId: number | null,
  previous: Record<number, IProductionEntryProcessRows>,
): Record<number, IProductionEntryProcessRows> => {
  const result: Record<number, IProductionEntryProcessRows> = {};
  bomProcesses.forEach((p) => {
    const prev = previous[p.process_id];
    result[p.process_id] = {
      process_id: p.process_id,
      process_name: p.process_name,
      consumption: buildRows(
        p.consumption,
        producedQty,
        orderQty,
        defaultWarehouseId,
        prev?.consumption,
      ),
      rejection: buildRows(
        p.rejection,
        producedQty,
        orderQty,
        defaultWarehouseId,
        prev?.rejection,
      ),
      actual_time: prev?.actual_time ?? 0,
    };
  });
  return result;
};

const ProductionEntrySection = ({
  order_item_id,
  productId,
  jobId,
  bomProcesses,
  orderQty,
  itemName,
  warehouseOptions,
  teamMemberOptions,
  loadingWarehouse,
  loadingTeamMembers,
  isStockCheckRequired,
  saving,
  onSave,
}: IProps) => {
  const [producedQtyStr, setProducedQtyStr] = useState("");
  const producedQty = parseFloat(producedQtyStr) || 0;
  const isValidQty = producedQty > 0;

  // ── Header fields ──
  const [remark, setRemark] = useState("");
  const [entryDate, setEntryDate] = useState(todayIso());
  const [selectedTeamMember, setSelectedTeamMember] =
    useState<SingleValue<IOption>>(null);

  // ── Default warehouse: auto-selected only when exactly one option exists ──
  const defaultWarehouse: IOption | null =
    warehouseOptions.length === 1
      ? { value: warehouseOptions[0].value, label: warehouseOptions[0].label }
      : null;

  // ── Finish Good warehouse (separate from per-material consumption/rejection warehouses) ──
  const [finishGoodWarehouse, setFinishGoodWarehouse] =
    useState<SingleValue<IOption>>(null);

  // Fall back to the single-warehouse default once warehouses load
  useEffect(() => {
    if (warehouseOptions.length === 0) return;
    if (!finishGoodWarehouse && defaultWarehouse)
      setFinishGoodWarehouse(defaultWarehouse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseOptions, defaultWarehouse]);

  // ── Editable entries, keyed by process id ──
  const [entriesByProcess, setEntriesByProcess] = useState<
    Record<number, IProductionEntryProcessRows>
  >({});

  useEffect(() => {
    setEntriesByProcess((prev) =>
      buildEntries(
        bomProcesses,
        producedQty,
        orderQty,
        defaultWarehouse?.value != null ? Number(defaultWarehouse.value) : null,
        prev,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bomProcesses, producedQty, orderQty, defaultWarehouse?.value]);

  // ── Row edit handlers ──

  const handleQtyChange = (
    processId: number,
    type: "consumption" | "rejection",
    materialId: number,
    qty: number,
  ) => {
    setEntriesByProcess((prev) => {
      const proc = prev[processId];
      if (!proc) return prev;
      return {
        ...prev,
        [processId]: {
          ...proc,
          [type]: proc[type].map((r) =>
            r.material_id === materialId ? { ...r, qty, edited: true } : r,
          ),
        },
      };
    });
  };

  const handleActualTimeChange = (processId: number, actualTimeSeconds: number) => {
    setEntriesByProcess((prev) => {
      const proc = prev[processId];
      if (!proc) return prev;
      return {
        ...prev,
        [processId]: { ...proc, actual_time: actualTimeSeconds },
      };
    });
  };

  const handleWarehouseChange = (
    processId: number,
    type: "consumption" | "rejection",
    materialId: number,
    warehouseId: number | null,
  ) => {
    setEntriesByProcess((prev) => {
      const proc = prev[processId];
      if (!proc) return prev;
      return {
        ...prev,
        [processId]: {
          ...proc,
          [type]: proc[type].map((r) =>
            r.material_id === materialId
              ? { ...r, warehouse_id: warehouseId }
              : r,
          ),
        },
      };
    });
  };

  // ── Warehouse stock lookup (Finish Good + every consumption/rejection row) ──

  const [stockMap, setStockMap] = useState<WarehouseStockMap>({});
  const [loadingStock, setLoadingStock] = useState(false);

  // Gather every distinct (item_id, warehouse_id) pair currently needed.
  const stockLookupPairs = useMemo(() => {
    const pairs: { order_item_id: number; warehouseId: number }[] = [];
    const seen = new Set<string>();
    const add = (id: number, warehouseId: number | null) => {
      if (warehouseId == null) return;
      const key = stockKey(id, warehouseId);
      if (seen.has(key)) return;
      seen.add(key);
      pairs.push({ order_item_id: id, warehouseId });
    };

    Object.values(entriesByProcess).forEach((p) => {
      p.consumption.forEach((r) => add(r.material_id, r.warehouse_id));
      p.rejection.forEach((r) => add(r.material_id, r.warehouse_id));
    });
    if (order_item_id && finishGoodWarehouse)
      add(order_item_id, Number(finishGoodWarehouse.value));

    return pairs;
  }, [entriesByProcess, finishGoodWarehouse, order_item_id]);

  // Only re-fetch when the actual SET of pairs changes, not on every qty edit.
  const stockSignature = stockLookupPairs
    .map((p) => `${p.order_item_id}:${p.warehouseId}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (stockLookupPairs.length === 0) {
      setStockMap({});
      return;
    }
    let cancelled = false;
    setLoadingStock(true);
    fetchWarehouseStockBatch(
      stockLookupPairs.map((p) => ({
        material_id: p.order_item_id,
        warehouse_id: p.warehouseId,
      })),
    )
      .then((map) => {
        if (!cancelled) setStockMap(map);
      })
      .finally(() => {
        if (!cancelled) setLoadingStock(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockSignature]);

  // ── Save validation ──

  const allRows = useMemo(
    () =>
      Object.values(entriesByProcess).flatMap((p) => [
        ...p.consumption,
        ...p.rejection,
      ]),
    [entriesByProcess],
  );

  const totalActualTime = useMemo(
    () =>
      Object.values(entriesByProcess).reduce(
        (sum, p) => sum + (p.actual_time || 0),
        0,
      ),
    [entriesByProcess],
  );
  const missingWarehouse = allRows.some((r) => r.warehouse_id == null);

  const insufficientConsumption =
    isStockCheckRequired &&
    Object.values(entriesByProcess).some((p) =>
      p.consumption.some((r) => {
        if (r.warehouse_id == null) return false;
        const avail = stockMap[stockKey(r.material_id, r.warehouse_id)];
        return avail != null && r.qty > avail;
      }),
    );

  let blockedReason: string | undefined;
  if (!isValidQty) blockedReason = "Enter a production quantity first.";
  else if (!finishGoodWarehouse)
    blockedReason = "Select a warehouse for the finish good entry.";
  else if (allRows.length === 0) blockedReason = "No BOM materials to process.";
  else if (missingWarehouse)
    blockedReason = "Assign a warehouse to every material row before saving.";
  else if (insufficientConsumption)
    blockedReason =
      "One or more consumption items exceed the available stock in their selected warehouse.";

  const canSave =
    isValidQty &&
    !!finishGoodWarehouse &&
    allRows.length > 0 &&
    !missingWarehouse &&
    !insufficientConsumption &&
    !saving;

  // ── Save ──

  const handleSaveClick = () => {
    const consumption_items: IProductionEntryMaterialPayload[] = [];
    const rejection_items: IProductionEntryMaterialPayload[] = [];
    const process_times: IProductionEntryProcessTimePayload[] = [];

    Object.values(entriesByProcess).forEach((p) => {
      p.consumption.forEach((r) =>
        consumption_items.push({
          process_id: p.process_id,
          material_id: r.material_id,
          warehouse_id: r.warehouse_id,
          qty: r.qty,
        }),
      );
      p.rejection.forEach((r) =>
        rejection_items.push({
          process_id: p.process_id,
          material_id: r.material_id,
          warehouse_id: r.warehouse_id,
          qty: r.qty,
        }),
      );
      if (p.actual_time > 0) {
        process_times.push({
          process_id: p.process_id,
          actual_time: p.actual_time,
        });
      }
    });

    onSave({
      job_id: jobId,
      order_item_id: order_item_id,
      product_id: productId ?? order_item_id,
      produced_qty: producedQty,
      finish_good_warehouse_id: finishGoodWarehouse
        ? Number(finishGoodWarehouse.value)
        : null,
      entry_date: entryDate,
      remark,
      team_member_id: selectedTeamMember
        ? Number(selectedTeamMember.value)
        : null,
      consumption_items,
      rejection_items,
      process_times,
    });
  };

  return (
    <div>
      {/* Production Qty + Finish Good Warehouse */}
      <div
        className="rounded-3 p-3 mb-3"
        style={{ background: "#fff5ec", border: "1.5px solid #f9d5b0" }}
      >
        <div className="row align-items-end g-3">
          <div className="col-md-6">
            <label
              className="form-label fw-semibold mb-1"
              style={{ fontSize: "0.82rem" }}
            >
              ✅ Finish Good Qty <span className="text-danger">*</span>
            </label>
            {itemName && (
              <div className="text-muted mb-1" style={{ fontSize: "0.73rem" }}>
                {itemName}
              </div>
            )}
            <input
              type="number"
              min={0}
              className="form-control form-control-sm"
              placeholder="Enter produced qty…"
              value={producedQtyStr}
              onChange={(e) => setProducedQtyStr(e.target.value)}
              style={{ borderColor: "#f9d5b0" }}
            />
          </div>
          <div className="col-md-6">
            <label
              className="form-label fw-semibold mb-1"
              style={{ fontSize: "0.82rem" }}
            >
              🏬 Finish Good Warehouse <span className="text-danger">*</span>
            </label>
            <CustomSearchDropdown
              options={warehouseOptions}
              value={finishGoodWarehouse}
              onChange={setFinishGoodWarehouse}
              isDisabled={loadingWarehouse}
              placeholder={loadingWarehouse ? "Loading…" : "Select warehouse…"}
            />
            {finishGoodWarehouse && (
              <div className="mt-1" style={{ fontSize: "0.73rem" }}>
                {loadingStock &&
                stockMap[
                  stockKey(order_item_id, Number(finishGoodWarehouse.value))
                ] == null ? (
                  <span className="text-muted">Checking stock…</span>
                ) : (
                  <span style={{ color: "#475569" }}>
                    📦 Current stock:{" "}
                    <strong>
                      {(
                        stockMap[
                          stockKey(
                            order_item_id,
                            Number(finishGoodWarehouse.value),
                          )
                        ] ?? 0
                      ).toFixed(2)}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header fields: Remark / Team Member / Date */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label
            className="form-label fw-semibold mb-1"
            style={{ fontSize: "0.82rem" }}
          >
            📝 Remark
          </label>
          <textarea
            className="form-control form-control-sm"
            rows={2}
            placeholder="Optional remark for this entry…"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label
            className="form-label fw-semibold mb-1"
            style={{ fontSize: "0.82rem" }}
          >
            👤 Team Member
          </label>
          <CustomSearchDropdown
            options={teamMemberOptions}
            value={selectedTeamMember}
            onChange={setSelectedTeamMember}
            isDisabled={loadingTeamMembers}
            placeholder={loadingTeamMembers ? "Loading…" : "Select member…"}
          />
        </div>
        <div className="col-md-3">
          <label
            className="form-label fw-semibold mb-1"
            style={{ fontSize: "0.82rem" }}
          >
            📅 Date
          </label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
      </div>

      {/* Default warehouse banner */}
      {!loadingWarehouse && defaultWarehouse && (
        <div
          className="d-flex align-items-center gap-2 rounded-2 px-3 py-2 mb-3"
          style={{ background: "#eef6ff", border: "1px solid #bfdbfe" }}
        >
          <span style={{ fontSize: "1rem" }}>🏬</span>
          <span style={{ fontSize: "0.78rem", color: "#1e40af" }}>
            Only one warehouse available —{" "}
            <strong>{defaultWarehouse.label}</strong> auto-selected for all
            rows.
          </span>
        </div>
      )}
      {loadingWarehouse && (
        <div className="text-muted mb-3" style={{ fontSize: "0.76rem" }}>
          Loading warehouses…
        </div>
      )}

      {/* Per-process editable material cards — consumption & rejection shown separately, same pattern as Required Material */}
      {isValidQty && bomProcesses.length > 0 && (
        <div className="mb-3">
          {bomProcesses.map((p, idx) => {
            const rows = entriesByProcess[p.process_id];
            if (!rows) return null;
            return (
              <ProductionEntryProcessCard
                key={p.process_id}
                processRows={rows}
                defaultOpen={idx === 0}
                warehouseOptions={warehouseOptions}
                defaultWarehouse={defaultWarehouse}
                stockMap={stockMap}
                loadingStock={loadingStock}
                isStockCheckRequired={isStockCheckRequired}
                onQtyChange={handleQtyChange}
                onWarehouseChange={handleWarehouseChange}
                onActualTimeChange={handleActualTimeChange}
              />
            );
          })}
        </div>
      )}

      {!isValidQty && (
        <div
          className="text-center py-4 rounded-3 mb-3"
          style={{
            background: "#f8f9fa",
            border: "1.5px dashed #dee2e6",
            color: "#adb5bd",
            fontSize: "0.83rem",
          }}
        >
          Enter a finish good quantity above to see material costing
        </div>
      )}

      {/* Single Save button */}
      <div
        className="rounded-3 p-3 mt-3"
        style={{ background: "#fafafa", border: "1.5px solid #e9ecef" }}
      >
        {totalActualTime > 0 && (
          <div
            className="d-flex align-items-center justify-content-end gap-2 mb-2"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}
          >
            ⏱ Total Actual Time: {formatSecondsToHms(totalActualTime)}
          </div>
        )}
        {blockedReason && (
          <div className="text-danger mb-2" style={{ fontSize: "0.76rem" }}>
            ⚠ {blockedReason}
          </div>
        )}
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-sm text-white"
            style={{
              background: canSave
                ? "linear-gradient(135deg,#198754,#15803d)"
                : "#adb5bd",
              minWidth: 200,
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: canSave ? "pointer" : "not-allowed",
            }}
            onClick={handleSaveClick}
            disabled={!canSave}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  style={{ width: 12, height: 12, borderWidth: 2 }}
                />
                Saving…
              </>
            ) : (
              "💾 Save Production Entry"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionEntrySection;
