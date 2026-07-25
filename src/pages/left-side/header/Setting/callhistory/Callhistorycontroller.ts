import {
  FaBan,
  FaPhoneSlash,
  FaQuestionCircle,
  FaUserSlash,
} from "react-icons/fa";
import {
  HiPhoneIncoming,
  HiPhoneOutgoing,
} from "react-icons/hi";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

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
  [key: string]: any;
  call_name?: string;
  call_date_time?: string
  call_icon?: React.ElementType; // Updated to use React ElementType for icon
}

export const fetchCallHistoryApi = async (
  page: number,
  itemsPerPage: number,
  setCallHistoryList: (items: ICallHistoryView[]) => void,
  setLoading: TReactSetState<boolean>,
  term: string,
  contactId?: number
): Promise<boolean> => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  if (!token || !getUUID) {
    setLoading(false);
    setCallHistoryList([]);
    toast.error("Authentication error: Missing token or UUID");
    return true;
  }

  const start: number = page * itemsPerPage;
  const requestData = {
    ul: start,
    ll: itemsPerPage,
    a_application_login_id: getUUID,
    searchTerm: term,
    ...(contactId && { contactId }),
  };

  try {
    setLoading(true);
    const response = await axiosInstance.post("getcall", requestData);

    const { data } = response;

    if (!data || typeof data !== "object") {
      setCallHistoryList([]);
      toast.error("Invalid API response format");
      return true;
    }

    if (response.status === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items = data.data?.item || [];
      const processedData = items.map((call: any): ICallHistoryView => {
        const callData = call.toJSON ? call.toJSON() : { ...call };
        let callTypeValue: string;
        let color: string;
        let IconComponent = FaQuestionCircle;

        const callType = typeof callData.call_type === "number" ? callData.call_type : parseInt(callData.call_type || "0");

        switch (callType) {
          case 1:
            callTypeValue = "Incoming";
            color = "#008000";
            IconComponent = HiPhoneIncoming;
            break;
          case 2:
            callTypeValue = "Outgoing";
            color = "#0000FF";
            IconComponent = HiPhoneOutgoing;
            break;
          case 3:
            callTypeValue = "Missed";
            color = "#FFCCCC";
            IconComponent = FaPhoneSlash;
            break;
          case 4:
            callTypeValue = "Rejected";
            color = "#8B0000";
            IconComponent = FaBan;
            break;
          case 5:
            callTypeValue = "Blocked";
            color = "#000000";
            IconComponent = FaUserSlash;
            break;
          case 7:
            callTypeValue = "Outgoing Call Not Connected";
            color = "#00b3ff";
            IconComponent = FaUserSlash;
            break;
          case 9:
            callTypeValue = "Answered Externally";
            color = "#FFB300";
            IconComponent = HiPhoneOutgoing;
            break;
          default:
            callTypeValue = "Unknown";
            color = "#333333";
            IconComponent = FaQuestionCircle;
            break;
        }

        return {
          ...callData,
          call_type: callTypeValue,
          color,
          icon: IconComponent,
          id: callData.id || 0,
          call_name: callData.call_name || "Unknown",
          mobile_number: callData.mobile_number || "N/A",
          a_application_login_id: callData.a_application_login_id || parseInt(getUUID || "0"),
        };
      });

      setCallHistoryList(processedData);
      return processedData.length === 0;
    } else {
      setCallHistoryList([]);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return true;
    }
  } catch (error: any) {
    console.error("API Error:", error.response || error.message || error);
    setCallHistoryList([]);
    toast.error(error.response?.data?.ack_msg || error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return true;
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};