import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ISalaryRegister {
  id: number;
  year: number;
  month: number;
  added_date: string;
  employee_id: number;
  employee_name: string;
  total_present_day: number;
  half_day: number;
  total_week_off: number;
  total_leave: number;
  total_absent: number;
  total_day: number;
  working_hour: string;
  ctc: number;
  gross_salary: number;
  per_day_salary: number;
  fxs_basic: number;
  fxs_hra: number;
  fxs_other: number;
  fxs_total_earning: number;
  dws_basic: number;
  dws_hra: number;
  dws_other: number;
  dws_total_earning: number;
  earn_ot_hours: number;
  earn_ot_payable_amt: number;
  earn_head_first: number;
  earn_head_second: number;
  earn_head_third: number;
  bonus_amount: number;
  earn_sub_total: number;
  total_earning: number;
  ded_emp_pf: number;
  ded_pradhan_mantri_pf: number;
  ded_esi_employee: number;
  ded_esi_company: number;
  ded_pt: number;
  ded_insurance: number;
  ded_first: number;
  ded_second: number;
  ded_third: number;
  total_deduction: number;
  net_bank_pay: number;
  recovery_mobile: string;
  aadhar_card_number: string;
  pan_card_number: string;
}

export const fetchSalaryRegister = async (
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  offset: number = 0,
  limit: number = 50,
  selectedDayMonthYear?: number[] | null,
) => {
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    request_flag: 2,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    ul: offset ?? 0,
    ll: limit ?? 50,
    selectedDayMonthYear
  };

  try {
    const response = await axiosInstance.post(
      "/get-salary-registration",
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

export const fetchSalaryRegisterForExport = async (
  selectedTeamMembers: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  offset: number = 0,
  limit: number = 500,
  selectedDayMonthYear?: number[] | null,
): Promise<ISalaryRegister[]> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const payload = {
    request_flag: 2,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers,
    ul: offset ?? 0,
    ll: limit ?? 500,
    selectedDayMonthYear
  };

  const response = await axiosInstance.post(
    "/get-salary-registration",
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

export const exportAllSalaryRegisterData = async (
  fetchFn: (offset: number, limit: number) => Promise<ISalaryRegister[]>,
  limit = 50,
): Promise<ISalaryRegister[]> => {
  let offset = 0;
  let allData: ISalaryRegister[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};
