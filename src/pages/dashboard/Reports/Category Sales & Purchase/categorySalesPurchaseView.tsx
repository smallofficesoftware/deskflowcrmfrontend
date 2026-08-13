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
import { DateObject } from "react-multi-date-picker";
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
import {
  exportAllCategoryWiseMovementData,
  fetchCategoryReport,
  fetchCategoryWiseMomentForExport,
  ICategorySalesData,
} from "./categorySalesPurchaseController";

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
  selectedContactId?: string | null;
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
  const match = value.match(/^(\d+)\(₹(\d*\.?\d*)\)$/);
  if (!match) {
    return { quantity: 0, amount: 0 };
  }
  const quantity = parseInt(match[1], 10) || 0;
  const amount = parseFloat(match[2]) || 0;
  return { quantity, amount };
};

const calculateColumnTotals = (data: any[], field: string): string => {
  const totals = data.reduce(
    (acc, item) => {
      const value = getNestedValue(item, field);

      let quantity = 0;
      let amount = 0;
      let symbol = acc.symbol;

      if (value) {
        const strValue = String(value);

        const qtyMatch = strValue.match(/^(\d+)/);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
        }
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

const CategorySalesPurchaseReport = ({
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
  const [customers, setCustomers] = useState<ICategorySalesData[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    ICategorySalesData[]
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

  const filters = getFilter("category_report");
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

    setFilters("category_report", updatedFilters);

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

      setFilters("category_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.CATEGORYMOVEMENT_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.CATEGORYMOVEMENT_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 500,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      item_category_name: { value: null, matchMode: "contains" },
      quotation: { value: null, matchMode: "contains" },
      salesorder: { value: null, matchMode: "contains" },
      salesinvoice: { value: null, matchMode: "contains" },
      purchaseinvoice: { value: null, matchMode: "contains" },
      purchaseorder: { value: null, matchMode: "contains" },
    },
  });
  const [productData, setProductData] = useState<ICategorySalesData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<ICategorySalesData[]>>(null);
  const dataArray: any[] = productData.map((item) => ({
    item_category_name: item.item_category_name || "-",
    quotation: item.quotation ?? "-",
    salesorder: item.salesorder ?? "-",
    salesinvoice: item.salesinvoice ?? "-",
    purchaseinvoice: item.purchaseinvoice ?? "-",
    purchaseorder: item.purchaseorder ?? "-",
  }));

  const mergeData = (
    existing: ICategorySalesData[],
    newEntries: ICategorySalesData[],
  ) => {
    const productMap = new Map<number, ICategorySalesData>(
      existing.map((item) => [item.item_category_id, { ...item }]),
    );

    type MutableFields = Pick<
      ICategorySalesData,
      | "quotation"
      | "salesorder"
      | "salesinvoice"
      | "purchaseinvoice"
      | "purchaseorder"
    >;

    const fields: (keyof MutableFields)[] = [
      "quotation",
      "salesorder",
      "salesinvoice",
      "purchaseinvoice",
      "purchaseorder",
    ];

    newEntries.forEach((newItem) => {
      const id = newItem.item_category_id;
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

  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadTasks(0, 50, true);
  }, [
    filters.selectedDateArray,
    debouncedSearchText,
    filters.referenceWiseContact,
  ]);

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
      const newData = await fetchCategoryReport(
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
      isLoadingMore.current = false;
      setLoading(false);
    } catch {
      isLoadingMore.current = false;
      setLoading(false);
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

  const onSelectionChange = (event: { value: ICategorySalesData[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === customers.length && value.length > 0);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedCustomers([...customers]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  const isFilterApplied = () => {
    return Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );
  };

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

  type CategoryColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: ICategorySalesData) => React.ReactNode;
    footer?: React.ReactNode | (() => React.ReactNode);
    footerStyle?: React.CSSProperties;
  };

  const baseColumnDefs: CategoryColumnDef[] = useMemo(
    () => [
      {
        key: "item_category_name",
        label: "Category Name",
        header: (
          <span>
            Category <br /> Name
          </span>
        ),
        width: "150px",
        body: (rowData) => rowData.item_category_name || "-",
        footer: "Total",
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
          paddingLeft: "10px",
        },
      },
      {
        key: "quotation",
        label: quotationTitle,
        header: `${quotationTitle.replace(/ /g, "\n")}`,
        width: "150px",
        body: (rowData) => rowData.quotation ?? "-",
        footer: () => calculateColumnTotals(customers, "quotation"),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
          textAlign: "right",
        },
      },
      {
        key: "salesorder",
        label: orderTitle,
        header: `${orderTitle.replace(/ /g, "\n")}`,
        width: "150px",
        body: (rowData) => rowData.salesorder ?? "-",
        footer: () => calculateColumnTotals(customers, "salesorder"),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
          textAlign: "right",
        },
      },
      {
        key: "salesinvoice",
        label: invoiceTitle,
        header: `${invoiceTitle.replace(/ /g, "\n")}`,
        width: "150px",
        body: (rowData) => rowData.salesinvoice ?? "-",
        footer: () => calculateColumnTotals(customers, "salesinvoice"),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
          textAlign: "right",
        },
      },
      {
        key: "purchaseorder",
        label: purchaseOrderTitle,
        header: `${purchaseOrderTitle.replace(/ /g, "\n")}`,
        width: "150px",
        body: (rowData) => rowData.purchaseorder ?? "-",
        footer: () => calculateColumnTotals(customers, "purchaseorder"),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
          textAlign: "right",
        },
      },
      {
        key: "purchaseinvoice",
        label: purchaseTitle,
        header: `${purchaseTitle.replace(/ /g, "\n")}`,
        width: "150px",
        body: (rowData) => rowData.purchaseinvoice ?? "-",
        footer: () => calculateColumnTotals(customers, "purchaseinvoice"),
        footerStyle: {
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          background: "#f8f9fa",
          textAlign: "right",
        },
      },
    ],
    [
      quotationTitle,
      orderTitle,
      invoiceTitle,
      purchaseTitle,
      purchaseOrderTitle,
      customers,
    ],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("category_sales_purchase_report", baseColumnDefs);

  const getExportCellValue = (
    col: CategoryColumnDef,
    customer: any,
  ): string => {
    if (col.key === "item_category_name") {
      return customer.item_category_name || "-";
    }
    return customer[col.key] ?? "-";
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied()
          ? getFilteredData()
          : customers;
    const tableData = dataToExport.map((customer) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, customer);
      });
      return row;
    });

    const totals: any = {};
    visibleColumns.forEach((col) => {
      totals[col.key] =
        col.key === "item_category_name"
          ? "Total"
          : calculateColumnTotals(dataToExport, col.key);
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`category_sales_purchase_${new Date().getTime()}.pdf`);
      return;
    }

    tableData.push(totals);

    autoTable(doc, {
      columns: visibleColumns.map((col) => ({
        title: col.label,
        dataKey: col.key,
      })),
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 10,
        overflow: "linebreak",
        cellPadding: 2,
      },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        doc.text(
          "Category Wise Movement Report",
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

    doc.save(`category_sales_purchase_${new Date().getTime()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allData = await exportAllCategoryWiseMovementData(
        (offset, limit) =>
          fetchCategoryWiseMomentForExport(
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

      if (!allData.length) {
        toast.warn("No data to export");
        return;
      }

      const excelRows: Record<string, any>[] = (
        selectedCustomers.length > 0
          ? selectedCustomers
          : isFilterApplied()
            ? customers
            : dataArray
      ).map((item) => {
        const row: Record<string, any> = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        return row;
      });

      // ✅ Totals row
      const totalsRow: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        totalsRow[col.label] =
          col.key === "item_category_name"
            ? "Total"
            : calculateColumnTotals(excelRows, col.label);
      });
      excelRows.push(totalsRow);

      const worksheet = xlsx.utils.json_to_sheet(excelRows);
      worksheet["!cols"] = visibleColumns.map((col) => ({
        wpx: col.key === "item_category_name" ? 180 : 130,
      }));

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Category Movement");

      const buffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Category_Wise_Movement_${Date.now()}.xlsx`,
      );

      toast.success("Excel exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export category data");
    } finally {
      setLoading(false);
    }
  };

  // const exportExcel = () => {
  //      const filteredData = getFilteredData();
  //   const exportData = (
  //     selectedCustomers.length > 0 ? selectedCustomers : isFilterApplied() ? filteredData : customers
  //   ).map((customer) => ({
  //     "Category Name": customer.item_category_name || "-",
  //     Quotation: customer.quotation ?? "-",
  //     "Sales Order": customer.salesorder ?? "-",
  //     "Sales Invoice": customer.salesinvoice ?? "-",
  //     "Purchase Invoice": customer.purchaseinvoice ?? "-",
  //     "Purchase Order": customer.purchaseorder ?? "-",
  //   }));

  //   const totals = {
  //     "Category Name": "Total",
  //     Quotation: calculateColumnTotals(exportData, "quotation"),
  //     "Sales Order": calculateColumnTotals(exportData, "salesorder"),
  //     "Sales Invoice": calculateColumnTotals(exportData, "salesinvoice"),
  //     "Purchase Invoice": calculateColumnTotals(
  //       exportData,
  //       "purchaseinvoice"
  //     ),
  //     "Purchase Order": calculateColumnTotals(exportData, "purchaseorder"),
  //   };

  //   exportData.push(totals);

  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [
  //     { wpx: 150 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //   ];
  //   const workbook = { Sheets: { Data: worksheet }, SheetNames: ["Data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "category_sales_purchase");
  // };

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
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;

    const totals: Record<string, string> = {};
    visibleColumns.forEach((col) => {
      totals[col.key] =
        col.key === "item_category_name"
          ? "Total"
          : calculateColumnTotals(tableData, col.key);
    });

    const headerCells = visibleColumns
      .map((col) =>
        col.key === "item_category_name"
          ? `<th>${col.label}</th>`
          : `<th style="text-align: right; padding-right: 50px;">${col.label}</th>`,
      )
      .join("");

    const bodyRows = tableData
      .map((customer) => {
        const cells = visibleColumns
          .map((col) =>
            col.key === "item_category_name"
              ? `<td>${getExportCellValue(col, customer)}</td>`
              : `<td class="text-right">${getExportCellValue(col, customer)}</td>`,
          )
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    const totalCells = visibleColumns
      .map((col) =>
        col.key === "item_category_name"
          ? `<td>Total</td>`
          : `<td class="text-right">${totals[col.key]}</td>`,
      )
      .join("");

    const printContent = `
      <html>
        <head>
          <title>Category Wise Movement Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; table-layout: fixed;}
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; overflow-wrap: break-word;
            word-wrap: break-word;
            vertical-align: top;}
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
            .total-row { font-weight: bold; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Category Wise Movement Report</h1>
          <table>
            <thead>
              <tr>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
              <tr class="total-row">
                ${totalCells}
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
          Category Wise Movement
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
          Category Wise Movement
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
          overflow: "hidden", // Prevent outer div from scrolling
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
            itemSize: 48,
            lazy: true,
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
              field={col.key}
              header={col.header}
              sortable
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode={col.filterMatchMode || "contains"}
              headerStyle={{
                width: col.width || "150px",
                whiteSpace: "pre-wrap",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
              }}
              bodyStyle={{
                textAlign: col.key === "item_category_name" ? undefined : "right",
              }}
              body={col.body}
              footer={col.footer}
              footerStyle={col.footerStyle}
            />
          ))}
        </DataTable>
      </div>{" "}
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

export default CategorySalesPurchaseReport;
