import { toast } from 'react-toastify';
import { checkDuplication, checkDuplicationUpdate } from '../../../../../common/SharedFunction';
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../../../../helpers/AppConstants';
import { TReactSetState } from '../../../../../helpers/AppType';
import { axiosInstance } from '../../../../../services/axiosInstance';

export interface IHolidayView {
    id: number;
    holiday_date: string;
    holiday_remark: string;
    created_date_time?: string;
}

export interface IHolidayCreate {
    holiday_date: string;
    holiday_remark: string;
    created_date_time?: string;
}

export const fetchHolidayApi = async (
    setHolidayList: TReactSetState<IHolidayView[]>,
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
            "get-holiday",
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
                if (!append) setHolidayList([]);
                return false;
            }
            const newItems: IHolidayView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setHolidayList((prev) => [...prev, ...newItems]);
            } else {
                setHolidayList(newItems);
            }
            return newItems.length === limit;
        }
        return false;
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

export const createHoliday = async (
    holidayData: IHolidayCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
    if (
        !(await checkDuplication(
            holidayData.holiday_date,
            "holidays",
            "holiday_date"
        ))
    ) {
        const getUUID = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const requestData = {
            a_application_login_id: getUUID,
            holiday_date: holidayData.holiday_date,
            holiday_remark: holidayData.holiday_remark
        };
        try {
            const { data } = await axiosInstance.post(
                "add-holiday",
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
    } else {
        toast.error("Holiday already available");
    }
};

export const updateHoliday = async (
    holidayData: IHolidayCreate,
    editHolidayId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //

) => {
    if (
        !(await checkDuplicationUpdate(
            holidayData.holiday_date,
            "holidays",
            "holiday_date",
            editHolidayId
        ))
    ) {
        const getUUID = localStorage.getItem("UUID");

        const requestData = {
            a_application_login_id: getUUID,
            holiday_date: holidayData.holiday_date,
            holiday_remark: holidayData.holiday_remark,
            id: editHolidayId
        };
        try {
            const { data } = await axiosInstance.post("update-holiday", requestData);
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
        toast.error("Holiday already available");
    }
};

export const deleteHoliday = async (
    deleteHolidayIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = localStorage.getItem("UUID");
    console.log(deleteHolidayIds)

    const requestData = {
        table: "holidays",
        where: `{"id":"${deleteHolidayIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(
                deleteHolidayIds.length > 1
                    ? "Holidays Deleted Successfully"
                    : "Holiday Deleted Successfully"
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