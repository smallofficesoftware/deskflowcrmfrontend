import React from "react";
import { MONTHS, YEAR_OPTIONS, formatMonthYear } from "../SalaryProcessTypes";

interface IProps {
  month: number;
  year: number;
  error: string;
  onMonthChange: (v: number) => void;
  onYearChange: (v: number) => void;
  onNext: () => void;
}

const Step1MonthYear = ({
  month,
  year,
  error,
  onMonthChange,
  onYearChange,
  onNext,
}: IProps) => (
  <div>
    <p className="text-muted mb-3" style={{ fontSize: "0.82rem" }}>
      Select the <strong>month and year</strong> to generate salary for.
    </p>

    <div className="row g-3">
      <div className="col-6">
        <label
          className="form-label fw-semibold"
          style={{ fontSize: "0.82rem" }}
        >
          Month <span className="text-danger">*</span>
        </label>
        <select
          className={`form-select form-select-sm${error ? " is-invalid" : ""}`}
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-6">
        <label
          className="form-label fw-semibold"
          style={{ fontSize: "0.82rem" }}
        >
          Year <span className="text-danger">*</span>
        </label>
        <select
          className={`form-select form-select-sm${error ? " is-invalid" : ""}`}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>

    {error && (
      <div className="text-danger mt-2" style={{ fontSize: "0.8rem" }}>
        ⚠ {error}
      </div>
    )}

    {month && year && !error && (
      <div
        className="mt-3 d-flex align-items-center gap-2 rounded-2 px-3 py-2"
        style={{ background: "#fff5ec", border: "1px solid #f9d5b0" }}
      >
        <span style={{ fontSize: "1.2rem" }}>💰</span>
        <span style={{ fontSize: "0.82rem", color: "#b85c1a" }}>
          Generating salary for <strong>{formatMonthYear(month, year)}</strong>
        </span>
      </div>
    )}

    <div className="d-flex justify-content-end mt-4">
      <button
        className="btn btn-sm text-white"
        style={{
          background: "linear-gradient(135deg,#f58634,#e0732a)",
          minWidth: 150,
        }}
        onClick={onNext}
      >
        Continue →
      </button>
    </div>
  </div>
);

export default Step1MonthYear;
