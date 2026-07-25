import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";


export interface IPriceListReport {
    price_list_name: string;
    id: number;
    effective_from: any;
    created_date_time?: string;
    country_id: string;
    state_id: string;
    city_id: string;
    city_name: string;
    state_name: string;
    country_name: string;
}

export const fetchPriceListForReport = async (
    setPriceListList: TReactSetState<IPriceListReport[]>,
    setLoading: TReactSetState<boolean>
) => {
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        a_application_login_id: getUUID,
    };

    try {
        const data = await axiosInstance.post("priceListMaster", requestData);

        if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            setLoading(false);
            setPriceListList([]);

            toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        setLoading(true);
        setPriceListList(data.data.data.item);

    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

export const handleDeletePriceList = async (
    priceListId: number | undefined,
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    if (!priceListId) {
        toast.error("Invalid price list ID(s)");
        return;
    }

    const requestData = {
        priceListId: priceListId,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("delete-pricelist", requestData);

        if (data.data.code === 200) {
            setIsDeleteConfirmation(false);
            toast.success("Price List deleted successfully");
        } else {
            toast.error(data.data.ack_msg || "Unknown error occurred");
        }
    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || "Unknown error occurred");
    } finally {
        setLoading(false);
    }
};