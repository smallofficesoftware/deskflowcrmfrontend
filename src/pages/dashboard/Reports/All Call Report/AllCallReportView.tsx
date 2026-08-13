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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ImageViewer from "../../../../components/ImageViewer";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { IUserList } from "../../../left-side/LeftSideController"; // Adjust path as needed
import {
  fetchCallHistoryApi,
  ICallData,
  ICallHistoryView,
} from "./AllCallReportContoller"; // Adjust path as needed

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IVisitReportsProps {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  title?: string;
  setRefreshReport1?: (value: boolean | number) => void;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  selectedContactId?: string | null;
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

const calculateDuration = (
  startDate: string | undefined,
  endDate: string | null,
): string => {
  if (!endDate || endDate === "0000-00-00" || !startDate) return "-";
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "-";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch {
    return "-";
  }
};

// const calculateDuration1 = (input: string | number | undefined): string => {
//   try {
//     if (input === undefined || input === null) return "-";
//     const totalSeconds =
//       typeof input === "string" ? parseFloat(input) * 60 : input * 60;

//     if (isNaN(totalSeconds)) return "-";

//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = Math.floor(totalSeconds % 60);

//     return `${hours}h ${minutes}m ${seconds}s`;
//   } catch {
//     return "-";
//   }
// };
const calculateDuration1 = (input: string | number | undefined): string => {
  try {
    if (!input) return "-";

    // CASE 1: already number (seconds)
    if (typeof input === "number") {
      const hours = Math.floor(input / 3600);
      const minutes = Math.floor((input % 3600) / 60);
      const seconds = Math.floor(input % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    // CASE 2: string like "65:10" (MM:SS)
    if (typeof input === "string" && input.includes(":")) {
      const parts = input.split(":");

      let minutes = 0;
      let seconds = 0;

      if (parts.length === 2) {
        minutes = parseInt(parts[0], 10);
        seconds = parseInt(parts[1], 10);
      }

      if (isNaN(minutes) || isNaN(seconds)) return "-";

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      return `${hours}h ${remainingMinutes}m ${seconds}s`;
    }

    return "-";
  } catch {
    return "-";
  }
};

let colorForStatus: string;

const call_type = (callType: string | undefined | number): string => {
  try {
    let callTypeValue: string;
    switch (callType) {
      case 1:
        callTypeValue = "Incoming";
        colorForStatus = "#008000";
        break;
      case 2:
        callTypeValue = "Outgoing";
        colorForStatus = "#0000FF";
        break;
      case 3:
        callTypeValue = "Missed";
        colorForStatus = "#FFCCCC";
        break;
      case 4:
        callTypeValue = "Rejected";
        colorForStatus = "#8B0000";
        break;
      case 5:
        callTypeValue = "Blocked";
        colorForStatus = "#000000";
        break;
      case 7:
        callTypeValue = "Outgoing Call Not Connected";
        colorForStatus = "#00b3ff";
        break;
      case 9:
        callTypeValue = "Answered Externally";
        colorForStatus = "#FFB300";
        break;
      default:
        callTypeValue = "Unknown";
        colorForStatus = "#333333";
        break;
    }
    return `${callTypeValue}`;
  } catch {
    return "-";
  }
};

const flattenVisitData = (callData: ICallData[]): any[] => {
  return callData.flatMap((user) =>
    (user.calls || []).map((item) => ({
      id: item.id,
      call_type: item.call_type,
      call_status: call_type(item.call_type),
      call_color: colorForStatus,
      call_date_time: item.call_date_time,
      duration: calculateDuration1(item.duration),
      mobile_number: item.mobile_number,
      remark: item.remark,
      call_name: item.call_name,

      // ✅ SAFE FIX HERE
      username: user?.user?.username || "",

      person_name: item.person_name,
      start_date: item.start_date,
      s_timestemp: item.s_timestemp,
      source_name: item.contactDetails?.source_name || "",
      source_colour: item.contactDetails?.source_colour || "",

      status_name: item.contactDetails?.status_name || "",
      status_colour: item.contactDetails?.status_colour || "",

      lable_name: item.contactDetails?.lable_name || "",
      lable_colour: item.contactDetails?.lable_colour || "",
    })),
  );
};

const AllCallReportsView = ({
  selectedDates,
  selectedTeamMembers,
  title = "All Call History",
  setRefreshReport1,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  selectedContactId,
  onHide,
}: IVisitReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [visits, setVisits] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<ICallHistoryView>();
  const [selectedVisits, setSelectedVisits] = useState<any[]>([]);
  const [isOrderCreateFromContactShow, setIsOrderCreateFromContactShow] =
    useState(false);
  const [contactInfoOrder, setContactInfoOrder] = useState<IUserList>();
  const [isOrderShowFromContactType, setIsOrderShowFromContactType] =
    useState(0);
  const [callData, setCallData] = useState<ICallData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshReport, setRefreshReport] = useState(false);

  const isPaginationCall = useRef(false);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("all_call_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

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

    setFilters("all_call_report", updatedFilters);

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

      setFilters("all_call_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLCALL_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLCALL_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
      person_name: { value: null, matchMode: "custom" },
      start_date: { value: null, matchMode: "contains" },
      duration: { value: null, matchMode: "contains" },
    },
  });

  const handleChangeImgViewer = (item: ICallHistoryView) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  const dt = useRef<DataTable<any[]>>(null);
  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    currentOffset.current = 0;
    setHasMore(true);

    loadTasks(0, 50, true); // ✅ reset load
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
    filters.selectedContactId,
    filters.checkedOptions,
    filters.checkedSourceTypes,
    filters.checkedOptionsStageStatus,
  ]);

  useEffect(() => {
    if (refreshReport) {
      setRefreshReport1 && setRefreshReport1(true);
    }
    setRefreshReport1 && setRefreshReport1(false);
    setRefreshReport(false);
  }, [refreshReport, setRefreshReport1]);

  const dataArray = useMemo(() => {
    return Array.isArray(callData)
      ? callData.map((item) => ({
        user: item.user || { username: "-", recovery_mobile: "" },
        calls: item.calls || [],
      }))
      : [];
  }, [callData]);

  const filteredData = useMemo(() => {
    let data = flattenVisitData(dataArray);
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        data = data.filter((item) => {
          if (matchMode === "custom" && field === "person_name") {
            const nameValue = getNestedValue(item, "person_name");
            const nameStr = nameValue?.toString().toLowerCase() || "";
            return nameStr.includes(filterValue);
          } else {
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

  // useEffect(() => {
  //   loadLazyData();
  //   return () => {
  //     if (networkTimeout.current) clearTimeout(networkTimeout.current);
  //   };
  // }, [lazyState, dataArray]);

  // const loadLazyData = () => {
  //   setLoading(true);
  //   if (networkTimeout.current) clearTimeout(networkTimeout.current);

  //   networkTimeout.current = setTimeout(() => {
  //     const start = lazyState.first;
  //     const end = start + lazyState.rows;
  //     const paginatedData = filteredData.slice(start, end);
  //     setVisits(paginatedData);
  //     setTotalRecords(filteredData.length);
  //     setLoading(false);
  //   }, 250);
  // };

  const loadTasks = async (offset: number, limit: number, reset = false) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchCallHistoryApi(
        () => { },
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        offset,
        limit,
        debouncedSearchText,
        filters.selectedContactId,
        filters.checkedOptions,
        filters.checkedSourceTypes,
        filters.checkedOptionsStageStatus,
      );

      console.log("PAGE offset:", offset, "usersReturned:", newData.length,
        +   "totalCallsThisPage:", newData.reduce((a, u) => a + u.calls.length, 0));

      // const totalCalls = newData.reduce(
      //   (acc, user) => acc + user.calls.length,
      //   0,
      // );

      if (!newData || newData.length === 0) {
        setHasMore(false);
      }

      setCallData((prev) => (reset ? newData : [...prev, ...newData]));

      // FIXED OFFSET
      currentOffset.current = offset + limit;
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  };

  //   const loadTasks = async (event: DataTablePageEvent) => {
  //   const currentPage = event.page ?? 0;
  //   const offset = currentPage * 50;     // starting point (ul)
  //   const limit = 50;                    // number of records to fetch (ll)

  //   // Prevent multiple simultaneous pagination calls
  //   if (isPaginationCall.current) return;

  //   isPaginationCall.current = true;
  //   setLoading(true);

  //   try {
  //     const newData = await fetchCallHistoryApi(
  //       setCallData,
  //       selectedDates,
  //       selectedTeamMembers,
  //       MobileToken,
  //       getID,
  //       MobileFlag,
  //       limit,           // limit (was ll)
  //       offset,          // offset (was ul)
  //       debouncedGlobalSearch,
  //       selectedContactId
  //     );

  //     // If returned data is less than requested limit, assume no more data
  //     if (newData.length < limit) {
  //       setHasMore(false);
  //     }

  //     if (currentPage === 0) {
  //       // First page → reset data
  //       setCallData(newData);
  //     } else {
  //       // Subsequent pages → append data
  //       setCallData((prev) => {
  //         const updated = [...prev];
  //         updated.splice(prev.length, 0, ...newData); // Append via splice
  //         return updated;
  //       });
  //     }

  //     // Update lazy state for PrimeReact DataTable
  //     setLazyState((prev) => ({
  //       ...prev,
  //       first: event.first,
  //       rows: event.rows,
  //       page: currentPage,
  //     }));

  //     // Update current offset for tracking
  //     currentOffset.current = offset + newData.length;

  //   } catch (err) {
  //     console.error("Error fetching paginated call data:", err);
  //     setHasMore(false);
  //   } finally {
  //     setLoading(false);
  //     setTimeout(() => {
  //       isPaginationCall.current = false;
  //     }, 100);
  //   }
  // };
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

  const onSelectionChange = (event: { value: any[] }) => {
    const value = event.value;
    setSelectedVisits(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedVisits([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedVisits([]);
    }
  };

  const formatDateTime = (dateStr: string | undefined | null): string => {
    if (
      !dateStr ||
      dateStr === "-" ||
      dateStr.includes("undefined") ||
      dateStr === "0000-00-00"
    ) {
      return "-";
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const formattedHours = String(hours).padStart(2, "0");
      return `${day}/${month}/${year} - ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return "-";
    }
  };

  type CallColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: CallColumnDef[] = useMemo(() => {
    return [
      {
        key: "start_date",
        label: "Start Date & Time",
        header: "Start Date & Time",
        width: "200px",
        body: (rowData) => formatDateTime(rowData.call_date_time),
      },
      {
        key: "status",
        label: "Status",
        header: "Status",
        width: "150px",
        body: (rowData) => (
          <span
            style={{
              color: rowData.call_color,
              fontSize: "14px",
            }}
          >
            {rowData.call_status !== undefined ? rowData.call_status : "-"}
          </span>
        ),
      },
      {
        key: "person_name",
        label: "Contact Details",
        header: "Contact Details",
        width: "250px",
        filterMatchMode: "custom",
        body: (rowData) => (
          <div>
            <div>
              {rowData.call_name || "-"} {" -"} {" "}
              {rowData.mobile_number || "-654"}
            </div>
          </div>
        ),
      },
      {
        key: "source_name",
        label: "Source Name",
        header: "Source Name",
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
        key: "status_name",
        label: "Contact Status",
        header: "Contact Status",
        width: "150px",
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
        key: "lable_name",
        label: "Lable",
        header: "Lable",
        width: "150px",
        body: (rowData) => {
          const labelNames = rowData.lable_name
            ? rowData.lable_name
              .split(",")
              .map((s: string) => s.trim())
              .filter((s: string) => s)
            : [];

          const labelColors = rowData.lable_colour
            ? rowData.lable_colour
              .split(",")
              .map((s: string) => s.trim())
              .filter((s: string) => s)
            : [];

          if (labelNames.length === 0) return "-";

          return (
            <div className="d-flex flex-wrap gap-1">
              {labelNames.map((name: string, idx: number) => (
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
        key: "username",
        label: "Created By",
        header: "Created By",
        width: "250px",
        body: (rowData) => rowData.username || "-",
      },
      {
        key: "duration",
        label: "Duration",
        header: "Duration",
        width: "250px",
        filterMatchMode: "custom",
        body: (rowData) => {
          const duration = rowData.duration || "-";
          const remark = rowData.remark || "";

          // Agar remark empty hai to sirf duration dikhao, "-" mat lagao
          if (!remark || remark.trim() === "") {
            return <div>{duration}</div>;
          }

          // Agar remark hai tabhi duration - remark dikhao
          return (
            <div>
              {duration} - {remark}
            </div>
          );
        },
      },
    ];
  }, []);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("all_call_report", baseColumnDefs);

  // Export-only fields: not shown as table columns, but always included in exports/print.
  const EXTRA_EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "id", label: "Call ID" },
    { key: "remark", label: "Remark" },
  ];

  const getExportCellValue = (col: CallColumnDef, item: any): string => {
    switch (col.key) {
      case "start_date":
        return formatDateTime(item.call_date_time);
      case "status":
        return item.call_status || "-";
      case "person_name":
        return item.call_name || item.person_name || "-";
      case "source_name":
        return item.source_name || "-";
      case "status_name":
        return item.status_name || "-";
      case "lable_name":
        return item.lable_name || "-";
      case "username":
        return item.username || "-";
      case "duration":
        return item.duration || item.remark || "-";
      default:
        return item[col.key] ?? "-";
    }
  };

  const handleChangeShowModelVisit = (item: IUserList) => {
    setContactInfoOrder(item);
    setIsOrderShowFromContactType(1);
    setIsOrderCreateFromContactShow(true);
  };

  const exportPdf = () => {
    console.log("exportPdf");
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );

    const dataToExport =
      selectedVisits.length > 0
        ? selectedVisits
        : isFilterApplied
          ? visits
          : filteredData;

    const tableData = dataToExport.map((item) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, item);
      });
      EXTRA_EXPORT_COLUMNS.forEach((col) => {
        rowData[col.key] = item[col.key] ?? "-";
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`${title}_report_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = [
      ...visibleColumns.map((col) => ({
        title: col.label,
        dataKey: col.key,
      })),
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

  const exportAllCallData = async (): Promise<ICallData[]> => {
    let offset = 0;
    const limit = 500;

    let allData: ICallData[] = [];

    while (true) {
      const response = await fetchCallHistoryApi(
        () => { },
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        offset,
        limit,
        debouncedSearchText,
        filters.selectedContactId,
        filters.checkedOptions,
        filters.checkedSourceTypes,
        filters.checkedOptionsStageStatus,
      );

      if (!response || response.length === 0) break;

      allData = [...allData, ...response];

      // 🔥 IMPORTANT FIX
      offset += limit;

      // stop condition
      // const totalCalls = response.reduce(
      //   (acc, user) => acc + user.calls.length,
      //   0,
      // );

      // if (totalCalls < limit) break;
    }

    return allData;
  };

  const exportExcel = async () => {
    try {
      console.log("EXPORT START");
      setLoading(true);

      const allCallGroups = await exportAllCallData();
      console.log("API DONE");

      if (!allCallGroups || allCallGroups.length === 0) {
        toast.warn("No data from API");
        return;
      }

      const allRows = flattenVisitData(allCallGroups);
      console.log("FLATTEN DONE", allRows.length);

      if (!allRows.length) {
        toast.warn("No rows after flatten");
        return;
      }

      const finalData = selectedVisits.length > 0 ? selectedVisits : allRows;

      const exportData = finalData.map((item) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        EXTRA_EXPORT_COLUMNS.forEach((col) => {
          row[col.label] = item[col.key] ?? "-";
        });
        return row;
      });

      console.log("EXPORT DATA READY", exportData.length);

      const worksheet = xlsx.utils.json_to_sheet(exportData);

      // ✅ SAFE column width
      if (exportData.length > 0) {
        worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({
          wch: 25,
        }));
      }

      const workbook = {
        Sheets: { Calls: worksheet },
        SheetNames: ["Calls"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      console.log("BUFFER CREATED");

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      console.log("BLOB CREATED");

      saveAs(blob, `call_report_${Date.now()}.xlsx`);

      console.log("FILE SAVED ✅");
    } catch (error) {
      console.error("EXPORT ERROR:", error);
      toast.error("Excel export failed");
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
    console.log("printTable");
    const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) =>
        "value" in filter && filter.value !== null && filter.value !== "",
    );

    const dataToExport =
      selectedVisits.length > 0
        ? selectedVisits
        : isFilterApplied
          ? visits
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
          (item) => `
                <tr>
                  ${visibleColumns
              .map((col) => `<td>${getExportCellValue(col, item)}</td>`)
              .join("")}
                  ${EXTRA_EXPORT_COLUMNS
              .map((col) => `<td>${item[col.key] ?? "-"}</td>`)
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
          {title}
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

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

                    if (filteredData.length === 0) return;

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

                    if (filteredData.length === 0) return;

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

                    if (filteredData.length === 0) return;

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
          {/* )} */}
        </div>

        <div
          className="report_card"
          style={{
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <DataTable
            ref={dt}
            value={filteredData}
            resizableColumns
            columnResizeMode="fit"
            className="custom-centered-table"
            scrollable
            filterDisplay="row"
            scrollHeight="80vh"
            virtualScrollerOptions={{
              itemSize: 52, // Adjust to your actual row height (inspect in dev tools)
              lazy: true,
              onLazyLoad: (event: { first: number; last: number }) => {
                if (
                  event.last >= filteredData.length - 1 &&
                  hasMore &&
                  !loading
                ) {
                  loadTasks(currentOffset.current, 50);
                }
              },
              appendOnly: true, // Key fix: prevents DOM reset and scroll jump
              showLoader: true,
              delay: 0,
            }}
            sortField={lazyState.sortField ?? undefined}
            sortOrder={lazyState.sortOrder ?? undefined}
            sortMode="single"
            onFilter={onFilter}
            filters={lazyState.filters}
            loading={loading}
            selection={selectedVisits}
            onSelectionChange={onSelectionChange}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            selectionMode="multiple"
            tableStyle={{ tableLayout: "fixed", width: "100%" }}
            emptyMessage="No data found"
          // footer={
          //   <div
          //     style={{
          //       padding: "10px",
          //       background: "#f8f9fa",
          //       textAlign: "right",
          //       // position: "sticky",  ← REMOVE YE
          //       // bottom: 0,           ← REMOVE YE
          //       // zIndex: 1,           ← REMOVE YE
          //     }}
          //   >
          //     Total Calls: {filteredData.length}
          //   </div>
          // }
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
                bodyStyle={{ fontSize: "14px" }}
                body={col.body}
              />
            ))}
          </DataTable>
        </div>
        <div
          style={{
            padding: "10px",
            background: "#f8f9fa",
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <b>Total Calls: {filteredData.length}</b>
        </div>
        {viewerOpen && (
          <ImageViewer
            image={imageViewData}
            onClose={() => setViewerOpen(false)}
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
            filtersToShow={[1, 2, 3, 4, 5]}
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
    </>
  );
};

export default AllCallReportsView;
