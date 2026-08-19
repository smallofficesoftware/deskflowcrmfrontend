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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card as BsCard, Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../common/SharedFunction";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IFilterPayload } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import {
  fetchApiTask,
  ITaskView,
} from "../../../pages/left-side/header/Setting/taskList/TaskListController";
import { FilterParams } from "../../../pages/left-side/header/Setting/taskList/TaskListView";
import CreateTaskView from "../../../pages/right-side/create-task/CreateTaskView";
import { axiosInstance } from "../../../services/axiosInstance";
import CheckBoxFilterModal from "../CheckBoxFilterModal";
import ConfirmationModal from "../ConfirmationModal";
import DraggedItem from "./DraggedItem";
import "./KanbanBoard.css";
import KanbanColumn from "./KanbanColumn";
import TaskInfoModal from "./TaskInfoModal";
import { Column, Id, KanbanBoardModal, KanbanCard } from "./types";

export function transformTasksToKanban(
  tasks: ITaskView[],
  taskCategories: {
    id: number;
    name: string;
    color: string;
  }[],
): {
  cards: Record<string, KanbanCard>;
  columns: Column[];
} {
  const cards: Record<string, KanbanCard> = {};
  const columnsMap: Record<string, Column> = {};
  taskCategories.forEach((cat) => {
    const colId = String(cat.id);
    columnsMap[colId] = {
      id: colId,
      title: cat.name,
      cardIds: [],
      color: cat.color,
    };
  });
  tasks.forEach((task) => {
    if (task.status == null) return;
    const columnId = String(task.status);
    const column = columnsMap[columnId];
    if (!column) return;
    const cardId = String(task.id);
    cards[cardId] = {
      id: cardId,
      title: task.task_title ?? "",
      description: task.task_remark ?? "",
      assignee: task.assigned_team_member_names ?? "",
      priority: task.task_priority,
      color: column.color,
    };
    column.cardIds.push(cardId);
  });
  return {
    cards,
    columns: Object.values(columnsMap),
  };
}

const KanbanBoard: React.FC<KanbanBoardModal> = ({
  show,
  handleclose,
  supportTicketFlag,
  contact_id,
}) => {
  useEffect(() => {
    if (show) {
      loadKanbanData();
    }
  }, [show]);

  const [columns, setColumns] = useState<Column[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [cards, setCards] = useState<Record<string, KanbanCard>>({});
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [activeId, setActiveId] = useState<Id | null>(null);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [viewTaskId, setViewTaskId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterParams, setFilterParams] = useState<FilterParams>({
    filterData: null,
    checkedOptions: [],
    startSearchDate: null,
    endSearchDate: null,
    checkedOptionsStageStatus: [],
    assignedByMultiTeamMember: [],
    createdByMultiTeamMember: [],
    checkedOptionsTaskassignOrNot: [],
    checkedOptionsTaskType: [],
    checkedOptionsShowTemplateTask: [],
  });
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<
    ITaskView[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const canAdd = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.ADD,
  );

  // useEffect(() => {
  //     if (!show) return;

  //     const timeoutId = setTimeout(() => {
  //         if (searchTerm !== undefined) {
  //             loadKanbanData();
  //         }
  //     }, 800);

  //     return () => clearTimeout(timeoutId);
  // }, [searchTerm]);

  useEffect(() => {
    if (targetVsIncentiveList.length > 0 && columns.length > 0) {
      const categories = columns.map((col) => ({
        id: Number(col.id),
        name: col.title,
        color: col.color || "#cccccc",
      }));
      const { columns: newColumns, cards: newCards } = transformTasksToKanban(
        targetVsIncentiveList,
        categories,
      );
      setColumns(newColumns);
      setCards(newCards);
    }
  }, [targetVsIncentiveList]);

  const handleViewTask = (cardId: string) => {
    setViewTaskId(Number(cardId));
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
    const {
      filterData,
      checkedOptionsLabel: checkedOptions,
      endSearchDate,
      startSearchDate,
      checkedOptionsStageStatus,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      checkedOptionsTaskassignOrNot,
      checkedOptionsTaskType,
      checkedOptionsShowTemplateTask,
    } = filterPayload;

    setFilterParams({
      filterData,
      checkedOptions: checkedOptions ?? [],
      startSearchDate,
      endSearchDate,
      checkedOptionsStageStatus: checkedOptionsStageStatus ?? [],
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      checkedOptionsTaskassignOrNot: checkedOptionsTaskassignOrNot || [],
      checkedOptionsTaskType: checkedOptionsTaskType || [],
      checkedOptionsShowTemplateTask: checkedOptionsShowTemplateTask || [],
    });

    const isFilterApplied =
      (checkedOptions?.length ?? 0) > 0 ||
      Boolean(filterData?.country) ||
      Boolean(filterData?.state) ||
      Boolean(startSearchDate) ||
      Boolean(endSearchDate) ||
      (checkedOptionsStageStatus?.length ?? 0) > 0 ||
      (checkedOptionsTaskType || [])?.length > 0 ||
      (checkedOptionsShowTemplateTask || [])?.length > 0 ||
      (checkedOptionsTaskassignOrNot?.length ?? 0) > 0 ||
      (assignedByMultiTeamMember?.length ?? 0) > 0 ||
      (createdByMultiTeamMember?.length ?? 0) > 0;

    setHasData(isFilterApplied);
    setIsModalFilterVisible(false);
    loadKanbanData();
  };

  const onhideTaskModal = () => {
    setIsCreateModel(false);
    loadKanbanData();
  };

  const dragSourceRef = useRef<{
    taskId: Id;
    fromCategoryId: Id;
  } | null>(null);

  const loadKanbanData = async () => {
    setIsLoading(true);
    try {
      const uuid = localStorage.getItem("UUID");
      const [categoryRes] = await Promise.all([
        axiosInstance.post("get-status", {
          status_type: "8",
          a_application_login_id: uuid,
          action_flag: "view",
        }),
        // fetchApiTask(
        //   setTargetVsIncentiveList,
        //   setLoading,
        //   searchTerm,
        //   2,
        //   0,
        //   null,
        //   null,
        //   0,
        //   ITEMS_PER_PAGE,
        //   null,
        //   filterParams.startSearchDate,
        //   filterParams.endSearchDate,
        //   filterParams.checkedOptionsStageStatus,
        //   filterParams.assignedByMultiTeamMember,
        //   filterParams.createdByMultiTeamMember,
        //   undefined,
        //   11,
        //   filterParams.checkedOptionsTaskassignOrNot,
        //   null,
        //   null,
        //   null,
        //   null,
        //   "0",
        //   filterParams.checkedOptionsTaskType,
        //   filterParams.checkedOptionsShowTemplateTask,
        //   supportTicketFlag,
        //   contact_id
        // ),
        fetchApiTask(
          setTargetVsIncentiveList,
          setLoading,
          searchTerm,
          2,                                       // ownerFilter
          0,                                       // dueFilter / setSelectedDue
          null,                                    // statusFilter
          null,                                    // taskCategoryFilter
          0,                                       // page
          ITEMS_PER_PAGE,                          // itemsPerPage
          null,                                    // priorityFilter
          filterParams.startSearchDate,
          filterParams.endSearchDate,
          filterParams.checkedOptionsStageStatus,
          filterParams.assignedByMultiTeamMember,
          filterParams.createdByMultiTeamMember,
          undefined,                               // setTaskId
          11,                                      // apicallCount
          filterParams.checkedOptionsTaskassignOrNot,
          null,                                    // setTaskAutoRefreshON
          null,                                    // setTaskAutoRefreshTimeout
          null,                                    // setTaskAutoRefreshInactivityDelay
          null,                                    // setTaskCountGet
          "0",                                     // is_archived
          filterParams.checkedOptionsTaskType,
          filterParams.checkedOptionsShowTemplateTask,
          supportTicketFlag,
          undefined,                               // setTaskCountGetAll
          undefined,                               // setTaskCountGetMy
          null,                                    // selectedLabelId
          contact_id                               //  contact_masters_id
        )
      ]);

      if (categoryRes.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        throw new Error("Failed to load Kanban data");
      }

      const categories = categoryRes.data.data ?? [];

      const initialColumns = categories.map((cat: any) => ({
        id: String(cat.id),
        title: cat.name,
        cardIds: [],
        color: cat.color || "#cccccc",
      }));
      setColumns(initialColumns);
    } catch (error: any) {
      toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
        table: "task_managements",
        where: JSON.stringify({ id: Number(taskId) }),
        data: JSON.stringify({
          status:
            targetCol.id === "uncategorized" ? null : Number(targetCol.id),
        }),
      });
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          // toast.success("status changed successfully");
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          toast.success("status Apply Failed");
        }
      }
    } catch {
      toast.error("Failed to update task category");
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
    if (e.key === "Enter") {
      loadKanbanData();
    }
  };

  const handleCreateTask = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  return (
    <>
      {show && (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{ height: "100%", width: "100%", margin: 0 }}
          >
            <div className="mb-2 d-flex justify-content-between align-content-center align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-between gap-2"
                style={{ flex: 1 }}
              >
                <h2>
                  {supportTicketFlag == 0 ? "My Tasks" : "My Support Tickets"}
                </h2>
                <div className="d-flex align-items-center justify-content-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      loadKanbanData();
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <svg width="30" height="30" viewBox="0 0 50 50" fill="gray">
                      <path
                        fill="currentColor"
                        d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="M18 24h-2v-6h-6v-2h8z"
                      ></path>
                      <path fill="currentColor" d="M40 34h-8v-8h2v6h6z"></path>
                    </svg>
                  </button>
                  <span
                    className="d-flex align-content-center justify-content-center rounded-1 text-white"
                    style={{ height: "24px", width: "24px", cursor: "pointer" }}
                    title="Add new Task"
                    onClick={handleCreateTask}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="26px"
                      viewBox="0 -960 960 960"
                      width="26px"
                      fill="gray"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </span>
                  <span
                    className="text-white"
                    id="task-filter"
                    title="Task Filter"
                    onClick={() => {
                      setIsModalFilterVisible(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
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
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                      }}
                      onKeyPress={handleSearchKeyPress}
                    />
                    <button
                      type="button"
                      className="px-2 py-1 text-white"
                      style={{
                        backgroundColor: "#f58634",
                        borderRadius: "3px",
                      }}
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-end">
                <span
                  className="close ms-3"
                  onClick={() => setIsCloseConfirmation(true)}
                >
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
                        <div
                          className="kanban-board d-flex gap-3"
                          style={{ height: "81vh" }}
                        >
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
          title="Close this Task View"
          message="Are you sure?"
          btn1="No"
          btn2="Yes"
        />
      )}
      {isViewModalOpen && viewTaskId && (
        <TaskInfoModal
          show={isViewModalOpen}
          onHide={() => setIsViewModalOpen(false)}
          title="View Task"
          supportTicketFlag={supportTicketFlag}
          taskId={viewTaskId}
        />
      )}

      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirmFilter}
          title={"Filter your Tasks"}
          message="Please select the Dates , Status And Team Member."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 4, 10, 9, 11, 12]}
          stageandStatusOrderType={8}
          pageId={1}
          initialFilterData={filterParams.filterData}
          initialCheckedOptions={filterParams.checkedOptions}
          initialStartSearchDate={filterParams.startSearchDate}
          initialEndSearchDate={filterParams.endSearchDate}
          initialCheckedOptionsStageStatus={
            filterParams.checkedOptionsStageStatus
          }
          initialCheckedOptionsTaskType={filterParams.checkedOptionsTaskType}
          initialCheckedAssignedByMultiTeamMember={
            filterParams.assignedByMultiTeamMember
          }
          initialCheckedCreatedByMultiTeamMember={
            filterParams.createdByMultiTeamMember
          }
          initialCheckedOptionsTaskAssignOrnot={
            filterParams.checkedOptionsTaskassignOrNot || []
          }
          initialCheckedOptionsShowTaskTemplate={
            filterParams.checkedOptionsShowTemplateTask || []
          }
          labelFilderApplyAndOr={0}
        />
      )}
      {isOpenCreateModel && (
        <CreateTaskView
          show={isOpenCreateModel}
          onHide={() => onhideTaskModal()}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
          headerName={
            supportTicketFlag == 0 ? "Create Task" : "Create Support Ticket"
          }
          productToEdit={undefined}
          selectedButton={"all"}
          selectedStageStatusId={Number(null)}
          selectedPriorityId={undefined}
          selectedButtonDue={""}
          supportTicketFlag={supportTicketFlag}
        />
      )}
    </>
  );
};

export default KanbanBoard;
