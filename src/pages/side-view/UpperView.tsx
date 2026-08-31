import { useContext, useEffect, useState } from "react";
import { DateObject } from "react-multi-date-picker";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import noImage from "../../assets/images/no_image.jpeg";
import { AppContext } from "../../common/AppContext";
import { handleRefresh } from "../../common/SharedFunction";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import ReminderModal from "../../components/model/ReminderModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../helpers/AppEnum";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import CreateContactView from "../left-side/create-contact/CreateContactView";
import { createReminderForMy, IReminderList } from "../left-side/header/list-reminder/ListReminderController";
import { ITaskView } from "../left-side/header/Setting/taskList/TaskListController";
import { ILoginData, logOutApi } from "../left-side/LeftSideController";
import CreateTaskView from "../right-side/create-task/CreateTaskView";
import { insertAttendance, viewAttendanceStatus } from "../right-side/RightViewController";
import { fetchCompanyApi, ICompany } from "../left-side/list-company/ListCompanyController";

interface IProp {
    profileDetail?: ILoginData;
}

const UpperView = ({ profileDetail }: IProp) => {
    const {
        setShowAttendancePopup,
        compulsaryAttendance
      } = useContext(AppContext)!;

    const [supportTicketFlag, setSupportTicketFlag] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
    const [isOpenCreateModel, setIsCreateModel] = useState(false);
    const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<
        ITaskView[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [selectedButton, setSelectedButton] = useState<"all" | "my">("my");
    const [selectedStageStatusId, setSelectedStageStatusId] = useState<
        number | string | undefined | null
    >(null);
    const [selectedPriorityId, setSelectedPriorityId] = useState<
        number | null | undefined
    >(undefined);
    const [selectedButtonDue, setSelectedDue] = useState("");
    const [isCreateContact, setIsCreateContact] = useState(false);
    const [refreshContact, setRefreshContact] = useState(false);
    const [isSetReminderConfirmation, setIsSetReminderConfirmation] =
        useState(false);
    const [
        isReminderConfirmationStatusData,
        setIsReminderConfirmationStatusData,
    ] = useState<IReminderList>();
    const [reminderList, setReminderList] = useState<IReminderList[]>([]);
    const [noDataFound, setNoDataFound] = useState<boolean>(false);
    const [companyFlag, setCompanyFlag] = useState<string | number | null>(null);
    const [filterType, setFilterType] = useState<
        "due" | "future" | "complete" | "all"
    >("all");
    const [searchDate, setSearchDate] = useState<DateObject | null>(null);
    const [counts, setCounts] = useState({ due: 0, future: 0, complete: 0 });
    const [savedAttendance, setSavedAttendance] = useState(2);
    const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>("");
    const [isMainWorkspace, setIsMainWorkspace] = useState<boolean>(true);

    useEffect(() => {
        const fetchCurrentWorkspace = async () => {
            const activeId = localStorage.getItem("COMPANY_ID");
            if (!activeId) return;

            await fetchCompanyApi(
                (companiesData: any) => {
                    const list: ICompany[] = Array.isArray(companiesData)
                        ? companiesData
                        : typeof companiesData === "function"
                        ? companiesData([])
                        : [];
                    const active = list.find((c) => c.id === Number(activeId));
                    if (active) {
                        setActiveWorkspaceName(active.company_name);
                        setIsMainWorkspace(
                            active.parent_company_id === null ||
                            active.parent_company_id === undefined
                        );
                    }
                },
                "",
                () => {},
                () => {},
                () => {},
            );
        };
        fetchCurrentWorkspace();
    }, []);


    const canAdd = useCheckUserPermission(
        supportTicketFlag == 0 ? PAGE_ID.TASK_MANAGEMENT : PAGE_ID.SUPPORT_TICKET,
        PERMISSION_TYPE.ADD,
    );
    const canAddContact = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.ADD);
    const canAddReminder = useCheckUserPermission(PAGE_ID.REMINDER, PERMISSION_TYPE.ADD);
    const canAddAttendance = useCheckUserPermission(
        PAGE_ID.ATTENDANCE,
        PERMISSION_TYPE.ADD,
    );


    useEffect(() => {
        const handleClickOutside = () => {
            setDropdownOpen(false);
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);
    const navigate = useNavigate()

    const handleLogout = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        const result = await logOutApi(setIsCloseConfirmation);
        setIsLoggingOut(false);
        if (result.success) {
            localStorage.clear();
            navigate("/")
            handleRefresh();
        } else {
            toast.error(result.message || "Logout failed");
        }
    };

    function openCreateTask(flag: number) {
        setSupportTicketFlag(flag);

        if (canAdd) {
            setIsCreateModel(true);
        } else {
            setIsCreateModel(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }

    const handleChangeAddContact = () => {
        if (canAddContact) {
            setIsCreateContact(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            setIsCreateContact(false);
        }
    };

    function addReminder() {
        if (canAddReminder) {
            setIsSetReminderConfirmation(true);
            setIsReminderConfirmationStatusData(undefined);
        } else {
            setIsSetReminderConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }

    const handleSetReminder = async (data: {
        dateTime: string;
        remark: string;
        status: string;
        selectedCategory: { value: number; label: string } | null;
        referenceTable?: string;
        referenceId?: number;
    }) => {
        if (
            data.dateTime.trim() &&
            data.remark.trim() &&
            (data.selectedCategory?.value ||
                isReminderConfirmationStatusData?.assigned_to)
        ) {
            createReminderForMy(
                {
                    dateTime: data.dateTime,
                    remark: data.remark,
                    status: data.status,
                    selectedCategory: data.selectedCategory || {
                        value: isReminderConfirmationStatusData?.assigned_to || 0,
                        label: isReminderConfirmationStatusData?.assigned_to_name || "",
                    },
                    referenceTable:
                        data.referenceTable ||
                        isReminderConfirmationStatusData?.reference_table ||
                        null,
                    referenceId:
                        data.referenceId ||
                        isReminderConfirmationStatusData?.reference_id ||
                        null,
                    contactMastersId:
                        isReminderConfirmationStatusData?.contact_masters_id || null,
                    mobileNumber:
                        isReminderConfirmationStatusData?.mobile_number || undefined,
                    contactMessage:
                        isReminderConfirmationStatusData?.contact_message || undefined,
                    companyMastersId:
                        isReminderConfirmationStatusData?.company_masters_id,
                    assignedTo: isReminderConfirmationStatusData?.assigned_to,
                    assignedToName: isReminderConfirmationStatusData?.assigned_to_name,
                },
                setIsSetReminderConfirmation,
                setLoading,
                setReminderList,
                setNoDataFound,
                setCompanyFlag,
                filterType,
                searchDate,
                setCounts
            );
        } else {
            toast.error("Please enter Date and Time, Remark, and Select Team Member");
            setIsSetReminderConfirmation(true);
        }
    };

    // useEffect(() => {
    //     if (searchTermFromRightSide === "Create Task") {
    //         openCreateTask();
    //     }
    // }, []);

    const handleAttendance = async () => {
        if (canAddAttendance) {
            setLoading(true);
            setTimeout(async () => {
                const nextStatus =
                    savedAttendance === 1 ? 2 : savedAttendance === 0 ? 1 : 1;

                await insertAttendance(
                    nextStatus,
                    setShowAttendancePopup,
                    compulsaryAttendance,
                );

                await setSavedAttendance(nextStatus); // db mathi last entry lai ne aave che
                setLoading(false);
            }, 500);

            // toast.success(setSavedAttendance.ack_msg)
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    useEffect(() => {
        viewAttendanceStatus(setSavedAttendance, setLoading);
      }, []);

    return (
        <>
            <div
                style={{
                    height: "8vh",
                    background: "#E1E1E1",
                    borderBottom: "1px solid #c9c9c9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0px 11px 2px 10px",
                    flexShrink: 0,
                    marginBottom: "10px"
                }}
            >
                {/* LEFT SIDE */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <style>{`
                        .sideview-add-contact-btn.contact-btn-search {
                            background: linear-gradient(135deg, #F58634, #F5A623) !important;
                            border-color: transparent !important;
                        }
                        .sideview-add-contact-btn.contact-btn-search:hover {
                            background: linear-gradient(135deg, #e5762a, #e39515) !important;
                        }
                        .sideview-add-contact-btn .contact-btn-search-text {
                            color: #fff !important;
                        }
                    `}</style>
                    <button
                        className="btn ms-1 sideview-add-contact-btn contact-btn-search rounded-4 fw_500"
                        onClick={() => addReminder()}
                    >
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff">
                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>
                            <span className="contact-btn-search-text">

                                Add Reminder
                            </span>
                        </span>

                    </button>
                    <button
                        className="btn ms-1 sideview-add-contact-btn contact-btn-search rounded-4 fw_500"
                        onClick={() => handleChangeAddContact()}
                    >
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff">
                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>
                            <span className="contact-btn-search-text">

                                Add Contact
                            </span>
                        </span>
                    </button>
                    <button
                        className="btn ms-1 sideview-add-contact-btn contact-btn-search rounded-4 fw_500"
                        onClick={() => openCreateTask(0)}
                    >
                        <span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="#fff"
                            >
                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>

                            <span className="contact-btn-search-text">Add Task</span>
                        </span>
                    </button>

                    <button
                        className="btn ms-1 sideview-add-contact-btn contact-btn-search rounded-4 fw_500"
                        onClick={() => openCreateTask(1)}
                    >
                        <span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="#fff"
                            >
                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>

                            <span className="contact-btn-search-text">Add Support Ticket</span>
                        </span>
                    </button>
                </div>

                {/* RIGHT SIDE */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        //   onClick={openProfile}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "8px 12px"
                        }}
                    >
                        {activeWorkspaceName && (
                            <div
                                className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-sm me-2"
                                style={{
                                    backgroundColor: isMainWorkspace ? "#fff3eb" : "#f1f5f9",
                                    border: `1.5px solid ${isMainWorkspace ? "#f58634" : "#cbd5e1"}`,
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: isMainWorkspace ? "#f58634" : "#475569",
                                    whiteSpace: "nowrap",
                                }}
                                title={`Logged in: ${activeWorkspaceName} (${isMainWorkspace ? "Main Company" : "Workspace"})`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                                </svg>
                                <span>
                                    {activeWorkspaceName}
                                </span>
                                <span
                                    className="badge ms-1"
                                    style={{
                                        backgroundColor: isMainWorkspace ? "#f58634" : "#64748b",
                                        color: "#ffffff",
                                        fontSize: "10px",
                                        padding: "3px 7px",
                                        borderRadius: "100px",
                                    }}
                                >
                                    {isMainWorkspace ? "Main Company" : "Workspace"}
                                </span>
                            </div>
                        )}
                        <div>
                            <button
                                onClick={handleAttendance}
                                className="btn right-icons text-light rounded-5 fw_500"
                                style={
                                    savedAttendance === 2 || savedAttendance === 0
                                        ? {
                                            backgroundColor: "#ccc",
                                            borderRadius: "50%",
                                            padding: "10px",
                                        }
                                        : {
                                            backgroundColor: "#008000",
                                            borderRadius: "50%",
                                            padding: "10px",
                                        }
                                }
                                title={
                                    savedAttendance == 2
                                        ? "Check In"
                                        : "Check Out"
                                }
                            >
                                {savedAttendance === 2 ||
                                    savedAttendance === 0 ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#1f1f1f"
                                    >
                                        <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z" />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#fff"
                                    >
                                        <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="h-text">
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}>
                                <p style={{ marginBottom: "0", fontSize: "14px" }}>{profileDetail?.username}</p>
                            </div>
                            <div className="message">
                                {profileDetail?.registration_flag != "1" ? (
                                    <p style={{ fontSize: "14px" }}>{profileDetail?.recovery_mobile}</p>
                                ) : (
                                    <p style={{ fontSize: "14px" }}>{profileDetail?.recovery_email}</p>
                                )}
                            </div>
                        </div>
                        <div style={{ position: "relative" }}>
                            <div
                                className="imgBox"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDropdownOpen(!dropdownOpen);
                                }}
                            >
                                {profileDetail?.profile_pic ? (
                                    <img
                                        src={`${profileDetail?.profile_pic}`}
                                        alt=""
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />
                                ) : (
                                    <img src={noImage} alt="" style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                    }} />
                                )}
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    top: "50px",
                                    right: "0",
                                    zIndex: 1001,
                                    display: dropdownOpen ? "block" : "none",
                                }}
                            >
                                <ul
                                    className="dropLeft"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        listStyle: "none",
                                        margin: 0,
                                        padding: "5px 0",
                                        background: "#fff",
                                        borderRadius: "10px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                        minWidth: "140px",
                                    }}
                                >
                                    <li
                                        className="listItem"
                                        role="button"
                                        data-bs-toggle="modal"
                                        data-bs-target="#exampleModalSec"
                                        onClick={() => setIsCloseConfirmation(true)}
                                        style={{ color: "#FF0000" }}
                                    >
                                        Log out
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isCloseConfirmation && (
                <ConfirmationModal
                    show={isCloseConfirmation}
                    onHide={() => setIsCloseConfirmation(false)}
                    handleSubmit={handleLogout}
                    title={"Log Out?"}
                    message={"Are you sure you want to log out?"}
                    btn1="CANCEL"
                    btn2="LOG OUT"
                />
            )}
            {isOpenCreateModel && (
                <CreateTaskView
                    show={isOpenCreateModel}
                    onHide={() => {
                        setIsCreateModel(false)
                    }}
                    // onHide={() => setIsCreateModel(false)}
                    setTargetVsIncentiveList={setTargetVsIncentiveList}
                    setLoading={setLoading}
                    headerName={
                        supportTicketFlag == 0 ? "Create Task" : "Create Support Ticket"
                    }
                    productToEdit={undefined}
                    selectedButton={selectedButton}
                    selectedStageStatusId={Number(selectedStageStatusId)}
                    selectedPriorityId={selectedPriorityId || undefined}
                    selectedButtonDue={selectedButtonDue}
                    supportTicketFlag={supportTicketFlag}
                />
            )}

            {isCreateContact && (
                <CreateContactView
                    show={isCreateContact}
                    onHide={() => {
                        setIsCreateContact(false);
                    }}
                    setContact={setRefreshContact}
                    headerName={"Create Contact"}
                />
            )}
            {isSetReminderConfirmation && (
                <ReminderModal
                    show={isSetReminderConfirmation}
                    onHide={() => {
                        setIsSetReminderConfirmation(false);
                    }}
                    handleSubmit={(data) =>
                        handleSetReminder({
                            ...data,
                            referenceTable:
                                isReminderConfirmationStatusData?.reference_table || "",
                            referenceId:
                                isReminderConfirmationStatusData?.reference_id || 0,
                        })
                    }
                    title={"Set Reminder"}
                    message={"Set a new reminder"}
                    btn1="CANCEL"
                    btn2="Set Reminder"
                    remarkMsg={isReminderConfirmationStatusData?.remark || ""}
                    request_flag={
                        isReminderConfirmationStatusData?.reference_table ===
                            "contact_message_histories"
                            ? "2"
                            : ""
                    }
                    ContactMessageId={
                        isReminderConfirmationStatusData?.reference_table ===
                            "contact_message_histories"
                            ? isReminderConfirmationStatusData?.reference_id
                            : undefined
                    }
                />
            )}
        </>
    );
};

export default UpperView;