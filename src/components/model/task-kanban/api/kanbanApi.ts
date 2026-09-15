import { BoardColumn, Task, BoardType } from "../types/kanban.types";
import { getBoardConfig } from "../utils/boardMapper";
import { mapApiResponseToTask } from "../utils/taskMapper";
import { axiosInstance } from "../../../../services/axiosInstance";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";

// ─── Column / Board APIs ──────────────────────────────────────────────────────
// "status" board columns come from stage_status_masters (status_type=8),
// which mixes two dimensions in one list: internal workflow stages
// (visibility=0 - initiate/start/pause/complete/rejected) and the
// customer-facing ticket status (visibility=1 - e.g. "Pending for review").
// A ticket normally has both set at once, so showing every column together
// pulls the same ticket into two columns (and double-counts it) unless the
// caller picks one dimension. `visibilityFilter` narrows to just one; leave
// it undefined for the "All" (both dimensions, as before) scope.
export const fetchBoardColumns = async (
  boardType: BoardType,
  visibilityFilter?: 0 | 1,
): Promise<BoardColumn[]> => {
  const config = getBoardConfig(boardType);
  const response = await axiosInstance.post(
    config.apiEndpoint,
    config.apiPayload,
  );

  const raw = response.data;
  let data: Record<string, unknown>[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  if (visibilityFilter !== undefined) {
    data = data.filter((item) => Number(item.visibility) === visibilityFilter);
  }

  const columns: BoardColumn[] = data.map((item) => ({
    id: Number(
      item.id ?? item.status_id ?? item.category_id ?? item.task_type_id,
    ),
    name: String(item.name ?? item.status_name ?? item.category_name ?? ""),
    color: String(item.color ?? item.status_color ?? "#0d6efd"),
    display_order_type: item.display_order_type
      ? Number(item.display_order_type)
      : undefined,
    // Feature 1: column-level unread count (if API returns it on the status object)
    unread_count: item.unread_count ? Number(item.unread_count) : 0,
  }));

  return columns.sort(
    (a, b) => (a.display_order_type ?? 0) - (b.display_order_type ?? 0),
  );
};

// ─── Task APIs ────────────────────────────────────────────────────────────────
export interface GetTaskListParams {
  page: number;
  limit: number;
  search?: string;
  columnId?: number | null;
  boardType: BoardType;
  filterParams?: FilterParams | null; // Feature 5: global filter
  supportTicketFlag?: number | null; // Feature 5: global filter
  ownerFilter?: "all" | "my"; // All vs My top toggle
  statusScope?: "all" | "internal" | "external"; // Internal/External/All top toggle
}

export interface GetTaskListResponse {
  tasks: Task[];
  total: number;
  hasMore: boolean;
  unread_count?: number; // Feature 1: per-column unread from response
}

export const getTaskList = async ({
  page,
  limit,
  search = "",
  columnId = null,
  boardType,
  filterParams = null,
  supportTicketFlag = null,
  ownerFilter = "all",
  statusScope = "all",
}: GetTaskListParams): Promise<GetTaskListResponse> => {
  const filterKey = {
    status: "statusFilter",
    category: "categoryFilter",
    taskType: "taskTypeFilter",
    priority: "priorityFilter",
    custom: "columnFilter",
  }[boardType];

  // Base payload

  const offset = (page - 1) * limit;

  const payload: Record<string, unknown> = {
    searchTerm: search,
    a_application_login_id: localStorage.getItem("UUID"),
    [filterKey]: columnId,
    ul: offset,
    ll: limit,
    supportTicketFlag,
    taskFilter: ownerFilter === "my" ? 2 : 1,
    statusField:
      statusScope === "internal"
        ? "status"
        : statusScope === "external"
          ? "external_status"
          : undefined,
  };

  // Feature 5: merge active filter params into payload
  if (filterParams) {
    if (filterParams.filterData)
      Object.assign(payload, filterParams.filterData);
    if (filterParams.startSearchDate)
      payload.startSearchDate = filterParams.startSearchDate;
    if (filterParams.endSearchDate)
      payload.endSearchDate = filterParams.endSearchDate;
    if (filterParams.checkedOptionsStageStatus?.length)
      payload.checkedOptionsStageStatus =
        filterParams.checkedOptionsStageStatus;
    if (filterParams.checkedOptions?.length)
      payload.checkedOptions = filterParams.checkedOptions;
    if (filterParams.assignedByMultiTeamMember?.length)
      payload.assignedByMultiTeamMember =
        filterParams.assignedByMultiTeamMember;
    if (filterParams.createdByMultiTeamMember?.length)
      payload.createdByMultiTeamMember = filterParams.createdByMultiTeamMember;
    if (filterParams.checkedOptionsTaskassignOrNot?.length)
      payload.checkedOptionsTaskassignOrNot =
        filterParams.checkedOptionsTaskassignOrNot;
    if (filterParams.checkedOptionsTaskType?.length)
      payload.checkedOptionsTaskType = filterParams.checkedOptionsTaskType;
    if (filterParams.checkedOptionsShowTemplateTask?.length)
      payload.checkedOptionsShowTemplateTask =
        filterParams.checkedOptionsShowTemplateTask;
    if (filterParams.labelwiseContactShowAndOrNot !== undefined)
      payload.labelwiseContactShowAndOrNot =
        filterParams.labelwiseContactShowAndOrNot;
  }

  const response = await axiosInstance.post("get-task", payload);
  const inner = response.data?.data as Record<string, unknown> | undefined;

  const rawTasks: Record<string, unknown>[] = Array.isArray(inner?.item)
    ? (inner!.item as Record<string, unknown>[])
    : [];

  // all_count/my_count come back together regardless of which was asked
  // for - pick the one matching the requested owner scope, not always
  // all_count, or the column badge shows the wrong number while on "My".
  const total = Number(
    (ownerFilter === "my" ? inner?.my_count : inner?.all_count) ??
      rawTasks.length,
  );

  // Feature 1: unread_count may come per-column in the response
  const unread_count = inner?.unread_count
    ? Number(inner.unread_count)
    : undefined;

  const tasks = rawTasks.map(mapApiResponseToTask);

  return { tasks, total, hasMore: page * limit < total, unread_count };
};

// ─── Update Task Column + Position (Drag & Drop) ──────────────────────────────
// Status-board-only (the only BoardType actually used anywhere in the app —
// the other entries in BOARD_CONFIG_MAP are unexercised scaffolding).
// `field` picks which column the drag actually writes - when viewing the
// External scope the columns are external_status values, not status ones;
// writing those into `status` would corrupt the internal workflow stage.
export const updateTaskColumnAndPosition = async (
  taskId: number,
  columnId: number,
  position: number,
  field: "status" | "external_status" = "status",
): Promise<void> => {
  await axiosInstance.post("commonUpdate", {
    table: "task_managements",
    where: JSON.stringify({ id: taskId }),
    data: JSON.stringify({ [field]: columnId, position }),
  });
};

// ─── Auto Refresh Config ──────────────────────────────────────────────────────
export const fetchAutoRefreshConfig = async () => {
  try {
    /*   const payload = {
      searchTerm: "",
      a_application_login_id: localStorage.getItem("UUID"),
      statusFilter: null,
      page: 1,
      limit: 1,
    };
    const response = await axiosInstance.post("get-task", payload);
    const inner = response.data?.data ?? {}; */
    return {
      TASK_AUTO_REFRESH_ON: /* inner.TASK_AUTO_REFRESH_ON ?? */ "false",
      TASK_AUTO_REFRESH_TIMEOUT: /* inner.TASK_AUTO_REFRESH_TIMEOUT ?? */ "30s",
    };
  } catch {
    return { TASK_AUTO_REFRESH_ON: "false", TASK_AUTO_REFRESH_TIMEOUT: "30s" };
  }
};
