import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ITeamMember {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  mobile_number: string;
  reporting_member: number | "";
  department: number | "";
  expense_types?: number[];
  username?: string;
  aadhar_card_number?: string;
  pan_card_number?: string;
  date_of_joining?: string;
  employee_pf_no?: string;
}

export interface IAttendanceSalary {
  // Existing fields
  id: number;
  face_ids?: string;
  employee_id?: string;
  daily_in_time: string;
  daily_out_time: string;
  salary_type?: number | null;
  salary_cal_month_count?: number | null;
  salary_amount_type_wise: string;
  week_off_days?: number[];
  daily_working_hours?: string;
  daily_break_hours?: string;
  min_present_hours?: string;
  compulsary_attendance: string | "";
  compulsary_attendance_image: string | "";

  // New fields
  half_day_hours?: string;

  // Overtime
  min_overtime_hours?: string;
  overtime_amount_per_hour?: string;
  regular_ot_type?: string;
  extra_ot_type?: string;
  approve_ot_hours?: string;

  // Sandwich Rule
  sandwich_rule?: string; // "0" | "1"
  sandwich_rule_applied?: number | null;
  sandwich_rule_type?: string;

  // Bonus & Incentive
  bonus_type?: string;
  bonus_percentage?: string;
  performance_incentive?: string;

  // Earnings
  earning_first?: string;
  earning_second?: string;
  earning_third?: string;

  // Deductions
  deduction_first?: string;
  deduction_second?: string;
  deduction_third?: string;

  // PF / Tax / Insurance
  pf_percentage?: string;
  company_pf_percentage?: string;
  pm_pf_percentage?: string;
  tds_percentage?: string;
  insurance_amount?: string;
  pt_amount?: string;
  esi_company_side?: string;
  esi_employee_side_percentage?: string;
  gratuity_calculation?: string;

  // Salary Structure
  basic_da?: any;
  hra?: string;
  ctc?: string;
  medical_allowance?: string;
  conveyance_allowance?: string;
  special_allowance?: string;

  // Grace Period & Penalties
  grace_period?: string;
  late_in_allowed_count?: number | string;
  late_in_penalty_type?: string;
  late_in_penalty_value?: number | string;
  early_out_allowed_count?: number | string;
  early_out_penalty_type?: string;
  early_out_penalty_value?: number | string;
  hourly_leave_allowed_hours?: string;

  // Meta — used internally for create vs update decision
  payroll_id?: number | null; // null = no record yet → CREATE; number → UPDATE
}

// ─── Initial Values ───────────────────────────────────────────────────────────

export const teamMemberInitialValues = (companyTeamInfo: any): ITeamMember => ({
  id: companyTeamInfo?.id || 0,
  employee_id: companyTeamInfo?.employee_id || "",
  name: companyTeamInfo?.name || companyTeamInfo?.username || "Unknown User",
  email: companyTeamInfo?.email || companyTeamInfo?.recovery_email || "",
  mobile_number:
    companyTeamInfo?.mobile_number || companyTeamInfo?.recovery_mobile || "",
  reporting_member: companyTeamInfo?.reporting_member
    ? Number(companyTeamInfo.reporting_member)
    : "",
  department: companyTeamInfo?.department
    ? Number(companyTeamInfo.department)
    : "",
  expense_types: companyTeamInfo?.expense_types
    ? companyTeamInfo.expense_types.split(",").map(Number)
    : [],
  username: companyTeamInfo?.username || "",
  aadhar_card_number:
    companyTeamInfo?.aadhar_card_number || companyTeamInfo?.aadhar_card_number || "",
  pan_card_number:
    companyTeamInfo?.pan_card_number || companyTeamInfo?.pan_card_number || "",
  date_of_joining:
    companyTeamInfo?.date_of_joining || companyTeamInfo?.date_of_joining || "",
  employee_pf_no:
    companyTeamInfo?.employee_pf_no || companyTeamInfo?.employee_pf_no || "",
});

export const attendanceSalaryInitialValues = (
  payrollData?: any
): IAttendanceSalary => ({
  // Existing
  id: payrollData?.id || 0,
  face_ids: payrollData?.face_ids || "",
  employee_id: payrollData?.employee_id || "",
  daily_in_time: payrollData?.daily_in_time || "",
  daily_out_time: payrollData?.daily_out_time || "",
  salary_type: payrollData?.salary_type || null,
  salary_cal_month_count: payrollData?.salary_cal_month_count || "",
  salary_amount_type_wise: payrollData?.salary_amount_type_wise || "",
  week_off_days: payrollData?.week_off_days
    ? typeof payrollData.week_off_days === "string"
      ? payrollData.week_off_days.split(",").map(Number)
      : payrollData.week_off_days
    : [],
  // week_off_days: payrollData?.week_off_days ? payrollData.week_off_days.split(",").map(Number) : [],
  daily_working_hours: payrollData?.daily_working_hours || "",
  daily_break_hours: payrollData?.daily_break_hours || "",
  min_present_hours: payrollData?.min_present_hours || "",
  compulsary_attendance: payrollData?.compulsary_attendance
    ? String(payrollData.compulsary_attendance)
    : "0",
  compulsary_attendance_image: payrollData?.compulsary_attendance_image
    ? String(payrollData.compulsary_attendance_image)
    : "0",

  // New
  half_day_hours: payrollData?.half_day_hours || "",
  min_overtime_hours: payrollData?.min_overtime_hours || "",
  overtime_amount_per_hour: payrollData?.overtime_amount_per_hour || "",
  regular_ot_type: (payrollData as any)?.regular_ot_type ? String((payrollData as any).regular_ot_type) : "1",
  extra_ot_type: (payrollData as any)?.extra_ot_type ? String((payrollData as any).extra_ot_type) : "2",
  approve_ot_hours: payrollData?.approve_ot_hours || "",
  sandwich_rule: payrollData?.sandwich_rule ? String(payrollData.sandwich_rule) : "0",
  // sandwich_rule_applied: payrollData?.sandwich_rule_applied
  //   ? String(payrollData.sandwich_rule_applied)
  //   : "0",
  sandwich_rule_applied: payrollData?.sandwich_rule_applied || "",
  sandwich_rule_type: payrollData?.sandwich_rule_type || "",
  bonus_type: payrollData?.bonus_type || "",
  bonus_percentage: payrollData?.bonus_percentage || "",
  performance_incentive: payrollData?.performance_incentive || "",
  earning_first: payrollData?.earning_first || "",
  earning_second: payrollData?.earning_second || "",
  earning_third: payrollData?.earning_third || "",
  deduction_first: payrollData?.deduction_first || "",
  deduction_second: payrollData?.deduction_second || "",
  deduction_third: payrollData?.deduction_third || "",
  pf_percentage: payrollData?.pf_percentage || "",
  company_pf_percentage: payrollData?.company_pf_percentage || "",
  pm_pf_percentage: payrollData?.pm_pf_percentage || "",
  tds_percentage: payrollData?.tds_percentage || "",
  insurance_amount: payrollData?.insurance_amount || "",
  pt_amount: payrollData?.pt_amount || "",
  esi_company_side: payrollData?.esi_company_side || "",
  esi_employee_side_percentage: payrollData?.esi_employee_side_percentage || "",
  gratuity_calculation: payrollData?.gratuity_calculation || "",
  basic_da: payrollData?.basic_da || "",
  hra: payrollData?.hra || "",
  ctc: payrollData?.ctc || "",
  medical_allowance: payrollData?.medical_allowance || "",
  conveyance_allowance: payrollData?.conveyance_allowance || "",
  special_allowance: payrollData?.special_allowance || "",
  grace_period: payrollData?.grace_period || "",
  late_in_allowed_count: payrollData?.late_in_allowed_count ?? "0",
  late_in_penalty_type: payrollData?.late_in_penalty_type ? String(payrollData.late_in_penalty_type) : "1",
  late_in_penalty_value: payrollData?.late_in_penalty_value ?? "0",
  early_out_allowed_count: payrollData?.early_out_allowed_count ?? "0",
  early_out_penalty_type: payrollData?.early_out_penalty_type ? String(payrollData.early_out_penalty_type) : "1",
  early_out_penalty_value: payrollData?.early_out_penalty_value ?? "0",
  hourly_leave_allowed_hours: payrollData?.hourly_leave_allowed_hours || "0",
  payroll_id: payrollData?.id ?? null,
});

// ─── API: Fetch Basic Details ─────────────────────────────────────────────────

export const fetchBasicDetailsApi = async (
  employeeId: number,
  setValues: (data: Partial<ITeamMember>) => void
) => {
  const tenantId = localStorage.getItem("UUID");
  try {
    const response = await axiosInstance.post("mainCommonGet", {
      table: "a_application_logins",
      columns:
        "id,employee_id,username,recovery_email,recovery_mobile,reporting_member,department,expense_types,aadhar_card_number,pan_card_number,date_of_joining,employee_pf_no",
      where: [`id=${employeeId}`],
      request_flag: 0,
    });

    const result = response.data;
    if (result.ack !== DEFAULT_STATUS_CODE_SUCCESS) return;

    const row = result.data?.[0];
    if (!row) return;

    setValues({
      employee_id: row.employee_id || "",
      name: row.username || row.name || "",
      email: row.email || row.recovery_email || "",
      mobile_number: row.mobile_number || row.recovery_mobile || "",
      aadhar_card_number: row.aadhar_card_number || row.aadhar_card_number || "",
      pan_card_number: row.pan_card_number || row.pan_card_number || "",
      date_of_joining: row.date_of_joining || row.date_of_joining || "",
      employee_pf_no: row.employee_pf_no || row.employee_pf_no || "",
      reporting_member: row.reporting_member ? Number(row.reporting_member) : "",
      department: row.department ? Number(row.department) : "",
      expense_types: row.expense_types
        ? row.expense_types.split(",").map(Number)
        : [],
    });
  } catch (error) {
    console.error("Error fetching basic details:", error);
    toast.error("Failed to load basic details");
  }
};

// ─── API: Fetch Attendance & Salary (employee_payroll) ───────────────────────

/**
 * Returns the payroll record (or null if none exists yet).
 * The caller uses payroll_id to decide CREATE vs UPDATE.
 */
export const fetchAttendanceSettingsApi = async (
  employeeId: number,
  setAttendanceValues: (data: IAttendanceSalary) => void
) => {
  const tenantId = localStorage.getItem("UUID");

  const requestData = {
    a_application_id: employeeId,
  }
  try {
    const token = await localStorage.getItem("token");

    const response = await axiosInstance.post(
      `fetch-employee-payroll`,
      requestData,
      {
        headers: {
          Authorization: `${token}`,
          "x-tenant-id": tenantId,
        }
      }
    );

    const data = response.data;

    // API returns { ack, data } — data may be null when no record exists yet
    if (
      data.ack !== DEFAULT_STATUS_CODE_SUCCESS ||
      !data.data
    ) {
      // No record → set defaults with payroll_id = null (triggers CREATE later)
      setAttendanceValues(attendanceSalaryInitialValues(null));
      return;
    }

    setAttendanceValues(attendanceSalaryInitialValues(data.data));
  } catch (error) {
    console.error("Error fetching attendance/payroll data:", error);
    toast.error("Failed to load attendance & salary data");
    setAttendanceValues(attendanceSalaryInitialValues(null));
  }
};

// ─── API: Fetch Reporting Employees ──────────────────────────────────────────

export const fetchReportingEmployeesApi = async (
  setReportingEmployees: (data: any[]) => void
) => {
  const tenantId = localStorage.getItem("UUID");

  try {
    const response = await axiosInstance.post("my-team", {
      a_application_login_id: tenantId,
    });

    const result = response.data;
    if (result.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setReportingEmployees([]);
      return;
    }

    const normalizedData = result.data.item.map((user: any) => ({
      ...user,
      id: Number(user.id),
      name: user.name || user.username || "Unknown User",
    }));

    setReportingEmployees(normalizedData);
  } catch (error) {
    console.error("Error fetching reporting employees:", error);
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setReportingEmployees([]);
  }
};

// ─── API: Fetch Departments ───────────────────────────────────────────────────

export const fetchDepartmentsApi = async (
  setDepartments: (data: any[]) => void
) => {
  const tenantId = localStorage.getItem("UUID");

  const requestData = {
    table: "departments",
    columns: "id,department_name,color",
    where: ["isDelete=0", `a_application_login_id=${tenantId}||0`],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: tenantId,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);
    const result = response.data;

    if (result.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setDepartments([]);
      return;
    }

    setDepartments(
      result.data.map((dept: any) => ({ ...dept, id: Number(dept.id) }))
    );
  } catch (error) {
    console.error("Error fetching departments:", error);
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setDepartments([]);
  }
};

// ─── API: Update Basic Details ────────────────────────────────────────────────

export const updateBasicDetails = async (
  values: ITeamMember,
  callback: (updatedValues: ITeamMember) => void,
  employeeId: number,
  onHide: () => void
) => {
  const tenantId = localStorage.getItem("UUID");
  if (!tenantId) { toast.error("Missing UUID in localStorage"); return; }

  const requestData = {
    table: "a_application_logins",
    where: JSON.stringify({ id: employeeId }),
    data: JSON.stringify({
      employee_id: values.employee_id,
      username: values.name,
      reporting_member:
        values.reporting_member === "" ? null : Number(values.reporting_member),
      department: values.department === "" ? null : Number(values.department),
      expense_types: values.expense_types,
      aadhar_card_number: values.aadhar_card_number,
      pan_card_number: values.pan_card_number,
      employee_pf_no: values.employee_pf_no,
      date_of_joining: values.date_of_joining,
    }),
  };

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);

    if (data.code !== 200 || data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.ack_msg || "No records were updated.");
      return;
    }

    toast.success("Basic details updated successfully.");
    callback(values);
    onHide();
  } catch (error: any) {
    console.error("Error updating basic details:", error);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// ─── API: Create Attendance & Salary (employee_payroll) ──────────────────────

export const createAttendanceSalary = async (
  values: IAttendanceSalary,
  employeeId: number,
  teamMamberId: number,
  onSuccess: (payrollId: number) => void,
  onHide: () => void
) => {
  const tenantId = localStorage.getItem("UUID");
  if (!tenantId) { toast.error("Missing UUID in localStorage"); return; }

  const payload = buildPayrollPayload(values, employeeId, tenantId, teamMamberId);

  try {
    const token = await localStorage.getItem("token");
    // console.log("payloadpayloadpayload", payload);

    const { data } = await axiosInstance.post("create-emp-payroll", payload, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": tenantId,
      }
    });


    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.ack_msg || "Failed to save attendance & salary.");
      return;
    }

    toast.success("Attendance & Salary saved successfully.");
    onSuccess(data.data?.id ?? data.insertId ?? 0);
    onHide();
  } catch (error: any) {
    console.error("Error creating payroll record:", error);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// ─── API: Update Attendance & Salary (employee_payroll) ──────────────────────

export const updateAttendanceSalary = async (
  values: IAttendanceSalary,
  employeeId: number,
  teamMamberId: number,
  payrollId: any,
  onSuccess: () => void,
  onHide: () => void
) => {
  const tenantId = localStorage.getItem("UUID");
  if (!tenantId) { toast.error("Missing UUID in localStorage"); return; }

  const payload = buildPayrollPayload(values, employeeId, payrollId, teamMamberId);

  try {
    // const { data } = await axiosInstance.post("commonUpdate", {
    //   table: "employee_payroll",
    //   where: JSON.stringify({ id: payrollId }),
    //   data: JSON.stringify(payload),
    // });
    const token = await localStorage.getItem("token");

    const { data } = await axiosInstance.post("update-emp-payroll", payload, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": tenantId,
      },
    });
    if (data.code !== 200 || data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.ack_msg || "Failed to update attendance & salary.");
      return;
    }

    toast.success("Attendance & Salary updated successfully.");
    onSuccess();
    onHide();
  } catch (error: any) {
    console.error("Error updating payroll record:", error);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// ─── Helper: Build payroll payload ───────────────────────────────────────────

const buildPayrollPayload = (
  values: IAttendanceSalary,
  employeeId: number,
  payrollId: string,
  teamMamberId: number
) => ({
  id: payrollId,
  employee_id: employeeId,
  a_application_login_id: teamMamberId,
  daily_in_time: values.daily_in_time,
  daily_out_time: values.daily_out_time,
  daily_working_hours: values.daily_working_hours,
  daily_break_hours: values.daily_break_hours,
  min_present_hours: values.min_present_hours,
  half_day_hours: values.half_day_hours,
  salary_type: values.salary_type,
  face_ids: values.face_ids,
  salary_cal_month_count: values.salary_cal_month_count,
  salary_amount_type_wise: values.salary_amount_type_wise,
  week_off_days: values.week_off_days,
  compulsary_attendance: values.compulsary_attendance,
  compulsary_attendance_image: values.compulsary_attendance_image,
  min_overtime_hours: values.min_overtime_hours,
  overtime_amount_per_hour: values.overtime_amount_per_hour,
  regular_ot_type: values.regular_ot_type,
  extra_ot_type: values.extra_ot_type,
  approve_ot_hours: values.approve_ot_hours,
  sandwich_rule: values.sandwich_rule,
  sandwich_rule_applied: values.sandwich_rule_applied,
  sandwich_rule_type: values.sandwich_rule_type,
  bonus_type: values.bonus_type,
  bonus_percentage: values.bonus_percentage,
  performance_incentive: values.performance_incentive,
  earning_first: values.earning_first,
  earning_second: values.earning_second,
  earning_third: values.earning_third,
  deduction_first: values.deduction_first,
  deduction_second: values.deduction_second,
  deduction_third: values.deduction_third,
  pf_percentage: values.pf_percentage,
  company_pf_percentage: values.company_pf_percentage,
  pm_pf_percentage: values.pm_pf_percentage,
  tds_percentage: values.tds_percentage,
  insurance_amount: values.insurance_amount,
  pt_amount: values.pt_amount,
  esi_company_side: values.esi_company_side,
  esi_employee_side_percentage: values.esi_employee_side_percentage,
  gratuity_calculation: values.gratuity_calculation,
  basic_da: values.basic_da,
  hra: values.hra,
  ctc: values.ctc,
  medical_allowance: values.medical_allowance,
  conveyance_allowance: values.conveyance_allowance,
  special_allowance: values.special_allowance,
  grace_period: values.grace_period,
  late_in_allowed_count: values.late_in_allowed_count,
  late_in_penalty_type: values.late_in_penalty_type,
  late_in_penalty_value: values.late_in_penalty_value,
  early_out_allowed_count: values.early_out_allowed_count,
  early_out_penalty_type: values.early_out_penalty_type,
  early_out_penalty_value: values.early_out_penalty_value,
  hourly_leave_allowed_hours: values.hourly_leave_allowed_hours,
});

// ─── Legacy alias kept for backward compat (now a no-op shell) ───────────────
/** @deprecated Use fetchAttendanceSettingsApi instead */
export const updateTeamMember = updateBasicDetails;