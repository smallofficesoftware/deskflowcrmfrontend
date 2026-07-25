import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
    DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { fetchRoundOffApi, IRoundOffView, updateRoundOff } from "./RoundOfMasterController";

export interface IPropsRoundOffView {
    isRoundOffView: boolean;
    closeRoundOffView: () => void;
}

const RoundOffMasterView = ({
    isRoundOffView,
    closeRoundOffView,
}: IPropsRoundOffView) => {

    const [roundOffList, setRoundOffList] = useState<IRoundOffView[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const latestRow = useRef<IRoundOffView>();

    const [deleteRoundOffIds, setDeleteRoundOffIds] = useState<number[]>([]);
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
        PAGE_ID.ROUND_OFF,
        PERMISSION_TYPE.VIEW,
    );

    const canEdit = useCheckUserPermission(
        PAGE_ID.ROUND_OFF,
        PERMISSION_TYPE.EDIT,
    );

    useEffect(() => {
        const fetchRoundOffs = async () => {
            if (isRoundOffView && canView) {
                setOffset(0);
                setHasMore(true);
                setRoundOffList([]);
                setLoading(true);
                fetchRoundOffApi(
                    setRoundOffList,
                    setLoading,
                    PAGE_SIZE,
                    0,
                    false,
                ).then((more) => setHasMore(more));
            }
        };

        fetchRoundOffs();
    }, [isRoundOffView, canView]);

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
                fetchRoundOffApi(
                    setRoundOffList,
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

    const handleRefreshRoundOff = async () => {
        if (canView) {
            setOffset(0);
            setHasMore(true);
            setRoundOffList([]);
            setLoading(true);
            const more = await fetchRoundOffApi(
                setRoundOffList,
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

    const handleDeleteRoundOff = async () => {
        // if (!canDelete) {
        //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        //     return;
        // }

        // await deleteRoundOff(deleteRoundOffIds, setIsDeleteConfirmation, setLoading);
        setDeleteRoundOffIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
        handleRefreshRoundOff();
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
            closeRoundOffView();
        } else {
            setOpenDropdownId(null);
            setIsDeleteConfirmation(false);
        }
    });

    const handleConversionChange = (id: number, value: number) => {
        if (value > 59 || value < 0) return;

        let updatedRow: IRoundOffView | undefined;

        setRoundOffList((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;

                updatedRow = {
                    ...item,
                    conversion_minutes: value,
                };

                latestRow.current = updatedRow;

                return updatedRow;
            })
        );
    };

    useEffect(() => {
        const handleEnter = async (e: KeyboardEvent) => {
            if (e.key === "Enter" && latestRow.current && canEdit) {
                await updateRoundOff(latestRow.current, setLoading);
                handleRefreshRoundOff();
            }
        };

        window.addEventListener("keydown", handleEnter);

        return () => window.removeEventListener("keydown", handleEnter);
    }, [latestRow, canEdit]);

    return (
        <>
            {isRoundOffView ? (
                <div
                    className="notifications animate__animated animate__fadeInLeft"
                    id="notifications"
                >
                    <style>
                        {`
              .table-container {
                width: 100%;
                overflow-x: auto;
              }
              .table {
                table-layout: fixed;
                width: 100%;
                border-collapse: collapse;
              }
              .table th, .table td {
                padding: 8px;
                text-align: left;
                vertical-align: middle;
                width: auto;
              }
              .minutes-column {
                width: 40px;
                white-space: nowrap;
              }
              .conversion-column {
                width: auto;
              }
              .conversion-column input {
                width: 100%;
                box-sizing: border-box;
              }
              .source-of-types-options {
                position: absolute;
                z-index: 1000;
                background: ${darkMode ? "#333" : "#fff"};
                border: 1px solid ${darkMode ? "#555" : "#ccc"};
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                width: 120px;
                right: 10px;
              }
              .source-of-types-options.isVisible {
                display: block;
              }
              .source-of-types-options.isHidden {
                display: none;
              }
              .source-of-types-options li {
                padding: 8px;
                cursor: pointer;
              }
              .source-of-types-options li:last-child {
                border-bottom: none;
              }
              .source-of-types-options li:hover {
                background: ${darkMode ? "#444" : "#f0f0f0"};
              }
            `}
                    </style>
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
                                onClick={closeRoundOffView}
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
                            <h2>Round Off Master</h2>
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
                                    onClick={handleRefreshRoundOff}
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
                                    <div className="table-container">
                                        {loading ? (
                                            Array.from({ length: 12 }).map((_, index) => (
                                                <tr key={index}>
                                                    <td className="minutes-column">
                                                        <Skeleton
                                                            width="100%"
                                                            height="25px"
                                                            duration={5}
                                                            borderRadius={50}
                                                            style={{ opacity: darkMode ? "" : 0.8 }}
                                                        />
                                                    </td>
                                                    <td className="conversion-column">
                                                        <Skeleton
                                                            width="100%"
                                                            height="25px"
                                                            duration={5}
                                                            borderRadius={50}
                                                            style={{ opacity: darkMode ? "" : 0.8 }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <>
                                                <div className="source-of-type-list-grid-block">
                                                    <div className="source-of-type-list-grid-main">
                                                        <table className="table table-bordered table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="minutes-column">Minutes</th>
                                                                    <th className="conversion-column">Conversion Minutes</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {roundOffList.length === 0 ? (
                                                                    <p className="text-center pt-5">No Data Found</p>
                                                                ) : (
                                                                    roundOffList.map((item, index) => {
                                                                        return (
                                                                            <tr key={index}>
                                                                                <td className="minutes-column">
                                                                                    <span>{item.minutes}</span>
                                                                                </td>
                                                                                <td className="conversion-column" style={{ padding: "5px" }}>
                                                                                    <input
                                                                                        type="number"
                                                                                        className="form-control m-0"
                                                                                        style={{ padding: "5px", height: "30px" }}
                                                                                        min={0}
                                                                                        max={59}
                                                                                        value={item.conversion_minutes}
                                                                                        onFocus={(e) => e.target.select()}
                                                                                        onChange={(e) =>
                                                                                            handleConversionChange(item.id, Number(e.target.value))
                                                                                        }
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                )}
                                                            </tbody>
                                                        </table>
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
                                setDeleteRoundOffIds([]);
                            }}
                            handleSubmit={handleDeleteRoundOff}
                            title={
                                deleteRoundOffIds.length > 1
                                    ? "Delete Round Offs"
                                    : "Delete Round Off"
                            }
                            message={`Are you sure you want to delete ${deleteRoundOffIds.length > 1 ? "these Round Offs" : "this Round Off"
                                }?`}
                            btn1="CANCEL"
                            btn2="DELETE"
                        />
                    )}
                </div>
            ) : null}
        </>
    );
};

export default RoundOffMasterView;
