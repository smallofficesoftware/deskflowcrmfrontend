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
import { useEffect, useRef, useState } from "react";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAllProductWiseMovementData,
  fetchProductReport,
  fetchProductWiseMomentForExport,
} from "./productSalesPurchaseController";

export interface IProductSalesData {
  item_product_id: number;
  item_product_name: string;
  item_product_code: string;
  item_category_name: string;
  item_unit_name: string;
  quotation?: string;
  salesorder?: string;
  salesinvoice?: string;
  purchaseinvoice?: string;
  purchaseorder?: string;
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
  selectedContactId?: string | null;
  globalSearch?: string;
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

const ProductSalesPurchaseReport = ({
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
  const [customers, setCustomers] = useState<IProductSalesData[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    IProductSalesData[]
  >([]);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("product_report");
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

    setFilters("product_report", updatedFilters);

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

      setFilters("product_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.PRODUCTMOVEMENT_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.PRODUCTMOVEMENT_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 1000,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      item_product_name: { value: null, matchMode: "contains" },
      quotation: { value: null, matchMode: "contains" },
      salesorder: { value: null, matchMode: "contains" },
      salesinvoice: { value: null, matchMode: "contains" },
      purchaseinvoice: { value: null, matchMode: "contains" },
      purchaseorder: { value: null, matchMode: "contains" },
    },
  });
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IProductSalesData[]>>(null);

  const mergeData = (
    existing: IProductSalesData[],
    newEntries: IProductSalesData[],
  ) => {
    const productMap = new Map<number, IProductSalesData>(
      existing.map((item) => [item.item_product_id, { ...item }]),
    );

    type MutableFields = Pick<
      IProductSalesData,
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

  const isFilterApplied = () => {
    return Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );
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
      const newData = await fetchProductReport(
        filters.selectedDateArray,
        setError,
        MobileToken,
        getID,
        MobileFlag,
        filters.selectedProductId,
        filters.selectedCategoryId,
        filters.selectedContactId,
        debouncedSearchText,
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

  const onSelectionChange = (event: { value: IProductSalesData[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === customers.length);
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

  const exportColumns = [
    { title: `Product Name`, dataKey: "item_product_name" },
    { title: `Product Category`, dataKey: "item_category_name" },
    { title: `${quotationTitle}`, dataKey: "quotation" },
    { title: `${orderTitle}`, dataKey: "salesorder" },
    { title: `${invoiceTitle}`, dataKey: "salesinvoice" },
    { title: `${purchaseOrderTitle}`, dataKey: "purchaseorder" },
    { title: `${purchaseTitle}`, dataKey: "purchaseinvoice" },
  ];

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });
    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied()
          ? getFilteredData()
          : customers;
    const tableData = dataToExport.map((customer) => ({
      item_product_name: `${customer.item_product_name ?? "-"}${customer.item_product_code ? ` - ${customer.item_product_code}` : ""}`,
      item_category_name: customer.item_category_name
        ? customer.item_category_name
        : "-",
      quotation: customer.quotation ?? "-",
      salesorder: customer.salesorder ?? "-",
      salesinvoice: customer.salesinvoice ?? "-",
      purchaseorder: customer.purchaseorder ?? "-",
      purchaseinvoice: customer.purchaseinvoice ?? "-",
    }));

    const totals = {
      item_product_name: "Total",
      item_category_name: "",
      quotation: calculateColumnTotals(dataToExport, "quotation"),
      salesorder: calculateColumnTotals(dataToExport, "salesorder"),
      salesinvoice: calculateColumnTotals(dataToExport, "salesinvoice"),
      purchaseorder: calculateColumnTotals(dataToExport, "purchaseorder"),
      purchaseinvoice: calculateColumnTotals(dataToExport, "purchaseinvoice"),
    };

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`product_sales_purchase_${new Date().getTime()}.pdf`);
      return;
    }

    tableData.push(totals);

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        doc.text("Product Wise Movement Report", data.settings.margin.left, 10);
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

    doc.save(`product_sales_purchase_${new Date().getTime()}.pdf`);
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
  // const exportExcel = () => {
  //   const filteredData = getFilteredData();
  //   const exportData = (
  //     selectedCustomers.length > 0 ? selectedCustomers : isFilterApplied() ? filteredData : customers
  //   ).map((customer) => ({
  //     "Product Name": `${customer.item_product_name ?? '-'}${customer.item_product_code ? ` - ${customer.item_product_code}` : ''}`,
  //     "Product Category": customer.item_category_name ?? "-",
  //     Quotation: customer.quotation ?? "-",
  //     "Sales Order": customer.salesorder ?? "-",
  //     "Sales Invoice": customer.salesinvoice ?? "-",
  //     "Purchase Order": customer.purchaseorder ?? "-",
  //     "Purchase Invoice": customer.purchaseinvoice ?? "-",
  //   }));

  //   const totals = {
  //     "Product Name": "Total",
  //     "Product Category": "",
  //     Quotation: calculateColumnTotals(exportData, "quotation"),
  //     "Sales Order": calculateColumnTotals(exportData, "salesorder"),
  //     "Sales Invoice": calculateColumnTotals(exportData, "salesinvoice"),
  //     "Purchase Order": calculateColumnTotals(exportData, "purchaseorder"),
  //     "Purchase Invoice": calculateColumnTotals(exportData, "purchaseinvoice"),
  //   };

  //   exportData.push(totals);

  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [
  //     { wpx: 250 },
  //     { wpx: 150 },
  //     { wpx: 150 },
  //     { wpx: 150 },
  //     { wpx: 150 },
  //     { wpx: 150 },
  //     { wpx: 150 },
  //   ];
  //   const workbook = { Sheets: { Data: worksheet }, SheetNames: ["Data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "product_sales_purchase");
  // };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allContacts = await exportAllProductWiseMovementData(
        (offset, limit) =>
          fetchProductWiseMomentForExport(
            filters.selectedDateArray,
            setError,
            MobileToken,
            getID,
            MobileFlag,
            filters.selectedProductId,
            filters.selectedCategoryId,
            filters.selectedContactId,
            debouncedSearchText,
            offset,
            limit,
          ),
        500,
      );

      if (!allContacts.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedCustomers.length > 0 ? selectedCustomers : allContacts
      ).map((item) => ({
        "Product Name": `${item.item_product_name || "-"}${
          item.item_product_code ? ` - ${item.item_product_code}` : ""
        }`,
        "Product Category": item.item_category_name || "-",
        Quotation: item.quotation || "-",
        Order: item.salesorder || "-",
        Invoice: item.salesinvoice || "-",
        "Purchase Order": item.purchaseorder || "-",
        "Purchase Invoice": item.purchaseinvoice || "-",
      }));

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 25 }));

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "Product Wise Movement",
      );

      const buffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Product_Wise_Movement_${Date.now()}.xlsx`,
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
    const filteredData = getFilteredData();
    const tableData =
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;

    const totals = {
      quotation: calculateColumnTotals(tableData, "quotation"),
      salesorder: calculateColumnTotals(tableData, "salesorder"),
      salesinvoice: calculateColumnTotals(tableData, "salesinvoice"),
      purchaseorder: calculateColumnTotals(tableData, "purchaseorder"),
      purchaseinvoice: calculateColumnTotals(tableData, "purchaseinvoice"),
    };

    const printContent = `
      <html>
        <head>
          <title>Product Wise Movement Report</title>
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
          <h1>Product Wise Movement Report</h1>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Product Category</th>
                <th style="text-align: right; padding-right: 50px;">${quotationTitle}</th>
                <th style="text-align: right; padding-right: 50px;">${orderTitle}</th>
                <th style="text-align: right; padding-right: 50px;">${invoiceTitle}</th>
                <th style="text-align: right; padding-right: 50px;">${purchaseOrderTitle}</th>
                <th style="text-align: right; padding-right: 50px;">${purchaseTitle}</th>
              </tr>
            </thead>
            <tbody>
              ${tableData
                .map(
                  (customer) => `
                <tr>
                  <td>${customer.item_product_name ?? "-"}${customer.item_product_code ? `- ${customer.item_product_code}` : ""}</td>
                  <td class="text-right">${customer.item_category_name ?? "-"}</td>
                  <td class="text-right">${customer.quotation ?? "-"}</td>
                  <td class="text-right">${customer.salesorder ?? "-"}</td>
                  <td class="text-right">${customer.salesinvoice ?? "-"}</td>
                  <td class="text-right">${customer.purchaseorder ?? "-"}</td>
                  <td class="text-right">${customer.purchaseinvoice ?? "-"}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                <td>Total</td>
                <td></td>
                <td class="text-right">${totals.quotation}</td>
                <td class="text-right">${totals.salesorder}</td>
                <td class="text-right">${totals.salesinvoice}</td>
                <td class="text-right">${totals.purchaseorder}</td>
                <td class="text-right">${totals.purchaseinvoice}</td>
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
          Product Wise Movement
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
          Product Wise Movement
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
        </div>
        {/* )} */}
      </div>

      <div
        className="report_card"
        style={{
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "auto",
        }}
      >
        <DataTable
          ref={dt}
          value={customers}
          scrollable
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
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

          <Column
            field="item_product_name"
            header={
              <span>
                Product <br /> Name
              </span>
            }
            sortable
            filter
            filterField="item_product_name"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              left: "50px",
              zIndex: 2,
              background: "#fff",
            }}
            // bodyStyle={{ width: "250px" }}
            body={(rowData: IProductSalesData) =>
              `${rowData.item_product_name ?? "-"}${rowData.item_product_code ? `- ${rowData.item_product_code}` : ""}`
            }
            footer="Total"
            footerStyle={{
              // width: "250px",
              position: "sticky",
              bottom: 0,
              left: "50px",
              zIndex: 2,
              background: "#f8f9fa",
            }}
          />
          <Column
            field="item_category_name"
            header={
              <span>
                Product <br /> Category
              </span>
            }
            sortable
            filter
            filterField="item_category_name"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              position: "sticky",
              top: 0,
              left: "50px",
              zIndex: 2,
              background: "#fff",
            }}
            // bodyStyle={{ width: "250px" }}
            body={(rowData: IProductSalesData) =>
              `${rowData.item_category_name ?? "-"}`
            }
          />
          <Column
            field="quotation"
            header={`${quotationTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="quotation"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "125px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
            }}
            bodyStyle={{
              textAlign: "right",
              // paddingRight: "50px",
              // width: "150px",
            }}
            body={(rowData: IProductSalesData) => rowData.quotation ?? "-"}
            footer={() =>
              calculateColumnTotals(
                isFilterApplied() ? getFilteredData() : customers,
                "quotation",
              )
            }
            footerStyle={{
              // width: "150px",
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              background: "#f8f9fa",
              textAlign: "right",
              // paddingRight: "50px",
            }}
          />
          <Column
            field="salesorder"
            header={`${orderTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="salesorder"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "125px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
            }}
            bodyStyle={{
              textAlign: "right",
              // paddingRight: "50px",
              // width: "150px",
            }}
            body={(rowData: IProductSalesData) => rowData.salesorder ?? "-"}
            footer={() =>
              calculateColumnTotals(
                isFilterApplied() ? getFilteredData() : customers,
                "salesorder",
              )
            }
            footerStyle={{
              // width: "150px",
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              background: "#f8f9fa",
              textAlign: "right",
              // paddingRight: "50px",
            }}
          />
          <Column
            field="salesinvoice"
            header={`${invoiceTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="salesinvoice"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "125px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
            }}
            bodyStyle={{
              textAlign: "right",
              // paddingRight: "50px",
              // width: "150px",
            }}
            body={(rowData: IProductSalesData) => rowData.salesinvoice ?? "-"}
            footer={() =>
              calculateColumnTotals(
                isFilterApplied() ? getFilteredData() : customers,
                "salesinvoice",
              )
            }
            footerStyle={{
              // width: "150px",
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              background: "#f8f9fa",
              textAlign: "right",
              // paddingRight: "50px",
              // paddingBlock: "10px",
            }}
          />
          <Column
            field="purchaseorder"
            header={`${purchaseOrderTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="purchaseorder"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "125px",
              whiteSpace: "pre-wrap",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
            }}
            bodyStyle={{
              textAlign: "right",
              // paddingRight: "50px",
              // width: "150px",
            }}
            body={(rowData: IProductSalesData) => rowData.purchaseorder ?? "-"}
            footer={() =>
              calculateColumnTotals(
                isFilterApplied() ? getFilteredData() : customers,
                "purchaseorder",
              )
            }
            footerStyle={{
              // width: "150px",
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              background: "#f8f9fa",
              textAlign: "right",
              // paddingRight: "50px",
            }}
          />
          <Column
            field="purchaseinvoice"
            header={`${purchaseTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="purchaseinvoice"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "125px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
            }}
            bodyStyle={{
              textAlign: "right",
              // paddingRight: "50px",
              // width: "150px",
            }}
            body={(rowData: IProductSalesData) =>
              rowData.purchaseinvoice ?? "-"
            }
            footer={() =>
              calculateColumnTotals(
                isFilterApplied() ? getFilteredData() : customers,
                "purchaseinvoice",
              )
            }
            footerStyle={{
              // width: "150px",
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              background: "#f8f9fa",
              textAlign: "right",
              // paddingRight: "50px",
            }}
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

export default ProductSalesPurchaseReport;
