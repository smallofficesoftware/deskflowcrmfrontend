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
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import CheckBoxFilterModal, {
  monthOptions,
} from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchSalaryRegister,
  ISalaryRegister,
} from "./SalaryRegisterReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropsSalaryRegister {
  selectedTeamMembers?: string[] | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  onHide?: () => void;
  selectedDayMonthYear?: number[] | null;
}

export const formatDateToDDMMYYYY = (dateString: string) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
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

// const calculateSalary = (
//   customer: ISalaryRegister,
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

const months: any = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

const SalaryRegisterReport = ({
  selectedTeamMembers,
  MobileToken,
  getID,
  MobileFlag,
  onHide,
  selectedDayMonthYear,
}: IPropsSalaryRegister) => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [salaries, setSalaries] = useState<ISalaryRegister[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedSalaries, setSelectedSalaries] = useState<ISalaryRegister[]>(
    [],
  );
  const [selectedSalariesIds, setSelectedSalariesIds] = useState<number[]>([]);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const currentOffset = useRef(0);

  const [hasData, setHasData] = useState<boolean>(false);
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("salary_register");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);



  const canView = useCheckUserPermission(
    PAGE_ID.TEAM_SALARY,
    PERMISSION_TYPE.VIEW,
  );
  const canShare = useCheckUserPermission(
    PAGE_ID.TEAM_SALARY,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.TEAM_SALARY,
    PERMISSION_TYPE.PRINT,
  );

  //   useEscapeKey(() => {
  //     if (!isExportDropdownOpen) {
  //       onHide?.();
  //     } else {
  //       setIsExportDropdownOpen(false);
  //     }
  //   })

  const searchInputRef = useRef<HTMLInputElement>(null);

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

    setFilters("salary_register", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };

  useEffect(() => {
    if (!filters.filterData?.month || !filters.filterData?.year) {
      const [month, year] = getCurrentMonthAndYear();

      setFilters("salary_register", {
        ...filters,
        filterData: {
          ...filters.filterData,
          month: filters.filterData?.month || month,
          year: filters.filterData?.year || year,
        },
      });
    }
  }, []);

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

  const [attendanceReport, setAttendanceReport] = useState<ISalaryRegister[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<ISalaryRegister[]>>(null);

  // const [startDate, endDate] = selectedDates;
  // const allDates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (canView) {
      setSalaries([]);
      setSelectedSalaries([]);
      currentOffset.current = 0;
      setHasMore(true);
      loadAttendance(0, 50, true);
    }
  }, [activeDayMonthYear, filters.checkedOptionsUser, canView]);

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
      const newData = await fetchSalaryRegister(
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        offset,
        limit,
        activeDayMonthYear,
      );

      if (newData.length < limit) setHasMore(false);

      if (reset) {
        setSalaries(newData);
      } else {
        setSalaries((prev) => [...prev, ...newData]);
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
    setSalaries([]);
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

  const onSelectionChange = (event: { value: ISalaryRegister[] }) => {
    setSelectedSalaries(event.value);
    setSelectedSalariesIds(event.value.map((salary) => salary.employee_id));
    setSelectAll(event.value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedSalariesIds(salaries.map((salary) => salary.employee_id));
      setSelectedSalaries([...salaries]);
    } else {
      setSelectAll(false);
      setSelectedSalaries([]);
      setSelectedSalariesIds([]);
    }
  };

  type SalaryColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    className?: string;
    bodyClassName?: string;
    bodyStyleOverride?: React.CSSProperties;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: SalaryColumnDef[] = useMemo(
    () => [
      {
        key: "year",
        label: "Month-Year",
        header: <span>Month-Year</span>,
        width: "150px",
        bodyStyleOverride: { background: "#F8F9FA" },
        body: (rowData: any) =>
          `${months[rowData.month]} - ${rowData.year}` || "-",
      },
      {
        key: "employee_name",
        label: "Employee Name",
        header: <span>Employee Name</span>,
        width: "160px",
        bodyStyleOverride: { background: "#F8F9FA" },
        body: (rowData: any) => rowData.employee_name ?? "-",
      },
      {
        key: "added_date",
        label: "Added Date",
        header: <span>Added Date</span>,
        width: "160px",
        bodyStyleOverride: { background: "#F8F9FA" },
        bodyClassName: "text-center",
        body: (rowData: any) => formatDateToDDMMYYYY(rowData.added_date) ?? "-",
      },
      {
        key: "total_present_day",
        label: "Present Day",
        header: <span>Present Day</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_present_day ?? "-",
      },
      {
        key: "half_day",
        label: "Half Day",
        header: <span>Half Day</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.half_day ?? "-",
      },
      {
        key: "holiday",
        label: "Holiday",
        header: <span>Holiday</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.holiday ?? "-",
      },
      {
        key: "total_week_off",
        label: "Week Off",
        header: <span>Week Off</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_week_off ?? "-",
      },
      {
        key: "total_leave",
        label: "Leave",
        header: <span>Leave</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_leave ?? "-",
      },
      {
        key: "total_absent",
        label: "Absent",
        header: <span>Absent</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_absent ?? "-",
      },
      {
        key: "total_day",
        label: "Salaried Days",
        header: <span>Salaried Days</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_day ?? "-",
      },
      {
        key: "working_hour",
        label: "Working Hour",
        header: <span>Working Hour</span>,
        width: "160px",
        className: "attendance-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.working_hour ?? "-",
      },
      {
        key: "ctc",
        label: "CTC",
        header: <span>CTC</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ctc ?? "-",
      },
      {
        key: "gross_salary",
        label: "Gross Salary",
        header: <span>Gross Salary</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.gross_salary ?? "-",
      },
      {
        key: "per_day_salary",
        label: "Per Day Salary",
        header: <span>Per Day Salary</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.per_day_salary ?? "-",
      },
      {
        key: "fxs_basic",
        label: "Fix Basic",
        header: <span>Fix Basic</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.fxs_basic ?? "-",
      },
      {
        key: "fxs_hra",
        label: "Fix HRA",
        header: <span>Fix HRA</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.fxs_hra ?? "-",
      },
      {
        key: "fxs_other",
        label: "Fix Other",
        header: <span>Fix Other</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.fxs_other ?? "-",
      },
      {
        key: "fxs_total_earning",
        label: "Fix Total Earning",
        header: <span>Fix Total Earning</span>,
        width: "160px",
        className: "payroll-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.fxs_total_earning ?? "-",
      },
      {
        key: "dws_basic",
        label: "Basic",
        header: <span>Basic</span>,
        width: "160px",
        className: "calculation-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.dws_basic ?? "-",
      },
      {
        key: "dws_hra",
        label: "HRA",
        header: <span>HRA</span>,
        width: "160px",
        className: "calculation-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.dws_hra ?? "-",
      },
      {
        key: "dws_other",
        label: "Other",
        header: <span>Other</span>,
        width: "160px",
        className: "calculation-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.dws_other ?? "-",
      },
      {
        key: "dws_total_earning",
        label: "Total Earning (Dw)",
        header: <span>Total Earning</span>,
        width: "160px",
        className: "calculation-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.dws_total_earning ?? "-",
      },
      {
        key: "regular_ot_hours",
        label: "Reg. OT Hours",
        header: <span>Reg. OT Hours</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.regular_ot_hours ?? "-",
      },
      {
        key: "regular_ot_payable_amt",
        label: "Reg. OT Amt.",
        header: <span>Reg. OT Amt.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.regular_ot_payable_amt ?? "-",
      },
      {
        key: "extra_ot_hours",
        label: "Extra OT Hours",
        header: <span>Extra OT Hours</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.extra_ot_hours ?? "-",
      },
      {
        key: "extra_ot_payable_amt",
        label: "Extra OT Amt.",
        header: <span>Extra OT Amt.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.extra_ot_payable_amt ?? "-",
      },
      {
        key: "earn_ot_hours",
        label: "Total OT Hours",
        header: <span>Total OT Hours</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.earn_ot_hours ?? "-",
      },
      {
        key: "earn_ot_payable_amt",
        label: "Total OT Amt.",
        header: <span>Total OT Amt.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.earn_ot_payable_amt ?? "-",
      },
      {
        key: "earn_head_first",
        label: "Earn. Head F.",
        header: <span>Earn. Head F.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.earn_head_first ?? "-",
      },
      {
        key: "earn_head_second",
        label: "Earn. Head S.",
        header: <span>Earn. Head S.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.earn_head_second ?? "-",
      },
      {
        key: "earn_head_third",
        label: "Earn. Head T.",
        header: <span>Earn. Head T.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.earn_head_third ?? "-",
      },
      {
        key: "bonus_amount",
        label: "Bonus Amt.",
        header: <span>Bonus Amt.</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.bonus_amount ?? "-",
      },
      {
        key: "earn_sub_total",
        label: "Sub Total",
        header: <span>Sub Total</span>,
        width: "160px",
        className: "earning-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.earn_sub_total ?? "-",
      },
      {
        key: "total_earning",
        label: "Total Earning",
        header: <span>Total Earning</span>,
        width: "160px",
        bodyStyleOverride: { background: "#E6FFF8" },
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_earning ?? "-",
      },
      {
        key: "ded_emp_pf",
        label: "PF",
        header: <span>PF</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_emp_pf ?? "-",
      },
      {
        key: "ded_pradhan_mantri_pf",
        label: "PM PF",
        header: <span>PM PF</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_pradhan_mantri_pf ?? "-",
      },
      {
        key: "ded_esi_employee",
        label: "ESI Employee",
        header: <span>ESI Employee</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_esi_employee ?? "-",
      },
      {
        key: "ded_esi_company",
        label: "ESI Company",
        header: <span>ESI Company</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_esi_company ?? "-",
      },
      {
        key: "ded_pt",
        label: "PT",
        header: <span>PT</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_pt ?? "-",
      },
      {
        key: "ded_insurance",
        label: "Insurance",
        header: <span>Insurance</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_insurance ?? "-",
      },
      {
        key: "ded_first",
        label: "Ded. F.",
        header: <span>Ded. F.</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_first ?? "-",
      },
      {
        key: "ded_second",
        label: "Ded. S.",
        header: <span>Ded. S.</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_second ?? "-",
      },
      {
        key: "ded_third",
        label: "Ded. T.",
        header: <span>Ded. T.</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.ded_third ?? "-",
      },
      {
        key: "total_deduction",
        label: "Total Ded.",
        header: <span>Total Ded.</span>,
        width: "160px",
        className: "deduction-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.total_deduction ?? "-",
      },
      {
        key: "net_bank_pay",
        label: "Net Bank Pay",
        header: <span>Net Bank Pay</span>,
        width: "160px",
        className: "net-pay-section",
        bodyClassName: "text-end",
        body: (rowData: any) => rowData.net_bank_pay ?? "-",
      },
    ],
    [],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("salary_register_report", baseColumnDefs);

  const EXTRA_EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "employee_id", label: "Employee Id" },
    { key: "recovery_mobile", label: "Employee Mobile" },
    { key: "aadhar_card_number", label: "Adhar Number" },
    { key: "pan_card_number", label: "PAN Number" },
  ];

  const getExportCellValue = (col: { key: string }, salary: any): any => {
    switch (col.key) {
      case "year":
        return `${months[salary.month]} - ${salary.year}` || "-";
      case "employee_name":
        return salary.employee_name ?? "-";
      case "added_date":
        return formatDateToDDMMYYYY(salary.added_date) ?? "00/00/0000";
      case "regular_ot_hours":
        return (salary as any).regular_ot_hours ?? "00:00:00";
      case "regular_ot_payable_amt":
        return (salary as any).regular_ot_payable_amt ?? "0";
      case "extra_ot_hours":
        return (salary as any).extra_ot_hours ?? "00:00:00";
      case "extra_ot_payable_amt":
        return (salary as any).extra_ot_payable_amt ?? "0";
      default:
        return salary[col.key] ?? "-";
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });

    // Use customers (all loaded data) or selectedCustomers
    const dataToExport =
      selectedSalaries.length > 0 ? selectedSalaries : salaries;

    if (!dataToExport || dataToExport.length === 0) {
      toast.info("No data available to export");
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    const tableData = dataToExport.map((salary) => {
      const row: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, salary);
      });
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
      willDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont("Poppins", "bold");
        doc.setFontSize(16);
        doc.text("Salary Register", pageWidth / 2, 12, {
          align: "center",
        });

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

    doc.save(`salary_register_${Date.now()}.pdf`);
  };


  const printTable = () => {
    const dataToPrint =
      selectedSalaries.length > 0 ? selectedSalaries : salaries;

    if (!dataToPrint || dataToPrint.length === 0) {
      toast.info("No data available to print");
      return;
    }

    const headers = visibleColumns
      .map((col) => `<th>${col.label}</th>`)
      .join("");

    const rows = dataToPrint
      .map((salary) => {
        const cells = visibleColumns
          .map((col) => `<td>${getExportCellValue(col, salary)}</td>`)
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
            <title>Salary Register</title>
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
            <h1>Salary Register</h1>
            <div class="print-header">
              <div>
                  Printed By : ${String(localStorage.getItem("USERNAME"))}
              </div>

              <div>
                  Printed On : ${formatCurrentDateTime()}
              </div>
          </div>
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

  const handleOpenSalaryRegisterSlip = () => {
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/SalaryRegisterMonthlySlip/${selectedSalariesIds}/${effectiveMonthYear.month}/${effectiveMonthYear.year}`;
    const myWindow = window.open(supportURL, "_blank");
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Salary Register
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
          Salary Register
        </h3>



        {/* {MobileFlag ? null : ( */}
        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
          {/* <div
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
          </div> */}
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
                top: "100%",
                zIndex: 1000,
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              <ExportExcelMenuItem
                reportType="salary_register_report"
                filters={{
                  selectedTeamMembers: filters.checkedOptionsUser,
                  selectedDayMonthYear: activeDayMonthYear,
                }}
                columns={[...visibleColumns, ...EXTRA_EXPORT_COLUMNS]}
                fileName={`Salary_Register_${monthOptions.find((m) => m.value === effectiveMonthYear.month)?.label}_${effectiveMonthYear.year}`}
                canShare={canShare}
                disabled={salaries.length === 0}
                onSelect={() => setIsExportDropdownOpen(false)}
                selectedRows={selectedSalaries}
              />

              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (salaries.length === 0) return;

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

                  if (salaries.length === 0) return;

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

                  if (salaries.length === 0) return;

                  if (selectedSalariesIds.length <= 0) {
                    toast.info(
                      "Please Select Salaries To Generate Salary Slip.",
                    );
                    return;
                  }

                  // canPrint
                  handleOpenSalaryRegisterSlip();
                  //     : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i className="pi pi-print" style={{ marginRight: "4px" }} />
                Salary Register Slip
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

      <div className="report_card" style={{ height: "65vh" }}>
        <DataTable
          ref={dt}
          value={salaries}
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
              if (event.last >= salaries.length - 1 && hasMore && !loading) {
                loadAttendance(currentOffset.current, 50);
              }
            },
            appendOnly: true,
            showLoader: true,
            delay: 0,
          }}
          filterDisplay="row"
          dataKey="id"
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
          selection={selectedSalaries}
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
              bodyStyle={{ textAlign: "center", background: "#F8F9FA" }}
            />
          )}

          {visibleColumns.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.header}
              sortable
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode="contains"
              className={col.className}
              headerStyle={{
                width: col.width || "150px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px", ...col.bodyStyleOverride }}
              bodyClassName={col.bodyClassName}
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
          filtersToShow={[5, 23]}
          pageId={1}
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
    </div>
  );
};

export default SalaryRegisterReport;
