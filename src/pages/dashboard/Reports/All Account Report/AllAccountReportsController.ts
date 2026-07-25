import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IAccountTransaction {
  id: number;
  acc_series: number;
  contact_masters_id: number;
  a_application_login_id: number;
  company_masters_id: number;
  type: number;
  mode: number;
  amount: number;
  payment_date_time: string;
  remark: string;
  approve_by_a_application_login_id: number;
  approve_date_time: string;
  reference_id: number;
  reference_table: string;
  created_date_time: string;
  s_timestemp: string;
  isDelete: number;
  isActive: number;
  typeItem: string;
  modeItem: string;
  approved_name?: string;
  created_name?: string;
  contact_name?: string;
  contact_mobileNumber?: string;
  contact_companyName?: string;
  amountwithcurrency: string;
  amountwithoutcurrency: string;
}
// export const fetchAccountTransactions = async (
//   setAccountTransactions: TReactSetState<IAccountTransaction[]>,
//   selectedDates: Date[] | undefined,
//   MobileToken?: string,
//   getID?: string,
//   MobileFlag?: string,
//   selectedTeamMembers?: string[] | null,
//   ul?: number,
//   ll?: number,
//   globalSearch?: string
// ) => {
//   const token = MobileToken || localStorage.getItem("token");
//   const getUUID = getID || localStorage.getItem("UUID");

//   const requestedData = {
//     selected_dates: selectedDates,
//     a_application_login_id: getUUID,
//     selectedTeamMembers: selectedTeamMembers,
//     ul: ul ?? 0,
//     ll: ll ?? 50,
//     globalSearch
//   };

//   try {
//     const response = await axiosInstance.post(
//       "/allAccountTranctionsReport",
//       requestedData
//     );

//     if (response.data.ack === 3) {
//       toast.error(response.data.ack_msg);
//       setAccountTransactions([]);
//     } else {
//       setAccountTransactions(response.data.data.data || []);
//     }
//   } catch (error: any) {
//     console.error("API Error:", error);
//     toast.error(error?.response?.data?.developer_msg || error.message || "Unknown error");
//     setAccountTransactions([]);
//   }
// };



export const fetchAccountTransactions = async (
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedTeamMembers?: string[] | null,
  offset: number = 0,
  limit: number = 50,
  globalSearch?: string,
  setCurrencyName?: any,
  selectedContactId?: string | null,
  referenceWiseContact?: number,
  selectedPaymentType?: number | null,
  selectedPaymentBy?: string[] | null,
): Promise<IAccountTransaction[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    selectedContactId: selectedContactId,
    ul: offset ?? 0,
    ll: limit ?? 50,
    globalSearch,
    referenceWiseContact: referenceWiseContact,
    selectedPaymentType: selectedPaymentType,
    selectedPaymentBy: selectedPaymentBy
  };

  try {
    const response = await axiosInstance.post("/allAccountTranctionsReport", requestedData);

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
    toast.error(error.message || "Failed to fetch contacts");
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
