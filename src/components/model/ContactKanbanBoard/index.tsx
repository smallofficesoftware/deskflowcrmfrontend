import {
    closestCorners,
    DndContext,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Card as BsCard, Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { openInNewTab, useEscapeKey } from "../../../common/SharedFunction";
import {
    DEFAULT_MESSAGE_ERROR_PERMISSION,
    DEFAULT_STATUS_CODE_SUCCESS,
    ITEMS_PER_PAGE,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IFilterPayload } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import CheckBoxFilterModal from "../CheckBoxFilterModal";
import ConfirmationModal from "../ConfirmationModal";
import DraggedItem from "./ContactDraggedItem";
import "./ContactKanban.css";
import KanbanColumn from "./ContactKanbenColumn";
// import TaskInfoModal from "./TaskInfoModal";
import { AppContext } from "../../../common/AppContext";
import ContactDetailModel from "../../../components/model/ContactdetailsModel/ContactDetailModel";
import CreateContactView from "../../../pages/left-side/create-contact/CreateContactView";
import { fetchDataUser, IUserList } from "../../../pages/left-side/LeftSideController";
import { useContactFilterStore } from "../../../store/contact/useContactFilterStore";
import { Column, Id, KanbanBoardModal, KanbanCard } from "./contactType";

export function transformContactsToKanban(
    contacts: any[],                                 // raw API items
    stages: { id: number; name: string; color: string }[]
): {
    cards: Record<string, KanbanCard>;
    columns: Column[];
} {
    const cards: Record<string, KanbanCard> = {};
    const columnsMap: Record<string, Column> = {};

    // Create columns from stages
    stages.forEach((stage) => {
        const colId = String(stage.id);
        columnsMap[colId] = {
            id: colId,
            title: stage.name,
            cardIds: [],
            color: stage.color || "#cccccc",
        };
    });

    // Fill cards and assign to columns
    contacts.forEach((contact) => {
        const statusId = contact.contact_status ?? 0; // this is the stage/status id
        const columnId = String(statusId);

        if (!columnsMap[columnId]) return; // skip if no column for this status

        const cardId = String(contact.id);

        cards[cardId] = {
            id: cardId,
            person_name: contact.person_name || "",
            mobile_number: contact.mobile_number || "",
            company_name: contact.company_name || "",
            client_code: contact.client_code || "",
            stage_status_name: contact.stage_status_name || "Unknown",
            stage_status_color: contact.stage_status_color || "#cccccc",
            label_name: contact.label_name || "",
            label_color: contact.label_color || "",
            teamMemberName: contact.teamMemberName || "",
        };

        columnsMap[columnId].cardIds.push(cardId);
    });

    return {
        cards,
        columns: Object.values(columnsMap),
    };
}

const ContactKanbanBoard: React.FC<KanbanBoardModal> = ({
    show,
    handleclose,
    supportTicketFlag,
}) => {
    useEffect(() => {
        if (show) {
            loadKanbanData();
            setHasData(filters.isFilterApplied);
        }
    }, [show]);


    const [columns, setColumns] = useState<Column[]>([]);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [cards, setCards] = useState<Record<string, KanbanCard>>({});
    const [isModalFilterVisible, setIsModalFilterVisible] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
    const [activeId, setActiveId] = useState<Id | null>(null);
    const [hasData, setHasData] = useState<boolean>(false);
    const [user, setUsers] = useState<IUserList[]>([]);
    const [noDataFound, setNoDataFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contactId, setContactId] = useState<number>();
    const [selectedLabelIds, setSelectedLabelIds] = useState<string | undefined>(
        ""
    );
    const [isPinnedState, setIsPinnedState] = useState<number>(0);
    const [isUnreadState, setIsUnreadState] = useState<number>(0);
    const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [totalContactCount, setTotalContactCount] = useState(0);
    const [isArchivState, setIsArchivState] = useState<number>(0);
    const [contactAutoRefreshON, setContactAutoRefreshON] = useState("");
    const [contactAutoRefreshTimeout, setContactAutoRefreshTimeout] = useState("");

    const { filters, setFilters } = useContactFilterStore();
    const [isCreateContact, setIsCreateContact] = useState(false);
    const [user1, setUsers1] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshContact, setRefreshContact] = useState(false);

    const [viewContactId, setViewContactId] = useState<number | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const canAdd = useCheckUserPermission(
        PAGE_ID.CONTACT,
        PERMISSION_TYPE.ADD
    );

    useEffect(() => {
        if (!show) return;

        const timeoutId = setTimeout(() => {
            if (searchTerm !== undefined) {
                loadKanbanData();
            }
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);


    useEffect(() => {
        if (user.length > 0 && columns.length > 0) {
            const categories = columns.map(col => ({
                id: Number(col.id),
                name: col.title,
                color: col.color || '#cccccc'
            }));
            const { columns: newColumns, cards: newCards } = transformContactsToKanban(
                user,
                categories
            );
            setColumns(newColumns);
            setCards(newCards);
        }
    }, [user]);

    const handleViewTask = (cardId: string) => {
        setViewContactId(Number(cardId));
        setIsViewModalOpen(true);
    };

    const handleModalClose = () => {
        if (isModalVisible) {
            setIsModalVisible(false);
        } else {
            setIsModalFilterVisible(false);
        }
    };

    useEscapeKey(handleclose);

    const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
        const { filterData, checkedOptionsLabel: checkedOptions, checkedOptionsSourceType: checkedSourceTypes, endSearchDate, startSearchDate, checkedOptionsStageStatus, assignedByMultiTeamMember, createdByMultiTeamMember, checkedOptionsUser, selectedCategoryId, selectedProductId, selectedActiveId, selectedDays, labelAndOr: labelwiseContactShowAndOrNot } = filterPayload;

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

        /* Set Filter Hooks */
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
        /* Set Filter Hooks */

        setRefreshContact(true);

        setHasData(isFilterApplied);
        setIsModalFilterVisible(false);
    };

    const dragSourceRef = useRef<{
        taskId: Id;
        fromCategoryId: Id;
    } | null>(null);
    const itemsPerPage: number = ITEMS_PER_PAGE;
    const token = localStorage.getItem("token");
    const localId = localStorage.getItem("UUID");
    let applicationId = localStorage.getItem("UUID");

    const {
        isEditContact,
        showRightSide,
        setShowRightSide,
        setCheckToken,
        setPermissions,
        setCompanyData
    } = useContext(AppContext)!;

    const loadKanbanData = async () => {
        setIsLoading(true);
        try {
            const uuid = localStorage.getItem("UUID");

            const [statusRes, contactsRes] = await Promise.all([
                axiosInstance.post("get-status", {
                    status_type: "1", // assuming this returns contact stages
                    a_application_login_id: uuid,
                    action_flag: "view"
                }),
                fetchDataUser(
                    0,
                    searchTerm,
                    setUsers,
                    itemsPerPage,
                    setNoDataFound,
                    setLoading,
                    token,
                    localId,
                    setContactId,
                    setSelectedLabelIds,
                    setCheckToken,
                    filters.filterData,
                    filters.checkedOptions,
                    filters.checkedSourceTypes,
                    filters.startSearchDate,
                    filters.endSearchDate,
                    filters.checkedOptionsStageStatus,
                    filters.checkedOptionsUser,
                    isPinnedState,
                    isUnreadState,
                    selectedLabelId,
                    selectedSourceId,
                    0,
                    applicationId ? applicationId?.toString() : undefined,
                    null,
                    setTotalContactCount,
                    isArchivState,
                    filters.selectedActiveId,
                    filters.selectedDays,
                    filters.assignedByMultiTeamMember,
                    filters.createdByMultiTeamMember,
                    setContactAutoRefreshON,
                    setContactAutoRefreshTimeout,
                    null,
                    filters.labelwiseContactShowAndOrNot
                ),
            ]);

            if (statusRes.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                throw new Error("Failed to load stages");
            }
            const stages = statusRes.data.data ?? [];

            const contacts = user ?? [];
            const { cards: newCards, columns: newColumns } = transformContactsToKanban(contacts, stages);

            setColumns(newColumns);
            setCards(newCards);

        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (refreshContact) {
            loadKanbanData()
        }
        setRefreshContact(false);
    }, [refreshContact]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const findContainer = (id: Id): Column | undefined => {

        return (
            columns.find((c) => c.cardIds.includes(id)) ||
            columns.find((c) => c.id === id)
        );
    };

    const handleDragStart = ({ active }: DragStartEvent) => {
        const taskId = active.id as Id;
        const sourceCol = findContainer(taskId);
        if (sourceCol) {
            dragSourceRef.current = {
                taskId,
                fromCategoryId: sourceCol.id,
            };
        }
        setActiveId(taskId);
    };

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        if (!over) return;
        const activeIdStr = active.id as Id;
        const overIdStr = over.id as Id;
        const activeCol = findContainer(activeIdStr);
        const overCol = findContainer(overIdStr);
        if (!activeCol || !overCol) return;
        const activeIndex = activeCol.cardIds.indexOf(activeIdStr);
        const overIndex = overCol.cardIds.includes(overIdStr)
            ? overCol.cardIds.indexOf(overIdStr)
            : overCol.cardIds.length;
        if (activeCol.id === overCol.id && activeIndex === overIndex) return;
        setColumns((prev) => {
            const next = structuredClone(prev);
            const src = next.find((c) => c.id === activeCol.id)!;
            const dst = next.find((c) => c.id === overCol.id)!;
            src.cardIds.splice(activeIndex, 1);
            dst.cardIds.splice(overIndex, 0, activeIdStr);
            return next;
        });
    };

    const handleDragEnd = async () => {
        if (!dragSourceRef.current || !activeId) {
            setActiveId(null);
            return;
        }

        const { taskId, fromCategoryId } = dragSourceRef.current;
        const targetCol = findContainer(taskId);
        dragSourceRef.current = null;
        setActiveId(null);

        if (!targetCol || targetCol.id === fromCategoryId) return;

        try {
            const { data } = await axiosInstance.post("commonUpdate", {
                table: "contact_masters", // <-- IMPORTANT: correct table for contacts
                where: JSON.stringify({ id: Number(taskId) }),
                data: JSON.stringify({
                    contact_status: Number(targetCol.id), // update contact_status
                }),
            });

            if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                toast.error(data.ack_msg || "Failed to update status");
                loadKanbanData(); // rollback on failure
            }
        } catch {
            toast.error("Failed to update contact status");
            loadKanbanData();
        }
    };

    const resolvedColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            cards: col.cardIds.map((id) => cards[id]).filter(Boolean),
        }));
    }, [columns, cards]);

    const handleSearch = () => {
        loadKanbanData();
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            loadKanbanData();
        }
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
                                    <button type="button" onClick={() => { loadKanbanData(); }} style={{ cursor: "pointer" }}>
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
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value) }}
                                            onKeyPress={handleSearchKeyPress}
                                        />
                                        <button
                                            type="button"
                                            className="px-2 py-1 text-white"
                                            style={{ backgroundColor: "#f58634", borderRadius: "3px" }}
                                            onClick={handleSearch}
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="text-end">
                                <span onClick={() => openInNewTab("/videoTutorial", 12)}>
                                    Learn More
                                </span>
                                <span className="close ms-3" onClick={() => setIsCloseConfirmation(true)}>
                                    ×
                                </span>
                            </div>
                        </div>
                        <Row>
                            <Col>
                                <BsCard>
                                    <BsCard.Body>
                                        {isLoading && (
                                            <div className="text-center py-5">
                                                <div className="spinner-border" />
                                            </div>
                                        )}
                                        {!isLoading && (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCorners}
                                                onDragStart={handleDragStart}
                                                onDragOver={handleDragOver}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <div className="kanban-board d-flex gap-3" style={{ height: "81vh" }}>
                                                    {resolvedColumns.map((col) => (
                                                        <KanbanColumn
                                                            key={col.id}
                                                            column={col}
                                                            cards={col.cards}
                                                            onView={handleViewTask}
                                                        />
                                                    ))}
                                                </div>
                                                <DragOverlay>
                                                    {activeId && <DraggedItem card={cards[activeId]} />}
                                                </DragOverlay>
                                            </DndContext>
                                        )}
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
                    // initialSelectedActiveId={filters.selectedActiveId}
                    // initialSelectedDays={filters.selectedDays}
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