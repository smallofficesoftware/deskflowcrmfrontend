import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IMonthYear {
  month: number; // 1-12
  year: number;
}

export interface IProcessAttendanceView {
  id: number;
  month: number | string;
  year: number | string;
  last_modified_date: string;
}

// ─── List: paginated salary process history (for SalaryProcessView) ─────────

export const fetchProcessAttendanceApi = async (
  setProcessAttendanceList: TReactSetState<IProcessAttendanceView[]>,
  setLoading: TReactSetState<boolean>,
  limit: number = 30,
  offset: number = 0,
  append: boolean = false,
): Promise<boolean> => {
  // returns true if more data may exist (fetched count === limit)
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    ul: offset,
    ll: limit,
  };
  try {
    const data = await axiosInstance.post("salary/fetch", requestData);
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

// ─── Run salary processing for the selected month/year (single API call) ─────

export const runSalaryProcess = async (
  monthYear: IMonthYear,
): Promise<{ success: boolean; message: string }> => {
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("salary/process", {
      a_application_login_id: getUUID,
      month: monthYear.month,
      year: monthYear.year,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return {
        success: true,
        message: data.ack_msg || "Salary processed successfully",
      };
    }
    return {
      success: false,
      message: data.ack_msg || "Salary processing failed",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    };
  }
};

export const proceedToEmpAccountApi = async (
  month: number,
  year: number,
  setShowProceedConfirm: TReactSetState<boolean>,
  setProceedItem: TReactSetState<IProcessAttendanceView | null>,
  handleRefreshList: () => void,
  setIsProceedLoading: TReactSetState<boolean>,
) => {
  setIsProceedLoading(true);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("salary/acc", {
      a_application_login_id: getUUID,
      month: month,
      year: year,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(
        data.ack_msg || "Salary transferred to employee account successfully",
      );
    } else {
      toast.error(
        data.ack_msg || "Failed to transfer salary to employee account",
      );
    }

    setShowProceedConfirm(false);
    setProceedItem(null);
    handleRefreshList();
  } catch {
    toast.error("Failed to transfer salary to employee account");
  } finally {
    setIsProceedLoading(false);
  }
};
