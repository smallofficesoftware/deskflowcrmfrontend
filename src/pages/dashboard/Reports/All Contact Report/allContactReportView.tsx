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
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { AppContext } from "../../../../common/AppContext";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ImportExcelForContactModal from "../../../../components/model/ImportExcelForContactModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import CreateContactView from "../../../left-side/create-contact/CreateContactView";
import {
  fetchDataUser,
  IUserList,
} from "../../../left-side/LeftSideController";
import RightView from "../../../right-side/RightView";
import {
  fetchAllcontact,
  fetchAllContactsForExport,
  IAllcontact,
} from "./allContactReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropallcontactReports {
  selectedDates?: Date[];
  setActive?: string | undefined;
  setActiveDay?: number | undefined;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedLabels?: string[] | null;
  selectedSourceTypes?: string[] | null;
  selectedStageStatus?: string[] | null;
  selectedTeamMembers?: string[] | null;
  selectedDemography?: string[] | null;
  globalSearch?: string;
  selectedProductSearchId?: string;
  setSelectOrderType?: string | undefined;
  assignedByMultiTeamMember?: any[];
  createdByMultiTeamMember?: any[];
  fromSideView?: boolean;
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

const AllcontactReport = ({
  selectedDates,
  setActive,
  setActiveDay,
  MobileToken,
  getID,
  MobileFlag,
  selectedLabels,
  selectedSourceTypes,
  selectedStageStatus,
  selectedTeamMembers,
  selectedDemography,
  globalSearch,
  selectedProductSearchId,
  setSelectOrderType,
  fromSideView = false,
  onHide,
}: IPropallcontactReports) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<IAllcontact[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<IAllcontact[]>([]);
  const [hasMore, setHasMore] = useState(true);
  // console.log("selectedProductSearchId",selectedProductSearchId);
  // console.log("setSelectOrderType",setSelectOrderType);
  // console.log("setActive",setActive);

  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);

  const [isCreateContact, setIsCreateContact] = useState(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("all_contact_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isModalExcelVisible, setIsModalExcelVisible] =
    useState<boolean>(false);
  const [refreshContact, setRefreshContact] = useState(false);
  const [isArchivState, setIsArchivState] = useState<boolean>(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const [user, setUser] = useState<IUserList[]>([]);
  const [noDataFound, setNoDataFound] = useState(false);
  const [contactId, setContactId] = useState<number>();
  const [selectedLabelIds, setSelectedLabelIds] = useState<string | undefined>(
    "",
  );
  const [isRefers, setIsRefers] = useState(true);
  const [refreshContacts, setRefreshContacts] = useState(true);
  const [editorContentToEdit, setEditorContentToEdit] = useState<string>("");
  const [noDataFound1, setNoDataFound1] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [resetRightSideTrigger, setResetRightSideTrigger] = useState(0);
  const [searchTermFromRightSide, setSearchTermFromRightSide] =
    useState<string>("");
  const [idFromRightSide, setIdFromRightSide] = useState<number>(0);

  const token = localStorage.getItem("token");
  const localId = localStorage.getItem("UUID");

  const { showRightSide, setShowRightSide, setCheckToken } =
    useContext(AppContext)!;

  // const handleLogout = async (e?: React.MouseEvent) => {
  //   if (e) e.preventDefault();
  //   if (isLoggingOut) return;
  //   setIsLoggingOut(true);
  //   const result = await logOutApi(setIsCloseConfirmation);
  //   setIsLoggingOut(false);
  //   if (result.success) {
  //     localStorage.clear();
  //     handleRefresh();
  //   } else {
  //     toast.error(result.message || "Logout failed");
  //   }
  // };

  // useEffect(() => {
  //   if (noDataFound1) {
  //     handleLogout();
  //   }
  // }, [noDataFound1]);

  useEscapeKey(() => {
    if (
      !isCreateContact &&
      !isModalFilterVisible &&
      !isExportDropdownOpen &&
      !showRightSide &&
      !openDropdownId
    ) {
      onHide?.();
    } else {
      setIsCreateContact(false);
      setIsModalFilterVisible(false);
      setIsExportDropdownOpen(false);
      setShowRightSide(false);
      // Hide all via DOM
      Object.values(dropdownContactRef.current).forEach((el) => {
        if (el) el.style.display = "none";
      });
      setOpenDropdownId(null);
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
      checkedOptions: data.checkedOptionsLabel || [],
      checkedSourceTypes: data.checkedOptionsSourceType || [],
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("all_contact_report", updatedFilters);

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

      setFilters("all_contact_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [
          startDate,
          endDate,
        ],
      });
    }
  }, []);

  const canAdd = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.ADD);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.PRINT,
  );
  const canImport = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.IMPORT,
  );

  const canViewMsg = useCheckUserPermission(
    PAGE_ID.CONTACT_MESSAGE_HISTORY,
    PERMISSION_TYPE.VIEW,
  );

  // const handleClickOutside = (event: MouseEvent) => {
  //   const target = event.target as HTMLElement;
  //   setIsExportDropdownOpen(false);

  //   const clickedOnButton = target.closest('.source-of-type-list-grid-options');
  //   if (clickedOnButton) return;

  //   const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
  //     (ref) => ref && ref.contains(target)
  //   );

  //   if (!clickedInsideDropdown) {
  //     // Hide all via DOM
  //     Object.values(dropdownContactRef.current).forEach((el) => {
  //       if (el) el.style.display = "none";
  //     });
  //     setOpenDropdownId(null);
  //   }
  // };

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  // useEffect(() => {
  //   const handleEscKey = (event: KeyboardEvent) => {
  //     if (event.key === "Escape") {
  //       // Hide all via DOM
  //       Object.values(dropdownContactRef.current).forEach((el) => {
  //         if (el) el.style.display = "none";
  //       });
  //       setOpenDropdownId(null);
  //     }
  //   };

  //   document.addEventListener("keydown", handleEscKey);

  //   return () => {
  //     document.removeEventListener("keydown", handleEscKey);
  //   };
  // }, []);

  const actionBodyTemplate = useCallback(
    (rowData: any) => {
      return (
        <div
          className="gap-2"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <>
            <Button
              icon="pi pi-cog"
              className="p-button-text source-of-type-list-grid-options"
              style={{ color: "green", width: "2rem" }}
              onClick={(e) => {
                e.stopPropagation();

                // 1. Check live DOM to bypass Virtual Scroller stale closures
                const currentDropdown = dropdownContactRef.current[rowData.id];
                const isCurrentlyOpen =
                  currentDropdown?.style.display === "block";

                // 2. Hide ALL dropdowns first
                Object.values(dropdownContactRef.current).forEach((el) => {
                  if (el) el.style.display = "none";
                });

                // 3. If it wasn't open, open it now
                if (currentDropdown && !isCurrentlyOpen) {
                  currentDropdown.style.display = "block";
                  setOpenDropdownId(rowData.id);
                } else {
                  setOpenDropdownId(null);
                }
              }}
            />

            <ul
              ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
              style={{
                width: "150px",
                marginLeft: "180px",
                height: "auto",
                display: openDropdownId === rowData.id ? "block" : "none",
                position: "absolute",
                zIndex: 9999,
                background: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                borderRadius: "6px",
                padding: "5px 0",
                listStyle: "none",
              }}
            >
              <li
                className="listItem"
                role="button"
                onClick={(e) => {
                  e.stopPropagation();

                  // 1. Force close the dropdown menu via DOM immediately
                  const currentDropdown =
                    dropdownContactRef.current[rowData.id];
                  if (currentDropdown) {
                    currentDropdown.style.display = "none";
                  }

                  // 2. Clear the state tracking the open dropdown
                  setOpenDropdownId(null);

                  // 3. Proceed to open the RightView
                  handleOpenWhatsAppChat(rowData.id);
                }}
                style={{
                  marginLeft: "10px",
                  height: "25px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Open WhatsApp Chat
              </li>
            </ul>
          </>
        </div>
      );
    },
    [openDropdownId],
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 50,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      person_name: { value: null, matchMode: "contains" },
      mobile_number: { value: null, matchMode: "contains" },
      company_name: { value: null, matchMode: "contains" },
      source_name: { value: null, matchMode: "contains" },
      lable_name: { value: null, matchMode: "contains" },
      status_name: { value: null, matchMode: "contains" },
      cart_number: { value: null, matchMode: "contains" },
      created_date_time: { value: null, matchMode: "contains" },
      created_by: { value: null, matchMode: "contains" },
      assigned_to: { value: null, matchMode: "contains" },
      grand_total: { value: null, matchMode: "equals" },
      country_name: { value: null, matchMode: "contains" },
      state_name: { value: null, matchMode: "contains" },
      city_name: { value: null, matchMode: "contains" },
      area_name: { value: null, matchMode: "contains" },
      address: { value: null, matchMode: "contains" },
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [showCartColumns, setShowCartColumns] = useState({
    cart_number: false,
    created_date_time: false,
    grand_total: false,
  });

  const dt = useRef<DataTable<IAllcontact[]>>(null);

  const getFilteredData = () => {
    let filteredData = [...customers];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;
          if (field === "lable_name" && typeof fieldValue === "string") {
            const labels = fieldValue
              .split(",")
              .map((l) => l.trim().toLowerCase());
            return labels.some((label) =>
              matchMode === "contains"
                ? label.includes(filterValue)
                : matchMode === "equals"
                  ? label === filterValue
                  : true,
            );
          }

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

  const searchDependencies = JSON.stringify({
    selectedDates: filters.selectedDateArray,
    selectedLabels: filters.checkedOptions,
    selectedSourceTypes: filters.checkedSourceTypes,
    selectedStageStatus: filters.checkedOptionsStageStatus,
    selectedTeamMembers: filters.checkedOptionsUser,
    assignedByMultiTeamMember: filters.assignedByMultiTeamMember,
    createdByMultiTeamMember: filters.createdByMultiTeamMember,
    selectedDemography: selectedDemography
      ? Object.values(selectedDemography).filter(Boolean)
      : null,
    debouncedSearchText,
    selectedProductSearchId: filters.selectedProductSearchId,
    setSelectOrderType: filters.selectedOrderListId,
    leadAgingBucket: filters.leadAgingBucket,
    leadAgingActivityTypes: filters.leadAgingActivityTypes,
  });

  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    setHasMore(true);

    loadTasks(0, 50, true);
  }, [searchDependencies, isArchivState, refreshContacts]);

  const loadTasks = useCallback(
    async (offset: number, limit: number, reset: boolean = false) => {
      if (isLoadingMore.current) return;

      if (!hasMore && !reset) return;

      isLoadingMore.current = true;

      setLoading(true);

      try {
        const newData = await fetchAllcontact(
          filters.selectedDateArray,
          setActive,
          setActiveDay,
          MobileToken,
          getID,
          MobileFlag,
          filters.checkedOptions,
          filters.checkedSourceTypes,
          filters.checkedOptionsStageStatus,
          filters.checkedOptionsUser,
          selectedDemography
            ? Object.values(selectedDemography).filter(Boolean)
            : null,
          filters.selectedProductSearchId,
          filters.selectedOrderListId,
          offset,
          limit,
          debouncedSearchText,
          filters.assignedByMultiTeamMember,
          filters.createdByMultiTeamMember,
          isArchivState,
          filters.leadAgingBucket,
          filters.leadAgingActivityTypes,
        );

        if (newData.length < limit) {
          setHasMore(false);
        }

        if (reset) {
          setCustomers(newData);
        } else {
          setCustomers((prev) => {
            const merged = [...prev, ...newData];

            // duplicate protection
            return merged.filter(
              (item, index, self) =>
                index === self.findIndex((x) => x.id === item.id),
            );
          });
        }

        currentOffset.current = offset + newData.length;
      } catch (err) {
        console.error(err);

        setHasMore(false);
      } finally {
        setLoading(false);

        isLoadingMore.current = false;
      }
    },
    [
      filters.selectedDateArray,
      setActive,
      setActiveDay,
      MobileToken,
      getID,
      MobileFlag,
      filters.checkedOptions,
      filters.checkedSourceTypes,
      filters.checkedOptionsStageStatus,
      filters.checkedOptionsUser,
      selectedDemography
        ? Object.values(selectedDemography).filter(Boolean)
        : null,
      filters.selectedProductSearchId,
      filters.selectedOrderListId,
      debouncedSearchText,
      filters.leadAgingBucket,
      filters.leadAgingActivityTypes,
      hasMore,
    ],
  );

  const handleRefresh = async () => {
    currentOffset.current = 0;
    setHasMore(true);
    setCustomers([]);
    loadTasks(0, 50, true);
  };

  const dataArray: IAllcontact[] = useMemo(() => {
    return customers.map((item) => ({
      person_name: item.person_name || "-",
      mobile_number: item.mobile_number || "-",
      company_name: item.company_name || "-",
      country_name: item.country_name || "-",
      state_name: item.state_name || "-",
      city_name: item.city_name || "-",
      area_name: item.area_name || "-",
      source_name: item.source_name || "-",
      source_colour: item.source_colour || "-",
      lable_name: item.lable_name || "-",
      lable_colour: item.lable_colour || "-",
      status_name: item.status_name || "-",
      status_colour: item.status_colour || "-",
      cart_number: item.cart_number || "-",
      grand_total: item.grand_total || "-",
      address: item.address,
      longitude: item.longitude,
      latitude: item.latitude,
      created_date_time: item.created_date_time || "-",
      created_by: item.created_by || "-",
      assigned_to: item.assigned_to || "-",
      cntc_column_number_1: item.cntc_column_number_1,
      cntc_column_number_2: item.cntc_column_number_2,
      cntc_column_number_3: item.cntc_column_number_3,
      cntc_column_number_4: item.cntc_column_number_4,
      cntc_column_number_5: item.cntc_column_number_5,
      cntc_column_text_1: item.cntc_column_text_1,
      cntc_column_text_2: item.cntc_column_text_2,
      cntc_column_text_3: item.cntc_column_text_3,
      cntc_column_text_4: item.cntc_column_text_4,
      cntc_column_text_5: item.cntc_column_text_5,
      cntc_column_text_area_1: item.cntc_column_text_area_1,
      cntc_column_text_area_2: item.cntc_column_text_area_2,
      cntc_column_text_area_3: item.cntc_column_text_area_3,
      cntc_column_text_area_4: item.cntc_column_text_area_4,
      cntc_column_text_area_5: item.cntc_column_text_area_5,
      cntc_column_date_1: item.cntc_column_date_1,
      cntc_column_date_2: item.cntc_column_date_2,
      cntc_column_date_3: item.cntc_column_date_3,
      cntc_column_date_4: item.cntc_column_date_4,
      cntc_column_date_5: item.cntc_column_date_5,
      cntc_column_date_and_time_1: item.cntc_column_date_and_time_1,
      cntc_column_date_and_time_2: item.cntc_column_date_and_time_2,
      cntc_column_date_and_time_3: item.cntc_column_date_and_time_3,
      cntc_column_date_and_time_4: item.cntc_column_date_and_time_4,
      cntc_column_date_and_time_5: item.cntc_column_date_and_time_5,
      cntc_column_time_1: item.cntc_column_time_1,
      cntc_column_time_2: item.cntc_column_time_2,
      cntc_column_time_3: item.cntc_column_time_3,
      cntc_column_time_4: item.cntc_column_time_4,
      cntc_column_time_5: item.cntc_column_time_5,
      cntc_column_switch_1: item.cntc_column_switch_1,
      cntc_column_switch_2: item.cntc_column_switch_2,
      cntc_column_switch_3: item.cntc_column_switch_3,
      cntc_column_switch_4: item.cntc_column_switch_4,
      cntc_column_switch_5: item.cntc_column_switch_5,
      cntc_column_decimal_1: item.cntc_column_decimal_1,
      cntc_column_decimal_2: item.cntc_column_decimal_2,
      cntc_column_decimal_3: item.cntc_column_decimal_3,
      cntc_column_decimal_4: item.cntc_column_decimal_4,
      cntc_column_decimal_5: item.cntc_column_decimal_5,
      cntc_column_dropdown_1: item.cntc_column_dropdown_1,
      cntc_column_dropdown_2: item.cntc_column_dropdown_2,
      cntc_column_dropdown_3: item.cntc_column_dropdown_3,
      cntc_column_dropdown_4: item.cntc_column_dropdown_4,
      cntc_column_dropdown_5: item.cntc_column_dropdown_5,
      cntc_column_radio_1: item.cntc_column_radio_1,
      cntc_column_radio_2: item.cntc_column_radio_2,
      cntc_column_radio_3: item.cntc_column_radio_3,
      cntc_column_radio_4: item.cntc_column_radio_4,
      cntc_column_radio_5: item.cntc_column_radio_5,
      customForm: item.customForm,
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

  const isAllSelected = useMemo(() => {
    const filteredData = getFilteredData();
    return (
      filteredData.length > 0 &&
      selectedCustomers.length === filteredData.length
    );
  }, [selectedCustomers, lazyState.filters, dataArray]);

  // Dynamically update filters to include custom fields
  useEffect(() => {
    setLazyState((prev) => {
      const newFilters = { ...prev.filters };
      uniqueCustomFields.forEach((field) => {
        if (!(field.fieldName in newFilters)) {
          newFilters[field.fieldName] = {
            value: null,
            matchMode:
              field.dataType === 1 || field.dataType === 7
                ? "equals"
                : "contains",
          };
        }
      });
      return { ...prev, filters: newFilters };
    });
  }, [uniqueCustomFields]);

  // Determine if cart-related columns should be shown
  useEffect(() => {
    const hasCartNumber = dataArray.some((item) => item.cart_number !== "-");
    const hasCreatedDateTime = dataArray.some(
      (item) => item.created_date_time !== "-",
    );
    const hasGrandTotal = dataArray.some(
      (item) => item.grand_total !== "-" && item.grand_total !== 0,
    );

    setShowCartColumns({
      cart_number: hasCartNumber,
      created_date_time: hasCreatedDateTime,
      grand_total: hasGrandTotal,
    });
  }, [dataArray]);

  type ContactColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: IAllcontact) => React.ReactNode;
  };

  const baseColumnDefs: ContactColumnDef[] = useMemo(() => {
    const defs: ContactColumnDef[] = [
      {
        key: "person_name",
        label: "Person Name",
        header: <span>Person <br /> Name</span>,
        width: "150px",
        body: (rowData) => rowData.person_name || "-",
      },
      {
        key: "mobile_number",
        label: "Mobile Number",
        header: <span>Mobile <br /> Number</span>,
        width: "150px",
        body: (rowData) => rowData.mobile_number || "-",
      },
      {
        key: "company_name",
        label: "Company Name",
        header: <span>Company <br /> Name</span>,
        width: "150px",
        body: (rowData) => rowData.company_name || "-",
      },
      {
        key: "source_name",
        label: "Source Name",
        header: <span>Source <br /> Name</span>,
        width: "150px",
        body: (rowData) => (
          <span
            style={{
              backgroundColor: rowData.source_colour
                ? rowData.source_colour
                : "#eeeeee",
            }}
            className="badge rounded-pill"
          >
            {rowData.source_name}
          </span>
        ),
      },
      {
        key: "lable_name",
        label: "Lable Name",
        header: <span>Lable <br /> Name</span>,
        width: "150px",
        body: (rowData) => {
          const labelNames = rowData.lable_name
            ? rowData.lable_name
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
            : [];
          const labelColors = rowData.lable_colour
            ? rowData.lable_colour
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
            : [];

          if (labelNames.length === 0) return "-";

          return (
            <div className="d-flex flex-wrap gap-1">
              {labelNames.map((name, idx) => (
                <span
                  key={idx}
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: labelColors[idx] || "#6c757d",
                    color: "#fff",
                    fontSize: "0.85em",
                    padding: "4px 8px",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        key: "status_name",
        label: "Status Name",
        header: <span>Status <br /> Name</span>,
        width: "120px",
        body: (rowData) => (
          <span
            style={{
              backgroundColor: rowData.status_colour
                ? rowData.status_colour
                : "#eeeeee",
            }}
            className="badge rounded-pill"
          >
            {rowData.status_name}
          </span>
        ),
      },
      {
        key: "address",
        label: "Address",
        header: "Address",
        width: "150px",
        body: (rowData) => {
          if (rowData.latitude && rowData.longitude && !MobileFlag) {
            return (
              <a
                href={`https://www.google.com/maps/dir//${rowData.latitude},${rowData.longitude}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {rowData.address || "-"}
              </a>
            );
          }
          return rowData.address || "-";
        },
      },
      {
        key: "country_name",
        label: "Country Name",
        header: <span>Country <br /> Name</span>,
        width: "150px",
        body: (rowData) => rowData.country_name || "-",
      },
      {
        key: "state_name",
        label: "State Name",
        header: <span>State <br /> Name</span>,
        width: "150px",
        body: (rowData) => rowData.state_name || "-",
      },
      {
        key: "city_name",
        label: "City Name",
        header: <span>City <br /> Name</span>,
        width: "150px",
        body: (rowData) => rowData.city_name || "-",
      },
      {
        key: "area_name",
        label: "Area Name",
        header: <span>Area <br /> Name</span>,
        width: "150px",
        body: (rowData) => rowData.area_name || "-",
      },
    ];

    if (showCartColumns.cart_number) {
      defs.push({
        key: "cart_number",
        label: "Last Cart Number",
        header: "Last Cart Number",
        width: "150px",
        body: (rowData) => rowData.cart_number || "-",
      });
    }

    if (showCartColumns.created_date_time) {
      defs.push({
        key: "created_date_time",
        label: "Created Date",
        header: "Created Date",
        width: "150px",
        body: (rowData) => rowData.created_date_time || "-",
      });
    }

    defs.push(
      {
        key: "assigned_to",
        label: "Assign To",
        header: "Assign To",
        width: "150px",
        body: (rowData) => rowData.assigned_to || "-",
      },
      {
        key: "created_by",
        label: "Created By",
        header: "Created By",
        width: "150px",
        body: (rowData) => rowData.created_by || "-",
      },
    );

    if (showCartColumns.grand_total) {
      defs.push({
        key: "grand_total",
        label: "Grand Total",
        header: "Grand Total",
        width: "150px",
        filterMatchMode: "equals",
        body: (rowData) =>
          rowData.grand_total ? `₹ ${rowData.grand_total}` : "-",
      });
    }

    uniqueCustomFields.forEach((field: any) => {
      defs.push({
        key: field.fieldName,
        label: field.fieldLabel,
        header: field.fieldLabel,
        width: field.dataType === 3 ? "220px" : "150px",
        filterMatchMode:
          field.dataType === 1 || field.dataType === 7 ? "equals" : "contains",
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
  }, [showCartColumns, uniqueCustomFields, MobileFlag]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("all_contact_report", baseColumnDefs);

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  const onFilter = (event: DataTableFilterEvent) => {
    const activeField = Object.keys(event.filters).find((key) => {
      const filter = event.filters[key];

      if ("value" in filter) {
        return filter.value !== null && filter.value !== "";
      }

      if ("constraints" in filter) {
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
        if ("value" in filter) {
          filter.value = null;
        }

        if ("constraints" in filter) {
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

  const onSelectionChange = (event: { value: IAllcontact[] }) => {
    setSelectedCustomers(event.value);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectedCustomers([]);
    }
  };

  const getExportCellValue = (
    col: ContactColumnDef,
    customer: any,
    moneyFormat: "inr" | "symbol" | "plain" = "plain",
  ): string => {
    if (col.key === "grand_total") {
      if (!customer.grand_total) return "-";
      if (moneyFormat === "inr") return `INR ${customer.grand_total}`;
      if (moneyFormat === "symbol") return `₹${customer.grand_total}`;
      return String(customer.grand_total);
    }
    return customer[col.key] ?? "-";
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const filteredData = getFilteredData();
    const tableData = (
      selectedCustomers.length > 0 ? selectedCustomers : filteredData
    ).map((customer) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, customer, "inr");
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`all_contacts_report_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { top: 20, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text("All Contact Report", data.settings.margin.left, 10);
      },
    });

    doc.save(`all_contacts_report_${new Date().getTime()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allContacts = await fetchAllContactsForExport({
        selectedDates: filters.selectedDateArray,
        setActive,
        setActiveDay,
        MobileToken,
        getID,
        MobileFlag,
        selectedLabels: filters.checkedOptions,
        selectedSourceTypes: filters.checkedSourceTypes,
        selectedStageStatus: filters.checkedOptionsStageStatus,
        selectedTeamMembers: filters.checkedOptionsUser,
        selectedDemography: selectedDemography
          ? Object.values(selectedDemography).filter(Boolean)
          : null,
        selectedProductSearchId: filters.selectedProductSearchId,
        setSelectOrderType: filters.selectedOrderListId,
        globalSearch: debouncedSearchText,
        assignedByMultiTeamMember: filters.assignedByMultiTeamMember,
        createdByMultiTeamMember: filters.createdByMultiTeamMember,
        leadAgingBucket: filters.leadAgingBucket,
        leadAgingActivityTypes: filters.leadAgingActivityTypes,
      });

      if (!allContacts.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedCustomers.length > 0 ? selectedCustomers : allContacts
      ).map((customer) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, customer, "plain");
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 25 }));

      const workbook = {
        Sheets: { Contacts: worksheet },
        SheetNames: ["Contacts"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "All_Contacts_Report");
    } catch (error) {
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

    const printContent = `
      <html>
        <head>
          <title>All Contact Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>All Contact Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableData
        .map(
          (customer) => `
                  <tr>
                    ${visibleColumns
              .map(
                (col) =>
                  `<td>${getExportCellValue(col, customer, "symbol")}</td>`,
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

  const handleAddFromImport = () => {
    setIsExportDropdownOpen(false);
    if (canImport) {
      setIsModalExcelVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmImportExcel = async () => {
    setIsModalExcelVisible(false);
    setRefreshContact(true);
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          All Contact
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  const fetchContactData = async (ids: number[]) => {
    await fetchDataUser(
      0,
      "",
      setUser,
      ITEMS_PER_PAGE,
      setNoDataFound,
      setLoading,
      token,
      localId,
      setContactId,
      setSelectedLabelIds,
      setCheckToken,
      null,
      [],
      [],
      "",
      "",
      [],
      [],
      0,
      0,
      null,
      null,
      null,
      localId ? localId : undefined,
      0,
      0,
      isArchivState ? 1 : 0,
      null,
      null,
      [],
      [],
      "",
      "",
      "",
      0,
      [],
      ids,
    );
  };

  const openRightSide = () => {
    if (canViewMsg) {
      setShowRightSide(true);

      // if (user[0].is_unread && user[0].is_unread === 1) {
      //   updateIsUnRead(user[0].id, setIsRefers, 1);
      //   // Update local state immediately for better UX
      //   user[0].is_unread = 0;
      // }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // const handleOpenWhatsAppChat = async (id: number) => {
  //   fetchContactData(id);

  //   if (user.length > 0) {
  //     console.log("openRightSide");
  //     openRightSide();
  //   }
  // }

  const handleOpenWhatsAppChat = async (id: number) => {
    await fetchContactData([id]);
    openRightSide();
  };

  const showArchiveContacts = () => {
    setIsArchivState(() => {
      if (isArchivState) {
        console.log("haha");
        return false;
      }
      return true;
    });
  };

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          All Contact
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
            <Button
              icon="pi pi-plus"
              className="report_button"
              style={{ backgroundColor: "rgb(245, 134, 52)" }}
              rounded
              onClick={() => {
                if (canAdd) {
                  setIsCreateContact(true);
                } else {
                  toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }
              }}
              tooltip={`Add Contact`}
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
                <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
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
                className="listItem"
                role="button"
                onClick={handleAddFromImport}
              >
                <i
                  className="pi pi-file-import"
                  style={{ marginRight: "4px" }}
                />
                Import Contact
              </li>
              <li
                className="listItem"
                role="button"
                onClick={() => {
                  showArchiveContacts();
                }}
              >
                <i
                  className="pi pi-file-import"
                  style={{ marginRight: "4px" }}
                />

                {isArchivState ? "UnArchive Contacts" : "Archive Contacts"}
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
        {/* )} */}
      </div>
      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          ref={dt}
          value={customers}
          scrollable
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 52, // Adjust to your actual row height (inspect in dev tools)
            lazy: true,
            onLazyLoad: (event: { first: number; last: number }) => {
              if (
                event.last >= customers.length - 10 &&
                hasMore &&
                !isLoadingMore.current
              ) {
                loadTasks(currentOffset.current, 50);
              }
            },
            appendOnly: true, // Key fix: prevents DOM reset and scroll jump
            showLoader: true,
            delay: 200,
          }}
          filterDisplay="row"
          // dataKey="id"
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={isAllSelected}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No data found"
          footer={
            showCartColumns.grand_total ? (
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
                  Total: ₹{" "}
                  {getFilteredData()
                    .reduce(
                      (sum, row) => sum + (Number(row.grand_total) || 0),
                      0,
                    )
                    .toFixed(2)}
                </div>
              </div>
            ) : null
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
          {fromSideView && (
            <Column
              field="actions"
              header={<span>Action</span>}
              headerClassName="center-header"
              headerStyle={{
                width: "70px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              body={actionBodyTemplate}
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
                textAlign: col.key === "grand_total" ? "right" : undefined,
              }}
              body={col.body}
            />
          ))}
        </DataTable>
      </div>
      {isCreateContact && (
        <CreateContactView
          show={isCreateContact}
          onHide={() => setIsCreateContact(false)}
          setContact={() => loadTasks(0, 50, true)}
          headerName={"Create Contact"}
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
          filtersToShow={[1, 2, 3, 4, 5, 6, 9, 19, 29]}
          pageId={1}
          stageandStatusOrderType={1}
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
          initialLeadAgingBucket={filters.leadAgingBucket}
          initialLeadAgingActivityTypes={filters.leadAgingActivityTypes}
          isApplyReport={1}
        />
      )}
      {isModalExcelVisible && (
        <ImportExcelForContactModal
          show={isModalExcelVisible}
          onHide={() => setIsModalExcelVisible(false)}
          handleSubmit={() => handleConfirmImportExcel()}
          title={"Import Excel For Contact"}
          message={"Please Import excel as per sample excel"}
          btn1="Cancel"
          btn2="Import"
          sampleLocation="sampleContact.xlsx"
          potions={1}
        />
      )}
      {/* {isCloseConfirmation && (
        <ConfirmationModal
          show={isCloseConfirmation}
          onHide={() => setIsCloseConfirmation(false)}
          handleSubmit={handleLogout}
          title={"Log Out?"}
          message={"Are you sure you want to log out?"}
          btn1="CANCEL"
          btn2="LOG OUT"
        />
      )} */}
      {showRightSide && user.length > 0 && user[0] && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "70%",
            height: "100%",
            zIndex: 999,
            background: "#fff",
            boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
            display: "flex",
          }}
        >
          <RightView
            openCreateContact={() => setIsCreateContact(true)}
            closeCreateContact={() => setIsCreateContact(false)}
            showInquiryAllList={() => { }}
            showReminder={() => { }}
            showNotes={() => { }}
            showMyTask={() => { }}
            showMySupportTicket={() => { }}
            showFilterContact={() => { }}
            showMyCompany={() => { }}
            showDashboard={() => { }}
            showAichat={() => { }}
            getData={user[0]}
            isDashBoardOpen={false}
            closeDashboard={() => { }}
            isAiModelopen={false}
            closeisAiModel={() => { }}
            contactsReload={() => {
              setRefreshContacts(refreshContact);
            }}
            setEditorContentToEdit={setEditorContentToEdit}
            editorContentToEdit={editorContentToEdit}
            setNoDataFound1={setNoDataFound1}
            resetTrigger={resetRightSideTrigger}
            setRefreshContact={() => setRefreshContact(true)}
            setSearchTermFromRightSide={setSearchTermFromRightSide}
            setIdFromRightSide={setIdFromRightSide}
          />
        </div>
      )}
    </div>
  );
};

export default AllcontactReport;
