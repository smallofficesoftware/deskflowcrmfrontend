import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ILeaveTypeView {
    leave_type: string;
    id: number;
    color: string | undefined;
    paid_by: number;
    created_date_time?: string;
}

export interface ILeaveTypeCreate {
    leave_type: string;
    color: string | undefined | null;
    created_date_time?: string;
    paid_by: number;
}
export const handleDeleteLeaveType = async (
    leaveTypeIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLeaveTypeList: TReactSetState<ILeaveTypeView[]>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        table: "leave_type_masters",
        where: `{"id":"${leaveTypeIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };
    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            await fetchLeaveTypeApi(setLeaveTypeList, setLoading);
            toast.success(
                leaveTypeIds.length > 1
                    ? "Leave Types Deleted Successfully"
                    : "Leave Type Deleted Successfully"
            );
        } else {
            toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setLoading(false);
    }
};

export const createLeaveType = async (
    leaveTypeInput: ILeaveTypeCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
    if (
        !(await checkDuplication(
            leaveTypeInput.leave_type,
            "leave_type_masters",
            "leave_type"
        ))
    ) {
        const getUUID = await localStorage.getItem("UUID");
        const requestData = {
            table: "leave_type_masters",
            data: `{"leave_type":"${leaveTypeInput.leave_type}","color":"${leaveTypeInput.color
                }","paid_by":"${leaveTypeInput.paid_by
                }","a_application_login_id":${Number(getUUID)}}`,
            a_application_login_id: getUUID

        };
        try {
            const { data } = await axiosInstance.post("commonCreate", requestData
            );
            if (data.code === 200) {
                if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                    // setLoading(true)
                    toast.success(data.ack_msg);
                    clearFormCallback();
                } else {
                    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                }
            }
        } catch (error: any) {
            toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } else {
        toast.error("Leave Type already available");
    }
};

export const updateLeaveType = async (
    leaveTypeInput: ILeaveTypeCreate,
    editLeaveTypeId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //

) => {
    if (
        !(await checkDuplicationUpdate(
            leaveTypeInput.leave_type,
            "leave_type_masters",
            "leave_type",
            editLeaveTypeId
        ))
    ) {
        const getUUID = await localStorage.getItem("UUID");
        const requestData = {
            table: "leave_type_masters",
            where: `{"id":"${editLeaveTypeId}"}`,
            data: `{"leave_type":"${leaveTypeInput.leave_type}","color":"${leaveTypeInput.color
                }","paid_by":"${leaveTypeInput.paid_by
                }","a_application_login_id":${Number(getUUID)}}`,
            a_application_login_id: getUUID

        };
        try {
            const { data } = await axiosInstance.post("commonUpdate", requestData
            );
            if (data.code === 200) {
                if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                    clearFormCallback()
                    toast.success(data.ack_msg);
                } else {
                    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                }
            }
        } catch (error: any) {
            toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } else {
        toast.error("Leave Type already available");
    }
};

export const fetchLeaveTypeApi = async (
    setLeaveTypeList: TReactSetState<ILeaveTypeView[]>,
    setLoading: TReactSetState<boolean>,
) => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        table: "leave_type_masters",
        columns: "id,leave_type,color,paid_by",
        where: ["isDelete=0"],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id: getUUID
    };
    try {
        const data = await axiosInstance.post("commonGet", requestData
        );
        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                setLeaveTypeList([]);
            }
            setLoading(true)
            setLeaveTypeList(data.data.data);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};