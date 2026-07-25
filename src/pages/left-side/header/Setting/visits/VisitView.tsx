import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import {
  convertDateTimeFormat,
  useEscapeKey,
} from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import WorkFlowModel from "../../../../../components/model/workflowConformatioModel/workFlowModelView";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  BIG_WIDTH_FOR_TEXT,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
  MIN_WIDTH_FOR_TEXT,
  SMALL_WIDTH_FOR_TEXT,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateVisitView from "./create-visit/CreateVisitView";
import {
  fetchCustomInqFromApiForVisit,
  fetchVisitApi,
  handleDeleteVisit,
  ICustomFromList,
  IVisitView,
} from "./VisitController";

interface IPropsVisitView {
  isVisitView: boolean;
  closeVisitView: () => void;
  contactId?: number;
  contactName?: string;
  setRefreshVisit?: (value: boolean | number) => void;
  team_id?: number;
  is_task?: number
  stop_task_id?: number
}

const VisitView = ({
  isVisitView,
  closeVisitView,
  contactId,
  contactName,
  setRefreshVisit,
  team_id,
  is_task,
  stop_task_id
}: IPropsVisitView) => {
  const [visitLists, setVisitList] = useState<IVisitView[]>([]);
  const dropdownRef = useRef<Record<number, HTMLUListElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number | null>(null);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  const [isOpenViewModel, setIsOpenViewModel] = useState(false);
  const [isOpenStatusModel, setIsOpenStatusModel] = useState(false);
  const [editVisitStatusItem, setEditVisitStatusItem] = useState<IVisitView>();
  const [statusFlag, setStatusFlag] = useState<string>("");
  const [createEditStatusFlag, setCreateEditStatusFlag] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const [editVisitItem, setEditVisitItem] = useState<IVisitView>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [deleteItemId, setDeleteItemId] = useState<number | undefined>(
    undefined
  );
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [customFormList, setCustomFromList] = useState<ICustomFromList[]>([]);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshChat, setRefreshChat] = useState(false);

  const applicationLoginId = localStorage.getItem("UUID");

  const canView = useCheckUserPermission(PAGE_ID.VISIT, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.VISIT, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.VISIT, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(
    PAGE_ID.VISIT,
    PERMISSION_TYPE.DELETE
  );
  const canStartWorkFlow = useCheckUserPermission(
    PAGE_ID.START_WORK_FLOW,
    PERMISSION_TYPE.ADD
  );
  useEscapeKey(closeVisitView);

  useEffect(() => {
    fetchCustomInqFromApiForVisit(setCustomFromList);
  }, []);

  useEffect(() => {
    if (canView && isVisitView) {
      setCurrentPage(0);
      setVisitList([]);
      setHasMore(true);
      fetchVisitApi(
        0,
        ITEMS_PER_PAGE,
        setVisitList,
        setLoading,
        searchTerm,
        contactId,
        team_id
      );
    }
  }, [isVisitView, canView, searchTerm, contactId]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        listInnerRef.current &&
        listInnerRef.current.scrollTop + listInnerRef.current.clientHeight >=
        listInnerRef.current.scrollHeight - 10 &&
        !loading &&
        hasMore
      ) {
        fetchVisitApi(
          currentPage + 1,
          ITEMS_PER_PAGE,
          (newItems) => {
            if (newItems.length > 0) {
              setVisitList((prev) => [
                ...prev,
                ...(Array.isArray(newItems) ? newItems : []),
              ]);
              setCurrentPage((prevPage) => prevPage + 1);
            } else {
              setHasMore(false);
            }
          },
          setLoading,
          searchTerm,
          contactId,
          team_id
        );
      }
    };

    const el = listInnerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [currentPage, loading, hasMore, searchTerm, contactId, visitLists.length]);

  const toggleDropdownVisit = (visitId: number | undefined) => {
    if (visitId === undefined) return;
    setHasIdAvail((prev) => (prev === visitId ? null : visitId));
  };

  const handleView = (item: IVisitView, addUpdateStatus: string) => {
    if (canEdit) {
      setEditVisitItem(item);
      setIsOpenViewModel(true);
      setHasIdAvail(null);
      setCreateEditStatusFlag(addUpdateStatus);
    } else {
      setHasIdAvail(null);
      setIsOpenViewModel(false);
      setCreateEditStatusFlag(addUpdateStatus);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleEdit = (item: IVisitView, addUpdateStatus: string) => {
    if (canEdit) {
      setEditVisitItem(item);
      setIsOpenEditModel(true);
      setHasIdAvail(null);
      setCreateEditStatusFlag(addUpdateStatus);
    } else {
      setHasIdAvail(null);
      setIsOpenEditModel(false);
      setCreateEditStatusFlag(addUpdateStatus);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest('.icon-more');
    if (isDropdownButton) {
      return;
    }

    const clickedInDropdown = Object.values(dropdownRef.current).some(
      (ref) => ref && ref.contains(target)
    );

    if (!clickedInDropdown) {
      setHasIdAvail(null);
    }
  };

  useEffect(() => {
    if (hasIdAvail !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hasIdAvail]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && hasIdAvail !== null) {
        setHasIdAvail(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [hasIdAvail]);

  const handelRefreshVisit = async () => {
    if (canView) {
      setCurrentPage(0);
      setVisitList([]);
      setHasMore(true);
      await fetchVisitApi(
        0,
        ITEMS_PER_PAGE,
        setVisitList,
        setLoading,
        "",
        contactId,
        team_id
      );
    }
  };

  function openSearch() {
    if (canView) {
      setSearchOpen(!searchOpen);
      if (searchOpen) {
        setSearchTerm("");
        setCurrentPage(0);
        setVisitList([]);
        setHasMore(true);
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 3 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      setSearchTimeout(
        setTimeout(() => {
          setCurrentPage(0);
          setVisitList([]);
          setHasMore(true);
          fetchVisitApi(
            0,
            ITEMS_PER_PAGE,
            setVisitList,
            setLoading,
            value,
            contactId,
            team_id
          );
        }, 1000)
      );
    }
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(false);
    setCurrentPage(0);
    setVisitList([]);
    setHasMore(true);
    setSearchTimeout(
      setTimeout(() => {
        fetchVisitApi(
          0,
          ITEMS_PER_PAGE,
          setVisitList,
          setLoading,
          "",
          contactId,
          team_id
        );
      }, 1000)
    );
  };

  function openDeleteModel(visitId: number | undefined) {
    if (canDelete) {
      setDeleteItemId(visitId);
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openCreateProduct(addUpdateStatus: string) {
    if (canAdd) {
      setIsCreateModel(true);
      setCreateEditStatusFlag(addUpdateStatus);
    } else {
      setIsCreateModel(false);
      setCreateEditStatusFlag(addUpdateStatus);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const handleStatusChange = (item: IVisitView, status: string) => {
    if (canEdit) {
      setIsOpenStatusModel(true);
      setEditVisitStatusItem(item);
      setStatusFlag(status);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (refreshProduct) {
      setCurrentPage(0);
      setVisitList([]);
      setHasMore(true);
      fetchVisitApi(
        0,
        ITEMS_PER_PAGE,
        setVisitList,
        setLoading,
        searchTerm,
        contactId,
        team_id
      );
      setRefreshProduct(false);
      if (setRefreshVisit) {
        setRefreshVisit(true);
      }
    }
  }, [refreshProduct, searchTerm, contactId]);

  const handleChangeImgViewer = (imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  };

  const handleCloseImageViewer = () => {
    setImageViewerUrl(null);
  };

  const renderCustomField = (
    customField: ICustomFromList,
    visit: IVisitView
  ) => {
    const fieldValue =
      visit[customField.reference_column_name as keyof IVisitView] || "-";
    let displayValue: string | boolean | number = fieldValue;

    switch (customField.data_type) {
      case 7: // Boolean (checkbox)
        displayValue =
          fieldValue === true || fieldValue === "true" ? "Yes" : "No";
        break;
      case 9:
      case 10:
        displayValue = fieldValue || "-";
        break;
      default:
        displayValue = fieldValue || "-";
    }

    return (
      <div
        className="d-flex align-items-center"
        key={customField.reference_column_name}
      >
        <div style={{ paddingBottom: "2px", borderBottom: "unset" }}>
          <h4 className="inquiry-front">
            <b>{customField.title}</b> :
          </h4>
        </div>
        <div
          style={{
            paddingBottom: "2px",
            borderBottom: "unset",
            textAlign: "left",
          }}
        >
          <h4
            className="inquiry-front"
            style={{
              wordWrap: "break-word",
              width: `${BIG_WIDTH_FOR_TEXT}`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayValue.toString()}
          </h4>
        </div>
      </div>
    );
  };

  /* Start WorkFlow Code Start */
  const [isShowConformationForStartWorkFlow, setIsShowConformationForStartWorkFlow] =
    useState<boolean>(false);
  const [workFlowOrderId, setWorkFlowOrderId] =
    useState<number>(0);
  const handleStartWorkFlow = (contactId: number) => {
    if (canStartWorkFlow) {
      setIsShowConformationForStartWorkFlow(true)
      setWorkFlowOrderId(contactId)
    } else {
      setIsShowConformationForStartWorkFlow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }

  }
  /* Start WorkFlow Code End */

  console.log("stop_visit_idstop_visit_id",stop_task_id);
  
  return (
    <>
      {isVisitView ? (
        <div
          className="leftSide animate__animated animate__fadeInLeft"
          id="notifications"
        >
          {/* Header (unchanged) */}
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons text-light"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeVisitView}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>{" "}
                </span>
              </div>
            </div>

            <div className="newText">
              <h2
                style={{
                  wordBreak: "break-word",
                  maxWidth: `${BIG_WIDTH_FOR_TEXT}`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "0px",
                  margin: "0px",
                }}
              >
                {contactId && contactName
                  ? `${contactName}'s Visits`
                  : "All Visits"}
              </h2>
            </div>

            <div className="col-5 text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "1px" }}
              >
                {contactId && canAdd && (
                  <button
                    className="icons text-white"
                    onClick={() => openCreateProduct("createEdit")}
                    title="Create Visit"
                  >
                    <span className="text-white">
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

                <button
                  className="icons text-white"
                  onClick={openSearch}
                  title="Search"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                    ></path>
                  </svg>
                </button>

                <button
                  className="icons text-light"
                  onClick={handelRefreshVisit}
                  title="Refresh"
                >
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
                </button>
              </div>
            </div>
          </div>

          {searchOpen && (
            <div className="header-search" style={{ zIndex: "1" }}>
              <div className="search-bar">
                <div className="d-flex justify-content-between">
                  <button className="search">
                    <span className="">
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                        ></path>
                      </svg>
                    </span>
                  </button>

                  <span className="go-back">
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

                  <input
                    type="text"
                    title="Search"
                    aria-label="Search or start new chat"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-message-input"
                  />

                  <span
                    role="button"
                    className="p-1"
                    onClick={handleSearchClear}
                  >
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M280-80q-83 0-141.5-58.5T80-280q0-83 58.5-141.5T280-480q83 0 141.5 58.5T480-280q0 83-58.5 141.5T280-80Zm544-40L568-376q-12-13-25.5-26.5T516-428q38-24 61-64t23-88q0-75-52.5-127.5T420-760q-75 0-127.5 52.5T240-580q0 6 .5 11.5T242-557q-18 2-39.5 8T164-535q-2-11-3-22t-1-23q0-109 75.5-184.5T420-840q109 0 184.5 75.5T680-580q0 43-13.5 81.5T629-428l251 252-56 56Zm-615-61 71-71 70 71 29-28-71-71 71-71-28-28-71 71-71-71-28 28 71 71-71 71 28 28Z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chats */}
          <div className="chats-notifications" ref={listInnerRef}>
            <div className="block p-0">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div className="chats h-100" key={index}>
                          <button className="block chat-list">
                            <div>
                              <Skeleton
                                width="100%"
                                height="100%"
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                            <div className="h-text ps-2">
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div
                        className="chats h-100"
                        style={{ paddingBottom: "100px" }}
                      >
                        <p
                          className={`text-center mt-4 ${visitLists.length ? "" : "text-center pt-5"
                            }`}
                        >
                          {visitLists.length === 0 ? "No Data Found" : ""}
                        </p>
                        {visitLists
                          // .filter((item) => {
                          //   if (contactId) {
                          //     return item.contact_id === contactId;
                          //   } else {
                          //     const hasCompanyFlag = visitLists.some(
                          //       (visit) => visit.companyFlag === 1
                          //     );
                          //     if (hasCompanyFlag) {
                          //       return true;
                          //     } else {
                          //       return (
                          //         applicationLoginId &&
                          //         item.a_application_login_id ===
                          //           parseInt(applicationLoginId)
                          //       );
                          //     }
                          //   }
                          // })
                          .map((item, index) => (
                            <div key={item.id}>
                              <ul
                                ref={(el) =>
                                  (dropdownRef.current[item.id] = el)
                                }
                                className={` labelDropLeft ${hasIdAvail === item.id
                                  ? "isVisible"
                                  : "isHidden"
                                  }`}
                                style={{ width: "126px", zIndex: "1", marginTop: "30px" }}
                              >

                                {item.end_date == null ? (
                                  <li
                                    className="listItem text-start"
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHasIdAvail(null);
                                      handleEdit(item, "createEdit");
                                    }}
                                  >
                                    Stop Visit
                                  </li>
                                ) : (
                                  <>
                                    <li
                                      className="listItem text-start"
                                      role="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setHasIdAvail(null);
                                        handleView(item, "createView");
                                      }}
                                    >
                                      View Details
                                    </li>
                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={() => handleStartWorkFlow(item.id)}
                                      style={{ color: "#0992f3", fontWeight: "600" }}
                                    >
                                      Start WorkFlow
                                    </li>
                                  </>
                                )}
                                <li
                                  style={{ color: "red", fontWeight: "600" }}
                                  className="listItem text-start"
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHasIdAvail(null);
                                    openDeleteModel(item.id);
                                  }}
                                >
                                  Delete
                                </li>
                              </ul>
                              <button
                                key={index}
                                className="block chat-list"
                                style={{
                                  // backgroundColor:
                                  //   item.end_date == null
                                  //     ? "#FFEAEB"
                                  //     : "transparent",
                                  padding: "6px",
                                }}
                              >
                                <div
                                  className="h-text ps-2"
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    backgroundColor:
                                      item.end_date == null
                                        ? "#FFEAEB"
                                        : "transparent",
                                  }}
                                >
                                  <div
                                    className="d-flex align-items-center"
                                    style={{ width: "70%" }}
                                    onClick={() => {
                                      if (item.end_date !== null) {
                                        handleView(item, "createView");
                                      }
                                    }}
                                  >
                                    <div style={{ width: "100%" }}>
                                      <div className="d-flex align-items-center">
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                          }}
                                        >
                                          <h4 className="inquiry-front">
                                            <b>#{item.id}</b>
                                          </h4>
                                        </div>
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                            textAlign: "left",
                                          }}
                                        >
                                          <h4
                                            className="inquiry-front"
                                            style={{
                                              wordWrap: "break-word",
                                              width: `${MIN_WIDTH_FOR_TEXT}`,
                                            }}
                                          ></h4>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                          }}
                                        >
                                          <h4 className="inquiry-front">
                                            <b>Visit Type</b> :
                                          </h4>
                                        </div>
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                            textAlign: "left",
                                          }}
                                        >
                                          <h4
                                            className="inquiry-front"
                                            style={{
                                              wordBreak: "break-word",
                                              maxWidth: SMALL_WIDTH_FOR_TEXT,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {item.visit_type}
                                          </h4>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                          }}
                                        >
                                          <h4 className="inquiry-front">
                                            <b>Visit By</b> :
                                          </h4>
                                        </div>
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                            textAlign: "left",
                                          }}
                                        >
                                          <h4
                                            className="inquiry-front"
                                            style={{
                                              wordBreak: "break-word",
                                              maxWidth: SMALL_WIDTH_FOR_TEXT,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {item.applicationLoginName}
                                          </h4>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                          }}
                                        >
                                          <h4 className="inquiry-front">
                                            <b>Contact Name :</b>
                                          </h4>
                                        </div>
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                            textAlign: "left",
                                          }}
                                        >
                                          <h4
                                            className="inquiry-front"
                                            style={{
                                              wordBreak: "break-word",
                                              maxWidth: `${SMALL_WIDTH_FOR_TEXT}`,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              padding: "0px",
                                              margin: "0px",
                                              textAlign: "left"
                                            }}
                                          >
                                            {item.company_name}({item.person_name})
                                          </h4>
                                        </div>
                                      </div>
                                      <div className="d-flex">
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                          }}
                                        >
                                          <h4 className="inquiry-front">
                                            <b>Remark</b> :
                                          </h4>
                                        </div>
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                            textAlign: "left",
                                          }}
                                        >
                                          <h4
                                            className="inquiry-front"
                                            style={{
                                              wordWrap: "break-word",
                                              width: `${BIG_WIDTH_FOR_TEXT}`,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {item.remark ? item.remark : ""}
                                          </h4>
                                        </div>
                                      </div>
                                      {/* Uncomment to render custom fields */}
                                      {/* {customFormList.map((customField) =>
                                        renderCustomField(customField, item)
                                      )} */}
                                    </div>
                                  </div>

                                  <a
                                    href={`https://api.whatsapp.com/send?phone=91${item?.contact_mobile}`}
                                    target="_blank"
                                  >
                                    <button className="icons mx-1">
                                      <span title="Whatsapp">
                                        <i
                                          className="bi bi-whatsapp mt-1"
                                          style={{ fontSize: "20px", position: "absolute", left: "85%", top: "-1%" }}
                                        ></i>
                                      </span>
                                    </button>
                                  </a>

                                  <div className="d-flex align-items-center justify-content-end">
                                    <div>
                                      {item.id === -1 ? (
                                        <span></span>
                                      ) : (
                                        <>
                                          <button
                                            className="icon-more float-end"
                                            style={{ marginTop: "-40%" }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleDropdownVisit(item.id);
                                            }}
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 19 20"
                                              width="19"
                                              height="20"
                                              className="hide animate__animated animate__fadeInUp mt-1"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                              ></path>
                                            </svg>
                                          </button>

                                          <div className="text-end">
                                            <p className="contact-text">
                                              {item.created_date_time
                                                ? `${convertDateTimeFormat(
                                                  item.created_date_time
                                                ).date
                                                } ${convertDateTimeFormat(
                                                  item.created_date_time
                                                ).time
                                                }`
                                                : ""}
                                            </p>
                                            {/* <p className="contact-text">
                                              {item.created_date_time
                                                ? convertDateTimeFormat(
                                                    item.created_date_time
                                                  ).time
                                                : ""}
                                            </p> */}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-danger p-1">
                    {DEFAULT_MESSAGE_ERROR_PERMISSION}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Remaining modals and components (unchanged) */}
          {imageViewerUrl && (
            <div
              className="image-viewer-overlay"
              onClick={handleCloseImageViewer}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  position: "relative",
                  textAlign: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={imageViewerUrl}
                  alt="Full Preview"
                  style={{
                    width: "500px",
                    borderRadius: "10px",
                  }}
                />
                <div>
                  <a
                    href={imageViewerUrl}
                    download
                    className="btn btn-sm btn-light"
                    style={{
                      marginTop: "10px",
                      display: "inline-block",
                    }}
                  >
                    Download Image
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => {
            setIsDeleteConfirmation(false);
            setDeleteItemId(undefined);
          }}
          handleSubmit={() => {
            if (deleteItemId !== undefined) {
              handleDeleteVisit(
                deleteItemId,
                setIsDeleteConfirmation,
                setLoading,
                setVisitList,
                contactId
              );
              setDeleteItemId(undefined);
            }
          }}
          title={"Delete this Visit"}
          message={"Are you sure you want to delete this visit?"}
          btn1="CANCEL"
          btn2="DELETE"
        />
      )}

      {isOpenEditModel && (
        <CreateVisitView
          show={isOpenEditModel}
          createEditFlag={createEditStatusFlag}
          onHide={() => setIsOpenEditModel(false)}
          visitToEdit={editVisitItem}
          headerName="Stop Visit"
          setRefreshVisit={setRefreshProduct}
          stop_task_id={stop_task_id}
        />
      )}

      {isOpenViewModel && (
        <CreateVisitView
          show={isOpenViewModel}
          createEditFlag={createEditStatusFlag}
          onHide={() => setIsOpenViewModel(false)}
          visitToEdit={editVisitItem}
          headerName="View Visit"
          setRefreshVisit={setRefreshProduct}
        />
      )}

      {isOpenStatusModel && (
        <CreateVisitView
          show={isOpenStatusModel}
          onHide={() => setIsOpenStatusModel(false)}
          visitToEdit={editVisitStatusItem}
          headerName={`${statusFlag} Status`}
          setRefreshVisit={setRefreshProduct}
          status={statusFlag}
        />
      )}

      {isOpenCreateModel && (
        <CreateVisitView
          show={isOpenCreateModel}
          createEditFlag={createEditStatusFlag}
          onHide={() => setIsCreateModel(false)}
          visitToEdit={undefined}
          headerName="Create Visit"
          setRefreshVisit={setRefreshProduct}
          contactId={contactId}
          contactName={contactName}
          setRefreshChat={() => setRefreshChat(true)}
        />
      )}
      {isShowConformationForStartWorkFlow && (
        <WorkFlowModel
          show={isShowConformationForStartWorkFlow}
          onHide={() => setIsShowConformationForStartWorkFlow(false)}
          handleSubmit={() => setIsShowConformationForStartWorkFlow(false)}
          title={`Start WorkFlow For Visit`}
          message={`Are you sure you want to Start WorkFlow for Visit?`}
          showTaskTemplateFor={3}
          showOrderId={workFlowOrderId}
          setWorkFlowFor={"Visit"}
          btn1="CANCEL"
          btn2="Start"
        />
      )}
    </>
  );
};

export default VisitView;
