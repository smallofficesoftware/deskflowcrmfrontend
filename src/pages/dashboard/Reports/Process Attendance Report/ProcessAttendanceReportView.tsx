import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import CheckBoxFilterModal, {
  monthOptions,
} from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import ProcessAttendanceDayWiseDetails from "./ProcessAttendanceDayWiseDetails";
import {
  DAY_STATUS,
  fetchProcessAttendance,
  IProcessAttendance,
} from "./ProcessAttendanceReportController";

interface IPropsProcessAttendance {
  selectedTeamMembers?: string[] | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  onHide?: () => void;
  selectedDayMonthYear?: number[] | null;
}

type AttendanceColumnDef = ColumnDef & {
  header: React.ReactNode;
  filterMatchMode?: string;
  width?: string;
  sortableCol?: boolean;
  filterCol?: boolean;
  bodyClassName?: string;
  body: (rowData: IProcessAttendance) => React.ReactNode;
};

const formatDateDisplay = (date: Date): string => {
  return String(date.getDate()).padStart(2, "0"); // Returns DD (e.g., "24")
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatCurrentDateTime(): string {
  const date = new Date();

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

const ProcessAttendanceReportView = ({
  selectedTeamMembers,
  MobileToken,
  getID,
  MobileFlag,
  onHide,
  selectedDayMonthYear,
}: IPropsProcessAttendance) => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [attendanceData, setAttendanceData] = useState<IProcessAttendance[]>(
    [],
  );
  const [selectedEmployees, setSelectedEmployees] = useState<
    IProcessAttendance[]
  >([]);
  const [selectedEmployeesIds, setSelectedEmployeesIds] = useState<number[]>(
    [],
  );

  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("process_attendance");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);



  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IProcessAttendance[]>>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dayDetailModal, setDayDetailModal] = useState<{
    visible: boolean;
    username: string;
    date: string;
    displayDate: string;
    attendance: any | null;
    companyTeamInfo: any;
  }>({
    visible: false,
    username: "",
    date: "",
    displayDate: "",
    attendance: null,
    companyTeamInfo: null,
  });

  const canView = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.VIEW,
  );
  const canShare = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.PRINT,
  );

  const getCurrentMonthAndYear = () => {
    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return [month, year];
  };

  // Priority: 1. Applied filter -> 2. Prop -> 3. Current month & year default
  const effectiveMonthYear = useMemo(() => {
    let month = Number(filters.filterData?.month);
    let year = Number(filters.filterData?.year);
    let day = Number(filters.filterData?.day) || undefined;

    if (
      (!month || !year) &&
      Array.isArray(selectedDayMonthYear) &&
      selectedDayMonthYear.length >= 2
    ) {
      if (selectedDayMonthYear.length === 3) {
        [day, month, year] = selectedDayMonthYear;
      } else {
        [month, year] = selectedDayMonthYear;
      }
    }

    if (!month || !year) {
      const [currMonth, currYear] = getCurrentMonthAndYear();
      month = month || currMonth;
      year = year || currYear;
    }

    return { day, month, year };
  }, [
    filters.filterData?.month,
    filters.filterData?.year,
    filters.filterData?.day,
    selectedDayMonthYear,
  ]);

  const activeDayMonthYear = useMemo(() => {
    const { day, month, year } = effectiveMonthYear;
    return day ? [day, month, year] : [month, year];
  }, [effectiveMonthYear]);

  const handleApplyFilters = (data: any) => {
    const [currMonth, currYear] = getCurrentMonthAndYear();

    const updatedFilters = {
      ...data,
      filterData: {
        ...data?.filterData,
        month: data?.filterData?.month || currMonth,
        year: data?.filterData?.year || currYear,
      },
    };

    setFilters("process_attendance", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };

  useEffect(() => {
    if (!filters.filterData?.month || !filters.filterData?.year) {
      const [month, year] = getCurrentMonthAndYear();

      setFilters("process_attendance", {
        ...filters,
        filterData: {
          ...filters.filterData,
          month: filters.filterData?.month || month,
          year: filters.filterData?.year || year,
        },
      });
    }
  }, []);

  const allDates = useMemo(() => {
    const { month, year } = effectiveMonthYear;
    if (!month || !year) return [];

    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, [effectiveMonthYear]);

  const dataArray: IProcessAttendance[] = useMemo(() => {
    return Array.isArray(attendanceData) ? attendanceData : [];
  }, [attendanceData]);

  const loadAttendance = useCallback(
    async (offset: number, limit: number, reset: boolean = false) => {
      setLoading(true);

      try {
        const newData = await fetchProcessAttendance(
          filters.checkedOptionsUser,
          MobileToken,
          getID,
          MobileFlag,
          activeDayMonthYear,
        );

        if (reset) {
          setAttendanceData(newData);
        } else {
          setAttendanceData((prev) => [...prev, ...newData]);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    },
    [
      activeDayMonthYear,
      filters.checkedOptionsUser,
      MobileToken,
      getID,
      MobileFlag,
    ],
  );

  const handleRefresh = async () => {
    setAttendanceData([]);
    setSelectedEmployees([]);
    loadAttendance(0, 0, true);
  };

  useEffect(() => {
    if (canView) {
      setAttendanceData([]);
      setSelectedEmployees([]);
      setSelectedEmployeesIds([]);
      loadAttendance(0, 50, true);
    }
  }, [activeDayMonthYear, filters.checkedOptionsUser, canView, loadAttendance]);

  const onSelectionChange = (event: { value: IProcessAttendance[] }) => {
    setSelectedEmployees(event.value);
    setSelectedEmployeesIds(
      event.value.map((emp) => emp.presentDates[0]?.employee_id),
    );
    setSelectAll(event.value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedEmployees([...dataArray]);
      setSelectedEmployeesIds(
        dataArray.map((emp) => emp.presentDates[0]?.employee_id),
      );
    } else {
      setSelectAll(false);
      setSelectedEmployees([]);
      setSelectedEmployeesIds([]);
    }
  };

  const isDateColumnKey = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key);

  const getExportCellValue = (
    col: AttendanceColumnDef,
    emp: IProcessAttendance,
  ): string => {
    switch (col.key) {
      case "employee_name":
        return emp.employee_name ?? "-";
      case "total_working_time_sum":
        return String(emp.total_working_time_sum ?? "00:00:00");
      case "roundoff_hour_sum":
        return String((emp as any).roundoff_hour_sum ?? "00:00:00");
      case "net_working_hour_sum":
        return String(emp.net_working_hour_sum ?? "00:00:00");
      case "regular_ot_hour_sum":
        return String((emp as any).regular_ot_hour_sum ?? "00:00:00");
      case "extra_ot_hour_sum":
        return String((emp as any).extra_ot_hour_sum ?? "00:00:00");
      case "overtime_hour_sum":
        return String(emp.overtime_hour_sum ?? "00:00:00");
      case "present":
        return String(emp.status_count.P ?? "-");
      case "half_day":
        return String(emp.status_count.HD ?? "-");
      case "absent":
        return String(emp.status_count.A ?? "-");
      case "leave":
        return String(emp.status_count.L ?? "-");
      case "week_off":
        return String(emp.status_count.WO ?? "-");
      case "holiday":
        return String(emp.status_count.PH ?? "-");
      case "work_on_week_off":
        return String(emp.status_count.WOWO ?? "-");
      case "work_on_public_holiday":
        return String(emp.status_count.WOPH ?? "-");
      default: {
        // Date columns are keyed by their formatted date (YYYY-MM-DD)
        const attendance = emp.presentDates?.find((a) => a.date === col.key);
        if (!attendance) return "-";
        return DAY_STATUS[attendance.day_status] ?? "-";
      }
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });

    // Use customers (all loaded data) or selectedCustomers
    const dataToExport =
      selectedEmployees.length > 0 ? selectedEmployees : attendanceData;

    if (!dataToExport || dataToExport.length === 0) {
      toast.info("No data available to export");
      return;
    }

    const tableData = dataToExport.map((emp) => {
      const row: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, emp);
      });
      return row;
    });

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      startY: 40,
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      margin: { top: 20, left: 5, bottom: 10 },
      columnStyles: visibleColumns.reduce(
        (acc, col) => {
          acc[col.key] = {
            cellWidth:
              col.key === "employee_name"
                ? 28
                : isDateColumnKey(col.key)
                  ? 14
                  : 20,
          };
          return acc;
        },
        {} as Record<string, { cellWidth: number }>,
      ),
      willDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        // Title
        doc.setFont("Poppins", "bold");
        doc.setFontSize(16);
        doc.text("Process Attendance Report", pageWidth / 2, 12, {
          align: "center",
        });

        // Note
        doc.setFont("Poppins", "normal");
        doc.setFontSize(8);
        doc.text(
          "Note: Scroll or pan horizontally in your PDF viewer to see all columns.",
          10,
          20,
        );

        // Printed By
        doc.setFont("Poppins", "bold");
        doc.setFontSize(9);
        doc.text(
          `Printed By: ${String(localStorage.getItem("USERNAME"))}`,
          10,
          28,
        );

        // Printed On
        doc.text(`Printed On: ${formatCurrentDateTime()}`, pageWidth - 10, 28, {
          align: "right",
        });
      },
    });

    doc.save(`process_attendance_${Date.now()}.pdf`);
  };


  const printTable = () => {
    const dataToPrint =
      selectedEmployees.length > 0 ? selectedEmployees : attendanceData;

    if (!dataToPrint || dataToPrint.length === 0) {
      toast.info("No data available to print");
      return;
    }

    const headers = visibleColumns
      .map((col) => `<th>${col.label}</th>`)
      .join("");

    const rows = dataToPrint
      .map((emp) => {
        const cells = visibleColumns
          .map((col) => `<td>${getExportCellValue(col, emp)}</td>`)
          .join("");

        return `
        <tr>
          ${cells}
        </tr>
      `;
      })
      .join("");

    const printContent = `
        <html>
        <head>
          <title>Process Attendance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
            }

            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              font-size: 13px;
              font-weight: 600;
            }

            h1 {
              text-align: center;
              margin: 8px 0 16px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
              font-family: Arial, sans-serif;
              font-size: 10pt;
            }

            th,
            td {
              border: 1px solid #ccc;
              padding: 6px;
              text-align: center;
            }

            th {
              background: #e6f2ff;
              font-weight: bold;
            }
          </style>
        </head>

        <body>

          <h1>Process Attendance Report</h1>

          <div class="print-header">
              <div>
                  Printed By : ${String(localStorage.getItem("USERNAME"))}
              </div>

              <div>
                  Printed On : ${formatCurrentDateTime()}
              </div>
          </div>

          <table>
              <thead>
                  <tr>${headers}</tr>
              </thead>

              <tbody>
                  ${rows}
              </tbody>
          </table>

        </body>
        </html>
        `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleMonthlySlipPrintView = () => {
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/ProcessAttendanceMonthlySlip/${selectedEmployeesIds}/${effectiveMonthYear.month}/${effectiveMonthYear.year}`;
    const myWindow = window.open(supportURL, "_blank");
  };

  const baseColumnDefs: AttendanceColumnDef[] = useMemo(() => {
    const defs: AttendanceColumnDef[] = [
      {
        key: "employee_name",
        label: "Employee Name",
        header: "Employee Name",
        width: "125px",
        body: (row) => <span>{row.employee_name || "-"}</span>,
      },
    ];

    allDates.forEach((date) => {
      const formattedDate = formatDate(date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayNumber = String(date.getDate()).padStart(2, "0");
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      defs.push({
        key: formattedDate,
        label: `${dayName} ${dayNumber}`,
        header: (
          <div
            style={{
              textAlign: "center",
              color: isWeekend ? "#dc3545" : "#495057",
              fontWeight: 600,
              lineHeight: "1.2",
            }}
          >
            <div>{dayName}</div>
            <div>{dayNumber}</div>
          </div>
        ),
        width: "120px",
        sortableCol: false,
        filterCol: false,
        body: (rowData: IProcessAttendance) => {
          const attendance = rowData.presentDates.find(
            (a) => a.date == formattedDate,
          );
          if (!attendance) {
            return "-";
          }

          const statusId = attendance.day_status;
          const status = DAY_STATUS[statusId];

          const statusColor =
            status === "P"
              ? "green"
              : status === "A"
                ? "red"
                : status === "L"
                  ? "orange"
                  : status === "WO"
                    ? "blue"
                    : "black";

          return (
            <div
              style={{ cursor: "pointer" }}
              onClick={() =>
                setDayDetailModal({
                  visible: true,
                  username: rowData.employee_name ?? "",
                  date: formattedDate,
                  displayDate: dayNumber,
                  attendance: attendance,
                  companyTeamInfo: {
                    id: attendance?.employee_id,
                    username: rowData.employee_name,
                  },
                })
              }
            >
              <div style={{ color: statusColor, fontWeight: 600 }}>
                {status}
              </div>
            </div>
          );
        },
      });
    });

    defs.push(
      {
        key: "total_working_time_sum",
        label: "Total Working Time",
        header: (
          <span>
            Total Working <br /> Time
          </span>
        ),
        width: "120px",
        bodyClassName: "text-center",
        body: (row) => row.total_working_time_sum,
      },
      {
        key: "net_working_hour_sum",
        label: "Net Working Time",
        header: (
          <span>
            Net Working <br /> Time
          </span>
        ),
        width: "120px",
        bodyClassName: "text-center",
        body: (row) => row.net_working_hour_sum,
      },
      {
        key: "roundoff_hour_sum",
        label: "Round Off Hours",
        header: (
          <span>
            Round Off <br /> Hours
          </span>
        ),
        width: "120px",
        bodyClassName: "text-center",
        body: (row) => (row as any).roundoff_hour_sum ?? "00:00:00",
      },
      {
        key: "regular_ot_hour_sum",
        label: "Reg. OT Hours",
        header: (
          <span>
            Reg. OT <br /> Hours
          </span>
        ),
        width: "120px",
        bodyClassName: "text-center",
        body: (row) => (row as any).regular_ot_hour_sum ?? "00:00:00",
      },
      {
        key: "extra_ot_hour_sum",
        label: "Extra OT Hours",
        header: (
          <span>
            Extra OT <br /> Hours
          </span>
        ),
        width: "120px",
        bodyClassName: "text-center",
        body: (row) => (row as any).extra_ot_hour_sum ?? "00:00:00",
      },
      {
        key: "overtime_hour_sum",
        label: "Total OT Hours",
        header: (
          <span>
            Total OT <br /> Hours
          </span>
        ),
        width: "120px",
        bodyClassName: "text-center",
        body: (row) => row.overtime_hour_sum,
      },
      {
        key: "present",
        label: "Present",
        header: <span>Present</span>,
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.P,
      },
      {
        key: "half_day",
        label: "Half Day",
        header: <span>Half Day</span>,
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.HD,
      },
      {
        key: "absent",
        label: "Absent",
        header: <span>Absent</span>,
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.A,
      },
      {
        key: "leave",
        label: "Leave",
        header: <span>Leave</span>,
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.L,
      },
      {
        key: "week_off",
        label: "Week Off",
        header: <span>Week Off</span>,
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.WO,
      },
      {
        key: "holiday",
        label: "Public Holiday",
        header: (
          <span>
            Public <br /> Holiday
          </span>
        ),
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.PH,
      },
      {
        key: "work_on_week_off",
        label: "Work On Week Off",
        header: (
          <span>
            Work On <br /> Week Off
          </span>
        ),
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.WOWO,
      },
      {
        key: "work_on_public_holiday",
        label: "Work On Public Holiday",
        header: (
          <span>
            Work On <br /> Public Holiday
          </span>
        ),
        width: "120px",
        bodyClassName: "text-end",
        body: (rowData: IProcessAttendance) => rowData.status_count.WOPH,
      },
    );

    return defs;
  }, [allDates]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("process_attendance_report", baseColumnDefs);

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Process Attendance
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"}`}
      >
        <h3
          className="dash-board-text-count"
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
        >
          Process Attendance
        </h3>

        {/* {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && ( */}
        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
          <div className="d-flex gap-2 align-items-center">
            <Button
              icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={() => setIsModalFilterVisible(true)}
              tooltip="Filter Report"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />
            <Button
              icon="pi pi-ellipsis-v"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={(e) => {
                e.stopPropagation();
                setIsExportDropdownOpen((prev) => !prev);
              }}
              tooltip="More Option"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />

            <ul
              className={`labelDropLeft ${isExportDropdownOpen ? "isVisible" : "isHidden"
                }`}
              style={{
                minWidth: "170px",
                position: "absolute",
                right: "0",
                top: "100%",
                zIndex: 1000,
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              <ExportExcelMenuItem
                reportType="process_attendance_report"
                filters={{
                  request_flag: 2,
                  selectedTeamMembers: filters.checkedOptionsUser,
                  selectedDayMonthYear: activeDayMonthYear,
                }}
                columns={visibleColumns}
                fileName={`Process_Attendance_${monthOptions.find((m) => m.value === effectiveMonthYear.month)?.label}_${effectiveMonthYear.year}`}
                canShare={canShare}
                disabled={attendanceData.length === 0}
                onSelect={() => setIsExportDropdownOpen(false)}
                selectedRows={selectedEmployees}
              />

              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (attendanceData.length === 0) return;

                  canShare
                    ? exportPdf()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
                Export PDF
              </li>

              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (attendanceData.length === 0) return;

                  canPrint
                    ? printTable()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i className="pi pi-print" style={{ marginRight: "4px" }} />
                Print
              </li>
              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (attendanceData.length === 0) return;

                  if (selectedEmployeesIds.length <= 0) {
                    toast.info("Please Select Emplyees To Generate Slip.");
                    return;
                  }

                  handleMonthlySlipPrintView();
                }}
              >
                <i
                  className="pi pi-file-excel"
                  style={{ marginRight: "4px" }}
                />
                Generate Att. Slip
              </li>
            </ul>
            <Button
              icon="pi pi-refresh"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleRefresh}
              tooltip="Refresh"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />
            <ColumnsButton
              columns={orderedColumns}
              hiddenKeys={hiddenKeys}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetColumns}
            />
          </div>
        </div>
        {/* )} */}
      </div>

      {canView && (
        <>
          <div>
            <h6
              style={{
                textAlign: "start",
                fontWeight: "500",
                marginLeft: "20px",
              }}
            >
              Month:{" "}
              {monthOptions.find((m) => m.value === effectiveMonthYear.month)?.label || "-"} |
              Year: {effectiveMonthYear.year || "-"}
            </h6>
          </div>

          <div
            className="report_card"
            style={{
              height: "90vh",
              display: "block",
              flexDirection: "column",
            }}
          >
            <DataTable
              ref={dt}
              value={attendanceData}
              // lazy
              scrollable
              resizableColumns
              columnResizeMode="fit"
              className="custom-centered-table"
              scrollHeight="80vh"
              // dataKey="id"
              filterDisplay="row"
              // onFilter={onFilter}
              // onSort={onSort}
              loading={loading}
              selection={selectedEmployees}
              onSelectionChange={onSelectionChange}
              selectAll={selectAll}
              onSelectAllChange={onSelectAllChange}
              selectionMode="multiple"
              tableStyle={{ tableLayout: "fixed", width: "100%" }}
              emptyMessage="No records found"
              loadingIcon={
                <i
                  className="pi pi-spin pi-spinner"
                  style={{ fontSize: "2rem" }}
                />
              }
            >
              {!MobileFlag && (
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem" }}
                  bodyStyle={{ textAlign: "center" }}
                />
              )}

              {visibleColumns.map((col) => (
                <Column
                  key={col.key}
                  field={col.key}
                  header={col.header}
                  sortable={col.sortableCol !== false}
                  filter={col.filterCol !== false}
                  filterField={col.key}
                  filterPlaceholder="Search"
                  filterMatchMode={col.filterMatchMode || "contains"}
                  headerStyle={{
                    width: col.width || "150px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    background: "#f8f9fa",
                    fontSize: "14px",
                  }}
                  bodyStyle={{
                    fontSize: "14px",
                    textAlign: isDateColumnKey(col.key) ? "center" : undefined,
                  }}
                  bodyClassName={col.bodyClassName}
                  body={col.body}
                />
              ))}
            </DataTable>
          </div>
        </>
      )}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[5, 23]}
          pageId={1}
          stageandStatusOrderType={3}
          filtershowSeriesOrderType={"quotation_prefix"}
          initialFilterData={{
            ...filters.filterData,
            month: effectiveMonthYear.month,
            year: effectiveMonthYear.year,
            day: effectiveMonthYear.day,
            category: filters.selectedCategoryId,
            product: filters.selectedProductId,
            contactId: filters.selectedContactId,
            productId: filters.selectedProductSearchId,
            orderlistselect: filters.selectedOrderListId,
          }}
          initialCheckedOptions={filters.checkedOptions}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
          isApplyReport={1}
        />
      )}
      <ProcessAttendanceDayWiseDetails
        visible={dayDetailModal.visible}
        onHide={() =>
          setDayDetailModal((prev) => ({ ...prev, visible: false }))
        }
        username={dayDetailModal.username}
        date={dayDetailModal.date}
        displayDate={dayDetailModal.displayDate}
        attendance={dayDetailModal.attendance}
        companyTeamInfo={dayDetailModal.companyTeamInfo}
      />
    </div>
  );
};

export default ProcessAttendanceReportView;
