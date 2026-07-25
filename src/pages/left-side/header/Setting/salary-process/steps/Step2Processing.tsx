import React from "react";
import { ProcessStatus, formatMonthYear } from "../SalaryProcessTypes";

interface IProps {
  status: ProcessStatus;
  message: string;
  month: number;
  year: number;
  onStart: () => void;
  onFinish: () => void;
  onBack: () => void;
}

const STATUS_CONFIG: Record<
  ProcessStatus,
  { icon: string; color: string; bg: string; border: string; label: string }
> = {
  pending: {
    icon: "💰",
    color: "#f58634",
    bg: "#fff5ec",
    border: "#f9d5b0",
    label: "Ready to generate salary",
  },
  running: {
    icon: "⏳",
    color: "#f58634",
    bg: "#fff5ec",
    border: "#f9d5b0",
    label: "Generating salary…",
  },
  success: {
    icon: "🎉",
    color: "#198754",
    bg: "#f0fdf4",
    border: "#86efac",
    label: "Salary generated successfully!",
  },
  error: {
    icon: "⚠️",
    color: "#dc3545",
    bg: "#fff5f5",
    border: "#fca5a5",
    label: "Salary generation failed",
  },
};

const Step2Processing = ({
  status,
  message,
  month,
  year,
  onStart,
  onFinish,
  onBack,
}: IProps) => {
  const cfg = STATUS_CONFIG[status];
  const running = status === "running";
  const done = status === "success" || status === "error";

  return (
    <div>
      {/* Month/Year pill */}
      <div
        className="d-flex align-items-center gap-2 rounded-2 px-3 py-2 mb-3"
        style={{ background: "#fff5ec", border: "1px solid #f9d5b0" }}
      >
        <span style={{ fontSize: "1rem" }}>📅</span>
        <span style={{ fontSize: "0.8rem", color: "#b85c1a" }}>
          <strong>{formatMonthYear(month, year)}</strong>
        </span>
      </div>

      {/* Status card */}
      <div
        className="d-flex flex-column align-items-center justify-content-center py-5 rounded-3"
        style={{
          background: cfg.bg,
          border: `1.5px ${status === "pending" ? "dashed" : "solid"} ${cfg.border}`,
          transition: "all 0.3s",
        }}
      >
        {running ? (
          <span
            className="spinner-border mb-3"
            style={{ color: cfg.color, width: 42, height: 42, borderWidth: 3 }}
          />
        ) : (
          <span style={{ fontSize: "2.6rem", marginBottom: 10 }}>
            {cfg.icon}
          </span>
        )}

        <p
          className="fw-bold mb-1"
          style={{ fontSize: "0.95rem", color: cfg.color }}
        >
          {cfg.label}
        </p>

        {message && (
          <p
            className="text-muted mb-0"
            style={{ fontSize: "0.78rem", maxWidth: 320, textAlign: "center" }}
          >
            {message}
          </p>
        )}
      </div>

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
          {!done && (
            <button
              className="btn btn-sm text-white"
              style={{
                background: running
                  ? "#adb5bd"
                  : "linear-gradient(135deg,#198754,#15803d)",
                minWidth: 150,
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
                  Processing…
                </>
              ) : (
                "▶ Start Processing"
              )}
            </button>
          )}

          {status === "error" && (
            <button
              className="btn btn-sm text-white"
              style={{
                background: "linear-gradient(135deg,#f58634,#e0732a)",
                minWidth: 100,
              }}
              onClick={onStart}
            >
              ↻ Retry
            </button>
          )}

          {status === "success" && (
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

export default Step2Processing;
