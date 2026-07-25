import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../../../../services/axiosInstance";
import "./SalarySlip.css";
import { useCompanyStore } from "../../../../store/company/useCompanyStore";
// TODO: point this at your real axiosInstance file/path.

/* ----------------------------- Types ----------------------------- */

export interface SalarySlipRecord {
  empId: string;
  employeeName: string;
  contact_number: string;
  // designation: string;
  leave: number | string;
  total_working_days: number | string;
  payable_days: number | string;
  basicda: number | string;
  hra: number | string;
  medi_all: number | string;
  conv_all: number | string;
  spe_all: number | string;
  overtime: number | string;
  others_earning: number | string;
  gross: number | string;
  pf: number | string;
  pt: number | string;
  pm_pf: number | string;
  esi: number | string;
  insurance: number | string;
  others_deduction: number | string;
  remark: number | string;
  total_deduction: number | string;
  net_payable: number | string;
  net_payable_in_word: string;
}

/* --------------------------- Sample Data --------------------------- */
/* Only used if a caller explicitly passes a `data` prop (e.g. standalone
   preview/testing). Not used by the live route - that path always fetches. */

export const SAMPLE_SALARY_DATA: SalarySlipRecord[] = [];

/* ----------------------------- Styling ----------------------------- */

const COLOR_BORDER = "#000000";
const COLOR_TEXT = "#000000";

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: "14px",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  color: COLOR_TEXT,
  border: `1px solid ${COLOR_BORDER}`,
};

const mainHeaderStyle: React.CSSProperties = {
  textAlign: "center",
  fontWeight: 700,
  padding: "8px",
  border: `1px solid ${COLOR_BORDER}`,
  fontSize: "16px",
};

const columnHeaderStyle: React.CSSProperties = {
  textAlign: "left",
  fontWeight: 700,
  padding: "10px 8px",
  border: `1px solid ${COLOR_BORDER}`,
  verticalAlign: "top",
  whiteSpace: "pre-wrap",
};

const cellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 8px",
  border: `1px solid ${COLOR_BORDER}`,
  backgroundColor: "#ffffff",
  verticalAlign: "middle",
};

/* ------------------------- Month/year helper ------------------------- */

const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "March – 2025" from numeric month (1-12) + 4-digit year route params */
function formatFullMonthYear(month: number, year: number): string {
  const name = MONTH_NAMES_FULL[month - 1] ?? "";
  return name ? `${name} \u2013 ${year}` : `${month} \u2013 ${year}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

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

/* ============================================================
 * ROUTE / API INTEGRATION
 * ============================================================
 * Route (as you have it):
 *   <Route path="/SalaryRegisterMonthlySlip/:empId/:month/:year" element={<SalaryRegisterMonthlySlip />} />
 *   e.g. /SalaryRegisterMonthlySlip/101,102,103/6/2026
 *   :empId is comma-separated employee ids (same convention as the attendance slip route).
 *
 * ASSUMPTIONS BELOW - same deal as before, only the two fetch functions +
 * their mapping need to change once your real endpoints are ready.
 *   - fetchEmployeeDetail() can reuse the SAME employee endpoint already
 *     used for the attendance slip.
 *   - fetchSalaryDetail() is ONE call for all employee ids, returns a
 *     `salary` object keyed by employee id.
 *   - Both now go through axiosInstance instead of fetch(). If your backend
 *     wraps payloads (e.g. response.data.data), adjust the `response.data`
 *     lines below accordingly.
 * ============================================================ */

interface EmployeeDetailApiResponse {
  ecode: string;
  name: string;
  department?: string;
  designation: string;
  dateOfJoining?: string;
  contact_number?: string;
}

/** ASSUMED endpoint/shape - reuse the same one built for the attendance slip. */
async function fetchEmployeeDetail(
  employeeId: string,
): Promise<EmployeeDetailApiResponse> {
  // TODO: replace with the real endpoint once available.
  const response = await axiosInstance.post(
    `attendance/monthly-slip-employee-fetch`,
    { employee_id: employeeId },
  );
  return response.data.data;
}

interface SalaryDetailApiRow {
  leave: number;
  total_working_days: number;
  payable_days: number;
  basicda: number;
  hra: number;
  medi_all: number;
  conv_all: number;
  spe_all: number;
  overtime: number;
  others_earning: number;
  gross: number;
  pf: number;
  pt: number;
  pm_pf: number;
  esi: number;
  insurance: number;
  others_deduction: number;
  remark: number;
  total_deduction: number;
  net_payable: number;
  net_payable_in_word: string;
}

interface SalaryDetailApiResponse {
  salary: Record<string, SalaryDetailApiRow>; // keyed by employee id
}

/** ASSUMED endpoint/shape - adjust the URL + response.data mapping once
 *  your salary API is ready. Takes ALL employee ids in one call. */
async function fetchSalaryDetail(
  employeeIds: string[],
  month: number,
  year: number,
): Promise<SalaryDetailApiResponse> {
  // TODO: replace with the real endpoint once available.
  const response = await axiosInstance.post("/salary/monthly-slip", {
    employeeIds: employeeIds.join(","),
    month,
    year,
  });
  return response.data.data;
}

function buildSalaryRecord(
  employeeId: string,
  employeeDetail: Partial<EmployeeDetailApiResponse>,
  salaryRow: Partial<SalaryDetailApiRow>,
): SalarySlipRecord {
  return {
    empId: employeeDetail.ecode ?? employeeId,
    contact_number: employeeDetail.contact_number ?? "",
    employeeName: employeeDetail.name ?? "",

    leave: salaryRow.leave ?? "",
    total_working_days: salaryRow.total_working_days ?? "",
    payable_days: salaryRow.payable_days ?? "",
    basicda: salaryRow.basicda ?? "",
    hra: salaryRow.hra ?? "",
    medi_all: salaryRow.medi_all ?? "",
    conv_all: salaryRow.conv_all ?? "",
    spe_all: salaryRow.spe_all ?? "",
    overtime: salaryRow.overtime ?? "",
    others_earning: salaryRow.others_earning ?? "",
    gross: salaryRow.gross ?? "",
    pf: salaryRow.pf ?? "",
    pt: salaryRow.pt ?? "",
    pm_pf: salaryRow.pm_pf ?? "",
    esi: salaryRow.esi ?? "",
    insurance: salaryRow.insurance ?? "",
    others_deduction: salaryRow.others_deduction ?? "",
    remark: salaryRow.remark ?? "",
    total_deduction: salaryRow.total_deduction ?? "",
    net_payable: salaryRow.net_payable ?? "",
    net_payable_in_word: salaryRow.net_payable_in_word ?? "",
  };
}

type RouteParams = {
  empId?: string;
  month?: string;
  year?: string;
};

/* ----------------------- Conditional row config ----------------------- */
/* ONLY these fields are checked for "empty/not available" and dropped from
   the slip if missing. Every other earning/deduction field is always shown,
   exactly as before - this list is intentionally narrow per requirements. */

const CONDITIONAL_FIELDS = ["pm_pf", "esi", "insurance", "overtime"] as const;
type ConditionalField = (typeof CONDITIONAL_FIELDS)[number];

/** True when a value should be treated as "not available" (blank/null/undefined). */
function isEmptyValue(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

interface LineItem {
  label: string;
  value: React.ReactNode;
  /** Only set for the 4 conditionally-removable fields; everything else is always kept. */
  field?: ConditionalField;
}

function keepLineItem(item: LineItem, record: SalarySlipRecord): boolean {
  if (!item.field) return true; // not in the conditional list - always keep
  return !isEmptyValue(record[item.field]);
}

/* ----------------------- Single-employee table ----------------------- */
/* The FULL table (title + headers + one data row) - repeated once per
   employee by the component below, not shared as multi-row rows. */

interface SingleSalaryTableProps {
  monthYear: string;
  record: SalarySlipRecord;
  companyInfo: any;
}

const SingleEmployeeSalaryTable: React.FC<SingleSalaryTableProps> = ({
  monthYear,
  record,
  companyInfo,
}) => {
  // Earnings column, in display order. "overtime" is the only conditional one here.
  const earningItems: LineItem[] = [
    { label: "Basic+DA", value: record.basicda },
    { label: "HRA", value: record.hra },
    { label: "Medi. All", value: record.medi_all },
    { label: "Conv. All", value: record.conv_all },
    { label: "Spe. All", value: record.spe_all },
    { label: "Overtime", value: record.overtime, field: "overtime" as const },
    { label: "Others", value: record.others_earning },
  ].filter((item) => keepLineItem(item, record));

  // Deduction column, in display order. "pm_pf", "esi", "insurance" are conditional.
  const deductionItems: LineItem[] = [
    { label: "PF", value: record.pf },
    { label: "PT", value: record.pt },
    { label: "PM PF", value: record.pm_pf, field: "pm_pf" as const },
    { label: "ESI", value: record.esi, field: "esi" as const },
    {
      label: "Insurance",
      value: record.insurance,
      field: "insurance" as const,
    },
    { label: "Others", value: record.others_deduction },
  ].filter((item) => keepLineItem(item, record));

  // Zip the two independent columns into rows so the 4-column grid stays
  // intact even when one side has fewer rows than the other after filtering.
  const maxRows = Math.max(earningItems.length, deductionItems.length);
  const zippedRows = Array.from({ length: maxRows }, (_, i) => ({
    earning: earningItems[i],
    deduction: deductionItems[i],
  }));

  return (
    <div className="slipWrapper">
      <table className="slipTable">
        <tbody>
          {/* Header: Logo + Company Info */}
          <tr>
            <td className="logoCell">
              <div className="logoBox">
                <div className="logoText">
                  {companyInfo.company_name?.split(" ")?.[0]}
                </div>
                {companyInfo.company_name?.split(" ")?.[1] && (
                  <div className="logoSubText">
                    {companyInfo.company_name?.split(" ")?.[1]}
                  </div>
                )}
              </div>
            </td>
            <td className="addressCell" colSpan={3}>
              {companyInfo?.address}
              <br />
              Email Id.: {companyInfo?.company_email}
            </td>
          </tr>

          {/* Month / Slip Date */}
          <tr>
            <td className="labelCell">Month</td>
            <td className="valueCellBold">{monthYear}</td>
            <td className="labelCell">Slip Date</td>
            <td className="valueCellBold">{formatCurrentDateTime()}</td>
          </tr>

          {/* Section Headers */}
          <tr>
            <td className="sectionHeader" colSpan={2}>
              Employee&apos;s Detials
            </td>
            <td className="sectionHeader" colSpan={2}>
              Attendance Detials
            </td>
          </tr>

          {/* Name / Total Working days */}
          <tr>
            <td className="labelCell">Name</td>
            <td className="valueCell">{record.employeeName}</td>
            <td className="labelCell">Total Working days</td>
            <td className="valueCellRight">{record.total_working_days}</td>
          </tr>

          {/* Employee No. / Leave */}
          <tr>
            <td className="labelCell">Employee No.</td>
            <td className="valueCell">{record.empId}</td>
            <td className="labelCell">Leave</td>
            <td className="valueCellRight">{record.leave}</td>
          </tr>

          {/* Contact Number / Payable Days */}
          <tr>
            <td className="labelCell">Contact Number</td>
            <td className="valueCell">{record.contact_number}</td>
            <td className="labelCell">Payable Days</td>
            <td className="valueCellRight">{record.payable_days}</td>
          </tr>

          {/* Salary Breakup Header */}
          <tr>
            <td className="sectionHeaderCenter" colSpan={4}>
              Salary Brackup
            </td>
          </tr>

          {/* Earnings / Deduction sub-headers */}
          <tr>
            <td className="subHeader" colSpan={2}>
              Earnings
            </td>
            <td className="subHeader" colSpan={2}>
              Deduction
            </td>
          </tr>

          {/* Earnings & Deduction rows - zipped, each side independently filtered */}
          {zippedRows.map((row, idx) => (
            <tr key={idx}>
              {row.earning ? (
                <>
                  <td className="labelCell">{row.earning.label}</td>
                  <td className="valueCellRight">{row.earning.value}</td>
                </>
              ) : (
                <>
                  <td className="labelCell"></td>
                  <td className="valueCellRight"></td>
                </>
              )}
              {row.deduction ? (
                <>
                  <td className="labelCell">{row.deduction.label}</td>
                  <td className="valueCellRight">{row.deduction.value}</td>
                </>
              ) : (
                <>
                  <td className="labelCell"></td>
                  <td className="valueCellRight"></td>
                </>
              )}
            </tr>
          ))}

          {/* Remark row */}
          <tr>
            <td className="labelCell">Remark :</td>
            <td className="valueCellRight" colSpan={3}>
              {record.remark}
            </td>
          </tr>

          {/* Gross + Total Deduction - same row */}
          <tr>
            <td className="totalLabelCell">Gross</td>
            <td className="totalValueCell">{record.gross}</td>
            <td className="totalLabelCell">Total Deduction</td>
            <td className="totalValueCell">{record.total_deduction}</td>
          </tr>

          {/* Net Payable + amount in words - same row */}
          <tr>
            <td className="totalLabelCell">Net Payable (INR)</td>
            <td className="totalValueCell">{record.net_payable}</td>
            <td className="amountInWordsCell" colSpan={2}>
              {record.net_payable_in_word}
            </td>
          </tr>

          {/* Signatures */}
          <tr>
            <td className="signCell" colSpan={2}>
              Employee&apos;s Sign
            </td>
            <td className="signCell" colSpan={2}>
              Employer&apos;s Sign
            </td>
          </tr>
          <tr>
            <td className="signSpaceCell" colSpan={2}></td>
            <td className="signSpaceCell" colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ---------------------------- Component ---------------------------- */

interface SalarySlipTableProps {
  monthYear?: string;
  /** If provided, the component renders these directly and skips fetching
   *  entirely - useful for standalone preview/testing outside the route. */
  data?: SalarySlipRecord[];
}

const SalaryRegisterMonthlySlip: React.FC<SalarySlipTableProps> = ({
  monthYear,
  data,
}) => {
  const usingExplicitData = data !== undefined;
  const companyInfo = useCompanyStore((state) => state.companyInfo);

  const {
    empId: empIdParam,
    month: monthParam,
    year: yearParam,
  } = useParams<RouteParams>();

  const employeeIds = useMemo(
    () =>
      (empIdParam ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [empIdParam],
  );
  const month = Number(monthParam);
  const year = Number(yearParam);
  const resolvedMonthYear = monthYear ?? formatFullMonthYear(month, year);

  const [fetchedRows, setFetchedRows] = useState<SalarySlipRecord[]>([]);
  const [loading, setLoading] = useState(!usingExplicitData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usingExplicitData) return; // explicit data passed in - nothing to fetch

    if (employeeIds.length === 0 || !month || !year) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [salaryDetail, employeeDetails] = await Promise.all([
          fetchSalaryDetail(employeeIds, month, year),
          Promise.all(employeeIds.map((id) => fetchEmployeeDetail(id))),
        ]);

        const employeeDetailMap = new Map(
          employeeIds.map((id, idx) => [id, employeeDetails[idx]]),
        );

        const rows: SalarySlipRecord[] = employeeIds.map((id) =>
          buildSalaryRecord(
            id,
            employeeDetailMap.get(id) ?? {},
            salaryDetail.salary[id] ?? {},
          ),
        );

        if (!cancelled) setFetchedRows(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load salary data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingExplicitData, empIdParam, month, year]);

  const rows = usingExplicitData ? (data as SalarySlipRecord[]) : fetchedRows;

  if (!usingExplicitData && employeeIds.length === 0) {
    return (
      <div style={{ padding: 16 }}>No employee IDs provided in the route.</div>
    );
  }
  if (!usingExplicitData && loading) {
    return <div style={{ padding: 16 }}>Loading salary slip...</div>;
  }
  if (!usingExplicitData && error) {
    return <div style={{ padding: 16, color: "red" }}>{error}</div>;
  }

  return (
    <>
      {/* Print-specific CSS */}
      <style type="text/css">
        {`
                    @media print {
                        /* Force the page into landscape mode */
                        @page {
                           
                            margin: 10mm;
                        }
                        
                        /* Remove scroll behavior and background colors for clean printing */
                        .print-container {
                            overflow-x: visible !important;
                            padding: 0 !important;
                            background-color: transparent !important;
                        }

                        /* Override inline styles to make everything fit */
                        .print-table th, .print-table td {
                            font-size: 10px !important; 
                            padding: 4px 2px !important;
                            min-width: 0 !important; /* Strips the 200px constraint */
                            word-wrap: break-word !important;
                        }

                        .print-table th.main-header {
                            font-size: 14px !important;
                            padding: 6px !important;
                        }
                    }
                `}
      </style>

      {rows.length > 0 ? (
        rows.map((record, index) => (
          <div
            key={record.empId || index}
            style={{
              marginBottom: 24,
              pageBreakAfter: index < rows.length - 1 ? "always" : "auto",
            }}
          >
            <SingleEmployeeSalaryTable
              monthYear={resolvedMonthYear}
              record={record}
              companyInfo={companyInfo}
            />
          </div>
        ))
      ) : (
        <div style={{ padding: 16, textAlign: "center", color: "#666" }}>
          No salary records found.
        </div>
      )}
    </>
  );
};

export default SalaryRegisterMonthlySlip;
