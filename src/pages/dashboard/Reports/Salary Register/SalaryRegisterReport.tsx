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
import CheckBoxFilterModal, {
  monthOptions,
} from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAllSalaryRegisterData,
  fetchSalaryRegister,
  fetchSalaryRegisterForExport,
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

  // ──────────────────────────────────────────────────────────────
  //  EXPORT COLUMNS (for PDF & structure reference)
  // ──────────────────────────────────────────────────────────────
  const exportColumns = [
    { title: "Month-Year", dataKey: "month_year" },
    { title: "Employee Name", dataKey: "employee_name" },
    { title: "Added Date", dataKey: "added_date" },
    { title: "Present Day", dataKey: "total_present_day" },
    { title: "Half Day", dataKey: "half_day" },
    { title: "Week Off", dataKey: "total_week_off" },
    { title: "Leave", dataKey: "total_leave" },
    { title: "Absent", dataKey: "total_absent" },
    { title: "Salaried Days", dataKey: "total_day" },
    { title: "Working Hour", dataKey: "working_hour" },
    { title: "CTC", dataKey: "ctc" },
    { title: "Gross Salary", dataKey: "gross_salary" },
    { title: "Per Day Salary", dataKey: "per_day_salary" },
    { title: "Fix Basic", dataKey: "fxs_basic" },
    { title: "Fix HRA", dataKey: "fxs_hra" },
    { title: "Fix Other", dataKey: "fxs_other" },
    { title: "Fix Total Earning", dataKey: "fxs_total_earning" },
    { title: "Dw Basic", dataKey: "dws_basic" },
    { title: "Dw HRA", dataKey: "dws_hra" },
    { title: "Dw Other", dataKey: "dws_other" },
    { title: "Dw Total Earning", dataKey: "dws_total_earning" },
    { title: "Reg. OT Hours", dataKey: "regular_ot_hours" },
    { title: "Reg. OT Amt.", dataKey: "regular_ot_payable_amt" },
    { title: "Extra OT Hours", dataKey: "extra_ot_hours" },
    { title: "Extra OT Amt.", dataKey: "extra_ot_payable_amt" },
    { title: "Total OT Hours", dataKey: "earn_ot_hours" },
    { title: "Total OT Amt.", dataKey: "earn_ot_payable_amt" },
    { title: "Earn. Head F.", dataKey: "earn_head_first" },
    { title: "Earn. Head S.", dataKey: "earn_head_second" },
    { title: "Earn. Head T.", dataKey: "earn_head_third" },
    { title: "Bonus Amt.", dataKey: "bonus_amount" },
    { title: "Sub Total", dataKey: "earn_sub_total" },
    { title: "Total Earning", dataKey: "total_earning" },
    { title: "PF", dataKey: "ded_emp_pf" },
    { title: "PM PF", dataKey: "ded_pradhan_mantri_pf" },
    { title: "ESI Employee", dataKey: "ded_esi_employee" },
    { title: "ESI Company", dataKey: "ded_esi_company" },
    { title: "PT", dataKey: "ded_pt" },
    { title: "Insurance", dataKey: "ded_insurance" },
    { title: "Ded. F.", dataKey: "ded_first" },
    { title: "Ded. S.", dataKey: "ded_second" },
    { title: "Ded. T.", dataKey: "ded_third" },
    { title: "Total Ded.", dataKey: "total_deduction" },
    { title: "Net Bank Pay", dataKey: "net_bank_pay" },
  ];

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });

    // Use customers (all loaded data) or selectedCustomers
    const dataToExport =
      selectedSalaries.length > 0 ? selectedSalaries : salaries;

    if (!dataToExport || dataToExport.length === 0) {
      toast.info("No data available to export");
      return;
    }

    const tableData = dataToExport.map((salary) => {
      const row: Record<string, any> = { year: salary.year ?? "-" };
      row.month = salary.month ?? "-";
      row.added_date = formatDateToDDMMYYYY(salary.added_date) ?? "00/00/0000";
      row.employee_name = salary.employee_name ?? "-";
      row.total_present_day = salary.total_present_day ?? "0";
      row.half_day = salary.half_day ?? "0";
      row.total_week_off = salary.total_week_off ?? "0";
      row.total_leave = salary.total_leave ?? "0";
      row.total_absent = salary.total_absent ?? "0";
      row.total_day = salary.total_day ?? "0";
      row.working_hour = salary.working_hour ?? "0";
      row.ctc = salary.ctc ?? "0";
      row.gross_salary = salary.gross_salary ?? "0";
      row.per_day_salary = salary.per_day_salary ?? "0";
      row.fxs_basic = salary.fxs_basic ?? "0";
      row.fxs_hra = salary.fxs_hra ?? "0";
      row.fxs_other = salary.fxs_other ?? "0";
      row.fxs_total_earning = salary.fxs_total_earning ?? "0";
      row.dws_basic = salary.dws_basic ?? "0";
      row.dws_hra = salary.dws_hra ?? "0";
      row.dws_other = salary.dws_other ?? "0";
      row.dws_total_earning = salary.dws_total_earning ?? "0";
      row.regular_ot_hours = (salary as any).regular_ot_hours ?? "00:00:00";
      row.regular_ot_payable_amt = (salary as any).regular_ot_payable_amt ?? "0";
      row.extra_ot_hours = (salary as any).extra_ot_hours ?? "00:00:00";
      row.extra_ot_payable_amt = (salary as any).extra_ot_payable_amt ?? "0";
      row.earn_ot_hours = salary.earn_ot_hours ?? "0";
      row.earn_ot_payable_amt = salary.earn_ot_payable_amt ?? "0";
      row.earn_head_first = salary.earn_head_first ?? "0";
      row.earn_head_second = salary.earn_head_second ?? "0";
      row.earn_head_third = salary.earn_head_third ?? "0";
      row.bonus_amount = salary.bonus_amount ?? "0";
      row.earn_sub_total = salary.earn_sub_total ?? "0";
      row.total_earning = salary.total_earning ?? "0";
      row.ded_emp_pf = salary.ded_emp_pf ?? "0";
      row.ded_pradhan_mantri_pf = salary.ded_pradhan_mantri_pf ?? "0";
      row.ded_esi_employee = salary.ded_esi_employee ?? "0";
      row.ded_esi_company = salary.ded_esi_company ?? "0";
      row.ded_pt = salary.ded_pt ?? "0";
      row.ded_insurance = salary.ded_insurance ?? "0";
      row.ded_first = salary.ded_first ?? "0";
      row.ded_second = salary.ded_second ?? "0";
      row.ded_third = salary.ded_third ?? "0";
      row.total_deduction = salary.total_deduction ?? "0";
      row.net_bank_pay = salary.net_bank_pay ?? "0";

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

  const exportExcel = async () => {
    try {
      setLoading(true);

      let allAttendance: ISalaryRegister[] = [];

      // ✅ If rows are selected → use only selected rows
      if (selectedSalaries.length > 0) {
        allAttendance = selectedSalaries;
      } else {
        // Otherwise fetch all from backend
        allAttendance = await exportAllSalaryRegisterData(
          (offset, limit) =>
            fetchSalaryRegisterForExport(
              filters.checkedOptionsUser,
              MobileToken,
              getID,
              MobileFlag,
              offset,
              limit,
              activeDayMonthYear,
            ),
          50,
        );
      }

      if (!allAttendance.length) {
        toast.warn("No data to export");
        return;
      }

      const headers = [
        "Month",
        "Year",
        "Employee Name",
        "Employee Id",
        "Employee Mobile",
        "Adhar Number",
        "PAN Number",
        "Added Date",
        "Present Day",
        "Half Day",
        "Week Off",
        "Leave",
        "Absent",
        "Salaried Days",
        "Working Hour",
        "CTC",
        "Gross Salary",
        "Per Day Salary",
        "Fix Basic",
        "Fix HRA",
        "Fix Other",
        "Fix Total Earning",
        "Dw Basic",
        "Dw HRA",
        "Dw Other",
        "Dw Total Earning",
        "Reg. OT Hours",
        "Reg. OT Amt.",
        "Extra OT Hours",
        "Extra OT Amt.",
        "Total OT Hours",
        "Total OT Amt.",
        "Earn. Head F.",
        "Earn. Head S.",
        "Earn. Head T.",
        "Bonus Amt.",
        "Sub Total",
        "Total Earning",
        "PF",
        "PM PF",
        "ESI Employee",
        "ESI Company",
        "PT",
        "Insurance",
        "Ded. F.",
        "Ded. S.",
        "Ded. T.",
        "Total Ded.",
        "Net Bank Pay",
      ];

      const rows = (
        selectedSalaries.length > 0 ? selectedSalaries : allAttendance
      ).map((salary) => {
        const row: any[] = [months[salary.month] || "-"];
        row.push(salary.year ?? "-");
        row.push(salary.employee_name ?? "-");
        row.push(salary.employee_id ?? "-");
        row.push(salary.recovery_mobile ?? "-");
        row.push(salary.aadhar_card_number || "-");
        row.push(salary.pan_card_number || "-");
        row.push(formatDateToDDMMYYYY(salary.added_date) ?? "00/00/0000");
        row.push(salary.total_present_day ?? "0");
        row.push(salary.half_day ?? "0");
        row.push(salary.total_week_off ?? "0");
        row.push(salary.total_leave ?? "0");
        row.push(salary.total_absent ?? "0");
        row.push(salary.total_day ?? "0");
        row.push(salary.working_hour ?? "");
        row.push(salary.ctc ?? "");
        row.push(salary.gross_salary ?? "");
        row.push(salary.per_day_salary ?? "");
        row.push(salary.fxs_basic ?? "");
        row.push(salary.fxs_hra ?? "");
        row.push(salary.fxs_other ?? "");
        row.push(salary.fxs_total_earning ?? "");
        row.push(salary.dws_basic ?? "");
        row.push(salary.dws_hra ?? "");
        row.push(salary.dws_other ?? "");
        row.push(salary.dws_total_earning ?? "");
        row.push((salary as any).regular_ot_hours ?? "00:00:00");
        row.push((salary as any).regular_ot_payable_amt ?? "0");
        row.push((salary as any).extra_ot_hours ?? "00:00:00");
        row.push((salary as any).extra_ot_payable_amt ?? "0");
        row.push(salary.earn_ot_hours ?? "");
        row.push(salary.earn_ot_payable_amt ?? "");
        row.push(salary.earn_head_first ?? "");
        row.push(salary.earn_head_second ?? "");
        row.push(salary.earn_head_third ?? "");
        row.push(salary.bonus_amount ?? "");
        row.push(salary.earn_sub_total ?? "");
        row.push(salary.total_earning ?? "");
        row.push(salary.ded_emp_pf ?? "");
        row.push(salary.ded_pradhan_mantri_pf ?? "");
        row.push(salary.ded_esi_employee ?? "");
        row.push(salary.ded_esi_company ?? "");
        row.push(salary.ded_pt ?? "");
        row.push(salary.ded_insurance ?? "");
        row.push(salary.ded_first ?? "");
        row.push(salary.ded_second ?? "");
        row.push(salary.ded_third ?? "");
        row.push(salary.total_deduction ?? "");
        row.push(salary.net_bank_pay ?? "");

        return row;
      });

      const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);

      worksheet["!cols"] = [
        { wpx: 180 },
        { wpx: 160 },
        { wpx: 140 },
        { wpx: 140 },
        { wpx: 160 },
        { wpx: 120 },
      ];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Salary Register");

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      saveAsExcelFile(
        excelBuffer,
        `Salary_Register_${monthOptions.find((m) => m.value === effectiveMonthYear.month)?.label}_${effectiveMonthYear.year}`,
      );

      toast.success("Salary Excel exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export salary data");
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
      selectedSalaries.length > 0 ? selectedSalaries : salaries;

    if (!dataToPrint || dataToPrint.length === 0) {
      toast.info("No data available to print");
      return;
    }

    const headers = `
        <th>Month-Year</th>
        <th>Employee Name</th>
        <th>Added Date</th>
        <th>Present Day</th>
        <th>Half Day</th>
        <th>Week Off</th>
        <th>Leave</th>
        <th>Absent</th>
        <th>Salaried Days</th>
        <th>Working Hour</th>
        <th>CTC</th>
        <th>Gross Salary</th>
        <th>Per Day Salary</th>
        <th>Fix Basic</th>
        <th>Fix HRA</th>
        <th>Fix Other</th>
        <th>Fix Total Earning</th>
        <th>Dw Basic</th>
        <th>Dw HRA</th>
        <th>Dw Other</th>
        <th>Dw Total Earning</th>
        <th>OT Hours</th>
        <th>OT Payable Amt.</th>
        <th>Earn. Head F.</th>
        <th>Earn. Head S.</th>
        <th>Earn. Head T.</th>
        <th>Bonus Amt.</th>
        <th>Sub Total</th>
        <th>Total Earning</th>
        <th>PF</th>
        <th>PM PF</th>
        <th>ESI Employee</th>
        <th>ESI Company</th>
        <th>PT</th>
        <th>Insurance</th>
        <th>Ded. F.</th>
        <th>Ded. S.</th>
        <th>Ded. T.</th>
        <th>Total Ded.</th>
        <th>Net Bank Pay</th>
      `;

    const rows = dataToPrint
      .map((salary) => {
        return `
          <tr>
            <td>${salary.year ?? "-"}</td>
            <td>${salary.employee_name ?? "-"}</td>
            <td>${formatDateToDDMMYYYY(salary.added_date) ?? "00/00/0000"}</td>
            <td>${salary.total_present_day ?? "0"}</td>
            <td>${salary.half_day ?? "0"}</td>
            <td>${salary.total_week_off ?? "0"}</td>
            <td>${salary.total_leave ?? "0"}</td>
            <td>${salary.total_absent ?? "0"}</td>
            <td>${salary.total_day ?? "0"}</td>
            <td>${salary.working_hour ?? "0"}</td>
            <td>${salary.ctc ?? "0"}</td>
            <td>${salary.gross_salary ?? "0"}</td>
            <td>${salary.per_day_salary ?? "0"}</td>
            <td>${salary.fxs_basic ?? "0"}</td>
            <td>${salary.fxs_hra ?? "0"}</td>
            <td>${salary.fxs_other ?? "0"}</td>
            <td>${salary.fxs_total_earning ?? "0"}</td>
            <td>${salary.dws_basic ?? "0"}</td>
            <td>${salary.dws_hra ?? "0"}</td>
            <td>${salary.dws_other ?? "0"}</td>
            <td>${salary.dws_total_earning ?? "0"}</td>
            <td>${salary.earn_ot_hours ?? "0"}</td>
            <td>${salary.earn_ot_payable_amt ?? "0"}</td>
            <td>${salary.earn_head_first ?? "0"}</td>
            <td>${salary.earn_head_second ?? "0"}</td>
            <td>${salary.earn_head_third ?? "0"}</td>
            <td>${salary.bonus_amount ?? "0"}</td>
            <td>${salary.earn_sub_total ?? "0"}</td>
            <td>${salary.total_earning ?? "0"}</td>
            <td>${salary.ded_emp_pf ?? "0"}</td>
            <td>${salary.ded_pradhan_mantri_pf ?? "0"}</td>
            <td>${salary.ded_esi_employee ?? "0"}</td>
            <td>${salary.ded_esi_company ?? "0"}</td>
            <td>${salary.ded_pt ?? "0"}</td>
            <td>${salary.ded_insurance ?? "0"}</td>
            <td>${salary.ded_first ?? "0"}</td>
            <td>${salary.ded_second ?? "0"}</td>
            <td>${salary.ded_third ?? "0"}</td>
            <td>${salary.total_deduction ?? "0"}</td>
            <td>${salary.net_bank_pay ?? "0"}</td>
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
              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (salaries.length === 0) return;

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

          <Column
            field="year"
            header={<span>Month-Year</span>}
            sortable
            filter
            filterField="year"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "150px" }}
            body={(rowData) =>
              `${months[rowData.month]} - ${rowData.year}` || "-"
            }
            bodyStyle={{ background: "#F8F9FA" }}
          />

          <Column
            field="employee_name"
            header={<span>Employee Name</span>}
            sortable
            filter
            filterField="employee_name"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyStyle={{ background: "#F8F9FA" }}
            body={(rowData) => rowData.employee_name ?? "-"}
          />

          <Column
            field="added_date"
            header={<span>Added Date</span>}
            sortable
            filter
            filterField="added_date"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyStyle={{ background: "#F8F9FA" }}
            bodyClassName={"text-center"}
            body={(rowData) => formatDateToDDMMYYYY(rowData.added_date) ?? "-"}
          />

          <Column
            className="attendance-section"
            field="total_present_day"
            header={<span>Present Day</span>}
            sortable
            filter
            filterField="total_present_day"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_present_day ?? "-"}
          />

          <Column
            className="attendance-section"
            field="half_day"
            header={<span>Half Day</span>}
            sortable
            filter
            filterField="half_day"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.half_day ?? "-"}
          />

          <Column
            className="attendance-section"
            field="holiday"
            header={<span>Holiday</span>}
            sortable
            filter
            filterField="holiday"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.holiday ?? "-"}
          />

          <Column
            className="attendance-section"
            field="total_week_off"
            header={<span>Week Off</span>}
            sortable
            filter
            filterField="total_week_off"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_week_off ?? "-"}
          />

          <Column
            className="attendance-section"
            field="total_leave"
            header={<span>Leave</span>}
            sortable
            filter
            filterField="total_leave"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_leave ?? "-"}
          />

          <Column
            className="attendance-section"
            field="total_absent"
            header={<span>Absent</span>}
            sortable
            filter
            filterField="total_absent"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_absent ?? "-"}
          />

          <Column
            className="attendance-section"
            field="total_day"
            header={<span>Salaried Days</span>}
            sortable
            filter
            filterField="total_day"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_day ?? "-"}
          />

          <Column
            className="attendance-section"
            field="working_hour"
            header={<span>Working Hour</span>}
            sortable
            filter
            filterField="working_hour"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.working_hour ?? "-"}
          />

          <Column
            className="payroll-section"
            field="ctc"
            header={<span>CTC</span>}
            sortable
            filter
            filterField="ctc"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ctc ?? "-"}
          />

          <Column
            className="payroll-section"
            field="gross_salary"
            header={<span>Gross Salary</span>}
            sortable
            filter
            filterField="gross_salary"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.gross_salary ?? "-"}
          />

          <Column
            className="payroll-section"
            field="per_day_salary"
            header={<span>Per Day Salary</span>}
            sortable
            filter
            filterField="per_day_salary"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.per_day_salary ?? "-"}
          />

          <Column
            className="payroll-section"
            field="fxs_basic"
            header={<span>Fix Basic</span>}
            sortable
            filter
            filterField="fxs_basic"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.fxs_basic ?? "-"}
          />
          <Column
            className="payroll-section"
            field="fxs_hra"
            header={<span>Fix HRA</span>}
            sortable
            filter
            filterField="fxs_hra"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.fxs_hra ?? "-"}
          />
          <Column
            className="payroll-section"
            field="fxs_other"
            header={<span>Fix Other</span>}
            sortable
            filter
            filterField="fxs_other"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.fxs_other ?? "-"}
          />
          <Column
            className="payroll-section"
            field="fxs_total_earning"
            header={<span>Fix Total Earning</span>}
            sortable
            filter
            filterField="fxs_total_earning"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.fxs_total_earning ?? "-"}
          />
          <Column
            className="calculation-section"
            field="dws_basic"
            header={<span>Basic</span>}
            sortable
            filter
            filterField="dws_basic"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.dws_basic ?? "-"}
          />
          <Column
            className="calculation-section"
            field="dws_hra"
            header={<span>HRA</span>}
            sortable
            filter
            filterField="dws_hra"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.dws_hra ?? "-"}
          />
          <Column
            className="calculation-section"
            field="dws_other"
            header={<span>Other</span>}
            sortable
            filter
            filterField="dws_other"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.dws_other ?? "-"}
          />
          <Column
            className="calculation-section"
            field="dws_total_earning"
            header={<span>Total Earning</span>}
            sortable
            filter
            filterField="dws_total_earning"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.dws_total_earning ?? "-"}
          />
          <Column
            className="earning-section"
            field="regular_ot_hours"
            header={<span>Reg. OT Hours</span>}
            sortable
            filter
            filterField="regular_ot_hours"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.regular_ot_hours ?? "-"}
          />
          <Column
            className="earning-section"
            field="regular_ot_payable_amt"
            header={<span>Reg. OT Amt.</span>}
            sortable
            filter
            filterField="regular_ot_payable_amt"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.regular_ot_payable_amt ?? "-"}
          />
          <Column
            className="earning-section"
            field="extra_ot_hours"
            header={<span>Extra OT Hours</span>}
            sortable
            filter
            filterField="extra_ot_hours"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.extra_ot_hours ?? "-"}
          />
          <Column
            className="earning-section"
            field="extra_ot_payable_amt"
            header={<span>Extra OT Amt.</span>}
            sortable
            filter
            filterField="extra_ot_payable_amt"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.extra_ot_payable_amt ?? "-"}
          />
          <Column
            className="earning-section"
            field="earn_ot_hours"
            header={<span>Total OT Hours</span>}
            sortable
            filter
            filterField="earn_ot_hours"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.earn_ot_hours ?? "-"}
          />
          <Column
            className="earning-section"
            field="earn_ot_payable_amt"
            header={<span>Total OT Amt.</span>}
            sortable
            filter
            filterField="earn_ot_payable_amt"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.earn_ot_payable_amt ?? "-"}
          />
          <Column
            className="earning-section"
            field="earn_head_first"
            header={<span>Earn. Head F.</span>}
            sortable
            filter
            filterField="earn_head_first"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.earn_head_first ?? "-"}
          />
          <Column
            className="earning-section"
            field="earn_head_second"
            header={<span>Earn. Head S.</span>}
            sortable
            filter
            filterField="earn_head_second"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.earn_head_second ?? "-"}
          />
          <Column
            className="earning-section"
            field="earn_head_third"
            header={<span>Earn. Head T.</span>}
            sortable
            filter
            filterField="earn_head_third"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.earn_head_third ?? "-"}
          />
          <Column
            className="earning-section"
            field="bonus_amount"
            header={<span>Bonus Amt.</span>}
            sortable
            filter
            filterField="bonus_amount"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.bonus_amount ?? "-"}
          />
          <Column
            className="earning-section"
            field="earn_sub_total"
            header={<span>Sub Total</span>}
            sortable
            filter
            filterField="earn_sub_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.earn_sub_total ?? "-"}
          />
          <Column
            field="total_earning"
            header={<span>Total Earning</span>}
            sortable
            filter
            filterField="total_earning"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyStyle={{ background: "#E6FFF8" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_earning ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_emp_pf"
            header={<span>PF</span>}
            sortable
            filter
            filterField="ded_emp_pf"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_emp_pf ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_pradhan_mantri_pf"
            header={<span>PM PF</span>}
            sortable
            filter
            filterField="ded_pradhan_mantri_pf"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_pradhan_mantri_pf ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_esi_employee"
            header={<span>ESI Employee</span>}
            sortable
            filter
            filterField="ded_esi_employee"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_esi_employee ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_esi_company"
            header={<span>ESI Company</span>}
            sortable
            filter
            filterField="ded_esi_company"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_esi_company ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_pt"
            header={<span>PT</span>}
            sortable
            filter
            filterField="ded_pt"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_pt ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_insurance"
            header={<span>Insurance</span>}
            sortable
            filter
            filterField="ded_insurance"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_insurance ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_first"
            header={<span>Ded. F.</span>}
            sortable
            filter
            filterField="ded_first"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_first ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_second"
            header={<span>Ded. S.</span>}
            sortable
            filter
            filterField="ded_second"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_second ?? "-"}
          />
          <Column
            className="deduction-section"
            field="ded_third"
            header={<span>Ded. T.</span>}
            sortable
            filter
            filterField="ded_third"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.ded_third ?? "-"}
          />
          <Column
            className="deduction-section"
            field="total_deduction"
            header={<span>Total Ded.</span>}
            sortable
            filter
            filterField="total_deduction"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.total_deduction ?? "-"}
          />
          <Column
            className="net-pay-section"
            field="net_bank_pay"
            header={<span>Net Bank Pay</span>}
            sortable
            filter
            filterField="net_bank_pay"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{ width: "160px" }}
            bodyClassName={"text-end"}
            body={(rowData) => rowData.net_bank_pay ?? "-"}
          />
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
