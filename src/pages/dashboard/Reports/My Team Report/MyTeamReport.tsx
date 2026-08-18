import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCompanyStore } from "../../../../store/company/useCompanyStore";
import ListEmpAccountTransactionView from "../../../left-side/header/Setting/employee-account-transaction/EmpAccountTransactionView";
import ExpenseView from "../../../left-side/header/Setting/expense/ExpenseView";
import LeaveView from "../../../left-side/header/Setting/leave/LeaveView";
import VisitView from "../../../left-side/header/Setting/visits/VisitView";
import AttendanceHistory from "../../../left-side/list-company/AttendanceHistory";
import CreateTeamMemBerModal from "../../../left-side/list-company/CreateTeamMemBerModal";
import EditTeamMemberView from "../../../left-side/list-company/EditTeam";
import { ITeamMember } from "../../../left-side/list-company/EditTeamMemberController";
import { companyTeamListRemove, deactivateTeamPerson, fetchCompanyApi, fetchCompanyTeamApi, ICompany, ICompanyTeam } from "../../../left-side/list-company/ListCompanyController";
import TeamRightsView from "../../../left-side/list-company/TeamRightsView";
import TrackView from "../../../left-side/list-company/TrackView";

interface IPropsMyTeamReport {
    isCompanyOpen: boolean;
    onHide?: () => void;
}

const MyTeamReport = ({
    isCompanyOpen,
    onHide
}: IPropsMyTeamReport) => {
    const [loading, setLoading] = useState(false);
    const [myTeamList, setMyTeamList] = useState<ICompanyTeam[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [otp, setShowOtp] = useState(false);

    const [hasOneData, setHasOneData] = useState<number | null>(null);
    const [companyTeamListDropdownOpen, setCompanyTeamListDropdownOpen] =
        useState<number | null>(null);
    const [selectedTeamMember, setSelectedTeamMember] = useState<any>(null);
    const dropdownCompanyListRef = useRef<
        Record<number, HTMLUListElement | null>
    >({});
    const [isTeamMemberFormOpen, setIsTeamMemberFormOpen] = useState(false);
    const [isTeamRightsOpen, setIsTeamRightsOpen] = useState(false);
    const [companyTeamInfo, setCompanyTeamInfo] = useState<ICompanyTeam>();
    const [isOpenTracking, setIsOpenTracking] = useState(false);
    const [isOpenAttendanceHistory, setIsOpenAttendanceHistory] = useState(false);
    const [showAccountTransaction, setShowAccountTransaction] = useState(false);
    const [accountTransactionTeamid, setAccountTransactionTeamid] = useState(0);
    const [showVisit, setShowVisit] = useState(false);
    const [visitId, setVisitId] = useState(0);
    const [showExpense, setShowExpense] = useState(false);
    const [expenseTeamid, setexpenseTeamid] = useState(0);
    const [showLeave, setShowLeave] = useState(false);
    const [leaveTeamid, setLeaveTeamid] = useState(0);
    const [deactiveEmployeeId, setDeactiveEmployeeId] = useState<number>();
    const [deactiveEmployeeFlag, setDeactiveEmployeeFlag] = useState<number>();
    const [isDeactivateEmployee, setIsDeactivateEmployee] = useState(false);
    const [companyTeamListId, setCompanyTeamListId] = useState<number>();
    const [
        isRemoveCompanyTeamListConfirmation,
        setIsRemoveCompanyTeamListConfirmation,
    ] = useState(false);
    const [isCreateTeamMemberModalOpen, setIsCreateTeamMemberModalOpen] =
        useState(false);

    const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
    const [noDataFound, setNoDataFound] = useState();
    const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();

    const companyInfo = useCompanyStore((state) => state.companyInfo);

    const a_application_login_id = Number(localStorage.getItem("UUID"));

    const canViewAttendance = useCheckUserPermission(
        PAGE_ID.ATTENDANCE,
        PERMISSION_TYPE.VIEW,
    );
    const canAddAttendance = useCheckUserPermission(
        PAGE_ID.ATTENDANCE,
        PERMISSION_TYPE.ADD,
    );
    const canApproveAttendance = useCheckUserPermission(
        PAGE_ID.ATTENDANCE,
        PERMISSION_TYPE.APPROVE,
    );
    const canImportAttendance = useCheckUserPermission(
        PAGE_ID.ATTENDANCE,
        PERMISSION_TYPE.IMPORT,
    );
    const canViewLocation = useCheckUserPermission(
        PAGE_ID.LOCATION_SERVICE,
        PERMISSION_TYPE.VIEW,
    );
    const CanAddTeamMember = useCheckUserPermission(
        PAGE_ID.TEAM_MEMBER_WITH_ACCESS_RIGHT,
        PERMISSION_TYPE.ADD,
    );

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        username: {
            value: null,
            matchMode: "contains",
        },
        recovery_mobile: {
            value: null,
            matchMode: "contains",
        },
        recovery_email: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEscapeKey(() => {
        if (
            !isCreateTeamMemberModalOpen &&
            !companyTeamListDropdownOpen &&
            !isTeamMemberFormOpen &&
            !isTeamRightsOpen &&
            !isOpenTracking &&
            !isOpenAttendanceHistory &&
            !showVisit &&
            !showExpense &&
            !showLeave &&
            !showAccountTransaction &&
            !isDeactivateEmployee &&
            !isRemoveCompanyTeamListConfirmation
        ) {
            onHide?.();
        } else {
            setIsCreateTeamMemberModalOpen(false);
            setCompanyTeamListDropdownOpen(null);
            setIsTeamMemberFormOpen(false);
            setIsTeamRightsOpen(false);
            setIsOpenTracking(false);
            setIsOpenAttendanceHistory(false);
            setShowVisit(false);
            setShowExpense(false);
            setShowLeave(false);
            setShowAccountTransaction(false);
            setIsDeactivateEmployee(false);
            setIsRemoveCompanyTeamListConfirmation(false);
        }
    })

    useEffect(() => {
        const fetchCompany = async () => {
            await fetchCompanyApi(
                (items: any) => {
                    // Sort so the active workspace always comes first.
                    // companyLists[0] is used for company_flag permission checks —
                    // it must reflect the active workspace, not always the main company.
                    const activeCompanyId = Number(localStorage.getItem("COMPANY_ID"));
                    if (activeCompanyId && Array.isArray(items)) {
                        const sorted = [...items].sort((a: any, b: any) => {
                            if (a.id === activeCompanyId) return -1;
                            if (b.id === activeCompanyId) return 1;
                            return 0;
                        });
                        setCompanyLists(sorted);
                    } else {
                        setCompanyLists(items);
                    }
                },
                "",
                setNoDataFound,
                setCompanyJoinOrCreate,
                setLoading
            );
        }

        fetchCompany();
    }, []);

    useEffect(() => {
        fetchCompanyTeamApi(setMyTeamList, companyInfo?.company_id, "");
    }, []);

    const toggleDropdownCompanyList = (id: number) => {
        if (companyTeamListDropdownOpen === id) {
            setCompanyTeamListDropdownOpen(null);
            setHasOneData(null);
        } else {
            setCompanyTeamListDropdownOpen(id);
            setHasOneData(id);
        }
    };

    // const handleClickOutside = (event: MouseEvent) => {
    //     const target = event.target as HTMLElement;

    //     const clickedOnButton = target.closest(".icon-more");
    //     if (clickedOnButton) return;

    //     const clickedInsideDropdown = Object.values(
    //         dropdownCompanyListRef.current,
    //     ).some((ref) => ref && ref.contains(target));

    //     if (!clickedInsideDropdown) {
    //         setCompanyTeamListDropdownOpen(null);
    //         setHasOneData(null);
    //     }
    // };

    // useEffect(() => {
    //     document.addEventListener("mousedown", handleClickOutside);
    //     return () => {
    //         document.removeEventListener("mousedown", handleClickOutside);
    //     };
    // }, []);

    // useEffect(() => {
    //     const handleEscKey = (event: KeyboardEvent) => {
    //         if (event.key === "Escape") {
    //             setCompanyTeamListDropdownOpen(null);
    //         }
    //     };

    //     document.addEventListener("keydown", handleEscKey);

    //     return () => {
    //         document.removeEventListener("keydown", handleEscKey);
    //     };
    // }, []);

    const openEditTeamMemberForm = (item: ICompanyTeam) => {
        setSelectedTeamMember(item);
        setIsTeamMemberFormOpen(true);
    };

    const handleChange = (item: ICompanyTeam) => {
        setIsTeamRightsOpen(true);
        setCompanyTeamInfo(item);
    };

    const handleTracking = (item: ICompanyTeam) => {
        if (canViewLocation) {
            setIsOpenTracking(true);
            setCompanyTeamInfo(item);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleAttendanceHistory = (item: ICompanyTeam) => {
        if (canViewAttendance) {
            setIsOpenAttendanceHistory(true);
            setCompanyTeamInfo(item);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    function openAccountTransaction(item: ICompanyTeam) {
        setShowAccountTransaction(true);
        setAccountTransactionTeamid(item.id);
        setCompanyTeamInfo(item);
    }

    function openVisit(id: number) {
        setShowVisit(true);
        setVisitId(id);
    }

    function openExpense(id: number) {
        setShowExpense(true);
        setexpenseTeamid(id);
    }

    function openLeave(id: number) {
        setShowLeave(true);
        setLeaveTeamid(id);
    }

    const closeIfAnyPopUpOpenForAnotherEmployee = () => {
        setShowVisit(false);
        setShowExpense(false);
        setShowLeave(false);
        setShowAccountTransaction(false);
    };

    const handelClickDeactiveEmployee = (id: number, f: number | null) => {
        setDeactiveEmployeeId(id);
        setDeactiveEmployeeFlag(f || 0);
        setIsDeactivateEmployee(true);
    };

    const handelRemoveCompanyTeamList = (id: number) => {
        setCompanyTeamListId(id);
        setIsRemoveCompanyTeamListConfirmation(true);
    };

    const handleTeamUpdate = (updatedValues: ITeamMember) => {
        // Update companyTeamLists with the new values
        setMyTeamList((prevLists) =>
            prevLists.map((team) =>
                team.id === updatedValues.id
                    ? {
                        ...team,
                        daily_in_time: updatedValues.daily_in_time,
                        daily_out_time: updatedValues.daily_out_time,
                        reporting_member: updatedValues.reporting_member,
                        department: updatedValues.department,
                    }
                    : team,
            ),
        );

        // Also update companyTeamInfo if it's the same team member
        if (companyTeamInfo?.id === updatedValues.id) {
            setCompanyTeamInfo((prevInfo) =>
                prevInfo
                    ? {
                        ...prevInfo,
                        daily_in_time: updatedValues.daily_in_time,
                        daily_out_time: updatedValues.daily_out_time,
                        reporting_member: updatedValues.reporting_member,
                        department: updatedValues.department,
                    }
                    : prevInfo,
            );
        }
    };

    const openCreateTeamMemBerModal = () => {
        if (CanAddTeamMember) {
            setIsCreateTeamMemberModalOpen(true);
        }
    };

    const actionBodyTemplate = useCallback((rowData: ICompanyTeam) => {
        const isMe = rowData.id === a_application_login_id;
        const isReporting = rowData.reporting_member === a_application_login_id;

        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdownCompanyList(rowData.id);
                        }}
                    />

                    <ul
                        ref={(el) => {
                            if (el) {
                                dropdownCompanyListRef.current[rowData.id] = el;
                            } else {
                                delete dropdownCompanyListRef.current[rowData.id];
                            }
                        }}
                        style={{
                            width: "150px",
                            marginLeft: "18%",
                            height: "auto",
                            display: companyTeamListDropdownOpen === rowData.id && hasOneData === rowData.id ? "block" : "none",
                            position: "absolute",
                            zIndex: 9999,
                            background: "#fff",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                            borderRadius: "6px",
                            padding: "5px 0",
                            listStyle: "none",
                        }}
                    >
                        {(companyLists[0]?.company_flag === 1 || isReporting) && (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCompanyTeamListDropdownOpen(null);
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    openEditTeamMemberForm(rowData);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Edit
                            </li>
                        )}
                        {(companyLists[0]?.company_flag === 1 &&
                            rowData.company_flag !== 1 || isReporting) ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    handleChange(rowData);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Team Rights
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag !== 2 ||
                            rowData.company_flag !== 1 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    handleTracking(rowData);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Location Tracking
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag !== 2 ||
                            rowData?.company_flag !== 1 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    handleAttendanceHistory(rowData);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center", paddingRight: "10%" }}
                            >
                                Attendance History
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag !== 2 ||
                            rowData.company_flag === 2 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    openVisit(rowData.id);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Visits
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag !== 2 ||
                            rowData.company_flag !== 1 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    openExpense(rowData.id);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Expenses
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag !== 2 ||
                            rowData.company_flag !== 1 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    openLeave(rowData.id);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Leaves
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag !== 2 ||
                            rowData.company_flag !== 1 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    openAccountTransaction(rowData);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Account Transaction
                            </li>
                        ) : (
                            ""
                        )}
                        {companyLists[0]?.company_flag === 1 &&
                            rowData.company_flag !== 1 && (
                                rowData.isActive === 1 ? (
                                    <li
                                        style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeIfAnyPopUpOpenForAnotherEmployee();
                                            setCompanyTeamListDropdownOpen(null);
                                            handelClickDeactiveEmployee(rowData.id, 1);
                                        }}
                                    >
                                        Deactive
                                    </li>
                                ) : (
                                    <li
                                        style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeIfAnyPopUpOpenForAnotherEmployee();
                                            setCompanyTeamListDropdownOpen(null);
                                            handelClickDeactiveEmployee(rowData.id, 2);
                                        }}
                                    >
                                        Active
                                    </li>
                                )
                            )}
                        {companyLists[0]?.company_flag === 1 &&
                            rowData.company_flag !== 1 ? (
                            <li
                                style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeIfAnyPopUpOpenForAnotherEmployee();
                                    handelRemoveCompanyTeamList(rowData.id);
                                    setCompanyTeamListDropdownOpen(null);
                                    setHasOneData(null);
                                }}
                            >
                                Remove
                            </li>
                        ) : (
                            ""
                        )}
                    </ul>
                </>
            </div>
        );
    }, [companyTeamListDropdownOpen]);

    return (
        <>
            <div
                style={{
                    height: "100%",
                }}
            >
                {isCompanyOpen ? (
                    <div>
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                            <h3
                                style={{ fontSize: "20px", paddingLeft: "12px" }}
                                className="dash-board-text-count"
                            >
                                My Team
                            </h3>
                            <div className="d-flex gap-2 align-items-center">

                                <Button
                                    icon="pi pi-plus"
                                    className="report_button"
                                    style={{ backgroundColor: "rgb(245, 134, 52)" }}
                                    rounded
                                    onClick={openCreateTeamMemBerModal}
                                    tooltip={`Add Team Member`}
                                    tooltipOptions={{
                                        position: "left",
                                        style: {
                                            fontSize: "14px",
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className="report_card"
                            style={{
                                height: "90vh",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <DataTable
                                value={myTeamList}
                                loading={loading}
                                resizableColumns
                                columnResizeMode="fit"
                                scrollable
                                scrollHeight="flex"
                                className="custom-centered-table"
                                tableStyle={{ tableLayout: "fixed", width: "100%" }}
                                emptyMessage="No data found"
                                filterDisplay="row"
                                filters={filters}
                                onFilter={onFilter}
                                key={companyTeamListDropdownOpen}
                            >
                                <Column
                                    field="actions"
                                    // header="Actions"
                                    headerClassName="center-header"
                                    headerStyle={{
                                        width: "30px",
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 1,
                                    }}
                                    body={actionBodyTemplate}
                                />
                                <Column
                                    field="username"
                                    header={
                                        <span>
                                            Team Member
                                        </span>
                                    }
                                    sortable
                                    filter
                                    filterPlaceholder="Search"
                                    filterMatchMode="contains"
                                    headerStyle={{
                                        width: "200px",
                                        background: "#f8f9fa",
                                        fontSize: "14px",
                                    }}
                                    bodyStyle={{ fontSize: "14px" }}
                                    body={(rowData: ICompanyTeam) => {
                                        return (
                                            <span>
                                                <span style={{ marginRight: "5px" }}>{rowData.username}</span>{rowData.company_flag === 1 && <span className="badge rounded-pill" style={{ backgroundColor: "#808080" }}>Owner</span>}
                                            </span>
                                        );
                                    }}
                                />
                                <Column
                                    field="recovery_mobile"
                                    header={
                                        <span>
                                            Mobile
                                        </span>
                                    }
                                    sortable
                                    filter
                                    filterPlaceholder="Search"
                                    filterMatchMode="contains"
                                    headerStyle={{
                                        width: "200px",
                                        background: "#f8f9fa",
                                        fontSize: "14px",
                                    }}
                                    bodyStyle={{ fontSize: "14px" }}
                                    body={(rowData: ICompanyTeam) => {
                                        return (
                                            <span>
                                                {rowData.recovery_mobile}
                                            </span>
                                        );
                                    }}
                                />
                                <Column
                                    field="recovery_email"
                                    header={
                                        <span>
                                            Email
                                        </span>
                                    }
                                    sortable
                                    filter
                                    filterPlaceholder="Search"
                                    filterMatchMode="contains"
                                    headerStyle={{
                                        width: "200px",
                                        background: "#f8f9fa",
                                        fontSize: "14px",
                                    }}
                                    bodyStyle={{ fontSize: "14px" }}
                                    body={(rowData: ICompanyTeam) => {
                                        return (
                                            <span>
                                                {rowData.recovery_email}
                                            </span>
                                        );
                                    }}
                                />
                            </DataTable>
                        </div>
                    </div>
                ) : null}
                {isCreateTeamMemberModalOpen && companyLists?.[0] && (
                    <CreateTeamMemBerModal
                        onClose={() => {
                            setIsCreateTeamMemberModalOpen(false);
                        }}
                        onSuccess={() => setShowOtp(false)} // Keep modal open, show OTP view
                        onOtpSuccess={() => {
                            if (!companyLists?.[0]?.id) return;

                            fetchCompanyTeamApi(
                                setMyTeamList,
                                companyLists?.[0]?.id,
                                "",
                            );
                            setIsCreateTeamMemberModalOpen(false);
                        }}
                        company_id={companyLists?.[0]?.id ?? 0}
                    />
                )}
                {isTeamMemberFormOpen && (
                    <EditTeamMemberView
                        show={isTeamMemberFormOpen}
                        onHide={() => {
                            setIsTeamMemberFormOpen(false);
                            setSelectedTeamMember(null);
                            fetchCompanyTeamApi(setMyTeamList, companyInfo?.company_id, "");
                        }}
                        companyTeamInfo={selectedTeamMember}
                        planId={companyLists?.[0]?.plan_id}
                        onUpdate={handleTeamUpdate}
                    />
                )}
                {isTeamRightsOpen && (
                    <TeamRightsView
                        show={isTeamRightsOpen}
                        onHide={() => setIsTeamRightsOpen(false)}
                        companyTeamInfo={companyTeamInfo}
                        companyTeamList={myTeamList}
                    />
                )}
                {isOpenTracking ? (
                    <TrackView
                        show={isOpenTracking}
                        onHide={() => setIsOpenTracking(false)}
                        DateAndId=""
                        companyTeamInfo={companyTeamInfo}
                    />
                ) : null}
                {isOpenAttendanceHistory && (
                    <AttendanceHistory
                        show={isOpenAttendanceHistory}
                        onHide={() => setIsOpenAttendanceHistory(false)}
                        companyTeamInfo={companyTeamInfo}
                    />
                )}
                {isDeactivateEmployee && (
                    <ConfirmationModal
                        show={isDeactivateEmployee}
                        onHide={() => setIsDeactivateEmployee(false)}
                        handleSubmit={() =>
                            deactivateTeamPerson(
                                deactiveEmployeeId,
                                deactiveEmployeeFlag,
                                setIsDeactivateEmployee,
                                setMyTeamList,
                                companyLists?.[0]?.id ?? 0,
                            )
                        }
                        title={`${deactiveEmployeeFlag == 1 ? "deactivate" : "activate"} this Team member`}
                        message={`Are You Sure You Want To ${deactiveEmployeeFlag == 1 ? "deactivate" : "activate"} This Team member?`}
                        btn1="CANCEL"
                        btn2="Remove"
                    />
                )}
                {isRemoveCompanyTeamListConfirmation && (
                    <ConfirmationModal
                        show={isRemoveCompanyTeamListConfirmation}
                        onHide={() => setIsRemoveCompanyTeamListConfirmation(false)}
                        handleSubmit={() =>
                            companyTeamListRemove(
                                companyTeamListId,
                                setIsRemoveCompanyTeamListConfirmation,
                                setMyTeamList,
                                companyLists?.[0]?.id,
                            )
                        }
                        title={"Remove this Team member"}
                        message={"Are You Sure You Want To Remove This Team member?"}
                        btn1="CANCEL"
                        btn2="Remove"
                    />
                )}
            </div>
            {showVisit && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "30vw",
                        minWidth: "350px",
                        height: "100%",
                        zIndex: 9999,
                        background: "#fff",
                        boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
                    }}
                >
                    <VisitView
                        isVisitView={showVisit}
                        closeVisitView={() => setShowVisit(false)}
                        team_id={visitId}
                    />
                </div>
            )}
            {showExpense && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "30vw",
                        minWidth: "350px",
                        height: "100%",
                        zIndex: 9999,
                        background: "#fff",
                        boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
                    }}
                >
                    <ExpenseView
                        isExpenseView={showExpense}
                        closeExpenseView={() => setShowExpense(false)}
                        team_id={expenseTeamid}
                    />
                </div>
            )}
            {showLeave && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "30vw",
                        minWidth: "350px",
                        height: "100%",
                        zIndex: 9999,
                        background: "#fff",
                        boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
                    }}
                >
                    <LeaveView
                        isLeaveView={showLeave}
                        closeLeaveView={() => setShowLeave(false)}
                        team_id={leaveTeamid}
                    />
                </div>
            )}
            {showAccountTransaction && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "30vw",
                        minWidth: "350px",
                        height: "100%",
                        zIndex: 9999,
                        background: "#fff",
                        boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
                    }}
                >
                    <ListEmpAccountTransactionView
                        isListAccountTransaction={showAccountTransaction}
                        closeListAccountTransaction={() => setShowAccountTransaction(false)}
                        teamId={accountTransactionTeamid}
                        companyTeamInfo={companyTeamInfo}
                    />
                </div>
            )}
        </>
    );
};

export default MyTeamReport;