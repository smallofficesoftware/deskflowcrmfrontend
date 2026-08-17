import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import { truncateText, useEscapeKey } from "../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../components/model/CheckBoxFilterModal";
import CheckBoxModal from "../../../components/model/CheckBoxModal";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import EventLogs from "../../../components/model/EventLogModel/EventLogsModel";
import KanbanBoard from "../../../components/model/KanbanBoard";
import RadioButtonModal from "../../../components/model/RadioButtonModal";
import { useTheme } from "../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, ITEMS_PER_PAGE, MIN_WIDTH_FOR_TEXT } from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IFilterData, IFilterPayload, TFilterDate } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { fetchLabelApi } from "../../left-side/header/Setting/label/LabelController";
import { archiveTaskApi, complateTaskApi, CovertSupportTikcetToTaskApi, deleteTaskApi, fetchLabel, fetchStageStatusContact, fetchTaskCategoryForTask, unarchiveTaskApi } from "../../left-side/header/Setting/taskList/TaskListController";
import { fetchDepartmentsApi } from "../../left-side/list-company/EditTeamMemberController";
import { taskPriorityList } from "../create-task/CreateTaskController";
import CreateTaskView from "../create-task/CreateTaskView";
import { fetchAllCompanyApi, fetchStageStatusApi, updateLabel, updateStageStatusRadioButton, updateUserCheckBox } from "../task-chat/TaskChatRightController";
import { fetchApiTask, ILabel, IStageStatus, ITaskCategory, ITaskView } from "./ContactTaskListController";

interface IPropsTaskManagementView {
    isTaskManagementView: boolean;
    closeTaskManagementView: () => void;
    supportTicketFlag: number;
    contactId?: number;
    contactName?: string;
    onSelectTask?: (task: ITaskView) => void;
    selectedTaskId?: number;
}

export interface FilterParams {
    filterData: IFilterData | null;
    checkedOptions: any[];
    startSearchDate: TFilterDate;
    endSearchDate: TFilterDate;
    checkedOptionsStageStatus: any[];
    assignedByMultiTeamMember?: any[];
    createdByMultiTeamMember?: any[];
    checkedOptionsTaskassignOrNot: any[];
    checkedOptionsTaskType: any[];
    checkedOptionsShowTemplateTask: any[];
}

const ContactTaskListView = ({
    isTaskManagementView,
    closeTaskManagementView,
    supportTicketFlag,
    contactId,
    contactName,
    onSelectTask,
    selectedTaskId
}: IPropsTaskManagementView) => {
    const { setShowRightSide } =
        useContext(AppContext)!;
    const [taskList, setTaskList] = useState<
        ITaskView[]
    >([]);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {},
    );

    const priorityDropdownRef = useRef<HTMLButtonElement>(null);

    const statusDropdownRef = useRef<HTMLButtonElement>(null);
    const labelDropdownRef = useRef<HTMLButtonElement>(null);
    const categoryDropdownRef = useRef<HTMLButtonElement>(null);
    const [refreshTaskBothSide, setRefreshTaskBothSide] = useState(false);
    const [isKanbanViewDisplay, setIsKanbanViewDisplay] =
        useState<boolean>(false);
    const listInnerRef = useRef<HTMLDivElement>(null); // Ref for scrollable container
    const isInitialMount = useRef<boolean>(true);

    const [targetVsIncenTiveDropdown, setTargetVsIncentiveDropdown] =
        useState<any>(null);
    const [hasIdAvail, setHasIdAvail] = useState<number>();
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [isTaskComplatedConfirmation, setIsTaskComplatedConfirmation] =
        useState(false);
    const [isOpenCreateModel, setIsCreateModel] = useState(false);
    const [isOpenEditModel, setIsOpenEditModel] = useState(false);
    const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
        useState<boolean>(false);
    const [isModalAssignLabelVisible, setIsModalAssignLabelVisible] =
        useState<boolean>(false);
    const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
    const [statusAssignStatusId, setStatusAssignStatusId] = useState<number>();
    const [stageStatusList, setStageStatusList] = useState<IStageStatus[]>([]);
    const [labelList, setLabelList] = useState<ILabel[]>([]);
    const [loading, setLoading] = useState(false);
    const { darkMode } = useTheme();
    const [editTargetVsIncentiveItem, setEditTargetVsIncentiveItem] =
        useState<ITaskView>();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
        null,
    );
    const [refreshProduct, setRefreshProduct] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedButton, setSelectedButton] = useState<"all" | "my">("my");
    const [selectedButtonDue, setSelectedDue] = useState("");
    const [isStageStatusDropdownOpen, setIsStageStatusDropdownOpen] =
        useState(false);
    const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [selectedStageStatusId, setSelectedStageStatusId] = useState<
        number | string | undefined | null
    >(null);

    const [selectedLabelId, setSelectedLabelId] = useState<
        number | string | undefined | null
    >(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    /* open Right Side Task Chat States */
    const [isOpenTaskChatModel, setOpenTaskChatModel] = useState(false);
    // const [GetSingleTaskData, setGetSingleTaskData] = useState<number | null>(null);
    const [GetSingleTaskData, setGetSingleTaskData] = useState<ITaskView>();
    const [showDashBoard, setshowDashBoard] = useState(false);

    //priority filter
    const [selectedPriorityId, setSelectedPriorityId] = useState<
        number | null | undefined
    >(undefined);
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [selectedCategoryId, setSelecteCategoryId] = useState<
        number | null | undefined
    >(null);
    const [isTaskCategoryDropdownOpen, setIsTaskCategoryDropdownOpen] =
        useState(false);

    const [taskCategoryList, settaskCategoryList] = useState<ITaskCategory[]>([]);
    // common filter
    const [hasData, setHasData] = useState<boolean>(false);
    const [isModalFilterVisible, setIsModalFilterVisible] =
        useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    const [filterParams, setFilterParams] = useState<FilterParams>({
        filterData: null,
        checkedOptions: [],
        startSearchDate: null,
        endSearchDate: null,
        checkedOptionsStageStatus: [],
        assignedByMultiTeamMember: [],
        createdByMultiTeamMember: [],
        checkedOptionsTaskassignOrNot: [],
        checkedOptionsTaskType: [],
        checkedOptionsShowTemplateTask: [],
    });

    // add team member
    const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
        useState<boolean>(false);
    const [userAssignTaskId, setUserAssignTaskId] = useState<number>();
    const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    // multi delete
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const actionDropdownRef = useRef<HTMLUListElement>(null);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [TaskId, setTaskId] = useState<number>();
    const actionDropdownButtonRef = useRef<HTMLButtonElement>(null);
    const actionDropdownWrapperRef = useRef<HTMLDivElement>(null);
    const [checkboxesVisible, setIsCheckboxesVisible] = useState(
        selectedIds.length > 0 || isAllSelected,
    );
    const [contactSelections, setContactSelections] = useState<
        Record<number, any[]>
    >({});
    const [isTaskCountGet, setTaskCountGet] = useState(0);
    const [isTaskCountGetAll, setTaskCountGetAll] = useState(0);
    const [isTaskCountGetMy, setTaskCountGetMy] = useState(0);

    const [isArchivedTask, setIsArchivedTask] = useState(false);
    const [isDueTask, setIsDueTask] = useState(false);
    const parseTimeToMs = (timeString: string): number => {
        const trimmed = timeString.trim();
        const match = trimmed.match(/^(\d+)\s*s$/);
        if (match) {
            return parseInt(match[1]) * 1000;
        }
        return 3000;
    };

    const [taskAutoRefreshON, setTaskAutoRefreshON] = useState("");
    const [taskAutoRefreshTimeout, setTaskAutoRefreshTimeout] = useState("");
    const [taskAutoRefreshInactivityDelay, setTaskAutoRefreshInactivityDelay] =
        useState("");

    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshCountRef = useRef<number>(0);
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

    const [isArchiveTaskConfirmation, setIsArchiveTaskConfirmation] =
        useState(false);
    const [isUnArchiveTaskConfirmation, setIsUnArchiveTaskConfirmation] =
        useState(false);
    const [isConvertSupportTikcetToTask, setIsConvertSupportTikcetToTask] =
        useState(false);

    const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
        [],
    );
    const [options, setOptions] = useState<any[]>([]);
    const AUTO_REFRESH_ON = taskAutoRefreshON || false;
    const AUTO_REFRESH_TIMEOUT = parseTimeToMs(taskAutoRefreshTimeout || "1800s");
    const INACTIVITY_DELAY = Number(taskAutoRefreshInactivityDelay) || 600000;

    const canView = useCheckUserPermission(
        supportTicketFlag == 0 ? PAGE_ID.TASK_MANAGEMENT : PAGE_ID.SUPPORT_TICKET,
        PERMISSION_TYPE.VIEW,
    );

    const canAdd = useCheckUserPermission(
        supportTicketFlag == 0 ? PAGE_ID.TASK_MANAGEMENT : PAGE_ID.SUPPORT_TICKET,
        PERMISSION_TYPE.ADD,
    );
    const canEdit = useCheckUserPermission(
        supportTicketFlag == 0 ? PAGE_ID.TASK_MANAGEMENT : PAGE_ID.SUPPORT_TICKET,
        PERMISSION_TYPE.EDIT,
    );
    const canDelete = useCheckUserPermission(
        supportTicketFlag == 0 ? PAGE_ID.TASK_MANAGEMENT : PAGE_ID.SUPPORT_TICKET,
        PERMISSION_TYPE.DELETE,
    );
    const canApprove = useCheckUserPermission(
        supportTicketFlag == 0 ? PAGE_ID.TASK_MANAGEMENT : PAGE_ID.SUPPORT_TICKET,
        PERMISSION_TYPE.APPROVE,
    );

    const CanViewTaskChat = useCheckUserPermission(
        supportTicketFlag == 0
            ? PAGE_ID.TASK_MESSAGE_HISTORY
            : PAGE_ID.SUPPORT_TICKET_CHAT_HISTORY,
        PERMISSION_TYPE.VIEW,
    );
    const canAddAssignTeamMember = useCheckUserPermission(
        PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
        PERMISSION_TYPE.ADD,
    );

    const canImport = useCheckUserPermission(
        PAGE_ID.TASK_MANAGEMENT,
        PERMISSION_TYPE.IMPORT,
    );
    const canViewLabel = useCheckUserPermission(
        PAGE_ID.LABEL,
        PERMISSION_TYPE.VIEW,
    );
    // const canViewSupportTicket = useCheckUserPermission(
    //   PAGE_ID.SUPPORT_TICKET,
    //   PERMISSION_TYPE.VIEW
    // );
    // const canAddSupportTicket = useCheckUserPermission(
    //   PAGE_ID.SUPPORT_TICKET,
    //   PERMISSION_TYPE.ADD
    // );
    // const canEditSupportTicket = useCheckUserPermission(
    //   PAGE_ID.SUPPORT_TICKET,
    //   PERMISSION_TYPE.EDIT
    // );
    // const canDeleteSupportTicket = useCheckUserPermission(
    //   PAGE_ID.SUPPORT_TICKET,
    //   PERMISSION_TYPE.DELETE
    // );
    // const canApproveSupportTicket = useCheckUserPermission(
    //   PAGE_ID.SUPPORT_TICKET,
    //   PERMISSION_TYPE.APPROVE
    // );

    // const CanViewTaskChatSupportTicket = useCheckUserPermission(
    //   PAGE_ID.TASK_MESSAGE_HISTORY,
    //   PERMISSION_TYPE.VIEW
    // )
    // const canAddAssignTeamMemberSupportTicket = useCheckUserPermission(
    //   PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
    //   PERMISSION_TYPE.ADD
    // );

    const startAutoRefreshTimer = useCallback(() => {
        if (AUTO_REFRESH_ON !== "true") {
            return;
        }
        if (autoRefreshTimeoutRef.current) {
            clearTimeout(autoRefreshTimeoutRef.current);
        }

        autoRefreshTimeoutRef.current = setTimeout(() => {
            // Double-check before executing refresh
            if (AUTO_REFRESH_ON === "true") {
                autoRefreshCountRef.current += 1;
                setIsAutoRefreshing(true);
                handelRefreshProductAuto();
            }
        }, AUTO_REFRESH_TIMEOUT);
    }, [AUTO_REFRESH_TIMEOUT, AUTO_REFRESH_ON]); // Add AUTO_REFRESH_ON dependency

    // Update the resetInactivityTimer function
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }
        if (autoRefreshTimeoutRef.current) {
            clearTimeout(autoRefreshTimeoutRef.current);
        }

        // Only set new timer if auto-refresh is enabled
        if (AUTO_REFRESH_ON === "true") {
            inactivityTimeoutRef.current = setTimeout(() => {
                startAutoRefreshTimer();
            }, INACTIVITY_DELAY);
        }
    }, [startAutoRefreshTimer, INACTIVITY_DELAY, AUTO_REFRESH_ON]); // Add AUTO_REFRESH_ON dependency

    const handleUserActivity = useCallback(() => {
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    const handelRefreshProductAuto = async () => {
        if (canView && AUTO_REFRESH_ON == "true") {
            setSelectedDue("");
            setSelectedStageStatusId(undefined);
            setSelectedLabelId(undefined);
            setSelecteCategoryId(null);
            setSelectedPriorityId(undefined);

            await fetchApiTask(
                setTaskList,
                () => { },
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                selectedButtonDue === "due" ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                50,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );

            setIsAutoRefreshing(false);
        }

        startAutoRefreshTimer();
    };

    const toggleDropdownProduct = (id: number | undefined) => {
        if (id === undefined) return;

        setIsActionDropdownOpen(false);
        setIsStageStatusDropdownOpen(false);
        setIsLabelDropdownOpen(false);
        setIsPriorityDropdownOpen(false);
        setIsTaskCategoryDropdownOpen(false);

        const checkedId = taskList.find((abv) => abv.id === id);
        if (checkedId) {
            if (hasIdAvail === checkedId.id) {
                setHasIdAvail(undefined);
                setTargetVsIncentiveDropdown(null);
            } else {
                setHasIdAvail(checkedId.id);
                setTargetVsIncentiveDropdown(checkedId.id);
            }
        }
    };

    const handleModalOpenStatusAssign = (
        id?: number,
        taskStatus?: number | undefined,
    ) => {
        if (canView) {
            if (id) {
                setStatusAssignContactId(id);
            }
            if (taskStatus) {
                setStatusAssignStatusId(taskStatus);
            }
            setIsModalAssignStatusVisible(true);
            setTargetVsIncentiveDropdown(null);
        } else {
            setIsModalAssignStatusVisible(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };
    const handleModalOpen = (id?: number | undefined) => {
        if (canViewLabel) {
            //   if (id) {
            //     setContactId(id);
            //   }
            setIsModalAssignLabelVisible(true);
        } else {
            setIsModalAssignLabelVisible(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleConfirmAssignLabel = async (
        taskId: number | undefined,
        checkedOptions: any[],
    ) => {
        let idsToUpdate: number | number[];
        if (selectedIds.length > 0) {
            idsToUpdate = selectedIds;
        } else if (taskId) {
            idsToUpdate = taskId;
        } else {
            return;
        }
        await updateLabel(idsToUpdate, checkedOptions, setLoading);
        setTimeout(() => {
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                11,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
            setCurrentPage(0); // Reset page to 0 when search term changes
        }, 100);
        const keyIds = Array.isArray(idsToUpdate) ? idsToUpdate : [idsToUpdate];
        setContactSelections((prev) => {
            const updated = { ...prev };
            for (const id of keyIds) {
                updated[id] = checkedOptions;
            }
            return updated;
        });
        setIsAllSelected(false);
        setSelectedIds([]);
        setIsModalAssignLabelVisible(false);
        setOpenTaskChatModel(false);
    };

    const onhideTaskModal = () => {
        setIsCreateModel(false);
        fetchApiTask(
            setTaskList,
            setLoading,
            contactId,
            searchTerm,
            selectedButton === "all" ? 1 : 2,
            selectedButtonDue === "due" ? 3 : 0,
            selectedStageStatusId,
            selectedCategoryId,
            0,
            ITEMS_PER_PAGE,
            selectedPriorityId,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
            filterParams.checkedOptionsStageStatus,
            filterParams.assignedByMultiTeamMember,
            filterParams.createdByMultiTeamMember,
            setTaskId,
            15,
            filterParams.checkedOptionsTaskassignOrNot,
            setTaskAutoRefreshON,
            setTaskAutoRefreshTimeout,
            setTaskAutoRefreshInactivityDelay,
            setTaskCountGet,
            isArchivedTask ? "1" : "0",
            filterParams.checkedOptionsTaskType,
            filterParams.checkedOptionsShowTemplateTask,
            supportTicketFlag,
            setTaskCountGetAll,
            setTaskCountGetMy,
            selectedLabelId,
        );
    };
    const handleConfirmRadioButton = async (checkedOptions: any[]) => {
        let idsToUpdate: number | number[];
        if (selectedIds.length > 0) {
            idsToUpdate = selectedIds;
        } else if (statusAssignContactId !== undefined) {
            idsToUpdate = statusAssignContactId;
        } else {
            return;
        }
        await updateStageStatusRadioButton(idsToUpdate, checkedOptions, setLoading);
        setTimeout(() => {
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                selectedButtonDue === "due" ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                1,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );

            setCurrentPage(0);
        }, 100);
        setContactSelections((prev) => {
            const updated = { ...prev };
            const idList = Array.isArray(idsToUpdate) ? idsToUpdate : [idsToUpdate];
            idList.forEach((id) => {
                updated[id] = checkedOptions;
            });
            return updated;
        });

        setIsModalAssignStatusVisible(false);
        setOpenTaskChatModel(false);
        setIsAllSelected(false);
        setSelectedIds([]);
    };

    useEffect(() => {
        (async () => {
            if (canView) {
                setSelectedDue(isDueTask ? "Due" : "");

                await fetchApiTask(
                    setTaskList,
                    setLoading,
                    contactId,
                    searchTerm,
                    selectedButton === "my" ? 2 : 1,
                    isDueTask ? 3 : 0,
                    selectedStageStatusId,
                    selectedCategoryId,
                    0,
                    ITEMS_PER_PAGE,
                    selectedPriorityId,
                    filterParams.startSearchDate,
                    filterParams.endSearchDate,
                    filterParams.checkedOptionsStageStatus,
                    filterParams.assignedByMultiTeamMember,
                    filterParams.createdByMultiTeamMember,
                    setTaskId,
                    2,
                    filterParams.checkedOptionsTaskassignOrNot,
                    setTaskAutoRefreshON,
                    setTaskAutoRefreshTimeout,
                    setTaskAutoRefreshInactivityDelay,
                    setTaskCountGet,
                    isArchivedTask ? "1" : "0",
                    filterParams.checkedOptionsTaskType,
                    filterParams.checkedOptionsShowTemplateTask,
                    supportTicketFlag,
                    setTaskCountGetAll,
                    setTaskCountGetMy,
                    selectedLabelId,
                );

                await fetchStageStatusContact(setStageStatusList);
                await fetchLabel(setLabelList);
                await fetchTaskCategoryForTask(settaskCategoryList);
            }
        })();
    }, [
        canView,
        searchTerm,
        refreshProduct,
        selectedButton,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
        filterParams.checkedOptionsStageStatus,
        filterParams.assignedByMultiTeamMember,
        filterParams.createdByMultiTeamMember,
        filterParams.checkedOptionsTaskassignOrNot,
        setTaskAutoRefreshON,
        setTaskAutoRefreshTimeout,
        setTaskAutoRefreshInactivityDelay,
        isArchivedTask,
        isDueTask,
        selectedCategoryId,
        selectedStageStatusId,
        selectedLabelId,
        selectedPriorityId,
        filterParams.checkedOptionsTaskType,
        filterParams.checkedOptionsShowTemplateTask,
        contactId
    ]);

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest(".icon-more");
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(
            dropdownContactRef.current,
        ).some((ref) => ref && ref.contains(target));

        const clickedOnStatusButton = statusDropdownRef.current?.contains(target);
        const clickedInsideStatusDropdown = target.closest(".labelDropLeft");

        const clickedOnLableButton = labelDropdownRef.current?.contains(target);
        const clickedInsideLabelDropdown = target.closest(".labelDropLeft");

        const clickedOnTaskCategoryButton =
            categoryDropdownRef.current?.contains(target);
        const clickedInsideTaskCategoryDropdown = target.closest(".labelDropLeft");

        const clickedOnPriorityButton =
            priorityDropdownRef.current?.contains(target);
        const clickedInsidePriorityDropdown = target.closest(".labelDropLeft");

        const clickedInsideActionDropdown =
            actionDropdownRef.current?.contains(target) ||
            target.closest(".selected-btn");

        if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
            setTargetVsIncentiveDropdown(null);
            setHasIdAvail(undefined);
        }

        if (!clickedInsideActionDropdown) {
            setIsActionDropdownOpen(false);
        }

        if (!clickedOnStatusButton && !clickedInsideStatusDropdown) {
            setIsStageStatusDropdownOpen(false);
        }
        if (!clickedOnLableButton && !clickedInsideLabelDropdown) {
            setIsLabelDropdownOpen(false);
        }
        if (!clickedOnTaskCategoryButton && !clickedInsideTaskCategoryDropdown) {
            setIsTaskCategoryDropdownOpen(false);
        }

        if (!clickedOnPriorityButton && !clickedInsidePriorityDropdown) {
            setIsPriorityDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // Clear any existing timers when the effect re-runs
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
        if (autoRefreshTimeoutRef.current) {
            clearTimeout(autoRefreshTimeoutRef.current);
            autoRefreshTimeoutRef.current = null;
        }

        // Only initialize if auto-refresh is enabled
        if (AUTO_REFRESH_ON === "true") {
            resetInactivityTimer();
        }

        // Activity events to monitor
        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click",
            "keydown",
        ];

        // Add event listeners only if auto-refresh is enabled
        if (AUTO_REFRESH_ON === "true") {
            events.forEach((event) => {
                document.addEventListener(event, handleUserActivity);
            });
        }

        // Cleanup
        return () => {
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
            if (autoRefreshTimeoutRef.current) {
                clearTimeout(autoRefreshTimeoutRef.current);
            }
            events.forEach((event) => {
                document.removeEventListener(event, handleUserActivity);
            });
        };
    }, [handleUserActivity, resetInactivityTimer, AUTO_REFRESH_ON]); // Add AUTO_REFRESH_ON dependency

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setTargetVsIncentiveDropdown(null);
                setHasIdAvail(undefined);
                setIsStageStatusDropdownOpen(false);
                setIsLabelDropdownOpen(false);
                setIsTaskCategoryDropdownOpen(false);
                setIsPriorityDropdownOpen(false);
                setIsActionDropdownOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscKey);

        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    const handelRefreshProduct = async () => {
        if (canView) {
            setSearchTerm("");
            setSearchOpen(false);
            setSelectedStageStatusId(undefined);
            setSelectedLabelId(undefined);
            setSelecteCategoryId(null);
            setSelectedPriorityId(undefined);
            setCurrentPage(0);
            setHasMore(true);
            setSelectedButton("all");
            setSelectedDue("");
            await fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                "",
                selectedButton === "all" ? 1 : 2,
                0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                3,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );

            resetInactivityTimer();
        }
    };

    useEffect(() => {
        if (refreshProduct) {
            setOpenTaskChatModel(false);
        }
    }, [refreshProduct]);

    function openSearch() {
        if (canView) {
            setSearchOpen(!searchOpen);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (value.length >= 3 || value === "") {
            setSearchTimeout(
                setTimeout(() => {
                    setCurrentPage(0);
                    setHasMore(true);
                    fetchApiTask(
                        setTaskList,
                        setLoading,
                        contactId,
                        value,
                        selectedButton === "all" ? 1 : 2,
                        isDueTask ? 3 : 0,
                        selectedStageStatusId,
                        selectedCategoryId,
                        0,
                        ITEMS_PER_PAGE,
                        selectedPriorityId,
                        filterParams.startSearchDate,
                        filterParams.endSearchDate,
                        filterParams.checkedOptionsStageStatus,
                        filterParams.assignedByMultiTeamMember,
                        filterParams.createdByMultiTeamMember,
                        setTaskId,
                        4,
                        filterParams.checkedOptionsTaskassignOrNot,
                        setTaskAutoRefreshON,
                        setTaskAutoRefreshTimeout,
                        setTaskAutoRefreshInactivityDelay,
                        setTaskCountGet,
                        "-1",
                        filterParams.checkedOptionsTaskType,
                        filterParams.checkedOptionsShowTemplateTask,
                        supportTicketFlag,
                        setTaskCountGetAll,
                        setTaskCountGetMy,
                        selectedLabelId,
                    );
                }, 500),
            );
        }
    };

    const handleSearchClear = () => {
        setSearchTerm("");
        setSearchOpen(false);
    };

    const handleOpenKanbanView = () => {
        if (canView) {
            setIsKanbanViewDisplay(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    function openCreateTargetVsIncentive() {
        if (canAdd) {
            setIsCreateModel(true);
        } else {
            setIsCreateModel(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }

    const toggleCalendarView = () => {
        setIsCalendarOpen(true);
    };

    const closeCalendarView = () => {
        setIsCalendarOpen(false);
    };

    const getReferenceText = (referenceTable: string): string => {
        switch (referenceTable) {
            case "cart_quotation":
                return "For Quotation";
            case "cart_order":
                return "For Order";
            case "cart_invoice":
                return "For Invoice";
            case "inquiries":
                return "For Inquiry";
            case "contact_message_histories":
                return "For Message";
            case "cart_purchase_order":
                return "For Purchase Order";
            default:
                return "For General";
        }
    };

    const selectedStageStatus = stageStatusList.find(
        (item) => item.id === selectedStageStatusId,
    );
    const selectedLabel = labelList.find((item) => item.id === selectedLabelId);
    const selectedTaskCategory = taskCategoryList.find(
        (item) => item.id === selectedCategoryId,
    );
    const DropdownStageStatusForContact = () => {
        if (canView) {
            setTargetVsIncentiveDropdown(null);
            setHasIdAvail(undefined);
            setIsPriorityDropdownOpen(false);
            setIsActionDropdownOpen(false);
            setIsTaskCategoryDropdownOpen(false);
            setIsStageStatusDropdownOpen(!isStageStatusDropdownOpen);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const DropdownLabel = () => {
        if (canView) {
            setTargetVsIncentiveDropdown(null);
            setHasIdAvail(undefined);
            setIsPriorityDropdownOpen(false);
            setIsActionDropdownOpen(false);
            setIsTaskCategoryDropdownOpen(false);
            setIsLabelDropdownOpen(!isLabelDropdownOpen);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const DropdownTaskCategoryForContact = () => {
        if (canView) {
            setTargetVsIncentiveDropdown(null);
            setHasIdAvail(undefined);
            setIsPriorityDropdownOpen(false);
            setIsStageStatusDropdownOpen(false);
            setIsLabelDropdownOpen(false);
            setIsTaskCategoryDropdownOpen(false);
            setIsActionDropdownOpen(false);
            setIsTaskCategoryDropdownOpen(!isTaskCategoryDropdownOpen);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleStageStatusSelect1 = (stageStatusId: number) => {
        setSelectedStageStatusId((prev) =>
            prev === stageStatusId ? null : stageStatusId,
        );
        setIsStageStatusDropdownOpen(false);
        setCurrentPage(0);
        setHasMore(true);
    };

    const handleLabelSelect = (labelId: number) => {
        setSelectedLabelId((prev) => (prev === labelId ? null : labelId));
        setIsLabelDropdownOpen(false);
        setCurrentPage(0);
        setHasMore(true);
    };

    const handleTaskCategorySelect1 = async (TaskCategoryId: number) => {
        try {
            setSelecteCategoryId((prev) =>
                prev === TaskCategoryId ? null : TaskCategoryId,
            );
            setIsTaskCategoryDropdownOpen(false);
            setCurrentPage(0);
            setHasMore(true);
            setLoading(true);
        } catch (error) {
            console.error("Error fetching task category data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleButtonClick = (buttonType: "all" | "my") => {
        setSelectedButton(buttonType);
        setCurrentPage(0);
        setHasMore(true);

        fetchApiTask(
            setTaskList,
            setLoading,
            contactId,
            searchTerm,
            buttonType === "all" ? 1 : 2,
            isDueTask ? 3 : 0,
            selectedStageStatusId,
            selectedCategoryId,
            0,
            ITEMS_PER_PAGE,
            selectedPriorityId,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
            filterParams.checkedOptionsStageStatus,
            filterParams.assignedByMultiTeamMember,
            filterParams.createdByMultiTeamMember,
            setTaskId,
            6,
            filterParams.checkedOptionsTaskassignOrNot,
            setTaskAutoRefreshON,
            setTaskAutoRefreshTimeout,
            setTaskAutoRefreshInactivityDelay,
            setTaskCountGet,
            isArchivedTask ? "1" : "0",
            filterParams.checkedOptionsTaskType,
            filterParams.checkedOptionsShowTemplateTask,
            supportTicketFlag,
            setTaskCountGetAll,
            setTaskCountGetMy,
            selectedLabelId,
        );
    };

    const handleButtonClickDue = async (buttonTypeDue: "due") => {
        try {
            setSelectedDue(buttonTypeDue);
            setCurrentPage(0);
            setHasMore(true);
            setLoading(true);

            await fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                buttonTypeDue === "due" ? 3 : 3,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                6,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );

            // Optional: Handle actions after successful fetch
        } catch (error) {
            toast.error("Due");
        } finally {
            setLoading(false);
        }
    };

    const onHide = () => {
        if (isModalAssignStatusVisible) {
            setIsModalAssignStatusVisible(false);
        }
        if (isModalAssignLabelVisible) {
            setIsModalAssignLabelVisible(false);
        }
        setIsDeleteConfirmation(false);
        setIsTaskComplatedConfirmation(false);
        setOpenTaskChatModel(false);
        setIsCreateModel(false);
        setIsOpenEditModel(false);
        fetchApiTask(
            setTaskList,
            setLoading,
            contactId,
            searchTerm,
            selectedButton === "all" ? 1 : 2,
            isDueTask ? 3 : 0,
            selectedStageStatusId,
            selectedCategoryId,
            0,
            ITEMS_PER_PAGE,
            selectedPriorityId,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
            filterParams.checkedOptionsStageStatus,
            filterParams.assignedByMultiTeamMember,
            filterParams.createdByMultiTeamMember,
            setTaskId,
            15,
            filterParams.checkedOptionsTaskassignOrNot,
            setTaskAutoRefreshON,
            setTaskAutoRefreshTimeout,
            setTaskAutoRefreshInactivityDelay,
            setTaskCountGet,
            isArchivedTask ? "1" : "0",
            filterParams.checkedOptionsTaskType,
            filterParams.checkedOptionsShowTemplateTask,
            supportTicketFlag,
            setTaskCountGetAll,
            setTaskCountGetMy,
            selectedLabelId,
        );
        // closeTaskManagementView();
    };
    const onHideForArrow = () => {
        if (isModalAssignStatusVisible) {
            setIsModalAssignStatusVisible(false);
        }
        if (isModalAssignLabelVisible) {
            setIsModalAssignLabelVisible(false);
        }
        setIsDeleteConfirmation(false);
        setIsTaskComplatedConfirmation(false);
        setOpenTaskChatModel(false);
        setIsOpenEditModel(false);
        closeTaskManagementView();
    };

    useEscapeKey(onHide);

    //  let ITEMS_PER_PAGE = 50

    function openDeleteModel(id?: number) {
        if (canDelete) {
            if (id) {
                setTaskId(id);
                setIsDeleteConfirmation(true);
                setOpenTaskChatModel(false);
            }
            setIsDeleteConfirmation(true);
        } else {
            setIsDeleteConfirmation(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }
    function openComplateTaskModel(id?: number) {
        if (canApprove) {
            if (id) {
                setTaskId(id);
                setIsTaskComplatedConfirmation(true);
                setOpenTaskChatModel(false);
            }
            setIsTaskComplatedConfirmation(true);
        } else {
            setIsTaskComplatedConfirmation(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }
    function openArchiveTaskModel(id?: number) {
        // if (canDelete) {
        if (id) {
            setTaskId(id);
            setIsArchiveTaskConfirmation(true);
            setOpenTaskChatModel(false);
        }
        setIsArchiveTaskConfirmation(true);
        // } else {
        //   setIsDeleteConfirmation(false);

        //   toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        // }
    }
    function openUnArchiveTaskModel(id?: number) {
        // if (canDelete) {
        if (id) {
            setTaskId(id);
            setIsUnArchiveTaskConfirmation(true);
            setOpenTaskChatModel(false);
        }
        setIsUnArchiveTaskConfirmation(true);
        // } else {
        //   setIsDeleteConfirmation(false);

        //   toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        // }
    }
    function openSupportTicketToTaskConvert(id?: number) {
        // if (canDelete) {
        if (id) {
            setTaskId(id);
            setIsConvertSupportTikcetToTask(true);
            setOpenTaskChatModel(false);
        }
        setIsConvertSupportTikcetToTask(true);
        // } else {
        //   setIsDeleteConfirmation(false);

        //   toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        // }
    }
    const [isStageAndStatusModalOpen, setIsStageAndStatusModalOpen] =
        useState(false);
    const [stageAndStatusData, setStageAndStatusData] = useState<{
        taskId?: number;
        referenceTable?: string;
    }>({});

    function openStageAndStatusLog(id: number | undefined) {
        setStageAndStatusData({
            taskId: id,
            referenceTable: `task_managements`,
        });
        setIsStageAndStatusModalOpen(true);
    }

    const handelDeleteTask = async () => {
        if (await deleteTaskApi(selectedIds.length > 0 ? selectedIds : TaskId)) {
            // resetRightSideView();
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                7,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
        }
        setIsDeleteConfirmation(false);
        setIsAllSelected(false);
        setSelectedIds([]);
    };
    const handelComplateTaskForList = async () => {
        if (await complateTaskApi(selectedIds.length > 0 ? selectedIds : TaskId)) {
            // resetRightSideView();
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                7,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
        }
        setIsTaskComplatedConfirmation(false);
        setIsAllSelected(false);
        setSelectedIds([]);
    };

    const handelArchiveTask = async () => {
        if (await archiveTaskApi(selectedIds.length > 0 ? selectedIds : TaskId)) {
            // resetRightSideView();
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                7,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
        }
        setIsArchiveTaskConfirmation(false);
        setIsAllSelected(false);
        setSelectedIds([]);
    };
    const handelUnArchiveTask = async () => {
        if (await unarchiveTaskApi(selectedIds.length > 0 ? selectedIds : TaskId)) {
            // resetRightSideView();
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                7,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
        }
        setIsUnArchiveTaskConfirmation(false);
        setIsAllSelected(false);
        setSelectedIds([]);
    };
    const handelConvertSupportTikcetToTask = async () => {
        if (
            await CovertSupportTikcetToTaskApi(
                selectedIds.length > 0 ? selectedIds : TaskId,
            )
        ) {
            // resetRightSideView();
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                7,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
        }
        setIsConvertSupportTikcetToTask(false);
        setIsAllSelected(false);
        setSelectedIds([]);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (listInnerRef.current) {
                const { scrollTop, clientHeight, scrollHeight } = listInnerRef.current;

                if (
                    scrollTop + clientHeight >= scrollHeight - 10 &&
                    !loading &&
                    hasMore
                ) {
                    fetchApiTask(
                        (newItems) => {
                            if (newItems.length > 0) {
                                setTaskList((prev) => {
                                    const updatedList = [...prev, ...newItems];

                                    return updatedList;
                                });
                                setCurrentPage((prevPage) => prevPage + 1);
                            } else {
                                setHasMore(false);
                            }
                        },
                        setLoading,
                        contactId,
                        searchTerm,
                        selectedButton === "all" ? 1 : 2, // ownerFilter
                        isDueTask ? 3 : 0,
                        selectedStageStatusId,
                        selectedCategoryId, // statusFilter
                        currentPage + 1,
                        ITEMS_PER_PAGE,
                        selectedPriorityId,
                        filterParams.startSearchDate,
                        filterParams.endSearchDate,
                        filterParams.checkedOptionsStageStatus,
                        filterParams.assignedByMultiTeamMember,
                        filterParams.createdByMultiTeamMember,
                        setTaskId,
                        8,
                        filterParams.checkedOptionsTaskassignOrNot,
                        setTaskAutoRefreshON,
                        setTaskAutoRefreshTimeout,
                        setTaskAutoRefreshInactivityDelay,
                        setTaskCountGet,
                        isArchivedTask ? "1" : "0",
                        filterParams.checkedOptionsTaskType,
                        filterParams.checkedOptionsShowTemplateTask,
                        supportTicketFlag,
                        setTaskCountGetAll,
                        setTaskCountGetMy,
                        selectedLabelId,
                    );
                }
            }
        };

        const el = listInnerRef.current;
        if (el) {
            el.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (el) {
                el.removeEventListener("scroll", handleScroll);
            }
        };
    }, [loading, hasMore, searchTerm, currentPage]);

    const OpenTaskchatRightSide = (signleDataTask: ITaskView) => {
        if (CanViewTaskChat) {
            setGetSingleTaskData(signleDataTask);
            setOpenTaskChatModel(true);
            if (onSelectTask) {
                onSelectTask(signleDataTask);
            }
        }
    };

    const handleEdit = (item: ITaskView) => {
        if (canEdit) {
            setEditTargetVsIncentiveItem(item);
            setIsOpenEditModel(true);
            setTargetVsIncentiveDropdown(null);
        } else {
            setTargetVsIncentiveDropdown(null);
            setIsOpenEditModel(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    useEffect(() => {
        // Skip the very first render (initial mount)
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (refreshTaskBothSide) {
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                9,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
            setRefreshTaskBothSide(false);
        }
    }, [refreshTaskBothSide]);

    /* Common Filter Code Start */

    const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
        const {
            filterData,
            checkedOptionsLabel: checkedOptions,
            endSearchDate,
            startSearchDate,
            checkedOptionsStageStatus,
            assignedByMultiTeamMember,
            createdByMultiTeamMember,
            checkedOptionsTaskassignOrNot,
            checkedOptionsTaskType,
            checkedOptionsShowTemplateTask,
        } = filterPayload;

        // ✅ Update local filter state
        setFilterParams({
            filterData,
            checkedOptions: checkedOptions ?? [],
            startSearchDate,
            endSearchDate,
            checkedOptionsStageStatus: checkedOptionsStageStatus ?? [],
            assignedByMultiTeamMember,
            createdByMultiTeamMember,
            checkedOptionsTaskassignOrNot: checkedOptionsTaskassignOrNot || [],
            checkedOptionsTaskType: checkedOptionsTaskType || [],
            checkedOptionsShowTemplateTask: checkedOptionsShowTemplateTask || [],
        });

        // ✅ Decide if any filter applied
        const isFilterApplied =
            (checkedOptions?.length ?? 0) > 0 ||
            Boolean(filterData?.country) ||
            Boolean(filterData?.state) ||
            Boolean(startSearchDate) ||
            Boolean(endSearchDate) ||
            (checkedOptionsStageStatus?.length ?? 0) > 0 ||
            (checkedOptionsTaskType || [])?.length > 0 ||
            (checkedOptionsShowTemplateTask || [])?.length > 0 ||
            (checkedOptionsTaskassignOrNot?.length ?? 0) > 0 ||
            (assignedByMultiTeamMember?.length ?? 0) > 0 ||
            (createdByMultiTeamMember?.length ?? 0) > 0;

        setHasData(isFilterApplied);

        // ✅ Format date
        const newStartDate =
            startSearchDate instanceof DateObject
                ? startSearchDate.format("YYYY-MM-DD")
                : startSearchDate;
        const newEndDate =
            endSearchDate instanceof DateObject
                ? endSearchDate.format("YYYY-MM-DD")
                : endSearchDate;

        setIsModalFilterVisible(false);
    };

    const handleModalClose = () => {
        if (isModalVisible) {
            setIsModalVisible(false);
        } else {
            setIsModalFilterVisible(false);
        }
    };

    const openFilterLabel = () => {
        setIsModalFilterVisible(true);
    };

    /* Common Filter Code End */
    /* add team member code start */
    const getOptionName = (option: { username: string; department: number }) => {
        const departmentObj = departments.find(
            (item) => item.id === option.department,
        );

        if (departmentObj) {
            return `${option.username} (${departmentObj.department_name})`;
        }

        return option.username;
    };

    const handleModalOpenUserAssign = (id?: number | undefined) => {
        if (canAddAssignTeamMember) {
            setUserAssignTaskId(id);
            setIsModalAssignUserVisible(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    useEffect(() => {
        if (isModalAssignUserVisible) {
            fetchAllCompanyApi(setOptionJoinCompany);
            fetchDepartmentsApi(setDepartments);
        }
        if (isModalAssignStatusVisible) {
            fetchStageStatusApi(setOptionRadioButtonStatus, statusAssignStatusId);
        } else {
            setOptionRadioButtonStatus([]);
            setStatusAssignStatusId(0);
        }
        if (isModalAssignLabelVisible) {
            fetchLabelApi(setOptions, setLoading);
        }
    }, [
        isModalAssignStatusVisible,
        isModalAssignUserVisible,
        isModalAssignLabelVisible,
    ]);

    const handleConfirmAssignUser = async (
        taskId: number | undefined,
        checkedOptions: any[],
    ) => {
        let idsToUpdate: number | number[];
        if (selectedIds.length > 0) {
            idsToUpdate = selectedIds;
        } else if (userAssignTaskId) {
            idsToUpdate = userAssignTaskId;
        } else {
            return;
        }
        await updateUserCheckBox(idsToUpdate, checkedOptions, setLoading);
        setTimeout(() => {
            fetchApiTask(
                setTaskList,
                setLoading,
                contactId,
                searchTerm,
                selectedButton === "all" ? 1 : 2,
                isDueTask ? 3 : 0,
                selectedStageStatusId,
                selectedCategoryId,
                0,
                ITEMS_PER_PAGE,
                selectedPriorityId,
                filterParams.startSearchDate,
                filterParams.endSearchDate,
                filterParams.checkedOptionsStageStatus,
                filterParams.assignedByMultiTeamMember,
                filterParams.createdByMultiTeamMember,
                setTaskId,
                11,
                filterParams.checkedOptionsTaskassignOrNot,
                setTaskAutoRefreshON,
                setTaskAutoRefreshTimeout,
                setTaskAutoRefreshInactivityDelay,
                setTaskCountGet,
                isArchivedTask ? "1" : "0",
                filterParams.checkedOptionsTaskType,
                filterParams.checkedOptionsShowTemplateTask,
                supportTicketFlag,
                setTaskCountGetAll,
                setTaskCountGetMy,
                selectedLabelId,
            );
            setCurrentPage(0); // Reset page to 0 when search term changes
        }, 100);
        const keyIds = Array.isArray(idsToUpdate) ? idsToUpdate : [idsToUpdate];
        setContactSelections((prev) => {
            const updated = { ...prev };
            for (const id of keyIds) {
                updated[id] = checkedOptions;
            }
            return updated;
        });
        setIsAllSelected(false);
        setSelectedIds([]);
        setIsModalAssignUserVisible(false);
        setOpenTaskChatModel(false);
    };
    /* add team member code End */
    const [isModalExcelProductVisible, setIsModalExcelProductVisible] =
        useState<boolean>(false);
    const openModelImport = () => {
        if (canImport) {
            setIsModalExcelProductVisible(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleConfirmProductImportExcel = async () => {
        setIsModalExcelProductVisible(false);
        await fetchApiTask(
            setTaskList,
            setLoading,
            contactId,
            searchTerm,
            selectedButton === "all" ? 1 : 2,
            isDueTask ? 3 : 0,
            selectedStageStatusId,
            selectedCategoryId,
            0,
            ITEMS_PER_PAGE,
            selectedPriorityId,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
            filterParams.checkedOptionsStageStatus,
            filterParams.assignedByMultiTeamMember,
            filterParams.createdByMultiTeamMember,
            setTaskId,
            9,
            filterParams.checkedOptionsTaskassignOrNot,
            setTaskAutoRefreshON,
            setTaskAutoRefreshTimeout,
            setTaskAutoRefreshInactivityDelay,
            setTaskCountGet,
            isArchivedTask ? "1" : "0",
            filterParams.checkedOptionsTaskType,
            filterParams.checkedOptionsShowTemplateTask,
            supportTicketFlag,
            setTaskCountGetAll,
            setTaskCountGetMy,
            selectedLabelId,
        );
    };
    return (
        <>
            {isTaskManagementView ? (
                <div
                    className="leftSide animate__animated animate__fadeInLeft"
                    id="notifications"
                >
                    <div className="header-Chat">
                        <div className="ICON">
                            <div
                                aria-disabled="false"
                                role="button"
                                className="icons text-light"
                                data-tab="2"
                                title="Back"
                                aria-label="New chat"
                                onClick={onHideForArrow}
                            >
                                <span data-testid="chat" data-icon="chat" className="">
                                    <svg viewBox="0 0 24 24" width="24" height="24" className="">
                                        <path
                                            fill="currentColor"
                                            d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                                        ></path>
                                    </svg>
                                </span>
                            </div>
                        </div>
                        {supportTicketFlag ? (
                            <div className="newText">
                                <h2>{contactName} Support Ticket</h2>
                            </div>
                        ) : (
                            <div className="newText">
                                <h2>{contactName} Task</h2>
                            </div>
                        )}
                        <div className="col-4 text-end mb-2">
                            <div
                                className="ICON"
                                style={{ position: "absolute", right: "1px" }}
                            >
                                <button
                                    style={{ paddingRight: "8px" }}
                                    className="icons "
                                    onClick={() => {
                                        handleOpenKanbanView();
                                    }}
                                >
                                    <span title="Kanban View" className="text-white">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="#fafafaff"
                                        >
                                            <path d="M280-280h80v-400h-80v400Zm320-80h80v-320h-80v320ZM440-480h80v-200h-80v200ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                                        </svg>
                                    </span>
                                </button>
                                <button
                                    style={{ paddingRight: "8px" }}
                                    className="icons "
                                    onClick={openFilterLabel}
                                >
                                    <span title="Filter Task" className="text-white">
                                        {hasData ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                height="24px"
                                                viewBox="0 -960 960 960"
                                                width="24px"
                                                fill={hasData ? "red" : "#fafafaff"}
                                            >
                                                <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                height="24px"
                                                viewBox="0 -960 960 960"
                                                width="24px"
                                                fill={hasData ? "red" : "#f1f1f1ff"}
                                            >
                                                <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                                            </svg>
                                        )}
                                    </span>
                                </button>
                                <button
                                    className="icons text-white"
                                    onClick={openCreateTargetVsIncentive}
                                >
                                    <span title="Create Task" className="text-white">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="26px"
                                            viewBox="0 -960 960 960"
                                            width="26px"
                                            fill="currentColor"
                                        >
                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                    </span>
                                </button>
                                <button
                                    className="icons text-white"
                                    onClick={openSearch}
                                    title="Search"
                                >
                                    <svg viewBox="0 0 24 24" width="24" height="24" className="">
                                        <path
                                            fill="currentColor"
                                            d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                                        ></path>
                                    </svg>
                                </button>
                                <button
                                    className="icons text-light"
                                    onClick={handelRefreshProduct}
                                    title="Refresh"
                                >
                                    <svg width="30" height="30" viewBox="0 0 50 50">
                                        <path
                                            fill="currentColor"
                                            d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                                        />
                                        <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                                        <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                                    </svg>
                                </button>
                                {/* <button
                                    className="icons pP text-end"
                                    onClick={toggleCalendarView}
                                >
                                    <span className="text-white" title="Open Calendar View">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="26px"
                                            viewBox="0 -960 960 960"
                                            width="26px"
                                            fill="currentColor"
                                        >
                                            <path d="M320-640v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40h80v40h240v-40h80v40h40q33 0 56.5 23.5T760-720v560q0 33-23.5 56.5T680-80H200Zm0-80h480v-400H200v400Zm0-480h480v-80H200v80Z" />
                                        </svg>
                                    </span>
                                </button> */}

                            </div>
                        </div>
                    </div>
                    {searchOpen && (
                        <div className="header-search" style={{ zIndex: "1" }}>
                            <div className="search-bar">
                                <div className="d-flex justify-content-between">
                                    <button className="search">
                                        <span>
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="24"
                                                height="24"
                                                className=""
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                                                ></path>
                                            </svg>
                                        </span>
                                    </button>
                                    <span className="go-back" onClick={handleSearchClear}>
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="24"
                                            height="24"
                                            className=""
                                        >
                                            <path
                                                fill="currentColor"
                                                d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                                            ></path>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        title="Search"
                                        aria-label="Search or start new chat"
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="search-message-input"
                                        autoFocus
                                    />
                                    <span
                                        role="button"
                                        className="p-1"
                                        onClick={handleSearchClear}
                                    >
                                        <svg
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="#5f6368"
                                        >
                                            <path d="M280-80q-83 0-141.5-58.5T80-280q0-83 58.5-141.5T280-480q83 0 141.5 58.5T480-280q0 83-58.5 141.5T280-80Zm544-40L568-376q-12-13-25.5-26.5T516-428q38-24 61-64t23-88q0-75-52.5-127.5T420-760q-75 0-127.5 52.5T240-580q0 6 .5 11.5T242-557q-18 2-39.5 8T164-535q-2-11-3-22t-1-23q0-109 75.5-184.5T420-840q109 0 184.5 75.5T680-580q0 43-13.5 81.5T629-428l251 252-56 56Zm-615-61 71-71 70 71 29-28-71-71 71-71-28-28-71 71-71-71-28 28 71 71-71 71 28 28Z" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-1">
                        {selectedIds.length > 0 && (
                            <span
                                className="selected-btn rounded-5"
                                style={{
                                    width: "fit-content",
                                    height: "fit-content",
                                    paddingTop: "0.375rem",
                                    paddingBottom: "0.375rem",
                                    paddingLeft: "0.75rem",
                                    paddingRight: "0.75rem",
                                    marginLeft: "10px",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    style={{}}
                                    className="custom-checkbox mx-1"
                                    checked={isAllSelected}
                                    title="Select All Task"
                                    onChange={() => {
                                        const newSelected = isAllSelected
                                            ? []
                                            : taskList.map((u) => u.id);
                                        setSelectedIds(newSelected);
                                        setIsAllSelected(!isAllSelected);
                                    }}
                                />
                                <div
                                    className="position-relative d-inline-block ms-1 dropdown-end"
                                    ref={actionDropdownWrapperRef}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        ref={actionDropdownButtonRef}
                                        className="border-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTargetVsIncentiveDropdown(null);
                                            setHasIdAvail(undefined);
                                            setIsStageStatusDropdownOpen(false);
                                            setIsLabelDropdownOpen(false);
                                            setIsTaskCategoryDropdownOpen(false);
                                            setIsPriorityDropdownOpen(false);
                                            setIsActionDropdownOpen((prev) => !prev);
                                        }}
                                        disabled={selectedIds.length === 0}
                                    >
                                        <span className="contact-btn-search-text">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 19 20"
                                                width="22px"
                                                height="22px"
                                                className="hide animate__animated animate__fadeInUp"
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                                ></path>
                                            </svg>
                                        </span>
                                    </button>
                                    {isActionDropdownOpen && (
                                        <ul
                                            className="labelDropLeft isVisible"
                                            ref={actionDropdownRef}
                                            style={{
                                                position: "absolute",
                                                left: -40,
                                                minWidth: "220px",
                                                background: "#fff",
                                                border: "1px solid #ddd",
                                                borderRadius: "5px",
                                                zIndex: "1000",
                                                overflowY: "auto",
                                                height: "23vh",
                                                // top: 20
                                            }}
                                        >
                                            <li
                                                className="listItem"
                                                // className="listItem-contact-tabs mb-2"
                                                role="button"
                                                onClick={() => {
                                                    openDeleteModel();
                                                    setIsActionDropdownOpen(false);
                                                }}
                                            >
                                                <span>
                                                    <svg
                                                        width="15"
                                                        height="15"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                                    </svg>
                                                </span>{" "}
                                                Delete Selected Task
                                            </li>
                                            <li
                                                className="listItem"
                                                // className="listItem-contact-tabs mb-2"
                                                role="button"
                                                onClick={() => {
                                                    openArchiveTaskModel();
                                                    setIsActionDropdownOpen(false);
                                                }}
                                            >
                                                <span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        height="15"
                                                        viewBox="0 -960 960 960"
                                                        width="15"
                                                        fill="currentColor"
                                                    >
                                                        <path d="m480-240 160-160-56-56-64 64v-168h-80v168l-64-64-56 56 160 160ZM200-640v440h560v-440H200Zm0 520q-33 0-56.5-23.5T120-200v-499q0-14 4.5-27t13.5-24l50-61q11-14 27.5-21.5T250-840h460q18 0 34.5 7.5T772-811l50 61q9 11 13.5 24t4.5 27v499q0 33-23.5 56.5T760-120H200Zm16-600h528l-34-40H250l-34 40Zm264 300Z" />
                                                    </svg>
                                                </span>{" "}
                                                Archive Selected{" "}
                                                {supportTicketFlag == 0 ? "Task" : "Support Ticket"}
                                            </li>

                                            <li
                                                className="listItem"
                                                // className="listItem-contact-tabs mb-2"
                                                role="button"
                                                onClick={() => {
                                                    openUnArchiveTaskModel();
                                                    setIsActionDropdownOpen(false);
                                                }}
                                            >
                                                <span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        height="15"
                                                        viewBox="0 -960 960 960"
                                                        width="15"
                                                        fill="currentColor"
                                                    >
                                                        <path d="m480-240 160-160-56-56-64 64v-168h-80v168l-64-64-56 56 160 160ZM200-640v440h560v-440H200Zm0 520q-33 0-56.5-23.5T120-200v-499q0-14 4.5-27t13.5-24l50-61q11-14 27.5-21.5T250-840h460q18 0 34.5 7.5T772-811l50 61q9 11 13.5 24t4.5 27v499q0 33-23.5 56.5T760-120H200Zm16-600h528l-34-40H250l-34 40Zm264 300Z" />
                                                    </svg>
                                                </span>{" "}
                                                UnArchive{" "}
                                                {supportTicketFlag == 0 ? "Task" : "Support Ticket"}
                                            </li>
                                            <li
                                                className="listItem"
                                                role="button"
                                                onClick={() => {
                                                    handleModalOpenUserAssign();
                                                    setIsActionDropdownOpen(false);
                                                }}
                                            >
                                                <span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        height="15"
                                                        viewBox="0 -960 960 960"
                                                        width="15"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M216-144q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h171q8-32 34.03-52t59-20Q513-888 539-868t34 52h171q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm264-624q10.4 0 17.2-6.8 6.8-6.8 6.8-17.2 0-10.4-6.8-17.2-6.8-6.8-17.2-6.8-10.4 0-17.2 6.8-6.8 6.8-6.8 17.2 0 10.4 6.8 17.2 6.8 6.8 17.2 6.8ZM216-269q56-46 124-68.5T480-360q72 0 140 22t124 69v-475H216v475Zm264.24-139Q540-408 582-450.24q42-42.24 42-102T581.76-654q-42.24-42-102-42T378-653.76q-42 42.24-42 102T378.24-450q42.24 42 102 42ZM265-216h430q-46-35-101-53.5T480-288q-59 0-113.5 18.5T265-216Zm215-264q-30 0-51-21t-21-51q0-30 21-51t51-21q30 0 51 21t21 51q0 30-21 51t-51 21Zm0-72Z" />
                                                    </svg>
                                                </span>{" "}
                                                Assign to Team Member
                                            </li>

                                            <li
                                                className="listItem"
                                                role="button"
                                                onClick={() => {
                                                    handleModalOpenStatusAssign();
                                                    setIsActionDropdownOpen(false);
                                                }}
                                            >
                                                <span>
                                                    <svg
                                                        height="15"
                                                        viewBox="0 -960 960 960"
                                                        width="15"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm40-80h200v-80H200v80Zm382-80 198-198-57-57-141 142-57-57-56 57 113 113Zm-382-80h200v-80H200v80Zm0-160h200v-80H200v80Zm-40 400v-560 560Z"></path>
                                                    </svg>
                                                </span>{" "}
                                                Change Status
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            </span>
                        )}
                        <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "all" ? "active" : ""
                                } ${!selectedStageStatusId && selectedButton === "all"
                                    ? "selected-btn"
                                    : ""
                                } || ${selectedStageStatusId && selectedButton === "all"
                                    ? "selected-btn"
                                    : ""
                                }`}
                            onClick={() => handleButtonClick("all")}
                        >
                            <span className="contact-btn-search-text">All</span>
                            <span
                                className="badge bg-success ms-1"
                                style={{
                                    fontSize: "0.60rem",
                                    lineHeight: "15px",
                                    borderRadius: "50%",
                                    minWidth: "20px",
                                    height: "20px",
                                }}
                            >
                                {isTaskCountGetAll}
                            </span>
                        </button>
                        <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "my" ? "active" : ""
                                } ${!selectedStageStatusId && selectedButton === "my"
                                    ? "selected-btn"
                                    : ""
                                } || ${selectedStageStatusId && selectedButton === "my"
                                    ? "selected-btn"
                                    : ""
                                }`}
                            onClick={() => handleButtonClick("my")}
                        >
                            <span className="contact-btn-search-text">My</span>
                            <span
                                className="badge ms-1"
                                style={{
                                    fontSize: "0.60rem",
                                    lineHeight: "15px",
                                    borderRadius: "50%",
                                    minWidth: "20px",
                                    height: "20px",
                                    backgroundColor: "#0066FF",
                                }}
                            >
                                {isTaskCountGetMy}
                            </span>
                        </button>
                        <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${isDueTask ? "active" : ""
                                } ${isDueTask ? "selected-btn" : ""}`}
                            onClick={() => setIsDueTask(!isDueTask)}
                        >
                            <span className="contact-btn-search-text">Due</span>

                            <span
                                className="badge bg-danger ms-1"
                                style={{
                                    fontSize: "0.60rem",
                                    lineHeight: "15px",
                                    borderRadius: "50%",
                                    minWidth: "20px",
                                    height: "20px",
                                }}
                            >
                                {isTaskCountGet}
                            </span>
                        </button>
                        <div className="position-relative d-inline-block ms-1 dropdown-end">
                            <button
                                className={`btn rounded-5 contact-btn-search fw_500 ${selectedStageStatusId ? "selected-btn" : ""
                                    }`}
                                onClick={DropdownStageStatusForContact}
                                ref={statusDropdownRef}
                                disabled={stageStatusList.length === 0}
                            >
                                <span className="contact-btn-search-text">
                                    {selectedStageStatus ? selectedStageStatus.name : "Status"}
                                </span>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#3b4a54"
                                >
                                    <path d="M480-360 280-560h400L480-360Z" />
                                </svg>
                            </button>
                            {isStageStatusDropdownOpen && (
                                <ul
                                    className={`labelDropLeft ${isStageStatusDropdownOpen ? "isVisible" : "isHidden"
                                        }`}
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        minWidth: "100px",
                                        // left:"-200%",
                                        width: "140px",
                                        overflowY: "hidden",
                                        overflowX: "hidden",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "5px",
                                        zIndex: 1000,
                                        height: "20vh",
                                        overflow: "scroll",
                                    }}
                                >
                                    {stageStatusList.map((item) => (
                                        <li
                                            key={item.id}
                                            className="listItem-contact-tabs"
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStageStatusSelect1(item.id);
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "8px 12px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    backgroundColor: item.color ?? "transparent",
                                                    flexShrink: 0,
                                                    marginRight: "8px",
                                                }}
                                            ></span>
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                                title={item.name} // Shows full name on hover
                                            >
                                                {item.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="position-relative d-inline-block ms-1 dropdown-end">
                            <button
                                className={`btn rounded-5 contact-btn-search fw_500 ${selectedCategoryId ? "selected-btn" : ""
                                    }`}
                                onClick={DropdownTaskCategoryForContact}
                                ref={categoryDropdownRef}
                                disabled={taskCategoryList.length === 0}
                            >
                                <span className="contact-btn-search-text">
                                    {selectedTaskCategory
                                        ? selectedTaskCategory.task_category_name
                                        : "Category"}
                                </span>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#3b4a54"
                                >
                                    <path d="M480-360 280-560h400L480-360Z" />
                                </svg>
                            </button>
                            {isTaskCategoryDropdownOpen && (
                                <ul
                                    className={`labelDropLeft ${isTaskCategoryDropdownOpen ? "isVisible" : "isHidden"
                                        }`}
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        minWidth: "100px",
                                        // left:"-200%",
                                        width: "140px",
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "5px",
                                        zIndex: 1000,
                                        height: "20vh",
                                        overflow: "scroll",
                                    }}
                                >
                                    {taskCategoryList.map((item) => (
                                        <li
                                            key={item.id}
                                            className="listItem-contact-tabs"
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTaskCategorySelect1(item.id);
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "8px 12px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    backgroundColor: item.task_color ?? "transparent",
                                                    flexShrink: 0,
                                                    marginRight: "8px",
                                                }}
                                            ></span>
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                                title={item.task_category_name} // Shows full name on hover
                                            >
                                                {item.task_category_name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="position-relative d-inline-block ms-1 dropdown-end">
                            <button
                                className={`btn rounded-5 contact-btn-search fw_500 ${selectedPriorityId ? "selected-btn" : ""
                                    }`}
                                onClick={() => {
                                    setTargetVsIncentiveDropdown(null);
                                    setHasIdAvail(undefined);
                                    setIsStageStatusDropdownOpen(false);
                                    setIsLabelDropdownOpen(false);
                                    setIsTaskCategoryDropdownOpen(false);
                                    setIsActionDropdownOpen(false);
                                    setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                                }}
                                ref={priorityDropdownRef}
                                disabled={taskPriorityList.length === 0}
                            >
                                <span className="contact-btn-search-text">
                                    {taskPriorityList.find(
                                        (item) => item.id === selectedPriorityId?.toString(),
                                    )?.mode_name || "Priority"}
                                </span>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#3b4a54"
                                >
                                    <path d="M480-360 280-560h400L480-360Z" />
                                </svg>
                            </button>
                            {isPriorityDropdownOpen && (
                                <ul
                                    className={`labelDropLeft ${isPriorityDropdownOpen ? "isVisible" : "isHidden"
                                        }`}
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        minWidth: "130px",
                                        width: "auto",
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "5px",
                                        zIndex: 1000,
                                        height: "20vh",
                                        overflow: "scroll",
                                    }}
                                >
                                    {taskPriorityList.map((item) => (
                                        <li
                                            key={item.id}
                                            className="listItem-contact-tabs"
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newPriorityId = parseInt(item.id);
                                                setSelectedPriorityId((prev) =>
                                                    prev === newPriorityId ? null : newPriorityId,
                                                );
                                                setIsPriorityDropdownOpen(false);
                                                setCurrentPage(0);
                                                setHasMore(true);
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "8px 12px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    backgroundColor: item.color ?? "transparent",
                                                    display: "inline-block",
                                                    marginRight: "8px",
                                                    whiteSpace: "normal",
                                                }}
                                            ></span>
                                            <span
                                                style={{
                                                    wordWrap: "break-word",
                                                    width: `${MIN_WIDTH_FOR_TEXT}`,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {item.mode_name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="position-relative d-inline-block ms-1 dropdown-end">
                            <button
                                className={`btn rounded-5 contact-btn-search fw_500 ${selectedLabelId ? "selected-btn" : ""
                                    }`}
                                onClick={DropdownLabel}
                                ref={labelDropdownRef}
                                disabled={labelList.length === 0}
                            >
                                <span className="contact-btn-search-text">
                                    {selectedLabel ? selectedLabel.lable_name : "Label"}
                                </span>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#3b4a54"
                                >
                                    <path d="M480-360 280-560h400L480-360Z" />
                                </svg>
                            </button>
                            {isLabelDropdownOpen && (
                                <ul
                                    className={`labelDropLeft ${isLabelDropdownOpen ? "isVisible" : "isHidden"
                                        }`}
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        minWidth: "100px",
                                        // left:"-200%",
                                        width: "140px",
                                        overflowY: "hidden",
                                        overflowX: "hidden",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "5px",
                                        zIndex: 1000,
                                        height: "20vh",
                                        overflow: "scroll",
                                    }}
                                >
                                    {labelList.map((item) => (
                                        <li
                                            key={item.id}
                                            className="listItem-contact-tabs"
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLabelSelect(item.id);
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "8px 12px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    backgroundColor: item.color ?? "transparent",
                                                    flexShrink: 0,
                                                    marginRight: "8px",
                                                }}
                                            ></span>
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                                title={item.lable_name} // Shows full name on hover
                                            >
                                                {item.lable_name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="position-relative d-inline-block ms-1 dropdown-end">
                            <button
                                className={`btn rounded-5 contact-btn-search fw_500 ${isArchivedTask ? "selected-btn" : ""
                                    }`}
                                onClick={() => {
                                    setIsArchivedTask(!isArchivedTask);
                                }}
                            >
                                <span className="contact-btn-search-text">Archived</span>
                            </button>
                        </div>
                    </div>
                    <div
                        className="chats"
                        style={{ height: "calc(100% - 177px)" }}
                        ref={listInnerRef}
                    >
                        {canView ? (
                            <div>
                                {loading && !isAutoRefreshing ? (
                                    Array.from({ length: 10 }).map((_, index) => (
                                        <div className="block chat-list" key={index}>
                                            <button className="">
                                                <div>
                                                    <Skeleton
                                                        width="100%"
                                                        height="100%"
                                                        duration={5}
                                                        style={{ opacity: darkMode ? "" : 0.8 }}
                                                    />
                                                </div>
                                                <div className="head">
                                                    <h4>
                                                        <Skeleton
                                                            style={{
                                                                marginLeft: "10px",
                                                                opacity: darkMode ? "" : 0.5,
                                                            }}
                                                            width={100}
                                                        />
                                                    </h4>
                                                    <p className="time">
                                                        <Skeleton
                                                            width={80}
                                                            style={{ opacity: darkMode ? "" : 0.5 }}
                                                            height={10}
                                                        />
                                                    </p>
                                                </div>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <p
                                            className={`${taskList?.length > 0
                                                ? ""
                                                : "text-center pt-5"
                                                }`}
                                        >
                                            {taskList?.length > 0 ? "" : "No Data Found"}
                                        </p>
                                        {taskList &&
                                            taskList.length > 0 &&
                                            taskList.map((item, index) => (
                                                <button
                                                    key={index}
                                                    className={`block w-100 chat-list ${activeIndex === index ? "active" : ""
                                                        }`}
                                                    style={{ padding: "6" }}
                                                    onClick={(e) => {
                                                        setActiveIndex(index);
                                                        OpenTaskchatRightSide(item);
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (selectedIds.length === 0 && !isAllSelected) {
                                                            const checkbox: any =
                                                                e.currentTarget.querySelector(
                                                                    ".checkbox-wrapper",
                                                                );
                                                            if (checkbox) {
                                                                // checkbox.style.visibility = "visible";
                                                                setIsCheckboxesVisible(true);
                                                            }
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (selectedIds.length === 0 && !isAllSelected) {
                                                            const checkbox: any =
                                                                e.currentTarget.querySelector(
                                                                    ".checkbox-wrapper",
                                                                );
                                                            if (checkbox) {
                                                                // checkbox.style.visibility = "hidden";
                                                                setIsCheckboxesVisible(false);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <div className="w-100">
                                                        {item.task_priority === 1 ? (
                                                            <div
                                                                className="imgBox-isRead-line-task"
                                                                // style={{ backgroundColor: "#FFA500" }}
                                                                style={{
                                                                    backgroundColor: "#36a4dd",
                                                                    width: "10px",
                                                                }}
                                                            ></div>
                                                        ) : item.task_priority === 2 ? (
                                                            <div
                                                                className="imgBox-isRead-line-task"
                                                                style={{
                                                                    backgroundColor: "#ff9f00",
                                                                    width: "10px",
                                                                }}
                                                            // style={{ backgroundColor: "#fc6e0f" }}
                                                            ></div>
                                                        ) : item.task_priority === 3 ? (
                                                            <div
                                                                className="imgBox-isRead-line-task"
                                                                style={{
                                                                    backgroundColor: "#ff4d4e",
                                                                    width: "10px",
                                                                }}
                                                            // style={{ backgroundColor: "#FF4C4C" }}
                                                            ></div>
                                                        ) : item.task_priority === 4 ? (
                                                            <div
                                                                className="imgBox-isRead-line-task blink"
                                                                style={{
                                                                    backgroundColor: "#b30000",
                                                                    width: "10px",
                                                                }}
                                                            // style={{ backgroundColor: "#FF4C4C" }}
                                                            ></div>
                                                        ) : null}

                                                        <div className="h-text">
                                                            <div
                                                                className="checkbox-wrapper"
                                                                style={{
                                                                    position: "absolute",
                                                                    left: 4,
                                                                    top: 0,
                                                                    visibility: checkboxesVisible
                                                                        ? "visible"
                                                                        : "hidden",
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="custom-checkbox mb-1"
                                                                    checked={selectedIds.includes(item.id)}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        const updated = e.target.checked
                                                                            ? [...selectedIds, item.id]
                                                                            : selectedIds.filter(
                                                                                (id: any) => id !== item.id,
                                                                            );
                                                                        setSelectedIds(updated);
                                                                        setIsAllSelected(
                                                                            updated.length ===
                                                                            taskList.length,
                                                                        );
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                            <div className="row">
                                                                <div className="col-md-8">
                                                                    <div className="d-flex">
                                                                        <div
                                                                            className=""
                                                                            style={{
                                                                                paddingBottom: "2px",
                                                                                borderBottom: "unset",
                                                                            }}
                                                                        >
                                                                            <h4
                                                                                className="inquiry-front"
                                                                                style={{ textAlign: "left" }}
                                                                                title={
                                                                                    "#" +
                                                                                    item.id +
                                                                                    " " +
                                                                                    (item.task_title || "")
                                                                                }
                                                                            >
                                                                                <span
                                                                                    className={`${checkboxesVisible ? "ms-3" : ""
                                                                                        }`}
                                                                                >
                                                                                    {"#" + item.id}{" "}
                                                                                    <b>
                                                                                        {truncateText(
                                                                                            item.task_title || "",
                                                                                            40,
                                                                                        )}
                                                                                    </b>
                                                                                </span>
                                                                                <br />
                                                                                <span
                                                                                    style={{
                                                                                        backgroundColor: `${item.category_color_code}`,
                                                                                        border: `${item.category_color_code}`,
                                                                                        color: "black",
                                                                                    }}
                                                                                    className="badge rounded-pill contact-text text-white"
                                                                                >
                                                                                    {item.category_name || " "}
                                                                                </span>
                                                                            </h4>
                                                                        </div>
                                                                    </div>
                                                                    {item.contact_person_name && (
                                                                        <div className="d-flex">
                                                                            <div
                                                                                style={{
                                                                                    paddingBottom: "2px",
                                                                                    borderBottom: "unset",
                                                                                }}
                                                                            >
                                                                                <h4 className="contact-text">
                                                                                    <b>Contact Details</b> :
                                                                                </h4>
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    borderBottom: "unset",
                                                                                    textAlign: "left",
                                                                                }}
                                                                            >
                                                                                <h4
                                                                                    className="contact-text"
                                                                                    style={{
                                                                                        wordWrap: "break-word",
                                                                                        width: `${MIN_WIDTH_FOR_TEXT}`,
                                                                                    }}
                                                                                >
                                                                                    {item.contact_person_name
                                                                                        ? `${item.contact_company_name} (${item.contact_person_name})`
                                                                                        : ""}
                                                                                </h4>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {item.task_fromdate && (
                                                                        <div className="d-flex">
                                                                            <div
                                                                                className=""
                                                                                style={{
                                                                                    paddingBottom: "2px",
                                                                                    borderBottom: "unset",
                                                                                }}
                                                                            >
                                                                                <h4 className="contact-text">
                                                                                    <b>Start Date</b> :
                                                                                </h4>
                                                                            </div>
                                                                            <div
                                                                                className=""
                                                                                style={{
                                                                                    borderBottom: "unset",
                                                                                    textAlign: "left",
                                                                                }}
                                                                            >
                                                                                <h4
                                                                                    className="contact-text"
                                                                                    style={{
                                                                                        wordWrap: "break-word",
                                                                                        width: `${MIN_WIDTH_FOR_TEXT}`,
                                                                                    }}
                                                                                >
                                                                                    {item.task_fromdate}
                                                                                </h4>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {item.task_enddate && (
                                                                        <div className="d-flex">
                                                                            <div
                                                                                className=""
                                                                                style={{
                                                                                    paddingBottom: "2px",
                                                                                    borderBottom: "unset",
                                                                                }}
                                                                            >
                                                                                <h4 className="contact-text">
                                                                                    <b>End Date</b> :
                                                                                </h4>
                                                                            </div>
                                                                            <div
                                                                                className=""
                                                                                style={{
                                                                                    borderBottom: "unset",
                                                                                    textAlign: "left",
                                                                                }}
                                                                            >
                                                                                <h4
                                                                                    className="contact-text"
                                                                                    style={{
                                                                                        wordWrap: "break-word",
                                                                                        width: `${MIN_WIDTH_FOR_TEXT}`,
                                                                                    }}
                                                                                >
                                                                                    {item.task_enddate}
                                                                                </h4>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="d-flex">
                                                                        <span
                                                                            style={{
                                                                                alignItems: "left",
                                                                            }}
                                                                            className="contact-text"
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    // marginRight: "5px",
                                                                                    color: "#54656f",
                                                                                }}
                                                                            >
                                                                                Assigned To :
                                                                            </span>
                                                                            <span
                                                                                style={{
                                                                                    wordWrap: "break-word",
                                                                                    width: `${MIN_WIDTH_FOR_TEXT}`,
                                                                                }}
                                                                                title={item.assigned_team_member_names}
                                                                            >
                                                                                {truncateText(
                                                                                    item.assigned_team_member_names || "",
                                                                                    30,
                                                                                )}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        className="text-start"
                                                                        style={{
                                                                            borderBottom: "unset",
                                                                            fontSize: "12px",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                backgroundColor: "#eeeeee",
                                                                                border: "2px solid rgb(207, 207, 207)",
                                                                                color: "black",
                                                                            }}
                                                                            className="badge rounded-pill p-2"
                                                                        >
                                                                            {getReferenceText(item.reference_table)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="col-md-4"
                                                                    style={{
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        alignItems: "flex-end",
                                                                        gap: "6px",
                                                                        textAlign: "right",
                                                                    }}
                                                                >
                                                                    <button
                                                                        className="icon-more"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsActionDropdownOpen(false);
                                                                            toggleDropdownProduct(item.id);
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 19 20"
                                                                            width="19"
                                                                            height="20"
                                                                            className="hide animate__animated animate__fadeInUp"
                                                                        >
                                                                            <path
                                                                                fill="currentColor"
                                                                                d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                                                            ></path>
                                                                        </svg>
                                                                    </button>
                                                                    <div className="text-end">
                                                                        <span
                                                                            style={{
                                                                                backgroundColor: item.stage_status_color
                                                                                    ? item.stage_status_color
                                                                                    : "#eeeeee",
                                                                                fontWeight: "normal",
                                                                            }}
                                                                            className="badge rounded-pill"
                                                                        >
                                                                            {item.stage_status_name}
                                                                        </span>
                                                                        {item.is_archive == 1 && (
                                                                            <span
                                                                                style={{
                                                                                    backgroundColor: "#737373ff",
                                                                                    margin: "0 0 0 3px",
                                                                                    border:
                                                                                        "2px solid rgb(207, 207, 207)",
                                                                                    color: "black",
                                                                                }}
                                                                                className="badge rounded-pill"
                                                                            >
                                                                                Archived
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-end">
                                                                        {item.label_color && item.label_name
                                                                            ? item.label_color
                                                                                .split(",")
                                                                                .map((color, index) => (
                                                                                    <span
                                                                                        key={index}
                                                                                        style={{
                                                                                            display: "inline-block",
                                                                                        }}
                                                                                    >
                                                                                        <span
                                                                                            style={{
                                                                                                backgroundColor: color.trim(),
                                                                                                padding: "2px 6px",
                                                                                                borderRadius: "8px",
                                                                                                fontSize: "10px",
                                                                                                marginRight: "4px",
                                                                                                fontWeight: "normal",
                                                                                            }}
                                                                                            className="badge"
                                                                                        >
                                                                                            {item.label_name
                                                                                                .split(",")
                                                                                            [index].trim()}
                                                                                        </span>
                                                                                    </span>
                                                                                ))
                                                                            : ""}
                                                                    </div>
                                                                    <div
                                                                        className="d-flex"
                                                                        style={{
                                                                            borderBottom: "unset",
                                                                            fontSize: "12px",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                alignItems: "right",
                                                                                color: "#54656f",
                                                                            }}
                                                                            className="contact-text"
                                                                        >
                                                                            Created By :
                                                                            <span
                                                                                style={{
                                                                                    wordWrap: "break-word",
                                                                                    width: `${MIN_WIDTH_FOR_TEXT}`,
                                                                                }}
                                                                            >
                                                                                {item.created_by_name}
                                                                            </span>
                                                                            <br />
                                                                            {/* <br /> */}
                                                                            <span
                                                                                style={{ fontSize: "15px" }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTargetVsIncentiveDropdown(null);
                                                                                    openComplateTaskModel(item.id);
                                                                                }}
                                                                                role="button"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    height="24px"
                                                                                    viewBox="0 -960 960 960"
                                                                                    width="24px"
                                                                                    fill="#f58634"
                                                                                >
                                                                                    <path d="m381-240 424-424-57-56-368 367-169-170-57 57 227 226Zm0 113L42-466l169-170 170 170 366-367 172 168-538 538Z" />
                                                                                </svg>
                                                                            </span>
                                                                            <span
                                                                                style={{
                                                                                    wordWrap: "break-word",
                                                                                    width: `${MIN_WIDTH_FOR_TEXT}`,
                                                                                }}
                                                                            >
                                                                                {/* {item.created_by_name} */}
                                                                            </span>
                                                                            <br />
                                                                            {item?.is_auto_create == 1 && (
                                                                                <span
                                                                                    className="badge rounded-pill bg-success"
                                                                                    style={{ fontSize: "10px" }}
                                                                                >
                                                                                    auto Created
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {item.id === -1 ? (
                                                                <span></span>
                                                            ) : (
                                                                <>
                                                                    <ul
                                                                        className={`labelDropLeft ${hasIdAvail === item.id &&
                                                                            targetVsIncenTiveDropdown === item.id
                                                                            ? "isVisible"
                                                                            : "isHidden"
                                                                            }`}
                                                                        id="dropLeft"
                                                                        ref={(el) =>
                                                                            (dropdownContactRef.current[item.id] = el)
                                                                        }
                                                                        style={{
                                                                            width: "162px",
                                                                            right: "10px",
                                                                            top: "0",
                                                                        }}
                                                                    >
                                                                        <li
                                                                            className="listItem text-start"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setTargetVsIncentiveDropdown(null);
                                                                                handleEdit(item);
                                                                            }}
                                                                            role="button"
                                                                        >
                                                                            Edit
                                                                        </li>
                                                                        <li
                                                                            className="listItem text-start"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setTargetVsIncentiveDropdown(null);
                                                                                handleModalOpenStatusAssign(
                                                                                    item.id,
                                                                                    item.status,
                                                                                );
                                                                            }}
                                                                            role="button"
                                                                        >
                                                                            Change Status
                                                                        </li>
                                                                        <li
                                                                            className="listItem text-start"
                                                                            role="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setTargetVsIncentiveDropdown(null);
                                                                                handleModalOpen(item.id);
                                                                            }}
                                                                        >
                                                                            Assign label
                                                                        </li>
                                                                        {item?.team_task_assignement_type !=
                                                                            "2" && (
                                                                                <li
                                                                                    className="listItem"
                                                                                    role="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setTargetVsIncentiveDropdown(null);
                                                                                        handleModalOpenUserAssign(item?.id);
                                                                                    }}
                                                                                >
                                                                                    Assign Team Member
                                                                                </li>
                                                                            )}
                                                                        {item?.is_archive == 0 && (
                                                                            <li
                                                                                className="listItem text-start"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTargetVsIncentiveDropdown(null);
                                                                                    openArchiveTaskModel(item?.id);
                                                                                }}
                                                                                role="button"
                                                                            >
                                                                                Archive{" "}
                                                                                {supportTicketFlag == 0
                                                                                    ? "Task"
                                                                                    : "Support Ticket"}
                                                                            </li>
                                                                        )}
                                                                        {item?.is_archive == 1 && (
                                                                            <li
                                                                                className="listItem text-start"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTargetVsIncentiveDropdown(null);
                                                                                    openUnArchiveTaskModel(item?.id);
                                                                                }}
                                                                                role="button"
                                                                            >
                                                                                UnArchive{" "}
                                                                                {supportTicketFlag == 0
                                                                                    ? "Task"
                                                                                    : "Support Ticket"}
                                                                            </li>
                                                                        )}
                                                                        {supportTicketFlag == 1 && (
                                                                            <li
                                                                                className="listItem text-start"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTargetVsIncentiveDropdown(null);
                                                                                    openSupportTicketToTaskConvert(
                                                                                        item?.id,
                                                                                    );
                                                                                }}
                                                                                role="button"
                                                                            >
                                                                                Convert To Task
                                                                            </li>
                                                                        )}
                                                                        {item?.is_archive == 0 && (
                                                                            <li
                                                                                className="listItem text-start"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTargetVsIncentiveDropdown(null);
                                                                                    openStageAndStatusLog(item?.id);
                                                                                }}
                                                                                role="button"
                                                                            >
                                                                                Timeline
                                                                            </li>
                                                                        )}
                                                                        <li
                                                                            style={{
                                                                                color: "red",
                                                                                fontWeight: "600",
                                                                            }}
                                                                            className="listItem text-start"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setTargetVsIncentiveDropdown(null);
                                                                                openDeleteModel(item.id);
                                                                            }}
                                                                            role="button"
                                                                        >
                                                                            Delete
                                                                        </li>
                                                                    </ul>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                    </>
                                )}
                            </div>
                        ) : (
                            <p className="text-danger p-1">
                                {DEFAULT_MESSAGE_ERROR_PERMISSION}
                            </p>
                        )}
                    </div>
                </div>
            ) : null}

            {isModalAssignLabelVisible && (
                <CheckBoxModal
                    show={isModalAssignLabelVisible}
                    // onHide={handleModalClose}
                    onHide={() => setIsModalAssignLabelVisible(false)}
                    handleSubmit={handleConfirmAssignLabel}
                    title={
                        selectedIds.length > 0
                            ? `Assign Labels to ${selectedIds.length} Task`
                            : "Assign Labels to Task"
                    }
                    btn1="Cancel"
                    btn2="Submit"
                    options={options}
                    // selectedLabelIds={selectedLabelIds}
                    selectedLabelIds={
                        taskList?.find((item) => item.id === TaskId)?.label_id
                    }
                    contactId={TaskId}
                    getOptionColor={(option) => option.color || "#eeeeee"}
                    getOptionName={(option) => option.lable_name}
                    showColorBadge={true}
                />
            )}
            {isKanbanViewDisplay && (
                <KanbanBoard
                    supportTicketFlag={supportTicketFlag}
                    show={isKanbanViewDisplay}
                    handleclose={() => {
                        setIsKanbanViewDisplay(false);
                        fetchApiTask(
                            setTaskList,
                            setLoading,
                            contactId,
                            searchTerm,
                            selectedButton === "all" ? 1 : 2,
                            isDueTask ? 3 : 0,
                            selectedStageStatusId,
                            selectedCategoryId,
                            0,
                            ITEMS_PER_PAGE,
                            selectedPriorityId,
                            filterParams.startSearchDate,
                            filterParams.endSearchDate,
                            filterParams.checkedOptionsStageStatus,
                            filterParams.assignedByMultiTeamMember,
                            filterParams.createdByMultiTeamMember,
                            setTaskId,
                            7,
                            filterParams.checkedOptionsTaskassignOrNot,
                            setTaskAutoRefreshON,
                            setTaskAutoRefreshTimeout,
                            setTaskAutoRefreshInactivityDelay,
                            setTaskCountGet,
                            isArchivedTask ? "1" : "0",
                            filterParams.checkedOptionsTaskType,
                            filterParams.checkedOptionsShowTemplateTask,
                            supportTicketFlag,
                            setTaskCountGetAll,
                            setTaskCountGetMy,
                            selectedLabelId,
                        );
                    }}
                    kanbanViewTitle={"My Tasks"}
                    contact_id={contactId}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => setIsDeleteConfirmation(false)}
                    handleSubmit={() => handelDeleteTask()}
                    title={
                        selectedIds.length > 0
                            ? `Delete ${selectedIds.length} Task`
                            : "Delete this Task"
                    }
                    message={
                        selectedIds.length > 0
                            ? `Are you sure you want Delete ${selectedIds.length} Task?`
                            : "Are you sure you want Delete this Task?"
                    }
                    btn1="CANCEL"
                    btn2="DELETE Task"
                />
            )}
            {isTaskComplatedConfirmation &&
                (() => {
                    const itemLabel = supportTicketFlag == 0 ? "Task" : "Support Ticket";

                    return (
                        <ConfirmationModal
                            show={isTaskComplatedConfirmation}
                            onHide={() => setIsTaskComplatedConfirmation(false)}
                            handleSubmit={() => handelComplateTaskForList()}
                            title={
                                selectedIds.length > 0
                                    ? `Complete ${selectedIds.length} ${itemLabel}`
                                    : `Complete this ${itemLabel}`
                            }
                            message={
                                selectedIds.length > 0
                                    ? `Are you sure you want to complete ${selectedIds.length} ${itemLabel}?`
                                    : `Are you sure you want to complete this ${itemLabel}?`
                            }
                            btn1="CANCEL"
                            btn2={`Complete ${itemLabel}`}
                        />
                    );
                })()}
            {isArchiveTaskConfirmation && (
                <ConfirmationModal
                    show={isArchiveTaskConfirmation}
                    onHide={() => setIsArchiveTaskConfirmation(false)}
                    handleSubmit={() => handelArchiveTask()}
                    title={
                        selectedIds.length > 0
                            ? `Archive ${selectedIds.length} ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }`
                            : `Archive this ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }`
                    }
                    message={
                        selectedIds.length > 0
                            ? `Are you sure you want Archive ${selectedIds.length} ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }?`
                            : `Are you sure you want Archive this ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }?`
                    }
                    btn1="CANCEL"
                    btn2={`Archive ${supportTicketFlag == 0 ? "Task" : "Support Ticket"}`}
                />
            )}

            {isUnArchiveTaskConfirmation && (
                <ConfirmationModal
                    show={isUnArchiveTaskConfirmation}
                    onHide={() => setIsUnArchiveTaskConfirmation(false)}
                    handleSubmit={() => handelUnArchiveTask()}
                    title={
                        selectedIds.length > 0
                            ? `UnArchive ${selectedIds.length} ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }`
                            : `UnArchive this ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }`
                    }
                    message={
                        selectedIds.length > 0
                            ? `Are you sure you want UnArchive ${selectedIds.length} ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }?`
                            : `Are you sure you want UnArchive this ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                            }?`
                    }
                    btn1="CANCEL"
                    btn2={`UnArchive ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                        }`}
                />
            )}

            {isConvertSupportTikcetToTask && (
                <ConfirmationModal
                    show={isConvertSupportTikcetToTask}
                    onHide={() => setIsConvertSupportTikcetToTask(false)}
                    handleSubmit={handelConvertSupportTikcetToTask}
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

            {isStageAndStatusModalOpen && (
                <EventLogs
                    show={isStageAndStatusModalOpen}
                    onHide={() => setIsStageAndStatusModalOpen(false)}
                    reference_id={stageAndStatusData?.taskId}
                    reference_table={stageAndStatusData?.referenceTable}
                    requiredTabs={["status_timeline"]}
                />
            )}

            {isModalAssignStatusVisible && (
                <RadioButtonModal
                    show={isModalAssignStatusVisible}
                    onHide={() => onHide()}
                    handleSubmit={handleConfirmRadioButton}
                    title={`Change Status for ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                        }`}
                    message={`Please select the Status for this ${supportTicketFlag == 0 ? "Task" : "Support Ticket"
                        }`}
                    btn1="Cancel"
                    btn2="Submit"
                    options={optionRadioButtonStatus}
                    selectedLabelIds={
                        taskList.find(
                            (item) => item.id === statusAssignContactId,
                        )?.status
                    }
                    getOptionColor={(option: any) => option.color || "#eeeeee"}
                    getOptionName={(option: any) => option.name}
                    showColorBadge={true}
                    contactId={editTargetVsIncentiveItem?.id}
                />
            )}

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
                        taskList.find(
                            (item) =>
                                item.id === (userAssignTaskId ?? editTargetVsIncentiveItem?.id),
                        )?.assigned_team_member
                    }
                    contactId={userAssignTaskId ?? editTargetVsIncentiveItem?.id}
                    getOptionName={getOptionName}
                    showColorBadge={false}
                />
            )}

            {isOpenCreateModel && (
                <CreateTaskView
                    show={isOpenCreateModel}
                    onHide={() => onhideTaskModal()}
                    // onHide={() => setIsCreateModel(false)}
                    setTargetVsIncentiveList={setTaskList}
                    setLoading={setLoading}
                    headerName={
                        supportTicketFlag == 0 ? "Create Task" : "Create Support Ticket"
                    }
                    productToEdit={undefined}
                    selectedButton={selectedButton}
                    selectedStageStatusId={Number(selectedStageStatusId)}
                    selectedPriorityId={selectedPriorityId || undefined}
                    selectedButtonDue={selectedButtonDue}
                    supportTicketFlag={supportTicketFlag}
                    contactId={contactId}
                />
            )}
            {isOpenEditModel && (
                <CreateTaskView
                    show={isOpenEditModel}
                    onHide={() => onHide()}
                    productToEdit={editTargetVsIncentiveItem?.id}
                    headerName={
                        supportTicketFlag == 0 ? "Edit Task" : "Edit Support Ticket"
                    }
                    setTargetVsIncentiveList={setTaskList}

                    setLoading={setLoading}
                    selectedButton={selectedButton}
                    selectedStageStatusId={Number(selectedStageStatusId)}
                    selectedPriorityId={selectedPriorityId || undefined}
                    selectedButtonDue={selectedButtonDue}
                    supportTicketFlag={supportTicketFlag}
                    contactId={contactId}
                />
            )}
            {isModalFilterVisible && (
                <CheckBoxFilterModal
                    show={isModalFilterVisible}
                    onHide={handleModalClose}
                    handleSubmit={handleConfirmFilter}
                    title={
                        supportTicketFlag == 0
                            ? "Filter your Task"
                            : "Filter your Support Ticket"
                    }
                    message="Please select the Dates , Status And Team Member."
                    btn1="Clear"
                    btn2="Apply"
                    filtersToShow={[1, 4, 10, 9, 11, 12]} // 10 = unassigned
                    stageandStatusOrderType={8}
                    pageId={1}
                    initialFilterData={filterParams.filterData}
                    initialCheckedOptions={filterParams.checkedOptions}
                    initialStartSearchDate={filterParams.startSearchDate}
                    initialEndSearchDate={filterParams.endSearchDate}
                    initialCheckedOptionsStageStatus={
                        filterParams.checkedOptionsStageStatus
                    }
                    initialCheckedOptionsTaskType={filterParams.checkedOptionsTaskType}
                    initialCheckedAssignedByMultiTeamMember={
                        filterParams.assignedByMultiTeamMember
                    }
                    initialCheckedCreatedByMultiTeamMember={
                        filterParams.createdByMultiTeamMember
                    }
                    initialCheckedOptionsTaskAssignOrnot={
                        filterParams.checkedOptionsTaskassignOrNot || []
                    }
                    initialCheckedOptionsShowTaskTemplate={
                        filterParams.checkedOptionsShowTemplateTask || []
                    }
                    labelFilderApplyAndOr={0}
                />
            )}

        </>
    );
};

export default ContactTaskListView;