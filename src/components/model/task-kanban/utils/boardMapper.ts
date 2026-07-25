import { BoardType, BoardConfig } from "../types/kanban.types";

const getLoginId = () => localStorage.getItem("UUID") ?? "2";

export const BOARD_CONFIG_MAP: Record<BoardType, BoardConfig> = {
  status: {
    apiEndpoint: "get-status",
    get apiPayload() {
      return {
        status_type: "8",
        a_application_login_id: getLoginId(),
        action_flag: "view",
      };
    },
    columnIdField: "status",
    updateEndpoint: "commonUpdate",
    updatePayloadBuilder: (taskId, columnId) => ({
      table: "task_managements",
      where: JSON.stringify({ id: taskId }),
      data: JSON.stringify({ status: columnId }),
    }),
  },
  category: {
    apiEndpoint: "get-category",
    apiPayload: { action_flag: "view" },
    columnIdField: "category_id",
    updateEndpoint: "update-task-category",
    updatePayloadBuilder: (taskId, columnId) => ({
      task_id: taskId,
      category_id: columnId,
    }),
  },
  taskType: {
    apiEndpoint: "get-task-type",
    apiPayload: { action_flag: "view" },
    columnIdField: "task_type_id",
    updateEndpoint: "update-task-type",
    updatePayloadBuilder: (taskId, columnId) => ({
      task_id: taskId,
      task_type_id: columnId,
    }),
  },
  priority: {
    apiEndpoint: "get-priority",
    apiPayload: { action_flag: "view" },
    columnIdField: "priority_id",
    updateEndpoint: "update-task-priority",
    updatePayloadBuilder: (taskId, columnId) => ({
      task_id: taskId,
      priority_id: columnId,
    }),
  },
  custom: {
    apiEndpoint: "get-custom-columns",
    apiPayload: { action_flag: "view" },
    columnIdField: "status_id",
    updateEndpoint: "update-task-custom",
    updatePayloadBuilder: (taskId, columnId) => ({
      task_id: taskId,
      column_id: columnId,
    }),
  },
};

export const getBoardConfig = (boardType: BoardType): BoardConfig => {
  return BOARD_CONFIG_MAP[boardType];
};
