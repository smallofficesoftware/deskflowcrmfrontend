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
import { VirtualScrollerState } from "primereact/virtualscroller";
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
import { exportAllEmployeeAccountOutstadingData, fetchEmployeeAccountOutstanding, IEmployeeAccountOutstanding } from "./EmployeeAccountOutstandingReportContoller";
// import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropEmployeeAccountOutstandingReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  selectedTeamMembers?: string[] | null;
  type?: string;
  onHide?: () => void;
}

interface VirtualScrollerLazyEvent {
  first?: number | VirtualScrollerState;
  last?: number | VirtualScrollerState;
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

const EmployeeAccountOutstandingReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  selectedTeamMembers,
  type,
  onHide,
}: IPropEmployeeAccountOutstandingReports) => {

  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [employees, setEmployees] = useState<IEmployeeAccountOutstanding[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<
    IEmployeeAccountOutstanding[]
  >([]);

  const isPaginationCall = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const currentOffset = useRef(0);
  const PAGE_SIZE = 50;

  const offsetRef = useRef(0);
  const fetchingRef = useRef(false);
  const loadingRef = useRef(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("Emp_AccountOutstanding_Report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      dropdownRef.current.contains(event.target as Node)
    ) {
      return;
    }

    setIsExportDropdownOpen(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
    }
  });

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
      checkedOptionsUser: data?.checkedOptionsUser || [],
    };

    setFilters("Emp_AccountOutstanding_Report", updatedFilters);

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
    if (!filters.startSearchDate || !filters.endSearchDate || !filters.selectedDateArray) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("Emp_AccountOutstanding_Report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 50,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      employee_name: { value: null, matchMode: "contains" },
      total_outstanding_amount: { value: null, matchMode: "contains" },
      outstanding_type: { value: null, matchMode: "contains" },
    },
  });

  const dataArray: IEmployeeAccountOutstanding[] =
    employees && employees.length > 0
      ? employees.map((item) => ({
        employee_name: item.employee_name,
        total_outstanding_amount: item.total_outstanding_amount,
        outstanding_type: item.outstanding_type,
        total_credit: item.total_credit,
        total_debit: item.total_debit,
      }))
      : [];

  // useEffect(() => {

  //   if (isPaginationCall.current) {
  //     isPaginationCall.current = false;
  //     return;
  //   }

  //   let isMounted = true;

  //   fetchAccountOutstanding(setAccountOutstanding, selectedDates, MobileToken, getID,
  //     MobileFlag, 0,
  //     50, debouncedGlobalSearch);

  //   return () => {
  //     isMounted = false;
  //     if (networkTimeout.current) clearTimeout(networkTimeout.current);
  //   };
  // }, [selectedDates, setAccountOutstanding, debouncedGlobalSearch]);

  useEffect(() => {
    currentOffset.current = 0; // Fixed ref name if it was offsetRef
    setEmployees([]);
    setHasMore(true);
    setTotalRecords(0); // Reset total
    setSelectedEmployees([]);
    loadAccountData(true);
  }, [
    filters.selectedDateArray,
    debouncedSearchText,
    filters.checkedOptionsUser,
    type,
  ]);

  const loadAccountData = async (reset = false) => {
    if (fetchingRef.current) return;

    if (!hasMore && !reset) return;

    fetchingRef.current = true;

    if (reset) {
      setLoading(true);
    }

    const offset = reset ? 0 : offsetRef.current;

    try {
      const data = await fetchEmployeeAccountOutstanding(
        filters.selectedDateArray,
        offset,
        PAGE_SIZE,
        debouncedSearchText,
        filters.checkedOptionsUser,
        type,
      );

      if (reset) {
        setEmployees(data);
        offsetRef.current = data.length;
      } else {
        setEmployees((prev) => {
          // 🔥 duplicate protection
          const merged = [...prev, ...data];

          const unique = merged.filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (x) =>
                  x.employee_name === item.employee_name &&
                  x.total_outstanding_amount === item.total_outstanding_amount,
              ),
          );

          return unique;
        });

        offsetRef.current += data.length;
      }

      // 🔥 stop only when API returns less than page size
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    currentOffset.current = 0;
    offsetRef.current = 0;
    setEmployees([]);
    setHasMore(true);
    setSelectedEmployees([]);
    loadAccountData(true);
  };

  const onLazyLoad = (event: VirtualScrollerLazyEvent) => {
    const first =
      typeof event.first === "number" ? event.first : (event.first?.first ?? 0);

    if (first >= offsetRef.current && hasMore && !loadingRef.current) {
      // loadAccountData(0, 50, true);
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
    console.log("DEBUG: onFilter triggered with filters:", event.filters);
    setLazyState((prev) => ({
      ...prev,
      first: 0,
      filters: event.filters,
    }));
  };

  const onSelectionChange = (event: { value: IEmployeeAccountOutstanding[] }) => {
    const value = event.value;
    console.log("DEBUG: onSelectionChange triggered with value:", value);
    setSelectedEmployees(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    console.log(
      "DEBUG: onSelectAllChange triggered with checked:",
      event.checked,
    );
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectAll(true);
      setSelectedEmployees([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedEmployees([]);
    }
  };

  // Calculate totals for export data
  const getFilteredData = () => {
    let filteredData = [...dataArray];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;

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

    if (lazyState.sortField) {
      filteredData.sort((a, b) => {
        const aValue = getNestedValue(a, lazyState.sortField!);
        const bValue = getNestedValue(b, lazyState.sortField!);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) filteredData.reverse();
    }

    return filteredData;
  };

  // Calculate totals for payable and receivable amounts
  type Employee = {
    outstanding_type: string;
    total_outstanding_amount: string;
  };

  function parseAmountWithSymbol(value: string): {
    amount: number;
    symbol: string;
  } {
    if (!value) return { amount: 0, symbol: "" };

    const symbol = value.replace(/[0-9.,\s-]/g, ""); // sirf symbol nikalna
    const amount = parseFloat(value.replace(/[^0-9.-]+/g, "")); // sirf number nikalna

    return {
      amount: isNaN(amount) ? 0 : amount,
      symbol: symbol || "₹",
    };
  }

  function formatCurrency(amount: number, symbol: string): string {
    return `${symbol}${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  let currencySymbol = "₹";

  const payableTotal = employees.reduce((sum: number, employee: Employee) => {
    if (employee.outstanding_type.toLowerCase() === "payable") {
      const { amount, symbol } = parseAmountWithSymbol(
        employee.total_outstanding_amount,
      );
      currencySymbol = symbol || currencySymbol;
      return sum + amount;
    }
    return sum;
  }, 0);

  const receivableTotal = employees.reduce(
    (sum: number, employee: Employee) => {
      if (employee.outstanding_type.toLowerCase() === "receivable") {
        const { amount, symbol } = parseAmountWithSymbol(
          employee.total_outstanding_amount,
        );
        currencySymbol = symbol || currencySymbol;
        return sum + amount;
      }
      return sum;
    },
    0,
  );

  const grandTotal = payableTotal + receivableTotal;

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const filteredData = getFilteredData();
    const tableData = (
      selectedEmployees.length > 0 ? selectedEmployees : filteredData
    ).map((emp) => ({
      employee_name: emp.employee_name || "-",
      total_outstanding_amount: emp.total_outstanding_amount ?? "-",
      outstanding_type: emp.outstanding_type || "-",
    }));

    const exportPayableTotal = tableData.reduce((sum, emp) => {
      console.log("nan", sum);
      if (emp.outstanding_type.toLowerCase() === "payable") {
        return sum + Number(emp.total_outstanding_amount || 0);
      }
      return sum;
    }, 0);

    const exportReceivableTotal = tableData.reduce((sum, emp) => {
      if (emp.outstanding_type.toLowerCase() === "receivable") {
        return sum + Number(emp.total_outstanding_amount || 0);
      }
      return sum;
    }, 0);

    const exportGrandTotal = exportPayableTotal + exportReceivableTotal;

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`accounting_${new Date().getTime()}.pdf`);
      return;
    }

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      foot: [
        [
          `Payable:   ${exportPayableTotal}`,
          `Receivable:   ${exportReceivableTotal}`,
          `Grand Total:   ${exportGrandTotal}`,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      margin: { top: 20, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text(
          "Employee Accounting Outstanding Report",
          data.settings.margin.left,
          10,
        );
      },
    });

    doc.save(`accounting_${new Date().getTime()}.pdf`);
  };

  const filteredData = useMemo(() => {
    let data = [...employees];

    // Apply filters
    Object.entries({
      employee_name: { value: null, matchMode: "contains" },
      total_outstanding_amount: { value: null, matchMode: "contains" },
      outstanding_type: { value: null, matchMode: "contains" },
    }).forEach(([field, meta]) => {
      if (meta.value !== null && meta.value !== "") {
        const filterValue = meta.value;
        data = data.filter((item) => {
          const val =
            getNestedValue(item, field)?.toString().toLowerCase() ?? "";
          return val.includes(filterValue);
        });
      }
    });

    // Apply sort (optional - you can enhance later)
    // if (sortField) { ... }

    return data;
  }, [
    employees /* , lazyState.filters, lazyState.sortField, lazyState.sortOrder */,
  ]);

  const exportData =
    selectedEmployees.length > 0 ? selectedEmployees : filteredData;

  // const exportExcel = () => {
  //     const data = exportData.map((row) => ({
  //       "Contact Name": row.contact_name || "-",
  //       "Total Outstanding": row.total_outstanding_amount ?? "-",
  //       Type: row.outstanding_type || "-",
  //     }));
  // const parseAmount = (str: string): number => {
  //     return parseFloat(str?.replace(/[^0-9.-]+/g, "") || "0") || 0;
  //   };

  //     const payable = exportData
  //       .filter((r) => r.outstanding_type?.toLowerCase() === "payable")
  //       .reduce((s, r) => s + parseAmount(r.total_outstanding_amount), 0);

  //     const receivable = exportData
  //       .filter((r) => r.outstanding_type?.toLowerCase() === "receivable")
  //       .reduce((s, r) => s + parseAmount(r.total_outstanding_amount), 0);

  //     const grand = payable + receivable;

  //     const footer = [{
  //       "Contact Name": "Payable",
  //       "Total Outstanding": payable,
  //       Type: "Receivable / Grand Total",
  //     }, {
  //       "Contact Name": "",
  //       "Total Outstanding": receivable,
  //       Type: grand,
  //     }];

  //     const ws = xlsx.utils.json_to_sheet([...data, ...footer]);
  //     const wb = xlsx.utils.book_new();
  //     xlsx.utils.book_append_sheet(wb, ws, "Outstanding");

  //     const buffer = xlsx.write(wb, { bookType: "xlsx", type: "array" });
  //     saveAs(
  //       new Blob([buffer], { type: "application/octet-stream" }),
  //       `account_outstanding_${Date.now()}.xlsx`
  //     );
  //   };

  const fetchAccountOutstandingForExport = async (
    offset: number,
    limit: number,
  ): Promise<IEmployeeAccountOutstanding[]> => {
    return await fetchEmployeeAccountOutstanding(
      filters.selectedDateArray,
      offset,
      limit,
      debouncedSearchText,
      filters.checkedOptionsUser,
      type,
    );
  };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const exportData =
        await exportAllEmployeeAccountOutstadingData<IEmployeeAccountOutstanding>(
          fetchAccountOutstandingForExport,
          500,
        );

      if (!exportData.length) {
        toast.warn("No data to export");
        return;
      }

      const data = (
        selectedEmployees.length > 0 ? selectedEmployees : exportData
      ).map((row) => ({
        "Employee Name": row.employee_name || "-",
        "Total Outstanding": row.total_outstanding_amount ?? "-",
        Type: row.outstanding_type || "-",
      }));

      const parseAmount = (str: string): number => {
        return parseFloat(str?.replace(/[^0-9.-]+/g, "") || "0") || 0;
      };

      const payable = exportData
        .filter((r) => r.outstanding_type?.toLowerCase() === "payable")
        .reduce((s, r) => s + parseAmount(r.total_outstanding_amount), 0);

      const receivable = exportData
        .filter((r) => r.outstanding_type?.toLowerCase() === "receivable")
        .reduce((s, r) => s + parseAmount(r.total_outstanding_amount), 0);

      const grand = payable + receivable;

      const footer = [
        {
          "Employee Name": `Payable - ${payable}`,
          "Total Outstanding": `Receivable - ${receivable}`,
          Type: `Grand Total - ${grand}`,
        },
      ];

      const ws = xlsx.utils.json_to_sheet([...data, ...footer]);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Outstanding");

      const buffer = xlsx.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `employee_account_outstanding_${Date.now()}.xlsx`,
      );
    } catch (error) {
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(
      data,
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION,
    );
  };

  const printTable = () => {
    const filteredData = getFilteredData();
    const tableData =
      selectedEmployees.length > 0 ? selectedEmployees : filteredData;

    const exportPayableTotal = tableData.reduce((sum, emp) => {
      if (emp.outstanding_type.toLowerCase() === "payable") {
        return sum + Number(emp.total_outstanding_amount || 0);
      }
      return sum;
    }, 0);

    const exportReceivableTotal = tableData.reduce((sum, emp) => {
      if (emp.outstanding_type.toLowerCase() === "receivable") {
        return sum + Number(emp.total_outstanding_amount || 0);
      }
      return sum;
    }, 0);

    const exportGrandTotal = exportPayableTotal + exportReceivableTotal;

    const printContent = `
      <html>
        <head>
          <title>Employee Account Outstanding Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; }
            tfoot { background-color: #e6e6e6; font-weight: bold; }
            .spacer-row td { border: none; padding: 4px; }
          </style>
        </head>
        <body>
          <h1>Employee Account Outstanding Report</h1>
          <table>
            <thead>
              <tr>
                ${exportColumns.map((col) => `<th>${col.title}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
            ${tableData
        .map(
          (emp) => `
                  <tr>
                    <td>${emp.employee_name || "-"}</td>
                    <td>${emp.total_outstanding_amount ?? "-"}</td>
                    <td>${emp.outstanding_type || "-"}</td>
                  </tr>
                `,
        )
        .join("")}
            </tbody>
            <tfoot>
              <tr class="spacer-row"><td colspan="3"></td></tr>
              <tr>
                <td>Payable:  ${exportPayableTotal}</td>
                <td>Receivable:  ${exportReceivableTotal}</td>
                <td>Grand Total: ${exportGrandTotal}</td>
              </tr>
            </tfoot>
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

  // Body template for total_outstanding_amount column
  const amountBodyTemplate = (rowData: IEmployeeAccountOutstanding) => {
    const isReceivable =
      rowData.outstanding_type.toLowerCase() === "receivable";
    return (
      <div
        className="d-flex justify-content-end"
        style={{
          backgroundColor: isReceivable ? "#C1D8C3" : "transparent",
          padding: "8px",
          borderRadius: "4px",
        }}
      >
        {rowData.total_outstanding_amount}
      </div>
    );
  };

  const amountFooterTemplate = () => {
    return (
      <div style={{ fontWeight: "bold", padding: "8px" }}>
        Grand Total : {currencySymbol}
        {grandTotal.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    );
  };

  const RamountFooterTemplate = () => {
    return (
      <div style={{ fontWeight: "bold", padding: "8px" }}>
        Receivable Total : {currencySymbol}
        {receivableTotal.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    );
  };

  const PamountFooterTemplate = () => {
    return (
      <div style={{ fontWeight: "bold", padding: "8px" }}>
        Payable Total : {currencySymbol}
        {payableTotal.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    );
  };

  const getLastIndex = (
    last: number | VirtualScrollerState | undefined,
  ): number => {
    if (typeof last === "number") return last;
    if (last && typeof last === "object" && "last" in last) return last.last;
    return 0;
  };

  type OutstandingColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body?: (rowData: IEmployeeAccountOutstanding) => React.ReactNode;
    footer?: React.ReactNode | (() => React.ReactNode);
    footerStyle?: React.CSSProperties;
  };

  const baseColumnDefs: OutstandingColumnDef[] = useMemo(
    () => [
      {
        key: "employee_name",
        label: "Employee Name",
        header: "Employee Name",
        width: "250px",
        footer: PamountFooterTemplate,
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
        },
      },
      {
        key: "total_outstanding_amount",
        label: "Total Outstanding Amount",
        header: "Total Outstanding Amount",
        width: "250px",
        body: amountBodyTemplate,
        footer: RamountFooterTemplate,
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
        },
      },
      {
        key: "outstanding_type",
        label: "Outstanding Type",
        header: "Outstanding Type",
        width: "250px",
        footer: amountFooterTemplate,
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
        },
      },
    ],
    [payableTotal, receivableTotal, grandTotal, currencySymbol],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences(
    "employee_account_outstanding_report",
    baseColumnDefs,
  );

  const exportColumns = visibleColumns.map((col) => ({
    title: col.label,
    dataKey: col.key,
  }));

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Employee Account Outstanding
        </h3>

        {/* {MobileFlag || MobileFlag != undefined || MobileFlag != null ? (
          ""
        ) : ( */}
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
            <div ref={dropdownRef} style={{ position: "relative" }}>
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

                    if (employees.length === 0) return;

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

                    if (employees.length === 0) return;

                    canShare
                      ? exportPdf()
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }}
                >
                  <i
                    className="pi pi-file-pdf"
                    style={{ marginRight: "4px" }}
                  />
                  Export PDF
                </li>

                <li
                  className="listItem text-start"
                  role="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);

                    if (employees.length === 0) return;

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
        </div>
        {/* )} */}
      </div>

      <div
        className="report_card"
        style={{
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DataTable
          value={employees}
          scrollable
          scrollHeight="90vh"
          resizableColumns
          columnResizeMode="fit"
          loading={loading}
          totalRecords={1000000}
          virtualScrollerOptions={{
            lazy: true,
            itemSize: 52,
            appendOnly: true,
            showLoader: true,

            onLazyLoad: (e) => {
              const lastIndex = getLastIndex(e.last);

              console.log("LazyLoad", {
                lastIndex,
                loaded: employees.length,
                hasMore,
                fetching: fetchingRef.current,
              });

              // 🔥 trigger before reaching end
              const shouldLoad = lastIndex >= employees.length - 10;

              if (shouldLoad && hasMore && !fetchingRef.current) {
                loadAccountData(false);
              }
            },
          }}
          // dataKey="contact_name"
          // paginator
          first={lazyState.first}
          rows={lazyState.rows}
          // onPage={onPage}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          selection={selectedEmployees}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          className="custom-datatable custom-centered-table" // Custom class for styling
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
          {visibleColumns.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.header}
              sortable
              filter
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
              bodyStyle={{ fontSize: "14px" }}
              body={col.body}
              footer={col.footer}
              footerStyle={col.footerStyle}
            />
          ))}
        </DataTable>{" "}
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
          }}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
          initialSelectedDays={filters.selectedDays}
          isApplyReport={1}
        />
      )}
    </div>
  );
};

export default EmployeeAccountOutstandingReport;
