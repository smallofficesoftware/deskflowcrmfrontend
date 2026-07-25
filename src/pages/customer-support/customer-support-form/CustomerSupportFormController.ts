import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

interface TicketData {
    task_title: string;
    task_remark: string;
    task_attechment: File | null;
    task_category_id: any;
    user_name: string;
    phone_number: string;
}

export const fetchNameAndNumber = async (callback: any) => {
    const a_application_login_id = localStorage.getItem("UUID");

    const requestData = {
        table: "a_application_logins",
        columns: "username, recovery_mobile",
        where: JSON.stringify({ id: a_application_login_id, isDelete: "0" }),
    };

    try {
        const response = await axiosInstance.post("mainCommonGet", requestData);

        callback(
            response.data.data[0].username,
            response.data.data[0].recovery_mobile
        );

    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

export const createSupportTicket = async (formData: TicketData) => {

    const a_application_login_id = localStorage.getItem("UUID");

    const token = localStorage.getItem("token");
    const data = {
        a_application_login_id: a_application_login_id,
        task_title: formData.task_title,
        task_remark: formData.task_remark,
        task_attechment: formData.task_attechment,
        task_category_id: formData.task_category_id,
        user_name: formData.user_name,
        phone_number: formData.phone_number,
    }
    try {
        const response = await axiosInstance.post(
            "create-support-ticket",
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `${token}`,
                    "x-tenant-id": `${a_application_login_id}`,
                },
            }
        );
        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(response.data.ack_msg || "Ticket submitted successfully");
            return response.data;
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }

    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    }
};


export const fetchCategoryApiForProduct = async (
    setTaskCategoryList: TReactSetState<
        { id: number; task_category_name: string }[]
    >,
) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");


    const requestData = {

        a_application_login_id: Number(getUUID),
    };

    try {
        const response = await axiosInstance.post("get-supportticket-category", requestData,
            {
                headers: {
                    Authorization: `${token}`,
                },
            }
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setTaskCategoryList(response.data.data.item);
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            setTaskCategoryList([]);
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
        );
        setTaskCategoryList([]);
    }
};