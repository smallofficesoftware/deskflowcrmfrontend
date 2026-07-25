import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IPendingWork {
  username: string;
  quotation: {
    count: number;
    amount: number;
  };
  order: {
    count: number;
    amount: number;
  };
  sell_invoice: {
    count: number;
    amount: number;
  };
  purchase_invoice: {
    count: number;
    amount: number;
  };
  purchase_order: {
    count: number;
    amount: number;
  };
  pendingReminder: number;
  reqExpenseAmount: number;
}

// export const fetchPendingWork = async (
//   setPendingWork: TReactSetState<IPendingWork[]>,
//   selectedDates: Date[] | undefined,
//   selectedTeamMembers: string[] | null,
//   MobileToken?: string,
//   getID?: string,
//   MobileFlag?: string,
//   offset: number = 0,
//   limit: number = 50,
//   globalSearch?: string

// ) => {
//   try {
//     const token = MobileToken || localStorage.getItem("token");
//     const getUUID = getID || localStorage.getItem("UUID");

//     const requestedData = {
//       selected_dates: selectedDates,
//       a_application_login_id: getUUID,
//       selectedTeamMembers: selectedTeamMembers,
//       ul: offset ?? 0,
//       ll: limit ?? 50,
//       globalSearch

//     };

//     const response = await axiosInstance.post("/getTeamPendingWorkReport", requestedData);

//     if (response.data.ack === 3) {
//       toast.error(response.data.ack_msg || "Permission denied");
//       return []; // Important: return empty array
//     }

//     // Make sure this path is correct based on your API response
//     const items = response.data.data?.item || [];

//     if (!Array.isArray(items)) {
//       console.error("Expected array but got:", items);
//       return [];
//     }

//     return items;
//   } catch (error: any) {
//     toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//   }
// };

export const fetchPendingWork = async (
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  offset: number = 0,
  limit: number = 50,
  globalSearch?: string,
): Promise<IPendingWork[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    ul: offset ?? 0,
    ll: limit ?? 500,
    globalSearch,
  };

  try {
    const response = await axiosInstance.post(
      "/getTeamPendingWorkReport",
      requestedData,
    );

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
    toast.error(error.message || "Failed to fetch contacts");
    return []; // Always return array even on error
  }
};

export const fetchTeamPendingWorkForExport = async (
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  offset = 0,
  limit = 500,
): Promise<IPendingWork[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const payload = {
    selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers,
    ul: offset,
    ll: limit,
  };

  const response = await axiosInstance.post(
    "/getTeamPendingWorkReport",
    payload,
  );

  if (response?.data?.ack === 3) {
    toast.error(response.data.ack_msg);
    return [];
  }

  return Array.isArray(response?.data?.data?.item)
    ? response.data.data.item
    : [];
};

export const exportAllTeamPendingWorkData = async (
  fetchFn: (offset: number, limit: number) => Promise<IPendingWork[]>,
  limit = 500,
): Promise<IPendingWork[]> => {
  let offset = 0;
  let allData: IPendingWork[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};
