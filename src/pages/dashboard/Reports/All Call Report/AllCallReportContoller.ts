import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ICallHistoryView {
  id: number;
  created_date_time?: string;
  username: string;
  mobile_number: string;
  duration?: string;
  a_application_login_id: string | number;
  contact_id?: number;
  call_type?: string; // Updated to string for output
  call_color?: string;
  remark: string;
  [key: string]: any;
  call_name?: string;
  call_date_time?: string
  call_icon?: React.ElementType; // Updated to use React ElementType for icon
}

export interface ICallData {
  user: {
    username: string;
    recovery_mobile: string;
  };
  calls: ICallHistoryView[];
}

export const fetchCallHistoryApi = async (
  setCallHistoryList: (items: ICallData[]) => void,
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  offset: number = 0,
  limit: number = 50,
  globalSearch?: string,
  selectedContactId?: string | null,
  selectedLabels?: string[] | null,
  selectedSourceTypes?: string[] | null,
  selectedStageStatus?: string[] | null,
): Promise<ICallData[]> => {   // ← Now returns ICallData[]

  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  if (!token || !getUUID) {
    setCallHistoryList([]);
    toast.error("Authentication error: Missing token or UUID");
    return [];   // Return empty array instead of true
  }

  const requestData = {
    selectedDates: selectedDates
      ? selectedDates.map((date: DateObject | any) =>
        date instanceof DateObject ? date?.format("YYYY-MM-DD") : date
      )
      : undefined,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers || undefined,
    ul: offset,        // Keep backend field name as 'ul'
    ll: limit,         // Keep backend field name as 'll'
    globalSearch,
    selectedContactId,
    selectedLabels,
    selectedSourceTypes,
    selectedStageStatus
  };
  console.log("requestData", requestData);

  try {
    const response = await axiosInstance.post("getCallReport", requestData);
    const { data } = response;

    if (!data || typeof data !== "object") {
      setCallHistoryList([]);
      toast.error("Invalid API response format");
      return [];
    }

    if (response.status === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items = data.data || [];
      const processedData: ICallData[] = items.map((userItem: any) => {
        const user = userItem.user;

        const calls = (userItem.calls || []).map((call: any) => {
          const callData = call.toJSON ? call.toJSON() : { ...call };

          let callTypeValue: string = "Unknown";

          const callType = typeof callData.call_type === "number"
            ? callData.call_type
            : parseInt(callData.call_type || "0", 10);
          switch (callType) {
            case 1:
              callTypeValue = "Incoming";
              break;
            case 2:
              callTypeValue = "Outgoing";
              break;
            case 3:
              callTypeValue = "Missed";
              break;
            case 4:
              callTypeValue = "Rejected";
              break;
            case 5:
              callTypeValue = "Blocked";
              break;
            case 7:
              callTypeValue = "Outgoing Call Not Connected";
              break;
            case 9:
              callTypeValue = "Answered Externally";
              break;
          }

          return {
            ...callData,
            call_type: callType,          // keep original number (IMPORTANT)
            call_status: callTypeValue,   // UI label
          };
        });

        return {
          user,
          calls,
        };
      });
      if (data.ack === 3) {
        toast.error(data.ack_msg);
      }

      return processedData;   // ← Return actual data (ICallData[])
    }
    else {
      setCallHistoryList([]);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return [];
    }
  } catch (error: any) {
    console.error("API Error:", error.response || error.message || error);
    setCallHistoryList([]);
    toast.error(
      error.response?.data?.ack_msg ||
      error.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
    return [];
  }
};
