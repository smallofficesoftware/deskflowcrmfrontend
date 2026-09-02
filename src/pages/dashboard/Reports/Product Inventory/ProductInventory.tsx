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
import { Tooltip } from "primereact/tooltip";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchProductInventory,
  IProductInventory,
} from "./ProductInventoryController";

interface LazyTableState {
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IProductInventoryReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  inwardTitle?: string;
  purchaseTitle?: string;
  dispatchTitle?: string;
  invoiceTitle?: string;
  returnPurchaseTitle?: string;
  returnSalesTitle?: string;
  selectedProduct?: string | null;
  selectedCategory?: string | null;
  selectedStockTypeId?: string | null;
  selectedWarehouseIds?: string | null;
  globalSearch?: string;
  stockAdjustmentInwardTitle?: string;
  stockAdjustmentOutwardTitle?: string;
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

const ProductInventoryReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  inwardTitle,
  purchaseTitle,
  dispatchTitle,
  invoiceTitle,
  returnPurchaseTitle,
  returnSalesTitle,
  selectedProduct,
  selectedCategory,
  selectedStockTypeId,
  selectedWarehouseIds,
  globalSearch,
  stockAdjustmentInwardTitle,
  stockAdjustmentOutwardTitle,
  onHide,
}: IProductInventoryReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<IProductInventory[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    IProductInventory[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const dt = useRef<DataTable<IProductInventory[]>>(null);

  const LIMIT = 50;
  const ROW_HEIGHT = 50; // Adjust based on your actual row height

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("product_inventory");
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

    setFilters("product_inventory", updatedFilters);

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

      setFilters("product_inventory", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.PRODUCTINVENTORY_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.PRODUCTINVENTORY_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    sortField: null,
    sortOrder: null,
    filters: {
      name: { value: null, matchMode: "contains" },
      openingStock: { value: null, matchMode: "contains" },
      inward: { value: null, matchMode: "contains" },
      purchase: { value: null, matchMode: "contains" },
      returnPurchase: { value: null, matchMode: "contains" },
      dispatch: { value: null, matchMode: "contains" },
      sales: { value: null, matchMode: "contains" },
      returnSales: { value: null, matchMode: "contains" },
      stockAdjustmentInward: { value: null, matchMode: "contains" },
      stockAdjustmentOutward: { value: null, matchMode: "contains" },
      closingStock: { value: null, matchMode: "contains" },
    },
  });
  // Reset and initial load when key params change
  // Optional: Preload first 2 pages on mount (better first impression)
  useEffect(() => {
    setCustomers([]);
    setOffset(0);
    hasMoreRef.current = true;
    loadMoreData(0); // first 50
    // Optional: immediately queue second chunk
    setTimeout(() => {
      if (hasMoreRef.current) loadMoreData(LIMIT);
    }, 800);
  }, [
    filters.selectedDateArray,
    filters.selectedProductId,
    filters.selectedCategoryId,
    filters.selectedStockTypeId,
    filters.selectedWarehouseIds,
    debouncedSearchText,
  ]);

  const loadMoreData = async (currentOffset: number) => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const result = await fetchProductInventory(
        filters.selectedDateArray,
        MobileToken,
        getID,
        MobileFlag,
        filters.selectedProductId,
        filters.selectedCategoryId,
        filters.selectedWarehouseIds,
        currentOffset,
        LIMIT,
        debouncedSearchText,
        filters.selectedStockTypeId,
      );

      if (!result) {
        hasMoreRef.current = false;
        return;
      }

      const { items, total_count } = result;

      if (items.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      setCustomers((prev) => {
        const existing = new Set(
          prev.map((item) => `${item.name}-${item.code}`),
        );
        const uniqueNewItems = items.filter(
          (item) => !existing.has(`${item.name}-${item.code}`),
        );
        return [...prev, ...uniqueNewItems];
      });

      setTotalRecords(total_count);
      setOffset(currentOffset + items.length);

      if (items.length < LIMIT) {
        hasMoreRef.current = false;
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch inventory data");
      console.error("API error:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    hasMoreRef.current = true;
    setCustomers([]);
    setOffset(0);
    loadMoreData(0);
  };

  // Compute filtered & sorted data from customers
  const filteredData = useMemo(() => {
    let data = [...customers];

    // Apply filters
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;
        data = data.filter((item) => {
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

    // Apply sort
    if (lazyState.sortField) {
      data.sort((a, b) => {
        const aValue = getNestedValue(a, lazyState.sortField!);
        const bValue = getNestedValue(b, lazyState.sortField!);
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) data.reverse();
    }

    return data;
  }, [customers, lazyState.filters, lazyState.sortField, lazyState.sortOrder]);

  // Auto-load more if filtered data is small and more available
  useEffect(() => {
    if (
      filteredData.length < LIMIT &&
      hasMoreRef.current &&
      !loadingRef.current &&
      offset < totalRecords
    ) {
      loadMoreData(offset);
    }
  }, [filteredData.length, lazyState.filters]);

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
      filters: event.filters,
    }));
  };

  const onSelectionChange = (event: { value: IProductInventory[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === filteredData.length);
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

  const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {
    // Safely get the last visible index
    const lastVisible =
      typeof event.last === "number"
        ? event.last
        : ((event.last as any)?.last ?? 0);

    // Important: compare against ACTUAL LOADED rows (customers), NOT filteredData
    const loadedCount = customers.length;

    // Buffer: start loading more when user is ~20 rows from the end of loaded data
    const buffer = 20;

    if (
      lastVisible + buffer >= loadedCount && // approaching end of loaded data
      offset < totalRecords && // still more to load from server
      !loadingRef.current // prevent duplicate calls
    ) {
      loadMoreData(offset);
    }
  };

  // Export & Print logic using filteredData
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;

    if (dataToExport.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`product_inventory_${new Date().getTime()}.pdf`);
      return;
    }

    const tableData = dataToExport.map((customer) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, customer);
      });
      return rowData;
    });

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        doc.text(
          "Product Inventory and Stock Alerts Report",
          data.settings.margin.left,
          10,
        );
      },
    });
    doc.save(`product_inventory_${new Date().getTime()}.pdf`);
  };

  // const exportExcel = () => {
  //   const dataToExport =
  //     selectedCustomers.length > 0 ? selectedCustomers : filteredData;
  //   const exportData = dataToExport.map((customer) => ({
  //     "Product Name": `${customer.name ?? "-"}${customer.code ? ` - ${customer.code}` : ""
  //       }`,
  //     "Product Category": customer.category_name ?? "-",
  //     "Opening Stock": customer.openingStock ?? "-",
  //     [inwardTitle as string]: customer.inward ?? "-",
  //     [purchaseTitle as string]: customer.purchase ?? "-",
  //     [returnPurchaseTitle as string]: customer.returnPurchase ?? "-",
  //     [dispatchTitle as string]: customer.dispatch ?? "-",
  //     [invoiceTitle as string]: customer.sales ?? "-",
  //     [returnSalesTitle as string]: customer.returnSales ?? "-",
  //     "Closing Stock": customer.closingStock ?? "-",
  //   }));

  //   worksheet["!cols"] = [
  //     { wpx: 150 },
  //     { wpx: 150 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //   ];
  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "product_inventory");
  // };
  const printTable = () => {
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;
    const printContent = `
      <html>
        <head>
          <title>Product Inventory and Stock Alerts Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Product Inventory and Stock Alerts Report</h1>
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
              .map((col) => `<td>${getExportCellValue(col, customer)}</td>`)
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

  const closingStockBodyTemplate = (rowData: IProductInventory) => {
    const closingStock = rowData.closingStock ?? 0;
    const minStock = rowData.min_stock_quantity ?? 0;
    const maxStock = rowData.max_stock_quantity ?? Infinity;
    let backgroundColor = "";
    if (closingStock < minStock) {
      backgroundColor = "#D76C82";
    } else if (closingStock > maxStock) {
      backgroundColor = "#C1D8C3";
    }
    return (
      <span
        style={{
          backgroundColor,
          textAlign: "right",
          display: "block",
          paddingRight: "50px",
        }}
      >
        {closingStock ?? "-"}
      </span>
    );
  };

  const renderHeader = (text: string) => (
    <span className="custom-header-tooltip" data-pr-tooltip={text}>
      {text}
    </span>
  );

  type ProductInventoryColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: IProductInventory) => React.ReactNode;
  };

  const baseColumnDefs: ProductInventoryColumnDef[] = useMemo(
    () => [
      {
        key: "name",
        label: "Product Name",
        header: renderHeader("Product Name"),
        width: "130px",
        body: (rowData) =>
          `${rowData.name ?? "-"}${rowData.code ? `- ${rowData.code}` : ""}`,
      },
      {
        key: "category_name",
        label: "Product Category",
        header: renderHeader("Product Category"),
        width: "100px",
        body: (rowData) => rowData.category_name ?? "-",
      },
      {
        key: "item_unit_name",
        label: "Unit",
        header: renderHeader("Unit"),
        width: "60px",
        body: (rowData) => rowData.item_unit_name ?? "-",
      },
      {
        key: "openingStock",
        label: "Opening Stock",
        header: renderHeader("Opening Stock"),
        width: "90px",
        body: (rowData) => rowData.openingStock ?? "-",
      },
      {
        key: "inward",
        label: String(inwardTitle),
        header: renderHeader(String(inwardTitle)),
        width: "70px",
        body: (rowData) => `${rowData.inward ?? "-"}`,
      },
      {
        key: "purchase",
        label: String(purchaseTitle),
        header: renderHeader(String(purchaseTitle)),
        width: "70px",
        body: (rowData) => `${rowData.purchase ?? "-"}`,
      },
      {
        key: "returnPurchase",
        label: String(returnPurchaseTitle),
        header: renderHeader(String(returnPurchaseTitle)),
        width: "70px",
        body: (rowData) => `${rowData.returnPurchase ?? "-"}`,
      },
      {
        key: "dispatch",
        label: String(dispatchTitle),
        header: renderHeader(String(dispatchTitle)),
        width: "70px",
        body: (rowData) => `${rowData.dispatch ?? "-"}`,
      },
      {
        key: "sales",
        label: String(invoiceTitle),
        header: renderHeader(String(invoiceTitle)),
        width: "70px",
        body: (rowData) => `${rowData.sales ?? "-"}`,
      },
      {
        key: "returnSales",
        label: String(returnSalesTitle),
        header: renderHeader(String(returnSalesTitle)),
        width: "70px",
        body: (rowData) => `${rowData.returnSales ?? "-"}`,
      },
      {
        key: "stockAdjustmentInward",
        label: String(stockAdjustmentInwardTitle),
        header: renderHeader(String(stockAdjustmentInwardTitle)),
        width: "70px",
        body: (rowData) => `${rowData.stockAdjustmentInward ?? "-"}`,
      },
      {
        key: "stockAdjustmentOutward",
        label: String(stockAdjustmentOutwardTitle),
        header: renderHeader(String(stockAdjustmentOutwardTitle)),
        width: "70px",
        body: (rowData) => `${rowData.stockAdjustmentOutward ?? "-"}`,
      },
      {
        key: "closingStock",
        label: "Closing Stock",
        header: renderHeader("Closing Stock"),
        width: "70px",
        body: closingStockBodyTemplate,
      },
      {
        key: "total_closing_stock_value",
        label: "Closing Stock Balance (With GST)",
        header: renderHeader("Closing Stock Balance ( With GST )"),
        width: "70px",
        body: (rowData) => rowData.total_closing_stock_value ?? "-",
      },
      {
        key: "total_closing_stock_rate",
        label: "Closing Stock Rate",
        header: renderHeader("Closing Stock Rate"),
        width: "70px",
        body: (rowData) => rowData.total_closing_stock_rate ?? "-",
      },
    ],
    [
      inwardTitle,
      purchaseTitle,
      returnPurchaseTitle,
      dispatchTitle,
      invoiceTitle,
      returnSalesTitle,
      stockAdjustmentInwardTitle,
      stockAdjustmentOutwardTitle,
    ],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("product_inventory_report", baseColumnDefs);

  const getExportCellValue = (
    col: ProductInventoryColumnDef,
    customer: IProductInventory,
  ): string => {
    switch (col.key) {
      case "name":
        return `${customer.name ?? "-"}${customer.code ? ` - ${customer.code}` : ""}`;
      case "closingStock":
        return String(customer.closingStock ?? "-");
      default:
        return String((customer as any)[col.key] ?? "-");
    }
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Product Inventory & Stock Alerts
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
          Product Inventory & Stock Alerts
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
                <ExportExcelMenuItem
                  reportType="product_inventory_report"
                  filters={{
                    selectedDates: filters.selectedDateArray,
                    selectedProduct: filters.selectedProductId,
                    selectedCategory: filters.selectedCategoryId,
                    selectedWarehouseIds: filters.selectedWarehouseIds,
                    globalSearch: debouncedSearchText,
                    selectedStockTypeId: filters.selectedStockTypeId,
                  }}
                  columns={visibleColumns}
                  fileName="product_inventory_full"
                  canShare={canShare}
                  disabled={customers.length === 0}
                  onSelect={() => setIsExportDropdownOpen(false)}
                  selectedRows={selectedCustomers}
                />

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
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <Tooltip
          target=".custom-header-tooltip"
          position="top"
          pt={{
            text: {
              style: {
                fontSize: "12px",
                padding: "8px 12px",
                // background: "#ffff",
                // color: "#000",
                borderRadius: "6px",
              },
            },
          }}
        />

        <DataTable
          ref={dt}
          value={filteredData}
          resizableColumns
          columnResizeMode="expand"
          className="custom-centered-table"
          scrollable
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: ROW_HEIGHT,
            lazy: true,
            onLazyLoad: onVirtualLoad, // ← use the fixed version above
            showLoader: true,
            loading: loading,
            // numToleratedItems: 10,               // optional: render a few more rows for smoothness
            // delay: 100,                          // optional: small debounce
          }}
          onSort={onSort}
          onFilter={onFilter}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          filters={lazyState.filters}
          //  dataKey={(rowData: IProductInventory) => `${rowData.name ?? 'no-name'}-${rowData.code ?? 'no-code'}`}
          emptyMessage="No data found"
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          footer={
            <div
              style={{
                padding: "10px",
                background: "#f8f9fa",
                textAlign: "right",
              }}
            >
              {(() => {
                const total = filteredData.reduce((sum, row) => {
                  const val = Number(row.total_closing_stock_value);
                  return sum + (isNaN(val) ? 0 : val);
                }, 0);

                return `Total: ₹ ${total.toLocaleString("en-IN")}`;
              })()}
            </div>
          }
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
              bodyStyle={{
                fontSize: "14px",
                textAlign: [
                  "openingStock",
                  "inward",
                  "purchase",
                  "returnPurchase",
                  "dispatch",
                  "sales",
                  "returnSales",
                  "stockAdjustmentInward",
                  "stockAdjustmentOutward",
                ].includes(col.key)
                  ? "center"
                  : [
                    "closingStock",
                    "total_closing_stock_value",
                    "total_closing_stock_rate",
                  ].includes(col.key)
                    ? "right"
                    : undefined,
                paddingRight: [
                  "closingStock",
                  "total_closing_stock_value",
                  "total_closing_stock_rate",
                ].includes(col.key)
                  ? "50px"
                  : undefined,
              }}
              body={col.body}
            />
          ))}
        </DataTable>
      </div>
      <small style={{ color: "#888", display: "block", marginTop: "1rem" }}>
        Loaded {customers.length} of {totalRecords || "?"} rows (Filtered:{" "}
        {filteredData.length})
      </small>
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 7, 16, 17]}
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

export default ProductInventoryReport;
