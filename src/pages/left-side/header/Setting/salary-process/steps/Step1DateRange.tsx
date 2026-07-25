import React from "react";
import { ISO_TODAY, formatDate, sameMonth } from "../SalaryProcessTypes";

interface IProps {
  fromDate: string;
  toDate: string;
  dateError: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onNext: () => void;
}

const Step1DateRange = ({
  fromDate,
  toDate,
  dateError,
  onFromChange,
  onToChange,
  onNext,
}: IProps) => (
  <div>
    <p className="text-muted mb-3" style={{ fontSize: "0.82rem" }}>
      Select a date range within the <strong>same month</strong> to generate
      salary.
    </p>

    <div className="row g-3">
      <div className="col-6">
        <label
          className="form-label fw-semibold"
          style={{ fontSize: "0.82rem" }}
        >
          From Date <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          className={`form-control form-control-sm${dateError ? " is-invalid" : ""}`}
          value={fromDate}
          max={ISO_TODAY}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className="col-6">
        <label
          className="form-label fw-semibold"
          style={{ fontSize: "0.82rem" }}
        >
          To Date <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          className={`form-control form-control-sm${dateError ? " is-invalid" : ""}`}
          value={toDate}
          max={ISO_TODAY}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    </div>

    {dateError && (
      <div className="text-danger mt-2" style={{ fontSize: "0.8rem" }}>
        ⚠ {dateError}
      </div>
    )}

    {fromDate && toDate && !dateError && sameMonth(fromDate, toDate) && (
      <div
        className="mt-3 d-flex align-items-center gap-2 rounded-2 px-3 py-2"
        style={{ background: "#fff5ec", border: "1px solid #f9d5b0" }}
      >
        <span style={{ fontSize: "1.2rem" }}>💰</span>
        <span style={{ fontSize: "0.82rem", color: "#b85c1a" }}>
          Generating salary for <strong>{formatDate(fromDate)}</strong> to{" "}
          <strong>{formatDate(toDate)}</strong>
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

export default Step1DateRange;
