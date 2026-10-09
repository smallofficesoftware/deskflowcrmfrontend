import "primeicons/primeicons.css";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { ENABLE_CREATE_ALL_SUB_JOB_CARDS } from "../../../../../helpers/AppConstants";
import {
  fetchJobCardDetail,
  saveJobCard,
  createAllSubJobCards,
  IPlannedSubJobCard,
  previewSubJobCards,
  SubJobCardQtyBasis,
  updateJobCard,
} from "./JobCardController";
import {
  IBomProcess,
  IContactDetail,
  IItemDetail,
  JOB_CARD_TYPE,
  JobCardMode,
  TabId,
} from "./JobCardTypes";
import ItemDetailSection from "./sections/ItemDetailSection";
import ItemSelectSection from "./sections/ItemSelectSection";
import RequiredMaterialSection from "./sections/RequiredMaterialSection";
import SubJobCardTree from "./sections/SubJobCardTree";


// ─── Props ────────────────────────────────────────────────────────────────────

interface IProps {
  show: boolean;
  onHide: () => void;
  onComplete?: () => void;
  editJobCardId?: number; // provided when opening an existing job card
  initialProductQty?: number; // pre-fills qty field in edit mode
  onAddStock?: (materialId: number, materialName: string) => void;
  onGeneratePO?: (materialId: number, materialName: string) => void;
  onGenerateSubJobCard?: (
    materialId: number,
    materialName: string,
    parentJobCardId: number,
    pendingQty: number,
  ) => void;
}

// ─── Tab config (2 tabs — production entry is its own modal) ─────────────────
// Details and Required Material share one tab: the job card summary sits on
// top of the material list, so "which order" and "is stock enough" are
// visible together. `icon` is a PrimeIcons class.

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "select", label: "Item Select", icon: "pi-search" },
  { id: "details", label: "Details & Material", icon: "pi-list-check" },
];

const JobCardView = ({
  show,
  onHide,
  onComplete,
  editJobCardId,
  initialProductQty,
  onAddStock: onAddStockProp,
  onGeneratePO: onGeneratePOProp,
  onGenerateSubJobCard: onGenerateSubJobCardProp,
}: IProps) => {
  const isEditMode = !!editJobCardId;

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<TabId>("select");

  // ── Selections ──
  // (customer/order/order-item option LISTS no longer live here — the
  // searchable dropdowns in ItemSelectSection fetch their own options.
  // We only keep the selected ids, which is all downstream code needs.)
  const [mode, setMode] = useState<JobCardMode>("order");
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<number | null>(
    null,
  );
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [productQty, setProductQty] = useState<string>("");

  // ── Detail + BOM data ──
  const [contactDetail, setContactDetail] = useState<IContactDetail | null>(
    null,
  );
  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [bomProcesses, setBomProcesses] = useState<IBomProcess[]>([]);

  // ── Loading / action states ──
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [printing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [jobCardId, setJobCardId] = useState<number | null>(null);
  // Only ever true when the build enables the feature (see AppConstants).
  const [createAllSubs, setCreateAllSubs] = useState(ENABLE_CREATE_ALL_SUB_JOB_CARDS);
  const [confirmPlan, setConfirmPlan] = useState<IPlannedSubJobCard[] | null>(null);
  const [qtyBasis, setQtyBasis] = useState<SubJobCardQtyBasis>("available_minus_reserved");

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
      setMode("order");
      setSelectedCustomer(null);
      setSelectedOrder(null);
      setSelectedOrderItem(null);
      setSelectedProduct(null);
      setProductQty("");
    }
  }, [show]);

  // ── Cascade handlers ──

  const handleModeChange = (next: JobCardMode) => {
    setMode(next);
    setSelectedCustomer(null);
    setSelectedOrder(null);
    setSelectedOrderItem(null);
    setSelectedProduct(null);
    setProductQty("");
  };

  const handleCustomerChange = (id: number) => {
    setSelectedCustomer(id || null);
    setSelectedOrder(null);
    setSelectedOrderItem(null);
    if (mode === "order") setProductQty("");
  };

  const handleOrderChange = (id: number) => {
    setSelectedOrder(id || null);
    setSelectedOrderItem(null);
    setProductQty("");
  };

  const handleItemChange = (id: number) => setSelectedOrderItem(id || null);

  const handleProductChange = (id: number) => setSelectedProduct(id || null);

  // ── Load job card (save first, then fetch details) ──

  // Asks for confirmation first when sub job cards would also be created,
  // listing them; with none to create (or the box unticked) it just creates.
  const handleLoad = async () => {
    if (!productQty || Number(productQty) <= 0) return;

    // itemId = cart_item id (order mode) or product id (product/customer mode)
    const itemId = mode === "order" ? selectedOrderItem : selectedProduct;
    if (!itemId) return;
    if (mode === "order" && (!selectedCustomer || !selectedOrder)) return;
    if (mode === "customer" && !selectedCustomer) return;

    if (createAllSubs) {
      const planned = await loadPreview(qtyBasis);
      if (planned === null) return;
      if (planned.length > 0) {
        setConfirmPlan(planned);
        return;
      }
    }
    await createJobCard();
  };

  // Sub job cards this job card would create, for a qty basis (nothing is
  // created); also used when the basis is changed inside the confirmation.
  const loadPreview = async (basis: SubJobCardQtyBasis) => {
    const itemId = mode === "order" ? selectedOrderItem : selectedProduct;
    if (!itemId) return null;
    setSaving(true);
    const planned = await previewSubJobCards(
      JOB_CARD_TYPE[mode],
      itemId,
      Number(productQty),
      basis,
    );
    setSaving(false);
    return planned;
  };

  const handleBasisChange = async (basis: SubJobCardQtyBasis) => {
    setQtyBasis(basis);
    const planned = await loadPreview(basis);
    if (planned) setConfirmPlan(planned);
  };

  const createJobCard = async () => {
    const itemId = mode === "order" ? selectedOrderItem : selectedProduct;
    if (!itemId) return;

    const createdId = await saveJobCard(
      JOB_CARD_TYPE[mode],
      itemId,
      Number(productQty),
      mode === "product" ? null : selectedCustomer,
      mode === "order" ? selectedOrder : null,
      setSaving,
    );
    if (!createdId) return;

    // Make every sub job card under it too (same chain as "Generate Sub Job
    // Card", for all levels at once), before the list and details load.
    if (createAllSubs) {
      setSaving(true);
      await createAllSubJobCards(createdId, qtyBasis);
      setSaving(false);
    }

    // Job card row now exists — refresh the list behind the modal.
    onComplete?.();

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

  const handlePrintBom = () => {
    // Opens the printable "Required Material" view for this job card, which
    // fetches the BOM detail and auto-prints (same route the list view uses).
    const jcId = jobCardId ?? editJobCardId ?? null;
    if (!jcId) {
      toast.warning("Save the job card first.");
      return;
    }
    window.open(`/RequiredMaterialPdfView/${jcId}`, "_blank");
  };

  // ── Shortage actions ──

  const handleAddStock = (id: number, name: string) => {
    if (onAddStockProp) {
      onHide();
      onAddStockProp(id, name);
    }
  };
  const handleGeneratePO = (id: number, name: string) => {
    if (onGeneratePOProp) {
      onHide();
      onGeneratePOProp(id, name);
    }
  };
  const handleGenerateSubJobCard = (
    id: number,
    name: string,
    pendingQty: number,
  ) => {
    const parentId = jobCardId ?? editJobCardId ?? null;
    if (onGenerateSubJobCardProp && parentId) {
      // Parent closes this view itself once the sub job card is created, so
      // a failed create leaves the user where they are.
      onGenerateSubJobCardProp(id, name, parentId, pendingQty);
    }
  };

  // ── Tab accessibility ──

  const isTabEnabled = (id: TabId): boolean => {
    if (id === "select") return true;
    if (id === "details") return !!contactDetail && !!itemDetail;
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
              <i
                className={`pi ${isEditMode ? "pi-pencil" : "pi-briefcase"} me-2`}
                style={{ fontSize: "0.95rem" }}
              />
              {isEditMode ? "Edit Job Card" : "Job Card"}
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
            {itemDetail?.parent_job_card && (
              <span
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.7rem",
                  display: "block",
                }}
              >
                ↳ Sub job of #{itemDetail.parent_job_card.id} —{" "}
                {itemDetail.parent_job_card.item_name}
              </span>
            )}
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
                <i className={`pi ${tab.icon} me-2`} style={{ fontSize: "0.8rem" }} />
                {tab.label}
                {!enabled && tab.id !== "select" && (
                  <i
                    className="pi pi-lock ms-2"
                    style={{ fontSize: "0.65rem", opacity: 0.6 }}
                  />
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
              mode={mode}
              selectedCustomer={selectedCustomer}
              selectedOrder={selectedOrder}
              selectedOrderItem={selectedOrderItem}
              selectedProduct={selectedProduct}
              productQty={productQty}
              loadingDetails={saving || loadingDetails}
              onModeChange={handleModeChange}
              onCustomerChange={handleCustomerChange}
              onOrderChange={handleOrderChange}
              onItemChange={handleItemChange}
              onProductChange={handleProductChange}
              onProductQtyChange={setProductQty}
              onLoad={handleLoad}
            />
          )}
          {confirmPlan && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1200,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setConfirmPlan(null)}
            >
              <div
                className="bg-white rounded-3 p-4"
                style={{ width: 720, maxWidth: "94vw", maxHeight: "85vh", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h6 className="mb-2">Create job card with sub job cards?</h6>
                <div className="mb-2" style={{ fontSize: "0.8rem" }}>
                  <div className="fw-semibold mb-1">Sub job card qty is based on</div>
                  {(
                    [
                      ["available_minus_reserved", "Available - reserved by other open job cards (default)"],
                      ["available", "Available stock"],
                      ["required", "Required qty (ignore stock)"],
                    ] as [SubJobCardQtyBasis, string][]
                  ).map(([value, label]) => (
                    <label key={value} className="d-flex align-items-center gap-2 mb-1" style={{ cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="subJobQtyBasis"
                        checked={qtyBasis === value}
                        disabled={saving}
                        onChange={() => handleBasisChange(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mb-2" style={{ fontSize: "0.82rem" }}>
                  This creates 1 job card and {confirmPlan.filter((p) => !p.covered).length} sub job card
                  {confirmPlan.filter((p) => !p.covered).length === 1 ? "" : "s"}:
                </p>
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      <th>Product</th>
                      <th className="text-end">Required</th>
                      <th className="text-end">Available</th>
                      <th className="text-end">Reserved</th>
                      <th className="text-end">To make</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmPlan.map((p, i) => {
                      const u = p.unit ? ` ${p.unit}` : "";
                      const n = (v: number) => Number(v.toFixed(2));
                      return (
                        <tr key={i} style={p.covered ? { color: "#6b7280" } : undefined}>
                          <td style={{ paddingLeft: 8 + (p.level - 1) * 14 }}>{p.product_name}</td>
                          <td className="text-end">{n(p.required_qty)}{u}</td>
                          <td className="text-end">{n(p.available_qty)}</td>
                          <td className="text-end">{n(p.reserved_qty)}</td>
                          <td className="text-end fw-semibold">
                            {p.covered ? (
                              <span style={{ color: "#15803d" }}>covered by stock</span>
                            ) : (
                              `${n(p.qty)}${u}`
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmPlan(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => {
                      setConfirmPlan(null);
                      createJobCard();
                    }}
                  >
                    Create all
                  </button>
                </div>
              </div>
            </div>
          )}
          {ENABLE_CREATE_ALL_SUB_JOB_CARDS && activeTab === "select" && !isEditMode && (
            <label
              className="d-flex align-items-center gap-2 mt-3"
              style={{ fontSize: "0.82rem", maxWidth: 560, margin: "0 auto" }}
            >
              <input
                type="checkbox"
                checked={createAllSubs}
                onChange={(e) => setCreateAllSubs(e.target.checked)}
              />
              Also create all sub job cards (every level of the BOM)
            </label>
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
                        <i className="pi pi-box me-2 text-muted" style={{ fontSize: "0.75rem" }} />
                        <strong>Item:</strong> {itemDetail?.item_name ?? "—"}
                      </div>
                      <div>
                        <i className="pi pi-file me-2 text-muted" style={{ fontSize: "0.75rem" }} />
                        <strong>Order:</strong> {itemDetail?.order_no ?? "—"}
                      </div>
                      <div>
                        <i className="pi pi-user me-2 text-muted" style={{ fontSize: "0.75rem" }} />
                        <strong>Customer:</strong>{" "}
                        {contactDetail?.name ?? "—"}
                      </div>
                      <div>
                        <i className="pi pi-chart-bar me-2 text-muted" style={{ fontSize: "0.75rem" }} />
                        <strong>Order Qty:</strong>{" "}
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
                        <>
                          <i className="pi pi-save me-1" style={{ fontSize: "0.78rem" }} />
                          Update Job Card
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── DETAILS & MATERIAL TAB ── */}
          {activeTab === "details" && (
            <>
              <ItemDetailSection
                contactDetail={contactDetail}
                itemDetail={itemDetail}
                loading={loadingDetails}
                printing={printing}
                onPrintBom={handlePrintBom}
              />
              {(jobCardId ?? editJobCardId) ? (
                <SubJobCardTree
                  jobCardId={(jobCardId ?? editJobCardId) as number}
                  refreshKey={bomProcesses}
                />
              ) : null}
              <div
                className="d-flex align-items-center gap-2 mb-2"
                style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em" }}
              >
                <i className="pi pi-sitemap" style={{ fontSize: "0.75rem" }} />
                REQUIRED MATERIAL
              </div>
              <RequiredMaterialSection
                bomProcesses={bomProcesses}
                loading={loadingDetails}
                onAddStock={handleAddStock}
                onGeneratePO={handleGeneratePO}
                onGenerateSubJobCard={handleGenerateSubJobCard}
              />
            </>
          )}
        </div>
      </div>
    </div>

    </>
  );
};

export default JobCardView;
