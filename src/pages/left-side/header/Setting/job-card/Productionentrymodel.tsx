import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import {
  fetchJobCardDetail,
  fetchProductionEntryDetail,
  fetchTeamMemberList,
  fetchWarehouseList,
  saveProductionEntry,
} from "./JobCardController";
import {
  IBomProcess,
  IContactDetail,
  IItemDetail,
  IProductionEntryDetail,
  IProductionEntrySavePayload,
  ITeamMemberOption,
  IWarehouseOption,
} from "./JobCardTypes";
import ProductionEntrySection from "./sections/ProductionEntrySection";

interface IProps {
  show: boolean;
  onHide: () => void;
  jobId: number;
  order_item_id: number;
  entryId?: number | null; // provided when editing an existing production entry
  isStockCheckRequired: boolean;
  onSaved?: () => void; // lets the list modal refresh after a successful save
}

const ProductionEntryModel = ({
  show,
  onHide,
  jobId,
  entryId,
  order_item_id,
  isStockCheckRequired,
  onSaved,
}: IProps) => {
  // ── Job card data (BOM + item context) ──
  const [contactDetail, setContactDetail] = useState<IContactDetail | null>(
    null,
  );
  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [bomProcesses, setBomProcesses] = useState<IBomProcess[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Warehouse / Team member dropdown data ──
  const [warehouseOptions, setWarehouseOptions] = useState<IWarehouseOption[]>(
    [],
  );
  const [teamMemberOptions, setTeamMemberOptions] = useState<
    ITeamMemberOption[]
  >([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  // ── Existing entry (edit mode) ──
  const [existingEntry, setExistingEntry] =
    useState<IProductionEntryDetail | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // ── Save state ──
  const [saving, setSaving] = useState(false);

  useEscapeKey(onHide);

  useEffect(() => {
    if (!show) return;
    setItemDetail(null);
    setBomProcesses([]);
    setExistingEntry(null);

    fetchJobCardDetail(
      jobId,
      setContactDetail,
      setItemDetail,
      setBomProcesses,
      setLoading,
    );
    fetchWarehouseList(setWarehouseOptions, setLoadingWarehouse);
    fetchTeamMemberList(setTeamMemberOptions, setLoadingTeamMembers);

    if (entryId) {
      fetchProductionEntryDetail(entryId, setExistingEntry, setLoadingExisting);
    }
  }, [show, jobId, entryId]);

  // ── Single Save action ──

  const handleSave = async (payload: IProductionEntrySavePayload) => {
    setSaving(true);
    const result = await saveProductionEntry(payload);
    setSaving(false);

    if (result.success) {
      toast.success(result.message);
      onSaved?.();
      onHide();
    } else {
      toast.error(result.message);
    }
  };

  if (!show) return null;

  const isEditMode = !!entryId;
  const isLoadingAny = loading || (isEditMode && loadingExisting);

  return (
    <div
      onClick={onHide}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1065,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(98vw, 820px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#f58634 0%,#e0732a 100%)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h5
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              {isEditMode
                ? "✏️ Edit Production Entry"
                : "⚙️ Add Production Entry"}
            </h5>
            {itemDetail && (
              <span
                style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.73rem" }}
              >
                {itemDetail.item_name}
                {itemDetail.order_no ? ` — ${itemDetail.order_no}` : ""}
                {" · "}Order Qty: {itemDetail.order_qty} {itemDetail.unit}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            disabled={saving}
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              width: 30,
              height: 30,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {isLoadingAny ? (
            <div>
              <Skeleton height={90} borderRadius={8} className="mb-3" />
              <Skeleton
                height={60}
                borderRadius={8}
                className="mb-2"
                count={3}
              />
            </div>
          ) : bomProcesses.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: "2.5rem" }}>⚙️</div>
              <p className="mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                No BOM data available for this item.
              </p>
            </div>
          ) : (
            <ProductionEntrySection
              order_item_id={order_item_id}
              jobId={jobId}
              bomProcesses={bomProcesses}
              orderQty={itemDetail?.order_qty ?? 0}
              itemName={itemDetail?.item_name}
              warehouseOptions={warehouseOptions}
              teamMemberOptions={teamMemberOptions}
              loadingWarehouse={loadingWarehouse}
              loadingTeamMembers={loadingTeamMembers}
              existingEntry={existingEntry}
              saving={saving}
              isStockCheckRequired={isStockCheckRequired}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionEntryModel;
