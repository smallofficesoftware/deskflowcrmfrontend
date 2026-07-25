import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IProductUnitReport {
    unit: string;
    id: number;
    is_point_value_allow: "1" | "0" | ""; // New field: 1 = Yes, 0 = No
    created_date_time?: string;
}

export const fetchUnitForReports = async (
    setUnitList: TReactSetState<IProductUnitReport[]>,
    setLoading: TReactSetState<boolean>,
) => {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
        table: "product_unit_masters",
        columns: "id,unit,is_point_value_allow", // Updated column
        where: ["isDelete=0"],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id: getUUID
    };

    try {
        setLoading(true);
        const response = await axiosInstance.post("commonGet", requestData);

        if (response.status === 200 && response.data?.data) {
            const units: IProductUnitReport[] = response.data.data.map((item: any) => ({
                id: item.id,
                unit: item.unit,
                is_point_value_allow: item.is_point_value_allow || "0", // Default to "0" if null/undefined
                created_date_time: item.created_date_time
            }));
            setUnitList(units);
        } else {
            setUnitList([]);
            if (response.data?.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                toast.error(response.data?.ack_msg || "Failed to fetch units");
            }
        }

    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setUnitList([]);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};

export const handleDeleteUnit = async (
    deleteUnitId: number,
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    const requestData = {
        a_application_login_id: getUUID,
        unit_id: deleteUnitId
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("unitDelete", requestData);
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