import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IRoundOffView {
    id: number;
    minutes: number;
    conversion_minutes: number;
}

export interface IRoundOffCreate {
    minutes: number;
    conversion_minutes: number;
}

export const fetchRoundOffApi = async (
    setRoundOffList: TReactSetState<IRoundOffView[]>,
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
            "get-round-off",
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
                if (!append) setRoundOffList([]);
                return false;
            }
            const newItems: IRoundOffView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setRoundOffList((prev) => [...prev, ...newItems]);
            } else {
                setRoundOffList(newItems);
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

export const updateRoundOff = async (
    roundOffData: IRoundOffView,
    setLoading: TReactSetState<boolean>,
) => {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        a_application_login_id: getUUID,
        minutes: roundOffData.minutes,
        conversion_minutes: roundOffData.conversion_minutes,
        id: roundOffData.id,
    };
    try {
        const { data } = await axiosInstance.post("update-round-off", requestData);
        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                toast.success(data.ack_msg);
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
};