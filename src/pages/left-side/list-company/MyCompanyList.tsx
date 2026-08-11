import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  convertDateTimeFormat,
  useEscapeKey
} from "../../../common/SharedFunction";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import ImportExcelForContactModal from "../../../components/model/ImportExcelForContactModal";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import ListEmpAccountTransactionView from "../header/Setting/employee-account-transaction/EmpAccountTransactionView";
import ExpenseView from "../header/Setting/expense/ExpenseView";
import LeaveView from "../header/Setting/leave/LeaveView";
import VisitView from "../header/Setting/visits/VisitView";
import AttendanceHistory from "./AttendanceHistory";
import CreateTeamMemBerModal from "./CreateTeamMemBerModal";
import EditTeamMemberView from "./EditTeam";
import { ITeamMember } from "./EditTeamMemberController";
import {
  companyTeamListRemove,
  deactivateTeamPerson,
  fetchCompanyTeamApi,
  ICompanyTeam,
  insertAttendance
} from "./ListCompanyController";
import TeamRightsView from "./TeamRightsView";
import TrackView from "./TrackView";

interface IPropsCompany {
  isCompanyOpen: boolean;
  closeCompany: () => void;
  companyInfo: any;
  searchTermFromRightSide: string;
  setSearchTermFromRightSide: (data: string) => void;
}

const MyCompanyList = ({
  isCompanyOpen,
  closeCompany,
  companyInfo,
  searchTermFromRightSide,
  setSearchTermFromRightSide
}: IPropsCompany) => {

  const dropdownCompanyListRef = useRef<
    Record<number, HTMLUListElement | null>
  >({});
  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
  const [companyTeamListDropdownOpen, setCompanyTeamListDropdownOpen] =
    useState<any>(null);
  const [hasOneData, setHasOneData] = useState<number | null>(null);
  const [
    isRemoveCompanyTeamListConfirmation,
    setIsRemoveCompanyTeamListConfirmation,
  ] = useState(false);
  const [isDeactivateEmployee, setIsDeactivateEmployee] = useState(false);
  const [isTeamRightsOpen, setIsTeamRightsOpen] = useState(false);
  const [isOpenTracking, setIsOpenTracking] = useState(false);
  const [companyTeamInfo, setCompanyTeamInfo] = useState<ICompanyTeam>();

  const [companyTeamListId, setCompanyTeamListId] = useState<number>();
  const [deactiveEmployeeId, setDeactiveEmployeeId] = useState<number>();
  const [deactiveEmployeeFlag, setDeactiveEmployeeFlag] = useState<number>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hover, setHover] = useState(false);
  const [isOpenAttendanceHistory, setIsOpenAttendanceHistory] = useState(false);
  const [isModalExcelVisible, setIsModalExcelVisible] =
    useState<boolean>(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [showAccountTransaction, setShowAccountTransaction] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [visitId, setVisitId] = useState(0);
  const [expenseTeamid, setexpenseTeamid] = useState(0);
  const [leaveTeamid, setLeaveTeamid] = useState(0);
  const [accountTransactionTeamid, setAccountTransactionTeamid] = useState(0);
  const [isTeamMemberFormOpen, setIsTeamMemberFormOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<any>(null);
  const [isCreateTeamMemberModalOpen, setIsCreateTeamMemberModalOpen] =
    useState(false);
  const [otp, setShowOtp] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [teamAttendanceStatus, setTeamAttendanceStatus] = useState<Record<number, number>>({});

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
  // escape handle
  useEscapeKey(() => {
    if (
      !isOpenAttendanceHistory &&
      !isOpenTracking &&
      !showVisit &&
      !showExpense &&
      !showLeave &&
      !showAccountTransaction &&
      !isCreateTeamMemberModalOpen &&
      !isTeamMemberFormOpen
    ) {
      closeCompany();
    } else {
      setIsOpenAttendanceHistory(false);
      setIsOpenTracking(false);
      setShowVisit(false);
      setShowExpense(false);
      setShowLeave(false);
      setShowAccountTransaction(false);
      setIsCreateTeamMemberModalOpen(false);
      setIsTeamMemberFormOpen(false);
    }
  });

  // useEffect(() => {
  //   fetchCompanyTeamApi(setCompanyTeamLists, companyInfo?.id, "");
  // }, [companyInfo?.id]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const GetID = localStorage.getItem("UUID");
      const activeCompanyId = localStorage.getItem("COMPANY_ID");
      const targetCompanyId = activeCompanyId ? Number(activeCompanyId) : companyInfo?.id;

      const requestData = {
        company_masters_id: targetCompanyId,
        searchTerm: "",
      };

      try {
        const res = await axiosInstance.post("my-team", requestData, {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": `${GetID}`,
            ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
          },
        });

        const teamData = res.data.data.item || [];

        setCompanyTeamLists(teamData);

        // ✅ IMPORTANT: map attendance
        const map: Record<number, number> = {};
        teamData.forEach((item: any) => {
          map[item.id] = item.attendance_status ?? 2;
        });

        setTeamAttendanceStatus(map);

      } catch (err) {
        toast.error("Failed to load team");
      }
    };

    fetchData();
  }, [companyInfo?.id]);

  const toggleDropdownCompanyList = (id: number) => {
    if (companyTeamListDropdownOpen === id) {
      setCompanyTeamListDropdownOpen(null);
      setHasOneData(null);
    } else {
      setCompanyTeamListDropdownOpen(id);
      setHasOneData(id);
    }
  };
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".icon-more");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownCompanyListRef.current,
    ).some((ref) => ref && ref.contains(target));

    if (!clickedInsideDropdown) {
      setCompanyTeamListDropdownOpen(null);
      setHasOneData(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setCompanyTeamListDropdownOpen(null);
    setHasOneData(null);
  }, [companyTeamLists.length]);

  const handelRemoveCompanyTeamList = (id: number) => {
    setCompanyTeamListId(id);
    setIsRemoveCompanyTeamListConfirmation(true);
  };

  useEffect(() => {
    setCompanyTeamListDropdownOpen(null);
    setHasOneData(null);

    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 3 || searchTerm === "") {
        fetchCompanyTeamApi(setCompanyTeamLists, companyInfo?.id, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [companyInfo?.id, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
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

  const openModelImport = () => {
    if (canImportAttendance) {
      setIsModalExcelVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmImportExcel = async () => {
    setIsModalExcelVisible(false);
    fetchCompanyTeamApi(setCompanyTeamLists, companyInfo?.id, "");
  };

  function openExpense(id: number) {
    setShowExpense(true);
    setexpenseTeamid(id);
  }
  function openLeave(id: number) {
    setShowLeave(true);
    setLeaveTeamid(id);
  }
  function openAccountTransaction(item: ICompanyTeam) {
    setShowAccountTransaction(true);
    setAccountTransactionTeamid(item.id);
    setCompanyTeamInfo(item);
  }

  function openVisit(id: number) {
    setShowVisit(true);
    setVisitId(id);
  }

  const openEditTeamMemberForm = (item: ICompanyTeam) => {
    setSelectedTeamMember(item);
    setIsTeamMemberFormOpen(true);
  };

  const handelClickDeactiveEmployee = (id: number, f: number | null) => {
    setDeactiveEmployeeId(id);
    setDeactiveEmployeeFlag(f || 0);
    setIsDeactivateEmployee(true);
  };

  const fetchPageRights = async () => {
    const companyId = companyInfo?.id;

    if (!companyId) {
      toast.warn("Company master ID is missing");
      return;
    }

    if (!Number.isInteger(companyId) || companyId <= 0) {
      toast.error("Invalid company master ID");
      return;
    }

    setApiLoading(true);

    const token = localStorage.getItem("token");

    try {
      // POST – body can be empty if your API doesn't require it
      const response = await axiosInstance.post(
        `pagerights/${companyId}`,    // ← path param
        {},
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(response.data.ack_msg || "Page rights refreshed successfully");
      } else {
        toast.error(response.data.ack_msg || "Failed to refresh page rights");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.ack_msg || err.message || "Network/server error";
      toast.error(msg);
    } finally {
      setApiLoading(false);
    }
  };

  const handleTeamUpdate = (updatedValues: ITeamMember) => {
    // Update companyTeamLists with the new values
    setCompanyTeamLists((prevLists) =>
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
  const a_application_login_id = Number(localStorage.getItem("UUID"));
  const openCreateTeamMemBerModal = () => {
    if (CanAddTeamMember) {
      setIsCreateTeamMemberModalOpen(true);
    }
  };

  const handleMarkAttendance = async (teamMemberId: number) => {
    if (!canAddAttendance) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    const currentStatus = teamAttendanceStatus[teamMemberId] ?? 2;
    const nextStatus = currentStatus === 1 ? 2 : 1;

    try {
      await insertAttendance(nextStatus, teamMemberId);
      setTeamAttendanceStatus((prev) => ({
        ...prev,
        [teamMemberId]: nextStatus,
      }));
    } catch (err) {
      toast.error("Failed to update attendance");
    }
  };

  useEffect(() => {
    if (searchTermFromRightSide === "Add Team") {
      openCreateTeamMemBerModal();
    }
  }, []);

  return (
    <>
      {showVisit ? (
        <VisitView
          isVisitView={showVisit}
          closeVisitView={() => setShowVisit(false)}
          team_id={visitId}
        />
      ) : showExpense ? (
        <ExpenseView
          isExpenseView={showExpense}
          closeExpenseView={() => setShowExpense(false)}
          team_id={expenseTeamid}
          CompanyDetails={companyTeamLists}
        />
      ) : showLeave ? (
        <LeaveView
          isLeaveView={showLeave}
          closeLeaveView={() => setShowLeave(false)}
          team_id={leaveTeamid}
          CompanyDetails={companyTeamLists}
        />
      ) : showAccountTransaction ? (
        <ListEmpAccountTransactionView
          isListAccountTransaction={showAccountTransaction}
          closeListAccountTransaction={() => setShowAccountTransaction(false)}
          teamId={accountTransactionTeamid}
          companyTeamInfo={companyTeamInfo}
        />
      ) : isCompanyOpen ? (
        <>
          <div
            className="notifications animate__animated animate__fadeInLeft"
            id="notifications"
          >
            {/* <!-- Header --> */}
            <div className="header-Chat justify-content-between">
              {/* <!-- Icons --> */}
              <div className="d-flex ">
                <div className="ICON">
                  <div
                    aria-disabled="false"
                    role="button"
                    className="icons"
                    data-tab="2"
                    title="Back"
                    aria-label="New chat"
                    onClick={closeCompany}
                  >
                    <span data-testid="chat" data-icon="chat" className="">
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                        ></path>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="newText">
                  <h2>
                    {/* {companyInfo.company_name} */}
                    My Team
                    {/* <p style={{ fontSize: "14px", fontWeight: "300" }}>
                      Invitation Key : {companyInfo.invitation_key}
                    </p> */}
                  </h2>
                </div>
              </div>
              <div className="ICON d-flex align-items-center gap-2">
                <button
                  style={{ backgroundColor: "rgb(255, 125, 18)" }}
                  className="btn btn-sm text-white d-flex align-items-center gap-2"
                  onClick={fetchPageRights}
                  disabled={apiLoading}
                  title="Sync Page Rights"
                >
                  {apiLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Refreshing...
                    </>
                  ) : (
                    <svg width="30" height="30" viewBox="0 0 50 50">
                      <path
                        fill="currentColor"
                        d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                      />
                      <path
                        fill="currentColor"
                        d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                      />
                      <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                      <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                    </svg>
                  )}
                </button>
                {companyInfo.company_flag === 1 && (

                  <button
                    className="icons text-white p-1"
                    onClick={openCreateTeamMemBerModal}
                  >
                    <span title="Add Team">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="26px"
                        viewBox="0 -960 960 960"
                        width="26px"
                        fill="currentColor"
                      >
                        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                      </svg>
                    </span>
                  </button>
                )}
                <button className="icons text-light" onClick={openModelImport}>
                  <span title="Import Attendance">
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path d="m720-120 160-160-56-56-64 64v-167h-80v167l-64-64-56 56 160 160ZM560 0v-80h320V0H560ZM240-160q-33 0-56.5-23.5T160-240v-560q0-33 23.5-56.5T240-880h280l240 240v121h-80v-81H480v-200H240v560h240v80H240Zm0-80v-560 560Z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            <div className="h-text">
              <div className="head">
                <div className="search-bar ">
                  <div className="add-source-of-type-section ">
                    <input
                      type="text"
                      title="Add Source Of Type"
                      placeholder="Search Team Member"
                      maxLength={BIG_TEXT_LENGTH}
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    {searchTerm && (
                      <span
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                        style={{
                          position: "absolute",
                          right: "15px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: hover ? "#111827" : "#9ca3af"
                        }}
                        onClick={() => setSearchTerm("")}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="chats" style={{ overflowY: "unset" }}>
              {companyTeamLists.map((item) => {
                const currentStatus = teamAttendanceStatus[item.id] ?? 2;
                const isMe = item.id === a_application_login_id;
                const isReporting = item.reporting_member === a_application_login_id;
                const createdTime = item.created_date_time ? convertDateTimeFormat(item.created_date_time).date : "";

                return (
                  <div key={item.id}>
                    {/* Dropdown Menu */}
                    {(companyInfo.company_flag === 1 || isMe || isReporting) && (

                      <ul
                        className={`labelDropLeft-myteam labelDropLeft ${hasOneData === item.id &&
                          companyTeamListDropdownOpen === item.id
                          ? "isVisible"
                          : "isHidden"
                          } `}
                        ref={(el) => {
                          if (el) {
                            dropdownCompanyListRef.current[item.id] = el;
                          } else {
                            delete dropdownCompanyListRef.current[item.id];
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(companyInfo.company_flag === 1 || isReporting) && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditTeamMemberForm(item);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          >
                            Edit
                          </li>
                        )}

                        {(companyInfo.company_flag === 1 &&
                          item.company_flag !== 1 || isReporting) ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChange(item);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          >
                            Team Rights
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag !== 2 ||
                          item.company_flag !== 1 ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTracking(item);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          >
                            Location Tracking
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag !== 2 ||
                          item.company_flag !== 1 ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAttendanceHistory(item);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                            style={{
                              paddingRight: "10%",
                            }}
                          >
                            Attendance History
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag !== 2 ||
                          item.company_flag === 2 ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openVisit(item.id);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          // onClick={openVisit}
                          >
                            Visits
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag !== 2 ||
                          item.company_flag !== 1 ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openExpense(item.id);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          >
                            Expenses
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag !== 2 ||
                          item.company_flag !== 1 ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLeave(item.id);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          >
                            Leaves
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag !== 2 ||
                          item.company_flag !== 1 ? (
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAccountTransaction(item);
                              setCompanyTeamListDropdownOpen(null);
                              setHasOneData(null);
                            }}
                          >
                            Account Transaction
                          </li>
                        ) : (
                          ""
                        )}
                        {companyInfo.company_flag === 1 &&
                          item.company_flag !== 1 && (
                            item.isActive === 1 ? (
                              <li
                                style={{ color: "red", fontWeight: "600" }}
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handelClickDeactiveEmployee(item.id, 1);
                                }}
                              >
                                Deactive
                              </li>
                            ) : (
                              <li
                                style={{ color: "green", fontWeight: "600" }}
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handelClickDeactiveEmployee(item.id, 2);
                                }}
                              >
                                Active
                              </li>
                            )
                          )}
                        {companyInfo.company_flag === 1 &&
                          item.company_flag !== 1 ? (
                          <li
                            style={{ color: "red", fontWeight: "600" }}
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handelRemoveCompanyTeamList(item.id);
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
                    )}

                    <div className="block chat-list">
                      <div className="imgBox">
                        <div className="userImg" style={{ marginLeft: "3px" }}>
                          {item?.profile_pic ? (
                            <img src={item.profile_pic} alt="Avatar" className="cover" />
                          ) : (
                            <img src={require("../../../assets/images/no_image.jpeg")} alt="Avatar" className="cover" />
                          )}
                        </div>
                      </div>

                      <div className="h-text">
                        <div className="head d-flex">
                          <h4>
                            <span
                              style={{
                                maxWidth: "180px",           // Adjust this value as needed
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "inline-block",
                                verticalAlign: "middle"
                              }}
                              title={item.username}          // Shows full name on hover (tooltip)
                            >
                              {item.username}
                            </span>
                            {isMe && <span className="badge rounded-pill ml-1" style={{ backgroundColor: "#06923E" }}>Me</span>}
                            {item.company_flag === 1 && <span className="badge rounded-pill ml-1" style={{ backgroundColor: "#808080" }}>Owner</span>}
                            {item.isActive === 0 && <span className="badge rounded-pill ml-1" style={{ backgroundColor: "#f56262" }}>Deactivated</span>}
                          </h4>

                          {/* Attendance Button - Now per team member */}
                          {canApproveAttendance && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAttendance(item.id);
                              }}
                              className="btn text-light rounded-5 fw_500 ms-3"
                              style={
                                currentStatus === 2 || currentStatus === 0
                                  ? {
                                    backgroundColor: "#ccc",
                                    borderRadius: "50%",
                                    padding: "5px",
                                  }
                                  : {
                                    backgroundColor: "#008000",
                                    borderRadius: "50%",
                                    padding: "5px",
                                  }
                              }
                              title={
                                currentStatus == 2
                                  ? "Check In"
                                  : "Check Out"
                              }
                            >
                              {currentStatus === 2 ||
                                currentStatus === 0 ? (
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
                          )}

                          {/* More Options Button */}
                          {(companyInfo.company_flag === 1 || isMe || isReporting) && (
                            <button
                              className="icon-more ms-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdownCompanyList(item.id);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 20" width="19" height="20">
                                <path fill="currentColor" d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="message-chat">
                          <div className="chat-text-icon d-flex flex-column align-items-start">
                            {(companyInfo.company_flag == 1 &&
                              <>
                                <span className="thanks"><strong>Mobile:</strong> {item.recovery_mobile}</span>
                                <span className="thanks"><strong>Email:</strong> {item.recovery_email}</span>
                              </>
                            )}
                            {item.employee_id && (<span className="thanks"><strong>Employee Id:</strong> {item.employee_id}</span>)}
                          </div>
                          <div className="text-end col-3">
                            <p className="contact-text">
                              {item.created_date_time && (
                                <span>
                                  <strong>Created On:</strong>
                                  <br />
                                  {createdTime}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isRemoveCompanyTeamListConfirmation && (
            <ConfirmationModal
              show={isRemoveCompanyTeamListConfirmation}
              onHide={() => setIsRemoveCompanyTeamListConfirmation(false)}
              handleSubmit={() =>
                companyTeamListRemove(
                  companyTeamListId,
                  setIsRemoveCompanyTeamListConfirmation,
                  setCompanyTeamLists,
                  companyInfo.id,
                )
              }
              title={"Remove this Team member"}
              message={"Are You Sure You Want To Remove This Team member?"}
              btn1="CANCEL"
              btn2="Remove"
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
                  setCompanyTeamLists,
                  companyInfo.id,
                )
              }
              title={`${deactiveEmployeeFlag == 1 ? "deactivate" : "activate"} this Team member`}
              message={`Are You Sure You Want To ${deactiveEmployeeFlag == 1 ? "deactivate" : "activate"} This Team member?`}
              btn1="CANCEL"
              btn2="Remove"
            />
          )}

          <TeamRightsView
            show={isTeamRightsOpen}
            onHide={() => setIsTeamRightsOpen(false)}
            companyTeamInfo={companyTeamInfo}
          />
        </>
      ) : null}

      {isOpenAttendanceHistory && (
        <AttendanceHistory
          show={isOpenAttendanceHistory}
          onHide={() => setIsOpenAttendanceHistory(false)}
          companyTeamInfo={companyTeamInfo}
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

      <EditTeamMemberView
        show={isTeamMemberFormOpen}
        onHide={() => {
          setIsTeamMemberFormOpen(false);
          setSelectedTeamMember(null);
          fetchCompanyTeamApi(setCompanyTeamLists, companyInfo?.id, searchTerm);
        }}
        companyTeamInfo={selectedTeamMember}
        planId={companyInfo.plan_id}
        onUpdate={handleTeamUpdate}
      />

      <ImportExcelForContactModal
        show={isModalExcelVisible}
        onHide={() => setIsModalExcelVisible(false)}
        handleSubmit={() => handleConfirmImportExcel()}
        title={"Import Excel For Attendance"}
        message={"Please Import excel as per sample Attendance"}
        btn1="Cancel"
        btn2="Import"
        sampleLocation="sampleAttendance.xlsx"
        potions={4}
      />

      {isCreateTeamMemberModalOpen && (
        <CreateTeamMemBerModal
          onClose={() => {
            setIsCreateTeamMemberModalOpen(false);
            setSearchTermFromRightSide("");
          }}
          onSuccess={() => setShowOtp(false)} // Keep modal open, show OTP view
          onOtpSuccess={() => {
            fetchCompanyTeamApi(
              setCompanyTeamLists,
              companyInfo?.id,
              searchTerm,
            );
            setIsCreateTeamMemberModalOpen(false); // Close modal after OTP success
          }}
          company_id={companyInfo?.id}
        />
      )}
    </>
  );
};

export default MyCompanyList;
