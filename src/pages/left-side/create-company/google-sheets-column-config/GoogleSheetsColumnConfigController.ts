import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export const getConfiguredGoogleSheetsColumnList = async (type: string | number | null | undefined) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    if (!getUUID || !token) {
        toast.error("Authentication details are missing");
        return;
    }

    if (!type) {
        toast.error("Something went wrong!!!");
        return;
    }

    const requestData = {
        a_application_login_id: getUUID,
        type: type
    };

    try {
        const response = await axiosInstance.post("get-google-sheet-columns", requestData);

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            return response.data.data;
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);

    }
};

export const updateConfiguredGoogleSheetsColumnList = async (type: string | number | undefined, dataList: object, fetchData: () => void) => {
    try {
        if (!type || !dataList) {
            return false;
        }
        const getUUID = await localStorage.getItem("UUID");
        const token = await localStorage.getItem("token");

        const requestData = {
            columnsObject: dataList,
            a_application_login_id: getUUID,
            type: type
        };

        const { data } = await axiosInstance.post(
            "update-google-sheet-columns",
            requestData
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(data.ack_msg);
            fetchData();
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
}