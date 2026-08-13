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
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  TASK_ATTEECHMENT_VIEW,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { ITaskView } from "../../../left-side/header/Setting/taskList/TaskListController";
import CreateTaskView from "../../../right-side/create-task/CreateTaskView";
import {
  exportTaskAndSupportTicketData,
  fetchTaskReport,
  ITaskitem,
} from "./allTaskReportController";

interface IVisitReportsProps {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  selectedStageStatus?: string[] | null;
  title?: string;
  setRefreshReport1?: (value: boolean | number) => void;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  is_support_ticket_flag?: number;
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

const AllTaskReportsView = ({
  selectedDates,
  selectedTeamMembers,
  selectedStageStatus,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  is_support_ticket_flag,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IVisitReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<ITaskitem[]>([]);
  const [displayTasks, setDisplayTasks] = useState<ITaskitem[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<ITaskitem[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<ITaskitem | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const title = is_support_ticket_flag == 0 ? "All Task" : "All Support Ticket";
  const isInitialLoad = useRef(true);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<
    ITaskView[]
  >([]);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("alltask_report");
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
    }
  });

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

    setFilters("alltask_report", updatedFilters);

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

      setFilters("alltask_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canAdd = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.ADD,
  );
  const canShare = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyFilters, setLazyFilters] = useState<DataTableFilterMeta>({
    task_title: { value: null, matchMode: "contains" },
    status_name: { value: null, matchMode: "contains" },
    category_name: { value: null, matchMode: "contains" },
    priority_name: { value: null, matchMode: "contains" },
    type_name: { value: null, matchMode: "contains" },
    assigned_team_member_names: { value: null, matchMode: "contains" },
    selected_days_names: { value: null, matchMode: "contains" },
    task_fromdate: { value: null, matchMode: "contains" },
    task_enddate: { value: null, matchMode: "contains" },
    task_remark: { value: null, matchMode: "contains" },
    created_by_name: { value: null, matchMode: "contains" },
  });

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  // Reset data on filter/search/params change
  useEffect(() => {
    setAllTasks([]);
    setDisplayTasks([]);
    currentOffset.current = 0;
    isInitialLoad.current = true;
    setHasMore(true);
    loadTasks(0, 50, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    filters.checkedOptionsStageStatus,
    debouncedSearchText,
    MobileToken,
    getID,
    MobileFlag,
    is_support_ticket_flag,
    filters.selectedContactId,
    filters.referenceWiseContact,
  ]);

  const loadTasks = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchTaskReport(
        () => { }, // We handle state manually
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        filters.checkedOptionsStageStatus,
        offset,
        limit,
        debouncedSearchText,
        is_support_ticket_flag,
        filters.selectedContactId,
        filters.referenceWiseContact,
      );

      if (newData.length < limit) {
        setHasMore(false);
      }

      if (reset) {
        setAllTasks(newData);
      } else {
        setAllTasks((prev) => [...prev, ...newData]);
      }

      currentOffset.current = offset + newData.length;
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
      isInitialLoad.current = false;
    }
  };

  const onhideTaskModal = () => {
    setIsCreateModel(false);
    setAllTasks([]);
    setDisplayTasks([]);
    currentOffset.current = 0;
    isInitialLoad.current = true;
    setHasMore(true);
    loadTasks(0, 50, true);
  };

  const onVirtualScroller = (event: any) => {
    if (event.last === allTasks.length && hasMore && !isLoadingMore.current) {
      loadTasks(currentOffset.current, 50);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...allTasks];

    // Apply filters
    Object.entries(lazyFilters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        data = data.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;

          let fieldStr = "";
          if (Array.isArray(fieldValue)) {
            fieldStr = fieldValue.join(", ").toLowerCase();
          } else {
            fieldStr = fieldValue.toString().toLowerCase();
          }
          return fieldStr.includes(filterValue);
        });
      }
    });

    // Apply sorting
    if (sortField) {
      data.sort((a, b) => {
        const aValue = getNestedValue(a, sortField);
        const bValue = getNestedValue(b, sortField);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (Array.isArray(aValue) || Array.isArray(bValue)) return 0;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (sortOrder === -1) data.reverse();
    }

    return data;
  }, [allTasks, lazyFilters, sortField, sortOrder]);

  useEffect(() => {
    setDisplayTasks(filteredAndSortedData);
  }, [filteredAndSortedData]);

  const onFilter = (event: DataTableFilterEvent) => {
    setLazyFilters(event.filters);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder as SortOrder);
  };

  const onSelectionChange = (event: { value: ITaskitem[] }) => {
    setSelectedTasks(event.value);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectedTasks([...filteredAndSortedData]);
    } else {
      setSelectedTasks([]);
    }
  };

  const handleChangeImgViewer = (item: ITaskitem) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  const showExternalStatusColumn =
    is_support_ticket_flag !== 0 &&
    displayTasks?.some((item) => Number(item?.external_status || 0) !== 0);

  type TaskColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    isAttachment?: boolean;
    body: (rowData: ITaskitem) => React.ReactNode;
  };

  const baseColumnDefs: TaskColumnDef[] = useMemo(() => {
    const defs: TaskColumnDef[] = [
      {
        key: "id",
        label: is_support_ticket_flag === 0 ? "Task ID" : "Support Ticket ID",
        header:
          is_support_ticket_flag === 0 ? (
            <span>
              Task <br /> ID
            </span>
          ) : (
            <span>
              Support <br /> Ticket <br /> ID
            </span>
          ),
        width: "80px",
        body: (rowData) => rowData.id || "-",
      },
      {
        key: "task_title",
        label:
          is_support_ticket_flag === 0 ? "Task Title" : "Support Ticket Title",
        header:
          is_support_ticket_flag === 0 ? (
            <span>
              Task <br /> Title
            </span>
          ) : (
            <span>
              Support <br /> Ticket <br /> Title
            </span>
          ),
        width: "130px",
        body: (rowData) => rowData.task_title || "-",
      },
      {
        key: "status_name",
        label: "Status",
        header: "Status",
        width: "120px",
        body: (rowData) => (
          <span
            style={{
              backgroundColor: rowData.status_colour || "#eeeeee",
              padding: "4px 8px",
              borderRadius: "12px",
              color: "#fff",
            }}
          >
            {rowData.status_name}
          </span>
        ),
      },
    ];

    if (showExternalStatusColumn) {
      defs.push({
        key: "external_status_name",
        label: "External Status",
        header: "External Status",
        width: "160px",
        body: (rowData) => (
          <span
            style={{
              backgroundColor: rowData.external_status_colour || "#eeeeee",
              padding: "4px 8px",
              borderRadius: "12px",
              color: "#fff",
            }}
          >
            {rowData.external_status_name || "-"}
          </span>
        ),
      });
    }

    defs.push(
      {
        key: "category_name",
        label: "Category",
        header: "Category",
        width: "130px",
        body: (rowData) => rowData.category_name || "-",
      },
      {
        key: "priority_name",
        label: "Priority",
        header: "Priority",
        width: "100px",
        body: (rowData) => rowData.priority_name || "-",
      },
      {
        key: "type_name",
        label: "Type",
        header: "Type",
        width: "100px",
        body: (rowData) => rowData.type_name || "-",
      },
      {
        key: "task_remark",
        label: "Remark",
        header: "Remark",
        width: "200px",
        body: (rowData) => (
          <div
            dangerouslySetInnerHTML={{
              __html: rowData.task_remark || "-",
            }}
            style={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          />
        ),
      },
      {
        key: "selected_days_names",
        label: "Selected Days",
        header: "Selected Days",
        width: "130px",
        body: (rowData) =>
          Array.isArray(rowData.selected_days_names)
            ? rowData.selected_days_names.join(", ")
            : "-",
      },
      {
        key: "task_fromdate",
        label: "From Date",
        header: "From Date",
        width: "120px",
        body: (rowData) => formatDateTime(rowData.task_fromdate),
      },
      {
        key: "task_enddate",
        label: "End Date",
        header: "End Date",
        width: "120px",
        body: (rowData) => formatDateTime(rowData.task_enddate),
      },
      {
        key: "created_by_name",
        label: "Created By",
        header: "Created By",
        width: "130px",
        body: (rowData) => rowData.created_by_name || "-",
      },
      {
        key: "assigned_team_member_names",
        label: "Assigned To",
        header: "Assigned To",
        width: "160px",
        body: (rowData) =>
          Array.isArray(rowData.assigned_team_member_names)
            ? rowData.assigned_team_member_names.join(", ")
            : "-",
      },
    );

    if (displayTasks?.length > 0 && displayTasks[0]?.customForm) {
      displayTasks[0].customForm.forEach((item: any) => {
        defs.push({
          key: `customForm_${item.id}`,
          label: item.title,
          header: item.title,
          width: "150px",
          isAttachment: item.data_type === 13,
          body: (rowData) => {
            const fieldData = rowData?.customForm?.find(
              (cf: any) => cf.id === item.id,
            );

            const value = fieldData?.value;

            if (value === null || value === undefined || value === "") {
              return "-";
            }

            if (fieldData?.data_type === 13) {
              const fileUrl = `${TASK_ATTEECHMENT_VIEW}${value}`;

              return (
                <div className="d-flex gap-2">
                  <Button
                    icon="pi pi-eye"
                    className="p-button-text"
                    tooltip="View"
                    onClick={() => handleAttachmentView(fileUrl)}
                  />

                  <Button
                    icon="pi pi-download"
                    className="p-button-text"
                    tooltip="Download"
                    onClick={() => handleAttachmentDownload(fileUrl)}
                  />
                </div>
              );
            }

            return value;
          },
        });
      });
    }

    return defs;
  }, [is_support_ticket_flag, showExternalStatusColumn, displayTasks]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("all_task_report", baseColumnDefs);

  const exportableColumns = visibleColumns.filter((col) => !col.isAttachment);

  const EXPORT_WIDTH_MAP: Record<string, number> = {
    id: 10,
    task_title: 38,
    status_name: 40,
    external_status_name: 70,
    category_name: 30,
    priority_name: 15,
    type_name: 15,
    task_remark: 40,
    selected_days_names: 20,
    task_fromdate: 28,
    task_enddate: 28,
    created_by_name: 28,
    assigned_team_member_names: 32,
  };

  const EXPORT_CENTER_KEYS = new Set([
    "id",
    "priority_name",
    "type_name",
    "task_fromdate",
    "task_enddate",
  ]);

  const getExportCellValue = (
    col: TaskColumnDef,
    item: ITaskitem,
    mode: "pdf" | "excel" | "print",
  ): string => {
    switch (col.key) {
      case "id":
        return item.id ? String(item.id) : "XXXXXXX";
      case "task_title":
        return item.task_title || "-";
      case "status_name":
        return item.status_name || "-";
      case "external_status_name":
        return item.external_status_name || "-";
      case "category_name":
        return item.category_name || "-";
      case "priority_name":
        return item.priority_name || "-";
      case "type_name":
        return item.type_name || "-";
      case "task_remark":
        if (mode === "pdf") {
          return item.task_remark
            ? item.task_remark.replace(/<[^>]*>/g, "").trim() || "-"
            : "-";
        }
        return item.task_remark || "-";
      case "selected_days_names":
        return Array.isArray(item.selected_days_names)
          ? item.selected_days_names.join(", ")
          : "-";
      case "task_fromdate":
        return formatDateTime(item.task_fromdate);
      case "task_enddate":
        return formatDateTime(item.task_enddate);
      case "created_by_name":
        return item.created_by_name || "-";
      case "assigned_team_member_names":
        return Array.isArray(item.assigned_team_member_names)
          ? item.assigned_team_member_names.join(", ")
          : "-";
      default: {
        const cf = item?.customForm?.find(
          (c: any) => `customForm_${c.id}` === col.key,
        );
        return cf?.value || "-";
      }
    }
  };

  const exportPdf = () => {
    const dataToExport =
      selectedTasks.length > 0 ? selectedTasks : filteredAndSortedData;
    const tableData = dataToExport.map((item) => {
      const rowData: any = {
        status_colour: item.status_colour || "#eeeeee",
        external_status_colour: item.external_status_colour || "#eeeeee",
      };

      exportableColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, item, "pdf");
      });

      return rowData;
    });

    if (tableData.length === 0) {
      const doc = new jsPDF({ orientation: "landscape", format: "a2" });
      doc.text("No data available to export", 10, 10);
      doc.save(`${title}_report_${new Date().getTime()}.pdf`);
      return;
    }

    const BADGE_COLUMNS = exportableColumns
      .filter(
        (col) => col.key === "status_name" || col.key === "external_status_name",
      )
      .map((col) => col.key);

    // ✅ Scale: white space hatane ke liye
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margins = 30;
    const usableWidth = pageWidth - margins;

    const totalFixedWidth = exportableColumns.reduce(
      (sum, col) => sum + (EXPORT_WIDTH_MAP[col.key] ?? 30),
      0,
    );

    const scale = usableWidth / totalFixedWidth;

    const COLUMN_CONFIG: Record<string, any> = Object.fromEntries(
      exportableColumns.map((col) => [
        col.key,
        {
          cellWidth: (EXPORT_WIDTH_MAP[col.key] ?? 30) * scale,
          overflow: "linebreak",
          ...(EXPORT_CENTER_KEYS.has(col.key) ? { halign: "center" } : {}),
        },
      ]),
    );

    const exportColumns = exportableColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: COLUMN_CONFIG,
      margin: { top: 20, left: 15, right: 15 },

      didParseCell: (data: any) => {
        if (
          data.section === "body" &&
          BADGE_COLUMNS.includes(data.column.dataKey)
        ) {
          data.cell.text = [];
        }
      },

      didDrawCell: (data: any) => {
        if (
          data.section === "body" &&
          BADGE_COLUMNS.includes(data.column.dataKey)
        ) {
          const row = tableData[data.row.index];
          const isExternal = data.column.dataKey === "external_status_name";

          const statusText =
            (isExternal ? row.external_status_name : row.status_name) || "-";
          const bgColor =
            (isExternal ? row.external_status_colour : row.status_colour) ||
            "#aaaaaa";

          const hex = bgColor.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16) || 170;
          const g = parseInt(hex.substring(2, 4), 16) || 170;
          const b = parseInt(hex.substring(4, 6), 16) || 170;

          doc.setFontSize(10);
          const padding = 2;
          const textW = doc.getTextWidth(statusText);
          const badgeW = Math.min(textW + padding * 3, data.cell.width - 4);
          const badgeH = 5;
          const x = data.cell.x + (data.cell.width - badgeW) / 2;
          const y = data.cell.y + (data.cell.height - badgeH) / 2;

          doc.setFillColor(r, g, b);
          doc.roundedRect(x, y, badgeW, badgeH, 2, 2, "F");

          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const textColor = brightness > 128 ? 30 : 255;
          doc.setTextColor(textColor, textColor, textColor);
          doc.text(statusText, x + badgeW / 2, y + badgeH / 2 + 0.5, {
            align: "center",
            baseline: "middle",
            maxWidth: badgeW - 2,
          });

          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
        }
      },

      didDrawPage: (data: any) => {
        doc.setFontSize(11);
        doc.text(`${title} Report`, data.settings.margin.left, 12);
      },
    });

    doc.save(`${title}_report_${new Date().getTime()}.pdf`);
  };

  // const exportExcel = () => {
  //   const dataToExport = selectedTasks.length > 0 ? selectedTasks : filteredAndSortedData;
  //   const idTitle = is_support_ticket_flag == 0 ? "Task_ID" : "Support_Ticket_ID";
  //   const titleTitle = is_support_ticket_flag == 0 ? "Task_Title" : "Support_Ticket_Title";

  //   const exportData = dataToExport.map((item) => ({
  //     [idTitle]: item.id || "XXXXXXX",
  //     [titleTitle]: item.task_title || "-",
  //     Status: item.status_name || "-",
  //     Category: item.category_name || "-",
  //     Priority: item.priority_name || "-",
  //     Type: item.type_name || "-",
  //     Assigned_To: Array.isArray(item.assigned_team_member_names)
  //       ? item.assigned_team_member_names.join(", ")
  //       : "-",
  //     Selected_Days: Array.isArray(item.selected_days_names)
  //       ? item.selected_days_names.join(", ")
  //       : "-",
  //     From_Date: formatDateTime(item.task_fromdate),
  //     End_Date: formatDateTime(item.task_enddate),
  //     Remark: item.task_remark || "-",
  //   }));

  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
  //   const data = new Blob([excelBuffer], {
  //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  //   });
  //   saveAs(data, `${title}_report_${new Date().getTime()}.xlsx`);
  // };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allTasks = await exportTaskAndSupportTicketData<ITaskitem>(
        (offset, limit) =>
          fetchTaskReport(
            undefined,
            filters.selectedDateArray,
            filters.checkedOptionsUser,
            MobileToken,
            getID,
            MobileFlag,
            filters.checkedOptionsStageStatus,
            offset,
            limit,
            debouncedSearchText,
            is_support_ticket_flag,
            filters.selectedContactId,
          ),
        500,
      );

      if (!allTasks.length) {
        toast.warn("No data to export");
        return;
      }
      const exportData = (
        selectedTasks.length > 0 ? selectedTasks : allTasks
      ).map((item) => {
        const row: any = {};
        exportableColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item, "excel");
        });
        return row;
      });
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0] || {}).map(() => ({
        wch: 25,
      }));

      const workbook = {
        Sheets: { Tasks: worksheet },
        SheetNames: ["Tasks"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      saveAs(blob, `${title}_report_${Date.now()}.xlsx`);
    } catch (error) {
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  const printTable = () => {
    const dataToExport =
      selectedTasks.length > 0 ? selectedTasks : filteredAndSortedData;

    const printContent = `
    <html>
      <head>
        <title>${title} Report</title>
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }

          th {
            background-color: #f2f2f2;
          }

          h1 {
            text-align: center;
          }
        </style>
      </head>

      <body>
        <h1>${title} Report</h1>

        <table>
          <thead>
            <tr>
              ${exportableColumns.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>

          <tbody>
            ${dataToExport
        .map((item) => {
          const getPrintCellHtml = (col: TaskColumnDef): string => {
            if (col.key === "status_name") {
              return `<span style="background:${item.status_colour || "#eeeeee"};padding:4px 8px;border-radius:12px;color:#fff;display:inline-block;">${item.status_name || "-"}</span>`;
            }
            if (col.key === "external_status_name") {
              return `<span style="background:${item.external_status_colour || "#eeeeee"};padding:4px 8px;border-radius:12px;color:#fff;display:inline-block;">${item.external_status_name || "-"}</span>`;
            }
            return getExportCellValue(col, item, "print");
          };

          return `
                  <tr>
                    ${exportableColumns
              .map((col) => `<td>${getPrintCellHtml(col)}</td>`)
              .join("")}
                  </tr>
                `;
        })
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
    if (!url?.trim()) return;

    window.open(url, "_blank");
  };

  const handleAttachmentDownload = async (filePath?: string) => {
    if (!filePath?.trim()) return;

    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error("File not found");
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
      console.error("Download Error:", error);
    }
  };
  return (
    <>
      <div className="create-scope">
        <div
          className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
        >
          <h3
            style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
            className="dash-board-text-count"
          >
            {title}
          </h3>
          {/* {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && ( */}
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
                    setIsCreateModel(true);
                  } else {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }
                }}
                tooltip={`Add ${is_support_ticket_flag ? "Task" : "Support Ticket"}`}
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

                      if (allTasks.length === 0) return;

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

                      if (allTasks.length === 0) return;

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

                      if (allTasks.length === 0) return;

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
          </div>
          {/* )} */}
        </div>

        <div
          className="report_card"
          style={{ height: "90vh", display: "block", flexDirection: "column" }}
        >
          <DataTable
            value={displayTasks}
            resizableColumns
            columnResizeMode="fit"
            className="custom-centered-table"
            tableStyle={{ tableLayout: "fixed", width: "100%" }}
            scrollable
            scrollHeight="90vh"
            virtualScrollerOptions={{
              itemSize: 52, // Approximate row height
              lazy: true,
              onLazyLoad: onVirtualScroller,
              loading: loading && isInitialLoad.current,
            }}
            filterDisplay="row"
            dataKey="id"
            loading={loading}
            onFilter={onFilter}
            filters={lazyFilters}
            onSort={onSort}
            sortField={sortField ?? undefined}
            sortOrder={sortOrder ?? undefined}
            sortMode="single"
            selection={selectedTasks}
            onSelectionChange={onSelectionChange}
            selectionMode="multiple"
            emptyMessage="No data found"
            footer={
              <div
                style={{
                  padding: "10px",
                  background: "#f8f9fa",
                  textAlign: "right",
                }}
              >
                Total Tasks: {filteredAndSortedData.length}{" "}
                {hasMore && "(loading more...)"}
              </div>
            }
          >
            {(!MobileFlag ||
              MobileFlag === undefined ||
              MobileFlag === null) && (
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem" }}
                  bodyStyle={{ textAlign: "center" }}
                />
              )}
            {visibleColumns.map((col) => (
              <Column
                key={col.key}
                field={col.key}
                header={col.header}
                sortable
                filter={col.key !== "id"}
                filterPlaceholder="Search"
                headerStyle={{ width: col.width || "150px", fontSize: "14px" }}
                bodyStyle={
                  col.key === "task_remark"
                    ? {
                        fontSize: "14px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }
                    : { fontSize: "14px" }
                }
                body={col.body}
              />
            ))}
          </DataTable>
        </div>

        {viewerOpen && imageViewData && (
          <ImageViewer
            image={imageViewData}
            onClose={() => setViewerOpen(false)}
          />
        )}
        {isOpenCreateModel && (
          <CreateTaskView
            show={isOpenCreateModel}
            onHide={() => onhideTaskModal()}
            // onHide={() => setIsCreateModel(false)}
            setTargetVsIncentiveList={setTargetVsIncentiveList}
            setLoading={setLoading}
            headerName={
              is_support_ticket_flag ? "Create Support Ticket" : "Create Task"
            }
            productToEdit={undefined}
            // selectedButton={selectedButton}
            // selectedStageStatusId={Number(selectedStageStatusId)}
            // selectedPriorityId={selectedPriorityId || undefined}
            // selectedButtonDue={selectedButtonDue}
            supportTicketFlag={is_support_ticket_flag}
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
            filtersToShow={[1, 4, 21, 5, 18]}
            pageId={1}
            stageandStatusOrderType={8}
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

export default AllTaskReportsView;
