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
import { useEffect, useRef, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import "react-loading-skeleton/dist/skeleton.css";
import { MultiValue } from "react-select";
import { toast } from "react-toastify";

import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import DatePicker from "react-multi-date-picker";
import DateTimeRangePicker from "../../../../components/DateTimeRangePicker";
import ReportModal from "../../../../components/model/ReportsModel";
import { useTheme } from "../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, GOOGLE_MAP_KEY } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { TReactSetState } from "../../../../helpers/AppType";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ISourceOfTypesForDashBoard } from "../../DashoardController";
import { fetchHRMSDashoardApi, fetchHRMSLeaderBoardApi, fetchHRMSMapDataApi } from "./HRMDashboardController";

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
  setActiveView: TReactSetState<string>;
  setAppliedReportType: TReactSetState<string>;
  contactData?: any;
  initialAssignedIds?: string;
  onValueChange?: (selectedIds: string) => void;
}

const sortValues = [
  { label: "Present Days", value: "presentDays" },
  { label: "Absent Days", value: "absentDays" },
  { label: "Leave Days", value: "leaveDays" },
] as const;

type SortKey = typeof sortValues[number]["value"];

interface Employee {
  username: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
};

interface TEmployeeAttendance {
  presentEmployee: number;
  absentEmployee: number;
  salary: number;
};

interface TMonthlyBarChart {
  month: string;
  salary: number;
};

interface ITeamLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const HRMDashboardView = ({
  setActiveView,
  setAppliedReportType,
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
  const [sourceOfTypesList, setSourceOfTypesLists] = useState<
    ISourceOfTypesForDashBoard[]
  >([]);
  const [selectReportType, setSelectReportType] = useState("");
  // const [appliedReportType, setAppliedReportType] = useState("");
  const [reportKey, setReportKey] = useState(0);
  const [isReportShow, setIsReportShow] = useState(false);
  const [reportName, setReportName] = useState("");
  const [teamMemberList, setTeamMemberList] = useState<TeamMember[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<OptionType[]>([]);
  const [localError, setLocalError] = useState("");
  const [totalDispath, setTotalDispath] = useState(0);

  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [presentEmployeeCount, setPresentEmployeeCount] = useState(0);
  const [absentEmployeeCount, setAbsentEmployeeCount] = useState(0);
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [salary, setSalary] = useState(0);
  const [expense, setExpense] = useState(0);
  const [totalVisitCount, setTotalVisitCount] = useState(0);
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<SortKey>("presentDays");

  const [employeeAttendance, setEmployeeAttendance] =
    useState<TEmployeeAttendance>({
      presentEmployee: 0,
      absentEmployee: 0,
      salary: 0,
    });
  const [monthlyBarChart, setMonthlyBarChart] = useState<TMonthlyBarChart[]>([]);
  const [employeeLocationData, setEmployeeLocationData] = useState<any[]>([]);
  const [searchDate, setSearchDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMarker, setSelectedMarker] = useState<ITeamLocation | null>(null);

  const canViewMyTeamList = useCheckUserPermission(
    PAGE_ID.TEAM_MEMBER_WITH_ACCESS_RIGHT,
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
  const canViewAttedance = useCheckUserPermission(
    PAGE_ID.ATTEDANCESALARY_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewTeamExpense = useCheckUserPermission(
    PAGE_ID.TEAMEXPENSE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewVisit = useCheckUserPermission(
    PAGE_ID.ALLVISIT_REPORT,
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

  const getTodayDateRange = () => {
    const now = new Date();

    return [now, now];
  };

  const [selectedDates, setSelectedDates] = useState<Date[] | null>(
    getTodayDateRange(),
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

  const labels = monthlyBarChart.map((item) => item.month);
  const salaryData = monthlyBarChart.map((item) => item.salary);
  const barChartData = {
    labels,
    datasets: [
      {
        label: "Salary (₹)",
        data: salaryData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderRadius: 5,
      }
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      x: {
        title: { display: true, text: "Months" },
      },
      y: {
        title: { display: true, text: "Salary (₹)" },
        beginAtZero: true,
      },
    },
  };

  const handelRefreshDashboard = async () => {
    setLoading(true);
    try {
      await fetchHRMSDashoardApi(
        selectedDates,
        selectedYear,
        setTeamMemberCount,
        setOnLeaveCount,
        setExpense,
        setTotalVisitCount,
        setMonthlyBarChart,
        setEmployeeAttendance,
      );
      await fetchChainWiseTeamApi();
    } catch (error: any) {
      toast.error("Failed to refresh dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handelRefreshLeaderbord = async () => {
    setLoading(true);
    try {
      await fetchHRMSLeaderBoardApi(
        leaderBoardSelectedDates,
        setEmployeeData,
      );
      await fetchChainWiseTeamApi();
    } catch (error: any) {
      toast.error("Failed to refresh Leaderbord: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handelRefreshMap = async () => {
    setLoading(true);
    try {
      await fetchHRMSMapDataApi(
        searchDate,
        setEmployeeLocationData,
      );
    } catch (error: any) {
      toast.error("Failed to refresh Map: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = () => {
    const input = datePickerRef.current?.querySelector("input");
    input?.focus();
  };
  const handleLeaderboardIconClick = () => {
    const input = leaderBoardDatePickerRef.current?.querySelector("input");
    input?.focus();
  };
  const handleMapIconClick = () => {
    const input = mapDatePickerRef.current?.querySelector("input");
    input?.focus();
  };

  useEffect(() => {
    // fetchSourceOfTypesApiForDashboard(setSourceOfTypesLists);
  }, []);

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
    if (
      (selectedDates && selectedDates.length === 2) ||
      selectedYear) {
      handelRefreshDashboard();
    }
  }, [selectedDates, selectedYear]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

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
      handelRefreshLeaderbord();
    }
  }, [leaderBoardSelectedDates]);

  const handleDateChange = (date: string | null) => {
    if (!date) return;

    setSearchDate(date);
  };

  useEffect(() => {
    if (searchDate) {
      handelRefreshMap();
    }
  }, [searchDate]);

  // const openReport = () => {
  //   if (!selectReportType || selectReportType === "select") {
  //     toast.error("Please select a valid report type.");
  //     return;
  //   }

  //   if (!selectedDates || selectedDates.length !== 2) {
  //     toast.error("Please select a valid date range.");
  //     return;
  //   }

  //   setAppliedReportType(selectReportType);
  //   setAppliedDates(selectedDates);
  //   setReportKey((prev) => prev + 1);
  // };

  // const handleReportTypeChange = (e: {
  //   target: { value: React.SetStateAction<string> };
  // }) => {
  //   setSelectReportType(e.target.value);
  //   setAppliedReportType("");
  //   setAppliedDates(null);
  // };

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
  const mapDatePickerRef = useRef<any>(null);

  const handelChangeShowModelReport = (name: string) => {
    if (canViewMyTeamList && name === "My_Team_Report") {
      setActiveView("HRMS");
      setAppliedReportType(name);
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
    } else if (canViewAttedance && name === "attendance_salary") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewTeamExpense && name === "team_day_wise_expanse_report") {
      setIsReportShow(true);
      setReportName(name);
    } else if (canViewVisit && name === "all_visit_report") {
      setIsReportShow(true);
      setReportName(name);
    } else {
      setIsReportShow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      setReportName(name);
    }
  };

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


  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAP_KEY,
  });

  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  const locations: ITeamLocation[] = employeeLocationData
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({
      id: item.userId.toString(),
      name: item.username,
      lat: parseFloat(item.latitude),
      lng: parseFloat(item.longitude),
      address: item.address
    }));

  const center = {
    lat: 22.3039,
    lng: 70.8022,
  };

  const handleMarkerClick = (location: ITeamLocation) => {
    setSelectedMarker(location);
  };

  // Handle InfoWindow close
  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  if (loadError) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "90%" }}
      >
        <h2 className="text-danger">
          Failed to load Google Maps: {loadError.message}
        </h2>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80%" }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const sortedData = [...employeeData].sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });

  const getMedalIcon = (index: number) => {
    const colors = ["#EABE0E", "#C0C0C0", "#CD7F32"]; // gold, silver, bronze

    if (index < 3) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill={colors[index]}
        >
          <path d="m387-412 35-114-92-74h114l36-112 36 112h114l-93 74 35 114-92-71-93 71ZM240-40v-309q-38-42-59-96t-21-115q0-134 93-227t227-93q134 0 227 93t93 227q0 61-21 115t-59 96v309l-240-80-240 80Zm410-350q70-70 70-170t-70-170q-70-70-170-70t-170 70q-70 70-70 170t70 170q70 70 170 70t170-70ZM320-159l160-41 160 41v-124q-35 20-75.5 31.5T480-240q-44 0-84.5-11.5T320-283v124Zm160-62Z" />
        </svg>
      );
    }

    return null;
  };



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
              {/* <div
                className="d-flex align-items-center gap-2"
                style={{
                  fontSize: "14px",
                  paddingBottom: "10px",
                }}
              >
                <div className="d-flex align-items-center gap-2 ms-auto">
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
                  </button>
                </div>
              </div> */}

              <>
                <Row className="w-100 gx-3 mb-4 align-items-stretch" style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginLeft: 0,
                  justifyContent: "space-between",
                }}>
                  <Col md={6} style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "15px",
                        flexWrap: "wrap",
                        marginBottom: "10px",
                      }}>
                        <div
                          style={{ maxWidth: "300px", marginBottom: "10px" }}
                          ref={datePickerRef}
                        >
                          <label className="fw-bold mb-1">Date Range</label><br />
                          <DateTimeRangePicker
                            value={selectedDates || getTodayDateRange()}
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
                        {/* <div style={{ maxWidth: "300px", marginBottom: "10px" }}>
                          <label className="fw-bold mb-1">Team Members</label>
                          {teamLoading ? (
                            <Skeleton width="100%" height={42} />
                          ) : (
                            <MultiSelect
                              options={teamMemberOptions}
                              value={selectedUsers}
                              onChange={handleChangeTeam}
                              isSelectAll={true}
                              menuPlacement="bottom"
                              menuStyle={{
                                left: "90%",
                                right: "auto",
                                transform: "none",
                                height: "42px",
                              }}
                              isMulti
                              isClearable={selectedUsers.length > 0} // Show clear button only when values are selected
                              placeholder="Select team persons..."
                            />
                          )}
                        </div> */}
                      </div>
                      <Row className="g-4 h-100" style={{ flex: 1 }}>
                        {[
                          {
                            count: teamMemberCount,
                            title: "Total Employee",
                            onClick: () => {
                              handelChangeShowModelReport("My_Team_Report");
                            },
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368"><path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM247-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113q0 66-47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-240Zm0-400Z" /></svg>
                            ),
                          },
                          {
                            count: employeeAttendance.presentEmployee,
                            title: "Present Employee",
                            onClick: () => {
                              handelChangeShowModelReport("attendance_salary");
                            },
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368"><path d="M702-480 560-622l57-56 85 85 170-170 56 57-226 226Zm-455-47q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-300Zm0-340Z" /></svg>
                            ),
                          },
                          {
                            count: employeeAttendance.absentEmployee,
                            title: "Absent Employee",
                            onClick: () => {
                              handelChangeShowModelReport("attendance_salary");
                            },
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368"><path d="m696-440-56-56 83-84-83-83 56-57 84 84 83-84 57 57-84 83 84 84-57 56-83-83-84 83Zm-449-87q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-640Zm0 400Z" /></svg>
                            ),
                          },

                          {
                            count: onLeaveCount,
                            title: "On leave",
                            onClick: () => {
                              handelChangeShowModelReport("attendance_salary");
                            },
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                <path d="M791-55 686-160H160v-112q0-34 17.5-62.5T224-378q45-23 91.5-37t94.5-21L55-791l57-57 736 736-57 57ZM240-240h366L486-360h-6q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm496-138q29 14 46 42.5t18 61.5L666-408q18 7 35.5 14t34.5 16ZM568-506l-59-59q23-9 37-29.5t14-45.5q0-33-23.5-56.5T480-720q-25 0-45.5 14T405-669l-59-59q23-34 58-53t76-19q66 0 113 47t47 113q0 41-19 76t-53 58Zm38 266H240h366ZM457-617Z" />
                              </svg>
                            ),
                          },
                          {
                            count: employeeAttendance.salary,
                            title: "salary",
                            onClick: () => {
                              handelChangeShowModelReport("attendance_salary");
                            },
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                <path d="M560-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM280-320q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80h400q0-33 23.5-56.5T840-480v-160q-33 0-56.5-23.5T760-720H360q0 33-23.5 56.5T280-640v160q33 0 56.5 23.5T360-400Zm440 240H120q-33 0-56.5-23.5T40-240v-440h80v440h680v80ZM280-400v-320 320Z" />
                              </svg>
                            ),
                          },
                          // {
                          //   count: outOfStockCount,
                          //   title: "Out of Stock Products",
                          //   onClick: () => {
                          //     handelChangeShowModelReport("product_inventory");
                          //   },
                          //   svg: (
                          //     <svg
                          //       xmlns="http://www.w3.org/2000/svg"
                          //       height="30"
                          //       viewBox="0 -960 960 960"
                          //       width="30"
                          //       fill="#5f6368"
                          //     >
                          //       <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                          //     </svg>
                          //   ),
                          // },
                          {
                            count: expense,
                            title: "Expense",
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                <path d="M200-200v-560 560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v100h-80v-100H200v560h560v-100h80v100q0 33-23.5 56.5T760-120H200Zm320-160q-33 0-56.5-23.5T440-360v-240q0-33 23.5-56.5T520-680h280q33 0 56.5 23.5T880-600v240q0 33-23.5 56.5T800-280H520Zm280-80v-240H520v240h280Zm-117.5-77.5Q700-455 700-480t-17.5-42.5Q665-540 640-540t-42.5 17.5Q580-505 580-480t17.5 42.5Q615-420 640-420t42.5-17.5Z" />
                              </svg>
                            ),
                            onClick: () => {
                              handelChangeShowModelReport("team_day_wise_expanse_report");
                            },
                          },


                          {
                            count: totalVisitCount,
                            title: "visit",
                            svg: (
                              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                                <path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                              </svg>
                            ),
                            onClick: () => {
                              handelChangeShowModelReport("all_visit_report");
                            },
                          },
                          // {
                          //   count: totalDispath,
                          //   title: "Birthdays",
                          //   svg: (
                          //     <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#5f6368">
                          //       <path d="M160-80q-17 0-28.5-11.5T120-120v-200q0-33 23.5-56.5T200-400v-160q0-33 23.5-56.5T280-640h160v-58q-18-12-29-29t-11-41q0-15 6-29.5t18-26.5l56-56 56 56q12 12 18 26.5t6 29.5q0 24-11 41t-29 29v58h160q33 0 56.5 23.5T760-560v160q33 0 56.5 23.5T840-320v200q0 17-11.5 28.5T800-80H160Zm120-320h400v-160H280v160Zm-80 240h560v-160H200v160Zm80-240h400-400Zm-80 240h560-560Zm560-240H200h560Z" />
                          //     </svg>
                          //   ),
                          //   onClick: () => {
                          //     handelChangeShowModelReport("dispatch_report");
                          //   },
                          // },
                        ].map((item, idx) => (
                          <Col md={4} key={idx}>
                            <Card
                              className="text-end h-100"
                              style={{ borderRadius: 0, cursor: "pointer", minHeight: "160px" }}
                              onClick={item.onClick}
                            >
                              <Card.Body className="d-flex flex-column justify-content-between align-items-end text-end">
                                <div>
                                  <div className="d-flex text-end justify-content-end align-items-center gap-1">
                                    <small className="text-muted fw-bold">
                                      Total:
                                    </small>
                                    <h4 className="dash-board-text-count">
                                      {item.count}
                                    </h4>
                                  </div>
                                  {/* <small className="text-muted">
                                    Appr. {item.approvedCount ?? 0.0}
                                  </small>
                                  <br /> */}
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
                  <Col md={6} className="d-flex">
                    <Card
                      className="w-100 h-100"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Card.Body
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "10px"
                          }}
                        >
                          {/* LEFT: Heading */}
                          <h6 className="fw-bold mb-0">
                            Employee LeaderBoard
                          </h6>

                          {/* RIGHT: Controls */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginBottom: "10px"
                            }}
                          >
                            {/* Sort By */}
                            <label className="fw-bold mb-0" style={{ fontSize: "14px" }}>
                              Sort By:
                            </label>
                            <select
                              className="form-select w-auto"
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as SortKey)}
                            >
                              {sortValues.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            {/* Date Range */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                                marginBottom: "10px"
                              }}
                              ref={leaderBoardDatePickerRef}>
                              <label className="fw-bold mb-0" style={{ fontSize: "14px" }}>Date Range:</label>
                              <DateTimeRangePicker
                                value={leaderBoardSelectedDates || getCurrentMonthDateRange()}
                                onChange={handelLeaderBoardSearchDateChange}
                                showTime={false}
                                numberOfMonthsShow={1}
                              />
                              <span
                                className="ms-2"
                                onClick={handleLeaderboardIconClick}
                                style={{
                                  cursor: "pointer",
                                  position: "relative",
                                  right: "5px",
                                  bottom: "2px"
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
                        </div>

                        <div
                          style={{
                            // flex: 1,
                            overflowY: "auto",
                            maxHeight: "600px"
                          }}
                        >

                          <table className="table table-bordered mb-0"
                            style={{ fontSize: "14px" }}
                          >
                            <thead
                              style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                background: "#fff",
                              }}
                            >
                              <tr>
                                <th>Sr.no</th>
                                <th>Employee Name</th>
                                <th>Present Days</th>
                                <th>Absent days</th>
                                <th>Leave days</th>
                              </tr>
                            </thead>

                            <tbody>
                              {sortedData.map((emp, index) => (
                                <tr key={index}>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                      {index + 1}
                                      {getMedalIcon(index)}
                                    </div>
                                  </td>
                                  <td>{emp.username}</td>
                                  <td>{emp.presentDays}</td>
                                  <td>{emp.absentDays}</td>
                                  <td>{emp.leaveDays}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <Row className="mb-2 g-3 justify-content-start">
                  <Col md={6}>
                    <Card
                      className="text-center"
                      style={{ height: "100%", borderRadius: "0px" }}
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
                            Yearly salary growth
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
                                justifyContent: "flex-end",
                                gap: "6px",
                              }}
                            >
                              <label className="fw-bold mb-1"
                                style={{ fontSize: "14px" }}>Year:</label>
                              <select
                                className="form-select w-auto"
                                value={selectedYear}
                                onChange={(e) => {
                                  const year = Number(e.target.value);
                                  handleYearChange(year);
                                }}
                              >
                                {
                                  years.map((year) => (
                                    <option key={year} value={year}>
                                      {year}
                                    </option>
                                  ))
                                }
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
                      style={{ height: "100%", borderRadius: "0px" }}
                    >
                      <Card.Body>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "nowrap",
                            marginBottom: "10px",
                          }}
                        >
                          <h6 className="fw-bold mb-0">
                            Employee Live Location
                          </h6>
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
                                justifyContent: "flex-end",
                                gap: "6px",
                              }}
                              ref={mapDatePickerRef}
                            >
                              <label className="fw-bold mb-1">Date:</label>
                              <DatePicker
                                value={searchDate}
                                onChange={(date) => {
                                  const formattedDate = date
                                    ? date.format("YYYY-MM-DD")
                                    : null;

                                  handleDateChange(formattedDate);
                                }}
                                format="YYYY-MM-DD"
                                calendarPosition="bottom-right"
                                className="form-control"
                                placeholder="YYYY-MM-DD"
                                style={{ height: "38px", width: "130px" }}
                              />
                              <span
                                className="ms-2"
                                onClick={handleMapIconClick}
                                style={{
                                  cursor: "pointer",
                                  position: "relative",
                                  right: "5px",
                                  bottom: "2px"
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
                        </div>
                        <div style={{ height: "300px" }}>

                          <GoogleMap
                            mapContainerStyle={containerStyle}
                            zoom={12}
                            center={center}
                            options={{
                              draggable: true,
                              zoomControl: true,
                              scrollwheel: true,
                              disableDoubleClickZoom: false,
                            }}
                          >
                            {locations.map((location) => (
                              <Marker
                                key={location.id}
                                position={{ lat: location.lat, lng: location.lng }}
                                title={location.name}
                                onClick={() => handleMarkerClick(location)}
                              />
                            ))}
                            {selectedMarker && (
                              <InfoWindow
                                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                                onCloseClick={handleInfoWindowClose}
                              >
                                <div style={{ padding: "8px", maxWidth: "250px" }}>
                                  <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>{selectedMarker.name}</h3>
                                  <p style={{ margin: "4px 0", fontSize: "12px" }}>
                                    <strong>Address:</strong> {selectedMarker.address || "N/A"}
                                  </p>
                                  <p style={{ margin: "4px 0", fontSize: "12px" }}>
                                    <strong>Location:</strong> {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                                  </p>
                                </div>
                              </InfoWindow>
                            )}
                          </GoogleMap>

                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>

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
      </div >

    </>
  );
};

export default HRMDashboardView;
