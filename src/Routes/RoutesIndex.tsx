import { Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppProvider } from "../common/AppContext";
import NotFound from "../components/NotFound";
import LogoutComponent from "../components/LogoutComponent";

// Every route is code-split so a print/PDF/public URL does not download the
// whole CRM app (and its heavy libs: pdfme, charts, xyflow, ...) up front.
const GuideAvatar = lazy(() => import("../components/guide/GuideAvatar"));
const InstructionView = lazy(() => import("../pages/instruction/InstructionView"));
const PdfView = lazy(() => import("../pages/order-pdf-view/PdfView"));
const OrderPrintViewV2 = lazy(() => import("../pages/order-print-view/OrderPrintViewV2"));
const ContactUs = lazy(() => import("../pages/privacy-policy/ContactUs"));
const PrivacyPolicy = lazy(() => import("../pages/privacy-policy/PrivacyPolicy"));
const Index = lazy(() => import("../pages/public/Index"));
const ActivationCodeView = lazy(() => import("../pages/public/activation-code/ActivationCodeView"));
const ShortcutkeyView = lazy(() => import("../pages/short-cut-Key/Short_cut_key"));
// import Voice from "../pages/voice/Main";
const CompanyVsReferralCode = lazy(() => import("../pages/CompanyVsReferral/CompanyVsReferralCode"));
const Connection = lazy(() => import("../pages/Connection/Connection"));
const AccountPrintView1 = lazy(() => import("../pages/account-print-view/AccountPrintView1"));
const CronSetting = lazy(() => import("../pages/cron-settings/cronSetting"));
const OrderPrintViewV1 = lazy(() => import("../pages/order-print-view/OrderPrintViewV1"));
const OrderPrintViewV3 = lazy(() => import("../pages/order-print-view/OrderPrintViewV3"));
const OrderPrintViewV4 = lazy(() => import("../pages/order-print-view/OrderPrintViewV4"));
const OrderPrintViewV5 = lazy(() => import("../pages/order-print-view/OrderPrintViewV5"));
const PendingPrintViewV1 = lazy(() => import("../pages/order-print-view/PendingPrintViewV1"));
const CreateContactUsingQR = lazy(() => import("../pages/public/create-contact"));
const CompanyQRCodeCard = lazy(() => import("../pages/qr-view"));
const VideoTutorial = lazy(() => import("../pages/video Tutorial/VideoTutorial"));
const Google = lazy(() => import("../pages/voice/Google"));
const NewReportModel = lazy(() => import("../components/model/NewReportModel"));
const AccountTransactionV1 = lazy(() => import("../pages/account-transaction/AccountTransactionV1View"));
// import TeamPerformanceReports from "../pages/dashboard/Reports/TeamPerformanceReports"
const ContactAddressEnvelopePrintView = lazy(() => import("../pages/contact-address-print/ContactAddressEnvelopePrintView"));
const ContactAddressPrintView1 = lazy(() => import("../pages/contact-address-print/ContactAddressPrintView1"));
const CustomerSupportView = lazy(() => import("../pages/customer-support/CustomerSupportView"));
const ReviewsView = lazy(() => import("../pages/reviews/ReviewsView"));
const ProcessAttendanceMonthlySlip = lazy(() => import("../pages/dashboard/Reports/Process Attendance Report/ProcessAttendanceMonthlySlip"));
const SalaryRegisterMonthlySlip = lazy(() => import("../pages/dashboard/Reports/Salary Register/SalaryRegisterMonthlySlip"));
const EmployeeAccountPrintView1 = lazy(() => import("../pages/employee-account-print-view/EmployeeAccountPrintView1"));
const EmpAccountTransactionV1 = lazy(() => import("../pages/employee-account-transaction/EmpAccountTransactionV1View"));
const BomPdfView = lazy(() => import("../pages/left-side/header/Setting/product/bom-master/BomPdfView"));
const StockAdjustmentPrintView = lazy(() => import("../pages/left-side/header/Setting/stock-adjustment/stock-product/StockAdjustmentPrintView"));
const DocumentDesignerView = lazy(() => import("../pages/left-side/header/Setting/document-designer/DocumentDesignerView"));
const PublicFormFillView = lazy(() => import("../pages/public-form/PublicFormFillView"));
const DashboardListView = lazy(() => import("../pages/dashboard/DashboardBuilder/DashboardListView"));
const DashboardCanvasView = lazy(() => import("../pages/dashboard/DashboardBuilder/DashboardCanvasView"));
const DesignerPageDataSourceView = lazy(() => import("../pages/left-side/header/Setting/custom-inquiry-from/DesignerPageDataSourceView"));
const CustomFieldDesignerPageEditorView = lazy(() => import("../pages/left-side/header/Setting/custom-inquiry-from/CustomFieldDesignerPageEditorView"));
const ProductPageDesignerEditorView = lazy(() => import("../pages/left-side/header/Setting/product/ProductPageDesignerEditorView"));
const OnlineStore = lazy(() => import("../pages/online-store"));
const SupportTicket = lazy(() => import("../pages/online-store/store-support-ticket/SupportTicketView"));
const ShippingAddressPrint = lazy(() => import("../pages/order-print-view/ShippingAddressPrint"));
const RegistrationView = lazy(() => import("../pages/public/resternation/RegistrationView"));
const SideView = lazy(() => import("../pages/side-view/SideView"));
const AutomationsShell = lazy(() => import("../pages/automations/AutomationsShell"));
const JobCardPdfView = lazy(() => import("../pages/left-side/header/Setting/job-card/JobCardPdfView"));
const ProductionEntryPdfView = lazy(() => import("../pages/left-side/header/Setting/job-card/ProductionEntryPdfView"));
const JobCardFullPdfView = lazy(() => import("../pages/left-side/header/Setting/job-card/JobCardFullPdfView"));
const RequiredMaterialPdfView = lazy(() => import("../pages/left-side/header/Setting/job-card/RequiredMaterialPdfView"));

const RoutesIndex = () => {
  return (
    <>
      <AppProvider>
        <Router>
          <Suspense fallback={null}>
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
            {/* Custom Form Maker — public, no-login fill link (plan §7),
                mounted alongside online-store's own public route the same
                way. Tenant/company resolved server-side from qrCode +
                shareToken, no auth here. */}
            <Route path="/f/:qrCode/:shareToken" element={<PublicFormFillView />} />
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
            <Route path="/Automations/:view?/:id?" element={<AutomationsShell />} />
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
            {/* Report Builder moved into /SideView's Settings panel
                (ReportBuilderSideView.tsx, via reportsMenuData.tsx's
                "report_builder" entry) — no standalone route anymore. */}
            <Route
              path="/dashboard-builder"
              element={<DashboardListView />}
            />
            <Route
              path="/dashboard-builder/:id"
              element={<DashboardCanvasView />}
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
            <Route
              path="/Reports/:MobileToken/:getID/:MobileFlag/:slug"
              element={<NewReportModel />}
            />
            {/* <Route path="/ContactLocations/:MobileToken/:getID/:MobileFlag" element={<ContactLocationModel />} />
            <Route path="/ContactLocations" element={<ContactLocationModel />} /> */}
            {/* <Route path="/fullScreenReport" element={<TeamPerformanceReports/>}></Route> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GuideAvatar />
          </Suspense>
        </Router>
      </AppProvider>
    </>
  );
};
export default RoutesIndex;
