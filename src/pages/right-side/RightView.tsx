import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CsvIcon from "../../assets/images/CsvIcon.png";
import deshFlow_log_icon from "../../assets/images/deshFlow_log.png";
import docxIcon from "../../assets/images/docxIcon.png";
import excelIcon from "../../assets/images/excelIcon.png";
import jpgIcon from "../../assets/images/jpgIcon.png";
import micIcon from "../../assets/images/micIcon.png";
import MkvIcon from "../../assets/images/MkvIcon.png";
import Mp4Icon from "../../assets/images/Mp4Icon.png";
import MpgIcon from "../../assets/images/MpgIcon.png";
import mp3Icon from "../../assets/images/music-file.png";
import pdfIcon from "../../assets/images/pdfIcon.png";
import pngIcon from "../../assets/images/pngIcon.png";
import PptIcon from "../../assets/images/PptIcon.png";
import PptxIcon from "../../assets/images/PptxIcon.png";
import PsdIcon from "../../assets/images/PsdIcon.png";
import RarIcon from "../../assets/images/RarIcon.png";
import svgIcon from "../../assets/images/svgIcon.png";
import TxtIcon from "../../assets/images/TxtIcon.png";
import whatsappIcon from "../../assets/images/whatsapp.png";
import XmlIcon from "../../assets/images/XmlIcon.png";
import zipIcon from "../../assets/images/zipIcon.png";

import ConfirmationModal from "../../components/model/ConfirmationModal";
import {
  fetchAllCompanyApi,
  fetchStageStatusApi,
  IUserList,
  upateCheckBox,
  updateStageStatusRadioButton,
  updateUserCheckBox,
} from "../left-side/LeftSideController";
import ContactStatistic from "./contact-statistics/ContactStatistic";
import RightSideProfile from "./Profile";
import RightSearch from "./Search";

import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../common/AppContext";
import {
  formatDate,
  formatTimeToAmPm,
  useEscapeKey,
} from "../../common/SharedFunction";
import CustomEditor from "../../components/CustomEditor";
import DateTimeRangePicker from "../../components/DateTimeRangePicker";
import ImageViewer from "../../components/ImageViewer";
import CheckBoxModal from "../../components/model/CheckBoxModal";
import EventLogs from "../../components/model/EventLogModel/EventLogsModel";
import ExploreNearbyModal from "../../components/model/ExploreNearbyModel";
import OrderCreateModal from "../../components/model/OrderCreateModel/OrderCreateModal";
import RadioButtonModal from "../../components/model/RadioButtonModal";
import ReminderModal from "../../components/model/ReminderModal";
import ReportModal from "../../components/model/ReportsModel";
import PinnedMessageShow from "../../components/PinnedMessageShow";
import SafeHtml from "../../components/SafeHtml";
import {
  APPLICATION_VERSION,
  BIG_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_ERROR,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, SHORT_KEY } from "../../helpers/AppEnum";
import { TReactSetState } from "../../helpers/AppType";
import { whatsappToHtml } from "../../helpers/WhatsAppToHTMLConvert";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../services/axiosInstance";
import useAdvertisementStore from "../../store/advertisement/useAdvertisemrntStore";
import AiModelView from "../aimodel/AiModelView";
import DashboardView from "../dashboard/DashboardView";
import { fetchLabelApi } from "../left-side/header/Setting/label/LabelController";
import { ITaskView } from "../left-side/header/Setting/taskList/TaskListController";
import Visitsview from "../left-side/header/Setting/visits/VisitView";
import { fetchDepartmentsApi } from "../left-side/list-company/EditTeamMemberController";
import {
  fetchCompanyApi,
  ICompany,
} from "../left-side/list-company/ListCompanyController";
import { IUserInfo } from "../public/otp-verification/OTPVerificationController";
import PricingTable from "../public/payment-gateway/PricingTable";
import useSpeechRecognition from "../voice/Voice";
import { ModuleType } from "../../store/sales/salesDependencyGuard";
import ContactTaskListView from "./contact-task-list/ContactTaskListView";
import TaskChatRightSide from "./task-chat/TaskChatRightSide";
import CreateTaskView from "./create-task/CreateTaskView";
import EmailSendView from "./EmailSend/EmailSendView";
import ListAccountTransactionView from "./list-account-transaction/ListAccountTransactionView";
import ListInquiryView from "./list-inquiry/ListInquiryView";
import ListOrderView from "./list-order/ListOrderView";
import {
  createReminder,
  deleteContact,
  deleteMessages,
  fetchCompanyForRightSideViewApi,
  fetchContact,
  fetchDynamicOptions,
  fetchGetByIdUser,
  fetchMessageData,
  fetchReminderCount,
  fetchSupportTicketCount,
  // fetchTaskCategoryApi,
  fetchTaskCount,
  getContactPinnedMessage,
  // getContactPinnedMessage,
  insertAttendance,
  insertMessage,
  // ITaskCategoryView,
  pinUnpinContactApi,
  TMessage,
  TMessagesByDate,
  viewAttendanceStatus,
} from "./RightViewController";
interface IPropRightView {
  openCreateContact: () => void;
  closeCreateContact: () => void;
  showInquiryAllList: () => void;
  showReminder: () => void;
  showMyCompany: () => void;
  showNotes: () => void;
  showFilterContact: () => void;
  showDashboard: () => void;
  showAichat: () => void;
  isDashBoardOpen: boolean;
  closeDashboard: () => void;
  isAiModelopen: boolean;
  closeisAiModel: () => void;
  getData?: IUserList;
  contactsReload: TReactSetState<boolean>;
  userInfo?: IUserInfo;
  setEditorContentToEdit: any;
  editorContentToEdit: any;
  setNoDataFound1: TReactSetState<boolean>;
  resetTrigger: number;
  setRefreshContact?: (value: boolean | number) => void;
  showMyTask: () => void;
  showMySupportTicket: () => void;
  setSearchTermFromRightSide: (data: string) => void;
  setIdFromRightSide: (data: number) => void;
}

interface IDynamicOptions {
  id: number;
  cart_number: string;
  type: number;
  link: string;
  task_title: string;
  is_support_ticket: number;
}

const RightView = ({
  openCreateContact,
  closeCreateContact,
  showInquiryAllList,
  showNotes,
  showReminder,
  showMyCompany,
  showFilterContact,
  showDashboard,
  showAichat,
  isDashBoardOpen,
  closeDashboard,
  isAiModelopen,
  closeisAiModel,
  getData,
  contactsReload,
  userInfo,
  setEditorContentToEdit,
  editorContentToEdit,
  setNoDataFound1,
  resetTrigger,
  setRefreshContact,
  showMyTask,
  showMySupportTicket,
  setSearchTermFromRightSide,
  setIdFromRightSide,
}: IPropRightView) => {
  const {
    voice,
    startListening,
    stopListening,
    isListening,
    setVoice,
    hasRecognitionSupport,
  } = useSpeechRecognition(0);
  const {
    isEditContact,
    showRightSide,
    setShowRightSide,
    setShowAttendancePopup,
    companyFlag,
    compulsaryAttendance,
    companyData,
    setCompulsaryAttendance,
    isTaskRightSideopen,
    setIsTaskRightSideOpen,
  } = useContext(AppContext)!;
  const [showCreateNote, setShowCreateNote] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const dropdownRefRightMsg = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );

  const dropdownRefLeftMsg = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const dropdownCreateOrderRef = useRef<HTMLButtonElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenCreateOrder, setDropdownOpenCreateOrder] = useState(false);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>("");
  const [isMainWorkspace, setIsMainWorkspace] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentWorkspace = async () => {
      const activeId = localStorage.getItem("COMPANY_ID");
      if (!activeId) return;

      await fetchCompanyApi(
        (companiesData: any) => {
          const list: ICompany[] = Array.isArray(companiesData)
            ? companiesData
            : typeof companiesData === "function"
              ? companiesData([])
              : [];
          const active = list.find((c) => c.id === Number(activeId));
          if (active) {
            setActiveWorkspaceName(active.company_name);
            setIsMainWorkspace(
              active.parent_company_id === null ||
              active.parent_company_id === undefined
            );
          }
        },
        "",
        () => { },
        () => { },
        () => { },
      );
    };
    fetchCurrentWorkspace();
  }, []);
  const [dropdownOpenMsg, setDropdownOpenMsg] = useState<number | null>(null);
  const [dropdownOpenMsgLeft, setDropdownOpenMsgLeft] = useState<number | null>(
    null,
  );
  const [noDataFound, setNoDataFound] = useState(false);
  const prevVoiceRef = useRef("");
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isMoveToMeConfirmation, setIsMoveToMeConfirmation] = useState(false);
  const [isMoveToClientConfirmation, setIsMoveToClientConfirmation] =
    useState(false);

  const [deleteMsgId, setDeleteMsgId] = useState<number>();
  const [isReminderConfirmationStatus, setIsReminderConfirmationStatus] =
    useState(false);
  const [showVisits, setShowVisits] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [selectedContactTask, setSelectedContactTask] = useState<any>(null);
  const [isReminderConfirmationStatus1, setIsReminderConfirmationStatus1] =
    useState<TMessage | null>(null);
  const [isReminderConfirmation, setIsReminderConfirmation] = useState(false);
  const [isReminderReschedule, setIsReminderReschedule] = useState(false);
  const [isEmailConfirmation, setIsEmailConfirmation] = useState(false);
  const [showListOrder, setShowListOrder] = useState(false);
  const [reminderForMsgId, setReminderForMsgId] = useState<number>();
  const [moveForMsgId, setMoveForMsgId] = useState<number>();

  const [isClearConfirmation, setIsClearConfirmation] = useState(false);
  const [isOrderShow, setIsOrderShow] = useState(false);

  const [optionConfirmation, setOptionConfirmation] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showListInquiry, setShowListInquiry] = useState(false);
  const [showListAccountTransaction, setShowListAccountTransaction] =
    useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewInfo, setViewInfo] = useState(false);
  const [messageList, setMessageList] = useState<TMessagesByDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasOneData, setHasOneData] = useState<number | null>(null);
  const [hasOneData1, setHasOneData1] = useState<any>();
  const [sendMessageTextboxValue, setSendMessageTextboxValue] = useState("");
  const [isToggledButton, setIsToggledButton] = useState(false);
  const [messageSide, setMessageSide] = useState(1);
  const [isLoadedMessage, setIsLoadedMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [refreshReport, setRefreshReport] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isShowExtension, setIsShowExtension] = useState("");
  const [isCreateContact1, setIsCreateContact1] = useState(true);
  const [loginById, setLoginById] = useState<any>();
  const [companyId, setCompanyId] = useState<any>();
  const [showRenewPlan, setShowRenewPlan] = useState(false);

  const [renewPlanItem, setRenewPlanItem] = useState<ICompany>();
  const [checkedReminder, setCheckedReminder] = useState(false);
  const [checkedAttachment, setCheckedAttachment] = useState(false);
  const [selectDate, setSelectDate] = useState<Date[]>([]);
  const [startDateForUl, setStartDateForUl] = useState<string>("2024-12-02");
  const [isOrderShowNum, setIsOrderShowNum] = useState<ModuleType>(1);
  const [getCompanyId, setGetCompanyId] = useState(0);
  const [imageViewData, setImageViewData] = useState<TMessage>();
  const [isWhatsAppAuto, setIsWhatsAppAuto] = useState(false);
  const [createContactTrigger, setCreateContactTrigger] = useState(0);
  const [editorContent, setEditorContent] = useState<string>("");
  const [editorContentToEditId, setEditorContentToEditId] = useState(0);
  // const [checkAttendance, setCheckAttendance] = useState(1);
  const [savedAttendance, setSavedAttendance] = useState(2);
  const [reminderCount, setReminderCount] = useState(0);
  const [sortkeycreateQuotation, setSortkeyCreateQuotation] = useState(0);
  const [sortkeycreateOrder, setSortkeyCreateOrder] = useState(0);
  const [sortkeycreateInvoice, setSortkeyCreateInvoice] = useState(0);
  const [sortkeycreatePurchase, setSortkeyCreatePurchase] = useState(0);
  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
  const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();
  const [refreshChat, setRefreshChat] = useState(false);
  const [contactId, setContactId] = useState<number>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [options, setOptions] = useState<any[]>([]);
  const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
  const [statusAssignStatusId, setStatusAssignStatusId] = useState<number>();
  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
    useState<boolean>(false);
  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
    [],
  );
  const [contactData, setContactData] = useState<IUserList | undefined>();

  const [refreshVisit, setRefreshVisit] = useState(false);
  const [refreshInquiry, setRefreshInquiry] = useState(false);
  const [refreshAccount, setRefreshAccount] = useState(false);
  const [refreshLable, setRefreshLable] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(false);

  const [userAssignContactId, setUserAssignContactId] = useState<number>();
  const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
    useState<boolean>(false);
  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<
    ITaskView[]
  >([]);
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [isOpenTaskCreateModel, setIsOpenTaskCreateModel] = useState(false);

  const [isExploreNearbyShow, setIsExploreNearbyShow] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [supportTicketCount, setSupportTicketCount] = useState(0);

  //
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);
  const [pinConfirmation, setPinConfirmation] = useState<{
    show: boolean;
    type: "pin" | "unpin" | null;
  }>({
    show: false,
    type: null,
  });
  const [messageId, setmessageId] = useState<any>();
  const [pinnedMessageContent, setPinnedMessageContent] = useState<string>("");
  const { advertisement } = useAdvertisementStore();
  const [focus, setFocus] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [hover, setHover] = useState(false);
  const [show, setShow] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<IDynamicOptions[]>([]);

  const [isReportShow, setIsReportShow] = useState(false);
  const [reportName, setReportName] = useState("");

  const [hasSearchedDB, setHasSearchedDB] = useState(false);
  // const [taskCategoryLists, setTaskCategoryList] = useState<
  //   ITaskCategoryView[]
  // >([]);

  // const categoryIds = taskCategoryLists
  //   ?.map((item) => item.id)
  //   .join(",") ?? "";

  // const categoryNames = taskCategoryLists
  //   .map((item) => item.task_category_name)
  //   .join(",");
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchValue]);

  useEffect(() => {
    fetchCompanyApi(
      setCompanyLists,
      "",
      setNoDataFound,
      setCompanyJoinOrCreate,
      setLoading,
    );
    // fetchTaskCategoryApi(setTaskCategoryList, setLoading);
  }, []);

  // order Type 10 = Stock Inward and 11 = Stock Outward so do not use this two type he is work in direactly backend side
  const orderTypesList = [
    { id: "1", order_type: "Quotation" },
    { id: "2", order_type: "Sales Order" },
    { id: "3", order_type: "Sales Invoice" },
    { id: "4", order_type: "Purchase Invoice" },
    { id: "5", order_type: "Purchase Order" },
    { id: "6", order_type: "Return Sales Invoice" },
    { id: "7", order_type: "Return Purchase Invoice" },
    { id: "8", order_type: "Inward" },
    { id: "9", order_type: "Dispatch" },
    { id: "12", order_type: "Proforma Invoice" },
  ];

  const canViewTeam = useCheckUserPermission(
    PAGE_ID.TEAMPERFORMANCE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewContact = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewInquiry = useCheckUserPermission(
    PAGE_ID.ALLINQUIRY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewVisitReport = useCheckUserPermission(
    PAGE_ID.ALLVISIT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCallReport = useCheckUserPermission(
    PAGE_ID.ALLCALL_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductInventory = useCheckUserPermission(
    PAGE_ID.PRODUCTINVENTORY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewOrderInvoice = useCheckUserPermission(
    PAGE_ID.SALESINVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.PURCHASEINVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASEORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewDispath = useCheckUserPermission(
    PAGE_ID.DISPATCH_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSupportTicket = useCheckUserPermission(
    PAGE_ID.SUPPORT_TICKET_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAccountOutstanding = useCheckUserPermission(
    PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewEmpAccountOutstanding = useCheckUserPermission(
    PAGE_ID.EMP_ACCOUNTOUTSTANDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPendingWork = useCheckUserPermission(
    PAGE_ID.PENDINGWORK_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAttendanceSalary = useCheckUserPermission(
    PAGE_ID.ATTEDANCESALARY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProcessAttendance = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSalaryProcess = useCheckUserPermission(
    PAGE_ID.SALARY_PROCESS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductMovement = useCheckUserPermission(
    PAGE_ID.PRODUCTMOVEMENT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductPending = useCheckUserPermission(
    PAGE_ID.PRODUCTPENDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCategoryMovement = useCheckUserPermission(
    PAGE_ID.CATEGORYMOVEMENT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCategoryPending = useCheckUserPermission(
    PAGE_ID.CATEGORYPENDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewALLDeletedContact = useCheckUserPermission(
    PAGE_ID.ALL_DELETED_CONTACT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSourceReport = useCheckUserPermission(
    PAGE_ID.SOURCE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewLabelReport = useCheckUserPermission(
    PAGE_ID.LABEL_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTeamExpense = useCheckUserPermission(
    PAGE_ID.TEAMEXPENSE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewDetailedExpense = useCheckUserPermission(
    PAGE_ID.EXPENSE_DETAILED_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPendingOrder = useCheckUserPermission(
    PAGE_ID.PENDINGSALESORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPendingPurchase = useCheckUserPermission(
    PAGE_ID.PENDINGPURCHASEORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAllAccountTransition = useCheckUserPermission(
    PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAllReminder = useCheckUserPermission(
    PAGE_ID.REMINDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewChainWise = useCheckUserPermission(
    PAGE_ID.CONTACT_CHAIN_WISE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canStatusWise = useCheckUserPermission(
    PAGE_ID.STATUS_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProformaInvoiceReport = useCheckUserPermission(
    PAGE_ID.PROFORMA_INVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const handleSingleReportShow = (name: string) => {
    if (canViewTeam && name === "team_performance") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewQuotation && name === "quotation") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewOrder && name === "order") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewDispath && name === "dispatch_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewOrderInvoice && name === "order_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewReturnSalesInvoice && name === "return_sales_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPurchaseOrder && name === "purchase_order") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewInward && name === "inward_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPurchaseInvoice && name === "purchase_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewReturnPurchaseInvoice &&
      name === "return_purchase_invoice"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewAccountOutstanding && name === "account") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewEmpAccountOutstanding && name === "employee_account") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPendingWork && name === "pending") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewProductInventory && name === "product_inventory") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewAttendanceSalary && name === "attendance_salary") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewProcessAttendance && name === "process_attendance") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewSalaryProcess && name === "salary_register") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewProductMovement && name === "product_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewProductPending &&
      name === "product_wise_pending_report"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewCategoryMovement && name === "category_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewCategoryPending &&
      name === "category_wise_pending_report"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewContact && name === "all_contact_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewALLDeletedContact &&
      name === "all_deleted_contact_report"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewSourceReport &&
      name === "source_wise_contact_statistic_report"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewLabelReport &&
      name === "label_wise_contact_statistics_report"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewInquiry && name === "all_inquiry_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewTeamExpense && name === "team_day_wise_expanse_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewDetailedExpense && name === "expanse_detailed_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewVisitReport && name === "all_visit_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewCallReport && name === "all_call_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPendingOrder && name === "pending_order") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPendingPurchase && name === "pending_purchase") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewTask && name === "alltask_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewSupportTicket && name === "support_ticket_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewAllAccountTransition && name === "allaccount_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewAllAccountTransition &&
      name === "account_credit_report"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewAllAccountTransition && name === "account_debit_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (name === "payment_type_wise_account") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewAllReminder && name === "allreminder_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewChainWise && name === "all_contact_chainwise_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canStatusWise && name === "status_wise_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewProformaInvoiceReport && name === "profoma_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else if (name === "daily_sales_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else {
      setIsReportShow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      setReportName(name);
    }
  };

  const suggestions = [
    {
      Number: "1",
      text: "View Insights",
      action: () => {
        canViewInsight
          ? window.open("/SideView", "_blank")
          : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      },
    },
    {
      Number: "2",
      text: "My Team",
      action: () => {
        canViewTeamMember
          ? showMyCompany()
          : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      },
    },
    { Number: "3", text: "Personal Notes", action: () => showNotes() },
    {
      Number: "4",
      text: "All Reports",
      action: () => window.open("/SideView?view=reports", "_blank"),
    },
    { Number: "5", text: "My Task", action: () => showMyTask() },
    {
      Number: "7",
      text: "Explore in google map",
      action: () => {
        canViewAiModel
          ? handelChangeShowModelExploreNearby()
          : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      },
    },
    {
      Number: "9",
      text: "Online Store",
      action: () => {
        window.open(`/website/${companyData?.qr_code}`, "_blank");
      },
    },
    {
      Number: "10",
      text: `Add ${companyLists[0] && companyLists[0]?.quotation_title
        ? companyLists[0]?.quotation_title
        : "Quotation"
        }`,
      action: () => {
        handelOpenQuotation();
      },
    },
    {
      Number: "11",
      text: `Add ${companyLists[0] && companyLists[0]?.order_title
        ? companyLists[0]?.order_title
        : "Sales Order"
        }`,
      action: () => {
        handelOpenOrder();
      },
    },
    {
      Number: "12",
      text: `Add ${companyLists[0] && companyLists[0]?.dispatch_title
        ? companyLists[0]?.dispatch_title
        : "Dispatch"
        }`,
      action: () => {
        handelOpenDispatch();
      },
    },
    {
      Number: "13",
      text: `Add ${companyLists[0] && companyLists[0]?.invoice_title
        ? companyLists[0]?.invoice_title
        : "Sales Invoice"
        }`,
      action: () => {
        handelOpenInvoice();
      },
    },
    {
      Number: "14",
      text: `Add ${companyLists[0] && companyLists[0]?.return_sales_invoice_title
        ? companyLists[0]?.return_sales_invoice_title
        : "Return Sales Invoice"
        }`,
      action: () => {
        handelOpenReturnSalesInvoice();
      },
    },
    {
      Number: "15",
      text: `Add ${companyLists[0] && companyLists[0]?.purchase_order_title
        ? companyLists[0]?.purchase_order_title
        : "Purchase Order"
        }`,
      action: () => {
        handelOpenPurchaseOrder();
      },
    },
    {
      Number: "16",
      text: `Add ${companyLists[0] && companyLists[0]?.inward_title
        ? companyLists[0]?.inward_title
        : "Goods Received Note"
        }`,
      action: () => {
        handelOpenInward();
      },
    },
    {
      Number: "17",
      text: `Add ${companyLists[0] && companyLists[0]?.purchase_title
        ? companyLists[0]?.purchase_title
        : "Purchase Invoice"
        }`,
      action: () => {
        handelOpenPurchaseInvoice();
      },
    },
    {
      Number: "18",
      text: `Add ${companyLists[0] && companyLists[0]?.return_purchase_invoice_title
        ? companyLists[0]?.return_purchase_invoice_title
        : "Return Purchase Invoice"
        }`,
      action: () => {
        handelOpenReturnPurchaseInvoice();
      },
    },
    {
      Number: "19",
      text: "Support Ticket",
      action: () => {
        showMySupportTicket();
      },
    },
    {
      Number: "20",
      text: "Settings",
      action: () => {
        setSearchTermFromRightSide("settings");
      },
    },
    {
      Number: "21",
      text: "Export Contact",
      action: () => {
        setSearchTermFromRightSide("Export Contact");
      },
    },
    {
      Number: "22",
      text: "Archive Contacts",
      action: () => {
        setSearchTermFromRightSide("archive");
      },
    },
    {
      Number: "23",
      text: "Import Contact",
      action: () => {
        setSearchTermFromRightSide("Import Contact");
      },
    },
    {
      Number: "24",
      text: "View In Map",
      action: () => {
        setSearchTermFromRightSide("View In Map");
      },
    },
    {
      Number: "25",
      text: "Profile",
      action: () => {
        setSearchTermFromRightSide("Profile");
      },
    },
    {
      Number: "26",
      text: "My Company",
      action: () => {
        setSearchTermFromRightSide("My Company");
      },
    },
    {
      Number: "27",
      text: "Target vs incentive",
      action: () => {
        setSearchTermFromRightSide("Target vs incentive");
      },
    },
    {
      Number: "28",
      text: "Department",
      action: () => {
        setSearchTermFromRightSide("Department");
      },
    },
    {
      Number: "29",
      text: "Expense Type",
      action: () => {
        setSearchTermFromRightSide("Expense Type");
      },
    },
    {
      Number: "30",
      text: "Visit Type",
      action: () => {
        setSearchTermFromRightSide("Visit Type");
      },
    },
    {
      Number: "31",
      text: "Leave Type",
      action: () => {
        setSearchTermFromRightSide("Leave Type");
      },
    },
    {
      Number: "32",
      text: "Payment Type",
      action: () => {
        setSearchTermFromRightSide("Payment Type");
      },
    },
    {
      Number: "33",
      text: "Salary",
      action: () => {
        setSearchTermFromRightSide("salaryProcess");
      },
    },
    {
      Number: "34",
      text: "Process Attendance",
      action: () => {
        setSearchTermFromRightSide("processAttendance");
      },
    },
    {
      Number: "35",
      text: "Compensation Adjustments",
      action: () => {
        setSearchTermFromRightSide("compensationAdjustments");
      },
    },
    {
      Number: "36",
      text: "Lock Control",
      action: () => {
        setSearchTermFromRightSide("LockControl");
      },
    },
    {
      Number: "37",
      text: "Holiday",
      action: () => {
        setSearchTermFromRightSide("HolidayMaster");
      },
    },
    {
      Number: "38",
      text: "Round Off",
      action: () => {
        setSearchTermFromRightSide("RoundOffMaster");
      },
    },
    {
      Number: "39",
      text: "Adjustment Type",
      action: () => {
        setSearchTermFromRightSide("AdjustmentTypeMaster");
      },
    },
    {
      Number: "40",
      text: "Day Adjustment",
      action: () => {
        setSearchTermFromRightSide("DayAdjustmentMaster");
      },
    },
    {
      Number: "41",
      text: "All My Inquiries",
      action: () => {
        setSearchTermFromRightSide("All My Inquiries");
      },
    },
    {
      Number: "42",
      text: "All My Reminders",
      action: () => {
        setSearchTermFromRightSide("All My Reminders");
      },
    },
    {
      Number: "43",
      text: "All My Call History",
      action: () => {
        setSearchTermFromRightSide("All My Call History");
      },
    },
    {
      Number: "44",
      text: "All My Visits",
      action: () => {
        setSearchTermFromRightSide("All My Visits");
      },
    },
    {
      Number: "45",
      text: "All My Task",
      action: () => {
        setSearchTermFromRightSide("All My Task");
      },
    },
    {
      Number: "46",
      text: "Route Planner",
      action: () => {
        setSearchTermFromRightSide("routePlanner");
      },
    },
    {
      Number: "47",
      text: "Product Group",
      action: () => {
        setSearchTermFromRightSide("Product Group");
      },
    },
    {
      Number: "48",
      text: "Product Category",
      action: () => {
        setSearchTermFromRightSide("Product Category");
      },
    },
    {
      Number: "49",
      text: "Product Unit",
      action: () => {
        setSearchTermFromRightSide("Product Unit");
      },
    },
    {
      Number: "50",
      text: "products",
      action: () => {
        setSearchTermFromRightSide("products");
      },
    },
    {
      Number: "51",
      text: "Price List",
      action: () => {
        setSearchTermFromRightSide("Price List");
      },
    },
    {
      Number: "52",
      text: "Tax",
      action: () => {
        setSearchTermFromRightSide("TaxMaster");
      },
    },
    {
      Number: "53",
      text: "Task Category",
      action: () => {
        setSearchTermFromRightSide("Task Category");
      },
    },
    {
      Number: "54",
      text: "Task Template",
      action: () => {
        setSearchTermFromRightSide("Task Template");
      },
    },
    {
      Number: "55",
      text: "Source",
      action: () => {
        setSearchTermFromRightSide("Source");
      },
    },
    {
      Number: "56",
      text: "Labels",
      action: () => {
        setSearchTermFromRightSide("Labels");
      },
    },
    {
      Number: "57",
      text: "Stages & Status",
      action: () => {
        setSearchTermFromRightSide("Stages & Status");
      },
    },
    {
      Number: "58",
      text: "All Countries",
      action: () => {
        setSearchTermFromRightSide("all_countries");
      },
    },
    {
      Number: "59",
      text: "All States",
      action: () => {
        setSearchTermFromRightSide("All States");
      },
    },
    {
      Number: "60",
      text: "All Cities",
      action: () => {
        setSearchTermFromRightSide("All Cities");
      },
    },
    {
      Number: "61",
      text: "All Areas",
      action: () => {
        setSearchTermFromRightSide("All Areas");
      },
    },
    {
      Number: "62",
      text: "Job Card",
      action: () => {
        setSearchTermFromRightSide("jobcard");
      },
    },
    {
      Number: "63",
      text: "Work Station",
      action: () => {
        setSearchTermFromRightSide("Work Station");
      },
    },
    {
      Number: "64",
      text: "Process Master",
      action: () => {
        setSearchTermFromRightSide("Process Master");
      },
    },
    {
      Number: "65",
      text: "Warehouse",
      action: () => {
        setSearchTermFromRightSide("Warehouse");
      },
    },
    {
      Number: "66",
      text: "Bill Of Materials",
      action: () => {
        setSearchTermFromRightSide("Bill Of Materials");
      },
    },
    {
      Number: "67",
      text: "Stock Adjustment",
      action: () => {
        setSearchTermFromRightSide("Stock Adjustment");
      },
    },
    {
      Number: "68",
      text: "Custom Field Form",
      action: () => {
        setSearchTermFromRightSide("Custom Field Form");
      },
    },
    {
      Number: "69",
      text: "Notification Settings",
      action: () => {
        setSearchTermFromRightSide("Notification Settings");
      },
    },
    {
      Number: "70",
      text: "WorkFlow Automation",
      action: () => {
        setSearchTermFromRightSide("WorkFlow Automation");
      },
    },
    {
      Number: "71",
      text: "Shortcut",
      action: () => {
        setSearchTermFromRightSide("Shortcut");
      },
    },
    {
      Number: "72",
      text: "Add Contact",
      action: () => {
        setSearchTermFromRightSide("Create Contact");
      },
    },
    {
      Number: "73",
      text: "Add Team",
      action: () => {
        canViewTeamMember
          ? showMyCompany()
          : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        setSearchTermFromRightSide("Add Team");
      },
    },
    {
      Number: "74",
      text: "Add Target Vs Incentive",
      action: () => {
        setSearchTermFromRightSide("Create Target Vs Incentive");
      },
    },
    {
      Number: "75",
      text: "Add Reminder",
      action: () => {
        setSearchTermFromRightSide("Add Reminder");
      },
    },
    {
      Number: "76",
      text: "Add Task",
      action: () => {
        setSearchTermFromRightSide("Create Task");
      },
    },
    {
      Number: "77",
      text: "Add Product",
      action: () => {
        setSearchTermFromRightSide("Create Product");
      },
    },
    {
      Number: "78",
      text: "Add Stock Adjustment",
      action: () => {
        setSearchTermFromRightSide("Add Stock Adjustment");
      },
    },
    {
      Number: "79",
      text: "Team Performance Report",
      action: () => {
        handleSingleReportShow("team_performance");
      },
    },
    {
      Number: "80",
      text: `${companyLists[0] && companyLists[0]?.quotation_title
        ? companyLists[0]?.quotation_title + "Report"
        : "Quotation Report"
        }`,
      action: () => {
        handleSingleReportShow("quotation");
      },
    },
    {
      Number: "81",
      text: `${companyLists[0] && companyLists[0]?.order_title
        ? companyLists[0]?.order_title + " Report"
        : "Sales Order Report"
        }`,
      action: () => {
        handleSingleReportShow("order");
      },
    },
    {
      Number: "82",
      text: `${companyLists[0] && companyLists[0]?.dispatch_title
        ? companyLists[0]?.dispatch_title + " Report"
        : "Dispatch Report"
        }`,
      action: () => {
        handleSingleReportShow("dispatch_report");
      },
    },
    {
      Number: "83",
      text: `${companyLists[0] && companyLists[0]?.invoice_title
        ? companyLists[0]?.invoice_title + " Report"
        : "Sales Invoice Report"
        }`,
      action: () => {
        handleSingleReportShow("order_invoice");
      },
    },
    {
      Number: "84",
      text: `${companyLists[0] && companyLists[0]?.return_sales_invoice_title
        ? companyLists[0]?.return_sales_invoice_title + " Report"
        : "Return Sales Invoice Report"
        }`,
      action: () => {
        handleSingleReportShow("return_sales_invoice");
      },
    },
    {
      Number: "85",
      text: `${companyLists[0] && companyLists[0]?.purchase_order_title
        ? companyLists[0]?.purchase_order_title + " Report"
        : "Purchase Order Report"
        }`,
      action: () => {
        handleSingleReportShow("purchase_order");
      },
    },
    {
      Number: "86",
      text: `${companyLists[0] && companyLists[0]?.inward_title
        ? companyLists[0]?.inward_title + " Report"
        : "Goods Received Note Report"
        }`,
      action: () => {
        handleSingleReportShow("inward_report");
      },
    },
    {
      Number: "87",
      text: `${companyLists[0] && companyLists[0]?.purchase_title
        ? companyLists[0]?.purchase_title + " Report"
        : "Purchase Invoice Report"
        }`,
      action: () => {
        handleSingleReportShow("purchase_invoice");
      },
    },
    {
      Number: "88",
      text: `${companyLists[0] && companyLists[0]?.return_purchase_invoice_title
        ? companyLists[0]?.return_purchase_invoice_title + " Report"
        : "Return Purchase Invoice Report"
        }`,
      action: () => {
        handleSingleReportShow("return_purchase_invoice");
      },
    },
    {
      Number: "89",
      text: "Account Outstanding Report",
      action: () => {
        handleSingleReportShow("account");
      },
    },
    {
      Number: "90",
      text: "Employee Account Outstanding Report",
      action: () => {
        handleSingleReportShow("employee_account");
      },
    },
    {
      Number: "91",
      text: "Team Pending Work Report",
      action: () => {
        handleSingleReportShow("pending");
      },
    },
    {
      Number: "92",
      text: "Product Inventory & Stock Alert Report",
      action: () => {
        handleSingleReportShow("product_inventory");
      },
    },
    {
      Number: "93",
      text: "Attendance & Salary Report",
      action: () => {
        handleSingleReportShow("attendance_salary");
      },
    },
    {
      Number: "94",
      text: "Attendance Register Report",
      action: () => {
        handleSingleReportShow("process_attendance");
      },
    },
    {
      Number: "95",
      text: "Salary Register Report",
      action: () => {
        handleSingleReportShow("salary_register");
      },
    },
    {
      Number: "96",
      text: "Product Wise Movement Report",
      action: () => {
        handleSingleReportShow("product_report");
      },
    },
    {
      Number: "97",
      text: "Product Wise Pending Report",
      action: () => {
        handleSingleReportShow("product_wise_pending_report");
      },
    },
    {
      Number: "98",
      text: "Category Wise Movement Report",
      action: () => {
        handleSingleReportShow("category_report");
      },
    },
    {
      Number: "99",
      text: "Category Wise Pending Report",
      action: () => {
        handleSingleReportShow("category_wise_pending_report");
      },
    },
    {
      Number: "100",
      text: "All Contact Report",
      action: () => {
        handleSingleReportShow("all_contact_report");
      },
    },
    {
      Number: "101",
      text: "All Deleted Contact Report",
      action: () => {
        handleSingleReportShow("all_deleted_contact_report");
      },
    },
    {
      Number: "102",
      text: "Source Wise Statistic Report",
      action: () => {
        handleSingleReportShow("source_wise_contact_statistic_report");
      },
    },
    {
      Number: "103",
      text: "Label Wise Statistic Report",
      action: () => {
        handleSingleReportShow("label_wise_contact_statistics_report");
      },
    },
    {
      Number: "104",
      text: "All Inquiry Report",
      action: () => {
        handleSingleReportShow("all_inquiry_report");
      },
    },
    {
      Number: "105",
      text: "Team Wise Daily Expense Report",
      action: () => {
        handleSingleReportShow("team_day_wise_expanse_report");
      },
    },
    {
      Number: "106",
      text: "Expense Detailed Report",
      action: () => {
        handleSingleReportShow("expanse_detailed_report");
      },
    },
    {
      Number: "107",
      text: "All Visit Report",
      action: () => {
        handleSingleReportShow("all_visit_report");
      },
    },
    {
      Number: "108",
      text: "All Call Report",
      action: () => {
        handleSingleReportShow("all_call_report");
      },
    },
    {
      Number: "109",
      text: "Pending Order Report",
      action: () => {
        handleSingleReportShow("pending_order");
      },
    },
    {
      Number: "110",
      text: "Pending Purchase Order Report",
      action: () => {
        handleSingleReportShow("pending_purchase");
      },
    },
    {
      Number: "111",
      text: "All Task Report",
      action: () => {
        handleSingleReportShow("alltask_report");
      },
    },
    {
      Number: "112",
      text: "Support Ticket Report",
      action: () => {
        handleSingleReportShow("support_ticket_report");
      },
    },
    {
      Number: "113",
      text: "All Account Transaction Report",
      action: () => {
        handleSingleReportShow("allaccount_report");
      },
    },
    {
      Number: "114",
      text: "Account Transaction Credit Report",
      action: () => {
        handleSingleReportShow("account_credit_report");
      },
    },
    {
      Number: "115",
      text: "Account Transaction Debit Report",
      action: () => {
        handleSingleReportShow("account_debit_report");
      },
    },
    {
      Number: "116",
      text: "Payment Type Wise Account Report",
      action: () => {
        handleSingleReportShow("payment_type_wise_account");
      },
    },
    {
      Number: "117",
      text: "All Reminder Report",
      action: () => {
        handleSingleReportShow("allreminder_report");
      },
    },
    {
      Number: "118",
      text: "Chain Wise Contact Report",
      action: () => {
        handleSingleReportShow("all_contact_chainwise_report");
      },
    },
    {
      Number: "119",
      text: "Status Wise Task Or Supp. Ticket Report",
      action: () => {
        handleSingleReportShow("status_wise_report");
      },
    },
    {
      Number: "120",
      text: "Proforma Invoice",
      action: () => {
        handleSingleReportShow("profoma_invoice");
      },
    },
    {
      Number: "121",
      text: "Daily Sales Invoice Report",
      action: () => {
        handleSingleReportShow("daily_sales_invoice");
      },
    },
  ];

  const dynamicOnes = useMemo(() => {
    if (dynamicOptions.length === 0) return [];

    return dynamicOptions.map((item, index) => {
      let typeLabel1 = "";
      let typeLabel2 = "";

      if (item.cart_number) {
        typeLabel1 =
          item.type === 10
            ? "Stock Adjustment Inward"
            : item.type === 11
              ? "Stock Adjustment Outward"
              : orderTypesList.find((e) => Number(e.id) === item.type)
                ?.order_type || "";
      } else if (item.task_title) {
        typeLabel2 = item.is_support_ticket === 1 ? "Support Ticket" : "Task";
      }

      return {
        text: item.cart_number
          ? `${item.cart_number} - ${typeLabel1}`
          : `${item.task_title} - ${typeLabel2}`,
        Number: index + 1,
        action: item.cart_number
          ? () => {
            window.open(item.link, "_blank", "noopener,noreferrer");
          }
          : () => {
            if (typeLabel2 === "Task") {
              showMyTask();
            } else {
              showMySupportTicket();
            }
            setIdFromRightSide(item.id);
          },
      };
    });
  }, [dynamicOptions]);

  useEffect(() => {
    setDynamicOptions([]);
    setHasSearchedDB(false);
  }, [searchValue]);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setSearchTermFromRightSide("");
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // type SuggestionType = {
  //   text: string;
  //   matchIndex: number;
  // };

  const filteredSuggestions = suggestions.filter((item) =>
    item.text.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const listToShow = dynamicOnes.length > 0 ? dynamicOnes : filteredSuggestions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const item = filteredSuggestions[selectedIndex];
        item.action();
        setShow(false);
        setSearchValue("");
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show, filteredSuggestions, selectedIndex]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault(); // optional (prevents browser conflicts)

        inputRef.current?.focus();
        setSearchValue("");
        setShow(true);
      }
    };

    document.addEventListener("keydown", handleShortcut);

    return () => {
      document.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const handleDynamicOptionFetch = async () => {
    setLoading(true);
    setHasSearchedDB(true);

    await fetchDynamicOptions(setDynamicOptions, searchValue);

    setLoading(false);
    setShow(true);
  };

  useEscapeKey(() => {
    if (
      !showListAccountTransaction &&
      !showListInquiry &&
      !showListOrder &&
      !showProfile &&
      !isModalOpen &&
      !searchOpen &&
      !showVisits &&
      !showTasks &&
      !showTickets &&
      !isTaskRightSideopen
    ) {
      setShowRightSide(false);
    } else {
      setShowListAccountTransaction(false);
      setShowListInquiry(false);
      setShowListOrder(false);
      setShowProfile(false);
      setIsModalOpen(false);
      setSearchOpen(false);
      setShowVisits(false);
      setShowTasks(false);
      setShowTickets(false);
      setIsTaskRightSideOpen(false);
    }
  });

  useEffect(() => {
    if (showRightSide) {
      setIsTaskRightSideOpen(false);
    }
  }, [showRightSide]);

  // This code is when contact Delete to LeftSide his Automatic close all tab in rightSide
  useEffect(() => {
    setShowVisits(false);
    setIsModalOpen(false);
    setShowListOrder(false);
    setShowListInquiry(false);
    setShowListAccountTransaction(false);
    setSelectedContactTask(null);
  }, [resetTrigger]);

  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  useEffect(() => {
    fetchReminderCount(setReminderCount, getData?.id);
    fetchTaskCount(setTaskCount);
    fetchSupportTicketCount(setSupportTicketCount);
    setSelectedContactTask(null);
  }, [getData?.id]);
  const canViewInq = useCheckUserPermission(
    PAGE_ID.INQUIRY,
    PERMISSION_TYPE.VIEW,
  );

  const canViewInsight = useCheckUserPermission(
    PAGE_ID.INSIGHT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAiModel = useCheckUserPermission(
    PAGE_ID.AI_ASSISTANT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewFilterContact = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTeamMember = useCheckUserPermission(
    PAGE_ID.TEAM_MEMBER_WITH_ACCESS_RIGHT,
    PERMISSION_TYPE.VIEW,
  );
  const canAddContact = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.ADD,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.CONTACT_MESSAGE_HISTORY,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.CONTACT_MESSAGE_HISTORY,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.CONTACT_MESSAGE_HISTORY,
    PERMISSION_TYPE.DELETE,
  );
  const canAddReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.ADD,
  );
  const canApproveReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.APPROVE,
  );
  const canAddQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.ADD,
  );
  const canAddOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.ADD,
  );
  const canAddInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canAddReturnSalesInv = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canAddInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.ADD,
  );
  const canAddDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.ADD,
  );
  const canAddPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.ADD,
  );
  const canAddProfomaInvoice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canAddPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.ADD,
  );
  const canAddReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canViewQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProfomaINV = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.VIEW,
  );
  const canViewDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.VIEW,
  );
  const canViewInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPurcheshOrder = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.VIEW,
  );
  const canViewReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.VIEW,
  );

  const canViewReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.VIEW,
  );

  const canAddMail = useCheckUserPermission(PAGE_ID.EMAIL, PERMISSION_TYPE.ADD);
  const canAddVisit = useCheckUserPermission(
    PAGE_ID.VISIT,
    PERMISSION_TYPE.ADD,
  );
  const canViewAccHis = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSupport = useCheckUserPermission(
    PAGE_ID.SUPPORT_TICKET,
    PERMISSION_TYPE.VIEW,
  );

  const canAddAttendance = useCheckUserPermission(
    PAGE_ID.ATTENDANCE,
    PERMISSION_TYPE.ADD,
  );

  const canViewVoiceControl = useCheckUserPermission(
    PAGE_ID.VOICE_CONTROL,
    PERMISSION_TYPE.VIEW,
  );

  const canViewLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canAddAssignTeamMember = useCheckUserPermission(
    PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
    PERMISSION_TYPE.ADD,
  );

  const canAddTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.ADD,
  );
  const canView = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.VIEW);
  // const canViewAttendance = useCheckUserPermission(
  //   PAGE_ID.ATTENDANCE,
  //   PERMISSION_TYPE.VIEW
  // );
  const openRightSide = () => { };

  const a_application_login_id = localStorage.getItem("UUID");

  function openSearch() {
    setSearchOpen(true);
  }

  function openChatAbout() {
    // setShowProfile(true);
    rightSideViewProvider("profile");
  }
  const contact_statistics = () => {
    setIsModalOpen(true);
  };

  const handleClick = () => {
    setShowCreateNote(true);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleDropdownCreate = () => {
    setDropdownOpenCreateOrder(!dropdownOpenCreateOrder);
  };
  const toggleDropdownMsg = (id: number) => {
    setDropdownOpenMsg((prevId: number | null) => (prevId === id ? null : id));
    setDropdownOpenMsgLeft(null);
  };

  const toggleDropdownMsgLeft = (id: number) => {
    setDropdownOpenMsgLeft((prevId: number | null) =>
      prevId === id ? null : id,
    );
    setDropdownOpenMsg(null);
  };

  const handelChangeShowModelExploreNearby = () => {
    setIsExploreNearbyShow(true);
  };

  const toggleReminder = (id: number) => {
    if (canAddReminder) {
      setReminderForMsgId(id);
      setIsReminderConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleMoveToMe = (id: number) => {
    setMoveForMsgId(id);
    setIsMoveToMeConfirmation(true);
  };
  const toggleMoveToClient = (id: number) => {
    setMoveForMsgId(id);
    setIsMoveToClientConfirmation(true);
  };

  useEffect(() => {
    const handleClickOutsideMainDropdown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutsideMainDropdown);
    return () => {
      document.removeEventListener("click", handleClickOutsideMainDropdown);
    };
  }, []);

  useEffect(() => {
    const handleClickOutsideCreateOrderDropdown = (event: MouseEvent) => {
      if (
        dropdownCreateOrderRef.current &&
        !dropdownCreateOrderRef.current.contains(event.target as Node)
      ) {
        setDropdownOpenCreateOrder(false);
      }
    };

    document.addEventListener("click", handleClickOutsideCreateOrderDropdown);
    return () => {
      document.removeEventListener(
        "click",
        handleClickOutsideCreateOrderDropdown,
      );
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageList]);

  const handleDeleteMessage = async () => {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
      table: "contact_message_histories",
      where: `{"id":"${deleteMsgId}"}`,
      data: `{"isDelete":"1", "deleted_by": ${getUUID}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setIsDeleteConfirmation(false);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleChangeStatusOfReminder = async () => {
    if (!isReminderConfirmationStatus1?.id) {
      toast.error("Invalid message ID for reminder completion.");
      setIsReminderConfirmationStatus(false);
      return;
    }

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
      where: `{"a_application_login_id":"${getUUID}","reference_id":"${isReminderConfirmationStatus1.id}","reference_table":"contact_message_histories"}`,
      data: `{"status":"1","completed_date_time":"${formattedDateTime}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setIsReminderConfirmationStatus(false);

          const requestData = {
            table: "contact_message_histories",
            where: `{"id":"${isReminderConfirmationStatus1.id}"}`,
            data: JSON.stringify({
              is_reminder: 0,
            }),
          };
          try {
            const response = await axiosInstance.post(
              "commonUpdate",
              requestData,
            );
            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
              // Refresh the message list to reflect the updated reminder status
              fetchMessageData(
                setNoDataFound,
                searchTerm,
                setLoading,
                setMessageList,
                setHasMore,
                currentPage,
                setNoDataFound1,
                getData?.id,
                checkedReminder,
                checkedAttachment,
                selectDate,
                "-1",
                setGetCompanyId,
              );
              return true;
            } else {
              toast.error(
                response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
              );
              return false;
            }
          } catch (error: any) {
            toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleRescheduleReminder = async (data: {
    dateTime: string;
    remark: string;
    selectedCategory?: any;
  }) => {
    if (!isReminderConfirmationStatus1?.id) {
      toast.error("Invalid message ID for reminder.");
      setIsReminderReschedule(false);
      return;
    }

    if (!data.dateTime) {
      toast.error("Please select a new reminder date and time.");
      return;
    }

    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      table: "reminder_messages",
      where: `{"a_application_login_id":"${getUUID}","reference_id":"${isReminderConfirmationStatus1.id}","reference_table":"contact_message_histories"}`,
      data: JSON.stringify({
        status: "0", // 0 = Pending
        reminder_data_time: data.dateTime,
        remark: data.remark || isReminderConfirmationStatus1.reminder_remark,
      }),
    };

    try {
      const { data: response } = await axiosInstance.post(
        "commonUpdate",
        requestData,
      );

      if (
        response.code === 200 &&
        response.ack === DEFAULT_STATUS_CODE_SUCCESS
      ) {
        toast.success("Reminder rescheduled successfully!");

        // Refresh message list
        fetchMessageData(
          setNoDataFound,
          searchTerm,
          setLoading,
          setMessageList,
          setHasMore,
          currentPage,
          setNoDataFound1,
          getData?.id,
          checkedReminder,
          checkedAttachment,
          selectDate,
          "-1",
          setGetCompanyId,
        );

        setIsReminderReschedule(false);
        setIsReminderConfirmationStatus(false);
        setIsReminderConfirmationStatus1(null);
      } else {
        toast.error(response.ack_msg || "Failed to reschedule reminder");
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleChangeToggleButton = () => {
    setIsToggledButton(!isToggledButton);
    setMessageSide(isToggledButton ? 1 : 2);
  };
  const handleWhatsAppToggle = (checked: boolean) => {
    setIsWhatsAppAuto(checked);
  };
  const handelSendMessage = async () => {
    setIsLoadedMessage(false);
    if (sendMessageTextboxValue.trim()) {
      if (
        await insertMessage({
          message_side: messageSide,
          description: sendMessageTextboxValue,
          contact_masters_id: getData?.id,
        })
      ) {
        setSendMessageTextboxValue("");
        setIsLoadedMessage(true);
      }
    }
  };
  const handelDeleteContact = async () => {
    contactsReload(false);
    if (await deleteContact(getData?.id)) {
      setShowRightSide(false);
      setIsCloseConfirmation(false);
      contactsReload(true);
      setShowProfile(false);
    }
  };
  const closeChat = async () => {
    setShowRightSide(false);
    setShowListAccountTransaction(false);
    setShowListInquiry(false);
    setShowListOrder(false);
    setShowProfile(false);
    setIsModalOpen(false);
    setSearchOpen(false);
    setShowVisits(false);
    setShowTasks(false);
    setShowTickets(false);
    setIsTaskRightSideOpen(false);
  };
  const handelClearMessages = async () => {
    setIsLoadedMessage(false);
    if (await deleteMessages(getData?.id)) {
      setIsLoadedMessage(true);
    }
    setIsClearConfirmation(false);
  };
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
      await createReminder(
        data,
        getData?.id,
        reminderForMsgId,
        setIsReminderConfirmation,
      );
    } else {
      toast.error("Please enter Date and Time, Remark, and Select Team Member");
      setIsReminderConfirmation(true);
    }
  };

  useEffect(() => {
    if (
      refreshChat ||
      refreshVisit ||
      refreshInquiry ||
      refreshAccount ||
      refreshLable ||
      refreshStatus
    ) {
      fetchLabelApi(setOptions, setLoading);
      fetchMessageData(
        setNoDataFound,
        "",
        setLoading,
        setMessageList,
        setHasMore,
        0,
        setNoDataFound1,
        getData?.id,
        checkedReminder,
        checkedAttachment,
        selectDate,
        "-1",
        setGetCompanyId,
      );
      setRefreshContact && refreshLable && setRefreshContact(true);

      setRefreshChat(false);
      setRefreshVisit(false);
      setRefreshInquiry(false);
      setRefreshAccount(false);
      setRefreshLable(false);
      setRefreshStatus(false);
    }
    if (getData?.id) {
      getContactPinnedMessage(setPinnedMessageContent, getData?.id);
    } else {
      setPinnedMessageContent("");
    }
  }, [
    refreshAccount,
    refreshInquiry,
    refreshChat,
    refreshVisit,
    getData?.id,
    checkedReminder,
    checkedAttachment,
    selectDate,
    refreshLable,
    refreshStatus,
    // refreshReport,
  ]);

  useEffect(() => {
    if (refreshReport) {
      // setRefreshContact && setRefreshContact(true);
      setRefreshReport(false);
    }
  }, [refreshReport]);

  const handelRefreshMessages = async () => {
    try {
      if (getData?.id) {
        await fetchMessageData(
          setNoDataFound,
          "",
          setLoading,
          setMessageList,
          setHasMore,
          0,
          setNoDataFound1,
          getData?.id,
          checkedReminder,
          checkedAttachment,
          selectDate,
          "-1",
          setGetCompanyId,
        );
      }
    } catch (error) {
      console.error("Error refreshing contacts:", error);
    }
  };

  const handleEditorChange = (fieldName: string, html: string) => {
    if (getData?.id) {
      setEditorContent("");
    } else {
      setEditorContent(html);
    }
  };

  const handleSend = async (
    html: string,
    crd_flag: string | undefined | null = "",
  ) => {
    if (getData?.id) {
      setEditorContentToEdit("");
      setEditorContentToEditId(0);
    }
    setIsLoadedMessage(false);
    const getUserName = localStorage.getItem("USERNAME");
    if (editorContentToEditId) {
      if (html.trim()) {
        const requestData = {
          table: "contact_message_histories",
          where: `{"id":"${editorContentToEditId}"}`,
          data: JSON.stringify({
            description: html,
          }),
        };
        try {
          const data = await axiosInstance.post("commonUpdate", requestData);
          if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setEditorContentToEdit("");
            setEditorContentToEditId(0);
          } else {
            return false;
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } else {
      if (html.trim()) {
        const getUUID = await localStorage.getItem("UUID");
        const date = new Date();
        const formattedDateTime = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours(),
        ).padStart(2, "0")}:${String(date.getMinutes()).padStart(
          2,
          "0",
        )}:${String(date.getSeconds()).padStart(2, "0")}`;
        const requestData = {
          table: "contact_message_histories",
          data: JSON.stringify({
            message_side: messageSide,
            a_application_login_id: Number(getUUID),
            description: html,
            contact_masters_id: getData?.id,
            application_login_name: getUserName,
            message_type_id: 0,
            entry_flag: isWhatsAppAuto ? 1 : 0,
            is_reminder: crd_flag === "1" ? 1 : 0,
          }),
          ...(isWhatsAppAuto ? { request_flag: "msg" } : {}),
        };
        try {
          const response = await axiosInstance.post(
            "commonCreate",
            requestData,
          );
          if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            if (getData?.id || isEmailConfirmation === true) {
              setTimeout(() => {
                fetchMessageData(
                  setNoDataFound,
                  searchTerm,
                  setLoading,
                  setMessageList,
                  setHasMore,
                  currentPage,
                  setNoDataFound1,
                  getData?.id,
                  checkedReminder,
                  checkedAttachment,
                  selectDate,
                  "-1",
                  setGetCompanyId,
                );
              }, 2500);
            }
          } else if (response.data.ack === DEFAULT_STATUS_CODE_ERROR) {
            toast.error(
              response.data.developer_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    }
    setIsLoadedMessage(true);
  };
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    const isDropdownButton = (target as HTMLElement).closest(
      ".chat__msg-options",
    );
    if (isDropdownButton) {
      return;
    }

    const isOutsideRight = Object.values(dropdownRefRightMsg.current).every(
      (ref) => !ref?.contains(target),
    );
    const isOutsideLeft = Object.values(dropdownRefLeftMsg.current).every(
      (ref) => !ref?.contains(target),
    );

    if (isOutsideRight && dropdownOpenMsg !== null) {
      setDropdownOpenMsg(null);
    }
    if (isOutsideLeft && dropdownOpenMsgLeft !== null) {
      setDropdownOpenMsgLeft(null);
    }
  };

  const handleChangeStatusOfReminder1 = (messageData: TMessage) => {
    if (canApproveReminder) {
      setIsReminderConfirmationStatus(true);
      setIsReminderConfirmationStatus1(messageData);
      setDropdownOpenMsgLeft(null);
      setDropdownOpenMsg(null);
    } else {
      setIsReminderConfirmationStatus(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleChangeStatusOfReminderLeft = (messageData: TMessage) => {
    if (canApproveReminder) {
      setIsReminderConfirmationStatus(true);
      setIsReminderConfirmationStatus1(messageData);
      setDropdownOpenMsgLeft(null);
      setDropdownOpenMsg(null);
    } else {
      setIsReminderConfirmationStatus(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  useEffect(() => {
    if (getData?.id) {
      setSearchOpen(false);
      setCheckedReminder(false);
      setSearchTerm("");
      setCheckedAttachment(false);
      setSelectDate([]);
    } else {
      return undefined;
    }
  }, [getData?.id]);

  useEffect(() => {
    if (dropdownOpenMsg !== null || dropdownOpenMsgLeft !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpenMsg, dropdownOpenMsgLeft]);

  useEffect(() => {
    viewAttendanceStatus(setSavedAttendance, setLoading);
  }, []);

  const allMessages = messageList.flatMap((item) => item.messages);

  const lastThreeMessages = allMessages.slice(-3);

  const filteredItemIds = lastThreeMessages.map((item) => item.id);

  const getFileExtension = (fileName: string): string => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  const getIconForExtension = (extension: string): string => {
    switch (extension) {
      case "pdf":
        return pdfIcon;
      case "png":
        return pngIcon;
      case "svg":
        return svgIcon;
      case "xlsx":
      case "xls":
        return excelIcon;
      case "jpg":
      case "jpeg":
        return jpgIcon;
      case "docx":
      case "doc":
        return docxIcon;
      case "mp4":
        return Mp4Icon;
      case "mkv":
        return MkvIcon;
      case "mpeg":
      case "mpg":
        return MpgIcon;
      case "txt":
        return TxtIcon;
      case "pptx":
        return PptxIcon;
      case "ppt":
        return PptIcon;
      case "csv":
        return CsvIcon;
      case "rar":
        return RarIcon;
      case "psd":
        return PsdIcon;
      case "xml":
        return XmlIcon;
      case "zip":
        return zipIcon;
      case "mp3":
      case "m4a":
        return mp3Icon;
      case "ogg":
      case "wav":
        return micIcon;
      default:
        return "";
    }
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 3 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      setSearchTimeout(
        setTimeout(() => {
          fetchMessageData(
            setNoDataFound,
            value.trim(),
            setLoading,
            setMessageList,
            setHasMore,
            currentPage,
            setNoDataFound1,
            getData?.id,
            checkedReminder,
            checkedAttachment,
            selectDate,
            startDateForUl,
            setGetCompanyId,
          );
          setCurrentPage(0);
        }, 1000),
      );
    }
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setSelectDate([]);
    setCheckedAttachment(false);
    setCheckedReminder(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(false);
    setSearchTimeout(
      setTimeout(() => {
        fetchMessageData(
          setNoDataFound,
          "",
          setLoading,
          setMessageList,
          setHasMore,
          currentPage,
          setNoDataFound1,
          getData?.id,
          checkedReminder,
          checkedAttachment,
          selectDate,
          startDateForUl,
          setGetCompanyId,
        );
        setCurrentPage(0);
      }, 1000),
    );
  };

  const handelChangeDeleteRight = (id: number) => {
    if (canDelete) {
      setIsDeleteConfirmation(true);
      setDeleteMsgId(id);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  useEffect(() => {
    if (getData?.id) {
      setIsCreateContact1(true);
    } else {
      setIsCreateContact1(false);
    }
  }, [getData?.id]);
  const handleDownload = async (item: any) => {
    try {
      const fileUrl = `${item.media_url}`;
      const response = await axios.get(fileUrl, { responseType: "blob" });
      const fileName = item.media_name ? item.media_name : item.media_url;
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  };

  const handleChangeImgViewer = (item: TMessage) => {
    setImageViewData(item);
    setViewerOpen(true);
  };
  const handleViewinfo = () => {
    setViewInfo(true);
  };

  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: Element | null) => {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [hasMore, loading],
  );
  const [prevScrollHeight, setPrevScrollHeight] = useState<number>(0); // To store scroll height before loading

  useEffect(() => {
    if (getData?.id || isEmailConfirmation === true) {
      fetchMessageData(
        setNoDataFound,
        searchTerm,
        setLoading,
        setMessageList,
        setHasMore,
        currentPage,
        setNoDataFound1,
        getData?.id,
        checkedReminder,
        checkedAttachment,
        selectDate,
        "-1",
        setGetCompanyId,
      );
      // if (messageListRef.current && prevScrollHeight > 0) {
      //   messageListRef.current.scrollTop =
      //     messageListRef.current.scrollHeight - prevScrollHeight;
      // }
    }
    fetchGetByIdUser(setLoginById);
    fetchCompanyForRightSideViewApi(setCompanyId);
  }, [
    currentPage,
    getData?.id,
    isDeleteConfirmation,
    isLoadedMessage,
    isReminderConfirmationStatus,
    isReminderConfirmation,
    pinConfirmation,
    isEmailConfirmation,
    checkedReminder,
    checkedAttachment,
    selectDate,
    searchTerm,
    setNoDataFound1,
  ]);
  const handleChangeEdit = (itemsDis: TMessage) => {
    if (canEdit) {
      if (getData?.id) {
        setEditorContentToEditId(itemsDis.id);
        setEditorContentToEdit(itemsDis?.description);
        setDropdownOpenMsgLeft(null);
        setDropdownOpenMsg(null);
      } else {
        setEditorContentToEdit("");
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeRenewPlan = (item: ICompany) => {
    setShowRenewPlan(true);
    setRenewPlanItem(item);
  };
  const openInTab = (path: string) => {
    const baseURL = window.location.origin;
    window.open(`${baseURL}${path}`, "_blank");
  };

  const handelSearchDateChange = (selectedDates: Date[] | undefined) => {
    setSelectDate(selectedDates || []);
    fetchMessageData(
      setNoDataFound,
      searchTerm,
      setLoading,
      setMessageList,
      setHasMore,
      currentPage,
      setNoDataFound1,
      getData?.id,
      checkedReminder,
      checkedAttachment,
      selectedDates,
      startDateForUl,
      setGetCompanyId,
    );
  };
  const handleLoadMore = () => {
    const currentEndDate = new Date();
    const newStartDate = currentEndDate.toISOString().split("T")[0];
    const lastDate = messageList[0].date;
    const lastDateObj = new Date(lastDate);
    lastDateObj.setDate(lastDateObj.getDate() - 1);
    const nextDate = lastDateObj.toISOString().split("T")[0];
    setStartDateForUl(nextDate);
    fetchMessageData(
      setNoDataFound,
      searchTerm,
      setLoading,
      setMessageList,
      setHasMore,
      currentPage,
      setNoDataFound1,
      getData?.id,
      checkedReminder,
      checkedAttachment,
      selectDate,
      nextDate,
      setGetCompanyId,
    );
  };
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  //   if (refreshLable) {
  //     setRefreshContact && setRefreshContact(refreshLable);
  //   }
  //   const handleConfirm = async (
  //   contactId: number | undefined,
  //   checkedOptions: any[]
  // ) => {
  //   if (contactId === undefined) return;

  //   await upateCheckBox(contactId, checkedOptions, setLoading);
  //   setTimeout(() => {
  //     setCurrentPage(0); // Reset page to 0 when search term changes
  //   }, 100);

  //   setIsModalVisible(false);
  //   setRefreshContact && setRefreshContact(prev => (prev ? prev + 1 : 1)); // This will trigger left side refresh
  // };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const bottom =
      containerRef.current.scrollHeight ===
      containerRef.current.scrollTop + containerRef.current.clientHeight;
    setIsAtBottom(bottom);
  };
  const handelChangeShowModelQuotation = () => {
    if (canViewQuo) {
      setIsOrderShowNum(1);
      setDropdownOpenCreateOrder(false);

      setShowListOrder(true);
      rightSideViewProvider("salesView");
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeShowModelProformaINV = () => {
    if (canViewProfomaINV) {
      setIsOrderShowNum(12);
      setDropdownOpenCreateOrder(false);

      // setShowListOrder(true);
      rightSideViewProvider("salesView");
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeShowModelOrder = () => {
    if (canViewOrder) {
      setIsOrderShowNum(2);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");
      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeShowModelDispatch = () => {
    if (canViewDispatch) {
      setIsOrderShowNum(9);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");
      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenQuotation = () => {
    if (canAddQuo) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(1);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenOrder = () => {
    if (canAddOrder) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(2);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenInvoice = () => {
    if (canAddInv) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(3);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenReturnSalesInvoice = () => {
    if (canAddReturnSalesInv) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(6);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenInward = () => {
    if (canAddInward) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(8);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelOpenDispatch = () => {
    if (canAddDispatch) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(9);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenPurchaseInvoice = () => {
    if (canAddPurchaseInvoice) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(4);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenReturnPurchaseInvoice = () => {
    if (canAddReturnPurchaseInvoice) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(7);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenPurchaseOrder = () => {
    if (canAddPurchaseOrder) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(5);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelOpenProfomaInvoice = () => {
    if (canAddProfomaInvoice) {
      fetchContact(setContactData);
      setIsOrderShow(true);
      setIsOrderShowNum(12);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeShowModelInvoice = () => {
    if (canViewInv) {
      setIsOrderShowNum(3);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");
      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelChangeShowModelInvoiceReturn = () => {
    if (canViewReturnSalesInvoice) {
      setIsOrderShowNum(6);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");
      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelChangeShowModelPurchase = () => {
    if (canViewPurchase) {
      setIsOrderShowNum(4);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");

      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeShowModelReturnPurchase = () => {
    if (canViewReturnPurchaseInvoice) {
      setIsOrderShowNum(7);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");

      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // Helper to extract YouTube Video ID
  const getYouTubeVideoId = (url: string): string => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  };

  const handelChangeShowModelPurchaseOrder = () => {
    if (canViewPurcheshOrder) {
      setIsOrderShowNum(5);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");
      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeShowModelInward = () => {
    if (canViewInward) {
      setIsOrderShowNum(8);
      // setShowListOrder(true);
      rightSideViewProvider("salesView");
      setDropdownOpenCreateOrder(false);
    } else {
      setDropdownOpenCreateOrder(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleChangeMoveMsg = async (msgSide: number) => {
    const requestData = {
      table: "contact_message_histories",
      where: `{"id":"${moveForMsgId}" }`,
      data: `{"message_side":"${msgSide}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          if (msgSide === 1) {
            setIsMoveToMeConfirmation(false);
          } else {
            setIsMoveToClientConfirmation(false);
          }
          fetchMessageData(
            setNoDataFound,
            searchTerm,
            setLoading,
            setMessageList,
            setHasMore,
            currentPage,
            setNoDataFound1,
            getData?.id,
            checkedReminder,
            checkedAttachment,
            selectDate,
            "-1",
            setGetCompanyId,
          );
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  // function openModelClearMsg() {
  //   if (getCompanyId === Number(getUUID)) {
  //     setIsClearConfirmation(true);
  //   } else {
  //     setIsClearConfirmation(false);

  //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //   }
  // }

  function openMailMode() {
    if (canAddMail) {
      setIsEmailConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function openCallHistoryLog() {
    setIsCallHistoryModalOpen(true);
  }
  function openvisit() {
    if (canAddVisit) {
      // setShowVisits(true);
      rightSideViewProvider("visit");
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function openTask() {
    if (canViewTask) {
      rightSideViewProvider("task");
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function openSupportTicket() {
    if (canViewSupport) {
      rightSideViewProvider("supportTicket");
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const handleAttendance = async () => {
    if (canAddAttendance) {
      setLoading(true);
      setTimeout(async () => {
        const nextStatus =
          savedAttendance === 1 ? 2 : savedAttendance === 0 ? 1 : 1;

        await insertAttendance(
          nextStatus,
          setShowAttendancePopup,
          compulsaryAttendance,
        );

        await setSavedAttendance(nextStatus); // db mathi last entry lai ne aave che
        setLoading(false);
      }, 500);

      // toast.success(setSavedAttendance.ack_msg)
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.ACCOUNT_HISTORY
      ) {
        e.preventDefault();
        // setShowListAccountTransaction(true);
        rightSideViewProvider("accountTransaction");
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.QUOTATION_LIST
      ) {
        e.preventDefault();
        setIsOrderShowNum(1);
        setSortkeyCreateQuotation((prev) => prev + 1);
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.SALES_ORDER_LIST
      ) {
        e.preventDefault();
        setIsOrderShowNum(2);
        setSortkeyCreateOrder((prev) => prev + 1);
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.SALES_INVOICE_LIST
      ) {
        e.preventDefault();
        setIsOrderShowNum(3);
        setSortkeyCreateInvoice((prev) => prev + 1);
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.SALES_PURCHASE_LIST
      ) {
        e.preventDefault();
        setIsOrderShowNum(4);
        setSortkeyCreatePurchase((prev) => prev + 1);
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.MAIL
      ) {
        e.preventDefault();
        setIsEmailConfirmation(true);
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.MY_INVOICE_LIST
      ) {
        e.preventDefault();
        // setShowListInquiry(true);
        rightSideViewProvider("inquiryList");
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === SHORT_KEY.MY_TEAM
      ) {
        e.preventDefault();
        showMyCompany();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (sortkeycreateQuotation > 1) {
      handelChangeShowModelQuotation();
    }
  }, [sortkeycreateQuotation]);
  useEffect(() => {
    if (sortkeycreateOrder > 1) {
      handelChangeShowModelOrder();
    }
  }, [sortkeycreateOrder]);
  useEffect(() => {
    if (sortkeycreateInvoice > 1) {
      handelChangeShowModelInvoice();
    }
  }, [sortkeycreateInvoice]);
  useEffect(() => {
    if (sortkeycreatePurchase > 1) {
      handelChangeShowModelPurchase();
    }
  }, [sortkeycreatePurchase]);
  useEffect(() => {
    if (!voice) return;
    const lowerVoice = voice.toLowerCase();
    if (lowerVoice.includes("purchase")) {
      handelChangeShowModelPurchase();
    }
    if (lowerVoice.includes("create contact")) {
      openCreateContact();
    }
    if (
      lowerVoice.includes("reminder") ||
      lowerVoice.includes("open reminder") ||
      lowerVoice.includes("create reminder")
    ) {
      showReminder();
    }
    if (
      lowerVoice.includes("open view insight") ||
      lowerVoice.includes("open view inside") ||
      lowerVoice.includes("open view dashboard")
    ) {
      showDashboard();
    }
    if (
      lowerVoice.includes("open my team") ||
      lowerVoice.includes("open my company")
    ) {
      showMyCompany();
    }
    if (
      lowerVoice.includes("open inquiry list") ||
      lowerVoice.includes("open enquiry list")
    ) {
      showInquiryAllList();
    }
    if (
      lowerVoice.includes("open personal notes") ||
      lowerVoice.includes("open personal note")
    ) {
      showNotes();
    }

    if (lowerVoice.includes("refresh")) {
      window.location.reload();
    }
    if (lowerVoice.includes("close")) {
      closeCreateContact();
    }

    setVoice("");
  }, [voice]);

  // contact chat ma upar je account transaction, inquiry , order list open thay e handle kre che
  const rightSideViewProvider = (refTo: string | undefined) => {
    let accountTransaction = false;
    let InquiryList = false;
    let orderView = false;
    let visit = false;
    let profile = false;
    let task = false;
    let supportTicket = false;

    switch (refTo) {
      case "accountTransaction":
        accountTransaction = true;
        break;
      case "inquiryList":
        InquiryList = true;
        break;
      case "salesView":
        orderView = true;
        break;
      case "salesView":
        orderView = true;
        break;
      case "visit":
        visit = true;
        break;
      case "task":
        task = true;
        break;
      case "supportTicket":
        supportTicket = true;
        break;
      case "profile":
        profile = true;
    }

    setShowListAccountTransaction(accountTransaction);
    setShowListInquiry(InquiryList);
    setShowListOrder(orderView);
    setShowVisits(visit);
    setShowTasks(task);
    setShowTickets(supportTicket);
    setShowProfile(profile);
  };

  const handleModalOpen = (id: number | undefined) => {
    if (canViewLabel) {
      setContactId(id);
      setIsModalVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      // setIsModalFilterVisible(false);
    }
  };
  const handleConfirm = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {
    if (contactId === undefined) return;

    await upateCheckBox(contactId, checkedOptions, setLoading);
    setTimeout(() => {
      setCurrentPage(0);
    }, 100);
    setIsModalVisible(false);
    // setRefreshContact && setRefreshContact(true);
  };

  useEffect(() => {
    if (isModalVisible) {
      fetchLabelApi(setOptions, setLoading);
    }
    if (isModalAssignStatusVisible) {
      fetchStageStatusApi(setOptionRadioButtonStatus, statusAssignStatusId);
    } else {
      setOptionRadioButtonStatus([]);
      setStatusAssignStatusId(0);
    }
    if (isModalAssignUserVisible) {
      fetchAllCompanyApi(setOptionJoinCompany);
      fetchDepartmentsApi(setDepartments);
    }
  }, [isModalVisible, isModalAssignStatusVisible, isModalAssignUserVisible]);

  const handleModalOpenStatusAssign = (
    id: number | undefined,
    contactStatus: number | undefined,
  ) => {
    if (canViewStatus) {
      setStatusAssignContactId(id);
      setStatusAssignStatusId(contactStatus);
      setIsModalAssignStatusVisible(true);
    } else {
      setIsModalAssignStatusVisible(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmRadioButton = async (checkedOptions: any[]) => {
    if (statusAssignContactId === undefined) return;

    await updateStageStatusRadioButton(
      statusAssignContactId,
      checkedOptions,
      setLoading,
    );

    setTimeout(() => {
      setCurrentPage(0);
    }, 100);
    setIsModalAssignStatusVisible(false);
    // setRefreshContact && setRefreshContact(true);
  };

  const handleModalOpenUserAssign = (id: number | undefined) => {
    if (canAddAssignTeamMember) {
      setUserAssignContactId(id);
      setIsModalAssignUserVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmAssignUser = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {
    if (userAssignContactId === undefined) return;

    await updateUserCheckBox(userAssignContactId, checkedOptions, setLoading);
    setTimeout(() => {
      setCurrentPage(0);
    }, 100);
    setIsModalAssignUserVisible(false);
    // setRefreshContact && setRefreshContact(true);
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

  const [taskData, setTaskData] = useState<{
    messageId?: number;
    messageDescription?: string;
    contactId?: number;
    referenceTable?: string;
  }>({});
  const showTaskFromDashbord = () => {
    if (canAddTask) {
      setIsOpenTaskCreateModel(true);
      setTaskData({
        messageId: undefined,
        messageDescription: "",
        contactId: undefined,
        referenceTable: "",
      });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const showTask = (message: TMessage) => {
    if (canAddTask) {
      // Remove HTML tags and decode entities if needed
      let plainTextDescription = message.description
        ? message.description
          .replace(/<br\s*\/?>/gi, "\n") // preserve line breaks
          .replace(/<[^>]+>/g, "") // remove all tags
          .replace(/&nbsp;/gi, " ") // decode non-breaking space
          .replace(/&amp;/gi, "&") // decode ampersand
          .trim()
        : "";

      setIsOpenTaskCreateModel(true);
      setTaskData({
        messageId: message.id,
        messageDescription: plainTextDescription,
        contactId: getData?.id,
        referenceTable: "contact_message_histories",
      });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // const openPinModal = (id: number, contactUsMsgPinId: number | undefined) => {
  //   if (canView) {
  //     setContactId(contactUsMsgPinId);
  //     setmessageId(id);
  //     setPinConfirmation({ show: true, type: "pin" });
  //   } else {
  //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //   }
  // };

  const openPinModal = (
    id: number,
    contactUsMsgPinId: number | undefined,
    description: string,
  ) => {
    if (canView) {
      setContactId(contactUsMsgPinId);
      setmessageId(id);
      setPinnedMessageContent(description); // ⭐ save pinned message
      setPinConfirmation({ show: true, type: "pin" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleOpenWhatsapp = () => {
    const whatsappWindow = window.open("https://wa.smalloffice.in/", "_blank");
  };

  const openUnPinModal = (
    id: number,
    contactUsMsgPinId: number | undefined,
  ) => {
    if (canView) {
      setContactId(contactUsMsgPinId);
      setmessageId(id);
      setPinConfirmation({ show: true, type: "unpin" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handlePinContact = async () => {
    if (!contactId) return;

    let request_flag = pinConfirmation.type === "pin" ? 1 : 2;

    const success = await pinUnpinContactApi(
      contactId,
      messageId,
      request_flag,
    );

    if (success) {
      if (request_flag === 2) {
        setPinnedMessageContent("");
      }

      setPinConfirmation({ show: false, type: null });
    }
  };

  const openViewSupportTicket = () => {
    const getUUID = localStorage.getItem("UUID");
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/customer-support/`;
    const myWindow = window.open(supportURL, "_blank");
  };

  const labelColor = getData?.label_color
    ? getData?.label_color.split(",")
    : [];

  const statusColor = getData?.stage_status_color
    ? getData?.stage_status_color.split(",")
    : [];

  const labelNames = getData?.label_name ? getData?.label_name.split(",") : [];
  const statusName = getData?.stage_status_name
    ? getData?.stage_status_name.split(",")
    : [];

  return (
    <>
      {isTaskRightSideopen == false && (
        <div
          className="Right-Container"
          style={{ flex: "70%", display: "flex" }}
        >
          {isDashBoardOpen ? (
            <DashboardView
              isDashBoardOpen={isDashBoardOpen}
              closeDashboard={closeDashboard}
              companyInfo={companyLists}
              contactData={getData}
            />
          ) : (
            <>
              {isAiModelopen ? (
                <AiModelView
                  isAiModelopen={isAiModelopen}
                  closeisAiModel={closeisAiModel}
                />
              ) : isCreateContact1 && showRightSide ? (
                <>
                  {selectedContactTask ? (
                    <TaskChatRightSide
                      showTaskChat={() => {}}
                      onHideTaskChat={() => setSelectedContactTask(null)}
                      signleDataTask={selectedContactTask}
                      setRefreshTask={() => setRefreshProduct(true)}
                      closeDashboard={() => setSelectedContactTask(null)}
                      openTaskRight={(task) => setSelectedContactTask(task)}
                      supportTicketFlag={showTickets ? 1 : 0}
                      isInsideRightView={true}
                    />
                  ) : (
                    <>
                      <div
                        className="rightSide"
                        style={{ display: "flex" }}
                        id="rightSide"
                      >
                        <div className="header">
                          <div
                            className="imgText"
                            role="button"
                            onClick={openChatAbout}
                          >
                            {/* <div
                        className="imgBox"
                        style={{ backgroundColor: "#CFCFCF" }}
                      >
                        <div
                          className="text-uppercase "
                          style={{ paddingTop: "12px" }}
                        >
                          {getData &&
                            (getData?.person_name?.[0] || "") +
                              (getData?.person_name?.[1] || "")}
                        </div>
                      </div> */}

                            <h4
                              style={{
                                wordBreak: "break-word",
                                maxWidth: "230px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                paddingLeft: "10px",
                                margin: "0px",
                              }}
                              title={
                                getData?.person_name
                                  ? `${getData?.company_name} ${getData?.company_name && "-"
                                  } ${getData?.person_name}`
                                  : `${getData?.person_name}`
                              }
                              aria-label={
                                getData?.person_name
                                  ? `${getData?.company_name} ${getData?.company_name && "-"
                                  } ${getData?.person_name}`
                                  : `${getData?.person_name}`
                              }
                            >
                              {getData?.company_name} {getData?.company_name && "-"}{" "}
                              {getData?.person_name}
                              <br />
                              <span className="thanks">
                                {getData?.mobile_number}
                                {getData?.city_name ? "," : ""}
                                {getData?.city_name}
                                {getData?.area_name ? "," : ""}
                                {getData?.area_name}
                              </span>
                            </h4>
                          </div>

                          <div className="d-flex">
                            {getData?.latitude != "" &&
                              getData?.latitude != undefined &&
                              getData?.latitude != null &&
                              getData?.longitude != "" &&
                              getData?.longitude != undefined &&
                              getData?.longitude != null && (
                                <>
                                  {" "}
                                  <a
                                    href={`https://www.google.com/maps/dir//${getData?.latitude},${getData?.longitude}/`}
                                    target="_blank"
                                  >
                                    <button
                                      className="icons mx-1"
                                      style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                      }}
                                    >
                                      <span
                                        title="Map"
                                        style={{ fontSize: "20px" }}
                                      >
                                        <svg
                                          height="26px"
                                          viewBox="0 -960 960 960"
                                          width="26px"
                                          fill="currentColor"
                                        >
                                          <path
                                            xmlns="http://www.w3.org/2000/svg"
                                            d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"
                                          />
                                        </svg>
                                      </span>
                                    </button>
                                  </a>
                                </>
                              )}

                            <button
                              className="icons mx-2"
                              onClick={openCallHistoryLog}
                            >
                              <span title="Open Contact Log">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path d="M640-120q-33 0-56.5-23.5T560-200v-160q0-33 23.5-56.5T640-440h160q33 0 56.5 23.5T880-360v160q0 33-23.5 56.5T800-120H640Zm0-80h160v-160H640v160ZM80-240v-80h360v80H80Zm560-280q-33 0-56.5-23.5T560-600v-160q0-33 23.5-56.5T640-840h160q33 0 56.5 23.5T880-760v160q0 33-23.5 56.5T800-520H640Zm0-80h160v-160H640v160ZM80-640v-80h360v80H80Zm640 360Zm0-400Z" />
                                </svg>
                              </span>
                            </button>
                            <a
                              href={`https://api.whatsapp.com/send?phone=91${getData?.mobile_number}`}
                              target="_blank"
                            >
                              <button className="icons mx-1">
                                <span title="Whatsapp">
                                  <i
                                    className="bi bi-whatsapp"
                                    style={{ fontSize: "20px" }}
                                  ></i>
                                </span>
                              </button>
                            </a>
                            <button className="icons mx-1" onClick={openTask}>
                              <span title="Tasks">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                                </svg>
                              </span>
                            </button>
                            <button
                              className="icons mx-1"
                              onClick={openSupportTicket}
                            >
                              <span title="Support Ticket">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path d="M440-120v-80h320v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v244h-40q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H440Zm-80-280q-17 0-28.5-11.5T320-440q0-17 11.5-28.5T360-480q17 0 28.5 11.5T400-440q0 17-11.5 28.5T360-400Zm240 0q-17 0-28.5-11.5T560-440q0-17 11.5-28.5T600-480q17 0 28.5 11.5T640-440q0 17-11.5 28.5T600-400Zm-359-62q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z" />
                                </svg>
                              </span>
                            </button>
                            <button className="icons mx-1" onClick={openvisit}>
                              <span title="Visits">
                                <svg
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path
                                    xmlns="http://www.w3.org/2000/svg"
                                    d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"
                                  />
                                </svg>
                              </span>
                            </button>

                            <button
                              className="icons "
                              onClick={toggleDropdownCreate}
                              ref={dropdownCreateOrderRef}
                            >
                              <span title="Order List">
                                <svg
                                  viewBox="0 0 1024 1024"
                                  version="1.1"
                                  width="24px"
                                  height="24px"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M619.085 285.768H400.596c-22.056 0-40-17.944-40-40v-81.995c0-22.056 17.944-40 40-40h218.488c22.056 0 40 17.944 40 40v81.995c0.001 22.056-17.944 40-39.999 40z m-198.489-60h178.488v-41.995H420.596v41.995z" />
                                  <path d="M773.485 900.228h-522.97c-38.599 0-70-31.401-70-70V257.267c0-38.598 31.401-70 70-70h41.486c16.568 0 30 13.431 30 30 0 16.568-13.432 30-30 30h-41.486c-5.514 0-10 4.486-10 10v572.961c0 5.514 4.486 10 10 10h522.97c5.514 0 10-4.486 10-10V257.267c0-5.514-4.486-10-10-10h-45.806c-16.568 0-30-13.432-30-30 0-16.569 13.432-30 30-30h45.806c38.598 0 70 31.402 70 70v572.961c0 38.598-31.402 70-70 70z" />
                                  <path d="M660.515 442.511h-297.03c-16.568 0-30-13.432-30-30s13.432-30 30-30h297.03c16.568 0 30 13.432 30 30s-13.431 30-30 30zM563.485 592.031h-200c-16.568 0-30-13.432-30-30s13.432-30 30-30h200c16.568 0 30 13.432 30 30s-13.432 30-30 30zM563.485 741.552h-200c-16.568 0-30-13.432-30-30s13.432-30 30-30h200c16.568 0 30 13.432 30 30s-13.432 30-30 30z" />
                                </svg>
                              </span>
                              <div className="dropdown-icon">
                                <ul
                                  className={`drop-order ${dropdownOpenCreateOrder
                                    ? "isVisible"
                                    : "isHidden"
                                    }`}
                                  style={{
                                    maxWidth: "250px",
                                    minWidth: "200px",
                                  }}
                                >
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelChangeShowModelQuotation}
                                  >
                                    {companyLists[0]?.quotation_title
                                      ? companyLists[0]?.quotation_title
                                      : "Quotation"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelChangeShowModelProformaINV}
                                  >
                                    {companyLists[0]?.proforma_invoice_title
                                      ? companyLists[0]?.proforma_invoice_title
                                      : "Proforma Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelChangeShowModelOrder}
                                  >
                                    {companyLists[0]?.order_title
                                      ? companyLists[0]?.order_title
                                      : "Sales Order"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelChangeShowModelDispatch}
                                  >
                                    {companyLists[0]?.dispatch_title
                                      ? companyLists[0]?.dispatch_title
                                      : "Dispatch"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelChangeShowModelInvoice}
                                  >
                                    {companyLists[0]?.invoice_title
                                      ? companyLists[0]?.invoice_title
                                      : "Sales Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelChangeShowModelInvoiceReturn}
                                  >
                                    {companyLists[0]?.return_sales_invoice_title
                                      ? companyLists[0]?.return_sales_invoice_title
                                      : "Sales Return Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelChangeShowModelPurchaseOrder}
                                  >
                                    {companyLists[0]?.purchase_order_title
                                      ? companyLists[0]?.purchase_order_title
                                      : "Purchase Order"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelChangeShowModelInward}
                                  >
                                    {companyLists[0]?.inward_title
                                      ? companyLists[0]?.inward_title
                                      : "Goods Received Note"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelChangeShowModelPurchase}
                                  >
                                    {companyLists[0]?.purchase_title
                                      ? companyLists[0]?.purchase_title
                                      : "Purchase Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelChangeShowModelReturnPurchase}
                                  >
                                    {companyLists[0]?.return_purchase_invoice_title
                                      ? companyLists[0]
                                        ?.return_purchase_invoice_title
                                      : "Return Purchase Invoice"}
                                  </li>
                                </ul>
                              </div>
                            </button>
                            <button className="icons mx-2" onClick={openMailMode}>
                              <span title="Send Mail">
                                <svg
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" />
                                </svg>
                              </span>
                            </button>
                            <button
                              className="icons"
                              onClick={() =>
                                canViewInq
                                  ? rightSideViewProvider("inquiryList")
                                  : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                              }
                            >
                              <span title="Your Inquiry List">
                                <svg
                                  height="26px"
                                  viewBox="0 -960 960 960"
                                  width="26px"
                                  fill="currentColor"
                                >
                                  <path d="M640-400q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM400-160v-76q0-21 10-40t28-30q45-27 95.5-40.5T640-360q56 0 106.5 13.5T842-306q18 11 28 30t10 40v76H400Zm86-80h308q-35-20-74-30t-80-10q-41 0-80 10t-74 30Zm154-240q17 0 28.5-11.5T680-520q0-17-11.5-28.5T640-560q-17 0-28.5 11.5T600-520q0 17 11.5 28.5T640-480Zm0-40Zm0 280ZM120-400v-80h320v80H120Zm0-320v-80h480v80H120Zm324 160H120v-80h360q-14 17-22.5 37T444-560Z" />
                                </svg>
                              </span>
                            </button>
                            <button
                              className="icons"
                              onClick={() =>
                                canViewAccHis
                                  ? rightSideViewProvider("accountTransaction")
                                  : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                              }
                            >
                              <span title="Your Account Transaction List">
                                <svg
                                  height="22px"
                                  viewBox="0 -960 960 960"
                                  width="22px"
                                  fill="currentColor"
                                >
                                  <path d="M200-280v-280h80v280h-80Zm240 0v-280h80v280h-80ZM80-120v-80h800v80H80Zm600-160v-280h80v280h-80ZM80-640v-80l400-200 400 200v80H80Zm178-80h444-444Zm0 0h444L480-830 258-720Z" />
                                </svg>
                              </span>
                            </button>
                            <button
                              className="icons pP"
                              onClick={handelRefreshMessages}
                              title="Refresh"
                            >
                              <svg width="28" height="28" viewBox="0 0 50 50">
                                <path
                                  fill="currentColor"
                                  d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M18 24h-2v-6h-6v-2h8z"
                                />
                                <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                              </svg>
                            </button>
                            <div className="chat-side">
                              <button
                                className="icons pP"
                                onClick={openSearch}
                                title="Search"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  width="24"
                                  height="24"
                                  className=""
                                >
                                  <path
                                    fill="currentColor"
                                    d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                                  ></path>
                                </svg>
                              </button>

                              <div className="dropdown-icon">
                                <button
                                  className="pressed icons pP"
                                  id="dropDown"
                                  onClick={toggleDropdown}
                                  ref={dropdownRef}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="24"
                                    height="24"
                                    className=""
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                    ></path>
                                  </svg>
                                </button>
                                <ul
                                  className={`drop ${dropdownOpen ? "isVisible" : "isHidden"
                                    }`}
                                  id="drop"
                                >
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={openChatAbout}
                                  >
                                    Contact info
                                  </li>

                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={contact_statistics}
                                    id="closeChat"
                                  >
                                    Statistics
                                  </li>

                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={() => handleModalOpen(getData?.id)}
                                  >
                                    Assign Label
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={() =>
                                      handleModalOpenStatusAssign(
                                        getData?.id,
                                        getData?.contact_status,
                                      )
                                    }
                                  >
                                    Assign Status
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={() =>
                                      handleModalOpenUserAssign(getData?.id)
                                    }
                                  >
                                    Assign Team Member
                                  </li>
                                  <li
                                    className="listItem"
                                    style={{ color: "red", fontWeight: "bold" }}
                                    role="button"
                                    onClick={() => closeChat()}
                                    id="closeChat"
                                  >
                                    Close chat
                                  </li>
                                  {/* {getCompanyId === Number(getUUID) ? (
                              <li
                                className="listItem"
                                role="button"
                                data-bs-toggle="modal"
                                data-bs-target="#clear-modal"
                                onClick={openModelClearMsg}
                              >
                                Clear messages
                              </li>
                            ) : (
                              <span></span>
                            )} */}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="contact-details"
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            paddingLeft: "10px",
                            marginTop: "4px",
                            fontSize: "14px",
                          }}
                        >
                          <span>
                            <div
                              className="text-inner"
                              style={{
                                borderRadius: "999px",
                                backgroundColor: "#FFFFFF",
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ marginRight: "5px" }}>Source</span>
                              <div
                                style={{
                                  backgroundColor:
                                    getData?.source_name_color || "#eeeeee",
                                  padding: "5px 10px",
                                  borderRadius: "12px",
                                  margin: "2px",
                                  display: "inline-block",
                                }}
                                className="badge rounded-pill"
                              >
                                {getData?.source_name}
                              </div>
                            </div>
                          </span>

                          <span>
                            <div
                              className="text-inner"
                              style={{
                                borderRadius: "999px",
                                backgroundColor: "#FFFFFF",
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ marginRight: "5px" }}>Label</span>
                              {labelNames.map((name, index) => (
                                <div
                                  key={index}
                                  style={{
                                    backgroundColor: labelColor[index] || "#eeeeee",
                                    padding: "5px 10px",
                                    borderRadius: "12px",
                                    margin: "2px",
                                    display: "inline-block",
                                  }}
                                  className="badge rounded-pill"
                                >
                                  {name}
                                </div>
                              ))}
                            </div>
                          </span>

                          <span>
                            <div
                              className="text-inner"
                              style={{
                                borderRadius: "999px",
                                backgroundColor: "#FFFFFF",
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ marginRight: "5px" }}>Status</span>
                              {statusName.map((name, index) => (
                                <div
                                  key={index}
                                  style={{
                                    backgroundColor:
                                      statusColor[index] || "#eeeeee",
                                    padding: "5px 10px",
                                    borderRadius: "12px",
                                    margin: "2px",
                                    display: "inline-block",
                                  }}
                                  className="badge rounded-pill"
                                >
                                  {name}
                                </div>
                              ))}
                            </div>
                          </span>
                        </div>
                        {searchOpen && (
                          <div className="header-search" style={{ zIndex: "1" }}>
                            <div className="search-bar" style={{ width: "40%" }}>
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
                                  title="Search or start new chat"
                                  aria-label="Search or start new chat"
                                  placeholder="Search message"
                                  maxLength={BIG_TEXT_LENGTH}
                                  value={searchTerm}
                                  onChange={handleSearchChange}
                                  className="search-message-input"
                                />
                              </div>
                            </div>
                            <div
                              className="d-flex align-items-center justify-content-between "
                              style={{ width: "55%" }}
                            >
                              <div className="">
                                <input
                                  className="custom-checkbox"
                                  type="checkbox"
                                  checked={checkedReminder}
                                  onChange={(e) =>
                                    setCheckedReminder(e.target.checked)
                                  }
                                />

                                <label className="p-2  header-search-front">
                                  Reminders
                                </label>
                              </div>
                              <div>
                                <input
                                  className="custom-checkbox"
                                  type="checkbox"
                                  onChange={(e) =>
                                    setCheckedAttachment(e.target.checked)
                                  }
                                />
                                <label className="p-2 header-search-front">
                                  Attachment
                                </label>
                              </div>
                              <div>
                                <DateTimeRangePicker
                                  value={selectDate}
                                  onChange={handelSearchDateChange}
                                  showTime={false}
                                  numberOfMonthsShow={1}
                                />
                                <span className="p-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="22px"
                                    viewBox="0 -960 960 960"
                                    width="22px"
                                    fill="#5f6368"
                                  >
                                    <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
                                  </svg>
                                </span>
                              </div>

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
                        )}
                        {pinnedMessageContent && (
                          <PinnedMessageShow
                            htmlContent={whatsappToHtml(pinnedMessageContent)}
                          />
                        )}

                        <div
                          className="chatBox"
                          ref={containerRef}
                          onScroll={handleScroll}
                        >
                          {loading ? (
                            <div className="d-flex justify-content-center h-50">
                              <div
                                className="spinner-border text-secondary "
                                role="status"
                              ></div>
                            </div>
                          ) : (
                            <>
                              {searchTerm && noDataFound && (
                                <div className="d-flex justify-content-center h-75 ">
                                  <p className="no_found">No data found</p>
                                </div>
                              )}
                              {messageList &&
                                [...messageList].reverse().map((group, index) => (
                                  <div>
                                    <div className="chat__date-wrapper" key={index}>
                                      <span className="chat__date">
                                        {group.date
                                          ? new Date(group.date)
                                            .toLocaleDateString("en-GB", {
                                              weekday: "long",
                                              year: "numeric",
                                              month: "2-digit",
                                              day: "2-digit",
                                            })
                                            .replace(/\//g, "-")
                                          : ""}
                                      </span>
                                    </div>
                                    {group &&
                                      group.messages.map((message, index1) => {
                                        const extension = getFileExtension(
                                          message.media_name,
                                        );
                                        const icon = getIconForExtension(extension);
                                        return (
                                          <div key={index1}>
                                            <>
                                              {message.message_side === 2 && (
                                                <>
                                                  {message.isDelete === 1 ? (
                                                    <p className="chatMessageDelete my-chat-delete tooltip-wrapper2">
                                                      Deleted By --
                                                      {message.deleted_by}
                                                      {companyLists?.some(
                                                        (item) =>
                                                          item.company_flag === 1,
                                                      ) && (
                                                          <span className="tooltip-content">
                                                            <SafeHtml
                                                              htmlContent={whatsappToHtml(
                                                                message.description,
                                                              )}
                                                            />
                                                          </span>
                                                        )}
                                                    </p>
                                                  ) : (
                                                    <>
                                                      <div
                                                        className="chatMessage frnd-chat"
                                                        style={{
                                                          maxWidth: "80%",
                                                          flexDirection: "column",
                                                          wordWrap: "break-word",
                                                          overflowWrap: "anywhere",
                                                          // whiteSpace: "pre-wrap",
                                                        }}
                                                      >
                                                        <div
                                                          style={{
                                                            display: "flex",
                                                            justifyContent: "end",
                                                            paddingRight: "10px",
                                                          }}
                                                        >
                                                          <span className="chat__msg-filler2">
                                                            {message.is_reminder ? (
                                                              <span
                                                                role="button"
                                                                onClick={() =>
                                                                  handleChangeStatusOfReminderLeft(
                                                                    message,
                                                                  )
                                                                }
                                                              >
                                                                <svg
                                                                  height="16px"
                                                                  viewBox="0 -960 960 960"
                                                                  width="16 px"
                                                                  className=""
                                                                  fill="currentColor"
                                                                >
                                                                  <path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" />
                                                                </svg>
                                                              </span>
                                                            ) : (
                                                              "  "
                                                            )}
                                                          </span>
                                                          <span className="chat__msg-filler2">
                                                            {message.entry_flag ===
                                                              1 && (
                                                                <span role="button">
                                                                  <img
                                                                    src={whatsappIcon}
                                                                    width={20}
                                                                    alt=""
                                                                  />
                                                                </span>
                                                              )}
                                                          </span>
                                                        </div>
                                                        <div
                                                          style={{
                                                            width: "20rem",
                                                          }}
                                                        >
                                                          <span>
                                                            <SafeHtml
                                                              htmlContent={whatsappToHtml(
                                                                message.description,
                                                              )}
                                                            />
                                                          </span>
                                                          {extension === "png" ||
                                                            extension === "jpg" ||
                                                            extension === "jpeg" ? (
                                                            <span
                                                              onClick={() =>
                                                                handleChangeImgViewer(
                                                                  message,
                                                                )
                                                              }
                                                              style={{
                                                                cursor: "pointer",
                                                              }}
                                                            >
                                                              <span
                                                                className="d-flex justify-content-center"
                                                                style={{
                                                                  maxHeight: "30vh",
                                                                }}
                                                              >
                                                                <img
                                                                  src={`${message.media_url}`}
                                                                  alt="Avatar"
                                                                  className="align-text-top w-100"
                                                                />
                                                              </span>
                                                            </span>
                                                          ) : extension === "ogg" ||
                                                            extension === "wav" ||
                                                            extension === "mp3" ? (
                                                            <audio
                                                              controls
                                                              src={`${message.media_url}`}
                                                            ></audio>
                                                          ) : (
                                                            <span
                                                              onClick={() =>
                                                                message
                                                              }
                                                              style={{
                                                                cursor: "pointer",
                                                                paddingRight: "6px",
                                                              }}
                                                            >
                                                              {icon && (
                                                                <img
                                                                  src={icon}
                                                                  alt={`${extension} icon`}
                                                                  style={{
                                                                    width: 30,
                                                                    verticalAlign:
                                                                      "text-top",
                                                                  }}
                                                                />
                                                              )}
                                                              <span>
                                                                {message.media_name}
                                                              </span>
                                                              {extension && (
                                                                <span className="px-3">
                                                                  <svg
                                                                    viewBox="0 -960 960 960"
                                                                    width="20px"
                                                                    fill="#5f6368"
                                                                  >
                                                                    <path d="M280-280h400v-80H280v80Zm200-120 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160Zm0 320q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                                                                  </svg>
                                                                </span>
                                                              )}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <span className="chat__msg-filler"></span>
                                                        <span className="status1">
                                                          <span>
                                                            {message.created_date_time
                                                              ? formatTimeToAmPm(
                                                                message.created_date_time,
                                                              )
                                                              : ""}
                                                          </span>
                                                        </span>

                                                        <span className="status1 ">
                                                          <span>
                                                            <i>
                                                              {message.entry_flag ===
                                                                1 ? (
                                                                <>
                                                                  {
                                                                    message.application_login_name
                                                                  }
                                                                </>
                                                              ) : (
                                                                <>
                                                                  {
                                                                    message.application_login_name
                                                                  }
                                                                </>
                                                              )}
                                                            </i>
                                                          </span>
                                                        </span>
                                                        <div>
                                                          <ul
                                                            className={`${filteredItemIds.includes(
                                                              message.id,
                                                            )
                                                              ? "drop_msg1"
                                                              : "drop_msg_left"
                                                              } 
                                                          ${dropdownOpenMsgLeft ===
                                                                message.id
                                                                ? "isVisible"
                                                                : "isHidden"
                                                              }`}
                                                            ref={(el) =>
                                                            (dropdownRefLeftMsg.current[
                                                              message.id
                                                            ] = el)
                                                            }
                                                          >
                                                            {/* {message.message_type_id ===
                                                          0 ? (
                                                          <li
                                                            className="drop_listItem"
                                                            role="button"
                                                            onClick={() =>
                                                              handleChangeEdit(
                                                                message
                                                              )
                                                            }
                                                          >
                                                            Edit
                                                          </li>
                                                        ) : (
                                                          <span></span>
                                                        )} */}
                                                            <li
                                                              style={{
                                                                color: "red",
                                                                fontWeight: "bold",
                                                              }}
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                handelChangeDeleteRight(
                                                                  message.id,
                                                                )
                                                              }
                                                            >
                                                              Delete
                                                            </li>

                                                            {!message.is_reminder &&
                                                              (message.message_type_id ===
                                                                0 ||
                                                                message.message_type_id ===
                                                                2 ||
                                                                message.message_type_id ===
                                                                1) ? (
                                                              <li
                                                                className="drop_listItem"
                                                                role="button"
                                                                onClick={() =>
                                                                  toggleReminder(
                                                                    message.id,
                                                                  )
                                                                }
                                                              >
                                                                Reminders
                                                              </li>
                                                            ) : (
                                                              <span></span>
                                                            )}
                                                            <li
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                showTaskFromDashbord()
                                                              }
                                                            >
                                                              Add Task
                                                            </li>
                                                            <li
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                toggleMoveToMe(
                                                                  message.id,
                                                                )
                                                              }
                                                            >
                                                              Move to Me
                                                            </li>
                                                            {message.id ==
                                                              getData?.pinned_message ? (
                                                              <li
                                                                className="drop_listItem"
                                                                role="button"
                                                                onClick={() =>
                                                                  openUnPinModal(
                                                                    message.id,
                                                                    message.contact_masters_id,
                                                                  )
                                                                }
                                                              >
                                                                UnPin
                                                              </li>
                                                            ) : (
                                                              <li
                                                                className="drop_listItem"
                                                                role="button"
                                                                onClick={() =>
                                                                  openPinModal(
                                                                    message.id,
                                                                    message.contact_masters_id,
                                                                    message.description,
                                                                  )
                                                                }
                                                              >
                                                                Pin
                                                              </li>
                                                            )}
                                                          </ul>
                                                        </div>
                                                        <button
                                                          aria-label="Message options"
                                                          className="chat__msg-options"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDropdownMsgLeft(
                                                              message.id,
                                                            );
                                                          }}
                                                        >
                                                          <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 19 20"
                                                            width="19"
                                                            height="20"
                                                            className="chat__msg-options-icon"
                                                          >
                                                            <path
                                                              fill="currentColor"
                                                              d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                                            ></path>
                                                          </svg>
                                                        </button>
                                                      </div>
                                                    </>
                                                  )}
                                                </>
                                              )}
                                              {message.message_side === 1 && (
                                                <>
                                                  {message.isDelete === 1 ? (
                                                    <p className="chatMessageDelete my-chat-delete tooltip-wrapper">
                                                      Deleted By --
                                                      {message.deleted_by}
                                                      {companyLists?.some(
                                                        (item) =>
                                                          item.company_flag === 1,
                                                      ) && (
                                                          <span className="tooltip-content">
                                                            <SafeHtml
                                                              htmlContent={whatsappToHtml(
                                                                message.description,
                                                              )}
                                                            />
                                                          </span>
                                                        )}
                                                    </p>
                                                  ) : (
                                                    <div
                                                      className="chatMessage my-chat"
                                                      style={{
                                                        maxWidth: "80%",
                                                        width: "300px",
                                                        flexDirection: "column",
                                                        paddingRight: "30px",
                                                        wordBreak: "break-word",
                                                        overflowWrap: "anywhere",
                                                      }}
                                                    >
                                                      <div
                                                        style={{
                                                          display: "flex",
                                                          justifyContent: "end",
                                                          paddingRight: "10px",
                                                        }}
                                                      >
                                                        <span className="chat__msg-filler2">
                                                          {message.is_reminder ? (
                                                            <span
                                                              role="button"
                                                              onClick={() =>
                                                                handleChangeStatusOfReminder1(
                                                                  message,
                                                                )
                                                              }
                                                            >
                                                              <svg
                                                                height="16px"
                                                                viewBox="0 -960 960 960"
                                                                width="16 px"
                                                                className=""
                                                                fill="currentColor"
                                                              >
                                                                <path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" />
                                                              </svg>
                                                            </span>
                                                          ) : (
                                                            "  "
                                                          )}
                                                          {message.entry_flag ===
                                                            1 && (
                                                              <span role="button">
                                                                <img
                                                                  src={whatsappIcon}
                                                                  width={20}
                                                                  alt=""
                                                                />
                                                              </span>
                                                            )}
                                                          {message.entry_flag ===
                                                            2 && (
                                                              <span role="button">
                                                                <svg
                                                                  xmlns="http://www.w3.org/2000/svg"
                                                                  height="20px"
                                                                  viewBox="0 -960 960 960"
                                                                  width="20px"
                                                                  fill="#5f6368"
                                                                >
                                                                  <path d="M480-440 160-640v400h360v80H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v280h-80v-200L480-440Zm0-80 320-200H160l320 200ZM760-40l-56-56 63-64H600v-80h167l-64-64 57-56 160 160L760-40ZM160-640v440-240 3-283 80Z" />
                                                                </svg>
                                                              </span>
                                                            )}
                                                        </span>
                                                      </div>
                                                      <span>
                                                        {message.message_type_id ===
                                                          1 ? (
                                                          <></>
                                                        ) : (
                                                          ""
                                                        )}
                                                      </span>

                                                      <span>
                                                        <SafeHtml
                                                          htmlContent={whatsappToHtml(
                                                            message.description,
                                                          )}
                                                        />
                                                      </span>

                                                      {extension === "png" ||
                                                        extension === "jpg" ||
                                                        extension === "jpeg" ? (
                                                        <span
                                                          onClick={() =>
                                                            handleChangeImgViewer(
                                                              message,
                                                            )
                                                          }
                                                          style={{
                                                            cursor: "pointer",
                                                            // paddingRight: "6px",
                                                          }}
                                                        >
                                                          <span
                                                            className="d-flex justify-content-center"
                                                            style={{
                                                              maxHeight: "30vh",
                                                            }}
                                                          >
                                                            <img
                                                              src={`${message.media_url}`}
                                                              alt="Avatar"
                                                              className="align-text-top w-100"
                                                            />
                                                          </span>
                                                        </span>
                                                      ) : extension === "ogg" ||
                                                        extension === "wav" ||
                                                        extension === "mp3" ? (
                                                        <audio
                                                          controls
                                                          src={`${message.media_url}`}
                                                        ></audio>
                                                      ) : (
                                                        <span
                                                          onClick={() =>
                                                            handleDownload(message)
                                                          }
                                                          style={{
                                                            cursor: "pointer",
                                                            paddingRight: "6px",
                                                          }}
                                                        >
                                                          {icon && (
                                                            <img
                                                              src={icon}
                                                              alt={`${extension} icon`}
                                                              style={{
                                                                width: 30,
                                                                verticalAlign:
                                                                  "text-top",
                                                              }}
                                                            />
                                                          )}
                                                          <span>
                                                            {message.media_name}
                                                          </span>
                                                          {extension && (
                                                            <span className="px-3">
                                                              <svg
                                                                viewBox="0 -960 960 960"
                                                                width="20px"
                                                                fill="#5f6368"
                                                              >
                                                                <path d="M280-280h400v-80H280v80Zm200-120 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160Zm0 320q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                                                              </svg>
                                                            </span>
                                                          )}
                                                        </span>
                                                      )}
                                                      {/* <span>{messag}</span> */}
                                                      <span className="chat__msg-filler"></span>

                                                      <span className="status1">
                                                        <span>
                                                          {message.created_date_time
                                                            ? formatTimeToAmPm(
                                                              message.created_date_time,
                                                            )
                                                            : ""}
                                                        </span>
                                                      </span>
                                                      <span className="status1">
                                                        <span className="">
                                                          <i>
                                                            {
                                                              message.application_login_name
                                                            }
                                                          </i>
                                                        </span>
                                                      </span>
                                                      <div>
                                                        <ul
                                                          className={`${filteredItemIds.includes(
                                                            message.id,
                                                          )
                                                            ? "drop_msg1"
                                                            : "drop_msg"
                                                            } 
                                                      ${dropdownOpenMsg ===
                                                              message.id
                                                              ? "isVisible"
                                                              : "isHidden"
                                                            }`}
                                                          ref={(el) =>
                                                          (dropdownRefRightMsg.current[
                                                            message.id
                                                          ] = el)
                                                          }
                                                        >
                                                          {message.message_type_id ===
                                                            0 ? (
                                                            <li
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                handleChangeEdit(
                                                                  message,
                                                                )
                                                              }
                                                            >
                                                              Edit
                                                            </li>
                                                          ) : (
                                                            <span></span>
                                                          )}
                                                          <li
                                                            style={{
                                                              color: "red",
                                                              fontWeight: "bold",
                                                            }}
                                                            className="drop_listItem"
                                                            role="button"
                                                            onClick={() =>
                                                              handelChangeDeleteRight(
                                                                message.id,
                                                              )
                                                            }
                                                          >
                                                            Delete
                                                          </li>

                                                          {!message.is_reminder &&
                                                            (message.message_type_id ===
                                                              0 ||
                                                              message.message_type_id ===
                                                              2 ||
                                                              message.message_type_id ===
                                                              1) ? (
                                                            <li
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                toggleReminder(
                                                                  message.id,
                                                                )
                                                              }
                                                            >
                                                              Reminders
                                                            </li>
                                                          ) : (
                                                            <span></span>
                                                          )}
                                                          <li
                                                            className="drop_listItem"
                                                            role="button"
                                                            onClick={() =>
                                                              showTask(message)
                                                            }
                                                          >
                                                            Add Task
                                                          </li>
                                                          <li
                                                            className="drop_listItem"
                                                            role="button"
                                                            onClick={() =>
                                                              toggleMoveToClient(
                                                                message.id,
                                                              )
                                                            }
                                                          >
                                                            Move to Client
                                                          </li>

                                                          {message.id ==
                                                            getData?.pinned_message ? (
                                                            <li
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                openUnPinModal(
                                                                  message.id,
                                                                  message.contact_masters_id,
                                                                )
                                                              }
                                                            >
                                                              UnPin
                                                            </li>
                                                          ) : (
                                                            <li
                                                              className="drop_listItem"
                                                              role="button"
                                                              onClick={() =>
                                                                openPinModal(
                                                                  message.id,
                                                                  message.contact_masters_id,
                                                                  message.description,
                                                                )
                                                              }
                                                            >
                                                              Pin
                                                            </li>
                                                          )}
                                                        </ul>
                                                      </div>
                                                      <button
                                                        id="dropDown2"
                                                        className="chat__msg-options"
                                                        onClick={(e) => {
                                                          e.stopPropagation(); // 👈 Prevents outside click handler
                                                          toggleDropdownMsg(
                                                            message.id,
                                                          );
                                                        }}
                                                      >
                                                        <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          viewBox="0 0 19 20"
                                                          width="19"
                                                          height="20"
                                                          className="chat__msg-options-icon"
                                                        >
                                                          <path
                                                            fill="currentColor"
                                                            d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                                          ></path>
                                                        </svg>
                                                      </button>
                                                    </div>
                                                  )}
                                                </>
                                              )}
                                            </>
                                          </div>
                                        );
                                      })}
                                  </div>
                                ))}
                              {/* )
                        )} */}

                              <div className="text-center">
                                {hasMore ? (
                                  <p
                                    className="no_found"
                                    style={{ marginTop: "0px" }}
                                  >
                                    No data found
                                  </p>
                                ) : (
                                  <button
                                    onClick={handleLoadMore}
                                    className="btn  text-light   rounded-5   fw_500"
                                    style={{ backgroundColor: "#f58634" }}
                                  >
                                    Load More
                                  </button>
                                )}
                              </div>
                            </>
                          )}

                          <div ref={messagesEndRef}> </div>
                        </div>

                        <div className="chat-footer">
                          <div className="chat-input-wrapper">
                            <button
                              aria-label="Close emojis"
                              className="icons hidden"
                              id="emoji-remove-icon"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                className="chat__input-icon"
                              >
                                <path
                                  fill="currentColor"
                                  d="M19.1 17.2l-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"
                                ></path>
                              </svg>
                            </button>
                            <button
                              aria-label="Choose GIF"
                              className={`icons ${isActive ? "" : "hidden"}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                className="chat__input-icon"
                              >
                                <path
                                  fill="currentColor"
                                  d="M13.177 12.013l-.001-.125v-.541-.512c0-.464 0-.827-.002-1.178a.723.723 0 0 0-.557-.7.715.715 0 0 0-.826.4c-.05.115-.072.253-.073.403-.003 1.065-.003 1.917-.002 3.834v.653c0 .074.003.136.009.195a.72.72 0 0 0 .57.619c.477.091.878-.242.881-.734.002-.454.003-.817.002-1.633l-.001-.681zm-3.21-.536a35.751 35.751 0 0 0-1.651-.003c-.263.005-.498.215-.565.48a.622.622 0 0 0 .276.7.833.833 0 0 0 .372.104c.179.007.32.008.649.005l.137-.001v.102c-.001.28-.001.396.003.546.001.044-.006.055-.047.081-.242.15-.518.235-.857.275-.767.091-1.466-.311-1.745-1.006a2.083 2.083 0 0 1-.117-1.08 1.64 1.64 0 0 1 1.847-1.41c.319.044.616.169.917.376.196.135.401.184.615.131a.692.692 0 0 0 .541-.562c.063-.315-.057-.579-.331-.766-.789-.542-1.701-.694-2.684-.482-2.009.433-2.978 2.537-2.173 4.378.483 1.105 1.389 1.685 2.658 1.771.803.054 1.561-.143 2.279-.579.318-.193.498-.461.508-.803.014-.52.015-1.046.001-1.578-.009-.362-.29-.669-.633-.679zM18 4.25H6A4.75 4.75 0 0 0 1.25 9v6A4.75 4.75 0 0 0 6 19.75h12A4.75 4.75 0 0 0 22.75 15V9A4.75 4.75 0 0 0 18 4.25zM21.25 15A3.25 3.25 0 0 1 18 18.25H6A3.25 3.25 0 0 1 2.75 15V9A3.25 3.25 0 0 1 6 5.75h12A3.25 3.25 0 0 1 21.25 9v6zm-2.869-6.018H15.3c-.544 0-.837.294-.837.839V14.309c0 .293.124.525.368.669.496.292 1.076-.059 1.086-.651.005-.285.006-.532.004-1.013v-.045l-.001-.46v-.052h1.096l1.053-.001a.667.667 0 0 0 .655-.478c.09-.298-.012-.607-.271-.757a.985.985 0 0 0-.468-.122 82.064 82.064 0 0 0-1.436-.006h-.05l-.523.001h-.047v-1.051h1.267l1.22-.001c.458-.001.768-.353.702-.799-.053-.338-.35-.56-.737-.561z"
                                ></path>
                              </svg>
                            </button>

                            <button
                              aria-label="Choose sticker"
                              className={`icons ${isActive ? "" : "hidden"}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                className="chat__input-icon"
                              >
                                <path
                                  fill="currentColor"
                                  d="M21.799 10.183c-.002-.184-.003-.373-.008-.548-.02-.768-.065-1.348-.173-1.939a6.6 6.6 0 0 0-.624-1.87 6.24 6.24 0 0 0-1.171-1.594 6.301 6.301 0 0 0-1.614-1.159 6.722 6.722 0 0 0-1.887-.615c-.59-.106-1.174-.15-1.961-.171-.318-.008-3.607-.012-4.631 0-.798.02-1.383.064-1.975.17a6.783 6.783 0 0 0-1.888.616 6.326 6.326 0 0 0-2.785 2.753 6.658 6.658 0 0 0-.623 1.868c-.107.591-.152 1.186-.173 1.941-.008.277-.016 2.882-.016 2.882 0 .52.008 1.647.016 1.925.02.755.066 1.349.172 1.938.126.687.33 1.3.624 1.871.303.59.698 1.126 1.173 1.595a6.318 6.318 0 0 0 1.614 1.159 6.786 6.786 0 0 0 2.146.656c.479.068.833.087 1.633.108.035.001 2.118-.024 2.578-.035a6.873 6.873 0 0 0 4.487-1.811 210.877 210.877 0 0 0 2.928-2.737 6.857 6.857 0 0 0 2.097-4.528l.066-1.052.001-.668c.001-.023-.005-.738-.006-.755zm-3.195 5.92c-.79.757-1.784 1.684-2.906 2.716a5.356 5.356 0 0 1-2.044 1.154c.051-.143.116-.276.145-.433.042-.234.06-.461.067-.74.003-.105.009-.789.009-.789.013-.483.042-.865.107-1.22.069-.379.179-.709.336-1.016.16-.311.369-.595.621-.844.254-.252.542-.458.859-.617.314-.158.65-.268 1.037-.337a8.127 8.127 0 0 1 1.253-.106s.383.001.701-.003a4.91 4.91 0 0 0 .755-.066c.186-.034.348-.105.515-.169a5.35 5.35 0 0 1-1.455 2.47zm1.663-4.757a1.128 1.128 0 0 1-.615.859 1.304 1.304 0 0 1-.371.119 3.502 3.502 0 0 1-.52.043c-.309.004-.687.004-.687.004-.613.016-1.053.049-1.502.129a5.21 5.21 0 0 0-1.447.473 4.86 4.86 0 0 0-2.141 2.115 5.088 5.088 0 0 0-.479 1.434 9.376 9.376 0 0 0-.131 1.461s-.006.684-.008.777c-.006.208-.018.37-.043.511a1.154 1.154 0 0 1-.626.86c-.072.036-.168.063-.37.098-.027.005-.25.027-.448.031-.021 0-1.157.01-1.192.009-.742-.019-1.263-.046-1.668-.126a5.27 5.27 0 0 1-1.477-.479 4.823 4.823 0 0 1-2.127-2.1 5.141 5.141 0 0 1-.482-1.453c-.09-.495-.13-1.025-.149-1.71a36.545 36.545 0 0 1-.012-.847c-.003-.292.005-3.614.012-3.879.02-.685.061-1.214.151-1.712a5.12 5.12 0 0 1 .481-1.45c.231-.449.53-.856.892-1.213.363-.36.777-.657 1.233-.886a5.26 5.26 0 0 1 1.477-.479c.503-.09 1.022-.129 1.74-.149a342.03 342.03 0 0 1 4.561 0c.717.019 1.236.058 1.737.148a5.263 5.263 0 0 1 1.476.478 4.835 4.835 0 0 1 2.126 2.098c.228.441.385.913.482 1.453.091.499.131 1.013.15 1.712.008.271.014 1.098.014 1.235a2.935 2.935 0 0 1-.037.436z"
                                ></path>
                              </svg>
                            </button>

                            {canAdd ? (
                              <CustomEditor
                                fieldName="myField"
                                text={editorContent}
                                onChange={handleEditorChange}
                                onSend={handleSend}
                                isToggledButton={isToggledButton}
                                handleChangeToggleButton={handleChangeToggleButton}
                                contactData={getData}
                                setIsLoadedMessage={setIsLoadedMessage}
                                editMsg={editorContentToEdit}
                                isWhatsAppAuto={isWhatsAppAuto} // Pass state
                                handleWhatsAppToggle={handleWhatsAppToggle} // Pass function
                                setIsWhatsAppAuto={setIsWhatsAppAuto}
                              />
                            ) : (
                              <span></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <RightSideProfile
                        isProfile={showProfile}
                        closeChatAbout={() => setShowProfile(false)}
                        getInfo={getData}
                        deleteContact={() => setIsCloseConfirmation(true)}
                        setIsCreateContact1={setIsCreateContact1}
                      // handelRefreshMessages={handelRefreshMessages}
                      />
                    </>
                  )}
                  {showVisits && (
                    <Visitsview
                      isVisitView={showVisits}
                      closeVisitView={() => {
                        setShowVisits(false);
                      }}
                      contactId={getData?.id}
                      contactName={getData?.person_name}
                      setRefreshVisit={() => setRefreshVisit(true)}
                    />
                  )}
                  {showTasks && (
                    <ContactTaskListView
                      isTaskManagementView={showTasks}
                      closeTaskManagementView={() => {
                        setShowTasks(false);
                        setSelectedContactTask(null);
                      }}
                      supportTicketFlag={0}
                      contactId={getData?.id}
                      contactName={getData?.person_name}
                      onSelectTask={(task) => setSelectedContactTask(task)}
                      selectedTaskId={selectedContactTask?.id}
                    />
                  )}
                  {showTickets && (
                    <ContactTaskListView
                      isTaskManagementView={showTickets}
                      closeTaskManagementView={() => {
                        setShowTickets(false);
                        setSelectedContactTask(null);
                      }}
                      supportTicketFlag={1}
                      contactId={getData?.id}
                      contactName={getData?.person_name}
                      onSelectTask={(task) => setSelectedContactTask(task)}
                      selectedTaskId={selectedContactTask?.id}
                    />
                  )}
                </>
              ) : (
                <div className="Intro-Left" id="Intro-Left">

                  <div className="intro">
                    <div
                      style={{ border: "0px solid black", width: "100%" }}
                      className="row"
                    >
                      <div className="absolute top-4 right-6 flex gap-3">
                        {/* <TaskStickyIcon
                          categoryIds={categoryIds}
                        // categoryNames={categoryNames}
                        /> */}
                      </div>
                      <div
                        className="col-md-12 text-center pb-2"
                        style={{ padding: "0px" }}
                      >
                        <img src={deshFlow_log_icon} width={300} alt="" />
                      </div>
                    </div>
                    {/* <div
                      style={{ border: "0px solid black", width: "100%" }}
                      className="row"
                    >
                      <div className="col-md-12" style={{ padding: "0px" }}>
                        <div className="text-center">
                          <h4 className="logo-main-text">&nbsp;</h4>
                        </div>
                      </div>
                    </div> */}

                    <div
                      style={{ border: "0px solid black", width: "100%" }}
                      className="row pt-1 mb-2"
                    >
                      <div className="col-md-12 " style={{ padding: "0px" }}>
                        <div className="text-center">
                          <h4 className="user-info-text">
                            {loginById && "Welcome, " + loginById?.username}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="d-flex align-items-center justify-content-center mb-1">
                        <span>
                          <b>All In One Platform</b>
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            fontWeight: "bold",
                            background: "#25D366",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                          }}
                          role="button"
                          onClick={handleOpenWhatsapp}
                        >
                          WhatsApp
                        </span>
                        +
                        <span
                          style={{
                            fontWeight: "bold",
                            background: "#e87727",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          CRM
                        </span>
                        +
                        <span
                          style={{
                            fontWeight: "bold",
                            background: "#848688",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          HRM
                        </span>
                        +
                        <span
                          style={{
                            fontWeight: "bold",
                            background: "#6aa9ff",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          Invoice
                        </span>
                        +
                        <span
                          style={{
                            fontWeight: "bold",
                            background: "#4c4c4c",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          Production
                        </span>
                      </div>
                    </div>

                    <div
                      ref={searchContainerRef}
                      // style={{
                      //   width: "50%",
                      //   maxWidth: "650px",
                      //   margin: "50px auto 0 auto",
                      //   position: "relative",
                      // }}
                      className="search_container"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShow(false);
                      }}
                    >
                      {/* Search Bar */}
                      <div
                        onClick={() => setShow(true)}
                        // style={{
                        //   display: "flex",
                        //   alignItems: "center",
                        //   padding: "12px 16px",
                        //   borderRadius: "50px",
                        //   background: "#fff",
                        //   boxShadow: "0 1px 6px rgba(32,33,36,0.28)",
                        //   cursor: "text",
                        // }}
                        className="global_search_bar"
                      >
                        <span style={{ marginRight: "10px" }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#5F6368"
                          >
                            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                          </svg>
                        </span>

                        <input
                          ref={inputRef}
                          onFocus={() => setShow(true)}
                          placeholder="Search something via Ctrl + Alt + F"
                          style={{
                            border: "none",
                            outline: "none",
                            width: "100%",
                            fontSize: "16px",
                            background: "transparent",
                            paddingRight: searchValue ? "30px" : "0px",
                          }}
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                        />
                        {searchValue && (
                          <span
                            onMouseEnter={() => setHover(true)}
                            onMouseLeave={() => setHover(false)}
                            style={{
                              position: "absolute",
                              right: "16px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: hover ? "#111827" : "#9ca3af",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchValue("");
                              setIdFromRightSide(0);
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
                      </div>

                      {/* Suggestions Dropdown */}
                      {show && (
                        <div
                          style={{
                            position: "absolute",
                            top: "55px",
                            width: "100%",
                            background: "#fff",
                            borderRadius: "20px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            padding: "10px 0",
                            zIndex: 10,
                            overflow: "hidden",
                          }}
                        >
                          {show && (
                            <div
                              style={{
                                maxHeight: "300px",
                                overflowY: "auto",
                              }}
                            >
                              {loading ? (
                                <div
                                  style={{
                                    padding: "10px 20px",
                                    color: "#999",
                                  }}
                                >
                                  Searching...
                                </div>
                              ) : listToShow.length > 0 ? (
                                listToShow.map((item, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      padding: "10px 20px",
                                      cursor: "pointer",
                                      background:
                                        selectedIndex === index
                                          ? "#f1f3f4"
                                          : "transparent",
                                    }}
                                    onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#f1f3f4")
                                    }
                                    onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                    }
                                    onClick={() => {
                                      if (dynamicOnes.length <= 0) {
                                        setSearchValue("");
                                        setShow(false);
                                      }
                                      item.action();
                                    }}
                                  >
                                    <span
                                      style={{
                                        marginRight: "15px",
                                        color: "#5f6368",
                                      }}
                                    >
                                      {/* ⏱ */}
                                      {item.Number}
                                    </span>

                                    <span style={{ fontSize: "15px" }}>
                                      {item.text}
                                    </span>
                                  </div>
                                ))
                              ) : hasSearchedDB ? (
                                <div
                                  style={{
                                    padding: "10px 20px",
                                    color: "#999",
                                  }}
                                >
                                  No results found
                                </div>
                              ) : (
                                <button
                                  style={{
                                    padding: "10px 20px",
                                    color: "#999",
                                    width: "100%",
                                    textAlign: "left",
                                  }}
                                  onClick={handleDynamicOptionFetch}
                                >
                                  Click here to search {searchValue}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ width: "100%" }} className="row">
                      <div
                        className="col-md-12 text-center btn-pb"
                        style={{ padding: "0px" }}
                      >
                        <div
                          className="ICON icon-pt"
                          style={{ position: "relative" }}
                        >
                          <button
                            style={{ marginRight: "10px" }}
                            className="icons "
                            onClick={() =>
                              canViewInsight
                                ? window.open("/SideView", "_blank")
                                : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                            }
                          >
                            <span title="View Insights">
                              <svg
                                enable-background="new 0 0 20 20"
                                height="30"
                                viewBox="0 0 20 20"
                                width="30"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                              >
                                <path d="m0 0h20v20h-20z" fill="none" />
                                <path d="m12.5 8 .79-1.72 1.71-.78-1.71-.78-.79-1.72-.76 1.72-1.74.78 1.74.78z" />
                                <path d="m4 10 .4-1.6 1.6-.4-1.6-.4-.4-1.6-.4 1.6-1.6.4 1.6.4z" />
                                <path d="m16.5 6c-1.07 0-1.84 1.12-1.35 2.14l-3.01 3.01c-.52-.25-.99-.14-1.29 0l-1.01-1.01c.1-.19.16-.41.16-.64 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .23.06.45.15.64l-3.01 3.01c-.19-.09-.41-.15-.64-.15-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c.52.25.99.14 1.29 0l1.01 1.01c-.1.19-.16.41-.16.64 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c1.03.5 2.14-.29 2.14-1.35 0-.83-.67-1.5-1.5-1.5z" />
                              </svg>
                            </span>
                            <h4 className="landing-page-text h4-mb">
                              View Insights
                            </h4>
                          </button>

                          <button
                            className="icons "
                            onClick={() =>
                              canViewTeamMember
                                ? showMyCompany()
                                : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                            }
                            style={{ marginRight: "10px" }}
                          >
                            <span title="My Team">
                              <svg
                                height="30px"
                                viewBox="0 -960 960 960"
                                width="30px"
                                fill="currentColor"
                              >
                                <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
                              </svg>
                            </span>
                            <h4 className="landing-page-text h4-mb">My Team</h4>
                          </button>

                          <button
                            className="icons"
                            onClick={showNotes}
                            style={{ marginRight: "10px" }}
                          >
                            <span title="Personal Notes">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="30px"
                                viewBox="0 -960 960 960"
                                width="30px"
                                fill="#5f6368"
                              >
                                <path d="M440-240h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                              </svg>
                            </span>
                            <h4 className="landing-page-text h4-mb">
                              Personal Notes
                            </h4>
                          </button>
                          <button
                            style={{ marginRight: "10px" }}
                            className="icons "
                            onClick={() =>
                              window.open("/SideView?view=reports", "_blank")
                            }
                          >
                            <span title="View Reports">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="30px"
                                viewBox="0 -960 960 960"
                                width="30px"
                                fill="currentColor"
                              >
                                <path d="M80-120v-80h800v80H80Zm40-120v-280h120v280H120Zm200 0v-480h120v480H320Zm200 0v-360h120v360H520Zm200 0v-600h120v600H720Z" />
                              </svg>
                            </span>
                            <h4 className="landing-page-text h4-mb">
                              All Reports
                            </h4>
                          </button>
                          {/* <Link
                          to={`/Reports`}
                          target="_blank"
                          style={{
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <button
                            style={{ marginRight: "10px" }}
                            className="icons "
                          //  onClick={() => openInNewTab("/Reports")}
                          // onClick={() => handelChangeShowModelReport()}
                          >
                            <span title="View Reports">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="30px"
                                viewBox="0 -960 960 960"
                                width="30px"
                                fill="currentColor"
                              >
                                <path d="M80-120v-80h800v80H80Zm40-120v-280h120v280H120Zm200 0v-480h120v480H320Zm200 0v-360h120v360H520Zm200 0v-600h120v600H720Z" />
                              </svg>
                            </span>
                            <h4 className="landing-page-text"> Reports</h4>
                          </button>
                        </Link> */}

                          <button
                            className="icons"
                            onClick={() => showMyTask()}
                            style={{ marginRight: "10px" }}
                          >
                            <span
                              title="Due Task"
                              style={{
                                position: "relative",
                                display: "inline-block",
                              }}
                            >
                              {taskCount !== 0 && (
                                <span
                                  style={{
                                    width: "15px",
                                    height: "15px",
                                    fontSize: "9px",
                                    lineHeight: "15px",
                                    position: "absolute",
                                    top: "0px",
                                    right: "-5px",
                                    background: "red",
                                    color: "white",
                                    borderRadius: "100%",
                                    textAlign: "center",
                                  }}
                                >
                                  {taskCount}
                                </span>
                              )}

                              <span title="Add Task">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="#5f6368"
                                >
                                  <path d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                                </svg>
                              </span>
                            </span>

                            <h4 className="landing-page-text h4-mb">My Task</h4>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{ border: "0px solid black", width: "100%" }}
                      className="row btn-pb"
                    >
                      <div
                        className="col-md-12 text-center"
                        style={{ padding: "0px" }}
                      >
                        {loading ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Skeleton
                              width={50}
                              height={50}
                              circle={true}
                              duration={5}
                              style={{ padding: "10px" }}
                            />
                            <Skeleton
                              width={50}
                              height={50}
                              circle={true}
                              duration={5}
                              style={{ padding: "10px" }}
                            />
                            <Skeleton
                              width={50}
                              height={50}
                              circle={true}
                              duration={5}
                              style={{ padding: "10px" }}
                            />
                            <Skeleton
                              width={50}
                              height={50}
                              circle={true}
                              duration={5}
                              style={{ padding: "10px" }}
                            />
                            <Skeleton
                              width={50}
                              height={50}
                              circle={true}
                              duration={5}
                              style={{ padding: "10px" }}
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <button
                                onClick={handleAttendance}
                                className="btn right-icons text-light rounded-5 fw_500"
                                style={
                                  savedAttendance === 2 || savedAttendance === 0
                                    ? {
                                      backgroundColor: "#ccc",
                                      borderRadius: "50%",
                                      padding: "10px",
                                    }
                                    : {
                                      backgroundColor: "#008000",
                                      borderRadius: "50%",
                                      padding: "10px",
                                    }
                                }
                                title={
                                  savedAttendance == 2
                                    ? "Check In"
                                    : "Check Out"
                                }
                              >
                                {savedAttendance === 2 ||
                                  savedAttendance === 0 ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#1f1f1f"
                                  >
                                    <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z" />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#fff"
                                  >
                                    <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                className="icons right-icons"
                                style={{
                                  borderRadius: "50%",
                                  padding: "10px",
                                  zIndex: "1",
                                  background: isListening ? "#008000" : "#ccc",
                                  margin: "10px",
                                  position: "relative",
                                }}
                                onClick={() => {
                                  if (!canViewVoiceControl) {
                                    toast.error(
                                      DEFAULT_MESSAGE_ERROR_PERMISSION,
                                    );
                                    return;
                                  }
                                  isListening
                                    ? stopListening()
                                    : startListening();
                                }}
                                title={
                                  isListening
                                    ? "Stop Listening"
                                    : "Start Listening"
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 0 24 24"
                                  width="24px"
                                  fill={isListening ? "#fff" : "#1f1f1f"}
                                >
                                  <path d="M0 0h24v24H0z" fill="none" />
                                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                                </svg>

                                {isListening && (
                                  <div
                                    className="text-xs text-red-500 mt-1"
                                    style={{
                                      position: "absolute",
                                      bottom: -20,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      whiteSpace: "nowrap",
                                    }}
                                  ></div>
                                )}
                              </button>
                              <button
                                className="icons right-icons"
                                style={{
                                  borderRadius: "50%",
                                  padding: "10px",
                                  marginLeft: "10px",
                                }}
                                onClick={() =>
                                  canViewAiModel
                                    ? handelChangeShowModelExploreNearby()
                                    : toast.error(
                                      DEFAULT_MESSAGE_ERROR_PERMISSION,
                                    )
                                }
                              >
                                <span title="Explore in google map">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#1f1f1f"
                                  >
                                    <path d="M640-560v-126 126ZM174-132q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v337q-15-23-35.5-42T760-528v-204l-120 46v126q-21 0-41 3.5T560-546v-140l-160-56v523l-226 87Zm26-96 120-46v-468l-120 40v474Zm440-12q34 0 56.5-20t23.5-60q1-34-22.5-57T640-400q-34 0-57 23t-23 57q0 34 23 57t57 23Zm0 80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 43.5T778-238l102 102-56 56-102-102q-18 11-38.5 16.5T640-160ZM320-742v468-468Z" />
                                  </svg>
                                </span>
                              </button>

                              <a
                                href={`/website/${companyData?.qr_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Online Store"
                              >
                                <button
                                  className="icons right-icons"
                                  style={{
                                    borderRadius: "50%",
                                    padding: "10px",
                                    zIndex: "1",
                                    margin: "10px",
                                    position: "relative",
                                  }}
                                >
                                  <span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      height="24px"
                                      viewBox="0 -960 960 960"
                                      width="24px"
                                      fill="#1f1f1f"
                                    >
                                      <path d="M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z" />
                                    </svg>
                                  </span>
                                </button>
                              </a>
                              <button
                                className="icons right-icons"
                                style={{
                                  borderRadius: "50%",
                                  padding: "10px",
                                  zIndex: "1",
                                  margin: "10px",
                                  marginLeft: "0px",
                                  position: "relative",
                                }}
                                onClick={toggleDropdownCreate}
                                ref={dropdownCreateOrderRef}
                              >
                                <span title="POS">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#1f1f1f"
                                  >
                                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h360v80H200v560h560v-360h80v360q0 33-23.5 56.5T760-120H200Zm120-160v-80h320v80H320Zm0-120v-80h320v80H320Zm0-120v-80h320v80H320Zm360-80v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                                  </svg>
                                </span>
                              </button>

                              <div
                                className="dropdown-icon"
                                style={{ right: "20%" }}
                              >
                                <ul
                                  className={`drop-order ${dropdownOpenCreateOrder
                                    ? "isVisible"
                                    : "isHidden"
                                    }`}
                                  style={{
                                    maxWidth: "250px",
                                    minWidth: "200px",
                                  }}
                                >
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelOpenQuotation}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.quotation_title
                                      ? companyLists[0]?.quotation_title
                                      : "Quotation"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelOpenProfomaInvoice}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.proforma_invoice_title
                                      ? companyLists[0]?.proforma_invoice_title
                                      : "Proforma Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelOpenOrder}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.order_title
                                      ? companyLists[0]?.order_title
                                      : "Sales Order"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={handelOpenDispatch}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.dispatch_title
                                      ? companyLists[0]?.dispatch_title
                                      : "Dispatch"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelOpenInvoice}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.invoice_title
                                      ? companyLists[0]?.invoice_title
                                      : "Sales Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelOpenReturnSalesInvoice}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.return_sales_invoice_title
                                      ? companyLists[0]
                                        ?.return_sales_invoice_title
                                      : "Return Sales Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelOpenPurchaseOrder}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.purchase_order_title
                                      ? companyLists[0]?.purchase_order_title
                                      : "Purchase Order"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelOpenInward}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.inward_title
                                      ? companyLists[0]?.inward_title
                                      : "Goods Received Note"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelOpenPurchaseInvoice}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]?.purchase_title
                                      ? companyLists[0]?.purchase_title
                                      : "Purchase Invoice"}
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clear-modal"
                                    onClick={handelOpenReturnPurchaseInvoice}
                                  >
                                    {companyLists[0] &&
                                      companyLists[0]
                                        ?.return_purchase_invoice_title
                                      ? companyLists[0]
                                        ?.return_purchase_invoice_title
                                      : "Return Purchase Invoice"}
                                  </li>
                                </ul>
                              </div>
                              <button
                                className="icons right-icons"
                                style={{
                                  borderRadius: "50%",
                                  padding: "10px",
                                  zIndex: "1",
                                  margin: "10px",
                                  marginLeft: "0px",
                                  position: "relative",
                                }}
                                onClick={showMySupportTicket}
                              >
                                <span title="Support Ticket">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#1f1f1f"
                                  >
                                    <path d="M440-120v-80h320v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v244h-40q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H440Zm-80-280q-17 0-28.5-11.5T320-440q0-17 11.5-28.5T360-480q17 0 28.5 11.5T400-440q0 17-11.5 28.5T360-400Zm240 0q-17 0-28.5-11.5T560-440q0-17 11.5-28.5T600-480q17 0 28.5 11.5T640-440q0 17-11.5 28.5T600-400Zm-359-62q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z" />
                                  </svg>
                                </span>
                                {supportTicketCount !== 0 && (
                                  <span
                                    style={{
                                      width: "15px",
                                      height: "15px",
                                      fontSize: "9px",
                                      lineHeight: "15px",
                                      position: "absolute",
                                      top: "0px",
                                      right: "-5px",
                                      background: "red",
                                      color: "white",
                                      borderRadius: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {supportTicketCount}
                                  </span>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      style={{ border: "0px solid black", width: "100%" }}
                      className="row pb-2"
                    >
                      <div
                        className="col-md-12 text-center"
                        style={{ padding: "0px" }}
                      >
                        {companyId &&
                          (() => {
                            const activeId = Number(
                              localStorage.getItem("COMPANY_ID"),
                            );
                            const filtered = companyId.filter(
                              (item: any) => item.id === activeId,
                            );
                            const itemsToRender =
                              filtered.length > 0 ? filtered : [companyId[0]];
                            return itemsToRender.map(
                              (item: any, index: number) => (
                                <div
                                  className="d-flex align-items-center flex-column"
                                  key={index}
                                >
                                  <h4 className="landing-page-text pe-1 h4-pt h4-mb">
                                    Plan Expiry Date :&nbsp;
                                    {item.plan_expiry_date
                                      ? formatDate(item.plan_expiry_date)
                                      : ""}
                                  </h4>

                                  {/* Workspace Badge below Plan Expiry Date */}
                                  {item?.company_name && (
                                    <div
                                      className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-sm mt-2"
                                      style={{
                                        backgroundColor:
                                          item.parent_company_id === null ||
                                            item.parent_company_id === undefined
                                            ? "#fff3eb"
                                            : "#f1f5f9",
                                        border: `1.5px solid ${item.parent_company_id === null ||
                                          item.parent_company_id === undefined
                                          ? "#f58634"
                                          : "#cbd5e1"
                                          }`,
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color:
                                          item.parent_company_id === null ||
                                            item.parent_company_id === undefined
                                            ? "#f58634"
                                            : "#475569",
                                      }}
                                      title={`Active Workspace: ${item.company_name}`}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                                        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                                        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                                      </svg>
                                      <span>{item.company_name}</span>
                                      <span
                                        className="badge"
                                        style={{
                                          backgroundColor:
                                            item.parent_company_id === null ||
                                              item.parent_company_id === undefined
                                              ? "#f58634"
                                              : "#64748b",
                                          color: "#ffffff",
                                          fontSize: "10px",
                                          padding: "3px 7px",
                                          borderRadius: "100px",
                                        }}
                                      >
                                        {item.parent_company_id === null ||
                                          item.parent_company_id === undefined
                                          ? "Main Company"
                                          : "Workspace"}
                                      </span>
                                    </div>
                                  )}
                                  {item.expiry_msg && (
                                    <h4
                                      className="landing-page-text pe-1  plan-expiry-show-animation "
                                      style={{
                                        backgroundColor: "#d11111ff",
                                        color: "white",
                                        borderRadius: "10px",
                                        padding: "5px",
                                      }}
                                    >
                                      {item.expiry_msg}
                                    </h4>
                                  )}

                                  {item.expiry_msg &&
                                    item.company_flag === 1 && (
                                      <button
                                        className="btn btn-secondary mt-3"
                                        onClick={() =>
                                          handelChangeRenewPlan(item)
                                        }
                                        style={{
                                          backgroundColor: "#f76a06ff",
                                          marginTop: "10px",
                                        }}
                                      >
                                        Renew Now
                                      </button>
                                    )}
                                </div>
                              ),
                            );
                          })()}
                      </div>
                    </div>

                    <div
                      style={{ border: "0px solid black", width: "100%" }}
                      className="row"
                    >
                      <div className="col-md-12" style={{ padding: "0px" }}>
                        <div
                          className="text-center btn-pt"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <h4
                            className="col-2 landing-page-text text-end"
                            // onClick={() => openInNewTab("/instructionView", 1)} // Pass id 1
                            style={{ cursor: "pointer" }}
                          >
                            {APPLICATION_VERSION}&nbsp;&nbsp;&nbsp; &nbsp;|
                          </h4>
                          <h4
                            className="col-2 landing-page-text text-center"
                            // onClick={() => openInNewTab("/PrivacyPolicy")} // Pass id 1
                            style={{ cursor: "pointer" }}
                          >
                            <Link
                              to="/PrivacyPolicy"
                              target="_blank"
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              Privacy Policy
                            </Link>
                          </h4>
                          <h4
                            className="col-2 landing-page-text text-start"
                            // onClick={() => openInNewTab("/ContactUs")} // Pass id 1
                            style={{ cursor: "pointer" }}
                          >
                            |&nbsp;&nbsp;&nbsp;&nbsp;
                            <Link
                              to="ContactUs"
                              target="_blank"
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              Contact Us
                            </Link>
                          </h4>
                        </div>
                      </div>
                      {/* <iframe
                      src="https://tawk.to/chat/68a56c9d727c171927b34bce/1j3330irj"

                      height="250"
                      width="200"
                    ></iframe> */}
                    </div>
                    {advertisement && (
                      <div className="text-center btn-mt">
                        {advertisement.startsWith("https://www.youtube.com/") ||
                          advertisement.startsWith("https://youtu.be/") ? (
                          // YouTube Video Thumbnail
                          <a
                            href={advertisement}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            <img
                              src={`https://img.youtube.com/vi/${getYouTubeVideoId(advertisement)}/hqdefault.jpg`}
                              alt="Advertisement Video"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "220px",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                cursor: "pointer",
                              }}
                            />
                          </a>
                        ) : (
                          // Normal Text Advertisement
                          <div
                            style={{
                              padding: "16px 20px",
                              borderRadius: "10px",
                              maxWidth: "600px",
                              margin: "0 auto",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: "16px",
                                lineHeight: "1.5",
                                color: "#333",
                                fontWeight: "800",
                              }}
                            >
                              {advertisement}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          <>
            {getData?.id ? (
              <ListInquiryView
                isListInquiry={showListInquiry}
                closeListInquiry={() => setShowListInquiry(false)}
                contactData={getData}
                isModelOpen={"InquiryList"}
                setNoDataFound1={setNoDataFound1}
                openRightSide={openRightSide}
                setRefreshInquirys={() => setRefreshInquiry(true)}
              />
            ) : (
              ""
            )}
          </>
          {isOpenTaskCreateModel && (
            <CreateTaskView
              show={isOpenTaskCreateModel}
              onHide={() => {
                setIsOpenTaskCreateModel(false);
                setTaskData({});
              }}
              onTaskCreated={async () => {
                await fetchMessageData(
                  setNoDataFound,
                  "",
                  setLoading,
                  setMessageList,
                  setHasMore,
                  currentPage,
                  setNoDataFound1,
                  getData?.id,
                  checkedReminder,
                  checkedAttachment,
                  selectDate,
                  "-1",
                  setGetCompanyId,
                );
              }}
              setTargetVsIncentiveList={setTargetVsIncentiveList}
              setLoading={setLoading}
              headerName="Create Task"
              productToEdit={undefined}
              messageId={taskData.messageId}
              messageDescription={taskData.messageDescription}
              contactId={taskData.contactId}
              referenceTable={taskData.referenceTable}
            />
          )}
          <>
            {pinConfirmation.show && (
              <ConfirmationModal
                show={pinConfirmation.show}
                onHide={() => setPinConfirmation({ show: false, type: null })}
                handleSubmit={handlePinContact}
                title={
                  pinConfirmation.type === "pin"
                    ? "Pin this Message"
                    : "UnPin this Message"
                }
                message={
                  pinConfirmation.type === "pin"
                    ? "Are you sure you want to pin this Message?"
                    : "Are you sure you want to unpin this Message?"
                }
                btn1="CANCEL"
                btn2="Apply"
              />
            )}
          </>
          <>
            {getData?.id ? (
              <ListAccountTransactionView
                isListAccountTransaction={showListAccountTransaction}
                closeListAccountTransaction={() =>
                  setShowListAccountTransaction(false)
                }
                contactData={getData}
                setNoDataFound1={setNoDataFound1}
                setRefreshAccount={() => setRefreshAccount(true)}
              />
            ) : (
              ""
            )}
          </>
          <>
            {getData?.id ? (
              <ListOrderView
                isListOrder={showListOrder}
                closeListOrder={() => setShowListOrder(false)}
                contactData={getData}
                isOrderShowNum={isOrderShowNum}
                dynamicTitle={companyLists[0]}
                setRefreshChat={() => setRefreshChat(true)}
                onRefreshMessages={async () => {
                  await fetchMessageData(
                    setNoDataFound,
                    "",
                    setLoading,
                    setMessageList,
                    setHasMore,
                    currentPage,
                    setNoDataFound1,
                    getData?.id,
                    checkedReminder,
                    checkedAttachment,
                    selectDate,
                    "-1",
                    setGetCompanyId,
                  );
                }}
                onConversionSuccess={(targetType) => {
                  setIsOrderShowNum(targetType as ModuleType);
                }}
              />
            ) : (
              ""
            )}
          </>

          {showRenewPlan && (
            <PricingTable
              companyId={renewPlanItem?.id}
              companyName={renewPlanItem?.company_name}
              companyEmailId={renewPlanItem?.company_email}
              companyContact={renewPlanItem?.company_contact}
              planAmount={0}
              renew_flag={1}
              innnerRenualFlag={1}
              onHide={() => setShowRenewPlan(false)}
            />
          )}
          {isCallHistoryModalOpen && (
            <EventLogs
              show={isCallHistoryModalOpen}
              onHide={() => setIsCallHistoryModalOpen(false)}
              contactId={getData?.id}
              reference_id={getData?.id}
              reference_table="contact_masters"
              requiredTabs={["status_timeline", "call_history"]}
            />
          )}
          <RightSearch
            isSearchShow={showSearch}
            closeSearch={() => setShowSearch(false)}
          />
          {optionConfirmation && (
            <ConfirmationModal
              show={optionConfirmation}
              onHide={() => setOptionConfirmation(false)}
              handleSubmit={() => "jhj"}
              title={"Mute Shayam for..."}
              btn1="CANCEL"
              btn2="MUTE NOTIFICATIION"
              isoption={true}
              opt1={"8 Hours"}
              opt2={"1 Week"}
              opt3={"Always"}
            />
          )}
          {isReportShow && (
            <ReportModal
              show={isReportShow}
              onHide={() => setIsReportShow(false)}
              handleSubmit={() => setIsReportShow(false)}
              titles={"Create"}
              message={"Please Enter Your Order Details"}
              btn1={"CANCEL"}
              btn2={"Approve"}
              reportName={reportName}
            // date={selectedDates}
            />
          )}

          {isExploreNearbyShow && (
            <ExploreNearbyModal
              show={isExploreNearbyShow}
              onHide={() => setIsExploreNearbyShow(false)}
            />
          )}
          {isClearConfirmation && (
            <ConfirmationModal
              show={isClearConfirmation}
              onHide={() => setIsClearConfirmation(false)}
              handleSubmit={() => handelClearMessages()}
              title={"Clear this chats"}
              message={"Are you sure you want Clear this Chats?"}
              btn1="CANCEL"
              btn2="CLEAR CHATS"
            />
          )}
          {isCloseConfirmation && (
            <ConfirmationModal
              show={isCloseConfirmation}
              onHide={() => setIsCloseConfirmation(false)}
              handleSubmit={() => handelDeleteContact()}
              title={"Delete this Contact"}
              message={"Are you sure you want Delete this Contact?"}
              btn1="CANCEL"
              btn2="DELETE CONTACT"
            />
          )}
          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => setIsDeleteConfirmation(false)}
              handleSubmit={handleDeleteMessage}
              title={"Delete this message"}
              message={"Are you sure you want delete this message? "}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
          {isMoveToMeConfirmation && (
            <ConfirmationModal
              show={isMoveToMeConfirmation}
              onHide={() => setIsMoveToMeConfirmation(false)}
              handleSubmit={() => handleChangeMoveMsg(1)}
              title={"Move this message to Me"}
              message={"Are you sure you want Move this message to Me? "}
              btn1="No"
              btn2="Yes"
            />
          )}
          {isMoveToClientConfirmation && (
            <ConfirmationModal
              show={isMoveToClientConfirmation}
              onHide={() => setIsMoveToClientConfirmation(false)}
              handleSubmit={() => handleChangeMoveMsg(2)}
              title={"Move this message to Client"}
              message={"Are you sure you want Move this message to Client? "}
              btn1="No"
              btn2="Yes"
            />
          )}
          {isReminderConfirmationStatus && (
            <ConfirmationModal
              show={isReminderConfirmationStatus}
              onHide={() => setIsReminderConfirmationStatus(false)}
              handleSubmit={handleChangeStatusOfReminder}
              handleReject={() => setIsReminderReschedule(true)}
              title={"Are you sure you want to complete this Reminder?"}
              message={`Remark : ${isReminderConfirmationStatus1 &&
                isReminderConfirmationStatus1.reminder_remark
                }`}
              btn1="CANCEL"
              btn2="Reschedule Reminder"
              btn3="Complete Reminder Now"
              message1={`Reminder Date : ${isReminderConfirmationStatus1?.reminder_data_time
                }`}
            />
          )}
          {isReminderReschedule && (
            <ReminderModal
              show={isReminderReschedule}
              onHide={() => setIsReminderReschedule(false)}
              handleSubmit={handleRescheduleReminder}
              title={"Reminder Reschedule"}
              message={"Are you sure you want to reschedule this reminder?"}
              btn1="CANCEL"
              btn2="Set Reminder"
              remarkMsg={isReminderConfirmationStatus1?.reminder_remark}
              // selectedMember={isReminderConfirmationStatus1?.assigned_to_name}
              // selectedMemberId={isReminderConfirmationStatus1?.assigned_to}
              request_flag="1"
              isFromChatModule={true}
            />
          )}
          {isReminderConfirmation && (
            <ReminderModal
              show={isReminderConfirmation}
              onHide={() => setIsReminderConfirmation(false)}
              handleSubmit={handleReminder}
              title={" Set Reminder "}
              message={"Are you sure you want delete this message? "}
              btn1="CANCEL"
              btn2="set Reminder"
              ContactMessageId={reminderForMsgId}
              request_flag="2"
            />
          )}

          {isEmailConfirmation && (
            <EmailSendView
              show={isEmailConfirmation}
              onHide={() => setIsEmailConfirmation(false)}
              title={"Send Email"}
              btn1="CANCEL"
              btn2="Send Email"
              contactInfo={getData}
              setLoading={setLoading}
            />
          )}

          {viewerOpen && (
            <ImageViewer
              image={imageViewData}
              onClose={() => setViewerOpen(false)}
            />
          )}
          {isModalOpen && (
            <>
              <ContactStatistic
                show={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                getInfo={getData}
              />
            </>
          )}

          {isModalVisible && (
            <CheckBoxModal
              show={isModalVisible}
              onHide={handleModalClose}
              handleSubmit={handleConfirm}
              title="Assign your label"
              message="Please select the labels for this contact."
              btn1="Cancel"
              btn2="Submit"
              options={options}
              selectedLabelIds={getData?.lable}
              contactId={getData?.id}
              getOptionColor={(option) => option.color || "#eeeeee"}
              getOptionName={(option) => option.lable_name}
              showColorBadge={true}
            />
          )}

          {isModalAssignStatusVisible && (
            <RadioButtonModal
              show={isModalAssignStatusVisible}
              onHide={() => setIsModalAssignStatusVisible(false)}
              handleSubmit={handleConfirmRadioButton}
              title="Assign your Status"
              message="Please select the Status for this contact."
              btn1="Cancel"
              btn2="Submit"
              options={optionRadioButtonStatus}
              // selectedLabelIds={getData?.stage_status_name}
              selectedLabelIds={getData?.contact_status}
              contactId={getData?.id}
              getOptionColor={(option) => option.color || "#eeeeee"}
              getOptionName={(option) => option.name}
              showColorBadge={true}
            // setRefreshStatus={() => setRefreshStatus(true)}
            />
          )}
          {isModalAssignUserVisible && (
            <CheckBoxModal
              show={isModalAssignUserVisible}
              onHide={() => setIsModalAssignUserVisible(false)}
              handleSubmit={handleConfirmAssignUser}
              title="Assign your User"
              message="Please select the Users for this contact."
              btn1="Cancel"
              btn2="Submit"
              options={optionJoinCompany}
              selectedLabelIds={getData?.assinged_to_work_a_application_id}
              contactId={getData?.id}
              getOptionName={getOptionName}
              showColorBadge={false}
            />
          )}
          {isOrderShow && (
            <OrderCreateModal
              show={isOrderShow}
              onHide={() => setIsOrderShow(false)}
              handleSubmit={() => setIsOrderShow(true)}
              onConversionSuccess={(targetType) => {
                setIsOrderShow(false);
                setIsOrderShowNum(targetType as ModuleType);
                setRefreshReport(true);
              }}
              title={"Create"}
              message={"Please Enter Your Order Details"}
              btn1={"CANCEL"}
              btn2={"Approve"}
              Contact={contactData}
              isOrderShowNum={isOrderShowNum}
              flag={"quick"}
              // orderId={contactData?.id}
              setRefreshReport={() => setRefreshReport(true)}
            />
          )}
        </div>
      )}
      {/* <IntroductionVideo /> */}
    </>
  );
};

export default RightView;