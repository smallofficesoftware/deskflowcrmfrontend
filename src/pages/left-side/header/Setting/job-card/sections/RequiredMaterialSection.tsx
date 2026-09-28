import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { PrimeReactProvider } from "primereact/api";
import { OverlayPanel } from "primereact/overlaypanel";
import React, { useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IBomMaterial, IBomProcess } from "../JobCardTypes";
import { diffOf, freeStockOf, pendingOf } from "../materialStock";
import MaterialActionMenu from "./MaterialActionMenu";
import MaterialPipelineSummary from "./MaterialPipelineSummary";

interface IProps {
  bomProcesses: IBomProcess[];
  loading: boolean;
  onAddStock: (materialId: number, materialName: string) => void;
  onGeneratePO: (materialId: number, materialName: string) => void;
  onGenerateSubJobCard: (
    materialId: number,
    materialName: string,
    pendingQty: number,
  ) => void;
}

const shortagesIn = (materials: IBomMaterial[], deductReserved: boolean) =>
  materials.filter((m) => diffOf(m, deductReserved) < 0).length;

// A Reserved / In Production qty; when other job cards are behind it, the
// number is clickable and opens the per-job-card breakdown.
const BreakdownCell = ({
  qty,
  title,
  headers,
  rows,
}: {
  qty: number;
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) => {
  const panel = useRef<OverlayPanel>(null);
  if (!rows.length) return <>{qty.toFixed(2)}</>;
  return (
    <>
      <button
        type="button"
        className="btn btn-link p-0 d-inline-flex align-items-center gap-1"
        style={{ fontSize: "0.78rem", textDecoration: "none", color: "#e0732a", fontWeight: 600 }}
        onClick={(e) => panel.current?.toggle(e)}
        title={`${rows.length} job card${rows.length > 1 ? "s" : ""}`}
      >
        {qty.toFixed(2)}
        <i className="pi pi-info-circle" style={{ fontSize: "0.68rem" }} />
      </button>
      {/* OverlayPanel reads PrimeReact context (hideOverlaysOnDocumentScrolling
          etc.); the job card modal isn't under a PrimeReactProvider, so give
          the panel its own - without it the click crashes. zIndex.overlay is
          bumped above .modal1's z-index:1000 (modal.css) so the popup - a
          document.body portal, same stacking context as the modal - paints
          on top of it instead of behind. */}
      <PrimeReactProvider value={{ zIndex: { overlay: 2000 } }}>
      <OverlayPanel ref={panel} style={{ minWidth: 260 }}>
        <div className="fw-bold mb-2" style={{ fontSize: "0.78rem", color: "#374151" }}>
          {title}
        </div>
        <table className="table table-sm mb-0" style={{ fontSize: "0.75rem" }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </OverlayPanel>
      </PrimeReactProvider>
    </>
  );
};

// Small clickable "N job cards" badge for a process header; opens a popup
// listing which other open job cards are at this process and their status.
const JobCardsBadge = ({
  jobCards,
}: {
  jobCards: { job_id: number; status_name: string; status_color: string }[];
}) => {
  const panel = useRef<OverlayPanel>(null);
  if (!jobCards.length) return null;
  return (
    <>
      <button
        type="button"
        className="btn btn-link p-0 d-inline-flex align-items-center gap-1 badge"
        style={{
          background: "#e0f2fe",
          color: "#0369a1",
          fontSize: "0.68rem",
          textDecoration: "none",
        }}
        onClick={(e) => panel.current?.toggle(e)}
        title="Job cards at this process"
      >
        {jobCards.length} job card{jobCards.length > 1 ? "s" : ""}
        <i className="pi pi-info-circle" style={{ fontSize: "0.65rem" }} />
      </button>
      <PrimeReactProvider value={{ zIndex: { overlay: 2000 } }}>
        <OverlayPanel ref={panel} style={{ minWidth: 220 }}>
          <div className="fw-bold mb-2" style={{ fontSize: "0.78rem", color: "#374151" }}>
            Job cards at this process
          </div>
          <table className="table table-sm mb-0" style={{ fontSize: "0.75rem" }}>
            <thead>
              <tr>
                <th>Job Card</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobCards.map((jc) => (
                <tr key={jc.job_id}>
                  <td>#{jc.job_id}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: jc.status_color || "#e9ecef",
                        color: "#fff",
                        fontSize: "0.7rem",
                      }}
                    >
                      {jc.status_name || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OverlayPanel>
      </PrimeReactProvider>
    </>
  );
};

// ─── Material Table ───────────────────────────────────────────────────────────

const MaterialTable = ({
  materials,
  deductReserved,
  consumedLabel,
  onAddStock,
  onGeneratePO,
  onGenerateSubJobCard,
}: {
  materials: IBomMaterial[];
  deductReserved: boolean;
  // "Consumed" on the consumption tab, "Rejected" on the rejection tab.
  consumedLabel: string;
  onAddStock: (id: number, name: string) => void;
  onGeneratePO: (id: number, name: string) => void;
  onGenerateSubJobCard: (id: number, name: string, pendingQty: number) => void;
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
            {deductReserved && (
              <>
                <th style={{ width: 100 }}>Reserved</th>
                <th style={{ width: 100 }}>In Production</th>
                <th style={{ width: 100 }}>Free Stock</th>
              </>
            )}
            <th style={{ width: 100 }}>Required</th>
            <th style={{ width: 100 }}>{consumedLabel}</th>
            <th style={{ width: 100 }}>Pending</th>
            <th style={{ width: 100 }}>Diff</th>
            <th style={{ width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, idx) => {
            const diff = diffOf(m, deductReserved);
            const shortage = diff < 0;
            return (
              <tr key={m.material_id}>
                <td className="text-muted">{idx + 1}</td>
                <td className="fw-semibold">{m.material_name}</td>
                <td>{m.unit}</td>
                <td>{m.available_qty.toFixed(2)}</td>
                {deductReserved && (
                  <>
                    <td>
                      <BreakdownCell
                        qty={m.reserved_qty || 0}
                        title="Reserved by open job cards"
                        headers={["Job Card", "Item", "Process", "Pending"]}
                        rows={(m.reserved_by || []).map((r) => [
                          `#${r.job_id}`,
                          r.item_name || "-",
                          r.process_name || "-",
                          r.pending_qty.toFixed(2),
                        ])}
                      />
                    </td>
                    <td>
                      <BreakdownCell
                        qty={m.incoming_qty || 0}
                        title="Being produced by open job cards"
                        headers={["Job Card", "Qty", "Done", "Pending"]}
                        rows={(m.incoming_by || []).map((r) => [
                          `#${r.job_id}${r.is_sub_job_card ? " (sub job)" : ""}`,
                          r.production_qty,
                          r.produced_qty,
                          r.pending_qty.toFixed(2),
                        ])}
                      />
                    </td>
                    <td>{freeStockOf(m, true).toFixed(2)}</td>
                  </>
                )}
                <td>{m.required_qty.toFixed(2)}</td>
                <td>{(m.consumed_qty || 0).toFixed(2)}</td>
                <td>{pendingOf(m).toFixed(2)}</td>
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
                    {diff.toFixed(2)}
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
                    onGenerateSubJobCard={
                      m.has_own_bom
                        ? () =>
                            onGenerateSubJobCard(
                              m.material_id,
                              m.material_name,
                              pendingOf(m),
                            )
                        : undefined
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
  deductReserved,
  onAddStock,
  onGeneratePO,
  onGenerateSubJobCard,
}: {
  process: IBomProcess;
  defaultOpen: boolean;
  deductReserved: boolean;
  onAddStock: (id: number, name: string) => void;
  onGeneratePO: (id: number, name: string) => void;
  onGenerateSubJobCard: (id: number, name: string, pendingQty: number) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [activeSection, setActiveSection] = useState<
    "consumption" | "rejection"
  >("consumption");

  const shortageCount =
    shortagesIn(process.consumption, deductReserved) +
    shortagesIn(process.rejection, deductReserved);
  const jobCards = process.job_cards || [];

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
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
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
            <i className="pi pi-cog" style={{ fontSize: "0.75rem" }} />
          </span>
          <span
            style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}
          >
            {process.process_name}
          </span>
          <JobCardsBadge jobCards={jobCards} />
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
          <i className={`pi ${open ? "pi-chevron-up" : "pi-chevron-down"}`} style={{ fontSize: "0.7rem" }} />
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
                  <i
                    className={`pi ${sec === "consumption" ? "pi-arrow-down" : "pi-replay"} me-1`}
                    style={{ fontSize: "0.7rem" }}
                  />
                  {sec === "consumption" ? "Consumption" : "Rejection"}
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
            deductReserved={deductReserved}
            consumedLabel={activeSection === "consumption" ? "Consumed" : "Rejected"}
            onAddStock={onAddStock}
            onGeneratePO={onGeneratePO}
            onGenerateSubJobCard={onGenerateSubJobCard}
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
  onGenerateSubJobCard,
}: IProps) => {
  const [deductReserved, setDeductReserved] = useState(false);

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
        <i className="pi pi-inbox" style={{ fontSize: "2.2rem", color: "#ced4da" }} />
        <p className="mt-2">No BOM data found for this item.</p>
      </div>
    );
  }

  const totalShortages = bomProcesses.reduce(
    (acc, p) =>
      acc +
      shortagesIn(p.consumption, deductReserved) +
      shortagesIn(p.rejection, deductReserved),
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
        <label
          className="d-flex align-items-center gap-2 mb-0 ms-auto me-3"
          style={{ fontSize: "0.8rem", color: "#374151", cursor: "pointer" }}
          title="Other job cards not fully produced yet: deduct the material they still need, add what they are still producing of it"
        >
          <input
            type="checkbox"
            className="form-check-input mt-0"
            checked={deductReserved}
            onChange={(e) => setDeductReserved(e.target.checked)}
          />
          Consider other open job cards (reserved &amp; in production)
        </label>
        {totalShortages > 0 ? (
          <span
            className="badge"
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "0.75rem",
            }}
          >
            <i className="pi pi-exclamation-triangle me-1" style={{ fontSize: "0.7rem" }} />
            {totalShortages} material shortage{totalShortages > 1 ? "s" : ""}
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
            <i className="pi pi-check-circle me-1" style={{ fontSize: "0.7rem" }} />
            All materials sufficient
          </span>
        )}
      </div>

      <MaterialPipelineSummary bomProcesses={bomProcesses} />

      {/* Process cards */}
      {bomProcesses.map((p, idx) => (
        <ProcessCard
          key={p.process_id}
          process={p}
          defaultOpen={idx === 0}
          deductReserved={deductReserved}
          onAddStock={onAddStock}
          onGeneratePO={onGeneratePO}
          onGenerateSubJobCard={onGenerateSubJobCard}
        />
      ))}
    </div>
  );
};

export default RequiredMaterialSection;
