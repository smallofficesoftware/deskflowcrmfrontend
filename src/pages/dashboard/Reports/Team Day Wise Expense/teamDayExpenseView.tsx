import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
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
import ImageViewer from "../../../../components/ImageViewer";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ExpenseStatusUpdateModel from "../../../../components/model/ExpenseStatusUpdateModel";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import CreateExpenseView from "../../../left-side/header/Setting/expense/create-expense/CreateExpenseView";
import { IExpenseView } from "../../../left-side/header/Setting/expense/ExpenseController";
import { fetchExpense, IExpenseReport } from "./teamDayExpenseReportController";
interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropsourceReportReports {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  setRefreshReport1?: (value: boolean | number) => void;
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

const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const formatDate = (date: Date): string => {
  return String(date.getDate()).padStart(2, "0");
};

const restrictToSingleMonth = (dates: any[]): boolean => {
  if (dates?.length ?? 0 === 0) return true;

  // Convert DateObject to Date if needed
  const convertToDate = (date: any): Date => {
    if (date instanceof Date) return date;
    if (date && typeof date === "object" && date.valueOf) {
      return new Date(date.valueOf());
    }
    return new Date(date);
  };

  const convertedDates = dates.map(convertToDate);
  const firstDate = convertedDates[0];
  const firstMonth = firstDate.getMonth();
  const firstYear = firstDate.getFullYear();

  return convertedDates.every(
    (date) =>
      date.getMonth() === firstMonth && date.getFullYear() === firstYear,
  );
};
// Helper function to parse amount and extract currency symbol
const parseAmount = (
  amount: string | number | null,
): { value: number; symbol: string } => {
  if (amount == null) return { value: 0, symbol: "₹" }; // Default to ₹ if null
  const amountStr = String(amount);
  const match = amountStr.match(/[^0-9.-]+/); // Extract non-numeric characters as symbol
  const symbol = match ? match[0].trim() || "₹" : "₹"; // Use found symbol or default to ₹
  const cleanedAmount = amountStr.replace(/[^0-9.-]+/g, ""); // Remove non-numeric characters
  return { value: Number(cleanedAmount) || 0, symbol }; // Return numeric value and symbol
};

const AllTeamExpense = ({
  selectedDates,
  setRefreshReport1,
  selectedTeamMembers,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  onHide,
}: IPropsourceReportReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isPass, setIsPass] = useState(false);
  const [isReject, setIsReject] = useState(false);
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [statusFlag, setStatusFlag] = useState<string>("");
  const [editExpenseStatusItem, setEditExpenseStatusItem] =
    useState<IExpenseView>();
  const [editExpenseamount, setEditExpenseamount] = useState(0);
  const [expenseTypeId, setExpenseTypeId] = useState<string>("");
  const [refreshReport, setRefreshReport] = useState(false);

  const isPaginationCall = useRef(false);
  const [apiParams, setApiParams] = useState({ ul: 0, ll: 50 });

  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const currentOffset = useRef(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 50;

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("team_day_wise_expanse_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<any>(null);

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

    setFilters("team_day_wise_expanse_report", updatedFilters);

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

      setFilters("team_day_wise_expanse_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.TEAMEXPENSE_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.TEAMEXPENSE_REPORT,
    PERMISSION_TYPE.PRINT,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.EXPENSES,
    PERMISSION_TYPE.EDIT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
    },
  });
  const [sourceReport, setSourceReport] = useState<IExpenseReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<any[]>>(null);
  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSameMonth = (dates: (Date | string)[]): boolean => {
    if (dates?.length ?? 0 === 0) return true;

    const firstDate = moment(dates[0]);
    const firstMonth = firstDate.format("YYYY-MM");

    return dates.every((d) => moment(d).format("YYYY-MM") === firstMonth);
  };

  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    loadMoreData(true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
  ]);

  const formatDate = (date: Date | string): string => {
    // Force it to be a clean YYYY-MM-DD string
    const d = moment(date); // assuming you're using moment
    if (!d.isValid()) {
      console.warn("Invalid date detected:", date);
      return "invalid-date-" + Math.random().toString(36).slice(2, 8);
    }
    return d.format("YYYY-MM-DD");
  };

  const dateRange = filters?.selectedDateArray?.length
    ? getDateRange(
        new Date(
          Math.min(
            ...filters.selectedDateArray.map((d: any) => new Date(d).getTime()),
          ),
        ),
        new Date(
          Math.max(
            ...filters.selectedDateArray.map((d: any) => new Date(d).getTime()),
          ),
        ),
      )
    : [];

  let amount: string = "";

  const dataArray: any[] = (() => {
    // Store the currency symbol for output formatting
    let currencySymbol = "₹"; // Default symbol
    const groupedByUsername = sourceReport.reduce(
      (acc, item) => {
        const username = item.username || "";
        if (!acc[username]) {
          acc[username] = {
            username,
            total_requested_amount: 0,
            total_pass_amount: 0,
            expenses: {}, // Store total amounts by date
            a_application_login_id: item.teamId, // Store teamId for modal
            expense_date: {}, // Store date for modal
          };
        }
        item.result.forEach((resultItem) => {
          const itemDate = formatDate(new Date(resultItem.expense_date));
          const dateKey = `combined_amount_${itemDate}`;
          if (!acc[username].expenses[dateKey]) {
            acc[username].expenses[dateKey] = {
              total_requested_amount: 0,
              total_pass_amount: 0,
            };
            acc[username].expense_date[dateKey] = resultItem.expense_date; // Store date for modal
          }
          // Parse amounts and get symbol
          const requested = parseAmount(resultItem.requested_amount);
          const passed = parseAmount(resultItem.pass_amount);
          // Update currency symbol (use the first non-default symbol found)
          if (requested.symbol !== "₹" && currencySymbol === "₹") {
            currencySymbol = requested.symbol;
          }
          if (passed.symbol !== "₹" && currencySymbol === "₹") {
            currencySymbol = passed.symbol;
          }
          // Add parsed values to totals
          acc[username].expenses[dateKey].total_requested_amount +=
            requested.value;
          acc[username].expenses[dateKey].total_pass_amount += passed.value;
          acc[username].total_requested_amount += requested.value;
          acc[username].total_pass_amount += passed.value;
        });
        return acc;
      },
      {} as Record<string, any>,
    );

    amount = Object.values(groupedByUsername)
      .reduce((sum, item: any) => sum + item.total_requested_amount, 0)
      .toString();

    return Object.values(groupedByUsername).map((item) => ({
      ...item,
      total_combined_amount: `${currencySymbol}${item.total_requested_amount}(${currencySymbol}${item.total_pass_amount})`,
      ...Object.keys(item.expenses).reduce(
        (acc, key) => {
          acc[key] =
            `${currencySymbol}${item.expenses[key].total_requested_amount}(${currencySymbol}${item.expenses[key].total_pass_amount})`;
          return acc;
        },
        {} as Record<string, any>,
      ),
    }));
  })();

  useEffect(() => {
    // loadLazyData();
    return () => {
      if (networkTimeout.current) clearTimeout(networkTimeout.current);
    };
  }, [lazyState, sourceReport]);

  const getFilteredData = () => {
    let filteredData = [...dataArray];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;
        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;

          const fieldStr =
            typeof fieldValue === "number"
              ? fieldValue.toString()
              : fieldValue.toString().toLowerCase();

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

  const loadMoreData = async (reset = false) => {
    if (isFetchingRef.current) return;
    if (!hasMore && !reset) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const newData =
        (await fetchExpense(
          filters.selectedDateArray,
          filters.checkedOptionsUser,
          offsetRef.current,
          PAGE_SIZE,
          debouncedSearchText,
          MobileToken,
          getID,
          MobileFlag,
        )) || [];

      if (newData.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (reset) {
        setSourceReport(newData);
      } else {
        setSourceReport((prev) => [...prev, ...newData]);
      }

      offsetRef.current += PAGE_SIZE;
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // const loadLazyData = () => {
  //   setLoading(true);
  //   if (networkTimeout.current) clearTimeout(networkTimeout.current);

  //   networkTimeout.current = setTimeout(() => {
  //     const filteredData = getFilteredData();
  //     const start = lazyState.first;
  //     const end = start + lazyState.rows;
  //     setCustomers(filteredData.slice(start, end));
  //     setTotalRecords(filteredData.length);
  //     setLoading(false);
  //   }, 250);
  // };

  // const onPage = async (event: DataTablePageEvent) => {
  //   const currentPage = event.page ?? 0;
  //   const ul = currentPage * 50;        // upper limit (starting point)
  //   const ll = 50;  // lower limit (ending point)

  //   isPaginationCall.current = true;

  //   setLazyState((prev) => ({
  //     ...prev,
  //     first: event.first,
  //     rows: event.rows,
  //     page: currentPage,
  //   }));

  //   setLoading(true);

  //   try {
  //     await fetchExpense(
  //       setSourceReport,
  //       setError,
  //       selectedDates,
  //       setLoading,
  //       MobileToken,
  //       getID,
  //       MobileFlag,
  //       selectedTeamMembers,
  //       ul,
  //       ll,
  //       debouncedGlobalSearch
  //     );
  //   } catch (err) {
  //     console.error("Error fetching paginated expense data:", err);
  //   } finally {
  //     setLoading(false);
  //     setTimeout(() => {
  //       isPaginationCall.current = false;
  //     }, 100);
  //   }
  // };
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

  const onSelectionChange = (event: { value: any[] }) => {
    const value = event.value || [];
    setSelectedCustomers(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectAll(true);
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  type ExpenseColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    filterCol?: boolean;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: ExpenseColumnDef[] = useMemo(() => {
    const defs: ExpenseColumnDef[] = [
      {
        key: "username",
        label: "Team Member Name",
        header: "Team Member Name",
        width: "250px",
        body: (rowData: IExpenseReport) => rowData.username || "-",
      },
    ];

    dateRange.forEach((date) => {
      const dateStr = formatDate(date);
      const key = `combined_amount_${dateStr}`;

      defs.push({
        key,
        label: dateStr,
        header: dateStr,
        width: "200px",
        filterCol: false,
        body: (rowData: any) => {
          const amount = rowData[key] || "-";

          // Ye field aapke API response ke hisab se change karna padega
          const expenseImage = rowData.exp_image?.[key];
          return (
            <div>
              <span
                style={{
                  cursor: amount !== "-" ? "pointer" : "default",
                  display: "block",
                  marginBottom: "5px",
                }}
                onClick={() => {
                  if (!canEdit) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                  }

                  if (!MobileFlag && amount !== "-" && canEdit) {
                    setEditExpenseStatusItem({
                      a_application_login_id: rowData.a_application_login_id,
                      created_date_time: rowData.expense_date[key],
                    } as IExpenseView);

                    setEditExpenseamount(0);
                    setExpenseTypeId("");
                    setIsCloseConfirmation(true);
                  }
                }}
              >
                {amount}
              </span>

              {expenseImage && (
                <Button
                  icon="pi pi-image"
                  className="p-button-text p-0"
                  style={{
                    color: "green",
                    fontSize: "16px",
                  }}
                  onClick={() => {
                    setImageViewData({
                      image: expenseImage,
                    });
                    setViewerOpen(true);
                  }}
                />
              )}
            </div>
          );
        },
      });
    });

    defs.push({
      key: "total_combined_amount",
      label: "Total Expense",
      header: "Total Expense",
      width: "200px",
      body: (rowData: any) => rowData.total_combined_amount || "₹0(₹0)",
    });

    return defs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.map((d) => formatDate(d)).join(","), canEdit, MobileFlag]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("team_day_wise_expense_report", baseColumnDefs);

  const getExportCellValue = (
    col: ExpenseColumnDef,
    customer: any,
    moneyFormat: "inr" | "plain" = "plain",
  ): string => {
    if (col.key === "username") return customer.username || "-";

    if (col.key === "total_combined_amount") {
      const val = customer.total_combined_amount || "-";
      return moneyFormat === "inr" ? val.replace(/₹/g, "INR") : val;
    }

    if (col.key.startsWith("combined_amount_")) {
      const val = customer[col.key] || "-";
      return moneyFormat === "inr" ? val.replace(/₹/g, "INR") : val;
    }

    return customer[col.key] ?? "-";
  };

  useEffect(() => {
    if (!refreshReport) return;

    setRefreshReport1?.(true);

    const timer = setTimeout(() => {
      setRefreshReport1?.(false);
      setRefreshReport(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshReport, setRefreshReport1]);

  // useEffect(() => {
  //   if (refreshReport == true) {
  //     setRefreshReport1 && setRefreshReport1(true);
  //   }
  //   setRefreshReport1 && setRefreshReport1(false);
  //   setRefreshReport(false);
  // }, [refreshReport, setRefreshReport1]);

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });
    const filteredData = getFilteredData();
    const tableData = (
      (selectedCustomers?.length ?? 0 > 0) ? selectedCustomers : filteredData
    ).map((customer) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, customer, "inr");
      });
      return row;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`team_expense_report_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { top: 20, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text(
          "Team Wise Daily Expense Report",
          data.settings.margin.left,
          10,
        );
      },
    });

    doc.save(`team_expense_report_${new Date().getTime()}.pdf`);
  };

  const exportExcel = () => {
    const filteredData = getFilteredData();
    const exportData = (
      (selectedCustomers?.length ?? 0 > 0) ? selectedCustomers : filteredData
    ).map((customer) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.label] = getExportCellValue(col, customer, "plain");
      });
      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    worksheet["!cols"] = visibleColumns.map(() => ({ wch: 20 }));

    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAsExcelFile(excelBuffer, "team_expense");
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
      (selectedCustomers?.length ?? 0 > 0) ? selectedCustomers : filteredData;
    const printContent = `
    <html>
      <head>
        <title>Team Wise Daily Expense Report</title>
        <style>
          @page {
            size: A2 landscape;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 10mm;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          h1 {
            text-align: center;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <h1>Team Wise Daily Expense Report</h1>
        <table>
          <thead>
            <tr>
              ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableData
              .map(
                (customer) => `
                <tr>
                  ${visibleColumns
                    .map(
                      (col) =>
                        `<td>${getExportCellValue(col, customer, "inr")}</td>`,
                    )
                    .join("")}
                </tr>
              `,
              )
              .join("")}
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

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Team Wise Daily Expense
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }
  const handleDownloadImage = (
    imageUrl: string,
    fileName: string = "expense-image",
  ) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Team Wise Daily Expense
        </h3>
        <br />
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

                  if (dataArray.length === 0) return;

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

                  if (dataArray.length === 0) return;

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

                  if (dataArray.length === 0) return;

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
      <p style={{ textAlign: "left" }}>
        Note :- Requested Amount (Pass Amount)
      </p>
      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          ref={dt}
          value={dataArray}
          lazy
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollable
          scrollHeight="80vh"
          filterDisplay="row"
          dataKey="username"
          virtualScrollerOptions={{
            itemSize: 52,
            lazy: true,
            onLazyLoad: (event: { first: number; last: number }) => {
              if (event.last >= customers.length - 1 && hasMore && !loading) {
                loadMoreData();
              }
            },
            appendOnly: true,
            showLoader: false,
            delay: 0,
          }}
          // paginator
          // first={lazyState.first}
          // rows={lazyState.rows}
          // totalRecords={totalRecords}
          // onPage={onPage}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder}
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
          {visibleColumns.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.header}
              sortable
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
              bodyStyle={
                col.key === "total_combined_amount"
                  ? {
                      width: "250px",
                      textAlign: "right",
                      paddingRight: "20px",
                      fontSize: "14px",
                    }
                  : col.key.startsWith("combined_amount_")
                    ? {
                        width: "200px",
                        textAlign: "right",
                        paddingRight: "50px",
                        fontSize: "14px",
                      }
                    : { fontSize: "14px" }
              }
              body={col.body}
            />
          ))}
        </DataTable>
        {viewerOpen && (
          <ImageViewer
            image={imageViewData}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </div>

      {isCloseConfirmation && (
        <ExpenseStatusUpdateModel
          show={isCloseConfirmation}
          onHide={() => {
            setIsCloseConfirmation(false);
            setRefreshReport(true);
          }}
          title="Update Expense Status"
          message="Are you sure you want to update the expense status?"
          btn1="Close"
          btn2="Reject"
          btn3="Pass"
          teamId={editExpenseStatusItem?.a_application_login_id}
          date={editExpenseStatusItem?.created_date_time}
          setRefreshReport={() => setRefreshReport(true)}
        />
      )}
      {isPass && (
        <CreateExpenseView
          show={isPass}
          onHide={() => setIsPass(false)}
          expenseToEdit={editExpenseStatusItem}
          headerName={`${statusFlag} Status`}
          setRefreshExpense={setRefreshProduct}
          status={statusFlag}
          pass_amount={editExpenseamount.toString()}
          setRefreshReport={() => setRefreshReport(true)}
        />
      )}
      {isReject && (
        <CreateExpenseView
          show={isReject}
          onHide={() => setIsReject(false)}
          expenseToEdit={editExpenseStatusItem}
          headerName={`${statusFlag} Status`}
          setRefreshExpense={setRefreshProduct}
          status={statusFlag}
          pass_amount={editExpenseamount.toString()}
          setRefreshReport={() => setRefreshReport(true)}
        />
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
    </div>
  );
};

export default AllTeamExpense;
