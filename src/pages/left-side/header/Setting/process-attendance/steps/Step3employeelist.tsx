import React from "react";
import { formatDate, ISubStep, SubStepStatus } from "../Processattendancetypes";

interface IProps {
  subSteps: ISubStep[];
  running: boolean;
  fromDate: string;
  toDate: string;
  onStart: () => void;
  onFinish: () => void;
  onBack: () => void;
}

// ─── Sub-step status config ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SubStepStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  pending: { icon: "◌", color: "#adb5bd", bg: "#f8f9fa", border: "#e9ecef" },
  running: { icon: "⏳", color: "#f58634", bg: "#fff5ec", border: "#f9d5b0" },
  success: { icon: "✅", color: "#198754", bg: "#f0fdf4", border: "#86efac" },
  error: { icon: "❌", color: "#dc3545", bg: "#fff5f5", border: "#fca5a5" },
};

// ─── Single sub-step row ──────────────────────────────────────────────────────

const SubStepRow = ({ step, index }: { step: ISubStep; index: number }) => {
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
      {/* Step number bubble */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: cfg.color + "1a", // 10% opacity
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

      {/* Label */}
      <div className="flex-grow-1">
        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#374151" }}>
          {step.label}
        </div>
        {step.message && (
          <div style={{ fontSize: "0.72rem", color: cfg.color, marginTop: 1 }}>
            {step.message}
          </div>
        )}
      </div>

      {/* Status icon / spinner */}
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

// ─── Progress bar ─────────────────────────────────────────────────────────────

const SubStepProgress = ({ subSteps }: { subSteps: ISubStep[] }) => {
  const done = subSteps.filter(
    (s) => s.status === "success" || s.status === "error",
  ).length;
  const pct = Math.round((done / subSteps.length) * 100);
  const hasError = subSteps.some((s) => s.status === "error");
  const allDone = done === subSteps.length;

  return (
    <div className="mb-3">
      <div
        className="d-flex justify-content-between mb-1"
        style={{ fontSize: "0.75rem" }}
      >
        <span className="text-muted">
          {done} of {subSteps.length} steps done
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
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Step3Processing = ({
  subSteps,
  running,
  fromDate,
  toDate,
  onStart,
  onFinish,
  onBack,
}: IProps) => {
  const allDone = subSteps.every(
    (s) => s.status === "success" || s.status === "error",
  );
  const hasError = subSteps.some((s) => s.status === "error");
  const notStarted = subSteps.every((s) => s.status === "pending");
  const successCount = subSteps.filter((s) => s.status === "success").length;

  return (
    <div>
      {/* Date range summary pill */}
      <div
        className="d-flex align-items-center gap-2 rounded-2 px-3 py-2 mb-3"
        style={{ background: "#fff5ec", border: "1px solid #f9d5b0" }}
      >
        <span style={{ fontSize: "1rem" }}>📅</span>
        <span style={{ fontSize: "0.8rem", color: "#b85c1a" }}>
          <strong>{formatDate(fromDate)}</strong> —{" "}
          <strong>{formatDate(toDate)}</strong>
        </span>
      </div>

      {/* Progress bar (shown once started) */}
      {!notStarted && <SubStepProgress subSteps={subSteps} />}

      {/* Sub-step rows */}
      <div>
        {subSteps.map((s, idx) => (
          <SubStepRow key={s.id} step={s} index={idx} />
        ))}
      </div>

      {/* Final summary */}
      {allDone && (
        <div
          className="d-flex align-items-center gap-2 mt-3 px-3 py-2 rounded-2"
          style={{
            background: hasError ? "#fff7ed" : "#f0fdf4",
            border: `1.5px solid ${hasError ? "#fed7aa" : "#86efac"}`,
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>{hasError ? "⚠️" : "🎉"}</span>
          <div>
            <div
              className="fw-bold"
              style={{
                fontSize: "0.85rem",
                color: hasError ? "#92400e" : "#15803d",
              }}
            >
              {hasError
                ? `${successCount} of ${subSteps.length} steps completed`
                : "All steps completed successfully!"}
            </div>
            <div className="text-muted" style={{ fontSize: "0.73rem" }}>
              {formatDate(fromDate)} – {formatDate(toDate)}
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="d-flex justify-content-between mt-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onBack}
          disabled={running}
        >
          ← Back
        </button>

        <div className="d-flex gap-2">
          {!allDone && (
            <button
              className="btn btn-sm text-white"
              style={{
                background: running
                  ? "#adb5bd"
                  : "linear-gradient(135deg,#198754,#15803d)",
                minWidth: 130,
                cursor: running ? "not-allowed" : "pointer",
              }}
              onClick={onStart}
              disabled={running}
            >
              {running ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    style={{ width: 12, height: 12, borderWidth: 2 }}
                  />
                  Running…
                </>
              ) : (
                "▶ Start Processing"
              )}
            </button>
          )}

          {allDone && (
            <button
              className="btn btn-sm text-white"
              style={{
                background: "linear-gradient(135deg,#198754,#15803d)",
                minWidth: 100,
              }}
              onClick={onFinish}
            >
              ✓ Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3Processing;
