import React from "react";
import { AppliedFilterChip } from "../../store/report/useCommonFilterStore";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toDate = (v: any): Date | null => {
  if (!v) return null;
  // react-multi-date-picker DateObject exposes toDate(); plain strings/Date also ok
  if (typeof v?.toDate === "function") {
    try {
      return v.toDate();
    } catch {
      return null;
    }
  }
  // A bare "YYYY-MM-DD" string parses as UTC midnight in `new Date(v)`, which
  // then reads back a day early via the local getters below (fmtDay etc.) in
  // any timezone behind UTC. Parse it as a local calendar date instead.
  if (typeof v === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDay = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

// "Month: August | Year: 2026" for a whole calendar month, else a date span.
const periodLabel = (
  range: any[] | null | undefined,
  startDate: any,
  endDate: any,
): string | null => {
  let start: Date | null = null;
  let end: Date | null = null;

  if (Array.isArray(range) && range.length === 2) {
    start = toDate(range[0]);
    end = toDate(range[1]);
  }
  if (!start || !end) {
    start = toDate(startDate);
    end = toDate(endDate);
  }
  if (!start || !end) return null;

  const wholeMonth =
    start.getDate() === 1 &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear() &&
    end.getDate() ===
      new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

  return wholeMonth
    ? `Month: ${MONTH_NAMES[start.getMonth()]} | Year: ${start.getFullYear()}`
    : `${fmtDay(start)} – ${fmtDay(end)}`;
};

interface IProps {
  summary?: AppliedFilterChip[];
  dateRange?: any[] | null;
  startDate?: any;
  endDate?: any;
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 10px",
  borderRadius: "999px",
  background: "#f1f3f5",
  border: "1px solid #e2e6ea",
  fontSize: "12px",
  lineHeight: 1.6,
  color: "#374151",
  whiteSpace: "nowrap",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ≤3 values -> names; >3 -> "N selected" (full list in tooltip)
const chipText = (values: string[]): { text: string; title: string } => {
  const clean = (values || []).filter(Boolean);
  const title = clean.join(", ");
  return clean.length > 3
    ? { text: `${clean.length} selected`, title }
    : { text: title, title };
};

const AppliedFilterBar = ({ summary, dateRange, startDate, endDate }: IProps) => {
  const period = periodLabel(dateRange, startDate, endDate);
  const chips = (summary || []).filter((c) => c?.values?.length);

  if (!period && chips.length === 0) return null;

  return (
    <div
      className="d-flex flex-wrap align-items-center gap-2"
      style={{ margin: "4px 20px 10px", rowGap: "6px" }}
    >
      {period && (
        <span style={{ ...chipStyle, background: "#e7f1ff", borderColor: "#cfe2ff" }}>
          <strong>{period}</strong>
        </span>
      )}
      {chips.map((c) => {
        const { text, title } = chipText(c.values);
        return (
          <span key={c.key} style={chipStyle} title={`${c.label}: ${title}`}>
            <strong>{c.label}:</strong> {text}
          </span>
        );
      })}
    </div>
  );
};

export default AppliedFilterBar;
