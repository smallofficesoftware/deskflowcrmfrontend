import React, { useState } from "react";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import TrackView from "../../../left-side/list-company/TrackView";
import { DAY_STATUS } from "./ProcessAttendanceReportController";

// interface AttendanceMessage {
//     attendanceDate: string;
//     attendanceTime: string;
//     attendance_status: number;
//     total_working_hour?: string;
//     image_url?: string;
// }

interface AttendanceEntry {
    check_in_out_date_time: string;
    attendance_status: number;
    attendance_entry_flag: number;
    image_url: string;
    remark: string;
    total_working_hour: string;
    address: string;
    latitude: string;
    longitude: string;
}

interface AttendanceDay {
    id: number,
    date: string,
    employee_id: number,
    search_string: string,
    last_updated_date: string,
    day_status: number,
    total_working_time: string,
    net_working_hour: string,
    overtime_hour: string,
    early_out: string,
    late_in: string,
    first_in: string,
    last_out: string,
    attenance_entry_list: string;
}

interface IPropsProcessAttendanceDayDetail {
    visible: boolean;
    onHide: () => void;
    username: string;
    date: string;
    displayDate: string;
    attendance: AttendanceDay | null;
    companyTeamInfo: any;
}

const labelStyle = {
    width: "180px",
    minWidth: "180px",
    fontWeight: 600,
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

const formatTime = (time: string) => {
    if (!time) return "";

    const [hours, minutes, seconds] = time.split(":");

    let hour = parseInt(hours, 10);
    hour = hour % 12 || 12;

    return `${hour}:${minutes}:${seconds}`;
};

const formatTimeWithMeridiem = (time: string) => {
    if (!time) return "";

    const [hours, minutes, seconds] = time.split(":");

    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${minutes}:${seconds} ${ampm}`;
};

const ProcessAttendanceDayWiseDetails: React.FC<IPropsProcessAttendanceDayDetail> = ({
    visible,
    onHide,
    username,
    date,
    attendance,
    companyTeamInfo
}) => {

    const canViewLocation = useCheckUserPermission(
        PAGE_ID.LOCATION_SERVICE,
        PERMISSION_TYPE.VIEW,
    );

    const [isOpenTracking, setIsOpenTracking] = useState(false);
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [address, setAddress] = useState("");

    if (!visible) return null;
    // const messages =
    //     attendance?.messages?.filter((m) => m.attendanceDate === date) || [];

    const statusId = attendance?.day_status;
    const statusLabel = DAY_STATUS[statusId ?? 0];

    const statusColor =
        statusLabel === "P" ? "#28a745" :
            statusLabel === "A" ? "#dc3545" :
                statusLabel === "L" ? "#fd7e14" :
                    statusLabel === "WO" ? "#007bff" : "#6c757d";

    const attendanceEntries: AttendanceEntry[] = attendance?.attenance_entry_list
        ? JSON.parse(attendance.attenance_entry_list)
        : [];

    return (
        <>
            <div
                className="modal modal1"
                style={{ display: "block", zIndex: 1050 }}
                role="dialog"
            >
                <div className="modal-dialog modal-dialog-top" role="document" style={{ maxWidth: "60%" }}>
                    <div className="modal-content" style={{ borderRadius: "12px", overflow: "hidden" }}>

                        <div
                            className="modal-header"
                            style={{ padding: "14px 20px" }}
                        >
                            <div>
                                <h5 style={{ alignItems: "start" }}>
                                    {username}
                                </h5>
                                <small style={{ fontSize: "12px" }}>
                                    Attendance Details — {formatDate(date)}
                                </small>
                            </div>
                            <button
                                type="button"
                                className="btn-close btn-close-black"
                                onClick={onHide}
                                aria-label="Close"
                            />
                        </div>

                        <div className="modal-body" style={{ padding: "20px" }}>

                            <div
                                className="mb-3"
                                style={{
                                    background: "#f8f9fa",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "10px",
                                    padding: "15px 20px",
                                }}
                            >
                                <div className="d-flex py-1">
                                    <span className="text-start" style={labelStyle}>Total Working Time</span>
                                    <span>: {formatTime(attendance?.total_working_time || "") || "-"}</span>
                                </div>

                                <div className="d-flex py-1">
                                    <span className="text-start" style={labelStyle}>Net Working Hour</span>
                                    <span>: {formatTime(attendance?.net_working_hour || "") || "-"}</span>
                                </div>

                                {attendance?.overtime_hour && (
                                    <div className="d-flex py-1">
                                        <span className="text-start" style={labelStyle}>Overtime Hour</span>
                                        <span>: {formatTime(attendance?.overtime_hour)}</span>
                                    </div>
                                )}

                                {attendance?.early_out && (
                                    <div className="d-flex py-1">
                                        <span className="text-start" style={labelStyle}>Early Out</span>
                                        <span>: {formatTime(attendance?.early_out)}</span>
                                    </div>
                                )}

                                {attendance?.late_in && (
                                    <div className="d-flex py-1">
                                        <span className="text-start" style={labelStyle}>Late In</span>
                                        <span>: {formatTime(attendance?.late_in)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <span>Status:</span>
                                    <span
                                        style={{
                                            backgroundColor: statusColor,
                                            color: "#fff",
                                            padding: "4px 16px",
                                            borderRadius: "20px",
                                            fontSize: "13px",
                                            marginLeft: "4px"
                                        }}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>
                                {/* <div>
                                    {canViewLocation && (
                                        <button
                                            className="btn btn-m"
                                            style={{ backgroundColor: "#FF7D12", marginRight: "0px", color: "#fff" }}
                                            onClick={() => setIsOpenTracking(true)}
                                        >
                                            View Location Tracking
                                        </button>
                                    )}
                                </div> */}
                            </div>

                            {!attendance ? (
                                <p className="text-center text-muted">No attendance data for this day.</p>
                            ) : attendanceEntries.length === 0 ? (
                                <p className="text-center text-muted">No punch records found.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                                        <thead style={{ backgroundColor: "#f0f0f0" }}>
                                            <tr>
                                                <th style={{ width: "50px" }}>#</th>
                                                <th style={{ width: "100px" }}>Type</th>
                                                <th style={{ width: "150px" }}>Working Hours</th>
                                                <th style={{ width: "150px" }}>Punch Time</th>
                                                <th style={{ width: "160px" }}>Image</th>
                                                <th>Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceEntries.map((entry, idx) => (
                                                <tr key={idx}>
                                                    {/* Sr No */}
                                                    <td className="text-center text-muted">{idx + 1}</td>

                                                    {/* Check In / Out */}
                                                    <td>
                                                        <span
                                                            style={{
                                                                color:
                                                                    entry.attendance_status === 1
                                                                        ? "#28a745"
                                                                        : "#dc3545",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {entry.attendance_status === 1
                                                                ? "Check In"
                                                                : "Check Out"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span>
                                                            {entry.attendance_status === 1 ? "-" : formatTime(entry.total_working_hour)}
                                                        </span>
                                                    </td>

                                                    {/* Time */}
                                                    <td style={{ fontWeight: 500 }}>
                                                        {formatTimeWithMeridiem(new Date(entry.check_in_out_date_time).toLocaleTimeString(
                                                            "en-GB",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                second: "2-digit",
                                                                hour12: false,
                                                            }
                                                        ))}
                                                    </td>

                                                    {/* Image */}
                                                    <td className="text-center">
                                                        {entry.image_url ? (
                                                            <img
                                                                src={entry.image_url}
                                                                alt={`${idx + 1}`}
                                                                style={{
                                                                    width: "56px",
                                                                    height: "56px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #ddd",
                                                                    cursor: "pointer",
                                                                }}
                                                                onClick={() => window.open(entry.image_url, "_blank")}
                                                            />
                                                        ) : (
                                                            <span className="text-muted">No Image</span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {entry.address ? (
                                                            <div className="d-flex align-items-center justify-content-center w-100">
                                                                <span
                                                                    style={{
                                                                        display: "inline-block",
                                                                        width: "80%",
                                                                        whiteSpace: "normal",
                                                                        overflowWrap: "break-word",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    {entry.address}
                                                                </span>
                                                                <button
                                                                    className="location-button ms-2"
                                                                    onClick={() => {
                                                                        setLatitude(entry.latitude);
                                                                        setLongitude(entry.longitude);
                                                                        setAddress(entry.address);
                                                                        setIsOpenTracking(true);
                                                                    }}
                                                                    title="View Map"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        height="20"
                                                                        width="20"
                                                                        viewBox="0 -960 960 960"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span>
                                                                No Address Found
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>



                    </div>
                </div>
                {isOpenTracking && (
                    <TrackView
                        show={isOpenTracking}
                        onHide={() => setIsOpenTracking(false)}
                        DateAndId={date}
                        companyTeamInfo={companyTeamInfo}
                        latitude={latitude}
                        longitude={longitude}
                        address={address}
                    />
                )}
            </div>
        </>
    );
};

export default ProcessAttendanceDayWiseDetails;