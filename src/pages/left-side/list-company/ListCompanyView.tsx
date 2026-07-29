import React, { useContext, useEffect, useRef, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import {
  convertDateTimeFormat,
  formatDate,
  useEscapeKey,
} from "../../../common/SharedFunction";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import JoinModal from "../../../components/model/JoinModal";
import { useTheme } from "../../../components/ThemeContext";
import PricingTable from "../../public/payment-gateway/PricingTable";
import CreateCompanyView from "../create-company/CreateCompanyView";
import NewCreateCompanyView from "../new-create-company/NewCreateCompanyView";
import ManageWorkspacesModal from "../../../components/model/ManageWorkspacesModal";
import {
  companyLeave,
  companyMainDelete,
  createVaiLink,
  fetchCompanyApi,
  fetchPlanStatisticsCounts,
  ICompany,
  TCountData,
} from "./ListCompanyController";
import MyCompanyList from "./MyCompanyList";

interface IPropsCompany {
  isCompanyOpen: boolean;
  closeCompany: () => void;
}
interface ITeamRights {
  id: number;
  page_name: string;
  a_page_id_rights_jason: any;
  page_id: number;
}
const ListCompanyView = ({ isCompanyOpen, closeCompany }: IPropsCompany) => {
  const { darkMode, toggleTheme } = useTheme();
  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  const dropdownCompanyRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );

  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState<any>(null);
  const [hasOneData, setHasOneData] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [refersh, setRefresh] = useState(false);
  const [isJoinConfirmation, setIsJoinConfirmation] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [isCreateCompany, setIsCreateCompany] = useState(false);
  const [isLeaveCloseConfirmation, setIsLeaveCloseConfirmation] =
    useState(false);
  const [isDeleteCloseConfirmation, setIsDeleteCloseConfirmation] =
    useState(false);
  const [companyIdToDelete, setCompanyIdToDelete] = useState<Number | null>(
    null,
  );
  const [companyInfo, setCompanyInfo] = useState<ICompany>();
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [noDataFound, setNoDataFound] = useState();
  const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [companyToEdit, setCompanyToiEdit] = useState<ICompany>();
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showNewEditCompany, setShowNewEditCompany] = useState(false);
  const [showManageWorkspaces, setShowManageWorkspaces] = useState(false);
  const [companyIdLeave, setCompanyIdLeave] = useState(0);

  const [showRenewPlan, setShowRenewPlan] = useState(false);
  const [renewPlanItem, setRenewPlanItem] = useState<ICompany>();
  const [currentCompany, setCurrentCompany] = useState<ICompany>();
  const [isOpenQRCodeModal, setIsOpenQRCodeModal] = useState(false);
  const [planStatistics, setPlanStatistics] = useState<TCountData>({
    teamMembers: 0,
    contacts: 0,
    inquiries: 0,
    totalEmails: 0,
    totalSalesOrders: 0,
    totalProducts: 0,
    totalQuotations: 0,
    totalPurchaseInvoices: 0,
    totalSalesInvoices: 0,
    totalSalesB2bPortalInquiries: 0,
    planContactDataLimit: 0,
    planTeamMembersDataLimit: 0,
    PlanInquiriesDataLimit: 0,
    PlanEmailDataLimit: 0,
    PlanSalesOrdersDataLimit: 0,
    PlanProductsDataLimit: 0,
    PlanQuotationsDataLimit: 0,
    PlanPurchaseInvoicesDataLimit: 0,
    PlanSalesInvoicesDataLimit: 0,
    PlanSalesB2bPortalInquiriesDataLimit: 0,
  });

  // escape handle
  // useEscapeKey(closeCompany);
  // escape handle
  useEscapeKey(() => {
    if (
      !showEditCompany &&
      !isDeleteCloseConfirmation &&
      !showCompany &&
      !isLeaveCloseConfirmation
    ) {
      closeCompany();
    } else {
      setShowEditCompany(false);
      setIsDeleteCloseConfirmation(false);
      setShowCompany(false);
      setIsLeaveCloseConfirmation(false);
    }
  });
  useEffect(() => {
    fetchCompanyApi(
      setCompanyLists,
      "",
      setNoDataFound,
      setCompanyJoinOrCreate,
      setLoading,
    );
    // fetchPlanStatisticsCounts(setPlanStatistics,planId);
    // }
  }, []);
  useEffect(() => {
    if (companyLists.length > 0) {
      // Use the active workspace's plan_id, not always the first company.
      const activeCompanyId = Number(localStorage.getItem("COMPANY_ID"));
      const activeCompany = activeCompanyId
        ? companyLists.find((c) => c.id === activeCompanyId)
        : companyLists[0];
      const planId = activeCompany?.plan_id || companyLists[0]?.plan_id;
      if (planId) {
        fetchPlanStatisticsCounts(setPlanStatistics, planId);
      }
    }
  }, [companyLists]);

  useEffect(() => {
    if (refersh) {
      setCompanyDropdownOpen(null);
      setHasOneData(null);

      fetchCompanyApi(
        setCompanyLists,
        "",
        setNoDataFound,
        setCompanyJoinOrCreate,
        setLoading,
      );
      setRefresh(false);
    }
  }, [refersh]);

  const handleJoinCompany = async (data: { remark: string }) => {
    if (data.remark.trim()) {
      createVaiLink(data.remark, setIsJoinConfirmation);
    } else {
      setIsJoinConfirmation(true);
    }
  };

  const openCompanySide = (singleData: ICompany) => {
    setShowCompany(true);
    setCompanyInfo(singleData);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 3 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      setSearchTimeout(
        setTimeout(() => {
          fetchCompanyApi(
            setCompanyLists,
            searchTerm,
            setNoDataFound,
            setCompanyJoinOrCreate,
            setLoading,
          );
        }, 1000),
      );
    }
  };
  const toggleDropdownCompany = (id: number) => {
    if (companyDropdownOpen === id) {
      setCompanyDropdownOpen(null);
      setHasOneData(null);
    } else {
      setCompanyDropdownOpen(id);
      setHasOneData(id);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".icon-more");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownCompanyRef.current,
    ).some((ref) => ref && ref.contains(target));

    if (!clickedInsideDropdown) {
      setCompanyDropdownOpen(null);
      setHasOneData(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handelChangeEditCompany = (companyById: ICompany) => {
    setShowEditCompany(true);
    setCompanyToiEdit(companyById);
  };
  const handelChangeNewEditCompany = (companyById: ICompany) => {
    setShowNewEditCompany(true);
    setCompanyToiEdit(companyById);
  };

  useEffect(() => {
    setCompanyDropdownOpen(null);
    setHasOneData(null);
  }, [companyLists.length]);

  const handelLeaveCompany = async () => {
    if (await companyLeave(companyIdLeave)) {
      setIsLeaveCloseConfirmation(false);
      fetchCompanyApi(
        setCompanyLists,
        searchTerm,
        setNoDataFound,
        setCompanyJoinOrCreate,
        setLoading,
      );
    }
  };
  // const handelDeleteCompany = async () => {
  //   if (await companyDelete()) {
  //     setIsDeleteCloseConfirmation(false);
  //     fetchCompanyApi(
  //       setCompanyLists,
  //       searchTerm,
  //       setNoDataFound,
  //       setCompanyJoinOrCreate
  //     );
  //   }
  // };

  const handelDeleteCompanyMain = async () => {
    if (companyIdToDelete) {
      const success = await companyMainDelete(companyIdToDelete); // Pass company ID to delete function
      if (success) {
        setIsDeleteCloseConfirmation(false);
        fetchCompanyApi(
          setCompanyLists,
          searchTerm,
          setNoDataFound,
          setCompanyJoinOrCreate,
          setLoading,
        );
      }
    }
  };

  const leaveCompany = (id: number) => {
    setIsLeaveCloseConfirmation(true);
    setCompanyIdLeave(id);
  };
  const handelChangeRenewPlan = (item: ICompany) => {
    setShowRenewPlan(true);
    setRenewPlanItem(item);
  };
  const handleCopy = async (item: ICompany) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported!");
      return;
    }
    try {
      await navigator.clipboard.writeText(
        `Dear Team Member,\nCompany Name : ${item?.company_name} \nKindly Use this Invitation Key : ${item?.invitation_key}\nTo Join Our Company \n\nRegister / login  Here : https://app.smalloffice.in/ \nNeed Any Help Please Check Below Link\nhttps://deskflowcrm.com/ \n\nThank You`,
      );
      toast.success("Text copied successfully!");
      setTimeout(() => 2000); // Hide message after 2 seconds
    } catch (error) {
      toast.error("Failed to copy text!");
    }
  };
  return (
    <>
      {showRenewPlan ? (
        <PricingTable
          companyId={renewPlanItem?.id}
          companyName={renewPlanItem?.company_name}
          companyEmailId={renewPlanItem?.company_email}
          companyContact={renewPlanItem?.company_contact}
          planAmount={0}
          onHide={() => setShowRenewPlan(false)}
        />
      ) : (
        <>
          {showCompany ? (
            <MyCompanyList
              isCompanyOpen={showCompany}
              closeCompany={() => setShowCompany(false)}
              companyInfo={companyInfo}
            />
          ) : (
            <>
              {isCompanyOpen ? (
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
                            <span
                              data-testid="chat"
                              data-icon="chat"
                              className=""
                            >
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
                          <h2>My Company</h2>
                        </div>
                      </div>
                      {companyJoinOrCreate ? (
                        <div
                          className="newText text-end"
                          data-tab="2"
                          role="button"
                          onClick={() => setIsJoinConfirmation(true)}
                        >
                          <h2> Join Company</h2>
                        </div>
                      ) : (
                        <span></span>
                      )}
                    </div>

                    {/* <!-- Chats --> */}
                    <div className="">
                      {/* <!-- Chats 1 --> */}
                      <div className="block">
                        {/* <!-- Text --> */}
                        <div className="h-text">
                          <div className="head">
                            <div className="col-12 d-flex">
                              <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                                {companyJoinOrCreate ? (
                                  <button
                                    className=""
                                    onClick={() => setIsCreateCompany(true)}
                                  >
                                    <span>
                                      <svg
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="currentColor"
                                      >
                                        <path d="M720-40v-120H600v-80h120v-120h80v120h120v80H800v120h-80ZM80-160v-240H40v-80l40-200h600l40 200v80h-40v120h-80v-120H440v240H80Zm80-80h200v-160H160v160Zm-38-240h516-516ZM80-720v-80h600v80H80Zm42 240h516l-24-120H146l-24 120Z" />
                                      </svg>
                                    </span>
                                  </button>
                                ) : (
                                  <span></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="chats" style={{ overflowY: "unset" }}>
                      <>
                        {loading
                          ? // Render skeleton placeholders when loading
                          Array.from({ length: 12 }).map((_, index) => (
                            <div className="block chat-list" key={index}>
                              <Skeleton
                                width={50}
                                height={50}
                                circle={true}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.5 }}
                              />
                              <div className="h-text">
                                <div className="head">
                                  <h4>
                                    <Skeleton
                                      style={{
                                        marginLeft: "10px",
                                        opacity: darkMode ? "" : 0.5,
                                      }}
                                      width={100}
                                    />
                                  </h4>
                                  <p className="time">
                                    <Skeleton
                                      width={80}
                                      style={{
                                        opacity: darkMode ? "" : 0.5,
                                      }}
                                      height={10}
                                    />
                                  </p>
                                </div>
                                <div className="message-chat">
                                  <div className="chat-text-icon">
                                    <span className="thanks">
                                      <Skeleton
                                        style={{
                                          marginLeft: "10px",
                                          opacity: darkMode ? "" : 0.5,
                                        }}
                                        width={100}
                                      />
                                    </span>
                                    <div className="icon-more">
                                      <Skeleton
                                        width={40}
                                        style={{
                                          opacity: darkMode ? "" : 0.5,
                                        }}
                                        height={10}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                          : // Render actual user data when not loading
                          companyLists &&
                          companyLists.map((item, index) => {
                            return (
                              <>
                                <div>
                                  <ul
                                    className={`labelDropLeft labelDropLeft-myteam-1 ${hasOneData === item.id &&
                                        companyDropdownOpen === item.id
                                        ? "isVisible"
                                        : "isHidden"
                                      } `}
                                    ref={(el) => {
                                      if (el) {
                                        dropdownCompanyRef.current[item.id] =
                                          el;
                                      } else {
                                        delete dropdownCompanyRef.current[
                                          item.id
                                        ];
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.company_flag !== 2 ? (
                                      <>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handelChangeEditCompany(item);
                                            setCompanyDropdownOpen(null);
                                            setHasOneData(null);
                                          }}
                                        >
                                          Edit
                                        </li>
                                        {(item.parent_company_id === null ||
                                          item.parent_company_id ===
                                          undefined) && (
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowManageWorkspaces(true);
                                                setCompanyDropdownOpen(null);
                                                setHasOneData(null);
                                              }}
                                            >
                                              Add Workspace
                                            </li>
                                          )}
                                      </>
                                    ) : (
                                      ""
                                    )}
                                    {/* {item.company_flag !== 2 ? (
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handelChangeNewEditCompany(item);
                                          setCompanyDropdownOpen(null);
                                          setHasOneData(null);
                                        }}
                                      >
                                        New Edit
                                      </li>
                                    ) : (
                                      ""
                                    )} */}
                                    {item.company_flag === 2 ? (
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          leaveCompany(item.id);
                                          setCompanyDropdownOpen(null);
                                          setHasOneData(null);
                                        }}
                                      >
                                        Leave
                                      </li>
                                    ) : (
                                      ""
                                    )}
                                    {/* {item.company_flag === 1 ? (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() =>
                                            setIsDeleteCloseConfirmation(true)
                                          }
                                        >
                                          Delete
                                        </li>
                                      ) : (
                                        ""
                                      )} */}
                                    {item.company_flag === 1 ? (
                                      <>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openCompanySide(item);
                                            setCompanyDropdownOpen(null);
                                            setHasOneData(null);
                                          }}
                                        >
                                          My Team
                                        </li>
                                        {/* <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(item);
                                            setCompanyDropdownOpen(null);
                                            setHasOneData(null);
                                          }}
                                        >
                                          copy Invitation Key
                                        </li> */}
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open("/qr_code", "_blank");
                                            setCompanyDropdownOpen(null);
                                            setHasOneData(null);
                                          }}
                                        >
                                          Print my QR Code
                                        </li>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(
                                              `/website/${item.qr_code}`,
                                              "_blank",
                                            );
                                            setCompanyDropdownOpen(null);
                                            setHasOneData(null);
                                          }}
                                        >
                                          Online Store
                                        </li>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCompanyIdToDelete(item.id);
                                            setIsDeleteCloseConfirmation(
                                              true,
                                            );
                                            setCompanyDropdownOpen(null);
                                            setHasOneData(null);
                                          }}
                                        >
                                          Delete Company
                                        </li>
                                      </>
                                    ) : (
                                      ""
                                    )}
                                  </ul>
                                </div>
                                <div key={index} className="block chat-list p-3" style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <div className="h-text w-100">
                                    {/* Header Row: Title & Chevron Dropdown */}
                                    <div
                                      className="d-flex align-items-start justify-content-between mb-1"
                                      onClick={() => openCompanySide(item)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <div>
                                        <div
                                          className="fw-bold"
                                          style={{
                                            fontSize: "14px",
                                            color: "#1e293b",
                                            lineHeight: "1.3",
                                          }}
                                        >
                                          {item.company_name}
                                        </div>
                                        <div className="mt-1">
                                          {(item.parent_company_id === null || item.parent_company_id === undefined) ? (
                                            <span
                                              className="badge rounded-pill px-2.5 py-1"
                                              style={{
                                                backgroundColor: "#f58634",
                                                color: "#ffffff",
                                                fontSize: "10px",
                                                fontWeight: "600",
                                              }}
                                            >
                                              Main Company
                                            </span>
                                          ) : (
                                            <span
                                              className="badge rounded-pill px-2.5 py-1"
                                              style={{
                                                backgroundColor: "#64748b",
                                                color: "#ffffff",
                                                fontSize: "10px",
                                                fontWeight: "600",
                                              }}
                                            >
                                              Workspace
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        className="icon-more btn p-0 border-0 ms-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdownCompany(item.id);
                                        }}
                                        style={{ cursor: "pointer" }}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 19 20"
                                          width="18"
                                          height="18"
                                        >
                                          <path
                                            fill="#64748b"
                                            d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                          ></path>
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Contact & Email */}
                                    <div
                                      className="mb-1.5 text-secondary text-truncate"
                                      style={{ fontSize: "12px", color: "#64748b" }}
                                      onClick={() => openCompanySide(item)}
                                    >
                                      {item.company_contact}
                                      {item.company_contact && item.company_email ? ", " : ""}
                                      {item.company_email}
                                    </div>

                                    {/* Plan Details */}
                                    <div
                                      className="d-flex flex-column gap-0.5 mb-1"
                                      style={{ fontSize: "12px", color: "#475569" }}
                                      onClick={() => openCompanySide(item)}
                                    >
                                      <div>
                                        <b>Plan Type :</b> {item.plan_name}
                                      </div>
                                      <div>
                                        <b>Plan Act. Date :</b>{" "}
                                        {item.plan_date ? formatDate(item.plan_date) : ""}
                                      </div>
                                      <div>
                                        <b>Plan Expiry Date :</b>{" "}
                                        {item.plan_expiry_date ? formatDate(item.plan_expiry_date) : ""}
                                      </div>
                                      {/* Date Footer */}
                                      <div
                                        className="d-flex justify-content-end text-muted mt-1"
                                        style={{ fontSize: "11px", color: "#94a3b8" }}
                                      >
                                        <span>
                                          {item.created_date_time
                                            ? convertDateTimeFormat(item.created_date_time).date
                                            : ""}{" "}
                                          {item.created_date_time
                                            ? convertDateTimeFormat(item.created_date_time).time
                                            : ""}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })}
                        <div
                          style={{
                            flex: "60%",
                            display: "flex",
                            overflow: "scroll",
                            backgroundColor: "#f0f2f5",
                          }}
                        >
                          <Container fluid className="mt-2">
                            <Row className="mb-2">
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <h4 className="dash-board-text-company-count">
                                      {planStatistics.contacts +
                                        "/" +
                                        planStatistics.planContactDataLimit}
                                    </h4>

                                    <span>
                                      <svg
                                        width="30"
                                        height="30"
                                        viewBox="0 0 24 24"
                                        fill="#5f6368"
                                      >
                                        <path
                                          d="M5.25366 13.9999L16.2419 14.0011C16.3459 14.1727 16.4732 14.3321 16.6227 14.474L17.3413 15.1561C17.3004 15.315 17.2471 15.4742 17.1814 15.6338C17.0589 15.5492 16.9118 15.4999 16.7532 15.4999H5.25366C4.83945 15.4999 4.50366 15.8357 4.50366 16.2499V17.1572C4.50366 17.8129 4.78965 18.4359 5.28683 18.8634C6.54491 19.945 8.44092 20.5011 11.0001 20.5011C11.2918 20.5011 11.5748 20.4938 11.8493 20.4794C11.931 20.9259 12.1441 21.3505 12.4808 21.6886L12.7083 21.9167C12.1668 21.973 11.5973 22.0011 11.0001 22.0011C8.11062 22.0011 5.87181 21.3445 4.30894 20.0008C3.48032 19.2884 3.00366 18.25 3.00366 17.1572V16.2499C3.00366 15.0073 4.01102 13.9999 5.25366 13.9999ZM17.0106 12.245L17.5139 11.0581C17.75 10.5015 18.3154 10.1987 18.8699 10.3143L18.9884 10.3455L19.6187 10.5469C20.2436 10.7466 20.7222 11.2819 20.8768 11.9542C21.2441 13.5518 20.8034 15.4969 19.5548 17.7896C18.3079 20.0789 16.9414 21.4553 15.455 21.9189C14.8779 22.099 14.258 21.9682 13.7916 21.5767L13.6684 21.4635L13.1897 20.9829C12.7749 20.5664 12.6894 19.9076 12.9676 19.3921L13.0382 19.2759L13.7597 18.2159C14.0436 17.7989 14.5292 17.6015 14.9971 17.7012L15.1241 17.7358L16.456 18.18C16.9876 17.7778 17.4307 17.2715 17.7856 16.6612C18.0897 16.138 18.2887 15.6078 18.3824 15.0705L18.4205 14.8013L17.3115 13.7487C16.9462 13.4019 16.8135 12.862 16.9628 12.376L17.0106 12.245L17.5139 11.0581L17.0106 12.245ZM11.0001 2.00462C13.7615 2.00462 16.0001 4.2432 16.0001 7.00462C16.0001 9.76605 13.7615 12.0046 11.0001 12.0046C8.2387 12.0046 6.00012 9.76605 6.00012 7.00462C6.00012 4.2432 8.2387 2.00462 11.0001 2.00462ZM11.0001 3.50462C9.06712 3.50462 7.50012 5.07163 7.50012 7.00462C7.50012 8.93762 9.06712 10.5046 11.0001 10.5046C12.9331 10.5046 14.5001 8.93762 14.5001 7.00462C14.5001 5.07163 12.9331 3.50462 11.0001 3.50462Z"
                                          fill="#5f6368"
                                        ></path>
                                      </svg>
                                    </span>
                                    <h4 className="dash-board-company-text">
                                      Total Contacts
                                    </h4>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <div className="">
                                      <h4 className="dash-board-text-company-count">
                                        {planStatistics.inquiries +
                                          "/" +
                                          planStatistics.PlanInquiriesDataLimit}
                                      </h4>
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="30px"
                                          viewBox="0 -960 960 960"
                                          width="30px"
                                          fill="#5f6368"
                                        >
                                          <path d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z" />
                                        </svg>
                                      </span>
                                      <h4 className="dash-board-company-text">
                                        Total Inquiry
                                      </h4>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <div className="">
                                      <h4 className="dash-board-text-company-count">
                                        {planStatistics.totalSalesB2bPortalInquiries +
                                          "/" +
                                          planStatistics.PlanSalesB2bPortalInquiriesDataLimit}
                                      </h4>
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="#5f6368"
                                        >
                                          <path d="M280-160q-33 0-56.5-23.5T200-240v-370L40-800h760q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H280Zm-68-560 68 80v400h520v-480H212Zm328 460 56-56-44-44h168v-80H360l180 180ZM360-520h360L540-700l-56 56 44 44H360v80Zm146 40Z" />
                                        </svg>
                                      </span>
                                      <h4 className="dash-board-company-text">
                                        B2b Portal Inquiry
                                      </h4>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <h4 className="dash-board-text-company-count">
                                      {planStatistics.totalQuotations +
                                        "/" +
                                        planStatistics.PlanQuotationsDataLimit}
                                    </h4>

                                    <span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#5f6368"
                                      >
                                        <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
                                      </svg>
                                    </span>
                                    <h4 className="dash-board-company-text">
                                      Total Quotation
                                    </h4>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <div className="">
                                      <h4 className="dash-board-text-company-count">
                                        {planStatistics.totalSalesOrders +
                                          "/" +
                                          planStatistics.PlanSalesOrdersDataLimit}
                                      </h4>
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="#5f6368"
                                        >
                                          <path d="m480-560-56-56 63-64H320v-80h167l-64-64 57-56 160 160-160 160ZM280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z" />
                                        </svg>
                                      </span>
                                      <h4 className="dash-board-company-text">
                                        Sales Order
                                      </h4>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <h4 className="dash-board-text-company-count">
                                      {planStatistics.totalSalesInvoices +
                                        "/" +
                                        planStatistics.PlanSalesInvoicesDataLimit}
                                    </h4>

                                    <span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#5f6368"
                                      >
                                        <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
                                      </svg>
                                    </span>
                                    <h4 className="dash-board-company-text">
                                      Sales Invoice
                                    </h4>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <div className="">
                                      <h4 className="dash-board-text-company-count">
                                        {planStatistics.totalPurchaseInvoices +
                                          "/" +
                                          planStatistics.PlanPurchaseInvoicesDataLimit}
                                      </h4>
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="#5f6368"
                                        >
                                          <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
                                        </svg>
                                      </span>
                                      <h4 className="dash-board-company-text">
                                        Purchase Invoice
                                      </h4>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>

                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <h4 className="dash-board-text-company-count">
                                      {planStatistics.totalEmails +
                                        "/" +
                                        planStatistics.PlanEmailDataLimit}
                                    </h4>

                                    <span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="30px"
                                        viewBox="0 -960 960 960"
                                        width="30px"
                                        fill="#5f6368"
                                      >
                                        <path d="M480-440 160-640v400h360v80H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v280h-80v-200L480-440Zm0-80 320-200H160l320 200ZM760-40l-56-56 63-64H600v-80h167l-64-64 57-56 160 160L760-40ZM160-640v440-240 3-283 80Z" />
                                      </svg>
                                    </span>
                                    <h4 className="dash-board-company-text">
                                      Total Email
                                    </h4>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                            <Row className="mb-2">
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <div className="">
                                      <h4 className="dash-board-text-company-count">
                                        {planStatistics.teamMembers +
                                          "/" +
                                          planStatistics.planTeamMembersDataLimit}
                                      </h4>
                                      <span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="30px"
                                          viewBox="0 -960 960 960"
                                          width="30px"
                                          fill="#5f6368"
                                        >
                                          <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
                                        </svg>
                                      </span>
                                      <h4 className="dash-board-company-text">
                                        My Team Member
                                      </h4>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={6} className="dash-board-company-column">
                                <Card
                                  className="text-end"
                                  style={{ borderRadius: "0px" }}
                                >
                                  <Card.Body>
                                    <h4 className="dash-board-text-company-count">
                                      {planStatistics.totalProducts +
                                        "/" +
                                        planStatistics.PlanProductsDataLimit}
                                    </h4>

                                    <span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#5f6368"
                                      >
                                        <path d="M620-163 450-333l56-56 114 114 226-226 56 56-282 282Zm220-397h-80v-200h-80v120H280v-120h-80v560h240v80H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v200ZM480-760q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z" />
                                      </svg>
                                    </span>
                                    <h4 className="dash-board-company-text">
                                      Total Product
                                    </h4>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                          </Container>
                        </div>
                      </>
                    </div>
                  </div>

                  <CreateCompanyView
                    show={isCreateCompany}
                    onHide={() => setIsCreateCompany(false)}
                    setRefresh={setRefresh}
                    headerName={"Create Company"}
                  />
                  <CreateCompanyView
                    show={showEditCompany}
                    onHide={() => setShowEditCompany(false)}
                    companyToEdit={companyToEdit}
                    setRefresh={setRefresh}
                    headerName={"Edit Company"}
                    isShowApiKey={1}
                  />
                  <NewCreateCompanyView
                    show={showNewEditCompany}
                    onHide={() => setShowNewEditCompany(false)}
                    companyToEdit={companyToEdit}
                    setRefresh={setRefresh}
                    headerName={"Edit Company"}
                  // isShowApiKey={1}
                  />
                  <ManageWorkspacesModal
                    show={showManageWorkspaces}
                    onHide={() => setShowManageWorkspaces(false)}
                  />
                  {isJoinConfirmation && (
                    <JoinModal
                      show={isJoinConfirmation}
                      onHide={() => setIsJoinConfirmation(false)}
                      handleSubmit={handleJoinCompany}
                      title={"Join Company"}
                      message={
                        "Are you sure you want delete is Source Of Type? "
                      }
                      btn1="CANCEL"
                      btn2="join"
                    />
                  )}
                  {isLeaveCloseConfirmation && (
                    <ConfirmationModal
                      show={isLeaveCloseConfirmation}
                      onHide={() => setIsLeaveCloseConfirmation(false)}
                      handleSubmit={() => handelLeaveCompany()}
                      title={"Leave this Company"}
                      message={"Are you sure you want to Leave this Company?"}
                      btn1="CANCEL"
                      btn2="Leave company"
                    />
                  )}
                  {/* {isDeleteCloseConfirmation && (
                    <ConfirmationModal
                      show={isDeleteCloseConfirmation}
                      onHide={() => setIsDeleteCloseConfirmation(false)}
                      handleSubmit={() => handelDeleteCompany()}
                      title={"Delete this Company"}
                      message={"Are you sure you want to Delete this Company?"}
                      btn1="CANCEL"
                      btn2="Delete company"
                    />
                  )} */}
                  {isDeleteCloseConfirmation && (
                    <ConfirmationModal
                      show={isDeleteCloseConfirmation}
                      onHide={() => setIsDeleteCloseConfirmation(false)}
                      handleSubmit={() => handelDeleteCompanyMain()}
                      title={"Delete this Company"}
                      message={
                        "Are you sure you want to delete this company? All of its data will be permanently removed."
                      }
                      btn1="CANCEL"
                      btn2="Delete company"
                    />
                  )}
                </>
              ) : null}
            </>
          )}
        </>
      )}
    </>
  );
};

export default ListCompanyView;
