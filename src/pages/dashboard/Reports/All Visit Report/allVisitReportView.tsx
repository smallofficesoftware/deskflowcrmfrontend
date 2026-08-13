import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
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
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ImageViewer from "../../../../components/ImageViewer";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  GOOGLE_MAP_KEY,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { IUserList } from "../../../left-side/LeftSideController"; // Adjust path as needed
import {
  exportAllVisitData,
  fetchVisitReport,
  IVisitData,
  IVisitItem,
} from "./allVisitReportController"; // Adjust path as needed
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
  selectedDemography?: string[] | null;
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
const getMatchedCustomFields = (visitItem: any, customForm: any[]) => {
  return customForm
    .filter(
      (formField) =>
        formField.report_print_or_not === 1 &&
        formField.reference_column_name in visitItem,
    )
    .map((formField) => ({
      fieldName: formField.reference_column_name,
      fieldLabel: formField.title || formField.reference_column_name,
      dataType: formField.data_type,
    }));
};
const calculateDuration = (
  startDate: string,
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
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  } catch {
    return "-";
  }
};
const getDayName = (dateStr: string | undefined | null): string => {
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
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  } catch {
    return "-";
  }
};

const flattenVisitData = (visitData: IVisitData[]): any[] => {
  return visitData.flatMap((user) =>
    user.visits.map((item) => {
      const customFormFields: Record<string, any> = {};

      (item.customForm || []).forEach((form: any) => {
        if (form.reference_column_name) {
          customFormFields[form.reference_column_name] =
            item[form.reference_column_name];
        }
      });
      return {
        ...item,
        ...customFormFields,
        username: user.user.username,
        status:
          !item.end_date || item.end_date === "0000-00-00"
            ? "Active"
            : "Complete",
        duration: calculateDuration(item.start_date, item.end_date),
        start_day: getDayName(item.start_date),
        end_day: getDayName(item.end_date),
      };
    }),
  );
};

interface IVisitMapPopupProps {
  lat: number;
  lng: number;
  name: string;
  onClose: () => void;
}

const VisitMapPopup: React.FC<IVisitMapPopupProps> = ({
  lat,
  lng,
  name,
  onClose,
}) => {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAP_KEY });
  const [showInfo, setShowInfo] = useState(false); // ← add
  const center = { lat, lng };

  return (
    <div className="modal1">
      <div
        className="modal-content1"
        style={{
          width: "98%",
          height: "98vh",
          backgroundColor: "rgb(240 242 245)",
          marginTop: "10px",
          marginBottom: "0px",
          paddingBottom: "0px",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "1.5%",
            zIndex: "99999",
            right: "1.5%",
          }}
          className="close ms-3 pb-3"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#1f1f1f"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </span>

        {!isLoaded ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            Loading map...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={15}
            options={{
              draggable: true,
              zoomControl: true,
              scrollwheel: true,
              disableDoubleClickZoom: false,
            }}
          >
            <Marker
              position={center}
              title={name}
              onClick={() => setShowInfo(true)} // ← click pe open
            />
            {showInfo && ( // ← conditional
              <InfoWindow
                position={center}
                onCloseClick={() => setShowInfo(false)} // ← close
              >
                <div style={{ padding: "6px" }}>
                  <strong>{name}</strong>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
};

const AllVisitReportsView = ({
  selectedDates,
  selectedTeamMembers,
  title = "Visit",
  setRefreshReport1,
  MobileToken,
  getID,
  MobileFlag,
  selectedDemography,
  globalSearch,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IVisitReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [visits, setVisits] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<IVisitItem>();
  const [selectedVisits, setSelectedVisits] = useState<any[]>([]);
  const [isOrderCreateFromContactShow, setIsOrderCreateFromContactShow] =
    useState(false);
  const [contactInfoOrder, setContactInfoOrder] = useState<IUserList>();
  const [isOrderShowFromContactType, setIsOrderShowFromContactType] =
    useState(0);
  const [visitData, setVisitData] = useState<IVisitData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshReport, setRefreshReport] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const isInitialLoad = useRef(true);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("all_visit_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isModalMap, setIsModalMap] = useState<boolean>(false);
  const [selectedVisitForMap, setSelectedVisitForMap] = useState<any>(null);

  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentViewerOpen, setAttachmentViewerOpen] = useState(false);

  console.log("filters", filters)

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
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("all_visit_report", updatedFilters);

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

      setFilters("all_visit_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLVISIT_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLVISIT_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const canView = useCheckUserPermission(
    PAGE_ID.ALLVISIT_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
      person_name: { value: null, matchMode: "custom" },
      address: { value: null, matchMode: "contains" },
      start_date: { value: null, matchMode: "contains" },
      end_date: { value: null, matchMode: "contains" },
      start_day: { value: null, matchMode: "contains" },
      end_day: { value: null, matchMode: "contains" },
      remark: { value: null, matchMode: "contains" },
      status: { value: null, matchMode: "contains" },
      duration: { value: null, matchMode: "contains" },
      visit_image: { value: null, matchMode: "contains" },
    },
  });

  const dt = useRef<DataTable<any[]>>(null);

  const dataArray = useMemo(() => {
    return Array.isArray(visitData)
      ? visitData.map((item) => ({
        user: item.user || { username: "-", recovery_mobile: "" },
        visits: item.visits || [],
      }))
      : [];
  }, [visitData]);

  const uniqueCustomFields = useMemo(() => {
    const seen = new Set<string>();
    const fields: any[] = [];

    flattenVisitData(dataArray).forEach((item) => {
      (item.customForm || []).forEach((form: any) => {
        if (
          form.report_print_or_not === 1 &&
          form.reference_column_name &&
          !seen.has(form.reference_column_name)
        ) {
          seen.add(form.reference_column_name);
          fields.push({
            fieldName: form.reference_column_name,
            fieldLabel: form.title || form.reference_column_name,
            dataType: form.data_type,
          });
        }
      });
    });

    return fields;
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

  console.log("Sample flattened visit:", flattenVisitData(visitData)[0]);

  useEffect(() => {
    if (visits.length > 0) {
      console.log("Sample flattened visit:", visits[0]);
      console.log("All customForm from first visit:", visits[0]?.customForm);
      console.log("Example dynamic field:", visits[0]?.visit_column_number_1);
    }
  }, [visits]);

  useEffect(() => {
    if (refreshReport) {
      setRefreshReport1 && setRefreshReport1(true);
    }
    setRefreshReport1 && setRefreshReport1(false);
    setRefreshReport(false);
  }, [refreshReport, setRefreshReport1]);

  const filteredData = useMemo(() => {
    let data = [...visits];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;
        data = data.filter((item) => {
          if (matchMode === "custom" && field === "person_name") {
            const nameValue = getNestedValue(item, "person_name");
            const contactIdValue = getNestedValue(item, "contact_id");
            const nameStr = nameValue?.toString().toLowerCase() || "";
            const contactIdStr = contactIdValue?.toString().toLowerCase() || "";
            return (
              nameStr.includes(filterValue) ||
              contactIdStr.includes(filterValue)
            );
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
  }, [visits, lazyState.filters, lazyState.sortField, lazyState.sortOrder]);

  useEffect(() => {
    setTotalRecords(filteredData.length);
  }, [filteredData]);

  useEffect(() => {
    setVisits([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadMoreVisits(true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    selectedDemography,
    debouncedSearchText,
    filters.selectedContactId,
    filters.referenceWiseContact,
  ]);

  const loadMoreVisits = async (reset = false) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    isLoadingMore.current = true;
    setLoading(true);

    const offset = reset ? 0 : currentOffset.current;
    const limit = 50;

    const rawData = await fetchVisitReport(
      filters.selectedDateArray,
      filters.checkedOptionsUser,
      MobileToken,
      getID,
      MobileFlag,
      selectedDemography,
      offset,
      limit,
      debouncedSearchText,
      filters.selectedContactId,
      filters.referenceWiseContact,
    );

    const flattened = flattenVisitData(rawData);
    setVisitData((prev) => (reset ? rawData : [...prev, ...rawData]));

    setVisits((prev) => (reset ? flattened : [...prev, ...flattened]));

    currentOffset.current = offset + rawData.length;
    if (rawData.length < limit) setHasMore(false);

    setLoading(false);
    isLoadingMore.current = false;
  };

  const onVirtualScroller = (event: any) => {
    const { last } = event;

    // Trigger earlier (buffer zone)
    if (last >= visits.length - 10 && hasMore && !loading) {
      loadMoreVisits();
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
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch {
      return "-";
    }
  };

  const handleChangeImgViewer = (item: IVisitItem) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  const handleLocationViewer = (item: IVisitItem) => {
    if (canView) {
      setSelectedVisitForMap(item);
      setIsModalMap(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleChangeShowModelVisit = (item: IUserList) => {
    setContactInfoOrder(item);
    setIsOrderShowFromContactType(1);
    setIsOrderCreateFromContactShow(true);
  };

  type VisitColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    filterMatchMode?: string;
    sortableCol?: boolean;
    filterCol?: boolean;
    bodyStyle?: React.CSSProperties;
    body: (rowData: any) => React.ReactNode;
  };

  const baseColumnDefs: VisitColumnDef[] = useMemo(() => {
    const defs: VisitColumnDef[] = [
      {
        key: "id",
        label: "Visit ID",
        header: (
          <span>
            Visit <br /> ID
          </span>
        ),
        width: "100px",
        body: (rowData) => (
          <span
            style={{ cursor: "pointer", fontSize: "14px" }}
            onClick={() => handleChangeShowModelVisit(rowData)}
            title="View Visit"
          >
            {rowData.id || "# XXXXXXX"}
          </span>
        ),
      },
      {
        key: "start_date",
        label: "Start Date",
        header: (
          <span>
            Start <br /> Date
          </span>
        ),
        width: "150px",
        bodyStyle: { fontSize: "14px" },
        body: (rowData) => {
          const dayName = rowData.start_day || getDayName(rowData.start_date);
          return (
            <>
              <div>{formatDateTime(rowData.start_date)}</div>
              <div>{dayName}</div>
            </>
          );
        },
      },
      {
        key: "end_date",
        label: "End Date",
        header: (
          <span>
            End <br /> Date
          </span>
        ),
        width: "150px",
        body: (rowData) => {
          const dayName = rowData.end_day || getDayName(rowData.end_date);
          return (
            <>
              <div>{formatDateTime(rowData.end_date)}</div>
              <div>{dayName}</div>
            </>
          );
        },
      },
      {
        key: "duration",
        label: "Duration",
        header: "Duration",
        width: "150px",
        body: (rowData) => rowData.duration || "-",
      },
      {
        key: "person_name",
        label: "Contact Name",
        header: (
          <span>
            Contact <br /> Name
          </span>
        ),
        width: "150px",
        filterMatchMode: "custom",
        bodyStyle: { fontSize: "14px" },
        body: (rowData) => (
          <div>
            <div>{rowData.person_name || "-"}</div>
          </div>
        ),
      },
      {
        key: "contactNumber",
        label: "Contact Company",
        header: (
          <span>
            Contact <br />Company
          </span>
        ),
        width: "150px",
        filterMatchMode: "custom",
        bodyStyle: { fontSize: "14px" },
        body: (rowData) => (
          <div>
            <div>{rowData.contactNumber || "-"}</div>
          </div>
        ),
      },
      {
        key: "address",
        label: "Contact Address",
        header: (
          <span>
            Contact <br />Address
          </span>
        ),
        width: "150px",
        bodyStyle: {
          fontSize: "14px",
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        },
        body: (rowData) => (
          <div
            style={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {rowData.address || "-"}
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
        width: "150px",
        bodyStyle: { fontSize: "14px" },
        body: (rowData) => rowData.username || "-",
      },
      {
        key: "status",
        label: "Status",
        header: "Status",
        width: "150px",
        body: (rowData) => (
          <span
            style={{
              color: rowData.status === "Active" ? "green" : "blue",
              fontSize: "14px",
            }}
          >
            {rowData.status !== undefined ? rowData.status : "-"}
          </span>
        ),
      },
      {
        key: "remark",
        label: "Remark",
        header: "Remark",
        width: "150px",
        bodyStyle: {
          fontSize: "14px",
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        },
        body: (rowData) => (
          <div
            style={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {rowData.remark || "-"}
          </div>
        ),
      },
      {
        key: "visit_image",
        label: "Image",
        header: "Image",
        width: "110px",
        sortableCol: false,
        filterCol: false,
        bodyStyle: { fontSize: "14px" },
        body: (rowData) =>
          rowData.visit_image !== null ? (
            <Button
              icon="pi pi-image"
              className="p-button-text"
              style={{ color: "green", fontSize: "18px" }}
              onClick={() => handleChangeImgViewer(rowData)}
            />
          ) : (
            "-"
          ),
      },
      {
        key: "location",
        label: "Location",
        header: "Location",
        width: "110px",
        sortableCol: false,
        filterCol: false,
        bodyStyle: { fontSize: "14px" },
        body: (rowData) =>
          rowData.longitude && rowData.latitude ? (
            <Button
              icon="pi pi-map-marker"
              className="p-button-text"
              style={{ color: "green", fontSize: "18px" }}
              onClick={() => handleLocationViewer(rowData)}
            />
          ) : (
            "-"
          ),
      },
    ];

    uniqueCustomFields.forEach((field: any) => {
      const safeHeader = (field.fieldLabel || field.fieldName || "")?.replace(
        / /g,
        "\n",
      );

      defs.push({
        key: field.fieldName,
        label: field.fieldLabel || field.fieldName,
        header: safeHeader,
        width: "150px",
        filterMatchMode:
          field.dataType === 1 || field.dataType === 7 ? "equals" : "contains",
        body: (rowData) => {
          const value = rowData[field.fieldName];

          if (field.dataType === 13) {
            if (!value || value === "-" || String(value).trim() === "") {
              return "-";
            }

            return (
              <div className="d-flex gap-2">
                <Button
                  icon="pi pi-eye"
                  className="p-button-text"
                  onClick={() => handleAttachmentView(value)}
                />
                <Button
                  icon="pi pi-download"
                  className="p-button-text"
                  onClick={() => handleAttachmentDownload(value)}
                />
              </div>
            );
          }

          if (value === null || value === undefined || value === "") {
            return "-";
          }

          return value;
        },
      });
    });

    return defs;
  }, [uniqueCustomFields]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("all_visit_report", baseColumnDefs);

  const getExportCellValue = (col: VisitColumnDef, item: any): any => {
    switch (col.key) {
      case "id":
        return item.id || "XXXXXXX";
      case "start_date":
        return formatDateTime(item.start_date);
      case "end_date":
        return formatDateTime(item.end_date);
      case "start_day":
        return item.start_day || getDayName(item.start_date);
      case "end_day":
        return item.end_day || getDayName(item.end_date);
      case "status":
        return item.status ?? "-";
      case "visit_image":
      case "location":
        return "-";
      case "contact_id":
        return item.contact_id ?? "-";
      default: {
        const field = uniqueCustomFields.find((f: any) => f.fieldName === col.key);
        if (field) {
          const value = item[field.fieldName];
          return field.dataType == 13
            ? "-"
            : value === undefined || value === null || value === ""
              ? "-"
              : value;
        }
        return item[col.key] ?? "-";
      }
    }
  };

  const exportableColumns = [
    ...visibleColumns.filter((col) => col.key !== "visit_image" && col.key !== "location"),
    { key: "start_day", label: "Start Day" } as VisitColumnDef,
    { key: "end_day", label: "End Day" } as VisitColumnDef,
    { key: "contact_id", label: "Contact ID" } as VisitColumnDef,
  ];

  const exportColumns = exportableColumns.map((col) => ({
    title: col.label,
    dataKey: col.key,
  }));

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const dataToExport =
      selectedVisits.length > 0 ? selectedVisits : filteredData;
    const tableData = dataToExport.map((item) => {
      const rowData: any = {};
      exportableColumns.forEach((col) => {
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
  // const exportExcel = () => {
  //   const dataToExport = selectedVisits.length > 0 ? selectedVisits : filteredData;
  //   const exportData = dataToExport.map((item) => {
  //     const rowData: any = {
  //       Visit_ID: item.id || "XXXXXXX",
  //       Contact_Name: item.person_name || "-",
  //       Contact_ID: item.contact_id || "-",
  //       Created_By: item.username || "-",
  //       Status: item.status !== undefined ? item.status : "-",
  //       Start_Date: formatDateTime(item.start_date),
  //       End_Date: formatDateTime(item.end_date),
  //       Duration: item.duration || "-",
  //       Remark: item.remark || "-",
  //     };
  //     uniqueCustomFields.forEach((field: any) => {
  //       rowData[field.fieldLabel] = item[field.fieldName] || "-";
  //     });
  //     return rowData;
  //   });
  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [
  //     { wpx: 100 },
  //     { wpx: 150 },
  //     { wpx: 100 },
  //     { wpx: 150 },
  //     { wpx: 100 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 100 },
  //     { wpx: 200 },
  //     { wpx: 200 },
  //     ...uniqueCustomFields.map(() => ({ wpx: 150 })),
  //   ];
  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "visit_report");
  // };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allVisitGroups = await exportAllVisitData<IVisitData>(
        (offset, limit) =>
          fetchVisitReport(
            filters.selectedDateArray,
            filters.checkedOptionsUser,
            MobileToken,
            getID,
            MobileFlag,
            selectedDemography,
            offset,
            limit,
            debouncedSearchText,
            filters.selectedContactId,
          ),
        500,
      );

      const flattenedVisits = flattenVisitData(allVisitGroups);

      if (!flattenedVisits.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedVisits.length > 0 ? selectedVisits : flattenedVisits
      ).map((item) => {
        const row: any = {};
        exportableColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = {
        Sheets: { Visits: worksheet },
        SheetNames: ["Visits"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "visit_report_full");
    } catch {
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
    const dataToExport =
      selectedVisits.length > 0 ? selectedVisits : filteredData;
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
                ${exportColumns.map((col) => `<th>${col.title}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${dataToExport
        .map(
          (item) => `
                <tr>
                  ${exportableColumns
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
  const handleAttachmentView = (url?: string) => {
    if (!url?.trim()) {
      toast.error("File not found");
      return;
    }

    window.open(url, "_blank");
  };

  const handleAttachmentDownload = async (filePath?: string) => {
    if (!filePath?.trim()) {
      toast.error("File not found");
      return;
    }

    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        toast.error("File not found");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = decodeURIComponent(
        filePath.split(/[\\/]/).pop() || "file",
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Unable to download file");
      console.error(error);
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
            All {title}
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

                    if (visits.length === 0) return;

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

                    if (visits.length === 0) return;

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

                    if (visits.length === 0) return;

                    canPrint
                      ? printTable()
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }}
                >
                  <i className="pi pi-print" style={{ marginRight: "4px" }} />
                  Print
                </li>
              </ul>

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
            value={visits}
            scrollable
            resizableColumns
            columnResizeMode="fit"
            className="custom-centered-table"
            scrollHeight="90vh"
            virtualScrollerOptions={{
              itemSize: 52, // Approximate row height
              lazy: true,
              onLazyLoad: onVirtualScroller,
              loading: loading && isInitialLoad.current,
            }}
            filterDisplay="row"
            // dataKey="id"
            // first={lazyState.first}
            // rows={lazyState.rows}
            totalRecords={totalRecords}
            onSort={onSort}
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
                  Total Visits: {filteredData.length}
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
                headerStyle={{
                  width: col.width || "150px",
                  whiteSpace: "pre-wrap",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  fontSize: "14px",
                }}
                bodyStyle={col.bodyStyle || { fontSize: "14px" }}
                body={col.body}
              />
            ))}
          </DataTable>
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
            filtersToShow={[1, 5, 6, 18]}
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
        {isModalMap && selectedVisitForMap && (
          <VisitMapPopup
            lat={parseFloat(selectedVisitForMap.latitude)}
            lng={parseFloat(selectedVisitForMap.longitude)}
            name={selectedVisitForMap.person_name || "Unknown"}
            onClose={() => {
              setIsModalMap(false);
              setSelectedVisitForMap(null);
            }}
          />
        )}
      </div>
    </>
  );
};
export default AllVisitReportsView;
