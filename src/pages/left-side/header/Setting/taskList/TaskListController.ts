import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TFilterDate } from "../../../../../helpers/AppInterface";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

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
  assigned_team_member_names?: any;
  selected_days_names?: any;
  status?: number;
  status_name?: string;
  status_colour?: string;
  external_status?: number;
  external_status_name?: string;
  external_status_color?: string;
  external_status_colour?: string;
  priority_name?: string;
  type_name?: string;
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
  task_attechment?: string;
  is_notification_sand_email?: number;
  is_notification_sand_wp?: number;
  reference_contact?: number | string;
  team_task_assignement_type?: string | number;
  is_auto_create?: string | number;
  label_name: string;
  label_color: string;
  label_id: any;
  customForm?: any[];
  column_number_1: number | string;
  column_number_2: number | string;
  column_number_3: number | string;
  column_number_4: number | string;
  column_number_5: number | string;
  column_text_1: string;
  column_text_2: string;
  column_text_3: string;
  column_text_4: string;
  column_text_5: string;
  column_text_area_1: string;
  column_text_area_2: string;
  column_text_area_3: string;
  column_text_area_4: string;
  column_text_area_5: string;
  column_date_1: string;
  column_date_2: string;
  column_date_3: string;
  column_date_4: string;
  column_date_5: string;
  column_date_and_time_1: string;
  column_date_and_time_2: string;
  column_date_and_time_3: string;
  column_date_and_time_4: string;
  column_date_and_time_5: string;
  column_time_1: any;
  column_time_2: any;
  column_time_3: any;
  column_time_4: any;
  column_time_5: any;
  column_switch_1: number | boolean;
  column_switch_2: number | boolean;
  column_switch_3: number | boolean;
  column_switch_4: number | boolean;
  column_switch_5: number | boolean;
  column_decimal_1: number | string;
  column_decimal_2: number | string;
  column_decimal_3: number | string;
  column_decimal_4: number | string;
  column_decimal_5: number | string;
  column_dropdown_1: string;
  column_dropdown_2: string;
  column_dropdown_3: string;
  column_dropdown_4: string;
  column_dropdown_5: string;
  column_radio_1: string;
  column_radio_2: string;
  column_radio_3: string;
  column_radio_4: string;
  column_radio_5: string;
  task_column_number_1: number | string;
  task_column_number_2: number | string;
  task_column_number_3: number | string;
  task_column_number_4: number | string;
  task_column_number_5: number | string;
  task_column_text_1: string;
  task_column_text_2: string;
  task_column_text_3: string;
  task_column_text_4: string;
  task_column_text_5: string;
  task_column_text_area_1: string;
  task_column_text_area_2: string;
  task_column_text_area_3: string;
  task_column_text_area_4: string;
  task_column_text_area_5: string;
  task_column_date_1: string;
  task_column_date_2: string;
  task_column_date_3: string;
  task_column_date_4: string;
  task_column_date_5: string;
  task_column_date_and_time_1: string;
  task_column_date_and_time_2: string;
  task_column_date_and_time_3: string;
  task_column_date_and_time_4: string;
  task_column_date_and_time_5: string;
  task_column_time_1: string;
  task_column_time_2: string;
  task_column_time_3: string;
  task_column_time_4: string;
  task_column_time_5: string;
  task_column_switch_1: number | boolean;
  task_column_switch_2: number | boolean;
  task_column_switch_3: number | boolean;
  task_column_switch_4: number | boolean;
  task_column_switch_5: number | boolean;
  task_column_decimal_1: number | string;
  task_column_decimal_2: number | string;
  task_column_decimal_3: number | string;
  task_column_decimal_4: number | string;
  task_column_decimal_5: number | string;
  task_column_dropdown_1: string;
  task_column_dropdown_2: string;
  task_column_dropdown_3: string;
  task_column_dropdown_4: string;
  task_column_dropdown_5: string;
  task_column_radio_1: string;
  task_column_radio_2: string;
  task_column_radio_3: string;
  task_column_radio_4: string;
  task_column_radio_5: string;
  task_column_attechments_1?: File | string | null;
  task_column_attechments_2?: File | string | null;
  task_column_attechments_3?: File | string | null;
  task_column_attechments_4?: File | string | null;
  task_column_attechments_5?: File | string | null;
}

export interface IStageStatus {
  id: number;
  name: string;
  color: string;
}
export interface ILabel {
  id: number;
  lable_name: string;
  color: string;
}
export interface ITaskCategory {
  id: number;
  task_category_name: string;
  task_color: string;
}

export const fetchApiTask = async (
  setTargetVsIncentiveList: (items: ITaskView[]) => void,
  setLoading: Dispatch<SetStateAction<boolean>>,
  term?: string,
  ownerFilter?: number,
  setSelectedDue?: number,
  setSelectedUnread?: number,
  statusFilter?: number | null | string,
  taskCategoryFilter?: number | null,
  page: number = 0,
  itemsPerPage: number = 50,
  priorityFilter?: number | null,
  startSearchDate?: TFilterDate,
  endSearchDate?: TFilterDate,
  checkedOptionsStageStatus?: any,
  assignedByMultiTeamMember?: any,
  createdByMultiTeamMember?: any,
  setTaskId?: TReactSetState<number | undefined>,
  apicallCount?: number,
  checkedOptionsTaskassignOrNot?: any,
  setTaskAutoRefreshON?: any,
  setTaskAutoRefreshTimeout?: any,
  setTaskAutoRefreshInactivityDelay?: any,
  setTaskCountGet?: any,
  setUnreadCount?: any,
  is_archived?: number | string,
  checkedOptionsTaskType?: any,
  checkedOptionsShowTemplateTask?: any,
  supportTicketFlag?: any,
  setTaskCountGetAll?: any,
  setTaskCountGetMy?: any,
  selectedLabelId?: number | null | string,
  contact_masters_id?: number | null,
  checkedOptionsLabel?: any,
  labelwiseContactShowAndOrNot?: number,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  const start: number = page * itemsPerPage;
  setLoading(true);

  const requestData = {
    a_application_login_id: getUUID,
    searchTerm: term,
    taskFilter: ownerFilter,
    dueFilter: setSelectedDue,
    isUnread: setSelectedUnread,
    statusFilter: statusFilter,
    taskCategoryFilter: taskCategoryFilter,
    priorityFilter: priorityFilter,
    startDate: startSearchDate,
    endDate: endSearchDate,
    statusFilterComan: checkedOptionsStageStatus,
    assignedByMultiTeamMember: assignedByMultiTeamMember,
    createdByMultiTeamMember: createdByMultiTeamMember,
    ul: start,
    ll: itemsPerPage,
    apicallCount: apicallCount,
    checkedOptionsTaskassignOrNot: checkedOptionsTaskassignOrNot,
    is_archived: is_archived,
    task_types: checkedOptionsTaskType,
    is_show_template_task: checkedOptionsShowTemplateTask,
    supportTicketFlag,
    selectedLabelId,
    contact_masters_id,
    labelFilter: checkedOptionsLabel,
    labelwiseContactShowAndOrNot: labelwiseContactShowAndOrNot || 0,
  };

  try {
    const data = await axiosInstance.post("get-task", requestData);

    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setTargetVsIncentiveList([]); // empty list
        setTaskId?.(data.data.data?.item?.id);

      } else {
        const items: ITaskView[] = data.data.data.item || [];
        if (page == 0) {
          setTaskId?.(data.data.data.item[0]?.id);
        }

        setTargetVsIncentiveList(items); // always array only
        const TaskCountGet = data.data.data.due_count;
        const TaskCountGetAll = data.data.data.all_count;
        const TaskCountGetMy = data.data.data.my_count;
        const UnreadCount = data.data.data.unread_count;
        if (setTaskAutoRefreshON) {
          setTaskCountGet(TaskCountGet);
          setTaskCountGetAll(TaskCountGetAll);
          setTaskCountGetMy(TaskCountGetMy);
          setUnreadCount(UnreadCount);
        }
        if (setTaskAutoRefreshON) {
          setTaskAutoRefreshON(data.data.data?.TASK_AUTO_REFRESH_ON);
        }
        if (setTaskAutoRefreshTimeout) {
          setTaskAutoRefreshTimeout(data.data.data.TASK_AUTO_REFRESH_TIMEOUT);
        }
        if (setTaskAutoRefreshInactivityDelay) {
          setTaskAutoRefreshInactivityDelay(
            data.data.data.TASK_AUTO_REFRESH_INACTIVITY_DELAY,
          );
        }
      }
    }
  } catch (error: any) {
    setTargetVsIncentiveList([]);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const deleteTaskApi = async (TaskId: number | number[] | undefined) => {
  const requestData = {
    TaskId,
  };
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  try {
    const data = await axiosInstance.post("deleteTask", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.data.ack_msg);
      return true;
    } else {
      toast.error(data.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const complateTaskApi = async (
  TaskId: number | number[] | undefined,
) => {
  const requestDataMsg = {
    table: "task_managements",
    where: `{"id":${TaskId}}`,
    data: `{"status":"-6"}`,
  };

  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  try {
    const data = await axiosInstance.post("commonUpdate", requestDataMsg);

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.data.ack_msg); // SUCCESS MESSAGE SHOULD BE HERE
      return true;
    } else {
      toast.error(data.data.ack_msg); // ERROR MESSAGE IF NOT SUCCESS
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const fetchStageStatusContact = async (
  setStageStatusList: TReactSetState<IStageStatus[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: "8",
    a_application_login_id: getUUID,
    action_flag: "view",
  };
  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setStageStatusList([]);
    } else {
      setStageStatusList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const fetchLabel = async (setLabelList: TReactSetState<ILabel[]>) => {
  const requestData = {
    table: "lable_masters",
    columns: "id,lable_name,color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLabelList([]);
    } else {
      setLabelList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const fetchTaskCategoryForTask = async (
  settaskCategoryList: TReactSetState<ITaskCategory[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "task_categories",
    columns: "id,task_category_name,task_color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      settaskCategoryList([]);
    } else {
      settaskCategoryList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateStageStatusRadioButton = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "task_managements",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      status: selectedOptions,
    }),
  };
  setLoading(true);
  const getUUID = await localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("status Apply successfully");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        toast.success("status Apply Failed");
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};
export const updateStageStatusRadioButtonCustomer = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "task_managements",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      external_status: selectedOptions,
    }),
  };
  setLoading(true);
  const getUUID = await localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("status Apply successfully");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        toast.success("status Apply Failed");
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const archiveTaskApi = async (TaskId: number | number[] | undefined) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    TaskId,
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("archiveTask", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // toast.success(data.data.ack_msg);
      return true;
    } else {
      toast.error(data.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const unarchiveTaskApi = async (
  TaskId: number | number[] | undefined,
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    TaskId,
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("unarchive-Task", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // toast.success(data.data.ack_msg);
      return true;
    } else {
      toast.error(data.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const CovertSupportTikcetToTaskApi = async (
  TaskId: number | number[] | undefined,
) => {
  const requestData = {
    TaskId,
  };
  try {
    const data = await axiosInstance.post(
      "covert-supportticket-task",
      requestData,
    );
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // toast.success(data.data.ack_msg);
      return true;
    } else {
      toast.error(data.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateBulkSelectionActionPerformInTask = async (
  setLoading: TReactSetState<boolean>,
  appliedFilers: any,
  updateCollection: string | number,        // "0" = read, "1" = unread
  appliedTo: number | string | number[] | "all",
  // type?: string   // you can remove this if not needed
) => {
  try {
    setLoading(true);
    const getUUID = localStorage.getItem("UUID");

    const { data } = await axiosInstance.post("readunread-task", {
      appliedFilers,
      updateCollection,
      appliedTo,
      a_application_login_id: getUUID,
    });

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      toast.error(data.ack_msg || "Failed to update");
      return false;
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setLoading(false);
  }
};
