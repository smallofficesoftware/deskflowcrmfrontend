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
import ImageViewer from "../../../../components/ImageViewer";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  TASK_ATTEECHMENT_VIEW,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
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

  const dynamicCustomColumns =
    displayTasks?.[0]?.customForm
      ?.filter((item: any) => item.data_type != 13)
      ?.map((item: any) => ({
        title: item.title,
        dataKey: `customForm_${item.id}`,
        id: item.id,
      })) || [];

  const exportColumns =
    is_support_ticket_flag == 0
      ? [
        { title: "Task ID", dataKey: "id" },
        { title: "Task Title", dataKey: "task_title" },
        { title: "Status", dataKey: "status_name" },
        { title: "Category", dataKey: "category_name" },
        { title: "Priority", dataKey: "priority_name" },
        { title: "Type", dataKey: "type_name" },
        { title: "Remark", dataKey: "task_remark" },
        { title: "Selected Days", dataKey: "selected_days_names" },
        { title: "From Date", dataKey: "task_fromdate" },
        { title: "End Date", dataKey: "task_enddate" },
        { title: "Created By", dataKey: "created_by_name" },
        { title: "Assigned To", dataKey: "assigned_team_member_names" },
        ...dynamicCustomColumns,
      ]
      : [
        { title: "Support Ticket ID", dataKey: "id" },
        { title: "Support Ticket Title", dataKey: "task_title" },
        { title: "Status", dataKey: "status_name" },
        ...(showExternalStatusColumn
          ? [
            {
              title: "External Status",
              dataKey: "external_status_name",
            },
          ]
          : []),
        { title: "Category", dataKey: "category_name" },
        { title: "Priority", dataKey: "priority_name" },
        { title: "Type", dataKey: "type_name" },
        { title: "Remark", dataKey: "task_remark" },
        { title: "Selected Days", dataKey: "selected_days_names" },
        { title: "From Date", dataKey: "task_fromdate" },
        { title: "End Date", dataKey: "task_enddate" },
        { title: "Created By", dataKey: "created_by_name" },
        { title: "Assigned To", dataKey: "assigned_team_member_names" },
        ...dynamicCustomColumns,
      ];

  const exportPdf = () => {
    const dataToExport =
      selectedTasks.length > 0 ? selectedTasks : filteredAndSortedData;
    const tableData = dataToExport.map((item) => {
      const customFields: any = {};

      item?.customForm?.forEach((cf: any) => {
        if (cf.data_type === 13) return;

        customFields[`customForm_${cf.id}`] = cf.value || "-";
      });

      return {
        id: item.id || "XXXXXXX",
        task_title: item.task_title || "-",
        status_name: item.status_name || "-",
        status_colour: item.status_colour || "#eeeeee",
        ...(showExternalStatusColumn && {
          external_status_name: item.external_status_name || "-",
          external_status_colour: item.external_status_colour || "#eeeeee",
        }),
        category_name: item.category_name || "-",
        priority_name: item.priority_name || "-",
        type_name: item.type_name || "-",
        task_remark: item.task_remark
          ? item.task_remark.replace(/<[^>]*>/g, "").trim() || "-"
          : "-",
        selected_days_names: Array.isArray(item.selected_days_names)
          ? item.selected_days_names.join(", ")
          : "-",
        task_fromdate: formatDateTime(item.task_fromdate),
        task_enddate: formatDateTime(item.task_enddate),
        created_by_name: item.created_by_name || "-",
        assigned_team_member_names: Array.isArray(
          item.assigned_team_member_names,
        )
          ? item.assigned_team_member_names.join(", ")
          : "-",
        ...customFields,
      };
    });

    if (tableData.length === 0) {
      const doc = new jsPDF({ orientation: "landscape", format: "a2" });
      doc.text("No data available to export", 10, 10);
      doc.save(`${title}_report_${new Date().getTime()}.pdf`);
      return;
    }

    const BADGE_COLUMNS = ["status_name", "external_status_name"];

    // ✅ Scale: white space hatane ke liye
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margins = 30;
    const usableWidth = pageWidth - margins;

    const totalFixedWidth =
      10 +
      38 +
      40 +
      70 +
      30 +
      15 +
      15 +
      40 +
      20 +
      28 +
      28 +
      28 +
      32 +
      dynamicCustomColumns.length * 30;

    const scale = usableWidth / totalFixedWidth;

    const COLUMN_CONFIG: Record<string, any> = {
      id: { cellWidth: 10 * scale, halign: "center" },
      task_title: { cellWidth: 38 * scale, overflow: "linebreak" },
      status_name: { cellWidth: 40 * scale, overflow: "linebreak" },
      external_status_name: { cellWidth: 70 * scale, overflow: "linebreak" },
      category_name: { cellWidth: 30 * scale, overflow: "linebreak" },
      priority_name: { cellWidth: 15 * scale, halign: "center" },
      type_name: { cellWidth: 15 * scale, halign: "center" },
      task_remark: { cellWidth: 40 * scale, overflow: "linebreak" },
      selected_days_names: { cellWidth: 20 * scale, overflow: "linebreak" },
      task_fromdate: { cellWidth: 28 * scale, halign: "center" },
      task_enddate: { cellWidth: 28 * scale, halign: "center" },
      created_by_name: { cellWidth: 28 * scale, overflow: "linebreak" },
      assigned_team_member_names: {
        cellWidth: 32 * scale,
        overflow: "linebreak",
      },
      ...Object.fromEntries(
        dynamicCustomColumns.map(
          (col: { dataKey: string; title: string; id: any }) => [
            col.dataKey,
            { cellWidth: 30 * scale, overflow: "linebreak" },
          ],
        ),
      ),
    };

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

      const idTitle =
        is_support_ticket_flag === 0 ? "Task ID" : "Support Ticket ID";
      const titleTitle =
        is_support_ticket_flag === 0 ? "Task Title" : "Support Ticket Title";

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
        const dynamicFields: any = {};

        item?.customForm?.forEach((cf: any) => {
          if (cf.data_type === 13) return;

          dynamicFields[cf.title] = cf.value || "-";
        });
        return {
          [idTitle]: item.id || "XXXXXXX",
          [titleTitle]: item.task_title || "-",
          Status: item.status_name || "-",
          ...(showExternalStatusColumn && {
            "External Status": item.external_status_name || "-",
          }),
          Category: item.category_name || "-",
          Priority: item.priority_name || "-",
          Type: item.type_name || "-",
          Remark: item.task_remark || "-",
          "Selected Days": Array.isArray(item.selected_days_names)
            ? item.selected_days_names.join(", ")
            : "-",
          "From Date": formatDateTime(item.task_fromdate),
          "End Date": formatDateTime(item.task_enddate),
          "Created By": item.created_by_name || "-",
          "Assigned To": Array.isArray(item.assigned_team_member_names)
            ? item.assigned_team_member_names.join(", ")
            : "-",

          // dynamic custom fields
          ...dynamicFields,
        };
      });
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 25 }));

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
              ${exportColumns.map((col) => `<th>${col.title}</th>`).join("")}
            </tr>
          </thead>

          <tbody>
            ${dataToExport
        .map((item) => {
          // =========================
          // Dynamic Custom Fields
          // =========================

          const customFields =
            item?.customForm
              ?.filter((cf: any) => cf.data_type !== 13)
              ?.map((cf: any) => `<td>${cf?.value || "-"}</td>`)
              .join("") || "";

          return `
                  <tr>
                    <td>${item.id || "XXXXXXX"}</td>

                    <td>${item.task_title || "-"}</td>

                    <td>
  <span 
    style="
      background:${item.status_colour || "#eeeeee"};
      padding:4px 8px;
      border-radius:12px;
      color:#fff;
      display:inline-block;
    "
  >  
    ${item.status_name || "-"}
  </span>
</td>
${showExternalStatusColumn
              ? `
<td>
  <span 
    style="
      background:${item.external_status_colour || "#eeeeee"};
      padding:4px 8px;
      border-radius:12px;
      color:#fff;
      display:inline-block;
    "
  >  
    ${item.external_status_name || "-"}
  </span>
</td>
`
              : ""
            }

                    <td>${item.category_name || "-"}</td>

                    <td>${item.priority_name || "-"}</td>

                    <td>${item.type_name || "-"}</td>

                    <td>${item.task_remark || "-"}</td>

                    <td>
                      ${Array.isArray(item.selected_days_names)
              ? item.selected_days_names.join(", ")
              : "-"
            }
                    </td>

                    <td>${formatDateTime(item.task_fromdate)}</td>

                    <td>${formatDateTime(item.task_enddate)}</td>

                    

                    <td>${item.created_by_name || "-"}</td>

                    <td>
                      ${Array.isArray(item.assigned_team_member_names)
              ? item.assigned_team_member_names.join(", ")
              : "-"
            }
                    </td>

                    ${customFields}
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
            <Column
              field="id"
              // IF flag is 0, show "Task ID", ELSE show "Support Ticket ID"
              header={
                is_support_ticket_flag === 0 ? (
                  <span>
                    Task <br /> ID
                  </span>
                ) : (
                  <span>
                    Support <br /> Ticket <br /> ID
                  </span>
                )
              }
              sortable
              headerStyle={{ width: "80px", fontSize: "14px" }}
              body={(rowData) => rowData.id || "-"}
            />
            <Column
              field="task_title"
              // IF flag is 0, show "Task Title", ELSE show "Support Ticket Title"
              header={
                is_support_ticket_flag === 0 ? (
                  <span>
                    Task <br /> Title
                  </span>
                ) : (
                  <span>
                    Support <br /> Ticket <br /> Title
                  </span>
                )
              }
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "130px", fontSize: "14px" }}
              body={(rowData) => rowData.task_title || "-"}
            />
            <Column
              field="status_name"
              header="Status"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "120px", fontSize: "14px" }}
              body={(rowData) => (
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
              )}
            />
            {showExternalStatusColumn && (
              <Column
                field="external_status_name"
                header="External Status"
                sortable
                filter
                filterPlaceholder="Search"
                headerStyle={{ width: "160px", fontSize: "14px" }}
                body={(rowData) => (
                  <span
                    style={{
                      backgroundColor:
                        rowData.external_status_colour || "#eeeeee",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  >
                    {rowData.external_status_name || "-"}
                  </span>
                )}
              />
            )}
            <Column
              field="category_name"
              header="Category"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "130px", fontSize: "14px" }}
              body={(rowData) => rowData.category_name || "-"}
            />
            <Column
              field="priority_name"
              header="Priority"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "100px", fontSize: "14px" }}
              body={(rowData) => rowData.priority_name || "-"}
            />
            <Column
              field="type_name"
              header="Type"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "100px", fontSize: "14px" }}
              body={(rowData) => rowData.type_name || "-"}
            />
            <Column
              field="task_remark"
              header="Remark"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "200px", fontSize: "14px" }}
              bodyStyle={{
                fontSize: "14px",
                whiteSpace: "normal",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
              body={(rowData) => (
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
              )}
            />
            <Column
              field="selected_days_names"
              header="Selected Days"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "130px", fontSize: "14px" }}
              body={(rowData) =>
                Array.isArray(rowData.selected_days_names)
                  ? rowData.selected_days_names.join(", ")
                  : "-"
              }
            />
            <Column
              field="task_fromdate"
              header="From Date"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "120px", fontSize: "14px" }}
              body={(rowData) => formatDateTime(rowData.task_fromdate)}
            />
            <Column
              field="task_enddate"
              header="End Date"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "120px", fontSize: "14px" }}
              body={(rowData) => formatDateTime(rowData.task_enddate)}
            />
            <Column
              field="created_by_name"
              header="Created By"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "130px", fontSize: "14px" }}
              body={(rowData) => rowData.created_by_name || "-"}
            />
            <Column
              field="assigned_team_member_names"
              header="Assigned To"
              sortable
              filter
              filterPlaceholder="Search"
              headerStyle={{ width: "160px", fontSize: "14px" }}
              body={(rowData) =>
                Array.isArray(rowData.assigned_team_member_names)
                  ? rowData.assigned_team_member_names.join(", ")
                  : "-"
              }
            />
            {displayTasks?.length > 0 &&
              displayTasks[0]?.customForm?.map((item: any, index: number) => (
                <Column
                  key={index}
                  field={`customForm_${item.id}`}
                  header={item.title}
                  sortable
                  filter
                  filterPlaceholder="Search"
                  headerStyle={{ width: "150px", fontSize: "14px" }}
                  body={(rowData) => {
                    const fieldData = rowData?.customForm?.find(
                      (cf: any) => cf.id === item.id,
                    );

                    const value = fieldData?.value;

                    // Empty value
                    if (value === null || value === undefined || value === "") {
                      return "-";
                    }

                    // Attachment field
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
                  }}
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
