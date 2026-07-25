import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../../../helpers/AppConstants";
import { IOption } from "../../../../../../../helpers/AppInterface";
import { axiosInstance } from "../../../../../../../services/axiosInstance";

export const createItemList = async (
    selectedItem: SingleValue<IOption>,
    selectedUnitId: any,
    qty: string,
    remark: string,
    type: "cons" | "reject",
    master_product_id: number,
    bomId: number,
    processId: number,
    reuse: "yes" | "no"
) => {

    if (master_product_id === selectedItem?.value) {
        toast.error("Item should not be same as Product BOM");
        return false;
    }

    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const numericType = type === "cons" ? 1 : 2;
    const message = type === "cons" ? "Consumption" : "Rejection";
    const is_reusable = reuse === "yes" ? 1 : 0;


    const payload = {
        remark,
        qty,
        type: numericType,
        master_product_id,
        a_application_login_id,
        bom_id: bomId,
        process_id: processId,
        item_id: selectedItem?.value,
        unit: selectedUnitId,
        reuse: type === "reject" ? is_reusable : 0
    }

    try {
        const response = await axiosInstance.post(
            "create-item-list",
            payload,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": a_application_login_id,
                },
            }
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(`${message} Created Successfully`);
            return true;
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            return false;
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
        return false;
    }
};

export const getItemList = async (
    setConsumptionList: (data: any) => void,
    setRejectionList: (data: any) => void,
    master_product_id: number,
    processId: number
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        master_product_id,
        process_id: processId
    };

    try {
        const response = await axiosInstance.post(
            "get-item-list",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {

            const items = response.data.data?.item;

            const consItem = items.filter((item: any) => {
                if (item.type === 1) return item;
            })

            const rejectItem = items.filter((item: any) => {
                if (item.type === 2) return item;
            })

            setConsumptionList(consItem);
            setRejectionList(rejectItem);
        } else {
            setConsumptionList([]);
            setRejectionList([]);
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    }
};

export const handleDelete = async (
    itemId: any,
    setRecallGetItemOnDelete: any,
    setIsDeleteConfirmation: any
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        id: itemId
    };

    try {
        const response = await axiosInstance.post(
            "delete-item-list",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success("Item Deleted Successfully");
            setRecallGetItemOnDelete(true);
            return false;
        } else {
            setIsDeleteConfirmation(false);
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            setRecallGetItemOnDelete(false);
            return false;
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    }
}