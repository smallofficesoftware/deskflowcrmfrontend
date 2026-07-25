import { axiosInstance } from "../../../../services/axiosInstance";

export interface IEmployeeAccountOutstanding {
    employee_name: string;
    total_outstanding_amount: string;
    outstanding_type: string;
    total_credit: string;
    total_debit: string;
}

export const fetchEmployeeAccountOutstanding = async (
    selectedDates: Date[] | undefined,
    ul: number,
    ll: number,
    globalSearch?: string,
    selectedTeamMembers?: string[] | null,
    Flag?: string
): Promise<IEmployeeAccountOutstanding[]> => {
    try {
        const getUUID = localStorage.getItem("UUID");

        const response = await axiosInstance.post(
            "/employeeAccountOutstandingReport",
            {
                selected_dates: selectedDates,
                a_application_login_id: getUUID,
                ul,
                ll,
                globalSearch,
                selectedTeamMembers,
                Flag
            }
        );

        return Array.isArray(response.data?.data)
            ? response.data.data
            : [];
    } catch {
        return [];
    }
};

export const exportAllEmployeeAccountOutstadingData = async <T>(
    fetchFn: (offset: number, limit: number) => Promise<T[]>,
    limit = 500
): Promise<T[]> => {
    let offset = 0;
    let allData: T[] = [];

    while (true) {
        const chunk = await fetchFn(offset, limit);

        if (!chunk || chunk.length === 0) break;

        allData = allData.concat(chunk);
        offset += chunk.length;

        if (chunk.length < limit) break;
    }

    return allData;
};