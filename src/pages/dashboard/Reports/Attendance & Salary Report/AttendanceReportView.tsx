import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import AttendanceDayWiseDetails from "./AttendanceDayWiseDetails";
import {
  exportAllAttendanceData,
  fetchAttendanceForExport,
  fetchAttendanceReport,
  IAttendanceHistory,
} from "./AttendanceReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface ITeamAttendanceReports {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  onHide?: () => void;
}

const getNestedValue = (obj: any, path: string): any => {
  try {
    return (
      path.split(".").reduce((acc, part) => {
        if (acc == null) return undefined;
        return acc[part];
      }, obj) ?? ""
    );
  } catch {
    return "";
  }
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date: Date): string => {
  return String(date.getDate()).padStart(2, "0"); // Returns DD (e.g., "24")
};

const parseWorkingHoursToMinutes = (timeStr: string): number => {
  try {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;
    return hours * 60 + minutes + seconds / 60;
  } catch {
    return 0;
  }
};

const formatMinutesToHHMMSS = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return "00:00:00";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.round((totalMinutes % 1) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const calculateTotalWorkingMinutes = (
  customer: IAttendanceHistory,
  allDates: Date[],
): number => {
  let totalMinutes = 0;
  allDates.forEach((date) => {
    const formattedDate = formatDate(date);
    const attendance = customer.attendanceData?.find(
      (a) => a.date === formattedDate,
    );
    if (attendance?.messages) {
      attendance.messages
        .filter((m) => m.attendanceDate === formattedDate)
        .forEach((m) => {
          if (m.total_working_hour) {
            totalMinutes += parseWorkingHoursToMinutes(m.total_working_hour);
          }
        });
    }
  });
  return Math.round(totalMinutes * 100) / 100;
};

// const calculateSalary = (
//   customer: IAttendanceHistory,
//   allDates: Date[]
// ): string => {
//   const totalMinutes = calculateTotalWorkingMinutes(customer, allDates);
//   const totalHours = totalMinutes / 60;

//   const rawSalary = String(customer.salary || "0");
//   const numericSalary = parseFloat(rawSalary.replace(/[^0-9.]/g, "")) || 0;
//   const symbol = rawSalary.replace(/[0-9.,\s]/g, "") || "";

//   const calculatedSalary = Math.round(totalHours * numericSalary * 100) / 100;
//   return `${symbol}${calculatedSalary}`;
// };

const getDateRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const TeamAttendanceReportsView = ({
  selectedDates,
  selectedTeamMembers,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  onHide,
}: ITeamAttendanceReports) => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<IAttendanceHistory[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    IAttendanceHistory[]
  >([]);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const currentOffset = useRef(0);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("attendance_salary");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
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

  // const handleClickOutside = (event: MouseEvent) => {
  //   const target = event.target as HTMLElement;

  //   const clickedOnButton = target.closest('.source-of-type-list-grid-options');
  //   if (clickedOnButton) return;

  //   setIsExportDropdownOpen(false);
  // };

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  const handleApplyFilters = (data: any) => {
    const [startDate, endDate] = getCurrentMonthDateRange();

    const updatedFilters = {
      ...data,
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("attendance_salary", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalSearch = () => {
    const value = searchInputRef.current?.value || "";

    setGlobalSearchText(value);
  };

  const getCurrentMonthDateRange = () => {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return [startOfMonth, endOfMonth];
  };

  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("attendance_salary", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ATTEDANCESALARY_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.ATTEDANCESALARY_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
      total_working_hours: { value: null, matchMode: "contains" },
      salary: { value: null, matchMode: "contains" },
    },
  });

  const [attendanceReport, setAttendanceReport] = useState<
    IAttendanceHistory[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IAttendanceHistory[]>>(null);

  // const [startDate, endDate] = selectedDates;
  // const allDates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);

  // Add guard + logging
  const allDates = useMemo(() => {
    if (!filters.selectedDateArray || filters.selectedDateArray.length !== 2) {
      console.warn("selectedDates invalid length", filters.selectedDateArray);
      return [];
    }

    let start = filters.selectedDateArray[0];
    let end = filters.selectedDateArray[1];

    // Accept both string and Date
    if (typeof start === "string") start = new Date(start);
    if (typeof end === "string") end = new Date(end);

    if (
      !(start instanceof Date) ||
      !(end instanceof Date) ||
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      console.warn("Invalid date after parsing", {
        raw: filters.selectedDateArray,
        parsedStart: start,
        parsedEnd: end,
      });
      return [];
    }

    // Optional: normalize to start-of-day
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      console.warn("Start date after end date – swapping", { start, end });
      [start, end] = [end, start];
    }

    return getDateRange(start, end);
  }, [filters.selectedDateArray]);

  type AttendanceColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: IAttendanceHistory) => React.ReactNode;
  };

  const baseColumnDefs: AttendanceColumnDef[] = useMemo(
    () => [
      {
        key: "username",
        label: "Team Member",
        header: (
          <span>
            Team <br /> Member
          </span>
        ),
        width: "150px",
        body: (rowData) => rowData.username || "-",
      },
      {
        key: "total_working_hours",
        label: "Actual Working Hours",
        header: (
          <span>
            Actual <br />
            Working Hours
          </span>
        ),
        width: "180px",
        body: (rowData) =>
          formatMinutesToHHMMSS(
            calculateTotalWorkingMinutes(rowData, allDates),
          ) || "00:00:00",
      },
      {
        key: "company_paid_leave",
        label: "Company Paid Leave",
        header: (
          <span>
            Company <br />
            Paid Leave
          </span>
        ),
        width: "160px",
        body: (rowData) => rowData.companyPaidLeave ?? "-",
      },
      {
        key: "employee_paid_leave",
        label: "Employee Paid Leave",
        header: (
          <span>
            Employee <br />
            Paid Leave
          </span>
        ),
        width: "160px",
        body: (rowData) => rowData.employeePaidLeave ?? "-",
      },
      {
        key: "paid_days_paid_hours",
        label: "Paid Days / Total Paid Hours",
        header: (
          <span>
            Paid Days /<br /> Total Paid Hours
          </span>
        ),
        width: "200px",
        body: (rowData) =>
          `${rowData.totalPaidDays ?? 0}/${rowData.totalPaidHours ?? "00:00:00"}`,
      },
      {
        key: "salary",
        label: "Salary",
        header: "Salary",
        width: "160px",
        body: (rowData: IAttendanceHistory) => rowData.finalSalary ?? "0",
      },
    ],
    [allDates],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("attendance_report", baseColumnDefs);

  const getExportCellValue = (
    col: AttendanceColumnDef,
    customer: IAttendanceHistory,
  ): string => {
    switch (col.key) {
      case "username":
        return customer.username ?? "-";
      case "total_working_hours":
        return (
          formatMinutesToHHMMSS(
            calculateTotalWorkingMinutes(customer, allDates),
          ) || "00:00:00"
        );
      case "company_paid_leave":
        return String(customer.companyPaidLeave ?? "-");
      case "employee_paid_leave":
        return String(customer.employeePaidLeave ?? "-");
      case "paid_days_paid_hours":
        return `${customer.totalPaidDays ?? 0}/${customer.totalPaidHours ?? "00:00:00"}`;
      case "salary":
        return String(customer.finalSalary ?? "0");
      default:
        return "-";
    }
  };

  const dataArray: IAttendanceHistory[] = useMemo(() => {
    return Array.isArray(attendanceReport) ? attendanceReport : [];
  }, [attendanceReport]);

  const filteredData = useMemo(() => {
    let data = [...dataArray];

    // Apply filters
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        data = data.filter((item) => {
          let fieldValue: any;
          if (field === "total_working_hours") {
            fieldValue = formatMinutesToHHMMSS(
              calculateTotalWorkingMinutes(item, allDates),
            );
            // } else if (field === "salary") {
            //   fieldValue = calculateSalary(item, allDates);
          } else {
            fieldValue = getNestedValue(item, field);
          }
          if (fieldValue == null) return false;
          const fieldStr = fieldValue.toString().toLowerCase();

          switch (matchMode) {
            case "contains":
              return fieldStr.includes(filterValue);
            case "notContains":
              return !fieldStr.includes(filterValue);
            case "startsWith":
              return fieldStr.startsWith(filterValue);
            case "endsWith":
              return fieldStr.endsWith(filterValue);
            case "equals":
              return fieldStr === filterValue;
            case "notEquals":
              return fieldStr !== filterValue;
            default:
              return true;
          }
        });
      }
    });

    // Apply sort
    if (lazyState.sortField) {
      data.sort((a, b) => {
        let aValue: any, bValue: any;
        if (lazyState.sortField === "total_working_hours") {
          aValue = calculateTotalWorkingMinutes(a, allDates);
          bValue = calculateTotalWorkingMinutes(b, allDates);
          // } else if (lazyState.sortField === "salary") {
          //   aValue = calculateSalary(a, allDates);
          //   bValue = calculateSalary(b, allDates);
        } else {
          aValue = getNestedValue(a, lazyState.sortField!);
          bValue = getNestedValue(b, lazyState.sortField!);
        }
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) data.reverse();
    }

    return data;
  }, [
    dataArray,
    lazyState.filters,
    lazyState.sortField,
    lazyState.sortOrder,
    allDates,
  ]);

  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadAttendance(0, 50, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
  ]);

  const loadAttendance = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchAttendanceReport(
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        offset,
        limit,
        debouncedSearchText,
      );

      if (newData.length < limit) setHasMore(false);

      if (reset) {
        setCustomers(newData);
      } else {
        setCustomers((prev) => [...prev, ...newData]);
      }

      currentOffset.current = offset + newData.length;
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  };

  const handleRefresh = async () => {
    currentOffset.current = 0;
    setHasMore(true);
    setCustomers([]);
    loadAttendance(0, 50, true);
  };

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  const onFilter = (event: DataTableFilterEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: 0,
      filters: event.filters,
    }));
  };

  const onSelectionChange = (event: { value: IAttendanceHistory[] }) => {
    setSelectedCustomers(event.value);
    setSelectAll(event.value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  // ──────────────────────────────────────────────────────────────
  //  EXPORT COLUMNS (derived from visibleColumns; date columns are
  //  not part of the toggle system so they're always included at
  //  their original position, right after the Team Member column)
  // ──────────────────────────────────────────────────────────────
  const buildExportColumns = () => [
    ...visibleColumns
      .filter((c) => c.key === "username")
      .map((col) => ({ title: col.label, dataKey: col.key })),
    ...allDates.map((date) => ({
      title: formatDateDisplay(date),
      dataKey: formatDate(date),
    })),
    ...visibleColumns
      .filter((c) => c.key !== "username")
      .map((col) => ({ title: col.label, dataKey: col.key })),
  ];

  const buildExportRow = (customer: IAttendanceHistory) => {
    const row: Record<string, any> = {};

    visibleColumns.forEach((col) => {
      row[col.key] = getExportCellValue(col, customer);
    });

    // All date columns
    allDates.forEach((date) => {
      const formattedDate = formatDate(date);
      const attendance = customer.attendanceData?.find(
        (a) => a.date === formattedDate,
      );
      let cellValue = "-";
      if (attendance) {
        const status =
          attendance.status === "L" && attendance.leave_type
            ? `${attendance.status} (${attendance.leave_type})`
            : attendance.status;
        const times =
          attendance.messages
            ?.filter((m) => m.attendanceDate === formattedDate)
            .map((m) => m.attendanceTime) || [];

        cellValue = status; // show status first
        if (times.length > 0) {
          cellValue += ` (${times.join(", ")})`; // optional: include times
        }
      }
      row[formattedDate] = cellValue;
    });

    return row;
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });

    // Use customers (all loaded data) or selectedCustomers
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : customers;

    if (!dataToExport || dataToExport.length === 0) {
      toast.info("No data available to export");
      return;
    }

    const tableData = dataToExport.map((customer) => buildExportRow(customer));

    autoTable(doc, {
      columns: buildExportColumns(),
      body: tableData,
      theme: "grid",
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
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text("Team Attendance Report", data.settings.margin.left, 10);
        doc.setFontSize(7);
        doc.text(
          "Note: Scroll or pan horizontally in your PDF viewer to see all columns.",
          data.settings.margin.left,
          15,
        );
      },
    });

    doc.save(`team_attendance_${Date.now()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);

      let allAttendance: IAttendanceHistory[] = [];

      // ✅ If rows are selected → use only selected rows
      if (selectedCustomers.length > 0) {
        allAttendance = selectedCustomers;
      } else {
        // Otherwise fetch all from backend
        allAttendance = await exportAllAttendanceData(
          (offset, limit) =>
            fetchAttendanceForExport(
              filters.selectedDateArray,
              filters.checkedOptionsUser,
              MobileToken,
              getID,
              MobileFlag,
              offset,
              limit,
              debouncedSearchText,
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

      const EXCEL_COL_WIDTH: Record<string, number> = {
        username: 180,
        total_working_hours: 160,
        company_paid_leave: 140,
        employee_paid_leave: 140,
        paid_days_paid_hours: 160,
        salary: 120,
      };

      const leadingColumns = visibleColumns.filter((c) => c.key === "username");
      const trailingColumns = visibleColumns.filter(
        (c) => c.key !== "username",
      );

      const headers = [
        ...leadingColumns.map((col) => col.label),
        ...sortedDates.map(formatDateDisplay),
        ...trailingColumns.map((col) => col.label),
      ];

      const rows = (
        selectedCustomers.length > 0 ? selectedCustomers : allAttendance
      ).map((customer) => {
        const row: any[] = leadingColumns.map(() => customer.username || "-");

        sortedDates.forEach((date) => {
          const formattedDate = formatDate(date);
          const attendance = customer.attendanceData?.find(
            (a) => a.date === formattedDate,
          );

          let cellValue = "-";
          if (attendance) {
            const status =
              attendance.status === "L" && attendance.leave_type
                ? `${attendance.status} (${attendance.leave_type})`
                : attendance.status;
            const times =
              attendance.messages
                ?.filter((m) => m.attendanceDate === formattedDate)
                .map((m) => m.attendanceTime) || [];

            cellValue = status;
            if (times.length) {
              const pairs: string[] = [];
              for (let i = 0; i < times.length; i += 2) {
                pairs.push(times.slice(i, i + 2).join(" - "));
              }
              cellValue += ` (${pairs.join(", ")})`;
            }
          }

          row.push(cellValue);
        });

        trailingColumns.forEach((col) => {
          row.push(getExportCellValue(col, customer));
        });

        return row;
      });

      const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);

      worksheet["!cols"] = [
        ...leadingColumns.map(() => ({ wpx: EXCEL_COL_WIDTH.username })),
        ...sortedDates.map(() => ({ wpx: 110 })),
        ...trailingColumns.map((col) => ({
          wpx: EXCEL_COL_WIDTH[col.key] ?? 140,
        })),
      ];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      saveAsExcelFile(excelBuffer, "Team_Attendance_Report");

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
    saveAs(data, `${fileName}_export_${Date.now()}${EXCEL_EXTENSION}`);
  };

  const printTable = () => {
    const dataToPrint =
      selectedCustomers.length > 0 ? selectedCustomers : customers;

    if (!dataToPrint || dataToPrint.length === 0) {
      toast.info("No data available to print");
      return;
    }

    const leadingColumns = visibleColumns.filter((c) => c.key === "username");
    const trailingColumns = visibleColumns.filter(
      (c) => c.key !== "username",
    );

    const dateHeaders = allDates
      .map((d) => `<th>${formatDateDisplay(d)}</th>`)
      .join("");

    const headers = `
    ${leadingColumns.map((col) => `<th>${col.label}</th>`).join("")}
    ${dateHeaders}
    ${trailingColumns.map((col) => `<th>${col.label}</th>`).join("")}
  `;

    const rows = dataToPrint
      .map((customer) => {
        const dateCells = allDates
          .map((date) => {
            const formatted = formatDate(date);
            const att = customer.attendanceData?.find(
              (a) => a.date === formatted,
            );
            let cellContent = "-";
            if (att) {
              const status =
                att.status === "L" && att.leave_type
                  ? `${att.status} (${att.leave_type})`
                  : att.status;
              const messages =
                att.messages
                  ?.filter((m) => m.attendanceDate === formatted)
                  .map((m) => m.attendanceTime) || [];

              cellContent = `<div>${status}</div>`;
              if (messages.length) {
                cellContent += `<div>${messages.join(", ")}</div>`;
              }
            }
            return `<td>${cellContent}</td>`;
          })
          .join("");

        const leadingCells = leadingColumns
          .map(() => `<td>${customer.username ?? "-"}</td>`)
          .join("");
        const trailingCells = trailingColumns
          .map((col) => `<td>${getExportCellValue(col, customer)}</td>`)
          .join("");

        return `
      <tr>
        ${leadingCells}
        ${dateCells}
        ${trailingCells}
      </tr>
    `;
      })
      .join("");

    const printContent = `
    <html>
      <head>
        <title>Team Attendance Report</title>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 10pt; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
          th { background-color: #e6f2ff; font-weight: bold; }
          h1 { text-align: center; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h1>Team Attendance Report</h1>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
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

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Team Attendance
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
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Team Attendance
        </h3>

        {/* {MobileFlag ? null : ( */}
        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
          <div
            className="d-flex gap-2 align-items-center"
            style={{
              width: MobileFlag ? "285px" : "355px",
              zIndex: "999",
              position: "relative",
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="form-control"
              placeholder={
                MobileFlag
                  ? "Search in This Report"
                  : "Search Anything in This Report"
              }
              style={{
                width: MobileFlag ? "220px" : "300px",
                marginTop: "10px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGlobalSearch();
                }
              }}
            />
            {globalSearchText && (
              <span
                className="clear-icon"
                onClick={() => {
                  setGlobalSearchText("");
                  if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#5f6368"
                >
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            )}
            <Button
              icon="pi pi-search"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleGlobalSearch}
              tooltip="Search"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />
          </div>
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
              className={`labelDropLeft ${
                isExportDropdownOpen ? "isVisible" : "isHidden"
              }`}
              style={{
                width: "170px",
                position: "absolute",
                right: "0",
                top: "0",
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

                  if (customers.length === 0) return;

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

                  if (customers.length === 0) return;

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

                  if (customers.length === 0) return;

                  canPrint
                    ? printTable()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i className="pi pi-print" style={{ marginRight: "4px" }} />
                Print
              </li>
            </ul>
          </div>

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
        {/* )} */}
      </div>

      <div className="report_card" style={{ height: "65vh" }}>
        <DataTable
          ref={dt}
          value={customers}
          lazy
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollable
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 52,
            lazy: true,
            onLazyLoad: (event: { first: number; last: number }) => {
              if (event.last >= customers.length - 1 && hasMore && !loading) {
                loadAttendance(currentOffset.current, 50);
              }
            },
            appendOnly: true,
            // showLoader: true,
            delay: 0,
          }}
          filterDisplay="row"
          dataKey="username"
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No data found"
        >
          {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && (
            <Column
              selectionMode="multiple"
              headerStyle={{
                width: "3rem",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}

          {visibleColumns
            .filter((col) => col.key === "username")
            .map((col) => (
              <Column
                key={col.key}
                field={col.key}
                header={col.header}
                sortable
                filter
                filterField={col.key}
                filterPlaceholder="Search"
                filterMatchMode={col.filterMatchMode || "contains"}
                headerStyle={{ width: col.width || "150px" }}
                body={col.body}
              />
            ))}

          {allDates.map((date) => {
            const formattedDate = formatDate(date);
            const displayDate = formatDateDisplay(date);
            return (
              <Column
                key={formattedDate}
                header={displayDate}
                headerStyle={{ textAlign: "center", width: "120px" }}
                bodyStyle={{ textAlign: "center" }}
                body={(rowData: IAttendanceHistory) => {
                  const attendance = rowData.attendanceData?.find(
                    (a) => a.date === formattedDate,
                  );
                  if (!attendance) return "-";

                  const statusColor =
                    attendance.status === "P"
                      ? "green"
                      : attendance.status === "A"
                        ? "red"
                        : attendance.status === "L"
                          ? "orange"
                          : attendance.status === "Week Off"
                            ? "blue"
                            : "black";

                  const messages =
                    attendance.messages?.filter(
                      (m) => m.attendanceDate === formattedDate,
                    ) || [];

                  return (
                    <div
                      style={{ cursor: "pointer" }} // 👈 pointer cursor
                      onClick={() =>
                        setDayDetailModal({
                          visible: true,
                          username: rowData.username ?? "",
                          date: formattedDate,
                          displayDate: displayDate,
                          attendance: attendance,
                          companyTeamInfo: {
                            id: attendance?.messages?.[0]
                              ?.a_application_login_id,
                            username: rowData.username,
                          },
                        })
                      }
                    >
                      <div style={{ color: statusColor, fontWeight: 600 }}>
                        {attendance.status === "L" && attendance.leave_type
                          ? `${attendance.status} (${attendance.leave_type})`
                          : attendance.status}
                      </div>
                      {messages.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            color:
                              m.attendance_status === 1
                                ? "green"
                                : m.attendance_status === 2
                                  ? "red"
                                  : "black",
                          }}
                        >
                          {m.attendanceTime}
                          {idx < messages.length - 1 ? ", " : ""}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            );
          })}

          {visibleColumns
            .filter((col) => col.key !== "username")
            .map((col) => (
              <Column
                key={col.key}
                field={col.key}
                header={col.header}
                sortable
                filter
                filterField={col.key}
                filterPlaceholder="Search"
                filterMatchMode={col.filterMatchMode || "contains"}
                headerStyle={{ width: col.width || "150px" }}
                bodyStyle={{
                  textAlign: col.key === "salary" ? "right" : undefined,
                }}
                body={col.body}
              />
            ))}
        </DataTable>
      </div>
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 5]}
          pageId={1}
          initialFilterData={{
            ...filters.filterData,
            category: filters.selectedCategoryId,
            product: filters.selectedProductId,
            contactId: filters.selectedContactId,
            productId: filters.selectedProductSearchId,
            orderlistselect: filters.selectedOrderListId,
          }}
          initialCheckedOptions={filters.checkedOptions}
          initialCheckedSourceTypes={filters.checkedSourceTypes}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          initialCheckedOptionsStageStatus={filters.checkedOptionsStageStatus}
          initialCheckedOptionsSeries={filters.checkedOptionsSeries}
          initialSelectedStockTypeId={filters.selectedStockTypeId}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
          initialSelectedActiveId={filters.selectedActiveId}
          initialselectedOrderListId={filters.selectedOrderListId}
          initialSelectedDays={filters.selectedDays}
          selectedWarehouseIds={filters.selectedWarehouseIds}
          initialReferenceWiseContact={filters.referenceWiseContact}
          isApplyReport={1}
        />
      )}
      <AttendanceDayWiseDetails
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

export default TeamAttendanceReportsView;
