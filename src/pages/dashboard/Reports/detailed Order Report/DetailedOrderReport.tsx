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
import ColumnsButton from "../../../../components/ColumnsButton";
import { exportReportExcel } from "../../../../services/reportExportService";
import OrderCreateModal from "../../../../components/model/OrderCreateModel/OrderCreateModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { IUserList } from "../../../left-side/LeftSideController";
import { openPrint } from "../Quotations/QuotationController";
import {
  fetchCartReport,
  handleDownload,
  ICartItem,
  IFlatCartItem,
} from "./DetailedOrderController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface ITeamcartDataReports {
  selectedDates: DateObject[];
  selectedTeamMembers: string[] | null;
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
  globalSearch: string;
  selectedContactId?: string | null;
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

const TeamSalesOrderDataReportsView = ({
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
  const [hasMore, setHasMore] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [refreshReport, setRefreshReport] = useState(false);

  const dt = useRef<DataTable<any[]>>(null);
  const [currencyName, setCurrencyName] = useState<any>();

  const [debouncedGlobalSearch, setDebouncedGlobalSearch] =
    useState<string>("");

  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const PAGE_SIZE = 50;
  const [actionType, setActionType] = useState<string>("");

  const selectedIds = useMemo(() => {
    return selectedCustomers.map((item: IFlatCartItem) => item.id);
  }, [selectedCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalSearch(globalSearch?.trim() ?? "");
    }, 500);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  const handleHide = () => {
    console.log("handleHide called");
  };

  const canShare = useCheckUserPermission(
    PAGE_ID.SALESORDER_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.SALESORDER_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const canShareSalesOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintSalesOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.PRINT,
  );

  const canEditSalesOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.EDIT,
  );

  useEffect(() => {
    offsetRef.current = 0;
    currentOffset.current = 0;
    setHasMore(true);
    onVirtualScroll(0, 50, true);
  }, [
    selectedDates,
    selectedTeamMembers,
    selectedStageStatus,
    selectedSeries,
    debouncedGlobalSearch,
    selectedContactId,
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

    // Apply filters
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        data = data.filter((item) => {
          if (meta.matchMode === "custom" && field === "to_customer_name") {
            const name =
              getNestedValue(item, "to_customer_name")
                ?.toString()
                .toLowerCase() || "";
            const phone =
              getNestedValue(item, "to_customer_phone")
                ?.toString()
                .toLowerCase() || "";
            return name.includes(filterValue) || phone.includes(filterValue);
          }

          const value = getNestedValue(item, field);
          if (value == null) return false;
          const str = value.toString().toLowerCase();

          switch (meta.matchMode) {
            case "equals":
              return value.toString() === meta.value.toString();
            case "contains":
              return str.includes(filterValue);
            case "startsWith":
              return str.startsWith(filterValue);
            case "endsWith":
              return str.endsWith(filterValue);
            case "notEquals":
              return str !== filterValue;
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    if (lazyState.sortField) {
      data.sort((a, b) => {
        const aVal = getNestedValue(a, lazyState.sortField!);
        const bVal = getNestedValue(b, lazyState.sortField!);
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) data.reverse();
    }

    return data;
  }, [dataArray, lazyState.filters, lazyState.sortField, lazyState.sortOrder]);

  const onVirtualScroll = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    setLoading(true); // only first load

    try {
      const data = await fetchCartReport(
        selectedDates,
        selectedTeamMembers,
        selectedStageStatus,
        MobileToken,
        getID,
        offsetRef.current,
        PAGE_SIZE,
        debouncedGlobalSearch,
        selectedSeries,
        setCurrencyName,
        selectedContactId,
      );
      const newData = data?.items || [];
      const getcurrncy = data?.getcurrncy;
      if (newData.length < limit) {
        setHasMore(false);
      }
      setCurrencyName(getcurrncy);
      if (reset) {
        setCustomers(newData);
      } else {
        setCustomers((prev) => {
          const updated = prev.concat(newData);
          return updated;
        });
      }

      currentOffset.current = offset + newData.length;

      offsetRef.current += PAGE_SIZE;
    } catch (err) {
      setHasMore(false);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 200);
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    currentOffset.current = 0;
    offsetRef.current = 0;
    setHasMore(true);
    setCustomers([]);
    onVirtualScroll(0, PAGE_SIZE, true);
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

  const handelChangeShowModelOrder = (item: IUserList) => {
    setContactInfoOrder(item);
    setIsOrderShowFromContactType(2);
    setIsOrderCreateFromContactShow(true);
    onCartModelOpenChange?.(true);
  };

  const handleHides = () => {
    setIsOrderCreateFromContactShow(false);
    onCartModelOpenChange?.(false);
  };

  useEscapeKey(handleHides);

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a1" });
    const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );

    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied
          ? customers
          : filteredData;

    const tableData = dataToExport.map((item) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, item, "pdf");
      });
      EXTRA_EXPORT_COLUMNS.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, item, "pdf");
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`${title}_report_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = [
      ...visibleColumns.map((col) => ({ title: col.label, dataKey: col.key })),
      ...EXTRA_EXPORT_COLUMNS.map((col) => ({
        title: col.label,
        dataKey: col.key,
      })),
    ];

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        doc.text(`${title} Report`, data.settings.margin.left, 10);
      },
    });

    doc.save(`${title}_report_${new Date().getTime()}.pdf`);
  };

  // NOTE: this whole report is currently unreachable - ReportsModel.tsx has
  // its "detailed_order_report" entry, filterShowNumber branch, and render
  // block all commented out, and BottomView.tsx never references it either.
  // Converted anyway per the generic-export rollout, but nobody can click
  // this today.
  const exportExcel = async () => {
    try {
      setLoading(false);
      await exportReportExcel({
        reportType: "detailed_order_report",
        filters: {
          selectedDates,
          selectedTeamMembers,
          selectedStageStatus,
          globalSearch: debouncedGlobalSearch,
          selectedSeries,
          selectedContactId,
        },
        columns: [...visibleColumns, ...EXTRA_EXPORT_COLUMNS],
        fileName: "Detailed_Order_Report",
        rows:
          selectedCustomers.length > 0
            ? selectedCustomers.map((item) => ({
                ...item,
                cart_number: `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`,
                to_customer_name: `${item.to_customer_company_name || ""}(${item.to_customer_name || "-"})`,
              }))
            : undefined,
      });
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  type OrderColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    sortableCol?: boolean;
    filterCol?: boolean;
    headerAlign?: "right";
    headerWhiteSpace?: "pre-wrap";
    bodyAlign?: "right";
    bodyWhiteSpace?: "pre-wrap";
    bodyWordBreak?: "break-word";
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: OrderColumnDef[] = useMemo(() => {
    const defs: OrderColumnDef[] = [
      {
        key: "items",
        label: "Product Details",
        header: (
          <span>
            Product <br /> Details
          </span>
        ),
        width: "200px",
        sortableCol: false,
        filterCol: false,
        body: (rowData: any) => (
          <div>
            {rowData.items && rowData.items.length > 0
              ? rowData.items.map((item: any, index: number) => {
                  const productName = item.item_product_name || "";
                  const productCode = item.item_product_code || "";

                  return (
                    <div key={index}>
                      {productName}
                      {productCode ? ` (${productCode})` : ""}
                    </div>
                  );
                })
              : "-"}
          </div>
        ),
      },
      {
        key: "item_qty",
        label: "Product Qty",
        header: "Product Qty",
        width: "80px",
        sortableCol: false,
        filterCol: false,
        headerAlign: "right",
        bodyAlign: "right",
        body: (rowData: any) => (
          <div>
            {rowData.items && rowData.items.length > 0
              ? rowData.items.map((item: any, index: number) => (
                  <div key={index}>{item.item_qty}</div>
                ))
              : "-"}
          </div>
        ),
      },
      {
        key: "cart_number",
        label: `${title} Number`,
        header: `${title} Number`.replace(/ /g, "\n"),
        width: "125px",
        headerWhiteSpace: "pre-wrap",
        filterMatchMode: "contains",
        body: (rowData: any) => (
          <span
            style={{
              cursor: "normal",
              fontSize: "14px",
            }}
            onClick={() => {
              if (canEditSalesOrder && !MobileFlag) {
                handelChangeShowModelOrder(rowData);
              } else if (!canEditSalesOrder) {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
              }
            }}
            title={`View ${title}`}
          >
            {rowData.cart_number || "# XXXXXXX"} <br />
            <span
              style={{
                backgroundColor: rowData.is_approve?.bg_color,
                border: `2px solid ${rowData.is_approve?.border_color}`,
                color: rowData.is_approve?.text_color,
                fontSize: "2px",
                padding: "1px 1px",
                fontWeight: "500",
              }}
              className="badge rounded-pill"
            >
              {rowData.is_approve?.name}
            </span>
          </span>
        ),
      },
      {
        key: "to_customer_name",
        label: "Contact Details",
        header: (
          <span>
            Contact <br /> Details
          </span>
        ),
        width: "125px",
        filterMatchMode: "contains",
        body: (rowData: any) => (
          <div>
            <div>
              {rowData.to_customer_company_name || "-"}(
              {rowData.to_customer_name || "-"}){" -"}{" "}
              {rowData.to_customer_phone || "-"}
            </div>
          </div>
        ),
      },
      {
        key: "username",
        label: "Created By",
        header: (
          <span>
            Created <br /> By
          </span>
        ),
        width: "90px",
        filterMatchMode: "contains",
        body: (rowData: any) => rowData.username || "-",
      },
      {
        key: "cart_status",
        label: "Status",
        header: "Status",
        width: "90px",
        filterMatchMode: "contains",
        body: (rowData: any) => (
          <span
            style={{
              backgroundColor: rowData.status_colour
                ? rowData.status_colour
                : "#eeeeee",
            }}
            className="badge rounded-pill"
          >
            {rowData.cart_status}
          </span>
        ),
      },
      {
        key: "created_date_time",
        label: "Created Date-Time",
        header: (
          <span>
            Created <br /> Date-Time
          </span>
        ),
        width: "120px",
        filterMatchMode: "contains",
        body: (rowData: any) => formatDateTime(rowData.created_date_time),
      },
      {
        key: "update_Date_time",
        label: "Approve Date-Time",
        header: (
          <span>
            Approve <br /> Date-Time
          </span>
        ),
        width: "120px",
        filterMatchMode: "contains",
        body: (rowData: any) => formatDateTime(rowData.update_Date_time),
      },
      {
        key: "taxable_amt",
        label: "Taxable Amount",
        header: (
          <span>
            Taxable <br /> Amount
          </span>
        ),
        width: "90px",
        headerAlign: "right",
        bodyAlign: "right",
        filterMatchMode: "contains",
        body: (rowData: any) =>
          rowData.taxable_amt !== undefined ? `${rowData.taxable_amt}` : "0",
      },
      {
        key: "gst_amt",
        label: "Tax Amount",
        header: (
          <span>
            Tax <br /> Amount
          </span>
        ),
        width: "90px",
        bodyAlign: "right",
        filterMatchMode: "contains",
        body: (rowData: any) =>
          rowData.gst_amt !== undefined ? `${rowData.gst_amt}` : "0",
      },
      {
        key: "tcs_amt",
        label: "TCS Amount",
        header: (
          <span>
            TCS <br /> Amount
          </span>
        ),
        width: "90px",
        bodyAlign: "right",
        filterMatchMode: "contains",
        body: (rowData: any) =>
          rowData.tcs_amt !== undefined ? `${rowData.tcs_amt}` : "0",
      },
      {
        key: "round_off",
        label: "Round Off",
        header: (
          <span>
            Round <br /> Off
          </span>
        ),
        width: "90px",
        bodyAlign: "right",
        filterMatchMode: "contains",
        body: (rowData: any) =>
          rowData.round_off !== undefined ? `${rowData.round_off}` : "0",
      },
      {
        key: "grand_total",
        label: "Grand Total",
        header: (
          <span>
            Grand <br /> Total
          </span>
        ),
        width: "100px",
        bodyAlign: "right",
        filterMatchMode: "contains",
        body: (rowData: any) =>
          rowData.grand_total !== undefined
            ? `${rowData.grand_total}`
            : "0",
      },
    ];

    uniqueCustomFields.forEach((field: any) => {
      defs.push({
        key: field.fieldName,
        label: field.fieldLabel,
        header: field.fieldLabel.replace(/ /g, "\n"),
        width: field.dataType === 3 ? "250px" : "150px",
        headerWhiteSpace: "pre-wrap",
        bodyWhiteSpace: field.dataType === 3 ? "pre-wrap" : undefined,
        bodyWordBreak: field.dataType === 3 ? "break-word" : undefined,
        filterMatchMode: field.dataType === 1 ? "equals" : "contains",
        body: (rowData: any) => {
          const val = rowData[field.fieldName];
          if (val === null || val === undefined || val === "") return "-";
          if (field.dataType === 3) {
            return (
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {val}
              </div>
            );
          }
          return val;
        },
      });
    });

    return defs;
  }, [title, canEditSalesOrder, MobileFlag, uniqueCustomFields]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("detailed_order_report", baseColumnDefs);

  const EXTRA_EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "to_customer_phone", label: "Customer Phone" },
  ];

  const getExportCellValue = (
    col: { key: string; label: string },
    item: any,
    format: "pdf" | "excel" | "print",
  ): string => {
    switch (col.key) {
      case "items": {
        const names = item.items
          ?.map((i: ICartItem) => {
            const name = i.item_product_name?.trim() || "";
            const code = i.item_product_code?.trim() || "";

            return code ? `${name} (${code})` : name;
          })
          .filter(Boolean);
        if (!names || names.length === 0) return "-";
        return format === "print" ? names.join("<br/>") : names.join(", ");
      }
      case "item_qty": {
        const qtys = item.items?.map((i: ICartItem) => i.item_qty);
        if (!qtys || qtys.length === 0) return "-";
        return format === "print" ? qtys.join("<br/>") : qtys.join(", ");
      }
      case "cart_number":
        return format === "print"
          ? `${item.cart_number || "XXXXXXX"} <br/> ${item.is_approve?.name || ""}`
          : `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`;
      case "to_customer_name":
        if (format === "excel") {
          return `${item.to_customer_company_name || ""} (${item.to_customer_name || "-"})`;
        }
        return `${item.to_customer_company_name}(${item.to_customer_name || "-"})`;
      case "to_customer_phone":
        return item.to_customer_phone || "-";
      case "username":
        return item.username || "-";
      case "cart_status":
        if (format === "excel") return item.cart_status || "-";
        return item.cart_status !== undefined ? item.cart_status : "-";
      case "created_date_time":
        return formatDateTime(item.created_date_time);
      case "update_Date_time":
        return formatDateTime(item.update_Date_time);
      case "taxable_amt":
        if (item.taxable_amt_wo_c === undefined) return "-";
        return format === "pdf"
          ? `  ${item.taxable_amt_wo_c}`
          : `${item.taxable_amt_wo_c}`;
      case "gst_amt":
        if (item.gst_amt_wo_c === undefined) return "-";
        return format === "pdf"
          ? `  ${item.gst_amt_wo_c}`
          : `${item.gst_amt_wo_c}`;
      case "tcs_amt":
        if (item.tcs_amt_wo_c === undefined) return "-";
        return format === "pdf"
          ? `  ${item.tcs_amt_wo_c}`
          : `${item.tcs_amt_wo_c}`;
      case "round_off":
        if (item.round_off_wo_c === undefined) return "-";
        return format === "pdf"
          ? `  ${item.round_off_wo_c}`
          : `${item.round_off_wo_c}`;
      case "grand_total":
        if (item.grand_total_wo_c === undefined) return "-";
        return format === "pdf"
          ? `  ${item.grand_total_wo_c}`
          : `${item.grand_total_wo_c}`;
      default: {
        if (format === "excel") {
          const found = item.customForm?.find(
            (cf: any) => cf.fieldName === col.key,
          );
          return found?.value ?? item[col.key] ?? "-";
        }
        return item[col.key] || "-";
      }
    }
  };

  const printTable = () => {
    const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );

    const dataToExport =
      selectedCustomers.length > 0
        ? selectedCustomers
        : isFilterApplied
          ? customers
          : filteredData;

    const printContent = `
    <html>
      <head>
        <title>${title} Report</title>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { text-align: center; }
        </style>
      </head>
      <body>
        <h1>${title} Report</h1>
        <table>
          <thead>
            <tr>
              ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
              ${EXTRA_EXPORT_COLUMNS.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${dataToExport
              .map(
                (item: any) => `
                <tr>
                  ${visibleColumns
                    .map(
                      (col) =>
                        `<td>${getExportCellValue(col, item, "print")}</td>`,
                    )
                    .join("")}
                  ${EXTRA_EXPORT_COLUMNS.map(
                    (col) =>
                      `<td>${getExportCellValue(col, item, "print")}</td>`,
                  ).join("")}
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
          {title} Report
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
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <h3
            style={{ fontSize: "20px", paddingLeft: "12px" }}
            className="dash-board-text-count"
          >
            {title} Report
          </h3>
          {MobileFlag || MobileFlag != undefined || MobileFlag != null ? (
            ""
          ) : (
            <div className="d-flex gap-2 align-items-center">
              {(!MobileFlag ||
                MobileFlag === undefined ||
                MobileFlag === null) && (
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

                  <option
                    value="multiPrint"
                    disabled={selectedIds.length === 0}
                  >
                    Generate Multi Print
                  </option>
                </select>
              )}
              <Button
                icon="pi pi-file-excel"
                className="report_button"
                style={{ backgroundColor: "green" }}
                severity="success"
                rounded
                onClick={
                  canShare
                    ? exportExcel
                    : () => toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                }
                tooltip="Export Excel"
                disabled={customers.length === 0}
              />
              <Button
                icon="pi pi-file-pdf"
                className="report_button"
                style={{ backgroundColor: "green" }}
                severity="danger"
                rounded
                onClick={
                  canShare
                    ? exportPdf
                    : () => toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                }
                tooltip="Export PDF"
                disabled={customers.length === 0}
              />
              <Button
                icon="pi pi-print"
                className="report_button"
                style={{ backgroundColor: "green" }}
                severity="secondary"
                rounded
                onClick={
                  canPrint
                    ? printTable
                    : () => toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                }
                tooltip="Print"
                disabled={customers.length === 0}
              />
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
          )}
        </div>

        <div
          className="report_card"
          style={{ height: "90vh", display: "flex", flexDirection: "column" }}
        >
          <DataTable
            ref={dt}
            value={customers}
            // lazy
            loading={loading}
            loadingIcon={
              <i
                className="pi pi-spin pi-spinner"
                style={{ fontSize: "2rem" }}
              />
            }
            resizableColumns
            className="custom-centered-table"
            columnResizeMode="fit"
            tableStyle={{ tableLayout: "fixed", width: "100%" }}
            scrollable
            scrollHeight="80vh"
            virtualScrollerOptions={{
              itemSize: 52,
              lazy: true,
              onLazyLoad: (event: { first: number; last: number }) => {
                if (event.last >= customers.length - 1 && hasMore && !loading) {
                  onVirtualScroll(currentOffset.current, 50);
                }
              },
              appendOnly: true,
              showLoader: false,
              delay: 0,
            }}
            // dataKey="cart_number"
            filterDisplay="row"
            onFilter={onFilter}
            filters={lazyState.filters}
            onSort={onSort}
            sortField={lazyState.sortField ?? undefined}
            sortOrder={lazyState.sortOrder ?? undefined}
            // loading={loading}
            selection={selectedCustomers}
            onSelectionChange={onSelectionChange}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            selectionMode="multiple"
            emptyMessage="No records found"
            // loadingIcon={<span>Loading data, please wait...</span>}
            footer={
              <div
                style={{
                  padding: "10px",
                  background: "#f8f9fa",
                  textAlign: "right",
                }}
              >
                {(() => {
                  const symbol =
                    filteredData
                      .find((r) => r.grand_total)
                      ?.grand_total.match(/[^\d.,-]+/)?.[0] || "₹";
                  const total = filteredData.reduce((sum, row) => {
                    const val = parseFloat(
                      String(row.grand_total).replace(/[^0-9.-]+/g, ""),
                    );
                    return sum + (isNaN(val) ? 0 : val);
                  }, 0);
                  return `Total: ${symbol} ${total.toLocaleString("en-IN")}`;
                })()}
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
                headerClassName="center-header"
                headerStyle={{
                  width: "80px",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
                body={(rowData: any) => (
                  <div
                    className="gap-2"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      icon="pi pi-download"
                      className="p-button-text"
                      style={{ color: "green", width: "2rem" }}
                      onClick={() => {
                        if (canShareSalesOrder) {
                          handleDownload(rowData.id, handleHide);
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }}
                      tooltip="Download"
                    />
                    <Button
                      icon="pi pi-print"
                      className="p-button-text"
                      style={{ color: "green", width: "2rem" }}
                      onClick={() => {
                        if (canPrintSalesOrder) {
                          openPrint(rowData.id, viewFormate);
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }}
                      tooltip="Print"
                    />
                    <Button
                      icon="pi pi-eye"
                      className="p-button-text"
                      style={{ color: "green", width: "2rem" }}
                      onClick={() => {
                        if (canPrintSalesOrder) {
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
            {visibleColumns.map((col) => (
              <Column
                key={col.key}
                field={col.key}
                header={col.header}
                sortable={col.sortableCol !== false}
                filter={col.filterCol !== false}
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
                  whiteSpace: col.headerWhiteSpace,
                  textAlign: col.headerAlign,
                }}
                bodyStyle={{
                  fontSize: "14px",
                  textAlign: col.bodyAlign,
                  whiteSpace: col.bodyWhiteSpace,
                  wordBreak: col.bodyWordBreak,
                }}
                body={col.body}
              />
            ))}
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
      </div>
    </>
  );
};

export default TeamSalesOrderDataReportsView;
