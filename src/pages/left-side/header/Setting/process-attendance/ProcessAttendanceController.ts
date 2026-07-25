import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IMisPunchEntry {
  employee_id: number;
  employee_name: string;
  date: string; // "YYYY-MM-DD"
  punch_type: string; // e.g. "Missing In", "Missing Out"
  shift?: string;
}

export interface IDateRange {
  from_date: string; // "YYYY-MM-DD"
  to_date: string; // "YYYY-MM-DD"
}

export interface IProcessAttendanceView {
  id: number;
  year?: string;
  month?: string;
  last_modified_date?: string;
}

// ─── Mis-punch list ───────────────────────────────────────────────────────────

export const fetchMisPunchList = async (
  dateRange: IDateRange,
  setMisPunchList: TReactSetState<IMisPunchEntry[]>,
  setLoading: TReactSetState<boolean>,
): Promise<boolean> => {
  const getUUID = localStorage.getItem("UUID");
  setLoading(true);
  try {
    const { data } = await axiosInstance.post("attendance/mis-punch-list", {
      a_application_login_id: getUUID,
      from_date: dateRange.from_date,
      to_date: dateRange.to_date,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setMisPunchList(data.data || []);
      return true;
    }
    setMisPunchList([]);
    toast.warning(data.ack_msg || "No mis-punch data found.");
    return false;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    return false;
  } finally {
    setLoading(false);
  }
};

// ─── Single sub-step API call (date range only, no employee loop) ─────────────

export const runProcessSubStep = async (
  endpoint: string,
  dateRange: IDateRange,
): Promise<{ success: boolean; message: string }> => {
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post(endpoint, {
      a_application_login_id: getUUID,
      from_date: dateRange.from_date,
      to_date: dateRange.to_date,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return {
        success: true,
        message: data.ack_msg || "Completed successfully",
      };
    }
    return { success: false, message: data.ack_msg || "Step failed" };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    };
  }
};

export const fetchProcessAttendanceApi = async (
  setProcessAttendanceList: TReactSetState<IProcessAttendanceView[]>,
  setLoading: TReactSetState<boolean>,
  limit: number = 30,
  offset: number = 0,
  append: boolean = false,
): Promise<boolean> => {
  // const start: number = offset * limit;
  // returns true if more data may exist (fetched count === limit)
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    // limit,
    // offset,
    ul: offset,
    ll: limit,
  };
  try {
    const data = await axiosInstance.post(
      "attendance/processed-list",
      requestData,
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        if (!append) setProcessAttendanceList([]);
        return false;
      }
      const newItems: IProcessAttendanceView[] = data.data.data || [];
      if (append) {
        setProcessAttendanceList((prev) => [...prev, ...newItems]);
      } else {
        setProcessAttendanceList(newItems);
      }
      return newItems.length === limit; // false = reached end
    }
    return false;
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};
