import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TFilterDate } from "../../../helpers/AppInterface";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

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
    contact_masters_id: number;
    company_masters_id?: number;
    reference_id?: number;
    stage_status_name?: string;
    stage_status_color?: string;
    reference_table?: any;
    category_name?: String;
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
                if (setTaskAutoRefreshON) {
                    setTaskCountGet(TaskCountGet);
                    setTaskCountGetAll(TaskCountGetAll);
                    setTaskCountGetMy(TaskCountGetMy);
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
        setTaskList([]);
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};