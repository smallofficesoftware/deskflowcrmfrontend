import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IPaymentTypeWiseAccount {
    id: number;
    payment_type_name: string;
    payment_color: string | undefined;
    credit_amount: number;
    debit_amount: number;
}

export const fetchPaymentTypeAccountList = async (
    setPaymentTypeAccountList: TReactSetState<IPaymentTypeWiseAccount[]>,
    setLoading: TReactSetState<boolean>,
    selectedDates: Date[] | undefined,
) => {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
        a_application_login_id: getUUID,
        selectedDates
    };
    try {
        const data = await axiosInstance.post("/get-payment-type-wise-account", requestData);

        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                setPaymentTypeAccountList([]);
            }
            setLoading(true)
            setPaymentTypeAccountList(data.data.data.item);
        }

    } catch (error: any) {

        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};