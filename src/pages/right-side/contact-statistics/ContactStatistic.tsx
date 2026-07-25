import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  formatDateTimeSendDataBase,
  openInNewTab,
} from "../../../common/SharedFunction";
import { axiosInstance } from "../../../services/axiosInstance";

interface ContactStatisticProps {
  show: boolean;
  onHide: () => void;
  getInfo?: any;
  refresh?: boolean;
  endSearchDate?: string;
}

interface StatItem {
  count: number;
  amount: number;
}

interface PeriodStats {
  totalInquiry: number;
  pendingReminder: number;
  outstandingAmount: number;
  sell_invoice: StatItem;
  order: StatItem;
  quotation: StatItem;
  purchase_invoice: StatItem;
}

const ContactStatistic: React.FC<ContactStatisticProps> = ({
  show,
  onHide,
  getInfo,
  refresh,
  endSearchDate,
}) => {
  const statColors = {
    totalInquiry: { background: "#e3f0ff", text: "#1a3c7a" },
    outstandingAmount: { background: "#fff8e3", text: "#7a5c1a" },
    pendingReminder: { background: "#ffe3e3", text: "#7a1a3c" },
    sell_invoice: { background: "#e3ffe3", text: "#1a7a3c" },
    order: { background: "#f0e3ff", text: "#3c1a7a" },
    quotation: { background: "#e3f0ff", text: "#1a3c7a" },
    purchase_invoice: { background: "#e3ffe3", text: "#1a7a3c" },
  };

  const initialStats: PeriodStats = {
    totalInquiry: 0,
    pendingReminder: 0,
    outstandingAmount: 0,
    sell_invoice: { count: 0, amount: 0 },
    order: { count: 0, amount: 0 },
    quotation: { count: 0, amount: 0 },
    purchase_invoice: { count: 0, amount: 0 },
  };

  const currentDate = endSearchDate ? new Date(endSearchDate) : new Date();
  const currentYear = currentDate.getFullYear(); // 2025
  const lastYear = currentYear - 1; // 2024

  const [stats, setStats] = useState<PeriodStats>(initialStats);
  const [statsLTD, setStatsLTD] = useState<{ [year: number]: PeriodStats }>({
    [currentYear]: initialStats,
  });
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyBox = () => (
    <div
      className="p-3 border rounded text-center"
      style={{
        width: "180px",
        height: "120px",
        backgroundColor: "#f0f0f0",
        color: "#666",
      }}
    />
  );

  const fetchInitialStats = useCallback(async () => {
    if (!getInfo?.id) {
      setStats(initialStats);
      setStatsLTD({ [currentYear]: initialStats });
      return;
    }

    const UUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    try {
      const { data } = await axiosInstance.post(
        "/getallstatistics",
        {
          contact_master_id: getInfo.id,
          a_application_login_id: UUID
        }
      );

      if (data.ack === 0) throw new Error(data.ack_msg || "Fetch error");

      const {
        inquiryCount = 0,
        reminderCount = 0,
        totalCredit = 0,
        totalDebit = 0,
        quotation = { count: 0, amount: 0 },
        order = { count: 0, amount: 0 },
        sell_invoice = { count: 0, amount: 0 },
        purchase_invoice = { count: 0, amount: 0 },
      } = data.data || {};

      const newStats: PeriodStats = {
        totalInquiry: inquiryCount,
        pendingReminder: reminderCount,
        outstandingAmount: totalCredit - totalDebit,
        sell_invoice: {
          count: sell_invoice.count,
          amount: sell_invoice.amount,
        },
        order: { count: order.count, amount: order.amount },
        quotation: { count: quotation.count, amount: quotation.amount },
        purchase_invoice: {
          count: purchase_invoice.count,
          amount: purchase_invoice.amount,
        },
      };

      setStats(newStats);
      setStatsLTD((prev) => ({
        ...prev,
        [currentYear]: newStats,
      }));
      setError(null);
    } catch (error: any) {
      console.error("Error fetching initial statistics:", error);
      setError("Failed to load initial statistics");
      toast.error("Failed to load initial statistics");
      setStats(initialStats);
      setStatsLTD({ [currentYear]: initialStats });
    }
  }, [getInfo?.id, currentYear]);

  const fetchReportData = useCallback(async () => {
    if (!getInfo?.id) {
      setReportData(null);
      return;
    }

    const UUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    const endDate = endSearchDate ? new Date(endSearchDate) : new Date();
    const startDate = new Date(lastYear, 3, 1); // Earliest date (LY_LTD start)

    const formattedStartDate = formatDateTimeSendDataBase(startDate);
    const formattedEndDate = formatDateTimeSendDataBase(endDate);

    try {
      const { data } = await axiosInstance.post(
        "/getallreport",
        {
          contact_masters_id: getInfo.id,
          a_application_login_id: UUID,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }
      );

      if (data.ack === 0) throw new Error(data.ack_msg || "Fetch error");

      setReportData(data.data);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      setError("Failed to load report data");
      toast.error("Failed to load report data");
      setReportData(null);
    }
  }, [getInfo?.id, endSearchDate, lastYear]);

  useEffect(() => {
    if (show && getInfo?.id) {
      fetchInitialStats();
      fetchReportData();
    }
  }, [show, getInfo?.id, refresh, fetchInitialStats, fetchReportData]);

  const formatNumber = (value: number): string => {
    if (isNaN(value) || value === null || value === undefined) return "0.00";
    return value.toFixed(2);
  };

  const statItem = (
    label: string,
    value: number,
    colorKey: keyof typeof statColors,
    emoji: string
  ) => {
    const textColor =
      label === "Outstanding Amount"
        ? value >= 0
          ? "#28a745"
          : "#dc3545"
        : statColors[colorKey].text;

    return (
      <div
        className="p-3 border rounded text-center"
        style={{
          width: "180px",
          height: "120px",
          backgroundColor: statColors[colorKey].background,
          color: textColor,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h4 style={{ fontSize: "1.2rem", margin: "0" }}>
          {formatNumber(value)}
        </h4>
        <p style={{ fontSize: "0.8rem", margin: "4px 0" }}>{label}</p>
        <span role="img" aria-label={label} style={{ fontSize: "1rem" }}>
          {emoji}
        </span>
      </div>
    );
  };

  const combinedStatItem = (
    label: string,
    count: number,
    amount: number,
    colorKey: keyof typeof statColors,
    emoji: string
  ) => (
    <div
      className="p-3 border rounded text-center"
      style={{
        width: "180px",
        height: "120px",
        backgroundColor: statColors[colorKey].background,
        color: statColors[colorKey].text,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h4 style={{ fontSize: "1.2rem", margin: "0" }}>
        {formatNumber(count)} (₹{formatNumber(amount)})
      </h4>
      <p style={{ fontSize: "0.8rem", margin: "4px 0" }}>{label}</p>
      <span role="img" aria-label={label} style={{ fontSize: "1rem" }}>
        {emoji}
      </span>
    </div>
  );

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 900,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowY: "auto",
        maxHeight: "100vh",
        marginTop: "10px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "800px",
          width: "90%",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          zIndex: 1000,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="d-flex align-items-center"
          style={{
            borderBottom: "1px solid #eee",
            justifyContent: "space-between",
          }}
        >
          <div className="col-8">
            <span
              style={{
                // maxWidth: "120px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                // textOverflow: "ellipsis",
                display: "inline-block",
              }}
              title={getInfo?.person_name || "Unknown Contact"}
            >
              👤 {getInfo?.person_name || "Unknown Contact"}{" "}
              ({getInfo?.mobile_number || "No mobile number"}) All Statistics
            </span>{" "}
            <br />
            <span
              className="me-2"
              style={{ fontSize: "0.9rem", color: "#666" }}
            >
              {error ? error : `Last Updated: ${new Date().toLocaleString()}`}
            </span>
          </div>
          <div className="col-4">
            <span className="close ms-3 pb-3" onClick={onHide}>
              &times;
            </span>
              <p
                className="landing-page-text text-end"
                style={{
                  cursor: "pointer",
                  color: "blue",
                  float: "right",
                  fontSize: "13px",
                }}
                onClick={() => openInNewTab("/videoTutorial", 15)}
              >
                Learn More :{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#0000FF"
                >
                  <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                </svg>
              </p>
          </div>
        </div>

        <div>
          <div className="d-flex justify-content-center gap-3">
            {statItem(
              "Total Inquiry",
              statsLTD[currentYear]?.totalInquiry || 0,
              "totalInquiry",
              "📋"
            )}
            {statItem(
              "Outstanding Amount",
              statsLTD[currentYear]?.outstandingAmount || 0,
              "outstandingAmount",
              "💰"
            )}
            {statItem(
              "Pending Reminder",
              statsLTD[currentYear]?.pendingReminder || 0,
              "pendingReminder",
              "⏳"
            )}
            {emptyBox()}
          </div>
        </div>

        <div>
          <div className="d-flex justify-content-center gap-3">
            {combinedStatItem(
              "Quotation",
              statsLTD[currentYear]?.quotation.count || 0,
              statsLTD[currentYear]?.quotation.amount || 0,
              "quotation",
              "✉️"
            )}
            {combinedStatItem(
              "Sales Order",
              statsLTD[currentYear]?.order.count || 0,
              statsLTD[currentYear]?.order.amount || 0,
              "order",
              "🛒"
            )}
            {combinedStatItem(
              "Sales Invoice",
              statsLTD[currentYear]?.sell_invoice.count || 0,
              statsLTD[currentYear]?.sell_invoice.amount || 0,
              "sell_invoice",
              "📄"
            )}
            {combinedStatItem(
              "Purchase Invoice",
              statsLTD[currentYear]?.purchase_invoice.count || 0,
              statsLTD[currentYear]?.purchase_invoice.amount || 0,
              "purchase_invoice",
              "✉️"
            )}
          </div>
        </div>

        {reportData && (
          <div
            className="d-flex justify-content-center gap-3"
            style={{ overflowX: "auto", maxWidth: "100%" }}
          >
            <table
              className="table table-bordered"
              style={{ width: "100%", minWidth: "600px" }}
            >
              <thead>
                <tr>
                  <th rowSpan={2}>Particular</th>
                  <th
                    colSpan={2}
                    style={{ backgroundColor: "#f8d7da", textAlign: "center" }}
                  >
                    MTD
                  </th>
                  <th
                    colSpan={2}
                    style={{ backgroundColor: "#f8d7da", textAlign: "center" }}
                  >
                    LTD
                  </th>
                  <th
                    colSpan={2}
                    style={{ backgroundColor: "#f8d7da", textAlign: "center" }}
                  >
                    YTD
                  </th>
                  <th rowSpan={2}>LTD Growth</th>
                </tr>
                <tr>
                  <th
                    style={{ backgroundColor: "#ffedcc", textAlign: "center" }}
                  >
                    {lastYear}
                  </th>
                  <th
                    style={{ backgroundColor: "#d4edda", textAlign: "center" }}
                  >
                    {currentYear}
                  </th>
                  <th
                    style={{ backgroundColor: "#ffedcc", textAlign: "center" }}
                  >
                    {lastYear}
                  </th>
                  <th
                    style={{ backgroundColor: "#d4edda", textAlign: "center" }}
                  >
                    {currentYear}
                  </th>
                  <th
                    style={{ backgroundColor: "#ffedcc", textAlign: "center" }}
                  >
                    {lastYear}
                  </th>
                  <th
                    style={{ backgroundColor: "#d4edda", textAlign: "center" }}
                  >
                    {currentYear}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Quotation</td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.Quotation?.LY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.Quotation?.CY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.Quotation?.LY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.Quotation?.CY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.Quotation?.LY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.Quotation?.CY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td>
                    {reportData.Quotation?.Growth?.LTD !== undefined
                      ? `${reportData.Quotation.Growth.LTD}%`
                      : "0%"}
                  </td>
                </tr>
                <tr>
                  <td>Sales Order</td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.SalesOrder?.LY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.SalesOrder?.CY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.SalesOrder?.LY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.SalesOrder?.CY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.SalesOrder?.LY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.SalesOrder?.CY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td>
                    {reportData.SalesOrder?.Growth?.LTD !== undefined
                      ? `${reportData.SalesOrder.Growth.LTD}%`
                      : "0%"}
                  </td>
                </tr>
                <tr>
                  <td>Sales Invoice</td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.SalesInvoice?.LY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.SalesInvoice?.CY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.SalesInvoice?.LY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.SalesInvoice?.CY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.SalesInvoice?.LY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.SalesInvoice?.CY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td>
                    {reportData.SalesInvoice?.Growth?.LTD !== undefined
                      ? `${reportData.SalesInvoice.Growth.LTD}%`
                      : "0%"}
                  </td>
                </tr>
                <tr>
                  <td>Purchase Invoice</td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.PurchaseInvoice?.LY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.PurchaseInvoice?.CY_MTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.PurchaseInvoice?.LY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.PurchaseInvoice?.CY_LTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#ffedcc" }}>
                    {reportData.PurchaseInvoice?.LY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td style={{ backgroundColor: "#d4edda" }}>
                    {reportData.PurchaseInvoice?.CY_YTD?.split('"')[1] || "0"}
                  </td>
                  <td>
                    {reportData.PurchaseInvoice?.Growth?.LTD !== undefined
                      ? `${reportData.PurchaseInvoice.Growth.LTD}%`
                      : "0%"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactStatistic;
