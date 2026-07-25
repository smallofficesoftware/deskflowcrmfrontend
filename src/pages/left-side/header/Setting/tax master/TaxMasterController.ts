import { toast } from 'react-toastify';
import { checkDuplicationUpdate } from '../../../../../common/SharedFunction';
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../../../../helpers/AppConstants';
import { TReactSetState } from '../../../../../helpers/AppType';
import { axiosInstance } from '../../../../../services/axiosInstance';

export interface ITaxView {
    id: number;
    value: string;
    name: string;
    created_date_time?: string;
}

export interface ITaxCreate {
    value: string;
    name: string;
    created_date_time?: string;
}

export const fetchTaxApi = async (
    setTaxList: TReactSetState<ITaxView[]>,
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
            "get-tax",
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
                if (!append) setTaxList([]);
                return false;
            }
            const newItems: ITaxView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setTaxList((prev) => [...prev, ...newItems]);
            } else {
                setTaxList(newItems);
            }
            return newItems.length === limit;
        }
        return false;
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};

export const createTax = async (
    taxData: ITaxCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        value: taxData.value,
        name: taxData.name
    };
    try {
        const { data } = await axiosInstance.post(
            "add-tax",
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

export const updateTax = async (
    taxData: ITaxCreate,
    editTaxId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //

) => {
    if (
        !(await checkDuplicationUpdate(
            taxData.value,
            "tax_masters",
            "value",
            editTaxId
        ))
    ) {
        const getUUID = localStorage.getItem("UUID");

        const requestData = {
            a_application_login_id: getUUID,
            value: taxData.value,
            name: taxData.name,
            id: editTaxId
        };
        try {
            const { data } = await axiosInstance.post("update-tax", requestData);
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
    } else {
        toast.error("Tax already available");
    }
};

export const deleteTax = async (
    deleteTaxIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");
    console.log(deleteTaxIds)

    const requestData = {
        table: "tax_masters",
        where: `{"id":"${deleteTaxIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(
                deleteTaxIds.length > 1
                    ? "Taxes Deleted Successfully"
                    : "Tax Deleted Successfully"
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