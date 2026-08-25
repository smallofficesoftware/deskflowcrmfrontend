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
import { useKanbanColumns } from "../../shared-kanban/hooks/useKanbanColumns";
import {
  KanbanBoardConfig,
  KanbanColumnDef,
  KanbanFetchResult,
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
import { SearchBar } from "./SearchBar";
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
  onDelete?: (task: Task) => void;
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
  onDelete,
  filterParams,
  hasActiveFilter = true,
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
        onDelete={onDelete}
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
      onDelete,
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

  // Live sync: any teammate adding/editing/moving a task (including via the
  // drag-to-move commonUpdate path) refreshes every board open for the company.
  useSocketEvent("task-changed", refreshAllTasks);

  const boardTypeLabelMap: Record<BoardType, string> = {
    status: "Status",
    category: "Category",
    taskType: "Task Type",
    priority: "Priority",
    custom: "Custom",
  };  

  return (
    <>
      {/* ── Header ── */}
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
            <div className="kanban-modal-title">Task Board</div>
            <div className="kanban-modal-subtitle">
              {boardTypeLabelMap[boardType]} view
            </div>
          </div>
        </div>

        {/* Right-side header actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            marginRight: 8,
          }}
        >
          {/* Feature 5: Filter button */}
          {onOpenFilter && (
            <button
              title="Filter Tasks"
              onClick={onOpenFilter}
              className="kanban-header-btn"
              style={{ color: hasActiveFilter ? "#ef4444" : undefined }}
            >
              {hasActiveFilter ? (
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
          )}

          {/* Feature 3: Add Task button */}
          {renderAddTaskModal && (
            <button
              title="Create Task"
              onClick={() => {
                if (canAdd) setShowAddModal(true);
                else
                  addToast("You don't have permission to add tasks.", "error");
              }}
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
          onClick={onHide}
        />
      </div>

      {/* ── Body ── */}
      <div className="modal-body kanban-modal-body p-0">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onRefresh={handleRefresh}
          isLoading={isSearching}
          isRefreshing={isRefreshing}
        />

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
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Feature 3: Add task modal — rendered by parent app */}
      {/* {showAddModal &&
        renderAddTaskModal?.({
          show: showAddModal,
          onHide: () => setShowAddModal(false),
          onSuccess: () => {
            setShowAddModal(false);
            refreshAllTasks();
            addToast("Task created successfully!", "success");
          },
        })} */}

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
  onDelete,
  filterParams,
  hasActiveFilter = true,
  onOpenFilter,
}) => {
  const backdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onHide();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [show, onHide]);

  console.log("onAssignTeamMemberonAssignTeamMember",onAssignTeamMember);


  if (!show) return null;

  const markup = (
    <QueryClientProvider client={queryClient}>
      <div className="kanban-scope">
        <div
          ref={backdropRef}
          className="modal-backdrop fade show"
          style={{ zIndex: 1054 }}
          onClick={onHide}
        />
        <div
          className="modal fade show kanban-modal"
          style={{ display: "flex", zIndex: 1055, alignItems: "stretch" }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) onHide();
          }}
        >
          <div
            className="modal-dialog modal-fullscreen m-0 w-100"
            style={{ maxWidth: "100%", height: "100%" }}
          >
            <div
              className="modal-content kanban-modal-content"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
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
                onDelete={onDelete}
                filterParams={filterParams}
                hasActiveFilter={hasActiveFilter}
                onOpenFilter={onOpenFilter}
                supportTicketFlag={supportTicketFlag}
              />
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );

  return ReactDOM.createPortal(markup, document.body);
};
