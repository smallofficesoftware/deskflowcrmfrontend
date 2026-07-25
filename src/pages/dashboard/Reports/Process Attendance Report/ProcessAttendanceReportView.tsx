import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import CheckBoxFilterModal, {
  monthOptions,
} from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import ProcessAttendanceDayWiseDetails from "./ProcessAttendanceDayWiseDetails";
import {
  DAY_STATUS,
  exportAllAttendanceData,
  fetchProcessAttendance,
  fetchProcessAttendanceForExport,
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

  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

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

  useEffect(() => {
    if (selectedDayMonthYear && selectedDayMonthYear.length > 0) {
      if (selectedDayMonthYear.length == 2) {
        const [month, year] = selectedDayMonthYear;

        setSelectedMonth(month);
        setSelectedYear(year);
      } else if (selectedDayMonthYear.length == 3) {
        const [day, month, year] = selectedDayMonthYear;

        setSelectedMonth(month);
        setSelectedYear(year);
      }
    }
  }, [selectedDayMonthYear]);

  const getCurrentMonthAndYear = () => {
    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return [month, year];
  };

  const handleApplyFilters = (data: any) => {
    const updatedFilters = {
      ...data,
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
          month,
          year,
        },
      });
    }
  }, [selectedDayMonthYear]);

  const allDates = useMemo(() => {
    if (
      !Array.isArray(selectedDayMonthYear) ||
      selectedDayMonthYear.length < 2
    ) {
      return [];
    }

    let month: number;
    let year: number;

    if (selectedDayMonthYear.length === 3) {
      [, month, year] = selectedDayMonthYear;
    } else {
      [month, year] = selectedDayMonthYear;
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, [selectedDayMonthYear]);

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
          selectedDayMonthYear
            ? Object.values(selectedDayMonthYear).filter(Boolean)
            : null,
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
    [selectedDayMonthYear],
  );

  useEffect(() => {
    if (canView) {
      setAttendanceData([]);
      setSelectedEmployees([]);
      setSelectedEmployeesIds([]);
      loadAttendance(0, 50, true);
    }
  }, [selectedDayMonthYear, filters.checkedOptionsUser, canView]);

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

  const exportColumns = [
    { title: "Employee Name", dataKey: "username" },
    ...allDates.map((date) => ({
      title: formatDateDisplay(date),
      dataKey: formatDate(date),
    })),
    { title: "Total Working Time", dataKey: "total_working_hours" },
    { title: "Net Working Time", dataKey: "net_working_hours" },
    { title: "Overtime Hours", dataKey: "overtime_hours" },
    { title: "Present", dataKey: "present" },
    { title: "Half Day", dataKey: "half_day" },
    { title: "Absent", dataKey: "absent" },
    { title: "Leave", dataKey: "leave" },
    { title: "Weak Off", dataKey: "week_off" },
    { title: "Public Holiday", dataKey: "public_holiday" },
    { title: "Work On Week Off", dataKey: "work_on_week_off" },
    { title: "Work On Public Holiday", dataKey: "work_on_public_holiday" },
  ];

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
      const row: Record<string, any> = { username: emp.employee_name ?? "-" };

      // All date columns
      allDates.forEach((date) => {
        const formattedDate = formatDate(date);
        const attendance = emp.presentDates?.find(
          (a) => a.date === formattedDate,
        );
        let cellValue = "-";
        if (attendance) {
          const statusId = attendance.day_status;
          const status = DAY_STATUS[statusId];

          cellValue = status;
        }
        row[formattedDate] = cellValue;
      });

      // Fixed new columns
      row.total_working_hours = emp.total_working_time_sum ?? "00:00:00";
      row.net_working_hours = emp.net_working_hour_sum ?? "00:00:00";
      row.overtime_hours = emp.overtime_hour_sum ?? "00:00:00";
      row.present = emp.status_count.P ?? "-";
      row.half_day = emp.status_count.HD ?? "-";
      row.absent = emp.status_count.A ?? "-";
      row.leave = emp.status_count.L ?? "-";
      row.week_off = emp.status_count.WO ?? "-";
      row.public_holiday = emp.status_count.PH ?? "-";
      row.work_on_week_off = emp.status_count.WOWO ?? "-";
      row.work_on_public_holiday = emp.status_count.WOPH ?? "-";

      return row;
    });

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
      columnStyles: {
        username: { cellWidth: 28 },
        total_working_hours: { cellWidth: 22 },
        company_paid_leave: { cellWidth: 18 },
        employee_paid_leave: { cellWidth: 18 },
        paid_days_paid_hours: { cellWidth: 22 },
        salary: { cellWidth: 18 },
        ...allDates.reduce(
          (acc, date) => {
            acc[formatDate(date)] = { cellWidth: 14 };
            return acc;
          },
          {} as Record<string, { cellWidth: number }>,
        ),
      },
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

  const exportExcel = async () => {
    try {
      setLoading(true);

      let allAttendance: IProcessAttendance[] = [];

      // ✅ If rows are selected → use only selected rows
      if (selectedEmployees.length > 0) {
        allAttendance = selectedEmployees;
      } else {
        // Otherwise fetch all from backend
        allAttendance = await exportAllAttendanceData(
          (offset, limit) =>
            fetchProcessAttendanceForExport(
              filters.checkedOptionsUser,
              MobileToken,
              getID,
              MobileFlag,
              offset,
              limit,
              selectedDayMonthYear,
            ),
          50,
        );
      }

      if (!allAttendance.length) {
        toast.warn("No data to export");
        return;
      }

      const sortedDates = [...allDates].sort(
        (a, b) => a.getTime() - b.getTime(),
      );

      const headers = [
        "Employee Name",
        ...sortedDates.map(formatDateDisplay),
        "Total Working Time",
        "Net Working Time",
        "Overtime Hours",
        "Present",
        "Half Day",
        "Absent",
        "Leave",
        "Weak Off",
        "Public Holiday",
        "Work On Week Off",
        "Work On Public Holiday",
      ];

      const rows = (
        selectedEmployees.length > 0 ? selectedEmployees : allAttendance
      ).map((emp) => {
        const row: any[] = [emp.employee_name || "-"];

        sortedDates.forEach((date) => {
          const formattedDate = formatDate(date);
          const attendance = emp.presentDates?.find(
            (a) => a.date === formattedDate,
          );

          let cellValue = "-";
          if (attendance) {
            const statusId = attendance.day_status;
            const status = DAY_STATUS[statusId];

            cellValue = status;
          }

          row.push(cellValue);
        });

        row.push(emp.total_working_time_sum ?? "00:00:00");
        row.push(emp.net_working_hour_sum ?? "00:00:00");
        row.push(emp.overtime_hour_sum ?? "00:00:00");
        row.push(emp.status_count.P ?? "-");
        row.push(emp.status_count.HD ?? "-");
        row.push(emp.status_count.A ?? "-");
        row.push(emp.status_count.L ?? "-");
        row.push(emp.status_count.WO ?? "-");
        row.push(emp.status_count.PH ?? "-");
        row.push(emp.status_count.WOWO ?? "-");
        row.push(emp.status_count.WOPH ?? "-");

        return row;
      });

      const worksheet = xlsx.utils.aoa_to_sheet([
        ["monthName", "year", ...Array(headers.length - 2).fill("")],
        headers,
        ...rows,
      ]);

      worksheet["A1"].v =
        monthOptions.find((m) => m.value === selectedMonth)?.label ?? "";
      worksheet["B1"].v = selectedYear;

      worksheet["!cols"] = [
        { wpx: 180 },
        ...sortedDates.map(() => ({ wpx: 110 })),
        { wpx: 160 },
        { wpx: 140 },
        { wpx: 140 },
        { wpx: 160 },
        { wpx: 120 },
      ];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "Process Attendance Report",
      );

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      saveAsExcelFile(
        excelBuffer,
        `Process_Attendance_${monthOptions.find((m) => m.value === selectedMonth)?.label}_${selectedYear}`,
      );

      toast.success("Attendance Excel exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export attendance data");
    } finally {
      setLoading(false);
    }
  };

  const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, `${fileName}_${Date.now()}${EXCEL_EXTENSION}`);
  };

  const printTable = () => {
    const dataToPrint =
      selectedEmployees.length > 0 ? selectedEmployees : attendanceData;

    if (!dataToPrint || dataToPrint.length === 0) {
      toast.info("No data available to print");
      return;
    }

    const dateHeaders = allDates
      .map((d) => `<th>${formatDateDisplay(d)}</th>`)
      .join("");

    const headers = `
      <th>Employee Name</th>
      ${dateHeaders}
      <th>Total Working Time</th>
      <th>Net Working Time</th>
      <th>Overtime Hours</th>
      <th>Present</th>
      <th>Half Day</th>
      <th>Absent</th>
      <th>Leave</th>
      <th>Weak Off</th>
      <th>Public Holiday</th>
      <th>Work On Weak Off</th>
      <th>Work On Public Holiday</th>
    `;

    const rows = dataToPrint
      .map((emp) => {
        const dateCells = allDates
          .map((date) => {
            const formattedDate = formatDate(date);
            const attendance = emp.presentDates.find(
              (a) => a.date == formattedDate,
            );
            if (!attendance) {
              return "<td>-</td>";
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

            return `<td><div style={{ color: ${statusColor}, fontWeight: 600 }}>
                        ${status}
                      </div></td>`;
          })
          .join("");

        return `
        <tr>
          <td>${emp.employee_name ?? "-"}</td>
          ${dateCells}
          <td>${emp.total_working_time_sum ?? "00:00:00"}</td>
          <td>${emp.net_working_hour_sum ?? "00:00:00"}</td>
          <td>${emp.overtime_hour_sum ?? "00:00:00"}</td>
          <td>${emp.status_count.P ?? "-"}</td>
          <td>${emp.status_count.HD ?? "-"}</td>
          <td>${emp.status_count.A ?? "-"}</td>
          <td>${emp.status_count.L ?? "-"}</td>
          <td>${emp.status_count.WO ?? "-"}</td>
          <td>${emp.status_count.PH ?? "-"}</td>
          <td>${emp.status_count.WOWO ?? "-"}</td>
          <td>${emp.status_count.WOPH ?? "-"}</td>
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
    const supportURL = `${baseURL}/ProcessAttendanceMonthlySlip/${selectedEmployeesIds}/${selectedMonth}/${selectedYear}`;
    const myWindow = window.open(supportURL, "_blank");
  };

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
              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (attendanceData.length === 0) return;

                  canShare
                    ? exportExcel()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i
                  className="pi pi-file-excel"
                  style={{ marginRight: "4px" }}
                />
                Export Excel
              </li>

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
              {monthOptions.find((m) => m.value === selectedMonth)?.label} |
              Year: {selectedYear}
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

              <Column
                field="employee_name"
                header="Employee Name"
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                headerStyle={{ whiteSpace: "pre-wrap", width: "125px" }}
                body={(row) => <span>{row.employee_name || "-"}</span>}
              />

              {allDates.map((date) => {
                const formattedDate = formatDate(date);

                const dayName = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });

                const dayNumber = String(date.getDate()).padStart(2, "0");

                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <Column
                    key={formattedDate}
                    header={
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
                    }
                    headerStyle={{ textAlign: "center", width: "120px" }}
                    bodyStyle={{ textAlign: "center" }}
                    body={(rowData: IProcessAttendance) => {
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
                          style={{ cursor: "pointer" }} // 👈 pointer cursor
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
                    }}
                  />
                );
              })}
              <Column
                field="total_working_time_sum"
                header={
                  <span>
                    Total Working <br /> Time
                  </span>
                }
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-center"}
                body={(row) => row.total_working_time_sum}
              />
              <Column
                field="net_working_hour_sum"
                header={
                  <span>
                    Net Working <br /> Time
                  </span>
                }
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-center"}
                body={(row) => row.net_working_hour_sum}
              />
              <Column
                field="overtime_hour_sum"
                header={
                  <span>
                    Overtime <br /> Hours
                  </span>
                }
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-center"}
                body={(row) => row.overtime_hour_sum}
              />
              <Column
                field="present"
                header={<span>Present</span>}
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) => rowData.status_count.P}
              />
              <Column
                field="half_day"
                header={<span>Half Day</span>}
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) => rowData.status_count.HD}
              />
              <Column
                field="absent"
                header={<span>Absent</span>}
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) => rowData.status_count.A}
              />
              <Column
                field="leave"
                header={<span>Leave</span>}
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) => rowData.status_count.L}
              />
              <Column
                field="week_off"
                header={<span>Week Off</span>}
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) => rowData.status_count.WO}
              />
              <Column
                field="holiday"
                header={
                  <span>
                    Public <br /> Holiday
                  </span>
                }
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) => rowData.status_count.PH}
              />
              <Column
                field="work_on_week_off"
                header={
                  <span>
                    Work On <br /> Week Off
                  </span>
                }
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) =>
                  rowData.status_count.WOWO
                }
              />
              <Column
                field="work_on_public_holiday"
                header={
                  <span>
                    Work On <br /> Public Holiday
                  </span>
                }
                headerStyle={{ width: "120px" }}
                sortable
                filter
                filterPlaceholder="Search"
                headerClassName="center-header"
                bodyClassName={"text-end"}
                body={(rowData: IProcessAttendance) =>
                  rowData.status_count.WOPH
                }
              />
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
