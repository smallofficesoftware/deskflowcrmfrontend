import React, { useRef, useEffect } from "react";
import { IProcessEmployee } from "../ProcessAttendanceController";
import { formatDate, ProcessLogEntry } from "../Processattendancetypes";

interface IProps {
  employeeList: IProcessEmployee[];
  processingIdx: number;
  processing: boolean;
  processLog: ProcessLogEntry[];
  fromDate: string;
  toDate: string;
  onFinish: () => void;
}

const STATUS_ICON: Record<IProcessEmployee["status"], string> = {
  success: "✅",
  error: "❌",
  processing: "⏳",
  pending: "⏸",
};

const STATUS_COLOR: Record<IProcessEmployee["status"], string> = {
  success: "#198754",
  error: "#dc3545",
  processing: "#f58634",
  pending: "#adb5bd",
};

const Step4Processing = ({
  employeeList,
  processingIdx,
  processing,
  processLog,
  fromDate,
  toDate,
  onFinish,
}: IProps) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [processLog]);

  const successCount = employeeList.filter(
    (e) => e.status === "success",
  ).length;
  const errorCount = employeeList.filter((e) => e.status === "error").length;
  const doneCount = successCount + errorCount;
  const progress =
    employeeList.length > 0
      ? Math.round((doneCount / employeeList.length) * 100)
      : 0;
  const allDone =
    !processing && doneCount === employeeList.length && employeeList.length > 0;

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="d-flex justify-content-between mb-1"
          style={{ fontSize: "0.78rem" }}
        >
          <span className="text-muted">
            {processing
              ? `Processing ${processingIdx + 1} of ${employeeList.length}…`
              : allDone
                ? "All done!"
                : "Stopped"}
          </span>
          <span className="fw-semibold" style={{ color: "#f58634" }}>
            {progress}%
          </span>
        </div>
        <div
          className="progress"
          style={{ height: 8, borderRadius: 6, background: "#e9ecef" }}
        >
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
              background: allDone
                ? "#198754"
                : "linear-gradient(90deg,#f58634,#e0732a)",
              transition: "width 0.4s ease",
              borderRadius: 6,
            }}
          />
        </div>
        <div className="d-flex gap-3 mt-1" style={{ fontSize: "0.75rem" }}>
          <span style={{ color: "#198754" }}>✓ {successCount} success</span>
          <span style={{ color: "#dc3545" }}>✗ {errorCount} failed</span>
          <span style={{ color: "#6c757d" }}>
            ◌ {employeeList.length - doneCount} pending
          </span>
        </div>
      </div>

      {/* Employee status rows */}
      <div style={{ maxHeight: 200, overflowY: "auto" }} className="mb-3">
        {employeeList.map((emp, idx) => {
          const isActive = processingIdx === idx && processing;
          return (
            <div
              key={emp.employee_id}
              className="d-flex align-items-center gap-2 px-2 py-1 mb-1 rounded-2"
              style={{
                background: isActive ? "#fff5ec" : "#fafafa",
                border: `1px solid ${isActive ? "#f9d5b0" : "#e9ecef"}`,
                fontSize: "0.8rem",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>
                {STATUS_ICON[emp.status]}
              </span>
              <span className="flex-grow-1 fw-semibold">
                {emp.employee_name}
              </span>
              {emp.message && (
                <span
                  title={emp.message}
                  style={{
                    color: STATUS_COLOR[emp.status],
                    fontSize: "0.72rem",
                    maxWidth: 160,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.message}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Log console */}
      {processLog.length > 0 && (
        <div
          style={{
            background: "#1e1e1e",
            borderRadius: 8,
            padding: "10px 14px",
            maxHeight: 120,
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.73rem",
          }}
        >
          {processLog.map((log, i) => (
            <div
              key={i}
              style={{
                color: log.status === "success" ? "#4ade80" : "#f87171",
              }}
            >
              [{log.status === "success" ? "OK" : "ERR"}] {log.name} —{" "}
              {log.message}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* Final summary */}
      {allDone && (
        <>
          <div
            className="d-flex align-items-center gap-2 mt-3 px-3 py-2 rounded-2"
            style={{
              background: errorCount === 0 ? "#f0fdf4" : "#fff7ed",
              border: `1.5px solid ${errorCount === 0 ? "#86efac" : "#fed7aa"}`,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>
              {errorCount === 0 ? "🎉" : "⚠️"}
            </span>
            <div>
              <div
                className="fw-bold"
                style={{
                  fontSize: "0.85rem",
                  color: errorCount === 0 ? "#15803d" : "#92400e",
                }}
              >
                {errorCount === 0
                  ? "All employees processed successfully!"
                  : `${successCount} processed, ${errorCount} failed.`}
              </div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                {formatDate(fromDate)} – {formatDate(toDate)}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
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
          </div>
        </>
      )}
    </div>
  );
};

export default Step4Processing;
