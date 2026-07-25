import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IStatusCount {
    P: number;
    HD: number;
    A: number;
    L: number;
    WO: number;
    PH: number;
    WOWO: number;
    WOPH: number;
}

export interface IProcessAttendance {
    employee_name: string;
    total_working_time_sum: string;
    net_working_hour_sum: string;
    overtime_hour_sum: string;
    status_count: IStatusCount;
    presentDates: [
        {
            id: number,
            date: string,
            employee_id: number,
            search_string: string,
            last_updated_date: string,
            day_status: number,
            total_working_time: string,
            net_working_hour: string,
            overtime_hour: string,
            early_out: string,
            late_in: string,
            first_in: string,
            last_out: string,
            attenance_entry_list: string;
        }
    ]
}

export const DAY_STATUS: Record<number, string> = {
    1: "P",
    2: "HD",
    3: "A",
    4: "L",
    5: "WO",
    6: "PH",
    7: "WOWO", // Work On Week Off
    8: "WOPH", // Work On Public Holiday
};

export const fetchProcessAttendance = async (
    selectedTeamMembers: string[] | null,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    selectedDayMonthYear?: number[] | null,
): Promise<IProcessAttendance[]> => {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    const requestedData = {
        request_flag: 2,
        a_application_login_id: getUUID,
        selectedTeamMembers: selectedTeamMembers,
        selectedDayMonthYear
    }

    try {
        const response = await axiosInstance.post("/get-process-attendance", requestedData);

        if (response.data.ack === 3) {
            toast.error(response.data.ack_msg || "Permission denied");
            return []; // Important: return empty array
        }

        // Make sure this path is correct based on your API response
        const items = response.data.data?.item || [];

        if (!Array.isArray(items)) {
            console.error("Expected array but got:", items);
            return [];
        }

        return items; // This is the key — return the data!
    } catch (error: any) {
        toast.error(error.message || "Failed to fetch attendance data");
        return []; // Always return array even on error
    }
};

export const fetchProcessAttendanceForExport = async (
    selectedTeamMembers: string[] | null,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    offset: number = 0,
    limit: number = 500,
    selectedDayMonthYear?: number[] | null,
): Promise<IProcessAttendance[]> => {
    const getUUID = getID || localStorage.getItem("UUID");

    const payload = {
        request_flag: 2,
        a_application_login_id: getUUID,
        selectedTeamMembers: selectedTeamMembers,
        ul: offset ?? 0,
        ll: limit ?? 500,
        selectedDayMonthYear
    };

    const response = await axiosInstance.post(
        "/get-process-attendance",
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

export const exportAllAttendanceData = async (
    fetchFn: (offset: number, limit: number) => Promise<IProcessAttendance[]>,
    limit = 50
): Promise<IProcessAttendance[]> => {
    let offset = 0;
    let allData: IProcessAttendance[] = [];

    while (true) {
        const chunk = await fetchFn(offset, limit);

        if (!chunk.length) break;

        allData = allData.concat(chunk);
        offset += chunk.length;

        if (chunk.length < limit) break;
    }

    return allData;
};