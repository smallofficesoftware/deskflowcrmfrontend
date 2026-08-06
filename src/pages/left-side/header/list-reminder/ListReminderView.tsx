import React, { useContext, useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { AppContext } from "../../../../common/AppContext";
import {
  formatDateAndTime,
  useEscapeKey,
} from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import ReminderCompleted from "../../../../components/model/ReminderComleted";
import ReminderModal from "../../../../components/model/ReminderModal";
import SafeHtml from "../../../../components/SafeHtml";
import { useTheme } from "../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { IFilterPayload, TFilterDate } from "../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../../services/axiosInstance";
import TaskChatRightSide from "../../../right-side/task-chat/TaskChatRightSide";
import { IUserList } from "../../LeftSideController";
import { ITaskView } from "../Setting/taskList/TaskListController";
import {
  createReminderForMy,
  createRescheduleReminder,
  fetchReminderApi,
  handleDeleteReminder,
  IReminderList,
  updateContactFormReminder,
  updateInquiryFormReminder,
  updateOrderFormReminder,
} from "./ListReminderController";
import ReminderCalender from "./ReminderCalender"; // Import the ReminderCalender component

// ListReminderView Component
interface IPropReminder {
  isReminderOpen: boolean;
  closeReminder: () => void;
  openRightSide: (singleData: IUserList) => void;
  openTaskRight?: (signleDataTask: ITaskView) => void;
  searchTermFromRightSide: string;
  setSearchTermFromRightSide: (data: string) => void;
}

const ListReminderView = ({
  isReminderOpen,
  closeReminder,
  openRightSide,
  openTaskRight,
  searchTermFromRightSide,
  setSearchTermFromRightSide,
}: IPropReminder) => {
  const { isTaskRightSideopen, setIsTaskRightSideOpen } =
    useContext(AppContext)!;
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [reminderList, setReminderList] = useState<IReminderList[]>([]);
  const [searchDate, setSearchDate] = useState<DateObject | null>(null);
  // const [selectedButton, setSelectedButton] = useState<string>("all");
  const [selectedButton, setSelectedButton] = useState<
    "due" | "future" | "complete" | "all"
  >("due");
  const [hasOneData, setHasOneData] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [labelDropdownOpen, setLabelDropdownOpen] = useState<any>(null);
  const [isReminderConfirmationStatus, setIsReminderConfirmationStatus] =
    useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isReminderConfirmation, setIsReminderConfirmation] = useState(false);
  const [isSetReminderConfirmation, setIsSetReminderConfirmation] =
    useState(false);
  const [reminderCheckFlag, setReminderCheckFlag] = useState<number>(0);
  const [allreminderCheckFlag, setAllreminderCheckFlag] = useState<number>(0);
  const [isTaskChatRightSide, setIsTaskChatRightSide] = useState(false);
  const [reminderRescheduleData, setReminderRescheduleData] =
    useState<IReminderList>();
  const datePickerRef = useRef<any>(null);
  const [
    isReminderConfirmationStatusData,
    setIsReminderConfirmationStatusData,
  ] = useState<IReminderList>();
  const { darkMode } = useTheme();
  const [noDataFound, setNoDataFound] = useState<boolean>(false);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );

  const [companyFlag, setCompanyFlag] = useState<string | number | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [filterType, setFilterType] = useState<
    "due" | "future" | "complete" | "all"
  >("all");
  const [counts, setCounts] = useState({ due: 0, future: 0, complete: 0 });
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tooltipBgColor, setTolltipBgColor] = useState<string>("#fff");
  const [selectedTask, setSelectedTask] = useState<ITaskView | null>(null); // State for selected task
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);

  interface IFilterParams {
    startSearchDate: TFilterDate;
    endSearchDate: TFilterDate;
    initialCreatedMembers: any[] | undefined;
    initialAssignedMembers: any[] | undefined;
  }
  const [filterParams, setFilterParams] = useState<IFilterParams>({
    startSearchDate: "",
    endSearchDate: "",
    initialAssignedMembers: [],
    initialCreatedMembers: [],
  });

  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      setIsModalFilterVisible(false);
    }
    setHasData(false);
  };
  const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
    const {
      startSearchDate,
      endSearchDate,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
    } = filterPayload;
    setFilterParams({
      startSearchDate:
        startSearchDate instanceof DateObject
          ? startSearchDate.format("YYYY-MM-DD")
          : startSearchDate,
      endSearchDate:
        endSearchDate instanceof DateObject
          ? endSearchDate.format("YYYY-MM-DD")
          : endSearchDate,
      initialAssignedMembers: assignedByMultiTeamMember,
      initialCreatedMembers: createdByMultiTeamMember,
    });

    setHasData(startSearchDate !== "" || endSearchDate !== "");
    let typeFilter = selectedButton;
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      (newItems) => {
        setReminderList(newItems);
      },
      searchDate,
      setNoDataFound,
      setLoading,
      reminderCheckFlag,
      allreminderCheckFlag,
      setCompanyFlag,
      "",
      typeFilter,
      setCounts,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      startSearchDate,
      endSearchDate,
    );

    setIsModalFilterVisible(false);
  };

  useEscapeKey(() => {
    setIsTaskRightSideOpen(false);
    closeReminder();
  });

  const canView = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(PAGE_ID.REMINDER, PERMISSION_TYPE.ADD);
  const canDelete = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.DELETE,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.EDIT,
  );
  const canApprove = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.APPROVE,
  );

  const itemsPerPage = 50;
  const [hasMoreData, setHasMoreData] = useState(true);

  useEffect(() => {
    if (canView) {
      setCurrentPage(0);
      setHasMoreData(true);
      fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        (newItems) => {
          setReminderList(newItems);
        },
        "",
        setNoDataFound,
        setLoading,
        reminderCheckFlag,
        allreminderCheckFlag,
        setCompanyFlag,
        "",
        "due",
        setCounts,
        filterParams.initialAssignedMembers,
        filterParams.initialCreatedMembers,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
      );
    }
  }, [reminderCheckFlag, allreminderCheckFlag, canView]);
  const fetchAsyncReminderAPI = async (date: DateObject | null) => {
    try {
      if (date) {
        let typeFilter = selectedButton;
        await fetchReminderApi(
          0,
          ITEMS_PER_PAGE,
          setReminderList,
          date,
          setNoDataFound,
          setLoading,
          reminderCheckFlag,
          allreminderCheckFlag,
          setCompanyFlag,
          "",
          typeFilter,
          setCounts,
          filterParams.initialAssignedMembers,
          filterParams.initialCreatedMembers,
          filterParams.startSearchDate,
          filterParams.endSearchDate,
        );
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setLoading(false);
      return false;
    }
  };
  const handleDateChange = (date: DateObject | null): void | false => {
    setSearchDate(date);
    setCurrentPage(0);
    setLoading(true);
    fetchAsyncReminderAPI(date);
  };
  const handleButtonClick = () => {
    if (searchDate) {
      handleDateClear();
    } else if (datePickerRef.current) {
      const input = datePickerRef.current?.querySelector("input");
      input?.focus();
    }
  };
  useEffect(() => {
    let isThrottled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (isThrottled) return;

      const el = listInnerRef.current;
      if (el && !loading && hasMoreData && !noDataFound) {
        const isBottomReached =
          el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (isBottomReached) {
          isThrottled = true;
          setLoading(true);
          fetchReminderApi(
            currentPage + 1,
            ITEMS_PER_PAGE,
            (newItems) => {
              if (newItems.length > 0) {
                setReminderList((prev) => [
                  ...prev,
                  ...(Array.isArray(newItems) ? newItems : []),
                ]);
                setCurrentPage((prevPage) => prevPage + 1);
                setNoDataFound(false);
              } else {
                setHasMoreData(false);
              }
              setLoading(false);
              isThrottled = false;
            },
            searchDate,
            setNoDataFound,
            setLoading,
            reminderCheckFlag,
            allreminderCheckFlag,
            setCompanyFlag,
            "",
            filterType,
            setCounts,
            filterParams.initialAssignedMembers,
            filterParams.initialCreatedMembers,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
          );
        }
      }

      timeoutId = setTimeout(() => {
        isThrottled = false;
      }, 200);
    };

    const el = listInnerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);

    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    loading,
    currentPage,
    searchDate,
    reminderCheckFlag,
    allreminderCheckFlag,
    hasMoreData,
    noDataFound,
  ]);

  const handleDateClear = () => {
    setSearchDate(null);
    setCurrentPage(0);
    setReminderList([]);
    setLoading(true);
    let typeFilter = selectedButton;
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      setReminderList,
      "",
      setNoDataFound,
      setLoading,
      reminderCheckFlag,
      allreminderCheckFlag,
      setCompanyFlag,
      "",
      typeFilter,
      setCounts,
      filterParams.initialAssignedMembers,
      filterParams.initialCreatedMembers,
      filterParams.startSearchDate,
      filterParams.endSearchDate,
    );
  };

  const handleGetAllRemainderData = () => {
    const newFlag = reminderCheckFlag === 1 ? 0 : 1;
    setReminderCheckFlag(newFlag);
    setCurrentPage(0);
    setReminderList([]);
    setLoading(true);
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      setReminderList,
      searchDate,
      setNoDataFound,
      setLoading,
      newFlag,
      allreminderCheckFlag,
      setCompanyFlag,
      "",
      "",
      setCounts,
      filterParams.initialAssignedMembers,
      filterParams.initialCreatedMembers,
      filterParams.startSearchDate,
      filterParams.endSearchDate,
    );
  };

  const handleAllReminderCheckbox = () => {
    const newFlag = allreminderCheckFlag === 1 ? 0 : 1;
    setAllreminderCheckFlag(newFlag);
    setCurrentPage(0);
    setReminderList([]);
    setLoading(true);
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      setReminderList,
      searchDate,
      setNoDataFound,
      setLoading,
      reminderCheckFlag,
      newFlag,
      setCompanyFlag,
      "",
      "",
      setCounts,
      filterParams.initialAssignedMembers,
      filterParams.initialCreatedMembers,
      filterParams.startSearchDate,
      filterParams.endSearchDate,
    );
  };

  const toggleDropdownLabel = (id: number) => {
    if (labelDropdownOpen === id) {
      setLabelDropdownOpen(null);
      setHasOneData(null);
    } else {
      setLabelDropdownOpen(id);
      setHasOneData(id);
    }
  };

  const handleChangeReminderComplete = (messageData: IReminderList) => {
    // const currentUserUUID = localStorage.getItem("UUID");
    // const isAssignedUser =
    //   messageData.assigned_to === parseInt(currentUserUUID || "0");

    if (canApprove) {
      setIsReminderConfirmationStatus(true);
      setIsReminderConfirmationStatusData(messageData);
    } else {
      setIsReminderConfirmationStatus(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const [taskSingleData, setTaskSingleData] = useState<any>();
  const getTaskById = (id: number): ITaskView | undefined | void => {
    const task = reminderList.find((t) => t.task_management_id === id);
    setTaskSingleData(
      task
        ? {
          id: task.task_management_id,
          assigned_team_member: task.task_assigned_team_member,
          task_enddate: task.task_end_date,
          task_fromdate: task.task_from_date,
        }
        : undefined,
    );
  };
  const handleChangeStatusOfReminder = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const date = new Date();
    const formattedDateTime = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours(),
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
      date.getSeconds(),
    ).padStart(2, "0")}`;

    const requestData = {
      table: "reminder_messages",
      where: `{"id":"${isReminderConfirmationStatusData?.id}"}`,
      data: `{"status":"1", "completed_date_time":"${formattedDateTime}"}`,
    };

    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        switch (isReminderConfirmationStatusData?.reference_table) {
          case "contact_message_histories":
            await updateContactFormReminder(
              isReminderConfirmationStatusData.reference_id,
            );
            break;
          case "cart_quotation":
          case "cart_order":
          case "cart_invoice":
          case "cart_purchase_order":
            await updateOrderFormReminder(
              isReminderConfirmationStatusData.reference_id,
            );
            break;
          case "inquiries":
            await updateInquiryFormReminder(
              isReminderConfirmationStatusData.reference_id,
            );
            break;
          default:
            break;
        }
        fetchReminderApi(
          0,
          ITEMS_PER_PAGE,
          setReminderList,
          searchDate,
          setNoDataFound,
          setLoading,
          reminderCheckFlag,
          allreminderCheckFlag,
          setCompanyFlag,
          "",
          filterType,
          setCounts,
          filterParams.initialAssignedMembers,
          filterParams.initialCreatedMembers,
          filterParams.startSearchDate,
          filterParams.endSearchDate,
        );
        toast.success("Reminder completed successfully");
        setIsReminderConfirmationStatus(false);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleNewReminder = async () => {
    try {
      await handleChangeStatusOfReminder();
      setIsReminderConfirmationStatus(false);
      setIsSetReminderConfirmation(true);
    } catch (error) {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleUpdateReminder = () => {
    setIsReminderConfirmationStatus(false);
    setReminderRescheduleData(isReminderConfirmationStatusData);
    setIsReminderConfirmation(true);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".icon-more");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    if (!clickedInsideDropdown) {
      setLabelDropdownOpen(null);
      setHasOneData(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setLabelDropdownOpen(null);
    setHasOneData(null);
  }, [reminderList.length, filterType]);

  const handleReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
  }) => {
    if (data.dateTime.trim() && data.remark.trim()) {
      createRescheduleReminder(
        reminderRescheduleData?.id,
        data,
        setIsReminderConfirmation,
        setLoading,
        setReminderList,
        setNoDataFound,
        setCompanyFlag,
        selectedButton,
        searchDate,
        setCounts,
      );
    } else {
      setIsReminderConfirmation(true);
      toast.error("Please enter Date and Time and Remark");
    }
  };

  const handleSetReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: { value: number; label: string } | null;
    referenceTable?: string;
    referenceId?: number;
  }) => {
    if (
      data.dateTime.trim() &&
      data.remark.trim() &&
      (data.selectedCategory?.value ||
        isReminderConfirmationStatusData?.assigned_to)
    ) {
      createReminderForMy(
        {
          dateTime: data.dateTime,
          remark: data.remark,
          status: data.status,
          selectedCategory: data.selectedCategory || {
            value: isReminderConfirmationStatusData?.assigned_to || 0,
            label: isReminderConfirmationStatusData?.assigned_to_name || "",
          },
          referenceTable:
            data.referenceTable ||
            isReminderConfirmationStatusData?.reference_table ||
            null,
          referenceId:
            data.referenceId ||
            isReminderConfirmationStatusData?.reference_id ||
            null,
          contactMastersId:
            isReminderConfirmationStatusData?.contact_masters_id || null,
          mobileNumber:
            isReminderConfirmationStatusData?.mobile_number || undefined,
          contactMessage:
            isReminderConfirmationStatusData?.contact_message || undefined,
          companyMastersId:
            isReminderConfirmationStatusData?.company_masters_id,
          assignedTo: isReminderConfirmationStatusData?.assigned_to,
          assignedToName: isReminderConfirmationStatusData?.assigned_to_name,
        },
        setIsSetReminderConfirmation,
        setLoading,
        setReminderList,
        setNoDataFound,
        setCompanyFlag,
        filterType,
        searchDate,
        setCounts,
      );
    } else {
      toast.error("Please enter Date and Time, Remark, and Select Team Member");
      setIsSetReminderConfirmation(true);
    }
  };

  const handelRefreshReminder = () => {
    if (canView) {
      setCurrentPage(0);
      setReminderList([]);
      setLoading(true);
      let typeFilter = selectedButton;
      fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        searchDate,
        setNoDataFound,
        setLoading,
        reminderCheckFlag,
        allreminderCheckFlag,
        setCompanyFlag,
        "",
        typeFilter,
        setCounts,
        filterParams.initialAssignedMembers,
        filterParams.initialCreatedMembers,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
      );
    }
  };

  const handelChangeDelete = (messageData: IReminderList) => {
    if (canDelete) {
      setIsDeleteConfirmation(true);
      setIsReminderConfirmationStatusData(messageData);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  function addReminder() {
    if (canAdd) {
      setIsSetReminderConfirmation(true);
      setIsReminderConfirmationStatusData(undefined);
    } else {
      setIsSetReminderConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function openSearch() {
    if (canView) {
      setSearchOpen(!searchOpen);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  useEffect(() => {
    if (searchTermFromRightSide === "Add Reminder") {
      addReminder();
    }
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setLabelDropdownOpen(null);
    setHasOneData(null);
    if (value.length >= 2 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout to trigger API call after 5 seconds
      setSearchTimeout(
        setTimeout(() => {
          let typeFilter = selectedButton;

          fetchReminderApi(
            0,
            ITEMS_PER_PAGE,
            setReminderList,
            searchDate,
            setNoDataFound,
            setLoading,
            reminderCheckFlag,
            allreminderCheckFlag,
            setCompanyFlag,
            value,
            typeFilter,
            setCounts,
            filterParams.initialAssignedMembers,
            filterParams.initialCreatedMembers,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
          );
        }, 1000),
      );
    }
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(!searchOpen);

    // Set new timeout to trigger API call after 5 seconds
    setSearchTimeout(
      setTimeout(() => {
        let typeFilter = selectedButton;
        fetchReminderApi(
          0,
          ITEMS_PER_PAGE,
          setReminderList,
          searchDate,
          setNoDataFound,
          setLoading,
          reminderCheckFlag,
          allreminderCheckFlag,
          setCompanyFlag,
          "",
          typeFilter,
          setCounts,
          filterParams.initialAssignedMembers,
          filterParams.initialCreatedMembers,
          filterParams.startSearchDate,
          filterParams.endSearchDate,
        );
      }, 1000),
    );
  };

  // Calendar functions
  const toggleCalendarView = () => {
    setIsCalendarOpen(true);
  };

  const closeCalendarView = () => {
    setIsCalendarOpen(false);
  };
  const dateInputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
    }
  };
  const handleFilterChange = (
    typeFilter: "due" | "future" | "complete" | "all",
  ) => {
    setLabelDropdownOpen(null);
    setHasOneData(null);
    setSelectedButton(typeFilter);
    setFilterType(typeFilter);
    setCurrentPage(0);
    setReminderList([]);
    setLoading(true);
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      setReminderList,
      searchDate,
      setNoDataFound,
      setLoading,
      reminderCheckFlag,
      allreminderCheckFlag,
      setCompanyFlag,
      searchTerm,
      typeFilter,
      setCounts,
      filterParams.initialAssignedMembers,
      filterParams.initialCreatedMembers,
      filterParams.startSearchDate,
      filterParams.endSearchDate,
    );
  };

  const handleChangeReminderReschedule = (messageData: IReminderList) => {
    if (canEdit) {
      setIsReminderConfirmation(true);

      // Clean the remark before setting
      const cleanRemark = messageData.remark
        ? messageData.remark
          .replace(/<br\s*\/?>/gi, "\n") // Replace <br> with newlines
          .replace(/<\/?[^>]+(>|$)/g, "") // Remove other HTML tags
          .trim() // Trim extra spaces
        : "";

      setReminderRescheduleData({
        ...messageData,
        remark: cleanRemark,
      });
      let typeFilter = selectedButton;

      fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        searchDate,
        setNoDataFound,
        setLoading,
        reminderCheckFlag,
        allreminderCheckFlag,
        setCompanyFlag,
        searchTerm,
        typeFilter,
        setCounts,
        filterParams.initialAssignedMembers,
        filterParams.initialCreatedMembers,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
      );
    } else {
      setIsReminderConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const showTooltip = (text: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip(text);
    let toolTipBgColorContain = "#fff";
    if (text == "Due") {
      toolTipBgColorContain = "red";
    } else if (text === "Upcoming") {
      toolTipBgColorContain = "#0066ff";
    } else if (text === "Completed") {
      toolTipBgColorContain = "#198754";
    } else if (text === "All") {
      toolTipBgColorContain = "#b1682d";
    }
    setTolltipBgColor(toolTipBgColorContain);
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 50 });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const handleClickRIght = (item: IReminderList) => {
    const labelNamesStr = item.labels?.map((l) => l.label_name).join(",") || "";
    const labelColorsStr = item.labels?.map((l) => l.color).join(",") || "";
    // Handle contact click for openRightSide
    if (item.contact_masters_id && item.person_name && item.mobile_number) {
      setIsTaskChatRightSide(false);

      openRightSide({
        id: item.contact_masters_id,
        to_customer_id: item.contact_masters_id,
        person_name: item.person_name || "",
        to_customer_name: item.person_name || "",
        mobile_number: item.mobile_number || "",
        company_name: item.company_name || "",
        email_id: "",
        country_name: "",
        state_name: "",
        city_name: "",
        area_name: "",
        address: "",
        shipping_address: "",
        gst_number: "",
        source_name: item.sources?.source_name || "",
        stage_status_name: item.status_name?.name || "",
        label_name: labelNamesStr,
        created_date_time: "",
        is_pin: 0,
        is_unread: 1,
        label_color: labelColorsStr,
        source_name_color: item.sources?.color || "",
        stage_status_color: item.status_name?.color || "",
        lable: item.lable,
        contact_status: item.contact_status,
        assinged_to_work_a_application_id:
          item.assinged_to_work_a_application_id,
        assinged_to_price_list: 0,
        a_application_login_id: 0,
        is_pin_by_a_application_login_id: "",
        reminderDueCount: 0,
      });
    }

    // Handle task click for openTaskRight
    if (item.task_management_id && Number(item.task_management_id) > 0) {
      setIsTaskChatRightSide(true);
      setIsTaskRightSideOpen(true);
      const taskData: ITaskView = {
        id: Number(item.task_management_id),
        assigned_team_member: item.task_assigned_team_member || "",
        task_fromdate: item.task_from_date || "",
        task_enddate: item.task_end_date || "",
        created_date_time: item.create_date_time || "",
        task_type: 0,
        task_title: item.task_management_title || "",
        task_remark: item.task_management_remark || "",
        task_category_id: 0,
      };
      setSelectedTask(taskData);
      openTaskRight?.(taskData);
    }

    if (!item.contact_masters_id && !item.task_management_id) {
      console.warn("Neither task nor contact is clickable for item:", item);
    }
  };
  return (
    <>
      {isReminderOpen ? (
        <div
          className="leftSide animate__animated animate__fadeInLeft"
          id="group"
        >
          <div className="header-Chat row-1">
            <div className="ICON">
              <button
                className="icons"
                onClick={() => {
                  setIsTaskRightSideOpen(false);
                  closeReminder();
                }}
              >
                <span className="text-white" title="Back">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
            <div className="newText">
              <h2>My Reminders</h2>
            </div>

            <div
              className="text-end"
              style={{ marginBottom: "50px", marginLeft: "auto" }}
            >
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
              <button className="icons pP text-end" onClick={addReminder}>
                <span className="text-white" title="Create Reminder">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="26px"
                    viewBox="0 -960 960 960"
                    width="26px"
                    fill="currentColor"
                    className="ml-2"
                  >
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </span>
              </button>
              <button
                className="icons pP"
                style={{ marginBottom: "50px" }}
                onClick={() => setIsModalFilterVisible(true)}
              >
                <span className="text-white" title="Filter">
                  <svg
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill={hasData ? "red" : "currentColor"}
                  >
                    <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                  </svg>
                </span>
              </button>
              <button
                className="icons pP text-end"
                onClick={handelRefreshReminder}
              >
                <span className="text-white" title="Refresh">
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
                </span>
              </button>
              <button
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
              </button>
            </div>
          </div>
          {searchOpen && (
            <>
              <div className="header-search" style={{ zIndex: "1" }}>
                <div className="search-bar">
                  <div className=" d-flex justify-content-between">
                    <button className="search">
                      <span className="">
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

                    <span className="go-back">
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
                      title="Search "
                      aria-label="Search or start new chat"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="search-message-input"
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
              <div className="row align-items-center m-0 mt-1">
                <div
                  className="col-12 d-flex align-items-center"
                  ref={datePickerRef}
                >
                  <label className="form-label mb-0 me-2 fw-semibold">
                    Filter Date:
                  </label>
                  <div className="flex-grow-1">
                    <DatePicker
                      value={searchDate}
                      onChange={handleDateChange}
                      format="DD-MM-YYYY"
                      calendarPosition="bottom-left"
                      className="form-control"
                      placeholder="DD-MM-YYYY"
                      style={{ height: "38px", width: "100%" }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-light border ms-2 p-2 d-flex align-items-center justify-content-center"
                    onClick={handleButtonClick}
                    title="Clear Filter"
                    style={{ height: "38px", width: "38px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#5f6368"
                    >
                      <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
          {canView ? (
            <>
              <div className="mt-2">
                <button
                  className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "all" ? "selected-btn" : ""
                    }`}
                  onClick={() => handleFilterChange("all")}
                >
                  <span className="contact-btn-search-text"> All </span>
                </button>
                <button
                  className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "due" ? "selected-btn" : ""
                    }`}
                  onClick={() => handleFilterChange("due")}
                >
                  <span className="contact-btn-search-text"> Due </span>
                  <span
                    className="badge bg-danger ms-1"
                    style={{
                      fontSize: "0.60rem",
                      lineHeight: "15px",
                      borderRadius: "45%",
                      minWidth: "20px",
                      height: "20px",
                    }}
                  >
                    {counts.due}
                  </span>
                </button>
                <button
                  className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "future" ? "selected-btn" : ""
                    }`}
                  onClick={() => handleFilterChange("future")}
                >
                  <span className="contact-btn-search-text"> Upcoming </span>
                  <span
                    className="badge ms-1"
                    style={{
                      fontSize: "0.60rem",
                      lineHeight: "15px",
                      borderRadius: "45%",
                      minWidth: "20px",
                      height: "20px",
                      backgroundColor: "#0066ff",
                    }}
                  >
                    {counts.future}
                  </span>
                </button>
                <button
                  className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "complete" ? "selected-btn" : ""
                    }`}
                  onClick={() => handleFilterChange("complete")}
                >
                  <span className="contact-btn-search-text"> Completed </span>
                  <span
                    className="badge bg-success ms-1"
                    style={{
                      fontSize: "0.60rem",
                      lineHeight: "15px",
                      borderRadius: "45%",
                      minWidth: "20px",
                      height: "20px",
                    }}
                  >
                    {counts.complete}
                  </span>
                </button>
              </div>
              <div
                className="chats"
                style={{
                  overflowY: "scroll",
                  height: "calc(91vh - 215px)",
                  marginTop: "10px",
                }}
                ref={listInnerRef}
              >
                {canView ? (
                  <>
                    {loading && reminderList.length === 0
                      ? Array.from({ length: 12 }).map((_, index) => (
                        <div className="block chat-list" key={index}>
                          <div className="h-text">
                            <div className="col-12 d-flex">
                              <div className="col-10 text-start">
                                <span className="reminder_list_text">
                                  <Skeleton
                                    width="50%"
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.5 }}
                                  />
                                </span>
                                <span className="reminder_list_text">
                                  <Skeleton
                                    width="50%"
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.5 }}
                                  />
                                </span>
                                <span className="reminder_list_text">
                                  <Skeleton
                                    width="50%"
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.5 }}
                                  />
                                </span>
                                <p className="time">
                                  <Skeleton
                                    width="50%"
                                    duration={5}
                                    style={{
                                      marginLeft: "70%",
                                      opacity: darkMode ? "" : 0.5,
                                    }}
                                  />
                                </p>
                              </div>
                              <div className="">
                                <button className="icon-more">
                                  <Skeleton
                                    width={30}
                                    height={20}
                                    duration={5}
                                    circle={true}
                                    style={{ opacity: darkMode ? "" : 0.5 }}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                      : reminderList.map((item, index) => {
                        const isEven = index % 2 === 0;
                        let referenceText: string;

                        switch (item.reference_table) {
                          case "cart_quotation":
                            referenceText = "For Quotation";
                            break;
                          case "cart_order":
                            referenceText = "For Order";
                            break;
                          case "cart_invoice":
                            referenceText = "For Invoice";
                            break;
                          case "inquiries":
                            referenceText = "For Inquiry";
                            break;
                          case "contact_message_histories":
                            referenceText = "For Message";
                            break;
                          case "cart_purchase_order":
                            referenceText = "For Purchase Invoice";
                            break;
                          case "task_message_histories":
                            referenceText = "For Task Message";
                            break;
                          default:
                            referenceText = "For General";
                            break;
                        }

                        // const handleClick = (item: any) => {

                        //   if (item.contact_masters_id && item.person_name && item.mobile_number) {
                        //     // setIsTaskRightSideOpen(true)
                        //     // Contact
                        //     openRightSide({
                        //       id: item.contact_masters_id,
                        //       to_customer_id: item.contact_masters_id,
                        //       person_name: item.person_name || "",
                        //       to_customer_name: item.person_name || "",
                        //       mobile_number: item.mobile_number || "",
                        //       email_id: "",
                        //       country_name: "",
                        //       state_name: "",
                        //       city_name: "",
                        //       area_name: "",
                        //       address: "",
                        //       shipping_address: "",
                        //       gst_number: "",
                        //       source_name: "",
                        //       stage_status_name: "",
                        //       label_name: "",
                        //       created_date_time: "",
                        //       is_pin: 0,
                        //       is_unread: 1,
                        //       label_color: "",
                        //       source_name_color: "",
                        //       stage_status_color: "",
                        //       lable: "",
                        //       contact_status: 0,
                        //       assinged_to_work_a_application_id: "",
                        //       assinged_to_price_list: 0,
                        //       a_application_login_id: 0,
                        //       is_pin_by_a_application_login_id: "",
                        //     });
                        //   }
                        //   else if (item.task_id && Number(item.task_id) > 0) {
                        //     // getTaskById(item.task_id)
                        //     setIsTaskChatRightSide(true)

                        //     setIsTaskRightSideOpen(true)
                        //     openTaskRight?.({
                        //       id: Number(item.task_id),
                        //       assigned_team_member: "",
                        //       task_enddate: "",
                        //       task_fromdate: "",
                        //       created_date_time: "",
                        //       task_type: 0,
                        //       task_title: "",
                        //       task_remark: "",
                        //       task_category_id: 0,
                        //     });

                        //   } else {
                        //     console.warn("Neither task nor contact is clickable for item:", item);
                        //   }
                        // };

                        return (
                          <div key={index} className="">
                            <div>
                              <ul
                                className={`labelDropLeft ${hasOneData === item.id &&
                                    labelDropdownOpen === item.id
                                    ? "isVisible"
                                    : "isHidden"
                                  }`}
                                ref={(el) => {
                                  if (el) {
                                    dropdownContactRef.current[item.id] = el;
                                  } else {
                                    delete dropdownContactRef.current[
                                      item.id
                                    ];
                                  }
                                }}
                                style={{ marginTop: "8%" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChangeReminderReschedule(item);
                                    setLabelDropdownOpen(null);
                                    setHasOneData(null);
                                  }}
                                >
                                  Reschedule
                                </li>
                                <li
                                  style={{ color: "red", fontWeight: "600" }}
                                  className="listItem"
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handelChangeDelete(item);
                                    setLabelDropdownOpen(null);
                                    setHasOneData(null);
                                  }}
                                >
                                  Delete
                                </li>
                              </ul>
                            </div>
                            <div
                              className={`block chat-list ${isEven ? "" : ""
                                }`}
                              onClick={() => handleClickRIght(item)}
                            // style={{
                            //   cursor: isClickable ? "pointer" : "default",
                            // }}
                            >
                              {/* <p>{item.task_id}</p> */}
                              <div className="h-text h-100 no">
                                <div className="col-12 d-flex">
                                  <div
                                    className="col-10 text-start"
                                    style={{ width: "300px" }}
                                  >
                                    <span className="reminder_list_text">
                                      <div className="head">
                                        <div className="d-flex align-items-center">
                                          <input
                                            className="custom-checkbox"
                                            type="checkbox"
                                            onClick={() =>
                                              handleChangeReminderComplete(
                                                item,
                                              )
                                            }
                                            checked={item.status === 1}
                                            disabled={item.status === 1}
                                          />
                                          <h4 className="text-start">
                                            <b className="ps-2">#{item.id}</b>
                                          </h4>
                                        </div>
                                      </div>
                                      <b>Remark: </b>
                                      <SafeHtml htmlContent={item.remark} />
                                      <br />
                                      {item.company_name && (
                                        <>
                                          <b>Company Name: </b>
                                          {item.company_name}
                                          <br />
                                        </>
                                      )}
                                      {item.person_name && (
                                        <>
                                          <b>Contact Name: </b>
                                          {item.person_name}
                                          <br />
                                        </>
                                      )}
                                      {item.mobile_number && (
                                        <>
                                          <b>Contact Number: </b>
                                          {item.mobile_number}
                                          <br />
                                        </>
                                      )}
                                    </span>
                                    <br />
                                  </div>
                                  <div className="col-2 text-end">
                                    <div
                                      style={{
                                        position: "absolute",
                                        right: "2%",
                                      }}
                                    >
                                      <button
                                        className="icon-more"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdownLabel(item.id);
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
                                    </div>
                                    <div className="text-end py-1">
                                      <span
                                        style={{
                                          backgroundColor:
                                            item.isDue === 1 &&
                                              !item.completed_date_time
                                              ? "red"
                                              : "",
                                          position: "absolute",
                                          right: "8%",
                                        }}
                                        className="badge rounded-pill text-end"
                                      >
                                        {item.isDue === 1 &&
                                          !item.completed_date_time
                                          ? "Due"
                                          : ""}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="head">
                                  <h4 className="time text-start">
                                    <span
                                      style={{
                                        backgroundColor: "#eeeeee",
                                        border:
                                          "2px solid rgb(207, 207, 207)",
                                        color: "black",
                                      }}
                                      className="badge rounded-pill p-2"
                                    >
                                      {referenceText}
                                    </span>
                                    <br />
                                    <br />
                                    <span
                                      className="time text-end m-0"
                                      style={{
                                        overflowWrap: "break-word",
                                        maxWidth: "150px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "inline-block",
                                      }}
                                      title={item.assigned_to_name}
                                    >
                                      <b>Assign To: </b>
                                      <SafeHtml
                                        htmlContent={item.assigned_to_name}
                                      />
                                    </span>
                                  </h4>
                                  <p className="time text-end">
                                    <b>Reminder Date: </b>
                                    <br />
                                    {item.reminder_data_time}
                                    <br />
                                    <span
                                      className="time text-end m-0"
                                      style={{
                                        overflowWrap: "break-word",
                                        maxWidth: "150px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "inline-block",
                                      }}
                                      title={item.username}
                                    >
                                      <b>Created By: </b>
                                      <SafeHtml htmlContent={item.username} />
                                    </span>
                                  </p>
                                </div>
                                <div className="text-end">
                                  {item.labels?.map((label, index) => (
                                    <span
                                      key={index}
                                      className="badge me-1"
                                      style={{
                                        backgroundColor: label.color,
                                        padding: "2px 6px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: "normal",
                                      }}
                                    >
                                      {label.label_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </>
                ) : (
                  <div className="no_found text-center p-3">
                    <p>
                      No reminders found
                      {searchDate ? " for the selected date" : ""}.
                    </p>
                    {searchDate && (
                      <button
                        className="btn btn-secondary"
                        onClick={handleDateClear}
                      >
                        Clear Date Filter
                      </button>
                    )}
                  </div>
                )}
                {noDataFound && reminderList.length === 0 && (
                  <p className="no_found">No Reminder found</p>
                )}
                {loading && reminderList.length > 0 && (
                  <div className="text-center p-3">
                    <Skeleton width={100} height={20} duration={5} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-danger p-1">
              {DEFAULT_MESSAGE_ERROR_PERMISSION}
            </p>
          )}

          {/* Calendar Modal */}

          {/* Modals */}
          {isReminderConfirmationStatus && (
            <ReminderCompleted
              show={isReminderConfirmationStatus}
              onHide={() => setIsReminderConfirmationStatus(false)}
              handleSubmit={handleChangeStatusOfReminder}
              handleNewSubmit={handleNewReminder}
              title={"Complete or Update Reminder"}
              message={`<strong>Remark: </strong> ${isReminderConfirmationStatusData?.remark || ""
                }`}
              btn1="Cancel"
              btn2="Complete Reminder"
              btn3="New Reminder"
              message1={`<strong>Reminder Date:</strong> ${isReminderConfirmationStatusData &&
                formatDateAndTime(
                  isReminderConfirmationStatusData.reminder_data_time,
                )
                }`}
            />
          )}

          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => setIsDeleteConfirmation(false)}
              handleSubmit={() =>
                handleDeleteReminder(
                  isReminderConfirmationStatusData?.id,
                  setIsDeleteConfirmation,
                  setReminderList,
                  setNoDataFound,
                  setLoading,
                  isReminderConfirmationStatusData,
                  setCompanyFlag,
                  filterType,
                  searchDate,
                  setCounts,
                )
              }
              title={"Delete this Reminder"}
              message={"Are you sure you want to delete this Reminder?"}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}

          {isReminderConfirmation && (
            <ReminderModal
              show={isReminderConfirmation}
              onHide={() => setIsReminderConfirmation(false)}
              handleSubmit={handleReminder}
              title={"Reminder Reschedule"}
              message={"Are you sure you want to reschedule this reminder?"}
              btn1="CANCEL"
              btn2="Set Reminder"
              remarkMsg={reminderRescheduleData?.remark}
              selectedMember={reminderRescheduleData?.assigned_to_name}
              selectedMemberId={reminderRescheduleData?.assigned_to}
              request_flag="1"
              dateTimeMsg={reminderRescheduleData?.reminder_data_time}
            />
          )}
          {isSetReminderConfirmation && (
            <ReminderModal
              show={isSetReminderConfirmation}
              onHide={() => {
                setIsSetReminderConfirmation(false);
                setSearchTermFromRightSide("");
              }}
              handleSubmit={async (data) =>
                await handleSetReminder({
                  ...data,
                  referenceTable:
                    isReminderConfirmationStatusData?.reference_table || "",
                  referenceId:
                    isReminderConfirmationStatusData?.reference_id || 0,
                })
              }
              title={"Set Reminder"}
              message={"Set a new reminder"}
              btn1="CANCEL"
              btn2="Set Reminder"
              remarkMsg={isReminderConfirmationStatusData?.remark || ""}
              request_flag={
                isReminderConfirmationStatusData?.reference_table ===
                  "contact_message_histories"
                  ? "2"
                  : ""
              }
              ContactMessageId={
                isReminderConfirmationStatusData?.reference_table ===
                  "contact_message_histories"
                  ? isReminderConfirmationStatusData?.reference_id
                  : undefined
              }
            />
          )}
        </div>
      ) : null}
      {/* {
        isTaskChatRightSide &&
        <TaskChatRightSide
          onHideTaskChat={() => { }}
          signleDataTask={taskSingleData}
          openTaskRight={openTaskRight} />
      } */}
      {isTaskChatRightSide && selectedTask && (
        <TaskChatRightSide
          onHideTaskChat={() => {
            setIsTaskChatRightSide(false);
            setSelectedTask(null);
          }}
          signleDataTask={selectedTask}
          openTaskRight={openTaskRight}
        />
      )}
      <ReminderCalender
        isCalendarOpen={isCalendarOpen}
        closeCalendar={closeCalendarView}
        reminderList={reminderList}
      />
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirmFilter}
          title="Filter your Reminders"
          message="Please select the Date for the Reminders"
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 9]}
          pageId={0}
          initialCheckedCreatedByMultiTeamMember={
            filterParams.initialCreatedMembers
          }
          initialCheckedAssignedByMultiTeamMember={
            filterParams.initialAssignedMembers
          }
          initialStartSearchDate={filterParams.startSearchDate}
          initialEndSearchDate={filterParams.endSearchDate}
        />
      )}
    </>
  );
};

export default ListReminderView;
