import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppProvider } from "../common/AppContext";
import NotFound from "../components/NotFound";
import InstructionView from "../pages/instruction/InstructionView";
import PdfView from "../pages/order-pdf-view/PdfView";
import OrderPrintViewV2 from "../pages/order-print-view/OrderPrintViewV2";
import ContactUs from "../pages/privacy-policy/ContactUs";
import PrivacyPolicy from "../pages/privacy-policy/PrivacyPolicy";
import Index from "../pages/public/Index";
import ActivationCodeView from "../pages/public/activation-code/ActivationCodeView";
import ShortcutkeyView from "../pages/short-cut-Key/Short_cut_key";
// import Voice from "../pages/voice/Main";
import CompanyVsReferralCode from "../pages/CompanyVsReferral/CompanyVsReferralCode";
import Connection from "../pages/Connection/Connection";
import AccountPrintView1 from "../pages/account-print-view/AccountPrintView1";
import CronSetting from "../pages/cron-settings/cronSetting";
import OrderPrintViewV1 from "../pages/order-print-view/OrderPrintViewV1";
import OrderPrintViewV3 from "../pages/order-print-view/OrderPrintViewV3";
import OrderPrintViewV4 from "../pages/order-print-view/OrderPrintViewV4";
import OrderPrintViewV5 from "../pages/order-print-view/OrderPrintViewV5";
import PendingPrintViewV1 from "../pages/order-print-view/PendingPrintViewV1";
import CreateContactUsingQR from "../pages/public/create-contact";
import CompanyQRCodeCard from "../pages/qr-view";
import VideoTutorial from "../pages/video Tutorial/VideoTutorial";
import Google from "../pages/voice/Google";
// import ReportModal from "../components/model/ReportsModel";
import NewReportModel from "../components/model/NewReportModel";
import AccountTransactionV1 from "../pages/account-transaction/AccountTransactionV1View";
// import TeamPerformanceReports from "../pages/dashboard/Reports/TeamPerformanceReports"
import LogoutComponent from "../components/LogoutComponent";
import ContactAddressEnvelopePrintView from "../pages/contact-address-print/ContactAddressEnvelopePrintView";
import ContactAddressPrintView1 from "../pages/contact-address-print/ContactAddressPrintView1";
import CustomerSupportView from "../pages/customer-support/CustomerSupportView";
import ReviewsView from "../pages/reviews/ReviewsView";
import ProcessAttendanceMonthlySlip from "../pages/dashboard/Reports/Process Attendance Report/ProcessAttendanceMonthlySlip";
import SalaryRegisterMonthlySlip from "../pages/dashboard/Reports/Salary Register/SalaryRegisterMonthlySlip";
import EmployeeAccountPrintView1 from "../pages/employee-account-print-view/EmployeeAccountPrintView1";
import EmpAccountTransactionV1 from "../pages/employee-account-transaction/EmpAccountTransactionV1View";
import BomPdfView from "../pages/left-side/header/Setting/product/bom-master/BomPdfView";
import StockAdjustmentPrintView from "../pages/left-side/header/Setting/stock-adjustment/stock-product/StockAdjustmentPrintView";
import DocumentDesignerView from "../pages/left-side/header/Setting/document-designer/DocumentDesignerView";
import ReportBuilderView from "../pages/dashboard/Reports/ReportBuilder/ReportBuilderView";
import ReportRunnerView from "../pages/dashboard/Reports/ReportBuilder/ReportRunnerView";
import DesignerPageDataSourceView from "../pages/left-side/header/Setting/custom-inquiry-from/DesignerPageDataSourceView";
import CustomFieldDesignerPageEditorView from "../pages/left-side/header/Setting/custom-inquiry-from/CustomFieldDesignerPageEditorView";
import ProductPageDesignerEditorView from "../pages/left-side/header/Setting/product/ProductPageDesignerEditorView";
import OnlineStore from "../pages/online-store";
import SupportTicket from "../pages/online-store/store-support-ticket/SupportTicketView";
import ShippingAddressPrint from "../pages/order-print-view/ShippingAddressPrint";
import RegistrationView from "../pages/public/resternation/RegistrationView";
import SideView from "../pages/side-view/SideView";
import JobCardPdfView from "../pages/left-side/header/Setting/job-card/JobCardPdfView";
import ProductionEntryPdfView from "../pages/left-side/header/Setting/job-card/ProductionEntryPdfView";
import JobCardFullPdfView from "../pages/left-side/header/Setting/job-card/JobCardFullPdfView";
import RequiredMaterialPdfView from "../pages/left-side/header/Setting/job-card/RequiredMaterialPdfView";

const RoutesIndex = () => {
  return (
    <>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/connection" element={<Connection />} />
            <Route path="/voice" element={<Google />} />
            <Route path="/register" element={<RegistrationView />} />
            <Route path="/cronSetting" element={<CronSetting />} />
            <Route path="/instructionView/:id" element={<InstructionView />} />
            <Route path="/videoTutorial/:id" element={<VideoTutorial />} />
            <Route path="/shortcutkey/:id" element={<ShortcutkeyView />} />
            <Route path="/activationCode" element={<ActivationCodeView />} />
            <Route path="/qr/:qrCode" element={<CreateContactUsingQR />} />
            <Route
              path="/CompanyVsReferralCode"
              element={<CompanyVsReferralCode />}
            />
            <Route path="/website/:qrCode" element={<OnlineStore />} />
            <Route
              path="/AccountTransactionV1/:id/:MobileToken/:getID"
              element={<AccountTransactionV1 />}
            />
            <Route
              path="/AccountTransactionV1/:id"
              element={<AccountTransactionV1 />}
            />
            <Route
              path="/SupportTicket/:id/:contactID"
              element={<SupportTicket />}
            />
            <Route
              path="/EmpAccountTransactionV1/:id/:MobileToken/:getID"
              element={<EmpAccountTransactionV1 />}
            />
            <Route
              path="/EmpAccountTransactionV1/:id"
              element={<EmpAccountTransactionV1 />}
            />
            {/* comapnyID match Logic */}

            {/* <Route
              path="/OrderPrintViewV1/:id/:companyId"
              element={<OrderPrintViewV1 />}
            /> */}

            <Route
              path="/OrderPrintViewV1/:id/"
              element={<OrderPrintViewV1 />}
            />
            <Route
              path="/OrderPrintViewV1/:id/:printFlag/"
              element={<OrderPrintViewV1 />}
            />
            <Route
              path="/OrderPrintViewV2/:id/"
              element={<OrderPrintViewV2 />}
            />
            <Route
              path="/OrderPrintViewV2/:id/:printFlag/"
              element={<OrderPrintViewV2 />}
            />
            <Route
              path="/OrderPrintViewV3/:id/"
              element={<OrderPrintViewV3 />}
            />
            <Route
              path="/OrderPrintViewV3/:id/:printFlag/"
              element={<OrderPrintViewV3 />}
            />
            <Route
              path="/OrderPrintViewV4/:id/"
              element={<OrderPrintViewV4 />}
            />
            <Route
              path="/OrderPrintViewV4/:id/:printFlag/"
              element={<OrderPrintViewV4 />}
            />
            <Route
              path="/OrderPrintViewV5/:id/"
              element={<OrderPrintViewV5 />}
            />
            <Route
              path="/OrderPrintViewV5/:id/:printFlag/"
              element={<OrderPrintViewV5 />}
            />
            <Route
              path="/PendingPrintViewV1/:id/:type"
              element={<PendingPrintViewV1 />}
            />
            <Route
              path="/ShippingAddressPrint/:id/:type"
              element={<ShippingAddressPrint />}
            />
            <Route
              path="/AccountPrintView1/:id/"
              element={<AccountPrintView1 />}
            />
            <Route
              path="/ContactAddressPrintView1/:id/"
              element={<ContactAddressPrintView1 />}
            />
            <Route
              path="/ContactAddressPrintView1/:id/:MobileToken/:getID/"
              element={<ContactAddressPrintView1 />}
            />
            <Route
              path="/ContactAddressEnvelopePrintView/:id/"
              element={<ContactAddressEnvelopePrintView />}
            />
            <Route
              path="/ContactAddressEnvelopePrintView/:id/:MobileToken/:getID/"
              element={<ContactAddressEnvelopePrintView />}
            />
            <Route
              path="/EmployeeAccountPrintView1/:id/"
              element={<EmployeeAccountPrintView1 />}
            />
            <Route
              path="/OrderPrintViewMobileV1/:id/:MobileToken/:getID"
              element={<OrderPrintViewV1 />}
            />
            <Route
              path="/OrderPrintViewMobileV1/:id/:printFlag/:MobileToken/:getID"
              element={<OrderPrintViewV1 />}
            />
            <Route
              path="/OrderPrintViewMobileV2/:id/:MobileToken/:getID"
              element={<OrderPrintViewV2 />}
            />
            <Route
              path="/OrderPrintViewMobileV2/:id/:printFlag/:MobileToken/:getID"
              element={<OrderPrintViewV2 />}
            />
            <Route
              path="/OrderPrintViewMobileV3/:id/:MobileToken/:getID"
              element={<OrderPrintViewV3 />}
            />
            <Route
              path="/OrderPrintViewMobileV3/:id/:printFlag/:MobileToken/:getID"
              element={<OrderPrintViewV3 />}
            />
            <Route
              path="/OrderPrintViewMobileV4/:id/:MobileToken/:getID"
              element={<OrderPrintViewV4 />}
            />
            <Route
              path="/OrderPrintViewMobileV4/:id/:printFlag/:MobileToken/:getID"
              element={<OrderPrintViewV4 />}
            />
            <Route
              path="/OrderPrintViewMobileV5/:id/:MobileToken/:getID"
              element={<OrderPrintViewV5 />}
            />
            <Route
              path="/OrderPrintViewMobileV5/:id/:printFlag/:MobileToken/:getID"
              element={<OrderPrintViewV5 />}
            />
            <Route
              path="/PendingPrintViewV1/:id/:MobileToken/:getID/:type"
              element={<PendingPrintViewV1 />}
            />
            <Route
              path="/AccountPrintView1/:id/:MobileToken/:getID/"
              element={<AccountPrintView1 />}
            />
            <Route
              path="/EmployeeAccountPrintView1/:id/:MobileToken/:getID/"
              element={<EmployeeAccountPrintView1 />}
            />
            <Route
              path="/ShippingAddressPrint/:id/:MobileToken/:getID/"
              element={<ShippingAddressPrint />}
            />
            <Route
              path="/customer-support/"
              element={<CustomerSupportView />}
            />
            <Route path="/reviews" element={<ReviewsView />} />
            <Route path="/BomPdfView/:id/:bomId" element={<BomPdfView />} />
            <Route path="/SideView" element={<SideView />} />
            <Route path="/SideView/report/:slug" element={<SideView />} />
            <Route
              path="/ProcessAttendanceMonthlySlip/:empId/:month/:year"
              element={<ProcessAttendanceMonthlySlip />}
            />
            <Route
              path="/SalaryRegisterMonthlySlip/:empId/:month/:year"
              element={<SalaryRegisterMonthlySlip />}
            />
            <Route
              path="/StockAdjustmentPrintView/:StockId"
              element={<StockAdjustmentPrintView />}
            />
            <Route
              path="/document-designer"
              element={<DocumentDesignerView />}
            />
            <Route
              path="/report-builder"
              element={<ReportBuilderView />}
            />
            <Route
              path="/report-builder/run/:id"
              element={<ReportRunnerView />}
            />
            <Route
              path="/custom-field/designer-page-sources"
              element={<DesignerPageDataSourceView />}
            />
            <Route
              path="/custom-field/designer-page-editor"
              element={<CustomFieldDesignerPageEditorView />}
            />
            <Route
              path="/product/designer-page-editor"
              element={<ProductPageDesignerEditorView />}
            />
            <Route path="/logout" element={<LogoutComponent />} />
            <Route path="/OrderPdfViewV1/:id" element={<PdfView />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/ContactUs" element={<ContactUs />} />
            <Route path="/qr_code" element={<CompanyQRCodeCard />} />
            <Route path="/JobCardPdfView/:id" element={<JobCardPdfView />} />

            {/* Note: Production Entry needs BOTH the job card ID and the entry ID */}
            <Route
              path="/ProductionEntryPdfView/:id/:entryId"
              element={<ProductionEntryPdfView />}
            />

            <Route
              path="/JobCardFullPdfView/:id"
              element={<JobCardFullPdfView />}
            />
            <Route
              path="/RequiredMaterialPdfView/:id"
              element={<RequiredMaterialPdfView />}
            />
            <Route
              path="/Reports/:MobileToken/:getID/:MobileFlag"
              element={<NewReportModel />}
            />
            {/* <Route path="/ContactLocations/:MobileToken/:getID/:MobileFlag" element={<ContactLocationModel />} />
            <Route path="/ContactLocations" element={<ContactLocationModel />} /> */}
            {/* <Route path="/fullScreenReport" element={<TeamPerformanceReports/>}></Route> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AppProvider>
    </>
  );
};
export default RoutesIndex;
