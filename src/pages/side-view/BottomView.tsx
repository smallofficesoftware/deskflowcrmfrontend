import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";
import { useCommonFilterStore } from "../../store/report/useCommonFilterStore";
import DashboardView from "../aimodel/AiModelView";
import { ITitle } from "../dashboard/DashoardController";
import NewDashboardView from "../dashboard/new-dashboard/NewDashboardView";
import {
  fetchCompanyTeamApi,
  ICompanyTeam,
} from "../left-side/LeftSideController";
import ReportsTileView from "./ReportsTileView";
import QuickActionsHome from "./quick-actions/QuickActionsHome";

// Every report is a lazy chunk: the Side view opens on the dashboard or the tiles, and a report's code is only needed
// when the user opens that report (see the <Suspense> around the report area below).
const FormBuilderListView = lazy(() => import("../left-side/header/Setting/form-builder/FormBuilderListView"));
const AccountCreaditReport = lazy(() => import("../dashboard/Reports/Account Credit Report/AccountCreaditReport"));
const AccountDebitReport = lazy(() => import("../dashboard/Reports/Account Debit Report/AccountDebitReport"));
const AccountOutstandingReports = lazy(() => import("../dashboard/Reports/Account Outstanding/AccountOutstandingReportsVIew"));
const AdjustmentTypeGridView = lazy(() => import("../dashboard/Reports/Adjustment Type Grid View/AdjustmentTypeGridView"));
const AllAccountReports = lazy(() => import("../dashboard/Reports/All Account Report/AllAccountReportsVIew"));
const CartPaymentReportView = lazy(() => import("../dashboard/Reports/Cart Payment Report/CartPaymentReportView"));
const AllAreasReport = lazy(() => import("../dashboard/Reports/All Areas Report/AllAreasReport"));
const AllCallReportsView = lazy(() => import("../dashboard/Reports/All Call Report/AllCallReportView"));
const AllCitiesReport = lazy(() => import("../dashboard/Reports/All Cities Report/AllCitiesReport"));
const AllcontactReport = lazy(() => import("../dashboard/Reports/All Contact Report/allContactReportView"));
const AllCountriesReport = lazy(() => import("../dashboard/Reports/All Countries Report/AllCountriesReport"));
const AllDeletedcontactReport = lazy(() => import("../dashboard/Reports/All Deleted Contact Report/allDeletedContactReportView"));
const AllInqueryReport = lazy(() => import("../dashboard/Reports/All Inquiry Report/inquiryView"));
const AllReminderReport = lazy(() => import("../dashboard/Reports/All Reminder Report/AllReminderReport"));
const AllStatesReport = lazy(() => import("../dashboard/Reports/All States/AllStatesReport"));
const AllTaskReportsView = lazy(() => import("../dashboard/Reports/All Task Report/allTaskReportView"));
const AllVisitReportsView = lazy(() => import("../dashboard/Reports/All Visit Report/allVisitReportView"));
const ReportRunnerView = lazy(() => import("../dashboard/Reports/ReportBuilder/ReportRunnerView"));
const TeamAttendanceReportsView = lazy(() => import("../dashboard/Reports/Attendance & Salary Report/AttendanceReportView"));
const BillOfMaterialReport = lazy(() => import("../dashboard/Reports/Bill Of Material Report/BillOfMaterialReport"));
const CategoryPendingReport = lazy(() => import("../dashboard/Reports/Category Pending/categoryPendingView"));
const CategorySalesPurchaseReport = lazy(() => import("../dashboard/Reports/Category Sales & Purchase/categorySalesPurchaseView"));
const ChainWiseContactReportView = lazy(() => import("../dashboard/Reports/ChainWiseContact/ChainWiseContactReportView"));
const CompensationAdjustmentGridView = lazy(() => import("../dashboard/Reports/Compensation Adjustment Grid View/CompensationAdjustmentGridView"));
const CustomFieldFormReport = lazy(() => import("../dashboard/Reports/Custom Field Form Report/CustomFieldFormReport"));
const DailyInvoiceReportView = lazy(() => import("../dashboard/Reports/Daily Invoice Report/DailyInvoiceReportView"));
const DayAdjustmentGridView = lazy(() => import("../dashboard/Reports/Day Adjustment Grid View/DayAdjustmentGridView"));
const DepartmentReport = lazy(() => import("../dashboard/Reports/Department Report/DepartmentReport"));
const TeamDispatchDataReportsView = lazy(() => import("../dashboard/Reports/Dispatch/DispatchReport"));
const EmployeeAccountOutstandingReport = lazy(() => import("../dashboard/Reports/Employee Account Outstanding/EmployeeAccountOutstandingReport"));
const EmployeeTransactionReports = lazy(() => import("../dashboard/Reports/Employee Account Report/EmployeeAccountTransactionReport"));
const TargetIncentiveReport = lazy(() => import("../dashboard/Reports/Target Incentive Report/TargetIncentiveReport"));
const CustomerSalesPurchaseReport = lazy(() => import("../dashboard/Reports/Customer Sales Purchase Report/CustomerSalesPurchaseReport"));
const ExpenseDetailedReport = lazy(() => import("../dashboard/Reports/Expense Datailed Report/ExpenseDetailedReportView"));
const ExpenseTypesReport = lazy(() => import("../dashboard/Reports/Expense Type Report/ExpenseTypeReport"));
const GSTInAndOutReport = lazy(() => import("../dashboard/Reports/GST In & Out/GSTInAndOutReport"));
const HolidayGridView = lazy(() => import("../dashboard/Reports/Holiday Grid View/HolidayGridView"));
const TeamInwardDataReportsView = lazy(() => import("../dashboard/Reports/Inward/inwardView"));
const JobCardGridView = lazy(() => import("../dashboard/Reports/Job Card Grid View/JobCardGridView"));
const LabelReport = lazy(() => import("../dashboard/Reports/Label Report/LabelReport"));
const AlllableReport = lazy(() => import("../dashboard/Reports/Lable Wise Report/lableReportView"));
const LeaveManagementReport = lazy(() => import("../dashboard/Reports/Leave Management Report/LeaveManagementReport"));
const LeaveTypeReport = lazy(() => import("../dashboard/Reports/Leave Type Report/LeaveTypeReport"));
const LockControlGridView = lazy(() => import("../dashboard/Reports/Lock Control Grid/LockControlGridView"));
const MyTeamReport = lazy(() => import("../dashboard/Reports/My Team Report/MyTeamReport"));
const PaymentTypeReport = lazy(() => import("../dashboard/Reports/Payment Type Report/PaymentTypeReport"));
const PaymentWiseAccountReport = lazy(() => import("../dashboard/Reports/Payment WIse Account Report/PaymentWiseAccountReport"));
const PendingOrderView = lazy(() => import("../dashboard/Reports/Pending Order/pendingOrderView"));
const PendingPurchaseReportsView = lazy(() => import("../dashboard/Reports/Pending Purchase/pendingPurchaseView"));
const PersonalNotesReport = lazy(() => import("../dashboard/Reports/Personal Notes Report/PersonalNotesReport"));
const PriceListReport = lazy(() => import("../dashboard/Reports/Price List Report/PriceListReport"));
const PriceListRateReport = lazy(() => import("../dashboard/Reports/Price List Rate Report/PriceListRateReport"));
const ProcessAttendanceGridView = lazy(() => import("../dashboard/Reports/Process Attendance Grid View/ProcessAttendanceGridView"));
const ProcessAttendanceReportView = lazy(() => import("../dashboard/Reports/Process Attendance Report/ProcessAttendanceReportView"));
const ProcessReport = lazy(() => import("../dashboard/Reports/Process Report/ProcessReport"));
const ProductCategoryReport = lazy(() => import("../dashboard/Reports/Product Category Report/ProductCategoryReport"));
const ProductGroupReport = lazy(() => import("../dashboard/Reports/Product Group Report/ProductGroupReport"));
const ProductInventoryReport = lazy(() => import("../dashboard/Reports/Product Inventory/ProductInventory"));
const SerialNumberStockCheckReport = lazy(() => import("../dashboard/Reports/Serial Number Stock Check/SerialNumberStockCheckReport"));
const SerialNumberTraceReport = lazy(() => import("../dashboard/Reports/Serial Number Trace/SerialNumberTraceReport"));
const ProductPendingView = lazy(() => import("../dashboard/Reports/Product Pending/productPendingView"));
const ProductSalesPurchaseReport = lazy(() => import("../dashboard/Reports/Product Sales & Purchase/productSalesPurchaseView"));
const ProductUnitReport = lazy(() => import("../dashboard/Reports/Product Unit Report/ProductUnitReport"));
const ProductReport = lazy(() => import("../dashboard/Reports/Products Report/ProductReport"));
const ProformaInvoiceView = lazy(() => import("../dashboard/Reports/Proforma Invoice Report/ProformaInvoiceView"));
const TeamPurchaseInvoiceDataReportsView = lazy(() => import("../dashboard/Reports/Purchase Invoice/purchaseInvoiceView"));
const TeamPurchaseOrderDataReportsView = lazy(() => import("../dashboard/Reports/Purchase Order/purchaseOrderView"));
const TeamQuotationDataReportsView = lazy(() => import("../dashboard/Reports/Quotations/QuotationView"));
const TeamReturnPurchaseDataReportsView = lazy(() => import("../dashboard/Reports/Return Purchase Invoice/ReturnPurchaseInvoiceView"));
const TeamReturnSalesDataReportsView = lazy(() => import("../dashboard/Reports/Return Sales Invoice/ReturnSalesInvoiceView"));
const ReportBuilderSideView = lazy(() => import("../dashboard/Reports/ReportBuilder/ReportBuilderSideView"));
const RoundOffMasterGridView = lazy(() => import("../dashboard/Reports/Round Of Grid View/RoundOfGridView"));
const RoutePlannerGridView = lazy(() => import("../dashboard/Reports/Route Planner Grid View/RoutePlannerGridView"));
const SalaryProcessGridView = lazy(() => import("../dashboard/Reports/Salary Process Grid View/SalaryProcessGridView"));
const SalaryRegisterReport = lazy(() => import("../dashboard/Reports/Salary Register/SalaryRegisterReport"));
const TeamSalesInvoiceDataReportsView = lazy(() => import("../dashboard/Reports/Sales Invoice/salesInvoiceView"));
const TeamSalesOrderDataReportsView = lazy(() => import("../dashboard/Reports/Sales Order/salesOrderView"));
const SourceOfTypesReport = lazy(() => import("../dashboard/Reports/Source Of Types Report/SourceOfTypesReport"));
const AllSourceReport = lazy(() => import("../dashboard/Reports/Source Wise Report/sourceReportView"));
const StagesStatusReport = lazy(() => import("../dashboard/Reports/Stages And Status Report/StagesStatusReport"));
const StatusWiseReport = lazy(() => import("../dashboard/Reports/Status Wise Report/StatusWiseReport"));
const StockAdjustmentReport = lazy(() => import("../dashboard/Reports/Stock Adjustment Report/StockAdjustmentReport"));
const WarehouseTransferReport = lazy(() => import("../dashboard/Reports/Warehouse Transfer Report/WarehouseTransferReport"));
const TaskCategoryReport = lazy(() => import("../dashboard/Reports/Task Category Report/TaskCategoryReport"));
const TaskTemplateReport = lazy(() => import("../dashboard/Reports/Task Template Report/TaskTemplateReport"));
const TaxMasterGridView = lazy(() => import("../dashboard/Reports/Tax Master Grid View/TaxMasterGridView"));
const AllTeamExpense = lazy(() => import("../dashboard/Reports/Team Day Wise Expense/teamDayExpenseView"));
const TeamPendingWorkReportsView = lazy(() => import("../dashboard/Reports/Team Pending Work/TeamPendingWokReportsVIew"));
const TeamPerformanceReports = lazy(() => import("../dashboard/Reports/Team Performance/TeamPerformanceReports"));
const VisitTypeReport = lazy(() => import("../dashboard/Reports/Visit Type Report/VisitTypeReport"));
const WarehouseReport = lazy(() => import("../dashboard/Reports/Warehouse Report/WarehouseReport"));
const WhatsappTemplateReport = lazy(() => import("../dashboard/Reports/Whatsapp Template Report/WhatsappTemplateReport"));
const WorkStationReport = lazy(() => import("../dashboard/Reports/Work Station Report/WorkStationReport"));
const WorkFlowAutomationReport = lazy(() => import("../dashboard/Reports/Workflow Automation Report/WorkFlowAutomationReport"));
const TallySettingsView = lazy(() => import("../left-side/header/Setting/tally/TallySettingsView"));
const MarketplaceView = lazy(() => import("../left-side/header/Setting/marketplace/MarketplaceView"));
const EcommerceStorefrontSettingsView = lazy(() => import("../left-side/header/Setting/ecommerce-storefront/EcommerceStorefrontSettingsView"));

const BottomView = ({
  activeView,
  reportName,
  appliedReportType,
  // onCloseReport,
  reportType,
  setActiveView,
  setAppliedReportType,
  onReportClick,
  isEmbed,
  formSubmissionsDeepLinkId,
  formEditDeepLinkId,
}: any) => {
  const navigate = useNavigate();
  const [isCRMDashBoardOpen, setIsCRMDashBoardOpen] = useState(true);
  const [isReportShow, setIsReportShow] = useState(false);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
  const [showAichat, setshowAichat] = useState(false);

  const getFilter = useCommonFilterStore((state) => state.getFilter);
  const setFilter = useCommonFilterStore((state) => state.setFilter);
  const setFilters = useCommonFilterStore((state) => state.setFilters);

  const filters = getFilter("appliedReportType");

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
    if (appliedReportType && appliedReportType !== "") {
      // Guarded: this used to unconditionally clearFilters + reseed default
      // dates on every appliedReportType change, which is a duplicate of
      // handleSingleReportShow's own preamble (SideView.tsx) — and being
      // unconditional, it ran in a later commit and clobbered any
      // already-correct dates back to the default month, including the
      // /SideView/report/:slug?start=&end= deep-link overrides. Only seed
      // when nothing is set yet, same guard every report's own mount effect
      // already uses.
      const existing = getFilter(appliedReportType);
      if (!existing.startSearchDate || !existing.endSearchDate) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const defaultDates = [startOfMonth, endOfMonth];

        setFilters(appliedReportType, {
          selectedDateArray: defaultDates,
          startSearchDate: defaultDates[0],
          endSearchDate: defaultDates[1],
        });
      }
    }
  }, [appliedReportType, setFilters, getFilter]);

  useEffect(() => {
    // Use the active workspace company, not always title[0] (which may be the main company).
    const activeCompanyId = Number(localStorage.getItem("COMPANY_ID"));
    const activeTitle = activeCompanyId
      ? title.find((t: any) => t.id === activeCompanyId)
      : title[0];
    const companyIdToUse = activeTitle?.id || title[0]?.id;
    if (companyIdToUse) {
      fetchCompanyTeamApi(setCompanyTeamLists, companyIdToUse, "");
    }
  }, [title]);

  const handleonHide = () => {
    const wasCustomReport = typeof appliedReportType === "string" && appliedReportType.startsWith("custom_report:");
    setActiveView("dashboard");
    setAppliedReportType("");
    // Drop the report's link so refresh / back land on the reports list.
    if (wasCustomReport) navigate("/SideView?view=reports");
  };

  const insightsSideView = true;
  const fromSideView = true;

  return (
    <div
      className=""
      style={{
        height: isEmbed ? "100vh" : "90vh",
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        padding: "10px",
        background: "#F5F5F5",
        minHeight: "30vh",
        borderBottom: "5px solid rgb(245, 134, 52)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          overflow: "auto",
          scrollbarWidth: "none",
        }}
      >
        <Suspense fallback={<div className="text-muted small p-3">Loading...</div>}>
        {activeView === "dashboard" && (
          <NewDashboardView
            onClose={() => setIsCRMDashBoardOpen(false)}
            insightsSideView={insightsSideView}
            setActiveView={setActiveView}
            setAppliedReportType={setAppliedReportType}
          />
        )}

        {activeView === "reports_home" && (
          <ReportsTileView
            onReportClick={(value: string) => onReportClick?.(value)}
            // Bypasses handleSingleReportShow entirely (SideView.tsx) —
            // that function's fallback branch toasts a permission error for
            // any name it doesn't recognize among its ~50 fixed report
            // names, so a dynamic report_definition_id could never route
            // through it. appliedReportType already flows down as a prop
            // and is already reset by every other "leave this report" path
            // (handleonHide below, onInsightsClick/onSmartReportsClick in
            // SideView.tsx) — reusing it with a sentinel prefix needs no
            // new state anywhere.
            onCustomReportClick={(id: number) => {
              setActiveView("custom_report");
              setAppliedReportType(`custom_report:${id}`);
              // Per-report link: /SideView?view=reports&customReportId=<id> survives refresh.
              navigate(`/SideView?view=reports&customReportId=${id}`);
            }}
          />
        )}

        {activeView === "quick_actions" && <QuickActionsHome onReportClick={(slug: string) => onReportClick?.(slug)} />}

        {activeView === "forms_home" && (
          <FormBuilderListView deepLinkFormId={formSubmissionsDeepLinkId} editDeepLinkId={formEditDeepLinkId} />
        )}

        {typeof appliedReportType === "string" && appliedReportType.startsWith("custom_report:") && (
          <ReportRunnerView
            definitionId={Number(appliedReportType.split(":")[1])}
            onHide={handleonHide}
          />
        )}

        {appliedReportType === "team_performance" && (
          <TeamPerformanceReports MobileFlag={isEmbed ? "1" : undefined}
            purchaseOrderTitle={
              title[0]?.purchase_order_title || "Purchase Order"
            }
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            quotationTitle={title[0]?.quotation_title || "Quotation"}
            orderTitle={title[0]?.order_title || "Sales Order"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "quotation" && (
          <TeamQuotationDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.quotation_title || "Quotation"}
            viewFormate={title[0]?.quotation_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "order" && (
          <TeamSalesOrderDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.order_title || "Sales Order"}
            viewFormate={title[0]?.order_view_formate || 3}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "dispatch_report" && (
          <TeamDispatchDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.dispatch_title || "Dispatch"}
            viewFormate={title[0]?.quotation_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "order_invoice" && (
          <TeamSalesInvoiceDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            viewFormate={title[0]?.invoice_view_formate || 1}
            title={title[0]?.invoice_title || "Sales Invoice"}
          />
        )}
        {appliedReportType === "return_sales_invoice" && (
          <TeamReturnSalesDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={
              title[0]?.return_sales_invoice_title || "Return Sales Invoice"
            }
            viewFormate={title[0]?.return_sales_invoice_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "purchase_order" && (
          <TeamPurchaseOrderDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.purchase_order_title || "Purchase Order"}
            viewFormate={title[0]?.purchase_order_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "inward_report" && (
          <TeamInwardDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.inward_title || "Inward"}
            viewFormate={title[0]?.inward_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "purchase_invoice" && (
          <TeamPurchaseInvoiceDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.purchase_title || "Purchase Invoice"}
            viewFormate={title[0]?.purchase_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "return_purchase_invoice" && (
          <TeamReturnPurchaseDataReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={
              title[0]?.return_purchase_invoice_title ||
              "Return Purchase Invoice"
            }
            viewFormate={title[0]?.return_purchase_invoice_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "account" && (
          <AccountOutstandingReports MobileFlag={isEmbed ? "1" : undefined} type={reportType} onHide={handleonHide} />
        )}
        {appliedReportType === "pending" && (
          <TeamPendingWorkReportsView MobileFlag={isEmbed ? "1" : undefined}
            purchaseOrderTitle={
              title[0]?.purchase_order_title || "Purchase Order"
            }
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            quotationTitle={title[0]?.quotation_title || "Quotation"}
            orderTitle={title[0]?.order_title || "Sales Order"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "product_inventory" && (
          <ProductInventoryReport MobileFlag={isEmbed ? "1" : undefined}
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            inwardTitle={title[0]?.inward_title || "Inward"}
            returnPurchaseTitle={
              title[0]?.return_purchase_invoice_title ||
              "Return Purchase Invoice"
            }
            returnSalesTitle={
              title[0]?.return_sales_invoice_title || "Return Sales Invoice"
            }
            dispatchTitle={title[0]?.dispatch_title || "Dispatch"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            stockAdjustmentInwardTitle={"Stock Adjustment Inward"}
            stockAdjustmentOutwardTitle={"Stock Adjustment Outward"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "serial_number_stock_check" && (
          <SerialNumberStockCheckReport
            onHide={handleonHide}
            MobileFlag={isEmbed ? "1" : undefined}
          />
        )}
        {appliedReportType === "serial_number_trace" && (
          <SerialNumberTraceReport
            onHide={handleonHide}
            MobileFlag={isEmbed ? "1" : undefined}
          />
        )}
        {appliedReportType === "My_Team_Report" && (
          <MyTeamReport
            isCompanyOpen={true}
            MobileFlag={isEmbed ? "1" : undefined}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "attendance_salary" && (
          <TeamAttendanceReportsView MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "product_report" && (
          <ProductSalesPurchaseReport MobileFlag={isEmbed ? "1" : undefined}
            purchaseOrderTitle={
              title[0]?.purchase_order_title || "Purchase Order"
            }
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            quotationTitle={title[0]?.quotation_title || "Quotation"}
            orderTitle={title[0]?.order_title || "Sales Order"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "product_wise_pending_report" && (
          <ProductPendingView MobileFlag={isEmbed ? "1" : undefined}
            purchaseOrderTitle={
              title[0]?.purchase_order_title || "Purchase Order"
            }
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            quotationTitle={title[0]?.quotation_title || "Quotation"}
            orderTitle={title[0]?.order_title || "Sales Order"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "category_report" && (
          <CategorySalesPurchaseReport MobileFlag={isEmbed ? "1" : undefined}
            purchaseOrderTitle={
              title[0]?.purchase_order_title || "Purchase Order"
            }
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            quotationTitle={title[0]?.quotation_title || "Quotation"}
            orderTitle={title[0]?.order_title || "Sales Order"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "category_wise_pending_report" && (
          <CategoryPendingReport MobileFlag={isEmbed ? "1" : undefined}
            purchaseOrderTitle={
              title[0]?.purchase_order_title || "Purchase Order"
            }
            purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
            quotationTitle={title[0]?.quotation_title || "Quotation"}
            orderTitle={title[0]?.order_title || "Sales Order"}
            invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "all_contact_report" && (
          <AllcontactReport MobileFlag={isEmbed ? "1" : undefined} fromSideView={true} onHide={handleonHide} />
        )}
        {appliedReportType === "all_deleted_contact_report" && (
          <AllDeletedcontactReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "source_wise_contact_statistic_report" && (
          <AllSourceReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "label_wise_contact_statistics_report" && (
          <AlllableReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "all_inquiry_report" && (
          <AllInqueryReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "team_day_wise_expanse_report" && (
          <AllTeamExpense MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "all_visit_report" && (
          <AllVisitReportsView MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "all_call_report" && (
          <AllCallReportsView MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "pending_order" && (
          <PendingOrderView MobileFlag={isEmbed ? "1" : undefined}
            title={
              "Pending " + title[0]?.order_title || "Sales Order Pending Report"
            }
            viewFormate={title[0]?.order_view_formate || 3}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "pending_purchase" && (
          <PendingPurchaseReportsView MobileFlag={isEmbed ? "1" : undefined}
            title={
              "Pending " + title[0]?.purchase_order_title ||
              "Pending Purchase Order Report"
            }
            viewFormate={title[0]?.purchase_order_view_formate || 3}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "alltask_report" && (
          <AllTaskReportsView MobileFlag={isEmbed ? "1" : undefined}
            is_support_ticket_flag={0}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "support_ticket_report" && (
          <AllTaskReportsView MobileFlag={isEmbed ? "1" : undefined}
            is_support_ticket_flag={1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "allaccount_report" && (
          <AllAccountReports MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "cart_payment_report" && (
          <CartPaymentReportView MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "account_credit_report" && (
          <AccountCreaditReport MobileFlag={isEmbed ? "1" : undefined} credit_debit_flag={1} onHide={handleonHide} />
        )}
        {appliedReportType === "account_debit_report" && (
          <AccountDebitReport MobileFlag={isEmbed ? "1" : undefined} credit_debit_flag={2} onHide={handleonHide} />
        )}
        {appliedReportType === "allreminder_report" && (
          <AllReminderReport MobileFlag={isEmbed ? "1" : undefined} is_support_ticket_flag={0} onHide={handleonHide} />
        )}

        {appliedReportType === "all_contact_chainwise_report" && (
          <ChainWiseContactReportView MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "daily_sales_invoice" && (
          <DailyInvoiceReportView MobileFlag={isEmbed ? "1" : undefined}
            viewFormate={title[0]?.invoice_view_formate || 1}
            title={"Daily Sales Invoice"}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "Task_Category" && (
          <TaskCategoryReport onHide={handleonHide} />
        )}
        {appliedReportType === "Task_Template" && (
          <TaskTemplateReport onHide={handleonHide} />
        )}
        {appliedReportType === "Source_Of_Types" && (
          <SourceOfTypesReport onHide={handleonHide} />
        )}
        {appliedReportType === "label_report" && (
          <LabelReport onHide={handleonHide} />
        )}
        {appliedReportType === "All_countries_report" && (
          <AllCountriesReport onHide={handleonHide} />
        )}
        {appliedReportType === "States_Report" && (
          <AllStatesReport
            selectedDemography={selectedDemography}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "Cities_Report" && (
          <AllCitiesReport
            selectedDemography={selectedDemography}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "Areas_Report" && (
          <AllAreasReport selectedDemography={selectedDemography} />
        )}
        {appliedReportType === "Expense_Types_Report" && (
          <ExpenseTypesReport onHide={handleonHide} />
        )}
        {appliedReportType === "Payment_Type_Report" && (
          <PaymentTypeReport onHide={handleonHide} />
        )}
        {appliedReportType === "Leave_Type_Report" && (
          <LeaveTypeReport onHide={handleonHide} />
        )}
        {appliedReportType === "Department_Report" && (
          <DepartmentReport onHide={handleonHide} />
        )}
        {appliedReportType === "Visit_Type_Report" && (
          <VisitTypeReport onHide={handleonHide} />
        )}
        {appliedReportType === "Product_Group_Report" && (
          <ProductGroupReport onHide={handleonHide} />
        )}
        {appliedReportType === "Stages_Status_Report" && (
          <StagesStatusReport onHide={handleonHide} />
        )}
        {appliedReportType === "Product_Category_Report" && (
          <ProductCategoryReport onHide={handleonHide} />
        )}
        {appliedReportType === "Work_Station_Report" && (
          <WorkStationReport onHide={handleonHide} />
        )}
        {appliedReportType === "Product_Unit_Report" && (
          <ProductUnitReport onHide={handleonHide} />
        )}
        {appliedReportType === "Process_Report" && (
          <ProcessReport onHide={handleonHide} />
        )}
        {appliedReportType === "Warehouse_Report" && (
          <WarehouseReport onHide={handleonHide} />
        )}
        {appliedReportType === "BillOfMaterial_Report" && (
          <BillOfMaterialReport onHide={handleonHide} />
        )}
        {appliedReportType === "Products_Report" && (
          <ProductReport
            MobileFlag={isEmbed ? "1" : undefined}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "tax_master" && (
          <TaxMasterGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Price_List_Report" && (
          <PriceListReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "PriceListRate_Report" && (
          <PriceListRateReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "StockAdjustment_Report" && (
          <StockAdjustmentReport onHide={handleonHide} />
        )}
        {appliedReportType === "WarehouseTransfer_Report" && (
          <WarehouseTransferReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "CustomFieldForm_Report" && (
          <CustomFieldFormReport onHide={handleonHide} />
        )}
        {appliedReportType === "LeaveManagement_Report" && (
          <LeaveManagementReport onHide={handleonHide} />
        )}
        {appliedReportType === "PersonalNotes_Report" && (
          <PersonalNotesReport onHide={handleonHide} />
        )}
        {appliedReportType === "GSTInAndOut_Report" && (
          <GSTInAndOutReport reportType={reportType} onHide={handleonHide} />
        )}
        {appliedReportType === "AI_chat_Dashboard" && (
          <DashboardView isAiModelopen={true} closeisAiModel={handleonHide} />
        )}
        {appliedReportType === "route_planner" && (
          <RoutePlannerGridView onHide={handleonHide} />
        )}
        {appliedReportType === "whatsapp_template" && (
          <WhatsappTemplateReport onHide={handleonHide} />
        )}
        {(appliedReportType === "report_builder" || appliedReportType === "report_builder_new") && (
          <ReportBuilderSideView onHide={handleonHide} startNew={appliedReportType === "report_builder_new"} />
        )}
        {appliedReportType === "ecommerce_storefront" && (
          <EcommerceStorefrontSettingsView
            isEcommerceStorefrontView
            closeEcommerceStorefrontView={handleonHide}
          />
        )}
        {appliedReportType === "marketplace" && (
          <MarketplaceView
            onHide={handleonHide}
            onOpenSettings={(report) => navigate(`/SideView/report/${report}${isEmbed ? "?embed=1" : ""}`)}
          />
        )}
        {appliedReportType === "tally_settings" && <TallySettingsView onHide={handleonHide} />}
        {appliedReportType === "workflow_automation" && (
          <WorkFlowAutomationReport />
        )}
        {appliedReportType === "Emp_Transaction_Report" && (
          <EmployeeTransactionReports onHide={handleonHide} />
        )}
        {appliedReportType === "target_incentive_report" && (
          <TargetIncentiveReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "customer_sales_purchase_report" && (
          <CustomerSalesPurchaseReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "status_wise_report" && (
          <StatusWiseReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "Process_Attendance" && (
          <ProcessAttendanceGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Attendance_register_Report" && (
          <ProcessAttendanceReportView MobileFlag={isEmbed ? "1" : undefined}
            onHide={handleonHide}
            selectedDayMonthYear={
              selectedDayMonthYear
                ? Object.values(selectedDayMonthYear).filter(Boolean)
                : null
            }
          />
        )}
        {appliedReportType === "Salary_register_Report" && (
          <SalaryRegisterReport MobileFlag={isEmbed ? "1" : undefined}
            onHide={handleonHide}
            selectedDayMonthYear={
              selectedDayMonthYear
                ? Object.values(selectedDayMonthYear).filter(Boolean)
                : null
            }
          />
        )}
        {appliedReportType === "Salary_Process" && (
          <SalaryProcessGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Compensation_Adjustments" && (
          <CompensationAdjustmentGridView onHide={handleonHide} />
        )}
        {appliedReportType === "holiday_master" && (
          <HolidayGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Payment_wise_account_Report" && (
          <PaymentWiseAccountReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "Lock_Control_master" && (
          <LockControlGridView onHide={handleonHide} />
        )}
        {appliedReportType === "round_off" && (
          <RoundOffMasterGridView onHide={handleonHide} />
        )}
        {appliedReportType === "adjustment_type" && (
          <AdjustmentTypeGridView onHide={handleonHide} />
        )}
        {appliedReportType === "day_adjustment" && (
          <DayAdjustmentGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Emp_AccountOutstanding_Report" && (
          <EmployeeAccountOutstandingReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "Expense_Detailed_Report" && (
          <ExpenseDetailedReport MobileFlag={isEmbed ? "1" : undefined} onHide={handleonHide} />
        )}
        {appliedReportType === "Job_Card_Grid" && (
          <JobCardGridView onHide={handleonHide} />
        )}
        {appliedReportType === "proforma_invoice_report" && (
          <ProformaInvoiceView MobileFlag={isEmbed ? "1" : undefined}
            title={title[0]?.proforma_invoice_title || "Proforma Invoice"}
            viewFormate={title[0]?.proforma_invoice_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        </Suspense>
      </div>
    </div>
  );
};

export default BottomView;
