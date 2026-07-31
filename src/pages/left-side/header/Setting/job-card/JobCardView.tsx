import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import {
  fetchJobCardDetail,
  printBomDetail,
  saveJobCard,
  updateJobCard,
} from "./JobCardController";
import {
  IBomProcess,
  IContactDetail,
  IItemDetail,
  TabId,
} from "./JobCardTypes";
import ItemDetailSection from "./sections/ItemDetailSection";
import ItemSelectSection from "./sections/ItemSelectSection";
import RequiredMaterialSection from "./sections/RequiredMaterialSection";
import StockAdjustmentModel from "../stock-adjustment/StockAdjustmentModel";
import OrderCreateModal from "../../../../../components/model/OrderCreateModel/OrderCreateModal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface IProps {
  show: boolean;
  onHide: () => void;
  onComplete?: () => void;
  editJobCardId?: number; // provided when opening an existing job card
  initialProductQty?: number; // pre-fills qty field in edit mode
}

// ─── Tab config (3 tabs — production entry is its own modal) ─────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "select", label: "Item Select", icon: "🔍" },
  { id: "details", label: "Details", icon: "📋" },
  { id: "material", label: "Required Material", icon: "🧰" },
];

const JobCardView = ({
  show,
  onHide,
  onComplete,
  editJobCardId,
  initialProductQty,
}: IProps) => {
  const isEditMode = !!editJobCardId;

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<TabId>("select");

  // ── Selections ──
  // (customer/order/order-item option LISTS no longer live here — the
  // searchable dropdowns in ItemSelectSection fetch their own options.
  // We only keep the selected ids, which is all downstream code needs.)
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<number | null>(
    null,
  );
  const [productQty, setProductQty] = useState<string>("");

  // ── Detail + BOM data ──
  const [contactDetail, setContactDetail] = useState<IContactDetail | null>(
    null,
  );
  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [bomProcesses, setBomProcesses] = useState<IBomProcess[]>([]);

  // ── Loading / action states ──
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [jobCardId, setJobCardId] = useState<number | null>(null);

  // ── Modals for Stock Adjustment & Purchase Order ──
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);

  useEscapeKey(onHide);

  // Reset on open
  useEffect(() => {
    if (!show) return;
    setActiveTab("select");
    setContactDetail(null);
    setItemDetail(null);
    setBomProcesses([]);
    setJobCardId(null);

    if (isEditMode) {
      // ── Edit mode: pre-fill qty, fetch details immediately ──
      setProductQty(String(initialProductQty ?? ""));
      setJobCardId(editJobCardId!);
      fetchJobCardDetail(
        editJobCardId!,
        setContactDetail,
        setItemDetail,
        setBomProcesses,
        setLoadingDetails,
      ).then((ok) => {
        if (ok) setActiveTab("details");
      });
    } else {
      // ── Create mode: reset selections ──
      setSelectedCustomer(null);
      setSelectedOrder(null);
      setSelectedOrderItem(null);
      setProductQty("");
    }
  }, [show]);

  // ── Cascade handlers ──

  const handleCustomerChange = (id: number) => {
    setSelectedCustomer(id);
    setSelectedOrder(null);
    setSelectedOrderItem(null);
    setProductQty("");
  };

  const handleOrderChange = (id: number) => {
    setSelectedOrder(id);
    setSelectedOrderItem(null);
    setProductQty("");
  };

  const handleItemChange = (id: number) => setSelectedOrderItem(id);

  // ── Load job card (save first, then fetch details) ──

  const handleLoad = async () => {
    if (
      !selectedOrderItem ||
      !productQty ||
      !selectedCustomer ||
      !selectedOrder
    )
      return;

    const createdId = await saveJobCard(
      selectedOrderItem,
      Number(productQty),
      selectedCustomer,
      selectedOrder,
      setSaving,
    );
    if (!createdId) return;

    setJobCardId(createdId);
    const ok = await fetchJobCardDetail(
      createdId,
      setContactDetail,
      setItemDetail,
      setBomProcesses,
      setLoadingDetails,
    );
    if (ok) setActiveTab("details");
  };

  // ── Edit mode: update qty only ──
  const handleUpdate = async () => {
    if (!jobCardId || !productQty || Number(productQty) <= 0) return;
    const ok = await updateJobCard(jobCardId, Number(productQty), setSaving);
    if (ok) {
      onComplete?.();
      onHide();
    }
  };

  // ── Print BOM ──

  const handlePrintBom = async () => {
    if (!selectedOrderItem && !editJobCardId) return;
    setPrinting(true);
    await printBomDetail(selectedOrderItem ?? editJobCardId!);
    setPrinting(false);
  };

  // ── Shortage actions ──

  const handleAddStock = (_id: number, name: string) =>
    setShowAddStockModal(true);
  const handleGeneratePO = (_id: number, name: string) =>
    setShowPOModal(true);

  // ── Tab accessibility ──

  const isTabEnabled = (id: TabId): boolean => {
    if (id === "select") return true;
    if (id === "details") return !!contactDetail && !!itemDetail;
    if (id === "material") return bomProcesses.length > 0;
    return false;
  };

  if (!show) return null;

  const headerSubtitle = itemDetail
    ? `${contactDetail?.name ?? ""} — ${itemDetail.item_name}`
    : isEditMode
      ? "Loading job card…"
      : "Order Item Job Card";

  return (
    <>
      {/* Backdrop — click fires onHide only when clicking directly on backdrop */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onHide();
        }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1055,
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
          width: "min(98vw, 960px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          background: "#fff",
        }}
      >
        {/* ── Header ── */}
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
          <div style={{ overflow: "hidden" }}>
            <h5
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              {isEditMode ? "✏️ Edit Job Card" : "💼 Job Card"}
            </h5>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.73rem",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {headerSubtitle}
            </span>
          </div>
          {/* ✅ Fix: stopPropagation so click doesn't bubble to backdrop */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            borderBottom: "2px solid #f0ece8",
            background: "#fff",
            overflowX: "auto",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const enabled = isTabEnabled(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (enabled) setActiveTab(tab.id);
                }}
                style={{
                  padding: "11px 18px",
                  border: "none",
                  background: "none",
                  borderBottom: active
                    ? "3px solid #f58634"
                    : "3px solid transparent",
                  color: active ? "#f58634" : enabled ? "#6c757d" : "#ced4da",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.8rem",
                  cursor: enabled ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                  marginBottom: -2,
                }}
              >
                <span className="me-1">{tab.icon}</span>
                {tab.label}
                {!enabled && tab.id !== "select" && (
                  <span
                    className="ms-1"
                    style={{ fontSize: "0.65rem", opacity: 0.6 }}
                  >
                    🔒
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content ── */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {/* ── SELECT TAB ── */}
          {activeTab === "select" && !isEditMode && (
            <ItemSelectSection
              selectedCustomer={selectedCustomer}
              selectedOrder={selectedOrder}
              selectedOrderItem={selectedOrderItem}
              productQty={productQty}
              loadingDetails={saving || loadingDetails}
              onCustomerChange={handleCustomerChange}
              onOrderChange={handleOrderChange}
              onItemChange={handleItemChange}
              onProductQtyChange={setProductQty}
              onLoad={handleLoad}
            />
          )}

          {/* ── SELECT TAB (edit mode) — show job card summary + editable qty ── */}
          {activeTab === "select" && isEditMode && (
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              {loadingDetails ? (
                <Skeleton height={80} borderRadius={8} className="mb-3" />
              ) : (
                <>
                  {/* Summary card */}
                  <div
                    className="rounded-3 p-3 mb-4"
                    style={{
                      background: "#fff5ec",
                      border: "1.5px solid #f9d5b0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "#374151",
                        lineHeight: 1.8,
                      }}
                    >
                      <div>
                        <strong>📦 Item:</strong> {itemDetail?.item_name ?? "—"}
                      </div>
                      <div>
                        <strong>📋 Order:</strong> {itemDetail?.order_no ?? "—"}
                      </div>
                      <div>
                        <strong>👤 Customer:</strong>{" "}
                        {contactDetail?.name ?? "—"}
                      </div>
                      <div>
                        <strong>📊 Order Qty:</strong>{" "}
                        {itemDetail
                          ? `${itemDetail.order_qty} ${itemDetail.unit}`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Editable qty */}
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: "0.82rem" }}
                    >
                      Product Qty <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="form-control form-control-sm"
                      placeholder="Enter production qty…"
                      value={productQty}
                      onChange={(e) => setProductQty(e.target.value)}
                    />
                    {productQty && Number(productQty) <= 0 && (
                      <div
                        className="text-danger mt-1"
                        style={{ fontSize: "0.73rem" }}
                      >
                        Qty must be greater than 0
                      </div>
                    )}
                  </div>

                  {/* Update button */}
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-sm text-white"
                      style={{
                        background:
                          saving || !productQty || Number(productQty) <= 0
                            ? "#adb5bd"
                            : "linear-gradient(135deg,#198754,#15803d)",
                        minWidth: 160,
                        cursor:
                          saving || !productQty || Number(productQty) <= 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                      disabled={
                        saving || !productQty || Number(productQty) <= 0
                      }
                      onClick={handleUpdate}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            style={{ width: 12, height: 12, borderWidth: 2 }}
                          />
                          Updating…
                        </>
                      ) : (
                        "💾 Update Job Card"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── DETAILS TAB ── */}
          {activeTab === "details" && (
            <ItemDetailSection
              contactDetail={contactDetail}
              itemDetail={itemDetail}
              loading={loadingDetails}
              printing={printing}
              onPrintBom={handlePrintBom}
            />
          )}

          {activeTab === "material" && (
            <RequiredMaterialSection
              bomProcesses={bomProcesses}
              loading={loadingDetails}
              onAddStock={handleAddStock}
              onGeneratePO={handleGeneratePO}
            />
          )}
        </div>
      </div>
    </div>

      {showAddStockModal && (
        <StockAdjustmentModel
          show={showAddStockModal}
          onHide={() => setShowAddStockModal(false)}
          flag={1}
          where_action={1}
        />
      )}

      {showPOModal && (
        <OrderCreateModal
          show={showPOModal}
          onHide={() => setShowPOModal(false)}
          handleSubmit={() => setShowPOModal(false)}
          title={"Create Purchase Order"}
          message={"Please Enter Your Purchase Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
          isOrderShowNum={4}
          flag={"quick"}
        />
      )}
    </>
  );
};

export default JobCardView;
