import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ICompanyTeam } from "../../../left-side/list-company/ListCompanyController";

export interface IExpenseDetailedReport {
    id: number;
    expense_type_id: string;
    amount: string;
    remark: string;
    expense_status: number;
    image: string;
    pass_amount: string;
    expense_date: string;
    created_by_username: string;
    a_application_login_id: any;
    expense_name: string;
    color: string;
    created_date_time?: string;
    companyFlag: number;
    status_remark: string;
    kilometers: string;
    expenseId: number;
}

export const fetchDetailedExpense = async (
    selectedDates: Date[] | undefined,
    selectedTeamMembers?: string[] | null,
    selectedExpenseTypes?: any[] | null | string,
    checkedOptionsExpenseStatus?: any[],
    ul?: number,
    ll?: number,
    globalSearch?: string,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
) => {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    const requestedData = {
        selectedDates: selectedDates,
        a_application_login_id: getUUID,
        selectedTeamMembers: selectedTeamMembers,
        selectedExpenseTypes: selectedExpenseTypes,
        selectedExpenseStatus: checkedOptionsExpenseStatus,
        ul: ul ?? 0,
        ll: ll ?? 50,
        globalSearch
    };

    if (!token || !getUUID) {
        toast.error("Authentication details are missing");
        return;
    }

    try {

        const response = await axiosInstance.post(
            "/get-detailed-expense",
            requestedData
        );

        if (response.data.ack == 3) {
            toast.error(response.data.ack_msg);
        }

        if (response.data.ack === 1) {
            return response.data.data.item || [];
        } else {
            throw new Error(response.data.ack_msg || "Error");
        }
    } catch (error: any) {
        toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
};

export const fetchCompanyTeamList = async (
    setCompanyTeamLists: TReactSetState<ICompanyTeam[]>,
    company_masters_id: number,
) => {
    const token = localStorage.getItem("token");
    const GetID = localStorage.getItem("UUID");

    const requestData = {
        company_masters_id: company_masters_id,
        searchTerm: "",
    };

    try {
        const res = await axiosInstance.post("my-team", requestData, {
            headers: {
                Authorization: `${token}`,
                "x-tenant-id": `${GetID}`,
            },
        });

        const teamData = res.data.data.item || [];

        setCompanyTeamLists(teamData);

    } catch (err) {
        toast.error("Failed to load team");
    }
}