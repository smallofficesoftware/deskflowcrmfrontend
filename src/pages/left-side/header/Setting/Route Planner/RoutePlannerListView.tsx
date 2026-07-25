import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../../components/model/CheckBoxFilterModal";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import RadioButtonModal from "../../../../../components/model/RadioButtonModal";
import { useTheme } from "../../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IFilterPayload } from "../../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../../store/report/useCommonFilterStore";
import { formatDateToDDMMYYYY } from "../../../../dashboard/Reports/Salary Register/SalaryRegisterReport";
import { IUserList } from "../../../LeftSideController";
import AddRoutePlannerView from "./AddRoutePlannerView";
import RouteAssignContact from "./RouteAssignContact";
import RoutePlannerContactsList from "./RoutePlannerContactsList";
import { assignStatusToRoute, deleteRouteApi, fetchRouteList, fetchStageStatusApiForRoute, IRouteView } from "./RoutePlannerController";

interface IPropsRoutesView {
    show: boolean;
    onHide: () => void;
    openContactRightView: (item: IUserList | null) => void;
}

const PAGE_SIZE = 30;

const RoutePlannerListView = ({
    show,
    onHide,
    openContactRightView
}: IPropsRoutesView) => {

    const [routeList, setRouteList] = useState<IRouteView[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Modal visibility
    const [showAddRouteView, setShowAddRouteView] = useState(false);
    const [showUpdateRouteView, setShowUpdateRouteView] = useState(false);
    const [editableRoute, setEditableRoute] = useState<Partial<IRouteView>>({
        id: 0,
        employee_id: 0,
        start_date: "",
        end_date: "",
        country_id: 0,
        state_id: 0,
        city_id: 0,
        area_id: 0,
        remark: ""
    });

    // Dropdown
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownRefs = useRef<Record<number, HTMLUListElement | null>>({});

    const [deleteRouteIds, setDeleteRouteIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const { darkMode } = useTheme();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [openRouteAssignContact, setOpenRouteAssignContact] = useState<boolean>(false);
    const [routeId, setRouteId] = useState<number>(0);
    const [contactFilterObject, setContactFilterObject] = useState({
        country: 0,
        state: 0,
        city: 0,
        area: 0,
        country_name: "",
        state_name: "",
        city_name: "",
        area_name: "",
    });

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [hover, setHover] = useState(false);

    const [statusAssignRouteId, setStatusAssignRouteId] = useState<number>();
    const [routeCurrentStatus, setRouteCurrentStatus] = useState<number>();
    const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
        useState<boolean>(false);
    const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
        [],
    );

    const [isOpenContactList, setIsOpenContactList] = useState<boolean>(false);

    const { getFilter, setFilter, setFilters, clearFilters } =
        useCommonFilterStore();

    const filters = getFilter("Route_Planner_List_View");

    const [hasData, setHasData] = useState<boolean>(false);
    const [isModalFilterVisible, setIsModalFilterVisible] =
        useState<boolean>(false);

    const canViewStatus = useCheckUserPermission(
        PAGE_ID.STATUS,
        PERMISSION_TYPE.VIEW,
    );
    const canViewSmartFilter = useCheckUserPermission(
        PAGE_ID.SMART_SEARCH_AND_FILTER,
        PERMISSION_TYPE.VIEW,
    );

    useEffect(() => {
        if (!filters.startSearchDate || !filters.endSearchDate) {
            const [startDate, endDate] = getCurrentMonthDateRange();

            setFilters("Route_Planner_List_View", {
                ...filters,
                startSearchDate: startDate,
                endSearchDate: endDate,
                selectedDateArray: [
                    startDate,
                    endDate,
                ],
            });
        }
    }, []);

    useEscapeKey(onHide);

    // Click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.closest(".source-of-type-list-grid-options")) return;

            const insideDropdown = Object.values(dropdownRefs.current).some(
                (ref) => ref && ref.contains(target),
            );
            if (!insideDropdown) setOpenDropdownId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenDropdownId(null);
        };
        document.addEventListener("keydown", handleEscKey);
        return () => document.removeEventListener("keydown", handleEscKey);
    }, []);

    // Load on open
    useEffect(() => {
        if (!show) return;
        setOffset(0);
        setHasMore(true);
        setRouteList([]);
        setLoading(true);
        fetchRouteList(
            setRouteList,
            setLoading,
            searchTerm,
            PAGE_SIZE,
            0,
            false,
            filters.startSearchDate,
            filters.endSearchDate,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
        ).then(
            setHasMore,
        );
    }, [
        show,
        searchTerm,
        filters.startSearchDate,
        filters.endSearchDate,
        filters.checkedOptionsStageStatus,
        filters.checkedOptionsUser,
    ]);

    // Infinite scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (
                scrollTop + clientHeight >= scrollHeight - 60 &&
                !isFetchingMore &&
                hasMore
            ) {
                const nextOffset = offset + PAGE_SIZE;
                setIsFetchingMore(true);
                fetchRouteList(
                    setRouteList,
                    setLoading,
                    searchTerm,
                    PAGE_SIZE,
                    nextOffset,
                    true,
                    filters.startSearchDate,
                    filters.endSearchDate,
                    filters.checkedOptionsStageStatus,
                    filters.checkedOptionsUser,
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

    const handleDeleteRoute = async () => {
        if (deleteRouteIds.length <= 0) return;

        await deleteRouteApi(deleteRouteIds, setIsDeleteConfirmation, setLoading);

        setDeleteRouteIds([]);
        handleRefreshRoutes();
        // If it fails (like having active production entries),
        // we keep the modal open or let the user close it, and the toast shows the error.
    };

    const handleRefreshRoutes = async () => {
        if (false) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }
        setOffset(0);
        setHasMore(true);
        setRouteList([]);
        setLoading(true);
        const more = await fetchRouteList(
            setRouteList,
            setLoading,
            "",
            PAGE_SIZE,
            0,
            false,
            filters.startSearchDate,
            filters.endSearchDate,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
        );
        setHasMore(more);
    };

    const handleOpenRouteEdit = (item: IRouteView) => {
        setEditableRoute({
            id: item.id,
            employee_id: item.employee_id,
            start_date: item.start_date,
            end_date: item.end_date,
            country_id: item.country_id,
            state_id: item.state_id,
            city_id: item.city_id,
            area_id: item.area_id,
            remark: item.remark
        })
        setOpenDropdownId(null);
        setShowUpdateRouteView(true);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
    };

    useEffect(() => {
        if (isModalAssignStatusVisible) {
            fetchStageStatusApiForRoute(
                setOptionRadioButtonStatus,
                routeCurrentStatus,
            );
        } else {
            setOptionRadioButtonStatus([]);
            setRouteCurrentStatus(0);
        }
    }, [isModalAssignStatusVisible]);

    const handleModalOpenStatusAssign = (
        id?: number | undefined,
        currentStatus?: number | undefined,
    ) => {
        if (canViewStatus) {
            if (id) {
                setStatusAssignRouteId(id);
            }

            if (currentStatus) {
                setRouteCurrentStatus(currentStatus);
            }
            setIsModalAssignStatusVisible(true);
        } else {
            setIsModalAssignStatusVisible(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleConfirmRadioButton = async (
        checkedOptions: number | undefined,
    ) => {
        if (!statusAssignRouteId || !checkedOptions) {
            return;
        }

        await assignStatusToRoute(
            setLoading,
            checkedOptions,
            statusAssignRouteId,
        );

        setTimeout(() => {
            handleRefreshRoutes();
        }, 100);

        setIsModalAssignStatusVisible(false);
    };

    const openFilterLabel = () => {
        if (canViewSmartFilter) {
            setIsModalFilterVisible(true);
        } else {
            setIsModalFilterVisible(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleFilterModalClose = () => {
        setIsModalFilterVisible(false);
    };

    const getCurrentMonthDateRange = () => {
        const now = new Date();

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return [startOfMonth, endOfMonth];
    };

    const handleConfirmFilter = async (
        filterPayload: IFilterPayload
    ) => {
        const [startDate, endDate] = getCurrentMonthDateRange();

        const updatedFilters = {
            ...filterPayload,
            checkedOptionsUser: filterPayload.checkedOptionsUser || [],
            checkedOptionsStageStatus: filterPayload.checkedOptionsStageStatus || [],
            startSearchDate: filterPayload?.startSearchDate || startDate,
            endSearchDate: filterPayload?.endSearchDate || endDate,
            selectedDateArray: [
                filterPayload?.startSearchDate || startDate,
                filterPayload?.endSearchDate || endDate,
            ],
        };

        setFilters("Route_Planner_List_View", updatedFilters);

        const hasData = updatedFilters.checkedOptionsUser.length > 0 ||
            updatedFilters.checkedOptionsStageStatus.length > 0;

        setHasData(hasData);

        setIsModalFilterVisible(false);
    };

    const handleOpenContactList = (routeId: number) => {
        setIsModalAssignStatusVisible(false);
        setOpenRouteAssignContact(false);
        setRouteId(routeId);
        setIsOpenContactList(true);
    }

    return (
        <>
            {show ? (
                <>
                    {isOpenContactList ? (
                        <RoutePlannerContactsList
                            show={isOpenContactList}
                            onHide={() => {
                                openContactRightView(null);
                                setIsOpenContactList(false);
                            }}
                            routeId={routeId}
                            openContactRightView={openContactRightView}
                            fromSideView={false}
                        />
                    ) : (
                        <div
                            className="notifications animate__animated animate__fadeInLeft leftSide"
                            id="notifications"
                        >
                            {/* Header */}
                            <div className="header-Chat">
                                <div className="ICON">
                                    <div
                                        role="button"
                                        className="icons"
                                        title="Back"
                                        onClick={onHide}
                                    >
                                        <svg viewBox="0 0 24 24" width="24" height="24">
                                            <path
                                                fill="currentColor"
                                                d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className="newText">
                                    <h2>Route Planner</h2>
                                </div>

                                <div className="text-end mb-2">

                                    <div
                                        className="ICON"
                                        style={{ position: "absolute", right: "60px" }}
                                    >
                                        <button className="icons " onClick={openFilterLabel}>
                                            <span title="Filter Job Card">
                                                {hasData ? (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        height="24px"
                                                        viewBox="0 -960 960 960"
                                                        width="24px"
                                                        fill={hasData ? "red" : "currentColor"}
                                                    >
                                                        <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        height="24px"
                                                        viewBox="0 -960 960 960"
                                                        width="24px"
                                                        fill={hasData ? "red" : "currentColor"}
                                                    >
                                                        <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                                                    </svg>
                                                )}
                                            </span>
                                        </button>

                                        <button
                                            // style={{ backgroundColor: "rgb(255, 125, 18)" }}
                                            className="icons text-white"
                                            title="Add Route"
                                            onClick={() =>
                                                true
                                                    ? setShowAddRouteView(true)
                                                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                                            }
                                        >
                                            <span className="text-white">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>

                                    {/* Refresh button */}
                                    <div
                                        className="ICON"
                                        style={{ position: "absolute", right: "20px" }}
                                    >
                                        <button
                                            className="icons"
                                            onClick={handleRefreshRoutes}
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
                            <div className="d-flex flex-column" style={{ height: "calc(100% - 110px)" }}>
                                {true ? (
                                    <div className="search-bar">
                                        <div>
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
                                                title="Search Route No. or Remark"
                                                aria-label="Search Route No. or Remark"
                                                placeholder="Search Route"
                                                maxLength={SMALL_TEXT_LENGTH}
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                            {searchTerm && (<span
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
                                                onClick={() => setSearchTerm("")}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                                </svg>
                                            </span>)}
                                        </div>
                                    </div>
                                ) : (
                                    <span></span>
                                )}
                                {/* Content */}
                                <div className="chats-notifications" ref={scrollContainerRef} style={{ height: "calc(100% - 38px)" }}>
                                    <div className="block p-0">
                                        <div className="h-text">
                                            {true ? (
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
                                                                {routeList.length === 0 ? (
                                                                    <p className="text-center pt-5">No Data Found</p>
                                                                ) : (
                                                                    routeList.map((item) => (
                                                                        <div
                                                                            key={item.id}
                                                                            className="block chat-list"
                                                                            style={{ padding: "6px" }}
                                                                            onClick={() => {
                                                                                handleOpenContactList(item.id)
                                                                            }}
                                                                        >
                                                                            <div
                                                                                className="mx-1 d-flex flex-column"
                                                                                style={{ overflow: "hidden", width: "70%" }}
                                                                            >
                                                                                <span
                                                                                    className="fw-semibold"
                                                                                    style={{ fontSize: "0.83rem" }}
                                                                                >
                                                                                    <span
                                                                                        style={{
                                                                                            color: "#f58634",
                                                                                            marginRight: "5px",
                                                                                        }}
                                                                                    >
                                                                                        #{item.id}
                                                                                    </span>
                                                                                    {/* 👆 ======================= 👆 */}

                                                                                    {item.employee_name}
                                                                                </span>
                                                                                <span
                                                                                    className="text-muted"
                                                                                    style={{ fontSize: "0.73rem" }}
                                                                                >
                                                                                    <span className="fw-semibold">Country: </span> {item.country_name}
                                                                                </span>
                                                                                <span
                                                                                    className="text-muted"
                                                                                    style={{ fontSize: "0.73rem" }}
                                                                                >
                                                                                    <span className="fw-semibold">State: </span> {item.state_name}
                                                                                </span>
                                                                                <span
                                                                                    className="text-muted"
                                                                                    style={{ fontSize: "0.73rem" }}
                                                                                >
                                                                                    <span className="fw-semibold">City: </span> {item.city_name}
                                                                                </span>
                                                                                {item.area_name && (
                                                                                    <span
                                                                                        className="text-muted"
                                                                                        style={{ fontSize: "0.73rem" }}
                                                                                    >
                                                                                        <span className="fw-semibold">Area: </span> {item.area_name}
                                                                                    </span>
                                                                                )}
                                                                                <span
                                                                                    className="text-muted"
                                                                                    style={{ fontSize: "0.73rem" }}
                                                                                >
                                                                                    <span className="d-flex fw-semibold" style={{ fontSize: "0.73rem" }}>Remark:
                                                                                        <span
                                                                                            className="inquiry-front ms-1"
                                                                                            style={{
                                                                                                display: "-webkit-box",
                                                                                                WebkitLineClamp: 4,
                                                                                                WebkitBoxOrient: "vertical",
                                                                                                overflow: "hidden",
                                                                                                whiteSpace: "normal",
                                                                                                fontSize: "0.73rem"
                                                                                            }}
                                                                                        >
                                                                                            {item.remark
                                                                                                ? item.remark
                                                                                                : "-"}
                                                                                        </span>
                                                                                    </span>
                                                                                </span>
                                                                            </div>

                                                                            {/* 👇 NEW: Wrap the button and dropdown in a relative container 👇 */}
                                                                            <div
                                                                                className="text-end d-flex flex-column align-items-end"
                                                                                style={{ position: "relative", alignSelf: "stretch", width: "30%" }}
                                                                            >
                                                                                {/* Dropdown toggle */}
                                                                                <button
                                                                                    className="source-of-type-list-grid-options mb-1"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenDropdownId((prev) =>
                                                                                            prev === item.id ? null : item.id,
                                                                                        );
                                                                                    }}
                                                                                    style={{
                                                                                        background: "transparent",
                                                                                        border: "none",
                                                                                        cursor: "pointer",
                                                                                        width: "36px"
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

                                                                                {/* Dropdown menu */}
                                                                                <ul
                                                                                    className={`labelDropLeft ${openDropdownId === item.id ? "isVisible" : "isHidden"} text-start`}
                                                                                    id="dropLeft"
                                                                                    ref={(el) =>
                                                                                        (dropdownRefs.current[item.id] = el)
                                                                                    }
                                                                                    style={{
                                                                                        right: "25%",
                                                                                        top: "-15%",
                                                                                        width: "160px",
                                                                                    }}
                                                                                >
                                                                                    <li
                                                                                        className="listItem"
                                                                                        role="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleOpenRouteEdit(item);
                                                                                            setOpenDropdownId(null);
                                                                                        }}
                                                                                        style={{
                                                                                            padding: "8px 12px",
                                                                                            cursor: "pointer",
                                                                                        }}
                                                                                    >
                                                                                        Edit
                                                                                    </li>

                                                                                    {/* Existing Delete Option */}
                                                                                    <li
                                                                                        className="listItem text-danger"
                                                                                        role="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (true) {
                                                                                                setDeleteRouteIds([item.id]);
                                                                                                setOpenDropdownId(null);
                                                                                                setIsDeleteConfirmation(true);
                                                                                            } else {
                                                                                                toast.error(
                                                                                                    DEFAULT_MESSAGE_ERROR_PERMISSION,
                                                                                                );
                                                                                            }
                                                                                        }}
                                                                                        style={{
                                                                                            padding: "8px 12px",
                                                                                            cursor: "pointer",
                                                                                            borderTop: "1px solid #f8f9fa",
                                                                                        }}
                                                                                    >
                                                                                        Delete
                                                                                    </li>

                                                                                    <li
                                                                                        className="listItem"
                                                                                        role="button"
                                                                                        style={{
                                                                                            padding: "8px 12px",
                                                                                            cursor: "pointer",
                                                                                            borderTop: "1px solid #f8f9fa",
                                                                                        }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setRouteId(item.id);
                                                                                            handleModalOpenStatusAssign(
                                                                                                item.id,
                                                                                                item.status_id,
                                                                                            );
                                                                                            setOpenDropdownId(null);
                                                                                        }}
                                                                                    >
                                                                                        Assign Status
                                                                                    </li>

                                                                                    <li
                                                                                        className="listItem"
                                                                                        role="button"
                                                                                        style={{
                                                                                            padding: "8px 12px",
                                                                                            cursor: "pointer",
                                                                                            borderTop: "1px solid #f8f9fa",
                                                                                        }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setRouteId(item.id);
                                                                                            setContactFilterObject({
                                                                                                country: item.country_id,
                                                                                                state: item.state_id,
                                                                                                city: item.city_id,
                                                                                                area: item.area_id,
                                                                                                country_name: item.country_name,
                                                                                                state_name: item.state_name,
                                                                                                city_name: item.city_name,
                                                                                                area_name: item.area_name,
                                                                                            });
                                                                                            setOpenRouteAssignContact(true);
                                                                                            setOpenDropdownId(null);
                                                                                        }}
                                                                                    >
                                                                                        Assign Contact
                                                                                    </li>

                                                                                </ul>

                                                                                {item.stage_status_name && (
                                                                                    <span
                                                                                        style={{
                                                                                            backgroundColor: item.stage_status_color
                                                                                                ? item.stage_status_color
                                                                                                : "#eeeeee ",
                                                                                            fontWeight: "normal",
                                                                                            fontSize: "10px",
                                                                                        }}
                                                                                        className="badge rounded-pill"
                                                                                    >
                                                                                        {item.stage_status_name}
                                                                                    </span>
                                                                                )}

                                                                                {item.start_date && (
                                                                                    <span
                                                                                        className="text-muted"
                                                                                        style={{ fontSize: "0.73rem" }}
                                                                                    >
                                                                                        Start Date: {formatDateToDDMMYYYY(item.start_date)}
                                                                                    </span>
                                                                                )}

                                                                                {item.end_date && (
                                                                                    <span
                                                                                        className="text-muted"
                                                                                        style={{ fontSize: "0.73rem" }}
                                                                                    >
                                                                                        End Date: {formatDateToDDMMYYYY(item.end_date)}
                                                                                    </span>
                                                                                )}
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
                            </div>
                        </div>
                    )}
                </>
            ) : null}

            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteRouteIds([]);
                    }}
                    handleSubmit={handleDeleteRoute}
                    title={
                        deleteRouteIds.length > 1
                            ? "Delete Routes"
                            : "Delete Route"
                    }
                    message={`Are you sure you want to delete ${deleteRouteIds.length > 1 ? "these routes" : "this route"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}

            {showAddRouteView && (
                <AddRoutePlannerView
                    show={showAddRouteView}
                    onHide={() => {
                        setShowAddRouteView(false);
                    }}
                    setLoading={setLoading}
                    headerName="Add Route"
                    handleRefreshRoutes={handleRefreshRoutes}
                    productToEdit={undefined}
                />
            )}

            {showUpdateRouteView && (
                <AddRoutePlannerView
                    show={showUpdateRouteView}
                    onHide={() => {
                        setShowUpdateRouteView(false);
                    }}
                    setLoading={setLoading}
                    headerName="Update Route"
                    handleRefreshRoutes={handleRefreshRoutes}
                    productToEdit={editableRoute}
                />
            )}

            {openRouteAssignContact && (
                <RouteAssignContact
                    show={openRouteAssignContact}
                    onHide={() => {
                        setOpenRouteAssignContact(false);
                    }}
                    routeId={routeId}
                    contactFilterObject={contactFilterObject}
                />
            )}

            {isModalAssignStatusVisible && (
                <RadioButtonModal
                    show={isModalAssignStatusVisible}
                    onHide={() => setIsModalAssignStatusVisible(false)}
                    handleSubmit={handleConfirmRadioButton}
                    title="Assign Status to Route"
                    message="Please select the Status for this contact."
                    btn1="Cancel"
                    btn2="Submit"
                    options={optionRadioButtonStatus}
                    selectedLabelIds={
                        routeList?.find((rt) => rt.id === statusAssignRouteId)?.status_id
                    }
                    contactId={routeId}
                    getOptionColor={(option) => option.color || "#eeeeee"}
                    getOptionName={(option) => option.name}
                    showColorBadge={true}
                />
            )}

            {isModalFilterVisible && (
                <CheckBoxFilterModal
                    show={isModalFilterVisible}
                    onHide={handleFilterModalClose}
                    handleSubmit={handleConfirmFilter}
                    title="Filter your Routes"
                    message="Please select the Labels , Source and Demography for the Contact."
                    btn1="Clear"
                    btn2="Apply"
                    filtersToShow={[1, 4, 5]}
                    pageId={1}
                    initialFilterData={filters.filterData}
                    initialStartSearchDate={filters.startSearchDate}
                    initialEndSearchDate={filters.endSearchDate}
                    initialCheckedOptions={filters.checkedOptions}
                    initialCheckedOptionsStageStatus={
                        filters.checkedOptionsStageStatus
                    }
                    stageandStatusOrderType={14}
                    initialCheckedOptionsUser={filters.checkedOptionsUser}
                />
            )}

            {/* {isOpenContactList && (
                <RoutePlannerContactsList
                    show={isOpenContactList}
                    onHide={() => {
                        setIsOpenContactList(false);
                    }}
                    routeId={routeId}
                />
            )} */}
        </>
    );
};

export default RoutePlannerListView;