import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import {
  registerServiceWorker,
  requestFirebaseToken,
  setupForegroundMessageHandler,
} from "../../FirebaseConfig";
import smalll_office_logo from "../../assets/images/smalll_office_logo.png";
import { AppContext } from "../../common/AppContext";
import {
  convertDateTimeFormat,
  handleRefresh,
  useEscapeKey,
} from "../../common/SharedFunction";
import PinSetModel from "../../components/PinSetModel";
import { useTheme } from "../../components/ThemeContext";
import CheckBoxFilterModal from "../../components/model/CheckBoxFilterModal";
import CheckBoxModal from "../../components/model/CheckBoxModal";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import ContactKanbanBoard from "../../components/model/ContactKanbanBoard";
import ContactLocationModel from "../../components/model/ContactLocationModel";
import ImportExcelForContactModal from "../../components/model/ImportExcelForContactModal";
import OrderCreateModal from "../../components/model/OrderCreateModel/OrderCreateModal";
import RadioButtonModal from "../../components/model/RadioButtonModal";
import WorkFlowModel from "../../components/model/workflowConformatioModel/workFlowModelView";
import ReviewDialog from "../../components/review/ReviewDialog";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  MINI_TEXT_LENGTH,
  SMALL_WIDTH_FOR_TEXT,
} from "../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, SHORT_KEY } from "../../helpers/AppEnum";
import {
  IFilterData,
  IFilterPayload,
  TFilterDate,
} from "../../helpers/AppInterface";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../services/axiosInstance";
import useAdvertisementStore from "../../store/advertisement/useAdvertisemrntStore";
import { useCompanyStore } from "../../store/company/useCompanyStore";
import { useContactFilterStore } from "../../store/contact/useContactFilterStore";
import useMiracleFlagStore from "../../store/miracle/useMiracleFlagStore";
import { useReviewStore } from "../../store/review/useReviewStore";
import { useFeatureFlagStore } from "../../store/supportTicket/useSupportTicketFlag";
import useWhatsappPlatformStore from "../../store/whatsapp/useWhatsappPlateformFlagStore";
import NewDashboardView from "../dashboard/new-dashboard/NewDashboardView";
import Visitsview from "../left-side/header/Setting/visits/VisitView";
import { useTaskCategoryStore } from "../public/UseTaskCategoryStore";
import LoginView from "../public/login/LoginView";
import { IUserInfo } from "../public/otp-verification/OTPVerificationController";
import RightView from "../right-side/RightView";
import { fetchReminderCount } from "../right-side/RightViewController";
import ListInquiryView from "../right-side/list-inquiry/ListInquiryView";
import {
  archiveUnArchiveContactApi,
  deleteContactApi,
  exportContact,
  fetchAllCompanyApi,
  fetchCompanyKeyApi,
  fetchDataUser,
  fetchGetByIdUser,
  fetchStageStatusApi,
  ICompany,
  ILoginData,
  IUserList,
  logOutApi,
  pinContactApi,
  updateBulkSelectionActionPerformInContact,
  updateIsUnRead,
} from "./LeftSideController";
import ListNoteView from "./Personal-Notes/NoteView";
import CampaignModal from "./campaigns/CreateCampaignModel";
import CreateContactView from "./create-contact/CreateContactView";
import ContactSyncMiracle from "./create-contact/miracle/ContactSyncMiracle";
import Group from "./header/Group";
import NewChat from "./header/NewChat";
import DayAdjustmentView from "./header/Setting/Day Adjustment/DayAdjustmentView";
import RoutePlannerListView from "./header/Setting/Route Planner/RoutePlannerListView";
import Setting from "./header/Setting/Setting";
import AdjustmentTypeView from "./header/Setting/adjustment type/AdjustmentTypeView";
import AreasView from "./header/Setting/areas/AreasView";
import BillOfMaterialsView from "./header/Setting/bill-of-materials/BillOfMaterialsView";
import CallHistory from "./header/Setting/callhistory/CallhistoryView";
import CategoryView from "./header/Setting/category/CategoryView";
import CitiesView from "./header/Setting/cities/CitiesView";
import CompensationAdjustmentsView from "./header/Setting/compensation-adjustments/CompensationAdjustmentsView";
import CountriesView from "./header/Setting/countries/CountriesView";
import CustomInquiryFromView from "./header/Setting/custom-inquiry-from/CustomInquiryFromView";
import DepartmentView from "./header/Setting/department/DepartmentView";
import ExpenseTypeView from "./header/Setting/expense-type/ExpenseTypeView";
import HolidayMasterView from "./header/Setting/holiday master/HolidayMasterView";
import JobCardListView from "./header/Setting/job-card/Jobcardlistview";
import {
  fetchLabelApi,
  ILabelView,
} from "./header/Setting/label/LabelController";
import LabelView from "./header/Setting/label/LabelView";
import LeaveTypeView from "./header/Setting/leave-type/LeaveTypeView";
import LockControlView from "./header/Setting/lock-control/LockControlView";
import MachineManagement from "./header/Setting/machineManagement/Machine-managementView";
import MainSettingsView from "./header/Setting/main-settings/MainSettingsView";
import PaymentTypeView from "./header/Setting/payment-type/PaymentTypeView";
import PriceListView from "./header/Setting/priceList/PriceListView";
import ProcessAttendanceView from "./header/Setting/process-attendance/ProcessAttendanceView";
import ProcessMasterView from "./header/Setting/process-master/ProcessMasterView";
import UnitMasterView from "./header/Setting/product-unit/UnitMasterView";
import ProductView from "./header/Setting/product/ProductView";
import ProductgroupView from "./header/Setting/productgroup/ProductgroupView";
import RoundOffMasterView from "./header/Setting/round of master/RoundOfMasterView";
import SalaryProcessView from "./header/Setting/salary-process/SalaryProcessView";
import SourceOfTypes from "./header/Setting/source-of-types/SourceOfTypes";
import { ISourceOfTypes } from "./header/Setting/source-of-types/SourceOfTypesController";
import { IStageStatusView } from "./header/Setting/stage-status/StageStatusController";
import StageStatusView from "./header/Setting/stage-status/StageStatusView";
import StatesView from "./header/Setting/states/StatesView";
import StockAdjustmentView from "./header/Setting/stock-adjustment/StockAdjustmentView";
import TaskCategoryView from "./header/Setting/task-category/TaskCategoryView";
import TaskTemplateView from "./header/Setting/task-template/TaskTemplateView";
import TaskListView from "./header/Setting/taskList/TaskListView";
import TaxMasterView from "./header/Setting/tax master/TaxMasterView";
import VisitTypeView from "./header/Setting/visit-type/VisitTypeView";
import WarehouseView from "./header/Setting/warehouse/Warehouseview";
import WhatsappTemplateView from "./header/Setting/whatsapp-template-config/whatsappTemplateView";
import WorkFlowAutomationView from "./header/Setting/work-flow-automation/WorkFlowAutomationView";
import Starred from "./header/Starred";
import Status from "./header/Status";
import ListReminderView from "./header/list-reminder/ListReminderView";
import { fetchDepartmentsApi } from "./list-company/EditTeamMemberController";
import ListCompanyView from "./list-company/ListCompanyView";
import ListMyCompanyView from "./list-company/MyCompanyList";

// Fallback only — server always sends review.delaySeconds (REVIEW_PROMPT_DELAY_SECONDS env var).
const DEFAULT_REVIEW_PROMPT_DELAY_MS = 60000;

// ── Optional: custom CRM fields to map variables to ──────────────────────────
const MY_CRM_FIELDS = [
  { label: "Contact Name", value: "{{name}}" },
  { label: "Phone Number", value: "{{phone}}" },
  { label: "Email", value: "{{email}}" },
  { label: "City", value: "{{city}}" },
  { label: "Company", value: "{{company}}" },
  { label: "Lead Source", value: "{{lead_source}}" },
  { label: "Sales Order", value: "{{order_id}}" },
  { label: "Order Date", value: "{{order_date}}" },
  { label: "Amount", value: "{{amount}}" },
];
//   // ── These come from your current lead list / filter state ──
const activeFilters = {
  from_date: "2026-04-01",
  to_date: "2026-05-31",
  contact_type: "lead",
  city: "Rajkot",
  status: "hot",
};
//
//   // ── How template variables map to your Excel/CRM columns ──
const variableConfig = {
  1: "customer_name",
  2: "company_name",
  3: "mobile",
  4: "city",
};
interface IPropsLeftView {
  isVisible: boolean;
  userInfo?: IUserInfo;
}
export interface IFilterLocationParams {
  filterData: IFilterData | null;
  checkedOptions: any[] | null;
  checkedSourceTypes: any[] | null;
  startSearchDate: TFilterDate;
  endSearchDate: TFilterDate;
  checkedOptionsStageStatus: any[] | null | string;
  selectedCategoryId: any;
  selectedProductId: any;
  checkedOptionsUser: any[];
  assignedByMultiTeamMember: any[];
  createdByMultiTeamMember: any[];
  selectedActiveId: any;
  selectedDays: string | number | null;
  labelwiseContactShowAndOrNot: number;
  checkedOptionsContactassignOrNot: any[];
}
let LoginPin: Number;
const LeftSideView = ({ isVisible, userInfo }: IPropsLeftView) => {
  const { filters, setFilters } = useContactFilterStore();
  const { setPlatformType, platformType } = useWhatsappPlatformStore();

  const filtersRef = useRef(filters);
  const {
    isEditContact,
    showRightSide,
    setShowRightSide,
    setCheckToken,
    setPermissions,
    setCompanyData,
  } = useContext(AppContext)!;
  const token = localStorage.getItem("token");
  const localId = localStorage.getItem("UUID");

  const [hasInitializedFirebase, setHasInitializedFirebase] = useState(false);
  const [showPinSetModel, setShowPinSetModel] = useState(false);
  let applicationId = localStorage.getItem("UUID");
  const [isHover, setIsHover] = useState(false);
  const { setAdvertisement } = useAdvertisementStore();
  const [searchTermFromRightSide, setSearchTermFromRightSide] =
    useState<string>("");
  const [idFromRightSide, setIdFromRightSide] = useState<number>(0);
  const setFeatureEnabled = useMiracleFlagStore(
    (state) => state.setFeatureEnabled,
  );
  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );

  useEffect(() => {
    if (searchTermFromRightSide === "Export Contact") {
      setShareId(true);
      return;
    } else if (searchTermFromRightSide === "archive") {
      handleButtonClick(searchTermFromRightSide);
      return;
    } else if (searchTermFromRightSide === "Import Contact") {
      setIsModalExcelVisible(true);
      return;
    } else if (searchTermFromRightSide === "View In Map") {
      setIsModalMap(true);
      return;
    } else if (searchTermFromRightSide === "My Company") {
      rightSideVIewProvider("myCompany");
      return;
    } else if (searchTermFromRightSide === "Department") {
      rightSideVIewProvider("departments");
      return;
    } else if (searchTermFromRightSide === "Expense Type") {
      rightSideVIewProvider("expenseType");
      return;
    } else if (searchTermFromRightSide === "Visit Type") {
      rightSideVIewProvider("visitType");
      return;
    } else if (searchTermFromRightSide === "Leave Type") {
      rightSideVIewProvider("leaveType");
      return;
    } else if (searchTermFromRightSide === "Payment Type") {
      rightSideVIewProvider("paymentType");
      return;
    } else if (searchTermFromRightSide === "All My Inquiries") {
      rightSideVIewProvider("inquiry");
      return;
    } else if (
      searchTermFromRightSide === "All My Reminders" ||
      searchTermFromRightSide === "Add Reminder"
    ) {
      rightSideVIewProvider("reminder");
      return;
    } else if (searchTermFromRightSide === "All My Call History") {
      rightSideVIewProvider("callhistory");
      return;
    } else if (searchTermFromRightSide === "All My Visits") {
      rightSideVIewProvider("visits");
      return;
    } else if (
      searchTermFromRightSide === "All My Task" ||
      searchTermFromRightSide === "Create Task"
    ) {
      rightSideVIewProvider("task_Management");
      return;
    } else if (searchTermFromRightSide === "Product Group") {
      rightSideVIewProvider("productGroup");
      return;
    } else if (searchTermFromRightSide === "Product Category") {
      rightSideVIewProvider("productCategory");
      return;
    } else if (searchTermFromRightSide === "Product Unit") {
      rightSideVIewProvider("productUnit");
      return;
    } else if (
      searchTermFromRightSide === "products" ||
      searchTermFromRightSide === "Create Product"
    ) {
      rightSideVIewProvider("product");
      return;
    } else if (searchTermFromRightSide === "Price List") {
      rightSideVIewProvider("priceList");
      return;
    } else if (searchTermFromRightSide === "Task Category") {
      rightSideVIewProvider("taskCategory");
      return;
    } else if (searchTermFromRightSide === "Task Template") {
      rightSideVIewProvider("taskTemplate");
      return;
    } else if (searchTermFromRightSide === "Source") {
      rightSideVIewProvider("source");
      return;
    } else if (searchTermFromRightSide === "Labels") {
      rightSideVIewProvider("labels");
      return;
    } else if (searchTermFromRightSide === "Stages & Status") {
      rightSideVIewProvider("status");
      return;
    } else if (searchTermFromRightSide === "All Country") {
      rightSideVIewProvider("country");
      return;
    } else if (searchTermFromRightSide === "All States") {
      rightSideVIewProvider("state");
      return;
    } else if (searchTermFromRightSide === "All Cities") {
      rightSideVIewProvider("city");
      return;
    } else if (searchTermFromRightSide === "All Areas") {
      rightSideVIewProvider("area");
      return;
    } else if (searchTermFromRightSide === "Work Station") {
      rightSideVIewProvider("workStation");
      return;
    } else if (searchTermFromRightSide === "Process Master") {
      rightSideVIewProvider("processMaster");
      return;
    } else if (searchTermFromRightSide === "Warehouse") {
      rightSideVIewProvider("warehouse");
      return;
    } else if (searchTermFromRightSide === "Bill Of Materials") {
      rightSideVIewProvider("billOfMaterials");
      return;
    } else if (
      searchTermFromRightSide === "Stock Adjustment" ||
      searchTermFromRightSide === "Add Stock Adjustment"
    ) {
      rightSideVIewProvider("stock_adjustment");
      return;
    } else if (searchTermFromRightSide === "Custom Field Form") {
      rightSideVIewProvider("customFieldForm");
      return;
    } else if (searchTermFromRightSide === "Notification Settings") {
      rightSideVIewProvider("notificationSettings");
      return;
    } else if (searchTermFromRightSide === "WorkFlow Automation") {
      rightSideVIewProvider("workFlowAutomation");
      return;
    } else if (searchTermFromRightSide === "Create Contact") {
      handleChangeAddContact();
      return;
    } else if (searchTermFromRightSide === "salaryProcess") {
      rightSideVIewProvider("salaryProcess");
      return;
    } else if (searchTermFromRightSide === "processAttendance") {
      rightSideVIewProvider("processAttendance");
      return;
    } else if (searchTermFromRightSide === "compensationAdjustments") {
      rightSideVIewProvider("compensationAdjustments");
      return;
    } else if (searchTermFromRightSide === "HolidayMaster") {
      rightSideVIewProvider("HolidayMaster");
      return;
    } else if (searchTermFromRightSide === "RoundOffMaster") {
      rightSideVIewProvider("RoundOffMaster");
      return;
    } else if (searchTermFromRightSide === "AdjustmentTypeMaster") {
      rightSideVIewProvider("AdjustmentTypeMaster");
      return;
    } else if (searchTermFromRightSide === "DayAdjustmentMaster") {
      rightSideVIewProvider("DayAdjustmentMaster");
      return;
    } else if (searchTermFromRightSide === "LockControl") {
      rightSideVIewProvider("LockControl");
      return;
    } else if (searchTermFromRightSide === "TaxMaster") {
      rightSideVIewProvider("TaxMaster");
      return;
    } else if (searchTermFromRightSide === "jobcard") {
      rightSideVIewProvider("jobcard");
      return;
    } else if (searchTermFromRightSide === "routePlanner") {
      rightSideVIewProvider("routePlanner");
      return;
    }
    if (searchTermFromRightSide.length > 0) {
      rightSideVIewProvider("settings");
    }
  }, [searchTermFromRightSide]);

  // Check --
  useEffect(() => {
    const initializeFirebase = async () => {
      if (hasInitializedFirebase) return;

      try {
        // Register the service worker
        await registerServiceWorker();

        // Request Firebase token
        const tokenNotification = await requestFirebaseToken();

        if (tokenNotification) {
          // Update the notification token in the backend
          const updateNotificationTokenInContact = async (
            tokenNotification: string,
          ): Promise<boolean> => {
            const requestData = {
              table: "a_application_logins",
              where: `{"id":${localId}}`,
              data: `{"web_refresh_token":"${tokenNotification}"}`,
            };

            try {
              const response = await axiosInstance.post(
                "commonUpdate",
                requestData,
              );

              if (response.data.code === 200) {
                if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                  return true;
                } else {
                  toast.error(
                    response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
                  );
                  return false;
                }
              } else {
                toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
                return false;
              }
            } catch (error: any) {
              toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
              return false;
            }
          };

          // Call the function to update the token
          await updateNotificationTokenInContact(tokenNotification);
        }

        setHasInitializedFirebase(true); // Mark as initialized
      } catch (error) {
        console.error("Firebase initialization error:", error);
        toast.error("Failed to initialize Firebase messaging");
      }
    };
    initializeFirebase();
  }, [hasInitializedFirebase]);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    // 🔊 SPEAK FUNCTION
    const speak = (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth) return;

      if (synth.speaking) {
        synth.cancel();
      }

      const voices = synth.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = "en-IN";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      const indianVoice = voices.find((v) => v.lang === "en-IN");
      if (indianVoice) utterance.voice = indianVoice;

      synth.speak(utterance);
    };

    // 🔔 NORMAL NOTIFICATION SOUND
    const playSound = () => {
      audio = new Audio("/notification_sound.wav");
      audio.volume = 1;
      audio.play().catch(() => { });
    };

    const stopSound = () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
    };

    const NotificationIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.57 6.5 12 6.5C14.43 6.5 16 8.52 16 11V17Z"
          fill="#fff"
        />
      </svg>
    );

    // 🔥 CENTRAL FUNCTION
    const showToast = (data: any) => {
      const { title, body, url, notification_modual } = data || {};

      const isSupport =
        notification_modual === "customer_support_ticket_create";

      const message = title || body || "New Notification";

      // ✅ CONDITION LOGIC
      if (isSupport) {
        // 🗣 SPEAK
        speak(message);
      } else {
        // 🔊 SOUND
        playSound();
      }

      // 🔔 TOAST
      const toastId = toast.success(message, {
        position: "bottom-right",
        autoClose: false,
        onClick: () => {
          toast.dismiss(toastId); // Hide clicked toast

          if (url) {
            window.location.href = url;
          }
        },
        onClose: () => {
          if (isSupport) {
            window.speechSynthesis.cancel();
          } else {
            stopSound();
          }
        },
        style: { background: "#007bff", color: "#fff" },
        icon: <NotificationIcon />,
      });

      // 🌐 Browser notification
      if (Notification.permission === "granted") {
        const n = new Notification(title, {
          body,
          icon: "/favicon.png",
        });

        n.onclick = () => {
          window.focus();
          if (url) window.location.href = url;
        };
      }
    };

    setupForegroundMessageHandler((message) => {
      console.log("✅ Foreground:", message);
      showToast(message.data);
    });
  }, []);

  // Check --
  useEffect(() => {
    const LoginSubmit = async () => {
      const getUUID = localStorage.getItem("UUID");
      const device_id = localStorage.getItem("device_id");

      try {
        const response = await axiosInstance.post(
          "onLoad",
          {
            a_application_login_id: getUUID, // This is the payload you want to send
            device_id: device_id || "",
            platform: "web",
          },
          {
            headers: token
              ? {
                Authorization: `${token}`,
              }
              : {}, // Optional headers
          },
        );

        if (response.data.ack === 1) {
          const assignIdsString =
            response?.data?.data?.customer_support_ticket_ids ?? "";

          const assignIdsArray = assignIdsString
            .split(",")
            .map((id: any) => id.trim())
            .filter((id: any) => id !== "");

          const isAssignedToMe = assignIdsArray.includes(String(getUUID));
          useFeatureFlagStore.getState().setFlags({
            RAISE_SUPPORT_TICKET_FLAG: Number(
              response?.data?.data?.RAISE_SUPPORT_TICKET_FLAG ?? 2,
            ),
            SUPPORT_TICKET_INFO_MESSAGE:
              response?.data?.data?.SUPPORT_TICKET_INFO_MESSAGE ?? "",
            CUSTOMER_SUPPORT_TICKET_ASSING_ID: isAssignedToMe,
          });

          const company = response?.data?.data?.companyDetails;

          if (company) {
            useCompanyStore.getState().setCompanyInfo({
              company_id: company.id || 0,
              company_name: company.company_name || "",
              company_contact: company.company_contact || "",
              city_id: company.city_id || 0,
              city_name: company.city_name || "",
              address: company.address || "",
              state_id: company.state_id || 0,
              state_name: company.state_name || "",
              company_email: company.company_email || "",
              is_strict_check_product_stock:
                company.is_strict_check_product_stock,
            });
          }

          setCompanyData(response.data.data.item);
          setPermissions(response.data.data.resultRights);
          setAdvertisement(response.data.data.advertisement);

          const reviewStatus = response?.data?.data?.review;
          if (reviewStatus?.show && reviewStatus.show !== "none") {
            // Don't interrupt the app right on load — server tells us how
            // long to wait (REVIEW_PROMPT_DELAY_SECONDS env var).
            const delayMs = (reviewStatus.delaySeconds ?? DEFAULT_REVIEW_PROMPT_DELAY_MS / 1000) * 1000;
            setTimeout(() => {
              useReviewStore.getState().setStatus(reviewStatus);
            }, delayMs);
          }

          setFeatureEnabled(
            response?.data?.data?.MIRACLE_FLAG == 1 ? true : false,
          );

          setPlatformType(response?.data?.data?.WHATSAPP_PLATEFORM);

          LoginPin = response.data.data.PinNumber;
          if (response.data.data.PinNumber === 0) {
            const timer = setTimeout(() => {
              setShowPinSetModel(true);
            }, 10000);
            return () => clearTimeout(timer);
          }
        } else {
          toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
        } else {
          toast.error(error?.response?.data?.ack_msg);
        }
      }
    };
    if (token) {
      (async () => {
        await LoginSubmit();
        await fetchReminderCount(setReminderCount);
        await fetchLabelApis();
        await fetchSourceOfTypesApi();
        await fetchStageStatusContact();
        await fetchGetByIdUser(localId, setLoginById);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      })();
    }
  }, [setPermissions, token]);

  const listInnerRef = useRef<HTMLDivElement>(null);
  const { darkMode, toggleTheme } = useTheme();
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const labelDropdownRef = useRef<HTMLButtonElement>(null);
  const sourceDropdownRef = useRef<HTMLButtonElement>(null);
  const statusDropdownRef = useRef<HTMLButtonElement>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );

  const [isUnreadState, setIsUnreadState] = useState<number>(0);
  const [isPinnedState, setIsPinnedState] = useState<number>(0);
  const [isArchivState, setIsArchivState] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [labelDropdownOpen, setLabelDropdownOpen] = useState<any>(null);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isCreatecampaignsConfirmation, setIsCreatecampaignsConfirmation] =
    useState(false);
  const [issetShareId, setShareId] = useState<boolean>(false);
  const [isOpenFetchFromMiracleContact, setIsOpenFetchFromMiracleContact] =
    useState<boolean>(false);
  const [isPinConfirmation, setIsPinConfirmation] = useState<{
    show: boolean;
    type: "pin" | "unpin" | null;
  }>({
    show: false,
    type: null,
  });
  const [isReadUnreadConfirmation, setIsReadUnreadConfirmation] = useState<{
    show: boolean;
    type: "read" | "unread" | null;
  }>({
    show: false,
    type: null,
  });

  const [isArchiveConfirmation, setIsUnArchiveConfirmation] = useState<{
    show: boolean;
    type: "archive" | "unarchive" | null;
  }>({
    show: false,
    type: null,
  });

  const [isCRMDashBoardOpen, setIsCRMDashBoardOpen] = useState(false);
  const [isCreateContact, setIsCreateContact] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showStarred, setshowStarred] = useState(false);
  const [showSetting, setshowSetting] = useState(false);
  const [showNewChat, setshowNewChat] = useState(false);
  const [showDashBoard, setshowDashBoard] = useState(false);
  const [showAichat, setshowAichat] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [user, setUsers] = useState<IUserList[]>([]);
  const [user1, setUsers1] = useState(false);

  const [contInfo, setcontInfo] = useState<IUserList>();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hover, setHover] = useState(false);
  const [noDataFound, setNoDataFound] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [noDataFound1, setNoDataFound1] = useState(false);
  const [loginById, setLoginById] = useState<ILoginData>();
  const [isLoadContact, setIsLoadContact] = useState(true);
  const [refreshContact, setRefreshContact] = useState(false);
  const [isRefers, setIsRefers] = useState(true);
  // In LeftSide component
  const [hasOneData, setHasOneData] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number>();

  const [userAssignContactId, setUserAssignContactId] = useState<number>();
  const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
  const [contactCurrentStatus, setContactCurrentStatus] = useState<number>();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
    useState<boolean>(false);
  const [isModalChangeSourceTypeVisible, setIsModalChangeSourceTypeVisible] =
    useState<boolean>(false);
  const [contInfoEdit, setcontInfoEdit] = useState<IUserList>();

  const [isModalEditContactVisible, setIsModalEditContactVisible] =
    useState<boolean>(false);

  const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
    useState<boolean>(false);

  const [isModalExcelVisible, setIsModalExcelVisible] =
    useState<boolean>(false);
  const [isModalMap, setIsModalMap] = useState<boolean>(false);

  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [options, setOptions] = useState<any[]>([]);
  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
    [],
  );

  const [contactSelections, setContactSelections] = useState<
    Record<number, any[]>
  >({});
  const [showListAllInquiry, setShowListAllInquiry] = useState(false);
  const [showListAllReminder, setShowListAllReminder] = useState(false);

  const [showListCompany, setShowListCompany] = useState(false);
  const [showListMyCompany, setShowListMyCompany] = useState(false);
  const [showListnote, setShowListNote] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string | undefined>(
    "",
  );
  const [hasData, setHasData] = useState<boolean>(false);

  const [editorContentToEdit, setEditorContentToEdit] = useState<string>("");
  const [isOrderCreateFromContactShow, setIsOrderCreateFromContactShow] =
    useState(false);
  const [isOrderShowFromContactType, setIsOrderShowFromContactType] =
    useState(0);
  const [contactInfoOrder, setContactInfoOrder] = useState<IUserList>();
  const [companyLists, setCompanyLists] = useState<ICompany>();

  const [showCreateContact, setShowCreateContact] = useState(false);
  const [createContactTrigger, setCreateContactTrigger] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showCategory, setShowCategory] = useState(false);
  const [showProductGroup, setShowProductGroup] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showopenSourceOfType, setshowopenSourceOfType] = useState(false);
  const [label, setLabel] = useState(false);
  const [showopenStageStatus, setshowopenStageStatus] = useState(false);
  const [showExpenseType, setShowExpenseType] = useState(false);
  const [showVisitType, setShowVisitType] = useState(false);
  const [showLeaveType, setShowLeaveType] = useState(false);
  const [showVisits, setShowVisits] = useState(false);
  const [showcallhistory, setShowCallHistory] = useState(false);
  const [showDepartment, setShowDepartment] = useState(false);
  const [showOpenCustomInquiry, setShowOpenCustomInquiry] = useState(false);
  const [showWhatsappTemplate, setShowWhatsappTemplate] = useState(false);
  const [showOpenWorkFlow, setShowOpenWorkFlow] = useState(false);
  const [showOpenSetting, setShowOpenSetting] = useState(false);
  const [showTaskCategory, setShowTaskCategory] = useState(false);
  const [showTaskManagement, setShowTaskManagement] = useState(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [ShowSupportTicket, setShowSupportTicket] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showState, setShowState] = useState(false);
  const [showCity, setShowCity] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showWorkStation, setShowWorkStation] = useState(false);
  const [showJobCard, setShowJobCard] = useState(false);
  const [showTaskTemplate, setShowTaskTemplate] = useState(false);
  const [showProductUnit, setShowProductUnit] = useState(false);
  const [selectedButton, setSelectedButton] = useState<string>("all");
  const [showwarehouse, setShowwarehouse] = useState(false);
  const [showPaymentType, setShowPaymentType] = useState(false);
  const [showCompensationAdjustments, setShowCompensationAdjustments] =
    useState(false);
  const [showHolidayMaster, setShowHolidayMaster] = useState(false);
  const [showRoundOffMaster, setShowRoundOffMaster] = useState(false);
  const [showAdjustmentTypeMaster, setShowAdjustmentTypeMaster] =
    useState(false);
  const [showDayAdjustmentMaster, setShowDayAdjustmentMaster] = useState(false);
  const [showLockControl, setShowLockControl] = useState(false);
  const [showTaxMaster, setShowTaxMaster] = useState(false);
  const [showProcessAttendance, setShowProcessAttendance] = useState(false);
  const [showSalaryProcess, setShowSalaryProcess] = useState(false);
  const [showBillOfMaterials, setShowBillOfMaterials] = useState(false);
  const [showProcessMaster, setShowProcessMaster] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [labelLists, setLabelList] = useState<ILabelView[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);

  const [isSoruceDropdownOpen, setIsSoruceDropdownOpen] = useState(false);
  const [soruceLists, setSoruceList] = useState<ISourceOfTypes[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isStageStatusDropdownOpen, setIsStageStatusDropdownOpen] =
    useState(false);
  const [stageStatusLists, setStageStatusList] = useState<IStageStatusView[]>(
    [],
  );
  const [selectedStageStatusId, setSelectedStageStatusId] = useState<
    number | null
  >(null);

  const [totalNumberOfUnreadContact, setTotalNumberOfUnreadContact] =
    useState(0);
  const [contactAutoRefreshON, setContactAutoRefreshON] = useState("");
  const [contactAutoRefreshTimeout, setContactAutoRefreshTimeout] =
    useState("");
  const [
    contactAutoRefreshInactivityDelay,
    setContactAutoRefreshInactivityDelay,
  ] = useState("");

  const [totalContactCount, setTotalContactCount] = useState(0);
  const [focusedProductIndex, setFocusedProductIndex] = useState<number | null>(
    null,
  );
  const actionDropdownWrapperRef = useRef<HTMLDivElement>(null);
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const actionDropdownButtonRef = useRef<HTMLButtonElement>(null);

  // const productRefs = useRef<(HTMLDivElement | null)[]>([]);
  const productRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const parseTimeToMs = (timeString: string): number => {
    const trimmed = timeString.trim();
    const match = trimmed.match(/^(\d+)\s*s$/);
    if (match) {
      return parseInt(match[1]) * 1000;
    }
    return 3000;
  };

  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const autoRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const autoRefreshCountRef = useRef<number>(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const AUTO_REFRESH_ON = contactAutoRefreshON || false;
  const AUTO_REFRESH_TIMEOUT = parseTimeToMs(
    contactAutoRefreshTimeout || "1800s",
  );
  const INACTIVITY_DELAY = Number(contactAutoRefreshInactivityDelay) || 600000;

  const [locationFilterData, setLocationFilterData] =
    useState<IFilterLocationParams>({
      filterData: null,
      checkedOptions: null,
      checkedSourceTypes: null,
      startSearchDate: "",
      endSearchDate: "",
      checkedOptionsStageStatus: null,
      checkedOptionsUser: [],
      selectedCategoryId: null,
      selectedProductId: null,
      selectedActiveId: null,
      selectedDays: null,
      assignedByMultiTeamMember: [],
      createdByMultiTeamMember: [],
      labelwiseContactShowAndOrNot: 0,
      checkedOptionsContactassignOrNot: [],
    });

  const [selectedIds, setSelectedIds] = useState<any>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  const toggleSelection = (id: string | number) => {
    setSelectedIds((prev: any) =>
      prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id],
    );
  };
  const canEdit = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.EDIT);

  const canView = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.VIEW);

  const canAdd = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.ADD);

  const canDelete = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.DELETE,
  );

  const canExport = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.SHARE,
  );

  const canImport = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.IMPORT,
  );
  const canViewLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
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
  const canAddPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.ADD,
  );
  const canViewInq = useCheckUserPermission(
    PAGE_ID.INQUIRY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewDash = useCheckUserPermission(
    PAGE_ID.INSIGHT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewMsg = useCheckUserPermission(
    PAGE_ID.CONTACT_MESSAGE_HISTORY,
    PERMISSION_TYPE.VIEW,
  );
  const canAddAssignTeamMember = useCheckUserPermission(
    PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
    PERMISSION_TYPE.ADD,
  );
  const canViewThirdPArtyLeadGeneration = useCheckUserPermission(
    PAGE_ID.THIRD_PARTY_LEAD_GENERATION,
    PERMISSION_TYPE.ADD,
  );
  const canExportContact = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.SHARE,
  );
  const canStartWorkFlow = useCheckUserPermission(
    PAGE_ID.START_WORK_FLOW,
    PERMISSION_TYPE.ADD,
  );
  // const canADDIndiamart = useCheckUserPermission(
  //   PAGE_ID.INDIAMART_INTREGATION,
  //   PERMISSION_TYPE.ADD
  // );
  // const canADDTradeIndia = useCheckUserPermission(
  //   PAGE_ID.TRADINDIA_INTREGATION,
  //   PERMISSION_TYPE.ADD
  // );
  // const canADDGoogleSheet = useCheckUserPermission(
  //   PAGE_ID.GOOGLESHEET_INTREGATION,
  //   PERMISSION_TYPE.ADD
  // );
  const canViewSmartFilter = useCheckUserPermission(
    PAGE_ID.SMART_SEARCH_AND_FILTER,
    PERMISSION_TYPE.VIEW,
  );

  //escape to close import contact pop up;
  useEscapeKey(() => setIsModalExcelVisible(false));
  useEscapeKey(() => setIsCloseConfirmation(false));
  useEscapeKey(() => setshowDashBoard(false));
  useEscapeKey(() => setshowAichat(false));
  useEscapeKey(() => setShowListAllReminder(false));
  useEscapeKey(() => setDropdownOpen(false));
  useEscapeKey(() => setLabelDropdownOpen(null));
  useEscapeKey(() => setIsModalMap(false));
  useEscapeKey(() => setShowTaskManagement(false));
  useEscapeKey(() => setShowSupportTicket(false));
  useEscapeKey(() => setShowCountry(false));
  useEscapeKey(() => setShowState(false));
  useEscapeKey(() => setShowCity(false));
  useEscapeKey(() => setShowArea(false));
  useEscapeKey(() => setShowWorkStation(false));
  useEscapeKey(() => setShowJobCard(false));
  useEscapeKey(() => setSearchTermFromRightSide(""));

  // right side ma all masters open thay che e handle kre che
  const rightSideVIewProvider = async (refTo: string | undefined) => {
    let personalNote = false;
    let settings = false;
    let myCompany = false;
    let myTeam = false;
    let inquiry = false;
    let callhistory = false;
    let reminder = false;
    let productCategory = false;
    let productGroup = false;
    let product = false;
    let priceList = false;
    let source = false;
    let visits = false;
    let labels = false;
    let status = false;
    let expenseType = false;
    let visitType = false;
    let leaveType = false;
    let departments = false;
    let customFieldForm = false;
    let whatsAppTemplate = false;
    let workFlowAutomation = false;
    let notificationSettings = false;
    let taskCategory = false;
    let taskManagement = false;
    let routePlanner = false;
    let supportTicketManagement = false;
    let country = false;
    let state = false;
    let city = false;
    let area = false;
    let workStation = false;
    let taskTemplate = false;
    let productUnit = false;
    let warehouse = false;
    let paymentType = false;
    let compensationAdjustments = false;
    let HolidayMaster = false;
    let RoundOffMaster = false;
    let AdjustmentTypeMaster = false;
    let DayAdjustmentMaster = false;
    let LockControl = false;
    let TaxMaster = false;
    let billOfMaterials = false;
    let processMaster = false;
    let stockAdjustment = false;
    let processAttendance = false;
    let salaryProcess = false;
    let jobcard = false;

    switch (refTo) {
      case "inquiry":
        inquiry = true;
        break;
      case "reminder":
        reminder = true;
        break;
      case "personal_note":
        personalNote = true;
        break;
      case "settings":
        settings = true;
        break;
      case "myCompany":
        myCompany = true;
        break;
      case "productCategory":
        productCategory = true;
        break;
      case "productGroup":
        productGroup = true;
        break;
      case "product":
        product = true;
        break;
      case "priceList":
        priceList = true;
        break;

      case "source":
        source = true;
        break;
      case "labels":
        labels = true;
        break;
      case "status":
        status = true;
        break;
      case "expenseType":
        expenseType = true;
        break;
      case "expenseType":
        expenseType = true;
        break;
      case "visitType":
        visitType = true;
        break;
      case "leaveType":
        leaveType = true;
        break;
      case "visits":
        visits = true;
        break;
      case "departments":
        departments = true;
        break;
      case "customFieldForm":
        customFieldForm = true;
        break;
      case "whatsAppTemplate":
        whatsAppTemplate = true;
        break;
      case "workFlowAutomation":
        workFlowAutomation = true;
        break;
      case "notificationSettings":
        notificationSettings = true;
        break;
      case "taskCategory":
        taskCategory = true;
        break;
      case "paymentType":
        paymentType = true;
        break;
      case "compensationAdjustments":
        compensationAdjustments = true;
        break;
      case "HolidayMaster":
        HolidayMaster = true;
        break;
      case "RoundOffMaster":
        RoundOffMaster = true;
        break;
      case "AdjustmentTypeMaster":
        AdjustmentTypeMaster = true;
        break;
      case "DayAdjustmentMaster":
        DayAdjustmentMaster = true;
        break;
      case "LockControl":
        LockControl = true;
        break;
      case "TaxMaster":
        TaxMaster = true;
        break;
      case "processAttendance":
        processAttendance = true;
        break;
      case "salaryProcess":
        salaryProcess = true;
        break;
      case "billOfMaterials":
        billOfMaterials = true;
        break;
      case "processMaster":
        processMaster = true;
        break;
      case "taskTemplate":
        taskTemplate = true;
        break;
      case "productUnit":
        productUnit = true;
        break;
      case "routePlanner":
        routePlanner = true;
        break;
      case "task_Management":
        taskManagement = true;
        break;
      case "support_ticket_management":
        supportTicketManagement = true;
        break;
      case "callhistory":
        callhistory = true;
        break;
      case "country":
        country = true;
        break;
      case "state":
        state = true;
        break;
      case "city":
        city = true;
        break;
      case "area":
        area = true;
        break;
      case "workStation":
        workStation = true;
        break;
      case "jobcard":
        jobcard = true;
        break;
      case "warehouse":
        warehouse = true;
        break;
      case "stock_adjustment":
        stockAdjustment = true;
        break;
      case "myTeam":
        myTeam = true;
        try {
          await fetchCompanyKeyApi(setCompanyLists);
        } catch (error: any) {
          console.error("API error:", error);
        }
        break;
    }

    setShowListNote(personalNote);
    setshowSetting(settings);
    setShowListCompany(myCompany);
    setShowListMyCompany(myTeam);
    setShowListAllInquiry(inquiry);
    setShowCallHistory(callhistory);
    setShowListAllReminder(reminder);
    setShowCategory(productCategory);
    setShowProductGroup(productGroup);
    setShowProduct(product);
    setShowPriceList(priceList);
    setshowopenSourceOfType(source);
    setLabel(labels);
    setshowopenStageStatus(status);
    setShowExpenseType(expenseType);
    setShowVisitType(visitType);
    setShowLeaveType(leaveType);
    setShowVisits(visits);
    setShowDepartment(departments);
    setShowOpenCustomInquiry(customFieldForm);
    setShowWhatsappTemplate(whatsAppTemplate);
    setShowOpenWorkFlow(workFlowAutomation);
    setShowOpenSetting(notificationSettings);
    setShowTaskCategory(taskCategory);
    setShowRoutePlanner(routePlanner);
    setShowTaskManagement(taskManagement);
    setShowSupportTicket(supportTicketManagement);
    setShowCountry(country);
    setShowState(state);
    setShowCity(city);
    setShowArea(area);
    setShowWorkStation(workStation);
    setShowJobCard(jobcard);
    setShowTaskTemplate(taskTemplate);
    setShowProductUnit(productUnit);
    setShowwarehouse(warehouse);
    setShowPaymentType(paymentType);
    setShowCompensationAdjustments(compensationAdjustments);
    setShowHolidayMaster(HolidayMaster);
    setShowRoundOffMaster(RoundOffMaster);
    setShowAdjustmentTypeMaster(AdjustmentTypeMaster);
    setShowDayAdjustmentMaster(DayAdjustmentMaster);
    setShowLockControl(LockControl);
    setShowTaxMaster(TaxMaster);
    setShowProcessAttendance(processAttendance);
    setShowSalaryProcess(salaryProcess);
    setShowBillOfMaterials(billOfMaterials);
    setShowProcessMaster(processMaster);
    setShowStockAdjustment(stockAdjustment);
  };

  const { fetchTaskCategories } = useTaskCategoryStore();

  useEffect(() => {
    if (token) {
      fetchTaskCategories();
    }
  }, [token]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const result = await logOutApi(setIsCloseConfirmation);
    setIsLoggingOut(false);
    if (result.success) {
      localStorage.clear();
      handleRefresh();
    } else {
      toast.error(result.message || "Logout failed");
    }
  };
  const openGrp = () => {
    setShowGroup(true);
  };
  const openCompany = () => {
    setShowListCompany(true);
  };
  const openRightSide = (singleData: IUserList) => {
    if (canViewMsg) {
      setshowDashBoard(false);
      setShowRightSide(true);
      setshowAichat(false);
      setcontInfo(singleData);

      setEditorContentToEdit("");
      if (singleData.is_unread === 1) {
        updateIsUnRead(singleData.id, setIsRefers, 1);
        // Update local state immediately for better UX
        setUsers((prev) =>
          prev.map((task) =>
            task.id === singleData.id ? { ...task, is_unread: 0 } : task,
          ),
        );
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelExportExcel = async () => {
    if (canExportContact) {
      setShareId(true);
    } else {
      setShareId(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const fetchFromMiracle = async () => {
    if (canExportContact) {
      setIsOpenFetchFromMiracleContact(true);
    } else {
      setIsOpenFetchFromMiracleContact(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleExportClick = async () => {
    if (canExportContact) {
      await exportContact(
        searchTerm,
        filters.filterData,
        filters.checkedOptions,
        filters.checkedSourceTypes,
        filters.startSearchDate,
        filters.endSearchDate,
        filters.checkedOptionsStageStatus,
        filters.checkedOptionsUser,
        0,
        isUnreadState,
        selectedLabelId,
        selectedSourceId,
        selectedStageStatusId,
        applicationId ? applicationId?.toString() : undefined,
        0,
        filters.selectedActiveId,
        filters.selectedDays,
        filters.assignedByMultiTeamMember,
        filters.createdByMultiTeamMember,
        filters.labelwiseContactShowAndOrNot,
        filters.checkedOptionsContactassignOrNot,
        setShareId,
      );
    } else {
      setShareId(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (refreshContact) {
      fetchDataUser(
        0,
        searchTerm,
        setUsers,
        itemsPerPage,
        setNoDataFound,
        setLoading,
        token,
        localId,
        setContactId,
        setSelectedLabelIds,
        setCheckToken,
        filters.filterData,
        filters.checkedOptions,
        filters.checkedSourceTypes,
        filters.startSearchDate,
        filters.endSearchDate,
        filters.checkedOptionsStageStatus,
        filters.checkedOptionsUser,
        isPinnedState,
        isUnreadState,
        selectedLabelId,
        selectedSourceId,
        selectedStageStatusId,
        applicationId ? applicationId?.toString() : undefined,
        setTotalNumberOfUnreadContact,
        setTotalContactCount,
        isArchivState,
        filters.selectedActiveId,
        filters.selectedDays,
        filters.assignedByMultiTeamMember,
        filters.createdByMultiTeamMember,
        setContactAutoRefreshON,
        setContactAutoRefreshTimeout,
        setContactAutoRefreshInactivityDelay,
        filters.labelwiseContactShowAndOrNot,
        filters.checkedOptionsContactassignOrNot,
      );
    }
    setRefreshContact(false);
  }, [refreshContact]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
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

  const openSettings = () => {
    // setshowSetting(true);
    rightSideVIewProvider("settings");
  };

  // function openStatus() {
  //   setShowStatus(true);
  // }

  function SystemReload() {
    handleRefresh();
  }

  // const openForm = () => {
  //   setshowNewChat(true);
  // };
  // const openNotes = () => {
  //   setShowListNote(true);
  // };
  // const openMyCompany = async () => {
  //   await rightSideVIewProvider("myTeam");
  // };

  const itemsPerPage: number = ITEMS_PER_PAGE;

  const handelRefreshContacts = async () => {
    setIsAllSelected(false);
    setSelectedIds([]);
    // setSelectedButton("all");
    // setSelectedLabelId(null);
    // setSelectedSourceId(null);
    // setSelectedStageStatusId(null);
    try {
      setIsAutoRefreshing(false);
      if (canViewThirdPArtyLeadGeneration) {
        // fetchDataIndiaMart(/* setLoading */);
        // fetchDataFromTradeIndiaInquiry(/* setLoading */);
        // Call fetchGoogleSheetForFacebook third
        // fetchGoogleSheetForFacebook(/* setLoading */);
        // fetchDataFromTradeIndiaBUYLeads();
      }
      searchInputRef.current?.focus();
    } catch (error) {
      // console.error("Error refreshing contacts:", error);
    } finally {
      setRefreshContact(true);
    }
  };
  // const handelRefreshContactsWithAuto = async () => {
  //   setIsAllSelected(false);
  //   setSelectedIds([]);

  //   try {
  //     if (canViewThirdPArtyLeadGeneration) {
  //       // fetchDataIndiaMart();
  //       // fetchDataFromTradeIndiaInquiry();
  //       // fetchGoogleSheetForFacebook();
  //       // fetchDataFromTradeIndiaBUYLeads();
  //     }
  //     searchInputRef.current?.focus();
  //   } catch (error) {
  //     console.error("Error refreshing contacts:", error);
  //   } finally {
  //     // Pass all current filter parameters to maintain the filter state during auto-refresh
  //     fetchDataUser(
  //       0,
  //       searchTerm,
  //       setUsers,
  //       itemsPerPage,
  //       setNoDataFound,
  //       setLoading,
  //       token,
  //       localId,
  //       setContactId,
  //       setSelectedLabelIds,
  //       setCheckToken,
  //       filters.filterData,
  //       filters.checkedOptions,
  //       filters.checkedSourceTypes,
  //       filters.startSearchDate,
  //       filters.endSearchDate,
  //       filters.checkedOptionsStageStatus,
  //       filters.checkedOptionsUser,
  //       isPinnedState,
  //       isUnreadState,
  //       selectedLabelId,
  //       selectedSourceId,
  //       selectedStageStatusId,
  //       applicationId ? applicationId?.toString() : undefined,
  //       setTotalNumberOfUnreadContact,
  //       setTotalContactCount,
  //       isArchivState,
  //       filters.selectedActiveId,
  //       filters.selectedDays,
  //       filters.assignedByMultiTeamMember,
  //       filters.createdByMultiTeamMember,
  //       setContactAutoRefreshON,
  //       setContactAutoRefreshTimeout,
  //       setContactAutoRefreshInactivityDelay,
  //       filters.labelwiseContactShowAndOrNot
  //     );
  //     setCurrentPage(0);
  //   }
  // };

  useEffect(() => {
    fetchLabelApis();
    fetchSourceOfTypesApi();
    fetchStageStatusContact();
    fetchGetByIdUser(localId, setLoginById);
    setRefreshContact(true);
  }, [isCreateContact, isEditContact]);

  const startAutoRefreshTimer = useCallback(() => {
    if (AUTO_REFRESH_ON !== "true") {
      return;
    }

    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current);
    }

    autoRefreshTimeoutRef.current = setTimeout(() => {
      if (AUTO_REFRESH_ON === "true") {
        autoRefreshCountRef.current += 1;

        setIsAutoRefreshing(true);
        handelRefreshProductAuto();
      }
    }, AUTO_REFRESH_TIMEOUT);
  }, [AUTO_REFRESH_TIMEOUT, AUTO_REFRESH_ON]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current);
    }

    if (AUTO_REFRESH_ON === "true") {
      inactivityTimeoutRef.current = setTimeout(() => {
        startAutoRefreshTimer();
      }, INACTIVITY_DELAY);
    }
  }, [startAutoRefreshTimer, INACTIVITY_DELAY, AUTO_REFRESH_ON]);

  const handleUserActivity = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handelRefreshProductAuto = async () => {
    if (canView && AUTO_REFRESH_ON == "true") {
      setRefreshContact(true);
      setIsAutoRefreshing(true);
    }
    startAutoRefreshTimer();
  };

  useEffect(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current);
      autoRefreshTimeoutRef.current = null;
    }

    if (AUTO_REFRESH_ON === "true") {
      resetInactivityTimer();
    }

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
  }, [handleUserActivity, resetInactivityTimer, AUTO_REFRESH_ON]); // Add AUTO_REFRESH_ON here

  /* Contact get main ueseffect when page refresh */
  useEffect(() => {
    if (canView) {
      setTimeout(() => {
        setRefreshContact(true);
        setCurrentPage(0); // Reset page to 0 when search term changes
      }, 100);
    }

    setHasData(filters.isFilterApplied);

    if (filters) {
      filtersRef.current = filters;
    }
  }, [canView, filters]);
  /* Contact get main ueseffect when page refresh */

  useEffect(() => {
    if (noDataFound1) {
      handleLogout();
    }
    if (isModalVisible) {
      fetchLabelApi(setOptions, setLoading);
    }
    if (isModalAssignUserVisible) {
      fetchAllCompanyApi(setOptionJoinCompany);
      fetchDepartmentsApi(setDepartments);
    }
    if (isModalAssignStatusVisible) {
      fetchStageStatusApi(setOptionRadioButtonStatus, contactCurrentStatus);
    } else {
      setOptionRadioButtonStatus([]);
      setContactCurrentStatus(0);
    }
  }, [
    noDataFound1,
    isModalVisible,
    isModalAssignUserVisible,
    isModalAssignStatusVisible,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      const currentFilters = filtersRef.current;
      if (listInnerRef.current) {
        const { scrollTop, clientHeight, scrollHeight } = listInnerRef.current;

        // Use a threshold of 5px to account for rounding issues
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 5;

        if (isNearBottom && user.length >= (currentPage + 1) * itemsPerPage) {
          fetchDataUser(
            currentPage + 1,
            searchTerm,
            setUsers,
            itemsPerPage,
            setNoDataFound,
            setLoading,
            token,
            localId,
            setContactId,
            setSelectedLabelIds,
            setCheckToken,
            currentFilters.filterData,
            currentFilters.checkedOptions,
            currentFilters.checkedSourceTypes,
            currentFilters.startSearchDate,
            currentFilters.endSearchDate,
            currentFilters.checkedOptionsStageStatus,
            currentFilters.checkedOptionsUser,
            isPinnedState,
            isUnreadState,
            selectedLabelId,
            selectedSourceId,
            selectedStageStatusId,
            applicationId ? applicationId?.toString() : undefined,
            setTotalNumberOfUnreadContact,
            setTotalContactCount,
            isArchivState,
            currentFilters.selectedActiveId,
            currentFilters.selectedDays,
            currentFilters.assignedByMultiTeamMember,
            currentFilters.createdByMultiTeamMember,
            setContactAutoRefreshON,
            setContactAutoRefreshTimeout,
            setContactAutoRefreshInactivityDelay,
            currentFilters.labelwiseContactShowAndOrNot,
            currentFilters.checkedOptionsContactassignOrNot,
          );

          setCurrentPage((prevPage) => prevPage + 1);
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
  }, [
    user.length,
    currentPage,
    showSetting,
    showListAllInquiry,
    showListCompany,
    showListMyCompany,
    showListnote,
  ]);

  // Check --
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setLabelDropdownOpen(null);
        setHasOneData(null);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const [checkboxesVisible, setIsCheckboxesVisible] = useState(
    selectedIds.length > 0 || isAllSelected,
  );

  // Add this useEffect to calculate header height dynamically
  useEffect(() => {
    const calculateHeight = () => {
      const headerElement = document.querySelector(".header") as HTMLElement;
      const searchBarElement = document.querySelector(
        ".search-bar",
      ) as HTMLElement;
      const filterButtonsElement = document.querySelector(
        ".pb-2",
      ) as HTMLElement;

      if (headerElement && searchBarElement && filterButtonsElement) {
        const totalHeaderHeight =
          headerElement.offsetHeight +
          searchBarElement.offsetHeight +
          filterButtonsElement.offsetHeight +
          60; // extra padding/margin

        document.documentElement.style.setProperty(
          "--header-total-height",
          `${totalHeaderHeight}px`,
        );
      }
    };

    calculateHeight();

    // Recalculate on window resize
    window.addEventListener("resize", calculateHeight);

    // Recalculate when dependencies change (after DOM updates)
    const timeoutId = setTimeout(calculateHeight, 100);

    return () => {
      window.removeEventListener("resize", calculateHeight);
      clearTimeout(timeoutId);
    };
  }, [
    labelLists.length,
    soruceLists.length,
    stageStatusLists.length,
    selectedIds.length,
    isAllSelected,
    selectedButton,
    checkboxesVisible,
    isLabelDropdownOpen,
    isSoruceDropdownOpen,
    isStageStatusDropdownOpen,
  ]);

  // Handler for search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ?? ""; // safe fallback
    setSearchTerm(value);

    // SAFE: handles null, undefined, empty, and spaces
    if (!value || value.trim() === "") {
      setRefreshContact(true);
      return;
    }

    if (value.length >= 2) {
      if (searchTimeout) clearTimeout(searchTimeout);

      setSearchTimeout(
        setTimeout(() => {
          fetchDataUser(
            0,
            value,
            setUsers,
            itemsPerPage,
            setNoDataFound,
            setLoading,
            token,
            localId,
            setContactId,
            setSelectedLabelIds,
            setCheckToken,
            filters.filterData,
            filters.checkedOptions,
            filters.checkedSourceTypes,
            filters.startSearchDate,
            filters.endSearchDate,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
            isPinnedState,
            isUnreadState,
            selectedLabelId,
            selectedSourceId,
            selectedStageStatusId,
            applicationId?.toString(),
            setTotalNumberOfUnreadContact,
            setTotalContactCount,
            -1,
            filters.selectedActiveId,
            filters.selectedDays,
            filters.assignedByMultiTeamMember,
            filters.createdByMultiTeamMember,
            setContactAutoRefreshON,
            setContactAutoRefreshTimeout,
            setContactAutoRefreshInactivityDelay,
            filters.labelwiseContactShowAndOrNot,
            filters.checkedOptionsContactassignOrNot,
          );

          setCurrentPage(0);
        }, 800),
      );
    }
  };

  const handleModalOpen = (id?: number | undefined) => {
    if (canViewLabel) {
      if (id) {
        setContactId(id);
      }
      setIsModalVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalOpenUserAssign = (id?: number | undefined) => {
    if (canAddAssignTeamMember) {
      if (id) {
        setUserAssignContactId(id);
      }
      setIsModalAssignUserVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalOpenStatusAssign = (
    id?: number | undefined,
    currentStatus?: number | undefined,
  ) => {
    if (canViewStatus) {
      if (id) {
        setStatusAssignContactId(id);
      }

      if (currentStatus) {
        setContactCurrentStatus(currentStatus);
      }
      setIsModalAssignStatusVisible(true);
    } else {
      setIsModalAssignStatusVisible(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // const [isNoLabelSelected, setIsNoLabelSelected] = useState(false);
  // const [hasShownNoLabelModal, setHasShownNoLabelModal] = useState(false);

  const handleConfirm = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {
    let appliedTo: number | string | undefined | number[];
    if (isAllSelected) {
      // when check all button click
      appliedTo = "all";
    } else if (selectedIds.length > 0) {
      // when some data will checked
      appliedTo = selectedIds;
    } else if (contactId) {
      // particular data event fire
      appliedTo = contactId;
    }

    try {
      setRefreshContact(false);
      await updateBulkSelectionActionPerformInContact(
        setLoading,
        {
          ...filters,
          statusFilter: filters.checkedOptionsStageStatus,
          startDate: filters.startSearchDate,
          endDate: filters.endSearchDate,
          sourceTypeFilter: filters.checkedSourceTypes,
          labelFilter: filters.checkedOptions,
          searchTerm,
          isPin: isPinnedState,
          isUnread: isUnreadState,
          labelId: selectedLabelId,
          sourceId: selectedSourceId,
          stageStatusId: selectedStageStatusId,
          isPinByApplicationId: applicationId
            ? applicationId?.toString()
            : undefined,
          isArchive: isArchivState,
        },
        checkedOptions,
        appliedTo,
        "label_assignmet",
      );

      setTimeout(() => {
        setRefreshContact(true);
        setCurrentPage(0);
      }, 100);

      setIsModalVisible(false);
      setIsAllSelected(false);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error in handleConfirm:", error);
      setLoading(false);
    }
  };
  const handleModalClose = () => {
    if (isModalVisible) {
      setSelectedLabelIds(undefined);
      setIsModalVisible(false);
    } else {
      setSelectedLabelIds(undefined);
      setIsModalFilterVisible(false);
      // setIsNoLabelSelected(false);
      // setHasShownNoLabelModal(false);
    }
  };
  // const handleConfirmationOk = () => {
  //   setIsNoLabelSelected(false);
  // };

  // // Handle Cancel button in ConfirmationModal
  // const handleConfirmationCancel = () => {
  //   setIsNoLabelSelected(false);
  // };
  const handleConfirmRadioButton = async (checkedOptions: any[]) => {
    let appliedTo: number | string | undefined | number[];
    if (isAllSelected) {
      // when check all button click
      appliedTo = "all";
    } else if (selectedIds.length > 0) {
      // when some data will checked
      appliedTo = selectedIds;
    } else if (statusAssignContactId) {
      appliedTo = statusAssignContactId;
    } else {
      return;
    }

    setRefreshContact(false);
    await updateBulkSelectionActionPerformInContact(
      setLoading,
      {
        ...filters,
        statusFilter: filters.checkedOptionsStageStatus,
        startDate: filters.startSearchDate,
        endDate: filters.endSearchDate,
        sourceTypeFilter: filters.checkedSourceTypes,
        labelFilter: filters.checkedOptions,
        searchTerm,
        isPin: isPinnedState,
        isUnread: isUnreadState,
        labelId: selectedLabelId,
        sourceId: selectedSourceId,
        stageStatusId: selectedStageStatusId,
        isPinByApplicationId: applicationId
          ? applicationId?.toString()
          : undefined,
        isArchive: isArchivState,
      },
      checkedOptions,
      appliedTo,
      "status_assignment",
    );
    setTimeout(() => {
      setRefreshContact(true);
      setCurrentPage(0); // Reset page to 0 when search term changes
    }, 100);

    setLabelDropdownOpen(null);

    setIsModalAssignStatusVisible(false);
    setIsAllSelected(false);
    setSelectedIds([]);
  };
  const handleConfirmChangeSourceType = async (checkedOptions: any[]) => {
    let appliedTo: number | string | undefined | number[];
    if (isAllSelected) {
      // when check all button click
      appliedTo = "all";
    } else if (selectedIds.length > 0) {
      // when some data will checked
      appliedTo = selectedIds;
    } else {
      return;
    }

    setRefreshContact(false);
    await updateBulkSelectionActionPerformInContact(
      setLoading,
      {
        ...filters,
        statusFilter: filters.checkedOptionsStageStatus,
        startDate: filters.startSearchDate,
        endDate: filters.endSearchDate,
        sourceTypeFilter: filters.checkedSourceTypes,
        labelFilter: filters.checkedOptions,
        searchTerm,
        isPin: isPinnedState,
        isUnread: isUnreadState,
        labelId: selectedLabelId,
        sourceId: selectedSourceId,
        stageStatusId: selectedStageStatusId,
        isPinByApplicationId: applicationId
          ? applicationId?.toString()
          : undefined,
        isArchive: isArchivState,
      },
      checkedOptions,
      appliedTo,
      "source_assignement",
    );
    setTimeout(() => {
      setRefreshContact(true);
      setCurrentPage(0); // Reset page to 0 when search term changes
    }, 100);

    setLabelDropdownOpen(null);

    setIsModalChangeSourceTypeVisible(false);
    setIsAllSelected(false);
    setSelectedIds([]);
  };

  const handleConfirmAssignUser = async (
    contactId: number | undefined,
    checkedOptions: any[],
    isOverrideExistingContactCheckbox?: boolean,
  ) => {
    let appliedTo: number | string | undefined | number[];
    if (isAllSelected) {
      // when check all button click
      appliedTo = "all";
    } else if (selectedIds.length > 0) {
      // when some data will checked
      appliedTo = selectedIds;
    } else if (userAssignContactId) {
      // particular data event fire
      appliedTo = userAssignContactId;
    }

    await updateBulkSelectionActionPerformInContact(
      setLoading,
      {
        ...filters,
        statusFilter: filters.checkedOptionsStageStatus,
        startDate: filters.startSearchDate,
        endDate: filters.endSearchDate,
        sourceTypeFilter: filters.checkedSourceTypes,
        labelFilter: filters.checkedOptions,
        searchTerm,
        isPin: isPinnedState,
        isUnread: isUnreadState,
        labelId: selectedLabelId,
        sourceId: selectedSourceId,
        stageStatusId: selectedStageStatusId,
        isPinByApplicationId: applicationId
          ? applicationId?.toString()
          : undefined,
        isArchive: isArchivState,
        isOverrideExistingContactCheckbox: isOverrideExistingContactCheckbox,
      },
      checkedOptions,
      appliedTo,
      "team_assignment",
    );

    setTimeout(() => {
      setRefreshContact(true);
      setCurrentPage(0);
    }, 100);

    setLabelDropdownOpen(null);

    setIsModalAssignUserVisible(false);
    setIsAllSelected(false);
    setSelectedIds([]);
  };
  const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
    const {
      filterData,
      checkedOptionsLabel: checkedOptions,
      checkedOptionsSourceType: checkedSourceTypes,
      endSearchDate,
      startSearchDate,
      checkedOptionsStageStatus,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      checkedOptionsUser,
      selectedCategoryId,
      selectedProductId,
      selectedActiveId,
      selectedDays,
      labelAndOr: labelwiseContactShowAndOrNot,
      checkedOptionsContactassignOrNot,
    } = filterPayload;
    // Set location filter data as well
    setLocationFilterData({
      filterData: filterData ?? null,
      checkedOptions: checkedOptions ?? null,
      checkedSourceTypes: checkedSourceTypes ?? null,
      startSearchDate,
      endSearchDate,
      checkedOptionsStageStatus: checkedOptionsStageStatus ?? null,
      checkedOptionsUser: checkedOptionsUser ?? [],
      selectedCategoryId,
      selectedProductId,
      selectedActiveId,
      selectedDays: selectedDays ?? null,
      assignedByMultiTeamMember: assignedByMultiTeamMember ?? [],
      createdByMultiTeamMember: createdByMultiTeamMember ?? [],
      labelwiseContactShowAndOrNot: labelwiseContactShowAndOrNot ?? 0,
      checkedOptionsContactassignOrNot: checkedOptionsContactassignOrNot || [],
    });

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
      (checkedOptionsStageStatus?.length ?? 0) > 0 ||
      (checkedOptionsUser?.length ?? 0) > 0 ||
      (assignedByMultiTeamMember?.length ?? 0) > 0 ||
      (createdByMultiTeamMember?.length ?? 0) > 0 ||
      Boolean(labelwiseContactShowAndOrNot) ||
      (checkedOptionsContactassignOrNot?.length ?? 0) > 0;

    setHasData(isFilterApplied);

    const newStartDate =
      startSearchDate instanceof DateObject
        ? startSearchDate.format("YYYY-MM-DD")
        : startSearchDate;
    const newEndDate =
      endSearchDate instanceof DateObject
        ? endSearchDate.format("YYYY-MM-DD")
        : endSearchDate;
    setSearchTerm("");
    setIsUnreadState(0);
    setSelectedSourceId(0);
    setSelectedStageStatusId(0);
    setSelectedLabelIds(undefined);
    handleClearLabel();
    handleClearSource();
    handleClearStageStatus();
    setSelectedButton("all");

    /* Set Filter Hooks */
    setFilters({
      searchTerm: "",
      filterData,
      checkedOptions: checkedOptions ?? [],
      checkedSourceTypes: checkedSourceTypes ?? [],
      startSearchDate,
      endSearchDate,
      checkedOptionsStageStatus: checkedOptionsStageStatus ?? [],
      checkedOptionsUser: checkedOptionsUser ?? [],
      selectedCategoryId,
      selectedProductId,
      selectedActiveId,
      selectedDays,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      isFilterApplied,
      labelwiseContactShowAndOrNot: labelwiseContactShowAndOrNot ?? 0,
      checkedOptionsContactassignOrNot: checkedOptionsContactassignOrNot ?? [],
    });
    /* Set Filter Hooks */

    setIsModalFilterVisible(false);
  };

  // const getSelectedOptionsForContact = (contactId: number | undefined) => {
  //   return contactId ? contactSelections[contactId] || [] : [];
  // };
  // const getSelectedOptionsForContactFilter = (
  //   contactId: number | undefined
  // ) => {
  //   return contactId ? contactSelections[contactId] || [] : [];
  // };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if clicked on individual contact dropdown button
    const clickedOnButton = target.closest(".icon-more");
    if (clickedOnButton) return;

    // Check if clicked inside individual contact dropdown
    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    // Check if clicked on action dropdown button or inside action dropdown
    const clickedInsideActionDropdown =
      (actionDropdownRef.current &&
        actionDropdownRef.current.contains(target)) ||
      (actionDropdownButtonRef.current &&
        actionDropdownButtonRef.current.contains(target));

    if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
      setLabelDropdownOpen(null);
      setHasOneData(null);
      setIsActionDropdownOpen(false);
    }
  };

  // Check --
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check --
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLabelDropdownOpen(null);
        setHasOneData(null);
        setIsActionDropdownOpen(false); // Add this line
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const handleConfirmImportExcel = async () => {
    setIsModalExcelVisible(false);
    setRefreshContact(true);
  };

  const columns = [
    "ID",
    "Contact Person",
    "Email Id",
    "Mobile Number",
    "Country Name",
    "State Name",
    "City Name",
    "Area Name",
    "Address",
    "Shipping Address",
    "GST Number",
    "Source Name",
    "Status/Stage",
    "Label Name",
    "Create Date Time",
  ];

  // Prepare the data for export
  const prepareExportData = user.map((item) => ({
    ID: item.id,
    "Contact Person": item.person_name || "",
    "Email Id": item.email_id || "",
    "Mobile Number": item.mobile_number || "",
    "Country Name": item.country_name || "",
    "State Name": item.state_name || "",
    "City Name": item.city_name || "",
    "Area Name": item.area_name || "",
    Address: item.address || "",
    "Shipping Address": item.shipping_address || "",
    "GST Number": item.gst_number || "",
    "Source Name": item.source_name || "",
    "Status/Stage": item.stage_status_name || "",
    "Label Name": item.label_name || "",
    "Create Date Time": item.created_date_time || "",
  }));

  // const handleExportClick = () => {
  //   ExcelExport({
  //     data: prepareExportData,
  //     columns: columns,
  //     fileName: "contact_",
  //   });
  //   setShareId(false);
  // };
  // const openExport = () => {
  //   if (canExport) {
  //     setShareId(true);
  //   } else {
  //     setShareId(false);
  //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //   }
  // };

  const openFilterLabel = () => {
    if (canViewSmartFilter) {
      setIsModalFilterVisible(true);
    } else {
      setIsModalFilterVisible(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleChangeAddContact = () => {
    if (canAdd) {
      setIsCreateContact(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      setIsCreateContact(false);
    }
  };
  const handleModalOpenEditContact = (singleData: IUserList) => {
    // setShowRightSide(true);
    if (canEdit) {
      setcontInfoEdit(singleData);
      setIsModalEditContactVisible(true);
      resetRightSideView();
    } else {
      setIsModalEditContactVisible(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleAddFromImport = () => {
    if (canImport) {
      setIsModalExcelVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewMap = () => {
    if (canView) {
      setIsModalMap(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleDashboardOpen = () => {
    if (canView) {
      setIsCRMDashBoardOpen(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  function openDashBoard() {
    if (canViewDash) {
      setshowDashBoard(true);
    } else {
      setshowDashBoard(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  // function openAiModel() {
  //   if (canViewDash) {
  //     setshowAichat(true);
  //   } else {
  //     setshowAichat(false);
  //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //   }
  // }
  function openDeleteModel(id?: number) {
    if (canDelete) {
      if (id) {
        setContactId(id);
      }
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openPinModel(id: number) {
    if (canView) {
      setContactId(id);
      setIsPinConfirmation({ show: true, type: "pin" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openUnPinModel(id: number) {
    if (canView) {
      setContactId(id);
      setIsPinConfirmation({ show: true, type: "unpin" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function openReadModel(id?: number) {
    if (canView) {
      setContactId(id);
      setIsReadUnreadConfirmation({ show: true, type: "read" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openUnreadModel(id?: number) {
    if (canView) {
      setContactId(id);
      setIsReadUnreadConfirmation({ show: true, type: "unread" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openCreateCampaign() {
    if (canView) {
      setIsCreatecampaignsConfirmation(true);
    } else {
      setIsCreatecampaignsConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openArchiveModel(id?: number) {
    if (canView) {
      if (id) {
        setContactId(id);
      }
      setIsUnArchiveConfirmation({
        show: true,
        type: isArchivState ? "unarchive" : "archive",
      });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openUnArchiveModel(id: number) {
    if (canView) {
      setContactId(id);
      setIsUnArchiveConfirmation({ show: true, type: "unarchive" });
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const [resetRightSideTrigger, setResetRightSideTrigger] = useState(0);
  const resetRightSideView = () => {
    setShowRightSide(false);
    setShowVisits(false);
    setIsCreateContact(false);
    setshowDashBoard(false);
    setshowAichat(false);
    setShowCallHistory(false);

    // This will tell RightView to reset itself
    setResetRightSideTrigger((prev) => prev + 1);
  };

  const handelDeleteContact = async () => {
    if (
      await deleteContactApi(selectedIds.length > 0 ? selectedIds : contactId)
    ) {
      resetRightSideView();
      setRefreshContact(true);
    }
    setIsDeleteConfirmation(false);
    setIsAllSelected(false);
    setSelectedIds([]);
  };

  const handelPinContact = async () => {
    if (isPinConfirmation.type === "pin") {
      if (await pinContactApi(contactId, 1)) {
        setIsPinConfirmation({ show: false, type: "pin" });
        setRefreshContact(true);
      }
    } else if (isPinConfirmation.type === "unpin") {
      if (await pinContactApi(contactId, 2)) {
        setIsPinConfirmation({ show: false, type: null }); // Close modal after action
        setRefreshContact(true);
      }
    }
    setIsPinConfirmation({ show: false, type: null }); // Close modal after action
  };

  const handelArchiveContact = async () => {
    if (isArchiveConfirmation.type === "archive") {
      if (
        await archiveUnArchiveContactApi(
          selectedIds.length > 0 ? selectedIds : contactId,
          1,
        )
      ) {
        // 1 => archive
        setIsUnArchiveConfirmation({ show: false, type: "archive" });
        setRefreshContact(true);
        setDropdownOpen(false);
        setLabelDropdownOpen(null);
      }
    } else if (isArchiveConfirmation.type === "unarchive") {
      if (
        await archiveUnArchiveContactApi(
          selectedIds.length > 0 ? selectedIds : contactId,
          0,
        )
      ) {
        // 0 => unarchive
        setIsUnArchiveConfirmation({ show: false, type: "unarchive" });
        setRefreshContact(true);
      }
      setDropdownOpen(false);
      setLabelDropdownOpen(null);
    }
    setIsUnArchiveConfirmation({ show: false, type: "unarchive" });
    setSelectedIds([]);
  };

  const handelReadUnreadContact = async () => {
    setRefreshContact(false);
    let appliedTo: number | string | undefined | number[];
    if (isAllSelected) {
      // when check all button click
      appliedTo = "all";
    } else if (selectedIds.length > 0 && !contactId) {
      // when some data will checked
      appliedTo = selectedIds;
    } else if (contactId) {
      // particular data event fire
      appliedTo = contactId;
    }
    if (isReadUnreadConfirmation.type === "read") {
      const response = await updateBulkSelectionActionPerformInContact(
        setLoading,
        {
          ...filters,
          statusFilter: filters.checkedOptionsStageStatus,
          startDate: filters.startSearchDate,
          endDate: filters.endSearchDate,
          sourceTypeFilter: filters.checkedSourceTypes,
          labelFilter: filters.checkedOptions,
          searchTerm,
          isPin: isPinnedState,
          isUnread: isUnreadState,
          labelId: selectedLabelId,
          sourceId: selectedSourceId,
          stageStatusId: selectedStageStatusId,
          isPinByApplicationId: applicationId
            ? applicationId?.toString()
            : undefined,
          isArchive: isArchivState,
        },
        "0",
        appliedTo,
        "readunread_contact",
      );
      if (response) {
        // 0 => Read
        setIsReadUnreadConfirmation({ show: false, type: "read" });
        setRefreshContact(true);
      }
    } else if (isReadUnreadConfirmation.type === "unread") {
      const response = await updateBulkSelectionActionPerformInContact(
        setLoading,
        {
          ...filters,
          statusFilter: filters.checkedOptionsStageStatus,
          startDate: filters.startSearchDate,
          endDate: filters.endSearchDate,
          sourceTypeFilter: filters.checkedSourceTypes,
          labelFilter: filters.checkedOptions,
          searchTerm,
          isPin: isPinnedState,
          isUnread: isUnreadState,
          labelId: selectedLabelId,
          sourceId: selectedSourceId,
          stageStatusId: selectedStageStatusId,
          isPinByApplicationId: applicationId
            ? applicationId?.toString()
            : undefined,
          isArchive: isArchivState,
        },
        "1",
        appliedTo,
        "readunread_contact",
      );
      if (response) {
        // 1 => Unread
        setIsReadUnreadConfirmation({ show: false, type: "unread" });
        setRefreshContact(true);
      }
    }
    setLabelDropdownOpen(null);
    setIsReadUnreadConfirmation({ show: false, type: "unread" });
  };

  // When action dropdown opens, close others
  const toggleActionDropdown = () => {
    setIsActionDropdownOpen((prev) => !prev);
    if (!isActionDropdownOpen) {
      setLabelDropdownOpen(null);
      setHasOneData(null);
      setIsLabelDropdownOpen(false);
      setIsSoruceDropdownOpen(false);
      setIsStageStatusDropdownOpen(false);
    }
  };

  // Update label dropdown
  const DropdownLabelForContact = () => {
    if (labelLists.length === 0) return;
    setIsLabelDropdownOpen(!isLabelDropdownOpen);
    setSelectedButton("label");
    setIsSoruceDropdownOpen(false);
    setIsStageStatusDropdownOpen(false);
    setIsActionDropdownOpen(false); // Add this
    setLabelDropdownOpen(null); // Add this
    setHasOneData(null); // Add this
    handleClearSource();
    handleClearStageStatus();
  };

  // Update source dropdown
  const DropdownSoruceForContact = () => {
    setIsSoruceDropdownOpen(!isSoruceDropdownOpen);
    setSelectedButton("source");
    setIsLabelDropdownOpen(false);
    setIsStageStatusDropdownOpen(false);
    setIsActionDropdownOpen(false); // Add this
    setLabelDropdownOpen(null); // Add this
    setHasOneData(null); // Add this
    handleClearLabel();
    handleClearStageStatus();
  };

  // Update status dropdown
  const DropdownStageStatusForContact = () => {
    setIsStageStatusDropdownOpen(!isStageStatusDropdownOpen);
    setSelectedButton("status");
    setIsLabelDropdownOpen(false);
    setIsSoruceDropdownOpen(false);
    setIsActionDropdownOpen(false); // Add this
    setLabelDropdownOpen(null); // Add this
    setHasOneData(null); // Add this
    handleClearLabel();
    handleClearSource();
  };

  const handleClearLabel = () => {
    setSelectedLabelId(null);
    setIsLabelDropdownOpen(false);
  };
  const selectedLabel = labelLists?.find(
    (label) => label.id === selectedLabelId,
  );

  const handleClearSource = () => {
    setSelectedSourceId(null);
    setIsSoruceDropdownOpen(false);
  };
  const selectedSource = soruceLists?.find(
    (source) => source.id === selectedSourceId,
  );
  const handleClearStageStatus = () => {
    setSelectedStageStatusId(null);
    setIsStageStatusDropdownOpen(false);
  };
  const selectedStageStatus = stageStatusLists?.find(
    (stageStatus) => stageStatus.id === selectedStageStatusId,
  );

  const handleLabelSelect = (labelId: number) => {
    setSelectedLabelId(labelId);
    setIsLabelDropdownOpen(false);
    setRefreshContact(true);
    setIsUnreadState(0);
    setSelectedSourceId(0);
    setSelectedStageStatusId(0);
  };

  const handleSourceSelect = (sourceId: number) => {
    setSelectedSourceId(sourceId);
    setIsSoruceDropdownOpen(false);
    setRefreshContact(true);
    setIsUnreadState(0);
    setSelectedLabelIds(undefined);
    setSelectedStageStatusId(0);
  };

  const handleStageStatusSelect = (stageStatusId: number) => {
    setSelectedStageStatusId(stageStatusId);
    setIsStageStatusDropdownOpen(false);
    setRefreshContact(true);
    setIsUnreadState(0);
    setSelectedSourceId(0);
    setSelectedLabelIds(undefined);
  };

  // Check --
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        labelDropdownRef.current &&
        !labelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLabelDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Check --
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        sourceDropdownRef.current &&
        !sourceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSoruceDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Check --
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStageStatusDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const fetchLabelApis = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "lable_masters",
      columns: "id,lable_name,color",
      // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
      where: ["isDelete=0"],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };
    try {
      const data = await axiosInstance.post("commonGet", requestData);
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLabelList([]);
      }
      setLabelList(data.data.data);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const fetchStageStatusContact = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      status_type: "1",
      a_application_login_id: getUUID,
      action_flag: "view",
    };
    try {
      const data = await axiosInstance.post("get-status", requestData);
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setStageStatusList([]);
      }
      setStageStatusList(data.data.data);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const fetchSourceOfTypesApi = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    const requestData = {
      a_application_login_id: getUUID,
    };
    try {
      const data = await axiosInstance.post("sourceOfTypes", requestData);
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setSoruceList([]);
      }
      setSoruceList(data.data.data.item);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleButtonClick = (buttonType: string) => {
    setLabelDropdownOpen(null);
    setHasOneData(null);

    setSelectedButton(buttonType);
    setIsUnreadState(buttonType === "unread" ? 1 : 0);
    setIsPinnedState(buttonType === "pinned" ? 1 : 0);
    setIsArchivState(buttonType === "archive" ? 1 : 0);
    if (buttonType === "archive") {
      setDropdownOpen(false);
      setLabelDropdownOpen(null);
    }
    handleClearLabel();
    handleClearSource();
    handleClearStageStatus();
    setRefreshContact(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === SHORT_KEY.CREATE_CONTACT
    ) {
      e.preventDefault();
      setShowCreateContact(true);
      setCreateContactTrigger((prev) => prev + 1);
    } else if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === SHORT_KEY.ALL_INQUIRY_LIST
    ) {
      e.preventDefault();
      // setShowListAllInquiry(true);
      rightSideVIewProvider("inquiry");
    } else if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === SHORT_KEY.DASHBOARD
    ) {
      e.preventDefault();
      openDashBoard();
      setshowDashBoard(true);
    } else if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === SHORT_KEY.FILTER
    ) {
      e.preventDefault();
      openFilterLabel();
      setIsModalFilterVisible(true);
    } else if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === SHORT_KEY.REMINDER
    ) {
      e.preventDefault();
      // setShowListAllReminder(true);
      rightSideVIewProvider("reminder");
    } else if (e.key === "ArrowDown" && user && user.length > 0) {
      e.preventDefault();
      setFocusedProductIndex(0);
      setTimeout(() => {
        productRefs.current[0]?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    const handleProductNavigation = (e: KeyboardEvent) => {
      if (focusedProductIndex !== null && user && user.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedProductIndex((prev) =>
            prev !== null && prev < user.length - 1 ? prev + 1 : prev,
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedProductIndex((prev) => {
            if (prev !== null && prev > 0) {
              return prev - 1;
            } else if (prev === 0) {
              searchInputRef.current?.focus();
              return null;
            }
            return prev;
          });
        }
      }
    };

    if (
      focusedProductIndex !== null &&
      productRefs.current[focusedProductIndex]
    ) {
      productRefs.current[focusedProductIndex]?.focus();
    }

    window.addEventListener("keydown", handleProductNavigation);
    return () => window.removeEventListener("keydown", handleProductNavigation);
  }, [focusedProductIndex, user]);

  useEffect(() => {
    if (createContactTrigger > 1) {
      handleChangeAddContact();
    }
  }, [createContactTrigger]);

  const getOptionName = (option: { username: string; department: number }) => {
    const departmentObj = departments?.find(
      (item) => item.id === option.department,
    );

    if (departmentObj) {
      return `${option.username} (${departmentObj.department_name})`;
    }
    return option.username;
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

  const [isKanbanViewDisplay, setIsKanbanViewDisplay] =
    useState<boolean>(false);
  const handleOpenKanbanView = () => {
    if (canView) {
      setIsKanbanViewDisplay(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openContactRightView = (item: IUserList | null) => {
    if (item === null) {
      setShowRightSide(false);
      return;
    }
    setLabelDropdownOpen(null);
    setHasOneData(null);
    openRightSide(item);
  }

  return (
    <>
      {noDataFound1 ? (
        <LoginView />
      ) : (
        <>
          <div style={{ zIndex: "999" }}>
            {showPinSetModel && <PinSetModel />}
            <ReviewDialog />
          </div>

          {isVisible ? (
            <>
              {showGroup ||
                showStarred ||
                showSetting ||
                showNewChat ||
                showStatus ||
                showListAllReminder ||
                showListAllInquiry ||
                showcallhistory ||
                showListCompany ||
                showListMyCompany ||
                showCategory ||
                showProduct ||
                showPriceList ||
                showopenSourceOfType ||
                label ||
                showopenStageStatus ||
                showExpenseType ||
                showVisitType ||
                showLeaveType ||
                showVisits ||
                showDepartment ||
                showOpenCustomInquiry ||
                showWhatsappTemplate ||
                showOpenWorkFlow ||
                showOpenSetting ||
                showTaskCategory ||
                showPaymentType ||
                showCompensationAdjustments ||
                showHolidayMaster ||
                showRoundOffMaster ||
                showAdjustmentTypeMaster ||
                showDayAdjustmentMaster ||
                showLockControl ||
                showTaxMaster ||
                showProcessAttendance ||
                showSalaryProcess ||
                showBillOfMaterials ||
                showProcessMaster ||
                showTaskManagement ||
                showRoutePlanner ||
                showCountry ||
                showState ||
                showCity ||
                showArea ||
                showListnote ||
                showWorkStation ||
                showJobCard ||
                showTaskTemplate ||
                ShowSupportTicket ||
                showProductUnit ||
                showProductGroup ||
                showStockAdjustment ||
                showwarehouse ? (
                <>
                  <Group
                    isGroupOpen={showGroup}
                    closeGroup={() => setShowGroup(false)}
                  />
                  <Starred
                    isStarredOpen={showStarred}
                    closeStarred={() => setshowStarred(false)}
                  />
                  <Setting
                    isSettingOpen={showSetting}
                    closeSettings={() => {
                      setshowSetting(false);
                      setSearchTermFromRightSide("");
                    }}
                    profileDetail={loginById}
                    myCompany={() => rightSideVIewProvider("myCompany")}
                    myTeam={() => rightSideVIewProvider("myTeam")}
                    reminder={() => rightSideVIewProvider("reminder")}
                    inquiry={() => rightSideVIewProvider("inquiry")}
                    productCategory={() =>
                      rightSideVIewProvider("productCategory")
                    }
                    productGroup={() => rightSideVIewProvider("productGroup")}
                    warehouse={() => rightSideVIewProvider("warehouse")}
                    callhistory={() => rightSideVIewProvider("callhistory")}
                    product={() => rightSideVIewProvider("product")}
                    priceList={() => rightSideVIewProvider("priceList")}
                    source={() => rightSideVIewProvider("source")}
                    labels={() => rightSideVIewProvider("labels")}
                    status={() => rightSideVIewProvider("status")}
                    expenseType={() => rightSideVIewProvider("expenseType")}
                    visitType={() => rightSideVIewProvider("visitType")}
                    leaveType={() => rightSideVIewProvider("leaveType")}
                    visits={() => rightSideVIewProvider("visits")}
                    departments={() => rightSideVIewProvider("departments")}
                    customFieldForm={() =>
                      rightSideVIewProvider("customFieldForm")
                    }
                    whatsAppTemplate={() =>
                      rightSideVIewProvider("whatsAppTemplate")
                    }
                    workFlowAutomation={() =>
                      rightSideVIewProvider("workFlowAutomation")
                    }
                    notificationSettings={() =>
                      rightSideVIewProvider("notificationSettings")
                    }
                    TaskCategory={() => rightSideVIewProvider("taskCategory")}
                    PaymentType={() => rightSideVIewProvider("paymentType")}
                    CompensationAdjustments={() =>
                      rightSideVIewProvider("compensationAdjustments")
                    }
                    HolidayMaster={() => rightSideVIewProvider("HolidayMaster")}
                    RoundOffMaster={() =>
                      rightSideVIewProvider("RoundOffMaster")
                    }
                    AdjustmentTypeMaster={() =>
                      rightSideVIewProvider("AdjustmentTypeMaster")
                    }
                    DayAdjustmentMaster={() =>
                      rightSideVIewProvider("DayAdjustmentMaster")
                    }
                    LockControl={() => rightSideVIewProvider("LockControl")}
                    TaxMaster={() => rightSideVIewProvider("TaxMaster")}
                    ProcessAttendance={() =>
                      rightSideVIewProvider("processAttendance")
                    }
                    SalaryProcess={() => rightSideVIewProvider("salaryProcess")}
                    BillOfMaterials={() =>
                      rightSideVIewProvider("billOfMaterials")
                    }
                    ProcessMaster={() => rightSideVIewProvider("processMaster")}
                    TaskTemplate={() => rightSideVIewProvider("taskTemplate")}
                    ProductUnit={() => rightSideVIewProvider("productUnit")}
                    routePlanner={() => rightSideVIewProvider("routePlanner")}
                    taskManagement={() =>
                      rightSideVIewProvider("task_Management")
                    }
                    supportTicketManagement={() =>
                      rightSideVIewProvider("support_ticket_management")
                    }
                    country={() => rightSideVIewProvider("country")}
                    state={() => rightSideVIewProvider("state")}
                    city={() => rightSideVIewProvider("city")}
                    area={() => rightSideVIewProvider("area")}
                    workStation={() => rightSideVIewProvider("workStation")}
                    jobCard={() => rightSideVIewProvider("jobcard")}
                    stockAdjustment={() =>
                      rightSideVIewProvider("stock_adjustment")
                    }
                    searchTermFromRightSide={searchTermFromRightSide}
                    setSearchTermFromRightSide={setSearchTermFromRightSide}
                  />

                  {showNewChat && (
                    <NewChat
                      isNewChatOpen={showNewChat}
                      closeForm={() => setshowNewChat(false)}
                    />
                  )}

                  {showStatus && (
                    <Status
                      isStatusShow={showStatus}
                      closeStatus={() => {
                        setShowStatus(false);
                        setshowSetting(true);
                      }}
                    />
                  )}

                  {showListCompany && (
                    <ListCompanyView
                      isCompanyOpen={showListCompany}
                      closeCompany={() => {
                        setShowListCompany(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}

                  {showListMyCompany && (
                    <ListMyCompanyView
                      isCompanyOpen={showListMyCompany}
                      closeCompany={() => {
                        setShowListMyCompany(false);
                        setshowSetting(true);
                      }}
                      companyInfo={companyLists}
                      searchTermFromRightSide={searchTermFromRightSide}
                      setSearchTermFromRightSide={setSearchTermFromRightSide}
                    />
                  )}

                  {showListAllInquiry && (
                    <ListInquiryView
                      isListInquiry={showListAllInquiry}
                      closeListInquiry={() => {
                        setShowListAllInquiry(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                      isModelOpen={"InquiryAllList"}
                      setNoDataFound1={setNoDataFound1}
                      openRightSide={openRightSide}
                    />
                  )}

                  {showListAllReminder && (
                    <ListReminderView
                      isReminderOpen={showListAllReminder}
                      closeReminder={() => {
                        setShowListAllReminder(false);
                        setSearchTermFromRightSide("");
                        setshowSetting(true);
                      }}
                      openRightSide={openRightSide} // <-- Add this line
                      searchTermFromRightSide={searchTermFromRightSide}
                      setSearchTermFromRightSide={setSearchTermFromRightSide}
                    />
                  )}

                  {showListnote && (
                    <ListNoteView
                      isNoteOpen={showListnote}
                      closeNote={() => {
                        setShowListNote(false);
                        setshowSetting(true);
                      }}
                    />
                  )}

                  {showCategory && (
                    <CategoryView
                      isCategoryView={showCategory}
                      closeCategoryView={() => {
                        setShowCategory(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showProductGroup && (
                    <ProductgroupView
                      isGroupView={showProductGroup}
                      closeGroupView={() => {
                        setShowProductGroup(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showTaskCategory && (
                    <TaskCategoryView
                      isTaskCategoryView={showTaskCategory}
                      closeTaskCategoryView={() => {
                        setShowTaskCategory(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showCompensationAdjustments && (
                    <CompensationAdjustmentsView
                      isCompensationAdjustmentView={showCompensationAdjustments}
                      closeCompensationAdjustmentView={() => {
                        setShowCompensationAdjustments(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showLockControl && (
                    <LockControlView
                      isLockControlView={showLockControl}
                      closeLockControlView={() => {
                        setShowLockControl(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showTaxMaster && (
                    <TaxMasterView
                      isTaxView={showTaxMaster}
                      closeTaxView={() => {
                        setShowTaxMaster(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showHolidayMaster && (
                    <HolidayMasterView
                      isHolidayView={showHolidayMaster}
                      closeHolidayView={() => {
                        setShowHolidayMaster(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showRoundOffMaster && (
                    <RoundOffMasterView
                      isRoundOffView={showRoundOffMaster}
                      closeRoundOffView={() => {
                        setShowRoundOffMaster(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showAdjustmentTypeMaster && (
                    <AdjustmentTypeView
                      isAdjustmentTypeView={showAdjustmentTypeMaster}
                      closeAdjustmentTypeView={() => {
                        setShowAdjustmentTypeMaster(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showDayAdjustmentMaster && (
                    <DayAdjustmentView
                      isAdjustmentView={showDayAdjustmentMaster}
                      closeAdjustmentView={() => {
                        setShowDayAdjustmentMaster(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showProcessAttendance && (
                    <ProcessAttendanceView
                      show={showProcessAttendance}
                      onHide={() => {
                        setShowProcessAttendance(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showSalaryProcess && (
                    <SalaryProcessView
                      show={showSalaryProcess}
                      onHide={() => {
                        setShowSalaryProcess(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showPaymentType && (
                    <PaymentTypeView
                      isPaymentTypeView={showPaymentType}
                      closePaymentTypeView={() => {
                        setShowPaymentType(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showBillOfMaterials && (
                    <BillOfMaterialsView
                      isBillOfMaterialsView={showBillOfMaterials}
                      closeBillOfMaterialsView={() => {
                        setShowBillOfMaterials(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showProcessMaster && (
                    <ProcessMasterView
                      isprocessMasterView={showProcessMaster}
                      closeprocessMasterView={() => {
                        setShowProcessMaster(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showProduct && (
                    <ProductView
                      isProductView={showProduct}
                      closeProductView={() => {
                        setShowProduct(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                      searchTermFromRightSide={searchTermFromRightSide}
                      setSearchTermFromRightSide={setSearchTermFromRightSide}
                    />
                  )}
                  {showStockAdjustment && (
                    <StockAdjustmentView
                      isStockAdjustmentView={showStockAdjustment}
                      closeStockAdjustmentView={() => {
                        setShowStockAdjustment(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                      searchTermFromRightSide={searchTermFromRightSide}
                      setSearchTermFromRightSide={setSearchTermFromRightSide}
                    />
                  )}
                  {showPriceList && (
                    <PriceListView
                      isPriceListView={showPriceList}
                      closePriceListView={() => {
                        setShowPriceList(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showopenSourceOfType && (
                    <SourceOfTypes
                      isSourceOfTypeOpen={showopenSourceOfType}
                      closeSourceOfType={() => {
                        setshowopenSourceOfType(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}

                  {label && (
                    <LabelView
                      isLableView={label}
                      closeLabelView={() => {
                        setLabel(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showopenStageStatus && (
                    <StageStatusView
                      isStageStatusView={showopenStageStatus}
                      closeStageStatusView={() => {
                        setshowopenStageStatus(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showExpenseType && (
                    <ExpenseTypeView
                      isExpenseTypeView={showExpenseType}
                      closeExpenseTypeView={() => {
                        setShowExpenseType(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showVisitType && (
                    <VisitTypeView
                      isVisitTypeView={showVisitType}
                      closeVisitTypeView={() => {
                        setShowVisitType(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showLeaveType && (
                    <LeaveTypeView
                      isLeaveTypeView={showLeaveType}
                      closeLeaveTypeView={() => {
                        setShowLeaveType(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showVisits && (
                    <Visitsview
                      isVisitView={showVisits}
                      closeVisitView={() => {
                        setShowVisits(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showcallhistory && (
                    <CallHistory
                      isCallHistoryView={showcallhistory}
                      closeCallHistory={() => {
                        setShowCallHistory(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showDepartment && (
                    <DepartmentView
                      isDepartmentView={showDepartment}
                      closeDepartmentView={() => {
                        setShowDepartment(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showOpenCustomInquiry && (
                    <CustomInquiryFromView
                      isCustomInquiryFromView={showOpenCustomInquiry}
                      closeCustomInquiryFromView={() => {
                        setShowOpenCustomInquiry(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showWhatsappTemplate && (
                    <WhatsappTemplateView
                      isWhatsappTemplateView={showWhatsappTemplate}
                      closeWhatsappTemplateView={() => {
                        setShowWhatsappTemplate(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showOpenWorkFlow && (
                    <WorkFlowAutomationView
                      isWorkFlowView={showOpenWorkFlow}
                      closeWorkFlowView={() => {
                        setShowOpenWorkFlow(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showOpenSetting && (
                    <MainSettingsView
                      isMainSettingView={showOpenSetting}
                      closeMainSettingView={() => {
                        setShowOpenSetting(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}

                  {showRoutePlanner && (
                    <RoutePlannerListView
                      show={showRoutePlanner}
                      onHide={() => {
                        setShowRoutePlanner(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                        setIdFromRightSide(0);
                      }}
                      openContactRightView={openContactRightView}
                    />
                  )}

                  {showTaskManagement && (
                    <TaskListView
                      isTaskManagementView={showTaskManagement}
                      closeTaskManagementView={() => {
                        setShowTaskManagement(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                        setIdFromRightSide(0);
                      }}
                      supportTicketFlag={0}
                      searchTermFromRightSide={searchTermFromRightSide}
                      setSearchTermFromRightSide={setSearchTermFromRightSide}
                      idFromRightSide={idFromRightSide}
                      setIdFromRightSide={setIdFromRightSide}
                    />
                  )}
                  {ShowSupportTicket && (
                    <TaskListView
                      isTaskManagementView={ShowSupportTicket}
                      closeTaskManagementView={() => {
                        setShowSupportTicket(false);
                        setshowSetting(true);
                        setIdFromRightSide(0);
                      }}
                      supportTicketFlag={1}
                      searchTermFromRightSide={searchTermFromRightSide}
                      setSearchTermFromRightSide={setSearchTermFromRightSide}
                      idFromRightSide={idFromRightSide}
                      setIdFromRightSide={setIdFromRightSide}
                    />
                  )}

                  {showCountry && (
                    <CountriesView
                      isCountriesView={showCountry}
                      closeCountriesView={() => {
                        setShowCountry(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}

                  {showState && (
                    <StatesView
                      isStatesView={showState}
                      closeStatesView={() => {
                        setShowState(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}

                  {showCity && (
                    <CitiesView
                      isCitiesView={showCity}
                      closeCitiesView={() => {
                        setShowCity(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}

                  {showArea && (
                    <AreasView
                      isAreasView={showArea}
                      closeAreasView={() => {
                        setShowArea(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showWorkStation && (
                    <MachineManagement
                      isMachineView={showWorkStation}
                      closeMachineView={() => {
                        setShowWorkStation(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showJobCard && (
                    <JobCardListView
                      show={showJobCard}
                      onHide={() => {
                        setShowJobCard(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showTaskTemplate && (
                    <TaskTemplateView
                      isTaskTemplateView={showTaskTemplate}
                      closeTaskTemplateView={() => {
                        setShowTaskTemplate(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showProductUnit && (
                    <UnitMasterView
                      isUnitView={showProductUnit}
                      closeUnitView={() => {
                        setShowProductUnit(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                  {showwarehouse && (
                    <WarehouseView
                      isWarehouseView={showwarehouse}
                      closeWarehouseView={() => {
                        setShowwarehouse(false);
                        setshowSetting(true);
                        setSearchTermFromRightSide("");
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  <div
                    className="leftSide animate__animated animate__fadeInRight"
                    id="leftSid"
                  >
                    <div className="header">
                      <div onClick={SystemReload} style={{ cursor: "pointer" }}>
                        <img
                          src={smalll_office_logo}
                          alt="Avatar"
                          width={45}
                          className=" ms-2"
                        />
                      </div>



                      <div className="ICON">
                        {/* <button className="icons" onClick={openDashBoard}>
                          <span title="View Insight">
                            <svg
                              height="25"
                              viewBox="0 0 20 20"
                              width="25"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                            >
                              <path d="m0 0h20v20h-20z" fill="none" />
                              <path d="m12.5 8 .79-1.72 1.71-.78-1.71-.78-.79-1.72-.76 1.72-1.74.78 1.74.78z" />
                              <path d="m4 10 .4-1.6 1.6-.4-1.6-.4-.4-1.6-.4 1.6-1.6.4 1.6.4z" />
                              <path d="m16.5 6c-1.07 0-1.84 1.12-1.35 2.14l-3.01 3.01c-.52-.25-.99-.14-1.29 0l-1.01-1.01c.1-.19.16-.41.16-.64 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .23.06.45.15.64l-3.01 3.01c-.19-.09-.41-.15-.64-.15-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c.52.25.99.14 1.29 0l1.01 1.01c-.1.19-.16.41-.16.64 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c1.03.5 2.14-.29 2.14-1.35 0-.83-.67-1.5-1.5-1.5z" />
                            </svg>
                          </span>
                        </button> */}
                        <button
                          style={{ paddingRight: "8px" }}
                          className="icons "
                          onClick={() => {
                            handleOpenKanbanView();
                          }}
                        >
                          <span title="KanBen View" className="text-white">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#54656f"
                            >
                              <path d="M280-280h80v-400h-80v400Zm320-80h80v-320h-80v320ZM440-480h80v-200h-80v200ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                            </svg>
                          </span>
                        </button>
                        <button className="icons " onClick={openFilterLabel}>
                          <span title="Filter Contact">
                            {hasData ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill={hasData ? "red" : "#54656f"}
                              >
                                <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                              </svg>
                            ) : (
                              <svg
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill={hasData ? "red" : "#54656f"}
                              >
                                <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                              </svg>
                            )}
                          </span>
                        </button>

                        <button
                          className="icons"
                          onClick={() => setShowListAllReminder(true)}
                          style={{ position: "relative" }}
                        >
                          {reminderCount != 0 && (
                            <span
                              style={{
                                width: "15px",
                                height: "15px",
                                fontSize: "9px",
                                lineHeight: "15px",
                                position: "absolute",
                                top: "-3px",
                                right: "-3px",
                                background: "#ef4444",
                                color: "white",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                boxShadow: "0 0 0 1.5px #f0f2f5",
                                zIndex: 2,
                                pointerEvents: "none",
                              }}
                            >
                              {reminderCount}
                            </span>
                          )}
                          <span title="Reminder">
                            <svg
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="currentColor"
                            >
                              <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                            </svg>
                          </span>
                        </button>

                        {/* <button
                          className="icons "
                          onClick={() =>
                            canViewInq
                              ? setShowListAllInquiry(true)
                              : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                          }
                        >
                          <span title="Inquiry">
                            <svg
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="currentColor"
                            >
                              <path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" />
                            </svg>
                          </span>
                        </button> */}
                        <button
                          className="icons"
                          onClick={handelRefreshContacts}
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
                            <path
                              fill="currentColor"
                              d="M18 24h-2v-6h-6v-2h8z"
                            />
                            <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                          </svg>
                        </button>
                        <button
                          className="icons"
                          onClick={handleChangeAddContact}
                        >
                          <span title="Create Contact">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="26px"
                              viewBox="0 -960 960 960"
                              width="26px"
                              fill="#5f6368"
                            >
                              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>
                          </span>
                        </button>

                        <div className="position-relative d-inline-block">
                          <button
                            id="dropDown2"
                            className="icons"
                            onClick={toggleDropdown}
                            ref={dropdownRef}
                          >
                            <span>
                              <svg viewBox="0 0 24 24" width="24" height="24">
                                <path
                                  fill="currentColor"
                                  d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                ></path>
                              </svg>
                            </span>
                          </button>

                          <ul
                            className={`dropLeft header-dropdown-menu ${dropdownOpen ? "isVisible" : "isHidden"}`}
                            id="dropLeft"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              right: "0",
                              zIndex: 1050,
                              minWidth: "185px",
                              backgroundColor: "#ffffff",
                              borderRadius: "10px",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                              border: "1px solid rgba(226, 232, 240, 0.9)",
                              padding: "6px",
                              listStyle: "none",
                              margin: 0,
                            }}
                          >
                            <li
                              className="listItem"
                              role="button"
                              onClick={openSettings}
                            >
                              <i className="bi bi-gear me-2"></i> Settings
                            </li>
                            <li
                              className="listItem"
                              role="button"
                              data-bs-toggle="modal"
                              onClick={handelExportExcel}
                            >
                              <i className="bi bi-file-earmark-excel me-2"></i> Export Contact
                            </li>

                            {isFeatureEnabled && (
                              <li
                                className="listItem"
                                role="button"
                                data-bs-toggle="modal"
                                onClick={fetchFromMiracle}
                              >
                                <i className="bi bi-arrow-repeat me-2"></i> Fetch Miracle
                              </li>
                            )}

                            <li
                              className={`listItem ${selectedButton === "archive" ? "active" : ""}`}
                              style={{ whiteSpace: "nowrap" }}
                              onClick={() => handleButtonClick("archive")}
                            >
                              <i className="bi bi-archive me-2"></i> Archive Contacts
                            </li>
                            <li
                              className="listItem"
                              role="button"
                              onClick={handleAddFromImport}
                            >
                              <i className="bi bi-file-earmark-arrow-up me-2"></i> Import Contact
                            </li>
                            <li
                              className="listItem"
                              role="button"
                              onClick={handleViewMap}
                            >
                              <i className="bi bi-geo-alt me-2"></i> View In Map
                            </li>

                            <li
                              className="listItem text-danger"
                              role="button"
                              data-bs-toggle="modal"
                              data-bs-target="#exampleModalSec"
                              onClick={() => setIsCloseConfirmation(true)}
                            >
                              <i className="bi bi-box-arrow-right me-2"></i> Log out
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {canView ? (
                      <div className="">
                        <div className="search-bar">
                          <div className="">
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
                              title="Search Contacts"
                              aria-label="Search Contacts"
                              placeholder="Search Contacts"
                              ref={searchInputRef}
                              onFocus={(e) => e.target.select()}
                              maxLength={MINI_TEXT_LENGTH}
                              value={searchTerm}
                              onChange={handleSearchChange}
                              onKeyDown={handleKeyDown}
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
                                onClick={() => {
                                  setSearchTerm("");
                                  setRefreshContact(true);
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
                        </div>
                        <div className="pb-2">
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
                                title="Select All Contacts"
                                onChange={() => {
                                  const newSelected = isAllSelected
                                    ? []
                                    : user.map((u) => u.id);
                                  setSelectedIds(newSelected);
                                  setIsAllSelected(!isAllSelected);
                                }}
                              />
                              <span
                                className="badge bg-danger ms-2"
                                style={{
                                  fontSize: "0.65rem",
                                  minWidth: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {selectedIds.length}
                              </span>
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
                                    setLabelDropdownOpen(null);
                                    setHasOneData(null);
                                    setIsLabelDropdownOpen(false);
                                    setIsSoruceDropdownOpen(false);
                                    setIsStageStatusDropdownOpen(false);
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
                                          width="24px"
                                          height="24px"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                        </svg>
                                      </span>{" "}
                                      Delete Selected Contacts
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
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
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
                                        handleModalOpen();
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h440q19 0 36 8.5t28 23.5l216 288-216 288q-11 15-28 23.5t-36 8.5H160Zm0-80h440l180-240-180-240H160v480Zm220-240Z"></path>
                                        </svg>
                                      </span>{" "}
                                      Add Labels to Contacts
                                    </li>
                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={async () => {
                                        await fetchSourceOfTypesApi();
                                        setIsModalChangeSourceTypeVisible(true);
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M480-120q-151 0-255.5-46.5T120-280v-400q0-66 105.5-113T480-840q149 0 254.5 47T840-680v400q0 67-104.5 113.5T480-120Zm0-479q89 0 179-25.5T760-679q-11-29-100.5-55T480-760q-91 0-178.5 25.5T200-679q14 30 101.5 55T480-599Zm0 199q42 0 81-4t74.5-11.5q35.5-7.5 67-18.5t57.5-25v-120q-26 14-57.5 25t-67 18.5Q600-528 561-524t-81 4q-42 0-82-4t-75.5-11.5Q287-543 256-554t-56-25v120q25 14 56 25t66.5 18.5Q358-408 398-404t82 4Zm0 200q46 0 93.5-7t87.5-18.5q40-11.5 67-26t32-29.5v-98q-26 14-57.5 25t-67 18.5Q600-328 561-324t-81 4q-42 0-82-4t-75.5-11.5Q287-343 256-354t-56-25v99q5 15 31.5 29t66.5 25.5q40 11.5 88 18.5t94 7Z"></path>
                                        </svg>
                                      </span>{" "}
                                      Change Source Type
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
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm40-80h200v-80H200v80Zm382-80 198-198-57-57-141 142-57-57-56 57 113 113Zm-382-80h200v-80H200v80Zm0-160h200v-80H200v80Zm-40 400v-560 560Z"></path>
                                        </svg>
                                      </span>{" "}
                                      Change Status
                                    </li>
                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={() => {
                                        openReadModel();
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="#3b4a54"
                                        >
                                          <path d="M694-160 553-302l56-56 85 85 170-170 56 57-226 226ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v280h-80v-280H160v525l46-45h274v80H240L80-80Zm80-240v-480 480Z" />
                                        </svg>
                                      </span>{" "}
                                      Mark as read
                                    </li>
                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={() => {
                                        openUnreadModel();
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M80-80v-720q0-33 23.5-56.5T160-880h404q-4 20-4 40t4 40H160v525l46-45h594v-324q23-5 43-13.5t37-22.5v360q0 33-23.5 56.5T800-240H240L80-80Zm80-720v480-480Zm600 80q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Z" />
                                        </svg>
                                      </span>{" "}
                                      Mark as unread
                                    </li>
                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={() => {
                                        openArchiveModel();
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M80-80v-720q0-33 23.5-56.5T160-880h404q-4 20-4 40t4 40H160v525l46-45h594v-324q23-5 43-13.5t37-22.5v360q0 33-23.5 56.5T800-240H240L80-80Zm80-720v480-480Zm600 80q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Z" />
                                        </svg>
                                      </span>{" "}
                                      {isArchivState
                                        ? "Unarchive Selected Contacts"
                                        : "Archive Selected Contacts"}
                                    </li>
                                    {platformType == 2 && (
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() => {
                                          openCreateCampaign();
                                          setIsActionDropdownOpen(false);
                                        }}
                                      >
                                        <span>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="currentColor"
                                          >
                                            <path d="M720-440v-80h160v80H720Zm48 280-128-96 48-64 128 96-48 64Zm-80-480-48-64 128-96 48 64-128 96ZM200-200v-160h-40q-33 0-56.5-23.5T80-440v-80q0-33 23.5-56.5T160-600h160l200-120v480L320-360h-40v160h-80Zm240-182v-196l-98 58H160v80h182l98 58Zm120 36v-268q27 24 43.5 58.5T620-480q0 41-16.5 75.5T560-346ZM300-480Z" />
                                          </svg>
                                        </span>{" "}
                                        Create campaign
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </span>
                          )}

                          <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "all" ? "selected-btn" : ""
                              }`}
                            onClick={() => handleButtonClick("all")}
                          >
                            <span className="contact-btn-search-text">
                              {" "}
                              All{" "}
                            </span>
                            {totalContactCount > 0 && (
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
                                {totalContactCount}
                              </span>
                            )}
                          </button>

                          {/* <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "pinned" ? "selected-btn" : ""
                              }`}
                            onClick={() => handleButtonClick("pinned")}
                          >
                            <span className="contact-btn-search-text">
                              {" "}
                              Pin{" "}
                            </span>
                          </button> */}

                          <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedButton === "unread" ? "selected-btn" : ""
                              }`}
                            onClick={() => handleButtonClick("unread")}
                          >
                            <span className="contact-btn-search-text">
                              {" "}
                              Unread{" "}
                            </span>
                            {totalNumberOfUnreadContact > 0 && (
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
                                {totalNumberOfUnreadContact}
                              </span>
                            )}
                          </button>

                          <div className="position-relative d-inline-block ms-1">
                            <button
                              className={`btn rounded-5 contact-btn-search fw_500 ${selectedButton === "label" ? "selected-btn" : ""
                                } ${labelLists.length === 0 ? "disabled" : ""}`}
                              onClick={DropdownLabelForContact}
                              data-bs-toggle="dropdown"
                              ref={labelDropdownRef}
                              disabled={labelLists.length === 0} // Disable click when empty
                            >
                              <span
                                className="contact-btn-search-text"
                                style={{
                                  wordBreak: "break-word",
                                  maxWidth: "120px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {selectedLabel
                                  ? selectedLabel.lable_name
                                  : "Label"}
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
                                  } `}
                                style={{
                                  position: "absolute",
                                  left: "0",
                                  top: "100%", // Changed from relative positioning
                                  marginTop: "8px", // Add some spacing from button
                                  minWidth: "150px",
                                  width: "auto",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  background: "#fff",
                                  border: "1px solid #ddd",
                                  borderRadius: "5px",
                                  zIndex: 1000,
                                  maxHeight: "30vh",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                              >
                                {labelLists.map((item) => (
                                  <li
                                    key={item.id}
                                    className="listItem-contact-tabs"
                                    role="button"
                                    onClick={() => handleLabelSelect(item.id)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      padding: "8px 12px",
                                      minHeight: "26px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        backgroundColor:
                                          item.color ?? "transparent",
                                        display: "inline-block",
                                        marginRight: "8px",
                                        flexShrink: 0,
                                      }}
                                    ></span>
                                    <span
                                      style={{
                                        wordWrap: "break-word",
                                        width: `${SMALL_WIDTH_FOR_TEXT}`,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {item.lable_name}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="position-relative d-inline-block ms-1">
                            <button
                              className={`btn rounded-5 contact-btn-search fw_500 ${selectedButton === "source"
                                ? "selected-btn"
                                : ""
                                }${soruceLists.length === 0 ? "disabled" : ""}`}
                              onClick={DropdownSoruceForContact}
                              ref={sourceDropdownRef}
                              disabled={soruceLists.length === 0}
                            >
                              <span className="contact-btn-search-text">
                                {selectedSource
                                  ? selectedSource.source_name
                                  : "Source"}
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

                            {isSoruceDropdownOpen && (
                              <ul
                                className={`labelDropLeft ${isSoruceDropdownOpen
                                  ? "isVisible"
                                  : "isHidden"
                                  } `}
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%", // Added
                                  marginTop: "8px", // Added
                                  minWidth: "150px",
                                  left: "-100%",
                                  width: "auto",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  background: "#fff",
                                  border: "1px solid #ddd",
                                  borderRadius: "5px",
                                  zIndex: "10000000000000 !important",
                                  maxHeight: "30vh", // Changed from height
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // Added
                                }}
                              >
                                {soruceLists.map((item) => (
                                  <li
                                    key={item.id}
                                    className="listItem-contact-tabs"
                                    role="button"
                                    onClick={() => handleSourceSelect(item.id)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      padding: "8px 12px", // Added
                                      minHeight: "26px", // Added
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        flexShrink: 0,
                                        borderRadius: "50%",
                                        backgroundColor:
                                          item.color ?? "transparent",
                                        display: "inline-block",
                                        marginRight: "8px",
                                      }}
                                    ></span>

                                    <span
                                      style={{
                                        wordWrap: "break-word",
                                        width: `${SMALL_WIDTH_FOR_TEXT}`,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {item.source_name}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <style>
                            {`.position-relative { position: relative; }
                              /* Base menu: positioned absolutely below the button */
                              .position-relative .labelDropLeft {
                                position: absolute;
                                top: 100%;
                                inset-inline-start: 0;    /* logical left */
                                /* inset-inline-end: auto; default */
                                margin-top: 4px;

                                min-width: 150px;
                                max-height: 30vh;
                                overflow-y: auto;
                                background: #fff;
                                border: 1px solid #ddd;
                                border-radius: 5px;
                                z-index: 1000;
                              }

                              /* Flip it to the right edge of the button */
                              .position-relative.dropdown-end .labelDropLeft {
                                inset-inline-start: auto;
                                inset-inline-end: 0;      
                              }
                          `}
                          </style>
                          <div className="position-relative d-inline-block ms-1 dropdown-end">
                            <button
                              className={`btn rounded-5 contact-btn-search fw_500 ${selectedButton === "status"
                                ? "selected-btn"
                                : ""
                                }${stageStatusLists.length === 0 ? "disabled" : ""
                                }`}
                              onClick={DropdownStageStatusForContact}
                              ref={statusDropdownRef}
                              disabled={soruceLists.length === 0}
                            >
                              <span className="contact-btn-search-text">
                                {selectedStageStatus
                                  ? selectedStageStatus.name
                                  : "Status"}
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
                                className={`labelDropLeft ${isStageStatusDropdownOpen
                                  ? "isVisible"
                                  : "isHidden"
                                  } `}
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%",
                                  marginTop: "8px",
                                  minWidth: "100px",
                                  // left:"-200%",
                                  width: "140px",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  background: "#fff",
                                  border: "1px solid #ddd",
                                  borderRadius: "5px",
                                  zIndex: 1000,
                                  maxHeight: "30vh",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  marginLeft: "200px",
                                }}
                              >
                                {stageStatusLists.map((item) => (
                                  <li
                                    key={item.id}
                                    className="listItem-contact-tabs"
                                    role="button"
                                    onClick={() =>
                                      handleStageStatusSelect(item.id)
                                    }
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      padding: "8px 12px",
                                      minHeight: "26px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        backgroundColor:
                                          item.color ?? "transparent",
                                        display: "inline-block",
                                        marginRight: "8px",
                                        flexShrink: 0, // Added
                                      }}
                                    ></span>
                                    <span
                                      style={{
                                        wordWrap: "break-word",
                                        width: `${SMALL_WIDTH_FOR_TEXT}`,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {item.name}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span></span>
                    )}
                    <div
                      className="chats"
                      style={{
                        height:
                          "calc(100vh - var(--header-total-height, 177px))",
                        maxHeight:
                          "calc(100vh - var(--header-total-height, 177px))",
                        minHeight: "300px",
                        overflow: "auto",
                        overflowX: "hidden",
                      }}
                      ref={listInnerRef}
                    >
                      <>
                        {loading && !isAutoRefreshing ? (
                          // Render skeleton placeholders when loading
                          Array.from({ length: 12 }).map((_, index) => (
                            <div className="block chat-list" key={index}>
                              <Skeleton
                                width={50}
                                height={50}
                                circle={true}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.5 }}
                              />
                              <div className="h-text">
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
                                <div className="message-chat">
                                  <div className="chat-text-icon">
                                    <span className="thanks">
                                      <Skeleton
                                        style={{
                                          marginLeft: "10px",
                                          opacity: darkMode ? "" : 0.5,
                                        }}
                                        width={100}
                                      />
                                    </span>
                                    <div className="icon-more">
                                      <Skeleton
                                        width={40}
                                        style={{
                                          opacity: darkMode ? "" : 0.5,
                                        }}
                                        height={10}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : // Render actual user data when not loading
                          canView ? (
                            user.map((item, index) => {
                              return (
                                <>
                                  <div>
                                    <ul
                                      className={`labelDropLeft ${hasOneData === item.id &&
                                        labelDropdownOpen
                                        ? "isVisible"
                                        : "isHidden"
                                        } `}
                                      ref={(el) =>
                                        (dropdownContactRef.current[item.id] = el)
                                      }
                                      style={{
                                        width: "170px",
                                        height: "auto",
                                        // top: ""
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleModalOpenEditContact(item);
                                          setLabelDropdownOpen(null);
                                          setHasOneData(null);
                                        }}
                                      >
                                        Edit
                                      </li>
                                      {/* {item.is_pin !== 1 && (
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() => openPinModel(item.id)}
                                      >
                                        Pin
                                      </li>
                                    )}
                                    {item.is_pin === 1 && (
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() => openUnPinModel(item.id)}
                                      >
                                        UnPin
                                      </li>
                                    )} */}

                                      {applicationId &&
                                        (item.is_pin_by_a_application_login_id
                                          .split(",")
                                          .map((id) => id.trim())
                                          .includes(applicationId.toString()) ? (
                                          <>
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={() =>
                                                openUnPinModel(item.id)
                                              }
                                            >
                                              UnPin
                                            </li>
                                          </>
                                        ) : (
                                          <>
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={() =>
                                                openPinModel(item.id)
                                              }
                                            >
                                              Pin
                                            </li>
                                          </>
                                        ))}
                                      {item.is_unread === 1 && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() => openReadModel(item.id)}
                                        >
                                          Mark as Read
                                        </li>
                                      )}
                                      {item.is_unread === 0 && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() => openUnreadModel(item.id)}
                                        >
                                          Mark as Unread
                                        </li>
                                      )}
                                      {item.is_archive === 0 && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() =>
                                            openArchiveModel(item.id)
                                          }
                                        >
                                          Archive contact
                                        </li>
                                      )}
                                      {item.is_archive === 1 && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() =>
                                            openUnArchiveModel(item.id)
                                          }
                                        >
                                          Unarchive contact
                                        </li>
                                      )}

                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() => handleModalOpen(item.id)}
                                      >
                                        Assign label
                                      </li>
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() =>
                                          handleModalOpenStatusAssign(
                                            item.id,
                                            item.contact_status,
                                          )
                                        }
                                      >
                                        Assign Status
                                      </li>
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() =>
                                          handleModalOpenUserAssign(item.id)
                                        }
                                      >
                                        Assign Team Member
                                      </li>
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={() =>
                                          handleStartWorkFlow(item.id)
                                        }
                                        style={{
                                          color: "#0992f3",
                                          fontWeight: "600",
                                        }}
                                      >
                                        Start WorkFlow
                                      </li>
                                      <li
                                        style={{
                                          color: "red",
                                          fontWeight: "600",
                                        }}
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDeleteModel(item.id);
                                          setLabelDropdownOpen(null);
                                          setHasOneData(null);
                                        }}
                                      >
                                        Delete
                                      </li>
                                    </ul>
                                  </div>
                                  <button
                                    key={index}
                                    className={`block chat-list ${activeIndex === index ? "active" : ""
                                      } d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center`}
                                    onClick={(e) => {
                                      setLabelDropdownOpen(null);
                                      setHasOneData(null);
                                      setActiveIndex(index);
                                      openRightSide(item);
                                    }}
                                    style={{ position: "relative" }}
                                    ref={(el) =>
                                      (productRefs.current[index] = el)
                                    }
                                    onMouseEnter={(e) => {
                                      if (
                                        selectedIds.length === 0 &&
                                        !isAllSelected
                                      ) {
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
                                      if (
                                        selectedIds.length === 0 &&
                                        !isAllSelected
                                      ) {
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
                                    <div
                                      className={`${item.is_unread === 1
                                        ? "imgBox-isRead-line"
                                        : ""
                                        }`}
                                    ></div>
                                    <div
                                      className="h-text"
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div className="h-text">
                                        <div style={{ position: "relative" }}>
                                          <div
                                            className={`head flex-grow-1 d-flex justify-content-start align-items-start ${checkboxesVisible ? " ms-4" : ""
                                              }`}
                                          >
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
                                                checked={selectedIds.includes(
                                                  item.id,
                                                )}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  const updated = e.target.checked
                                                    ? [...selectedIds, item.id]
                                                    : selectedIds.filter(
                                                      (id: any) =>
                                                        id !== item.id,
                                                    );
                                                  setSelectedIds(updated);
                                                  setIsAllSelected(
                                                    updated.length ===
                                                    user.length,
                                                  );
                                                }}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              />
                                            </div>
                                            <div className="d-flex flex-column">
                                              <h6
                                                className="d-flex justify-content-start align-items-start"
                                                style={{
                                                  wordBreak: "break-word",
                                                  maxWidth: "150px",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  padding: "0px",
                                                  fontWeight: "bold",
                                                  fontSize: "14px",
                                                  margin: "0px",
                                                  marginBottom: "2px",
                                                }}
                                              >
                                                {item.company_name}
                                              </h6>
                                              <h4
                                                className="d-flex justify-content-start align-items-start"
                                                style={{
                                                  wordBreak: "break-word",
                                                  maxWidth: "150px",

                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  padding: "0px",
                                                  fontSize: "12px",
                                                  margin: "0px",
                                                }}
                                              >
                                                {item.person_name}
                                              </h4>
                                            </div>
                                            <div className="head px-2">
                                              <ul
                                                style={{
                                                  paddingLeft: "unset",
                                                  marginBottom: "unset",
                                                }}
                                              >
                                                {/* {item.label_color
                                            ? item.label_color
                                                .split(",")
                                                .map((color, index) => (
                                                  <li
                                                    key={index}
                                                    style={{
                                                      listStyleType: "none", // Remove default bullet points
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
                                                        item.label_name.split(
                                                          ","
                                                        )[index]
                                                      }
                                                    ></span>
                                                  </li>
                                                ))
                                            : ""} */}
                                              </ul>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="message-chat">
                                          {/* EMAIL,CONTARY,STATE,CITY,NUMBER */}
                                          <div className="chat-text-icon">
                                            <span
                                              className={`thanks ${checkboxesVisible ? " ms-4" : ""
                                                }`}
                                              style={{ fontSize: "11px" }}
                                            >
                                              {item.mobile_number}
                                              {/* {item.mobile_number ? "," : ""}
                                          </span>
                                          <span className="thanks">
                                            {item.email_id}
                                            {item.email_id ? "," : ""} */}
                                            </span>
                                          </div>
                                        </div>
                                        {item && item.is_archive === 1 && (
                                          <div style={{ textAlign: "left" }}>
                                            <span
                                              style={{
                                                backgroundColor: "#6c6464",
                                                border: "#6c6464",
                                                padding: "4px",
                                                borderRadius: "15px",
                                                fontSize: "10px",
                                              }}
                                            >
                                              Archive
                                            </span>
                                          </div>
                                        )}
                                        <div className="message-chat ">
                                          <div
                                            className="chat-text-icon"
                                            style={{ fontSize: "11px" }}
                                          >
                                            {/* <span className="thanks">
                                          {item.country_name}
                                          {item.country_name ? "," : ""}
                                        </span> */}

                                            <span
                                              className="thanks"
                                              style={{
                                                fontSize: "11px",
                                                marginRight: "2px",
                                              }}
                                            >
                                              {item.city_name}
                                              {item.city_name ? "," : ""}
                                            </span>
                                            <span
                                              className="thanks"
                                              style={{ fontSize: "11px" }}
                                            >
                                              {item.state_name}
                                              {/* {item.state_name ? "," : ""} */}
                                            </span>
                                            <span
                                              className="thanks"
                                              style={{ fontSize: "11px" }}
                                            >
                                              {item.area_name}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-start">
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
                                                      backgroundColor:
                                                        color.trim(),
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
                                          {item.client_code &&
                                            item.client_code.length > 0 && (
                                              <>
                                                <br />
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  client code : {item.client_code}
                                                </span>
                                              </>
                                            )}
                                        </div>
                                      </div>
                                      <div className="col-6">
                                        <div className="text-end">
                                          {item.reminderDueCount > 0 && (
                                            <>
                                              {!isHover && (
                                                <span
                                                  title="Reminder"
                                                  onMouseEnter={() =>
                                                    setIsHover(true)
                                                  }
                                                >
                                                  <svg
                                                    height="24px"
                                                    viewBox="0 -960 960 960"
                                                    width="24px"
                                                    fill="currentColor"
                                                  >
                                                    <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                                                  </svg>
                                                </span>
                                              )}
                                              {isHover && (
                                                <span
                                                  onMouseLeave={() =>
                                                    setIsHover(false)
                                                  }
                                                  title="Reminder"
                                                  style={{
                                                    width: "30px",
                                                    height: "30px",
                                                    backgroundColor: "red",
                                                    padding: "7px",
                                                    fontSize: "9px",
                                                    color: "#fff",
                                                    borderRadius: "15px",
                                                  }}
                                                >
                                                  {item.reminderDueCount}&nbsp;
                                                </span>
                                              )}
                                            </>
                                          )}

                                          {applicationId &&
                                            item.is_pin_by_a_application_login_id.includes(
                                              applicationId,
                                            ) && (
                                              <span
                                                className="text-end"
                                                onClick={() =>
                                                  openUnPinModel(item.id)
                                                }
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  height="18px"
                                                  viewBox="0 -960 960 960"
                                                  width="18px"
                                                  fill="currentColor"
                                                >
                                                  <path
                                                    transform="rotate(50, 480, -480)"
                                                    d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z"
                                                  />
                                                </svg>
                                              </span>
                                            )}
                                          <button
                                            className="icon-more"
                                            onClick={(e) => {
                                              setIsActionDropdownOpen(false);
                                              setLabelDropdownOpen(null);
                                              setHasOneData(null);
                                              setIsLabelDropdownOpen(false);
                                              setIsSoruceDropdownOpen(false);
                                              setIsStageStatusDropdownOpen(false);
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
                                        <div className="text-end">
                                          <span
                                            style={{
                                              backgroundColor:
                                                item.source_name_color
                                                  ? item.source_name_color
                                                  : "#eeeeee ",
                                              fontWeight: "normal",
                                            }}
                                            className="badge rounded-pill "
                                          >
                                            {item.source_name}
                                          </span>
                                        </div>
                                        <div className="text-end">
                                          <span
                                            style={{
                                              backgroundColor:
                                                item.stage_status_color
                                                  ? item.stage_status_color
                                                  : "#eeeeee ",
                                              fontWeight: "normal",
                                              fontSize: "10px",
                                            }}
                                            className="badge rounded-pill"
                                          >
                                            {item.stage_status_name}
                                          </span>
                                        </div>
                                        <div className="">
                                          <div className="text-end">
                                            <p className="contact-text">
                                              {item.created_date_time
                                                ? convertDateTimeFormat(
                                                  item.created_date_time,
                                                ).date
                                                : ""}
                                              &nbsp;{" "}
                                              {/* Space between date and time */}
                                              {item.created_date_time
                                                ? convertDateTimeFormat(
                                                  item.created_date_time,
                                                ).time
                                                : ""}{" "}
                                              <br />
                                              <span
                                                title={
                                                  item.assined_team_person_list
                                                }
                                              >
                                                {item.teamMemberName}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </>
                              );
                            })
                          ) : (
                            <p className="text-danger p-1">
                              {/* {DEFAULT_MESSAGE_ERROR_PERMISSION} */}
                            </p>
                          )}
                      </>
                      {!user && noDataFound && !searchTerm && (
                        <p className="no_found">
                          Please create first contact <br /> from above{" "}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="26px"
                            viewBox="0 -960 960 960"
                            width="26px"
                            fill="#5f6368"
                          >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                          </svg>{" "}
                          icon
                        </p>
                      )}
                      {(searchTerm || hasData) && noDataFound && (
                        <p className="no_found">No More Data Found</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {isCloseConfirmation && (
                <ConfirmationModal
                  show={isCloseConfirmation}
                  onHide={() => setIsCloseConfirmation(false)}
                  handleSubmit={handleLogout}
                  title={"Log Out?"}
                  message={"Are you sure you want to log out?"}
                  btn1="CANCEL"
                  btn2="LOG OUT"
                />
              )}

              {issetShareId && (
                <ConfirmationModal
                  show={issetShareId}
                  onHide={() => setShareId(false)}
                  handleSubmit={handleExportClick}
                  title={"Export Contact?"}
                  message={"Are you sure you want to Export Contact?"}
                  btn1="CANCEL"
                  btn2="Export"
                />
              )}

              {isOpenFetchFromMiracleContact && (
                <ContactSyncMiracle
                  show={isOpenFetchFromMiracleContact}
                  onClose={() => setIsOpenFetchFromMiracleContact(false)}
                />
              )}

              {isCreateContact && (
                <CreateContactView
                  show={isCreateContact}
                  onHide={() => {
                    setIsCreateContact(false);
                    setSearchTermFromRightSide("");
                  }}
                  setContact={setRefreshContact}
                  headerName={"Create Contact"}
                />
              )}
            </>
          ) : null}

          {showStatus ? (
            <span></span>
          ) : (
            <RightView
              openCreateContact={() => setIsCreateContact(true)}
              closeCreateContact={() => setIsCreateContact(false)}
              showInquiryAllList={() => rightSideVIewProvider("inquiry")}
              showReminder={() => rightSideVIewProvider("reminder")}
              showNotes={() => rightSideVIewProvider("personal_note")}
              showMyTask={() => rightSideVIewProvider("task_Management")}
              showMySupportTicket={() =>
                rightSideVIewProvider("support_ticket_management")
              }
              showFilterContact={openFilterLabel}
              showMyCompany={() => rightSideVIewProvider("myTeam")}
              showDashboard={() => setshowDashBoard(true)}
              showAichat={() => setshowAichat(true)}
              getData={contInfo}
              isDashBoardOpen={showDashBoard}
              closeDashboard={() => setshowDashBoard(false)}
              isAiModelopen={showAichat}
              closeisAiModel={() => setshowAichat(false)}
              contactsReload={setIsLoadContact}
              userInfo={userInfo}
              setEditorContentToEdit={setEditorContentToEdit}
              editorContentToEdit={editorContentToEdit}
              setNoDataFound1={setNoDataFound1}
              resetTrigger={resetRightSideTrigger}
              setRefreshContact={() => setRefreshContact(true)}
              setSearchTermFromRightSide={setSearchTermFromRightSide}
              setIdFromRightSide={setIdFromRightSide}
            />
          )}
        </>
      )}
      {isOrderCreateFromContactShow && (
        <OrderCreateModal
          show={isOrderCreateFromContactShow}
          onHide={() => setIsOrderCreateFromContactShow(false)}
          handleSubmit={() => setIsOrderCreateFromContactShow(false)}
          title={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
          Contact={contactInfoOrder}
          isOrderShowNum={isOrderShowFromContactType}
        />
      )}

      {isModalExcelVisible && (
        <ImportExcelForContactModal
          show={isModalExcelVisible}
          onHide={() => setIsModalExcelVisible(false)}
          handleSubmit={() => handleConfirmImportExcel()}
          title={"Import Excel For Contact"}
          message={"Please Import excel as per sample excel"}
          btn1="Cancel"
          btn2="Import"
          sampleLocation="sampleContact.xlsx"
          potions={1}
        />
      )}
      {isModalMap && (
        <ContactLocationModel
          show={isModalMap}
          onHide={() => setIsModalMap(false)}
          filterData={locationFilterData}
          filterDataTwo={{
            searchTerm,
            isUnreadState,
            selectedLabelId: selectedLabelId || 0,
            selectedSourceId: selectedSourceId || 0,
            selectedStageStatusId: selectedStageStatusId || 0,
            applicationId: applicationId ? applicationId.toString() : "",
            selectedActiveId: filters.selectedActiveId,
            selectedDays: filters.selectedDays,
            assignedByMultiTeamMember: filters.assignedByMultiTeamMember || [],
            createdByMultiTeamMember: filters.createdByMultiTeamMember || [],
          }}
        />
      )}

      {/* {isNoLabelSelected && (
        <ConfirmationModal
          show={isNoLabelSelected}
          onHide={handleConfirmationCancel}
          handleSubmit={handleConfirmationOk}
          title="No Label Selected"
          message="You cannot select any label. Please select at least one label to proceed."
          btn1="OK"
          btn2="Cancel"
        />
      )} */}

      {isModalAssignStatusVisible && (
        <RadioButtonModal
          show={isModalAssignStatusVisible}
          onHide={() => setIsModalAssignStatusVisible(false)}
          handleSubmit={handleConfirmRadioButton}
          title={
            selectedIds.length > 0
              ? `Change Status to ${selectedIds.length} contacts`
              : "Change Status to Contact"
          }
          message="Please select the Status for this contact."
          btn1="Cancel"
          btn2="Submit"
          options={optionRadioButtonStatus}
          selectedLabelIds={
            user?.find((item) => item.id === statusAssignContactId)
              ?.contact_status
          }
          contactId={contactId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.name}
          showColorBadge={true}
        />
      )}
      {isModalChangeSourceTypeVisible && (
        <RadioButtonModal
          show={isModalChangeSourceTypeVisible}
          onHide={() => setIsModalChangeSourceTypeVisible(false)}
          handleSubmit={handleConfirmChangeSourceType}
          title={
            selectedIds.length > 0
              ? `Change Source Type to ${selectedIds.length} contacts`
              : "Change Source Type to Contact"
          }
          message="Please select the Source Type for selected contacts."
          btn1="Cancel"
          btn2="Submit"
          options={soruceLists}
          selectedLabelIds={selectedSource?.id}
          contactId={contactId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.source_name}
          showColorBadge={true}
        />
      )}
      {isModalEditContactVisible && (
        <CreateContactView
          show={isModalEditContactVisible}
          onHide={() => setIsModalEditContactVisible(false)}
          headerName={"Edit Contact"}
          contactData={contInfoEdit}
          setIsCreateContact1={setIsModalEditContactVisible}
          setShowRightSide={false}
          setContact={setRefreshContact}
        />
      )}

      {isModalVisible && (
        <CheckBoxModal
          show={isModalVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirm}
          title={
            selectedIds.length > 0
              ? `Assign Labels to ${selectedIds.length} contacts`
              : "Assign Labels to Contact"
          }
          btn1="Cancel"
          btn2="Submit"
          options={options}
          // selectedLabelIds={selectedLabelIds}
          selectedLabelIds={user?.find((item) => item.id === contactId)?.lable}
          contactId={contactId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.lable_name}
          showColorBadge={true}
        />
      )}

      {isModalAssignUserVisible && (
        <CheckBoxModal
          show={isModalAssignUserVisible}
          onHide={() => setIsModalAssignUserVisible(false)}
          handleSubmit={handleConfirmAssignUser}
          title={
            selectedIds.length > 0
              ? `Assign ${selectedIds.length} contacts to your Team`
              : "Assign your User"
          }
          message="Please select the Users for this contact."
          btn1="Cancel"
          btn2="Submit"
          options={optionJoinCompany}
          selectedLabelIds={
            user?.find((item) => item.id === userAssignContactId)
              ?.assinged_to_work_a_application_id
          }
          contactId={contactId}
          getOptionName={getOptionName}
          showColorBadge={false}
          smallInfoMessage={
            "Clearing all checkboxes will unassign every selected contact"
          }
          hideSmallInfoMessageInCheck={true}
          isContactAssigedTeamMemberBirfercationShow={true}
        />
      )}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirmFilter}
          title="Filter your Contact"
          message="Please select the Labels , Source and Demography for the Contact."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 2, 3, 4, 9, 6, 8, 20]}
          pageId={1}
          initialFilterData={filters.filterData}
          initialCheckedOptions={filters.checkedOptions}
          initialCheckedSourceTypes={filters.checkedSourceTypes}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          initialCheckedOptionsStageStatus={filters.checkedOptionsStageStatus}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
          // initialSelectedActiveId={filters.selectedActiveId}
          // initialSelectedDays={filters.selectedDays}
          initialCheckedAssignedByMultiTeamMember={
            filters.assignedByMultiTeamMember
          }
          initialCheckedOptionsContactAssignOrnot={
            filters.checkedOptionsContactassignOrNot || []
          }
          initialCheckedCreatedByMultiTeamMember={
            filters.createdByMultiTeamMember
          }
          labelFilderApplyAndOr={filters.labelwiseContactShowAndOrNot}
        />
      )}

      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => setIsDeleteConfirmation(false)}
          handleSubmit={() => handelDeleteContact()}
          title={
            selectedIds.length > 0
              ? `Delete ${selectedIds.length} Contacts`
              : "Delete this Contact"
          }
          message={
            selectedIds.length > 0
              ? `Are you sure you want Delete ${selectedIds.length} Contacts?`
              : "Are you sure you want Delete this Contact?"
          }
          btn1="CANCEL"
          btn2="DELETE CONTACT"
          flag_to_action="delete_flag"
        />
      )}
      {isPinConfirmation.show && (
        <ConfirmationModal
          show={isPinConfirmation.show}
          onHide={() => setIsPinConfirmation({ show: false, type: null })}
          handleSubmit={() => handelPinContact()}
          title={
            isPinConfirmation.type === "pin"
              ? "Pin this Contact"
              : "UnPin this Contact"
          }
          message={
            isPinConfirmation.type === "pin"
              ? "Are you sure you want to Pin this Contact?"
              : "Are you sure you want to UnPin this Contact?"
          }
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isReadUnreadConfirmation.show && (
        <ConfirmationModal
          show={isReadUnreadConfirmation.show}
          onHide={() =>
            setIsReadUnreadConfirmation({ show: false, type: null })
          }
          handleSubmit={handelReadUnreadContact}
          title={
            isReadUnreadConfirmation.type === "read"
              ? "Mark Contact as Read"
              : "Mark Contact as Unread"
          }
          message={
            isReadUnreadConfirmation.type === "read"
              ? "Are you sure you want to mark this contact as read?"
              : "Are you sure you want to mark this contact as unread?"
          }
          btn1="CANCEL"
          btn2="APPLY"
        />
      )}
      {isArchiveConfirmation.show && (
        <ConfirmationModal
          show={isArchiveConfirmation.show}
          onHide={() => setIsUnArchiveConfirmation({ show: false, type: null })}
          handleSubmit={handelArchiveContact}
          title={
            isArchiveConfirmation.type === "archive"
              ? selectedIds.length > 0
                ? `Mark ${selectedIds.length} Contacts as Archive`
                : "Mark Contact as Archive"
              : selectedIds.length > 0
                ? `Mark ${selectedIds.length} Contacts as UnArchive`
                : "Mark Contact as UnArchive"
          }
          message={
            isArchiveConfirmation.type === "archive"
              ? selectedIds.length > 0
                ? `Are you sure you want to mark these ${selectedIds.length} contacts as archive?`
                : "Are you sure you want to mark this contact as archive?"
              : selectedIds.length > 0
                ? `Are you sure you want to mark these ${selectedIds.length} contacts as unarchive?`
                : "Are you sure you want to mark this contact as unarchive?"
          }
          btn1="CANCEL"
          btn2="APPLY"
        />
      )}
      {isShowConformationForStartWorkFlow && (
        <WorkFlowModel
          show={isShowConformationForStartWorkFlow}
          onHide={() => setIsShowConformationForStartWorkFlow(false)}
          handleSubmit={() => setIsShowConformationForStartWorkFlow(false)}
          title={`Start WorkFlow For Contact`}
          message={`Are you sure you want to Start WorkFlow for Contact?`}
          showTaskTemplateFor={1}
          showOrderId={workFlowOrderId}
          setWorkFlowFor={"Contact"}
          btn1="CANCEL"
          btn2="Start"
        />
      )}

      {isKanbanViewDisplay && (
        <ContactKanbanBoard
          supportTicketFlag={1}
          show={isKanbanViewDisplay}
          handleclose={() => {
            setIsKanbanViewDisplay(false);
          }}
        />
      )}
      {isCreatecampaignsConfirmation && (
        <CampaignModal
          show={isCreatecampaignsConfirmation}
          onHide={() => setIsCreatecampaignsConfirmation(false)}
          whereParams={{
            ...filters,
            statusFilter: filters.checkedOptionsStageStatus,
            startDate: filters.startSearchDate,
            endDate: filters.endSearchDate,
            sourceTypeFilter: filters.checkedSourceTypes,
            labelFilter: filters.checkedOptions,
            searchTerm,
            isPin: isPinnedState,
            isUnread: isUnreadState,
            labelId: selectedLabelId,
            sourceId: selectedSourceId,
            stageStatusId: selectedStageStatusId,
            isPinByApplicationId: applicationId
              ? applicationId?.toString()
              : undefined,
            isArchive: isArchivState,
            appliedTo: isAllSelected
              ? "all"
              : selectedIds.length > 0
                ? selectedIds
                : null,
          }}
          templateVariables={variableConfig}
          onSuccess={(res) => {
            // console.log("Campaign sent!", res.campaign_id);
            // refresh your lead list, show a success notification, etc.
          }}
        />
      )}
      {isCRMDashBoardOpen && (
        <NewDashboardView onClose={() => setIsCRMDashBoardOpen(false)} />
      )}
    </>
  );
};

export default LeftSideView;
