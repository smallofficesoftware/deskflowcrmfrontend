import { saveAs } from "file-saver";
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
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import OrderCreateModal from "../../../../components/model/OrderCreateModel/OrderCreateModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { IUserList } from "../../../left-side/LeftSideController";
import { openPrint } from "../Quotations/QuotationController";
import {
  exportAllOrderData,
  fetchCartReport,
  fetchCartReportForExport,
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
    { title: "Product Details", dataKey: "product_details" },
    { title: "Product Qty", dataKey: "item_qty" },
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
      const rowData: any = {
        product_details:
          item.items
            ?.map((i: ICartItem) => {
              const name = i.item_product_name?.trim() || "";
              const code = i.item_product_code?.trim() || "";

              return code ? `${name} (${code})` : name;
            })
            .filter(Boolean)
            .join(", ") || "-",

        item_qty:
          item.items?.map((i: ICartItem) => i.item_qty).join(", ") || "-",
        cart_number: `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`,
        to_customer_name:
          `${item.to_customer_company_name}(${item.to_customer_name})` || "-",
        to_customer_phone: item.to_customer_phone || "-",
        username: item.username || "-",
        cart_status: item.cart_status !== undefined ? item.cart_status : "-",
        // type: item.type || "-",
        created_date_time: formatDateTime(item.created_date_time),
        update_Date_time: formatDateTime(item.update_Date_time),
        taxable_amt:
          item.taxable_amt_wo_c !== undefined
            ? `  ${item.taxable_amt_wo_c}`
            : "-",
        gst_amt:
          item.gst_amt_wo_c !== undefined ? `  ${item.gst_amt_wo_c}` : "-",
        tcs_amt:
          item.tcs_amt_wo_c !== undefined ? `  ${item.tcs_amt_wo_c}` : "-",
        round_off:
          item.round_off_wo_c !== undefined ? `  ${item.round_off_wo_c}` : "-",
        grand_total:
          item.grand_total_wo_c !== undefined
            ? `  ${item.grand_total_wo_c}`
            : "-",
      };
      uniqueCustomFields.forEach((field: any) => {
        rowData[field.fieldName] = item[field.fieldName] || "-";
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`${title}_report_${new Date().getTime()}.pdf`);
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
        doc.text(`${title} Report`, data.settings.margin.left, 10);
      },
    });

    doc.save(`${title}_report_${new Date().getTime()}.pdf`);
  };

  const fetchAccountOutstandingForExport = async (
    offset: number,
    limit: number,
  ): Promise<IFlatCartItem[]> => {
    return fetchCartReportForExport(
      selectedDates,
      selectedTeamMembers,
      selectedStageStatus,
      MobileToken,
      getID,
      offset,
      limit,
      debouncedGlobalSearch,
      selectedSeries,
      selectedContactId,
    );
  };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const exportData = await exportAllOrderData<IFlatCartItem>(
        fetchAccountOutstandingForExport,
        500,
      );

      if (!exportData.length) {
        toast.warn("No data to export");
        return;
      }

      // 🔹 collect custom fields
      const customFields = Array.from(
        new Set(
          exportData.flatMap((item) =>
            (item.customForm || []).map((cf) => cf.fieldName),
          ),
        ),
      );

      const excelRows = (
        selectedCustomers.length > 0 ? selectedCustomers : exportData
      ).map((item) => {
        const row: any = {
          "Product Details":
            item.items
              ?.map((i: ICartItem) => {
                const name = i.item_product_name || "";
                const code = i.item_product_code || "";

                return code ? `${name} (${code})` : name;
              })
              .join(", ") || "-",

          "Product Qty":
            item.items?.map((i: ICartItem) => i.item_qty).join(", ") || "-",
          "Order Number": `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`,
          "Customer Name": `${item.to_customer_company_name || ""} (${item.to_customer_name || "-"})`,
          "Customer Phone": item.to_customer_phone || "-",
          "Created By": item.username || "-",
          // type: title || "Sales Order",
          Status: item.cart_status || "-",
          "Created Date-Time": formatDateTime(item.created_date_time),
          "Approve Date-Time": formatDateTime(item.update_Date_time),
          [`Taxable Amount (${currencyName})`]: item.taxable_amt_wo_c || "-",
          [`Tax Amount (${currencyName})`]: item.gst_amt_wo_c || "-",
          [`TCS Amount (${currencyName})`]: item.tcs_amt_wo_c || "-",
          [`Round Off (${currencyName})`]: item.round_off_wo_c || "-",
          [`Grand Total (${currencyName})`]: item.grand_total_wo_c || "-",
        };

        customFields.forEach((field) => {
          const found = item.customForm?.find(
            (cf: any) => cf.fieldName === field,
          );
          row[field] = found?.value || "-";
        });

        return row;
      });

      const ws = xlsx.utils.json_to_sheet(excelRows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Sales Order Report");

      const buffer = xlsx.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `salesorder_report_${Date.now()}.xlsx`,
      );

      toast.success("Excel exported successfully");
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
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
              <th>Product Details</th>
              <th>Product Qty</th>
              <th>${title} Number</th>
              <th>Customer Name</th>
              <th>Customer Phone</th>
              <th>Created By</th>
              <th>Status</th>
              <!-- <th>Type</th> -->
              <th>Created Date Time</th>
              <th>Approve Date Time</th>
              <th>Taxable Amount (${currencyName})</th>
              <th>Tax Amount (${currencyName})</th>
              <th>TCS Amount (${currencyName})</th>
              <th>Round Off (${currencyName})</th>
              <th>Grand Total (${currencyName})</th>
              ${uniqueCustomFields
                .map((field: any) => `<th>${field.fieldLabel}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${dataToExport
              .map(
                (item: any) => `
                <tr>
     <td>
    ${
      item.items
        ?.map((i: ICartItem) => {
          const name = i.item_product_name?.trim() || "";
          const code = i.item_product_code?.trim() || "";

          return code ? `${name} (${code})` : name;
        })
        .filter(Boolean) // empty entries remove karega
        .join("<br/>") || "-"
    }
</td>
<td>
  ${item.items?.map((i: ICartItem) => i.item_qty).join("<br/>") || "-"}
</td>
                  <td>${item.cart_number || "XXXXXXX"} <br/> ${item.is_approve?.name || ""}</td>
                  <td>${item.to_customer_company_name}(${item.to_customer_name || "-"})</td>
                  <td>${item.to_customer_phone || "-"}</td>
                  <td>${item.username || "-"}</td>
                  <td>${item.cart_status !== undefined ? item.cart_status : "-"}</td>
                  <!-- <td>${item.type || "-"}</td -->
                  <td>${formatDateTime(item.created_date_time)}</td>
                  <td>${formatDateTime(item.update_Date_time)}</td>
                  <td>${item.taxable_amt_wo_c !== undefined ? `${item.taxable_amt_wo_c}` : "-"}</td>
                  <td>${item.gst_amt_wo_c !== undefined ? `${item.gst_amt_wo_c}` : "-"}</td>
                  <td>${item.tcs_amt_wo_c !== undefined ? `${item.tcs_amt_wo_c}` : "-"}</td>
                  <td>${item.round_off_wo_c !== undefined ? `${item.round_off_wo_c}` : "-"}</td>
                  <td>${item.grand_total_wo_c !== undefined ? `${item.grand_total_wo_c}` : "-"}</td>
                  ${uniqueCustomFields
                    .map(
                      (field: any) =>
                        `<td>${item[field.fieldName] || "-"}</td>`,
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
            <Column
              field="items"
              header={
                <span>
                  Product <br /> Details
                </span>
              }
              headerClassName="center-header"
              headerStyle={{
                width: "200px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: any) => (
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
              )}
            />

            <Column
              field="item_qty"
              header="Product Qty"
              headerClassName="center-header"
              headerStyle={{
                width: "80px",
                textAlign: "right",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: "right",
                fontSize: "14px",
              }}
              body={(rowData: any) => (
                <div>
                  {rowData.items && rowData.items.length > 0
                    ? rowData.items.map((item: any, index: number) => (
                        <div key={index}>{item.item_qty}</div>
                      ))
                    : "-"}
                </div>
              )}
            />
            <Column
              field="cart_number"
              header={`${title} Number`.replace(/ /g, "\n")}
              sortable
              filter
              filterField="cart_number"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "125px",
                whiteSpace: "pre-wrap",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              body={(rowData: any) => (
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
              )}
            />
            <Column
              field="to_customer_name"
              header={
                <span>
                  Contact <br /> Details
                </span>
              }
              sortable
              filter
              filterField="to_customer_name"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "125px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: any) => (
                <div>
                  <div>
                    {rowData.to_customer_company_name || "-"}(
                    {rowData.to_customer_name || "-"}){" -"}{" "}
                    {rowData.to_customer_phone || "-"}
                  </div>
                </div>
              )}
            />
            <Column
              field="username"
              header={
                <span>
                  Created <br /> By
                </span>
              }
              sortable
              filter
              filterField="username"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "90px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: any) => rowData.username || "-"}
            />
            <Column
              field="cart_status"
              header="Status"
              sortable
              filter
              filterField="cart_status"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "90px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              body={(rowData: any) => (
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
              )}
            />
            <Column
              field="created_date_time"
              header={
                <span>
                  Created <br /> Date-Time
                </span>
              }
              sortable
              filter
              filterField="created_date_time"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "120px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: any) => formatDateTime(rowData.created_date_time)}
            />
            <Column
              field="update_Date_time"
              header={
                <span>
                  Approve <br /> Date-Time
                </span>
              }
              sortable
              filter
              filterField="update_Date_time"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "120px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: any) => formatDateTime(rowData.update_Date_time)}
            />
            <Column
              field="taxable_amt"
              header={
                <span>
                  Taxable <br /> Amount
                </span>
              }
              sortable
              filter
              filterField="taxable_amt"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "90px",
                textAlign: "right",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: "right",
                // paddingRight: "70px",
                fontSize: "14px",
              }}
              body={(rowData: any) =>
                rowData.taxable_amt !== undefined
                  ? `${rowData.taxable_amt}`
                  : "0"
              }
            />
            <Column
              field="gst_amt"
              header={
                <span>
                  Tax <br /> Amount
                </span>
              }
              sortable
              filter
              filterField="gst_amt"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "90px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: "right",
                // paddingRight: "70px",
                fontSize: "14px",
              }}
              body={(rowData: any) =>
                rowData.gst_amt !== undefined ? `${rowData.gst_amt}` : "0"
              }
            />
            <Column
              field="tcs_amt"
              header={
                <span>
                  TCS <br /> Amount
                </span>
              }
              sortable
              filter
              filterField="tcs_amt"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "90px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: "right",
                // paddingRight: "70px",
                fontSize: "14px",
              }}
              body={(rowData: any) =>
                rowData.tcs_amt !== undefined ? `${rowData.tcs_amt}` : "0"
              }
            />
            <Column
              field="round_off"
              header={
                <span>
                  Round <br /> Off
                </span>
              }
              sortable
              filter
              filterField="round_off"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "90px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: "right",
                // paddingRight: "70px",
                fontSize: "14px",
              }}
              body={(rowData: any) =>
                rowData.round_off !== undefined ? `${rowData.round_off}` : "0"
              }
            />
            <Column
              field="grand_total"
              header={
                <span>
                  Grand <br /> Total
                </span>
              }
              sortable
              filter
              filterField="grand_total"
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerClassName="center-header"
              headerStyle={{
                width: "100px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: "right",
                // paddingRight: "70px",
                fontSize: "14px",
              }}
              body={(rowData: any) =>
                rowData.grand_total !== undefined
                  ? `${rowData.grand_total}`
                  : "0"
              }
            />
            {uniqueCustomFields.map((field: any) => (
              <Column
                key={field.fieldName}
                field={field.fieldName}
                header={field.fieldLabel.replace(/ /g, "\n")}
                sortable
                filter
                filterField={field.fieldName}
                filterPlaceholder={`Search ${field.fieldLabel}`}
                filterMatchMode={field.dataType === 1 ? "equals" : "contains"}
                headerStyle={{
                  width: "250px",
                  whiteSpace: "pre-wrap",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: any) => rowData[field.fieldName] || "-"}
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
