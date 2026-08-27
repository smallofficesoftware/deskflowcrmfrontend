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
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import {
  formatDateAndTime,
  useEscapeKey,
} from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchAllContactsForExport,
  fetchAllDeletedcontact,
  IAllDeletedcontact,
  recoverContactApi,
} from "./allDeletedContactReportController";

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

const AllDeletedcontactReport = ({
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
  onHide,
}: IPropallcontactReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<IAllDeletedcontact[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<
    IAllDeletedcontact[]
  >([]);

  const isPaginationCall = useRef(false);
  const [apiParams, setApiParams] = useState({ ul: 0, ll: 50 });
  const currentOffset = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingMore = useRef(false);
  const [recovering, setRecovering] = useState(false);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("all_deleted_contact_report");
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
      checkedOptions: data.checkedOptionsLabel || [],
      checkedSourceTypes: data.checkedOptionsSourceType || [],
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("all_deleted_contact_report", updatedFilters);

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
    if (!filters.selectedDateArray?.length) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("all_deleted_contact_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.PRINT,
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
      grand_total: { value: null, matchMode: "equals" },
      country_name: { value: null, matchMode: "contains" },
      state_name: { value: null, matchMode: "contains" },
      city_name: { value: null, matchMode: "contains" },
      area_name: { value: null, matchMode: "contains" },
      address: { value: null, matchMode: "contains" },
    },
  });
  const [allcontact, setAllcontact] = useState<IAllDeletedcontact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCartColumns, setShowCartColumns] = useState({
    cart_number: false,
    created_date_time: false,
    grand_total: false,
  });

  const dt = useRef<DataTable<IAllDeletedcontact[]>>(null);

  const dataArray: IAllDeletedcontact[] = useMemo(() => {
    return customers.map((item) => ({
      id: item.id,
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

  const recoverSelectedContacts = async () => {
    if (selectedCustomers.length === 0) return;

    setRecovering(true);

    try {
      await recoverContactApi(selectedCustomers.map((c) => c.id));

      // Clear selection
      setIsCloseConfirmation(false);
      setSelectedCustomers([]);
      setSelectAll(false);

      // Refresh the table (reset to first page)
      setCustomers([]);
      currentOffset.current = 0;
      setHasMore(true);
      await loadTasks(0, 50, true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to recover contacts. Please try again.");
    } finally {
      setRecovering(false);
    }
  };

  // useEffect(() => {
  //     setCustomers([]);
  //     setTotalRecords(0);
  //     currentOffset.current = 0;
  //     setHasMore(true);

  //     // loadTasks(0, 50, true);
  // }, [
  //     selectedDates,
  //     selectedLabels,
  //     selectedSourceTypes,
  //     selectedStageStatus,
  //     selectedTeamMembers,
  //     selectedDemography,
  //     debouncedGlobalSearch,
  // ]);

  const searchDependencies = JSON.stringify({
    selectedDates: filters.selectedDateArray,
    selectedLabels: filters.checkedOptions,
    selectedSourceTypes: filters.checkedSourceTypes,
    selectedStageStatus: filters.checkedOptionsStageStatus,
    selectedTeamMembers: filters.checkedOptionsUser,
    selectedDemography: selectedDemography
      ? Object.values(selectedDemography).filter(Boolean)
      : null,
    debouncedSearchText,
  });
  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    setHasMore(true);

    loadTasks(0, 50, true);
  }, [searchDependencies]);

  const loadTasks = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (loading) return;

    setLoading(true);

    try {
      const newData = await fetchAllDeletedcontact(
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
        offset,
        limit,
        debouncedSearchText,
      );

      if (reset) {
        setCustomers(newData);
        setTotalRecords(newData.length);
        currentOffset.current = newData.length;
      } else {
        setCustomers((prev) => [...prev, ...newData]);
        currentOffset.current += newData.length;
        setTotalRecords((prev) => prev + newData.length);
      }

      if (newData.length < limit) {
        setHasMore(false);
      }
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    currentOffset.current = 0;
    setHasMore(true);
    setCustomers([]);
    loadTasks(0, 50, true);
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

  const onSelectionChange = (event: { value: IAllDeletedcontact[] }) => {
    setSelectedCustomers(event.value);
    setSelectAll(event.value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectAll(true);
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  type DeletedContactColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: IAllDeletedcontact) => React.ReactNode;
  };

  const baseColumnDefs: DeletedContactColumnDef[] = useMemo(() => {
    const defs: DeletedContactColumnDef[] = [
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
        width: "100px",
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
              backgroundColor: rowData.lable_colour
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
        label: "Label Name",
        header: <span>Label <br /> Name</span>,
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
        body: (rowData) => formatDateAndTime(rowData.created_date_time) || "-",
      });
    }

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
  } = useColumnPreferences("all_deleted_contact_report", baseColumnDefs);

  const getExportCellValue = (
    col: DeletedContactColumnDef,
    customer: any,
    moneyFormat: "inr" | "symbol" | "plain" = "plain",
  ): string => {
    if (col.key === "created_date_time") {
      return formatDateAndTime(customer.created_date_time) || "-";
    }
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

        if (showCartColumns.grand_total) {
      const grandTotalSum = (selectedCustomers.length > 0 ? selectedCustomers : filteredData).reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0);
      tableData.push({
        Person_Name: "Total",
        Grand_Total: grandTotalSum.toFixed(2),
      } as any);
    }

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
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1 && data.row.section === "body" && showCartColumns.grand_total) {
          data.cell.styles.fontStyle = "bold";
        }
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
        globalSearch: debouncedSearchText,
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

            if (showCartColumns.grand_total) {
        const grandTotalSum = (selectedCustomers.length > 0 ? selectedCustomers : allContacts).reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0);
        exportData.push({
          Person_Name: "Total",
          Grand_Total: grandTotalSum.toFixed(2),
        });
      }

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
                <li
                  className="listItem text-start"
                  role="button"
                  onClick={() => {
                    if (selectedCustomers.length === 0) return;

                    setIsExportDropdownOpen(false);
                    setIsCloseConfirmation(true);
                  }}
                  style={{
                    opacity: selectedCustomers.length === 0 ? 0.5 : 1,
                    cursor:
                      selectedCustomers.length === 0
                        ? "not-allowed"
                        : "pointer",
                    pointerEvents:
                      selectedCustomers.length === 0 ? "none" : "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <i
                      className="pi pi-undo"
                      style={{
                        marginRight: "4px",
                      }}
                    />

                    <span style={{ marginRight: "auto" }}>
                      Recover
                      {selectedCustomers.length > 0 &&
                        ` (${selectedCustomers.length})`}
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

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          value={customers}
          scrollable
          scrollHeight="90vh"
          lazy
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          totalRecords={totalRecords}
          loading={loading}
          virtualScrollerOptions={{
            itemSize: 52,
            lazy: true,
            showLoader: true,
            loading,
            onLazyLoad: (e) => {
              if (
                typeof e.last === "number" &&
                !loading &&
                hasMore &&
                e.last >= customers.length - 1
              ) {
                loadTasks(currentOffset.current, 50);
              }
            },
          }}
          filterDisplay="row"
          // dataKey="id"
          // paginator
          first={lazyState.first}
          rows={lazyState.rows}
          // onPage={onPage}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
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
        {isCloseConfirmation && (
          <ConfirmationModal
            show
            onHide={() => setIsCloseConfirmation(false)}
            handleSubmit={recoverSelectedContacts}
            title="Recover Deleted Contacts"
            message={`Are you sure you want Recover ${selectedCustomers.length} Contacts?`}
            btn1="No"
            btn2="Yes"
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
            filtersToShow={[1, 2, 3, 4, 5, 6, 9]}
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
            isApplyReport={1}
          />
        )}
      </div>
    </div>
  );
};

export default AllDeletedcontactReport;
