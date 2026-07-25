import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { formatDateAndTime } from "../../../common/SharedFunction";
import SafeHtml from "../../../components/SafeHtml";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
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
    qrCode: string;
    contactID: string;
}

interface ICommunicationLog {
    id: number;
    description: string;
    application_login_name: string;
    created_date_time: string;
    attachment?: string;
}

const SupportTicketListStatusTable: React.FC<IPropsStatusTimeLine> = ({ onClose, reference_id, show, qrCode, contactID }) => {
    const [statusLogs, setStatusLog] = useState<IStatusLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"status" | "communication">("communication");

    const [communicationLogs, setCommunicationLogs] = useState<ICommunicationLog[]>([]);
    const [loadingCommunication, setLoadingCommunication] = useState(false);

    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

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
            const token = localStorage.getItem("token");


            const requestData = {
                reference_id: reference_id,
                qr_code: qrCode
            };

            const response = await axiosInstance.post(
                "fetch-store-ticket-status-log",
                requestData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {

                const items = response.data?.data || [];
                setStatusLog(items);
            } else {
                setStatusLog([]);
                // toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommunicationLogs = async () => {
        try {
            setLoadingCommunication(true);

            const token = localStorage.getItem("token");

            const response = await axiosInstance.post(
                "get-store-ticket-message",
                {
                    reference_id: reference_id,
                    qr_code: qrCode
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
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
        if (!message.trim()) return;

        try {
            setSending(true);

            const token = localStorage.getItem("token");

            const payload = {
                reference_id,
                qr_code: qrCode,
                contactID: contactID,
                description: message,
            };

            const response = await axiosInstance.post(
                "create-store-ticket-message",
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setMessage("");
                fetchCommunicationLogs();
            }
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{
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
            paddingTop: "50px"
        }}>
            <div style={{
                background: "white",
                width: "60%",
                maxHeight: "70vh",
                borderRadius: "10px",
                overflow: "hidden",
                padding: "10px",
                position: "relative",
                display: "flex",
                flexDirection: "column"
            }}>
                <div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">

                            <button
                                className="btn"
                                onClick={() => setActiveTab("communication")}
                                style={{
                                    backgroundColor: activeTab === "communication" ? "#F38534" : "#f8f9fa",
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
                                    backgroundColor: activeTab === "status" ? "#F38534" : "#f8f9fa",
                                    color: activeTab === "status" ? "#fff" : "#000",
                                    border: "1px solid #ddd",
                                }}
                            >
                                Status Timeline
                            </button>

                        </div>
                        {/* <span style={{ fontSize: "20px" }}><b>Status Timeline</b></span> */}
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
                                    <tr>
                                        <td colSpan={7} className="text-center">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : statusLogs.length > 0 ?

                                    (
                                        statusLogs.map((log, index) => (
                                            <tr key={log.id}>
                                                <td className="align-middle text-center" style={
                                                    { whiteSpace: "nowrap" }
                                                }>
                                                    <span style={{
                                                        // backgroundColor: "rgba(44, 191, 105, 0.67)",
                                                        padding: "5px",
                                                        borderRadius: "30px",
                                                        margin: "auto"
                                                    }}>
                                                        {log.updated_date_time}
                                                    </span>
                                                </td>
                                                <td className="align-middle"><span className="badge rounded-pill " style={{ backgroundColor: `${log.status_color_code}` }}>{log.status_name}</span></td>
                                                <td style={{ whiteSpace: "nowrap" }}>{log.updated_by_name}</td>
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
                            {communicationLogs.map((msg) => // adjust if needed
                            {
                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "flex-end"
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
                                            <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                                                {msg.application_login_name}
                                            </span>

                                            <span>
                                                <SafeHtml htmlContent={msg.description} />
                                            </span>

                                            {msg.attachment && (
                                                <a
                                                    href={`/media-folder/store_ticket_attachment/${msg.attachment}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ fontSize: "12px", marginTop: "5px" }}
                                                >
                                                    📎 Attachment
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
                            })}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                padding: "10px",
                                borderTop: "1px solid #ddd",
                                background: "#fff",
                            }}
                        >
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
                                    cursor: "pointer",
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTicketListStatusTable;
