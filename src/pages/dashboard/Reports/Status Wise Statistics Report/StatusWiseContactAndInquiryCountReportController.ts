import { toast } from "react-toastify";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";

export interface IStatusWiseContactCountReport {
    status_name: string;
    contactCount: string;
    inquiryCount: string;
}

export const fetchStatusWise = async (
    setStatusWiseReport: TReactSetState<IStatusWiseContactCountReport[]>,
    selectedDates: Date[] | undefined,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    selectedStatus?: string[] | null,
    ul?: number,  // Add this
    ll?: number,
) => {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    const requestedData = {
        selected_dates: selectedDates,
        a_application_login_id: getUUID,
        selectedStatus: selectedStatus,
        ul: ul || 0,
        ll: ll || 50,
    };

    try {
        const response = await axiosInstance.post(
            "/getStatusWiseContactAndInquiryCountReport",
            requestedData
        );


        if (response.data.ack == 3) {
            toast.error(response.data.ack_msg)
        }
        setStatusWiseReport(response.data.data.item);
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
};



export const fetchStatusWiseForExport = async (
    selectedDates: Date[] | undefined,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    selectedStatus?: string[] | null,
    offset = 0,
    limit = 50
): Promise<IStatusWiseContactCountReport[]> => {
    const getUUID = getID || localStorage.getItem("UUID");

    const payload = {
        selected_dates: selectedDates,
        a_application_login_id: getUUID,
        selectedStatus: selectedStatus,
        ul: offset,
        ll: limit,
    };

    const response = await axiosInstance.post(
        "/getStatusWiseContactAndInquiryCountReport",
        payload
    );

    if (response?.data?.ack === 3) {
        toast.error(response.data.ack_msg);
        return [];
    }

    return Array.isArray(response?.data?.data?.item)
        ? response.data.data.item
        : [];
};


export const exportStatusWise = async (
    fetchFn: (offset: number, limit: number) => Promise<IStatusWiseContactCountReport[]>,
    limit = 50
): Promise<IStatusWiseContactCountReport[]> => {
    let offset = 0;
    let allData: IStatusWiseContactCountReport[] = [];

    while (true) {
        const chunk = await fetchFn(offset, limit);

        if (!chunk.length) break;

        allData = allData.concat(chunk);
        offset += chunk.length;

        if (chunk.length < limit) break;
    }

    return allData;
};