// ─── Outer Steps (modal wizard) ───────────────────────────────────────────────

export type Step = 1 | 2;

// ─── Processing status ────────────────────────────────────────────────────────

export type ProcessStatus = "pending" | "running" | "success" | "error";

// ─── Month / Year Helpers ──────────────────────────────────────────────────────

const today = new Date();

export const CURRENT_MONTH = today.getMonth() + 1; // 1-12
export const CURRENT_YEAR = today.getFullYear();

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const monthLabel = (month: number) =>
  MONTHS.find((m) => m.value === month)?.label || "";

// Last 5 years up to current year, most recent first
export const YEAR_OPTIONS = Array.from(
  { length: 5 },
  (_, i) => CURRENT_YEAR - i,
);

export const formatMonthYear = (month: number, year: number) =>
  `${monthLabel(month)} ${year}`;
