import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { IPaymentTypeView } from "../../../left-side/header/Setting/payment-type/PaymentTypeController";

export const fetchPaymentTypeReport = async (
    setPaymentTypeList: TReactSetState<IPaymentTypeView[]>,
    setLoading: TReactSetState<boolean>,
) => {
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
        table: "payment_types",
        columns: "id,payment_type_name,payment_color,created_date_time",
        // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
        where: ["isDelete=0"],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id: getUUID
    };

    try {
        const data = await axiosInstance.post("commonGet", requestData);

        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                setPaymentTypeList([]);
            }
            setLoading(true)
            setPaymentTypeList(data.data.data);
        }

    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

export const handleDeletePaymentTypeFromReport = async (
    deletePaymentId: number,
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        type_id: deletePaymentId
    };

    try {
        setLoading(true);

        const data = await axiosInstance.post("paymentTypeDelete", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(data.data.ack_msg);
        } else {
            toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }

    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setLoading(false);
    }
};