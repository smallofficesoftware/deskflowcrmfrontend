import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ICustomerSalesPurchaseItem {
  id: string | number;
  customer_code: string;
  customer_name: string;
  state: string;
  gstin: string;
  total_sales: number;
  total_purchase: number;
  net_balance: number;
  relationship: string;
  currency_symbol?: string;
}

export interface ICustomerSalesPurchaseSummary {
  totalCustomers: number;
  totalSales: number;
  totalPurchase: number;
  netBalance: number;
  currency_symbol?: string;
}

export const fetchCustomerSalesPurchaseReport = async (
  setReportData: TReactSetState<ICustomerSalesPurchaseItem[]>,
  setTotalRecords: TReactSetState<number>,
  setSummaryData?: TReactSetState<ICustomerSalesPurchaseSummary>,
  selectedDates?: Date[],
  selectedTeamMembers?: string[] | null,
  MobileToken?: string,
  getID?: string,
  ul?: number,
  ll?: number,
  globalSearch?: string,
  selectedContactId?: string | number | null,
): Promise<void> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selectedDates: selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    selectedContactId: selectedContactId,
    ul: ul ?? 0,
    ll: ll ?? 50,
    globalSearch: globalSearch || "",
  };

  try {
    const response = await axiosInstance.post(
      "/getCustomerSalesPurchaseReport",
      requestedData,
    );

    if (response?.data?.ack === 3) {
      toast.error(response.data.ack_msg);
    }

    const items: ICustomerSalesPurchaseItem[] =
      response?.data?.data?.item || [];
    const totalRecs: number =
      response?.data?.data?.totalRecords || items.length;
    const summaryBackend: ICustomerSalesPurchaseSummary = response?.data?.data
      ?.summary || {
      totalCustomers: items.length,
      totalSales: 0,
      totalPurchase: 0,
      netBalance: 0,
      currency_symbol: items[0]?.currency_symbol || "₹",
    };

    setReportData(items);
    setTotalRecords(totalRecs);
    if (setSummaryData) {
      setSummaryData(summaryBackend);
    }
  } catch (error: any) {
    console.error("Fetch Customer Sales & Purchase Report Error:", error);
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};
