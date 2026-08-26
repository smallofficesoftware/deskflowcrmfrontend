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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { Bar, Doughnut } from "react-chartjs-2";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MultiValue } from "react-select";
import { toast } from "react-toastify";

import DateTimeRangePicker from "../../../../components/DateTimeRangePicker";
import ReportModal from "../../../../components/model/ReportsModel";
import MultiSelect, { Option } from "../../../../components/MultiSelect";
import { useTheme } from "../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ICompanyTeam } from "../../../left-side/LeftSideController";
import {
  fetchAllDashoardApi,
  fetchQuationCount,
  fetchSourceOfTypesApiForDashboard,
  ISourceOfTypesForDashBoard,
  ITitle,
  TeamInsightType,
} from "./CRMDashboardController";

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

const CRMDashboardView = ({
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
  const [totalReminder, setTotalReminder] = useState(0);
  const [quotation, setQuotation] = useState<number>(0);
  const [order, setOrder] = useState(0);
  const [invoice, setInvoice] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [purchaseOrderCount, setPurchaseOrderCount] = useState(0);
  const [workOrderCount, setWorkOrderCount] = useState(0);
  const [totalApprovedQuotation, setTotalApprovedQuotation] = useState(0);
  const [totalApprovedOrder, setTotalApprovedOrder] = useState(0);
  const [totalApprovedInvoice, setTotalApprovedInvoice] = useState(0);
  const [purchaseApprovedCount, setPurchaseApprovedCount] = useState(0);
  const [purchaseOrderApprovedCount, setPurchaseOrderApprovedCount] =
    useState(0);
  const [workOrderApprovedCount, setWorkOrderApprovedCount] = useState(0);
  const [sourceOfTypesList, setSourceOfTypesLists] = useState<
    ISourceOfTypesForDashBoard[]
  >([]);
  const [selectReportType, setSelectReportType] = useState("");
  const [appliedReportType, setAppliedReportType] = useState("");
  const [reportKey, setReportKey] = useState(0);
  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [optionSelected, setOptionSelected] = useState<Option[] | null>(null);
  const [isReportShow, setIsReportShow] = useState(false);
  const [reportName, setReportName] = useState("");
  const [quationCount, setQuationCount] = useState<ITitle[]>([]);
  const [teamMemberList, setTeamMemberList] = useState<TeamMember[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<OptionType[]>([]);
  const [localError, setLocalError] = useState("");

  const selectedTeamMemberValues = useMemo(
    () => selectedUsers.map((user) => user.value),
    [selectedUsers],
  );

  const [totalReturnSalesInvoice, setTotalReturnSalesInvoice] = useState(0);
  const [returnSalesInvoiceApprovedCount, setReturnSalesInvoiceApprovedCount] =
    useState(0);
  const [totalInward, setTotalInward] = useState(0);
  const [inwardCount, setInwardCount] = useState(0);
  const [totalDispath, setTotalDispath] = useState(0);
  const [dispathCount, setDispathCount] = useState(0);
  const [totalReturnPurchaseInvoice, setTotalReturnPurchaseInvoice] =
    useState(0);
  const [
    returnPurchaseInvoiceApprovedCount,
    setReturnPurchaseInvoiceApprovedCount,
  ] = useState(0);

  const [teamInsight, setTeamInsight] = useState<TeamInsightType[]>([]);

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
  const canViewReturnSales = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAllReminderReport = useCheckUserPermission(
    PAGE_ID.REMINDER_REPORT,
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
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [appliedDates, setAppliedDates] = useState<Date[] | null>(null);

  useEffect(() => {
    fetchQuationCount(setQuationCount);
  }, []);

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
    labels: monthLabels,
    datasets: [
      {
        label: "Quotation",
        data: inquiryMontList?.quotation,
        backgroundColor: "rgba(75,192,192,0.5)",
      },
      {
        label: "Sales Order",
        data: inquiryMontList?.salesOrder,
        backgroundColor: "rgba(153,102,255,0.5)",
      },
      {
        label: "Invoice",
        data: inquiryMontList?.invoice,
        backgroundColor: "rgba(255,159,64,0.5)",
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
      x: { title: { display: true, text: "Month" } },
      y: { title: { display: true, text: "Count" }, beginAtZero: true },
    },
  };

  const handelRefreshDashboard = async () => {
    setLoading(true);
    try {
      await fetchAllDashoardApi(
        selectedDates,
        setQuotation,
        setOrder,
        setInvoice,
        setPurchaseCount,
        setPurchaseOrderCount,
        setWorkOrderCount,
        setTotalReminder,
        setTotalInquiry,
        setInquiryList,
        setInquiryMontList,
        setTotalContact,
        setTodayVisitCount,
        setTodayCallCount,
        setOutOfStockCount,
        setTotalApprovedQuotation,
        setTotalApprovedOrder,
        setTotalApprovedInvoice,
        setPurchaseApprovedCount,
        setPurchaseOrderApprovedCount,
        setWorkOrderApprovedCount,
        setTotalReturnSalesInvoice,
        setReturnSalesInvoiceApprovedCount,
        setTotalReturnPurchaseInvoice,
        setReturnPurchaseInvoiceApprovedCount,
        setTotalInward,
        setInwardCount,
        setTotalDispath,
        setDispathCount,
        setSupportTicketCount,
        setTaskCount,
        selectedUsers.map((user) => user.value),
        setTeamInsight,
      );
      await fetchSourceOfTypesApiForDashboard(setSourceOfTypesLists);
      // await fetchAccountOutstanding();
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

  useEffect(() => {
    fetchSourceOfTypesApiForDashboard(setSourceOfTypesLists);
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
    if (selectedDates && selectedDates.length === 2) {
      handelRefreshDashboard();
    }
  }, [selectedDates]);

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
    } else if (canViewReturnSales && name === "return_sales_invoice") {
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
    } else if (canAllReminderReport && name === "allreminder_report") {
      setIsReportShow(true);
      setReportName(name);
    } else {
      setIsReportShow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      setReportName(name);
    }
  };

  const getRandom = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const leaderboardData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    saleOrderValue: getRandom(50000, 200000),
    saleInvoiceValue: getRandom(40000, 180000),
    visit: getRandom(5, 25),
    calls: getRandom(10, 50),
  }));

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
      await fetchAllDashoardApi(
        selectedDates,
        setQuotation,
        setOrder,
        setInvoice,
        setPurchaseCount,
        setPurchaseOrderCount,
        setWorkOrderCount,
        setTotalReminder,
        setTotalInquiry,
        setInquiryList,
        setInquiryMontList,
        setTotalContact,
        setTodayVisitCount,
        setTodayCallCount,
        setOutOfStockCount,
        setTotalApprovedQuotation,
        setTotalApprovedOrder,
        setTotalApprovedInvoice,
        setPurchaseApprovedCount,
        setPurchaseOrderApprovedCount,
        setWorkOrderApprovedCount,
        setTotalReturnSalesInvoice,
        setReturnSalesInvoiceApprovedCount,
        setTotalReturnPurchaseInvoice,
        setReturnPurchaseInvoiceApprovedCount,
        setTotalInward,
        setInwardCount,
        setTotalDispath,
        setDispathCount,
        setSupportTicketCount,
        setTaskCount,
        data, // Pass as setTeamMemberList
        undefined
      );
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
              <style>{`
                .crm-stat-card {
                  transition: box-shadow 0.15s ease, transform 0.15s ease;
                }
                .crm-stat-card:hover {
                  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
                  transform: translateY(-2px);
                }
              `}</style>
              <div style={{ marginBottom: "18px" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    letterSpacing: "-0.01em",
                  }}
                >
                  My Insights
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#8a8a8a",
                  }}
                >
                  A snapshot of your business activity for the selected period.
                </p>
              </div>
              <div
                className="d-flex align-items-end gap-3 flex-wrap"
                style={{
                  background: "#fff",
                  border: "1px solid #eef0f3",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{ flex: 1, minWidth: "220px", maxWidth: "300px" }}
                  ref={datePickerRef}
                >
                  <label
                    className="mb-1 d-block"
                    style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}
                  >
                    Date Range
                  </label>
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
                      top: "50%",
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
                <div style={{ flex: 1, minWidth: "220px", maxWidth: "300px" }}>
                  <label
                    className="mb-1 d-block"
                    style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}
                  >
                    Team Members
                  </label>
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
                </div>
                <div className="d-flex align-items-center ms-auto">
                  <button
                    className="icons"
                    onClick={handelRefreshDashboard}
                    title="Refresh"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      border: "1px solid #eef0f3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#5f6368",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 50 50">
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
              </div>
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
                    alignItems: "stretch",
                    marginLeft: 0,
                    justifyContent: "space-between",
                  }}>
                    <Col md={6} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ flex: 1 }}>
                        <Row className="g-4 h-100" style={{ flex: 1 }}>
                          {[
                            {
                              count: totalContact,
                              title: "Total Contact",
                              onClick: () => {
                                handelChangeShowModelReport("all_contact_report");
                              },
                              svg: (
                                <svg
                                  width="30"
                                  height="30"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    opacity="0.1"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M5 5C5 3.89543 5.89543 3 7 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H17.245C17.2513 20.9694 17.2519 20.937 17.2459 20.9044C17.0276 19.7209 16.6277 18.9082 15.9145 18.4054C15.2115 17.9097 14.2512 17.75 13 17.75C11.7461 17.75 10.7856 17.923 10.0828 18.4324C9.37171 18.9478 8.97232 19.7715 8.75415 20.9547C8.75134 20.9699 8.74997 20.9851 8.74996 21H7C5.89543 21 5 20.1046 5 19V5ZM9.75 12C9.75 10.2051 11.2051 8.75 13 8.75C14.7949 8.75 16.25 10.2051 16.25 12C16.25 13.7949 14.7949 15.25 13 15.25C11.2051 15.25 9.75 13.7949 9.75 12Z"
                                    fill="#5f6368"
                                  ></path>
                                  <path
                                    d="M5 7V5C5 3.89543 5.89543 3 7 3H13H19C20.1046 3 21 3.89543 21 5V7V17V19C21 20.1046 20.1046 21 19 21H13H7C5.89543 21 5 20.1046 5 19V17V7Z"
                                    stroke="#5f6368"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  ></path>
                                  <path
                                    d="M16 12C16 13.6569 14.6569 15 13 15C11.3431 15 10 13.6569 10 12C10 10.3431 11.3431 9 13 9C14.6569 9 16 10.3431 16 12Z"
                                    stroke="#5f6368"
                                    strokeWidth="2"
                                  ></path>
                                  <path
                                    d="M9 21C9.42546 18.6928 10.52 18 13 18C15.48 18 16.5745 18.6425 17 20.9497"
                                    stroke="#5f6368"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  ></path>
                                  <path
                                    d="M3 7H5"
                                    stroke="#5f6368"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  ></path>
                                  <path
                                    d="M3 17H5"
                                    stroke="#5f6368"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  ></path>
                                  <path
                                    d="M3 12H5"
                                    stroke="#5f6368"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  ></path>
                                </svg>
                              ),
                            },
                            {
                              count: totalInquiry,
                              title: "Total Inquiry",
                              onClick: () => {
                                handelChangeShowModelReport("all_inquiry_report");
                              },
                              svg: (
                                <svg
                                  width="30"
                                  height="30"
                                  viewBox="0 0 24 24"
                                  fill="#5f6368"
                                >
                                  <path
                                    d="M5.25366 13.9999L16.2419 14.0011C16.3459 14.1727 16.4732 14.3321 16.6227 14.474L17.3413 15.1561C17.3004 15.315 17.2471 15.4742 17.1814 15.6338C17.0589 15.5492 16.9118 15.4999 16.7532 15.4999H5.25366C4.83945 15.4999 4.50366 15.8357 4.50366 16.2499V17.1572C4.50366 17.8129 4.78965 18.4359 5.28683 18.8634C6.54491 19.945 8.44092 20.5011 11.0001 20.5011C11.2918 20.5011 11.5748 20.4938 11.8493 20.4794C11.931 20.9259 12.1441 21.3505 12.4808 21.6886L12.7083 21.9167C12.1668 21.973 11.5973 22.0011 11.0001 22.0011C8.11062 22.0011 5.87181 21.3445 4.30894 20.0008C3.48032 19.2884 3.00366 18.25 3.00366 17.1572V16.2499C3.00366 15.0073 4.01102 13.9999 5.25366 13.9999ZM17.0106 12.245L17.5139 11.0581C17.75 10.5015 18.3154 10.1987 18.8699 10.3143L18.9884 10.3455L19.6187 10.5469C20.2436 10.7466 20.7222 11.2819 20.8768 11.9542C21.2441 13.5518 20.8034 15.4969 19.5548 17.7896C18.3079 20.0789 16.9414 21.4553 15.455 21.9189C14.8779 22.099 14.258 21.9682 13.7916 21.5767L13.6684 21.4635L13.1897 20.9829C12.7749 20.5664 12.6894 19.9076 12.9676 19.3921L13.0382 19.2759L13.7597 18.2159C14.0436 17.7989 14.5292 17.6015 14.9971 17.7012L15.1241 17.7358L16.456 18.18C16.9876 17.7778 17.4307 17.2715 17.7856 16.6612C18.0897 16.138 18.2887 15.6078 18.3824 15.0705L18.4205 14.8013L17.3115 13.7487C16.9462 13.4019 16.8135 12.862 16.9628 12.376L17.0106 12.245L17.5139 11.0581L17.0106 12.245ZM11.0001 2.00462C13.7615 2.00462 16.0001 4.2432 16.0001 7.00462C16.0001 9.76605 13.7615 12.0046 11.0001 12.0046C8.2387 12.0046 6.00012 9.76605 6.00012 7.00462C6.00012 4.2432 8.2387 2.00462 11.0001 2.00462ZM11.0001 3.50462C9.06712 3.50462 7.50012 5.07163 7.50012 7.00462C7.50012 8.93762 9.06712 10.5046 11.0001 10.5046C12.9331 10.5046 14.5001 8.93762 14.5001 7.00462C14.5001 5.07163 12.9331 3.50462 11.0001 3.50462Z"
                                    fill="#5f6368"
                                  ></path>
                                </svg>
                              ),
                            },
                            {
                              count: totalReminder,
                              title: "Pending Reminder",
                              onClick: () => {
                                handelChangeShowModelReport("allreminder_report");
                              },
                              svg: (
                                <svg
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="#5f6368"
                                >
                                  <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                                </svg>
                              ),
                            },

                            {
                              count: todayVisitCount,
                              title: "Visits",
                              onClick: () => {
                                handelChangeShowModelReport("all_visit_report");
                              },
                              svg: (
                                <svg
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path
                                    xmlns="http://www.w3.org/2000/svg"
                                    d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"
                                  ></path>
                                </svg>
                              ),
                            },
                            {
                              count: todayCallCount,
                              title: "Calls",
                              onClick: () => {
                                handelChangeShowModelReport("all_call_report");
                              },
                              svg: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="#5f6368"
                                >
                                  <path d="M480-800v-80h400v80H480Zm0 160v-80h400v80H480Zm0 160v-80h400v80H480ZM758-80q-125 0-247-54.5T289-289Q189-389 134.5-511T80-758q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T347-346q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T630-350l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM201-560l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM201-560Zm358 358Z" />
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
                              count: quotation,
                              approvedCount: totalApprovedQuotation,
                              title: quationCount?.[0]?.quotation_title,
                              svg: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30"
                                  viewBox="0 -960 960 960"
                                  width="30"
                                  fill="#5f6368"
                                >
                                  <path d="M560-80v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T903-300L683-80H560Zm300-263-37-37 37 37ZM620-140h38l121-122-18-19-19-18-122 121v38ZM240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
                                </svg>
                              ),
                              onClick: () => {
                                handelChangeShowModelReport("quotation");
                              },
                            },


                            {
                              count: order,
                              approvedCount: totalApprovedOrder,
                              title: quationCount?.[0]?.order_title,
                              svg: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30"
                                  viewBox="0 -960 960 960"
                                  width="30"
                                  fill="#5f6368"
                                >
                                  <path d="m691-150 139-138-42-42-97 95-39-39-42 43 81 81ZM240-600h480v-80H240v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM120-80v-680q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v267q-19-9-39-15t-41-9v-243H200v562h243q5 31 15.5 59T486-86l-6 6-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h203q3-21 9-41t15-39H240v80Zm0-160h284q38-37 88.5-58.5T720-520H240v80Zm-40 242v-562 562Z" />
                                </svg>
                              ),
                              onClick: () => {
                                handelChangeShowModelReport("order");
                              },
                            },
                            {
                              count: totalDispath,
                              approvedCount: dispathCount,
                              title: quationCount?.[0]?.dispatch_title,
                              svg: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30"
                                  viewBox="0 -960 960 960"
                                  width="30"
                                  fill="#5f6368"
                                >
                                  <path d="m480-320 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
                                </svg>
                              ),
                              onClick: () => {
                                handelChangeShowModelReport("dispatch_report");
                              },
                            },
                            {
                              count: invoice,
                              approvedCount: totalApprovedInvoice,
                              title: quationCount?.[0]?.invoice_title,
                              svg: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30"
                                  viewBox="0 -960 960 960"
                                  width="30"
                                  fill="#5f6368"
                                >
                                  <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
                                </svg>
                              ),
                              onClick: () => {
                                handelChangeShowModelReport("order_invoice");
                              },
                            },


                            {
                              count: totalReturnSalesInvoice,
                              approvedCount: returnSalesInvoiceApprovedCount,
                              title: quationCount?.[0]?.return_sales_invoice_title,
                              svg: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30"
                                  viewBox="0 -960 960 960"
                                  width="30"
                                  fill="#5f6368"
                                >
                                  <path d="m480-320 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
                                </svg>
                              ),
                              onClick: () => {
                                handelChangeShowModelReport("return_sales_invoice");
                              },
                            },
                            // {
                            //   count: purchaseOrderCount,
                            //   approvedCount: purchaseOrderApprovedCount,
                            //   title: quationCount?.[0]?.purchase_order_title,
                            //   svg: (
                            //     <svg
                            //       xmlns="http://www.w3.org/2000/svg"
                            //       height="30"
                            //       viewBox="0 -960 960 960"
                            //       width="30"
                            //       fill="#5f6368"
                            //     >
                            //       <path d="m480-320 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
                            //     </svg>
                            //   ),
                            //   onClick: () => {
                            //     handelChangeShowModelReport("purchase_order");
                            //   },
                            // },
                            // {
                            //   count: totalInward,
                            //   approvedCount: inwardCount,
                            //   title: quationCount?.[0]?.inward_title,
                            //   svg: (
                            //     <svg
                            //       xmlns="http://www.w3.org/2000/svg"
                            //       height="30"
                            //       viewBox="0 -960 960 960"
                            //       width="30"
                            //       fill="#5f6368"
                            //     >
                            //       <path d="m480-320 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
                            //     </svg>
                            //   ),
                            //   onClick: () => {
                            //     handelChangeShowModelReport("inward_report");
                            //   },
                            // },

                            // {
                            //   count: purchaseCount,
                            //   approvedCount: purchaseApprovedCount,
                            //   title: quationCount?.[0]?.purchase_title,
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
                            //   onClick: () => {
                            //     handelChangeShowModelReport("purchase_invoice");
                            //   },
                            // },

                            // {
                            //   count: totalReturnPurchaseInvoice,
                            //   approvedCount: returnPurchaseInvoiceApprovedCount,
                            //   title:
                            //     quationCount?.[0]?.return_purchase_invoice_title,
                            //   svg: (
                            //     <svg
                            //       xmlns="http://www.w3.org/2000/svg"
                            //       height="30"
                            //       viewBox="0 -960 960 960"
                            //       width="30"
                            //       fill="#5f6368"
                            //     >
                            //       <path d="m480-320 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z" />
                            //     </svg>
                            //   ),
                            //   onClick: () => {
                            //     handelChangeShowModelReport(
                            //       "return_purchase_invoice",
                            //     );
                            //   },
                            // },

                            {
                              count: supportTicketCount,
                              title: "Support Ticket",
                              onClick: () => {
                                handelChangeShowModelReport(
                                  "support_ticket_report",
                                );
                              },
                              svg: (
                                <svg
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path
                                    xmlns="http://www.w3.org/2000/svg"
                                    d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"
                                  ></path>
                                </svg>
                              ),
                            },
                            {
                              count: taskCount,
                              title: "Total Task",
                              onClick: () => {
                                handelChangeShowModelReport("alltask_report");
                              },
                              svg: (
                                <svg
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path
                                    xmlns="http://www.w3.org/2000/svg"
                                    d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"
                                  ></path>
                                </svg>
                              ),
                            },
                            // {
                            //   count: workOrderCount,
                            //   approvedCount: workOrderApprovedCount,
                            //   title: quationCount?.[0]?.workorder_title,
                            //   svg: (
                            //     <svg
                            //       xmlns="http://www.w3.org/2000/svg"
                            //       height="30"
                            //       viewBox="0 -960 960 960"
                            //       width="30"
                            //       fill="#5f6368"
                            //     >
                            //       <path d="M200-200v-560 454-85 191Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v320h-80v-320H200v560h280v80H200Zm494 40L552-222l57-56 85 85 170-170 56 57L694-80ZM320-440q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 160h240v-80H440v80Zm0-160h240v-80H440v80Z" />
                            //     </svg>
                            //   ),
                            // },
                          ].map((item, idx) => (
                            <Col md={4} key={idx}>
                              <Card
                                className="h-100 crm-stat-card"
                                style={{
                                  borderRadius: "12px",
                                  border: "1px solid #eef0f3",
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                                  cursor: "pointer",
                                }}
                                onClick={item.onClick}
                              >
                                <Card.Body style={{ padding: "18px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "12px",
                                        background: "#f3f4f6",
                                        color: "#5f6368",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {item.svg}
                                    </span>
                                    <div style={{ textAlign: "right" }}>
                                      <h3
                                        className="dash-board-text-count"
                                        style={{
                                          margin: 0,
                                          fontSize: "26px",
                                          fontWeight: 700,
                                          lineHeight: 1,
                                          color: "#1a1a1a",
                                        }}
                                      >
                                        {item.count}
                                      </h3>
                                      <small
                                        className="text-muted"
                                        style={{ fontSize: "11px" }}
                                      >
                                        Total
                                      </small>
                                    </div>
                                  </div>

                                  <h4
                                    className="dash-board-text"
                                    style={{
                                      maxWidth: "100%",
                                      marginTop: "16px",
                                      marginBottom:
                                        item.approvedCount !== undefined ? "8px" : 0,
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      color: "#333",
                                      textAlign: "left",
                                    }}
                                  >
                                    {item.title}
                                  </h4>

                                  {item.approvedCount !== undefined && (
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "3px 10px",
                                        borderRadius: "12px",
                                        background: "#f3f4f6",
                                        color: "#555",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Appr. {item.approvedCount ?? 0.0}
                                    </span>
                                  )}
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
                          }}
                        >
                          <h6 className="fw-bold mb-3">Leaderboard</h6>

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
                                  <th>No.</th>
                                  <th>Employee Name</th>
                                  <th>Sale Order Value</th>
                                  <th>Sale Invoice Value</th>
                                  <th>Visit</th>
                                  <th>No. of Call</th>
                                </tr>
                              </thead>

                              <tbody>
                                {teamInsight?.map((item, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.username}</td>
                                    <td>
                                      {Number(item.order.amount || 0).toLocaleString()}
                                    </td>
                                    <td>
                                      {Number(item.sell_invoice.amount || 0).toLocaleString()}
                                    </td>
                                    <td>{item.visitCount}</td>
                                    <td>{item.callCount}</td>
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
                          <div style={{ height: "300px" }}>
                            <Doughnut
                              data={pieChartData}
                              options={pieChartOptions}
                            />
                          </div>
                          <h4 className="dash-board-text mt-3">
                            Source Type Vs Contact
                          </h4>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card
                        className="text-center"
                        style={{ height: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)" }}
                      >
                        <Card.Body>
                          <div style={{ height: "300px" }}>
                            <Bar
                              data={barChartData}
                              options={barChartOptions}
                            />
                          </div>
                          <h4 className="dash-board-text mt-3">
                            Inquiry Vs Opportunity
                          </h4>
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
                  selectedTeamMembers={selectedTeamMemberValues}
                />
              )}
            </Container>
          </div>
        </div>
      </div>

    </>
  );
};

export default CRMDashboardView;
