import React from "react";
import { IStockEntryStep, StockEntryStepStatus } from "../JobCardTypes";

interface IProps {
  steps: IStockEntryStep[];
  running: boolean;
  canRun: boolean;
  blockedReason?: string;
  onRun: () => void;
}

const STATUS_CONFIG: Record<
  StockEntryStepStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  pending: { icon: "◌", color: "#adb5bd", bg: "#f8f9fa", border: "#e9ecef" },
  running: { icon: "⏳", color: "#f58634", bg: "#fff5ec", border: "#f9d5b0" },
  success: { icon: "✅", color: "#198754", bg: "#f0fdf4", border: "#86efac" },
  error: { icon: "❌", color: "#dc3545", bg: "#fff5f5", border: "#fca5a5" },
};

const StepRow = ({ step, index }: { step: IStockEntryStep; index: number }) => {
  const cfg = STATUS_CONFIG[step.status];
  const isRunning = step.status === "running";

  return (
    <div
      className="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-2"
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        transition: "all 0.25s",
        boxShadow: isRunning ? "0 2px 10px rgba(245,134,52,0.15)" : "none",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: cfg.color + "1a",
          border: `1.5px solid ${cfg.color}`,
          fontSize: "0.72rem",
          fontWeight: 700,
          color: cfg.color,
        }}
      >
        {step.status === "success"
          ? "✓"
          : step.status === "error"
            ? "✗"
            : index + 1}
      </div>

      <div className="flex-grow-1">
        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#374151" }}>
          {step.label}
        </div>
        {step.message && (
          <div style={{ fontSize: "0.72rem", color: cfg.color, marginTop: 1 }}>
            {step.message}
            {step.processedQty != null ? ` · Qty: ${step.processedQty}` : ""}
          </div>
        )}
      </div>

      {isRunning ? (
        <span
          className="spinner-border spinner-border-sm"
          style={{ color: "#f58634", width: 16, height: 16, borderWidth: 2 }}
        />
      ) : (
        <span style={{ fontSize: "1rem" }}>{cfg.icon}</span>
      )}
    </div>
  );
};

const StockEntryProgress = ({
  steps,
  running,
  canRun,
  blockedReason,
  onRun,
}: IProps) => {
  const done = steps.filter(
    (s) => s.status === "success" || s.status === "error",
  ).length;
  const pct = Math.round((done / steps.length) * 100);
  const hasError = steps.some((s) => s.status === "error");
  const allDone = done === steps.length;
  const successCount = steps.filter((s) => s.status === "success").length;

  return (
    <div
      className="rounded-3 p-3 mt-4"
      style={{ background: "#fafafa", border: "1.5px solid #e9ecef" }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span
          className="fw-bold"
          style={{ fontSize: "0.85rem", color: "#374151" }}
        >
          📦 Stock Entry Process
        </span>
        {!running && !allDone && (
          <button
            className="btn btn-sm text-white"
            style={{
              background: canRun
                ? "linear-gradient(135deg,#198754,#15803d)"
                : "#adb5bd",
              minWidth: 170,
              fontSize: "0.8rem",
              cursor: canRun ? "pointer" : "not-allowed",
            }}
            onClick={onRun}
            disabled={!canRun}
          >
            ▶ Run Stock Entry Process
          </button>
        )}
      </div>

      {!canRun && !running && blockedReason && (
        <div className="text-danger mb-3" style={{ fontSize: "0.76rem" }}>
          ⚠ {blockedReason}
        </div>
      )}

      {/* Progress bar (once started) */}
      {done > 0 && (
        <div className="mb-3">
          <div
            className="d-flex justify-content-between mb-1"
            style={{ fontSize: "0.73rem" }}
          >
            <span className="text-muted">
              {done} of {steps.length} steps done
            </span>
            <span
              style={{
                fontWeight: 600,
                color: allDone && !hasError ? "#198754" : "#f58634",
              }}
            >
              {pct}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 6,
              background: "#e9ecef",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 6,
                width: `${pct}%`,
                background:
                  allDone && !hasError
                    ? "#198754"
                    : hasError
                      ? "linear-gradient(90deg,#f58634,#dc3545)"
                      : "linear-gradient(90deg,#f58634,#e0732a)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Step rows */}
      {steps.map((s, idx) => (
        <StepRow key={s.key} step={s} index={idx} />
      ))}

      {/* Final summary */}
      {allDone && (
        <div
          className="d-flex align-items-center gap-2 mt-2 px-3 py-2 rounded-2"
          style={{
            background: hasError ? "#fff7ed" : "#f0fdf4",
            border: `1.5px solid ${hasError ? "#fed7aa" : "#86efac"}`,
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>{hasError ? "⚠️" : "🎉"}</span>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: hasError ? "#92400e" : "#15803d",
            }}
          >
            {hasError
              ? `${successCount} of ${steps.length} steps completed`
              : "All stock entries completed successfully!"}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockEntryProgress;
