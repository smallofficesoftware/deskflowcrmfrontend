import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { useTheme } from "../../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import {
  fetchProcessAttendanceApi,
  IProcessAttendanceView,
} from "./ProcessAttendanceController";
import ProcessAttendanceModel from "./ProcessAttendanceModel";

interface IPropsProcessAttendanceView {
  show: boolean;
  onHide: () => void;
}

const formatDateTime = (dateString: string) => {
  if (dateString === "") return "";

  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const months: any = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

const ProcessAttendanceView = ({
  show,
  onHide,
}: IPropsProcessAttendanceView) => {
  const [processAttendanceList, setProcessAttendanceList] = useState<
    IProcessAttendanceView[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showProcessAttendance, setShowProcessAttendance] = useState(false);
  const { darkMode } = useTheme();

  const dropdownContactRef = useRef<Record<string, HTMLUListElement | null>>(
    {},
  );
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  const PAGE_SIZE = 30;
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>();
  const [selectedYear, setSelectedYear] = useState<number>();

  const canView = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.VIEW,
  );

  const canAdd = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.ADD,
  );

  const canEdit = useCheckUserPermission(
    PAGE_ID.PROCESS_ATTENDANCE,
    PERMISSION_TYPE.EDIT,
  );

  useEscapeKey(onHide);

  const toggleDropdown = (itemId: string | undefined) => {
    if (itemId === undefined) return;
    setOpenDropdownId((prevId) => (prevId === itemId ? null : itemId));
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest(".selected-btn");

    if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
      setOpenDropdownId(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  useEffect(() => {
    if (canView && show) {
      setOffset(0);
      setHasMore(true);
      setProcessAttendanceList([]);
      setLoading(true);
      fetchProcessAttendanceApi(
        setProcessAttendanceList,
        setLoading,
        PAGE_SIZE,
        0,
        false,
      ).then((more) => setHasMore(more));
    }
  }, [show, canView]);

  // On-scroll: fetch next page from API when near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 60;

      if (nearBottom && !isFetchingMore && hasMore) {
        const nextOffset = offset + PAGE_SIZE;
        setIsFetchingMore(true);
        fetchProcessAttendanceApi(
          setProcessAttendanceList,
          setLoading,
          PAGE_SIZE,
          nextOffset,
          true, // append
        ).then((more) => {
          setOffset(nextOffset);
          setHasMore(more);
          setIsFetchingMore(false);
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [offset, hasMore, isFetchingMore]);

  const handleRefreshList = async () => {
    if (canView) {
      setOffset(0);
      setHasMore(true);
      setProcessAttendanceList([]);
      setLoading(true);
      const more = await fetchProcessAttendanceApi(
        setProcessAttendanceList,
        setLoading,
        PAGE_SIZE,
        0,
        false,
      );
      setHasMore(more);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelClickProcessAttendance = async () => {
    setShowProcessAttendance(true);
  };

  return (
    <>
      {show ? (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
        >
          {/* Header */}
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons"
                data-tab="2"
                title="Back"
                aria-label="Back"
                onClick={onHide}
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
              <h2>Process Attendance</h2>
            </div>

            <div className="text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "60px" }}
              >
                <button
                  style={{ backgroundColor: "rgb(255, 125, 18)" }}
                  className="btn btn-sm text-white d-flex align-items-center gap-2"
                  onClick={() =>
                    canAdd
                      ? handelClickProcessAttendance()
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                  }
                  title="Process Attendance"
                >
                  Process Att.
                </button>
              </div>
              <div
                className="ICON"
                style={{ position: "absolute", right: "20px" }}
              >
                <button
                  className="icons"
                  onClick={handleRefreshList}
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

          {/* Content */}
          <div className="chats-notifications" ref={scrollContainerRef}>
            <div className="block">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, index) => (
                        <div
                          className="source-of-type-list-grid-main"
                          key={index}
                        >
                          <div className="source-of-type-list-grid-list">
                            <div
                              style={{
                                display: "inline-block",
                                marginLeft: "8px",
                                width: "100%",
                              }}
                            >
                              <Skeleton
                                width="90%"
                                height="28px"
                                duration={5}
                                borderRadius={6}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            <p
                              className={`${
                                processAttendanceList.length > 0
                                  ? ""
                                  : "text-center pt-5"
                              }`}
                            >
                              {processAttendanceList.length > 0
                                ? ""
                                : "No Data Found"}
                            </p>

                            {/* List items */}
                            {processAttendanceList.map((item, index) => {
                              return (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                  style={{
                                    minHeight: "48px",
                                    alignItems: "center",
                                  }}
                                >
                                  {/* Employee name */}
                                  <span
                                    className="fw-semibold mx-1"
                                    style={{
                                      fontSize: "0.83rem",
                                      minWidth: "80px",
                                    }}
                                  >
                                    {`${months[Number(item.month)]}-${item.year} (${formatDateTime(item.last_modified_date || "")})`}
                                  </span>

                                  {/* Options */}
                                  {item.month !== "-1" &&
                                    item.month !== "-2" && (
                                      <>
                                        <button
                                          className="source-of-type-list-grid-options"
                                          id="source-of-types-options-id"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDropdown(item.month);
                                          }}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 19 20"
                                            width="22px"
                                            height="22px"
                                            className="hide animate__animated animate__fadeInUp"
                                          >
                                            <path
                                              fill="currentColor"
                                              d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                            ></path>
                                          </svg>
                                        </button>
                                        <ul
                                          className={`source-of-types-options ${
                                            openDropdownId === item.month
                                              ? "isVisible"
                                              : "isHidden"
                                          }`}
                                          id="dropLeft"
                                          ref={(el) =>
                                            (dropdownContactRef.current[
                                              item.month || "-1"
                                            ] = el)
                                          }
                                          style={{
                                            width: "100px",
                                            marginLeft: "60%",
                                          }}
                                        >
                                          <li
                                            className="listItem"
                                            role="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (canEdit) {
                                                setOpenDropdownId(null);
                                                setSelectedMonth(
                                                  Number(item.month),
                                                );
                                                setSelectedYear(
                                                  Number(item.year),
                                                );
                                                handelClickProcessAttendance();
                                              } else {
                                                toast.error(
                                                  DEFAULT_MESSAGE_ERROR_PERMISSION,
                                                );
                                              }
                                            }}
                                          >
                                            Re Process
                                          </li>
                                        </ul>
                                      </>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bottom loader while fetching more from API */}
                        {isFetchingMore && (
                          <div className="source-of-type-list-grid-main">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                className="source-of-type-list-grid-list"
                                key={`more-skeleton-${i}`}
                              >
                                <div
                                  style={{
                                    display: "inline-block",
                                    marginLeft: "8px",
                                    width: "100%",
                                  }}
                                >
                                  <Skeleton
                                    width="90%"
                                    height="28px"
                                    duration={5}
                                    borderRadius={6}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* End of list indicator */}
                        {!isFetchingMore &&
                          !hasMore &&
                          processAttendanceList.length > 0 && (
                            <div
                              className="text-center text-muted py-2"
                              style={{ fontSize: "0.76rem" }}
                            >
                              — {processAttendanceList.length} record
                              {processAttendanceList.length !== 1 ? "s" : ""} —
                            </div>
                          )}
                      </>
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
      {showProcessAttendance && (
        <ProcessAttendanceModel
          show={showProcessAttendance}
          onHide={() => {
            setShowProcessAttendance(false);
          }}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}
    </>
  );
};

export default ProcessAttendanceView;
