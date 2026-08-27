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
import { PrimeReactProvider } from "primereact/api";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../../../../common/AppContext";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { truncateText, useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ImageViewer from "../../../../components/ImageViewer";
import CheckBoxModal from "../../../../components/model/CheckBoxModal";
import RadioButtonModal from "../../../../components/model/RadioButtonModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import EventLogs from "../../../../components/model/EventLogModel/EventLogsModel";
import TaskChatRightSide from "../../../right-side/task-chat/TaskChatRightSide";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
  MIN_WIDTH_FOR_TEXT,
  TASK_ATTEECHMENT_VIEW,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { useFeatureFlagStore } from "../../../../store/supportTicket/useSupportTicketFlag";
import {
  archiveTaskApi,
  complateTaskApi,
  CovertSupportTikcetToTaskApi,
  deleteTaskApi,
  fetchApiTask,
  fetchLabel,
  fetchStageStatusContact,
  fetchTaskCategoryForTask,
  ILabel,
  IStageStatus,
  ITaskCategory,
  ITaskView,
  unarchiveTaskApi,
  updateBulkSelectionActionPerformInTask,
  updateStageStatusRadioButton,
  updateStageStatusRadioButtonCustomer,
} from "../../../left-side/header/Setting/taskList/TaskListController";
import {
  fetchAllCompanyApi,
  fetchStageStatusApiCustomer,
  updateLabel,
  updateUserCheckBox,
} from "../../../right-side/task-chat/TaskChatRightController";
import { fetchLabelApi } from "../../../left-side/header/Setting/label/LabelController";
import { taskPriorityList, taskTypesList } from "../../../right-side/create-task/CreateTaskController";
import CreateTaskView from "../../../right-side/create-task/CreateTaskView";
import {
  exportTaskAndSupportTicketData,
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
    if (isNaN(date.getTime())) return String(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
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
  is_support_ticket_flag = 0,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IVisitReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<ITaskView[]>([]);
  const [displayTasks, setDisplayTasks] = useState<ITaskView[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<ITaskView[]>([]);
  const [selectedRow, setSelectedRow] = useState<ITaskView | null>(null);
  const op = useRef<OverlayPanel>(null);
  const { isTaskRightSideopen, setIsTaskRightSideOpen } = useContext(AppContext)!;
  const [isOpenTaskChatModel, setOpenTaskChatModel] = useState<boolean>(false);
  const [singleTaskData, setSingleTaskData] = useState<ITaskView | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  const [editTaskItem, setEditTaskItem] = useState<ITaskView | null>(null);
  const title = is_support_ticket_flag == 0 ? "All Task" : "All Support Ticket";
  const isInitialLoad = useRef(true);
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);

  // Filters State (Pills & Dropdowns)
  const [selectedButton, setSelectedButton] = useState<"all" | "my">("all");
  const [isDueTask, setIsDueTask] = useState(false);
  const [isUnreadTask, setIsUnreadTask] = useState(false);
  const [isArchivedTask, setIsArchivedTask] = useState(false);
  const [selectedStageStatusId, setSelectedStageStatusId] = useState<
    number | string | null | undefined
  >(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | null | undefined
  >(null);
  const [selectedPriorityId, setSelectedPriorityId] = useState<
    number | null | undefined
  >(null);
  const [selectedLabelId, setSelectedLabelId] = useState<
    number | string | null | undefined
  >(null);

  // Dropdown Open States
  const [isStageStatusDropdownOpen, setIsStageStatusDropdownOpen] = useState(false);
  const [isTaskCategoryDropdownOpen, setIsTaskCategoryDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [rowActionDropdownId, setRowActionDropdownId] = useState<number | null>(null);

  // Lists for Dropdowns
  const [stageStatusList, setStageStatusList] = useState<IStageStatus[]>([]);
  const [taskCategoryList, setTaskCategoryList] = useState<ITaskCategory[]>([]);
  const [labelList, setLabelList] = useState<ILabel[]>([]);
  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>([]);
  const [optionRadioButtonStatusCustomer, setOptionRadioButtonStatusCustomer] = useState<any[]>([]);
  const [optionsLabel, setOptionsLabel] = useState<any[]>([]);

  // Dynamic Counts
  const [taskCountGetAll, setTaskCountGetAll] = useState(0);
  const [taskCountGetMy, setTaskCountGetMy] = useState(0);
  const [taskCountGetDue, setTaskCountGetDue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Actions & Modals State
  const [activeTaskId, setActiveTaskId] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isArchiveTaskConfirmation, setIsArchiveTaskConfirmation] = useState(false);
  const [isUnArchiveTaskConfirmation, setIsUnArchiveTaskConfirmation] = useState(false);
  const [isConvertSupportTicketToTask, setIsConvertSupportTicketToTask] = useState(false);
  const [isTaskCompletedConfirmation, setIsTaskCompletedConfirmation] = useState(false);
  const [isReadUnreadConfirmation, setIsReadUnreadConfirmation] = useState<{
    show: boolean;
    type: "read" | "unread" | null;
  }>({
    show: false,
    type: null,
  });
  const [isStageAndStatusModalOpen, setIsStageAndStatusModalOpen] = useState(false);
  const [stageAndStatusData, setStageAndStatusData] = useState<{
    taskId?: number;
    referenceTable?: string;
  }>({});

  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] = useState(false);
  const [isModalAssignStatusVisibleCustomer, setIsModalAssignStatusVisibleCustomer] = useState(false);
  const [isModalAssignLabelVisible, setIsModalAssignLabelVisible] = useState(false);
  const [isModalAssignUserVisible, setIsModalAssignUserVisible] = useState(false);

  const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
  const [statusAssignContactIdCustomer, setStatusAssignContactIdCustomer] = useState<number>();
  const [statusAssignStatusId, setStatusAssignStatusId] = useState<number>();
  const [statusAssignStatusCustomerId, setStatusAssignStatusCustomerId] = useState<number>();
  const [userAssignTaskId, setUserAssignTaskId] = useState<number>();

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilters } = useCommonFilterStore();

  const filters = getFilter("alltask_report");
  const [isModalFilterVisible, setIsModalFilterVisible] = useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLButtonElement>(null);
  const categoryDropdownRef = useRef<HTMLButtonElement>(null);
  const priorityDropdownRef = useRef<HTMLButtonElement>(null);
  const labelDropdownRef = useRef<HTMLButtonElement>(null);
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const actionDropdownWrapperRef = useRef<HTMLDivElement>(null);
  const rowDropdownRefs = useRef<Record<number, HTMLUListElement | null>>({});

  const { flags } = useFeatureFlagStore();

  const selectedIds = useMemo(() => selectedTasks.map((t) => t.id), [selectedTasks]);
  const isAllSelected = useMemo(
    () => displayTasks.length > 0 && selectedIds.length === displayTasks.length,
    [selectedIds, displayTasks]
  );

  const selectedStageStatusObj = stageStatusList.find(
    (item) => item.id === selectedStageStatusId
  );
  const selectedLabelObj = labelList.find((item) => item.id === selectedLabelId);
  const selectedTaskCategoryObj = taskCategoryList.find(
    (item) => item.id === selectedCategoryId
  );

  // Load master dropdown options
  useEffect(() => {
    fetchStageStatusContact(setStageStatusList);
    fetchTaskCategoryForTask(setTaskCategoryList);
    fetchLabel(setLabelList);
    fetchAllCompanyApi(setOptionJoinCompany, setLoading);
  }, []);

  useEffect(() => {
    if (isModalAssignStatusVisible) {
      fetchStageStatusContact(setOptionRadioButtonStatus);
    }
    if (isModalAssignStatusVisibleCustomer) {
      fetchStageStatusApiCustomer(
        setOptionRadioButtonStatusCustomer,
        statusAssignStatusCustomerId
      );
    }
    if (isModalAssignLabelVisible) {
      fetchLabelApi(setOptionsLabel, setLoading);
    }
  }, [
    isModalAssignStatusVisible,
    isModalAssignStatusVisibleCustomer,
    isModalAssignLabelVisible,
    statusAssignStatusCustomerId,
  ]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(target)
    ) {
      setIsExportDropdownOpen(false);
    }

    if (
      statusDropdownRef.current &&
      !statusDropdownRef.current.contains(target) &&
      !target.closest(".status-dropdown-menu")
    ) {
      setIsStageStatusDropdownOpen(false);
    }

    if (
      categoryDropdownRef.current &&
      !categoryDropdownRef.current.contains(target) &&
      !target.closest(".category-dropdown-menu")
    ) {
      setIsTaskCategoryDropdownOpen(false);
    }

    if (
      priorityDropdownRef.current &&
      !priorityDropdownRef.current.contains(target) &&
      !target.closest(".priority-dropdown-menu")
    ) {
      setIsPriorityDropdownOpen(false);
    }

    if (
      labelDropdownRef.current &&
      !labelDropdownRef.current.contains(target) &&
      !target.closest(".label-dropdown-menu")
    ) {
      setIsLabelDropdownOpen(false);
    }

    if (
      actionDropdownWrapperRef.current &&
      !actionDropdownWrapperRef.current.contains(target)
    ) {
      setIsActionDropdownOpen(false);
    }

    if (!target.closest(".row-action-btn") && !target.closest(".row-action-menu")) {
      setRowActionDropdownId(null);
    }
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
    if (isExportDropdownOpen) {
      setIsExportDropdownOpen(false);
    } else if (isStageStatusDropdownOpen || isTaskCategoryDropdownOpen || isPriorityDropdownOpen || isLabelDropdownOpen || isActionDropdownOpen || rowActionDropdownId !== null || isModalFilterVisible || isTaskRightSideopen) {
      setIsStageStatusDropdownOpen(false);
      setIsTaskCategoryDropdownOpen(false);
      setIsPriorityDropdownOpen(false);
      setIsLabelDropdownOpen(false);
      setIsActionDropdownOpen(false);
      setRowActionDropdownId(null);
      setIsModalFilterVisible(false);
      setIsTaskRightSideOpen(false);
    } else {
      onHide?.();
    }
  });

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

  const canAdd = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.DELETE,
  );
  const canShare = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.PRINT,
  );
  const CanViewTaskChat = useCheckUserPermission(
    is_support_ticket_flag === 0
      ? PAGE_ID.TASK_MESSAGE_HISTORY
      : PAGE_ID.SUPPORT_TICKET_CHAT_HISTORY,
    PERMISSION_TYPE.VIEW,
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

  const loadTasks = useCallback(
    async (page: number = 0, limit: number = ITEMS_PER_PAGE, reset: boolean = false) => {
      if (isLoadingMore.current && !reset) return;
      if (!hasMore && !reset) return;

      setLoading(true);
      isLoadingMore.current = true;

      try {
        await fetchApiTask(
          (newData: ITaskView[]) => {
            if (newData.length < limit) {
              setHasMore(false);
            }
            if (reset || page === 0) {
              setAllTasks(newData);
            } else {
              setAllTasks((prev) => [...prev, ...newData]);
            }
            currentOffset.current = page * limit + newData.length;
          },
          setLoading,
          debouncedSearchText || globalSearch || "",
          selectedButton === "all" ? 1 : 2,
          isDueTask ? 3 : 0,
          isUnreadTask ? 1 : 0,
          selectedStageStatusId,
          selectedCategoryId,
          page,
          limit,
          selectedPriorityId,
          filters.startSearchDate,
          filters.endSearchDate,
          filters.checkedOptionsStageStatus,
          filters.assignedByMultiTeamMember || filters.checkedOptionsUser,
          filters.createdByMultiTeamMember,
          undefined,
          1,
          filters.checkedOptionsTaskassignOrNot,
          undefined,
          undefined,
          undefined,
          setTaskCountGetDue,
          setUnreadCount,
          isArchivedTask ? "1" : "0",
          filters.checkedOptionsTaskType,
          filters.checkedOptionsShowTemplateTask,
          is_support_ticket_flag,
          setTaskCountGetAll,
          setTaskCountGetMy,
          selectedLabelId,
          selectedContactId ? Number(selectedContactId) : 0,
          filters.checkedOptions,
          filters.labelwiseContactShowAndOrNot
        );
      } catch (err) {
        setHasMore(false);
      } finally {
        setLoading(false);
        isLoadingMore.current = false;
        isInitialLoad.current = false;
      }
    },
    [
      debouncedSearchText,
      globalSearch,
      selectedButton,
      isDueTask,
      isUnreadTask,
      selectedStageStatusId,
      selectedCategoryId,
      selectedPriorityId,
      selectedLabelId,
      isArchivedTask,
      filters,
      is_support_ticket_flag,
      selectedContactId,
    ]
  );

  // Reload data on filter/search change
  useEffect(() => {
    setAllTasks([]);
    setDisplayTasks([]);
    currentOffset.current = 0;
    isInitialLoad.current = true;
    setHasMore(true);
    loadTasks(0, ITEMS_PER_PAGE, true);
  }, [loadTasks]);

  const handleRefresh = async () => {
    currentOffset.current = 0;
    setHasMore(true);
    isInitialLoad.current = true;
    setAllTasks([]);
    setDisplayTasks([]);
    loadTasks(0, ITEMS_PER_PAGE, true);
  };

  const onhideTaskModal = () => {
    setIsCreateModel(false);
    setIsOpenEditModel(false);
    setEditTaskItem(null);
    loadTasks(0, ITEMS_PER_PAGE, true);
  };

  const onVirtualScroller = (event: any) => {
    if (event.last === allTasks.length && hasMore && !isLoadingMore.current) {
      const nextPage = Math.floor(allTasks.length / ITEMS_PER_PAGE);
      loadTasks(nextPage, ITEMS_PER_PAGE, false);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...allTasks];

    // Apply lazyFilters
    Object.entries(lazyFilters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        data = data.filter((item: any) => {
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

  const onSelectionChange = (event: { value: ITaskView[] }) => {
    setSelectedTasks(event.value);
  };

  const handleChangeImgViewer = (item: any) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  // Action modal openers
  const openDeleteModel = (id?: number) => {
    if (canDelete) {
      if (id) setActiveTaskId(id);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openCompleteTaskModel = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsTaskCompletedConfirmation(true);
  };

  const openArchiveTaskModel = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsArchiveTaskConfirmation(true);
  };

  const openUnArchiveTaskModel = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsUnArchiveTaskConfirmation(true);
  };

  const openSupportTicketToTaskConvert = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsConvertSupportTicketToTask(true);
  };

  const openStageAndStatusLog = (id?: number) => {
    setStageAndStatusData({
      taskId: id,
      referenceTable: "task_managements",
    });
    setIsStageAndStatusModalOpen(true);
  };

  const openReadModel = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsReadUnreadConfirmation({ show: true, type: "read" });
  };

  const openUnreadModel = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsReadUnreadConfirmation({ show: true, type: "unread" });
  };

  const handleModalOpenStatusAssign = (id?: number, taskStatus?: number) => {
    if (id) setStatusAssignContactId(id);
    if (taskStatus) setStatusAssignStatusId(taskStatus);
    setIsModalAssignStatusVisible(true);
  };

  const handleModalOpenStatusAssignCustomer = (id?: number, taskStatus?: number) => {
    if (id) setStatusAssignContactIdCustomer(id);
    if (taskStatus) setStatusAssignStatusCustomerId(taskStatus);
    setIsModalAssignStatusVisibleCustomer(true);
  };

  const handleModalOpenLabelAssign = (id?: number) => {
    if (id) setActiveTaskId(id);
    setIsModalAssignLabelVisible(true);
  };

  const handleModalOpenUserAssign = (id?: number) => {
    if (id) setUserAssignTaskId(id);
    setIsModalAssignUserVisible(true);
  };

  const handleEditTask = (item: ITaskView) => {
    setEditTaskItem(item);
    setIsOpenEditModel(true);
  };

  // Confirmation handlers
  const handleDeleteTask = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : activeTaskId;
    if (await deleteTaskApi(ids)) {
      loadTasks(0, ITEMS_PER_PAGE, true);
    }
    setIsDeleteConfirmation(false);
    setSelectedTasks([]);
  };

  const handleCompleteTask = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : activeTaskId;
    if (await complateTaskApi(ids)) {
      loadTasks(0, ITEMS_PER_PAGE, true);
    }
    setIsTaskCompletedConfirmation(false);
    setSelectedTasks([]);
  };

  const handleArchiveTask = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : activeTaskId;
    if (await archiveTaskApi(ids)) {
      loadTasks(0, ITEMS_PER_PAGE, true);
    }
    setIsArchiveTaskConfirmation(false);
    setSelectedTasks([]);
  };

  const handleUnArchiveTask = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : activeTaskId;
    if (await unarchiveTaskApi(ids)) {
      loadTasks(0, ITEMS_PER_PAGE, true);
    }
    setIsUnArchiveTaskConfirmation(false);
    setSelectedTasks([]);
  };

  const handleConvertSupportTicketToTask = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : activeTaskId;
    if (await CovertSupportTikcetToTaskApi(ids)) {
      loadTasks(0, ITEMS_PER_PAGE, true);
    }
    setIsConvertSupportTicketToTask(false);
    setSelectedTasks([]);
  };

  const handleReadUnreadTask = async () => {
    if (!isReadUnreadConfirmation.type) return;

    setLoading(true);
    let appliedTo: number | string | number[] | "all";

    if (isAllSelected) {
      appliedTo = "all";
    } else if (selectedIds.length > 0) {
      appliedTo = selectedIds;
    } else if (activeTaskId) {
      appliedTo = activeTaskId;
    } else {
      toast.error("No task selected");
      setIsReadUnreadConfirmation({ show: false, type: null });
      return;
    }

    const payload = {
      ...filters,
      statusFilter: filters.checkedOptionsStageStatus,
      startDate: filters.startSearchDate,
      endDate: filters.endSearchDate,
      labelFilter: filters.checkedOptions,
      searchTerm: debouncedSearchText,
      labelId: selectedLabelId,
      stageStatusId: selectedStageStatusId,
      taskFilter: selectedButton === "all" ? 1 : 2,
      dueFilter: isDueTask ? 3 : 0,
    };

    try {
      const response = await updateBulkSelectionActionPerformInTask(
        setLoading,
        payload,
        isReadUnreadConfirmation.type === "read" ? "0" : "1",
        appliedTo
      );

      if (response) {
        toast.success(
          isReadUnreadConfirmation.type === "read"
            ? "Marked as read successfully"
            : "Marked as unread successfully"
        );
        loadTasks(0, ITEMS_PER_PAGE, true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsReadUnreadConfirmation({ show: false, type: null });
      setLoading(false);
      setSelectedTasks([]);
    }
  };

  const OpenTaskchatRightSide = async (singleDataTask: ITaskView) => {
    if (!CanViewTaskChat) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    if (singleDataTask.is_unread === 1) {
      try {
        const payload = {
          ...filters.filterData,
          statusFilter: filters.checkedOptionsStageStatus,
          startDate: filters.startSearchDate,
          endDate: filters.endSearchDate,
          labelFilter: filters.checkedOptions,
          searchTerm: debouncedSearchText,
          labelId: selectedLabelId,
          stageStatusId: selectedStageStatusId,
          taskFilter: selectedButton === "all" ? 1 : 2,
          dueFilter: isDueTask ? 3 : 0,
        };

        await updateBulkSelectionActionPerformInTask(
          () => { },
          payload,
          "0",
          singleDataTask.id
        );

        setAllTasks((prev) =>
          prev.map((task) =>
            task.id === singleDataTask.id ? { ...task, is_unread: 0 } : task
          )
        );
        setDisplayTasks((prev) =>
          prev.map((task) =>
            task.id === singleDataTask.id ? { ...task, is_unread: 0 } : task
          )
        );
      } catch (error) {
        console.error("Failed to mark task as read:", error);
      }
    }

    setSingleTaskData(singleDataTask);
    setOpenTaskChatModel(true);
    setIsTaskRightSideOpen(true);
  };

  const handleConfirmRadioButtonStatus = async (selectedOption: any) => {
    const idsToUpdate = selectedIds.length > 0 ? selectedIds : statusAssignContactId;
    if (!idsToUpdate) return;

    await updateStageStatusRadioButton(idsToUpdate, selectedOption, setLoading);
    setIsModalAssignStatusVisible(false);
    setSelectedTasks([]);
    loadTasks(0, ITEMS_PER_PAGE, true);
  };

  const handleConfirmRadioButtonStatusCustomer = async (selectedOption: any) => {
    const idsToUpdate = selectedIds.length > 0 ? selectedIds : statusAssignContactIdCustomer;
    if (!idsToUpdate) return;

    await updateStageStatusRadioButtonCustomer(idsToUpdate, selectedOption, setLoading);
    setIsModalAssignStatusVisibleCustomer(false);
    setSelectedTasks([]);
    loadTasks(0, ITEMS_PER_PAGE, true);
  };

  const handleConfirmAssignLabel = async (
    contactId: number | undefined,
    checkedOptions: any[]
  ) => {
    const idsToUpdate = selectedIds.length > 0 ? selectedIds : (contactId || activeTaskId);
    if (!idsToUpdate) return;

    await updateLabel(idsToUpdate, checkedOptions, setLoading);
    setIsModalAssignLabelVisible(false);
    setSelectedTasks([]);
    loadTasks(0, ITEMS_PER_PAGE, true);
  };

  const handleConfirmAssignUser = async (
    contactId: number | undefined,
    checkedOptions: any[]
  ) => {
    const idsToUpdate = selectedIds.length > 0 ? selectedIds : (contactId || userAssignTaskId || activeTaskId);
    if (!idsToUpdate) return;

    await updateUserCheckBox(idsToUpdate, checkedOptions, setLoading);
    setIsModalAssignUserVisible(false);
    setSelectedTasks([]);
    loadTasks(0, ITEMS_PER_PAGE, true);
  };

  const showExternalStatusColumn =
    is_support_ticket_flag !== 0 &&
    displayTasks?.some((item) => Number(item?.external_status || 0) !== 0);

  type TaskColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    isAttachment?: boolean;
    body: (rowData: ITaskView) => React.ReactNode;
  };

  const baseColumnDefs: TaskColumnDef[] = useMemo(() => {
    const defs: TaskColumnDef[] = [
      {
        key: "action",
        label: "Actions",
        header: "",
        width: "50px",
        locked: true,
        body: (rowData) => (
          <Button
            icon="pi pi-cog"
            className="p-button-text p-0"
            style={{ color: "green", width: "24px", height: "24px" }}
            onClick={(e) => {
              setSelectedRow(rowData);
              op.current?.toggle(e);
              requestAnimationFrame(() => {
                const panel = op.current?.getElement();
                if (panel) panel.style.transform = "translate(40px, -25px)";
              });
            }}
          />
        ),
      },
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
        body: (rowData) => (
          <span
            style={{
              fontWeight: rowData.is_unread === 1 ? 600 : "normal",
              cursor: "pointer",
            }}
            onClick={() => OpenTaskchatRightSide(rowData)}
            title="Click to Open Chat"
          >
            #{rowData.id}
          </span>
        ),
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
        width: "140px",
        body: (rowData) => (
          <div
            className="d-flex align-items-center gap-1"
            style={{ cursor: "pointer" }}
            onClick={() => OpenTaskchatRightSide(rowData)}
            title="Click to Open Chat"
          >
            {rowData.is_unread === 1 && (
              <span
                style={{
                  display: "inline-block",
                  width: "9px",
                  height: "9px",
                  backgroundColor: "#ff4d4f",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontWeight: rowData.is_unread === 1 ? 600 : "normal",
                wordBreak: "break-word",
              }}
              title={rowData.task_title}
            >
              {rowData.task_title || "-"}
            </span>
          </div>
        ),
      },
      {
        key: "status_name",
        label: "Status",
        header: "Status",
        width: "130px",
        body: (rowData) => (
          <span
            style={{
              backgroundColor:
                rowData.stage_status_color || rowData.status_colour || "#eeeeee",
              padding: "4px 8px",
              borderRadius: "12px",
              color: "#fff",
              cursor: "pointer",
              display: "inline-block",
            }}
            onClick={() => handleModalOpenStatusAssign(rowData.id, rowData.status)}
            title="Click to Change Status"
          >
            {rowData.stage_status_name || rowData.status_name || "-"}
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
              backgroundColor:
                rowData.external_status_color || rowData.external_status_colour || "#eeeeee",
              padding: "4px 8px",
              borderRadius: "12px",
              color: "#fff",
              display: "inline-block",
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
        body: (rowData) => (
          rowData.category_name ? (
            <span
              className="badge rounded-pill text-white p-2"
              style={{
                backgroundColor: String(rowData.category_color_code || "#6c757d"),
              }}
            >
              {rowData.category_name}
            </span>
          ) : (
            "-"
          )
        ),
      },
      {
        key: "priority_name",
        label: "Priority",
        header: "Priority",
        width: "100px",
        body: (rowData) => {
          const priority = taskPriorityList.find(
            (item) => item.id === String(rowData.task_priority)
          );
          return priority?.mode_name || rowData.priority_name || "-";
        },
      },
      {
        key: "type_name",
        label: "Type",
        header: "Type",
        width: "100px",
        body: (rowData) => {
          const type = taskTypesList.find(
            (item) => item.id === String(rowData.task_type)
          );
          return type?.type_name || rowData.type_name || "-";
        },
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
            : rowData.selected_days_names || "-",
      },
      {
        key: "task_fromdate",
        label: "From Date",
        header: "From Date",
        width: "130px",
        body: (rowData) => formatDateTime(rowData.task_fromdate),
      },
      {
        key: "task_enddate",
        label: "End Date",
        header: "End Date",
        width: "130px",
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
            : rowData.assigned_team_member_names || "-",
      },
    );

    if (displayTasks?.length > 0 && displayTasks[0]?.customForm) {
      displayTasks[0].customForm.forEach((item: any) => {
        defs.push({
          key: `customForm_${item.id}`,
          label: item.title,
          header: item.title,
          width: item.data_type === 3 ? "220px" : "150px",
          isAttachment: item.data_type === 13,
          body: (rowData: any) => {
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

            if (fieldData?.data_type === 3) {
              return (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {value}
                </div>
              );
            }

            return value;
          },
        });
      });
    }

    return defs;
  }, [
    is_support_ticket_flag,
    showExternalStatusColumn,
    displayTasks,
    rowActionDropdownId,
    canEdit,
    flags.CUSTOMER_SUPPORT_TICKET_ASSING_ID,
  ]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("all_task_report", baseColumnDefs);

  const exportableColumns = visibleColumns.filter(
    (col) => !col.isAttachment && col.key !== "action"
  );

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
    item: any,
    mode: "pdf" | "excel" | "print",
  ): string => {
    switch (col.key) {
      case "id":
        return item.id ? String(item.id) : "XXXXXXX";
      case "task_title":
        return item.task_title || "-";
      case "status_name":
        return item.stage_status_name || item.status_name || "-";
      case "external_status_name":
        return item.external_status_name || "-";
      case "category_name":
        return item.category_name || "-";
      case "priority_name": {
        const priority = taskPriorityList.find(
          (p) => p.id === String(item.task_priority)
        );
        return priority?.mode_name || item.priority_name || "-";
      }
      case "type_name": {
        const type = taskTypesList.find((t) => t.id === String(item.task_type));
        return type?.type_name || item.type_name || "-";
      }
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
          : item.selected_days_names || "-";
      case "task_fromdate":
        return formatDateTime(item.task_fromdate);
      case "task_enddate":
        return formatDateTime(item.task_enddate);
      case "created_by_name":
        return item.created_by_name || "-";
      case "assigned_team_member_names":
        return Array.isArray(item.assigned_team_member_names)
          ? item.assigned_team_member_names.join(", ")
          : item.assigned_team_member_names || "-";
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
    const tableData = dataToExport.map((item: any) => {
      const rowData: any = {
        status_colour: item.stage_status_color || item.status_colour || "#eeeeee",
        external_status_colour:
          item.external_status_color || item.external_status_colour || "#eeeeee",
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
          if (!row) return;

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


  const exportExcel = async () => {
    try {
      setLoading(true);
      const dataToExport = selectedTasks.length > 0 ? selectedTasks : displayTasks;

      if (!dataToExport.length) {
        toast.warn("No data to export");
        return;
      }
      const exportData = dataToExport.map((item: any) => {
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
        .map((item: any) => {
          const getPrintCellHtml = (col: TaskColumnDef): string => {
            if (col.key === "status_name") {
              return `<span style="background:${item.stage_status_color || item.status_colour || "#eeeeee"};padding:4px 8px;border-radius:12px;color:#fff;display:inline-block;">${item.stage_status_name || item.status_name || "-"}</span>`;
            }
            if (col.key === "external_status_name") {
              return `<span style="background:${item.external_status_color || item.external_status_colour || "#eeeeee"};padding:4px 8px;border-radius:12px;color:#fff;display:inline-block;">${item.external_status_name || "-"}</span>`;
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
    <PrimeReactProvider value={{ hideOverlaysOnDocumentScrolling: true }}>
      <div className="create-scope">
        <div
          className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-2`}
        >
          <h3
            style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
            className="dash-board-text-count"
          >
            {title}
          </h3>

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
                  margin: "5px 0px"
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
                tooltip={`Add ${is_support_ticket_flag ? "Support Ticket" : "Task"}`}
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
        </div>

        {/* Top Filters & Pills Bar (Matching My Task - Image 1) */}
        <div
          className="d-flex align-items-center flex-wrap gap-1 mb-2"
          style={{ paddingLeft: "4px", paddingRight: "4px" }}
        >
          {selectedIds.length > 0 && (
            <span
              className="selected-btn rounded-5"
              style={{
                width: "fit-content",
                height: "fit-content",
                padding: "0.375rem 0.75rem",
              }}
            >
              <input
                type="checkbox"
                className="custom-checkbox mx-1"
                checked={isAllSelected}
                title="Select All Tasks"
                onChange={() => {
                  if (isAllSelected) {
                    setSelectedTasks([]);
                  } else {
                    setSelectedTasks([...displayTasks]);
                  }
                }}
              />
              <div
                className="position-relative d-inline-block ms-1 dropdown-end"
                ref={actionDropdownWrapperRef}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="border-0 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsActionDropdownOpen((prev) => !prev);
                  }}
                  disabled={selectedIds.length === 0}
                  title="Bulk Actions"
                >
                  <span className="contact-btn-search-text">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 19 20"
                      width="18px"
                      height="18px"
                    >
                      <path
                        fill="currentColor"
                        d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                      />
                    </svg>
                  </span>
                </button>
                {isActionDropdownOpen && (
                  <ul
                    className="labelDropLeft isVisible"
                    ref={actionDropdownRef}
                    style={{
                      position: "absolute",
                      left: -20,
                      minWidth: "220px",
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      zIndex: "1050",
                      maxHeight: "35vh",
                      overflowY: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        openDeleteModel();
                      }}
                    >
                      <i className="pi pi-trash me-2 text-danger" />
                      Delete Selected Tasks
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        openArchiveTaskModel();
                      }}
                    >
                      <i className="pi pi-inbox me-2" />
                      Archive Selected {is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        openUnArchiveTaskModel();
                      }}
                    >
                      <i className="pi pi-upload me-2" />
                      UnArchive Selected {is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        handleModalOpenUserAssign();
                      }}
                    >
                      <i className="pi pi-user-plus me-2" />
                      Assign to Team Member
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        handleModalOpenStatusAssign();
                      }}
                    >
                      <i className="pi pi-sync me-2" />
                      Change Status
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        openReadModel();
                      }}
                    >
                      <i className="pi pi-eye me-2" />
                      Mark as Read
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        openUnreadModel();
                      }}
                    >
                      <i className="pi pi-eye-slash me-2" />
                      Mark as Unread
                    </li>
                  </ul>
                )}
              </div>
            </span>
          )}

          {/* All Button */}
          <button
            className={`btn rounded-5 contact-btn-search fw_500 ${selectedButton === "all" ? "selected-btn active" : ""}`}
            onClick={() => setSelectedButton("all")}
          >
            <span className="contact-btn-search-text">All</span>
            <span
              className="badge bg-success ms-1"
              style={{
                fontSize: "0.65rem",
                lineHeight: "15px",
                borderRadius: "50%",
                minWidth: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {taskCountGetAll}
            </span>
          </button>

          {/* My Button */}
          <button
            className={`btn rounded-5 contact-btn-search fw_500 ${selectedButton === "my" ? "selected-btn active" : ""}`}
            onClick={() => setSelectedButton("my")}
          >
            <span className="contact-btn-search-text">My</span>
            <span
              className="badge ms-1"
              style={{
                fontSize: "0.65rem",
                lineHeight: "15px",
                borderRadius: "50%",
                minWidth: "20px",
                height: "20px",
                backgroundColor: "#0066FF",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {taskCountGetMy}
            </span>
          </button>

          {/* Due Button */}
          <button
            className={`btn rounded-5 contact-btn-search fw_500 ${isDueTask ? "selected-btn active" : ""}`}
            onClick={() => setIsDueTask((prev) => !prev)}
          >
            <span className="contact-btn-search-text">Due</span>
            <span
              className="badge bg-danger ms-1"
              style={{
                fontSize: "0.65rem",
                lineHeight: "15px",
                borderRadius: "50%",
                minWidth: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {taskCountGetDue}
            </span>
          </button>

          {/* Unread Button */}
          <button
            className={`btn rounded-5 contact-btn-search fw_500 ${isUnreadTask ? "selected-btn active" : ""}`}
            onClick={() => setIsUnreadTask((prev) => !prev)}
          >
            <span className="contact-btn-search-text">Unread</span>
            <span
              className="badge bg-danger ms-1"
              style={{
                fontSize: "0.65rem",
                lineHeight: "15px",
                borderRadius: "50%",
                minWidth: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {unreadCount}
            </span>
          </button>

          {/* Status Dropdown */}
          <div className="position-relative d-inline-block dropdown-end">
            <button
              className={`btn rounded-5 contact-btn-search fw_500 ${selectedStageStatusId ? "selected-btn" : ""}`}
              onClick={() => {
                setIsTaskCategoryDropdownOpen(false);
                setIsPriorityDropdownOpen(false);
                setIsLabelDropdownOpen(false);
                setIsActionDropdownOpen(false);
                setIsStageStatusDropdownOpen((prev) => !prev);
              }}
              ref={statusDropdownRef}
            >
              <span className="contact-btn-search-text">
                {selectedStageStatusObj ? selectedStageStatusObj.name : "Status"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18px"
                viewBox="0 -960 960 960"
                width="18px"
                fill="#3b4a54"
              >
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
            </button>
            {isStageStatusDropdownOpen && (
              <ul
                className="labelDropLeft isVisible status-dropdown-menu"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  minWidth: "140px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  zIndex: 1000,
                  maxHeight: "25vh",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <li
                  className="listItem-contact-tabs"
                  role="button"
                  onClick={() => {
                    setSelectedStageStatusId(null);
                    setIsStageStatusDropdownOpen(false);
                  }}
                  style={{ padding: "6px 10px", cursor: "pointer" }}
                >
                  All Statuses
                </li>
                {stageStatusList.map((item) => (
                  <li
                    key={item.id}
                    className="listItem-contact-tabs"
                    role="button"
                    onClick={() => {
                      setSelectedStageStatusId((prev) =>
                        prev === item.id ? null : item.id
                      );
                      setIsStageStatusDropdownOpen(false);
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 10px",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: item.color || "transparent",
                        flexShrink: 0,
                        marginRight: "8px",
                      }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="position-relative d-inline-block dropdown-end">
            <button
              className={`btn rounded-5 contact-btn-search fw_500 ${selectedCategoryId ? "selected-btn" : ""}`}
              onClick={() => {
                setIsStageStatusDropdownOpen(false);
                setIsPriorityDropdownOpen(false);
                setIsLabelDropdownOpen(false);
                setIsActionDropdownOpen(false);
                setIsTaskCategoryDropdownOpen((prev) => !prev);
              }}
              ref={categoryDropdownRef}
            >
              <span className="contact-btn-search-text">
                {selectedTaskCategoryObj
                  ? selectedTaskCategoryObj.task_category_name
                  : "Category"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18px"
                viewBox="0 -960 960 960"
                width="18px"
                fill="#3b4a54"
              >
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
            </button>
            {isTaskCategoryDropdownOpen && (
              <ul
                className="labelDropLeft isVisible category-dropdown-menu"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  minWidth: "140px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  zIndex: 1000,
                  maxHeight: "25vh",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <li
                  className="listItem-contact-tabs"
                  role="button"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setIsTaskCategoryDropdownOpen(false);
                  }}
                  style={{ padding: "6px 10px", cursor: "pointer" }}
                >
                  All Categories
                </li>
                {taskCategoryList.map((item) => (
                  <li
                    key={item.id}
                    className="listItem-contact-tabs"
                    role="button"
                    onClick={() => {
                      setSelectedCategoryId((prev) =>
                        prev === item.id ? null : item.id
                      );
                      setIsTaskCategoryDropdownOpen(false);
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 10px",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: item.task_color || "transparent",
                        flexShrink: 0,
                        marginRight: "8px",
                      }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                      title={item.task_category_name}
                    >
                      {item.task_category_name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="position-relative d-inline-block dropdown-end">
            <button
              className={`btn rounded-5 contact-btn-search fw_500 ${selectedPriorityId ? "selected-btn" : ""}`}
              onClick={() => {
                setIsStageStatusDropdownOpen(false);
                setIsTaskCategoryDropdownOpen(false);
                setIsLabelDropdownOpen(false);
                setIsActionDropdownOpen(false);
                setIsPriorityDropdownOpen((prev) => !prev);
              }}
              ref={priorityDropdownRef}
            >
              <span className="contact-btn-search-text">
                {taskPriorityList.find(
                  (item) => item.id === selectedPriorityId?.toString()
                )?.mode_name || "Priority"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18px"
                viewBox="0 -960 960 960"
                width="18px"
                fill="#3b4a54"
              >
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
            </button>
            {isPriorityDropdownOpen && (
              <ul
                className="labelDropLeft isVisible priority-dropdown-menu"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  minWidth: "130px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  zIndex: 1000,
                  maxHeight: "25vh",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <li
                  className="listItem-contact-tabs"
                  role="button"
                  onClick={() => {
                    setSelectedPriorityId(null);
                    setIsPriorityDropdownOpen(false);
                  }}
                  style={{ padding: "6px 10px", cursor: "pointer" }}
                >
                  All Priorities
                </li>
                {taskPriorityList.map((item) => (
                  <li
                    key={item.id}
                    className="listItem-contact-tabs"
                    role="button"
                    onClick={() => {
                      const newPriorityId = parseInt(item.id);
                      setSelectedPriorityId((prev) =>
                        prev === newPriorityId ? null : newPriorityId
                      );
                      setIsPriorityDropdownOpen(false);
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 10px",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: item.color || "transparent",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    />
                    <span>{item.mode_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Label Dropdown */}
          <div className="position-relative d-inline-block dropdown-end">
            <button
              className={`btn rounded-5 contact-btn-search fw_500 ${selectedLabelId ? "selected-btn" : ""}`}
              onClick={() => {
                setIsStageStatusDropdownOpen(false);
                setIsTaskCategoryDropdownOpen(false);
                setIsPriorityDropdownOpen(false);
                setIsActionDropdownOpen(false);
                setIsLabelDropdownOpen((prev) => !prev);
              }}
              ref={labelDropdownRef}
            >
              <span className="contact-btn-search-text">
                {selectedLabelObj ? selectedLabelObj.lable_name : "Label"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18px"
                viewBox="0 -960 960 960"
                width="18px"
                fill="#3b4a54"
              >
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
            </button>
            {isLabelDropdownOpen && (
              <ul
                className="labelDropLeft isVisible label-dropdown-menu"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  minWidth: "140px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  zIndex: 1000,
                  maxHeight: "25vh",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <li
                  className="listItem-contact-tabs"
                  role="button"
                  onClick={() => {
                    setSelectedLabelId(null);
                    setIsLabelDropdownOpen(false);
                  }}
                  style={{ padding: "6px 10px", cursor: "pointer" }}
                >
                  All Labels
                </li>
                {labelList.map((item) => (
                  <li
                    key={item.id}
                    className="listItem-contact-tabs"
                    role="button"
                    onClick={() => {
                      setSelectedLabelId((prev) =>
                        prev === item.id ? null : item.id
                      );
                      setIsLabelDropdownOpen(false);
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 10px",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: item.color || "transparent",
                        flexShrink: 0,
                        marginRight: "8px",
                      }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                      title={item.lable_name}
                    >
                      {item.lable_name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Archived Button */}
          <div className="position-relative d-inline-block dropdown-end">
            <button
              className={`btn rounded-5 contact-btn-search fw_500 ${isArchivedTask ? "selected-btn active" : ""}`}
              onClick={() => setIsArchivedTask((prev) => !prev)}
            >
              <span className="contact-btn-search-text">Archived</span>
            </button>
          </div>
        </div>

        <AppliedFilterBar
          summary={filters.appliedFilterSummary}
          dateRange={filters.selectedDateArray}
          startDate={filters.startSearchDate}
          endDate={filters.endSearchDate}
        />

        <div
          className="report_card"
          style={{ height: "82vh", display: "block", flexDirection: "column" }}
        >
          <DataTable
            value={displayTasks}
            resizableColumns
            columnResizeMode="fit"
            className="custom-centered-table"
            tableStyle={{ tableLayout: "fixed", width: "100%" }}
            scrollable
            scrollHeight="82vh"
            virtualScrollerOptions={{
              itemSize: 52,
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
                sortable={col.key !== "action"}
                filter={col.key !== "id" && col.key !== "action"}
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

        {/* Row Actions OverlayPanel */}
        <OverlayPanel ref={op} className="action-overlay">
          {selectedRow && (
            <ul className="list-unstyled m-0 p-0" id="dropLeft">
              <li
                className="listItem text-start"
                style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  op.current?.hide();
                  OpenTaskchatRightSide(selectedRow);
                }}
              >
                <i className="pi pi-comments me-2" />
                Chat History
              </li>
              {canEdit && (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    handleEditTask(selectedRow);
                  }}
                >
                  <i className="pi pi-pencil me-2" />
                  Edit
                </li>
              )}

              <li
                className="listItem text-start"
                style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  op.current?.hide();
                  handleModalOpenStatusAssign(selectedRow.id, selectedRow.status);
                }}
              >
                <i className="pi pi-sync me-2" />
                Change Status
              </li>

              {selectedRow.is_unread === 1 ? (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    openReadModel(selectedRow.id);
                  }}
                >
                  <i className="pi pi-eye me-2" />
                  Mark as Read
                </li>
              ) : (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    openUnreadModel(selectedRow.id);
                  }}
                >
                  <i className="pi pi-eye-slash me-2" />
                  Mark as Unread
                </li>
              )}

              {is_support_ticket_flag == 1 && flags.CUSTOMER_SUPPORT_TICKET_ASSING_ID && (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    handleModalOpenStatusAssignCustomer(selectedRow.id, selectedRow.external_status);
                  }}
                >
                  <i className="pi pi-external-link me-2" />
                  Change External Status
                </li>
              )}

              <li
                className="listItem text-start"
                style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  op.current?.hide();
                  handleModalOpenLabelAssign(selectedRow.id);
                }}
              >
                <i className="pi pi-tag me-2" />
                Assign label
              </li>

              {selectedRow?.team_task_assignement_type != "2" && (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    handleModalOpenUserAssign(selectedRow.id);
                  }}
                >
                  <i className="pi pi-user-plus me-2" />
                  Assign Team Member
                </li>
              )}

              {selectedRow?.is_archive == 0 ? (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    openArchiveTaskModel(selectedRow.id);
                  }}
                >
                  <i className="pi pi-inbox me-2" />
                  Archive {is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}
                </li>
              ) : (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    openUnArchiveTaskModel(selectedRow.id);
                  }}
                >
                  <i className="pi pi-upload me-2" />
                  UnArchive {is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}
                </li>
              )}

              {is_support_ticket_flag == 1 && (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    openSupportTicketToTaskConvert(selectedRow.id);
                  }}
                >
                  <i className="pi pi-arrow-right-arrow-left me-2" />
                  Convert To Task
                </li>
              )}

              {selectedRow?.is_archive == 0 && (
                <li
                  className="listItem text-start"
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    op.current?.hide();
                    openStageAndStatusLog(selectedRow.id);
                  }}
                >
                  <i className="pi pi-history me-2" />
                  Timeline
                </li>
              )}

              <li
                className="listItem text-start"
                style={{
                  color: "red",
                  fontWeight: 600,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  op.current?.hide();
                  openDeleteModel(selectedRow.id);
                }}
              >
                <i className="pi pi-trash me-2" />
                Delete
              </li>
            </ul>
          )}
        </OverlayPanel>

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
            setTargetVsIncentiveList={setAllTasks}
            setLoading={setLoading}
            headerName={
              is_support_ticket_flag ? "Create Support Ticket" : "Create Task"
            }
            productToEdit={undefined}
            selectedButton={selectedButton}
            selectedStageStatusId={Number(selectedStageStatusId) || undefined}
            selectedPriorityId={selectedPriorityId || undefined}
            selectedButtonDue={isDueTask ? "due" : ""}
            supportTicketFlag={is_support_ticket_flag}
          />
        )}

        {isOpenEditModel && editTaskItem && (
          <CreateTaskView
            show={isOpenEditModel}
            onHide={() => onhideTaskModal()}
            productToEdit={editTaskItem.id}
            headerName={
              is_support_ticket_flag ? "Edit Support Ticket" : "Edit Task"
            }
            setTargetVsIncentiveList={setAllTasks}
            setLoading={setLoading}
            selectedButton={selectedButton}
            selectedStageStatusId={Number(selectedStageStatusId) || undefined}
            selectedPriorityId={selectedPriorityId || undefined}
            selectedButtonDue={isDueTask ? "due" : ""}
            supportTicketFlag={is_support_ticket_flag}
          />
        )}

        {isModalFilterVisible && (
          <CheckBoxFilterModal
            show={isModalFilterVisible}
            onHide={() => setIsModalFilterVisible(false)}
            handleSubmit={handleApplyFilters}
            title={
              is_support_ticket_flag == 0
                ? "Filter your Task"
                : "Filter your Support Ticket"
            }
            message="Please select the Dates , Status And Team Member."
            btn1="Clear"
            btn2="Apply"
            filtersToShow={[1, 4, 10, 9, 11, 12, 21, 2]}
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
            initialCheckedOptions={filters.checkedOptions || []}
            initialStartSearchDate={filters.startSearchDate}
            initialEndSearchDate={filters.endSearchDate}
            initialCheckedOptionsStageStatus={filters.checkedOptionsStageStatus || []}
            initialCheckedOptionsTaskType={filters.checkedOptionsTaskType || []}
            initialCheckedAssignedByMultiTeamMember={
              filters.assignedByMultiTeamMember || filters.checkedOptionsUser || []
            }
            initialCheckedCreatedByMultiTeamMember={
              filters.createdByMultiTeamMember || []
            }
            initialCheckedOptionsTaskAssignOrnot={
              filters.checkedOptionsTaskassignOrNot || []
            }
            initialCheckedOptionsShowTaskTemplate={
              filters.checkedOptionsShowTemplateTask || []
            }
            labelFilderApplyAndOr={filters.labelwiseContactShowAndOrNot || 0}
          />
        )}

        {/* Change Status Modal (Internal) */}
        {isModalAssignStatusVisible && (
          <RadioButtonModal
            show={isModalAssignStatusVisible}
            onHide={() => setIsModalAssignStatusVisible(false)}
            handleSubmit={handleConfirmRadioButtonStatus}
            title={`Change Status for ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
            message={`Please select the Status for this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
            btn1="Cancel"
            btn2="Submit"
            options={optionRadioButtonStatus}
            selectedLabelIds={
              allTasks.find((item) => item.id === statusAssignContactId)?.status
            }
            getOptionColor={(option: any) => option.color || "#eeeeee"}
            getOptionName={(option: any) => option.name}
            showColorBadge={true}
            contactId={statusAssignContactId}
          />
        )}

        {/* Change External Status Modal (Customer/Support Ticket) */}
        {isModalAssignStatusVisibleCustomer && (
          <RadioButtonModal
            show={isModalAssignStatusVisibleCustomer}
            onHide={() => setIsModalAssignStatusVisibleCustomer(false)}
            handleSubmit={handleConfirmRadioButtonStatusCustomer}
            title={`Change External Status for ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
            message={`Please select the External Status for this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
            btn1="Cancel"
            btn2="Submit"
            options={optionRadioButtonStatusCustomer}
            selectedLabelIds={
              allTasks.find((item) => item.id === statusAssignContactIdCustomer)
                ?.external_status
            }
            getOptionColor={(option: any) => option.color || "#eeeeee"}
            getOptionName={(option: any) => option.name}
            showColorBadge={true}
            contactId={statusAssignContactIdCustomer}
          />
        )}

        {/* Assign Label Modal */}
        {isModalAssignLabelVisible && (
          <CheckBoxModal
            show={isModalAssignLabelVisible}
            onHide={() => setIsModalAssignLabelVisible(false)}
            handleSubmit={handleConfirmAssignLabel}
            title="Assign your Label"
            message="Please select the Labels for this Task"
            btn1="Cancel"
            btn2="Submit"
            options={optionsLabel}
            selectedLabelIds={
              String(allTasks.find((item) => item.id === activeTaskId)?.label_id || "")
            }
            contactId={activeTaskId}
            getOptionColor={(option: any) => option.color || "#eeeeee"}
            getOptionName={(option: any) => option.lable_name}
            showColorBadge={true}
          />
        )}

        {/* Assign User / Team Member Modal */}
        {isModalAssignUserVisible && (
          <CheckBoxModal
            show={isModalAssignUserVisible}
            onHide={() => setIsModalAssignUserVisible(false)}
            handleSubmit={handleConfirmAssignUser}
            title="Assign your User"
            message="Please select the Users for this Task"
            btn1="Cancel"
            btn2="Submit"
            options={optionJoinCompany}
            selectedLabelIds={
              String(allTasks.find((item) => item.id === (userAssignTaskId || activeTaskId))
                ?.assigned_team_member || "")
            }
            contactId={userAssignTaskId || activeTaskId}
            getOptionName={(option: any) => option.username || option.name}
            showColorBadge={false}
          />
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmation && (
          <ConfirmationModal
            show={isDeleteConfirmation}
            onHide={() => setIsDeleteConfirmation(false)}
            handleSubmit={handleDeleteTask}
            title={
              selectedIds.length > 0
                ? `Delete ${selectedIds.length} ${is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}`
                : `Delete this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`
            }
            message={
              selectedIds.length > 0
                ? `Are you sure you want to delete ${selectedIds.length} ${is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}?`
                : `Are you sure you want to delete this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}?`
            }
            btn1="CANCEL"
            btn2={`Delete ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
          />
        )}

        {/* Complete Task Confirmation Modal */}
        {isTaskCompletedConfirmation && (
          <ConfirmationModal
            show={isTaskCompletedConfirmation}
            onHide={() => setIsTaskCompletedConfirmation(false)}
            handleSubmit={handleCompleteTask}
            title={
              selectedIds.length > 0
                ? `Complete ${selectedIds.length} Tasks`
                : "Complete this Task"
            }
            message={
              selectedIds.length > 0
                ? `Are you sure you want to mark ${selectedIds.length} tasks as completed?`
                : "Are you sure you want to mark this task as completed?"
            }
            btn1="CANCEL"
            btn2="Complete Task"
          />
        )}

        {/* Archive Task Confirmation Modal */}
        {isArchiveTaskConfirmation && (
          <ConfirmationModal
            show={isArchiveTaskConfirmation}
            onHide={() => setIsArchiveTaskConfirmation(false)}
            handleSubmit={handleArchiveTask}
            title={
              selectedIds.length > 0
                ? `Archive ${selectedIds.length} ${is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}`
                : `Archive this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`
            }
            message={
              selectedIds.length > 0
                ? `Are you sure you want to archive ${selectedIds.length} ${is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}?`
                : `Are you sure you want to archive this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}?`
            }
            btn1="CANCEL"
            btn2={`Archive ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
          />
        )}

        {/* UnArchive Task Confirmation Modal */}
        {isUnArchiveTaskConfirmation && (
          <ConfirmationModal
            show={isUnArchiveTaskConfirmation}
            onHide={() => setIsUnArchiveTaskConfirmation(false)}
            handleSubmit={handleUnArchiveTask}
            title={
              selectedIds.length > 0
                ? `UnArchive ${selectedIds.length} ${is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}`
                : `UnArchive this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`
            }
            message={
              selectedIds.length > 0
                ? `Are you sure you want to unarchive ${selectedIds.length} ${is_support_ticket_flag == 0 ? "Tasks" : "Support Tickets"}?`
                : `Are you sure you want to unarchive this ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}?`
            }
            btn1="CANCEL"
            btn2={`UnArchive ${is_support_ticket_flag == 0 ? "Task" : "Support Ticket"}`}
          />
        )}

        {/* Convert Support Ticket to Task Modal */}
        {isConvertSupportTicketToTask && (
          <ConfirmationModal
            show={isConvertSupportTicketToTask}
            onHide={() => setIsConvertSupportTicketToTask(false)}
            handleSubmit={handleConvertSupportTicketToTask}
            title={
              selectedIds.length > 0
                ? `Convert ${selectedIds.length} Support Tickets to Tasks`
                : "Convert Support Ticket to Task"
            }
            message={
              selectedIds.length > 0
                ? `Are you sure you want to convert ${selectedIds.length} Support Tickets to Tasks?`
                : "Are you sure you want to convert this Support Ticket to a Task?"
            }
            btn1="CANCEL"
            btn2="Convert to Task"
          />
        )}

        {/* Read / Unread Confirmation Modal */}
        {isReadUnreadConfirmation.show && (
          <ConfirmationModal
            show={isReadUnreadConfirmation.show}
            onHide={() => setIsReadUnreadConfirmation({ show: false, type: null })}
            handleSubmit={handleReadUnreadTask}
            title={
              isReadUnreadConfirmation.type === "read"
                ? "Mark as Read"
                : "Mark as Unread"
            }
            message={
              isReadUnreadConfirmation.type === "read"
                ? `Are you sure you want to mark ${selectedIds.length > 0 ? `${selectedIds.length} selected items` : "this item"} as read?`
                : `Are you sure you want to mark ${selectedIds.length > 0 ? `${selectedIds.length} selected items` : "this item"} as unread?`
            }
            btn1="CANCEL"
            btn2={
              isReadUnreadConfirmation.type === "read"
                ? "Mark as Read"
                : "Mark as Unread"
            }
          />
        )}

        {/* Timeline / EventLogs Modal */}
        {isStageAndStatusModalOpen && (
          <EventLogs
            show={isStageAndStatusModalOpen}
            onHide={() => setIsStageAndStatusModalOpen(false)}
            reference_id={stageAndStatusData?.taskId}
            reference_table={stageAndStatusData?.referenceTable}
            requiredTabs={["status_timeline"]}
          />
        )}

        {/* Right Side Chat Drawer */}
        {isOpenTaskChatModel && isTaskRightSideopen && singleTaskData && (
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
            <TaskChatRightSide
              showTaskChat={() => setOpenTaskChatModel(true)}
              onHideTaskChat={() => {
                setOpenTaskChatModel(false);
                setIsTaskRightSideOpen(false);
              }}
              TaskData={allTasks as any}
              signleDataTask={singleTaskData}
              setRefreshTask={() => loadTasks(0, ITEMS_PER_PAGE, true)}
              closeDashboard={() => { }}
              openTaskRight={OpenTaskchatRightSide}
              supportTicketFlag={is_support_ticket_flag}
            />
          </div>
        )}
      </div>
    </PrimeReactProvider>
  );
};

export default AllTaskReportsView;
