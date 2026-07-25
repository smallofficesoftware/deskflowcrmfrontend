import React from "react";
import { Step } from "../SalaryProcessTypes";

const STEPS = [
  { id: 1, icon: "📅", label: "Date Range" },
  { id: 2, icon: "💰", label: "Processing" },
];

const StepIndicator = ({ current }: { current: Step }) => (
  <div className="d-flex align-items-center justify-content-center mb-4 px-2">
    {STEPS.map((s, idx) => {
      const done = s.id < current;
      const active = s.id === current;
      const borderColor = done ? "#198754" : active ? "#f58634" : "#dee2e6";
      const bg = done ? "#d1fae5" : active ? "#fff5ec" : "#f8f9fa";
      const color = done ? "#198754" : active ? "#f58634" : "#adb5bd";

      return (
        <React.Fragment key={s.id}>
          <div
            className="d-flex flex-column align-items-center"
            style={{ minWidth: 84 }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                border: `2px solid ${borderColor}`,
                background: bg,
                color,
                fontWeight: 700,
                transition: "all 0.25s",
                boxShadow: active ? "0 0 0 4px rgba(245,134,52,0.15)" : "none",
              }}
            >
              {done ? "✓" : s.icon}
            </div>
            <span
              style={{
                fontSize: "0.68rem",
                marginTop: 4,
                fontWeight: active ? 700 : 500,
                color,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>

          {idx < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                marginBottom: 20,
                background: done ? "#198754" : "#dee2e6",
                transition: "background 0.25s",
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepIndicator;
