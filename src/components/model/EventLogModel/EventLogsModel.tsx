import React, { useEffect, useState } from "react";
import CallHistoryLog from "./CallHistoryLogs";
import StatusTimeLine from "./StatusTimeLine";

interface IPropsEventLog {
    show: boolean;
    onHide: () => void;
    contactId?: number;
    reference_id?: string | number;
    reference_table?: string;
    table_type?: string;
    requiredTabs: ("status_timeline" | "call_history")[];
}

const EventLogs: React.FC<IPropsEventLog> = ({
    show,
    onHide,
    contactId,
    reference_id,
    reference_table,
    requiredTabs,
    table_type
}) => {

    const [activeTab, setActiveTab] = useState<"timeline" | "callhistory">("timeline");

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") onHide();
        };

        if (show) window.addEventListener("keydown", handleEsc);

        return () => window.removeEventListener("keydown", handleEsc);
    }, [show, onHide]);

    const handleClose = () => {
        onHide();
    };

    return (
        <>
            {show && (
                <div className="modal1 modal-xl" style={{zIndex: 1111}}>
                    <div className="modal-content1">

                        <div className="d-flex align-items-center justify-content-between">
                            <nav className="nav nav-pills flex-column flex-sm-row">
                                <button className={`flex-sm-fill text-sm-center nav-link ${requiredTabs.includes("status_timeline") ? "" : "disabled"} ${activeTab === "timeline" ? "active" : ""
                                    } `}
                                    onClick={() => setActiveTab("timeline")}
                                    aria-disabled={requiredTabs.includes("status_timeline") ? false : true}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M120-240q-33 0-56.5-23.5T40-320q0-33 23.5-56.5T120-400h10.5q4.5 0 9.5 2l182-182q-2-5-2-9.5V-600q0-33 23.5-56.5T400-680q33 0 56.5 23.5T480-600q0 2-2 20l102 102q5-2 9.5-2h21q4.5 0 9.5 2l142-142q-2-5-2-9.5V-640q0-33 23.5-56.5T840-720q33 0 56.5 23.5T920-640q0 33-23.5 56.5T840-560h-10.5q-4.5 0-9.5-2L678-420q2 5 2 9.5v10.5q0 33-23.5 56.5T600-320q-33 0-56.5-23.5T520-400v-10.5q0-4.5 2-9.5L420-522q-5 2-9.5 2H400q-2 0-20-2L198-340q2 5 2 9.5v10.5q0 33-23.5 56.5T120-240Z"
                                        />
                                    </svg>
                                    <span className="m-1">Stage and Status timeline</span>
                                </button>
                                <button
                                    className={`flex-sm-fill text-sm-center nav-link ${requiredTabs.includes("call_history") ? "" : "disabled"} ${activeTab === "callhistory" ? "active" : ""
                                        }`}
                                    onClick={() => setActiveTab("callhistory")}
                                    aria-current="page"
                                    aria-disabled={requiredTabs.includes("call_history") ? false : true}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M480-800v-80h400v80H480Zm0 160v-80h400v80H480Zm0 160v-80h400v80H480ZM758-80q-125 0-247-54.5T289-289Q189-389 134.5-511T80-758q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T347-346q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T630-350l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM201-560l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM201-560Zm358 358Z"
                                        />
                                    </svg>
                                    <span className="m-1">Call history</span>
                                </button>
                            </nav>

                            <span
                                className="close ms-3 pb-3"
                                onClick={handleClose}
                                style={{ cursor: "pointer", fontSize: "22px" }}
                            >
                                ×
                            </span>

                        </div>

                        <hr />

                        {/* ---------- TAB CONTENT ---------- */}
                        {activeTab === "timeline" && (
                            <StatusTimeLine
                                show={true}
                                contactId={contactId}
                                reference_id={reference_id}
                                reference_table={reference_table}
                                table_type={table_type}
                            />
                        )}

                        {activeTab === "callhistory" && (
                            <CallHistoryLog
                                show={true}
                                contactId={contactId}
                            />
                        )}

                    </div>
                </div>
            )}
        </>
    );
};

export default EventLogs;
