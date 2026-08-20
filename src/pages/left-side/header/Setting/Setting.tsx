import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import noImage from "../../../../assets/images/no_image.jpeg";
import { openInNewTab, useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import ReportModal from "../../../../components/model/ReportsModel";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import useWhatsappPlatformStore from "../../../../store/whatsapp/useWhatsappPlateformFlagStore";
import DashboardView from "../../../dashboard/DashboardView";
import {
  fetchCompanyKeyApi,
  ICompany,
  ILoginData,
} from "../../LeftSideController";
import Visits from "../Setting/visits/VisitView";
import AreasView from "./areas/AreasView";
import CitiesView from "./cities/CitiesView";
import CountriesView from "./countries/CountriesView";
import Help from "./Help";
import MachineManagement from "./machineManagement/Machine-managementView";
import MainSettingsView from "./main-settings/MainSettingsView";
import Notifications from "./Notifications";
import Privacy from "./Privacy";
import ProfileSetting from "./ProfileSetting";
import RequestAccountInfo from "./RequestAccountInfo";
import Security from "./Security";
import StatesView from "./states/StatesView";
import TargetVsIncentiveView from "./target-vs-incentive/TargetVsIncentiveView";
import Wallpaper from "./Wallpaper";

interface IPropsSetting {
  isSettingOpen: boolean;
  closeSettings: () => void;
  myCompany: () => void;
  myTeam: () => void;
  reminder: () => void;
  inquiry: () => void;
  callhistory: () => void;
  productCategory: () => void;
  productGroup: () => void;
  TaskCategory: () => void;
  product: () => void;
  priceList: () => void;
  source: () => void;
  labels: () => void;
  status: () => void;
  expenseType: () => void;
  visitType: () => void;
  leaveType: () => void;
  visits: () => void;
  departments: () => void;
  customFieldForm: () => void;
  whatsAppTemplate: () => void;
  workFlowAutomation: () => void;
  notificationSettings: () => void;
  taskManagement: () => void;
  routePlanner: () => void;
  supportTicketManagement: () => void;
  country: () => void;
  state: () => void;
  city: () => void;
  area: () => void;
  workStation: () => void;
  jobCard: () => void;
  TaskTemplate: () => void;
  ProductUnit: () => void;
  warehouse: () => void;
  PaymentType: () => void;
  CompensationAdjustments: () => void;
  HolidayMaster: () => void;
  RoundOffMaster: () => void;
  AdjustmentTypeMaster: () => void;
  DayAdjustmentMaster: () => void;
  LockControl: () => void;
  TaxMaster: () => void;
  ProcessAttendance: () => void;
  SalaryProcess: () => void;
  BillOfMaterials: () => void;
  ProcessMaster: () => void;
  profileDetail?: ILoginData;
  stockAdjustment: () => void;
  searchTermFromRightSide: string;
  setSearchTermFromRightSide: (data: string) => void;
}

const Setting = ({
  isSettingOpen,
  closeSettings,
  myCompany,
  myTeam,
  reminder,
  inquiry,
  callhistory,
  productCategory,
  productGroup,
  TaskCategory,
  product,
  priceList,
  source,
  labels,
  status,
  expenseType,
  visitType,
  leaveType,
  visits,
  departments,
  customFieldForm,
  whatsAppTemplate,
  workFlowAutomation,
  notificationSettings,
  profileDetail,
  taskManagement,
  routePlanner,
  supportTicketManagement,
  country,
  state,
  city,
  area,
  workStation,
  jobCard,
  TaskTemplate,
  ProductUnit,
  PaymentType,
  CompensationAdjustments,
  HolidayMaster,
  RoundOffMaster,
  AdjustmentTypeMaster,
  DayAdjustmentMaster,
  LockControl,
  TaxMaster,
  ProcessAttendance,
  SalaryProcess,
  BillOfMaterials,
  ProcessMaster,
  warehouse,
  stockAdjustment,
  searchTermFromRightSide,
  setSearchTermFromRightSide,
}: IPropsSetting) => {
  const navigate = useNavigate();
  const canViewDocumentDesigner = useCheckUserPermission(
    PAGE_ID.DOCUMENT_DESIGNER_RIGHTS,
    PERMISSION_TYPE.VIEW,
  );
  function openDocumentDesigner() {
    if (canViewDocumentDesigner) {
      navigate("/document-designer");
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  // No PAGE_ID/rights entry yet (report_builder's page_id/a_application_pages
  // wiring is deferred, per plan) — access control is entirely server-side
  // (company_feature_flags.report_builder + the shared owner+PIN gate), so
  // this tile is always reachable; the page itself surfaces whichever gate
  // blocks a given login via toast.
  function openReportBuilder() {
    navigate("/report-builder");
  }
  const [optionConfirmation, setOptionConfirmation] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showopenNotification, setShownNotification] = useState(false);
  const [showPrivacy, setShownPrivacy] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showopenSourceOfType, setshowopenSourceOfType] = useState(false);

  const [showOpenWorkFlow, setShowOpenWorkFlow] = useState(false);
  const [showOpenSetting, setShowOpenSetting] = useState(false);
  const [showTargetVsIncentive, setTargetVsIncentive] = useState(false);
  const [showVisitType, setShowVisitType] = useState(false);
  const [showLeaveType, setShowLeaveType] = useState(false);
  const [showMachineManagement, setShowMachineManagement] = useState(false);
  const [showVisits, setShowVisits] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [companyLists, setCompanyLists] = useState<ICompany>();
  const [showAllReport, setShowAllReport] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isOpenSomething, setIsOpenSomething] = useState<boolean>(false);

  const { platformType } = useWhatsappPlatformStore();

  useEffect(() => {
    switch (searchTermFromRightSide) {
      case "Profile":
        setShowProfile(true);
        break;
      case "Shortcut":
        setSearchTermFromRightSide("");
        const baseURL = window.location.origin;
        window.open(`${baseURL}/shortcutkey/1`, "_blank");
        closeSettings();
        break;
    }
  }, []);

  useEffect(() => {
    if (
      searchTermFromRightSide === "Target vs incentive" ||
      searchTermFromRightSide === "Create Target Vs Incentive"
    ) {
      setTargetVsIncentive(true);
    }
  }, [showTargetVsIncentive]);

  function openCompany() {
    // setShowListCompany(true);
    myCompany();
  }
  // escape handle
  useEscapeKey(() => {
    if (!showInsights && !showAllReport && !isOpenSomething) {
      closeSettings();
    } else {
      setShowInsights(false);
      setShowAllReport(false);
      setIsOpenSomething(false);
    }
  });

  const openMyCompanyList = async () => {
    if (canViewTeamMember) {
      try {
        await fetchCompanyKeyApi(setCompanyLists);
      } catch (error: any) { }
      myTeam();
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  function openInquiry() {
    inquiry();
  }
  function openreminder() {
    setIsOpenSomething(true);
    reminder();
  }
  function opencallhistory() {
    callhistory();
  }
  function openCategory() {
    productCategory();
  }
  function openGroup() {
    productGroup();
  }
  function openTaskCategory() {
    TaskCategory();
  }
  function openPaymentType() {
    PaymentType();
  }
  function openCompensationAdjustments() {
    CompensationAdjustments();
  }
  function openHolidayMaster() {
    HolidayMaster();
  }
  function openRoundOffMaster() {
    RoundOffMaster();
  }
  function openAdjustmentTypeMaster() {
    AdjustmentTypeMaster();
  }
  function openDayAdjustmentMaster() {
    DayAdjustmentMaster();
  }
  function openLockControl() {
    LockControl();
  }
  function openTaxMaster() {
    TaxMaster();
  }
  function openProcessAttendance() {
    ProcessAttendance();
  }
  function openSalaryProcess() {
    SalaryProcess();
  }
  function openBillOfMaterials() {
    BillOfMaterials();
  }
  function openStockAdjustment() {
    stockAdjustment();
  }
  function openProcessMaster() {
    ProcessMaster();
  }
  function openTaskTemplate() {
    TaskTemplate();
  }
  function openProductUnit() {
    ProductUnit();
  }
  function openRoutePlanner() {
    routePlanner();
  }
  function openTaskManageMent() {
    taskManagement();
  }
  function openSupportTicketManagement() {
    supportTicketManagement();
  }

  function openProfile() {
    setShowProfile(true);
  }
  function openNotifications() {
    setShownNotification(true);
  }
  function openPrivacy() {
    setShownPrivacy(true);
  }

  function openSecurity() {
    setShowSecurity(true);
  }

  function openWallpaper() {
    setShowWallpaper(true);
  }
  function openRequest() {
    setShowRequest(true);
  }
  function openHelp() {
    setShowHelp(true);
  }
  function openAllReport() {
    setShowAllReport(true);
  }
  function openInsights() {
    setShowInsights(true);
  }
  function openSourceOfType() {
    source();
  }
  function openLabel() {
    labels();
  }

  function openProduct() {
    product();
  }
  function openPriceList() {
    priceList();
  }
  function openStageStatus() {
    status();
  }
  function openExpenseType() {
    expenseType();
  }
  function openVisitType() {
    visitType();
  }
  function openLeaveType() {
    leaveType();
  }
  function openCustomInquiryForm() {
    customFieldForm();
  }
  function openWhatsAppTemplate() {
    whatsAppTemplate();
  }
  function openWorkFlowAutoMation() {
    if (canViewWorkflowAutomation) {
      workFlowAutomation();
    } else {
      setShowOpenWorkFlow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function openJopCard() {
    jobCard();
  }
  function openWorkStation() {
    workStation();
  }
  function department() {
    departments();
  }
  function openSetting() {
    notificationSettings();
  }
  function openTargetVsIncentive() {
    setTargetVsIncentive(true);
  }
  function openVisit() {
    visits();
  }
  function openStates() {
    state();
  }
  function openCities() {
    city();
  }
  function openCountries() {
    country();
  }
  function openAreas() {
    area();
  }

  function openWhere() {
    warehouse();
  }
  const canViewWorkflowAutomation = useCheckUserPermission(
    PAGE_ID.WORKFLOW_AUTOMATION,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTeamMember = useCheckUserPermission(
    PAGE_ID.TEAM_MEMBER_WITH_ACCESS_RIGHT,
    PERMISSION_TYPE.VIEW,
  );

  return (
    <>
      {showProfile ||
        showPrivacy ||
        showSecurity ||
        showWallpaper ||
        showRequest ||
        showopenSourceOfType ||
        showHelp ||
        showMachineManagement ||
        showVisits ||
        showCountries ||
        showStates ||
        showCities ||
        showAreas ||
        showTargetVsIncentive ||
        showVisitType ||
        showLeaveType ||
        showAllReport ||
        showInsights ? (
        <>
          {showProfile && (
            <ProfileSetting
              isProfileOpen={showProfile}
              closeProfile={() => {
                setShowProfile(false);
                setSearchTermFromRightSide("");
              }}
              profileDetail={profileDetail}
            />
          )}

          {showopenNotification && (
            <Notifications
              isNotificationOpen={showopenNotification}
              closeNotifications={() => setShownNotification(false)}
            />
          )}
          {showPrivacy && (
            <Privacy
              isPrivayOpen={showPrivacy}
              closePrivacy={() => setShownPrivacy(false)}
            />
          )}
          {showSecurity && (
            <Security
              isSecurityOpen={showSecurity}
              closeSecurity={() => setShowSecurity(false)}
            />
          )}
          {showWallpaper && (
            <Wallpaper
              isWallpaperOpen={showWallpaper}
              closeWallpaper={() => setShowWallpaper(false)}
            />
          )}
          {showRequest && (
            <RequestAccountInfo
              isRequestOpen={showRequest}
              closeRequest={() => setShowRequest(false)}
            />
          )}
          {showHelp && (
            <Help isHelpOpen={showHelp} closeHelp={() => setShowHelp(false)} />
          )}

          {showMachineManagement && (
            <MachineManagement
              isMachineView={showMachineManagement}
              closeMachineView={() => setShowMachineManagement(false)}
            />
          )}
          {showVisits && (
            <Visits
              isVisitView={showVisits}
              closeVisitView={() => setShowVisits(false)}
            />
          )}
          {showTargetVsIncentive && (
            <TargetVsIncentiveView
              isTargetVsIncentiveView={showTargetVsIncentive}
              closeTargetVsIncentiveView={() => {
                setTargetVsIncentive(false);
                setSearchTermFromRightSide("");
              }}
              searchTermFromRightSide={searchTermFromRightSide}
              setSearchTermFromRightSide={setSearchTermFromRightSide}
            />
          )}
          {showStates && (
            <StatesView
              isStatesView={showStates}
              closeStatesView={() => setShowStates(false)}
            />
          )}
          {showCountries && (
            <CountriesView
              isCountriesView={showCountries}
              closeCountriesView={() => setShowCountries(false)}
            />
          )}
          {showCities && (
            <CitiesView
              isCitiesView={showCities}
              closeCitiesView={() => setShowCities(false)}
            />
          )}
          {showAreas && (
            <AreasView
              isAreasView={showAreas}
              closeAreasView={() => setShowAreas(false)}
            />
          )}

          {showOpenSetting && (
            <MainSettingsView
              isMainSettingView={showOpenSetting}
              closeMainSettingView={() => setShowOpenSetting(false)}
            />
          )}
          {showAllReport && (
            <ReportModal
              show={showAllReport}
              onHide={() => setShowAllReport(false)}
              handleSubmit={() => setShowAllReport(false)}
              titles={"Create"}
              message={"Please Enter Your Order Details"}
              btn1={"CANCEL"}
              btn2={"Approve"}
            />
          )}
          {showInsights && (
            <DashboardView
              isDashBoardOpen={showInsights}
              closeDashboard={() => setShowInsights(false)}
              companyInfo={companyLists}
              contactData={""}
            />
          )}
        </>
      ) : (
        <>
          {isSettingOpen && (
            <div
              className="settings animate__animated animate__fadeInLeft"
              id="settings"
            >
              <div className="header-Chat">
                <div className="ICON">
                  <button className="icons" onClick={closeSettings}>
                    <span className="" title="Back">
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
                  </button>
                </div>
                <div
                  className="newText d-flex justify-content-between"
                  style={{ width: "100%" }}
                >
                  <h2>Settings</h2>
                </div>
              </div>
              <div className="chats-settings">
                <div
                  className="top"
                  onClick={openProfile}
                  style={{
                    cursor: "pointer",
                    borderBottom: "2px solid #a0a2a3ff",
                  }}
                >
                  <div className="imgBox">
                    {profileDetail?.profile_pic ? (
                      <img
                        src={`${profileDetail?.profile_pic}`}
                        alt=""
                        className="cover"
                      />
                    ) : (
                      <img src={noImage} alt="" className="cover" />
                    )}
                  </div>
                  <div className="h-text">
                    <div className="head">
                      <h4>{profileDetail?.username}</h4>
                    </div>
                    <div className="message">
                      {profileDetail?.registration_flag != "1" ? (
                        <p>{profileDetail?.recovery_mobile}</p>
                      ) : (
                        <p>{profileDetail?.recovery_email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    Company Setup
                  </h6>
                  <div className="block ps-3" onClick={openCompany}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Company"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="My Company" aria-label="My Company">
                          My Company
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openMyCompanyList}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Category"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="My Team" aria-label="My Team">
                          My Team
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openDocumentDesigner}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Document Designer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Document Designer" aria-label="Document Designer">
                          Document Designer
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openReportBuilder}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Report Builder"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M280-280h80v-200h-80v200Zm160 0h80v-360h-80v360Zm160 0h80v-120h-80v120ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Report Builder" aria-label="Report Builder">
                          Report Builder
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openInsights}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Category"
                        >
                          <svg
                            enable-background="new 0 0 20 20"
                            height="24px"
                            viewBox="0 0 20 20"
                            width="24px"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                          >
                            <path d="m0 0h20v20h-20z" fill="none"></path>
                            <path d="m12.5 8 .79-1.72 1.71-.78-1.71-.78-.79-1.72-.76 1.72-1.74.78 1.74.78z"></path>
                            <path d="m4 10 .4-1.6 1.6-.4-1.6-.4-.4-1.6-.4 1.6-1.6.4 1.6.4z"></path>
                            <path d="m16.5 6c-1.07 0-1.84 1.12-1.35 2.14l-3.01 3.01c-.52-.25-.99-.14-1.29 0l-1.01-1.01c.1-.19.16-.41.16-.64 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .23.06.45.15.64l-3.01 3.01c-.19-.09-.41-.15-.64-.15-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c.52.25.99.14 1.29 0l1.01 1.01c-.1.19-.16.41-.16.64 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c1.03.5 2.14-.29 2.14-1.35 0-.83-.67-1.5-1.5-1.5z"></path>
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="My Team" aria-label="My Team">
                          Insights
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openAllReport}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Category"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M80-120v-80h800v80H80Zm40-120v-280h120v280H120Zm200 0v-480h120v480H320Zm200 0v-360h120v360H520Zm200 0v-600h120v600H720Z"></path>
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="My Team" aria-label="My Team">
                          All Reports
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    HR
                  </h6>
                  <div className="block ps-3" onClick={openTargetVsIncentive}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Target Vs incentive"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-80q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Zm0-80q66 0 113-47t47-113q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-80q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4
                          title="Target vs incentive"
                          aria-label="Target vs incentive"
                        >
                          Target vs incentive
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={department}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Department"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Department" aria-label="Department">
                          Department
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openExpenseType}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Expense Type"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v240H160v240h400v80H160Zm0-480h640v-80H160v80ZM760-80v-120H640v-80h120v-120h80v120h120v80H840v120h-80ZM160-240v-480 480Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="ExpenseType" aria-label="ExpenseType">
                          Expense Type
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openVisitType}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Visit Type"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M519-82v-80q42-6 81.5-23t74.5-43l58 58q-47 37-101 59.5T519-82Zm270-146-56-56q26-33 42-72.5t22-83.5h82q-8 62-30.5 115.5T789-228Zm8-292q-6-45-22-84.5T733-676l56-56q38 44 61.5 98T879-520h-82ZM439-82q-153-18-255.5-131T81-480q0-155 102.5-268T439-878v80q-120 17-199 107t-79 211q0 121 79 210.5T439-162v80Zm238-650q-36-27-76-44t-82-22v-80q59 5 113 27.5T733-790l-56 58ZM480-280q-58-49-109-105t-51-131q0-68 46.5-116T480-680q67 0 113.5 48T640-516q0 75-51 131T480-280Zm0-200q18 0 30.5-12.5T523-523q0-17-12.5-30T480-566q-18 0-30.5 13T437-523q0 18 12.5 30.5T480-480Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="VisitType" aria-label="VisitType">
                          Visit Type
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openLeaveType}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Leave Type"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M440-440q17 0 28.5-11.5T480-480q0-17-11.5-28.5T440-520q-17 0-28.5 11.5T400-480q0 17 11.5 28.5T440-440ZM280-120v-80l240-40v-445q0-15-9-27t-23-14l-208-34v-80l220 36q44 8 72 41t28 77v512l-320 54Zm-160 0v-80h80v-560q0-34 23.5-57t56.5-23h400q34 0 57 23t23 57v560h80v80H120Zm160-80h400v-560H280v560Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="LeaveType" aria-label="LeaveType">
                          Leave Type
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openSalaryProcess}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Salary"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M200-200v-560 560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v100h-80v-100H200v560h560v-100h80v100q0 33-23.5 56.5T760-120H200Zm320-160q-33 0-56.5-23.5T440-360v-240q0-33 23.5-56.5T520-680h280q33 0 56.5 23.5T880-600v240q0 33-23.5 56.5T800-280H520Zm280-80v-240H520v240h280Zm-160-60q25 0 42.5-17.5T700-480q0-25-17.5-42.5T640-540q-25 0-42.5 17.5T580-480q0 25 17.5 42.5T640-420Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="VisitType" aria-label="VisitType">
                          Salary
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openProcessAttendance}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Process Attendance"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm40-80h200v-80H200v80Zm382-80 198-198-57-57-141 142-57-57-56 57 113 113Zm-382-80h200v-80H200v80Zm0-160h200v-80H200v80Zm-40 400v-560 560Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4
                          title="Process Attendance"
                          aria-label="Process Attendance"
                        >
                          Process Attendance
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div
                    className="block ps-3"
                    onClick={openCompensationAdjustments}
                  >
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Compensation Adjustments"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M299.5-148Q234-176 185-225t-77-114.5Q80-405 80-480t28-140.5Q136-686 185-735t114.5-77Q365-840 440-840q21 0 40.5 2.5T520-830v82q-20-6-39.5-9t-40.5-3q-118 0-199 81t-81 199q0 118 81 199t199 81q118 0 199-81t81-199q0-11-1-20t-3-20h82q2 11 2 20v20q0 75-28 140.5T695-225q-49 49-114.5 77T440-120q-75 0-140.5-28ZM552-312 400-464v-216h80v184l128 128-56 56Zm168-288v-120H600v-80h120v-120h80v120h120v80H800v120h-80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4
                          title="Compensation Adjustments"
                          aria-label="Compensation Adjustments"
                        >
                          Compensation Adjustments
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openLockControl}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Lock Control"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v240h-80v-80H200v400h360v80H200Zm0-560h560v-80H200v80Zm0 0v-80 80ZM674-80q-14 0-24-10t-10-24v-132q0-14 10-24t24-10h6v-40q0-33 23.5-56.5T760-400q33 0 56.5 23.5T840-320v40h6q14 0 24 10t10 24v132q0 14-10 24t-24 10H674Zm46-200h80v-40q0-17-11.5-28.5T760-360q-17 0-28.5 11.5T720-320v40Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="PaymentType" aria-label="PaymentType">
                          Lock Control
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openHolidayMaster}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Holiday Master"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M784-120 530-374l56-56 254 254-56 56Zm-546-28q-60-60-89-135t-29-153q0-78 29-152t89-134q60-60 134.5-89.5T525-841q78 0 152.5 29.5T812-722L238-148Zm8-122 54-54q-16-21-30.5-43T243-411q-12-22-21-44t-16-43q-11 59-1.5 118T246-270Zm112-110 222-224q-43-33-86.5-53.5t-81.5-28q-38-7.5-68.5-2.5T296-666q-17 18-22 48.5t2.5 69q7.5 38.5 28 81.5t53.5 87Zm278-280 56-54q-53-32-112-42t-118 2q22 7 44 16t44 20.5q22 11.5 43.5 26T636-660Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="PaymentType" aria-label="PaymentType">
                          Holiday
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openRoundOffMaster}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Round Off Master"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm-99.5 291.5Q275-137 226-186t-77.5-114.5Q120-366 120-440t28.5-139.5Q177-645 226-694t114.5-77.5Q406-800 480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80q-74 0-139.5-28.5ZM678-242q82-82 82-198t-82-198q-82-82-198-82t-198 82q-82 82-82 198t82 198q82 82 198 82t198-82ZM480-440Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="PaymentType" aria-label="PaymentType">
                          Round Off
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openAdjustmentTypeMaster}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Adjustment Type"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm-99.5 291.5Q275-137 226-186t-77.5-114.5Q120-366 120-440t28.5-139.5Q177-645 226-694t114.5-77.5Q406-800 480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80q-74 0-139.5-28.5ZM678-242q82-82 82-198t-82-198q-82-82-198-82t-198 82q-82 82-82 198t82 198q82 82 198 82t198-82ZM480-440Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="PaymentType" aria-label="PaymentType">
                          Adjustment Type
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openDayAdjustmentMaster}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Day Adjustment"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm-99.5 291.5Q275-137 226-186t-77.5-114.5Q120-366 120-440t28.5-139.5Q177-645 226-694t114.5-77.5Q406-800 480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80q-74 0-139.5-28.5ZM678-242q82-82 82-198t-82-198q-82-82-198-82t-198 82q-82 82-82 198t82 198q82 82 198 82t198-82ZM480-440Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="DayAdjustmentView" aria-label="PaymentType">
                          Day Adjustment
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openPaymentType}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Payment Type"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="PaymentType" aria-label="PaymentType">
                          Payment Type
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    Activities
                  </h6>
                  <div className="block ps-3" onClick={openInquiry}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Category"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All Inquiries" aria-label="All Inquiries">
                          All My Inquiries
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openreminder}>
                    <div className="icon-Box">
                      <button className="icons-setings">
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
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All Reminders" aria-label="All Reminders">
                          All My Reminders
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={opencallhistory}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span title="Reminder">
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path
                              xmlns="http://www.w3.org/2000/svg"
                              d="M480-800v-80h400v80H480Zm0 160v-80h400v80H480Zm0 160v-80h400v80H480ZM758-80q-125 0-247-54.5T289-289Q189-389 134.5-511T80-758q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T347-346q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T630-350l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM201-560l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM201-560Zm358 358Z"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All Reminders" aria-label="All Reminders">
                          All My Call History
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openVisit}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Visits"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
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
                    </div>

                    <div className="h-text">
                      <div className="head">
                        <h4 title="ExpenseType" aria-label="ExpenseType">
                          All My Visits
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openTaskManageMent}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="All My Task"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560h600v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-600H320v480h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h360v80H360Zm0 120v-80h360v80H360ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm0 0h-40 400-360Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All My Task" aria-label="All My Task">
                          All My Task
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openRoutePlanner}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Route Planner"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560h600v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-600H320v480h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h360v80H360Zm0 120v-80h360v80H360ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm0 0h-40 400-360Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Route Planner" aria-label="Route Planner">
                          Route Planner
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    Product Settings
                  </h6>
                  <div className="block ps-3" onClick={openGroup}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Group"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Group" aria-label="Group">
                          Product Group
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openCategory}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Category"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Category" aria-label="Category">
                          Product Category
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openProductUnit}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product Unit"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Unit" aria-label="Unit">
                          Product Unit
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openProduct}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Product"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Product" aria-label="Product">
                          Products
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openTaxMaster}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Tax"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M480-80q-24 0-46-9t-39-26q-29-29-50-38t-63-9q-50 0-85-35t-35-85q0-42-9-63t-38-50q-17-17-26-39t-9-46q0-24 9-46t26-39q29-29 38-50t9-63q0-50 35-85t85-35q42 0 63-9t50-38q17-17 39-26t46-9q24 0 46 9t39 26q29 29 50 38t63 9q50 0 85 35t35 85q0 42 9 63t38 50q17 17 26 39t9 46q0 24-9 46t-26 39q-29 29-38 50t-9 63q0 50-35 85t-85 35q-42 0-63 9t-50 38q-17 17-39 26t-46 9Zm0-80q8 0 15.5-3.5T508-172q41-41 77-55.5t93-14.5q17 0 28.5-11.5T718-282q0-58 14.5-93.5T788-452q12-12 12-28t-12-28q-41-41-55.5-77T718-678q0-17-11.5-28.5T678-718q-58 0-93.5-14.5T508-788q-5-5-12.5-8.5T480-800q-8 0-15.5 3.5T452-788q-41 41-77 55.5T282-718q-17 0-28.5 11.5T242-678q0 58-14.5 93.5T172-508q-12 12-12 28t12 28q41 41 55.5 77t14.5 93q0 17 11.5 28.5T282-242q58 0 93.5 14.5T452-172q5 5 12.5 8.5T480-160Zm100-160q25 0 42.5-17.5T640-380q0-25-17.5-42.5T580-440q-25 0-42.5 17.5T520-380q0 25 17.5 42.5T580-320Zm-202-2 260-260-56-56-260 260 56 56Zm44.5-215.5Q440-555 440-580t-17.5-42.5Q405-640 380-640t-42.5 17.5Q320-605 320-580t17.5 42.5Q355-520 380-520t42.5-17.5ZM480-480Z" /></svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Product" aria-label="Product">
                          Tax
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openPriceList}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Price List"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560h600v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-600H320v480h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h360v80H360Zm0 120v-80h360v80H360ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm0 0h-40 400-360Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    {/* <!-- Text --> */}
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Price List" aria-label="Price List">
                          Price List
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    Masters
                  </h6>
                  <div className="block ps-3" onClick={openTaskCategory}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Task Category"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560h600v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-600H320v480h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h360v80H360Zm0 120v-80h360v80H360ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm0 0h-40 400-360Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Task Category" aria-label="Task Category">
                          Task Category
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openTaskTemplate}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Task Template"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M200-200v-560 454-85 191Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v320h-80v-320H200v560h280v80H200Zm494 40L552-222l57-56 85 85 170-170 56 57L694-80ZM320-440q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 160h240v-80H440v80Zm0-160h240v-80H440v80Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Task Template" aria-label="Task Template">
                          Task Template
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openSourceOfType}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Source"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M480-120q-151 0-255.5-46.5T120-280v-400q0-66 105.5-113T480-840q149 0 254.5 47T840-680v400q0 67-104.5 113.5T480-120Zm0-479q89 0 179-25.5T760-679q-11-29-100.5-55T480-760q-91 0-178.5 25.5T200-679q14 30 101.5 55T480-599Zm0 199q42 0 81-4t74.5-11.5q35.5-7.5 67-18.5t57.5-25v-120q-26 14-57.5 25t-67 18.5Q600-528 561-524t-81 4q-42 0-82-4t-75.5-11.5Q287-543 256-554t-56-25v120q25 14 56 25t66.5 18.5Q358-408 398-404t82 4Zm0 200q46 0 93.5-7t87.5-18.5q40-11.5 67-26t32-29.5v-98q-26 14-57.5 25t-67 18.5Q600-328 561-324t-81 4q-42 0-82-4t-75.5-11.5Q287-343 256-354t-56-25v99q5 15 31.5 29t66.5 25.5q40 11.5 88 18.5t94 7Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Source of Type" aria-label="Source of Type">
                          Source
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openLabel}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Label"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h440q19 0 36 8.5t28 23.5l216 288-216 288q-11 15-28 23.5t-36 8.5H160Zm0-80h440l180-240-180-240H160v480Zm220-240Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Label" aria-label="Label">
                          Label
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openStageStatus}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Stages & Status"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm40-80h200v-80H200v80Zm382-80 198-198-57-57-141 142-57-57-56 57 113 113Zm-382-80h200v-80H200v80Zm0-160h200v-80H200v80Zm-40 400v-560 560Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Stages & Status" aria-label="Price List">
                          Stages & Status
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openCountries}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="All Countries"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path
                              xmlns="http://www.w3.org/2000/svg"
                              d="M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All Countries" aria-label="All Countries">
                          All Countries
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openStates}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="All States"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path
                              xmlns="http://www.w3.org/2000/svg"
                              d="M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All States" aria-label="All States">
                          All States
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openCities}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="All States"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path
                              xmlns="http://www.w3.org/2000/svg"
                              d="M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All States" aria-label="All States">
                          All Cities
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openAreas}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="All States"
                        >
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path
                              xmlns="http://www.w3.org/2000/svg"
                              d="M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="All States" aria-label="All States">
                          All Areas
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    Production Settings
                  </h6>
                  <div className="block ps-3" onClick={openJopCard}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Job Card"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="m234-480-12-60q-12-5-22.5-10.5T178-564l-58 18-40-68 46-40q-2-13-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T222-820l12-60h80l12 60q12 5 22.5 10.5T370-796l58-18 40 68-46 40q2 13 2 26t-2 26l46 40-40 68-58-18q-11 8-21.5 13.5T326-540l-12 60h-80Zm96.5-143.5Q354-647 354-680t-23.5-56.5Q307-760 274-760t-56.5 23.5Q194-713 194-680t23.5 56.5Q241-600 274-600t56.5-23.5ZM592-40l-18-84q-17-6-31.5-14.5T514-158l-80 26-56-96 64-56q-2-18-2-36t2-36l-64-56 56-96 80 26q14-11 28.5-19.5T574-516l18-84h112l18 84q17 6 31.5 14.5T782-482l80-26 56 96-64 56q2 18 2 36t-2 36l64 56-56 96-80-26q-14 11-28.5 19.5T722-124l-18 84H592Zm56-160q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Job Card" aria-label="Job Card">
                          Job Card
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openWorkStation}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Work Station"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Work Station" aria-label="Work Station">
                          Work Station
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openProcessMaster}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Process Master"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M600-120v-120H440v-400h-80v120H80v-320h280v120h240v-120h280v320H600v-120h-80v320h80v-120h280v320H600ZM160-760v160-160Zm520 400v160-160Zm0-400v160-160Zm0 160h120v-160H680v160Zm0 400h120v-160H680v160ZM160-600h120v-160H160v160Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Process Master" aria-label="Process Master">
                          Process Master
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openWhere}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Work Station"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Work Station" aria-label="Work Station">
                          WareHouse
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openBillOfMaterials}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Bill Of Materials"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M120-80v-800l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v800l-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h480v-80H240v80Zm0-160h480v-80H240v80Zm0-160h480v-80H240v80Zm-40 404h560v-568H200v568Zm0-568v568-568Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4
                          title="Bill Of Materials"
                          aria-label="Bill Of Materials"
                        >
                          Bill Of Materials
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openStockAdjustment}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="Stock Adjustment"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M348.5-291.5Q360-303 360-320t-11.5-28.5Q337-360 320-360t-28.5 11.5Q280-337 280-320t11.5 28.5Q303-280 320-280t28.5-11.5Zm0-160Q360-463 360-480t-11.5-28.5Q337-520 320-520t-28.5 11.5Q280-497 280-480t11.5 28.5Q303-440 320-440t28.5-11.5Zm0-160Q360-623 360-640t-11.5-28.5Q337-680 320-680t-28.5 11.5Q280-657 280-640t11.5 28.5Q303-600 320-600t28.5-11.5ZM440-280h240v-80H440v80Zm0-160h240v-80H440v80Zm0-160h240v-80H440v80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4
                          title="Stock Adjustment"
                          aria-label="Stock Adjustment"
                        >
                          Stock Adjustment
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h6
                    className="mt-3 ms-2 fw-bold"
                    style={{ color: "rgb(245, 134, 52)" }}
                  >
                    Other Settings
                  </h6>
                  {platformType === 2 && (
                    <div className="block ps-3" onClick={openWhatsAppTemplate}>
                      <div className="icon-Box">
                        <button className="icons-setings">
                          <span
                            data-icon="settings-notifications"
                            className=""
                            title="WhatsApp Template"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="currentColor"
                            >
                              <path d="M200-520q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm0-80h560v-160H200v160Zm0 480q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-80h560v-160H200v160Zm0-560v160-160Zm0 400v160-160Z" />
                            </svg>
                          </span>
                        </button>
                      </div>
                      <div className="h-text">
                        <div className="head">
                          <h4 title="Custom Field Form">Whatsapp Template</h4>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="block ps-3" onClick={openCustomInquiryForm}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <span
                          data-icon="settings-notifications"
                          className=""
                          title="custom Field Form"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M200-520q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm0-80h560v-160H200v160Zm0 480q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-80h560v-160H200v160Zm0-560v160-160Zm0 400v160-160Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Custom Field Form">Custom Field Form</h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openSetting}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="currentColor"
                        >
                          <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                        </svg>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Settings">Notification Settings</h4>
                      </div>
                    </div>
                  </div>
                  <div className="block ps-3" onClick={openWorkFlowAutoMation}>
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="currentColor"
                        >
                          <path d="M296-270q-42 35-87.5 32T129-269q-34-28-46.5-73.5T99-436l75-124q-25-22-39.5-53T120-680q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47q-9 0-18-1t-17-3l-77 130q-11 18-7 35.5t17 28.5q13 11 31 12.5t35-12.5l420-361q42-35 88-31.5t80 31.5q34 28 46 73.5T861-524l-75 124q25 22 39.5 53t14.5 67q0 66-47 113t-113 47q-66 0-113-47t-47-113q0-66 47-113t113-47q9 0 17.5 1t16.5 3l78-130q11-18 7-35.5T782-630q-13-11-31-12.5T716-630L296-270Zm-16-330q33 0 56.5-23.5T360-680q0-33-23.5-56.5T280-760q-33 0-56.5 23.5T200-680q0 33 23.5 56.5T280-600Zm400 400q33 0 56.5-23.5T760-280q0-33-23.5-56.5T680-360q-33 0-56.5 23.5T600-280q0 33 23.5 56.5T680-200ZM280-680Zm400 400Z" />
                        </svg>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Work Flow Automation">
                          Workflow Automation
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div
                    className="block ps-3"
                    onClick={() => openInNewTab("/shortcutkey", 1)}
                  >
                    <div className="icon-Box">
                      <button className="icons-setings">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="currentColor"
                        >
                          <path
                            xmlns="http://www.w3.org/2000/svg"
                            d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm160-40h320v-80H320v80ZM200-440h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM200-560h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM160-280v-400 400Z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="h-text">
                      <div className="head">
                        <h4 title="Settings">Shortcut</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {optionConfirmation && (
        <ConfirmationModal
          show={optionConfirmation}
          onHide={() => setOptionConfirmation(false)}
          handleSubmit={() => "jhj"}
          title={"Choose theme"}
          btn1="CANCEL"
          btn2="OK"
          isoption={true}
          opt1={"Light"}
          opt2={"Dark"}
          opt3={"System default"}
        />
      )}
    </>
  );
};

export default Setting;
