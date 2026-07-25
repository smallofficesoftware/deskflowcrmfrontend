import React, { useState } from "react";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import TrackView from "../../../left-side/list-company/TrackView";

interface AttendanceMessage {
    attendanceDate: string;
    attendanceTime: string;
    attendance_status: number;
    total_working_hour?: string;
    image_url?: string;
    address: string,
    latitude: string,
    longitude: string,
}

interface AttendanceDay {
    date: string;
    status: string;
    leave_type?: string;
    messages?: AttendanceMessage[];
}

interface AttendanceDayDetailModalProps {
    visible: boolean;
    onHide: () => void;
    username: string;
    date: string;
    displayDate: string;
    attendance: AttendanceDay | null;
    companyTeamInfo: any;
}

const AttendanceDayWiseDetails: React.FC<AttendanceDayDetailModalProps> = ({
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
    const messages =
        attendance?.messages?.filter((m) => m.attendanceDate === date) || [];

    const statusColor =
        attendance?.status === "P" ? "#28a745" :
            attendance?.status === "A" ? "#dc3545" :
                attendance?.status === "L" ? "#fd7e14" :
                    attendance?.status === "Week Off" ? "#007bff" : "#6c757d";

    const statusLabel =
        attendance?.status === "L" && attendance?.leave_type
            ? `${attendance.status} (${attendance.leave_type})`
            : attendance?.status ?? "-";


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
                                    Attendance Details — {date}
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
                                <div>
                                    {canViewLocation && (
                                        <button
                                            className="btn btn-m"
                                            style={{ backgroundColor: "#FF7D12", marginRight: "0px", color: "#fff" }}
                                            onClick={() => setIsOpenTracking(true)}
                                        >
                                            View Location Tracking
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!attendance ? (
                                <p className="text-center text-muted">No attendance data for this day.</p>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-muted">No punch records found.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                                        <thead style={{ backgroundColor: "#f0f0f0" }}>
                                            <tr>
                                                <th style={{ width: "50px" }}>#</th>
                                                <th style={{ width: "100px" }}>Type</th>
                                                <th style={{ width: "150px" }}>Punch Time</th>
                                                <th style={{ width: "150px" }}>Working Hours</th>
                                                <th style={{ width: "160px" }}>Image</th>
                                                <th>Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messages.map((m, idx) => (
                                                <tr key={idx}>
                                                    {/* Sr No */}
                                                    <td className="text-center text-muted">{idx + 1}</td>

                                                    {/* Check In / Out */}
                                                    <td>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                color:
                                                                    m.attendance_status === 1 ? "#28a745" :
                                                                        m.attendance_status === 2 ? "#dc3545" : "#6c757d",
                                                                padding: "5px 12px",
                                                                borderRadius: "20px",
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            {m.attendance_status === 1
                                                                ? "Check In"
                                                                : m.attendance_status === 2
                                                                    ? "Check Out"
                                                                    : "Punch"}
                                                        </span>
                                                    </td>

                                                    {/* Time */}
                                                    <td style={{ fontWeight: 500 }}>{m.attendanceTime || "-"}</td>

                                                    {/* Working Hours */}
                                                    <td>
                                                        {m.total_working_hour ? (
                                                            <span style={{ color: "#555" }}>
                                                                {m.total_working_hour}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>

                                                    {/* Image */}
                                                    <td className="text-center">
                                                        {m.image_url ? (
                                                            <img
                                                                src={m.image_url}
                                                                alt={`${idx + 1}`}
                                                                style={{
                                                                    width: "56px",
                                                                    height: "56px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #ddd",
                                                                    cursor: "pointer",
                                                                }}
                                                                onClick={() => window.open(m.image_url, "_blank")}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-muted" style={{ fontSize: "12px" }}>
                                                                No Image
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {m.address ? (
                                                            <>
                                                                <span
                                                                    style={{
                                                                        display: "inline-block",
                                                                        width: "75%",
                                                                        whiteSpace: "normal",
                                                                        overflowWrap: "break-word",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    {m.address}
                                                                </span>
                                                                <button
                                                                    className="btn btn-m"
                                                                    style={{ backgroundColor: "#FF7D12", marginRight: "0px", color: "#fff", height: "30px", padding: "5px 10px", marginLeft: "10px" }}
                                                                    onClick={() => {
                                                                        setLatitude(m.latitude);
                                                                        setLongitude(m.longitude);
                                                                        setAddress(m.address);
                                                                        setIsOpenTracking(true);
                                                                    }}
                                                                >
                                                                    View Map
                                                                </button>
                                                            </>
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

export default AttendanceDayWiseDetails;