import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    DEFAULT_STATUS_CODE_SUCCESS,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

interface ICallHistory {
    id: number;
    call_type: string;
    call_type_color: string;
    call_date: string;
    call_start_time: string;
    call_end_time: string;
    duration: string;
    call_by_me: string;
    remark: string;
}

interface IPropsCallHistoryLog {
    show: boolean;
    contactId?: number;
}

const CallHistoryLog: React.FC<IPropsCallHistoryLog> = ({
    show,
    contactId,
}) => {
    const [callLogs, setCallLogs] = useState<ICallHistory[]>([]);
    const [callTypeList, setCallTypeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFilteredButton, setSelectedFilteredButton] = useState("0");

    // useEffect(() => {
    //     if (show && contactId) {
    //         fetchCallHistory();
    //     }
    // }, [show]);



    const fetchCallHistory = async () => {
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
                a_application_login_id: getUUID,
                contactId: contactId,
                call_type: selectedFilteredButton
            };

            const response = await axiosInstance.post(
                "contactwise-callhistory-log",
                requestData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {

                const items = response.data?.data?.items || [];
                const callTypwWiseCount = response.data?.data?.callTypwWiseCount || [];
                setCallLogs(items);
                setCallTypeList(callTypwWiseCount);
            } else {
                setCallLogs([]);
                // toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedFilteredButton) {
            fetchCallHistory();
        }
    }, [selectedFilteredButton]);

    const handelCallTypeWiseCountsFilters = (callType: string) => {
        setSelectedFilteredButton(callType);
    };

    const calculateDuration1 = (input: string | number | undefined): string => {
        try {
            if (!input) return "-";

            // CASE 1: already number (seconds)
            if (typeof input === "number") {
                const hours = Math.floor(input / 3600);
                const minutes = Math.floor((input % 3600) / 60);
                const seconds = Math.floor(input % 60);
                return `${hours}h ${minutes}m ${seconds}s`;
            }

            // CASE 2: string like "65:10" (MM:SS)
            if (typeof input === "string" && input.includes(":")) {
                const parts = input.split(":");

                let minutes = 0;
                let seconds = 0;

                if (parts.length === 2) {
                    minutes = parseInt(parts[0], 10);
                    seconds = parseInt(parts[1], 10);
                }

                if (isNaN(minutes) || isNaN(seconds)) return "-";

                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;

                return `${hours}h ${remainingMinutes}m ${seconds}s`;
            }

            return "-";
        } catch {
            return "-";
        }
    };


    const callTypesShowList = [
        { id: "1", type: "Incoming", color: "#008000" },
        { id: "2", type: "Outgoing", color: "#0000FF" },
        { id: "3", type: "Missed", color: "#FFCCCC" },
        { id: "4", type: "Rejected", color: "#8B0000" },
        { id: "5", type: "Blocked", color: "#000000" },
        { id: "7", type: "Outgoing Call Not Connected", color: "#FFCCCC" },
    ];

    return (
        <>
            {show && (
                <div
                    className="table-container mb-2"
                    style={{ maxHeight: "60vh", overflowY: "auto" }}
                >
                    <div className="mt-2 mb-2">
                        <button
                            className={`btn ms-1 rounded-5 contact-btn-search fw_500 ${selectedFilteredButton === "0" ? "selected-btn" : ""
                                }`}
                            onClick={() => handelCallTypeWiseCountsFilters("0")}
                        >
                            <span className="contact-btn-search-text">
                                {" "}
                                All{" "}
                            </span>
                            <span
                                className="badge ms-1"
                                style={
                                    {
                                        fontSize: "0.60rem",
                                        lineHeight: "15px",
                                        borderRadius: "45%",
                                        minWidth: "20px",
                                        height: "20px",
                                        backgroundColor: "#beb5b5",
                                    }
                                }
                            >{callTypeList && callTypeList.reduce((sum, obj) => {
                                const val = Object.values(obj)[0];
                                const value = parseInt(String(val), 10) || 0;
                                return sum + value;
                            }, 0)}</span>
                        </button>
                        {
                            callTypesShowList && callTypesShowList.map((j) => (
                                <button key={j.id} className={`btn ms-1 rounded-5 contact-btn-search fw_500 m-1 ${selectedFilteredButton === j.id ? "selected-btn" : ""
                                    }`}
                                    onClick={() => handelCallTypeWiseCountsFilters(j.id)}
                                >
                                    <span className="contact-btn-search-text">
                                        {j.type + " "}
                                    </span>
                                    <span
                                        className="badge ms-1"
                                        style={
                                            {
                                                fontSize: "0.60rem",
                                                lineHeight: "15px",
                                                borderRadius: "45%",
                                                minWidth: "20px",
                                                height: "20px",
                                                backgroundColor: j.color,
                                            }
                                        }
                                    >{callTypeList && callTypeList?.find(obj => Object.keys(obj)[0] === j.id)?.[j.id] || 0}</span>
                                </button>
                            ))
                        }

                    </div>
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
                                <th>#</th>
                                <th>Date</th>
                                <th>Call Start Time</th>
                                <th>Call End Time</th>
                                <th>Duration</th>
                                <th>Call By</th>
                                <th>Call Type</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        Loading...
                                    </td>
                                </tr>
                            ) : callLogs.length > 0 ? (
                                callLogs.map((log, index) => (
                                    <tr key={log.id}>
                                        <td>{index + 1}</td>
                                        <td>{log.call_date}</td>
                                        <td>{log.call_start_time}</td>
                                        <td>{log.call_end_time}</td>
                                        <td>{calculateDuration1(log.duration)}</td>
                                        <td>{log.call_by_me}</td>
                                        <td
                                            style={{
                                                color: log.call_type_color || "#000",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {log.call_type}
                                        </td>
                                        <td>{log.remark}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        No call history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

export default CallHistoryLog;
