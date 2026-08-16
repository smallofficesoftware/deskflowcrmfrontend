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
import { Tooltip } from "primereact/tooltip";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportProductInventoryData,
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
  const exportColumns = [
    { title: "Product Name", dataKey: "Product Name" },
    { title: "Product Category", dataKey: "Product Category" },
    { title: "Unit", dataKey: "Unit" },
    { title: "Opening Stock", dataKey: "openingStock" },
    { title: `${inwardTitle}`, dataKey: "inward" },
    { title: `${purchaseTitle}`, dataKey: "purchase" },
    { title: `${returnPurchaseTitle}`, dataKey: "returnPurchase" },
    { title: `${dispatchTitle}`, dataKey: "dispatch" },
    { title: `${invoiceTitle}`, dataKey: "sales" },
    { title: `${returnSalesTitle}`, dataKey: "returnSales" },
    {
      title: `${stockAdjustmentInwardTitle}`,
      dataKey: "stockAdjustmentInward",
    },
    {
      title: `${stockAdjustmentOutwardTitle}`,
      dataKey: "stockAdjustmentOutward",
    },
    { title: "Closing Stock", dataKey: "closingStock" },
    { title: "Closing Stock Balance (With GST)", dataKey: "Closing Stock Balance" },
    { title: "Closing Stock Rate", dataKey: "Closing Stock Rate" },
  ];

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;
    const tableData = dataToExport.map((customer) => ({
      "Product Name": `${customer.name ?? "-"}${customer.code ? ` - ${customer.code}` : ""
        }`,
      "Product Category": customer.category_name ?? "-",
      Unit: customer.item_unit_name ?? "-",
      openingStock: customer.openingStock ?? "-",
      inward: customer.inward ?? "-",
      purchase: customer.purchase ?? "-",
      returnPurchase: customer.returnPurchase ?? "-",
      dispatch: customer.dispatch ?? "-",
      sales: customer.sales ?? "-",
      returnSales: customer.returnSales ?? "-",
      stockAdjustmentInward: customer.stockAdjustmentInward ?? "-",
      stockAdjustmentOutward: customer.stockAdjustmentOutward ?? "-",
      closingStock: customer.closingStock ?? "-",
      "Closing Stock Balance": customer.total_closing_stock_value ?? "-",
      "Closing Stock Rate": customer.total_closing_stock_rate ?? "-",
    }));

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`product_inventory_${new Date().getTime()}.pdf`);
      return;
    }

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
  const fetchProductInventoryForExport = async (
    offset: number,
    limit: number,
  ): Promise<IProductInventory[]> => {
    const response = await fetchProductInventory(
      filters.selectedDateArray,
      MobileToken,
      getID,
      MobileFlag,
      filters.selectedProductId,
      filters.selectedCategoryId,
      filters.selectedWarehouseIds,
      offset,
      limit,
      debouncedSearchText,
      filters.selectedStockTypeId,
    );

    // null safe
    return response?.items ?? [];
  };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const allItems = await exportProductInventoryData<IProductInventory>(
        fetchProductInventoryForExport,
        500,
      );

      if (!allItems.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedCustomers.length > 0 ? selectedCustomers : allItems
      ).map((customer) => {
        const closing_stock_balance = customer.total_closing_stock_value ?? "-";
        const closing_stock_rate = customer.total_closing_stock_rate ?? "-";

        return {
          "Product Name": `${customer.name ?? "-"}${customer.code ? ` - ${customer.code}` : ""
            }`,
          "Product Category": customer.category_name ?? "-",
          Unit: customer.item_unit_name ?? "-",
          "Opening Stock": customer.openingStock ?? "-",
          [inwardTitle as string]: customer.inward ?? "-",
          [purchaseTitle as string]: customer.purchase ?? "-",
          [returnPurchaseTitle as string]: customer.returnPurchase ?? "-",
          [dispatchTitle as string]: customer.dispatch ?? "-",
          [invoiceTitle as string]: customer.sales ?? "-",
          [returnSalesTitle as string]: customer.returnSales ?? "-",
          [stockAdjustmentInwardTitle as string]:
            customer.stockAdjustmentInward ?? "-",
          [stockAdjustmentOutwardTitle as string]:
            customer.stockAdjustmentOutward ?? "-",
          "Closing Stock": customer.closingStock ?? "-",
          "Closing Stock Balance (With GST)": closing_stock_balance ?? "-",
          "Closing Stock Rate": closing_stock_rate ?? "-",
        };
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wpx: 150 },
        { wpx: 150 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
      ];

      const workbook = {
        Sheets: { Inventory: worksheet },
        SheetNames: ["Inventory"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "product_inventory_full");
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
                <th>Product Name</th>
                <th>Product Category</th>
                <th>Unit</th>
                <th>Opening Stock</th>
                <th>${inwardTitle}</th>
                <th>${purchaseTitle}</th>
                <th>${returnPurchaseTitle}</th>
                <th>${dispatchTitle}</th>
                <th>${invoiceTitle}</th>
                <th>${returnSalesTitle}</th>
                <th>${stockAdjustmentInwardTitle}</th>
                <th>${stockAdjustmentOutwardTitle}</th>
                <th>Closing Stock</th>
                <th>Closing Stock Balance (With GST)</th>
                <th>Closing Stock Rate</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport
        .map(
          (customer) => `
                <tr>
                  <td>${customer.name ?? "-"}${customer.code ? `- ${customer.code}` : ""
            }</td>
                  <td>${customer.category_name ?? "-"}</td>
                  <td>${customer.item_unit_name ?? "-"}</td>
                  <td>${customer.openingStock ?? "-"}</td>
                  <td>${customer.inward ?? "-"}</td>
                  <td>${customer.purchase ?? "-"}</td>
                  <td>${customer.returnPurchase ?? "-"}</td>
                  <td>${customer.dispatch ?? "-"}</td>
                  <td>${customer.sales ?? "-"}</td>
                  <td>${customer.returnSales ?? "-"}</td>
                  <td>${customer.stockAdjustmentInward ?? "-"}</td>
                  <td>${customer.stockAdjustmentOutward ?? "-"}</td>
                  <td>${customer.closingStock ?? "-"}</td>
                  <td>${customer.total_closing_stock_value ?? "-"}</td>
                  <td>${customer.total_closing_stock_rate ?? "-"}</td>
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

  const renderHeader = (text: string) => (
    <span className="custom-header-tooltip" data-pr-tooltip={text}>
      {text}
    </span>
  );

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
        </div>
        {/* )} */}
      </div>
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

          <Column
            field="name"
            header={renderHeader("Product Name")}
            sortable
            filter
            filterField="name"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "130px",
              maxWidth: "130px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IProductInventory) =>
              `${rowData.name ?? "-"}${rowData.code ? `- ${rowData.code}` : ""}`
            }
          />
          <Column
            field="category_name"
            header={renderHeader("Product Category")}
            sortable
            filter
            filterField="category_name"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "100px",
              maxWidth: "100px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IProductInventory) => rowData.category_name ?? "-"}
          />
          <Column
            field="item_unit_name"
            header={renderHeader("Unit")}
            sortable
            filter
            filterField="item_unit_name"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "60px",
              maxWidth: "60px",
            }}
            bodyStyle={{ fontSize: "14px", alignItems: "center" }}
            body={(rowData: IProductInventory) => rowData.item_unit_name ?? "-"}
          />
          <Column
            field="openingStock"
            header={renderHeader("Opening Stock")}
            sortable
            filter
            filterField="openingStock"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "90px",
              maxWidth: "90px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
              // minWidth: "30px",
              // width: "30px",
              // maxWidth: "30px",
            }}
            body={(rowData: IProductInventory) => rowData.openingStock ?? "-"}
          />
          <Column
            field="inward"
            header={renderHeader(String(inwardTitle))}
            sortable
            filter
            filterField="inward"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) => `${rowData.inward ?? "-"}`}
          />
          <Column
            field="purchase"
            header={renderHeader(String(purchaseTitle))}
            sortable
            filter
            filterField="purchase"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) => `${rowData.purchase ?? "-"}`}
          />
          <Column
            field="returnPurchase"
            header={renderHeader(String(returnPurchaseTitle))}
            sortable
            filter
            filterField="returnPurchase"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "left",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) =>
              `${rowData.returnPurchase ?? "-"}`
            }
          />
          <Column
            field="dispatch"
            header={renderHeader(String(dispatchTitle))}
            sortable
            filter
            filterField="dispatch"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) => `${rowData.dispatch ?? "-"}`}
          />
          <Column
            field="sales"
            header={renderHeader(String(invoiceTitle))}
            sortable
            filter
            filterField="sales"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) => `${rowData.sales ?? "-"}`}
          />
          <Column
            field="returnSales"
            header={renderHeader(String(returnSalesTitle))}
            sortable
            filter
            filterField="returnSales"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) =>
              `${rowData.returnSales ?? "-"}`
            }
          />
          <Column
            field="stockAdjustmentInward"
            header={renderHeader(String(stockAdjustmentInwardTitle))}
            sortable
            filter
            filterField="stockAdjustmentInward"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) =>
              `${rowData.stockAdjustmentInward ?? "-"}`
            }
          />
          <Column
            field="stockAdjustmentOutward"
            header={renderHeader(String(stockAdjustmentOutwardTitle))}
            sortable
            filter
            filterField="stockAdjustmentOutward"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "center",
              // paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) =>
              `${rowData.stockAdjustmentOutward ?? "-"}`
            }
          />
          <Column
            field="closingStock"
            header={renderHeader("Closing Stock")}
            sortable
            filter
            filterField="closingStock"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "right",
              paddingRight: "50px",
              fontSize: "14px",
            }}
            body={closingStockBodyTemplate}
          />
          <Column
            field="total_closing_stock_value"
            header={renderHeader("Closing Stock Balance ( With GST )")}
            sortable
            filter
            filterField="total_closing_stock_value"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "right",
              paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) =>
              rowData.total_closing_stock_value ?? "-"
            }
          />
          <Column
            field="total_closing_stock_rate"
            header={renderHeader("Closing Stock Rate")}
            sortable
            filter
            filterField="total_closing_stock_rate"
            filterPlaceholder="Search"
            headerClassName="center-header"
            filterMatchMode="contains"
            headerStyle={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              // textAlign: "right",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
            style={{
              minWidth: "70px",
              maxWidth: "70px",
            }}
            bodyStyle={{
              textAlign: "right",
              paddingRight: "50px",
              fontSize: "14px",
            }}
            body={(rowData: IProductInventory) =>
              rowData.total_closing_stock_rate ?? "-"
            }
          />
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
