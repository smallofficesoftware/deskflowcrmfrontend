import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";
import useSocketEvent from "../../../../hooks/useSocketEvent";
import { KanbanBoard as SharedKanbanBoard } from "../../shared-kanban/components/KanbanBoard";
import { KanbanModalFrame } from "../../shared-kanban/components/KanbanModalFrame";
import { useKanbanColumns } from "../../shared-kanban/hooks/useKanbanColumns";
import { KanbanItemsInfiniteData } from "../../shared-kanban/hooks/useKanbanItems";
import {
  KanbanBoardConfig,
  KanbanColumnDef,
  KanbanFetchResult,
  KanbanItem,
} from "../../shared-kanban/types";
import {
  fetchAutoRefreshConfig,
  fetchBoardColumns,
  getTaskList,
  updateTaskColumnAndPosition,
} from "../api/kanbanApi";
import "../styles/kanban.css";
import {
  BoardType,
  DEFAULT_FILTER_PARAMS,
  ITaskView,
  Task,
  TaskKanbanModalProps,
} from "../types/kanban.types";
import { parseRefreshTimeout } from "../utils/taskMapper";
import { TaskCard } from "./TaskCard";

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: number) => void;
}> = ({ toasts, onRemove }) => {
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => onRemove(t.id), 4000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);
  return (
    <div className="kanban-toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`kanban-toast ${toast.type}`}
          onClick={() => onRemove(toast.id)}
        >
          <span className="toast-icon">
            {toast.type === "error" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            )}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

// ─── Inner ────────────────────────────────────────────────────────────────────
interface KanbanModalInnerProps {
  boardType: BoardType;
  onHide: () => void;
  onTaskClick?: (task: Task) => void;
  renderAddTaskModal?: TaskKanbanModalProps["renderAddTaskModal"];
  renderEditTaskModal?: TaskKanbanModalProps["renderEditTaskModal"];
  canAdd?: boolean;
  canEdit?: boolean;
  onChangeStatus?: (task: Task) => void;
  onAssignLabel?: (task: Task) => void;
  onAssignTeamMember?: (task: Task) => void;
  onTimeline?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onUnarchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onMarkRead?: (task: Task) => void;
  onMarkUnread?: (task: Task) => void;
  onChangeExternalStatus?: (task: Task) => void;
  onConvertToTask?: (task: Task) => void;
  filterParams?: FilterParams;
  hasActiveFilter?: boolean;
  supportTicketFlag?: number | null;
  onOpenFilter?: () => void;
}

const KanbanModalInner: React.FC<KanbanModalInnerProps> = ({
  boardType,
  onHide,
  onTaskClick,
  renderAddTaskModal,
  renderEditTaskModal,
  canAdd = true,
  canEdit = true,
  onChangeStatus,
  onAssignLabel,
  onAssignTeamMember,
  onTimeline,
  onArchive,
  onUnarchive,
  onDelete,
  onMarkRead,
  onMarkUnread,
  onChangeExternalStatus,
  onConvertToTask,
  filterParams,
  hasActiveFilter = false,
  onOpenFilter,
  supportTicketFlag,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const queryClient = useQueryClient();

  // Feature 3 & 4: add/edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState<ITaskView | null>(null);

  const BOARD_KEY = `task-kanban-${boardType}`;

  // Debounce search
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Feature 4: task edit handler — converts Task to ITaskView shape
  const handleTaskEdit = useCallback(
    (task: Task) => {
      if (!canEdit || !renderEditTaskModal) return;
      // Build ITaskView from task.raw (full API object) or from mapped fields
      const raw = (task.raw ?? {}) as Record<string, unknown>;
      const item: ITaskView = {
        id: task.task_id,
        assigned_team_member: (raw.assigned_team_member as number) ?? 0,
        task_enddate: task.task_enddate ?? "",
        task_fromdate: task.task_fromdate ?? "",
        created_date_time: task.created_at,
        task_type: task.task_type_id,
        task_title: task.task_name,
        task_remark: task.task_remark,
        task_category_id: task.category_id,
        task_priority: task.priority_id,
        created_by_name: task.created_by_name,
        assigned_team_member_names: task.assigned_to,
        status: task.status,
        category_name: task.category_name,
        category_color_code: task.category_color_code,
        stage_status_name: task.stage_status_name,
        stage_status_color: task.stage_status_color,
        label_name: task.label_name ?? "",
        label_color: task.label_color ?? "",
        label_id: raw.label_id,
        contact_person_name: task.contact_name,
        contact_person_number: task.mobile_number,
        // Spread all remaining raw fields for completeness
        ...raw,
      };
      setEditTask(item);
      setShowEditModal(true);
    },
    [canEdit, renderEditTaskModal],
  );

  const onTaskEdit = canEdit && renderEditTaskModal ? handleTaskEdit : undefined;

  const renderCard = useCallback(
    (task: Task) => (
      <TaskCard
        task={task}
        onClick={onTaskClick}
        onEdit={onTaskEdit}
        onChangeStatus={onChangeStatus}
        onAssignLabel={onAssignLabel}
        onAssignTeamMember={onAssignTeamMember}
        onTimeline={onTimeline}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onDelete={onDelete}
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
        onChangeExternalStatus={onChangeExternalStatus}
        onConvertToTask={onConvertToTask}
      />
    ),
    [
      onTaskClick,
      onTaskEdit,
      onChangeStatus,
      onAssignLabel,
      onAssignTeamMember,
      onTimeline,
      onArchive,
      onUnarchive,
      onDelete,
      onMarkRead,
      onMarkUnread,
      onChangeExternalStatus,
      onConvertToTask,
    ],
  );

  const config: KanbanBoardConfig<Task> = useMemo(
    () => ({
      boardKey: BOARD_KEY,
      fetchColumns: (): Promise<KanbanColumnDef[]> =>
        fetchBoardColumns(boardType).then((cols) =>
          cols.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            unreadCount: c.unread_count,
          })),
        ),
      fetchItems: (params): Promise<KanbanFetchResult<Task>> =>
        getTaskList({
          page: params.page,
          limit: params.limit,
          search: params.searchTerm,
          columnId: Number(params.columnId),
          boardType,
          filterParams: filterParams ?? DEFAULT_FILTER_PARAMS,
          supportTicketFlag,
        }).then((res) => ({
          items: res.tasks,
          total: res.total,
          hasMore: res.hasMore,
        })),
      itemPosition: (task) => {
        const raw = (task.raw ?? {}) as Record<string, unknown>;
        const position = raw.position;
        return position === null || position === undefined
          ? null
          : Number(position);
      },
      updateItemPosition: (taskId, columnId, position) =>
        updateTaskColumnAndPosition(Number(taskId), Number(columnId), position),
      renderCard,
      sortOptions: [
        {
          label: "Due date",
          compare: (a, b) =>
            (a.due_date ?? "").localeCompare(b.due_date ?? ""),
        },
        {
          label: "Priority",
          compare: (a, b) => (b.priority_id ?? 0) - (a.priority_id ?? 0),
        },
      ],
    }),
    [BOARD_KEY, boardType, filterParams, supportTicketFlag, renderCard],
  );

  const { data: columns = [], isLoading: isColumnsLoading } =
    useKanbanColumns(config);

  // Auto refresh
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const setup = async () => {
      try {
        const autoRefreshConfig = await fetchAutoRefreshConfig();
        if (autoRefreshConfig.TASK_AUTO_REFRESH_ON === "true") {
          const timeout = parseRefreshTimeout(
            autoRefreshConfig.TASK_AUTO_REFRESH_TIMEOUT ?? "30s",
          );
          interval = setInterval(() => {
            queryClient.invalidateQueries({
              queryKey: ["shared-kanban-items", BOARD_KEY],
            });
          }, timeout);
        }
      } catch {
        /* ignore */
      }
    };
    setup();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [BOARD_KEY, queryClient]);

  // Refresh all task queries for this board
  const refreshAllTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shared-kanban-columns", BOARD_KEY] });
    queryClient.invalidateQueries({ queryKey: ["shared-kanban-items", BOARD_KEY] });
  }, [queryClient, BOARD_KEY]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refreshAllTasks();
    setTimeout(() => setIsRefreshing(false), 600);
  }, [refreshAllTasks]);

  // Is `id` in any column's currently-loaded pages for this board? Checks
  // every "shared-kanban-items" query under this BOARD_KEY (one per
  // column/searchTerm combo) via a partial queryKey match.
  const isTaskIdLoaded = useCallback(
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
    [queryClient, BOARD_KEY],
  );

  // Live sync: any teammate adding/editing/moving a task (including via the
  // drag-to-move commonUpdate path) refreshes every board open for the
  // company - but only when it's worth it: no id on the payload means a new
  // task (always refresh, it might belong on this board).
  //
  // assigned_to (present whenever an id is - baseController.js's
  // attachTaskAssignees) is authoritative for who this concerns, so when
  // it's there we trust it alone: refresh whenever it's mine, loaded or
  // not - a BRAND NEW assignment is exactly the case where the task was
  // never loaded before (I wasn't assigned, so my board never fetched it),
  // so gating on isTaskIdLoaded here would silently skip the one case that
  // matters most. Only fall back to the loaded-check when assigned_to is
  // somehow missing (payload enrichment failed) - can't tell relevance,
  // so use "was it already visible" as a weaker proxy.
  useSocketEvent<{ id?: number; assigned_to?: number[] }>("task-changed", (payload) => {
    if (!payload?.id) {
      refreshAllTasks();
      return;
    }
    if (payload.assigned_to) {
      const myLoginId = Number(localStorage.getItem("UUID"));
      if (payload.assigned_to.includes(myLoginId)) {
        refreshAllTasks();
      }
      return;
    }
    if (isTaskIdLoaded(payload.id)) {
      refreshAllTasks();
    }
  });

  const boardTypeLabelMap: Record<BoardType, string> = {
    status: "Status",
    category: "Category",
    taskType: "Task Type",
    priority: "Priority",
    custom: "Custom",
  };  

  return (
    <>
      <KanbanModalFrame
        show
        onHide={onHide}
        title="Task Board"
        subtitle={`${boardTypeLabelMap[boardType]} view`}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onRefresh={handleRefresh}
        isSearching={isSearching}
        isRefreshing={isRefreshing}
        onOpenFilter={onOpenFilter}
        hasActiveFilter={hasActiveFilter}
        filterTitle="Filter Tasks"
        onAdd={
          renderAddTaskModal
            ? () => {
                if (canAdd) setShowAddModal(true);
                else addToast("You don't have permission to add tasks.", "error");
              }
            : undefined
        }
        addTitle="Create Task"
      >
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <SharedKanbanBoard
            config={config}
            columns={columns}
            isColumnsLoading={isColumnsLoading}
            searchTerm={debouncedSearch}
            onError={(msg) => addToast(msg, "error")}
            onSuccess={(msg) => addToast(msg, "success")}
          />
        </div>
      </KanbanModalFrame>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Feature 3: Add task modal — rendered by parent app */}
      {showAddModal &&
        renderAddTaskModal &&
        ReactDOM.createPortal(
          <div style={{ zIndex: "999999999", position: "relative" }}>
            {renderAddTaskModal({
              show: showAddModal,
              onHide: () => setShowAddModal(false),
              onSuccess: () => {
                setShowAddModal(false);
                refreshAllTasks();
                addToast("Task created successfully!", "success");
              },
            })}
          </div>,
          document.body, // ← Portal at body level, not inside kanban
        )}

      {/* Feature 4: Edit task modal — rendered by parent app */}
      {showEditModal &&
        editTask &&
        renderEditTaskModal?.({
          show: showEditModal,
          onHide: () => {
            setShowEditModal(false);
            setEditTask(null);
          },
          onSuccess: () => {
            setShowEditModal(false);
            setEditTask(null);
            refreshAllTasks();
            addToast("Task updated successfully!", "success");
          },
          taskItem: editTask,
        })}
    </>
  );
};

// ─── Query Client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// ─── Main Export ──────────────────────────────────────────────────────────────
export const TaskKanbanModal: React.FC<TaskKanbanModalProps> = ({
  show,
  onHide,
  boardType = "status",
  supportTicketFlag,
  onTaskClick,
  renderAddTaskModal,
  renderEditTaskModal,
  canAdd = true,
  canEdit = true,
  onChangeStatus,
  onAssignLabel,
  onAssignTeamMember,
  onTimeline,
  onArchive,
  onUnarchive,
  onDelete,
  onMarkRead,
  onMarkUnread,
  onChangeExternalStatus,
  onConvertToTask,
  filterParams,
  hasActiveFilter = false,
  onOpenFilter,
}) => {
  // Modal chrome (backdrop, scroll-lock, Escape-to-close, kanban-scope) all
  // moved into KanbanModalFrame, used inside KanbanModalInner below - this
  // outer component now only needs to gate mounting KanbanModalInner (and
  // its data-fetching hooks) behind `show`, and provide the query client.
  if (!show) return null;

  const markup = (
    <QueryClientProvider client={queryClient}>
      <KanbanModalInner
        boardType={boardType}
        onHide={onHide}
        onTaskClick={onTaskClick}
        renderAddTaskModal={renderAddTaskModal}
        renderEditTaskModal={renderEditTaskModal}
        canAdd={canAdd}
        canEdit={canEdit}
        onChangeStatus={onChangeStatus}
        onAssignLabel={onAssignLabel}
        onAssignTeamMember={onAssignTeamMember}
        onTimeline={onTimeline}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onDelete={onDelete}
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
        onChangeExternalStatus={onChangeExternalStatus}
        onConvertToTask={onConvertToTask}
        filterParams={filterParams}
        hasActiveFilter={hasActiveFilter}
        onOpenFilter={onOpenFilter}
        supportTicketFlag={supportTicketFlag}
      />
    </QueryClientProvider>
  );

  return ReactDOM.createPortal(markup, document.body);
};
