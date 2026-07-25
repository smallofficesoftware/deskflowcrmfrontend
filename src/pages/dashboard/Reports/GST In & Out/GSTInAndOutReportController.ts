import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IGSTInOUT {
    id:number
    cart_number: string
    to_customer_name:string
    to_customer_id:number
    gst_amt:string
    gst_number:string
    created_date_time:string
    update_Date_time:string
}

export const fetchGSTInOutApi = async (
    setGstLists: TReactSetState<IGSTInOUT[]>,
    setLoading: TReactSetState<boolean>,
    reportType:any
) => {

    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token")
    const requestData = {
        a_application_login_id: getUUID,
        reportType
    };
    try {
        const data = await axiosInstance.post("getGstInOut", requestData);
        if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            setLoading(false)
            setGstLists([]);
        }
        setLoading(true)
        setGstLists(data.data.data);
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};