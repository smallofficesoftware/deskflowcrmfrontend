import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";

// ─── Board Types ─────────────────────────────────────────────────────────────
export type BoardType =
  | "status"
  | "category"
  | "taskType"
  | "priority"
  | "custom";

export interface BoardColumn {
  id: number;
  name: string;
  color: string;
  display_order_type?: number;
  unread_count?: number; // Feature 1: column-level unread count from API
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export const DEFAULT_FILTER_PARAMS: FilterParams = {
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
  labelwiseContactShowAndOrNot: 0,
};

// ─── Task Types ───────────────────────────────────────────────────────────────
export type Priority = "High" | "Medium" | "Low" | "Critical";

export interface Task {
  id: number; // alias of task_id — the shared Kanban engine's drag/card mechanics operate on `.id` generically
  task_id: number; // mapped from raw.id
  task_name: string; // mapped from raw.task_title
  contact_name?: string;
  mobile_number?: string;
  due_date?: string; // mapped from task_enddate
  priority?: Priority;
  assigned_to?: string;
  assigned_avatar?: string;
  status_id: number;
  status: number;
  category_id?: number;
  task_type_id?: number;
  priority_id?: number;
  unread_count?: number;
  is_overdue?: boolean;
  created_at?: string;
  updated_at?: string;

  // ── Feature 1 & 2: new display fields ──────────────────────────────────
  task_number?: number; // raw.id shown as #1010
  category_name?: string; // raw.category_name
  category_color_code?: string; // raw.category_color_code
  created_by_name?: string; // raw.created_by_name

  // ── Feature 2 (eye modal) extra fields ─────────────────────────────────
  stage_status_name?: string; // raw.stage_status_name
  stage_status_color?: string; // raw.stage_status_color
  task_remark?: string; // raw.task_remark (description)
  task_fromdate?: string; // raw.task_fromdate (start date)
  task_enddate?: string; // raw.task_enddate (end/due date)
  label_name?: string; // raw.label_name
  label_color?: string; // raw.label_color

  // ── Checklist (subtasks) progress badge ────────────────────────────────
  checklist_total?: number; // raw.checklist_total
  checklist_done?: number; // raw.checklist_done

  // ── Feature 4: edit needs ITaskView shape ──────────────────────────────
  raw?: Record<string, unknown>; // full raw API object for edit modal
}

// ─── ITaskView (used by CreateTaskView edit modal) ───────────────────────────
// Keep in sync with the parent app's interface
export interface ITaskView {
  id: number;
  assigned_team_member: number | string;
  task_enddate: string;
  task_fromdate: string;
  created_date_time?: string;
  task_type?: number;
  task_title?: string;
  task_remark?: string;
  task_category_id?: number;
  task_template?: number | string | undefined;
  task_priority?: number;
  task_selected_date?: string;
  selected_task_days?: string | undefined;
  created_by_name?: string;
  assigned_team_member_names?: string;
  status?: number;
  external_status?: number;
  contact_masters_id?: number;
  company_masters_id?: number;
  reference_id?: number;
  is_unread?: number;
  stage_status_name?: string;
  stage_status_color?: string;
  reference_table?: any;
  category_name?: string;
  contact_person_name?: string;
  contact_person_number?: string;
  contact_company_name?: string;
  is_archive?: string | number;
  category_color_code?: string | number;
  label_name: string;
  label_color: string;
  label_id: any;
  [key: string]: unknown;
}

// ─── API Payload Types ────────────────────────────────────────────────────────
export interface GetStatusPayload {
  status_type: string;
  a_application_login_id: string;
  action_flag: string;
}
export interface GetTaskPayload {
  searchTerm: string;
  statusFilter: number | null;
  page: number;
  limit: number;
}
export interface UpdateTaskStatusPayload {
  task_id: number;
  status_id: number;
}

// ─── Kanban State Types ───────────────────────────────────────────────────────
export interface ColumnTaskState {
  tasks: Task[];
  page: number;
  hasMore: boolean;
  total: number;
  isLoading: boolean;
}
export interface KanbanState {
  columns: BoardColumn[];
  columnTasks: Record<number, ColumnTaskState>;
  searchTerm: string;
  draggingTaskId: number | null;
}

// ─── Drag Types ───────────────────────────────────────────────────────────────
export interface DragResult {
  taskId: number;
  sourceColumnId: number;
  destinationColumnId: number;
  sourceIndex: number;
  destinationIndex: number;
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface TaskKanbanModalProps {
  show: boolean;
  onHide: () => void;
  boardType?: BoardType;
  onTaskClick?: (task: Task) => void;
  // Feature 3 & 4: inject Add/Edit modals from parent app
  renderAddTaskModal?: (props: {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;
  renderEditTaskModal?: (props: {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
    taskItem: ITaskView;
  }) => React.ReactNode;
  canAdd?: boolean;
  supportTicketFlag?: number | null;
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
  // support-ticket only — pass only when allowed, presence = shown
  onChangeExternalStatus?: (task: Task) => void;
  onConvertToTask?: (task: Task) => void;
  filterParams?: FilterParams;
  hasActiveFilter?: boolean;
  onOpenFilter?: () => void;
}

export interface KanbanBoardProps {
  columns: BoardColumn[];
  boardType: BoardType;
  searchTerm: string;
  onTaskClick?: (task: Task) => void;
}
export interface KanbanColumnProps {
  column: BoardColumn;
  boardType: BoardType;
  searchTerm: string;
  filterParams?: FilterParams | null;
  onTaskClick?: (task: Task) => void;
}
export interface TaskCardProps {
  task: Task;
  index: number;
  onClick?: (task: Task) => void;
}
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// ─── Auto Refresh Config ──────────────────────────────────────────────────────
export interface AutoRefreshConfig {
  TASK_AUTO_REFRESH_ON: "true" | "false";
  TASK_AUTO_REFRESH_TIMEOUT: string;
}

// ─── Board Mapper Config ──────────────────────────────────────────────────────
export interface BoardConfig {
  apiEndpoint: string;
  apiPayload: Record<string, unknown>;
  columnIdField: keyof Task;
  updateEndpoint: string;
  updatePayloadBuilder: (
    taskId: number,
    columnId: number,
  ) => Record<string, unknown>;
}
