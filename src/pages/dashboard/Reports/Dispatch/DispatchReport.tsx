import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
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
import { OverlayPanel } from "primereact/overlaypanel";
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
import { fetchContact } from "../../../right-side/RightViewController";
import CommonOrderActions from "../CommonOrderActions";
import MultipleDeletePopUp from "../MultipleDeletePopUp";
import {
  exportAllDispatchData,
  fetchCartReport,
  fetchDispatchReportForExport,
  IFlatCartItem,
  openPrint,
} from "./DispatchController";

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
  selectedContactId?: any;
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

const TeamDispatchDataReportsView = ({
  selectedDates,
  selectedTeamMembers,
  selectedStageStatus,
  selectedSeries,
  title,
  setRefreshReport1,
  viewFormate,
  MobileToken,
  getID,
  MobileFlag,
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
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] =
    useState<string>("");
  const [showProductDetails, setShowProductDetails] = useState(false);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const PAGE_SIZE = 100;
  const [isOrderShow, setIsOrderShow] = useState(false);
  const [contactData, setContactData] = useState<IUserList | undefined>();
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

  const filters = getFilter("dispatch_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const op = useRef<OverlayPanel>(null);
  const [activeRowData, setActiveRowData] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;

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

    setFilters("dispatch_report", updatedFilters);

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

      setFilters("dispatch_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  useEscapeKey(() => {
    if (!isExportDropdownOpen && !activeRowData && !isOrderShow) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
      setActiveRowData(false);
      setIsOrderShow(false);
    }
  });

  const handleHide = () => {
    console.log("handleHide called");
  };

  const canShare = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const canAddDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.ADD,
  );

  const canShareDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.PRINT,
  );

  const canEditDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.EDIT,
  );

  const canDelDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.DELETE,
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
    filters.checkedGstOptions,
    filters.selectedProductId,
    filters.selectedCategoryId,
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
      grand_total: { value: null, matchMode: "equals" },
    },
  });

  // const handleHides = () => {
  //   setIsOrderCreateFromContactShow(false);
  //   onCartModelOpenChange?.(false);
  // };

  // useEscapeKey(handleHides);

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
        filters.checkedGstOptions,
        filters.selectedProductId,
        filters.selectedCategoryId,
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

  type DispatchColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    filterMatchMode?: string;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: DispatchColumnDef[] = useMemo(() => {
    const defs: DispatchColumnDef[] = [];

    if (showProductDetails) {
      defs.push({
        key: "items",
        label: "Product Details",
        header: <span>Product Details</span>,
        width: "250px",
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
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      position: shouldScroll ? "sticky" : "static",
                      top: 0,
                      background: "#fff",
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th style={{ border: "1px solid #ccc", textAlign: "left", padding: "4px" }}>
                        Product Name
                      </th>
                      <th style={{ border: "1px solid #ccc", textAlign: "right", padding: "4px" }}>
                        Qty
                      </th>
                      <th style={{ border: "1px solid #ccc", textAlign: "right", padding: "4px" }}>
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
                          <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                            {name}
                            {code ? ` (${code})` : ""}
                          </td>
                          <td style={{ border: "1px solid #ccc", textAlign: "right", padding: "4px" }}>
                            {item.item_qty}
                          </td>
                          <td style={{ border: "1px solid #ccc", textAlign: "right", padding: "4px" }}>
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
            style={{ cursor: "normal", fontSize: "14px" }}
            onClick={() => {
              if (!MobileFlag) {
                handelChangeShowModelDispatch(rowData);
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
        width: "200px",
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
        width: "70px",
        body: (rowData: any) => (
          <span
            style={{
              backgroundColor: rowData.status_colour ? rowData.status_colour : "#eeeeee",
            }}
            className="badge rounded-pill"
          >
            {rowData.cart_status}
          </span>
        ),
      },
      {
        key: "created_date_time",
        label: "Created Date-time",
        header: (
          <span>
            Created <br /> Date-time
          </span>
        ),
        width: "90px",
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
        width: "90px",
        body: (rowData: any) => formatDateTime(rowData.update_Date_time),
      },
    );

    uniqueCustomFields.forEach((field: any) => {
      defs.push({
        key: field.fieldName,
        label: field.fieldLabel,
        header: field.fieldLabel.replace(/ /g, "\n"),
        width: "250px",
        filterMatchMode: field.dataType === 1 ? "equals" : "contains",
        body: (row: any) => {
          const val = row[field.fieldName];
          return val !== null && val !== undefined && val !== "" ? val : "-";
        },
      });
    });

    return defs;
  }, [showProductDetails, uniqueCustomFields, title, MobileFlag]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("dispatch_report", baseColumnDefs);

  // Export-only fields: not shown as table columns (contact name/phone are merged
  // into one column on-screen), but kept separate in exports for clarity.
  const EXTRA_EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "to_customer_phone", label: "Customer Phone" },
  ];

  const getExportCellValue = (col: { key: string }, item: any): string => {
    switch (col.key) {
      case "cart_number":
        return `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`;
      case "to_customer_name":
        return `${item.to_customer_company_name || ""}(${item.to_customer_name || "-"})`;
      case "cart_status":
        return item.cart_status !== undefined ? item.cart_status : "-";
      case "created_date_time":
        return formatDateTime(item.created_date_time);
      case "update_Date_time":
        return formatDateTime(item.update_Date_time);
      case "to_customer_phone":
        return item.to_customer_phone || "-";
      case "items":
        return (
          item.items
            ?.map((i: any) => {
              const name = i.item_product_name || "";
              const code = i.item_product_code || "";
              const product = code ? `${name} (${code})` : name;
              return `${product} | ${i.item_qty} | ${i.item_rate}`;
            })
            .join("\n") || "-"
        );
      default:
        return item[col.key] ?? "-";
    }
  };

  const exportColumns = [
    ...visibleColumns.map((col) => ({ title: col.label, dataKey: col.key })),
    ...EXTRA_EXPORT_COLUMNS.map((col) => ({ title: col.label, dataKey: col.key })),
  ];

  const handelChangeShowModelDispatch = (item: IUserList) => {
    if (canEditDispatch) {
      setContactInfoOrder(item);
      setIsOrderShowFromContactType(9);
      setIsOrderCreateFromContactShow(true);
      onCartModelOpenChange?.(true);
    } else if (!canEditDispatch) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
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
        rowData[col.key] = getExportCellValue(col, item);
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
    return fetchDispatchReportForExport(
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
      filters.checkedGstOptions,
      filters.selectedProductId,
      filters.selectedCategoryId,
    );
  };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const exportData = await exportAllDispatchData<IFlatCartItem>(
        fetchAccountOutstandingForExport,
        500,
      );

      if (!exportData.length) {
        toast.warn("No data to export");
        return;
      }

      const excelRows = (
        selectedCustomers.length > 0 ? selectedCustomers : exportData
      ).map((item) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        EXTRA_EXPORT_COLUMNS.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        return row;
      });

      const ws = xlsx.utils.json_to_sheet(excelRows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Dispatch Report");

      const buffer = xlsx.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `dispatch_report_${Date.now()}.xlsx`,
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
              .map((col) => {
                if (col.key === "items") {
                  return `
                    <td>
                      <table style="width:100%; border-collapse: collapse; border:1px solid #ccc; table-layout:auto;">
                        <tr>
                          <th style="border:1px solid #ccc;">Product</th>
                          <th style="border:1px solid #ccc;">Qty</th>
                          <th style="border:1px solid #ccc;">Rate</th>
                        </tr>
                        ${item.items
                      ?.map((i: any) => {
                        const name = i.item_product_name || "";
                        const code = i.item_product_code || "";

                        return `
                              <tr>
                                <td style="border:1px solid #ccc;">
                                  ${code ? `${name} (${code})` : name}
                                </td>
                                <td style="border:1px solid #ccc; text-align:right;">
                                  ${i.item_qty}
                                </td>
                                <td style="border:1px solid #ccc; text-align:right;">
                                  ${i.item_rate}
                                </td>
                              </tr>
                            `;
                      })
                      .join("") || `<tr><td colspan="2">-</td></tr>`
                    }
                      </table>
                    </td>
                  `;
                }
                return `<td>${getExportCellValue(col, item)}</td>`;
              })
              .join("")}
                  ${EXTRA_EXPORT_COLUMNS
              .map((col) => `<td>${getExportCellValue(col, item)}</td>`)
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
          All {title}
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
    <PrimeReactProvider>
      <>
        <div>
          <div
            className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
          >
            <h3
              style={{
                fontSize: "20px",
                paddingLeft: MobileFlag ? "10px" : "",
              }}
              className="dash-board-text-count"
            >
              All {title}
            </h3>

            {/* <h3>{MobileFlag}</h3> */}
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
                <Button
                  icon="pi pi-plus"
                  className="report_button"
                  style={{ backgroundColor: "rgb(245, 134, 52)" }}
                  rounded
                  onClick={() => {
                    if (canAddDispatch) {
                      fetchContact(setContactData);
                      setIsOrderShow(true);
                    } else {
                      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    }
                  }}
                  tooltip={`Add ${title}`}
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
                      <i
                        className="pi pi-print"
                        style={{ marginRight: "4px" }}
                      />
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
                        <i
                          className="pi pi-box"
                          style={{ marginRight: "4px" }}
                        />

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
                        pointerEvents:
                          selectedIds.length === 0 ? "none" : "auto",
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
                    {canDelDispatch && (
                      <li
                        className="listItem text-start"
                        role="button"
                        onClick={() => {
                          setIsExportDropdownOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        style={{
                          color: "#dc2626",
                          opacity: selectedIds.length === 0 ? 0.7 : 1,
                          cursor:
                            selectedIds.length === 0
                              ? "not-allowed"
                              : "pointer",
                          pointerEvents:
                            selectedIds.length === 0 ? "none" : "auto",
                          marginBottom: "4px",
                        }}
                      >
                        <i
                          className="pi pi-trash"
                          style={{ marginRight: "4px" }}
                        />
                        Delete Selected
                      </li>
                    )}
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
                itemSize: 52,
                lazy: true,
                onLazyLoad: (event: { first: number; last: number }) => {
                  if (
                    event.last >= customers.length - 1 &&
                    hasMore &&
                    !loading
                  ) {
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
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <Button
                          icon="pi pi-cog"
                          className="p-button-text source-of-type-list-grid-options"
                          style={{
                            color: "green",
                            width: "2rem",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowData(rowData);
                            op.current?.show(e, e.currentTarget);
                          }}
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
                    fontSize: "14px",
                  }}
                  bodyStyle={{ fontSize: "14px" }}
                  body={col.body}
                />
              ))}
            </DataTable>
            <OverlayPanel ref={op} appendTo="self" dismissable closeOnEscape>
              {activeRowData && (
                <CommonOrderActions
                  item={{
                    ...activeRowData,
                    type: 9,
                  }}
                  contactData={{
                    ...activeRowData,
                    id: activeRowData.to_customer_id,
                  }}
                  isOrderShowNum={9}
                />
              )}
            </OverlayPanel>
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
          {isOrderShow && (
            <OrderCreateModal
              show={isOrderShow}
              onHide={() => setIsOrderShow(false)}
              handleSubmit={() => setIsOrderShow(true)}
              title={"Create"}
              message={"Please Enter Your Order Details"}
              btn1={"CANCEL"}
              btn2={"Approve"}
              Contact={contactData}
              isOrderShowNum={9}
              flag={"quick"}
              // orderId={contactData?.id}
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
              filtersToShow={[1, 4, 5, 7, 15, 18, 22]}
              pageId={1}
              stageandStatusOrderType={7}
              filtershowSeriesOrderType={"dispatch_prefix"}
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
              initialCheckedGSTTypes={filters.checkedGstOptions}
              initialStartSearchDate={filters.startSearchDate}
              initialEndSearchDate={filters.endSearchDate}
              initialCheckedOptionsStageStatus={
                filters.checkedOptionsStageStatus
              }
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
          <MultipleDeletePopUp
            show={isDeleteModalOpen}
            onHide={() => setIsDeleteModalOpen(false)}
            onSuccess={() => {
              setSelectedCustomers([]);
              setSelectAll(false);
              setRefreshReport(true);
            }}
            selectedIds={selectedIds}
            cartType={9}
            title={title}
          />
        </div>
      </>
    </PrimeReactProvider>
  );
};

export default TeamDispatchDataReportsView;
