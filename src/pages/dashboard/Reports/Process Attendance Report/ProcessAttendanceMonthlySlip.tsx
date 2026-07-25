import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../../../../services/axiosInstance";
import { useCompanyStore } from "../../../../store/company/useCompanyStore";

/* ----------------------------- Types ----------------------------- */

type DayStatus = "P" | "A" | "WO" | "HD" | "H" | "-";

interface PunchSegment {
  in?: string;
  out?: string;
}

interface DailyAttendanceRow {
  day: string; // "01"
  weekday: string; // "Sat"
  status: DayStatus;
  /**
   * Variable-length: an employee with 2 check-in/check-out entries will
   * have punches.length === 2, an employee with 4 entries will have
   * punches.length === 4. The slip renders exactly as many IN/OUT row
   * pairs as the longest day in that employee's month.
   */
  punches: PunchSegment[];
  actualWorkHrs?: string;
  officialWorkHrs?: string;
  otOs?: string;
  late?: string;
  early?: string;
}

interface AttendanceSummary {
  ecode: string;
  name: string;
  present: number;
  absent: number;
  halfDay: number;
  weekOff: number;
  holiday: number;
  lateDays: number;
  earlyDays: number;
  workHrs: string;
  officeHrs: string;
  ot: string;
  addOt?: string;
  leave: number;
  month: string;
  dateOfJoining: string;
}

interface AttendanceMonthlySlipProps {
  companyLabel?: string;
  reportSubTitle?: string;
  reportDateTime?: string;
  printedBy?: string;
  pageNo?: string;
  summary: AttendanceSummary;
  days: DailyAttendanceRow[];
}

/* ------------------------- Date/time helpers ------------------------- */

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** "Mar-2025" from numeric month (1-12) + 4-digit year, per the route params */
function formatMonthYear(month: number, year: number): string {
  const safeMonth = MONTH_NAMES[month - 1] ?? "";
  return safeMonth ? `${safeMonth}-${year}` : `${month}-${year}`;
}

/** "15-06-2026 01:27 pm" - current date/time at the moment the slip is generated */
function formatCurrentDateTime(date: Date = new Date()): string {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${day}-${month}-${year} ${pad2(hours)}:${minutes} ${ampm}`;
}

/* ----------------------------- Styling ----------------------------- */

const COLOR_BORDER = "#000";
const COLOR_TEXT = "#212529";
const COLOR_ORANGE = "#bf7529";
const COLOR_BLUE = "#2175c1";
const COLOR_GRAY = "#6c757d";

const cellLabelStyle: React.CSSProperties = {
  textAlign: "right",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "4px 8px",
  border: `1px solid ${COLOR_BORDER}`,
  background: "#fff",
  position: "sticky",
  left: 0,
};

const cellValueStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "4px 6px",
  border: `1px solid ${COLOR_BORDER}`,
  minWidth: "46px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: 600,
  color: COLOR_TEXT,
  gap: "8px",
};

const PUNCH_ORDINAL_LABELS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
];

function punchRowLabel(index: number, kind: "IN" | "OUT"): string {
  const ordinal = PUNCH_ORDINAL_LABELS[index] ?? `${index + 1}th`;
  return `${ordinal} ${kind}`;
}

/* ---------------------- Presentational component ---------------------- */
/* Renders a single employee's slip. Stays dumb/prop-driven - summary and
   days are now REQUIRED props (no static/sample fallback). The route
   container below is responsible for supplying real data. */

export const ProcessAttendanceMonthlySlip: React.FC<
  AttendanceMonthlySlipProps
> = ({
  companyLabel = "HRMS",
  reportSubTitle = "Monthly Perfomance Report",
  reportDateTime = formatCurrentDateTime(),
  printedBy = "",
  pageNo = "",
  summary,
  days,
}) => {
  // Some employees punch in/out 2x a day, some 4x+. Render exactly as many
  // IN/OUT row pairs as the longest day for THIS employee needs.
  const maxPunchCount = useMemo(
    () => Math.max(1, ...days.map((d) => d.punches?.length ?? 0)),
    [days],
  );

  return (
    <div
      style={{
        color: COLOR_TEXT,
        fontSize: "13px",
        border: `1px solid ${COLOR_BORDER}`,
        padding: "14px 18px",
        background: "#fff",
        maxWidth: "100%",
      }}
    >
      {/* CSS specifically injected to fix the print layout */}
      <style>{`
                @media print {
                    /* Remove scroll wrapper to allow full print */
                    .print-wrapper {
                        overflow-x: visible !important;
                    }
                    /* Remove sticky positioning and min-widths to fit paper */
                    .print-cell {
                        position: static !important;
                        min-width: 0 !important;
                        padding: 2px 3px !important;
                        font-size: 10px !important; 
                    }
                    /* Set paper preference to landscape automatically if supported by browser */
                    /* @page {
                        size: landscape;
                    } */
                }
            `}</style>

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "15px",
          marginBottom: "2px",
        }}
      >
        Attendance Report {reportDateTime}
      </div>
      <div
        style={{
          textAlign: "center",
          fontWeight: 600,
          fontSize: "13px",
          marginBottom: "10px",
        }}
      >
        Printed By : {printedBy}
      </div>

      {/* Company / Date / Page */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 700,
          marginBottom: "10px",
        }}
      >
        <div>
          <div>{companyLabel}</div>
          <div>{reportSubTitle}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>Date : {reportDateTime}</div>
          <div>Page : {pageNo}</div>
        </div>
      </div>

      {/* ECode / Name / Present / Absent / Half Day / W.Off / Holiday  +  Department row */}
      <div style={{ border: `1px solid ${COLOR_BORDER}`, marginBottom: "8px" }}>
        <div style={headerRow}>
          <span>ECode {summary.ecode}</span>
          <span>Name: {summary.name}</span>
          <span>Present: {summary.present}</span>
          <span>Absent: {summary.absent}</span>
          <span>Half Day: {summary.halfDay}</span>
          <span>W. Off: {summary.weekOff}</span>
          <span>Holiday: {summary.holiday}</span>
        </div>
        <div style={{ ...headerRow, borderTop: `1px solid ${COLOR_BORDER}` }}>
          {/* <span>Department : {summary.department}</span> */}
          {/* <span>Designation : {summary.designation}</span> */}
          <span>Late Days : {summary.lateDays}</span>
          <span>Early Days : {summary.earlyDays}</span>
          {/* <span>Sandwich Applied: {summary.sandwichApplied}</span> */}
          <span>W.Hrs: {summary.workHrs}</span>
          <span>Off.Hrs: {summary.officeHrs}</span>
          <span>OT: {summary.ot}</span>
          {/* <span>Add. OT: {summary.addOt}</span> */}
        </div>
      </div>

      {/* Leave / Month / Date of Joining */}
      <div
        style={{ border: `1px solid ${COLOR_BORDER}`, marginBottom: "10px" }}
      >
        <div style={headerRow}>
          <span>Leave {summary.leave}</span>
          <span>Month : {summary.month}</span>
          <span>Date of Joining : {summary.dateOfJoining}</span>
        </div>
      </div>

      {/* Day-wise grid with added "print-wrapper" class */}
      <div className="print-wrapper" style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: "12px",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  ...cellLabelStyle,
                  textAlign: "center",
                  minWidth: "120px",
                }}
                className="print-cell"
              >
                Days
              </th>
              {days.map((d) => (
                <th
                  key={d.day}
                  style={{ ...cellValueStyle, fontWeight: 700 }}
                  className="print-cell"
                >
                  <div>{d.day}</div>
                  <div>{d.weekday}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellLabelStyle} className="print-cell">
                Day Status
              </td>
              {days.map((d) => (
                <td
                  key={d.day}
                  style={{ ...cellValueStyle, fontWeight: 600 }}
                  className="print-cell"
                >
                  {d.status}
                </td>
              ))}
            </tr>

            {/* Dynamic IN/OUT row pairs - count adapts per employee based on
                their max punches in a single day (2 entries = 1 pair,
                4 entries = 2 pairs, etc.) */}
            {Array.from({ length: maxPunchCount }).map((_, punchIndex) => (
              <React.Fragment key={`punch-${punchIndex}`}>
                <tr>
                  <td style={cellLabelStyle} className="print-cell">
                    {punchRowLabel(punchIndex, "IN")}
                  </td>
                  {days.map((d) => (
                    <td
                      key={d.day}
                      style={{ ...cellValueStyle, color: COLOR_ORANGE }}
                      className="print-cell"
                    >
                      {d.punches?.[punchIndex]?.in ?? ""}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={cellLabelStyle} className="print-cell">
                    {punchRowLabel(punchIndex, "OUT")}
                  </td>
                  {days.map((d) => (
                    <td
                      key={d.day}
                      style={{ ...cellValueStyle, color: COLOR_BLUE }}
                      className="print-cell"
                    >
                      {d.punches?.[punchIndex]?.out ?? ""}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}

            <tr>
              <td style={cellLabelStyle} className="print-cell">
                Actual Work Hrs.
              </td>
              {days.map((d) => (
                <td
                  key={d.day}
                  style={{ ...cellValueStyle, color: COLOR_ORANGE }}
                  className="print-cell"
                >
                  {d.actualWorkHrs ?? ""}
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellLabelStyle} className="print-cell">
                Official Work Hrs
              </td>
              {days.map((d) => (
                <td
                  key={d.day}
                  style={{ ...cellValueStyle, color: COLOR_BLUE }}
                  className="print-cell"
                >
                  {d.officialWorkHrs ?? ""}
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellLabelStyle} className="print-cell">
                OT / OS
              </td>
              {days.map((d) => (
                <td
                  key={d.day}
                  style={{ ...cellValueStyle, color: COLOR_GRAY }}
                  className="print-cell"
                >
                  {d.otOs ?? ""}
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellLabelStyle} className="print-cell">
                Late
              </td>
              {days.map((d) => (
                <td
                  key={d.day}
                  style={{ ...cellValueStyle, color: COLOR_GRAY }}
                  className="print-cell"
                >
                  {d.late ?? ""}
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellLabelStyle} className="print-cell">
                Early
              </td>
              {days.map((d) => (
                <td
                  key={d.day}
                  style={{ ...cellValueStyle, color: COLOR_GRAY }}
                  className="print-cell"
                >
                  {d.early ?? ""}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================
 * ROUTE / API INTEGRATION
 * ============================================================
 * Route shape (react-router-dom, as you confirmed):
 *   <Route path="/attendance/slip/:employeeIds/:month/:year" element={<AttendanceMonthlySlipPage />} />
 *   e.g. /attendance/slip/101,102,103/3/2025
 *
 * ASSUMPTIONS BELOW (you said you'll build the attendance API to match,
 * and will drop in the real employee-detail route later):
 *   - fetchAttendanceDetail() hits one endpoint for ALL employee ids at
 *     once and returns { daysWise, monthlyCount } both keyed by employee id.
 *   - fetchEmployeeDetail() is called once per employee id.
 * If your real responses differ, you only need to touch the two fetch
 * functions + their map* adapters - nothing in the render logic changes.
 * ============================================================ */

interface PunchApiSegment {
  in?: string;
  out?: string;
}

interface DailyAttendanceApiRow {
  day: string;
  weekday: string;
  status: DayStatus;
  punches?: PunchApiSegment[];
  actualWorkHrs?: string;
  officialWorkHrs?: string;
  otOs?: string;
  late?: string;
  early?: string;
}

interface MonthlyCountApiRow {
  present: number;
  absent: number;
  halfDay: number;
  weekOff: number;
  holiday: number;
  lateDays: number;
  earlyDays: number;
  sandwichApplied: number;
  workHrs: string;
  officeHrs: string;
  ot: string;
  addOt?: string;
  leave: number;
}

interface AttendanceDetailApiResponse {
  daysWise: Record<string, DailyAttendanceApiRow[]>;
  monthlyCount: Record<string, MonthlyCountApiRow>;
}

interface EmployeeDetailApiResponse {
  ecode: string;
  name: string;
  department: string;
  designation: string;
  dateOfJoining: string;
}

/** ASSUMED endpoint/shape - adjust the URL once your attendance API is
 *  ready. Takes ALL employee ids in one call. Backend wraps responses in
 *  resSuccess()/resBadRequest(), so the payload sits at response.data.data. */
async function fetchAttendanceDetail(
  employeeIds: string[],
  month: number,
  year: number,
): Promise<AttendanceDetailApiResponse> {
  // TODO: replace with the real endpoint once available.
  const response = await axiosInstance.post("/attendance/monthly-slip", {
    employeeIds: employeeIds.join(","),
    month,
    year,
  });
  return response.data.data;
}

/** ASSUMED endpoint/shape - "after i put real route" per your note, swap
 *  the URL below if the path or field names differ. */
async function fetchEmployeeDetail(
  employeeId: string,
): Promise<EmployeeDetailApiResponse> {
  // TODO: replace with the real endpoint once available.
  const response = await axiosInstance.post(
    `attendance/monthly-slip-employee-fetch`,
    {
      employee_id: employeeId,
    },
  );
  return response.data.data;
}

function normalizeDays(
  rawDays: DailyAttendanceApiRow[] = [],
): DailyAttendanceRow[] {
  return rawDays.map((d) => ({
    ...d,
    punches: d.punches ?? [],
  }));
}

function buildSummary(
  employeeId: string,
  employeeDetail: Partial<EmployeeDetailApiResponse>,
  monthlyCount: Partial<MonthlyCountApiRow>,
  monthLabel: string,
): AttendanceSummary {
  return {
    ecode: employeeDetail.ecode ?? employeeId,
    name: employeeDetail.name ?? "",
    // department: employeeDetail.department ?? "",
    // designation: employeeDetail.designation ?? "",
    dateOfJoining: employeeDetail.dateOfJoining ?? "",
    month: monthLabel,
    present: monthlyCount.present ?? 0,
    absent: monthlyCount.absent ?? 0,
    halfDay: monthlyCount.halfDay ?? 0,
    weekOff: monthlyCount.weekOff ?? 0,
    holiday: monthlyCount.holiday ?? 0,
    lateDays: monthlyCount.lateDays ?? 0,
    earlyDays: monthlyCount.earlyDays ?? 0,
    // sandwichApplied: monthlyCount.sandwichApplied ?? 0,
    workHrs: monthlyCount.workHrs ?? "00:00",
    officeHrs: monthlyCount.officeHrs ?? "00:00",
    ot: monthlyCount.ot ?? "00:00",
    addOt: monthlyCount.addOt ?? "",
    leave: monthlyCount.leave ?? 0,
  };
}

type RouteParams = {
  empId?: string;
  month?: string;
  year?: string;
};

interface EmployeeSlipData {
  employeeId: string;
  summary: AttendanceSummary;
  days: DailyAttendanceRow[];
}

/** Route-level container: parses :employeeIds/:month/:year, fetches data for
 *  every employee, then renders one slip per employee, looped. This is the
 *  component you should point your route at. */
const AttendanceMonthlySlipPage: React.FC = () => {
  const {
    empId: employeeIdsParam,
    month: monthParam,
    year: yearParam,
  } = useParams<RouteParams>();

  const companyInfo = useCompanyStore((state) => state.companyInfo);

  const employeeIds = useMemo(
    () =>
      (employeeIdsParam ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [employeeIdsParam],
  );

  const month = Number(monthParam);
  const year = Number(yearParam);
  const monthLabel = useMemo(() => formatMonthYear(month, year), [month, year]);
  const reportDateTime = useMemo(() => formatCurrentDateTime(), []);

  const [slips, setSlips] = useState<EmployeeSlipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeIds.length === 0 || !month || !year) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [attendanceDetail, employeeDetails] = await Promise.all([
          fetchAttendanceDetail(employeeIds, month, year),
          Promise.all(employeeIds.map((id) => fetchEmployeeDetail(id))),
        ]);

        const employeeDetailMap = new Map(
          employeeIds.map((id, idx) => [id, employeeDetails[idx]]),
        );

        const nextSlips: EmployeeSlipData[] = employeeIds.map((id) => {
          const rawDays = attendanceDetail.daysWise[id] ?? [];
          const monthlyCount = attendanceDetail.monthlyCount[id] ?? {};
          const employeeDetail = employeeDetailMap.get(id) ?? {};

          return {
            employeeId: id,
            days: normalizeDays(rawDays),
            summary: buildSummary(id, employeeDetail, monthlyCount, monthLabel),
          };
        });

        if (!cancelled) {
          setSlips(nextSlips);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load attendance data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeIds, month, year, monthLabel]);

  if (employeeIds.length === 0) {
    return (
      <div style={{ padding: 16 }}>No employee IDs provided in the route.</div>
    );
  }

  if (loading) {
    return <div style={{ padding: 16 }}>Loading attendance slips...</div>;
  }

  if (error) {
    return <div style={{ padding: 16, color: "red" }}>{error}</div>;
  }

  return (
    <div>
      {slips.map((slip, index) => (
        <div
          key={slip.employeeId}
          style={{
            marginBottom: 24,
            pageBreakAfter: index < slips.length - 1 ? "always" : "auto",
          }}
        >
          <ProcessAttendanceMonthlySlip
            reportDateTime={reportDateTime}
            pageNo={`${index + 1} / ${slips.length}`}
            summary={slip.summary}
            days={slip.days}
            printedBy={String(localStorage.getItem("USERNAME"))}
            companyLabel={companyInfo.company_name}
          />
        </div>
      ))}
    </div>
  );
};

export default AttendanceMonthlySlipPage;
