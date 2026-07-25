import { toast } from "react-toastify";
import {
    DEFAULT_STATUS_CODE_SUCCESS,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ILeaveView {
    id: number;
    created_date_time?: string;
    leave_type_id: string;
    leave_type: string;
    remark: string;
    leaveId: number;
    leave_status: number;
    attachment: string;
    status_remark: string;
    a_application_login_id: any;
    companyFlag: number;
    color: string;
    created_by_username: string;
    leave_date: string;
    reporting_date: string;
    leave_duration: string;
    leave_hours: string;
    leave_minutes: string;
}

export const LeaveTypesList = [
    { id: "1", status_type: "Pending" },
    { id: "2", status_type: "Approved" },
    { id: "3", status_type: "Reject" },
];
export const handleDeleteLeave = async (
    leaveId: number | undefined,
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>,
    setLeaveList: TReactSetState<ILeaveView[]>,
    team_id?: number,
) => {
    const requestData = {
        table: "leaves",
        where: `{"id":${leaveId}}`,
        data: `{"isDelete":"1"}`,
    };
    const getUUID = localStorage.getItem("UUID")
    try {
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200) {
            if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setIsDeleteConfirmation(false);
                fetchLeaveApi(setLeaveList, setLoading, "", team_id);
            } else {
                toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
};


export const fetchLeaveApi = async (
    setLeaveList: TReactSetState<ILeaveView[]>,
    setLoading: TReactSetState<boolean>,
    term: string,
    team_id?: number,
) => {
    const token = await localStorage.getItem("token");

    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        a_application_login_id: team_id,
        searchTerm: term,
        checked_id: getUUID
    };
    try {
        const data = await axiosInstance.post("get-leave", requestData);
        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                setLeaveList([]);
            }
            setLoading(true)

            setLeaveList(data.data.data.item);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};