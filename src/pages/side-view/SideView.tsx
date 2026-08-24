import { CSS } from "@dnd-kit/utilities";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../common/AppContext";
import { axiosInstance } from "../../services/axiosInstance";
import {
  fetchGetByIdUser,
  ILoginData,
  logOutApi,
} from "../left-side/LeftSideController";
import { fetchReminderCount } from "../right-side/RightViewController";

import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";

import { DndContext, useDraggable } from "@dnd-kit/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  handleRefresh,
  openInNewTab,
  useEscapeKey,
} from "../../common/SharedFunction";
import ContactLocationModel from "../../components/model/ContactLocationModel";
import ExploreNearbyModal from "../../components/model/ExploreNearbyModel";
import { PAGE_ID, PERMISSION_TYPE } from "../../helpers/AppEnum";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import useAdvertisementStore from "../../store/advertisement/useAdvertisemrntStore";
import { useCompanyStore } from "../../store/company/useCompanyStore";
import { useContactFilterStore } from "../../store/contact/useContactFilterStore";
import { useCommonFilterStore } from "../../store/report/useCommonFilterStore";
import useMiracleFlagStore from "../../store/miracle/useMiracleFlagStore";
import { useTaskCategoryStoreSideView } from "../../store/sticky note/useTaskCategoryStoreSideView";
import { useFeatureFlagStore } from "../../store/supportTicket/useSupportTicketFlag";
import CustomerSupportFormView from "../customer-support/customer-support-form/CustomerSupportFormView";
import CreateCompanyView from "../left-side/create-company/CreateCompanyView";
import MiracleConfigurationsView from "../left-side/header/Setting/work-flow-automation/MiracleConfigurationsView";
import ManageWorkspacesModal from "../../components/model/ManageWorkspacesModal";
import ReviewDialog from "../../components/review/ReviewDialog";
import { useReviewStore } from "../../store/review/useReviewStore";
import { IFilterLocationParams } from "../left-side/LeftSideView";
import {
  fetchCompanyApi,
  ICompany,
} from "../left-side/list-company/ListCompanyController";
import { TaskStickyIcon } from "../StickyNotes/TaskStickyIcon";
import BottomView from "./BottomView";
import SidebarView from "./SideBarView";
import UpperView from "./UpperView";

// Fallback only — server always sends review.delaySeconds (REVIEW_PROMPT_DELAY_SECONDS env var).
const DEFAULT_REVIEW_PROMPT_DELAY_MS = 60000;

interface IProp {
  profileDetail?: ILoginData;
}

const DraggableWidget = ({
  children,
  position,
}: {
  children: React.ReactNode;
  position: { x: number; y: number };
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "support-widget",
  });

  const style: React.CSSProperties = {
    position: "fixed",
    bottom: `${position.y}px`,
    right: `${position.x}px`,
    transform: CSS.Translate.toString(transform),
    zIndex: 9999,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const SideView = ({ profileDetail }: IProp) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const UUID = localStorage.getItem("UUID");

    if (!UUID) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const [activeView, setActiveView] = useState(() =>
    searchParams.get("view") === "reports" ? "reports_home" : "dashboard",
  );

  const [isOpen, setIsOpen] = useState(true);
  const [openMenu, setOpenMenu] = useState<string[]>([
    "CompanySetup",
    "HR",
    "Activities",
    "CRM",
    "HRMS",
    "Production",
    "Account",
    "Automation",
    "Settings",
    "Masters",
    "Product Settings",
    "Others",
    "new reports",
    "Inventory",
    "CS",
  ]);
  const [isReportShow, setIsReportShow] = useState(false);
  const [reportName, setReportName] = useState("");
  const [isCRMDashBoardOpen, setIsCRMDashBoardOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [loginById, setLoginById] = useState<ILoginData>();
  const [reportType, setReportType] = useState("");
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isUnreadState, setIsUnreadState] = useState<number>(0);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedStageStatusId, setSelectedStageStatusId] = useState<
    number | null
  >(null);
  let applicationId = localStorage.getItem("UUID");
  const { filters, setFilters } = useContactFilterStore();

  const {
    isEditContact,
    showRightSide,
    setShowRightSide,
    setCheckToken,
    companyData,
    setPermissions,
    showAttendancePopup,
    setShowAttendancePopup,
    setCompanyData,
  } = useContext(AppContext)!;
  const { setAdvertisement } = useAdvertisementStore();
  const setFeatureEnabled = useMiracleFlagStore(
    (state) => state.setFeatureEnabled,
  );
  const [showPinSetModel, setShowPinSetModel] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [appliedReportType, setAppliedReportType] = useState("");
  const clearFilters = useCommonFilterStore((state) => state.clearFilters);
  const setReportFilters = useCommonFilterStore((state) => state.setFilters);

  const [isDragging, setIsDragging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormViewOpen, setIsFormViewOpen] = useState(false);

  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
  const [noDataFound, setNoDataFound] = useState();
  const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();
  const [loading, setLoading] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showManageWorkspaces, setShowManageWorkspaces] = useState(false);
  const [refersh, setRefresh] = useState(false);
  const [isExploreNearbyShow, setIsExploreNearbyShow] = useState(false);
  const [isModalMap, setIsModalMap] = useState<boolean>(false);
  const [dropdownOpenMiracle, setDropdownOpenMiracle] = useState(false);

  const [widgetPosition, setWidgetPosition] = useState(() => {
    const saved = localStorage.getItem("tawk-widget-position");

    if (saved) {
      return JSON.parse(saved);
    }

    return {
      x: 30,
      y: 30,
    };
  });

  const flag = useFeatureFlagStore(
    (state) => state.flags.RAISE_SUPPORT_TICKET_FLAG,
  );

  const handleDragEnd = (event: any) => {
    setIsDragging(false);

    const { delta } = event;

    const newPosition = {
      x: Math.max(
        0,
        Math.min(window.innerWidth - 80, widgetPosition.x - delta.x),
      ),
      y: Math.max(
        0,
        Math.min(window.innerHeight - 80, widgetPosition.y - delta.y),
      ),
    };

    setWidgetPosition(newPosition);

    localStorage.setItem("tawk-widget-position", JSON.stringify(newPosition));
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  useEscapeKey(() => {
    if (!isModalMap && !dropdownOpenMiracle) {
    } else {
      setIsModalMap(false);
      setDropdownOpenMiracle(false);
    }
  });

  // const handleCloseReport = () => {
  //     setActiveView("dashboard");
  //     setAppliedReportType("");
  // };
  // useEscapeKey(() => {
  //     handleCloseReport();
  // });

  const token = localStorage.getItem("token");
  const localId = localStorage.getItem("UUID");

  let LoginPin: Number;

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
          setShowAttendancePopup(
            response.data.data.compulsary_attendance === true &&
            response.data.data.hasCheckedInToday === false,
          );

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

          LoginPin = response.data.data.PinNumber;
          if (response.data.data.PinNumber === 0) {
            const timer = setTimeout(() => {
              setShowPinSetModel(true);
            }, 10000);
            return () => clearTimeout(timer);
          }
        } else {
          toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          localStorage.clear();
          navigate("/", { replace: true });
          window.location.reload();
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          setCheckToken(true);
        } else {
          if (error?.response?.data?.ack_msg === "Please Login") {
            localStorage.clear();
            navigate("/", { replace: true });
            window.location.reload();
          }
          toast.error(error?.response?.data?.ack_msg);
        }
      }
    };
    if (token) {
      (async () => {
        await LoginSubmit();
        await fetchReminderCount(setReminderCount);
        // await fetchLabelApis();
        // await fetchSourceOfTypesApi();
        // await fetchStageStatusContact();
        await fetchGetByIdUser(localId, setLoginById);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      })();
    }
  }, [setPermissions, token]);

  const canViewQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProformaInvoice = useCheckUserPermission(
    PAGE_ID.PROFORMA_INVOICE_REPORT,
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
  const canViewReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.VIEW,
  );
  const canViewReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTeamPerformance = useCheckUserPermission(
    PAGE_ID.TEAMPERFORMANCE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAccountOutstanding = useCheckUserPermission(
    PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPendingWork = useCheckUserPermission(
    PAGE_ID.PENDINGWORK_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductInventory = useCheckUserPermission(
    PAGE_ID.PRODUCTINVENTORY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewMyTeamList = useCheckUserPermission(
    PAGE_ID.TEAM_MEMBER_WITH_ACCESS_RIGHT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAttendanceSalary = useCheckUserPermission(
    PAGE_ID.ATTEDANCESALARY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewEmployeeReport = useCheckUserPermission(
    PAGE_ID.EMP_ACCOUNT_HISTORY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductMovement = useCheckUserPermission(
    PAGE_ID.PRODUCTMOVEMENT_REPORT,
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
  const canViewContact = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
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
  const canViewInquiry = useCheckUserPermission(
    PAGE_ID.ALLINQUIRY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTeamExpense = useCheckUserPermission(
    PAGE_ID.TEAMEXPENSE_REPORT,
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
  const canViewPendingOrder = useCheckUserPermission(
    PAGE_ID.PENDINGSALESORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPendingPurchase = useCheckUserPermission(
    PAGE_ID.PENDINGPURCHASEORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSupportTicket = useCheckUserPermission(
    PAGE_ID.SUPPORT_TICKET_REPORT,
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
  const canViewProductPending = useCheckUserPermission(
    PAGE_ID.PRODUCTPENDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewChainWise = useCheckUserPermission(
    PAGE_ID.CONTACT_CHAIN_WISE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAiModel = useCheckUserPermission(
    PAGE_ID.AI_ASSISTANT,
    PERMISSION_TYPE.VIEW,
  );
  const canView = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.VIEW);
  const canViewTaskCategory = useCheckUserPermission(
    PAGE_ID.TASK_CATEGORY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTaskTemplate = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSourceOfTypes = useCheckUserPermission(
    PAGE_ID.SOURCE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAllCountries = useCheckUserPermission(
    PAGE_ID.COUNTRIE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStates = useCheckUserPermission(
    PAGE_ID.STATES,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCities = useCheckUserPermission(
    PAGE_ID.CITIES,
    PERMISSION_TYPE.VIEW,
  );
  const canViewAreas = useCheckUserPermission(
    PAGE_ID.AREAS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewExpenseTypes = useCheckUserPermission(
    PAGE_ID.EXPENSES,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPaymentType = useCheckUserPermission(
    PAGE_ID.PAYMENT_TYPE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewDepartment = useCheckUserPermission(
    PAGE_ID.DEPARTMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewLeaveType = useCheckUserPermission(
    PAGE_ID.LEAVE_TYPE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewVisitType = useCheckUserPermission(
    PAGE_ID.VISIT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStagesStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductGroup = useCheckUserPermission(
    PAGE_ID.PRODUCTGROUP,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewWorkStation = useCheckUserPermission(
    PAGE_ID.MACHINE_MANAGEMENTS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductUnit = useCheckUserPermission(
    PAGE_ID.UNIT_MASTER,
    PERMISSION_TYPE.VIEW,
  );
  const canViewprocess = useCheckUserPermission(
    PAGE_ID.MACHINE_MANAGEMENTS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewWarehouse = useCheckUserPermission(
    PAGE_ID.WAREHOUSE, // ← hopefully you have this enum value
    PERMISSION_TYPE.VIEW,
  );
  const canViewBillOfMaterial = useCheckUserPermission(
    PAGE_ID.BILL_OF_MATERIALS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductsReport = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPriceList = useCheckUserPermission(
    PAGE_ID.PRICE_LIST,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStockAdjustment = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCustomFormField = useCheckUserPermission(
    PAGE_ID.CUSTOM_FORM_FIELD,
    PERMISSION_TYPE.VIEW,
  );
  const canViewLeaveManagement = useCheckUserPermission(
    PAGE_ID.LEAVE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPersonalNotes = useCheckUserPermission(
    PAGE_ID.PERSONAL_NOTE,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStatusWiseReport = useCheckUserPermission(
    PAGE_ID.STATUS_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewLockControlMaster = useCheckUserPermission(
    PAGE_ID.LOCK_CONTROL,
    PERMISSION_TYPE.VIEW,
  );

  const handleSingleReportShow = (name: string) => {
    if (name) {
      clearFilters(name);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const defaultDates = [startOfMonth, endOfMonth];
      setReportFilters(name, {
        selectedDateArray: defaultDates,
        startSearchDate: defaultDates[0],
        endSearchDate: defaultDates[1],
      });
    }

    if (name === "online_store") {
      window.open(
        `${window.location.origin}/website/${companyData?.qr_code}`,
        "_blank",
      );
      return;
    }
    if (canViewTeamPerformance && name === "team_performance") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewOrder && name === "order") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (canViewQuotation && name === "quotation") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (canViewProformaInvoice && name === "proforma_invoice_report") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (canViewDispath && name === "dispatch_report") {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (canViewOrderInvoice && name === "order_invoice") {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (canViewReturnSalesInvoice && name === "return_sales_invoice") {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (canViewPurchaseOrder && name === "purchase_order") {
      setActiveView("Inventory");
      setAppliedReportType(name);
      return;
    } else if (canViewInward && name === "inward_report") {
      setActiveView("Inventory");
      setAppliedReportType(name);
      return;
    } else if (canViewPurchaseInvoice && name === "purchase_invoice") {
      setActiveView("Inventory");
      setAppliedReportType(name);
      return;
    } else if (
      canViewReturnPurchaseInvoice &&
      name === "return_purchase_invoice"
    ) {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (
      canViewAccountOutstanding &&
      (name === "account" || name === "Receivable" || name === "Payable")
    ) {
      setActiveView("Account");

      setReportType(name === "Receivable" || name === "Payable" ? name : "");

      setAppliedReportType("account");

      return;
    } else if (canViewPendingWork && name === "pending") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewProductInventory && name === "product_inventory") {
      setActiveView("Inventory");
      setAppliedReportType(name);
      return;
    } else if (canViewMyTeamList && name === "My_Team_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (canViewAttendanceSalary && name === "attendance_salary") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (canViewEmployeeReport && name === "Emp_Transaction_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (canViewProductMovement && name === "product_report") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (
      canViewProductPending &&
      name === "product_wise_pending_report"
    ) {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewCategoryMovement && name === "category_report") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (
      canViewCategoryPending &&
      name === "category_wise_pending_report"
    ) {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewContact && name === "all_contact_report") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (
      canViewALLDeletedContact &&
      name === "all_deleted_contact_report"
    ) {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (
      canViewSourceReport &&
      name === "source_wise_contact_statistic_report"
    ) {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (
      canViewLabelReport &&
      name === "label_wise_contact_statistics_report"
    ) {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewInquiry && name === "all_inquiry_report") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (canViewTeamExpense && name === "team_day_wise_expanse_report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (canViewVisitReport && name === "all_visit_report") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (canViewCallReport && name === "all_call_report") {
      setActiveView("CRM");
      setAppliedReportType(name);
      return;
    } else if (canViewPendingOrder && name === "pending_order") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewPendingPurchase && name === "pending_purchase") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewTask && name === "alltask_report") {
      setActiveView("Others");
      setAppliedReportType(name);
      return;
    } else if (canViewSupportTicket && name === "support_ticket_report") {
      setActiveView("Others");
      setAppliedReportType(name);
      return;
    } else if (canViewAllAccountTransition && name === "allaccount_report") {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (
      canViewAllAccountTransition &&
      name === "account_credit_report"
    ) {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (canViewAllAccountTransition && name === "account_debit_report") {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (canViewAllReminder && name === "allreminder_report") {
      setActiveView("Others");
      setAppliedReportType(name);
      return;
    } else if (canViewChainWise && name === "all_contact_chainwise_report") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (name === "daily_sales_invoice") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (canViewTaskCategory && name === "Task_Category") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewTaskTemplate && name === "Task_Template") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewSourceOfTypes && name === "Source_Of_Types") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewLabel && name === "label_report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewAllCountries && name === "All_countries_report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewStates && name === "States_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewCities && name === "Cities_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewAreas && name === "Areas_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewExpenseTypes && name === "Expense_Types_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewPaymentType && name === "Payment_Type_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewDepartment && name === "Department_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewLeaveType && name === "Leave_Type_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewVisitType && name === "Visit_Type_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewStagesStatus && name === "Stages_Status_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewProductGroup && name === "Product_Group_Report") {
      setActiveView("Product Settings");
      setAppliedReportType(name);
      return;
    } else if (canViewProductCategory && name === "Product_Category_Report") {
      setActiveView("Product Settings");
      setAppliedReportType(name);
      return;
    } else if (canViewWorkStation && name === "Work_Station_Report") {
      setActiveView("Production");
      setAppliedReportType(name);
      return;
    } else if (canViewProductUnit && name === "Product_Unit_Report") {
      setActiveView("Product Settings");
      setAppliedReportType(name);
      return;
    } else if (canViewprocess && name === "Process_Report") {
      setActiveView("Production");
      setAppliedReportType(name);
      return;
    } else if (canViewWarehouse && name === "Warehouse_Report") {
      setActiveView("Production");
      setAppliedReportType(name);
      return;
    } else if (name === "Job_Card_Grid") {
      setActiveView("Production");
      setAppliedReportType(name);
      return;
    } else if (canViewBillOfMaterial && name === "BillOfMaterial_Report") {
      setActiveView("Production");
      setAppliedReportType(name);
      return;
    } else if (canViewProductsReport && name === "Products_Report") {
      setActiveView("Product Settings");
      setAppliedReportType(name);
      return;
    } else if (name === "tax_master") {
      setActiveView("Product Settings");
      setAppliedReportType(name);
      return;
    } else if (canViewPriceList && name === "Price_List_Report") {
      setActiveView("Product Settings");
      setAppliedReportType(name);
      return;
    } else if (canViewStockAdjustment && name === "StockAdjustment_Report") {
      setActiveView("Production");
      setAppliedReportType(name);
      return;
    } else if (canViewCustomFormField && name === "CustomFieldForm_Report") {
      setActiveView("Masters");
      setAppliedReportType(name);
      return;
    } else if (canViewLeaveManagement && name === "LeaveManagement_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (canViewPersonalNotes && name === "PersonalNotes_Report") {
      setActiveView("Others");
      setAppliedReportType(name);
      return;
    } else if (canViewStatusWiseReport && name === "status_wise_report") {
      setActiveView("new reports");
      setAppliedReportType(name);
      return;
    } else if (name === "Process_Attendance") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Attendance_register_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Salary_register_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Salary_Process") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Compensation_Adjustments") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "holiday_master") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Payment_wise_account_Report") {
      setActiveView("Account");
      setAppliedReportType(name);
      return;
    } else if (canViewLockControlMaster && name === "Lock_Control_master") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "round_off") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "adjustment_type") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "day_adjustment") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Emp_AccountOutstanding_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "Expense_Detailed_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
      return;
    } else if (name === "shortcut") {
      openInNewTab("/shortcutkey", 1);
      return;
    } else if (name === "whatsapp_template") {
      setActiveView("Settings");
      setAppliedReportType(name);
      return;
    } else if (name === "miracle_integration") {
      setDropdownOpenMiracle(true);
      return;
    } else if (name === "company_profile") {
      const fetchCompany = async () => {
        await fetchCompanyApi(
          setCompanyLists,
          "",
          setNoDataFound,
          setCompanyJoinOrCreate,
          setLoading,
        );
        setShowEditCompany(true);
      };

      fetchCompany();
      return;
    } else if (name === "manage_workspaces") {
      setShowManageWorkspaces(true);
      return;
    } else if (canViewAiModel && name === "Explore_In_GoogleMap") {
      setIsExploreNearbyShow(true);
      return;
    } else if (canView && name === "View_Google_Map") {
      setIsModalMap(true);
      return;
    } else if (name === "Print_QR_Code") {
      window.open("/qr_code", "_blank");
      return;
    } else if (name === "GST_In") {
      setActiveView("Account");
      setReportType("IN");
      setAppliedReportType("GSTInAndOut_Report");
      return;
    } else if (name === "GST_Out") {
      setActiveView("Account");
      setReportType("OUT");
      setAppliedReportType("GSTInAndOut_Report");
      return;
    } else if (canViewAiModel && name === "AI_chat_Dashboard") {
      setActiveView("Others");
      setAppliedReportType(name);
      return;
    } else if (name === "route_planner") {
      setActiveView("Others");
      setAppliedReportType(name);
      return;
    }
    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    return;
  };

  const { taskCategories, fetchTaskCategoriesSideView } =
    useTaskCategoryStoreSideView();

  const categoryIds = taskCategories.map((item) => item.id).join(",");

  useEffect(() => {
    fetchTaskCategoriesSideView();
  }, []);

  const takeAttendance = async () => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      attendance_status: 1,
      a_application_login_id: getUUID,
      device_type: 1,
    };
    try {
      const data = await axiosInstance.post("check-attendance", requestData);
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setShowAttendancePopup(false);
      }
      toast.success(data.data.ack_msg);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async (e?: React.MouseEvent) => {
    // useFeatureFlagStore.getState().setFlags({
    //   RAISE_SUPPORT_TICKET_FLAG: 1,
    // });
    if (e) e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const result = await logOutApi();
    setIsLoggingOut(false);
    if (result.success) {
      localStorage.clear();
      handleRefresh();
    } else {
      toast.error(result.message || "Logout failed");
    }
  };

  const handleExtraClick = () => {
    const getUUID = localStorage.getItem("UUID");
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/customer-support/`;
    const myWindow = window.open(supportURL, "_blank");
  };

  if (showAttendancePopup) {
    return (
      <div
        className="modal show fade"
        tabIndex={-1}
        style={{ display: "block" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content bg-light">
            <div className="modal-body d-flex flex-column justify-content-center align-items-center text-center">
              <img
                src={require("../../assets/images/deshFlow_log.png")}
                width={350}
                alt=""
                className="mb-5"
              />
              <h2 className="fw-semibold mb-4 text-dark">
                Please Check-in First
              </h2>
              <button
                className="btn text-light btn rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                title="Check Out"
                onClick={takeAttendance}
                style={{
                  backgroundColor: "rgb(0, 128, 0)",
                  borderRadius: "50%",
                  height: "80px",
                  width: "80px",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="45px"
                  viewBox="0 -960 960 960"
                  width="45px"
                  fill="#fff"
                >
                  <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z"></path>
                </svg>
              </button>
              <p className="mt-4 text-muted">
                Tap the button above to mark your attendance to access your
                system.
              </p>
              <button
                className="mt-2"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  await handleLogout();
                }}
              >
                Logout
              </button>
            </div>
            <div className="modal-footer border-0 justify-content-center">
              <small className="text-muted">
                Deskflow CRM &copy; {new Date().getFullYear()}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <div
        style={{
          padding: "2px",
          background: "rgb(240 242 245)",
          height: "100vh",
        }}
      >
        <SidebarView
          onReportClick={handleSingleReportShow}
          onInsightsClick={() => {
            setActiveView("dashboard");
            setAppliedReportType("");
          }}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          activeReport={appliedReportType}
        />
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgb(240 242 245)",
          padding: "2px",
          height: "100vh",
        }}
      >
        <div>
          <UpperView profileDetail={loginById} />
        </div>
        {/* <div>
                    <MiddleView />
                </div> */}
        <div>
          <BottomView
            activeView={activeView}
            reportName={reportName}
            appliedReportType={appliedReportType}
            // onCloseReport={handleCloseReport}
            reportType={reportType}
            setActiveView={setActiveView}
            setAppliedReportType={setAppliedReportType}
            onReportClick={handleSingleReportShow}
          />
        </div>
        <TaskStickyIcon
          categoryIds={categoryIds}
        // categoryNames={categoryNames}
        />
      </div>
      {Number(flag) === 2 && (
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <DraggableWidget position={widgetPosition}>
            <div
              onMouseUp={(e) => {
                if (!isDragging) {
                  setIsFormViewOpen((prev) => !prev);
                  setShowForm((prev) => !prev);
                }
              }}
              onClick={(e) => {
                e.stopPropagation(); // sirf ye rakho
              }}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#FF7D12",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: isDragging
                  ? "none"
                  : "transform 0.2s, box-shadow 0.2s",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15)";
                }
              }}
            >
              {isFormViewOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z"
                    fill="white"
                  />
                  <circle cx="8" cy="10" r="1.5" fill="white" />
                  <circle cx="12" cy="10" r="1.5" fill="white" />
                  <circle cx="16" cy="10" r="1.5" fill="white" />
                </svg>
              )}
            </div>
          </DraggableWidget>
        </DndContext>
      )}
      {Number(flag) === 2 && showForm && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "30px",
            left: "10px",
            width: "480px",
            // maxWidth: "480px",
            marginLeft: "auto",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 1000,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <CustomerSupportFormView
            onSuccess={() => {
              setShowForm(false);
              setIsFormViewOpen(false);
            }}
            showExtraButton={true}
            fullWidth={true}
            isExtraVisible={false}
            onExtraClick={handleExtraClick}
          />
        </div>
      )}
      <CreateCompanyView
        show={showEditCompany}
        onHide={() => setShowEditCompany(false)}
        companyToEdit={companyLists[0]}
        setRefresh={setRefresh}
        headerName={"Edit Company"}
        isShowApiKey={1}
      />
      <ManageWorkspacesModal
        show={showManageWorkspaces}
        onHide={() => setShowManageWorkspaces(false)}
      />
      <ReviewDialog />
      {isExploreNearbyShow && (
        <ExploreNearbyModal
          show={isExploreNearbyShow}
          onHide={() => setIsExploreNearbyShow(false)}
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
      {dropdownOpenMiracle && (
        <MiracleConfigurationsView
          show={dropdownOpenMiracle}
          onHide={() => setDropdownOpenMiracle(false)}
          headerName="Add Miracle Configurations"
        />
      )}
    </div>
  );
};

export default SideView;
