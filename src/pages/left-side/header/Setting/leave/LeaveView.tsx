import moment from "moment";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { convertDateTimeFormat } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import { BIG_TEXT_LENGTH, BIG_WIDTH_FOR_TEXT, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateLeaveView from "./create-leave/CreateLeaveView";
import { fetchLeaveApi, handleDeleteLeave, ILeaveView } from "./LeaveController";

interface IPropsLeaveView {
    isLeaveView: boolean;
    closeLeaveView: () => void;
    team_id?: number;
    CompanyDetails?: any;
}
const LeaveView = ({
    isLeaveView: isLeaveView,
    closeLeaveView: closeLeaveView,
    team_id,
    CompanyDetails
}: IPropsLeaveView) => {
    const [leaveLists, setLeaveList] = useState<ILeaveView[]>([]);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {}
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const [deleteItemId, setDeleteItemId] = useState<number | undefined>(
        undefined
    );
    const [leaveDropdown, setLeaveDropdown] = useState<any>(null);
    const [hasIdAvail, setHasIdAvail] = useState<number>();
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [isOpenCreateModel, setIsCreateModel] = useState(false);
    const [isOpenEditModel, setIsOpenEditModel] = useState(false);
    const [isOpenViewModel, setIsOpenViewModel] = useState(false);
    const [isOpenStatusModel, setIsOpenStatusModel] = useState(false);
    const [editLeaveStatusItem, setEditLeaveStatusItem] =
        useState<ILeaveView>();
    const [statusFlag, setStatusFlag] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [createEditStatusFlag, setCreateEditStatusFlag] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const { darkMode, toggleTheme } = useTheme();
    const [editLeaveItem, setEditLeaveItem] = useState<ILeaveView>();
    const [viewLeaveItem, setViewLeaveItem] = useState<ILeaveView>();

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);

    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
        null
    );
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [refreshProduct, setRefreshProduct] = useState(false);

    const canView = useCheckUserPermission(
        PAGE_ID.LEAVE,
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(PAGE_ID.LEAVE, PERMISSION_TYPE.ADD);

    const canEdit = useCheckUserPermission(
        PAGE_ID.LEAVE,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.LEAVE,
        PERMISSION_TYPE.DELETE
    );
    const toggleDropdownProduct = (leaveId: number | undefined) => {
        if (leaveId === undefined) return;

        setOpenDropdownId((prevId) => {
            return prevId === leaveId ? null : leaveId;
        });
    };

    const handleEdit = (item: ILeaveView, addUpdateStatus: string) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditLeaveItem(item);
            setIsOpenEditModel(true);
            setLeaveDropdown(null);
            setCreateEditStatusFlag(addUpdateStatus);
        } else {
            setLeaveDropdown(null);
            setIsOpenEditModel(false);
            setCreateEditStatusFlag(addUpdateStatus);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };
    const handleView = (item: ILeaveView, addUpdateStatus: string) => {
        setOpenDropdownId(null);
        if (canView) {
            setViewLeaveItem(item);
            setIsOpenViewModel(true);
            setLeaveDropdown(null);
            setCreateEditStatusFlag(addUpdateStatus);
        } else {
            setLeaveDropdown(null);
            setIsOpenViewModel(false);
            setCreateEditStatusFlag(addUpdateStatus);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };
    useEffect(() => {
        if (canView) {
            if (isLeaveView) {
                const fetchData = async () => {
                    await fetchLeaveApi(setLeaveList, setLoading, searchTerm, team_id);
                };
                fetchData();
            }
        }
    }, [isLeaveView, canView, searchTerm]);

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest('.icon-more');
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
            (ref) => ref && ref.contains(target)
        );

        if (!clickedInsideDropdown) {
            setOpenDropdownId(null);
            setLeaveDropdown({});
            setHasIdAvail(undefined);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handelRefreshExpense = async () => {
        if (canView) {
            await fetchLeaveApi(setLeaveList, setLoading, "", team_id);
        }
    };

    function openSearch() {
        if (canView) {
            setSearchOpen(!searchOpen);
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
                    const fetchData = async () => {
                        await fetchLeaveApi(setLeaveList, setLoading, value, team_id);
                    };
                    fetchData();
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

        // Set new timeout to trigger API call after 5 seconds
        setSearchTimeout(
            setTimeout(() => {
                const fetchData = async () => {
                    await fetchLeaveApi(setLeaveList, setLoading, "", team_id);
                };
                fetchData();
            }, 1000)
        );
    };

    function openDeleteModel(ExpenseId: number | undefined) {
        setOpenDropdownId(null);
        if (canDelete) {
            setDeleteItemId(ExpenseId);
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
    const handleStatusChange = (
        item: ILeaveView,
        status: string
    ) => {
        setOpenDropdownId(null);
        setIsOpenStatusModel(true);
        setEditLeaveStatusItem(item);
        setStatusFlag(status);
        setAmount(amount);
    };

    useEffect(() => {
        if (refreshProduct) {
            const fetchData = async () => {
                await fetchLeaveApi(setLeaveList, setLoading, searchTerm, team_id);
                setRefreshProduct(false);
            };
            fetchData();
        }
    }, [refreshProduct]);
    const a_application_login_id = Number(localStorage.getItem("UUID"));

    const isReportingPerson = (employeeId: number) => {
        const employee = CompanyDetails?.find(
            (x: any) => x.id == employeeId
        );

        return employee?.reporting_member == a_application_login_id;
    };
    return (
        <>
            {isLeaveView ? (
                <div
                    className="leftSide  animate__animated animate__fadeInLeft"
                    id="notifications"
                >
                    {/* <!-- Header --> */}
                    <div className="header-Chat">
                        {/* <!-- Icons --> */}
                        <div className="ICON">
                            <div
                                aria-disabled="false"
                                role="button"
                                className="icons text-light"
                                data-tab="2"
                                title="Back"
                                aria-label="New chat"
                                onClick={closeLeaveView}
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
                            <h2>Leaves</h2>
                        </div>

                        <div className="col-8 text-end mb-2 ">
                            <div
                                className="ICON"
                                style={{
                                    position: "absolute",
                                    right: "1px",
                                }}
                            >
                                <button
                                    className="icons text-white"
                                    onClick={() => openCreateProduct("createEdit")}
                                >
                                    <span title="Create Product" className="text-white">
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
                                    onClick={handelRefreshExpense}
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
                                <div className=" d-flex justify-content-between">
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
                                        title="Search "
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
                    {/* <!-- Chats --> */}
                    <div className="chats-notifications">
                        {/* <!-- Chats 1 --> */}

                        <div className="block p-0">
                            {/* <!-- Text --> */}

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
                                            <>
                                                <div
                                                    className="chats"
                                                    style={{ paddingBottom: "200px" }}
                                                >
                                                    <p
                                                        className={`${leaveLists?.length ? "" : "text-center pt-5"}`}
                                                    >
                                                        {leaveLists?.length ? "" : "No Data Found"}
                                                    </p>
                                                    {leaveLists &&
                                                        leaveLists.map((item, index) => (
                                                            <>
                                                                <button
                                                                    key={index}
                                                                    className={`block chat-list `}
                                                                    style={{ padding: "6" }}
                                                                >
                                                                    <div className="h-text d-flex justify-content-between">
                                                                        <div className="d-flex align-items-center">
                                                                            <div>
                                                                                <div className="d-flex">
                                                                                    <div
                                                                                        className=""
                                                                                        style={{
                                                                                            paddingBottom: "2px",
                                                                                            borderBottom: "unset",
                                                                                            textAlign: "left",
                                                                                        }}
                                                                                    >
                                                                                        <h4
                                                                                            className="inquiry-front"
                                                                                            style={{
                                                                                                width: "100px",
                                                                                                fontSize: "18px",
                                                                                                fontWeight: "400",
                                                                                                color: "#54656f",
                                                                                                letterSpacing: " 0.4px",
                                                                                                marginBottom: "0",
                                                                                            }}
                                                                                        >
                                                                                            <b> # {item.id}</b>
                                                                                        </h4>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="d-flex">
                                                                                    <div
                                                                                        className=""
                                                                                        style={{
                                                                                            paddingBottom: "2px",
                                                                                            borderBottom: "unset",
                                                                                        }}
                                                                                    >
                                                                                        <h4 className="inquiry-front">
                                                                                            <b>Leave Date</b> :&nbsp;
                                                                                        </h4>
                                                                                    </div>
                                                                                    <div
                                                                                        className=""
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
                                                                                            {item.leave_date ? moment(item.leave_date).format("DD-MM-YYYY") : ""}

                                                                                        </h4>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="d-flex">
                                                                                    <div
                                                                                        className=""
                                                                                        style={{
                                                                                            paddingBottom: "2px",
                                                                                            borderBottom: "unset",
                                                                                        }}
                                                                                    >
                                                                                        <h4 className="inquiry-front">
                                                                                            <b>Duration</b> :&nbsp;
                                                                                        </h4>
                                                                                    </div>
                                                                                    <div
                                                                                        className=""
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
                                                                                            {
                                                                                                item.leave_duration == "1"
                                                                                                    ? "First Half"
                                                                                                    : item.leave_duration == "2"
                                                                                                        ? "Second Half"
                                                                                                        : item.leave_duration == "4"
                                                                                                            ? "Hourly Leave"
                                                                                                            : "Full Day"
                                                                                            }

                                                                                        </h4>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="d-flex">
                                                                                    <div
                                                                                        className=""
                                                                                        style={{
                                                                                            paddingBottom: "2px",
                                                                                            borderBottom: "unset",
                                                                                        }}
                                                                                    >
                                                                                        <h4 className="inquiry-front">
                                                                                            <b>Remark: </b>
                                                                                        </h4>
                                                                                    </div>
                                                                                    <div
                                                                                        className=""
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

                                                                                {item.leave_status === 2 ? (
                                                                                    <div className="d-flex">
                                                                                        <div
                                                                                            className=""
                                                                                            style={{
                                                                                                paddingBottom: "2px",
                                                                                                borderBottom: "unset",
                                                                                            }}
                                                                                        >
                                                                                            <h4 className="inquiry-front">
                                                                                                <b>Pass Remark:</b>
                                                                                            </h4>
                                                                                        </div>
                                                                                        <div
                                                                                            className=""
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
                                                                                                    width: `${BIG_TEXT_LENGTH}`,
                                                                                                }}
                                                                                            >
                                                                                                {item.status_remark
                                                                                                    ? item.status_remark
                                                                                                    : ""}
                                                                                            </h4>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : item.leave_status === 3 ? (
                                                                                    <div className="d-flex">
                                                                                        <div
                                                                                            className=""
                                                                                            style={{
                                                                                                paddingBottom: "2px",
                                                                                                borderBottom: "unset",
                                                                                            }}
                                                                                        >
                                                                                            <h4 className="inquiry-front">
                                                                                                <b>Reject Remark: </b>
                                                                                            </h4>
                                                                                        </div>
                                                                                        <div
                                                                                            className=""
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
                                                                                                    width: `${BIG_TEXT_LENGTH}`,
                                                                                                }}
                                                                                            >
                                                                                                {item.status_remark
                                                                                                    ? item.status_remark
                                                                                                    : ""}
                                                                                            </h4>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    ""
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="d-flex align-items-center justify-content-end">
                                                                            <div>
                                                                                {item.id === -1 ? (
                                                                                    <span></span>
                                                                                ) :
                                                                                    <>
                                                                                        <button
                                                                                            className="icon-more float-end"
                                                                                            onClick={() =>
                                                                                                toggleDropdownProduct(item.id)
                                                                                            }
                                                                                            style={{
                                                                                                marginTop: "-15%",
                                                                                            }}
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
                                                                                        <div
                                                                                            style={{ clear: "both" }}
                                                                                        ></div>
                                                                                        <ul
                                                                                            className={`labelDropLeft ${openDropdownId === item.id ? "isVisible" : "isHidden"
                                                                                                }`}
                                                                                            id="dropLeft"
                                                                                            ref={(el) =>
                                                                                            (dropdownContactRef.current[
                                                                                                item.id
                                                                                            ] = el)
                                                                                            }
                                                                                            style={{
                                                                                                width: "126px",
                                                                                                marginLeft: "-15%",
                                                                                                marginTop: "0%",
                                                                                            }}
                                                                                        >
                                                                                            {item.leave_status === 1 && (
                                                                                                <>
                                                                                                    <li
                                                                                                        className="listItem text-start"
                                                                                                        role="button"
                                                                                                        onClick={() =>
                                                                                                            handleEdit(
                                                                                                                item,
                                                                                                                "createEdit"
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        Edit
                                                                                                    </li>
                                                                                                </>
                                                                                            )}
                                                                                            {item.leave_status !== 1 && (
                                                                                                <>
                                                                                                    <li
                                                                                                        className="listItem text-start"
                                                                                                        role="button"
                                                                                                        onClick={() =>
                                                                                                            handleView(
                                                                                                                item,
                                                                                                                "createEdit"
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        View Details
                                                                                                    </li>
                                                                                                </>
                                                                                            )}
                                                                                            {(item.companyFlag === 1 ||
                                                                                                isReportingPerson(item.a_application_login_id)) &&
                                                                                                (
                                                                                                    <>
                                                                                                        {item.leave_status ===
                                                                                                            1 && (
                                                                                                                <>
                                                                                                                    <li
                                                                                                                        className="listItem text-start"
                                                                                                                        role="button"
                                                                                                                        onClick={() =>
                                                                                                                            handleStatusChange(
                                                                                                                                item,
                                                                                                                                "pass"
                                                                                                                            )
                                                                                                                        }
                                                                                                                    >
                                                                                                                        Pass status
                                                                                                                    </li>

                                                                                                                    <li
                                                                                                                        className="listItem text-start"
                                                                                                                        role="button"
                                                                                                                        onClick={() =>
                                                                                                                            handleStatusChange(
                                                                                                                                item,
                                                                                                                                "reject"
                                                                                                                            )
                                                                                                                        }
                                                                                                                    >
                                                                                                                        Reject status
                                                                                                                    </li>
                                                                                                                </>
                                                                                                            )}
                                                                                                    </>
                                                                                                )}
                                                                                            {(item.leave_status === 1 || (item.companyFlag === 1)) && (
                                                                                                <>
                                                                                                    <li
                                                                                                        className="listItem text-start"
                                                                                                        style={{
                                                                                                            color: '#dc3545',
                                                                                                            fontWeight: 'bold'
                                                                                                        }}
                                                                                                        role="button"
                                                                                                        onClick={() =>
                                                                                                            openDeleteModel(item.id)
                                                                                                        }
                                                                                                    >
                                                                                                        Delete
                                                                                                    </li>
                                                                                                </>
                                                                                            )}
                                                                                        </ul>
                                                                                    </>
                                                                                }
                                                                                <div className="d-flex flex-column gap-2 pb-1">
                                                                                    <span
                                                                                        style={{
                                                                                            backgroundColor: `${item.color}`,
                                                                                            color: "#fff",
                                                                                            height: "20px",
                                                                                        }}
                                                                                        className="badge rounded-pill ml-1"
                                                                                    >
                                                                                        {item.leave_type}
                                                                                    </span>

                                                                                    {item.leave_status === 1 ? (
                                                                                        <span
                                                                                            style={{
                                                                                                backgroundColor: "#ccc",
                                                                                                color: "#fff",
                                                                                                height: "20px",
                                                                                            }}
                                                                                            className="badge rounded-pill ml-1"
                                                                                        >
                                                                                            Pending
                                                                                        </span>
                                                                                    ) : item.leave_status === 2 ? (
                                                                                        <span
                                                                                            style={{
                                                                                                backgroundColor: "#06923E",
                                                                                                color: "#fff",
                                                                                                height: "20px",
                                                                                            }}
                                                                                            className="badge rounded-pill ml-1"
                                                                                        >
                                                                                            Pass
                                                                                        </span>
                                                                                    ) : item.leave_status === 3 ? (
                                                                                        <span
                                                                                            style={{
                                                                                                backgroundColor: "#FF0000",
                                                                                                color: "#fff",
                                                                                                height: "20px",
                                                                                            }}
                                                                                            className="badge rounded-pill ml-1"
                                                                                        >
                                                                                            Reject
                                                                                        </span>
                                                                                    ) : (
                                                                                        ""
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="contact-text text-end">
                                                                                        {item.created_date_time
                                                                                            ? convertDateTimeFormat(
                                                                                                item.created_date_time
                                                                                            ).date
                                                                                            : ""}
                                                                                    </p>
                                                                                    <p className="contact-text text-end">
                                                                                        {item.created_date_time
                                                                                            ? convertDateTimeFormat(
                                                                                                item.created_date_time
                                                                                            ).time
                                                                                            : ""}
                                                                                    </p>
                                                                                    <p className="contact-text text-end">
                                                                                        Created by: {item.created_by_username}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {/* <div
                                      className="head"
                                    ></div> */}
                                                                    </div>
                                                                </button>
                                                            </>
                                                        ))}
                                                </div>
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
                                setDeleteItemId(undefined);
                            }}
                            handleSubmit={() => {
                                if (deleteItemId !== undefined) {
                                    handleDeleteLeave(
                                        deleteItemId,
                                        setIsDeleteConfirmation,
                                        setLoading,
                                        setLeaveList,
                                        team_id
                                    );
                                    setDeleteItemId(undefined);
                                }
                            }}
                            title={"Delete this Product"}
                            message={"Are You Sure You Want To Delete This Product?"}
                            btn1="CANCEL"
                            btn2="DELETE"
                        />
                    )}
                </div>
            ) : null}

            {isOpenCreateModel && (
                <CreateLeaveView
                    show={isOpenCreateModel}
                    createEditFlag={createEditStatusFlag}
                    onHide={() => setIsCreateModel(false)}
                    leaveToEdit={undefined}
                    headerName="Apply Leave"
                    setRefreshLeave={setRefreshProduct}
                    team_id={team_id}
                />
            )}

            {isOpenEditModel && (
                <CreateLeaveView
                    show={isOpenEditModel}
                    createEditFlag={createEditStatusFlag}
                    onHide={() => setIsOpenEditModel(false)}
                    leaveToEdit={editLeaveItem}
                    headerName="Edit Leave"
                    setRefreshLeave={setRefreshProduct}
                    team_id={team_id}
                />
            )}

            {isOpenViewModel && (
                <CreateLeaveView
                    show={isOpenViewModel}
                    createEditFlag={createEditStatusFlag}
                    onHide={() => setIsOpenViewModel(false)}
                    leaveToEdit={viewLeaveItem}
                    headerName="View Leave Details"
                    setRefreshLeave={setRefreshProduct}
                    team_id={team_id}
                    isViewOnly={true}
                />
            )}

            {isOpenStatusModel && (
                <CreateLeaveView
                    show={isOpenStatusModel}
                    onHide={() => setIsOpenStatusModel(false)}
                    leaveToEdit={editLeaveStatusItem}
                    headerName={`${statusFlag} Status`}
                    setRefreshLeave={setRefreshProduct}
                    status={statusFlag}
                    team_id={team_id}
                />
            )}
        </>
    );
};

export default LeaveView;