import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Card as BsCard, Col, Row } from "react-bootstrap";
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
import { KanbanBoard } from "../shared-kanban/components/KanbanBoard";
import { useKanbanColumns } from "../shared-kanban/hooks/useKanbanColumns";
import { KanbanItemsInfiniteData } from "../shared-kanban/hooks/useKanbanItems";
import { KanbanBoardConfig, KanbanColumnDef, KanbanFetchResult, KanbanItem } from "../shared-kanban/types";
import "./ContactKanban.css";
import { KanbanBoardModal } from "./contactType";

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
});

const ContactKanbanBoard: React.FC<KanbanBoardModal> = ({ show, handleclose }) => {
    const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
    const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [isCreateContact, setIsCreateContact] = useState(false);
    const [user1, setUsers1] = useState(false);
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
                <>
                    <h6 className="mb-1">{card.person_name}</h6>
                    <p className="small text-muted mb-1">{card.mobile_number}</p>

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

                    <div className="d-flex align-items-center justify-content-end">
                        <div
                            style={{ color: "gray", cursor: "pointer" }}
                            title="View"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewTask(card.id);
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                            >
                                <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
                            </svg>
                        </div>
                    </div>
                </>
            );
        },
        [handleViewTask],
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
    useSocketEvent<{ id?: number }>(
        "contact-changed",
        (payload) => {
            if (!payload?.id || isContactIdLoaded(payload.id)) {
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

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") setSearchTerm(searchInput);
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
                    <div className="modal-content1" style={{ height: "100%", width: "100%", margin: 0 }}>
                        <div className="mb-2 d-flex justify-content-between align-content-center align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-between gap-2" style={{ flex: 1 }}>
                                <h2>My Contacts</h2>
                                <div className="d-flex align-items-center justify-content-start gap-2">
                                    <button type="button" onClick={refreshBoard} style={{ cursor: "pointer" }}>
                                        <svg width="30" height="30" viewBox="0 0 50 50" fill="gray"><path fill="currentColor" d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"></path><path fill="currentColor" d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"></path><path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z"></path><path fill="currentColor" d="M40 34h-8v-8h2v6h6z"></path></svg>
                                    </button>
                                    <span className="d-flex align-content-center justify-content-center rounded-1 text-white" style={{ height: "24px", width: "24px", cursor: "pointer" }} title="Add new Task" onClick={handleChangeAddContact}><svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="26px"
                                        viewBox="0 -960 960 960"
                                        width="26px"
                                        fill="gray"
                                    >
                                        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                    </svg></span>
                                    <span className="text-white" id="task-filter" title="Task Filter" onClick={() => { setIsModalFilterVisible(true); }} style={{ cursor: "pointer" }}>
                                        {hasData ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                height="24px"
                                                viewBox="0 -960 960 960"
                                                width="24px"
                                                fill={hasData ? "red" : "gray"}
                                            >
                                                <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                height="24px"
                                                viewBox="0 -960 960 960"
                                                width="24px"
                                                fill={hasData ? "red" : "gray"}
                                            >
                                                <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                                            </svg>
                                        )}
                                    </span>
                                    <div className="d-flex align-items-center justify-content-between gap-2">
                                        <input
                                            type="search"
                                            placeholder="Search..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            onKeyPress={handleSearchKeyPress}
                                        />
                                        <button
                                            type="button"
                                            className="px-2 py-1 text-white"
                                            style={{ backgroundColor: "#f58634", borderRadius: "3px" }}
                                            onClick={() => setSearchTerm(searchInput)}
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="text-end">
                                <span className="close ms-3" onClick={() => setIsCloseConfirmation(true)}>
                                    ×
                                </span>
                            </div>
                        </div>
                        <Row>
                            <Col>
                                <BsCard>
                                    <BsCard.Body>
                                        <div style={{ height: "81vh", display: "flex" }}>
                                            <KanbanBoard
                                                config={config}
                                                columns={columns}
                                                isColumnsLoading={isColumnsLoading}
                                                searchTerm={searchTerm}
                                                onError={(msg) => toast.error(msg)}
                                                onSuccess={(msg) => toast.success(msg)}
                                            />
                                        </div>
                                    </BsCard.Body>
                                </BsCard>
                            </Col>
                        </Row>
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
