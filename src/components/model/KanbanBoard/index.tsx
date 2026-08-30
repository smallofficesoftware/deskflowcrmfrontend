import { useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import React, { useCallback, useMemo, useState } from "react";
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
import { KanbanModalFrame } from "../shared-kanban/components/KanbanModalFrame";
import { useKanbanColumns } from "../shared-kanban/hooks/useKanbanColumns";
import { KanbanBoardConfig, KanbanColumnDef, KanbanFetchResult } from "../shared-kanban/types";
import TaskInfoModal from "./TaskInfoModal";
import { KanbanBoardModal } from "./types";

const BOARD_KEY = "task-category";

interface KanbanTaskItem {
  id: number;
  title: string;
  position: number | null;
  dueDate: string | null;
}

const mapTaskToKanbanItem = (task: ITaskView): KanbanTaskItem => ({
  id: task.id,
  title: task.task_title ?? "",
  position: (task as any).position ?? null,
  dueDate: task.task_enddate ?? null,
});

const columnSummary = (items: KanbanTaskItem[]): string => {
  // dueDate (task.task_enddate) arrives already formatted server-side as
  // "DD-MM-YYYY hh:mm A" (see taskManagementServices.js), not ISO -
  // new Date(dueDate) can't reliably parse that (native Date assumes
  // MM-DD-YYYY for a dash-separated string, so day=30 fails outright as
  // an invalid month), silently producing Invalid Date and undercounting
  // every overdue task. Parse with the exact known format instead.
  const now = moment();
  const overdue = items.filter((item) => {
    if (!item.dueDate) return false;
    const parsed = moment(item.dueDate, "DD-MM-YYYY hh:mm A");
    return parsed.isValid() && parsed.isBefore(now);
  }).length;
  return overdue > 0 ? `${overdue} overdue` : "";
};

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
      columnSummary,
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
      <KanbanModalFrame
        show={show}
        onHide={() => setIsCloseConfirmation(true)}
        title={supportTicketFlag == 0 ? "My Tasks" : "My Support Tickets"}
        subtitle="Category view"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refreshBoard}
        onOpenFilter={() => setIsModalFilterVisible(true)}
        hasActiveFilter={hasData}
        filterTitle="Task Filter"
        onAdd={handleCreateTask}
        addTitle="Add new Task"
      >
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <SharedKanbanBoard
            config={config}
            columns={columns}
            isColumnsLoading={isColumnsLoading}
            searchTerm={searchTerm}
            onError={(msg) => toast.error(msg)}
            onSuccess={(msg) => toast.success(msg)}
          />
        </div>
      </KanbanModalFrame>
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
