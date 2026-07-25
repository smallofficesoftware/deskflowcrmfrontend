// ─── Outer Steps (modal wizard) ───────────────────────────────────────────────

export type Step = 1 | 2 | 3;

// ─── Inner Sub-steps (inside Step 3 processing) ───────────────────────────────

export type SubStepStatus = "pending" | "running" | "success" | "error";

export interface ISubStep {
  id: number; // 1-4
  label: string; // display name
  endpoint: string; // API endpoint
  status: SubStepStatus;
  message?: string;
}

export const INITIAL_SUB_STEPS: ISubStep[] = [
  {
    id: 1,
    label: "Initializing",
    endpoint: "attendance/initializing",
    status: "pending",
  },
  {
    id: 2,
    label: "Compensation Adjustment",
    endpoint: "attendance/compensation-calc",
    status: "pending",
  },
  {
    id: 3,
    label: "Attendance Update",
    endpoint: "attendance/attendance-d-up",
    status: "pending",
  },
  // {
  //   id: 4,
  //   label: "Process 4",
  //   endpoint: "attendance/process4",
  //   status: "pending",
  // },
];

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const today = new Date();

export const ISO_TODAY = today.toISOString().slice(0, 10);

export const FIRST_OF_MONTH = `${today.getFullYear()}-${String(
  today.getMonth() + 1,
).padStart(2, "0")}-01`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const sameMonth = (a: string, b: string) =>
  a.slice(0, 7) === b.slice(0, 7);
