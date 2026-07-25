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
  proceedToEmpAccountApi, // TODO: implement in SalaryProcessController
} from "./SalaryProcessController";
import SalaryProcessModel from "./SalaryProcessModel";
import ConfirmModal from "./ConfirmModal"; // ← new

interface IPropsSalaryProcessView {
  show: boolean;
  onHide: () => void;
}

const formatDateTime = (dateString: string) => {
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

const SalaryProcessView = ({ show, onHide }: IPropsSalaryProcessView) => {
  const [processAttendanceList, setProcessAttendanceList] = useState<
    IProcessAttendanceView[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showProcessAttendance, setShowProcessAttendance] = useState(false);
  const { darkMode } = useTheme();

  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  const PAGE_SIZE = 30;
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>();
  const [selectedYear, setSelectedYear] = useState<number>();

  // ── Proceed confirm state ──────────────────────────────────────
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [proceedItem, setProceedItem] = useState<IProcessAttendanceView | null>(
    null,
  );
  const [isProceedLoading, setIsProceedLoading] = useState(false);
  // ──────────────────────────────────────────────────────────────

  const canView = useCheckUserPermission(
    PAGE_ID.SALARY_PROCESS,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.SALARY_PROCESS,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.SALARY_PROCESS,
    PERMISSION_TYPE.EDIT,
  );
  const canEditEmpAccHis = useCheckUserPermission(
    PAGE_ID.EMP_ACCOUNT_HISTORY,
    PERMISSION_TYPE.ADD,
  );

  useEscapeKey(onHide);

  const toggleDropdown = (itemId: number | undefined) => {
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
      if (event.key === "Escape") setOpenDropdownId(null);
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
          true,
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

  // ── Proceed confirm handler ────────────────────────────────────
  const handleProceedConfirm = async () => {
    if (!proceedItem) return;
    await proceedToEmpAccountApi(
      Number(proceedItem.month),
      Number(proceedItem.year),
      setShowProceedConfirm,
      setProceedItem,
      handleRefreshList,
      setIsProceedLoading,
    );
  };
  // ──────────────────────────────────────────────────────────────

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
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="newText">
              <h2>Salary Process</h2>
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
                  title="Generate Salary"
                >
                  Generate Salary
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
                              className={`${processAttendanceList.length > 0 ? "" : "text-center pt-5"}`}
                            >
                              {processAttendanceList.length > 0
                                ? ""
                                : "No Data Found"}
                            </p>

                            {processAttendanceList.map((item, index) => {
                              return (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                  style={{
                                    minHeight: "48px",
                                    alignItems: "center",
                                    position: "relative",
                                  }}
                                >
                                  <span
                                    className="fw-semibold mx-1"
                                    style={{
                                      fontSize: "0.83rem",
                                      minWidth: "80px",
                                    }}
                                  >
                                    {`${months[Number(item.month)]}-${item.year} (${formatDateTime(item.last_modified_date)})`}
                                  </span>

                                  {item.id !== -1 && item.id !== -2 && (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdown(item.id);
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
                                          />
                                        </svg>
                                      </button>
                                      <ul
                                        className={`source-of-types-options ${
                                          openDropdownId === item.id
                                            ? "isVisible"
                                            : "isHidden"
                                        }`}
                                        ref={(el) =>
                                          (dropdownContactRef.current[item.id] =
                                            el)
                                        }
                                        style={{
                                          width: "210px",
                                          right: "8px",
                                          left: "auto",
                                          marginLeft: "0",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {/* Re Calculate */}
                                        <li
                                          className="listItem"
                                          role="button"
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
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
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="20px"
                                            viewBox="0 -960 960 960"
                                            width="20px"
                                            fill="currentColor"
                                            style={{ flexShrink: 0 }}
                                          >
                                            <path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z" />
                                          </svg>
                                          Re Calculate
                                        </li>

                                        {/* Proceed To Emp. A/c */}
                                        <li
                                          className="listItem"
                                          role="button"
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (canEditEmpAccHis) {
                                              setOpenDropdownId(null);
                                              setProceedItem(item);
                                              setShowProceedConfirm(true);
                                            } else {
                                              toast.error(
                                                DEFAULT_MESSAGE_ERROR_PERMISSION,
                                              );
                                            }
                                          }}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="currentColor"
                                            style={{ flexShrink: 0 }}
                                          >
                                            <path d="M200-200v-560 560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v100h-80v-100H200v560h560v-100h80v100q0 33-23.5 56.5T760-120H200Zm320-160q-33 0-56.5-23.5T440-360v-240q0-33 23.5-56.5T520-680h280q33 0 56.5 23.5T880-600v240q0 33-23.5 56.5T800-280H520Zm280-80v-240H520v240h280Zm-117.5-77.5Q700-455 700-480t-17.5-42.5Q665-540 640-540t-42.5 17.5Q580-505 580-480t17.5 42.5Q615-420 640-420t42.5-17.5Z" />
                                          </svg>
                                          Proceed To Emp. A/c
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

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

      {/* SalaryProcessModel (Re Calculate) */}
      {showProcessAttendance && (
        <SalaryProcessModel
          show={showProcessAttendance}
          onHide={() => setShowProcessAttendance(false)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onComplete={handleRefreshList}
        />
      )}

      {/* Proceed to Emp. A/c — Confirm */}
      <ConfirmModal
        show={showProceedConfirm}
        onHide={() => setShowProceedConfirm(false)}
        onConfirm={handleProceedConfirm}
        title="Proceed to Employee A/c?"
        message={
          <>
            This will transfer the salary for{" "}
            <strong style={{ color: "#333" }}>
              {proceedItem
                ? `${months[Number(proceedItem.month)]}-${proceedItem.year}`
                : ""}
            </strong>{" "}
            to employee accounts. {/* This action cannot be undone. */}
          </>
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        isLoading={isProceedLoading}
      />
    </>
  );
};

export default SalaryProcessView;
