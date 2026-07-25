import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IAttendanceMessage {
  attendance_status: number;
  a_application_login_id: number;
  check_in_out_date_time: string;
  total_working_hour: string;
  created_date_time: string;
  company_masters_id: number;
  attendanceDate: string;
  attendanceTime: string;
}

export interface IAttendanceData {
  [x: string]: any;
  messages: IAttendanceMessage[];
}

export interface ITaskPerformance {
  username: string;
  contactCount: number;
  inquiryCount: number;
  dueTaskCount: number;
  dueSupportTicketCount: number;
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
  visitCount: number;
  expense: {
    RequestedAmount: number;
    PassedAmount: number;
  };
  account: {
    credit: {
      amount: string;
      count: number;
    };
    debit: {
      amount: string;
      count: number;
    };
  };
  salary: number;
  pendingReminder: number;
  attendanceData: IAttendanceData[];
}

export const fetchTeamPerformance = async (
  setTaskPerformance: TReactSetState<ITaskPerformance[]>,
  setAttendanceData: TReactSetState<IAttendanceData[]>,
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  ul?: number,
  ll?: number,
  globalSearch?: string,

): Promise<void> => {
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

  try {
    const response = await axiosInstance.post("/getTeamPerformanceReport", requestedData);

    if (response.data.ack == 3) {
      toast.error(response.data.ack_msg)
    }
    const items: ITaskPerformance[] = response?.data?.data?.item || [];



    setTaskPerformance(items);

    const attendanceArray: IAttendanceData[] = items.map(item => item.attendanceData).flat().filter(Boolean);
    setAttendanceData(attendanceArray);
  } catch (error: any) {
    console.error("Fetch Team Performance Error:", error);
    toast.error(error?.response?.data?.message || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};


export const fetchTeamPerformanceForExport = async (
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  offset = 0,
  limit = 500
): Promise<ITaskPerformance[]> => {
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
    "/getTeamPerformanceReport",
    payload
  );

  if (response?.data?.ack === 3) {
    toast.error(response.data.ack_msg);
    return [];
  }

  return Array.isArray(response?.data?.data?.item)
    ? response.data.data.item
    : [];
};

export const exportAllTeamPerformanceData = async (
  fetchFn: (offset: number, limit: number) => Promise<ITaskPerformance[]>,
  limit = 500
): Promise<ITaskPerformance[]> => {
  let offset = 0;
  let allData: ITaskPerformance[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);
    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};
