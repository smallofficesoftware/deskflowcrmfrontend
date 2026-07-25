import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import {
  deleteProductionEntry,
  fetchProductionEntryList,
} from "./JobCardController";
import { IProductionEntryListItem } from "./JobCardTypes";
import ProductionEntryModel from "./Productionentrymodel";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { toast } from "react-toastify";

interface IProps {
  show: boolean;
  onHide: () => void;
  jobId: number;
  itemName?: string;
  order_item_id: number;
  orderNo?: string;
  isStockCheckRequired: boolean;
}

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ProductionEntryListModel = ({
  show,
  onHide,
  jobId,
  itemName,
  orderNo,
  isStockCheckRequired,
  order_item_id,
}: IProps) => {
  const [entries, setEntries] = useState<IProductionEntryListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Add / Edit form modal
  const [showForm, setShowForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canView = useCheckUserPermission(
    PAGE_ID.PRODUCTION,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.PRODUCTION,
    PERMISSION_TYPE.ADD,
  );

  useEscapeKey(onHide);

  const loadList = () => {
    fetchProductionEntryList(jobId, setEntries, setLoading);
  };

  useEffect(() => {
    if (!show) return;
    setEntries([]);
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, jobId]);

  const handleAdd = () => {
    if (canAdd) {
      setEditingEntryId(null);
      setShowForm(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleEdit = (entry: IProductionEntryListItem) => {
    /*  setEditingEntryId(entry.id);
    setShowForm(true); */
  };

  // 1. Opens the custom modal
  const handleDeleteClick = (e: React.MouseEvent, entryId: number) => {
    e.stopPropagation();
    setDeleteEntryId(entryId);
  };

  // 2. Executes the deletion after confirmation
  const confirmDelete = async () => {
    if (!deleteEntryId) return;

    setIsDeleting(true);
    const success = await deleteProductionEntry(deleteEntryId);
    setIsDeleting(false);

    if (success) {
      setDeleteEntryId(null);
      loadList(); // Refresh list after successful delete
    }
  };

  const handleFormSaved = () => {
    loadList(); // refresh the list behind the form once it closes
  };

  if (!show) return null;

  return (
    <>
      <div
        onClick={onHide}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1060,
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
            width: "min(96vw, 640px)",
            maxHeight: "88vh",
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
            <div style={{ overflow: "hidden" }}>
              <h5
                style={{
                  margin: 0,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                }}
              >
                📋 Production Entries
              </h5>
              {(itemName || orderNo) && (
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
                  {itemName}
                  {orderNo ? ` — ${orderNo}` : ""}
                </span>
              )}
            </div>
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

          {/* + Add Production Entry */}
          <div
            className="px-3 pt-3 pb-2 d-flex justify-content-end"
            style={{ flexShrink: 0 }}
          >
            <button
              className="btn btn-sm text-white"
              style={{
                background: "linear-gradient(135deg,#198754,#15803d)",
                minWidth: 180,
                fontSize: "0.82rem",
              }}
              onClick={handleAdd}
            >
              + Add Production Entry
            </button>
          </div>

          {/* Scrollable list */}
          <div style={{ padding: "0 20px 20px", overflowY: "auto", flex: 1 }}>
            {canView ? (
              loading ? (
                <div>
                  <Skeleton
                    height={54}
                    borderRadius={8}
                    className="mb-2"
                    count={4}
                  />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div style={{ fontSize: "2.4rem" }}>📭</div>
                  <p className="mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                    No production entries yet for this job card.
                  </p>
                  <p className="mb-0" style={{ fontSize: "0.76rem" }}>
                    Click "+ Add Production Entry" above to record one.
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleEdit(entry)}
                    className="w-100 text-start rounded-3 mb-2 p-3"
                    style={{
                      background: "#fafafa",
                      border: "1.5px solid #e9ecef",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fff5ec";
                      e.currentTarget.style.borderColor = "#f9d5b0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fafafa";
                      e.currentTarget.style.borderColor = "#e9ecef";
                    }}
                  >
                    {/* 1. Header Row: ID & Qty & Delete */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span
                        className="fw-bold"
                        style={{ fontSize: "0.95rem", color: "#f58634" }}
                      >
                        #{entry.id}
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge"
                          style={{
                            background: "#d1fae5",
                            color: "#15803d",
                            fontSize: "0.75rem",
                          }}
                        >
                          ✅ Qty: {entry.produced_qty}
                        </span>
                        <div
                          role="button"
                          onClick={(e) => handleDeleteClick(e, entry.id)}
                          style={{
                            padding: "3px 6px",
                            borderRadius: "4px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Delete Production Entry"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fecaca")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fee2e2")
                          }
                        >
                          🗑️
                        </div>
                      </div>
                    </div>

                    {/* 2. Info Row: Date & Team Member */}
                    <div
                      className="d-flex flex-wrap gap-4 mb-2 text-muted"
                      style={{ fontSize: "0.8rem" }}
                    >
                      <span>
                        📅 <strong>Date:</strong> {formatDate(entry.entry_date)}
                      </span>
                      {entry.team_member_id && (
                        <span>
                          {/* Note: This displays the ID. If you want the name, you'll need to join the user table in your backend list fetch API */}
                          👤 <strong>Team Member:</strong>{" "}
                          {(entry as any).team_member_name ||
                            entry.team_member_id}
                        </span>
                      )}
                    </div>

                    {/* 3. Badges Row: Consumption & Rejection */}
                    {/* <div className="d-flex gap-2 mb-2">
                    <span
                      className="badge"
                      style={{
                        background: "#fff5ec",
                        color: "#b85c1a",
                        fontSize: "0.68rem",
                      }}
                    >
                      📤 {entry.consumption_count} consumption
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        fontSize: "0.68rem",
                      }}
                    >
                      ♻️ {entry.rejection_count} rejection
                    </span>
                  </div> */}

                    {/* 4. Footer Row: Remark */}
                    {entry.remark && (
                      <div
                        className="text-muted mt-2 pt-2"
                        style={{
                          fontSize: "0.78rem",
                          borderTop: "1px dashed #e9ecef",
                        }}
                      >
                        <span className="fw-semibold">📝 Remark:</span>{" "}
                        <span style={{ fontStyle: "italic" }}>
                          "{entry.remark}"
                        </span>
                      </div>
                    )}
                  </button>
                ))
              )
            ) : (
              <p className="text-danger p-1">
                {DEFAULT_MESSAGE_ERROR_PERMISSION}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <ProductionEntryModel
          show={showForm}
          onHide={() => setShowForm(false)}
          jobId={jobId}
          order_item_id={order_item_id}
          entryId={editingEntryId}
          isStockCheckRequired={isStockCheckRequired}
          onSaved={handleFormSaved}
        />
      )}

      {deleteEntryId && (
        <div
          onClick={() => !isDeleting && setDeleteEntryId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1080, // Very high z-index to sit above everything else
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
              width: "min(90vw, 420px)",
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
              borderTop: "6px solid #f58634", // Red accent line
            }}
          >
            <h5 className="mb-2 fw-bold" style={{ color: "#374151" }}>
              Confirm Deletion
            </h5>
            <p className="text-muted mb-4" style={{ fontSize: "0.88rem" }}>
              Are you sure you want to delete this production entry? This will
              reverse all finished goods, consumption, and rejection stock
              adjustments. <strong>This action cannot be undone.</strong>
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-light border"
                onClick={() => setDeleteEntryId(null)}
                disabled={isDeleting}
                style={{ minWidth: "90px" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-danger text-white d-flex align-items-center justify-content-center"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  minWidth: "120px",
                  backgroundColor: "#f58634",
                  border: "#f58634",
                }}
              >
                {isDeleting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      style={{ width: 12, height: 12, borderWidth: 2 }}
                    />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductionEntryListModel;
