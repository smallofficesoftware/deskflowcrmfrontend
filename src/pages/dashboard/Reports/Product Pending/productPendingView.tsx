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
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import { exportReportExcel } from "../../../../services/reportExportService";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAllProductPendingData,
  fetchProductPendingForExport,
  fetchProductReport,
} from "./productPendingController";

export interface IProductSalesData {
  item_product_id: number;
  item_product_name: string;
  item_product_code: string;
  item_category_name: string;
  salesorder?: string;
  salesinvoice?: string;
  purchaseinvoice?: string;
  purchaseorder?: string;
  pending_sales?: string;
  pending_purchase?: string;
}

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IProductSalesPurchaseDataReports {
  selectedDates?: DateObject[];
  purchaseOrderTitle: string;
  purchaseTitle: string;
  quotationTitle: string;
  orderTitle: string;
  invoiceTitle: string;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedProduct?: string | null;
  selectedCategory?: string | null;
  globalSearch?: string;
  selectedContactId?: string;
  referenceWiseContact?: number;
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

const parseQuantityAmount = (
  value: string | undefined,
): { quantity: number; amount: number } => {
  if (!value || value === "-") return { quantity: 0, amount: 0 };
  const match = value.match(
    /^(\d+)(?:\s*₹\s*|\s*\(₹)?(\d*\.?\d*)(\s*\)\s*|\s*\$+)?$/,
  );
  if (!match) {
    return { quantity: 0, amount: 0 };
  }
  const quantity = parseInt(match[1], 10) || 0;
  const amount = parseFloat(match[2]) || 0;
  return { quantity, amount };
};

const calculatePending = (
  order: string | undefined,
  invoice: string | undefined,
): string => {
  const orderValues = parseQuantityAmount(order);
  const invoiceValues = parseQuantityAmount(invoice);
  const pendingQuantity = orderValues.quantity - invoiceValues.quantity;
  const pendingAmount = orderValues.amount - invoiceValues.amount;
  return pendingQuantity >= 0 && pendingAmount >= 0
    ? `${pendingQuantity}(₹${pendingAmount.toFixed(2)})`
    : "-";
};

const calculateColumnTotals = (data: any[], field: string): string => {
  const totals = data.reduce(
    (acc, item) => {
      const value = getNestedValue(item, field);

      // Yahan assume kar rahe ki value is something like "5($100)" or "3(₹50)" or just number
      let quantity = 0;
      let amount = 0;
      let symbol = acc.symbol;

      if (value) {
        const strValue = String(value);

        // Extract quantity (before bracket)
        const qtyMatch = strValue.match(/^(\d+)/);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
        }

        // Extract amount (inside bracket)
        const amtMatch = strValue.match(/\(([^)]+)\)/);
        if (amtMatch) {
          const rawAmount = amtMatch[1];
          amount = parseFloat(rawAmount.replace(/[^0-9.]/g, "")) || 0;
          const extractedSymbol = rawAmount.replace(/[0-9.,\s]/g, "");
          if (extractedSymbol) {
            symbol = extractedSymbol;
          }
        }
      }

      return {
        quantity: acc.quantity + quantity,
        amount: acc.amount + amount,
        symbol,
      };
    },
    { quantity: 0, amount: 0, symbol: "" },
  );

  return totals.quantity > 0 || totals.amount > 0
    ? `${totals.quantity}(${totals.symbol}${totals.amount.toFixed(2)})`
    : "-";
};

const ProductPendingView = ({
  selectedDates,
  purchaseOrderTitle,
  purchaseTitle,
  quotationTitle,
  orderTitle,
  invoiceTitle,
  MobileToken,
  getID,
  MobileFlag,
  selectedProduct,
  selectedCategory,
  globalSearch,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IProductSalesPurchaseDataReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<IProductSalesData[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    IProductSalesData[]
  >([]);
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] =
    useState<string>("");
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("product_wise_pending_report");
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

    setFilters("product_wise_pending_report", updatedFilters);

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

      setFilters("product_wise_pending_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.PRODUCTPENDING_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.PRODUCTPENDING_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 500,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      item_product_name: { value: null, matchMode: "contains" },
      salesorder: { value: null, matchMode: "contains" },
      salesinvoice: { value: null, matchMode: "contains" },
      purchaseinvoice: { value: null, matchMode: "contains" },
      purchaseorder: { value: null, matchMode: "contains" },
      pending_sales: { value: null, matchMode: "contains" },
      pending_purchase: { value: null, matchMode: "contains" },
    },
  });
  const [productData, setProductData] = useState<IProductSalesData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IProductSalesData[]>>(null);
  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataArray: any[] = productData.map((item) => ({
    item_product_id: item.item_product_id,
    item_product_name: item.item_product_name || "-",
    item_product_code: item.item_product_code,
    item_category_name: item.item_category_name,
    salesorder: item.salesorder ?? "-",
    salesinvoice: item.salesinvoice ?? "-",
    purchaseinvoice: item.purchaseinvoice ?? "-",
    purchaseorder: item.purchaseorder ?? "-",
    pending_sales: calculatePending(item.salesorder, item.salesinvoice),
    pending_purchase: calculatePending(
      item.purchaseorder,
      item.purchaseinvoice,
    ),
  }));

  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    isLoadingMore.current = false;
    setHasMore(true);
    loadTasks(0, 50, true);
  }, [
    filters.selectedDateArray,
    debouncedSearchText,
    filters.selectedContactId,
    filters.referenceWiseContact,
  ]);

  const mergeData = (
    existing: IProductSalesData[],
    newEntries: IProductSalesData[],
  ) => {
    const productMap = new Map<number, IProductSalesData>(
      existing.map((item) => [item.item_product_id, { ...item }]),
    );

    type MutableFields = Pick<
      IProductSalesData,
      | "salesorder"
      | "salesinvoice"
      | "purchaseinvoice"
      | "purchaseorder"
      | "pending_sales"
      | "pending_purchase"
    >;

    const fields: (keyof MutableFields)[] = [
      "salesorder",
      "salesinvoice",
      "purchaseinvoice",
      "purchaseorder",
      "pending_sales",
      "pending_purchase",
    ];

    newEntries.forEach((newItem) => {
      const id = newItem.item_product_id;
      if (productMap.has(id)) {
        const existingItem = productMap.get(id)!;

        fields.forEach((field) => {
          const existingValue = existingItem[field] as string | undefined;
          const newValue = newItem[field] as string | undefined;

          if (newValue && newValue !== "-") {
            if (existingValue && existingValue !== "-") {
              const { quantity: q1, amount: a1 } =
                parseQuantityAmount(existingValue);
              const { quantity: q2, amount: a2 } =
                parseQuantityAmount(newValue);
              const totalQ = q1 + q2;
              const totalA = a1 + a2;
              existingItem[field] = `${totalQ}(₹${totalA.toFixed(2)})`;
            } else {
              existingItem[field] = newValue;
            }
          }
        });
      } else {
        productMap.set(id, { ...newItem });
      }
    });

    return Array.from(productMap.values());
  };

  const loadTasks = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current) return;
    if (!hasMore && !reset) return;

    isLoadingMore.current = true;
    setLoading(true);

    try {
      const newData = await fetchProductReport(
        filters.selectedDateArray,
        setError,
        MobileToken,
        getID,
        MobileFlag,
        filters.selectedProductId,
        filters.selectedCategoryId,
        debouncedSearchText,
        filters.selectedContactId,
        offset,
        limit,
        filters.referenceWiseContact,
      );

      if (newData.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true); // ← add karo (safety ke liye)
      }

      setCustomers((prev) => (reset ? newData : mergeData(prev, newData)));

      currentOffset.current += newData.length;
    } catch {
      isLoadingMore.current = false;
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    currentOffset.current = 0;
    setHasMore(true);
    setCustomers([]);
    loadTasks(0, 50, true);
  };

  const isFilterApplied = () => {
    return Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );
  };

  // useEffect(() => {
  //   loadLazyData();

  // }, []);

  // const loadLazyData = () => {
  //   setLoading(true);
  //   if (networkTimeout.current) clearTimeout(networkTimeout.current);

  //   networkTimeout.current = setTimeout(() => {
  //     let filteredData = [...dataArray];

  //     Object.entries(lazyState.filters).forEach(([field, meta]) => {
  //       if ("value" in meta && meta.value !== null && meta.value !== "") {
  //         const filterValue = meta.value.toString().toLowerCase();
  //         const matchMode = meta.matchMode;

  //         filteredData = filteredData.filter((item) => {
  //           const fieldValue = getNestedValue(item, field);
  //           if (fieldValue === undefined || fieldValue === null) return false;

  //           const fieldStr = fieldValue.toString().toLowerCase();

  //           switch (matchMode) {
  //             case "contains":
  //               return fieldStr.includes(filterValue);
  //             case "notContains":
  //               return !fieldStr.includes(filterValue);
  //             case "startsWith":
  //               return fieldStr.startsWith(filterValue);
  //             case "endsWith":
  //               return fieldStr.endsWith(filterValue);
  //             case "equals":
  //               return fieldStr === filterValue;
  //             case "notEquals":
  //               return fieldStr !== filterValue;
  //             default:
  //               return true;
  //           }
  //         });
  //       }
  //     });

  //     if (lazyState.sortField) {
  //       filteredData.sort((a, b) => {
  //         const aValue = getNestedValue(a, lazyState.sortField!);
  //         const bValue = getNestedValue(b, lazyState.sortField!);
  //         if (aValue === undefined || aValue === null) return 1;
  //         if (bValue === undefined || bValue === null) return -1;
  //         return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
  //       });
  //       if (lazyState.sortOrder === -1) filteredData.reverse();
  //     }

  //     const start = lazyState.first;
  //     const end = start + lazyState.rows;
  //     const paginatedData = filteredData.slice(start, end);
  //     setCustomers(paginatedData);
  //     setTotalRecords(filteredData.length);
  //     setLoading(false);
  //   }, 250);
  // };
  const getFilteredData = () => {
    let filteredData = [...customers];

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

  const onSelectionChange = (event: { value: IProductSalesData[] }) => {
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

  type ProductPendingColumnDef = ColumnDef & {
    header: React.ReactNode;
    headerStyleOverride: React.CSSProperties;
    bodyStyleOverride?: React.CSSProperties;
    styleOverride?: React.CSSProperties;
    footer?: React.ReactNode | (() => React.ReactNode);
    footerStyle?: React.CSSProperties;
    body: (rowData: IProductSalesData) => React.ReactNode;
  };

  const baseColumnDefs: ProductPendingColumnDef[] = useMemo(
    () => [
      {
        key: "item_product_name",
        label: "Product Name",
        header: (
          <span>
            Product <br /> Name
          </span>
        ),
        headerStyleOverride: {
          width: "150px",
          position: "sticky",
          top: 0,
          zIndex: 1,
        },
        body: (rowData: IProductSalesData) =>
          `${rowData.item_product_name ?? "-"}${rowData.item_product_code ? `- ${rowData.item_product_code}` : ""}`,
        footer: "Total",
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
        },
      },
      {
        key: "item_category_name",
        label: "Product Category",
        header: (
          <span>
            Product <br /> Category
          </span>
        ),
        headerStyleOverride: {
          width: "125px",
          position: "sticky",
          top: 0,
          zIndex: 1,
        },
        body: (rowData: IProductSalesData) =>
          `${rowData.item_category_name ?? "-"}`,
      },
      {
        key: "salesorder",
        label: orderTitle,
        header: `${orderTitle.replace(/ /g, "\n")}`,
        styleOverride: { background: "#d7e8f8ff" },
        headerStyleOverride: {
          width: "125px",
          whiteSpace: "pre-wrap",
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#d7e8f8ff",
        },
        bodyStyleOverride: { textAlign: "right" },
        body: (rowData: IProductSalesData) => rowData.salesorder ?? "-",
        footer: () =>
          calculateColumnTotals(
            isFilterApplied() ? customers : dataArray,
            "salesorder",
          ),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#d7e8f8ff",
          textAlign: "right",
        },
      },
      {
        key: "salesinvoice",
        label: invoiceTitle,
        header: `${invoiceTitle.replace(/ /g, "\n")}`,
        styleOverride: { background: "#d7e8f8ff" },
        headerStyleOverride: {
          width: "125px",
          whiteSpace: "pre-wrap",
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#d7e8f8ff",
        },
        bodyStyleOverride: { textAlign: "right" },
        body: (rowData: IProductSalesData) => rowData.salesinvoice ?? "-",
        footer: () =>
          calculateColumnTotals(
            isFilterApplied() ? customers : dataArray,
            "salesinvoice",
          ),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#d7e8f8ff",
          textAlign: "right",
        },
      },
      {
        key: "pending_sales",
        label: "Pending Sales",
        header: (
          <span>
            Pending <br /> Sales
          </span>
        ),
        styleOverride: { background: "#d7e8f8ff" },
        headerStyleOverride: {
          width: "125px",
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#d7e8f8ff",
        },
        bodyStyleOverride: { textAlign: "right" },
        body: (rowData: IProductSalesData) => rowData.pending_sales ?? "-",
        footer: () =>
          calculateColumnTotals(
            isFilterApplied() ? customers : dataArray,
            "pending_sales",
          ),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#d7e8f8ff",
          textAlign: "right",
        },
      },
      {
        key: "purchaseorder",
        label: purchaseOrderTitle,
        header: `${purchaseOrderTitle.replace(/ /g, "\n")}`,
        styleOverride: { background: "#f1f8d7ff" },
        headerStyleOverride: {
          width: "125px",
          whiteSpace: "pre-wrap",
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#f1f8d7ff",
        },
        bodyStyleOverride: { textAlign: "right" },
        body: (rowData: IProductSalesData) => rowData.purchaseorder ?? "-",
        footer: () =>
          calculateColumnTotals(
            isFilterApplied() ? customers : dataArray,
            "purchaseorder",
          ),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f1f8d7ff",
          textAlign: "right",
        },
      },
      {
        key: "purchaseinvoice",
        label: purchaseTitle,
        header: `${purchaseTitle.replace(/ /g, "\n")}`,
        styleOverride: { background: "#f1f8d7ff" },
        headerStyleOverride: {
          width: "125px",
          whiteSpace: "pre-wrap",
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#f1f8d7ff",
        },
        bodyStyleOverride: { textAlign: "right" },
        body: (rowData: IProductSalesData) => rowData.purchaseinvoice ?? "-",
        footer: () =>
          calculateColumnTotals(
            isFilterApplied() ? customers : dataArray,
            "purchaseinvoice",
          ),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f1f8d7ff",
          textAlign: "right",
        },
      },
      {
        key: "pending_purchase",
        label: "Pending Purchase",
        header: (
          <span>
            Pending <br /> Purchase
          </span>
        ),
        styleOverride: { background: "#f1f8d7ff" },
        headerStyleOverride: {
          width: "125px",
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#f1f8d7ff",
        },
        bodyStyleOverride: { textAlign: "right" },
        body: (rowData: IProductSalesData) => rowData.pending_purchase ?? "-",
        footer: () =>
          calculateColumnTotals(
            isFilterApplied() ? customers : dataArray,
            "pending_purchase",
          ),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f1f8d7ff",
          textAlign: "right",
        },
      },
    ],
    [
      orderTitle,
      invoiceTitle,
      purchaseOrderTitle,
      purchaseTitle,
      customers,
      dataArray,
    ],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("product_pending_report", baseColumnDefs);

  const getExportCellValue = (
    col: { key: string },
    item: any,
    format: "pdf" | "excel" | "print" = "pdf",
  ): string => {
    let value: string;
    switch (col.key) {
      case "item_product_name":
        value = `${item.item_product_name ?? "-"}${item.item_product_code ? ` - ${item.item_product_code}` : ""}`;
        break;
      case "item_category_name":
        value = item.item_category_name ?? "-";
        break;
      default:
        value = item[col.key] ?? "-";
    }
    return format === "pdf" ? value.replace(/₹/g, "INR") : value;
  };

  const getExportTotalValue = (
    col: { key: string },
    dataToExport: any[],
    format: "pdf" | "excel" | "print" = "pdf",
  ): string => {
    if (col.key === "item_product_name") return "Total";
    if (col.key === "item_category_name") return "";
    const total = calculateColumnTotals(dataToExport, col.key);
    return format === "pdf" ? total.replace(/₹/g, "INR") : total;
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied()
          ? customers
          : dataArray;

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    const tableData = dataToExport.map((customer) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, customer, "pdf");
      });
      return row;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`product_sales_purchase_pending_${new Date().getTime()}.pdf`);
      return;
    }

    const totals: any = {};
    visibleColumns.forEach((col) => {
      totals[col.key] = getExportTotalValue(col, dataToExport, "pdf");
    });
    tableData.push(totals);

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        doc.text(
          "Product Sales & Purchase Pending Report",
          data.settings.margin.left,
          10,
        );
      },
      didParseCell: (data: any) => {
        if (
          data.row.index === tableData.length - 1 &&
          data.row.section === "body"
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`product_sales_purchase_pending_${new Date().getTime()}.pdf`);
  };

  // const exportExcel = () => {
  //     const filteredData = getFilteredData();
  //   const exportData = (
  //     selectedCustomers.length > 0 ? selectedCustomers : isFilterApplied() ? filteredData : customers
  //   ).map((customer) => ({
  //     "Product Name": `${customer.item_product_name ?? '-'}${customer.item_product_code ? ` - ${customer.item_product_code}` : ''}`,
  //     "Product Category": `${customer.item_category_name ?? '-'}`,
  //     "Sales Order": customer.salesorder ?? "-",
  //     "Sales Invoice": customer.salesinvoice ?? "-",
  //     "Pending Sales": customer.pending_sales ?? "-",
  //     "Purchase Invoice": customer.purchaseinvoice ?? "-",
  //     "Purchase Order": customer.purchaseorder ?? "-",
  //     "Pending Purchase": customer.pending_purchase ?? "-",
  //   }));

  //   const totals = {
  //     "Product Name": "Total",
  //     "Product Category": "",
  //     "Sales Order": calculateColumnTotals(exportData, "salesorder"),
  //     "Sales Invoice": calculateColumnTotals(exportData, "salesinvoice"),
  //     "Pending Sales": calculateColumnTotals(exportData, "pending_sales"),
  //     "Purchase Invoice": calculateColumnTotals(
  //       exportData,
  //       "purchaseinvoice"
  //     ),
  //     "Purchase Order": calculateColumnTotals(exportData, "purchaseorder"),
  //     "Pending Purchase": calculateColumnTotals(
  //       exportData,
  //       "pending_purchase"
  //     ),
  //   };

  //   exportData.push(totals);

  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!(cols"] = [
  //     { wpx: 250 },
  //     { wpx: 220 },
  //     { wpx: 220 },
  //     { wpx: 220 },
  //     { wpx: 220 },
  //     { wpx: 220 },
  //     { wpx: 220 },
  //   ];
  //   const workbook = { Sheets: { Data: worksheet }, SheetNames: ["Data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "product_sales_purchase_pending");
  // };

  // Same shape as Category Pending: backend endpoint returns separately-
  // paginated raw arrays, pivoted client-side only - keep the existing
  // fetch+pivot, swap the workbook-building tail for the shared
  // server-side generator (rows sent explicitly, no reportType registry
  // entry needed). The original totals row referenced column labels
  // ("Quotation", "Order", "Invoice"...) that don't match this report's
  // actual columns (salesorder/salesinvoice/purchaseorder/purchaseinvoice/
  // pending_sales/pending_purchase) - it was already dead/no-op before
  // this change, so it's dropped rather than migrated.
  const exportExcel = async () => {
    try {
      setLoading(true);

      const allContacts = await exportAllProductPendingData(
        (offset, limit) =>
          fetchProductPendingForExport(
            filters.selectedDateArray,
            setError,
            MobileToken,
            getID,
            MobileFlag,
            filters.selectedProductId,
            filters.selectedCategoryId,
            debouncedSearchText,
            filters.selectedContactId,
            offset,
            limit,
          ),
        500,
      );

      if (!allContacts.length) {
        toast.warn("No data to export");
        return;
      }

      const rows = (
        selectedCustomers.length > 0
          ? selectedCustomers
          : isFilterApplied()
            ? customers
            : dataArray
      ).map((item) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.key] = getExportCellValue(col, item, "excel");
        });
        return row;
      });

      await exportReportExcel({
        reportType: "product_pending_report",
        filters: {},
        columns: visibleColumns,
        fileName: "Product_Pending_Report",
        rows,
      });

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export full data");
    } finally {
      setLoading(false);
    }
  };

  const printTable = () => {
    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied()
          ? customers
          : dataArray;

    const leftAlignedKeys = ["item_product_name", "item_category_name"];

    const printContent = `
      <html>
        <head>
          <title>Product Pending Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
            .total-row { font-weight: bold; }
            .text-right { text-align: right; padding-right: 50px; }
          </style>
        </head>
        <body>
          <h1>Product Pending Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns
                  .map((col) =>
                    leftAlignedKeys.includes(col.key)
                      ? `<th>${col.label}</th>`
                      : `<th style="text-align: right; padding-right: 50px;">${col.label}</th>`,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${dataToExport
                .map(
                  (customer) => `
                <tr>
                  ${visibleColumns
                    .map((col) =>
                      leftAlignedKeys.includes(col.key)
                        ? `<td>${getExportCellValue(col, customer, "print")}</td>`
                        : `<td class="text-right">${getExportCellValue(col, customer, "print")}</td>`,
                    )
                    .join("")}
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                ${visibleColumns
                  .map((col) =>
                    col.key === "item_product_name"
                      ? `<td>Total</td>`
                      : col.key === "item_category_name"
                        ? `<td></td>`
                        : `<td class="text-right">${getExportTotalValue(col, dataToExport, "print")}</td>`,
                  )
                  .join("")}
              </tr>
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
          Product Pending
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
          Product Pending
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

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      <div
        className="report_card"
        style={{
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DataTable
          ref={dt}
          value={customers}
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          scrollable
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 50,
            lazy: false,
            appendOnly: true,
            showLoader: true,
            numToleratedItems: 50,
            delay: 150,
            onLazyLoad: (event: {
              first: number;
              last: number | VirtualScrollerState;
            }) => {
              const last =
                typeof event.last === "number"
                  ? event.last
                  : ((event.last as VirtualScrollerState)?.last ?? 0);

              if (
                last >= customers.length - 10 &&
                hasMore &&
                !isLoadingMore.current
              ) {
                loadTasks(currentOffset.current, 50);
              }
            },
          }}
          filterDisplay="row"
          rows={lazyState.rows}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          onFilter={onFilter}
          filters={lazyState.filters}
          // loading={loading}
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
              style={col.styleOverride}
              field={col.key}
              header={col.header}
              sortable
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerStyle={col.headerStyleOverride}
              bodyStyle={col.bodyStyleOverride}
              body={col.body}
              footer={col.footer}
              footerStyle={col.footerStyle}
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
          filtersToShow={[1, 7, 18]}
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

export default ProductPendingView;
