import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React, { useEffect, useRef, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MultiValue } from "react-select";
import { toast } from "react-toastify";

import { formatDate } from "../../../../common/SharedFunction";
import DateTimeRangePicker from "../../../../components/DateTimeRangePicker";
import ReportModal from "../../../../components/model/ReportsModel";
import { useTheme } from "../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ISourceOfTypesForDashBoard, ITitle } from "../../DashoardController";
import { fetchProductionDashoardApi, IAlljobDashboard } from "./ProductionDashboardController";
// import {
//   fetchAllDashoardApi,
//   fetchQuationCount,
//   fetchSourceOfTypesApiForDashboard,
//   ISourceOfTypesForDashBoard,
//   ITitle,
// } from "./CRMDashboardController";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

interface IPropDashboardView {
  //   isCRMDashBoardOpen: boolean;
  //   closeCRMDashboard: () => void;
  contactData?: any;
  initialAssignedIds?: string;
  onValueChange?: (selectedIds: string) => void;
}

const ProductionDashboardView = ({
  contactData,
  initialAssignedIds,
  onValueChange,
}: IPropDashboardView) => {
  const [totalContact, setTotalContact] = useState(0);
  const [totalInquiry, setTotalInquiry] = useState(0);
  const [todayVisitCount, setTodayVisitCount] = useState(0);
  const [todayCallCount, setTodayCallCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [supportTicketCount, setSupportTicketCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [inquiryList, setInquiryList] = useState<any>();
  const [inquiryMontList, setInquiryMontList] = useState<any>({
    months: [],
    quotation: [],
    salesOrder: [],
    invoice: [],
  });
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [totalApprovedQuotation, setTotalApprovedQuotation] = useState(0);
  const [sourceOfTypesList, setSourceOfTypesLists] = useState<
    ISourceOfTypesForDashBoard[]
  >([]);
  const [selectReportType, setSelectReportType] = useState("");
  const [appliedReportType, setAppliedReportType] = useState("");
  const [reportKey, setReportKey] = useState(0);
  const [isReportShow, setIsReportShow] = useState(false);
  const [reportName, setReportName] = useState("");
  const [quationCount, setQuationCount] = useState<ITitle[]>([]);
  const [teamMemberList, setTeamMemberList] = useState<TeamMember[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<OptionType[]>([]);
  const [localError, setLocalError] = useState("");

  const [productCount, setProductCount] = useState(0);
  const [bomCount, setBomCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [highStockCount, setHighStockCount] = useState(0);
  const [totalClosingStockRateSum, settotalClosingStockRateSum] = useState(0);
  const [allJob, setAllJob] = useState<IAlljobDashboard[]>([]);

  const [selectedYearForRaw, setSelectedYearForRaw] = useState<number>(new Date().getFullYear());
  const [selectedYearForProduction, setSelectedYearForProduction] = useState<number>(new Date().getFullYear());

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
  const canViewOrder = useCheckUserPermission(
    PAGE_ID.SALESORDER_REPORT,
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
  const canViewReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewInward = useCheckUserPermission(
    PAGE_ID.INWARD_REPORT,
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
  const canViewTask = useCheckUserPermission(
    PAGE_ID.ALLTASK_REPORT,
    PERMISSION_TYPE.VIEW,
  );

  const getCurrentMonthDateRange = () => {
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    return [startOfMonth, endOfMonth];
  };

  const [selectedDates, setSelectedDates] = useState<Date[] | null>(
    getCurrentMonthDateRange(),
  );
  const [leaderBoardSelectedDates, setLeaderBoardSelectedDates] = useState<Date[] | null>(
    getCurrentMonthDateRange(),
  );
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [appliedDates, setAppliedDates] = useState<Date[] | null>(null);

  // useEffect(() => {
  //   fetchQuationCount(setQuationCount);
  // }, []);

  const labelsPieChart = sourceOfTypesList?.map((source) => source.source_name);
  const backgroundColorPieChart = sourceOfTypesList?.map(
    (source) => source.color,
  );
  const dataValuesPieChart = sourceOfTypesList?.map((source) => {
    const found = inquiryList?.find(
      (data: { source_type_id: number }) => data?.source_type_id === source.id,
    );
    return found ? found.counts : 0;
  });

  const pieChartData = {
    labels: labelsPieChart,
    datasets: [
      {
        data: dataValuesPieChart,
        backgroundColor: backgroundColorPieChart,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context: any) {
            const dataset = context.dataset.data;
            const currentValue = context.raw;
            const total = dataset.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage = total
              ? ((currentValue / total) * 100).toFixed(2)
              : 0;
            return `${currentValue} (${percentage} %)`;
          },
        },
      },
    },
  };

  const monthLabels = inquiryMontList?.months?.map((m: any) => {
    return new Date(2025, m - 1).toLocaleString("default", { month: "short" });
  });
  const barChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Inward",
        data: [10, 25, 45, 40, 15, 30, 5, 20, 35, 10,
          25, 25],
        backgroundColor: "rgba(75,192,192,0.5)",
        borderRadius: 5,
      },
      {
        label: "Consumption",
        data: [5, 20, 35, 10, 25, 40, 25, 15, 30, 5,
          20, 35],
        backgroundColor: "rgba(153,102,255,0.5)",
        borderRadius: 5,
      },
      {
        label: "Rejection",
        data: [22, 15, 30, 5, 20, 35, 10, 25, 40, 19,
          15, 30],
        backgroundColor: "rgba(255,159,64,0.5)",
        borderRadius: 5,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Monthly Sales by Type" },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: { title: { display: true, text: "Value" }, beginAtZero: true },
    },
  };

  const doublebarChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Finished Production",
        data: [10, 25, 45, 40, 15, 30, 5, 20, 35, 10,
          0, 25],
        backgroundColor: "rgba(66,156,300,0.7)",
        borderRadius: 5,
      },
      {
        label: "Dispatch",
        data: [5, 20, 35, 10, 25, 40, 12, 15, 30, 5,
          20, 35],
        backgroundColor: "rgba(133,120,240,0.7)",
        borderRadius: 5,
      },
    ],
  };

  const doublebarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Monthly Sales by Type" },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: { title: { display: true, text: "Value" }, beginAtZero: true },
    },
  };

  const handelRefreshDashboard = async () => {
    setLoading(true);
    try {
      await fetchProductionDashoardApi(
        selectedDates,
        setProductCount,
        setBomCount,
        setLowStockCount,
        setHighStockCount,
        settotalClosingStockRateSum,
        setJobCount,
        setAllJob,
        leaderBoardSelectedDates
      );
      await fetchChainWiseTeamApi();
    } catch (error: any) {
      toast.error("Failed to refresh dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = () => {
    const input = datePickerRef.current?.querySelector("input");
    input?.focus();
  };

  const handleDashboardIconClick = () => {
    const input = leaderBoardDatePickerRef.current?.querySelector("input");
    input?.focus();
  };

  // useEffect(() => {
  //   fetchSourceOfTypesApiForDashboard(setSourceOfTypesLists);
  // }, []);

  const handelSearchDateChange = (selectedDates: Date[] | undefined) => {
    if (
      selectedDates &&
      selectedDates.length === 2 &&
      selectedDates[0] <= selectedDates[1]
    ) {
      setSelectedDates(selectedDates);
    }
  };

  useEffect(() => {
    if (selectedDates && selectedDates.length === 2) {
      handelRefreshDashboard();
    }
  }, [selectedDates]);

  const handelLeaderBoardSearchDateChange = (leaderBoardSelectedDates: Date[] | undefined) => {
      if (
        leaderBoardSelectedDates &&
        leaderBoardSelectedDates.length === 2 &&
        leaderBoardSelectedDates[0] <= leaderBoardSelectedDates[1]
      ) {
        setLeaderBoardSelectedDates(leaderBoardSelectedDates);
      }
    };
  
    useEffect(() => {
      if (leaderBoardSelectedDates && leaderBoardSelectedDates.length === 2) {
        handelRefreshDashboard();
      }
    }, [leaderBoardSelectedDates]);

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
    setAppliedDates(selectedDates);
    setReportKey((prev) => prev + 1);
  };

  const handleReportTypeChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSelectReportType(e.target.value);
    setAppliedReportType("");
    setAppliedDates(null);
  };

  const openFilterLabel = () => {
    setIsModalFilterVisible(true);
  };

  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      setIsModalFilterVisible(false);
    }
  };

  const datePickerRef = useRef<any>(null);
  const leaderBoardDatePickerRef = useRef<any>(null);

  const handelChangeShowModelReport = (name: string) => {
    if (canViewContact && name === "all_contact_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewInquiry && name === "all_inquiry_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewVisitReport && name === "all_visit_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewCallReport && name === "all_call_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewProductInventory && name === "product_inventory") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewQuotation && name === "quotation") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewOrder && name === "order") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewOrderInvoice && name === "order_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPurchaseInvoice && name === "purchase_invoice") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewPurchaseOrder && name === "purchase_order") {
      setIsReportShow(true);
      setReportName(name);
    } else if (
      canViewReturnPurchaseInvoice &&
      name === "return_purchase_invoice"
    ) {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewReturnSalesInvoice && name === "inward_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewInward && name === "inward") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewDispath && name === "dispatch_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewSupportTicket && name === "support_ticket_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewTask && name === "alltask_report") {
      setIsReportShow(true);
      setReportName(name);
    } else {
      setIsReportShow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      setReportName(name);
    }
  };

  // const getRandom = (min: number, max: number) =>
  //   Math.floor(Math.random() * (max - min + 1)) + min;

  // const leaderboardData = Array.from({ length: 100 }, (_, i) => ({
  //   id: i + 1,
  //   name: `Employee ${i + 1}`,
  //   saleOrderValue: getRandom(50000, 200000),
  //   saleInvoiceValue: getRandom(40000, 180000),
  //   visit: getRandom(5, 25),
  //   calls: getRandom(10, 50),
  // }));

  interface TeamMember {
    id: string | number;
    username: string;
  }

  interface OptionType {
    value: string | number;
    label: string;
  }

  const teamMemberOptions: OptionType[] = teamMemberList
    .filter(
      (member) =>
        member.id && member.username && typeof member.username === "string",
    ) // Ensure valid id and username
    .map((member) => ({
      value: member.id,
      label: member.username,
    }));

  const fetchChainWiseTeamApi = async () => {
    setTeamLoading(true);
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };

    try {
      const { data } = await axiosInstance.post(
        "my-team-chain-wise",
        requestData,
        {
          headers: { Authorization: `${token}` },
        },
      );

      if (data.ack !== 1) {
        setTeamMemberList([]);
        toast.error("No team members found.");
        return;
      }

      // Filter out invalid team members
      const validTeamMembers = (data.data.item || []).filter(
        (member: TeamMember) =>
          member.id && member.username && typeof member.username === "string",
      );
      setTeamMemberList(validTeamMembers);
      setLocalError("");
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      toast.error(error?.message || "Failed to load team members");
      setTeamMemberList([]);
      setLocalError("Failed to load team members");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleChangeTeam = async (selected: MultiValue<OptionType>) => {
    const selectedArray = selected as OptionType[];
    const data = selectedArray.map((item) => item.value);
    setSelectedUsers(selectedArray);
    setLoading(true);
    try {
      // await fetchAllDashoardApi(
      //   selectedDates,
      //   setQuotation,
      //   setOrder,
      //   setInvoice,
      //   setPurchaseCount,
      //   setPurchaseOrderCount,
      //   setWorkOrderCount,
      //   setTotalReminder,
      //   setTotalInquiry,
      //   setInquiryList,
      //   setInquiryMontList,
      //   setTotalContact,
      //   setTodayVisitCount,
      //   setTodayCallCount,
      //   setOutOfStockCount,
      //   setTotalApprovedQuotation,
      //   setTotalApprovedOrder,
      //   setTotalApprovedInvoice,
      //   setPurchaseApprovedCount,
      //   setPurchaseOrderApprovedCount,
      //   setWorkOrderApprovedCount,
      //   setTotalReturnSalesInvoice,
      //   setReturnSalesInvoiceApprovedCount,
      //   setTotalReturnPurchaseInvoice,
      //   setReturnPurchaseInvoiceApprovedCount,
      //   setTotalInward,
      //   setInwardCount,
      //   setTotalDispath,
      //   setDispathCount,
      //   setSupportTicketCount,
      //   setTaskCount,
      //   data, // Pass as setTeamMemberList
      // );
    } catch (error: any) {
      toast.error("Failed to update dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
    const selectedIds = selectedArray.map((item) => item.value).join(",");
    if (onValueChange) onValueChange(selectedIds);
  };

  useEffect(() => {
    if (initialAssignedIds && teamMemberOptions.length > 0) {
      const ids = String(initialAssignedIds)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
      const initialSelected = teamMemberOptions.filter((opt) =>
        ids.includes(String(opt.value)),
      );
      setSelectedUsers(initialSelected);
    } else {
      setSelectedUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchChainWiseTeamApi();
  }, []);

  const getYears = (start = 2020) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= start; i--) {
      years.push(i);
    }
    return years;
  };

  const yearOptions = getYears(2020);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);


  return (
    <>
      <div
        style={{
          flex: "60%",
          display: "flex",
          overflow: "scroll",
          backgroundColor: "#f0f2f5",
        }}
        id="right"
      >
        <div>
          <div
            style={{
              width: "100%",
              height: "auto",
              // backgroundColor: "rgb(240 242 245)",
            }}
          >
            <Container fluid className="mt-2">
              {/* <div className="d-flex justify-content-between align-items-center pb-2"> */}
              {/* <h2 className="modal-title1 form_header_text mb-0">
                    My Insights
                  </h2> */}
              {/* <div className="ICON">
                  <button className="icons" onClick={handelRefreshDashboard}>
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
                  </button> */}
              {/* <button className="icons" onClick={closeCRMDashboard}>
                      <span>
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
                    </button> */}
              {/* </div>
              </div> */}
              {loading ? (
                <>
                  <Row style={{ marginTop: "40px" }}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Col md={3} key={index}>
                        <Skeleton
                          width="100%"
                          height={100}
                          duration={1}
                          style={{ opacity: darkMode ? "" : 0.5 }}
                        />
                      </Col>
                    ))}
                  </Row>
                  <Row className="mb-2" style={{ marginTop: "30px" }}>
                    <Col md={6}>
                      <Skeleton
                        width="100%"
                        height={220}
                        duration={1}
                        style={{ opacity: darkMode ? "" : 0.5 }}
                      />
                    </Col>
                    <Col md={6}>
                      <Skeleton
                        width="100%"
                        height={220}
                        duration={1}
                        style={{ opacity: darkMode ? "" : 0.5 }}
                      />
                    </Col>
                  </Row>
                  <Row style={{ marginTop: "40px" }}>
                    <Col>
                      <Skeleton
                        width="100%"
                        height={120}
                        duration={1}
                        style={{ opacity: darkMode ? "" : 0.5 }}
                      />
                    </Col>
                  </Row>
                </>
              ) : (
                <>
                  <Row className="w-100 gx-3 mb-4 align-items-stretch" style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginLeft: 0,
                    justifyContent: "space-between",
                  }}>
                    <Col md={6} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex" }}>
                          <div
                            style={{ flex: 1, maxWidth: "300px", marginBottom: "10px" }}
                            ref={datePickerRef}
                          >
                            <label className="fw-bold mb-1">Date Range</label><br />
                            <DateTimeRangePicker
                              value={selectedDates || getCurrentMonthDateRange()}
                              onChange={handelSearchDateChange}
                              showTime={false}
                              numberOfMonthsShow={1}
                            />
                            <span
                              className="ms-2"
                              onClick={handleIconClick}
                              style={{
                                cursor: "pointer",
                                position: "relative",
                                right: "5px",
                                // top: "5%",
                                transform: "translateY(-50%)",
                              }}
                            >
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
                        </div>

                        <Row className="g-4 h-100" style={{ flex: 1 }}>
                          {[
                            {
                              count: productCount,
                              title: "No. of Product",
                              // onClick: () => {
                              //   handelChangeShowModelReport("all_contact_report");
                              // },
                              svg: (
                                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                  <path d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z" />
                                </svg>
                              ),
                            },
                            {
                              count: lowStockCount,
                              title: "Low stock Product",
                              // onClick: () => {
                              //   handelChangeShowModelReport("all_inquiry_report");
                              // },
                              svg: (
                                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                  <path d="M640-240v-80h104L536-526 376-366 80-664l56-56 240 240 160-160 264 264v-104h80v240H640Z" />
                                </svg>
                              ),
                            },
                            {
                              count: highStockCount,
                              title: "High stock Product",
                              svg: (
                                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                  <path d="m136-240-56-56 296-298 160 160 208-206H640v-80h240v240h-80v-104L536-320 376-480 136-240Z" />
                                </svg>
                              ),
                            },

                            {
                              count: bomCount,
                              title: "No. of BOM",
                              // onClick: () => {
                              //   handelChangeShowModelReport("all_visit_report");
                              // },
                              svg: (
                                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                  <path d="M120-80v-800l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v800l-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h480v-80H240v80Zm0-160h480v-80H240v80Zm0-160h480v-80H240v80Zm-40 404h560v-568H200v568Zm0-568v568-568Z" />
                                </svg>
                              ),
                            },
                            {
                              count: jobCount,
                              title: "No. of Job Card",
                              // onClick: () => {
                              //   handelChangeShowModelReport("all_call_report");
                              // },
                              svg: (
                                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm221.5-198.5Q510-807 510-820t-8.5-21.5Q493-850 480-850t-21.5 8.5Q450-833 450-820t8.5 21.5Q467-790 480-790t21.5-8.5ZM200-200v-560 560Z" />
                                </svg>
                              ),
                            },
                            {
                              count: totalClosingStockRateSum,
                              approvedCount: totalApprovedQuotation,
                              title: "Current Stock Value",
                              svg: (
                                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                  <path d="M620-163 450-333l56-56 114 114 226-226 56 56-282 282Zm220-397h-80v-200h-80v120H280v-120h-80v560h240v80H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v200ZM508.5-771.5Q520-783 520-800t-11.5-28.5Q497-840 480-840t-28.5 11.5Q440-817 440-800t11.5 28.5Q463-760 480-760t28.5-11.5Z" />
                                </svg>
                              ),
                              // onClick: () => {
                              //   handelChangeShowModelReport("quotation");
                              // },
                            },
                          ].map((item, idx) => (
                            <Col md={4} key={idx}>
                              <Card
                                className="text-end h-100"
                                style={{ borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)", cursor: "pointer" }}
                                // onClick={item.onClick}
                              >
                                <Card.Body className="d-flex flex-column justify-content-between align-items-end text-end">
                                  <div>
                                    <div className="d-flex text-end justify-content-end align-items-center gap-1">
                                      <small className="text-muted fw-bold">
                                        Total:
                                      </small>
                                      <h4 className="dash-board-text-count" style={{ fontSize: "20px" }}>
                                        {item.count}
                                      </h4>
                                    </div>
                                    <span>{item.svg}</span>
                                  </div>
                                  <h4
                                    className="dash-board-text"
                                    style={{ maxWidth: "100%" }}
                                  >
                                    {item.title}
                                  </h4>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Col>
                    <Col md={6} className="d-flex"
                      style={{ height: "500px" }}
                    >
                      <Card
                        className="w-100"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                        }}
                      >
                        <Card.Body
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            minHeight: 0
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              marginBottom: "10px",
                            }}
                          >
                            {/* LEFT: Title */}
                            <h6 className="fw-bold mb-0">
                              Pending Job Card
                            </h6>

                            {/* RIGHT: Date Range + Icon */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                ref={leaderBoardDatePickerRef}
                              >
                                <label className="fw-bold mb-1"
                                  style={{ fontSize: "14px", marginRight: "5px" }}>Date Range:</label>
                                <DateTimeRangePicker
                                  value={leaderBoardSelectedDates || getCurrentMonthDateRange()}
                                  onChange={handelLeaderBoardSearchDateChange}
                                  showTime={false}
                                  numberOfMonthsShow={1}
                                />
                              </div>

                              {/* Calendar Icon */}
                              <span
                                onClick={handleDashboardIconClick}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="22px"
                                  viewBox="0 -960 960 960"
                                  width="22px"
                                  fill="#5f6368"
                                >
                                  <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Z" />
                                </svg>
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              flex: 1,
                              overflowY: "auto",
                              maxHeight: "600px"
                            }}
                          >
                            <table className="table table-bordered mb-0"
                              style={{ fontSize: "14px" }}>
                              <thead
                                style={{
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 2,
                                  background: "#fff",
                                }}
                              >
                                <tr>
                                  <th>Sr No.</th>
                                  <th>Job no.</th>
                                  <th>Job Start Date</th>
                                  <th>Job End Date</th>
                                  <th>Job Status</th>
                                  <th>Created By</th>
                                </tr>
                              </thead>

                              <tbody>
                                {allJob.map((row) => (
                                  <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.id}</td>
                                    <td>{formatDate(row.created_date_time)}</td>
                                    <td>{"-"}</td>
                                    <td>{"-"}</td>
                                    <td>{row.username}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Row className="mb-2 g-3 justify-content-center">
                    <Col md={6}>
                      <Card
                        className="text-center"
                        style={{ height: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)" }}
                      >
                        <Card.Body>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "nowrap",
                              marginBottom: "10px",
                            }}
                          >
                            {/* LEFT: Title */}
                            <h6 className="fw-bold mb-0">
                              Raw Material
                            </h6>

                            {/* RIGHT: Date Range + Icon */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <label className="fw-bold mb-1"
                                  style={{ fontSize: "14px" }}>Year:</label>
                                <select
                                  className="form-select w-auto"
                                  value={selectedYearForRaw}
                                  onChange={(e) => setSelectedYearForRaw(Number(e.target.value))}
                                >
                                  {years.map((year) => (
                                    <option key={year} value={year}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </div>

                            </div>
                          </div>
                          <div style={{ height: "300px" }}>
                            <Bar
                              data={barChartData}
                              options={barChartOptions}
                            />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card
                        className="text-center"
                        style={{ height: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)" }}
                      >
                        <Card.Body>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              marginBottom: "10px",
                            }}
                          >
                            {/* LEFT: Title */}
                            <h6 className=" fw-bold mb-0">
                              Finished Production VS Dispatch
                            </h6>

                            {/* RIGHT: Date Range + Icon */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}>
                                <label className="fw-bold mb-1"
                                  style={{ fontSize: "14px" }}>Year:</label>
                                <select
                                  className="form-select w-auto"
                                  value={selectedYearForProduction}
                                  onChange={(e) => setSelectedYearForProduction(Number(e.target.value))}
                                >
                                  {years.map((year) => (
                                    <option key={year} value={year}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div style={{ height: "300px" }}>
                            <Bar
                              data={doublebarChartData}
                              options={doublebarChartOptions}
                            />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </>
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
                  date={selectedDates}
                />
              )}
            </Container>
          </div>
        </div>
      </div>

    </>
  );
};

export default ProductionDashboardView;
