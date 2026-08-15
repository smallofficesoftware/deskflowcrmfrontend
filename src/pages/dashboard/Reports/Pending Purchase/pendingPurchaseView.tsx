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
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import OrderCreateModal from "../../../../components/model/OrderCreateModel/OrderCreateModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { IUserList } from "../../../left-side/LeftSideController";
import { openPendingPrint, openPrint } from "../Quotations/QuotationController";
import {
  exportAllPurchaseOrderData,
  fetchCartReport,
  fetchReturnOrderReportForExport,
  handleDownload,
  IFlatCartItem,
} from "./pendingPurchaseController";

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

const PendingPurchaseReportsView = ({
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
  const [cartData, setCartData] = useState<IFlatCartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshReport, setRefreshReport] = useState(false);
  const [currencyName, setCurrencyName] = useState<any>();

  const dt = useRef<DataTable<any[]>>(null);
  const currentOffset = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingMore = useRef(false);
  const [showProductDetails, setShowProductDetails] = useState(false);

  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const PAGE_SIZE = 100;
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

  const filters = getFilter("pending_purchase");
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

    setFilters("pending_purchase", updatedFilters);

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

      setFilters("pending_purchase", {
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
    PAGE_ID.PURCHASEORDER_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.PURCHASEORDER_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const canSharePurchaseInvoice = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.PRINT,
  );

  const canEdiPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.EDIT,
  );

  useEffect(() => {
    offsetRef.current = 0;
    currentOffset.current = 0;
    setHasMore(true);
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

  const onVirtualScroll = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const data = await fetchCartReport(
        setCartData,
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        filters.checkedOptionsStageStatus,
        undefined,
        MobileToken,
        getID,
        offsetRef.current,
        PAGE_SIZE,
        debouncedSearchText,
        filters.checkedOptionsSeries,
        setCurrencyName,
        filters.selectedContactId,
        filters.referenceWiseContact,
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

  type PendingPurchaseColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    sortableCol?: boolean;
    filterCol?: boolean;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: PendingPurchaseColumnDef[] = useMemo(() => {
    const defs: PendingPurchaseColumnDef[] = [];

    if (showProductDetails) {
      defs.push({
        key: "items",
        label: "Product Details",
        header: <span>Product Details</span>,
        width: "250px",
        sortableCol: false,
        filterCol: false,
        body: (rowData: any) => {
          const items = rowData.items || [];
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
        },
      });
    }

    defs.push(
      {
        key: "cart_number",
        label: `${title} Number`,
        header: `${title} Number`.replace(/ /g, "\n"),
        width: "115px",
        body: (rowData: any) => (
          <span
            style={{
              cursor: "normal",
              fontSize: "14px",
            }}
            onClick={() => {
              if (!MobileFlag) {
                handelChangeShowModelPurchaseOrder(rowData);
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
        body: (rowData: any) => (
          <div>
            <div>
              <div>
                {rowData.to_customer_company_name || "-"}(
                {rowData.to_customer_name || "-"})
              </div>
              <div>{rowData.to_customer_phone || "-"}</div>
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
        body: (rowData: any) => rowData.username || "-",
      },
      {
        key: "cart_status",
        label: "Status",
        header: "Status",
        width: "90px",
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
            Created <br /> Dtae-Time
          </span>
        ),
        width: "120px",
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
        body: (rowData: any) => formatDateTime(rowData.update_Date_time),
      },
      {
        key: "taxable_amt",
        label: `Taxable Amount (${currencyName})`,
        header: (
          <span>
            Taxable <br /> Amount
          </span>
        ),
        width: "90px",
        body: (rowData: any) =>
          rowData.taxable_amt !== undefined ? `${rowData.taxable_amt}` : "0",
      },
      {
        key: "gst_amt",
        label: `Tax Amount (${currencyName})`,
        header: (
          <span>
            Tax <br /> Amount
          </span>
        ),
        width: "90px",
        body: (rowData: any) =>
          rowData.gst_amt !== undefined ? `${rowData.gst_amt}` : "0",
      },
      {
        key: "tcs_amt",
        label: `TCS Amount (${currencyName})`,
        header: (
          <span>
            TCS <br /> Amount
          </span>
        ),
        width: "90px",
        body: (rowData: any) =>
          rowData.tcs_amt !== undefined ? `${rowData.tcs_amt}` : "0",
      },
      {
        key: "round_off",
        label: `Round Off (${currencyName})`,
        header: (
          <span>
            Round <br /> Off
          </span>
        ),
        width: "90px",
        body: (rowData: any) =>
          rowData.round_off !== undefined ? `${rowData.round_off}` : "0",
      },
      {
        key: "grand_total",
        label: `Grand Total (${currencyName})`,
        header: (
          <span>
            Grand <br /> Total
          </span>
        ),
        width: "90px",
        body: (rowData: any) =>
          rowData.grand_total !== undefined ? `${rowData.grand_total}` : "0",
      },
    );

    uniqueCustomFields.forEach((field: any) => {
      defs.push({
        key: field.fieldName,
        label: field.fieldLabel,
        header: field.fieldLabel.replace(/ /g, "\n"),
        width: "250px",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProductDetails, uniqueCustomFields, title, MobileFlag, currencyName]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("pending_purchase_report", baseColumnDefs);

  const getExportCellValue = (
    col: PendingPurchaseColumnDef,
    item: any,
  ): string => {
    switch (col.key) {
      case "items":
        return (
          item.items
            ?.map((i: any) => {
              const name = i.item_product_name || "";
              const code = i.item_product_code || "";
              const product = code ? `${name} (${code})` : name;

              return `${product} | ${i.item_qty}`;
            })
            .join("\n") || "-"
        );
      case "cart_number":
        return `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`;
      case "to_customer_name":
        return `${item.to_customer_company_name}(${item.to_customer_name})` || "-";
      case "to_customer_phone":
        return item.to_customer_phone || "-";
      case "username":
        return item.username || "-";
      case "cart_status":
        return item.cart_status !== undefined ? item.cart_status : "-";
      case "created_date_time":
        return formatDateTime(item.created_date_time);
      case "update_Date_time":
        return formatDateTime(item.update_Date_time);
      case "taxable_amt":
        return item.taxable_amt_wo_c !== undefined
          ? `${item.taxable_amt_wo_c}`
          : "-";
      case "gst_amt":
        return item.gst_amt_wo_c !== undefined
          ? `${item.gst_amt_wo_c}`
          : "-";
      case "tcs_amt":
        return item.tcs_amt_wo_c !== undefined
          ? `${item.tcs_amt_wo_c}`
          : "-";
      case "round_off":
        return item.round_off_wo_c !== undefined
          ? `${item.round_off_wo_c}`
          : "-";
      case "grand_total":
        return item.grand_total_wo_c !== undefined
          ? `${item.grand_total_wo_c}`
          : "-";
      default:
        return item[col.key] || "-";
    }
  };

  const EXTRA_EXPORT_COLUMNS = [{ key: "to_customer_phone", label: "Customer Phone" }];

  const handelChangeShowModelPurchaseOrder = (item: IUserList) => {
    if (canEdiPurchaseOrder) {
      setContactInfoOrder(item);
      setIsOrderShowFromContactType(5);
      setIsOrderCreateFromContactShow(true);
      onCartModelOpenChange?.(true);
    } else if (!canEdiPurchaseOrder) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });
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
        rowData[col.key] = getExportCellValue(col, item);
      });
      EXTRA_EXPORT_COLUMNS.forEach((col) => {
        rowData[col.key] = getExportCellValue(col as any, item);
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
      styles: {
        fontSize: 10,
        overflow: "linebreak",
        cellPadding: 2,
      },
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
    return fetchReturnOrderReportForExport(
      filters.selectedDateArray,
      filters.checkedOptionsUser,
      filters.checkedOptionsStageStatus,
      MobileToken,
      getID,
      offset,
      limit,
      debouncedSearchText,
      filters.checkedOptionsSeries,
      filters.selectedContactId,
    );
  };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const exportData = await exportAllPurchaseOrderData<IFlatCartItem>(
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
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        EXTRA_EXPORT_COLUMNS.forEach((col) => {
          row[col.label] = getExportCellValue(col as any, item);
        });

        customFields.forEach((field) => {
          if (uniqueCustomFields.some((f: any) => f.fieldName === field)) return;
          const found = item.customForm?.find(
            (cf: any) => cf.fieldName === field,
          );
          row[field] = found?.value || "-";
        });

        return row;
      });

      const ws = xlsx.utils.json_to_sheet(excelRows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Purchase Order Report");

      const buffer = xlsx.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `purchase_order_report_${Date.now()}.xlsx`,
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
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; table-layout: fixed;}
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; overflow-wrap: break-word;
            word-wrap: break-word;
            white-space: pre-line;
            vertical-align: top;}
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
              .map((col) => `<td>${getExportCellValue(col, item)}</td>`)
              .join("")}
                  ${EXTRA_EXPORT_COLUMNS.map(
                (col) => `<td>${getExportCellValue(col as any, item)}</td>`,
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

  const handleHides = () => {
    setIsOrderCreateFromContactShow(false);
    onCartModelOpenChange?.(false);
  };

  useEscapeKey(handleHides);

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
                  <li
                    className="listItem text-start"
                    onClick={() => setShowProductDetails((prev) => !prev)}
                    role="button"
                    style={{
                      background: showProductDetails ? "#f0fff4" : "#fff5f5",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "row" }}>
                      <i className="pi pi-box" style={{ marginRight: "4px" }} />

                      <span style={{ marginRight: "auto" }}>
                        Product Details
                      </span>
                      <i
                        className="pi pi-circle-fill"
                        style={{
                          color: showProductDetails ? "#16a34a" : "#dc2626",
                          fontSize: "10px",
                        }}
                      />
                    </div>
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
            columnResizeMode="fit"
            className="custom-centered-table"
            tableStyle={{ tableLayout: "fixed", width: "100%" }}
            scrollable
            scrollHeight="90vh"
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
            // dataKey="id"
            filterDisplay="row"
            onFilter={onFilter}
            filters={lazyState.filters}
            onSort={onSort}
            sortField={lazyState.sortField ?? undefined}
            sortOrder={lazyState.sortOrder ?? undefined}
            selection={selectedCustomers}
            onSelectionChange={onSelectionChange}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            selectionMode="multiple"
            emptyMessage="No records found"
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
                <div style={{ textAlign: "right" }}>
                  {(() => {
                    const symbol =
                      filteredData
                        .find((row) => row.grand_total)
                        ?.grand_total.match(/[^\d.,-]+/)?.[0] || "₹";

                    const total = filteredData.reduce((sum, row) => {
                      const numericValue = parseFloat(
                        String(row.grand_total).replace(/[^0-9.-]+/g, ""),
                      );
                      return sum + (isNaN(numericValue) ? 0 : numericValue);
                    }, 0);

                    return `Total: ${symbol} ${total.toLocaleString("en-IN")}`;
                  })()}
                </div>
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
                    width: "100px",
                    textAlign: "center",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                  body={(rowData: any) => (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                      }}
                    >
                      <svg
                        // style={{ marginRight: "15px" }}
                        onClick={() => {
                          if (canSharePurchaseInvoice) {
                            handleDownload(rowData.id, handleHide);
                          } else {
                            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                          }
                        }}
                        // onClick={() => handleDownload(rowData.id, handleHide)}
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="green"
                      >
                        <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                      </svg>

                      <svg
                        // style={{ marginRight: "15px" }}
                        onClick={() => {
                          if (canPrintPurchaseInvoice) {
                            openPrint(rowData.id, viewFormate);
                          } else {
                            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                          }
                        }}
                        // onClick={() => openPrint(rowData.id, viewFormate)}
                        xmlns="http://www.w3.org/2000/svg"
                        height="22px"
                        viewBox="0 -960 960 960"
                        width="22px"
                        fill="green"
                      >
                        <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" />
                      </svg>

                      <svg
                        // style={{ marginRight: "15px" }}
                        onClick={() => {
                          if (canPrintPurchaseInvoice) {
                            openPendingPrint(rowData.id, 5);
                          } else {
                            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                          }
                        }}
                        // onClick={() => openPendingPrint(rowData.id, 5)}
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="green"
                      >
                        <path d="M452-160ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 48-18 92t-51 77q-38 10-71 29t-60 47q-10-2-19.5-3.5T480-440q-66 0-113 47t-47 113v120h132q7 22 16.5 42T491-80H160Zm320-440q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47Zm270 360h40v-160h-40v160Zm-100 0h40v-160h-40v160Zm70 120q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM480-800Z" />
                      </svg>
                      {/* <svg
                      // style={{ marginRight: "15px" }}
                      onClick={() => {
                        if (canPrintPurchaseInvoice) {
                          openPendingPrint(rowData.id, 5, 1);
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="green"
                    >
                      <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
                    </svg> */}
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
                  whiteSpace: "pre-wrap",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={
                  ["taxable_amt", "gst_amt", "tcs_amt", "round_off", "grand_total"].includes(
                    col.key,
                  )
                    ? { textAlign: "right", fontSize: "14px" }
                    : { fontSize: "14px" }
                }
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
        {isModalFilterVisible && (
          <CheckBoxFilterModal
            show={isModalFilterVisible}
            onHide={() => setIsModalFilterVisible(false)}
            handleSubmit={handleApplyFilters}
            title="Filter Reports"
            message="Please select the Dates and Team Members for the Report."
            btn1="Clear"
            btn2="Apply"
            filtersToShow={[1, 4, 5, 18]}
            pageId={1}
            stageandStatusOrderType={7}
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

export default PendingPurchaseReportsView;
