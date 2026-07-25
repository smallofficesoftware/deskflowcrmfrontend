import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

interface Employee {
  username: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
};

interface TEmployeeAttendance  {
  presentEmployee: number;
  absentEmployee: number;
  salary: number;
};

export const fetchHRMSDashoardApi = async (
  selectedDates: Date[] | null,
  year: number | null,
  setTeamMemberCount: TReactSetState<number>,
  setOnLeaveCount: TReactSetState<number>,
  setExpense: TReactSetState<number>,
  setTotalVisitCount: TReactSetState<number>,
  setMonthlyBarChart: TReactSetState<any>,
  setEmployeeAttendance: TReactSetState<TEmployeeAttendance>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    selectedDates,
    year
  };
  try {
    const data = await axiosInstance.post("hrms-insight", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setTeamMemberCount(0);
      setOnLeaveCount(0);
      setExpense(0);
      setTotalVisitCount(0);
      setMonthlyBarChart([]);
      setEmployeeAttendance({
        presentEmployee: 0,
        absentEmployee: 0,
        salary: 0,
      });
      return;
    }
    setTeamMemberCount(data.data.data.teamMembers);
    setOnLeaveCount(data.data.data.onLeave)
    setEmployeeAttendance(data.data.data.employeeData)
    setExpense(data.data.data.expense)
    setTotalVisitCount(data.data.data.totalVisitCount)
    setMonthlyBarChart(data.data.data.monthlyBarchart)

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchHRMSLeaderBoardApi = async (
  leaderBoardSelectedDates: Date[] | null,
  setEmployeeData: TReactSetState<Employee[]>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    leaderBoardSelectedDates,
  };
  try {
    const data = await axiosInstance.post("hrms-leaderboard", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setEmployeeData([]);
      return;
    }
    setEmployeeData(data.data.data);

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchHRMSMapDataApi = async (
  date: string | null,
  setEmployeeLocationData: TReactSetState<any>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    date,
  };
  try {
    const data = await axiosInstance.post("hrms-team-tracking", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setEmployeeLocationData([]);
      return;
    }
    setEmployeeLocationData(data.data.data);

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};