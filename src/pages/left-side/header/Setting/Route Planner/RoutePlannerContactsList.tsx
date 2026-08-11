import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { convertDateTimeFormat, useEscapeKey } from "../../../../../common/SharedFunction";
import { useTheme } from "../../../../../components/ThemeContext";
import {
    DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { IUserList, updateIsUnRead } from "../../../LeftSideController";
import { fetchContactsApi, fetchSelectedContactsList, ISelectedContacts } from "./RoutePlannerController";

export interface IPropsRoutePlannerContactsList {
    show: boolean;
    onHide: () => void;
    routeId: number;
    openContactRightView: (item: IUserList) => void;
    fromSideView: boolean;
}

const RoutePlannerContactsList = ({
    show,
    onHide,
    routeId,
    openContactRightView,
    fromSideView = false,
}: IPropsRoutePlannerContactsList) => {
    const [selectedContacts, setSelectedContacts] = useState<ISelectedContacts[]>([]);
    const [contactList, setContactList] = useState<IUserList[]>([]);
    const [loading, setLoading] = useState(false);

    const PAGE_SIZE = 30;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { darkMode } = useTheme();

    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isHover, setIsHover] = useState(false);

    const [showDashBoard, setshowDashBoard] = useState(false);
    const [showAichat, setshowAichat] = useState(false);
    const [contInfo, setcontInfo] = useState<IUserList>();
    const [isRefers, setIsRefers] = useState(true);
    const [editorContentToEdit, setEditorContentToEdit] = useState<string>("");
    const [isLoadContact, setIsLoadContact] = useState(true);
    const [noDataFound1, setNoDataFound1] = useState(false);
    const [resetRightSideTrigger, setResetRightSideTrigger] = useState(0);
    const [searchTermFromRightSide, setSearchTermFromRightSide] =
        useState<string>("");
    const [idFromRightSide, setIdFromRightSide] = useState<number>(0);

    const canViewMsg = useCheckUserPermission(
        PAGE_ID.CONTACT_MESSAGE_HISTORY,
        PERMISSION_TYPE.VIEW,
    );

    useEffect(() => {
        const fetchContacts = async () => {
            if (show && routeId) {
                setOffset(0);
                setHasMore(true);
                setContactList([]);
                setLoading(true);
                await fetchContactsApi(
                    setContactList,
                    setLoading,
                    PAGE_SIZE,
                    0,
                    false,
                    undefined,
                    routeId
                ).then((more) => setHasMore(more));
            }
        };

        fetchContacts();
    }, [show, routeId]);

    // On-scroll: fetch next page from API when near bottom
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !routeId) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const nearBottom = scrollTop + clientHeight >= scrollHeight - 10;

            if (nearBottom && !isFetchingMore && hasMore) {
                const nextOffset = offset + PAGE_SIZE;
                setIsFetchingMore(true);
                fetchContactsApi(
                    setContactList,
                    setLoading,
                    PAGE_SIZE,
                    nextOffset,
                    true, // append
                    undefined,
                    routeId
                ).then((more) => {
                    setOffset(nextOffset);
                    setHasMore(more);
                    setIsFetchingMore(false);
                });
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [offset, hasMore, isFetchingMore, routeId]);

    const handleRefreshContacts = async () => {
        if (show && routeId) {
            setOffset(0);
            setHasMore(true);
            setContactList([]);
            setLoading(true);
            const more = await fetchContactsApi(
                setContactList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
                undefined,
                routeId
            );
            setHasMore(more);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest(".icon-more");
        if (clickedOnButton) return;
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEscapeKey(() => {
        onHide();
    });

    return (
        <>
            {show ? (
                <div
                    className={`notifications animate__animated h-100 ${fromSideView ? "animate__fadeInRight" : "animate__fadeInLeft"}`}
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
                            <h2>Route {routeId}'s Contacts</h2>
                        </div>
                        <div className="text-end mb-2">
                            <div
                                className="ICON"
                                style={{
                                    position: "absolute",
                                    right: "20px",
                                }}
                            >
                                <button
                                    className="icons"
                                    onClick={handleRefreshContacts}
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
                                {true ? (
                                    <div>
                                        {loading ? (
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
                                                                    style={{ opacity: darkMode ? "" : 0.5 }}
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
                                        ) : (
                                            <>
                                                <div
                                                    className="chats h-100"
                                                    style={{ paddingBottom: "100px" }}
                                                >
                                                    {contactList.length === 0 ? (
                                                        <p className="text-center pt-5">No Data Found</p>
                                                    ) : (
                                                        contactList.map((item, index) => {
                                                            return (
                                                                <>
                                                                    <button
                                                                        key={index}
                                                                        className={`block chat-list ${activeIndex === index ? "active" : ""
                                                                            } d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center`}
                                                                        onClick={(e) => {
                                                                            if (item.is_unread === 1) {
                                                                                updateIsUnRead(item.id, setIsRefers, 1);
                                                                                // Update local state immediately for better UX
                                                                                setContactList((prev) =>
                                                                                    prev.map((task) =>
                                                                                        task.id === item.id ? { ...task, is_unread: 0 } : task,
                                                                                    ),
                                                                                );
                                                                            }
                                                                            setActiveIndex(index);
                                                                            openContactRightView(item);
                                                                        }}
                                                                        style={{ position: "relative" }}
                                                                    >
                                                                        <div
                                                                            className={`${item.is_unread === 1
                                                                                ? "imgBox-isRead-line"
                                                                                : ""
                                                                                }`}
                                                                        ></div>
                                                                        <div
                                                                            className="h-text"
                                                                            style={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center",
                                                                            }}
                                                                        >
                                                                            <div className="h-text">
                                                                                <div style={{ position: "relative" }}>
                                                                                    <div
                                                                                        className={`head flex-grow-1 d-flex justify-content-start align-items-start p-0`}
                                                                                        style={{ border: "none" }}
                                                                                    >
                                                                                        <div className="d-flex flex-column">
                                                                                            <h6
                                                                                                className="d-flex justify-content-start align-items-start"
                                                                                                style={{
                                                                                                    wordBreak: "break-word",
                                                                                                    maxWidth: "150px",
                                                                                                    whiteSpace: "nowrap",
                                                                                                    overflow: "hidden",
                                                                                                    textOverflow: "ellipsis",
                                                                                                    padding: "0px",
                                                                                                    fontWeight: "bold",
                                                                                                    fontSize: "14px",
                                                                                                    margin: "0px",
                                                                                                    marginBottom: "2px",
                                                                                                }}
                                                                                            >
                                                                                                {item.company_name}
                                                                                            </h6>
                                                                                            <h4
                                                                                                className="d-flex justify-content-start align-items-start"
                                                                                                style={{
                                                                                                    wordBreak: "break-word",
                                                                                                    maxWidth: "150px",

                                                                                                    whiteSpace: "nowrap",
                                                                                                    overflow: "hidden",
                                                                                                    textOverflow: "ellipsis",
                                                                                                    padding: "0px",
                                                                                                    fontSize: "12px",
                                                                                                    margin: "0px",
                                                                                                }}
                                                                                            >
                                                                                                {item.person_name}
                                                                                            </h4>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="message-chat">
                                                                                    {/* EMAIL,CONTARY,STATE,CITY,NUMBER */}
                                                                                    <div className="chat-text-icon">
                                                                                        <span
                                                                                            className={`thanks`}
                                                                                            style={{ fontSize: "11px" }}
                                                                                        >
                                                                                            {item.mobile_number}
                                                                                            {/* {item.mobile_number ? "," : ""}
                                                                                                      </span>
                                                                                                      <span className="thanks">
                                                                                                        {item.email_id}
                                                                                                        {item.email_id ? "," : ""} */}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {item && item.is_archive === 1 && (
                                                                                    <div style={{ textAlign: "left" }}>
                                                                                        <span
                                                                                            style={{
                                                                                                backgroundColor: "#6c6464",
                                                                                                border: "#6c6464",
                                                                                                padding: "4px",
                                                                                                borderRadius: "15px",
                                                                                                fontSize: "10px",
                                                                                            }}
                                                                                        >
                                                                                            Archive
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                <div className="message-chat ">
                                                                                    <div
                                                                                        className="chat-text-icon"
                                                                                        style={{ fontSize: "11px" }}
                                                                                    >
                                                                                        {/* <span className="thanks">
                                                                                                      {item.country_name}
                                                                                                      {item.country_name ? "," : ""}
                                                                                                    </span> */}

                                                                                        <span
                                                                                            className="thanks"
                                                                                            style={{
                                                                                                fontSize: "11px",
                                                                                                marginRight: "2px",
                                                                                            }}
                                                                                        >
                                                                                            {item.city_name}
                                                                                            {item.city_name ? "," : ""}
                                                                                        </span>
                                                                                        <span
                                                                                            className="thanks"
                                                                                            style={{ fontSize: "11px" }}
                                                                                        >
                                                                                            {item.state_name}
                                                                                            {/* {item.state_name ? "," : ""} */}
                                                                                        </span>
                                                                                        <span
                                                                                            className="thanks"
                                                                                            style={{ fontSize: "11px" }}
                                                                                        >
                                                                                            {item.area_name}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-start">
                                                                                    {item.label_color && item.label_name
                                                                                        ? item.label_color
                                                                                            .split(",")
                                                                                            .map((color, index) => (
                                                                                                <span
                                                                                                    key={index}
                                                                                                    style={{
                                                                                                        display: "inline-block",
                                                                                                    }}
                                                                                                >
                                                                                                    <span
                                                                                                        style={{
                                                                                                            backgroundColor:
                                                                                                                color.trim(),
                                                                                                            padding: "2px 6px",
                                                                                                            borderRadius: "8px",
                                                                                                            fontSize: "10px",
                                                                                                            marginRight: "4px",
                                                                                                            fontWeight: "normal",
                                                                                                        }}
                                                                                                        className="badge"
                                                                                                    >
                                                                                                        {item.label_name
                                                                                                            .split(",")
                                                                                                        [index].trim()}
                                                                                                    </span>
                                                                                                </span>
                                                                                            ))
                                                                                        : ""}
                                                                                    {item.client_code &&
                                                                                        item.client_code.length > 0 && (
                                                                                            <>
                                                                                                <br />
                                                                                                <span
                                                                                                    style={{ fontSize: "11px" }}
                                                                                                >
                                                                                                    client code : {item.client_code}
                                                                                                </span>
                                                                                            </>
                                                                                        )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-6">
                                                                                <div className="text-end">
                                                                                    {item.reminderDueCount > 0 && (
                                                                                        <>
                                                                                            {!isHover && (
                                                                                                <span
                                                                                                    title="Reminder"
                                                                                                    onMouseEnter={() =>
                                                                                                        setIsHover(true)
                                                                                                    }
                                                                                                >
                                                                                                    <svg
                                                                                                        height="24px"
                                                                                                        viewBox="0 -960 960 960"
                                                                                                        width="24px"
                                                                                                        fill="currentColor"
                                                                                                    >
                                                                                                        <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                                                                                                    </svg>
                                                                                                </span>
                                                                                            )}
                                                                                            {isHover && (
                                                                                                <span
                                                                                                    onMouseLeave={() =>
                                                                                                        setIsHover(false)
                                                                                                    }
                                                                                                    title="Reminder"
                                                                                                    style={{
                                                                                                        width: "30px",
                                                                                                        height: "30px",
                                                                                                        backgroundColor: "red",
                                                                                                        padding: "7px",
                                                                                                        fontSize: "9px",
                                                                                                        color: "#fff",
                                                                                                        borderRadius: "15px",
                                                                                                    }}
                                                                                                >
                                                                                                    {item.reminderDueCount}&nbsp;
                                                                                                </span>
                                                                                            )}
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-end">
                                                                                    <span
                                                                                        style={{
                                                                                            backgroundColor:
                                                                                                item.source_name_color
                                                                                                    ? item.source_name_color
                                                                                                    : "#eeeeee ",
                                                                                            fontWeight: "normal",
                                                                                        }}
                                                                                        className="badge rounded-pill "
                                                                                    >
                                                                                        {item.source_name}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-end">
                                                                                    <span
                                                                                        style={{
                                                                                            backgroundColor:
                                                                                                item.stage_status_color
                                                                                                    ? item.stage_status_color
                                                                                                    : "#eeeeee ",
                                                                                            fontWeight: "normal",
                                                                                            fontSize: "10px",
                                                                                        }}
                                                                                        className="badge rounded-pill"
                                                                                    >
                                                                                        {item.stage_status_name}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="">
                                                                                    <div className="text-end">
                                                                                        <p className="contact-text">
                                                                                            {item.created_date_time
                                                                                                ? convertDateTimeFormat(
                                                                                                    item.created_date_time,
                                                                                                ).date
                                                                                                : ""}
                                                                                            &nbsp;{" "}
                                                                                            {/* Space between date and time */}
                                                                                            {item.created_date_time
                                                                                                ? convertDateTimeFormat(
                                                                                                    item.created_date_time,
                                                                                                ).time
                                                                                                : ""}{" "}
                                                                                            <br />
                                                                                            <span
                                                                                                title={
                                                                                                    item.assined_team_person_list
                                                                                                }
                                                                                            >
                                                                                                {item.teamMemberName}
                                                                                            </span>
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                </>
                                                            );
                                                        })
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
                </div>
            ) : null}
        </>
    );
};

export default RoutePlannerContactsList;