import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  DataTableFilterMetaData,
  DataTableOperatorFilterMetaData,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import OrderCreateModal from "../../../../components/model/OrderCreateModel/OrderCreateModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { IUserList } from "../../../left-side/LeftSideController";
import { openPrint } from "../Quotations/QuotationController";
import {
  fetchCartReport,
  handleDownload,
  IFlatCartItem,
} from "./DailyInvoiceReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface ITeamcartDataReports {
  selectedDates?: DateObject[];
  selectedTeamMembers?: string[] | null;
  selectedStageStatus?: string[] | null;
  selectedSeries?: string[] | null;
  title?: string;
  setRefreshReport1?: (value: boolean | number) => void;
  viewFormate?: number;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  isCartModelOpen?: boolean;
  onCartModelOpenChange?: (isOpen: boolean) => void;
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

const getMatchedCustomFields = (cartItem: any, customForm: any[]) => {
  return customForm
    .filter(
      (formField) =>
        formField.report_print_or_not === 1 &&
        formField.reference_column_name in cartItem,
    )
    .map((formField) => ({
      fieldName: formField.reference_column_name,
      fieldLabel: formField.title || formField.reference_column_name,
      dataType: formField.data_type,
    }));
};

const DailyInvoiceReportView = ({
  selectedDates,
  selectedTeamMembers,
  title,
  setRefreshReport1,
  viewFormate,
  MobileToken,
  getID,
  MobileFlag,
  selectedStageStatus,
  selectedSeries,
  isCartModelOpen,
  onCartModelOpenChange,
  globalSearch,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: ITeamcartDataReports) => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);
  const [isOrderCreateFromContactShow, setIsOrderCreateFromContactShow] =
    useState(false);
  const [contactInfoOrder, setContactInfoOrder] = useState<IUserList>();
  const [isOrderShowFromContactType, setIsOrderShowFromContactType] =
    useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshReport, setRefreshReport] = useState(false);
  const [currencyName, setCurrencyName] = useState<any>();

  const dt = useRef<DataTable<any[]>>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const isLoadingMore = useRef(false);
  const currentOffset = useRef(0);
  const PAGE_SIZE = 50;

  const [actionType, setActionType] = useState<string>("");

  const selectedIds = useMemo(() => {
    return selectedCustomers.map((item: IFlatCartItem) => item.id);
  }, [selectedCustomers]);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("daily_sales_invoice");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
    }
  });

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

    setFilters("daily_sales_invoice", updatedFilters);

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

      setFilters("daily_sales_invoice", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const handleHide = () => {
    console.log("handleHide called");
  };

  const canShare = useCheckUserPermission(
    PAGE_ID.SALESINVOICE_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.SALESINVOICE_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const canShareSalesInvoice = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintSalesInvoice = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.PRINT,
  );

  const canEditSalesInvoice = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.EDIT,
  );

  useEffect(() => {
    offsetRef.current = 0;
    currentOffset.current = 0;
    onVirtualScroll(0, 50, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    filters.checkedOptionsStageStatus,
    filters.checkedOptionsSeries,
    debouncedSearchText,
    filters.selectedContactId,
    filters.referenceWiseContact,
  ]);

  useEffect(() => {
    if (!refreshReport) return;

    setRefreshReport1?.(true);

    const timer = setTimeout(() => {
      setRefreshReport1?.(false);
      setRefreshReport(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshReport, setRefreshReport1]);

  const dataArray = useMemo(() => {
    return customers.map((item) => ({
      ...item,
    }));
  }, [customers]);

  const uniqueCustomFields = useMemo(() => {
    const allFields = dataArray.flatMap((item) =>
      getMatchedCustomFields(item, item.customForm || []),
    );
    return Array.from(
      new Set(allFields.map((field) => JSON.stringify(field))),
      (str) => JSON.parse(str),
    );
  }, [dataArray]);

  useEffect(() => {
    setLazyState((prev) => {
      const newFilters = { ...prev.filters };
      uniqueCustomFields.forEach((field) => {
        if (!(field.fieldName in newFilters)) {
          newFilters[field.fieldName] = {
            value: null,
            matchMode: field.dataType === 1 ? "equals" : "contains",
          };
        }
      });
      return { ...prev, filters: newFilters };
    });
  }, [uniqueCustomFields]);

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
      type: { value: null, matchMode: "contains" },
      cart_number: { value: null, matchMode: "contains" },
      created_date_time: { value: null, matchMode: "contains" },
      update_Date_time: { value: null, matchMode: "contains" },
      cart_status: { value: null, matchMode: "contains" },
      to_customer_name: { value: null, matchMode: "custom" },
      taxable_amt: { value: null, matchMode: "equals" },
      gst_amt: { value: null, matchMode: "equals" },
      tcs_amt: { value: null, matchMode: "equals" },
      round_off: { value: null, matchMode: "equals" },
      grand_total: { value: null, matchMode: "equals" },
    },
  });

  const filteredData = useMemo(() => {
    let data = [...dataArray];
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        data = data.filter((item) => {
          if (matchMode === "custom" && field === "to_customer_name") {
            const nameValue = getNestedValue(item, "to_customer_name");
            const phoneValue = getNestedValue(item, "to_customer_phone");
            const nameStr = nameValue?.toString().toLowerCase() || "";
            const phoneStr = phoneValue?.toString().toLowerCase() || "";
            return (
              nameStr.includes(filterValue) || phoneStr.includes(filterValue)
            );
          } else {
            const fieldValue = getNestedValue(item, field);
            if (fieldValue === undefined || fieldValue === null) return false;

            const fieldStr = fieldValue.toString().toLowerCase();

            switch (matchMode) {
              case "equals":
                return fieldValue.toString() === meta.value.toString();
              case "contains":
                return fieldStr.includes(filterValue);
              case "notContains":
                return !fieldStr.includes(filterValue);
              case "startsWith":
                return fieldStr.startsWith(filterValue);
              case "endsWith":
                return fieldStr.endsWith(filterValue);
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
      data.sort((a, b) => {
        const aValue = getNestedValue(a, lazyState.sortField!);
        const bValue = getNestedValue(b, lazyState.sortField!);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) data.reverse();
    }
    return data;
  }, [dataArray, lazyState.filters, lazyState.sortField, lazyState.sortOrder]);

  useEffect(() => {
    setCustomers([]);
    setHasMore(true);
    currentOffset.current = 0;
    onVirtualScroll(0, PAGE_SIZE, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    filters.checkedOptionsStageStatus,
    filters.checkedOptionsSeries,
    debouncedSearchText,
    filters.selectedContactId,
    filters.referenceWiseContact,
  ]);

  const onVirtualScroll = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isFetchingRef.current) return;
    if (!hasMore && !reset) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const res = await fetchCartReport(
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        filters.checkedOptionsStageStatus,
        MobileToken,
        getID,
        offset,
        limit,
        debouncedSearchText,
        filters.checkedOptionsSeries,
        setCurrencyName,
        filters.selectedContactId,
        filters.referenceWiseContact,
      );

      const newData = res?.items || [];

      if (newData.length < limit) {
        setHasMore(false);
      }

      setCurrencyName(res?.getcurrncy);

      if (reset) {
        setCustomers(newData);
      } else {
        setCustomers((prev) => [...prev, ...newData]);
      }

      currentOffset.current = offset + newData.length;
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  function isSimpleFilter(
    filter: DataTableFilterMetaData | DataTableOperatorFilterMetaData,
  ): filter is DataTableFilterMetaData {
    return (filter as DataTableFilterMetaData).value !== undefined;
  }

  function isOperatorFilter(
    filter: DataTableFilterMetaData | DataTableOperatorFilterMetaData,
  ): filter is DataTableOperatorFilterMetaData {
    return (
      (filter as DataTableOperatorFilterMetaData).constraints !== undefined
    );
  }

  const onFilter = (event: DataTableFilterEvent) => {
    const activeField = Object.keys(event.filters).find((key) => {
      const filter = event.filters[key];

      if (isSimpleFilter(filter)) {
        return filter.value !== null && filter.value !== "";
      }

      if (isOperatorFilter(filter)) {
        return (
          filter.constraints?.some((c) => c.value !== null && c.value !== "") ??
          false
        );
      }

      return false;
    });

    const newFilters: DataTableFilterMeta = { ...event.filters };
    Object.keys(newFilters).forEach((key) => {
      const filter = newFilters[key];

      if (key !== activeField) {
        if (isSimpleFilter(filter)) {
          filter.value = null;
        }

        if (isOperatorFilter(filter)) {
          filter.constraints.forEach((c) => (c.value = null));
        }
      }
    });

    setLazyState((prev) => ({
      ...prev,
      first: 0,
      filters: newFilters,
    }));
  };

  const onSelectionChange = (event: { value: any[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === totalRecords);
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

  const formatDateTime = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr === "-" || dateStr.includes("undefined"))
      return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch {
      return "-";
    }
  };

  const exportColumns = [
    ...(showProductDetails
      ? [{ title: "Product Details", dataKey: "product_details" }]
      : []),
    { title: `${title} Number`, dataKey: "cart_number" },
    { title: "Customer Name", dataKey: "to_customer_name" },
    { title: "Customer Phone", dataKey: "to_customer_phone" },
    { title: "Created By", dataKey: "username" },
    { title: "Status", dataKey: "cart_status" },
    // { title: "Type", dataKey: "type" },
    { title: "Created Date-Time", dataKey: "created_date_time" },
    { title: "Approve Date-Time", dataKey: "update_Date_time" },
    { title: `Taxable Amount (${currencyName})`, dataKey: "taxable_amt" },
    { title: `Tax Amount (${currencyName})`, dataKey: "gst_amt" },
    { title: `TCS Amount (${currencyName})`, dataKey: "tcs_amt" },
    { title: `Round Off (${currencyName})`, dataKey: "round_off" },
    { title: `Grand Total (${currencyName})`, dataKey: "grand_total" },
    ...uniqueCustomFields.map((field: any) => ({
      title: field.fieldLabel,
      dataKey: field.fieldName,
    })),
  ];

  const handelChangeShowModesalesInvoice = (item: IUserList) => {
    setContactInfoOrder(item);
    setIsOrderShowFromContactType(3);
    setIsOrderCreateFromContactShow(true);
    onCartModelOpenChange?.(true);
  };

  const handleHides = () => {
    setIsOrderCreateFromContactShow(false);
    onCartModelOpenChange?.(false);
  };

  useEscapeKey(handleHides);

  const buildRowForExport = (item: any) => {
    const contact = item.contact_details || {};
    const cart = item.cart_details || {};
    const custom = item.custom_fields || {};
    const fields = custom.fields || [];
    const values = custom.values || {};

    // ✅ Advance condition
    const advAmount = parseFloat(
      (cart.adv_payment || "").toString().replace(/[^\d.-]/g, ""),
    );
    const showAdvance = advAmount > 0;

    // Product items
    const productRows = item.product_items?.map((i: any) => ({
      name: `${i.item_product_name || ""}${i.item_product_code ? ` (${i.item_product_code})` : ""}`,
      qty: i.item_qty || "-",
      rate: i.item_rate || "-",
    })) || [{ name: "-", qty: "-", rate: "-" }];

    return {
      contact_details: `Name: ${contact.to_customer_name || "-"}
Company: ${contact.to_customer_company_name || "-"}
Phone: ${contact.to_customer_phone || "-"}`,

      invoice_details: `No: ${cart.cart_number || "-"}
Created By: ${cart.username || "-"}
Status: ${cart.is_approve?.name || "-"}
${
  showAdvance
    ? `Advance: ${cart.adv_payment || "-"}
Payable Amount: ${cart.payable_amount || "-"}`
    : ""
}
Grand Total: ${cart.grand_total || "-"}
Date: ${formatDateTime(cart.created_date_time)}
${fields
  .map((f: any) => `${f.title}: ${values[f.reference_column_name] || "-"}`)
  .join("\n")}`,

      product_details: productRows,
    };
  };

  // ==================== EXPORT PDF (with nested table in Product Details) ====================
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    const dataToExport = customers || []; // Safety check

    // Prepare main table body (without product details)
    const body = dataToExport.map((item: any) => {
      const row = buildRowForExport(item);
      return [
        row.contact_details || "-",
        row.invoice_details || "-",
        "", // Product column - we will draw nested table here
      ];
    });

    autoTable(doc, {
      head: [["Contact Details", "Invoice Details", "Product Details"]],
      body,
      foot: [
        [
          `Total Invoices: ${dataToExport.length}`,
          `Total Amount:  ${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.cart_details?.grand_total || item.grand_total_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}`,
          "",
        ],
      ],
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "top",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 85 },
        2: { cellWidth: 115 }, // Give more space to Product column
      },
      didParseCell: (data) => {
        // Optional: Increase row height if needed for nested tables
        if (data.column.index === 2 && data.section === "body") {
          data.cell.styles.minCellHeight = 25; // Adjust based on your data
        }
      },
      didDrawCell: (data) => {
        // Only process body cells in the Product Details column (index 2)
        if (data.section === "body" && data.column.index === 2) {
          const rowIndex = data.row.index;

          // Safety checks to prevent undefined error
          if (
            rowIndex === undefined ||
            rowIndex < 0 ||
            rowIndex >= dataToExport.length
          ) {
            return;
          }

          const item = dataToExport[rowIndex];
          if (!item) return;

          const products = buildRowForExport(item).product_details || [];

          if (products.length === 0) return;

          // Draw nested table inside the cell
          try {
            doc.autoTable({
              startY: data.cell.y + 2,
              margin: {
                left: data.cell.x + 2,
                right:
                  doc.internal.pageSize.width -
                  (data.cell.x + data.cell.width - 2),
              },
              tableWidth: data.cell.width - 6,
              styles: {
                fontSize: 7,
                cellPadding: 1.5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
              },
              head: [["Product Name", "Qty", "Rate"]],
              headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
              body: products.map((p: any) => [
                p.name || "-",
                p.qty || "-",
                p.rate || "-",
              ]),
              theme: "grid",
            });
          } catch (e) {
            console.error("Nested table error:", e);
          }
        }
      },
    });

    doc.save(`${title || "report"}_report.pdf`);
  };

  // ==================== PRINT TABLE (with nested HTML table) ====================
  const printTable = () => {
    const dataToExport = customers;

    const html = `
  <html>
  <head>
    <style>
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
      .product-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      .product-table th, .product-table td { border: 1px solid #aaa; padding: 4px 6px; font-size: 12px; }
      .product-table th { background-color: #f0f0f0; }
    </style>
  </head>
  <body>
    <h2>${title} Report</h2>
    <table>
      <thead>
        <tr>
          <th>Contact Details</th>
          <th>Invoice Details</th>
          <th>Product Details</th>
        </tr>
      </thead>
      <tbody>
        ${dataToExport
          .map((item) => {
            const row = buildRowForExport(item);

            // Product nested table HTML
            const productTableHTML = `
                  <table class="product-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Qty</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${row.product_details
                        .map(
                          (p: any) => `
                            <tr>
                              <td>${p.name}</td>
                              <td>${p.qty}</td>
                              <td>${p.rate}</td>
                            </tr>
                          `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                `;

            return `
                  <tr>
                    <td>${row.contact_details.replace(/\n/g, "<br/>")}</td>
                    <td>${row.invoice_details.replace(/\n/g, "<br/>")}</td>
                    <td>${productTableHTML}</td>
                  </tr>
                `;
          })
          .join("")}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold; background-color: #f2f2f2;">
          <td>Total Invoices: ${dataToExport.length}</td>
          <td>Total Amount:  ${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.cart_details?.grand_total || item.grand_total_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </body>
  </html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          {title}
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }
  const handleMultiPrint = () => {
    if (selectedIds.length === 0) return;

    openPrint(selectedIds.join(","), viewFormate);
  };
  return (
    <>
      <div>
        <div
          className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
        >
          <h3
            style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
            className="dash-board-text-count"
          >
            {title}
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
            {/* {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && (
                                <select
                                    value={actionType}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setActionType(value);

                                        if (selectedIds.length === 0) {
                                            toast.error("Please select at least one record");
                                            return;
                                        }


                                        if (value === "multiPrint") {
                                            handleMultiPrint();
                                        }
                                    }}
                                    style={{ padding: "6px", borderRadius: "5px" }}
                                >
                                    <option value="">Select Action</option>


                                    <option value="multiPrint" disabled={selectedIds.length === 0}>
                                        Generate Multi Print
                                    </option>
                                </select>
                            )} */}
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
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={() => {
                      if (selectedIds.length === 0) return;

                      setIsExportDropdownOpen(false);
                      handleMultiPrint();
                    }}
                    style={{
                      opacity: selectedIds.length === 0 ? 0.7 : 1,
                      cursor:
                        selectedIds.length === 0 ? "not-allowed" : "pointer",
                      pointerEvents: selectedIds.length === 0 ? "none" : "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <i
                        className="pi pi-copy"
                        style={{ marginRight: "4px" }}
                      />

                      <span style={{ marginRight: "auto" }}>
                        Generate Multi Print
                      </span>
                    </div>
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
          <DataTable
            ref={dt}
            value={customers}
            // lazy
            resizableColumns
            columnResizeMode="fit"
            className="custom-centered-table"
            tableStyle={{ tableLayout: "fixed", width: "100%" }}
            scrollable
            scrollHeight="80vh"
            virtualScrollerOptions={{
              itemSize: 60,
              lazy: true,
              onLazyLoad: (e: any) => {
                if (e.last >= customers.length - 1 && hasMore && !loading) {
                  onVirtualScroll(currentOffset.current, PAGE_SIZE);
                }
              },
              appendOnly: true,
              showLoader: true,
              delay: 0,
            }}
            // dataKey="id"
            filterDisplay="row"
            onFilter={onFilter}
            filters={lazyState.filters}
            onSort={onSort}
            sortField={lazyState.sortField ?? undefined}
            sortOrder={lazyState.sortOrder ?? undefined}
            loading={loading}
            selection={selectedCustomers}
            onSelectionChange={onSelectionChange}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            selectionMode="multiple"
            emptyMessage="No records found"
            loadingIcon={
              <i
                className="pi pi-spin pi-spinner"
                style={{ fontSize: "2rem" }}
              />
            }
            footer={
              <div
                style={{
                  padding: "10px",
                  background: "#f8f9fa",
                  position: "sticky",
                  bottom: 0,
                  zIndex: 1,
                }}
              >
                {/* <div style={{ textAlign: "right" }}>
                                    {(() => {
                                        const symbol =
                                            filteredData
                                                .find((row) => row.grand_total)
                                                ?.grand_total.match(/[^\d.,-]+/)?.[0] || "";

                                        const total = filteredData.reduce((sum, row) => {
                                            const numericValue = parseFloat(
                                                String(row.grand_total).replace(/[^0-9.-]+/g, ""),
                                            );
                                            return sum + (isNaN(numericValue) ? 0 : numericValue);
                                        }, 0);

                                        return `Total: ${symbol} ${total.toLocaleString("en-IN")}`;
                                    })()}
                                </div> */}
              </div>
            }
          >
            {(!MobileFlag ||
              MobileFlag === undefined ||
              MobileFlag === null) && (
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

            {(!MobileFlag ||
              MobileFlag === undefined ||
              MobileFlag === null) && (
              <Column
                field="actions"
                header="Actions"
                headerStyle={{
                  width: "80px",
                  textAlign: "center",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
                body={(rowData: any) => (
                  <div
                    className="gap-2"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      icon="pi pi-download"
                      className="p-button-text"
                      style={{ color: "green", width: "2rem" }}
                      onClick={() => {
                        if (canShareSalesInvoice) {
                          handleDownload(rowData.id, handleHide);
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }}
                      // onClick={() => handleDownload(rowData.id, handleHide)}
                      tooltip="Download"
                    />
                    <Button
                      icon="pi pi-print"
                      className="p-button-text"
                      style={{ color: "green", width: "2rem" }}
                      onClick={() => {
                        if (canPrintSalesInvoice) {
                          openPrint(rowData.id, viewFormate);
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }}
                      // onClick={() => openPrint(rowData.id, viewFormate)}
                      tooltip="Print"
                    />
                    <Button
                      icon="pi pi-eye"
                      className="p-button-text"
                      style={{ color: "green", width: "2rem" }}
                      onClick={() => {
                        if (canPrintSalesInvoice) {
                          openPrint(rowData.id, viewFormate, 1);
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }}
                      tooltip="View Print"
                    />
                  </div>
                )}
              />
            )}
            <Column
              header="Contact Details"
              headerStyle={{
                width: "250px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              body={(rowData: any) => {
                const contact = rowData.contact_details || {};

                return (
                  <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                    <b>Name:</b> {contact.to_customer_name || "-"} <br />
                    <b>Company:</b> {contact.to_customer_company_name || "-"}{" "}
                    <br />
                    <b>Phone:</b> {contact.to_customer_phone || "-"}
                  </div>
                );
              }}
            />
            <Column
              header="Invoice Details"
              headerStyle={{
                width: "300px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              body={(rowData: any) => {
                const cart = rowData.cart_details || {};
                const custom = rowData.custom_fields || {};
                const fields = custom.fields || [];
                const values = custom.values || {};

                return (
                  <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                    <b>No:</b> {cart.cart_number || "-"}
                    <br />
                    <b>Created By:</b> {cart.username || "-"} <br />
                    <b>Status:</b>{" "}
                    <span
                      style={{
                        backgroundColor: cart.is_approve?.bg_color,
                        border: `2px solid ${cart.is_approve?.border_color}`,
                        color: cart.is_approve?.text_color,
                        fontSize: "2px",
                        padding: "1px 1px",
                        fontWeight: "500",
                      }}
                      className="badge rounded-pill"
                    >
                      {cart.is_approve?.name}
                    </span>{" "}
                    <br />
                    <b>Grand Total:</b> {cart.grand_total || "-"} <br />
                    {parseFloat(cart.adv_payment.replace(/[^\d.-]/g, "")) >
                      0 && (
                      <>
                        <b>Advance Amount:</b> {cart.adv_payment} <br />
                        <b>Payable Amount:</b> {cart.payable_amount || "-"}{" "}
                        <br />
                      </>
                    )}
                    <b>Date:</b> {formatDateTime(cart.created_date_time)} <br />
                    <hr style={{ margin: "5px 0" }} />
                    {fields.map((f: any) => (
                      <div key={f.reference_column_name}>
                        <b>{f.title}:</b>{" "}
                        {values[f.reference_column_name] || "-"}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Column
              field="product_items"
              header={<span>Product Details</span>}
              headerClassName="center-header"
              headerStyle={{
                width: "250px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: any) => {
                const items = rowData.product_items || [];
                const shouldScroll = items.length > 5;

                return (
                  <div
                    style={{
                      maxHeight: shouldScroll ? "200px" : "auto",
                      overflowY: shouldScroll ? "auto" : "visible",
                      border: shouldScroll ? "1px solid #ccc" : "none",
                    }}
                  >
                    {items.length > 0 ? (
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          verticalAlign: "top",
                        }}
                      >
                        <thead
                          style={{
                            position: shouldScroll ? "sticky" : "static",
                            top: 0,
                            background: "#fff",
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th
                              style={{
                                border: "1px solid #ccc",
                                textAlign: "left",
                                padding: "4px",
                              }}
                            >
                              Product Name
                            </th>
                            <th
                              style={{
                                border: "1px solid #ccc",
                                textAlign: "right",
                                padding: "4px",
                              }}
                            >
                              Qty
                            </th>
                            <th
                              style={{
                                border: "1px solid #ccc",
                                textAlign: "right",
                                padding: "4px",
                              }}
                            >
                              Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item: any, index: number) => {
                            const name = item.item_product_name || "";
                            const code = item.item_product_code || "";

                            return (
                              <tr key={index}>
                                <td
                                  style={{
                                    border: "1px solid #ccc",
                                    padding: "4px",
                                  }}
                                >
                                  {name}
                                  {code ? ` (${code})` : ""}
                                </td>
                                <td
                                  style={{
                                    border: "1px solid #ccc",
                                    textAlign: "right",
                                    padding: "4px",
                                  }}
                                >
                                  {item.item_qty}
                                </td>
                                <td
                                  style={{
                                    border: "1px solid #ccc",
                                    textAlign: "right",
                                    padding: "4px",
                                  }}
                                >
                                  {item.item_rate}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      "-"
                    )}
                  </div>
                );
              }}
            />
          </DataTable>
        </div>
        {isOrderCreateFromContactShow && (
          <OrderCreateModal
            show={isOrderCreateFromContactShow}
            onHide={() => {
              setIsOrderCreateFromContactShow(false);
              onCartModelOpenChange?.(false);
            }}
            handleSubmit={() => setIsOrderCreateFromContactShow(false)}
            title={"Edit/View"}
            message={"Please Enter Your Order Details"}
            btn1={"CANCEL"}
            btn2={"Approve"}
            Contact={contactInfoOrder}
            isOrderShowNum={isOrderShowFromContactType}
            isOrderViewFormate={viewFormate}
            orderId={contactInfoOrder?.id}
            orderById={contactInfoOrder?.id}
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
            filtersToShow={[1, 4, 5, 15, 18]}
            pageId={1}
            stageandStatusOrderType={5}
            filtershowSeriesOrderType={"invoice_prefix"}
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
    </>
  );
};

export default DailyInvoiceReportView;
