import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IEmployeeAccountTransaction {
    id: number;
    acc_series: number;
    team_id: number;
    a_application_login_id: number;
    company_masters_id: number;
    type: number;
    mode: number;
    amount: number;
    payment_date_time: string;
    remark: string;
    approve_by_a_application_login_id: number;
    approve_date_time: string;
    created_date_time: string;
    s_timestemp: string;
    isDelete: number;
    isActive: number;
    typeItem: string;
    modeItem: string;
    approved_name?: string;
    created_name?: string;
    username?: string;
    recovery_mobile?: string;
    amountwithcurrency: string;
    amountwithoutcurrency: string;
}

export const fetchEmployeeAccountTransactions = async (
    selectedDates: Date[] | undefined,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    selectedTeamMembers?: string[] | null,
    offset: number = 0,
    limit: number = 50,
    setCurrencyName?: any,
): Promise<IEmployeeAccountTransaction[]> => {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    const requestedData = {
        selected_dates: selectedDates,
        a_application_login_id: getUUID,
        selectedTeamMembers: selectedTeamMembers,
        ul: offset ?? 0,
        ll: limit ?? 50,
    };

    try {
        const response = await axiosInstance.post("/employeeAccountTranctionsReport", requestedData);

        if (response.data.ack === 3) {
            toast.error(response.data.ack_msg || "Permission denied");
            return []; // Important: return empty array
        }

        // Make sure this path is correct based on your API response
        const items = response.data.data.data || [];
        const getcurrncy = response?.data?.data.currency_name || " ";
        setCurrencyName(getcurrncy)

        if (!Array.isArray(items)) {
            console.error("Expected array but got:", items);
            return [];
        }

        return items; // This is the key — return the data!
    } catch (error: any) {
        toast.error(error.message || "Failed to fetch employees");
        return []; // Always return array even on error
    }
};

export const exportAccountReport = async <T>(
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

export const PDFemployeeAccountv1 = async (
    id: number,
    setIsPDFDownloadLoading: any,
) => {
    const token = localStorage.getItem("token");
    setIsPDFDownloadLoading(true);
    try {
        const { data } = await axiosInstance.post("employeeAccountPDFv1", {
            accountTransactionId: id,
        });

        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                // fetch the file as blob
                const response = await fetch(data.data.fileLinkPath, {
                    headers: { Authorization: `${token}` },
                });
                const blob = await response.blob();

                // create download link from blob
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `employee_transaction_${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); // cleanup
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }

    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setIsPDFDownloadLoading(false);
    }
};