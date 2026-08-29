import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TFilterDate } from "../../../helpers/AppInterface";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { formatDateYMDV2 } from "../../../common/SharedFunction";
import { ITaskView } from "../../left-side/header/Setting/taskList/TaskListController";

export type { ITaskView };

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
    setTaskList: (items: ITaskView[]) => void,
    setLoading: Dispatch<SetStateAction<boolean>>,
    contact_masters_id: number | undefined,
    term?: string,
    ownerFilter?: number,
    setSelectedDue?: number,
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
    is_archived?: number | string,
    checkedOptionsTaskType?: any,
    checkedOptionsShowTemplateTask?: any,
    supportTicketFlag?: any,
    setTaskCountGetAll?: any,
    setTaskCountGetMy?: any,
    selectedLabelId?: number | null | string,
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
        statusFilter: statusFilter,
        taskCategoryFilter: taskCategoryFilter,
        priorityFilter: priorityFilter,
        // See TaskListController.ts's fetchApiTask for why: raw Date/DateObject
        // must be formatted to a plain local YYYY-MM-DD string before axios
        // JSON.stringifies it, or it silently shifts a day for IST/any UTC+ zone.
        startDate: startSearchDate ? formatDateYMDV2(startSearchDate) : startSearchDate,
        endDate: endSearchDate ? formatDateYMDV2(endSearchDate) : endSearchDate,
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
        contact_masters_id
    };

    try {
        const data = await axiosInstance.post("get-task", requestData);

        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setTaskList([]); // empty list
                setTaskId?.(data.data.data?.item?.id);

            } else {
                const items: ITaskView[] = data.data.data.item || [];
                if (page == 0) {
                    setTaskId?.(data.data.data.item[0]?.id);
                }

                setTaskList(items); // always array only
                const TaskCountGet = data.data.data.due_count;
                const TaskCountGetAll = data.data.data.all_count;
                const TaskCountGetMy = data.data.data.my_count;
                setTaskCountGet?.(TaskCountGet);
                setTaskCountGetAll?.(TaskCountGetAll);
                setTaskCountGetMy?.(TaskCountGetMy);
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
        setTaskList([]);
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};