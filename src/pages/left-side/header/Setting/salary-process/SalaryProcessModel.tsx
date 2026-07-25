import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { IMonthYear, runSalaryProcess } from "./SalaryProcessController";
import {
  CURRENT_MONTH,
  CURRENT_YEAR,
  formatMonthYear,
  ProcessStatus,
  Step,
} from "./SalaryProcessTypes";
import Step1MonthYear from "./steps/Step1monthyear";
import Step2Processing from "./steps/Step2Processing";
import StepIndicator from "./steps/StepIndicator";

interface IProps {
  show: boolean;
  onHide: () => void;
  selectedMonth: number | undefined;
  selectedYear: number | undefined;
  onComplete?: () => void;
}

const SalaryProcessModel = ({
  show,
  onHide,
  selectedMonth,
  selectedYear,
  onComplete
}: IProps) => {
  // ── Outer step ──
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 ──
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [monthYearError, setMonthYearError] = useState("");

  // ── Step 2 ──
  const [status, setStatus] = useState<ProcessStatus>("pending");
  const [message, setMessage] = useState("");

  useEscapeKey(onHide);

  // Reset on open
  useEffect(() => {
    if (!show) return;
    setStep(1);
    setMonth(selectedMonth ?? CURRENT_MONTH);
    setYear(selectedYear ?? CURRENT_YEAR);
    setMonthYearError("");
    setStatus("pending");
    setMessage("");
  }, [show]);

  // ── Validation ──
  const validateMonthYear = () => {
    if (!month || !year) {
      setMonthYearError("Both month and year are required.");
      return false;
    }
    setMonthYearError("");
    return true;
  };

  // ── Step 1 → 2 ──
  const handleContinue = () => {
    if (!validateMonthYear()) return;
    setStep(2);
  };

  // ── Step 2: run single processing call ──
  const handleStartProcessing = async () => {
    setStatus("running");
    setMessage("");

    const monthYear: IMonthYear = { month, year };
    const result = await runSalaryProcess(monthYear);

    setStatus(result.success ? "success" : "error");
    setMessage(result.message);

    if (result.success) {
      toast.success(result.message);
      onComplete?.();
    } else {
      toast.error(result.message);
    }
  };

  const running = status === "running";

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1055,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    // onClick={(e) => {
    //   if (e.target === e.currentTarget && !running) onHide();
    // }}
    >
      <div
        style={{
          width: "min(96vw, 540px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#f58634 0%,#e0732a 100%)",
            padding: "16px 20px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h5
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              💰 Generate Salary
            </h5>
            <span
              style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.75rem" }}
            >
              {formatMonthYear(month, year)}
            </span>
          </div>
          <button
            onClick={onHide}
            disabled={running}
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              width: 30,
              height: 30,
              cursor: running ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 20px 8px", overflowY: "auto", flex: 1 }}>
          <StepIndicator current={step} />

          {step === 1 && (
            <Step1MonthYear
              month={month}
              year={year}
              error={monthYearError}
              onMonthChange={(v) => {
                setMonth(v);
                setMonthYearError("");
              }}
              onYearChange={(v) => {
                setYear(v);
                setMonthYearError("");
              }}
              onNext={handleContinue}
            />
          )}

          {step === 2 && (
            <Step2Processing
              status={status}
              message={message}
              month={month}
              year={year}
              onStart={handleStartProcessing}
              onFinish={onHide}
              onBack={() => {
                if (!running) setStep(1);
              }}
            />
          )}
        </div>

        {/* Cancel footer (step 1 only) */}
        {step === 1 && (
          <div
            className="d-flex justify-content-start px-4 py-2"
            style={{
              borderTop: "1px solid #f0ece8",
              background: "#fafafa",
              flexShrink: 0,
            }}
          >
            <button
              className="btn btn-sm"
              style={{
                fontSize: "0.8rem",
                background: "#f1f5f9",
                color: "#475569",
              }}
              onClick={onHide}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryProcessModel;
