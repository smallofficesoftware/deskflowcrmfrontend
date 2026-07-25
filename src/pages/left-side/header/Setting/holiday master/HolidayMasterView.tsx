import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  SMALL_WIDTH_FOR_TEXT,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import AddHolidayView from "./AddHolidayView";
import {
  deleteHoliday,
  fetchHolidayApi,
  IHolidayView,
} from "./HolidayMasterController";

export interface IPropsHolidayView {
  isHolidayView: boolean;
  closeHolidayView: () => void;
}

const HolidayMasterView = ({
  isHolidayView,
  closeHolidayView,
}: IPropsHolidayView) => {
  const [holidayList, setHolidayList] = useState<IHolidayView[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [isCreateModel, setIsCreateModel] = useState(false);
  const [isUpdateModel, setIsUpdateModel] = useState(false);

  const [editableHoliday, setEditableHoliday] = useState<
    IHolidayView | undefined
  >();

  const [deleteHolidayIds, setDeleteHolidayIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );

  const PAGE_SIZE = 30;
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { darkMode } = useTheme();

  const canView = useCheckUserPermission(
    PAGE_ID.HOLIDAY_MASTER,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.HOLIDAY_MASTER,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.HOLIDAY_MASTER,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.HOLIDAY_MASTER,
    PERMISSION_TYPE.DELETE,
  );

  useEffect(() => {
    const fetchHolidays = async () => {
      if (isHolidayView && canView) {
        setOffset(0);
        setHasMore(true);
        setHolidayList([]);
        setLoading(true);
        fetchHolidayApi(
          setHolidayList,
          setLoading,
          PAGE_SIZE,
          0,
          false,
        ).then((more) => setHasMore(more));
      }
    };

    fetchHolidays();
  }, [isHolidayView, canView]);

  // On-scroll: fetch next page from API when near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (nearBottom && !isFetchingMore && hasMore) {
        const nextOffset = offset + PAGE_SIZE;
        setIsFetchingMore(true);
        fetchHolidayApi(
          setHolidayList,
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

  const handleRefreshHoliday = async () => {
    if (canView) {
      setOffset(0);
      setHasMore(true);
      setHolidayList([]);
      setLoading(true);
      const more = await fetchHolidayApi(
        setHolidayList,
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

  const handleDeleteHoliday = async () => {
    // if (!canDelete) {
    //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    //     return;
    // }

    await deleteHoliday(deleteHolidayIds, setIsDeleteConfirmation, setLoading);
    setDeleteHolidayIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
    handleRefreshHoliday();
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".icon-more");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));
    if (!clickedInsideDropdown) {
      setOpenDropdownId(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEscapeKey(() => {
    if (!openDropdownId && !isDeleteConfirmation) {
      closeHolidayView();
    } else {
      setOpenDropdownId(null);
      setIsDeleteConfirmation(false);
    }
  });

  return (
    <>
      {isHolidayView ? (
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
                aria-label="New chat"
                onClick={closeHolidayView}
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
              <h2>Holiday Master</h2>
            </div>
            <div className="text-end mb-2">
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "60px",
                }}
              >
                <button
                  className="icons"
                  onClick={() => {
                    if (canAdd) {
                      setIsCreateModel(true);
                    } else {
                      setIsCreateModel(false);
                      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    }
                  }}
                  title="Create Holiday"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#fff"
                  >
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button>
              </div>
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "20px",
                }}
              >
                <button
                  className="icons"
                  onClick={handleRefreshHoliday}
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

          {/* Chats */}
          <div className="chats-notifications" ref={scrollContainerRef}>
            <div className="block p-0">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, index) => (
                        <div className="chats h-100" key={index}>
                          <button className="block chat-list">
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
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <>
                        <div
                          className="chats h-100"
                          style={{ paddingBottom: "100px" }}
                        >
                          {holidayList.length === 0 ? (
                            <p className="text-center pt-5">No Data Found</p>
                          ) : (
                            holidayList.map((item) => (
                              <div
                                key={item.id}
                                className="block chat-list"
                                style={{ padding: "6px" }}
                              >
                                <div className={`h-text ps-2`}>
                                  {item.id === -1 ? (
                                    <span></span>
                                  ) : (
                                    <>
                                      <button
                                        className="icon-more float-end"
                                        onClick={() =>
                                          setOpenDropdownId(
                                            openDropdownId === item.id
                                              ? null
                                              : item.id,
                                          )
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

                                      <ul
                                        className={`price-list-option labelDropLeft ${openDropdownId === item.id ? "isVisible" : "isHidden"}`}
                                        id="dropLeft"
                                        ref={(el) =>
                                        (dropdownContactRef.current[item.id] =
                                          el)
                                        }
                                        style={{
                                          width: "160px",
                                          top: "-75px",
                                          right: "30px",
                                        }}
                                      >
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            if (canEdit) {
                                              setEditableHoliday(item);
                                              setIsUpdateModel(true);
                                            } else {
                                              toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                            }
                                          }}
                                        >
                                          Edit
                                        </li>

                                        <li
                                          className="listItem"
                                          role="button"
                                          style={{
                                            color: "red",
                                            fontWeight: 600,
                                          }}
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            if (canDelete) {
                                              setDeleteHolidayIds([item.id]);
                                              setIsDeleteConfirmation(true);
                                            } else {
                                              toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                            }
                                          }}
                                        >
                                          Delete
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Holiday Date</b>:
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
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.holiday_date
                                          ? `${new Date(item.holiday_date).toLocaleDateString("en-GB")}`
                                          : ""}
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
                                        <b>Holiday Remark</b>:
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
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.holiday_date
                                          ? item.holiday_remark
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
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

          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => {
                setIsDeleteConfirmation(false);
                setDeleteHolidayIds([]);
              }}
              handleSubmit={handleDeleteHoliday}
              title={
                deleteHolidayIds.length > 1
                  ? "Delete Holidays"
                  : "Delete Holiday"
              }
              message={`Are you sure you want to delete ${deleteHolidayIds.length > 1 ? "these holidays" : "this holiday"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <AddHolidayView
          show={isCreateModel}
          onHide={() => setIsCreateModel(false)}
          headerName="Create Holiday"
          productToEdit={undefined}
          setLoading={setLoading}
          handleRefreshHoliday={handleRefreshHoliday}
        />
      )}
      {isUpdateModel && editableHoliday && (
        <AddHolidayView
          show={isUpdateModel}
          onHide={() => setIsUpdateModel(false)}
          headerName="Update Holiday"
          productToEdit={editableHoliday}
          setLoading={setLoading}
          handleRefreshHoliday={handleRefreshHoliday}
        />
      )}
    </>
  );
};

export default HolidayMasterView;
