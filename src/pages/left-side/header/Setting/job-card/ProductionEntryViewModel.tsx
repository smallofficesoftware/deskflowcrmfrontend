import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { formatSecondsToHms } from "../product/bom-master/bom-process/BomProcessFieldController";
import { fetchProductionEntryDetail } from "./JobCardController";
import { IProductionEntryDetail } from "./JobCardTypes";

interface IProps {
  show: boolean;
  onHide: () => void;
  entryId: number;
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

// Read-only — production entries are never edited in place, each run is a
// distinct, immutable record. This just displays a saved one.
const ProductionEntryViewModel = ({ show, onHide, entryId }: IProps) => {
  const [detail, setDetail] = useState<IProductionEntryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEscapeKey(onHide);

  useEffect(() => {
    if (!show) return;
    setDetail(null);
    fetchProductionEntryDetail(entryId, setDetail, setLoading);
  }, [show, entryId]);

  if (!show) return null;

  const materialTable = (
    rows: IProductionEntryDetail["consumption_items"],
    accentColor: string,
  ) =>
    rows.length === 0 ? (
      <div className="text-muted" style={{ fontSize: "0.78rem" }}>
        None
      </div>
    ) : (
      <table className="table table-sm mb-0" style={{ fontSize: "0.8rem" }}>
        <thead>
          <tr style={{ color: "#6c757d" }}>
            <th>Material</th>
            <th className="text-end">Qty</th>
            <th>Warehouse</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                {r.material_name}
                {r.unit ? ` (${r.unit})` : ""}
              </td>
              <td className="text-end" style={{ color: accentColor, fontWeight: 600 }}>
                {r.qty}
              </td>
              <td>{r.warehouse_name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

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
          width: "min(98vw, 720px)",
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
          <h5
            style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}
          >
            👁 Production Entry {detail ? `#${detail.id}` : ""}
          </h5>
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
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {loading || !detail ? (
            <div>
              <Skeleton height={70} borderRadius={8} className="mb-3" />
              <Skeleton height={60} borderRadius={8} className="mb-2" count={3} />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div
                className="rounded-3 p-3 mb-3"
                style={{ background: "#fff5ec", border: "1.5px solid #f9d5b0" }}
              >
                <div className="row g-3" style={{ fontSize: "0.85rem" }}>
                  <div className="col-md-4">
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      ✅ Finish Good Qty
                    </div>
                    <strong>{detail.produced_qty}</strong>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      📅 Date
                    </div>
                    <strong>{formatDate(detail.entry_date)}</strong>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      👤 Team Member
                    </div>
                    <strong>{detail.team_member_name || "—"}</strong>
                  </div>
                  {(detail.total_actual_time ?? 0) > 0 && (
                    <div className="col-md-4">
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        ⏱ Total Actual Time
                      </div>
                      <strong>{formatSecondsToHms(detail.total_actual_time)}</strong>
                    </div>
                  )}
                  {detail.remark && (
                    <div className="col-12">
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        📝 Remark
                      </div>
                      <span style={{ fontStyle: "italic" }}>{detail.remark}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Per-process breakdown */}
              {(detail.processes ?? []).length === 0 ? (
                <div className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
                  No process-wise data recorded for this entry.
                </div>
              ) : (
                (detail.processes ?? []).map((p) => (
                  <div
                    key={p.process_id}
                    className="rounded-3 mb-2"
                    style={{ border: "1.5px solid #e9ecef" }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "#f8f9fa",
                        padding: "10px 16px",
                        borderBottom: "1.5px solid #e9ecef",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}>
                        ⚙ {p.process_name}
                      </span>
                      {p.actual_time > 0 && (
                        <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "#374151" }}>
                          ⏱ {formatSecondsToHms(p.actual_time)}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      <div className="mb-1" style={{ fontSize: "0.75rem", color: "#b85c1a", fontWeight: 600 }}>
                        🔥 Consumption
                      </div>
                      {materialTable(p.consumption, "#b85c1a")}
                      <div className="mt-3 mb-1" style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: 600 }}>
                        ♻️ Rejection
                      </div>
                      {materialTable(p.rejection, "#b91c1c")}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionEntryViewModel;
