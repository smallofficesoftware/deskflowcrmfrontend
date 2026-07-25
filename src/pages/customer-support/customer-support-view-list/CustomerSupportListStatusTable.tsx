import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatDateAndTime } from "../../../common/SharedFunction";
import SafeHtml from "../../../components/SafeHtml";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

interface IStatusLog {
  id: number;
  reference_table: string;
  reference_id: string | number;
  information: string;
  status_id: string | number;
  previous_status_id: string | number;
  updated_by: string | number;
  updated_date_time: string;
  status_name: string;
  status_color_code: string;
  updated_by_name: string;
}

interface IPropsStatusTimeLine {
  show: boolean;
  onClose: () => void;
  reference_id?: number | string | null;
  is_complete_status?: number;
}

interface ICommunicationLog {
  id: number;
  description: string;
  application_login_name: string;
  created_date_time: string;
  attachment?: string;
}

const CustomerSupportListStatusTable: React.FC<IPropsStatusTimeLine> = ({
  onClose,
  reference_id,
  show,
  is_complete_status,
}) => {
  const [statusLogs, setStatusLog] = useState<IStatusLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"status" | "communication">(
    "communication",
  );
  const [communicationLogs, setCommunicationLogs] = useState<
    ICommunicationLog[]
  >([]);
  const [loadingCommunication, setLoadingCommunication] = useState(false);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (show) {
      if (activeTab === "status") {
        fetchCustomerStatusLog();
      } else {
        fetchCommunicationLogs();
      }
    }
  }, [show, activeTab]);

  const fetchCustomerStatusLog = async () => {
    try {
      setLoading(true);
      const getUUID = localStorage.getItem("UUID");
      const token = localStorage.getItem("token");

      if (!getUUID || !token) {
        toast.error("Authentication details are missing");
        setLoading(false);
        return;
      }

      const requestData = {
        reference_id: reference_id,
      };

      const response = await axiosInstance.post(
        "fetch-customer-status-log",
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const items = response.data?.data || [];
        setStatusLog(items);
      } else {
        setStatusLog([]);
        // toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunicationLogs = async () => {
    try {
      setLoadingCommunication(true);

      const token = localStorage.getItem("token");
      const a_application_login_id = localStorage.getItem("UUID");

      const response = await axiosInstance.post(
        "get-support-ticket-message",
        {
          reference_id: reference_id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setCommunicationLogs(response.data.data || []);
      } else {
        setCommunicationLogs([]);
      }
    } catch (error: any) {
      toast.error("Failed to load communication logs");
    } finally {
      setLoadingCommunication(false);
    }
  };

  const handleSendMessage = async () => {
    if (is_complete_status === -6) {
      toast.error(
        "This ticket is already completed. You cannot send messages, If you have any other issue, please create a new ticket",
      );
      return;
    }

    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or select a file to attach.");
      return;
    }

    try {
      setSending(true);

      const token = localStorage.getItem("token");
      const a_application_login_id = localStorage.getItem("UUID");

      const formData = new FormData();
      formData.append(
        "reference_id",
        reference_id ? reference_id.toString() : "",
      );
      formData.append("description", message);
      formData.append("a_application_login_id", a_application_login_id || "");
      if (selectedFile) {
        formData.append("attachment", selectedFile);
      }

      const response = await axiosInstance.post(
        "create-support-ticket-message",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setMessage("");
        setSelectedFile(null);
        fetchCommunicationLogs();
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "50px",
      }}
    >
      <div
        style={{
          background: "white",
          width: "60%",
          maxHeight: "70vh",
          borderRadius: "10px",
          overflow: "hidden",
          padding: "10px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <button
                className="btn"
                onClick={() => setActiveTab("communication")}
                style={{
                  backgroundColor:
                    activeTab === "communication" ? "#F38534" : "#f8f9fa",
                  color: activeTab === "communication" ? "#fff" : "#000",
                  border: "1px solid #ddd",
                }}
              >
                Communication
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab("status")}
                style={{
                  backgroundColor:
                    activeTab === "status" ? "#F38534" : "#f8f9fa",
                  color: activeTab === "status" ? "#fff" : "#000",
                  border: "1px solid #ddd",
                }}
              >
                Status Timeline
              </button>
            </div>
            {/* <span style={{fontSize:"20px"}}><b>Status Timeline</b></span> */}
            <span
              className="close ms-3 pb-3"
              onClick={onClose}
              style={{ cursor: "pointer", fontSize: "22px" }}
            >
              ×
            </span>
          </div>
        </div>
        <hr />
        {activeTab === "status" && (
          <div
            // className="table-container w-100"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            <table className="table table-bordered table-striped">
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#f4f4f4",
                  zIndex: 2,
                }}
              >
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Updated by</th>
                  <th>Information</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td>
                        <Skeleton height={20} />
                      </td>
                      <td>
                        <Skeleton height={20} />
                      </td>
                      <td>
                        <Skeleton height={20} />
                      </td>
                      <td>
                        <Skeleton height={20} />
                      </td>
                    </tr>
                  ))
                ) : statusLogs.length > 0 ? (
                  statusLogs.map((log, index) => (
                    <tr key={log.id}>
                      <td
                        className="align-middle text-center"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            // backgroundColor: "rgba(44, 191, 105, 0.67)",
                            padding: "5px",
                            borderRadius: "30px",
                            margin: "auto",
                          }}
                        >
                          {log.updated_date_time}
                        </span>
                      </td>
                      <td className="align-middle">
                        <span
                          className="badge rounded-pill "
                          style={{
                            backgroundColor: `${log.status_color_code}`,
                          }}
                        >
                          {log.status_name}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {log.updated_by_name}
                      </td>
                      <td>{log.information}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No Status Log found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === "communication" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "60vh",
              width: "100%",
              paddingBottom: "10px",
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {loadingCommunication ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent:
                        index % 2 === 0 ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        background: "#f1f1f1",
                        padding: "10px",
                        borderRadius: "10px",
                        width: "50%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <Skeleton width="40%" height={15} />
                      <Skeleton width="90%" height={15} />
                      <Skeleton width="70%" height={15} />
                      <Skeleton
                        width="20%"
                        height={10}
                        style={{ alignSelf: "flex-end" }}
                      />
                    </div>
                  </div>
                ))
              ) : communicationLogs.length > 0 ? (
                communicationLogs.map(
                  (
                    msg, // adjust if needed
                  ) => {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <div
                          style={{
                            background: "#f1f1f1",
                            padding: "10px",
                            borderRadius: "10px",
                            maxWidth: "60%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span
                            style={{ fontSize: "14px", fontWeight: "bold" }}
                          >
                            {msg.application_login_name}
                          </span>

                          <span>
                            <SafeHtml htmlContent={msg.description} />
                          </span>

                          {msg.attachment && (
                            <a
                              href={msg.attachment}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "12px", marginTop: "5px" }}
                            >
                              📎 Attachment ({msg.attachment.split("/").pop()})
                            </a>
                          )}

                          <span
                            style={{
                              fontSize: "10px",
                              textAlign: "right",
                              marginTop: "5px",
                              color: "#666",
                            }}
                          >
                            {formatDateAndTime(msg.created_date_time)}
                          </span>
                        </div>
                      </div>
                    );
                  },
                )
              ) : (
                <div className="text-center text-muted my-auto">
                  No messages found. Start the conversation!
                </div>
              )}
            </div>

            {/* File preview section */}
            {selectedFile && (
              <div
                style={{
                  padding: "5px 10px",
                  background: "#f1f1f1",
                  borderTop: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <span>
                  📎 <b>Selected:</b> {selectedFile.name} (
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "red",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "10px",
                borderTop: "1px solid #ddd",
                background: "#fff",
                alignItems: "center",
              }}
            >
              {/* Hidden file input */}
              <input
                type="file"
                id="support-ticket-file-input"
                accept="image/*,video/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                style={{ display: "none" }}
              />

              {/* Attachment Button */}
              <label
                htmlFor="support-ticket-file-input"
                style={{
                  padding: "10px",
                  background: "#f8f9fa",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: 0,
                }}
                title="Attach Image, PDF, or Video"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                  fill="currentColor"
                >
                  <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-350h60v350q0 21 14.5 35.5T500-280q21 0 35.5-14.5T550-330v-370q0-50-35-85t-85-35q-50 0-85 35t-35 85v370q0 79 55.5 134.5T470-140q79 0 134.5-55.5T660-330v-370h60v370Z" />
                </svg>
              </label>

              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              />

              <button
                onClick={handleSendMessage}
                disabled={sending}
                style={{
                  padding: "10px 16px",
                  background: "#F38534",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSupportListStatusTable;
