import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IAttendanceHistory {
  username: string;
  salary: number;
  companyPaidLeave: number;
  employeePaidLeave: number;
  totalPaidDays: number;
  totalPaidHours: number;
  finalSalary: number;
  attendanceData: [
    {
      date: string,
      status: string,
      leave_type: string,
      messages: [
        {
          attendance_status: number,
          a_application_login_id: number,
          check_in_out_date_time: string,
          total_working_hour: string,
          created_date_time: string,
          company_masters_id: number,
          attendanceDate: string,
          attendanceTime: string
          image_url: string,
          address: string,
          latitude: string,
          longitude: string,
        }
      ]
    }
  ]
}

// export const fetchAttendanceReport = async (
//     setAttendanceReport: TReactSetState<IAttendanceHistory[]>,
//     selectedDates: Date[] | undefined,
//     selectedTeamMembers: string[] | null,
//     MobileToken?: string,
//     getID?: string,
//     MobileFlag?: string,
//     ul?: number,
//     ll?: number,
//     globalSearch?: string


// ) => {


//     const token = MobileToken || localStorage.getItem("token");
//     const getUUID = getID || localStorage.getItem("UUID");

//     const requestedData = {
//         request_flag: 2,
//         selectedDates: selectedDates,
//         a_application_login_id: getUUID,
//         selectedTeamMembers: selectedTeamMembers,
//         ul: ul ?? 0,
//         ll: ll ?? 50,
//         globalSearch
//     }
//     try {
//         const response = await axiosInstance.post("getTeamAttendanceReport", requestedData)

//         if (response.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
//             return 
//         }


//         if (response.data.ack == 3) {
//             toast.error(response.data.ack_msg)
//         }
//         setAttendanceReport(response.data.data.item);
//     } catch (error: any) {

//         toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);

//     }
// }



export const fetchAttendanceReport = async (
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  offset: number = 0,
  limit: number = 50,
  globalSearch?: string
): Promise<IAttendanceHistory[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    request_flag: 2,
    selectedDates: selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    ul: offset ?? 0,
    ll: limit ?? 50,
    globalSearch
  }

  try {
    const response = await axiosInstance.post("/getTeamAttendanceReport", requestedData);

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



export const fetchAttendanceForExport = async (
  selectedDates: Date[] | undefined,
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  offset: number = 0,
  limit: number = 500,
  globalSearch?: string
): Promise<IAttendanceHistory[]> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const payload = {
    request_flag: 2,
    selectedDates: selectedDates,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    ul: offset ?? 0,
    ll: limit ?? 500,
    globalSearch
  };

  const response = await axiosInstance.post(
    "/getTeamAttendanceReport",
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

export const exportAllAttendanceData = async (
  fetchFn: (offset: number, limit: number) => Promise<IAttendanceHistory[]>,
  limit = 50
): Promise<IAttendanceHistory[]> => {
  let offset = 0;
  let allData: IAttendanceHistory[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};