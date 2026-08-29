import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import { useEscapeKey } from "../../../common/SharedFunction";
import {
    DEFAULT_MESSAGE_ERROR_PERMISSION,
    DEFAULT_STATUS_CODE_SUCCESS,
    ITEMS_PER_PAGE,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IFilterPayload } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import useSocketEvent from "../../../hooks/useSocketEvent";
import CreateContactView from "../../../pages/left-side/create-contact/CreateContactView";
import { fetchDataUser } from "../../../pages/left-side/LeftSideController";
import { axiosInstance } from "../../../services/axiosInstance";
import { useContactFilterStore } from "../../../store/contact/useContactFilterStore";
import ContactDetailModel from "../ContactdetailsModel/ContactDetailModel";
import CheckBoxFilterModal from "../CheckBoxFilterModal";
import ConfirmationModal from "../ConfirmationModal";
import { SearchBar } from "../task-kanban/components/SearchBar";
import "../task-kanban/styles/kanban.css";
import { KanbanBoard } from "../shared-kanban/components/KanbanBoard";
import { useKanbanColumns } from "../shared-kanban/hooks/useKanbanColumns";
import { KanbanItemsInfiniteData } from "../shared-kanban/hooks/useKanbanItems";
import { KanbanBoardConfig, KanbanColumnDef, KanbanFetchResult, KanbanItem } from "../shared-kanban/types";
import "./ContactKanban.css";
import { ContactCardActions, KanbanBoardModal } from "./contactType";

const BOARD_KEY = "contact-pipeline";

interface ContactKanbanItem {
    id: number;
    person_name: string;
    mobile_number: string;
    company_name: string;
    client_code: string;
    label_name: string;
    label_color: string;
    teamMemberName: string;
    position: number | null;
    // for the card action menu (same fields the list menu keys off)
    is_unread: number;
    is_archive: number;
    is_pin_by_a_application_login_id: string;
    contact_status: number | undefined;
    raw: any;
}

const mapContactToKanbanItem = (raw: any): ContactKanbanItem => ({
    id: raw.id,
    person_name: raw.person_name || "",
    mobile_number: raw.mobile_number || "",
    company_name: raw.company_name || "",
    client_code: raw.client_code || "",
    label_name: raw.label_name || "",
    label_color: raw.label_color || "",
    teamMemberName: raw.teamMemberName || "",
    position: raw.position ?? null,
    is_unread: Number(raw.is_unread) || 0,
    is_archive: Number(raw.is_archive) || 0,
    is_pin_by_a_application_login_id: raw.is_pin_by_a_application_login_id || "",
    contact_status: raw.contact_status ?? undefined,
    raw,
});

// Per-card "⋮" action menu — mirrors the contact list's row menu
// (LeftSideView.tsx ~4900). Each action just calls the handler the parent
// (LeftSideView) already uses for the list; no logic is duplicated here.
const ContactCardMenu: React.FC<{
    card: ContactKanbanItem;
    applicationId: string | null;
    actions: ContactCardActions;
}> = ({ card, applicationId, actions }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const isPinned = !!applicationId &&
        card.is_pin_by_a_application_login_id
            .split(",")
            .map((s) => s.trim())
            .includes(applicationId.toString());

    const run = (fn?: () => void) => {
        setOpen(false);
        fn?.();
    };

    return (
        <div ref={ref} style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <div
                style={{ color: "gray", cursor: "pointer", padding: "0 4px" }}
                title="More options"
                onClick={() => setOpen((p) => !p)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                    <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
                </svg>
            </div>

            {open && (
                <ul
                    className="labelDropLeft isVisible"
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        left: "auto",
                        width: "180px",
                        margin: 0,
                        zIndex: 1000,
                        backgroundColor: "#fff",
                    }}
                >
                    <li className="listItem text-start" role="button"
                        onClick={() => run(() => actions.onEdit?.({ id: card.id, raw: card.raw }))}>
                        Edit
                    </li>
                    {isPinned ? (
                        <li className="listItem text-start" role="button"
                            onClick={() => run(() => actions.onUnpin?.(card.id))}>UnPin</li>
                    ) : (
                        <li className="listItem text-start" role="button"
                            onClick={() => run(() => actions.onPin?.(card.id))}>Pin</li>
                    )}
                    {card.is_unread === 1 ? (
                        <li className="listItem text-start" role="button"
                            onClick={() => run(() => actions.onMarkRead?.(card.id))}>Mark as Read</li>
                    ) : (
                        <li className="listItem text-start" role="button"
                            onClick={() => run(() => actions.onMarkUnread?.(card.id))}>Mark as Unread</li>
                    )}
                    {card.is_archive === 1 ? (
                        <li className="listItem text-start" role="button"
                            onClick={() => run(() => actions.onUnarchive?.(card.id))}>Unarchive contact</li>
                    ) : (
                        <li className="listItem text-start" role="button"
                            onClick={() => run(() => actions.onArchive?.(card.id))}>Archive contact</li>
                    )}
                    <li className="listItem text-start" role="button"
                        onClick={() => run(() => actions.onAssignLabel?.(card.id))}>Assign label</li>
                    <li className="listItem text-start" role="button"
                        onClick={() => run(() => actions.onAssignStatus?.(card.id, card.contact_status))}>Assign Status</li>
                    <li className="listItem text-start" role="button"
                        onClick={() => run(() => actions.onAssignTeamMember?.(card.id))}>Assign Team Member</li>
                    <li className="listItem text-start" role="button"
                        style={{ color: "#0992f3", fontWeight: 600 }}
                        onClick={() => run(() => actions.onStartWorkflow?.(card.id))}>Start WorkFlow</li>
                    <li className="listItem text-start" role="button"
                        style={{ color: "red", fontWeight: 600 }}
                        onClick={() => run(() => actions.onDelete?.(card.id))}>Delete</li>
                </ul>
            )}
        </div>
    );
};

const ContactKanbanBoard: React.FC<KanbanBoardModal> = ({
    show,
    handleclose,
    onEdit,
    onPin,
    onUnpin,
    onMarkRead,
    onMarkUnread,
    onArchive,
    onUnarchive,
    onAssignLabel,
    onAssignStatus,
    onAssignTeamMember,
    onStartWorkflow,
    onDelete,
}) => {
    const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
    const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [isCreateContact, setIsCreateContact] = useState(false);
    const [, setUsers1] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewContactId, setViewContactId] = useState<number | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const { filters, setFilters } = useContactFilterStore();
    const queryClient = useQueryClient();
    const { setCheckToken } = useContext(AppContext)!;

    const canAdd = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.ADD);

    useEscapeKey(handleclose);

    useEffect(() => {
        if (show) setHasData(filters.isFilterApplied);
    }, [show]);

    // Debounced search — matches the board's previous 800ms debounce.
    useEffect(() => {
        const timeoutId = setTimeout(() => setSearchTerm(searchInput), 800);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const token = localStorage.getItem("token");
    const localId = localStorage.getItem("UUID");
    const applicationId = localStorage.getItem("UUID");

    const fetchColumns = useCallback(async (): Promise<KanbanColumnDef[]> => {
        const uuid = localStorage.getItem("UUID");
        const { data } = await axiosInstance.post("get-status", {
            status_type: "1",
            a_application_login_id: uuid,
            action_flag: "view",
        });
        if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            throw new Error(data.ack_msg || "Failed to load stages");
        }
        const stages = (data.data ?? []) as any[];
        return stages
            .map((s) => ({
                id: s.id,
                name: s.name,
                color: s.color || "#cccccc",
                displayOrder: s.display_order_type ?? 0,
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder);
    }, []);

    // fetchDataUser is a legacy callback-style function (mutates React state
    // via setter callbacks rather than returning a promise) shared with the
    // main contact list — reused here instead of duplicating its large
    // filter-merging logic, wrapped to resolve a promise once its setUsers
    // callback fires. Its `stageStatusId` param already supports filtering to
    // exactly one stage, which is what gives each Kanban column its own real,
    // independently-paginated fetch (fixing the old single-page-only board).
    const fetchItems = useCallback(
        (params: {
            columnId: string | number;
            page: number;
            limit: number;
            searchTerm: string;
        }): Promise<KanbanFetchResult<ContactKanbanItem>> => {
            return new Promise((resolve) => {
                let settled = false;
                let capturedTotal = 0;
                const safeResolve = (result: KanbanFetchResult<ContactKanbanItem>) => {
                    if (settled) return;
                    settled = true;
                    resolve(result);
                };

                fetchDataUser(
                    params.page - 1,
                    params.searchTerm,
                    (usersOrUpdater: any) => {
                        const items =
                            typeof usersOrUpdater === "function"
                                ? usersOrUpdater([])
                                : usersOrUpdater || [];
                        safeResolve({
                            items: items.map(mapContactToKanbanItem),
                            total: capturedTotal,
                            hasMore: items.length === params.limit,
                        });
                    },
                    params.limit,
                    () => {},
                    () => {},
                    token,
                    localId,
                    () => {},
                    () => {},
                    setCheckToken,
                    filters.filterData,
                    filters.checkedOptions,
                    filters.checkedSourceTypes,
                    filters.startSearchDate,
                    filters.endSearchDate,
                    filters.checkedOptionsStageStatus,
                    filters.checkedOptionsUser,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    Number(params.columnId),
                    applicationId ? applicationId.toString() : undefined,
                    null,
                    (total: number) => {
                        capturedTotal = total;
                    },
                    undefined,
                    filters.selectedActiveId,
                    filters.selectedDays,
                    filters.assignedByMultiTeamMember,
                    filters.createdByMultiTeamMember,
                    () => {},
                    () => {},
                    () => {},
                    filters.labelwiseContactShowAndOrNot,
                );

                // Safety net: fetchDataUser swallows fetch errors internally
                // (toast only, never calls setUsers on failure), which would
                // otherwise leave this column spinning forever.
                setTimeout(
                    () => safeResolve({ items: [], total: 0, hasMore: false }),
                    15000,
                );
            });
        },
        [token, localId, setCheckToken, filters, applicationId],
    );

    const updateItemPosition = useCallback(
        async (itemId: string | number, columnId: string | number, position: number) => {
            const { data } = await axiosInstance.post("commonUpdate", {
                table: "contact_masters",
                where: JSON.stringify({ id: Number(itemId) }),
                data: JSON.stringify({
                    contact_status: Number(columnId),
                    position,
                }),
            });
            if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                throw new Error(data.ack_msg || "Failed to update stage");
            }
        },
        [],
    );

    const handleViewTask = useCallback((cardId: string | number) => {
        setViewContactId(Number(cardId));
        setIsViewModalOpen(true);
    }, []);

    const renderCard = useCallback(
        (card: ContactKanbanItem) => {
            const labels = card.label_name
                .split(",")
                .filter(Boolean)
                .map((name: string, i: number) => ({
                    name: name.trim(),
                    color: card.label_color.split(",")[i]?.trim() || "#888",
                }));

            return (
                <div
                    style={{ cursor: "pointer" }}
                    onClick={() => handleViewTask(card.id)}
                >
                    <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h6 className="mb-1">{card.person_name}</h6>
                            <p className="small text-muted mb-0">{card.mobile_number}</p>
                        </div>
                        <div className="d-flex align-items-center justify-content-end gap-1 flex-shrink-0">
                            <ContactCardMenu
                                card={card}
                                applicationId={applicationId}
                                actions={{
                                    onEdit,
                                    onPin,
                                    onUnpin,
                                    onMarkRead,
                                    onMarkUnread,
                                    onArchive,
                                    onUnarchive,
                                    onAssignLabel,
                                    onAssignStatus,
                                    onAssignTeamMember,
                                    onStartWorkflow,
                                    onDelete,
                                }}
                            />
                        </div>
                    </div>

                    {(card.company_name || card.client_code) && (
                        <p className="small mb-1">
                            {card.company_name} {card.client_code && `(${card.client_code})`}
                        </p>
                    )}

                    {card.teamMemberName && (
                        <p className="small text-secondary mb-2">{card.teamMemberName}</p>
                    )}

                    {labels.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mb-2">
                            {labels.map((label, i) => (
                                <span
                                    key={i}
                                    className="badge text-white"
                                    style={{ backgroundColor: label.color, fontSize: "0.7rem" }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}

                </div>
            );
        },
        [
            handleViewTask,
            applicationId,
            onEdit,
            onPin,
            onUnpin,
            onMarkRead,
            onMarkUnread,
            onArchive,
            onUnarchive,
            onAssignLabel,
            onAssignStatus,
            onAssignTeamMember,
            onStartWorkflow,
            onDelete,
        ],
    );

    const config: KanbanBoardConfig<ContactKanbanItem> = useMemo(
        () => ({
            boardKey: BOARD_KEY,
            fetchColumns,
            fetchItems,
            itemPosition: (item) => item.position,
            updateItemPosition,
            renderCard,
            pageSize: ITEMS_PER_PAGE,
            emptyStateLabel: "Drop Contact here",
        }),
        [fetchColumns, fetchItems, updateItemPosition, renderCard],
    );

    const { data: columns = [], isLoading: isColumnsLoading } = useKanbanColumns(config);

    const refreshBoard = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["shared-kanban-columns", BOARD_KEY] });
        queryClient.invalidateQueries({ queryKey: ["shared-kanban-items", BOARD_KEY] });
    }, [queryClient]);

    // Is `id` in any column's currently-loaded pages for this board? Checks
    // every "shared-kanban-items" query under this BOARD_KEY (one per
    // column/searchTerm combo) via a partial queryKey match.
    const isContactIdLoaded = useCallback(
        (id: number) => {
            const matches = queryClient.getQueriesData<
                KanbanItemsInfiniteData<KanbanItem>
            >({ queryKey: ["shared-kanban-items", BOARD_KEY] });
            return matches.some(([, data]) =>
                data?.pages?.some((page) =>
                    page.items.some((item) => item.id === id),
                ),
            );
        },
        [queryClient],
    );

    // Live sync: any teammate adding/editing/moving a contact (including via
    // the drag-to-move commonUpdate path) refreshes this board too - but
    // only when it's worth it: no id on the payload means a new contact
    // (always refresh, it might belong on this board), and an id we already
    // have loaded in some column means an edit to a visible card (also
    // refresh). An id for a contact not currently loaded here is skipped -
    // a filter-changing edit to an off-board contact won't pull it in until
    // the next manual refresh, a known tradeoff.
    //
    // assigned_to (when present - baseController.js's attachContactAssignees,
    // skipped for the no-id/new-contact case above) further narrows this to
    // only MY assignments - a company can have several team members' boards
    // open at once, each only caring about their own cards, not every
    // contact-changed event company-wide.
    useSocketEvent<{ id?: number; assigned_to?: number[] }>(
        "contact-changed",
        (payload) => {
            if (!payload?.id) {
                refreshBoard();
                return;
            }
            const myLoginId = Number(localStorage.getItem("UUID"));
            const isMine = !payload.assigned_to || payload.assigned_to.includes(myLoginId);
            if (isMine && isContactIdLoaded(payload.id)) {
                refreshBoard();
            }
        },
        show,
    );

    const handleModalClose = () => {
        setIsModalFilterVisible(false);
    };

    const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
        const {
            filterData,
            checkedOptionsLabel: checkedOptions,
            checkedOptionsSourceType: checkedSourceTypes,
            endSearchDate,
            startSearchDate,
            checkedOptionsStageStatus,
            assignedByMultiTeamMember,
            createdByMultiTeamMember,
            checkedOptionsUser,
            selectedCategoryId,
            selectedProductId,
            selectedActiveId,
            selectedDays,
            labelAndOr: labelwiseContactShowAndOrNot,
        } = filterPayload;

        const isFilterApplied =
            (checkedOptions?.length ?? 0) > 0 ||
            (checkedSourceTypes?.length ?? 0) > 0 ||
            Boolean(filterData?.country) ||
            Boolean(filterData?.state) ||
            Boolean(filterData?.city) ||
            Boolean(filterData?.area) ||
            Boolean(filterData?.active) ||
            Boolean(startSearchDate) ||
            Boolean(endSearchDate) ||
            (checkedOptionsStageStatus?.length ?? 0) > 0 ||
            (checkedOptionsUser?.length ?? 0) > 0 ||
            (assignedByMultiTeamMember?.length ?? 0) > 0 ||
            (createdByMultiTeamMember?.length ?? 0) > 0 ||
            Boolean(labelwiseContactShowAndOrNot);

        setFilters({
            searchTerm: "",
            filterData,
            checkedOptions: checkedOptions ?? [],
            checkedSourceTypes: checkedSourceTypes ?? [],
            startSearchDate,
            endSearchDate,
            checkedOptionsStageStatus: checkedOptionsStageStatus ?? [],
            checkedOptionsUser: checkedOptionsUser ?? [],
            selectedCategoryId,
            selectedProductId,
            selectedActiveId,
            selectedDays,
            assignedByMultiTeamMember,
            createdByMultiTeamMember,
            isFilterApplied,
            labelwiseContactShowAndOrNot: labelwiseContactShowAndOrNot ?? 0,
        });

        refreshBoard();
        setHasData(isFilterApplied);
        setIsModalFilterVisible(false);
    };

    const handleChangeAddContact = () => {
        if (canAdd) {
            setIsCreateContact(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            setIsCreateContact(false);
        }
    };

    return (
        <>
            {show && (
                <div className="modal1">
                    <div
                        className="modal-content1"
                        style={{
                            height: "100%",
                            width: "100%",
                            margin: 0,
                            padding: 0,
                            border: "none",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        {/* ── Header (matches Task/Support-Ticket board) ── */}
                        <div className="modal-header kanban-modal-header px-3 py-0">
                            <div className="d-flex align-items-center gap-2">
                                <div className="kanban-modal-icon">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2"
                                    >
                                        <rect width="7" height="9" x="3" y="3" rx="1" />
                                        <rect width="7" height="5" x="3" y="16" rx="1" />
                                        <rect width="7" height="9" x="14" y="12" rx="1" />
                                        <rect width="7" height="5" x="14" y="3" rx="1" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="kanban-modal-title">Contact Board</div>
                                    <div className="kanban-modal-subtitle">Pipeline view</div>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginLeft: "auto",
                                    marginRight: 8,
                                }}
                            >
                                <button
                                    title="Filter Contacts"
                                    onClick={() => setIsModalFilterVisible(true)}
                                    className="kanban-header-btn"
                                    style={{ color: hasData ? "#ef4444" : undefined }}
                                >
                                    {hasData ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="20px"
                                            viewBox="0 -960 960 960"
                                            width="20px"
                                            fill="currentColor"
                                        >
                                            <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                                        </svg>
                                    ) : (
                                        <svg
                                            height="20px"
                                            viewBox="0 -960 960 960"
                                            width="20px"
                                            fill="currentColor"
                                        >
                                            <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                                        </svg>
                                    )}
                                </button>

                                {canAdd && (
                                    <button
                                        title="Create Contact"
                                        onClick={handleChangeAddContact}
                                        className="kanban-header-btn kanban-header-btn--primary"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="22px"
                                            viewBox="0 -960 960 960"
                                            width="22px"
                                            fill="currentColor"
                                        >
                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setIsCloseConfirmation(true)}
                            />
                        </div>

                        {/* ── Body ── */}
                        <div className="modal-body kanban-modal-body p-0">
                            <SearchBar
                                value={searchInput}
                                onChange={setSearchInput}
                                onRefresh={refreshBoard}
                            />
                            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                                <KanbanBoard
                                    config={config}
                                    columns={columns}
                                    isColumnsLoading={isColumnsLoading}
                                    searchTerm={searchTerm}
                                    onError={(msg) => toast.error(msg)}
                                    onSuccess={(msg) => toast.success(msg)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isCloseConfirmation && (
                <ConfirmationModal
                    show
                    onHide={() => setIsCloseConfirmation(false)}
                    handleSubmit={handleclose}
                    title="Close this Contact View"
                    message="Are you sure?"
                    btn1="No"
                    btn2="Yes"
                />
            )}

            {isViewModalOpen && viewContactId && (
                <ContactDetailModel
                    show={isViewModalOpen}
                    onHide={() => setIsViewModalOpen(false)}
                    contactId={viewContactId}
                />
            )}

            {isModalFilterVisible && (
                <CheckBoxFilterModal
                    show={isModalFilterVisible}
                    onHide={handleModalClose}
                    handleSubmit={handleConfirmFilter}
                    title="Filter your Contact"
                    message="Please select the Labels , Source and Demography for the Contact."
                    btn1="Clear"
                    btn2="Apply"
                    filtersToShow={[1, 2, 3, 4, 9, 6, 8]}
                    pageId={1}
                    initialFilterData={filters.filterData}
                    initialCheckedOptions={filters.checkedOptions}
                    initialCheckedSourceTypes={filters.checkedSourceTypes}
                    initialStartSearchDate={filters.startSearchDate}
                    initialEndSearchDate={filters.endSearchDate}
                    initialCheckedOptionsStageStatus={
                        filters.checkedOptionsStageStatus
                    }
                    initialCheckedOptionsUser={filters.checkedOptionsUser}
                    initialCheckedAssignedByMultiTeamMember={filters.assignedByMultiTeamMember}
                    initialCheckedCreatedByMultiTeamMember={filters.createdByMultiTeamMember}
                    labelFilderApplyAndOr={filters.labelwiseContactShowAndOrNot}
                />
            )}
            {isCreateContact && (
                <CreateContactView
                    show={isCreateContact}
                    onHide={() => setIsCreateContact(false)}
                    setContact={setUsers1}
                    headerName={"Create Contact"}
                />
            )}
        </>
    );
};

export default ContactKanbanBoard;
