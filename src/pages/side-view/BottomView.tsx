import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";
import { useCommonFilterStore } from "../../store/report/useCommonFilterStore";
import DashboardView from "../aimodel/AiModelView";
import { ITitle } from "../dashboard/DashoardController";
import AccountCreaditReport from "../dashboard/Reports/Account Credit Report/AccountCreaditReport";
import AccountDebitReport from "../dashboard/Reports/Account Debit Report/AccountDebitReport";
import AccountOutstandingReports from "../dashboard/Reports/Account Outstanding/AccountOutstandingReportsVIew";
import AdjustmentTypeGridView from "../dashboard/Reports/Adjustment Type Grid View/AdjustmentTypeGridView";
import AllAccountReports from "../dashboard/Reports/All Account Report/AllAccountReportsVIew";
import AllAreasReport from "../dashboard/Reports/All Areas Report/AllAreasReport";
import AllCallReportsView from "../dashboard/Reports/All Call Report/AllCallReportView";
import AllCitiesReport from "../dashboard/Reports/All Cities Report/AllCitiesReport";
import AllcontactReport from "../dashboard/Reports/All Contact Report/allContactReportView";
import AllCountriesReport from "../dashboard/Reports/All Countries Report/AllCountriesReport";
import AllDeletedcontactReport from "../dashboard/Reports/All Deleted Contact Report/allDeletedContactReportView";
import AllInqueryReport from "../dashboard/Reports/All Inquiry Report/inquiryView";
import AllReminderReport from "../dashboard/Reports/All Reminder Report/AllReminderReport";
import AllStatesReport from "../dashboard/Reports/All States/AllStatesReport";
import AllTaskReportsView from "../dashboard/Reports/All Task Report/allTaskReportView";
import AllVisitReportsView from "../dashboard/Reports/All Visit Report/allVisitReportView";
import TeamAttendanceReportsView from "../dashboard/Reports/Attendance & Salary Report/AttendanceReportView";
import BillOfMaterialReport from "../dashboard/Reports/Bill Of Material Report/BillOfMaterialReport";
import CategoryPendingReport from "../dashboard/Reports/Category Pending/categoryPendingView";
import CategorySalesPurchaseReport from "../dashboard/Reports/Category Sales & Purchase/categorySalesPurchaseView";
import ChainWiseContactReportView from "../dashboard/Reports/ChainWiseContact/ChainWiseContactReportView";
import CompensationAdjustmentGridView from "../dashboard/Reports/Compensation Adjustment Grid View/CompensationAdjustmentGridView";
import CustomFieldFormReport from "../dashboard/Reports/Custom Field Form Report/CustomFieldFormReport";
import DailyInvoiceReportView from "../dashboard/Reports/Daily Invoice Report/DailyInvoiceReportView";
import DayAdjustmentGridView from "../dashboard/Reports/Day Adjustment Grid View/DayAdjustmentGridView";
import DepartmentReport from "../dashboard/Reports/Department Report/DepartmentReport";
import TeamDispatchDataReportsView from "../dashboard/Reports/Dispatch/DispatchReport";
import EmployeeAccountOutstandingReport from "../dashboard/Reports/Employee Account Outstanding/EmployeeAccountOutstandingReport";
import EmployeeTransactionReports from "../dashboard/Reports/Employee Account Report/EmployeeAccountTransactionReport";
import ExpenseDetailedReport from "../dashboard/Reports/Expense Datailed Report/ExpenseDetailedReportView";
import ExpenseTypesReport from "../dashboard/Reports/Expense Type Report/ExpenseTypeReport";
import GSTInAndOutReport from "../dashboard/Reports/GST In & Out/GSTInAndOutReport";
import HolidayGridView from "../dashboard/Reports/Holiday Grid View/HolidayGridView";
import TeamInwardDataReportsView from "../dashboard/Reports/Inward/inwardView";
import JobCardGridView from "../dashboard/Reports/Job Card Grid View/JobCardGridView";
import LabelReport from "../dashboard/Reports/Label Report/LabelReport";
import AlllableReport from "../dashboard/Reports/Lable Wise Report/lableReportView";
import LeaveManagementReport from "../dashboard/Reports/Leave Management Report/LeaveManagementReport";
import LeaveTypeReport from "../dashboard/Reports/Leave Type Report/LeaveTypeReport";
import LockControlGridView from "../dashboard/Reports/Lock Control Grid/LockControlGridView";
import MyTeamReport from "../dashboard/Reports/My Team Report/MyTeamReport";
import PaymentTypeReport from "../dashboard/Reports/Payment Type Report/PaymentTypeReport";
import PaymentWiseAccountReport from "../dashboard/Reports/Payment WIse Account Report/PaymentWiseAccountReport";
import PendingOrderView from "../dashboard/Reports/Pending Order/pendingOrderView";
import PendingPurchaseReportsView from "../dashboard/Reports/Pending Purchase/pendingPurchaseView";
import PersonalNotesReport from "../dashboard/Reports/Personal Notes Report/PersonalNotesReport";
import PriceListReport from "../dashboard/Reports/Price List Report/PriceListReport";
import ProcessAttendanceGridView from "../dashboard/Reports/Process Attendance Grid View/ProcessAttendanceGridView";
import ProcessAttendanceReportView from "../dashboard/Reports/Process Attendance Report/ProcessAttendanceReportView";
import ProcessReport from "../dashboard/Reports/Process Report/ProcessReport";
import ProductCategoryReport from "../dashboard/Reports/Product Category Report/ProductCategoryReport";
import ProductGroupReport from "../dashboard/Reports/Product Group Report/ProductGroupReport";
import ProductInventoryReport from "../dashboard/Reports/Product Inventory/ProductInventory";
import ProductPendingView from "../dashboard/Reports/Product Pending/productPendingView";
import ProductSalesPurchaseReport from "../dashboard/Reports/Product Sales & Purchase/productSalesPurchaseView";
import ProductUnitReport from "../dashboard/Reports/Product Unit Report/ProductUnitReport";
import ProductReport from "../dashboard/Reports/Products Report/ProductReport";
import ProformaInvoiceView from "../dashboard/Reports/Proforma Invoice Report/ProformaInvoiceView";
import TeamPurchaseInvoiceDataReportsView from "../dashboard/Reports/Purchase Invoice/purchaseInvoiceView";
import TeamPurchaseOrderDataReportsView from "../dashboard/Reports/Purchase Order/purchaseOrderView";
import TeamQuotationDataReportsView from "../dashboard/Reports/Quotations/QuotationView";
import TeamReturnPurchaseDataReportsView from "../dashboard/Reports/Return Purchase Invoice/ReturnPurchaseInvoiceView";
import TeamReturnSalesDataReportsView from "../dashboard/Reports/Return Sales Invoice/ReturnSalesInvoiceView";
import RoundOffMasterGridView from "../dashboard/Reports/Round Of Grid View/RoundOfGridView";
import RoutePlannerGridView from "../dashboard/Reports/Route Planner Grid View/RoutePlannerGridView";
import SalaryProcessGridView from "../dashboard/Reports/Salary Process Grid View/SalaryProcessGridView";
import SalaryRegisterReport from "../dashboard/Reports/Salary Register/SalaryRegisterReport";
import TeamSalesInvoiceDataReportsView from "../dashboard/Reports/Sales Invoice/salesInvoiceView";
import TeamSalesOrderDataReportsView from "../dashboard/Reports/Sales Order/salesOrderView";
import SourceOfTypesReport from "../dashboard/Reports/Source Of Types Report/SourceOfTypesReport";
import AllSourceReport from "../dashboard/Reports/Source Wise Report/sourceReportView";
import StagesStatusReport from "../dashboard/Reports/Stages And Status Report/StagesStatusReport";
import StatusWiseReport from "../dashboard/Reports/Status Wise Report/StatusWiseReport";
import StockAdjustmentReport from "../dashboard/Reports/Stock Adjustment Report/StockAdjustmentReport";
import TaskCategoryReport from "../dashboard/Reports/Task Category Report/TaskCategoryReport";
import TaskTemplateReport from "../dashboard/Reports/Task Template Report/TaskTemplateReport";
import TaxMasterGridView from "../dashboard/Reports/Tax Master Grid View/TaxMasterGridView";
import AllTeamExpense from "../dashboard/Reports/Team Day Wise Expense/teamDayExpenseView";
import TeamPendingWorkReportsView from "../dashboard/Reports/Team Pending Work/TeamPendingWokReportsVIew";
import TeamPerformanceReports from "../dashboard/Reports/Team Performance/TeamPerformanceReports";
import VisitTypeReport from "../dashboard/Reports/Visit Type Report/VisitTypeReport";
import WarehouseReport from "../dashboard/Reports/Warehouse Report/WarehouseReport";
import WhatsappTemplateReport from "../dashboard/Reports/Whatsapp Template Report/WhatsappTemplateReport";
import WorkStationReport from "../dashboard/Reports/Work Station Report/WorkStationReport";
import WorkFlowAutomationReport from "../dashboard/Reports/Workflow Automation Report/WorkFlowAutomationReport";
import NewDashboardView from "../dashboard/new-dashboard/NewDashboardView";
import {
  fetchCompanyTeamApi,
  ICompanyTeam,
} from "../left-side/LeftSideController";
import ReportsTileView from "./ReportsTileView";

const BottomView = ({
  activeView,
  reportName,
  appliedReportType,
  // onCloseReport,
  reportType,
  setActiveView,
  setAppliedReportType,
  onReportClick,
}: any) => {
  const [isCRMDashBoardOpen, setIsCRMDashBoardOpen] = useState(true);
  const [isReportShow, setIsReportShow] = useState(false);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
  const [showAichat, setshowAichat] = useState(false);

  const getFilter = useCommonFilterStore((state) => state.getFilter);
  const setFilter = useCommonFilterStore((state) => state.setFilter);
  const setFilters = useCommonFilterStore((state) => state.setFilters);
  const clearFilters = useCommonFilterStore((state) => state.clearFilters);

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
      clearFilters(appliedReportType);
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
  }, [appliedReportType, clearFilters, setFilters]);

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
    setActiveView("dashboard");
    setAppliedReportType("");
  };

  const insightsSideView = true;
  const fromSideView = true;

  return (
    <div
      className=""
      style={{
        height: "90vh",
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        padding: "10px",
        background: "rgb(255, 255, 255)",
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
          />
        )}

        {appliedReportType === "team_performance" && (
          <TeamPerformanceReports
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
          <TeamQuotationDataReportsView
            title={title[0]?.quotation_title || "Quotation"}
            viewFormate={title[0]?.quotation_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "order" && (
          <TeamSalesOrderDataReportsView
            title={title[0]?.order_title || "Sales Order"}
            viewFormate={title[0]?.order_view_formate || 3}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "dispatch_report" && (
          <TeamDispatchDataReportsView
            title={title[0]?.dispatch_title || "Dispatch"}
            viewFormate={title[0]?.quotation_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "order_invoice" && (
          <TeamSalesInvoiceDataReportsView
            viewFormate={title[0]?.invoice_view_formate || 1}
            title={title[0]?.invoice_title || "Sales Invoice"}
          />
        )}
        {appliedReportType === "return_sales_invoice" && (
          <TeamReturnSalesDataReportsView
            title={
              title[0]?.return_sales_invoice_title || "Return Sales Invoice"
            }
            viewFormate={title[0]?.return_sales_invoice_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "purchase_order" && (
          <TeamPurchaseOrderDataReportsView
            title={title[0]?.purchase_order_title || "Purchase Order"}
            viewFormate={title[0]?.purchase_order_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "inward_report" && (
          <TeamInwardDataReportsView
            title={title[0]?.inward_title || "Inward"}
            viewFormate={title[0]?.inward_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "purchase_invoice" && (
          <TeamPurchaseInvoiceDataReportsView
            title={title[0]?.purchase_title || "Purchase Invoice"}
            viewFormate={title[0]?.purchase_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "return_purchase_invoice" && (
          <TeamReturnPurchaseDataReportsView
            title={
              title[0]?.return_purchase_invoice_title ||
              "Return Purchase Invoice"
            }
            viewFormate={title[0]?.return_purchase_invoice_view_formate || 1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "account" && (
          <AccountOutstandingReports type={reportType} onHide={handleonHide} />
        )}
        {appliedReportType === "pending" && (
          <TeamPendingWorkReportsView
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
          <ProductInventoryReport
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
        {appliedReportType === "My_Team_Report" && (
          <MyTeamReport isCompanyOpen={true} onHide={handleonHide} />
        )}
        {appliedReportType === "attendance_salary" && (
          <TeamAttendanceReportsView onHide={handleonHide} />
        )}
        {appliedReportType === "product_report" && (
          <ProductSalesPurchaseReport
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
          <ProductPendingView
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
          <CategorySalesPurchaseReport
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
          <CategoryPendingReport
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
          <AllcontactReport fromSideView={true} onHide={handleonHide} />
        )}
        {appliedReportType === "all_deleted_contact_report" && (
          <AllDeletedcontactReport onHide={handleonHide} />
        )}
        {appliedReportType === "source_wise_contact_statistic_report" && (
          <AllSourceReport onHide={handleonHide} />
        )}
        {appliedReportType === "label_wise_contact_statistics_report" && (
          <AlllableReport onHide={handleonHide} />
        )}
        {appliedReportType === "all_inquiry_report" && (
          <AllInqueryReport onHide={handleonHide} />
        )}
        {appliedReportType === "team_day_wise_expanse_report" && (
          <AllTeamExpense onHide={handleonHide} />
        )}
        {appliedReportType === "all_visit_report" && (
          <AllVisitReportsView onHide={handleonHide} />
        )}
        {appliedReportType === "all_call_report" && (
          <AllCallReportsView onHide={handleonHide} />
        )}
        {appliedReportType === "pending_order" && (
          <PendingOrderView
            title={
              "Pending " + title[0]?.order_title || "Sales Order Pending Report"
            }
            viewFormate={title[0]?.order_view_formate || 3}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "pending_purchase" && (
          <PendingPurchaseReportsView
            title={
              "Pending " + title[0]?.purchase_order_title ||
              "Pending Purchase Order Report"
            }
            viewFormate={title[0]?.purchase_order_view_formate || 3}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "alltask_report" && (
          <AllTaskReportsView
            is_support_ticket_flag={0}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "support_ticket_report" && (
          <AllTaskReportsView
            is_support_ticket_flag={1}
            onHide={handleonHide}
          />
        )}
        {appliedReportType === "allaccount_report" && (
          <AllAccountReports onHide={handleonHide} />
        )}
        {appliedReportType === "account_credit_report" && (
          <AccountCreaditReport credit_debit_flag={1} onHide={handleonHide} />
        )}
        {appliedReportType === "account_debit_report" && (
          <AccountDebitReport credit_debit_flag={2} onHide={handleonHide} />
        )}
        {appliedReportType === "allreminder_report" && (
          <AllReminderReport is_support_ticket_flag={0} onHide={handleonHide} />
        )}

        {appliedReportType === "all_contact_chainwise_report" && (
          <ChainWiseContactReportView onHide={handleonHide} />
        )}
        {appliedReportType === "daily_sales_invoice" && (
          <DailyInvoiceReportView
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
          <ProductReport onHide={handleonHide} />
        )}
        {appliedReportType === "tax_master" && (
          <TaxMasterGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Price_List_Report" && (
          <PriceListReport onHide={handleonHide} />
        )}
        {appliedReportType === "StockAdjustment_Report" && (
          <StockAdjustmentReport onHide={handleonHide} />
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
        {appliedReportType === "workflow_automation" && (
          <WorkFlowAutomationReport />
        )}
        {appliedReportType === "Emp_Transaction_Report" && (
          <EmployeeTransactionReports onHide={handleonHide} />
        )}
        {appliedReportType === "status_wise_report" && (
          <StatusWiseReport onHide={handleonHide} />
        )}
        {appliedReportType === "Process_Attendance" && (
          <ProcessAttendanceGridView onHide={handleonHide} />
        )}
        {appliedReportType === "Attendance_register_Report" && (
          <ProcessAttendanceReportView
            onHide={handleonHide}
            selectedDayMonthYear={
              selectedDayMonthYear
                ? Object.values(selectedDayMonthYear).filter(Boolean)
                : null
            }
          />
        )}
        {appliedReportType === "Salary_register_Report" && (
          <SalaryRegisterReport
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
          <PaymentWiseAccountReport onHide={handleonHide} />
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
          <EmployeeAccountOutstandingReport onHide={handleonHide} />
        )}
        {appliedReportType === "Expense_Detailed_Report" && (
          <ExpenseDetailedReport onHide={handleonHide} />
        )}
        {appliedReportType === "Job_Card_Grid" && (
          <JobCardGridView onHide={handleonHide} />
        )}
        {appliedReportType === "proforma_invoice_report" && (
          <ProformaInvoiceView
            title={title[0]?.proforma_invoice_title || "Proforma Invoice"}
            viewFormate={title[0]?.proforma_invoice_view_formate || 1}
            onHide={handleonHide}
          />
        )}
      </div>
    </div>
  );
};

export default BottomView;
