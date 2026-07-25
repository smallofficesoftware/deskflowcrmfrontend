import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IExpenseReport {
  teamId: string;
  username: string;
  result: {
    id: number;
    expense_type_id: number;
    requested_amount: string;
    pass_amount: string;
    create_date_time: string;
    expense_date: string;
    expense_status: number;
    a_application_login_id: number;
    expense_pass_or_reject: string;
    exp_image: string;

  }[];
}

export const fetchExpense = async (
  selectedDates: Date[] | undefined,
  selectedTeamMembers?: string[] | null,
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
      "/getTeamWiseExpense",
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