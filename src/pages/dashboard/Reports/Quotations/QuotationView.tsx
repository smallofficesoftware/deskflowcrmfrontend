import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableFilterMeta,
  type SortOrder,
} from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import OrderCreateModal from "../../../../components/model/OrderCreateModel/OrderCreateModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import useMiracleFlagStore from "../../../../store/miracle/useMiracleFlagStore";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { IUserList } from "../../../left-side/LeftSideController";
import { fetchOrderByIdApi, syncMiracleInvoice } from "../../../right-side/list-order/ListOrderController";
import { fetchContact } from "../../../right-side/RightViewController";
import CommonOrderActions from "../CommonOrderActions";
import MultipleDeletePopUp from "../MultipleDeletePopUp";
import {
  fetchCartReport,
  fetchQuotationPdfmeTemplates,
  generateAndPrintQuotationPdf,
  IFlatCartItem,
  isPdfmeEnabledForQuotation,
  openPrint,
} from "./QuotationController";

// Generate Multi Print's pdfme path holds every selected order's PDF
// parsed in memory at merge time (PDFMerger) - keep this bounded rather
// than letting a "select all" of hundreds of rows through.
const MAX_MULTI_PRINT_COUNT = 25;

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

const TeamQuotationDataReportsView = ({
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
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] =
    useState<string>("");
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const currentOffset = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingMore = useRef(false);
  const PAGE_SIZE = 50;
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [isOrderShow, setIsOrderShow] = useState(false);
  const [contactData, setContactData] = useState<IUserList | undefined>();
  const [actionType, setActionType] = useState<string>("");
  const selectedIds = useMemo(() => {
    return selectedCustomers.map((item: IFlatCartItem) => item.id);
  }, [selectedCustomers]);

  // pdfme single-print picker - same shape as ListOrderView.tsx's
  // printTemplateChoices/pendingPrintCartId/printWithTemplate. Only used
  // when exactly one row is selected; multi-select stays on the legacy
  // openPrint(ids.join(","), viewFormate) path.
  const [printTemplateChoices, setPrintTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [pendingPrintCartId, setPendingPrintCartId] = useState<
    number | number[] | null
  >(null);
  // No print action in this file ever showed a loading state, even for a
  // single row - harmless when it's one fast request, but multi-print's
  // server round trip (generate N PDFs + merge) is long enough that
  // clicking it with no feedback looks broken. Scoped to just this action,
  // not reusing the table's own `loading` state.
  const [isMultiPrintLoading, setIsMultiPrintLoading] = useState(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("quotation");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const op = useRef<OverlayPanel>(null);
  const [activeRowData, setActiveRowData] = useState<any>(null);
  const [editOrView, setEditOrView] = useState<string>("");
  const [isEditOrderShow, setIsEditOrderShow] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState<any>(null);
  const [orderById, setOrderById] = useState<any>();
  const [isOrderShowNum1, setIsOrderShowNum1] = useState(0);
  const [isConvetIntoOrderConfirmation, setIsConvetIntoOrderConfirmation] =
    useState(false);
  const [converCartId, setConverCartId] = useState(0);
  const [convertCartNumber, setConvertCartNumber] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSyncConfirmationOpen, setIsSyncConfirmationOpen] = useState(false);

  // const handleClickOutside = (event: MouseEvent) => {
  //   const target = event.target as HTMLElement;

  //   const clickedOnButton = target.closest('.source-of-type-list-grid-options');
  //   if (clickedOnButton) return;

  //   setIsExportDropdownOpen(false);
  // };

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

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

    setFilters("quotation", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };
  const reportSelectedDates = useMemo(() => {
    return [filters.startSearchDate, filters.endSearchDate].filter(Boolean);
  }, [filters.startSearchDate, filters.endSearchDate]);

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

      setFilters("quotation", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const flattenCartData = (cartData: any): IFlatCartItem[] => {
    if (!cartData || !Array.isArray(cartData.item)) return [];
    return cartData.item.map((item: any) => ({
      id: item.id,
      srno: item.srno,
      username: item.username,
      type: title || "Quotation",
      cart_number: item.cart_number || item.reference_no || `Q-${item.srno}`,
      created_date_time: item.created_date_time,
      update_Date_time: item.update_Date_time || item.approve_date_time,
      cart_status: item.statusDetails?.name || item.cart_status,
      status_colour: item.statusDetails?.color || "#cccccc",
      to_customer_name: item.to_customer_name || item.customer_name,
      to_customer_company_name:
        item.to_customer_company_name || item.customer_company_name,
      to_customer_phone: item.to_customer_phone || item.customer_phone,
      taxable_amt: item.taxable_amt,
      gst_amt: item.gst_amt,
      tcs_amt: item.tcs_amt,
      round_off: item.round_off,
      is_approve: item.is_approve,
      grand_total: item.grand_total,
      customForm: item.customForm || [],
      ...item,
    }));
  };

  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );

  const canAddOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.ADD,
  );
  const canAddQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.ADD,
  );

  const canShare = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.PRINT,
  );
  const canShareQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.SHARE,
  );
  const canPrintQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.PRINT,
  );
  const canEditQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.EDIT,
  );

  const canDelQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.DELETE,
  );

  // Initial + Filter Change Load

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

  // Refresh trigger
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

  const [lazyState, setLazyState] = useState<{
    sortField?: string | null;
    sortOrder?: SortOrder | null;
    filters: DataTableFilterMeta;
  }>({
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

  // Add dynamic custom field filters
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

  const handleHides = () => {
    setIsOrderCreateFromContactShow(false);
    onCartModelOpenChange?.(false);
  };

  useEscapeKey(() => {
    if (!isExportDropdownOpen && !activeRowData && !isOrderShow) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
      setActiveRowData(null);
      setIsOrderShow(false);
    }
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

  // Virtual Scroll Handler
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
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        filters.checkedOptionsStageStatus,
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
          const updated = [...prev];
          updated.splice(prev.length, 0, ...newData); // Append via splice on copy
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

  const onSelectionChange = (e: { value: any[] }) => {
    setSelectedCustomers(e.value);
    setSelectAll(e.value.length === filteredData.length);
  };

  const onSelectAllChange = (e: { checked: boolean }) => {
    if (e.checked) {
      setSelectedCustomers([...filteredData]);
      setSelectAll(true);
    } else {
      setSelectedCustomers([]);
      setSelectAll(false);
    }
  };

  const formatDateTime = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr === "-" || dateStr.includes("undefined"))
      return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return `${date.toLocaleDateString("en-IN")} - ${date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )}`;
  };

  type QuotationColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    headerClassName?: string;
    sortableCol?: boolean;
    filterCol?: boolean;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: QuotationColumnDef[] = useMemo(() => {
    const defs: QuotationColumnDef[] = [];

    if (showProductDetails) {
      defs.push({
        key: "items",
        label: "Product Details",
        header: <span>Product Details</span>,
        width: "250px",
        headerClassName: "center-header",
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
        },
      });
    }

    defs.push(
      {
        key: "cart_number",
        label: `${title} Number`,
        header: `${title} Number`.replace(/ /g, "\n"),
        width: "125px",
        headerClassName: "center-header",
        body: (row) => (
          <span
            style={{ cursor: "pointer" }}
            onClick={() => !MobileFlag && handelChangeShowModelQuotation(row)}
          >
            {row.cart_number || "# XXXXXXX"} <br />
            <span
              style={{
                backgroundColor: row.is_approve?.bg_color,
                border: `2px solid ${row.is_approve?.border_color}`,
                color: row.is_approve?.text_color,
                fontSize: "2px",
                padding: "1px 1px",
                fontWeight: "500",
              }}
              className="badge rounded-pill"
            >
              {row.is_approve?.name}
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
        width: "120px",
        headerClassName: "center-header",
        filterMatchMode: "custom",
        body: (row) => (
          <div>
            <div>
              {row.to_customer_company_name || "-"} (
              {row.to_customer_name || "-"})
            </div>
            <div>{row.to_customer_phone || "-"}</div>
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
        headerClassName: "center-header",
        body: (row) => row.username || "-",
      },
      {
        key: "cart_status",
        label: "Status",
        header: "Status",
        width: "90px",
        headerClassName: "center-header",
        body: (row) => (
          <span
            className="badge rounded-pill"
            style={{ backgroundColor: row.status_colour || "#eeeeee" }}
          >
            {row.cart_status}
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
        headerClassName: "center-header",
        body: (row) => formatDateTime(row.created_date_time),
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
        headerClassName: "center-header",
        body: (row) => formatDateTime(row.update_Date_time),
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
        headerClassName: "center-header",
        body: (row) => row.taxable_amt || "0",
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
        headerClassName: "center-header",
        body: (row) => row.gst_amt || "0",
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
        headerClassName: "center-header",
        body: (row) => row.tcs_amt || "0",
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
        headerClassName: "center-header",
        body: (row) => row.round_off || "0",
      },
      {
        key: "grand_total",
        label: "Grand Total",
        header: (
          <span>
            Grand <br /> Total
          </span>
        ),
        width: "90px",
        headerClassName: "center-header",
        body: (row) => row.grand_total || "0",
      },
    );

    uniqueCustomFields.forEach((field: any) => {
      defs.push({
        key: field.fieldName,
        label: field.fieldLabel,
        header: field.fieldLabel.replace(/ /g, "\n"),
        width: field.dataType === 3 ? "250px" : "150px",
        filterMatchMode: field.dataType === 1 ? "equals" : "contains",
        body: (row) => {
          const val = row[field.fieldName];
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
  }, [showProductDetails, title, MobileFlag, uniqueCustomFields]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("quotation_report", baseColumnDefs);

  const getExportCellValue = (
    col: QuotationColumnDef,
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
              return `${product} | ${i.item_qty} | ${i.item_rate}`;
            })
            .join("\n") || "-"
        );
      case "cart_number":
        return `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`;
      case "to_customer_name":
        return `${item.to_customer_company_name || "-"} (${item.to_customer_name || "-"}) - ${item.to_customer_phone || "-"}`;
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
      default: {
        const val = item[col.key];
        return val !== null && val !== undefined && val !== "" ? val : "-";
      }
    }
  };

  const handelChangeShowModelQuotation = (item: IUserList) => {
    if (!canEditQuotation) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    setContactInfoOrder(item);
    setIsOrderShowFromContactType(1);
    setIsOrderCreateFromContactShow(true);
    onCartModelOpenChange?.(true);
  };

  // Export functions remain same (PDF, Excel, Print)
  // ... (keep your existing exportPdf, exportExcel, printTable functions unchanged)
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
                        `<td>${getExportCellValue(col, item).replace(/\n/g, "<br/>")}</td>`,
                    )
                    .join("")}
                </tr>
              `,
        )
        .join("")}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background-color: #f2f2f2;">
              ${showProductDetails ? `<td></td>` : ""}
              <td>Total</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.taxable_amt_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}</td>
              <td>${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.gst_amt_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}</td>
              <td>${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.tcs_amt_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}</td>
              <td>${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.round_off_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}</td>
              <td>${dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.grand_total_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2)}</td>
              ${uniqueCustomFields.map(() => `<td></td>`).join("")}
            </tr>
          </tfoot>
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
          className="dash-board-text-count"
          style={{ fontSize: "20px", paddingLeft: "12px" }}
        >
          {title} Report
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

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
        rowData[col.label] = getExportCellValue(col, item);
      });
      return rowData;
    });

    const totalsRow = {
      ...(showProductDetails && { product_details: "" }),
      cart_number: "Total",
      to_customer_name: "",
      to_customer_phone: "",
      username: "",
      cart_status: "",
      created_date_time: "",
      update_Date_time: "",
      taxable_amt: dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.taxable_amt_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2),
      gst_amt: dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.gst_amt_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2),
      tcs_amt: dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.tcs_amt_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2),
      round_off: dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.round_off_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2),
      grand_total: dataToExport.reduce((sum: number, item: any) => sum + (parseFloat(String(item.grand_total_wo_c).replace(/[^0-9.-]+/g, "")) || 0), 0).toFixed(2),
    };
    tableData.push(totalsRow as any);

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`${title}_report_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.label,
    }));

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
      didParseCell: (data: any) => {
        if (
          data.row.index === tableData.length - 1 &&
          data.row.section === "body"
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`${title}_report_${new Date().getTime()}.pdf`);
  };
  // const exportExcel = () => {
  //   const isFilterApplied = Object.values(lazyState.filters).some(
  //     (filter) =>
  //       "value" in filter && filter.value !== null && filter.value !== "",
  //   );

  //   const dataToExport =
  //     selectedCustomers.length > 0
  //       ? selectedCustomers
  //       : isFilterApplied
  //         ? customers
  //         : filteredData;

  //   const exportData = dataToExport.map((item) => {
  //     const rowData: any = {
  //       quotation_number: item.cart_number || "XXXXXXX",
  //       customer_name:
  //         `${item.to_customer_company_name}(${item.to_customer_name})` || "-",
  //       customer_phone: item.to_customer_phone || "-",
  //       created_by: item.username || "-",
  //       type: item.type || "-",
  //       cart_status: item.cart_status !== undefined ? item.cart_status : "-",
  //       created_date_time: formatDateTime(item.created_date_time),
  //       update_Date_time: formatDateTime(item.update_Date_time),
  //       grand_total:
  //         item.grand_total !== undefined ? ` ${item.grand_total}` : "-",
  //     };
  //     uniqueCustomFields.forEach((field: any) => {
  //       rowData[field.fieldName] = item[field.fieldName] || "-";
  //     });
  //     return rowData;
  //   });

  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [
  //     { wpx: 150 },
  //     { wpx: 100 },
  //     { wpx: 120 },
  //     { wpx: 100 },
  //     { wpx: 80 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 100 },
  //     ...uniqueCustomFields.map(() => ({ wpx: 150 })),
  //   ];
  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "team_cart_report");
  // };

  const handleMultiPrint = async () => {
    if (selectedIds.length === 0) return;

    // Generate Multi Print's pdfme path generates each order's PDF
    // sequentially then holds all of them parsed in memory at merge time
    // (PDFMerger.add) - fine for a handful, but nothing stops a "select
    // all" of hundreds of rows otherwise. Cap it before doing any work.
    if (selectedIds.length > MAX_MULTI_PRINT_COUNT) {
      toast.error(
        `Please select at most ${MAX_MULTI_PRINT_COUNT} orders for Generate Multi Print.`,
      );
      return;
    }

    // pdfme now covers any selection size: a single id prints that one
    // order, 2+ ids get merged into one PDF server-side (pdfOrder's
    // dispatcher + PDFMerger) - one print job either way. Only falls
    // through to the legacy comma-joined print when pdfme itself is off.
    const cartIdOrIds = selectedIds.length === 1 ? selectedIds[0] : selectedIds;
    setIsMultiPrintLoading(true);
    try {
      const pdfmeOn = await isPdfmeEnabledForQuotation();
      if (pdfmeOn) {
        const choices = await fetchQuotationPdfmeTemplates();
        if (choices.length > 1) {
          // Hands off to the "Choose Template" modal - stop showing our own
          // loading state here, the modal itself is the next feedback.
          setPrintTemplateChoices(choices);
          setPendingPrintCartId(cartIdOrIds);
          return;
        }
        await generateAndPrintQuotationPdf(cartIdOrIds);
        return;
      }

      openPrint(selectedIds.join(","), viewFormate);
    } finally {
      setIsMultiPrintLoading(false);
    }
  };

  const printWithTemplate = async (templateId: number) => {
    setPrintTemplateChoices([]);
    const cartIdOrIds = pendingPrintCartId;
    setPendingPrintCartId(null);
    if (cartIdOrIds == null) return;

    setIsMultiPrintLoading(true);
    try {
      await generateAndPrintQuotationPdf(cartIdOrIds, templateId);
    } finally {
      setIsMultiPrintLoading(false);
    }
  };

  const handleSyncWithMiracle = () => {
    if (selectedIds.length === 0) return;
    syncMiracleInvoice(selectedIds.join(","));
  };

  const handelChangeEdit = (id: number, cartNumber: string, type: number) => {
    setEditOrView(
      (cartNumber && (type === 1 || type === 2 || type === 5 || type === 3)) ||
        !cartNumber
        ? "Edit/View"
        : "View",
    );

    setIsEditOrderShow(true);
    fetchOrderByIdApi(id, setLoading, setOrderById, setIsOrderShowNum1);
    setOrderDropdownOpen(null);
  };

  const handleModalConvertIntoOrder = (id: number, number: string) => {
    if (canAddOrder) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvetIntoOrderConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvetIntoOrderConfirmation(false);
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  return (
    <PrimeReactProvider>
      <>
        <div>
          <div
            className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
          >
            <h3
              className="dash-board-text-count"
              style={{
                fontSize: "20px",
                paddingLeft: MobileFlag ? "10px" : "",
              }}
            >
              All {title}
            </h3>

            {/* {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && ( */}
            <div
              className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
              style={{
                position: "relative",
                paddingLeft: MobileFlag ? "10px" : "",
              }}
            >
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

                    if (value === "sync") {
                      setIsSyncConfirmationOpen(true);
                    }

                    if (value === "multiPrint") {
                      handleMultiPrint();
                    }
                  }}
                  style={{ padding: "6px", borderRadius: "5px" }}
                >
                  <option value="">Select Action</option>
                  {isFeatureEnabled && (
                    <option value="sync" disabled={selectedIds.length === 0}>
                      Sync with Miracle
                    </option>
                  )}

                  <option
                    value="multiPrint"
                    disabled={selectedIds.length === 0 || isMultiPrintLoading}
                  >
                    {isMultiPrintLoading ? "Generating..." : "Generate Multi Print"}
                  </option>
                </select>
              )}
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
                    if (canAddQuo) {
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
                    top: "0",
                    zIndex: 1000,
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                  }}
                >
                  <ExportExcelMenuItem
                    reportType="quotation_report"
                    filters={{
                      selectedDates: filters.selectedDateArray,
                      selectedTeamMembers: filters.checkedOptionsUser,
                      selectedStageStatus: filters.checkedOptionsStageStatus,
                      selectedSeries: filters.checkedOptionsSeries,
                      globalSearch: debouncedSearchText,
                      selectedContactId: filters.selectedContactId,
                      selectedGstOptions: filters.checkedGstOptions,
                      selectedProduct: filters.selectedProductId,
                      selectedCategory: filters.selectedCategoryId,
                    }}
                    columns={visibleColumns}
                    fileName="Quotation_Report"
                    canShare={canShare}
                    disabled={customers.length === 0}
                    onSelect={() => setIsExportDropdownOpen(false)}
                    selectedRows={selectedCustomers.map((item) => ({
                      ...item,
                      cart_number: `${item.cart_number || "XXXXXXX"} (${item.is_approve?.name || "-"})`,
                      to_customer_name: `${item.to_customer_company_name || "-"} (${item.to_customer_name || "-"}) - ${item.to_customer_phone || "-"}`,
                    }))}
                    footer={{
                      sums: [
                        { outputKey: "taxable_amt", sourceKey: "taxable_amt_wo_c" },
                        { outputKey: "gst_amt", sourceKey: "gst_amt_wo_c" },
                        { outputKey: "tcs_amt", sourceKey: "tcs_amt_wo_c" },
                        { outputKey: "round_off", sourceKey: "round_off_wo_c" },
                        { outputKey: "grand_total", sourceKey: "grand_total_wo_c" },
                      ],
                      rows: [
                        {
                          cart_number: "Total",
                          taxable_amt: { fromSum: "taxable_amt" },
                          gst_amt: { fromSum: "gst_amt" },
                          tcs_amt: { fromSum: "tcs_amt" },
                          round_off: { fromSum: "round_off" },
                          grand_total: { fromSum: "grand_total" },
                        },
                      ],
                    }}
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
                      if (selectedIds.length === 0 || isMultiPrintLoading) return;

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
                        className={isMultiPrintLoading ? "pi pi-spin pi-spinner" : "pi pi-copy"}
                        style={{ marginRight: "4px" }}
                      />

                      <span style={{ marginRight: "auto" }}>
                        {isMultiPrintLoading ? "Generating..." : "Generate Multi Print"}
                      </span>
                    </div>
                  </li>
                  {canDelQuotation && (
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
                          selectedIds.length === 0 ? "not-allowed" : "pointer",
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
              display: "block",
              flexDirection: "column",
            }}
          >
            <DataTable
              ref={dt}
              value={customers}
              // lazy
              scrollable
              resizableColumns
              columnResizeMode="fit"
              className="custom-centered-table"
              scrollHeight="80vh"
              virtualScrollerOptions={{
                itemSize: 52, // Adjust based on your row height
                lazy: true,
                // onLazyLoad: onVirtualScroll,
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
                showLoader: true,
                delay: 0,
              }}
              // dataKey="id"
              filterDisplay="row"
              // onFilter={onFilter}
              filters={lazyState.filters}
              // onSort={onSort}
              sortField={lazyState.sortField ?? undefined}
              sortOrder={lazyState.sortOrder ?? undefined}
              loading={loading}
              selection={selectedCustomers}
              onSelectionChange={onSelectionChange}
              selectAll={selectAll}
              onSelectAllChange={onSelectAllChange}
              selectionMode="multiple"
              tableStyle={{ tableLayout: "fixed", width: "100%" }}
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
              {!MobileFlag && (
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem" }}
                  bodyStyle={{ textAlign: "center" }}
                />
              )}

              {!MobileFlag && (
                <Column
                  field="actions"
                  header="Actions"
                  headerStyle={{ width: "90px", textAlign: "center" }}
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
                  bodyStyle={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
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
                  headerClassName={col.headerClassName}
                  headerStyle={{
                    width: col.width || "150px",
                    whiteSpace:
                      typeof col.header === "string" ? "pre-wrap" : undefined,
                  }}
                  bodyStyle={{
                    textAlign: [
                      "taxable_amt",
                      "gst_amt",
                      "tcs_amt",
                      "round_off",
                      "grand_total",
                    ].includes(col.key)
                      ? "right"
                      : undefined,
                    fontSize: col.key === "items" ? "14px" : undefined,
                  }}
                  body={col.body}
                />
              ))}
            </DataTable>

            <OverlayPanel ref={op} appendTo="self" dismissable closeOnEscape>
              {activeRowData && (
                <CommonOrderActions
                  item={{
                    ...activeRowData,
                    type: 1,
                  }}
                  contactData={{
                    ...activeRowData,
                    id: activeRowData.to_customer_id,
                  }}
                  isOrderShowNum={1}
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
              title="Edit/View"
              message="Please Enter Your Order Details"
              btn1="CANCEL"
              btn2="Approve"
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
              onConversionSuccess={() => {
                setIsOrderShow(false);
                setRefreshReport(true);
              }}
              title={"Create"}
              message={"Please Enter Your Order Details"}
              btn1={"CANCEL"}
              btn2={"Approve"}
              Contact={contactData}
              isOrderShowNum={1}
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
              stageandStatusOrderType={3}
              filtershowSeriesOrderType={"quotation_prefix"}
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
            cartType={1}
            title={title}
          />
          {isSyncConfirmationOpen && (
            <ConfirmationModal
              show={isSyncConfirmationOpen}
              onHide={() => {
                setIsSyncConfirmationOpen(false);
                setActionType("");
              }}
              handleSubmit={() => {
                setIsSyncConfirmationOpen(false);
                setActionType("");
                handleSyncWithMiracle();
              }}
              title="Sync with Miracle Confirmation"
              message="Are you sure you want to sync selected records with Miracle?"
              btn1="CANCEL"
              btn2="SYNC"
            />
          )}
          {printTemplateChoices.length > 0 && (
            <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
              <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5>Choose Template</h5>
                  <span
                    className="close"
                    onClick={() => {
                      setPrintTemplateChoices([]);
                      setPendingPrintCartId(null);
                    }}
                  >
                    &times;
                  </span>
                </div>
                {printTemplateChoices.map((t) => (
                  <div
                    key={t.id}
                    className="d-flex justify-content-between align-items-center border-bottom py-2"
                  >
                    <div>{t.template_name}{t.is_default ? " ★" : ""}</div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => printWithTemplate(t.id)}
                    >
                      Print
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    </PrimeReactProvider>
  );
};

export default TeamQuotationDataReportsView;
