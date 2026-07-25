import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
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
    contactId?: number;
    reference_id?: number | string;
    reference_table?: string;
    table_type?: string;
}

const StatusTimeLine: React.FC<IPropsStatusTimeLine> = ({
    show,
    contactId,
    reference_id,
    reference_table,
    table_type
}) => {
    const [statusLogs, setStatusLog] = useState<IStatusLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            fetchStatusLog();
        }
    }, [show]);



    const fetchStatusLog = async () => {
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
                reference_table: reference_table,
                reference_id: reference_id,
                table_type: table_type || ""
            };

            const response = await axiosInstance.post(
                "fetch-status-log",
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

    return (
        <>
            {show && (
                <div
                    className="table-container mb-2"
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
        </>
    );
};

export default StatusTimeLine;
