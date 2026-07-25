import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IAdjustmentTypeView {
    id: number;
    method: number;
    mode: number;
    name: string;
    knowledge_info: string;
}

export interface IAdjustmentTypeCreate {
    method: number;
    mode: number;
    name: string;
    knowledge_info: string;
}

export const METHOD_TYPES = [
    { id: 1, name: "Amount" },
    { id: 2, name: "Hours" },
];

export const MODE_TYPES = [
    { id: 1, name: "Credit" },
    { id: 2, name: "Debit" },
];

export const fetchAdjustmentTypeApi = async (
    setAdjustmentTypeList: TReactSetState<IAdjustmentTypeView[]>,
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
            "get-adjustment-type",
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
                if (!append) setAdjustmentTypeList([]);
                return false;
            }
            const newItems: IAdjustmentTypeView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setAdjustmentTypeList((prev) => [...prev, ...newItems]);
            } else {
                setAdjustmentTypeList(newItems);
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

export const createAdjustmentType = async (
    adjustmentTypeData: IAdjustmentTypeCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        method: adjustmentTypeData.method,
        mode: adjustmentTypeData.mode,
        name: adjustmentTypeData.name,
        knowledge_info: adjustmentTypeData.knowledge_info,
    };
    try {
        const { data } = await axiosInstance.post(
            "add-adjustment-type",
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

export const updateAdjustmentType = async (
    adjustmentTypeData: IAdjustmentTypeCreate,
    editAdjustmentTypeId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //

) => {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        a_application_login_id: getUUID,
        method: adjustmentTypeData.method,
        mode: adjustmentTypeData.mode,
        name: adjustmentTypeData.name,
        knowledge_info: adjustmentTypeData.knowledge_info,
        id: editAdjustmentTypeId
    };
    try {
        const { data } = await axiosInstance.post("update-adjustment-type", requestData);
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

export const deleteAdjustmentType = async (
    deleteAdjustmentTypeIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        table: "adjustment_types",
        where: `{"id":"${deleteAdjustmentTypeIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(
                deleteAdjustmentTypeIds.length > 1
                    ? "Adjustment Types Deleted Successfully"
                    : "Adjustment Type Deleted Successfully"
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