import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IAdjustmentView {
    id: number;
    description: string;
    date: string;
    adjustment_date: string;
    employee_id: number;
    employee_name: string;
    type_of_holiday: number;
    created_date_time?: string;
}

export interface IAdjustmentCreate {
    description: string;
    date: string;
    adjustment_date: string;
    employee_ids: number[] | number;
    type_of_holiday: number;
    created_date_time?: string;
}

export const holidayOptions = [
    { value: 1, label: "Holiday" },
    { value: 2, label: "Week Off" },
    { value: 3, label: "Normal Day" },
];

export const fetchAdjustmentApi = async (
    setAdjustmentList: TReactSetState<IAdjustmentView[]>,
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
            "get-day-adjustments",
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
                if (!append) setAdjustmentList([]);
                return false;
            }
            const newItems: IAdjustmentView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setAdjustmentList((prev) => [...prev, ...newItems]);
            } else {
                setAdjustmentList(newItems);
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

export const addAdjustment = async (
    adjustmentData: IAdjustmentCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        description: adjustmentData.description,
        date: adjustmentData.date,
        adjustment_date: adjustmentData.adjustment_date,
        employee_ids: adjustmentData.employee_ids,
        type_of_holiday: adjustmentData.type_of_holiday,
    };

    try {
        const { data } = await axiosInstance.post(
            "add-adjustment",
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

export const updateAdjustment = async (
    adjustmentData: IAdjustmentCreate,
    editAdjustmentId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //

) => {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        a_application_login_id: getUUID,
        description: adjustmentData.description,
        date: adjustmentData.date,
        adjustment_date: adjustmentData.adjustment_date,
        employee_ids: adjustmentData.employee_ids,
        type_of_holiday: adjustmentData.type_of_holiday,
        id: editAdjustmentId
    };
    try {
        const { data } = await axiosInstance.post("update-adjustment", requestData);
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
};

export const deleteAdjustment = async (
    deleteAdjustmentIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        table: "day_conversions",
        where: `{"id":"${deleteAdjustmentIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(
                deleteAdjustmentIds.length > 1
                    ? "Adjustments Deleted Successfully"
                    : "Adjustment Deleted Successfully"
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