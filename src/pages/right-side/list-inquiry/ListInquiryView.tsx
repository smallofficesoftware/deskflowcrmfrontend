import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import {
  convertDateTimeFormat,
  useEscapeKey,
} from "../../../common/SharedFunction";
import ExcelExport from "../../../components/ExcelExport";
import CheckBoxFilterModal from "../../../components/model/CheckBoxFilterModal";
import CheckBoxModal from "../../../components/model/CheckBoxModal";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import EventLogs from "../../../components/model/EventLogModel/EventLogsModel";
import RadioButtonModal from "../../../components/model/RadioButtonModal";
import ReminderModal from "../../../components/model/ReminderModal";
import WorkFlowModel from "../../../components/model/workflowConformatioModel/workFlowModelView";
import SafeHtml from "../../../components/SafeHtml";
import { useTheme } from "../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  SMALL_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IFilterPayload, TFilterDate } from "../../../helpers/AppInterface";
import { TReactSetState } from "../../../helpers/AppType";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import { fetchLabelApi } from "../../left-side/header/Setting/label/LabelController";
import { IUserList } from "../../left-side/LeftSideController";
import { fetchDepartmentsApi } from "../../left-side/list-company/EditTeamMemberController";
import CreateInquiryView from "../create-inquiry/CreateInquiryView";
import CreateTaskView from "../create-task/CreateTaskView";
import {
  createReminderForInquiry,
  fetchAllCompanyApi,
  fetchInquiryApi,
  fetchStageStatusForInquiryApi,
  handleChangeStatusOfReminderForInquiry,
  IInquiry,
  updateCheckBox,
  updateStageStatusForInquiriesRadioButton,
  updateUserCheckBox,
} from "./ListInquiryController";

interface IPropsListInquiry {
  isListInquiry: boolean;
  closeListInquiry: () => void;
  contactData?: any;
  isModelOpen: any;
  setNoDataFound1: TReactSetState<boolean>;
  openRightSide: (singleData: IUserList) => void;
  setRefreshInquirys?: (value: boolean | number) => void;
}

const ListInquiryView = ({
  isListInquiry,
  closeListInquiry,
  contactData,
  isModelOpen,
  setNoDataFound1,
  openRightSide,
  setRefreshInquirys,
}: IPropsListInquiry) => {
  const listInnerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<Record<number, HTMLUListElement | null>>({});

  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [contactSelections, setContactSelections] = useState<{
    [key: number]: any[];
  }>({});

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hover, setHover] = useState(false);
  const [inquiryList, setInquiryList] = useState<IInquiry[]>([]);
  const { darkMode, toggleTheme } = useTheme();
  const [noDataFound, setNoDataFound] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [options, setOptions] = useState<any[]>([]);
  const [hasOneData, setHasOneData] = useState<number | null>(null);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isCreateInquiry, setIsCreateInquiry] = useState(false);
  const [isSetReminderConfirmation, setIsSetReminderConfirmation] =
    useState(false);

  const [labelDropdownOpen, setLabelDropdownOpen] = useState<any>(null);
  const [inquiryId, setInquiryId] = useState<number>();
  const [inquiryToEdit, setInquiryToiEdit] = useState<IInquiry>();
  const [editInquiry, setEditInquiry] = useState(false);
  const [refreshInquiry, setRefreshInquiry] = useState(false);
  const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
  const [statusAssignStatusId, setStatusAssignStatusId] = useState<number>();
  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
    useState<boolean>(false);
  const [isReminderConfirmationStatus, setIsReminderConfirmationStatus] =
    useState(false);
  const [reminderData, setReminderData] = useState<IInquiry>();
  const [selectedLabelIds, setSelectedLabelIds] = useState<string | undefined>(
    "",
  );
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
    [],
  );
  const [checkToken, setCheckToken] = useState(false);

  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
    useState<boolean>(false);
  const [userAssignTaskId, setUserAssignTaskId] = useState<number>();

  interface IFilterParams {
    checkedOptions: any[] | null;
    checkedSourceTypes: any[] | null;
    startSearchDate: TFilterDate;
    endSearchDate: TFilterDate;
    checkedOptionsStageStatus: any[] | null | string;
    selectedCategoryId: any;
    selectedProductId: any;
    checkedOptionsUser?: any[] | null;
  }
  const [filterParams, setFilterParams] = useState<IFilterParams>({
    checkedOptions: null,
    checkedSourceTypes: null,
    startSearchDate: "",
    endSearchDate: "",
    checkedOptionsStageStatus: "",
    selectedCategoryId: "",
    selectedProductId: "",
    checkedOptionsUser: null,
  });

  const canView = useCheckUserPermission(PAGE_ID.INQUIRY, PERMISSION_TYPE.VIEW);
  const canEdit = useCheckUserPermission(PAGE_ID.INQUIRY, PERMISSION_TYPE.EDIT);
  const canAdd = useCheckUserPermission(PAGE_ID.INQUIRY, PERMISSION_TYPE.ADD);
  const canShare = useCheckUserPermission(
    PAGE_ID.INQUIRY,
    PERMISSION_TYPE.SHARE,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.INQUIRY,
    PERMISSION_TYPE.DELETE,
  );
  const canViewLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canAddReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.ADD,
  );
  const canAddTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.ADD,
  );
  const canStartWorkFlow = useCheckUserPermission(
    PAGE_ID.START_WORK_FLOW,
    PERMISSION_TYPE.ADD,
  );

  const canAddAssignTeamMember = useCheckUserPermission(
    PAGE_ID.INQUIRY,
    PERMISSION_TYPE.SHARE,
  );
  // Escape key handler
  useEscapeKey(() => {
    if (
      !isModalFilterVisible &&
      !isModalVisible &&
      !isModalAssignStatusVisible &&
      !editInquiry &&
      !isDeleteConfirmation &&
      !isReminderConfirmationStatus &&
      !isModalAssignStatusVisible
    ) {
      closeListInquiry();
    } else {
      setIsModalFilterVisible(false);
      setIsModalVisible(false);
      setIsModalAssignStatusVisible(false);
      setEditInquiry(false);
      setIsDeleteConfirmation(false);
    }
  });

  let itemsPerPage: number = ITEMS_PER_PAGE;

  const isFetchingRef = useRef(false);
  const currentPageRef = useRef(currentPage);
  const noDataFoundRef = useRef(noDataFound);
  const searchTermRef = useRef(searchTerm);
  const filterParamsRef = useRef(filterParams);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    noDataFoundRef.current = noDataFound;
  }, [noDataFound]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    filterParamsRef.current = filterParams;
  }, [filterParams]);

  const refreshInquiriesList = (
    page: number = 0,
    overrideFilterParams?: IFilterParams,
  ) => {
    isFetchingRef.current = false;
    const activeParams = overrideFilterParams || filterParams;
    fetchInquiryApi(
      page,
      searchTerm,
      setInquiryList,
      ITEMS_PER_PAGE,
      setNoDataFound,
      setLoading,
      token,
      contactData?.id,
      setInquiryId,
      setSelectedLabelIds,
      setCheckToken,
      activeParams.checkedOptions,
      activeParams.checkedSourceTypes,
      activeParams.startSearchDate,
      activeParams.endSearchDate,
      activeParams.checkedOptionsStageStatus,
      activeParams.selectedCategoryId,
      activeParams.selectedProductId,
      activeParams.checkedOptionsUser,
    );
    if (page === 0) {
      setCurrentPage(0);
      currentPageRef.current = 0;
    }
  };

  useEffect(() => {
    const handleScroll = async () => {
      if (
        listInnerRef.current &&
        listInnerRef.current.scrollTop + listInnerRef.current.clientHeight >=
          listInnerRef.current.scrollHeight - 15
      ) {
        if (isFetchingRef.current || noDataFoundRef.current) {
          return;
        }

        isFetchingRef.current = true;
        const nextPage = currentPageRef.current + 1;

        try {
          await fetchInquiryApi(
            nextPage,
            searchTermRef.current,
            setInquiryList,
            ITEMS_PER_PAGE,
            setNoDataFound,
            setLoading,
            token,
            contactData?.id,
            setInquiryId,
            setSelectedLabelIds,
            setCheckToken,
            filterParamsRef.current.checkedOptions,
            filterParamsRef.current.checkedSourceTypes,
            filterParamsRef.current.startSearchDate,
            filterParamsRef.current.endSearchDate,
            filterParamsRef.current.checkedOptionsStageStatus,
            filterParamsRef.current.selectedCategoryId,
            filterParamsRef.current.selectedProductId,
            filterParamsRef.current.checkedOptionsUser,
          );
          setCurrentPage(nextPage);
        } catch (err) {
          console.error("Scroll fetch error:", err);
        } finally {
          isFetchingRef.current = false;
        }
      }
    };

    const listInnerElement = listInnerRef.current;
    if (listInnerElement) {
      listInnerElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (listInnerElement) {
        listInnerElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [token, contactData?.id]);

  // Fetch initial data & filter changes
  useEffect(() => {
    refreshInquiriesList(0);
  }, [searchTerm, filterParams]);

  // The right-side ListInquiryView stays mounted; opening it from a contact's
  // inquiry button only flips isListInquiry. Re-fetch from page 0 on open (and
  // when the contact changes) so the list isn't stale from a previous contact.
  useEffect(() => {
    if (isListInquiry && contactData?.id) {
      refreshInquiriesList(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListInquiry, contactData?.id]);

  useEffect(() => {
    if (isListInquiry) {
      if (options) {
        fetchLabelApi(setOptions, setLoading);
      }
      if (isModalAssignUserVisible) {
        fetchAllCompanyApi(setOptionJoinCompany);
        fetchDepartmentsApi(setDepartments);
      }
      if (isModalAssignStatusVisible) {
        fetchStageStatusForInquiryApi(
          setOptionRadioButtonStatus,
          statusAssignStatusId,
        );
      } else {
        setOptionRadioButtonStatus([]);
        setStatusAssignStatusId(0);
      }
    }
  }, [
    token,
    isListInquiry,
    isModalAssignStatusVisible,
    isModalAssignUserVisible,
  ]);

  useEffect(() => {
    if (contactData?.id) {
      closeListInquiry();
    } else {
      return undefined;
    }
  }, [contactData?.id]);

  useEffect(() => {
    setLabelDropdownOpen(null);
    setInquiryId(undefined);
    setHasOneData(null);
  }, [contactData?.id]);

  const toggleDropdownLabel = (id: number) => {
    setLabelDropdownOpen((prevId: any) => (prevId === id ? null : id));
    setInquiryId(id);
    setHasOneData((prev) => (prev === id ? null : id));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      setIsModalFilterVisible(false);
    }
  };

  const handleModalClose1 = () => {
    closeListInquiry();
  };

  const handleConfirm = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {
    if (contactId === undefined) return;

    await updateCheckBox(contactId, checkedOptions);
    refreshInquiriesList(0);
    setLabelDropdownOpen(null);
    setContactSelections((prev) => ({
      ...prev,
      [contactId]: checkedOptions,
    }));
    setIsModalVisible(false);
  };

  const handleModalOpen = (id: number | undefined) => {
    if (canViewLabel) {
      if (contactData) {
        setInquiryId((prev) => (prev === id ? undefined : id));
        setIsModalVisible(true);
      }
      setInquiryId(id);
      setIsModalVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleClickOutside = (event: { target: any }) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest(".icon-more");
    if (isDropdownButton) {
      return;
    }

    const clickedInDropdown = Object.values(dropdownRef.current).some(
      (ref) => ref && ref.contains(target),
    );

    if (!clickedInDropdown) {
      setLabelDropdownOpen(null);
    }
  };

  useEffect(() => {
    if (labelDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [labelDropdownOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && labelDropdownOpen !== null) {
        setLabelDropdownOpen(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [labelDropdownOpen]);

  const handleDeleteInquiry = async () => {
    const requestData = {
      table: "inquiries",
      where: `{"id":${inquiryId}}`,
      data: `{"isDelete":"1"}`,
    };
    const getUUID = localStorage.getItem("UUID");
    try {
      const data = await axiosInstance.post("commonUpdate", requestData);
      if (data.data.code === 200) {
        if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setIsDeleteConfirmation(false);
          refreshInquiriesList(0);
        } else {
          toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handelRefreshInquiry = async () => {
    setTimeout(() => {
      refreshInquiriesList(0);
    }, 100);
  };

  useEffect(() => {
    if (refreshInquiry && canView) {
      refreshInquiriesList(0);
      setRefreshInquirys && setRefreshInquirys(true);
      setRefreshInquiry(false);
    }
  }, [refreshInquiry, canView, setRefreshInquirys]);

  const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
    const {
      filterData,
      checkedOptionsLabel: checkedOptions,
      checkedOptionsSourceType: checkedSourceTypes,
      startSearchDate,
      endSearchDate,
      checkedOptionsStageStatus,
      checkedOptionsUser,
      selectedCategoryId,
      selectedProductId,
    } = filterPayload;

    const formattedStartDate =
      startSearchDate instanceof DateObject
        ? startSearchDate.format("YYYY-MM-DD")
        : startSearchDate;
    const formattedEndDate =
      endSearchDate instanceof DateObject
        ? endSearchDate.format("YYYY-MM-DD")
        : endSearchDate;

    const newFilterParams: IFilterParams = {
      checkedOptions: checkedOptions || null,
      checkedSourceTypes: checkedSourceTypes || null,
      startSearchDate: formattedStartDate,
      endSearchDate: formattedEndDate,
      checkedOptionsStageStatus: checkedOptionsStageStatus || null,
      selectedCategoryId,
      selectedProductId,
      checkedOptionsUser: checkedOptionsUser || null,
    };

    setFilterParams(newFilterParams);

    const isFilterApplied =
      (checkedOptions?.length ?? 0) > 0 ||
      (checkedSourceTypes?.length ?? 0) > 0 ||
      Boolean(filterData?.country) ||
      Boolean(filterData?.state) ||
      Boolean(filterData?.city) ||
      Boolean(filterData?.area) ||
      Boolean(filterData?.active) ||
      Boolean(startSearchDate) ||
      Boolean(endSearchDate) ||
      selectedCategoryId !== null ||
      selectedProductId !== null ||
      (checkedOptionsStageStatus?.length ?? 0) > 0 ||
      (checkedOptionsUser?.length ?? 0) > 0;

    setHasData(isFilterApplied);
    setIsModalFilterVisible(false);
  };

  const columns = [
    "ID",
    "Contact Person",
    "Category Name",
    "Product Name",
    "Quantity",
    "Requirement Type",
    "Description",
    "Source Name",
    "Inquiry Date Time",
    "Create Date",
  ];

  const prepareExportData = inquiryList.map((item) => ({
    ID: item.id,
    "Contact Person": item.contact_person_name || "",
    "Category Name": item.category_name || "",
    "Product Name": item.product_name || "",
    Quantity: item.qty || "",
    "Requirement Type": item.static === 0 ? "One Time" : "Recurring",
    Description: item.description || "",
    "Source Name": item.source_name || "",
    "Inquiry Date Time": item.inquiry_date_time || "",
    "Create Date": item.create_date_time || "",
  }));

  const handleModalOpenStatusAssign = (
    id: number | undefined,
    inq_status: number | undefined,
  ) => {
    if (canViewStatus) {
      setStatusAssignContactId(id);
      setStatusAssignStatusId(inq_status);
      setIsModalAssignStatusVisible(true);
    } else {
      setIsModalAssignStatusVisible(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmInquiriesRadioButton = async (checkedOptions: any[]) => {
    if (statusAssignContactId === undefined) return;

    await updateStageStatusForInquiriesRadioButton(
      statusAssignContactId,
      checkedOptions,
      setLoading,
    );
    refreshInquiriesList(0);
    setContactSelections((prev) => ({
      ...prev,
      [statusAssignContactId]: checkedOptions,
    }));
    setIsModalAssignStatusVisible(false);
  };

  const handleConfirmAssignUser = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {
    let idsToUpdate: number | number[];
    if (userAssignTaskId) {
      idsToUpdate = userAssignTaskId;
    } else {
      return;
    }
    await updateUserCheckBox(idsToUpdate, checkedOptions, setLoading);
    setTimeout(() => {
      refreshInquiriesList(0);
    }, 100);
    const keyIds = Array.isArray(idsToUpdate) ? idsToUpdate : [idsToUpdate];
    setContactSelections((prev) => {
      const updated = { ...prev };
      for (const id of keyIds) {
        updated[id] = checkedOptions;
      }
      return updated;
    });
    setIsModalAssignUserVisible(false);
  };

  const handleModalOpenReminder = (id: number | undefined) => {
    if (canAddReminder) {
      setInquiryId(id);
      setIsSetReminderConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
    setLabelDropdownOpen(null);
  };

  const [isStageAndStatusModalOpen, setIsStageAndStatusModalOpen] =
    useState(false);
  const [stageAndStatusData, setStageAndStatusData] = useState<{
    inquiryId?: number;
    referenceTable?: string;
  }>({});

  function openStageAndStatusLog(id: number | undefined) {
    setStageAndStatusData({
      inquiryId: id,
      referenceTable: `inquiries`,
    });
    setIsStageAndStatusModalOpen(true);
  }

  const handleReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: any;
  }) => {
    if (
      data.dateTime.trim() &&
      data.remark.trim() &&
      data.selectedCategory !== null &&
      data.selectedCategory !== false
    ) {
      createReminderForInquiry(
        data,
        contactData?.id,
        inquiryId,
        setIsSetReminderConfirmation,
        setRefreshInquiry,
      );
    } else {
      toast.error("Please enter Date and Time, Remark, and Select Team Member");
      setIsSetReminderConfirmation(true);
    }
  };

  const handleChangeStatusOfReminder = (messageData: IInquiry) => {
    setIsReminderConfirmationStatus(true);
    setReminderData(messageData);
  };

  const handleExportClick = () => {
    if (canShare) {
      ExcelExport({
        data: prepareExportData,
        columns: columns,
        fileName: "inquiry_",
      });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelFilterInq = () => {
    if (canView) {
      setIsModalFilterVisible(true);
    } else {
      setIsModalFilterVisible(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelChangeEdit = (inquiryDataById: IInquiry) => {
    if (canEdit) {
      setEditInquiry(true);
      setInquiryToiEdit(inquiryDataById);
    } else {
      setEditInquiry(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleChangeDeleInquiry = () => {
    if (canDelete) {
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalOpenUserAssign = (id?: number | undefined) => {
    if (canAddAssignTeamMember) {
      setUserAssignTaskId(id);
      setIsModalAssignUserVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const getOptionName = (option: { username: string; department: number }) => {
    const departmentObj = departments.find(
      (item) => item.id === option.department,
    );

    if (departmentObj) {
      return `${option.username} (${departmentObj.department_name})`;
    }

    return option.username;
  };

  const handleChangeAddInquiry = () => {
    canAdd
      ? setIsCreateInquiry(true)
      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  };
  const [isOpenTaskCreateModel, setIsOpenTaskCreateModel] = useState(false);
  const [taskData, setTaskData] = useState<{
    inquiryId?: number;
    taskTitle?: string;
    contactId?: number;
    referenceTable?: string;
  }>({});
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<any[]>([]);
  const [refreshProduct, setRefreshProduct] = useState(false);

  const showTask = (item: IInquiry) => {
    if (canAddTask) {
      setIsOpenTaskCreateModel(true);
      setTaskData({
        inquiryId: item.id,
        taskTitle: item.description,
        contactId: contactData?.id,
        referenceTable: "inquiries",
      });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  /* Start WorkFlow Code Start */
  const [
    isShowConformationForStartWorkFlow,
    setIsShowConformationForStartWorkFlow,
  ] = useState<boolean>(false);
  const [workFlowOrderId, setWorkFlowOrderId] = useState<number>(0);
  const handleStartWorkFlow = (contactId: number) => {
    if (canStartWorkFlow) {
      setIsShowConformationForStartWorkFlow(true);
      setWorkFlowOrderId(contactId);
    } else {
      setIsShowConformationForStartWorkFlow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  /* Start WorkFlow Code End */
  return (
    <>
      {isListInquiry ? (
        <>
          <div className="leftSide" id="search-message">
            <div className="header-Chat">
              <div className="ICON">
                <button className="icons" onClick={handleModalClose1}>
                  <span className="text-white" title="Close">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
                    </svg>
                  </span>
                </button>
              </div>

              <div className="newText w-100">
                <h2>
                  {contactData
                    ? `${contactData.person_name}'s Inquiry List`
                    : "All My Inquiries"}
                </h2>
              </div>
              <div className="w-100 text-end">
                {contactData && (
                  <button className="icons" onClick={handleChangeAddInquiry}>
                    <span title="Create Inquiry" className="text-white">
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
                )}
                {contactData ? (
                  <span></span>
                ) : (
                  <button
                    className="icons pP"
                    style={{ marginBottom: "50px" }}
                    onClick={handelFilterInq}
                  >
                    <span title="Filter Contact" className="text-white">
                      {hasData ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill={hasData ? "red" : "currentColor"}
                        >
                          <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                        </svg>
                      ) : (
                        <svg
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill={hasData ? "red" : "currentColor"}
                        >
                          <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                        </svg>
                      )}
                    </span>
                  </button>
                )}
                <button
                  className="icons pP"
                  style={{ marginBottom: "50px" }}
                  onClick={handleExportClick}
                >
                  <span className="text-white" title="Inquiry Export">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path d="M480-480ZM202-65l-56-57 118-118h-90v-80h226v226h-80v-89L202-65Zm278-15v-80h240v-440H520v-200H240v400h-80v-400q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H480Z" />
                    </svg>
                  </span>
                </button>
                <button
                  className="icons pP"
                  style={{ marginBottom: "50px" }}
                  onClick={handelRefreshInquiry}
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
              </div>
            </div>
            {canView ? (
              <div className="search-bar">
                <div>
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
                    title="Search or start new chat"
                    aria-label="Search or start new chat"
                    placeholder="Search Inquiry"
                    maxLength={SMALL_TEXT_LENGTH}
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <span
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)}
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: hover ? "#111827" : "#9ca3af",
                      }}
                      onClick={() => setSearchTerm("")}
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
                </div>
              </div>
            ) : (
              <span></span>
            )}

            <div
              className="chats"
              style={{ overflow: "scroll" }}
              ref={listInnerRef}
            >
              <>
                {loading ? (
                  Array.from({ length: 12 }).map((_, index) => (
                    <button key={index} className="block chat-list">
                      <div className="h-text">
                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </h4>
                          <h4 className="text-end">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={30}
                              height={10}
                            />
                          </h4>
                        </div>

                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              width={100}
                              style={{
                                opacity: darkMode ? "" : 0.5,
                                marginLeft: "10px",
                              }}
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
                        <button className="icon-more float-end">
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={30}
                          />
                        </button>
                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </h4>
                        </div>
                        <div className="head">
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </div>

                        <div className="">
                          <label className="float-start inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </label>
                          <br />
                          <p className=" d-flex justify-content-between text-break text-start inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                            <div className="">
                              <span className="badge rounded-pill">
                                <Skeleton
                                  style={{
                                    marginLeft: "10px",
                                    opacity: darkMode ? "" : 0.5,
                                  }}
                                  width={40}
                                />
                              </span>
                            </div>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : canView ? (
                  inquiryList &&
                  inquiryList.map((item, index) => {
                    const contactData: IUserList = {
                      id: item.contact_master_id || 0,
                      to_customer_id: item.contact_master_id || 0,
                      person_name: item.contact_person_name || "",
                      to_customer_name: item.contact_person_name || "",
                      mobile_number: item.contact_person_number || "",
                      company_name: item.contact_company_name || "",
                      email_id: "",
                      country_name: "",
                      state_name: "",
                      city_name: "",
                      area_name: "",
                      address: "",
                      shipping_address: "",
                      gst_number: "",
                      source_name: "",
                      stage_status_name: "",
                      label_name: "",
                      created_date_time: "",
                      is_pin: 0,
                      is_unread: 1,
                      label_color: "",
                      source_name_color: "",
                      stage_status_color: "",
                      lable: "",
                      contact_status: 0,
                      assinged_to_work_a_application_id: "",
                      assinged_to_price_list: 0,
                      a_application_login_id: 0,
                      is_pin_by_a_application_login_id: "",
                    };
                    return (
                      <>
                        <div key={item.id}>
                          <ul
                            ref={(el) => (dropdownRef.current[item.id] = el)}
                            className={`labelDropLeft ${
                              labelDropdownOpen === item.id
                                ? "isVisible"
                                : "isHidden"
                            }`}
                            style={{ width: "165px", zIndex: "1" }}
                          >
                            <li
                              className="listItem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                handleModalOpen(item.id);
                              }}
                            >
                              Assign label
                            </li>
                            <li
                              className="listItem"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                handleModalOpenStatusAssign(
                                  item.id,
                                  item.contact_status,
                                );
                              }}
                            >
                              Assign Status/Stage
                            </li>
                            <li
                              className="listItem"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                handelChangeEdit(item);
                              }}
                            >
                              Edit
                            </li>

                            <li
                              className="listItem"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                openStageAndStatusLog(item.id);
                              }}
                            >
                              View timeline
                            </li>

                            {item.is_reminder ? (
                              <span></span>
                            ) : (
                              <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLabelDropdownOpen(null);
                                  handleModalOpenReminder(item.id);
                                }}
                              >
                                Reminder
                              </li>
                            )}
                            {/* {item?.team_task_assignement_type !=
                              "2" && ( */}

                            <li
                              className="listItem text-start"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                handleModalOpenUserAssign(item?.id);
                              }}
                            >
                              Assign Team Member
                            </li>
                            {/* )} */}
                            <li
                              className="listItem"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                showTask(item);
                              }}
                            >
                              Add Task
                            </li>
                            <li
                              className="listItem"
                              role="button"
                              onClick={() => handleStartWorkFlow(item.id)}
                              style={{ color: "#0992f3", fontWeight: "600" }}
                            >
                              Start WorkFlow
                            </li>
                            <li
                              style={{ color: "red", fontWeight: "600" }}
                              className="listItem"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelDropdownOpen(null);
                                handleChangeDeleInquiry();
                              }}
                            >
                              Delete
                            </li>
                          </ul>
                        </div>

                        <button
                          key={index}
                          className="block chat-list"
                          onClick={() => openRightSide(contactData)}
                        >
                          <div className="h-text">
                            <div className="head">
                              <div className="d-flex align-items-center">
                                <h4
                                  className="text-start"
                                  style={{ fontSize: "16px" }}
                                >
                                  <b>#{item.id}</b>
                                </h4>
                                <ul
                                  style={{
                                    marginBottom: "0px",
                                    paddingLeft: "0px",
                                  }}
                                  className="px-2"
                                >
                                  {item.label_color ? (
                                    item.label_color
                                      .split(",")
                                      .map((color, index) => (
                                        <li
                                          key={index}
                                          style={{
                                            listStyleType: "none",
                                            display: "inline-block",
                                            marginRight: "2px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              background: color,
                                              display: "inline-block",
                                              width: "10px",
                                              height: "10px",
                                              borderRadius: "50%",
                                              marginRight: "-5px",
                                            }}
                                            title={
                                              item.label_name.split(",")[index]
                                            }
                                          ></span>
                                        </li>
                                      ))
                                  ) : (
                                    <span></span>
                                  )}
                                </ul>
                              </div>

                              <a
                                href={`https://api.whatsapp.com/send?phone=91${item?.contact_person_number}`}
                                target="_blank"
                              >
                                <button className="icons mx-1">
                                  <span title="Whatsapp">
                                    <i
                                      className="bi bi-whatsapp"
                                      style={{
                                        fontSize: "20px",
                                        position: "absolute",
                                        left: "85%",
                                        top: "2%",
                                      }}
                                    ></i>
                                  </span>
                                </button>
                              </a>

                              <button
                                className="icon-more float-end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLabelDropdownOpen((prevId: any) =>
                                    prevId === item.id ? null : item.id,
                                  );
                                  setInquiryId(item.id);
                                  setHasOneData((prev) =>
                                    prev === item.id ? null : item.id,
                                  );
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
                            <div
                              className="head"
                              style={{ alignItems: "start" }}
                            >
                              <h4
                                className="inquiry-front"
                                style={{ maxWidth: "30%", overflow: "hidden" }}
                              >
                                <b>Contact Name</b>:
                                {item.contact_person_name
                                  ? `${item.contact_company_name} (${item.contact_person_name})`
                                  : ""}
                              </h4>
                            </div>
                            {item.is_reminder ? (
                              <button className="icon-more float-end">
                                <span
                                  role="button"
                                  onClick={() =>
                                    handleChangeStatusOfReminder(item)
                                  }
                                >
                                  <svg
                                    height="16px"
                                    viewBox="0 -960 960 960"
                                    width="16px"
                                    className=""
                                    fill="currentColor"
                                  >
                                    <path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" />
                                  </svg>
                                </span>
                              </button>
                            ) : (
                              <span></span>
                            )}
                            <div className="head">
                              <h4 className="inquiry-front">
                                <b>Product Category Name</b>:
                                {item.category_name ? item.category_name : ""}
                              </h4>
                            </div>

                            <div className="head">
                              <h4 className="inquiry-front">
                                <b>Product Name</b>:
                                {item.product_name ? item.product_name : ""}
                              </h4>
                              <div className="text-end">
                                <span
                                  style={{
                                    backgroundColor: item.source_name_color
                                      ? item.source_name_color
                                      : "#eeeeee",
                                  }}
                                  className="badge rounded-pill"
                                >
                                  {item.source_name}
                                </span>
                              </div>
                            </div>
                            <div className="head">
                              <h4 className="inquiry-front">
                                <b>Required Quantity</b>:
                                {item.qty ? item.qty : ""}
                              </h4>
                              <div className="text-end">
                                <span
                                  style={{
                                    backgroundColor: item.stage_status_color
                                      ? item.stage_status_color
                                      : "#eeeeee",
                                  }}
                                  className="badge rounded-pill"
                                >
                                  {item.stage_status_name}
                                </span>
                              </div>
                            </div>
                            <div className="head">
                              <h4 className="inquiry-front">
                                <b>Requirement Type</b>:
                                {item.static === 0 ? "One Time" : "Recurring"}
                              </h4>
                            </div>

                            <div className="">
                              <label className="float-start inquiry-front">
                                <b>Description:</b>
                              </label>
                              <br />
                              <p className="d-flex justify-content-between text-break text-start inquiry-front">
                                {item.description ? (
                                  <SafeHtml htmlContent={item.description} />
                                ) : (
                                  ""
                                )}
                              </p>
                            </div>
                            <div className="text-start">
                              <p className="contact-text">
                                Assign To:{item.assined_team_person_list}
                              </p>
                            </div>
                            <div className="text-start">
                              <p className="contact-text">
                                Created By: {item.inq_created_by_name}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="contact-text">
                                {item.create_date_time
                                  ? convertDateTimeFormat(item.create_date_time)
                                      .date
                                  : ""}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="contact-text">
                                {item.create_date_time
                                  ? convertDateTimeFormat(item.create_date_time)
                                      .time
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      </>
                    );
                  })
                ) : (
                  <p className="text-danger p-1">
                    {DEFAULT_MESSAGE_ERROR_PERMISSION}
                  </p>
                )}
              </>
              {!inquiryList && <p className="no_found">No Inquiry found</p>}
            </div>
          </div>
        </>
      ) : null}
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
            inquiryList.find(
              (item) => item.id === (userAssignTaskId ?? inquiryToEdit?.id),
            )?.inquiry_assigned_team_member
          }
          contactId={userAssignTaskId ?? inquiryToEdit?.id}
          getOptionName={getOptionName}
          showColorBadge={false}
        />
      )}

      {editInquiry && (
        <CreateInquiryView
          show={editInquiry}
          onHide={() => setEditInquiry(false)}
          setRefreshInquiry={setRefreshInquiry}
          contactData={inquiryToEdit}
          contact_id={contactData?.id}
          headerName="Edit Inquiry"
        />
      )}
      {contactData ? (
        <CheckBoxModal
          show={isModalVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirm}
          title="Assign your label"
          message="Please select the labels for this Inquiry."
          btn1="Cancel"
          btn2="Submit"
          options={options}
          selectedLabelIds={
            inquiryList.find((item) => item.id === inquiryId)?.label_id
          }
          contactId={inquiryId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.lable_name}
          showColorBadge={true}
        />
      ) : (
        <CheckBoxModal
          show={isModalVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirm}
          title="Assign your label"
          message="Please select the labels for this Inquiry."
          btn1="Cancel"
          btn2="Submit"
          options={options}
          selectedLabelIds={
            inquiryList.find((item) => item.id === inquiryId)?.label_id
          }
          contactId={inquiryId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.lable_name}
          showColorBadge={true}
        />
      )}
      {isSetReminderConfirmation && (
        <ReminderModal
          show={isSetReminderConfirmation}
          onHide={() => setIsSetReminderConfirmation(false)}
          handleSubmit={handleReminder}
          title={`Set Reminder of Inquiry`}
          message={"Are you sure you want delete is message?"}
          btn1="CANCEL"
          btn2="Set Reminder"
          request_flag="3"
        />
      )}

      {isStageAndStatusModalOpen && (
        <EventLogs
          show={isStageAndStatusModalOpen}
          onHide={() => setIsStageAndStatusModalOpen(false)}
          reference_id={stageAndStatusData?.inquiryId}
          reference_table={stageAndStatusData?.referenceTable}
          requiredTabs={["status_timeline"]}
        />
      )}

      <RadioButtonModal
        show={isModalAssignStatusVisible}
        onHide={() => setIsModalAssignStatusVisible(false)}
        handleSubmit={handleConfirmInquiriesRadioButton}
        title="Assign your Status"
        message="Please select the Status for this Inquiry."
        btn1="Cancel"
        btn2="Submit"
        options={optionRadioButtonStatus}
        selectedLabelIds={
          inquiryList.find((item) => item.id === statusAssignContactId)
            ?.contact_status
        }
        contactId={statusAssignContactId}
        getOptionColor={(option) => option.color || "#eeeeee"}
        getOptionName={(option) => option.name}
        showColorBadge={true}
      />
      {isReminderConfirmationStatus && (
        <ConfirmationModal
          show={isReminderConfirmationStatus}
          onHide={() => setIsReminderConfirmationStatus(false)}
          handleSubmit={() =>
            handleChangeStatusOfReminderForInquiry(
              inquiryId,
              setIsReminderConfirmationStatus,
              setRefreshInquiry,
            )
          }
          title={"Are you sure you want to complete this Reminder?"}
          message={`Remark: ${reminderData && reminderData.reminder_remark}`}
          btn1="CANCEL"
          btn2="Complete Reminder Now"
          // message1={`Reminder Date: ${reminderData && formatDateAndTime(reminderData.reminder_data_time)
          //   }`}
          message1={`Reminder Date : ${reminderData?.reminder_data_time}`}
        />
      )}
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => setIsDeleteConfirmation(false)}
          handleSubmit={handleDeleteInquiry}
          title={"Delete this Inquiry"}
          message={"Are You Sure You Want To Delete This Inquiry?"}
          btn1="CANCEL"
          btn2="DELETE"
        />
      )}
      <CreateInquiryView
        show={isCreateInquiry}
        onHide={() => setIsCreateInquiry(false)}
        setRefreshInquiry={setRefreshInquiry}
        contact_id={contactData?.id}
        headerName="Create Inquiry"
      />
      <CheckBoxFilterModal
        show={isModalFilterVisible}
        onHide={handleModalClose}
        handleSubmit={handleConfirmFilter}
        title="Filter your Inquiry"
        message="Please select the labels, source, Status, Team Member and Category/Product for the Inquiry."
        btn1="Clear"
        btn2="Apply"
        filtersToShow={[1, 2, 3, 4, 5, 7]}
        pageId={2}
        stageandStatusOrderType={2}
        initialCheckedOptions={filterParams.checkedOptions}
        initialCheckedSourceTypes={filterParams.checkedSourceTypes}
        initialStartSearchDate={filterParams.startSearchDate}
        initialEndSearchDate={filterParams.endSearchDate}
        initialCheckedOptionsStageStatus={
          Array.isArray(filterParams.checkedOptionsStageStatus)
            ? filterParams.checkedOptionsStageStatus
            : null
        }
        initialCheckedOptionsUser={filterParams.checkedOptionsUser}
      />
      {isOpenTaskCreateModel && (
        <CreateTaskView
          show={isOpenTaskCreateModel}
          onHide={() => {
            setIsOpenTaskCreateModel(false);
            setTaskData({});
          }}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
          headerName={"Create Task Of Inquiry"}
          setRefreshProduct={setRefreshProduct}
          productToEdit={undefined}
          messageId={taskData.inquiryId}
          messageDescription={taskData.task}
          contactId={taskData.contactId}
          referenceTable={taskData.referenceTable}
          supportTicketFlag={0}
        />
      )}
      {isShowConformationForStartWorkFlow && (
        <WorkFlowModel
          show={isShowConformationForStartWorkFlow}
          onHide={() => setIsShowConformationForStartWorkFlow(false)}
          handleSubmit={() => setIsShowConformationForStartWorkFlow(false)}
          title={`Start WorkFlow For Inquiry`}
          message={`Are you sure you want to Start WorkFlow for Inquiry?`}
          showTaskTemplateFor={2}
          showOrderId={workFlowOrderId}
          setWorkFlowFor={"Inquiry"}
          btn1="CANCEL"
          btn2="Start"
        />
      )}
    </>
  );
};

export default ListInquiryView;
