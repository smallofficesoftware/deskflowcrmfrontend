import React, { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import {
  formatDateYMD,
  useEscapeKey,
} from "../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../helpers/AppEnum";
import { IFilterPayload } from "../../helpers/AppInterface";
import { TReactSetState } from "../../helpers/AppType";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import { ITitle } from "../../pages/dashboard/DashoardController";
import AccountCreaditReport from "../../pages/dashboard/Reports/Account Credit Report/AccountCreaditReport";
import AccountDebitReport from "../../pages/dashboard/Reports/Account Debit Report/AccountDebitReport";
import AccountOutstandingReportsVIew from "../../pages/dashboard/Reports/Account Outstanding/AccountOutstandingReportsVIew";
import AllAccountReports from "../../pages/dashboard/Reports/All Account Report/AllAccountReportsVIew";
import AllCallReportsView from "../../pages/dashboard/Reports/All Call Report/AllCallReportView";
import AllcontactReport from "../../pages/dashboard/Reports/All Contact Report/allContactReportView";
import AllDeletedcontactReport from "../../pages/dashboard/Reports/All Deleted Contact Report/allDeletedContactReportView";
import AllInqueryReport from "../../pages/dashboard/Reports/All Inquiry Report/inquiryView";
import AllReminderReport from "../../pages/dashboard/Reports/All Reminder Report/AllReminderReport";
import AllTaskReportsView from "../../pages/dashboard/Reports/All Task Report/allTaskReportView";
import AllVisitReportsView from "../../pages/dashboard/Reports/All Visit Report/allVisitReportView";
import TeamAttendanceReportsView from "../../pages/dashboard/Reports/Attendance & Salary Report/AttendanceReportView";
import CategoryPendingReport from "../../pages/dashboard/Reports/Category Pending/categoryPendingView";
import CategorySalesPurchaseReport from "../../pages/dashboard/Reports/Category Sales & Purchase/categorySalesPurchaseView";
import ChainWiseContactReport from "../../pages/dashboard/Reports/ChainWiseContact/ChainWiseContactReportView";
import DailyInvoiceReportView from "../../pages/dashboard/Reports/Daily Invoice Report/DailyInvoiceReportView";
import TeamDispatchDataReportsView from "../../pages/dashboard/Reports/Dispatch/DispatchReport";
import EmployeeAccountOutstandingReport from "../../pages/dashboard/Reports/Employee Account Outstanding/EmployeeAccountOutstandingReport";
import ExpenseDetailedReport from "../../pages/dashboard/Reports/Expense Datailed Report/ExpenseDetailedReportView";
import TeamInwardDataReportsView from "../../pages/dashboard/Reports/Inward/inwardView";
import AlllableReport from "../../pages/dashboard/Reports/Lable Wise Report/lableReportView";
import PaymentWiseAccountReport from "../../pages/dashboard/Reports/Payment WIse Account Report/PaymentWiseAccountReport";
import PendingOrderReportsView from "../../pages/dashboard/Reports/Pending Order/pendingOrderView";
import PendingPurchaseReportsView from "../../pages/dashboard/Reports/Pending Purchase/pendingPurchaseView";
import ProcessAttendanceReportView from "../../pages/dashboard/Reports/Process Attendance Report/ProcessAttendanceReportView";
import ProductInventoryReport from "../../pages/dashboard/Reports/Product Inventory/ProductInventory";
import ProductPendingView from "../../pages/dashboard/Reports/Product Pending/productPendingView";
import ProductSalesPurchaseReport from "../../pages/dashboard/Reports/Product Sales & Purchase/productSalesPurchaseView";
import ProformaInvoiceView from "../../pages/dashboard/Reports/Proforma Invoice Report/ProformaInvoiceView";
import TeamPurchaseInvoiceDataReportsView from "../../pages/dashboard/Reports/Purchase Invoice/purchaseInvoiceView";
import TeamPurchaseOrderDataReportsView from "../../pages/dashboard/Reports/Purchase Order/purchaseOrderView";
import TeamQuotationDataReportsView from "../../pages/dashboard/Reports/Quotations/QuotationView";
import TeamReturnPurchaseDataReportsView from "../../pages/dashboard/Reports/Return Purchase Invoice/ReturnPurchaseInvoiceView";
import TeamReturnSalesDataReportsView from "../../pages/dashboard/Reports/Return Sales Invoice/ReturnSalesInvoiceView";
import SalaryRegisterReport from "../../pages/dashboard/Reports/Salary Register/SalaryRegisterReport";
import TeamSalesInvoiceDataReportsView from "../../pages/dashboard/Reports/Sales Invoice/salesInvoiceView";
import TeamSalesOrderDataReportsView from "../../pages/dashboard/Reports/Sales Order/salesOrderView";
import AllSourceReport from "../../pages/dashboard/Reports/Source Wise Report/sourceReportView";
import StatusWiseReport from "../../pages/dashboard/Reports/Status Wise Report/StatusWiseReport";
import AllTeamExpense from "../../pages/dashboard/Reports/Team Day Wise Expense/teamDayExpenseView";
import TeamPendingWorkReportsView from "../../pages/dashboard/Reports/Team Pending Work/TeamPendingWokReportsVIew";
import TeamPerformanceReports from "../../pages/dashboard/Reports/Team Performance/TeamPerformanceReports";
import TargetIncentiveReport from "../../pages/dashboard/Reports/Target Incentive Report/TargetIncentiveReport";
import CustomerSalesPurchaseReport from "../../pages/dashboard/Reports/Customer Sales Purchase Report/CustomerSalesPurchaseReport";
import {
  fetchCompanyTeamApi,
  ICompanyTeam,
  IUserList,
} from "../../pages/left-side/LeftSideController";
import { axiosInstance } from "../../services/axiosInstance";
import { useCommonFilterStore } from "../../store/report/useCommonFilterStore";
import CustomSearchDropdown from "../CustomSearchDropdown";
import { Option } from "../MultiSelect";
import CheckBoxFilterModal from "./CheckBoxFilterModal";
import ConfirmationModal from "./ConfirmationModal";
import StatusWiseContactAndInquiryCountReport from "../../pages/dashboard/Reports/Status Wise Statistics Report/StatusWiseContactAndInquiryCountReport";

interface IOrderCreateModal {
  show: boolean;
  onHide: () => void;
  handleSubmit: () => void;
  titles: string;
  message: string;
  btn1: string;
  btn2: string;
  Contact?: IUserList;
  orderById?: any;
  reportName?: string;
  date?: Date[] | null;
  fromSideView?: boolean;
  selectedTeamMembers?: any[];
}

const ReportModal: React.FC<IOrderCreateModal> = ({
  show,
  onHide,
  handleSubmit,
  titles,
  message,
  btn1,
  btn2,
  Contact,
  orderById,
  reportName,
  date,
  selectedTeamMembers,
  fromSideView = false,
}) => {
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [appliedReportType, setAppliedReportType] = useState("");
  const [selectReportType, setSelectReportType] = useState("");
  const [reportKey, setReportKey] = useState(0);

  const [refreshReport, setRefreshReport] = useState(false);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [isCartModelOpen, setIsCartModelOpen] = useState(false);
  const getFilter = useCommonFilterStore((state) => state.getFilter);
  const setFilter = useCommonFilterStore((state) => state.setFilter);
  const setFilters = useCommonFilterStore((state) => state.setFilters);
  const clearFilters = useCommonFilterStore((state) => state.clearFilters);
  const filters = getFilter(selectReportType || "");
  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText);
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  const selectedDemography: {
    country?: string;
    state?: string;
    city?: string;
    area?: string;
  } | null = {
    country: filters.filterData?.country?.toString() || undefined,
    state: filters.filterData?.state?.toString() || undefined,
    city: filters.filterData?.city?.toString() || undefined,
    area: filters.filterData?.area?.toString() || undefined,
  };

  const selectedDayMonthYear: {
    day?: number;
    month?: number;
    year?: number;
  } | null = {
    day: Number(filters.filterData?.day) || undefined,
    month: Number(filters.filterData?.month) || undefined,
    year: Number(filters.filterData?.year) || undefined,
  };

  const canViewTargetIncentive = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewCustomerSalesPurchase = useCheckUserPermission(
    PAGE_ID.CUSTOMER_SALES_PURCHASE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewTeamPerformance = useCheckUserPermission(
    PAGE_ID.TEAMPERFORMANCE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewQuotation = useCheckUserPermission(
    PAGE_ID.QUOTATION_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewSalesOrder = useCheckUserPermission(
    PAGE_ID.SALESORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewSalesInvoice = useCheckUserPermission(
    PAGE_ID.SALESINVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewPuchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASEORDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.PURCHASEINVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewAccount = useCheckUserPermission(
    PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewEmployeeAccount = useCheckUserPermission(
    PAGE_ID.EMP_ACCOUNTOUTSTANDING_REPORT,
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

  const canViewAttedance = useCheckUserPermission(
    PAGE_ID.ATTEDANCESALARY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProcessAttendance = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.VIEW,
  );

  const canViewProduct = useCheckUserPermission(
    PAGE_ID.PRODUCTMOVEMENT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProductPending = useCheckUserPermission(
    PAGE_ID.PRODUCTPENDING_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCategory = useCheckUserPermission(
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
  const canViewSource = useCheckUserPermission(
    PAGE_ID.SOURCE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewLabel = useCheckUserPermission(
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
  const canViewExpenseDetailed = useCheckUserPermission(
    PAGE_ID.EXPENSE_DETAILED_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewVisit = useCheckUserPermission(
    PAGE_ID.ALLVISIT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCall = useCheckUserPermission(
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
  const canViewReturnSales = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewReturnPurchas = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canAlltaskReport = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllReminderReport = useCheckUserPermission(
    PAGE_ID.REMINDER_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllSupportTicketReport = useCheckUserPermission(
    PAGE_ID.SUPPORT_TICKET_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllAccountTransctionReport = useCheckUserPermission(
    PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllDeletedContactReport = useCheckUserPermission(
    PAGE_ID.ALL_DELETED_CONTACT_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllDispatchReport = useCheckUserPermission(
    PAGE_ID.DISPATCH_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllInwardReport = useCheckUserPermission(
    PAGE_ID.INWARD_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canContactChainWise = useCheckUserPermission(
    PAGE_ID.CONTACT_CHAIN_WISE_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const canStatusWise = useCheckUserPermission(
    PAGE_ID.STATUS_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [startOfMonth, endOfMonth];
  };

  const [selectedDates, setSelectedDates] = useState<Date[] | null>(() => {
    if (Array.isArray(date) && date.length === 2) {
      return date;
    }
    return getCurrentMonthDateRange();
  });
  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [userChanged, setUserChanged] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const fetchCompany = async (setTitle: TReactSetState<ITitle[]>) => {
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      table: "company_masters",
      columns:
        "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,proforma_invoice_title,id,invoice_view_formate,order_view_formate,quotation_view_formate,purchase_view_formate,workorder_view_formate,purchase_order_view_formate,inward_title,dispatch_title,inward_view_formate,dispatch_view_formate,proforma_invoice_view_formate",
      where: JSON.stringify({ a_application_login_id: uuid }),
      request_flag: 2,
    };
    try {
      const response = await axiosInstance.post("mainCommonGet", requestData);
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTitle(response.data.data || []);
      } else {
        toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
        setTitle([]);
        return "";
      }
    } catch (error: any) {
      console.error("Error fetching currencyID: ", error);
      toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
      return "";
    }
  };

  useEffect(() => {
    fetchCompany(setTitle);
  }, [setTitle]);

  useEffect(() => {
    if (title[0]?.id) {
      fetchCompanyTeamApi(setCompanyTeamLists, title[0]?.id, "");
    }
  }, [title]);

  const handleHide = () => {
    if (!isCartModelOpen) {
      onHide();
      setIsCloseConfirmation(false);
    }
  };
  let filterShowNumber: number[] = [];
  let filtershowStageandStatus;
  let filtershowSeries;

  type ReportOption = { value: string; label: string };

  const reportOptionsRaw: ReportOption[] = [
    canViewTeamPerformance && {
      value: "team_performance",
      label: "Team Performance",
    },
    canViewQuotation && {
      value: "quotation",
      label: title[0]?.quotation_title || "Quotation",
    },
    canViewSalesOrder && {
      value: "order",
      label: title[0]?.order_title || "Sales Order",
    },
    canAllDispatchReport && {
      value: "dispatch_report",
      label: title[0]?.dispatch_title
        ? `${title[0].dispatch_title} Report`
        : "Dispatch Report",
    },
    canViewSalesInvoice && {
      value: "order_invoice",
      label: title[0]?.invoice_title || "Sales Invoice",
    },

    canViewReturnSales && {
      value: "return_sales_invoice",
      label: title[0]?.return_sales_invoice_title || "Return Sales Invoice",
    },
    canViewPuchaseOrder && {
      value: "purchase_order",
      label: title[0]?.purchase_order_title || "Purchase Order",
    },
    canAllInwardReport && {
      value: "inward_report",
      label: title[0]?.inward_title
        ? `${title[0].inward_title} Report`
        : "Inward Report",
    },
    canViewPurchaseInvoice && {
      value: "purchase_invoice",
      label: title[0]?.purchase_title || "Purchase",
    },
    canViewReturnPurchas && {
      value: "return_purchase_invoice",
      label:
        title[0]?.return_purchase_invoice_title || "Return Purchase Invoice",
    },
    canViewAccount && { value: "account", label: "Account Outstanding" },
    canViewEmployeeAccount && {
      value: "employee_account",
      label: "Employee Account Outstanding",
    },
    canViewPendingWork && { value: "pending", label: "Team Pending Work" },
    canViewProductInventory && {
      value: "product_inventory",
      label: "Product Inventory & Stock Alert",
    },
    canViewAttedance && {
      value: "attendance_salary",
      label: "Attendance & Salary",
    },
    canViewProcessAttendance && {
      value: "process_attendance",
      label: "Attendance Register",
    },
    canViewAttedance && {
      value: "salary_register",
      label: "Salary Register",
    },
    canViewProduct && {
      value: "product_report",
      label: "Product Wise Movement Report",
    },
    canViewProductPending && {
      value: "product_wise_pending_report",
      label: "Product Wise Pending Report",
    },
    canViewCategory && {
      value: "category_report",
      label: "Category Wise Movement Report",
    },
    canViewCategoryPending && {
      value: "category_wise_pending_report",
      label: "Category Wise Pending Report",
    },
    canViewContact && {
      value: "all_contact_report",
      label: "All Contact Report",
    },
    canAllDeletedContactReport && {
      value: "all_deleted_contact_report",
      label: "All Deleted Contact Report",
    },
    canViewSource && {
      value: "source_wise_contact_statistic_report",
      label: "Source Wise Statistic Reports",
    },
    canViewLabel && {
      value: "label_wise_contact_statistics_report",
      label: "Label Wise Statistics Reports",
    },
    canStatusWise && {
      value: "status_wise_contact_and_inquiry_count_report",
      label: "Status Wise Contact & Inquiry Count Report",
    },
    canViewInquiry && {
      value: "all_inquiry_report",
      label: "All Inquiry Reports",
    },
    canViewTeamExpense && {
      value: "team_day_wise_expanse_report",
      label: "Team Wise Daily Expense Report",
    },
    canViewExpenseDetailed && {
      value: "expanse_detailed_report",
      label: "Expense Detailed Report",
    },
    canViewVisit && { value: "all_visit_report", label: "All Visit Reports" },
    canViewCall && { value: "all_call_report", label: "All Call Report" },
    canViewPendingOrder && {
      value: "pending_order",
      label: title[0]?.order_title
        ? `Pending ${title[0].order_title} Report`
        : "Sales Order Pending Report",
    },
    canViewPendingPurchase && {
      value: "pending_purchase",
      label: title[0]?.purchase_order_title
        ? `Pending ${title[0].purchase_order_title} Report`
        : "Purchase Order Pending Report",
    },
    canAlltaskReport && {
      value: "alltask_report",
      label: "All Task Report",
    },
    canAllSupportTicketReport && {
      value: "support_ticket_report",
      label: "Support Ticket Report",
    },
    canAllAccountTransctionReport && {
      value: "allaccount_report",
      label: "All Account Transactions Report",
    },
    canAllAccountTransctionReport && {
      value: "account_credit_report",
      label: "Account Transactions Credit Report",
    },
    canAllAccountTransctionReport && {
      value: "account_debit_report",
      label: "Account Transactions Debit Report",
    },
    canAllAccountTransctionReport && {
      value: "payment_type_wise_account",
      label: "Payment Type Wise Account Report",
    },
    canAllReminderReport && {
      value: "allreminder_report",
      label: "All Reminder Report",
    },
    canContactChainWise && {
      value: "all_contact_chainwise_report",
      label: "Chain Wise Contact Report",
    },

    canStatusWise && {
      value: "status_wise_report",
      label: "Status Wise Task Or Supp. Ticket Report",
    },
    canStatusWise && {
      value: "profoma_invoice",
      label: "Proforma Invoice",
    },
    // canViewSalesOrder && {
    //   value: "detailed_order_report",
    //   label: "Detailed Order Report",
    // },
    canViewSalesInvoice && {
      value: "daily_sales_invoice",
      label: "Daily Sales Invoice",
    },
    canViewTargetIncentive && {
      value: "target_incentive",
      label: "Target Incentive Report",
    },
    canViewCustomerSalesPurchase && {
      value: "customer_sales_purchase",
      label: "Customer-Wise Sales & Purchase Report",
    },
  ].filter(Boolean) as ReportOption[];

  const reportOptions: ReportOption[] = [
    { value: "select", label: "Select" },
    ...reportOptionsRaw.map((opt, index) => ({
      ...opt,
      label: `${index + 1}. ${opt.label}`,
    })),
  ];

  // useEffect(() => {
  //   if (reportName && !userChanged && reportName !== appliedReportType) {
  //     setSelectReportType(reportName);
  //     setAppliedReportType(reportName);

  //     setFilter(
  //       selectReportType,
  //       "selectedDateArray",
  //       selectedDates || getCurrentMonthDateRange(),
  //     );
  //     setReportKey((prev) => prev + 1);
  //   }
  // }, [reportName, selectedDates, appliedReportType, userChanged]);

  useEffect(() => {
    if (reportName && !userChanged && reportName !== appliedReportType) {
      const datesToApply = selectedDates || getCurrentMonthDateRange();
      const teamMembersToApply =
        selectedTeamMembers !== undefined ? selectedTeamMembers : [];

      if (selectedDates === undefined && selectedTeamMembers === undefined) {
        clearFilters(reportName);
      }

      setFilters(reportName, {
        selectedDateArray: datesToApply,
        startSearchDate: datesToApply?.[0],
        endSearchDate: datesToApply?.[1],
        checkedOptionsUser: teamMembersToApply,
      });

      setSelectReportType(reportName);
      setAppliedReportType(reportName);

      setReportKey((prev) => prev + 1);
    }
  }, [
    reportName,
    selectedDates,
    selectedTeamMembers,
    appliedReportType,
    userChanged,
  ]);

  useEffect(() => {
    setHasData(filters.isFilterApplied);
  }, [filters.isFilterApplied]);

  const handleReportTypeChange = (selected: Option | null) => {
    setUserChanged(true);

    const selectedValue = selected?.value ? String(selected.value) : "";
    setSelectReportType(selectedValue);
    setAppliedReportType("");
    // setFilter("selectedDateArray", getCurrentMonthDateRange());

    const defaultDates = getCurrentMonthDateRange();
    setFilters(selectedValue || "", {
      selectedDateArray: defaultDates,
      startSearchDate: defaultDates?.[0],
      endSearchDate: defaultDates?.[1],
    });

    if (selectedValue && selectedValue !== "select") {
      if (!selectedDates || selectedDates.length !== 2) {
        toast.error("Please select a valid date range.");
        return;
      }
      setAppliedReportType(selectedValue);

      // setFilter("selectedDateArray", selectedDates);
      setFilters(selectedValue || "", {
        selectedDateArray: selectedDates,
        startSearchDate: selectedDates?.[0],
        endSearchDate: selectedDates?.[1],
      });

      setReportKey((prev) => prev + 1);
    }
  };

  if (selectReportType == "team_performance") {
    filterShowNumber = [1];
  } else if (selectReportType == "quotation") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 3;
    filtershowSeries = "quotation_prefix";
  } else if (selectReportType == "order") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 4;
    filtershowSeries = "order_prefix";
  } else if (selectReportType == "order_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 5;
    filtershowSeries = "invoice_prefix";
  } else if (selectReportType == "return_sales_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 9;
    filtershowSeries = "return_sales_invoice_prefix";
  } else if (selectReportType == "purchase_order") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 7;
    filtershowSeries = "purchase_ord_prefix";
  } else if (selectReportType == "inward_report") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 7;
    filtershowSeries = "inward_prefix";
  } else if (selectReportType == "dispatch_report") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 7;
    filtershowSeries = "dispatch_prefix";
  } else if (selectReportType == "purchase_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 6;
    filtershowSeries = "purchase_prefix";
  } else if (selectReportType == "return_purchase_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 10;
    filtershowSeries = "return_purchase_invoice_prefix";
  } else if (selectReportType == "account") {
    filterShowNumber = [1, 18];
  } else if (selectReportType == "employee_account") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "pending") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "product_inventory") {
    filterShowNumber = [1, 7, 16, 17];
  } else if (selectReportType == "attendance_salary") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "process_attendance") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "product_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "product_wise_pending_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "category_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "category_wise_pending_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "all_contact_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 8, 9, 19];
    filtershowStageandStatus = 1;
  } else if (selectReportType == "all_deleted_contact_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 8, 9];
    filtershowStageandStatus = 1;
  } else if (selectReportType == "source_wise_contact_statistic_report") {
    filterShowNumber = [1, 3, 5];
  } else if (selectReportType == "label_wise_contact_statistics_report") {
    filterShowNumber = [1, 2, 5];
  } else if (selectReportType == "status_wise_contact_and_inquiry_count_report") {
    filterShowNumber = [1, 4];
  } else if (selectReportType == "all_inquiry_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 7, 18];
    filtershowStageandStatus = 2;
  } else if (selectReportType == "team_day_wise_expanse_report") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "expanse_detailed_report") {
    filterShowNumber = [1, 5, 27];
  } else if (selectReportType == "all_visit_report") {
    filterShowNumber = [1, 5, 6, 18];
  } else if (selectReportType == "all_call_report") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "pending_order") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 4;
  } else if (selectReportType == "pending_purchase") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 7;
  } else if (selectReportType == "alltask_report") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 8;
  } else if (selectReportType == "support_ticket_report") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 9;
  } else if (selectReportType == "allaccount_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "account_credit_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "account_debit_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "payment_type_wise_account") {
    filterShowNumber = [1];
  } else if (selectReportType == "allreminder_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "all_contact_chainwise_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 8, 9, 18];
  } else if (selectReportType == "status_wise_report") {
    filterShowNumber = [1, 4, 21, 5];
  } else if (selectReportType == "profoma_invoice") {
    filterShowNumber = [1, 4, 5, 7, 15, 18, 22];
  }
  //  else if (selectReportType == "detailed_order_report") {
  //   filterShowNumber = [1, 4, 5, 15, 18];
  // }
  else if (selectReportType == "daily_sales_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 5;
    filtershowSeries = "invoice_prefix";
  } else if (selectReportType == "target_incentive") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "customer_sales_purchase") {
    filterShowNumber = [1, 4, 5];
  }

  useEscapeKey(handleHide);

  const options =
    companyTeamLists.length > 0 &&
    companyTeamLists.map((item) => ({
      value: item.id,
      label: item.username,
    }));

  useEffect(() => {
    if (Array.isArray(date) && date.length === 2) {
      setSelectedDates(date);
    }
  }, [date]);

  const handelSearchDateChange = (selectedDates: Date[] | undefined) => {
    if (
      selectedDates &&
      selectedDates.length === 2 &&
      selectedDates[0] <= selectedDates[1]
    ) {
      setSelectedDates(selectedDates || []);
    }
  };

  const openFilterLabel = () => {
    setIsModalFilterVisible(true);
  };
  const openReport = () => {
    if (!selectReportType || selectReportType === "select") {
      toast.error("Please select a valid report type.");
      return;
    }

    if (!selectedDates || selectedDates.length !== 2) {
      toast.error("Please select a valid date range.");
      return;
    }

    setAppliedReportType(selectReportType);
    // setFilter("selectedDateArray", selectedDates);
    setFilters(selectReportType || "", {
      selectedDateArray: selectedDates,
      startSearchDate: selectedDates?.[0],
      endSearchDate: selectedDates?.[1],
    });

    setReportKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (refreshReport) {
      setAppliedReportType(selectReportType);
      // setFilter("selectedDateArray", selectedDates);
      setFilters(selectReportType || "", {
        selectedDateArray: selectedDates,
        startSearchDate: selectedDates?.[0],
        endSearchDate: selectedDates?.[1],
      });

      setReportKey((prev) => prev + 1);
    }
    setRefreshReport(false);
  }, [refreshReport]);

  const handleConfirmFilter = (filterPayload: IFilterPayload) => {
    const {
      filterData,
      checkedOptionsLabel: checkedOptions,
      checkedOptionsSourceType: checkedSourceTypes,
      startSearchDate,
      endSearchDate,
      checkedOptionsStageStatus,
      checkedOptionsSeries,
      checkedOptionsUser,
      selectedCategoryId,
      selectedStockTypeId,
      selectedProductId,
      selectedActiveId,
      selectedDays,
      selectedWarehouseIds,
      selectedContactId,
      selectedProductSearchId,
      selectedOrderListId,
      referenceWiseContact = 1,
    } = filterPayload;

    const today = new DateObject().format("YYYY-MM-DD");
    const [defaultStartDate, defaultEndDate] = getCurrentMonthDateRange();

    const parsedStartDate =
      startSearchDate instanceof DateObject
        ? startSearchDate.format("YYYY-MM-DD")
        : startSearchDate || formatDateYMD(defaultStartDate);

    const parsedEndDate =
      endSearchDate instanceof DateObject
        ? endSearchDate.format("YYYY-MM-DD")
        : endSearchDate || formatDateYMD(defaultEndDate);

    const isFilterApplied =
      ((checkedOptions?.length ?? 0) > 0 ||
        (checkedSourceTypes?.length ?? 0) > 0 ||
        Boolean(filterData?.country) ||
        Boolean(filterData?.state) ||
        Boolean(filterData?.city) ||
        Boolean(filterData?.area) ||
        Boolean(filterData?.active) ||
        Boolean(filterData?.orderlistselect) ||
        Boolean(startSearchDate) ||
        Boolean(endSearchDate) ||
        (checkedOptionsStageStatus?.length ?? 0) > 0 ||
        (checkedOptionsSeries?.length ?? 0) > 0 ||
        (checkedOptionsUser?.length ?? 0) > 0 ||
        Boolean(selectedActiveId) ||
        Boolean(selectedDays) ||
        Boolean(selectedWarehouseIds) ||
        Boolean(selectedCategoryId) ||
        Boolean(selectedContactId) ||
        Boolean(selectedProductSearchId) ||
        Boolean(selectedStockTypeId) ||
        Boolean(selectedOrderListId) ||
        Boolean(selectedProductId)) &&
      (parsedStartDate !== null || parsedEndDate !== null);

    /* Set Filter Hooks */
    setFilters(selectReportType || "", {
      filterData,
      checkedOptions: checkedOptions || [],
      checkedSourceTypes: checkedSourceTypes || [],
      startSearchDate: startSearchDate ? new DateObject(startSearchDate) : null,

      endSearchDate: endSearchDate ? new DateObject(endSearchDate) : null,
      checkedOptionsStageStatus: checkedOptionsStageStatus || [],
      checkedOptionsSeries: checkedOptionsSeries || [],
      checkedOptionsUser: checkedOptionsUser || [],
      selectedCategoryId: selectedCategoryId ? selectedCategoryId.value : null,
      selectedContactId: selectedContactId || null,
      selectedProductSearchId: selectedProductSearchId || null,
      selectedStockTypeId: selectedStockTypeId
        ? selectedStockTypeId.value
        : null,
      selectedProductId: selectedProductId ? selectedProductId.value : null,
      selectedActiveId,
      selectedDays,
      selectedWarehouseIds,
      // selectedOrderListId,
      selectedOrderListId: selectedOrderListId
        ? selectedOrderListId.value
        : null,
      isFilterApplied,
      selectedDateArray: [parsedStartDate, parsedEndDate],
      referenceWiseContact: referenceWiseContact || 1,
    });
    /* Set Filter Hooks */

    setHasData(isFilterApplied);
    const toDate = (
      value: string | number | Date | null | undefined,
    ): Date | null => {
      if (!value) return null;
      if (value instanceof Date) return value;
      return new Date(value);
    };
    setTimeout(() => {
      setAppliedReportType(selectReportType);
      // setSelectedDates([parsedStartDate, parsedEndDate]);
      const start = toDate(parsedStartDate);
      const end = toDate(parsedEndDate);

      if (start && end) {
        setSelectedDates([start, end]);
      } else {
        setSelectedDates(null);
      }
      setReportKey((prev) => prev + 1);
    }, 100);
    setIsModalFilterVisible(false);
  };

  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      setIsModalFilterVisible(false);
    }
  };

  return (
    <div>
      <style>
        {`
          .clear-icon {
  position: absolute;
  right: 12px;
  top: 60%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 18px;
  color: #9ca3af;
}

.clear-icon:hover {
  color: #111827;
}
        `}
      </style>
      {show && (
        <div
          className="modal1"
          style={{
            width: fromSideView ? "calc(100% - 250px)" : "",
            marginLeft: fromSideView ? "250px" : "",
            height: fromSideView ? "calc(100vh- 70px)" : "100vh",
            marginTop: fromSideView ? "70px" : "",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="modal-content1"
            style={{
              width: "98%",
              height: "calc(100vh - 20px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: "rgb(240 242 245)",
              marginTop: "10px",
            }}
          >
            <div className="row">
              <div className="col-10">
                <h2
                  className="modal-title1"
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    letterSpacing: "0.4px",
                    marginBottom: "0",
                  }}
                >
                  Reports & Statistics
                </h2>
              </div>
              <div className="col-2">
                <div className="d-flex align-items-center justify-content-end">
                  <span
                    className="close ms-3 pb-3"
                    onClick={() => setIsCloseConfirmation(true)}
                  >
                    ×
                  </span>
                </div>
              </div>
            </div>
            <p className="text-center" style={{ color: "#999" }}></p>
            <div
              className="row"
              style={{
                display: "flex",
                justifyContent: "center",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <Row style={{ padding: "none", height: "100%" }}>
                <Col style={{ height: "100%" }}>
                  <Card
                    className="text-center"
                    style={{ borderRadius: "0px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
                  >
                    <Card.Body style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
                      <div className="container-fluid d-flex ">
                        <div
                          className="col-12"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "25%",
                              zIndex: "999",
                              textAlign: "left",
                            }}
                          >
                            <label
                              htmlFor="reportType"
                              className="form-label"
                              style={{
                                textAlign: "left",
                                display: "block",
                                letterSpacing: "0.4px",
                                marginBottom: "0",
                              }}
                            >
                              <b>Select Report</b>
                            </label>
                            <CustomSearchDropdown
                              options={reportOptions}
                              value={
                                reportOptions.find(
                                  (option) => option.value === selectReportType,
                                ) || null
                              }
                              onChange={handleReportTypeChange}
                              className="w-100"
                            />
                          </div>

                          {/* <div style={{ paddingTop: "15px", display: "flex", justifyContent: "center", alignItems: "center", gap: "30px" }}>
                            <div
                              style={{
                                width: "400px",
                                zIndex: "999",
                                position: "relative",
                              }}
                            >
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search Anything for This Report"
                                value={globalSearchText}
                                onChange={(e) =>
                                  setGlobalSearchText(e.target.value)
                                }
                                style={{ width: "400px", marginTop: "10px" }}
                              />
                              {globalSearchText && (
                                <span className="clear-icon" onClick={() => setGlobalSearchText("")} style={{ position: "absolute", top: "32px" }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            {selectReportType && (
                              <>
                                <button
                                  className="icons "
                                  onClick={openFilterLabel}
                                >
                                  <span title="Filter Report">
                                    {hasData ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                      // fill={hasData ? "red" : "#54656f"}
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
                              </>
                            )}
                            <button
                              type="button"
                              className="btn btn-primary text-light form_label rounded-1 fs-6"
                              style={{
                                backgroundColor: "#f58634",
                                width: "88px",
                                height: "44px"
                              }}
                              onClick={openReport}
                            >
                              Apply
                            </button>
                          </div> */}
                        </div>
                      </div>

                      <hr />

                      {appliedReportType === "" && (
                        <p>Please Select a Report Type and Date Range.</p>
                      )}

                      {appliedReportType === "target_incentive" &&
                        filters.selectedDateArray && (
                          <TargetIncentiveReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                          />
                        )}

                      {appliedReportType === "team_performance" &&
                        filters.selectedDateArray && (
                          <TeamPerformanceReports
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            purchaseOrderTitle={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            quotationTitle={
                              title[0]?.quotation_title || "Quotation"
                            }
                            orderTitle={title[0]?.order_title || "Sales Order"}
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            globalSearch={debouncedSearchText}
                          />
                        )}

                      {appliedReportType === "account" &&
                        filters.selectedDateArray && (
                          <AccountOutstandingReportsVIew
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "employee_account" &&
                        filters.selectedDateArray && (
                          <EmployeeAccountOutstandingReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            globalSearch={debouncedSearchText}
                            selectedTeamMembers={filters.checkedOptionsUser}
                          />
                        )}
                      {appliedReportType === "quotation" &&
                        filters.selectedDateArray && (
                          <TeamQuotationDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={title[0]?.quotation_title || "Quotation"}
                            viewFormate={title[0]?.quotation_view_formate || 1}
                            setRefreshReport1={() => setRefreshReport(true)}
                            isCartModelOpen={isCartModelOpen}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "profoma_invoice" &&
                        filters.selectedDateArray && (
                          <ProformaInvoiceView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              title[0]?.proforma_invoice_title ||
                              "Proforma Invoice"
                            }
                            viewFormate={
                              title[0]?.proforma_invoice_view_formate || 1
                            }
                            setRefreshReport1={() => setRefreshReport(true)}
                            isCartModelOpen={isCartModelOpen}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "inward_report" &&
                        filters.selectedDateArray && (
                          <TeamInwardDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={title[0]?.inward_title || "Inward"}
                            viewFormate={title[0]?.inward_view_formate || 1}
                            setRefreshReport1={() => setRefreshReport(true)}
                            isCartModelOpen={isCartModelOpen}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "dispatch_report" &&
                        filters.selectedDateArray && (
                          <TeamDispatchDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={title[0]?.dispatch_title || "Dispatch"}
                            viewFormate={title[0]?.quotation_view_formate || 1}
                            setRefreshReport1={() => setRefreshReport(true)}
                            isCartModelOpen={isCartModelOpen}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "order" &&
                        filters.selectedDateArray && (
                          <TeamSalesOrderDataReportsView
                            key={reportKey}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={title[0]?.order_title || "Sales Order"}
                            viewFormate={title[0]?.order_view_formate || 3}
                            setRefreshReport1={() => setRefreshReport(true)}
                            onCartModelOpenChange={setIsCartModelOpen}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {/* {appliedReportType === "detailed_order_report" &&
                        filters.selectedDateArray && (
                          <DetailedOrderReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={"Detailed Order Report"}
                            viewFormate={title[0]?.order_view_formate || 3}
                            setRefreshReport1={() => setRefreshReport(true)}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                          />
                        )} */}
                      {appliedReportType === "order_invoice" &&
                        filters.selectedDateArray && (
                          <TeamSalesInvoiceDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            viewFormate={title[0]?.invoice_view_formate || 1}
                            title={title[0]?.invoice_title || "Sales Invoice"}
                            setRefreshReport1={() => setRefreshReport(true)}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "return_sales_invoice" &&
                        filters.selectedDateArray && (
                          <TeamReturnSalesDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              title[0]?.return_sales_invoice_title ||
                              "Return Sales Invoice"
                            }
                            viewFormate={
                              title[0]?.return_sales_invoice_view_formate || 1
                            }
                            setRefreshReport1={() => setRefreshReport(true)}
                            isCartModelOpen={isCartModelOpen}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "purchase_order" &&
                        filters.selectedDateArray && (
                          <TeamPurchaseOrderDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            viewFormate={
                              title[0]?.purchase_order_view_formate || 1
                            }
                            setRefreshReport1={() => setRefreshReport(true)}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "purchase_invoice" &&
                        filters.selectedDateArray && (
                          <TeamPurchaseInvoiceDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            viewFormate={title[0]?.purchase_view_formate || 1}
                            setRefreshReport1={() => setRefreshReport(true)}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "return_purchase_invoice" &&
                        filters.selectedDateArray && (
                          <TeamReturnPurchaseDataReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              title[0]?.return_purchase_invoice_title ||
                              "Return Purchase Invoice"
                            }
                            viewFormate={
                              title[0]?.return_purchase_invoice_view_formate ||
                              1
                            }
                            setRefreshReport1={() => setRefreshReport(true)}
                            isCartModelOpen={isCartModelOpen}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "pending_order" &&
                        filters.selectedDateArray && (
                          <PendingOrderReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              "Pending " + title[0]?.order_title ||
                              "Sales Order Pending Report"
                            }
                            viewFormate={title[0]?.order_view_formate || 3}
                            setRefreshReport1={() => setRefreshReport(true)}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}

                      {appliedReportType === "pending_purchase" &&
                        filters.selectedDateArray && (
                          <PendingPurchaseReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            title={
                              "Pending " + title[0]?.purchase_order_title ||
                              "Pending Purchase Order Report"
                            }
                            viewFormate={
                              title[0]?.purchase_order_view_formate || 3
                            }
                            setRefreshReport1={() => setRefreshReport(true)}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "pending" &&
                        filters.selectedDateArray && (
                          <TeamPendingWorkReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            purchaseOrderTitle={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            quotationTitle={
                              title[0]?.quotation_title || "Quotation"
                            }
                            orderTitle={title[0]?.order_title || "Sales Order"}
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            globalSearch={debouncedSearchText}
                          />
                        )}

                      {appliedReportType === "product_inventory" &&
                        filters.selectedDateArray && (
                          <ProductInventoryReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            inwardTitle={title[0]?.inward_title || "Inward"}
                            returnPurchaseTitle={
                              title[0]?.return_purchase_invoice_title ||
                              "Return Purchase Invoice"
                            }
                            returnSalesTitle={
                              title[0]?.return_sales_invoice_title ||
                              "Return Sales Invoice"
                            }
                            dispatchTitle={
                              title[0]?.dispatch_title || "Dispatch"
                            }
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            stockAdjustmentInwardTitle={
                              "Stock Adjustment Inward"
                            }
                            stockAdjustmentOutwardTitle={
                              "Stock Adjustment Outward"
                            }
                            selectedProduct={filters.selectedProductId}
                            selectedCategory={filters.selectedCategoryId}
                            selectedStockTypeId={filters.selectedStockTypeId}
                            selectedWarehouseIds={filters.selectedWarehouseIds}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType === "attendance_salary" &&
                        filters.selectedDateArray && (
                          <TeamAttendanceReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType === "process_attendance" &&
                        filters.selectedDateArray && (
                          <ProcessAttendanceReportView
                            key={reportKey}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDayMonthYear={
                              selectedDayMonthYear
                                ? Object.values(selectedDayMonthYear).filter(
                                  Boolean,
                                )
                                : null
                            }
                          />
                        )}
                      {appliedReportType === "salary_register" &&
                        filters.selectedDateArray && (
                          <SalaryRegisterReport
                            key={reportKey}
                            // selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDayMonthYear={
                              selectedDayMonthYear
                                ? Object.values(selectedDayMonthYear).filter(
                                  Boolean,
                                )
                                : null
                            }
                          />
                        )}
                      {appliedReportType === "status_wise_report" &&
                        filters.selectedDateArray && (
                          <StatusWiseReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType === "product_report" &&
                        filters.selectedDateArray && (
                          <ProductSalesPurchaseReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedProduct={filters.selectedProductId}
                            selectedCategory={filters.selectedCategoryId}
                            purchaseOrderTitle={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            quotationTitle={
                              title[0]?.quotation_title || "Quotation"
                            }
                            orderTitle={title[0]?.order_title || "Sales Order"}
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "product_wise_pending_report" &&
                        filters.selectedDateArray && (
                          <ProductPendingView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedProduct={filters.selectedProductId}
                            selectedCategory={filters.selectedCategoryId}
                            purchaseOrderTitle={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            quotationTitle={
                              title[0]?.quotation_title || "Quotation"
                            }
                            orderTitle={title[0]?.order_title || "Sales Order"}
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "category_report" &&
                        filters.selectedDateArray && (
                          <CategorySalesPurchaseReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedProduct={filters.selectedProductId}
                            selectedCategory={filters.selectedCategoryId}
                            purchaseOrderTitle={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            quotationTitle={
                              title[0]?.quotation_title || "Quotation"
                            }
                            orderTitle={title[0]?.order_title || "Sales Order"}
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "category_wise_pending_report" &&
                        filters.selectedDateArray && (
                          <CategoryPendingReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedProduct={filters.selectedProductId}
                            selectedCategory={filters.selectedCategoryId}
                            purchaseOrderTitle={
                              title[0]?.purchase_order_title || "Purchase Order"
                            }
                            purchaseTitle={
                              title[0]?.purchase_title || "Purchase Invoice"
                            }
                            quotationTitle={
                              title[0]?.quotation_title || "Quotation"
                            }
                            orderTitle={title[0]?.order_title || "Sales Order"}
                            invoiceTitle={
                              title[0]?.invoice_title || "Sales Invoice"
                            }
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "all_contact_report" &&
                        filters.selectedDateArray && (
                          <AllcontactReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            setActive={filters.filterData?.active || ""}
                            setActiveDay={Number(filters.filterData?.daysCount)}
                            selectedLabels={filters.checkedOptions}
                            selectedSourceTypes={filters.checkedSourceTypes}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDemography={
                              selectedDemography
                                ? Object.values(selectedDemography).filter(
                                  Boolean,
                                )
                                : null
                            }
                            globalSearch={debouncedSearchText}
                            selectedProductSearchId={
                              filters.selectedProductSearchId
                            }
                            // setSelectOrderType={filters.filterData?.orderlistselect || ""}
                            setSelectOrderType={filters.selectedOrderListId}
                          />
                        )}
                      {appliedReportType === "all_contact_chainwise_report" &&
                        filters.selectedDateArray && (
                          <ChainWiseContactReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            setActive={filters.filterData?.active || ""}
                            setActiveDay={Number(filters.filterData?.daysCount)}
                            selectedLabels={filters.checkedOptions}
                            selectedSourceTypes={filters.checkedSourceTypes}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDemography={
                              selectedDemography
                                ? Object.values(selectedDemography).filter(
                                  Boolean,
                                )
                                : null
                            }
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "all_deleted_contact_report" &&
                        filters.selectedDateArray && (
                          <AllDeletedcontactReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            setActive={filters.filterData?.active || ""}
                            setActiveDay={Number(filters.filterData?.daysCount)}
                            selectedLabels={filters.checkedOptions}
                            selectedSourceTypes={filters.checkedSourceTypes}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDemography={
                              selectedDemography
                                ? Object.values(selectedDemography).filter(
                                  Boolean,
                                )
                                : null
                            }
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType ===
                        "source_wise_contact_statistic_report" &&
                        filters.selectedDateArray && (
                          <AllSourceReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedSourceTypes={filters.checkedSourceTypes}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType ===
                        "label_wise_contact_statistics_report" &&
                        filters.selectedDateArray && (
                          <AlllableReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedLabels={filters.checkedOptions}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType ===
                        "status_wise_contact_and_inquiry_count_report" &&
                        filters.selectedDateArray && (
                          <StatusWiseContactAndInquiryCountReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedStatus={filters.checkedOptions}
                          />
                        )}
                      {appliedReportType === "all_inquiry_report" &&
                        filters.selectedDateArray && (
                          <AllInqueryReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedLabels={filters.checkedOptions}
                            selectedSourceTypes={filters.checkedSourceTypes}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDemography={
                              selectedDemography
                                ? Object.values(selectedDemography).filter(
                                  Boolean,
                                )
                                : null
                            }
                            selectedProduct={filters.selectedProductId}
                            selectedCategory={filters.selectedCategoryId}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "team_day_wise_expanse_report" &&
                        filters.selectedDateArray && (
                          <AllTeamExpense
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            setRefreshReport1={() => setRefreshReport(true)}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType === "expanse_detailed_report" &&
                        filters.selectedDateArray && (
                          <ExpenseDetailedReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedExpenseTypes={filters.checkedExpenseTypes}
                            selectedExpenseStatus={
                              filters.checkedOptionsExpenseStatus
                            }
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {appliedReportType === "all_visit_report" &&
                        filters.selectedDateArray && (
                          <AllVisitReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedDemography={
                              selectedDemography
                                ? Object.values(selectedDemography).filter(
                                  Boolean,
                                )
                                : null
                            }
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "alltask_report" &&
                        filters.selectedDateArray && (
                          <AllTaskReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            globalSearch={debouncedSearchText}
                            is_support_ticket_flag={0}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "support_ticket_report" &&
                        filters.selectedDateArray && (
                          <AllTaskReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            globalSearch={debouncedSearchText}
                            is_support_ticket_flag={1}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "allaccount_report" &&
                        filters.selectedDateArray && (
                          <AllAccountReports
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "account_credit_report" &&
                        filters.selectedDateArray && (
                          <AccountCreaditReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                            credit_debit_flag={1}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "account_debit_report" &&
                        filters.selectedDateArray && (
                          <AccountDebitReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                            credit_debit_flag={2}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "payment_type_wise_account" &&
                        filters.selectedDateArray && (
                          <PaymentWiseAccountReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                          />
                        )}
                      {appliedReportType === "all_call_report" &&
                        filters.selectedDateArray && (
                          <AllCallReportsView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                          />
                        )}
                      {appliedReportType === "allreminder_report" &&
                        filters.selectedDateArray && (
                          <AllReminderReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            globalSearch={debouncedSearchText}
                            is_support_ticket_flag={0}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "daily_sales_invoice" &&
                        filters.selectedDateArray && (
                          <DailyInvoiceReportView
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedStageStatus={
                              filters.checkedOptionsStageStatus
                            }
                            selectedSeries={filters.checkedOptionsSeries}
                            viewFormate={title[0]?.invoice_view_formate || 1}
                            title={"Daily Sales Invoice"}
                            setRefreshReport1={() => setRefreshReport(true)}
                            onCartModelOpenChange={setIsCartModelOpen}
                            globalSearch={debouncedSearchText}
                            selectedContactId={filters.selectedContactId}
                            referenceWiseContact={filters.referenceWiseContact}
                          />
                        )}
                      {appliedReportType === "customer_sales_purchase" &&
                        filters.selectedDateArray && (
                          <CustomerSalesPurchaseReport
                            key={reportKey}
                            selectedDates={filters.selectedDateArray}
                            selectedTeamMembers={filters.checkedOptionsUser}
                            selectedContactId={filters.selectedContactId}
                            globalSearch={debouncedSearchText}
                          />
                        )}
                      {isModalFilterVisible && (
                        <CheckBoxFilterModal
                          show={isModalFilterVisible}
                          onHide={handleModalClose}
                          handleSubmit={handleConfirmFilter}
                          title="Filter Reports"
                          message="Please select the Dates and Team Members for the Report."
                          btn1="Clear"
                          btn2="Apply"
                          filtersToShow={filterShowNumber}
                          pageId={1}
                          stageandStatusOrderType={filtershowStageandStatus}
                          filtershowSeriesOrderType={filtershowSeries}
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
                          initialCheckedOptionsStageStatus={
                            filters.checkedOptionsStageStatus
                          }
                          initialCheckedOptionsSeries={
                            filters.checkedOptionsSeries
                          }
                          initialSelectedStockTypeId={
                            filters.selectedStockTypeId
                          }
                          initialCheckedOptionsUser={filters.checkedOptionsUser}
                          initialSelectedActiveId={filters.selectedActiveId}
                          initialselectedOrderListId={
                            filters.selectedOrderListId
                          }
                          initialSelectedDays={filters.selectedDays}
                          selectedWarehouseIds={filters.selectedWarehouseIds}
                          initialReferenceWiseContact={
                            filters.referenceWiseContact
                          }
                          isApplyReport={1}
                        />
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      )}

      {isCloseConfirmation && (
        <ConfirmationModal
          show={isCloseConfirmation}
          onHide={() => setIsCloseConfirmation(false)}
          handleSubmit={() => handleHide()}
          title={`Close this Reports`}
          message={`Are you sure you want Close this Reports ?`}
          btn1="No"
          btn2="Yes"
        />
      )}
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => setIsDeleteConfirmation(false)}
          handleSubmit={() => setIsDeleteConfirmation(false)}
          title={`Delete this Product`}
          message={`Are you sure you want to delete this product? This message appears when you click on 'Save In Draft'`}
          btn1="CANCEL"
          btn2="Delete"
        />
      )}
    </div>
  );
};

export default ReportModal;
