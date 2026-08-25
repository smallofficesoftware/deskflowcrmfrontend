import { BoardColumn, Task, BoardType } from "../types/kanban.types";
import { getBoardConfig } from "../utils/boardMapper";
import { mapApiResponseToTask } from "../utils/taskMapper";
import { axiosInstance } from "../../../../services/axiosInstance";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";

// ─── Column / Board APIs ──────────────────────────────────────────────────────
export const fetchBoardColumns = async (
  boardType: BoardType,
): Promise<BoardColumn[]> => {
  const config = getBoardConfig(boardType);
  const response = await axiosInstance.post(
    config.apiEndpoint,
    config.apiPayload,
  );

  const raw = response.data;
  const data: Record<string, unknown>[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

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

  const total = Number(inner?.all_count ?? inner?.my_count ?? rawTasks.length);

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
export const updateTaskColumnAndPosition = async (
  taskId: number,
  columnId: number,
  position: number,
): Promise<void> => {
  await axiosInstance.post("commonUpdate", {
    table: "task_managements",
    where: JSON.stringify({ id: taskId }),
    data: JSON.stringify({ status: columnId, position }),
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
