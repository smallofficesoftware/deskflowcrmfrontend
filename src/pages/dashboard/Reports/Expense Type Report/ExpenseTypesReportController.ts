import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { IExpenseTypeView } from "../../../left-side/header/Setting/expense-type/ExpenseTypeController";

export const fetchExpenseTypeApi = async (
    setExpenseTypeList: TReactSetState<IExpenseTypeView[]>,
    setLoading: TReactSetState<boolean>,
    request_flag: number = 0
) => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        a_application_login_id: getUUID,
        request_flag: request_flag,
    };
    try {
        const data = await axiosInstance.post("get-expense-type", requestData);
        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                setExpenseTypeList([]);

            }
            setLoading(true)
            setExpenseTypeList(data.data.data);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};
