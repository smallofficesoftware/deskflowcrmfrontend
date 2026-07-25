import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ILeaveView } from "../../../left-side/header/Setting/leave/LeaveController";

export const fetchLeaveReportApi = async (
    setLeaveList: TReactSetState<ILeaveView[]>,
    setLoading: TReactSetState<boolean>,
    term: string,
    team_id?: number,
) => {
    const token = await localStorage.getItem("token");

    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        a_application_login_id: getUUID,
        searchTerm: term,
        checked_id: getUUID,
        request_flag: 1
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