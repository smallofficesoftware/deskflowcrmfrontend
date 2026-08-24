import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import { Card as BsCard, Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../common/SharedFunction";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
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
import { KanbanBoard as SharedKanbanBoard } from "../shared-kanban/components/KanbanBoard";
import { useKanbanColumns } from "../shared-kanban/hooks/useKanbanColumns";
import { KanbanBoardConfig, KanbanColumnDef, KanbanFetchResult } from "../shared-kanban/types";
import "./KanbanBoard.css";
import TaskInfoModal from "./TaskInfoModal";
import { KanbanBoardModal } from "./types";

const BOARD_KEY = "task-category";

interface KanbanTaskItem {
  id: number;
  title: string;
  position: number | null;
}

const mapTaskToKanbanItem = (task: ITaskView): KanbanTaskItem => ({
  id: task.id,
  title: task.task_title ?? "",
  position: (task as any).position ?? null,
});

const KanbanBoard: React.FC<KanbanBoardModal> = ({
  show,
  handleclose,
  supportTicketFlag,
  contact_id,
}) => {
  const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [hasData, setHasData] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<ITaskView[]>([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const canAdd = useCheckUserPermission(PAGE_ID.TASK_MANAGEMENT, PERMISSION_TYPE.ADD);

  useEscapeKey(handleclose);

  const fetchColumns = useCallback(async (): Promise<KanbanColumnDef[]> => {
    const uuid = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("get-status", {
      status_type: "8",
      a_application_login_id: uuid,
      action_flag: "view",
    });
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      throw new Error("Failed to load task categories");
    }
    const categories = (data.data ?? []) as any[];
    return categories.map((cat) => ({
      id: String(cat.id),
      name: cat.name,
      color: cat.color || "#cccccc",
    }));
  }, []);

  const fetchItems = useCallback(
    (params: {
      columnId: string | number;
      page: number;
      limit: number;
      searchTerm: string;
    }): Promise<KanbanFetchResult<KanbanTaskItem>> => {
      return new Promise((resolve) => {
        fetchApiTask(
          (items: ITaskView[]) => {
            const mapped = items.map(mapTaskToKanbanItem);
            resolve({
              items: mapped,
              total: mapped.length,
              hasMore: mapped.length === params.limit,
            });
          },
          () => {},
          params.searchTerm,
          2, // ownerFilter
          0, // dueFilter
          null as any, // setSelectedUnread
          Number(params.columnId), // statusFilter — filters to exactly this Kanban column
          null, // taskCategoryFilter
          params.page - 1,
          params.limit,
          null, // priorityFilter
          filterParams.startSearchDate,
          filterParams.endSearchDate,
          filterParams.checkedOptionsStageStatus,
          filterParams.assignedByMultiTeamMember,
          filterParams.createdByMultiTeamMember,
          undefined, // setTaskId
          11, // apicallCount
          filterParams.checkedOptionsTaskassignOrNot,
          null,
          null,
          null,
          null,
          "0", // is_archived
          filterParams.checkedOptionsTaskType,
          filterParams.checkedOptionsShowTemplateTask,
          supportTicketFlag,
          undefined,
          undefined,
          null, // selectedLabelId
          contact_id,
        );
      });
    },
    [filterParams, supportTicketFlag, contact_id],
  );

  const updateItemPosition = useCallback(
    async (itemId: string | number, columnId: string | number, position: number) => {
      const { data } = await axiosInstance.post("commonUpdate", {
        table: "task_managements",
        where: JSON.stringify({ id: Number(itemId) }),
        data: JSON.stringify({
          status: columnId === "uncategorized" ? null : Number(columnId),
          position,
        }),
      });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        throw new Error(data.ack_msg || "Failed to update task category");
      }
    },
    [],
  );

  const handleViewTask = useCallback((cardId: string | number) => {
    setViewTaskId(Number(cardId));
    setIsViewModalOpen(true);
  }, []);

  const renderCard = useCallback(
    (card: KanbanTaskItem) => (
      <>
        <p className="fw-bold">#{card.id}</p>
        <p className="mt-1">{card.title}</p>
        <div className="d-flex align-items-center justify-content-end">
          <div
            style={{ color: "gray", cursor: "pointer" }}
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              handleViewTask(card.id);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="currentColor"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
          </div>
        </div>
      </>
    ),
    [handleViewTask],
  );

  const config: KanbanBoardConfig<KanbanTaskItem> = useMemo(
    () => ({
      boardKey: BOARD_KEY,
      fetchColumns,
      fetchItems,
      itemPosition: (item) => item.position,
      updateItemPosition,
      renderCard,
      pageSize: ITEMS_PER_PAGE,
      emptyStateLabel: "Drop tasks here",
    }),
    [fetchColumns, fetchItems, updateItemPosition, renderCard],
  );

  const { data: columns = [], isLoading: isColumnsLoading } = useKanbanColumns(config);

  const refreshBoard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shared-kanban-columns", BOARD_KEY] });
    queryClient.invalidateQueries({ queryKey: ["shared-kanban-items", BOARD_KEY] });
  }, [queryClient]);

  const handleModalClose = () => {
    setIsModalFilterVisible(false);
  };

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
    refreshBoard();
  };

  const onhideTaskModal = () => {
    setIsCreateModel(false);
    refreshBoard();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") refreshBoard();
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
          <div className="modal-content1" style={{ height: "100%", width: "100%", margin: 0 }}>
            <div className="mb-2 d-flex justify-content-between align-content-center align-items-center gap-2">
              <div className="d-flex align-items-center justify-content-between gap-2" style={{ flex: 1 }}>
                <h2>{supportTicketFlag == 0 ? "My Tasks" : "My Support Tickets"}</h2>
                <div className="d-flex align-items-center justify-content-start gap-2">
                  <button type="button" onClick={refreshBoard} style={{ cursor: "pointer" }}>
                    <svg width="30" height="30" viewBox="0 0 50 50" fill="gray">
                      <path fill="currentColor" d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"></path>
                      <path fill="currentColor" d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"></path>
                      <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z"></path>
                      <path fill="currentColor" d="M40 34h-8v-8h2v6h6z"></path>
                    </svg>
                  </button>
                  <span
                    className="d-flex align-content-center justify-content-center rounded-1 text-white"
                    style={{ height: "24px", width: "24px", cursor: "pointer" }}
                    title="Add new Task"
                    onClick={handleCreateTask}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="gray">
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </span>
                  <span
                    className="text-white"
                    id="task-filter"
                    title="Task Filter"
                    onClick={() => setIsModalFilterVisible(true)}
                    style={{ cursor: "pointer" }}
                  >
                    {hasData ? (
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={hasData ? "red" : "gray"}>
                        <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                      </svg>
                    ) : (
                      <svg height="24px" viewBox="0 -960 960 960" width="24px" fill={hasData ? "red" : "gray"}>
                        <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                      </svg>
                    )}
                  </span>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <input
                      type="search"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                    />
                    <button
                      type="button"
                      className="px-2 py-1 text-white"
                      style={{ backgroundColor: "#f58634", borderRadius: "3px" }}
                      onClick={refreshBoard}
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
                      <SharedKanbanBoard
                        config={config}
                        columns={columns}
                        isColumnsLoading={isColumnsLoading}
                        searchTerm={searchTerm}
                        onError={(msg) => toast.error(msg)}
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
          initialCheckedOptionsStageStatus={filterParams.checkedOptionsStageStatus}
          initialCheckedOptionsTaskType={filterParams.checkedOptionsTaskType}
          initialCheckedAssignedByMultiTeamMember={filterParams.assignedByMultiTeamMember}
          initialCheckedCreatedByMultiTeamMember={filterParams.createdByMultiTeamMember}
          initialCheckedOptionsTaskAssignOrnot={filterParams.checkedOptionsTaskassignOrNot || []}
          initialCheckedOptionsShowTaskTemplate={filterParams.checkedOptionsShowTemplateTask || []}
          labelFilderApplyAndOr={0}
        />
      )}
      {isOpenCreateModel && (
        <CreateTaskView
          show={isOpenCreateModel}
          onHide={() => onhideTaskModal()}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
          headerName={supportTicketFlag == 0 ? "Create Task" : "Create Support Ticket"}
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
