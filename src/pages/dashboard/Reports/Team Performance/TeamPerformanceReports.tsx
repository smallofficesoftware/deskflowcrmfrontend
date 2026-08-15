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
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAllTeamPerformanceData,
  fetchTeamPerformance,
  fetchTeamPerformanceForExport,
  IAttendanceData,
  ITaskPerformance,
} from "./TeamPerformanceReportsController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}
interface ITeamPerformanceReports {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  purchaseOrderTitle: string;
  purchaseTitle: string;
  quotationTitle: string;
  orderTitle: string;
  invoiceTitle: string;
  globalSearch?: string;
  onHide?: () => void;
}

const getNestedValue = (obj: any, path: string): any => {
  try {
    const value = path.split(".").reduce((acc, part) => {
      if (acc == null) return undefined;
      return acc[part];
    }, obj);
    return value ?? "";
  } catch {
    return "";
  }
};

const TeamPerformanceReports = ({
  selectedDates,
  selectedTeamMembers,
  MobileToken,
  getID,
  MobileFlag,
  purchaseOrderTitle,
  purchaseTitle,
  quotationTitle,
  orderTitle,
  invoiceTitle,
  globalSearch,
  onHide,
}: ITeamPerformanceReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<ITaskPerformance[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    ITaskPerformance[]
  >([]);
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] =
    useState<string>("");

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("team_performance");
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
    };

    setFilters("team_performance", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };
  const reportSelectedDates = useMemo<Date[]>(() => {
    return [filters.startSearchDate, filters.endSearchDate]
      .map((date) => {
        if (!date) return null;

        if (date instanceof Date) {
          return date;
        }

        // for DateObject
        if (typeof date === "object" && "toDate" in date) {
          return date.toDate();
        }

        return new Date(date as string | number);
      })
      .filter((date): date is Date => date !== null);
  }, [filters.startSearchDate, filters.endSearchDate]);

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

      setFilters("team_performance", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const [columnTotals, setColumnTotals] = useState({
    contactCount: 0,
    inquiryCount: 0,
    dueTaskCount: 0,
    dueSupportTicketCount: 0,
    quotationCount: 0,
    quotationAmount: 0,
    orderCount: 0,
    orderAmount: 0,
    sellInvoiceCount: 0,
    sellInvoiceAmount: 0,
    purchaseOrderCount: 0,
    purchaseOrderAmount: 0,
    purchaseInvoiceCount: 0,
    purchaseInvoiceAmount: 0,
    visitCount: 0,
    expenseRequested: 0,
    expensePassed: 0,
    pendingReminder: 0,
    creditCount: 0,
    creditAmount: 0,
    debitCount: 0,
    debitAmount: 0,
    currencySymbol: "",
  });

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
      contactCount: { value: null, matchMode: "contains" },
      quotation: { value: null, matchMode: "custom" },
      order: { value: null, matchMode: "custom" },
      sell_invoice: { value: null, matchMode: "custom" },
      purchase_order: { value: null, matchMode: "custom" },
      purchase_invoice: { value: null, matchMode: "custom" },
      visitCount: { value: null, matchMode: "contains" },
      expense: { value: null, matchMode: "custom" },
      pendingReminder: { value: null, matchMode: "contains" },
      account_credit: { value: null, matchMode: "custom" },
      account_debit: { value: null, matchMode: "custom" },
    },
  });
  const [taskPerformance, setTaskPerformance] = useState<ITaskPerformance[]>(
    [],
  );
  const [attendanceData, setAttendanceData] = useState<IAttendanceData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const hasMoreRef = useRef(true);
  const PAGE_SIZE = 50;
  const prevLengthRef = useRef(0);

  const canShare = useCheckUserPermission(
    PAGE_ID.TEAMPERFORMANCE_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.TEAMPERFORMANCE_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const dataArray: ITaskPerformance[] = taskPerformance
    ? taskPerformance.map((item) => ({
        username: item.username,
        contactCount: item.contactCount,
        inquiryCount: item.inquiryCount,
        quotation: {
          count: item.quotation.count,
          amount: item.quotation.amount,
        },
        order: {
          count: item.order.count,
          amount: item.order.amount,
        },
        sell_invoice: {
          count: item.sell_invoice.count,
          amount: item.sell_invoice.amount,
        },
        purchase_order: {
          count: item.purchase_order.count,
          amount: item.purchase_order.amount,
        },
        purchase_invoice: {
          count: item.purchase_invoice.count,
          amount: item.purchase_invoice.amount,
        },
        visitCount: item.visitCount,
        expense: {
          RequestedAmount: item.expense.RequestedAmount,
          PassedAmount: item.expense.PassedAmount,
        },
        salary: item.salary,
        pendingReminder: item.pendingReminder,
        dueTaskCount: item.dueTaskCount,
        dueSupportTicketCount: item.dueSupportTicketCount,
        account: {
          credit: {
            amount: item.account.credit.amount,
            count: item.account.credit.count,
          },
          debit: {
            amount: item.account.debit.amount,
            count: item.account.debit.count,
          },
        },
        attendanceData: item.attendanceData ?? [],
      }))
    : [];

  const dt = useRef<DataTable<ITaskPerformance[]>>(null);
  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!taskPerformance) return;

    const newData = taskPerformance;

    // detect if new data came
    if (newData.length === 0) return;

    if (newData.length < PAGE_SIZE) {
      hasMoreRef.current = false;
    }

    setCustomers((prev) =>
      offsetRef.current === 0 ? newData : [...prev, ...newData],
    );

    offsetRef.current += PAGE_SIZE;
  }, [taskPerformance]);

  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadMoreData(true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
  ]);

  useEffect(() => {
    const parseValue = (value: any): number => {
      if (!value) return 0;
      // Remove currency symbols, spaces, and commas, then convert to number
      const cleaned = String(value).replace(/[₹$€£¥,\s]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const extractCurrencySymbol = (value: any): string => {
      if (!value) return "";
      const str = String(value);
      const match = str.match(/[₹$€£¥]/);
      return match ? match[0] + " " : "";
    };

    // Get currency symbol from first item (assuming all amounts use same currency)
    const currencySymbol =
      customers.length > 0
        ? extractCurrencySymbol(
            customers[0]?.quotation?.amount || customers[0]?.order?.amount,
          )
        : "";

    const totals = customers.reduce(
      (acc, item) => ({
        contactCount: acc.contactCount + parseValue(item.contactCount),
        inquiryCount: acc.inquiryCount + parseValue(item.inquiryCount),
        dueTaskCount: acc.dueTaskCount + parseValue(item.dueTaskCount),
        dueSupportTicketCount:
          acc.dueSupportTicketCount + parseValue(item.dueSupportTicketCount),
        quotationCount: acc.quotationCount + parseValue(item.quotation?.count),
        quotationAmount:
          acc.quotationAmount + parseValue(item.quotation?.amount),
        orderCount: acc.orderCount + parseValue(item.order?.count),
        orderAmount: acc.orderAmount + parseValue(item.order?.amount),
        sellInvoiceCount:
          acc.sellInvoiceCount + parseValue(item.sell_invoice?.count),
        sellInvoiceAmount:
          acc.sellInvoiceAmount + parseValue(item.sell_invoice?.amount),
        purchaseOrderCount:
          acc.purchaseOrderCount + parseValue(item.purchase_order?.count),
        purchaseOrderAmount:
          acc.purchaseOrderAmount + parseValue(item.purchase_order?.amount),
        purchaseInvoiceCount:
          acc.purchaseInvoiceCount + parseValue(item.purchase_invoice?.count),
        purchaseInvoiceAmount:
          acc.purchaseInvoiceAmount + parseValue(item.purchase_invoice?.amount),
        visitCount: acc.visitCount + parseValue(item.visitCount),
        expenseRequested:
          acc.expenseRequested + parseValue(item.expense?.RequestedAmount),
        expensePassed:
          acc.expensePassed + parseValue(item.expense?.PassedAmount),
        pendingReminder: acc.pendingReminder + parseValue(item.pendingReminder),
        creditCount: acc.creditCount + parseValue(item.account?.credit?.count),
        creditAmount:
          acc.creditAmount + parseValue(item.account?.credit?.amount),
        debitCount: acc.debitCount + parseValue(item.account?.debit?.count),
        debitAmount: acc.debitAmount + parseValue(item.account?.debit?.amount),
        currencySymbol: currencySymbol,
      }),
      {
        contactCount: 0,
        inquiryCount: 0,
        dueTaskCount: 0,
        dueSupportTicketCount: 0,
        quotationCount: 0,
        quotationAmount: 0,
        orderCount: 0,
        orderAmount: 0,
        sellInvoiceCount: 0,
        sellInvoiceAmount: 0,
        purchaseOrderCount: 0,
        purchaseOrderAmount: 0,
        purchaseInvoiceCount: 0,
        purchaseInvoiceAmount: 0,
        visitCount: 0,
        expenseRequested: 0,
        expensePassed: 0,
        pendingReminder: 0,
        creditCount: 0,
        creditAmount: 0,
        debitCount: 0,
        debitAmount: 0,
        currencySymbol: "",
      },
    );
    setColumnTotals(totals);
  }, [customers]);

  useEffect(() => {
    loadLazyData();
    return () => {
      if (networkTimeout.current) clearTimeout(networkTimeout.current);
    };
  }, [lazyState, taskPerformance]);

  const loadLazyData = () => {
    setLoading(true);
    if (networkTimeout.current) clearTimeout(networkTimeout.current);

    networkTimeout.current = setTimeout(() => {
      let filteredData = [...dataArray];

      Object.entries(lazyState.filters).forEach(([field, meta]) => {
        if ("value" in meta && meta.value !== null && meta.value !== "") {
          const filterValue = meta.value.toString().toLowerCase();
          const matchMode = meta.matchMode;

          filteredData = filteredData.filter((item) => {
            if (matchMode === "custom") {
              let countValue: any, amountValue: any;
              if (field === "quotation") {
                countValue = getNestedValue(item, "quotation.count");
                amountValue = getNestedValue(item, "quotation.amount");
              } else if (field === "order") {
                countValue = getNestedValue(item, "order.count");
                amountValue = getNestedValue(item, "order.amount");
              } else if (field === "sell_invoice") {
                countValue = getNestedValue(item, "sell_invoice.count");
                amountValue = getNestedValue(item, "sell_invoice.amount");
              } else if (field === "purchase_invoice") {
                countValue = getNestedValue(item, "purchase_invoice.count");
                amountValue = getNestedValue(item, "purchase_invoice.amount");
              } else if (field === "purchase_order") {
                countValue = getNestedValue(item, "purchase_order.count");
                amountValue = getNestedValue(item, "purchase_order.amount");
              } else if (field === "expense") {
                countValue = getNestedValue(item, "expense.RequestedAmount");
                amountValue = getNestedValue(item, "expense.PassedAmount");
              } else if (field === "account_credit") {
                countValue = getNestedValue(item, "account.credit.count");
                amountValue = getNestedValue(item, "account.credit.amount");
              } else if (field === "account_debit") {
                countValue = getNestedValue(item, "account.debit.count");
                amountValue = getNestedValue(item, "account.debit.amount");
              }

              const countStr = countValue?.toString().toLowerCase() || "";
              const amountStr = amountValue?.toString().toLowerCase() || "";
              return (
                countStr.includes(filterValue) ||
                amountStr.includes(filterValue)
              );
            } else {
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

      const start = lazyState.first;
      const end = start + lazyState.rows;
      // const paginatedData = filteredData.slice(start, end);
      setCustomers(filteredData);
      setTotalRecords(filteredData.length);
      setLoading(false);
    }, 250);
  };

  // const onPage = (event: DataTablePageEvent) => {
  //   const currentPage = event.page ?? 0;
  //   const ul = currentPage * 50;
  //   const ll = 50;

  //   setLazyState((prev) => ({
  //     ...prev,
  //     first: event.first,
  //     rows: event.rows,
  //     page: currentPage,
  //   }));

  //   setLoading(true);
  //   fetchTeamPerformance(
  //     setTaskPerformance,
  //     setAttendanceData,
  //     selectedDates,
  //     selectedTeamMembers,
  //     MobileToken,
  //     getID,
  //     MobileFlag,
  //     0, // ul
  //     50,
  //   );
  // };

  const loadMoreData = async (reset = false) => {
    if (isFetchingRef.current) return;
    if (!hasMoreRef.current && !reset) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      if (reset) {
        offsetRef.current = 0;
        setCustomers([]);
        hasMoreRef.current = true;
      }

      prevLengthRef.current = taskPerformance.length;
      const newData = await fetchTeamPerformance(
        setTaskPerformance,
        setAttendanceData,
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        offsetRef.current,
        PAGE_SIZE,
        debouncedSearchText,
      );
    } catch (err) {
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setCustomers([]);
    setTaskPerformance([]);
    setAttendanceData([]);
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

  const onSelectionChange = (event: { value: ITaskPerformance[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedCustomers([...dataArray]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  type TeamColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: ITaskPerformance) => React.ReactNode;
    footer?: () => React.ReactNode;
  };

  const baseColumnDefs: TeamColumnDef[] = useMemo(
    () => [
      {
        key: "username",
        label: "Team Member",
        header: (
          <span>
            Team <br /> Member
          </span>
        ),
        width: "100px",
        body: (rowData) => rowData.username || "N/A",
        footer: () => <strong style={{ fontSize: "17px" }}>Total</strong>,
      },
      {
        key: "contactCount",
        label: "New Contacts",
        header: (
          <span>
            New <br /> Contacts
          </span>
        ),
        width: "90px",
        body: (rowData) => rowData.contactCount ?? "N/A",
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >
            {columnTotals.contactCount}
          </strong>
        ),
      },
      {
        key: "inquiryCount",
        label: "Inquiry",
        header: <span>Inquiry</span>,
        width: "90px",
        body: (rowData) => rowData.inquiryCount ?? "N/A",
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >
            {columnTotals.inquiryCount}
          </strong>
        ),
      },
      {
        key: "quotation",
        label: quotationTitle,
        header: `${quotationTitle.replace(/ /g, "\n")}`,
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.quotation?.count ?? "N/A"} (${rowData.quotation?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ fontSize: "17px", display: "block", textAlign: "right" }}
          >{`${columnTotals.quotationCount} (${columnTotals.currencySymbol}${columnTotals.quotationAmount.toLocaleString()})`}</strong>
        ),
      },
      {
        key: "order",
        label: orderTitle,
        header: `${orderTitle.replace(/ /g, "\n")}`,
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.order?.count ?? "N/A"} (${rowData.order?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.orderCount} (${columnTotals.currencySymbol}${columnTotals.orderAmount.toLocaleString()})`}</strong>
        ),
      },
      {
        key: "sell_invoice",
        label: invoiceTitle,
        header: `${invoiceTitle.replace(/ /g, "\n")}`,
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.sell_invoice?.count ?? "N/A"} (${rowData.sell_invoice?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.sellInvoiceCount} (${columnTotals.currencySymbol}${columnTotals.sellInvoiceAmount.toLocaleString()})`}</strong>
        ),
      },
      {
        key: "purchase_order",
        label: purchaseOrderTitle,
        header: `${purchaseOrderTitle.replace(/ /g, "\n")}`,
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.purchase_order?.count ?? "N/A"} (${rowData.purchase_order?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.purchaseOrderCount} (${columnTotals.currencySymbol}${columnTotals.purchaseOrderAmount.toLocaleString()})`}</strong>
        ),
      },
      {
        key: "purchase_invoice",
        label: purchaseTitle,
        header: `${purchaseTitle.replace(/ /g, "\n")}`,
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.purchase_invoice?.count ?? "N/A"} (${rowData.purchase_invoice?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.purchaseInvoiceCount} (${columnTotals.currencySymbol}${columnTotals.purchaseInvoiceAmount.toLocaleString()})`}</strong>
        ),
      },
      {
        key: "visitCount",
        label: "Visit",
        header: "Visit",
        width: "90px",
        body: (rowData) => rowData.visitCount ?? "N/A",
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >
            {columnTotals.visitCount}
          </strong>
        ),
      },
      {
        key: "expense",
        label: "Passed Expense",
        header: (
          <span>
            Passed <br /> Expense
          </span>
        ),
        width: "100px",
        filterMatchMode: "custom",
        body: (rowData) => {
          const requested = rowData.expense?.RequestedAmount;
          const passed = rowData.expense?.PassedAmount;

          const parts = [];

          if (
            requested !== undefined &&
            requested !== null &&
            requested > 0
          ) {
            parts.push(`R ${requested}`);
          }

          if (passed !== undefined && passed !== null && passed > 0) {
            parts.push(`P ${passed}`);
          }

          return passed ? passed : "";
        },
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.currencySymbol}${columnTotals.expensePassed.toLocaleString()}`}</strong>
        ),
      },
      {
        key: "pendingReminder",
        label: "Pending Reminder",
        header: (
          <span>
            Pending <br /> Reminder
          </span>
        ),
        width: "100px",
        body: (rowData) => rowData.pendingReminder ?? "N/A",
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >
            {columnTotals.pendingReminder}
          </strong>
        ),
      },
      {
        key: "dueTaskCount",
        label: "Due Task",
        header: <span>Due Task</span>,
        width: "100px",
        body: (rowData) => rowData.dueTaskCount ?? "N/A",
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >
            {columnTotals.dueTaskCount}
          </strong>
        ),
      },
      {
        key: "dueSupportTicketCount",
        label: "Due Support Ticket",
        header: (
          <span>
            Due Support
            <br /> Ticket
          </span>
        ),
        width: "100px",
        body: (rowData) => rowData.dueSupportTicketCount ?? "N/A",
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >
            {columnTotals.dueSupportTicketCount}
          </strong>
        ),
      },
      {
        key: "account_credit",
        label: "Credit",
        header: "Credit",
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.account?.credit?.count ?? "N/A"} (${rowData.account?.credit?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.creditCount} (${columnTotals.currencySymbol}${columnTotals.creditAmount.toLocaleString()})`}</strong>
        ),
      },
      {
        key: "account_debit",
        label: "Debit",
        header: "Debit",
        width: "135px",
        filterMatchMode: "custom",
        body: (rowData) =>
          `${rowData.account?.debit?.count ?? "N/A"} (${rowData.account?.debit?.amount ?? "N/A"})`,
        footer: () => (
          <strong
            style={{ display: "block", fontSize: "17px", textAlign: "right" }}
          >{`${columnTotals.debitCount} (${columnTotals.currencySymbol}${columnTotals.debitAmount.toLocaleString()})`}</strong>
        ),
      },
    ],
    [
      quotationTitle,
      orderTitle,
      invoiceTitle,
      purchaseOrderTitle,
      purchaseTitle,
      columnTotals,
    ],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("team_performance_report", baseColumnDefs);

  const getExportCellValue = (
    col: TeamColumnDef,
    customer: ITaskPerformance,
  ): string => {
    switch (col.key) {
      case "username":
        return customer.username || "-";
      case "contactCount":
        return String(customer.contactCount ?? "-");
      case "inquiryCount":
        return String(customer.inquiryCount ?? "-");
      case "quotation":
        return `${customer.quotation?.count ?? "-"} (${customer.quotation?.amount ?? "-"})`;
      case "order":
        return `${customer.order?.count ?? "-"} (${customer.order?.amount ?? "-"})`;
      case "sell_invoice":
        return `${customer.sell_invoice?.count ?? "-"} (${customer.sell_invoice?.amount ?? "-"})`;
      case "purchase_order":
        return `${customer.purchase_order?.count ?? "-"} (${customer.purchase_order?.amount ?? "-"})`;
      case "purchase_invoice":
        return `${customer.purchase_invoice?.count ?? "-"} (${customer.purchase_invoice?.amount ?? "-"})`;
      case "visitCount":
        return String(customer.visitCount ?? "-");
      case "expense":
        return String(customer.expense?.PassedAmount ?? "-");
      case "pendingReminder":
        return String(customer.pendingReminder ?? "-");
      case "dueTaskCount":
        return String(customer.dueTaskCount ?? "-");
      case "dueSupportTicketCount":
        return String(customer.dueSupportTicketCount ?? "-");
      case "account_credit":
        return `${customer.account?.credit?.count ?? "-"} (${customer.account?.credit?.amount ?? "-"})`;
      case "account_debit":
        return `${customer.account?.debit?.count ?? "-"} (${customer.account?.debit?.amount ?? "-"})`;
      default:
        return "-";
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });

    const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );

    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied
          ? customers
          : dataArray;

    const tableData = dataToExport.map((customer) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.label] = getExportCellValue(col, customer);
      });
      return row;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`team_performance_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.label,
    }));

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: "helvetica",
        halign: "left",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
        fontSize: 8,
      },
      margin: { top: 20, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(12);
        doc.text("Team Performance Reports", data.settings.margin.left, 10);
      },
    });

    doc.save(`team_performance_${new Date().getTime()}.pdf`);
  };

  // const exportExcel = () => {
  //   const isFilterApplied = Object.values(lazyState.filters).some(
  //     (filter) => "value" in filter && filter.value !== null && filter.value !== ""
  //   );

  //   const dataToExport = selectedCustomers.length > 0 ? selectedCustomers : (isFilterApplied ? customers : dataArray);

  //   const exportData = dataToExport.map((customer) => ({
  //     Name: customer.username || "-",
  //     "Contact Total": customer.contactCount ?? "-",
  //     [`${quotationTitle} Total`]: customer.quotation?.count ?? "-",
  //     [`${quotationTitle} Amount`]: customer.quotation?.amount ?? "-",
  //     [`${orderTitle} Total`]: customer.order?.count ?? "-",
  //     [`${orderTitle} Amount`]: customer.order?.amount ?? "-",
  //     [`${invoiceTitle} Total`]: customer.sell_invoice?.count ?? "-",
  //     [`${invoiceTitle} Amount`]: customer.sell_invoice?.amount ?? "-",
  //     [`${purchaseOrderTitle} Total`]: customer.purchase_order?.count ?? "-",
  //     [`${purchaseOrderTitle} Amount`]: customer.purchase_order?.amount ?? "-",
  //     [`${purchaseTitle} Total`]: customer.purchase_invoice?.count ?? "-",
  //     [`${purchaseTitle} Amount`]: customer.purchase_invoice?.amount ?? "-",
  //     Visits: customer.visitCount ?? "-",
  //     "Expense Requested": customer.expense?.RequestedAmount ?? "-",
  //     "Expense Passed": customer.expense?.PassedAmount ?? "-",
  //     "Pending Reminder Total": customer.pendingReminder ?? "-",
  //     "Credit Total": customer.account?.credit?.count ?? "-", // Added
  //     "Credit Amount": customer.account?.credit?.amount ?? "-", // Added
  //     "Debit Total": customer.account?.debit?.count ?? "-", // Added
  //     "Debit Amount": customer.account?.debit?.amount ?? "-", // Added
  //   }));
  //   const worksheet = xlsx.utils.json_to_sheet(exportData);

  //   worksheet["!cols"] = [
  //     { wpx: 150 }, // Name
  //     { wpx: 100 }, // Contact Total
  //     { wpx: 100 }, // Quotation Total
  //     { wpx: 100 }, // Quotation Amount
  //     { wpx: 100 }, // Sales Order Total
  //     { wpx: 100 }, // Sales Order Amount
  //     { wpx: 100 }, // Sales Invoice Total
  //     { wpx: 100 }, // Sales Invoice Amount
  //     { wpx: 100 }, // Purchase Order Total
  //     { wpx: 100 }, // Purchase Order Amount
  //     { wpx: 100 }, // Purchase Invoice Total
  //     { wpx: 100 }, // Purchase Invoice Amount
  //     { wpx: 80 }, // Visits
  //     { wpx: 100 }, // Expense Requested
  //     { wpx: 100 }, // Expense Passed
  //     { wpx: 100 }, // Pending Reminder Total
  //     { wpx: 100 }, // Credit Total // Added
  //     { wpx: 100 }, // Credit Amount // Added
  //     { wpx: 100 }, // Debit Total // Added
  //     { wpx: 100 }, // Debit Amount // Added
  //   ];

  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "team_performance");
  // };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const allContacts = await exportAllTeamPerformanceData(
        (offset, limit) =>
          fetchTeamPerformanceForExport(
            filters.selectedDateArray,
            filters.checkedOptionsUser,
            MobileToken,
            getID,
            offset,
            limit,
          ),
        500,
      );

      if (!allContacts.length) {
        toast.warn("No data to export");
        return;
      }

      const excelRows = (
        selectedCustomers.length > 0 ? selectedCustomers : allContacts
      ).map((customer) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, customer);
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(excelRows);
      worksheet["!cols"] = Object.keys(excelRows[0]).map(() => ({
        wch: 25,
      }));

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Team Performance");

      const buffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Team_Performance_Report_${Date.now()}.xlsx`,
      );

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export full data");
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
    const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );

    // Use selectedCustomers if any rows are selected, else fall back to existing logic
    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied
          ? customers
          : dataArray;

    const printContent = `
  <html>
    <head>
      <title>Print Team Performance Data</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1 { text-align: center; }
      </style>
    </head>
    <body>
      <h1>Team Performance Reports</h1>
      <table>
        <thead>
          <tr>
            ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${dataToExport
            .map(
              (customer) => `
                <tr>
                  ${visibleColumns
                    .map(
                      (col) =>
                        `<td>${getExportCellValue(col, customer)}</td>`,
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
          Team Performance
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
          Team Performance
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
                className={`labelDropLeft ${
                  isExportDropdownOpen ? "isVisible" : "isHidden"
                }`}
                style={{
                  width: "170px",
                  position: "absolute",
                  right: "0",
                  top: "100%",
                  zIndex: 999,
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

      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          ref={dt}
          value={customers}
          lazy
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          scrollable
          filterDisplay="row"
          dataKey="username"
          // paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          // onPage={onPage}
          scrollHeight="80vh"
          loading={loading}
          virtualScrollerOptions={{
            itemSize: 50,
            lazy: true,
            onLazyLoad: (event: any) => {
              if (
                event.last >= customers.length - 1 &&
                hasMoreRef.current &&
                !loading
              ) {
                loadMoreData();
              }
            },
            appendOnly: true,
            showLoader: true,
            delay: 0,
          }}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
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
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode={col.filterMatchMode || "contains"}
              headerClassName="center-header"
              headerStyle={{
                width: col.width || "150px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
                whiteSpace:
                  col.key === "quotation" ||
                  col.key === "order" ||
                  col.key === "sell_invoice" ||
                  col.key === "purchase_order" ||
                  col.key === "purchase_invoice"
                    ? "pre-wrap"
                    : undefined,
              }}
              bodyStyle={{
                fontSize: "14px",
                textAlign: col.key === "username" ? undefined : "right",
              }}
              body={col.body}
              footer={col.footer}
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
          filtersToShow={[1]}
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

export default TeamPerformanceReports;
