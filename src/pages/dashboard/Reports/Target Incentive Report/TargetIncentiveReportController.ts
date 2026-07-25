import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ITargetIncentiveItem {
  id: string | number;
  user_id?: string | number;
  username: string;
  target_type?: number;
  target_type_label?: string;
  target_fromdate?: string;
  target_todate?: string;
  target_count?: number;
  achieved_count?: number;
  target_value?: number;
  achieved_value?: number;
  target_amount: number;
  achieved_amount: number;
  achievement_percentage: number;
  achievement_pct?: number;
  incentive_type?: number;
  incentive_type_label?: string;
  incentive_value?: number;
  incentive_percentage: number;
  incentive_amount: number;
  earned_incentive?: number;
  total_invoices_count: number;
  currency_symbol?: string;
  status: string;
}

export interface ITargetIncentiveSummary {
  totalMembers: number;
  totalTargetAmount: number;
  totalAchievedAmount: number;
  totalIncentivePayout: number;
  currency_symbol?: string;
}

export const fetchTargetIncentiveReport = async (
  setTargetIncentiveData: TReactSetState<ITargetIncentiveItem[]>,
  setTotalRecords: TReactSetState<number>,
  setSummaryData?: TReactSetState<ITargetIncentiveSummary>,
  selectedDates?: Date[],
  selectedTeamMembers?: string[] | null,
  MobileToken?: string,
  getID?: string,
  ul?: number,
  ll?: number,
  globalSearch?: string,
): Promise<void> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selectedDates: selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    ul: ul ?? 0,
    ll: ll ?? 50,
    globalSearch: globalSearch || "",
  };

  try {
    const response = await axiosInstance.post(
      "/getTargetIncentiveReport",
      requestedData,
    );

    if (response?.data?.ack === 3) {
      toast.error(response.data.ack_msg);
    }

    const items: ITargetIncentiveItem[] = response?.data?.data?.item || [];
    const totalRecs: number =
      response?.data?.data?.totalRecords || items.length;
    const summaryBackend: ITargetIncentiveSummary = response?.data?.data
      ?.summary || {
      totalMembers: items.length,
      totalTargetAmount: 0,
      totalAchievedAmount: 0,
      totalIncentivePayout: 0,
      currency_symbol: items[0]?.currency_symbol || "₹",
    };

    setTargetIncentiveData(items);
    setTotalRecords(totalRecs);
    if (setSummaryData) {
      setSummaryData(summaryBackend);
    }
  } catch (error: any) {
    console.error("Fetch Target Incentive Report Error:", error);
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};
