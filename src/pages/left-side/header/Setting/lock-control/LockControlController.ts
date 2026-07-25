import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ILockControlView {
    id: number;
    month: string;
    year: string;
    created_date_time?: string;
}

export interface ILockControlCreate {
    month: string;
    year: string;
    created_date_time?: string;
}

export const fetchLockControlApi = async (
    setLockControlList: TReactSetState<ILockControlView[]>,
    setLoading: TReactSetState<boolean>,
    limit: number = 30,
    offset: number = 0,
    append: boolean = false,
): Promise<boolean> => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        ul: offset,
        ll: limit,
    };

    try {
        const data = await axiosInstance.post(
            "get-lock-control",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                if (!append) setLockControlList([]);
                return false;
            }
            const newItems: ILockControlView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setLockControlList((prev) => [...prev, ...newItems]);
            } else {
                setLockControlList(newItems);
            }
            return newItems.length === limit;
        }
        return false;
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

export const createLockControl = async (
    lockControlData: ILockControlCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
        const getUUID = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const requestData = {
            a_application_login_id: getUUID,
            month: lockControlData.month,
            year: lockControlData.year
        };
        try {
            const { data } = await axiosInstance.post(
                "add-lock-control",
                requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                        "x-tenant-id": getUUID,
                    },
                }
            );

            if (data.code === 200) {
                if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                    toast.success(data.ack_msg);
                    clearFormCallback();
                } else {
                    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                }
            }
        } catch (error: any) {
            toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
}; 


export const deleteLockControl = async (
    deleteLockControlIds: number[],
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");
    console.log(deleteLockControlIds)

    const requestData = {
        table: "lock_controls",
        where: `{"id":"${deleteLockControlIds.join(",")}"}`,
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(
                deleteLockControlIds.length > 1
                    ? "Lock Controls Deleted Successfully"
                    : "Lock Control Deleted Successfully"
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