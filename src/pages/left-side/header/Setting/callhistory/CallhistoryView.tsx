import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import {
  convertDateTimeSecondsFormat,
  useEscapeKey
} from "../../../../../common/SharedFunction";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  BIG_WIDTH_FOR_TEXT,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
  SMALL_WIDTH_FOR_TEXT,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { fetchCallHistoryApi, ICallHistoryView } from "./Callhistorycontroller";

interface IPropsCallHistoryView {
  isCallHistoryView: boolean;
  closeCallHistory: () => void;
  contactId?: number;
  contactName?: string;
}

const CallHistoryView = ({
  isCallHistoryView,
  closeCallHistory,
  contactId,
  contactName,
}: IPropsCallHistoryView) => {
  const searchInputRef = useRef<any>(null);
  const [callHistoryList, setCallHistoryList] = useState<ICallHistoryView[]>([]);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
  const [callDropdown, setCallDropdown] = useState<any>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  let itemsPerPage: number = ITEMS_PER_PAGE;
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);

  const applicationLoginId = localStorage.getItem("UUID");
  const canView = useCheckUserPermission(PAGE_ID.CALL_HISTORY, PERMISSION_TYPE.VIEW);

  useEscapeKey(closeCallHistory);

  const toggleDropdownCall = (callId: number | undefined) => {
    if (callId !== undefined) {
      setCallDropdown((prev: any) => {
        const isCurrentlyOpen = prev[callId] === true;
        if (isCurrentlyOpen) {
          setHasIdAvail(undefined);
          return {};
        } else {
          setHasIdAvail(callId);
          return { [callId]: true };
        }
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (canView && isCallHistoryView) {
        try {
          await fetchCallHistoryApi(
            0,
            itemsPerPage,
            setCallHistoryList,
            setLoading,
            searchTerm,
            contactId
          );
        } catch (error) {
          console.error("Failed to fetch call history:", error);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isCallHistoryView, searchTerm, canView, contactId, setCallHistoryList, itemsPerPage]);

  const handleClickOutside = (event: MouseEvent) => {
    const isOutsideDropdown =
      !Object.values(dropdownContactRef.current).some(
        (ref) => ref && ref.contains(event.target as Node)
      ) &&
      (!sourceOfTypesRefDropdown.current ||
        !sourceOfTypesRefDropdown.current.contains(event.target as Node));

    if (isOutsideDropdown) {
      setCallDropdown({});
      setHasIdAvail(undefined);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [callDropdown]);

  const handleRefreshCallHistory = async () => {
    if (canView) {
      await fetchCallHistoryApi(
        0,
        itemsPerPage,
        setCallHistoryList,
        setLoading,
        "",
        contactId
      );
    }
  };

  const openSearch = () => {
    if (canView) {
      setSearchOpen(!searchOpen);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
    searchInputRef.current?.focus();
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
          fetchCallHistoryApi(
            0,
            itemsPerPage,
            setCallHistoryList,
            setLoading,
            value,
            contactId
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
    setSearchOpen(!searchOpen);
    setSearchTimeout(
      setTimeout(() => {
        fetchCallHistoryApi(
          0,
          itemsPerPage,
          setCallHistoryList,
          setLoading,
          "",
          contactId
        );
      }, 1000)
    );
  };

  const [currentPage, setCurrentPage] = useState(0);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [noDataFound, setNoDataFound] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  useEffect(() => {
    // Reset and fetch first page on search term change
    setCurrentPage(0);
    setLoading(true);
    fetchCallHistoryApi(
      0,
      ITEMS_PER_PAGE,
      (newItems) => setCallHistoryList(newItems),
      setLoading,
      searchTerm,
      contactId
    );
  }, [searchTerm, contactId]);

  useEffect(() => {
    const handleScroll = () => {
      const el = listInnerRef.current;
      if (el && !loading && hasMoreData) {
        const isBottomReached = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (isBottomReached) {
          setLoading(true);
          fetchCallHistoryApi(
            currentPage + 1,
            ITEMS_PER_PAGE,
            (newItems) => {
              if (newItems.length === 0) {
                setHasMoreData(false);
              } else {
                setCallHistoryList((prev) => [...prev, ...newItems]);
                setCurrentPage((prevPage) => prevPage + 1);
              }
              setLoading(false);
            },
            setLoading,
            searchTerm,
            contactId
          );
        }
      }
    };

    const el = listInnerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [currentPage, loading, searchTerm, contactId, hasMoreData]);

  return (
    <>
      {isCallHistoryView ? (
        <div
          className="leftSide animate__animated animate__fadeInLeft"
          id="notifications"
        >
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons text-light"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeCallHistory}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
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
                  ? `${contactName}'s Call History`
                  : "All My Call History"}
              </h2>
            </div>
            <div className="col-3 text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "1px" }}
              >
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
                  onClick={handleRefreshCallHistory}
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
                    ref={searchInputRef}
                    type="text"
                    id="mobileNumberSearch"
                    title="Search"
                    aria-label="Search or start new chat"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-message-input ms-2"
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
          <div className="chats-notifications" ref={listInnerRef}>
            <div className="block p-0">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div className="chats" key={index}>
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
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="chats chats-callhistory m-0 p-0">
                        <p
                          className={`text-center ${callHistoryList.length ? "" : "text-center pt-5"}`}
                        >
                          {callHistoryList.length === 0 ? "No Call History Found" : ""}
                        </p>
                        {callHistoryList
                          .sort((a, b) => {
                            const dateA = a.created_date_time
                              ? new Date(a.created_date_time).getTime()
                              : 0;
                            const dateB = b.created_date_time
                              ? new Date(b.created_date_time).getTime()
                              : 0;
                            return dateB - dateA; // Descending order
                          })
                          .slice(0, 50)
                          .map((item, index) => {
                            return (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  padding: "0px",
                                  margin: "0px",
                                  justifyContent: "center",
                                }}
                              >
                                <button className="block chat-list p-0">
                                  <div
                                    className="h-text ps-2"
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <div className="col-7">
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
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <div
                                          style={{
                                            paddingBottom: "2px",
                                            borderBottom: "unset",
                                          }}
                                        >
                                          <h4 className="inquiry-front">
                                            <b>Contact Name</b>:{" "}
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
                                            {item.call_name}
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
                                            <b>Mobile Number</b>:{" "}
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
                                            {item.mobile_number}
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
                                            <b>Duration</b>:{" "}
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
                                            {item.duration || "0:00"} Minits
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
                                            <b>Remark</b>:{" "}
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
                                            {item.remark || ""}
                                          </h4>
                                        </div>
                                      </div>
                                    </div>
                                    <div className=" col-5 d-flex align-items-center justify-content-end">
                                      <div>
                                        {item.id === -1 ? (
                                          <span></span>
                                        ) : (
                                          <>
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: "8px",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                              }}
                                            >
                                              <button
                                                className="icon-more "
                                                style={{
                                                  backgroundColor: item.color,
                                                  color: "white",
                                                  fontWeight: "normal",
                                                  borderRadius: "10px",
                                                  marginBottom: "10px",
                                                  fontSize: "10px",
                                                  width: "85px",
                                                }}
                                              >
                                                {item.icon &&
                                                  React.createElement(item.icon)}{" "}
                                                &nbsp;&nbsp;
                                                {item.call_type}
                                              </button>
                                              <button
                                                className="icon-more"
                                                onClick={() =>
                                                  toggleDropdownCall(item.id)
                                                }
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  viewBox="0 0 19 20"
                                                  width="19"
                                                  height="20"
                                                  className="hide animate__animated animate__fadeInUp"
                                                >
                                                  <path
                                                    fill="currentColor"
                                                    d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                                  ></path>
                                                </svg>
                                              </button>
                                            </div>
                                            <div style={{ clear: "both" }}></div>
                                            <ul
                                              className={`labelDropLeft labelDropLeft-myteam ${hasIdAvail === item.id &&
                                                callDropdown
                                                ? "isVisible"
                                                : "isHidden"
                                                }`}
                                              id="dropLeft"
                                              ref={(el) =>
                                              (dropdownContactRef.current[
                                                item.id
                                              ] = el)
                                              }
                                              style={{
                                                position: "absolute",
                                                zIndex: "999",
                                                width: "126px",
                                                marginLeft: "-20%",
                                                top: "0%",
                                              }}
                                            >
                                              {/* <li
                                                className="listItem text-start"
                                                role="button"
                                              >
                                                View Details
                                              </li> */}
                                            </ul>
                                            <div className="text-end ">
                                              <p className="contact-text">
                                                {item.call_date_time
                                                  ? convertDateTimeSecondsFormat(
                                                    item.call_date_time
                                                  ).date
                                                  : ""}{" "}
                                                &nbsp;{" "}
                                                {item.call_date_time
                                                  ? convertDateTimeSecondsFormat(
                                                    item.call_date_time
                                                  ).time
                                                  : ""}
                                              </p>
                                              <p className="contact-text">
                                                {item.username}
                                              </p>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
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
        </div>
      ) : null}
    </>
  );
};

export default CallHistoryView;