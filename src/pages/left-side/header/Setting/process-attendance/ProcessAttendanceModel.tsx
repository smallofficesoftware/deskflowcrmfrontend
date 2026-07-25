import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import {
  fetchMisPunchList,
  IDateRange,
  IMisPunchEntry,
  runProcessSubStep,
} from "./ProcessAttendanceController";
import {
  FIRST_OF_MONTH,
  formatDate,
  INITIAL_SUB_STEPS,
  ISO_TODAY,
  ISubStep,
  sameMonth,
  Step,
} from "./Processattendancetypes";
import Step1DateRange from "./steps/Step1daterange";
import Step2MisPunch from "./steps/Step2mispunch";
import Step3Processing from "./steps/Step3employeelist";
import StepIndicator from "./steps/StepIndicator";

interface IProps {
  show: boolean;
  onHide: () => void;
  selectedMonth: number | undefined;
  selectedYear: number | undefined;
  onComplete?: () => void;
}

const getMonthDateRange = (month: number, year: number) => {
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);

  return {
    firstDate,
    lastDate,
  };
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const ProcessAttendanceModel = ({
  show,
  onHide,
  selectedMonth,
  selectedYear,
  onComplete,
}: IProps) => {
  // ── Outer step ──
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 ──
  const [fromDate, setFromDate] = useState(FIRST_OF_MONTH);
  const [toDate, setToDate] = useState(ISO_TODAY);
  const [dateError, setDateError] = useState("");

  // ── Step 2 ──
  const [misPunchList, setMisPunchList] = useState<IMisPunchEntry[]>([]);
  const [misPunchLoading, setMisPunchLoading] = useState(false);

  // ── Step 3 — sub-steps ──
  const [subSteps, setSubSteps] = useState<ISubStep[]>(INITIAL_SUB_STEPS);
  const [running, setRunning] = useState(false);

  useEscapeKey(onHide);

  useEffect(() => {
    if (!selectedMonth || !selectedYear) return;

    const { firstDate, lastDate } = getMonthDateRange(
      selectedMonth,
      selectedYear,
    );

    setFromDate(formatDateForInput(firstDate));
    setToDate(formatDateForInput(lastDate));
  }, [selectedMonth, selectedYear, show]);

  // Reset on open
  useEffect(() => {
    if (!show) return;

    setStep(1);
    setDateError("");
    setMisPunchList([]);
    setSubSteps(
      INITIAL_SUB_STEPS.map(
        (s): ISubStep => ({ ...s, status: "pending", message: undefined }),
      ),
    );
    setRunning(false);
  }, [show, selectedMonth, selectedYear]);

  // ── Validation ──
  const validateDates = () => {
    if (!fromDate || !toDate) {
      setDateError("Both dates are required.");
      return false;
    }
    if (!sameMonth(fromDate, toDate)) {
      setDateError("Range must be within the same month.");
      return false;
    }
    if (fromDate > toDate) {
      setDateError("From date cannot be after To date.");
      return false;
    }
    setDateError("");
    return true;
  };

  // ── Step 1 → 2 ──
  const handleCheckMisPunch = async () => {
    if (!validateDates()) return;
    const range: IDateRange = { from_date: fromDate, to_date: toDate };
    await fetchMisPunchList(range, setMisPunchList, setMisPunchLoading);
    setStep(2);
  };

  // ── Step 2 → 3 ──
  const handleGoToProcessing = () => setStep(3);

  // ── Step 3: Run sub-steps sequentially ──
  const handleStartProcessing = async () => {
    setRunning(true);
    const range: IDateRange = { from_date: fromDate, to_date: toDate };

    // Reset all sub-steps to pending before starting
    const fresh: ISubStep[] = subSteps.map(
      (s): ISubStep => ({ ...s, status: "pending", message: undefined }),
    );
    setSubSteps(fresh);

    const updated = [...fresh];

    for (let i = 0; i < updated.length; i++) {
      // Mark current as running
      updated[i] = { ...updated[i], status: "running" };
      setSubSteps([...updated]);

      const result = await runProcessSubStep(updated[i].endpoint, range);

      updated[i] = {
        ...updated[i],
        status: result.success ? "success" : "error",
        message: result.message,
      };
      setSubSteps([...updated]);

      // Stop on error — don't proceed to next sub-step
      if (!result.success) break;
    }

    setRunning(false);

    const allSuccess = updated.every((s) => s.status === "success");
    if (allSuccess) {
      toast.success("Attendance processed successfully!");
      onComplete?.();
    } else {
      const failed = updated.find((s) => s.status === "error");
      toast.error(failed?.message);
      /* toast.error(
        `Processing stopped at "${failed?.label}": ${failed?.message}`,
      ); */
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal1"
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
      /*  onClick={(e) => {
      if (e.target === e.currentTarget) onHide();
    }} */
    >
      <div
        style={{
          width: "min(96vw, 580px)",
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
              ⚙️ Process Attendance
            </h5>
            <span
              style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.75rem" }}
            >
              {formatDate(fromDate)} — {formatDate(toDate)}
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
            <Step1DateRange
              fromDate={fromDate}
              toDate={toDate}
              dateError={dateError}
              loading={misPunchLoading}
              onFromChange={(v) => {
                setFromDate(v);
                setDateError("");
              }}
              onToChange={(v) => {
                setToDate(v);
                setDateError("");
              }}
              onNext={handleCheckMisPunch}
            />
          )}

          {step === 2 && (
            <Step2MisPunch
              misPunchList={misPunchList}
              loading={misPunchLoading}
              fromDate={fromDate}
              toDate={toDate}
              onNext={handleGoToProcessing}
              onBack={() => setStep(1)}
              handleCheckMisPunch={handleCheckMisPunch}
            />
          )}

          {step === 3 && (
            <Step3Processing
              subSteps={subSteps}
              running={running}
              fromDate={fromDate}
              toDate={toDate}
              onStart={handleStartProcessing}
              onFinish={onHide}
              onBack={() => {
                if (!running) setStep(2);
              }}
            />
          )}
        </div>

        {/* Cancel footer (steps 1 & 2 only) */}
        {step < 3 && (
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

export default ProcessAttendanceModel;
