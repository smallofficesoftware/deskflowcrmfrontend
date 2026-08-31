import { ErrorMessage, Field, Form, Formik } from "formik";
import React, { useContext, useEffect, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { AppContext } from "../../../common/AppContext";
import CustomSearchMultiSelectDropdown from "../../../components/CustomSearchMultiSelectDropdown";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import FormikStaticSelect from "../../../components/FormikStaticSelect";
import AddCategoryModal from "../../../components/model/AddCategoryModal";
import {
  BIG_TEXT_LENGTH,
  SMALL_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { fetchExpenseTypeApi } from "../header/Setting/expense-type/ExpenseTypeController";
import {
  IAttendanceSalary,
  ITeamMember,
  attendanceSalaryInitialValues,
  createAttendanceSalary,
  fetchAttendanceSettingsApi,
  fetchBasicDetailsApi,
  fetchDepartmentsApi,
  fetchReportingEmployeesApi,
  teamMemberInitialValues,
  updateAttendanceSalary,
  updateBasicDetails,
} from "./EditTeamMemberController";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditTeamMemberViewProps {
  show: boolean;
  onHide: () => void;
  companyTeamInfo: any;
  planId: number;
  onUpdate?: (updatedValues: ITeamMember) => void;
}

// ─── Validation Schemas ───────────────────────────────────────────────────────

const basicValidationSchema = Yup.object({
  employee_id: Yup.string()
    .max(
      SMALL_TEXT_LENGTH,
      `Employee ID must be less than ${SMALL_TEXT_LENGTH} characters`,
    )
    .required("Employee ID is required"),
  name: Yup.string()
    .max(
      SMALL_TEXT_LENGTH,
      `Name must be less than ${SMALL_TEXT_LENGTH} characters`,
    )
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .max(
      BIG_TEXT_LENGTH,
      `Email must be less than ${BIG_TEXT_LENGTH} characters`,
    )
    .required("Email is required"),
  mobile_number: Yup.string()
    .matches(/^\d+$/, "Must be a valid number")
    .required("Mobile number is required"),
  department: Yup.mixed().optional(),
  aadhar_card_number: Yup.string()
    .matches(/^\d{12}$/, "Aadhar number must be 12 digits")
    .nullable(),

  pan_card_number: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card number")
    .nullable(),
});

const attendanceValidationSchema = Yup.object({
  compulsary_attendance: Yup.mixed()
    .test(
      "is-number-or-empty",
      "Compulsory attendance must be selected",
      (value) => value === "0" || value === "1" || typeof value === "number",
    )
    .required("Compulsory attendance is required"),
  salary_amount_type_wise: Yup.number().when("salary_type", {
    is: (value: any) => !!value,
    then: (schema) => schema.required("This field is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  week_off_days: Yup.array()
    .of(Yup.number().integer().min(0).max(6))
    .nullable(),
  daily_working_hours: Yup.string()
    .test(
      "is-valid-time",
      "Invalid time format (HH:mm)",
      (val) => !val || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(val),
    )
    .nullable(),
  half_day_hours: Yup.string()
    .test(
      "is-valid-time",
      "Invalid time format (HH:mm)",
      (val) => !val || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(val),
    )
    .nullable(),
  min_overtime_hours: Yup.string()
    .test(
      "is-valid-time",
      "Invalid time format (HH:mm)",
      (val) => !val || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(val),
    )
    .nullable(),
  approve_ot_hours: Yup.string()
    .test(
      "is-valid-time",
      "Invalid time format (HH:mm)",
      (val) => !val || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(val),
    )
    .nullable(),
  bonus_percentage: Yup.string()
    .matches(/^\d*\.?\d*$/, "Must be a valid percentage")
    .test(
      "max-100",
      "Percentage cannot exceed 100",
      (value) => !value || parseFloat(value) <= 100,
    )
    .nullable(),
  pf_percentage: Yup.string()
    .matches(/^\d*\.?\d*$/, "Must be a valid percentage")
    .test(
      "max-100",
      "Percentage cannot exceed 100",
      (value) => !value || parseFloat(value) <= 100,
    )
    .nullable(),
  tds_percentage: Yup.string()
    .matches(/^\d*\.?\d*$/, "Must be a valid percentage")
    .test(
      "max-100",
      "Percentage cannot exceed 100",
      (value) => !value || parseFloat(value) <= 100,
    )
    .nullable(),
  esi_employee_side_percentage: Yup.string()
    .matches(/^\d*\.?\d*$/, "Must be a valid percentage")
    .test(
      "max-100",
      "Percentage cannot exceed 100",
      (value) => !value || parseFloat(value) <= 100,
    )
    .nullable(),
});

// ─── Reusable helpers ─────────────────────────────────────────────────────────

/** Numeric-only field onChange that allows one decimal point */
const numericOnChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  field: string,
  setFieldValue: (f: string, v: any) => void,
) => {
  let val = e.target.value.replace(/[^0-9.]/g, "");
  if ((val.match(/\./g) || []).length > 1) val = val.slice(0, -1);
  if (val === "0" && !e.target.value.includes(".")) val = "";
  setFieldValue(field, val);
};

/** Time-picker DatePicker bind helper */
const TimepickerField = ({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) => (
  <DatePicker
    value={
      value
        ? new DateObject({
          date: `1970-01-01 ${value}`,
          format: "YYYY-MM-DD HH:mm",
        })
        : null
    }
    onChange={(date) => {
      if (!date) {
        onChange("");
        return;
      }
      onChange((date as DateObject).format("HH:mm"));
    }}
    disableDayPicker
    format="HH:mm"
    placeholder="HH:mm"
    plugins={[<TimePicker hideSeconds />]}
    inputClass={`form-control font-size-15 rounded-1 ${hasError ? "is-invalid" : ""}`}
    containerClassName="w-100"
  />
);

/** Section divider used to group Attendance & Salary sub-sections */
const SectionTitle = ({ title }: { title: string }) => (
  <div className="col-12 mt-3 mb-2">
    <div
      style={{
        borderLeft: "4px solid #f58634",
        paddingLeft: "12px",
        paddingTop: "4px",
        paddingBottom: "4px",
        fontSize: "14px",
        fontWeight: 700,
        color: "#2c3e50",
        letterSpacing: "0.3px",
        backgroundColor: "#fff5ed",
        borderRadius: "0 6px 6px 0",
      }}
    >
      {title}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EditTeamMemberView = ({
  show,
  onHide,
  companyTeamInfo,
  planId,
  onUpdate,
}: EditTeamMemberViewProps) => {
  const { showRightSide, setShowRightSide } = useContext(AppContext)!;

  // Dropdown data
  const penaltyTypeOptions = [
    { value: "1", label: "Fixed Given Hours Penalty (Hours Debit)" },
    { value: "2", label: "Actual Late In / Early Out Duration Hours Penalty" },
    { value: "3", label: "Fixed Given Amount Penalty (Rupee Deduction ₹)" },
  ];

  const otRateTypeOptions = [
    { value: "1", label: "Formula Rate (Basic Salary Based)" },
    { value: "2", label: "Overtime Amount Per Hour (₹)" },
  ];

  const [reportingEmployees, setReportingEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [expenseTypeList, setExpenseTypeList] = useState<any[]>([]);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);
  const [isOpenAddDepartmentModal, setIsOpenAddDepartmentModal] =
    useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"basic" | "attendance" | "penalty" | "hourly_leave">("basic");
  // console.log("activeTab", activeTab);

  // Separate form values per tab
  const [basicValues, setBasicValues] = useState<ITeamMember>(
    teamMemberInitialValues(companyTeamInfo),
  );
  const [attendanceValues, setAttendanceValues] = useState<IAttendanceSalary>({
    ...attendanceSalaryInitialValues(null),
    bonus_percentage: "8.333333",
  });

  const canAddDepartment = useCheckUserPermission(
    PAGE_ID.DEPARTMENT,
    PERMISSION_TYPE.ADD,
  );

  // ── Static options ──────────────────────────────────────────────────────────

  const salaryTypeOptions = [
    { value: 1, label: "Hour wise salary" },
    { value: 2, label: "Day wise salary" },
    { value: 3, label: "Month wise salary" },
  ];
  const salaryCalMounthCounteOptions = [
    { value: 1, label: "Fix 30 Day" },
    { value: 2, label: "Per Month Total Day" },
    { value: 3, label: "Per Month Total Day - Week off" },
  ];

  const weekOffDaysOptions = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];
  const sandwichRuleAppliedOn = [
    { value: 1, label: "Week Off" },
    { value: 2, label: "Holiday" },
    { value: 3, label: "Both together" },
  ];
  const yesNoOptions = [
    { value: "1", label: "Yes" },
    { value: "0", label: "No" },
  ];

  const sandwichRuleTypeOptions = [
    { value: "1", label: "Full Sandwich, half Sandwich with pay" },
    { value: "2", label: "Full Sandwich, half Sandwich with deduct" },
  ];

  const bonusTypeOptions = [
    { value: "1", label: "Monthly" },
    { value: "2", label: "Yearly" },
  ];

  const expenseTypeOptions = expenseTypeList.map((item) => ({
    value: Number(item.id),
    label: item.expense_name,
  }));

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  // Block Enter key inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };
    if (show) {
      document.addEventListener("keydown", handleKeyDown);
      // Load shared dropdown data once
      fetchReportingEmployeesApi(setReportingEmployees);
      fetchDepartmentsApi(setDepartments);
      fetchExpenseTypeApi(setExpenseTypeList, setLoadingExpenseTypes, 1);
      // Load initial tab data
      loadTabData("basic");
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show, companyTeamInfo]);

  // Load data on every tab change (requirement #2)
  useEffect(() => {
    if (show && companyTeamInfo?.id) {
      loadTabData(activeTab);
    }
  }, [activeTab, show, companyTeamInfo]);

  const loadTabData = (tab: "basic" | "attendance" | "penalty") => {
    if (!companyTeamInfo?.id) return;

    if (tab === "basic") {
      fetchBasicDetailsApi(companyTeamInfo.id, (data) =>
        setBasicValues((prev) => ({ ...prev, ...data })),
      );
    } else {
      fetchAttendanceSettingsApi(companyTeamInfo.id, (data: any) => {
        setAttendanceValues({
          ...data,
          daily_working_hours: data?.daily_working_hours
            ? String(data.daily_working_hours).slice(0, 5)
            : "",
          half_day_hours: data?.half_day_hours
            ? String(data.half_day_hours).slice(0, 5)
            : "",
          min_overtime_hours: data?.min_overtime_hours
            ? String(data.min_overtime_hours).slice(0, 5)
            : "",
          approve_ot_hours: data?.approve_ot_hours
            ? String(data.approve_ot_hours).slice(0, 5)
            : "",

          // convert comma string to array
          // week_off_days: data?.week_off_days
          //   ? data.week_off_days.split(",").map((x: string) => Number(x))
          //   : [],

          // convert to string for dropdown
          sandwich_rule_applied:
            data?.sandwich_rule_applied != null
              ? Number(data.sandwich_rule_applied)
              : null,
          sandwich_rule_type: data?.sandwich_rule_type
            ? String(data.sandwich_rule_type)
            : "",

          bonus_type: data?.bonus_type ? String(data.bonus_type) : "",
          salary_cal_month_count:
            data?.salary_cal_month_count != null
              ? Number(data.salary_cal_month_count)
              : null,

          compulsary_attendance:
            data?.compulsary_attendance != null
              ? String(data.compulsary_attendance)
              : "0",

          compulsary_attendance_image:
            data?.compulsary_attendance_image != null
              ? String(data.compulsary_attendance_image)
              : "0",

          // default bonus percentage
          bonus_percentage:
            data?.bonus_percentage != null
              ? String(data.bonus_percentage)
              : "8.333333",
        });
      });
    }
  };

  // ── Derived options ─────────────────────────────────────────────────────────

  const filteredReportingEmployees = companyTeamInfo?.id
    ? reportingEmployees.filter(
      (emp) =>
        emp.id !== Number(companyTeamInfo.id) ||
        emp.id === Number(companyTeamInfo.reporting_member),
    )
    : reportingEmployees;

  const reportingEmployeeOptions = [
    { value: "", label: "None" },
    ...filteredReportingEmployees.map((emp) => ({
      value: Number(emp.id),
      label: emp.username,
    })),
  ];

  const departmentOptions = departments.map((dept) => ({
    value: Number(dept.id),
    label: dept.department_name,
  }));

  // ── Submit handlers (tab-specific, requirement #3) ──────────────────────────

  const handleBasicSubmit = async (values: ITeamMember) => {
    try {
      await updateBasicDetails(
        values,
        (updated) => {
          if (onUpdate) onUpdate(updated);
        },
        companyTeamInfo?.id,
        onHide,
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update basic details",
      );
    }
  };

  const handleAttendanceSubmit = async (values: IAttendanceSalary) => {
    const employeeId = companyTeamInfo?.employee_id;

    const teamMamberId = companyTeamInfo?.id;
    // Requirement #4: CREATE if payroll_id is null, UPDATE otherwise
    if (values.payroll_id == null) {
      await createAttendanceSalary(
        values,
        employeeId,
        teamMamberId,
        (newId) => {
          setAttendanceValues((prev) => ({ ...prev, payroll_id: newId }));
        },
        onHide, // ← Pass your hide function here
      );
    } else {
      await updateAttendanceSalary(
        values,
        employeeId,
        teamMamberId,
        values.id,
        () => {
          // Refresh logic
          fetchAttendanceSettingsApi(companyTeamInfo.id, (data: any) => {
            setAttendanceValues({
              ...data,

              // convert comma string back to array for week_off_days
              week_off_days: data?.week_off_days
                ? typeof data.week_off_days === "string"
                  ? data.week_off_days
                    .split(",")
                    .map((x: string) => Number(x.trim()))
                    .filter((num: any) => !isNaN(num)) // Remove invalid numbers
                  : Array.isArray(data.week_off_days)
                    ? data.week_off_days.map((x: any) => Number(x))
                    : []
                : [],
              sandwich_rule_applied:
                data?.sandwich_rule_applied != null
                  ? Number(data.sandwich_rule_applied)
                  : null,

              sandwich_rule_type: data?.sandwich_rule_type
                ? String(data.sandwich_rule_type)
                : "",

              bonus_type: data?.bonus_type ? String(data.bonus_type) : "",
              salary_cal_month_count:
                data?.salary_cal_month_count != null
                  ? Number(data.salary_cal_month_count)
                  : null,

              compulsary_attendance:
                data?.compulsary_attendance != null
                  ? String(data.compulsary_attendance)
                  : "0",

              compulsary_attendance_image:
                data?.compulsary_attendance_image != null
                  ? String(data.compulsary_attendance_image)
                  : "0",

              bonus_percentage:
                data?.bonus_percentage != null
                  ? String(data.bonus_percentage)
                  : "8.333333",
            });
          });
        },
        onHide, // ← Pass your hide function here
      );
    }
  };

  if (!show || !companyTeamInfo) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // ADD THESE HELPERS ABOVE COMPONENT
  // ─────────────────────────────────────────────────────────────

  /** Numeric-only field onChange that allows one decimal point */
  const numericOnChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    setFieldValue: (f: string, v: any) => void,
  ) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");

    // allow only one decimal
    if ((val.match(/\./g) || []).length > 1) {
      val = val.slice(0, -1);
    }

    // prevent negative
    if (Number(val) < 0) {
      val = "0";
    }

    setFieldValue(field, val);
  };

  /** Percentage field validation (0 to 100 only) */
  const percentageOnChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    setFieldValue: (f: string, v: any) => void,
  ) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");

    // allow only one decimal
    if ((val.match(/\./g) || []).length > 1) {
      val = val.slice(0, -1);
    }

    const num = parseFloat(val);

    // max 100
    if (!isNaN(num) && num > 100) {
      val = "100";
    }

    setFieldValue(field, val);
  };

  /** Helper to auto-calculate HRA (40% of Basic) and total Monthly CTC */
  const updateSalaryComponents = (
    updatedFields: Partial<{
      basic_da: string;
      hra: string;
      medical_allowance: string;
      conveyance_allowance: string;
      special_allowance: string;
      ctc: string;
    }>,
    currentValues: any,
    setFieldValue: (field: string, value: any) => void,
  ) => {
    const merged = { ...currentValues, ...updatedFields };
    let basicDa = parseFloat(merged.basic_da) || 0;
    let hra = parseFloat(merged.hra) || 0;

    if ("basic_da" in updatedFields) {
      hra = Math.round(((basicDa * 40) / 100) * 100) / 100;
      setFieldValue("hra", hra > 0 ? hra.toFixed(2) : "");
    }

    const medical = parseFloat(merged.medical_allowance) || 0;
    const conveyance = parseFloat(merged.conveyance_allowance) || 0;
    const special = parseFloat(merged.special_allowance) || 0;

    if (!("ctc" in updatedFields)) {
      const ctc = basicDa + hra + medical + conveyance + special;
      setFieldValue("ctc", ctc > 0 ? ctc.toFixed(2) : "");
      if (Number(currentValues.salary_type) === 3) {
        setFieldValue("salary_amount_type_wise", ctc > 0 ? ctc.toFixed(2) : "");
      }
    }
  };
  return (
    <>
      <style>{`
        .custom-tab-wrapper {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 12px;
          flex-wrap: wrap;
        }
        .custom-tab-btn {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #475569;
          padding: 7px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          white-space: nowrap;
        }
        .custom-tab-btn.active {
          background: #f58634;
          color: white;
          border-color: #f58634;
          box-shadow: 0 2px 4px rgba(245, 134, 52, 0.25);
        }
        .custom-tab-btn:hover:not(.active) {
          background: #fff3ea;
          color: #f58634;
          border-color: #f58634;
        }
        .etm-section-scroll {
          max-height: 600px;
          overflow-y: auto;
          padding-right: 4px;
        }
      `}</style>

      <React.Fragment>
        <div className="modal1">
          <div className="modal-content1">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-end">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">
                  Edit Team Member
                </h2>
              </div>
              <div className="col-4">
                <span className="close ms-3 pb-3" onClick={onHide}>
                  ×
                </span>
              </div>
            </div>

            {/* Tab buttons */}
            <div className="custom-tab-wrapper mb-4">
              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "basic" ? "active" : ""}`}
                onClick={() => setActiveTab("basic")}
              >
                Basic Details
              </button>
              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "attendance" ? "active" : ""}`}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance & Salary
              </button>
              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "penalty" ? "active" : ""}`}
                onClick={() => setActiveTab("penalty")}
              >
                Late In & Early Out Penalty Rules
              </button>
              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "hourly_leave" ? "active" : ""}`}
                onClick={() => setActiveTab("hourly_leave")}
              >
                Hourly Leave Rules
              </button>
            </div>

            {/* ── BASIC DETAILS TAB ── */}
            {activeTab === "basic" && (
              <Formik
                enableReinitialize
                initialValues={basicValues}
                validationSchema={basicValidationSchema}
                onSubmit={handleBasicSubmit}
              >
                {({ errors, touched, isSubmitting, setFieldValue, values }) => (
                  <Form>
                    <div className="mt-3 d-flex justify-content-center">
                      <div className="mb-3 py-4 w-100">
                        <div className="row mx-0 px-2 gy-3 etm-section-scroll">
                          {/* Employee ID */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Employee ID{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="employee_id"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${errors.employee_id && touched.employee_id ? "is-invalid input-box-error" : ""}`}
                              />
                              <ErrorMessage
                                name="employee_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Name */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Name <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="name"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${errors.name && touched.name ? "is-invalid input-box-error" : ""}`}
                              />
                              <ErrorMessage
                                name="name"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Email <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="email"
                                name="email"
                                disabled
                                maxLength={BIG_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${errors.email && touched.email ? "is-invalid input-box-error" : ""}`}
                              />
                              <ErrorMessage
                                name="email"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Mobile Number */}
                          <div className={`col-${planId !== 1 ? "4" : "6"}`}>
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Mobile Number{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="mobile_number"
                                maxLength={SMALL_TEXT_LENGTH}
                                disabled
                                className={`form-control font-size-15 rounded-1 ${errors.mobile_number && touched.mobile_number ? "is-invalid input-box-error" : ""}`}
                              />
                              <ErrorMessage
                                name="mobile_number"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Reporting Employee */}
                          <div className="col-6">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Reporting Employee
                              </label>
                              <FormikCustomSearchDropdown
                                name="reporting_member"
                                options={reportingEmployeeOptions}
                                value={
                                  values.reporting_member === null ||
                                    values.reporting_member === 0
                                    ? { value: "", label: "None" }
                                    : reportingEmployeeOptions.find(
                                      (o) =>
                                        o.value === values.reporting_member,
                                    ) || { value: "", label: "None" }
                                }
                                onChange={(selected: SingleValue<IOption>) => {
                                  const val =
                                    selected?.value === "" ||
                                      selected?.value === undefined
                                      ? null
                                      : Number(selected.value);
                                  setFieldValue("reporting_member", val, true);
                                }}
                              />
                              <ErrorMessage
                                name="reporting_member"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Department */}
                          <div className="col-6">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Department
                              </label>
                              {canAddDepartment && (
                                <span
                                  className="ms-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    setIsOpenAddDepartmentModal(true)
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="currentColor"
                                  >
                                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                  </svg>
                                </span>
                              )}
                              <FormikCustomSearchDropdown
                                name="department"
                                options={departmentOptions}
                                value={departmentOptions.find(
                                  (o) =>
                                    o.value ===
                                    (values.department === ""
                                      ? ""
                                      : Number(values.department)),
                                )}
                                onChange={(selected: SingleValue<IOption>) => {
                                  const val =
                                    selected?.value === "" ||
                                      selected?.value === undefined
                                      ? ""
                                      : Number(selected.value);
                                  setFieldValue("department", val, true);
                                }}
                              />
                              <ErrorMessage
                                name="department"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Allowed Expense Types */}
                          {companyTeamInfo.company_flag != 1 && (
                            <div className="col-6">
                              <div className="form-group">
                                <label className="pb-2 form_label">
                                  Allowed Expense Types
                                </label>
                                <CustomSearchMultiSelectDropdown
                                  options={expenseTypeOptions}
                                  value={expenseTypeOptions.filter((opt) =>
                                    (values.expense_types ?? []).includes(
                                      opt.value,
                                    ),
                                  )}
                                  onChange={(selected) =>
                                    setFieldValue(
                                      "expense_types",
                                      selected.map((s) => s.value),
                                    )
                                  }
                                />
                                <ErrorMessage
                                  name="expense_types"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Aadhar Card Number
                              </label>

                              <Field
                                type="text"
                                name="aadhar_card_number"
                                maxLength={12}
                                placeholder="Enter Aadhar Number"
                                className={`form-control font-size-15 rounded-1 ${errors.aadhar_card_number &&
                                    touched.aadhar_card_number
                                    ? "is-invalid input-box-error"
                                    : ""
                                  }`}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  setFieldValue("aadhar_card_number", val);
                                }}
                              />

                              <ErrorMessage
                                name="aadhar_card_number"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* PAN Card Number */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                PAN Card Number
                              </label>

                              <Field
                                type="text"
                                name="pan_card_number"
                                maxLength={10}
                                placeholder="ABCDE1234F"
                                className={`form-control font-size-15 rounded-1 ${errors.pan_card_number &&
                                    touched.pan_card_number
                                    ? "is-invalid input-box-error"
                                    : ""
                                  }`}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const val = e.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, "");

                                  setFieldValue("pan_card_number", val);
                                }}
                              />

                              <ErrorMessage
                                name="pan_card_number"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Date Of Joining */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Date Of Joining
                              </label>

                              <Field
                                type="date"
                                name="date_of_joining"
                                className={`form-control font-size-15 rounded-1 ${errors.date_of_joining &&
                                    touched.date_of_joining
                                    ? "is-invalid input-box-error"
                                    : ""
                                  }`}
                              />

                              <ErrorMessage
                                name="date_of_joining"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Date Of Birth */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Date Of Birth
                              </label>

                              <Field
                                type="date"
                                name="date_of_birth"
                                className={`form-control font-size-15 rounded-1 ${errors.date_of_birth &&
                                    touched.date_of_birth
                                    ? "is-invalid input-box-error"
                                    : ""
                                  }`}
                              />

                              <ErrorMessage
                                name="date_of_birth"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {/* Employee PF No */}
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Employee PF No
                              </label>

                              <Field
                                type="text"
                                name="employee_pf_no"
                                placeholder="Enter PF Number"
                                className={`form-control font-size-15 rounded-1 ${errors.employee_pf_no &&
                                    touched.employee_pf_no
                                    ? "is-invalid input-box-error"
                                    : ""
                                  }`}
                              />

                              <ErrorMessage
                                name="employee_pf_no"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div
                          className="col-12 pt-4 d-flex justify-content-end modal-buttons"
                          style={{ paddingRight: "20px" }}
                        >
                          <button
                            className="modal-button1"
                            onClick={onHide}
                            type="button"
                          >
                            Close
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                            style={{ backgroundColor: "#f58634" }}
                            disabled={isSubmitting}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* ── ATTENDANCE & SALARY TAB ── */}
            {activeTab === "attendance" && (
              <Formik
                enableReinitialize
                initialValues={attendanceValues}
                validationSchema={attendanceValidationSchema}
                onSubmit={handleAttendanceSubmit}
              >
                {({ errors, touched, isSubmitting, setFieldValue, values }) => (
                  <Form>
                    <div className="mt-3 d-flex justify-content-center">
                      <div className="mb-3 py-4 w-100">
                        <div className="row mx-0 px-2 gy-3 etm-section-scroll">
                          {/* ── Salary ── */}
                          {planId !== 1 && (
                            <>
                              <SectionTitle title="Machine" />

                              {/* Salary Type */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Face ID
                                  </label>
                                  <Field
                                    type="text"
                                    name="face_ids"
                                    placeholder="41848fee,54854dde"
                                    className="form-control font-size-15 rounded-1"
                                  />
                                  <ErrorMessage
                                    name="face_ids"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {/* ── Time Settings (plan > 1 only) ── */}
                          {planId !== 1 && (
                            <>
                              <SectionTitle title="Time Settings" />

                              {/* Daily In Time */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Daily In Time
                                  </label>
                                  <Field
                                    type="time"
                                    name="daily_in_time"
                                    className={`form-control font-size-15 rounded-1 ${errors.daily_in_time && touched.daily_in_time ? "is-invalid" : ""}`}
                                  />
                                  <ErrorMessage
                                    name="daily_in_time"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Daily Out Time */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Daily Out Time
                                  </label>
                                  <Field
                                    type="time"
                                    name="daily_out_time"
                                    className={`form-control font-size-15 rounded-1 ${errors.daily_out_time && touched.daily_out_time ? "is-invalid" : ""}`}
                                  />
                                  <ErrorMessage
                                    name="daily_out_time"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Total Daily Working Hours */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Total Daily Working Hours
                                  </label>
                                  <TimepickerField
                                    value={values.daily_working_hours || ""}
                                    onChange={(v) =>
                                      setFieldValue("daily_working_hours", v)
                                    }
                                    hasError={
                                      !!(
                                        errors.daily_working_hours &&
                                        touched.daily_working_hours
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="daily_working_hours"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Total Daily Break Hours */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Total Daily Break Hours
                                  </label>
                                  <TimepickerField
                                    value={values.daily_break_hours || ""}
                                    onChange={(v) =>
                                      setFieldValue("daily_break_hours", v)
                                    }
                                    hasError={
                                      !!(
                                        errors.daily_break_hours &&
                                        touched.daily_break_hours
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="daily_break_hours"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Min Present Hours */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Min Present Hours
                                  </label>
                                  <TimepickerField
                                    value={values.min_present_hours || ""}
                                    onChange={(v) =>
                                      setFieldValue("min_present_hours", v)
                                    }
                                    hasError={
                                      !!(
                                        errors.min_present_hours &&
                                        touched.min_present_hours
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="min_present_hours"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* ── NEW: Half Day Hour ── */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Half Day Hour
                                  </label>
                                  <TimepickerField
                                    value={values.half_day_hours || ""}
                                    onChange={(v) =>
                                      setFieldValue("half_day_hours", v)
                                    }
                                    hasError={
                                      !!(
                                        errors.half_day_hours &&
                                        touched.half_day_hours
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="half_day_hours"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Grace Period
                                  </label>
                                  <Field
                                    type="text"
                                    name="grace_period"
                                    placeholder="e.g. 20"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      numericOnChange(
                                        e,
                                        "grace_period",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="grace_period"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {planId !== 1 && (
                            <>
                              {/* ── Attendance Settings ── */}
                              <SectionTitle title="Attendance Settings" />

                              {/* Compulsory Attendance */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Compulsary Attendance
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="compulsary_attendance"
                                    options={yesNoOptions}
                                    value={yesNoOptions.find(
                                      (o) =>
                                        o.value ===
                                        String(values.compulsary_attendance),
                                    )}
                                    className={
                                      errors.compulsary_attendance &&
                                        touched.compulsary_attendance
                                        ? "is-invalid input-box-error"
                                        : ""
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) =>
                                      setFieldValue(
                                        "compulsary_attendance",
                                        selected?.value ?? "0",
                                        true,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="compulsary_attendance"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Compulsory Image Attendance */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Compulsary Image Attendance
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="compulsary_attendance_image"
                                    options={yesNoOptions}
                                    value={yesNoOptions.find(
                                      (o) =>
                                        o.value ===
                                        String(
                                          values.compulsary_attendance_image,
                                        ),
                                    )}
                                    className={
                                      errors.compulsary_attendance_image &&
                                        touched.compulsary_attendance_image
                                        ? "is-invalid input-box-error"
                                        : ""
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) =>
                                      setFieldValue(
                                        "compulsary_attendance_image",
                                        selected?.value ?? "0",
                                        true,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="compulsary_attendance_image"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Week Off Days */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Week Off Days
                                  </label>
                                  <CustomSearchMultiSelectDropdown
                                    options={weekOffDaysOptions}
                                    value={weekOffDaysOptions.filter(
                                      (opt) =>
                                        Array.isArray(values.week_off_days) &&
                                        values.week_off_days.includes(
                                          Number(opt.value),
                                        ),
                                    )}
                                    onChange={(selected) =>
                                      setFieldValue(
                                        "week_off_days",
                                        selected.map((item) => item.value),
                                      )
                                    }
                                    placeholder="Select week off days..."
                                  />
                                  <ErrorMessage
                                    name="week_off_days"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {/* ── Salary ── */}
                          {planId !== 1 && (
                            <>
                              <SectionTitle title="Salary" />

                              {/* Salary Type */}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Salary Type
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="salary_type"
                                    options={salaryTypeOptions}
                                    value={
                                      salaryTypeOptions.find(
                                        (o) => o.value === values.salary_type,
                                      ) || null
                                    }
                                    className={
                                      errors.salary_type && touched.salary_type
                                        ? "is-invalid"
                                        : ""
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) => {
                                      setFieldValue(
                                        "salary_type",
                                        selected
                                          ? Number(selected.value)
                                          : null,
                                      );
                                      setFieldValue(
                                        "salary_amount_type_wise",
                                        "",
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name="salary_type"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              {/* Per-type salary amount */}
                              {values.salary_type && (
                                <div className="col-4">
                                  <div className="form-group">
                                    <label className="pb-2 form_label">
                                      {values.salary_type === 1 &&
                                        "Per Hour Salary"}
                                      {values.salary_type === 2 &&
                                        "Per Day Salary"}
                                      {values.salary_type === 3 &&
                                        "Per Month Salary"}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <Field
                                      type="text"
                                      name="salary_amount_type_wise"
                                      maxLength={SMALL_TEXT_LENGTH}
                                      className={`form-control font-size-15 rounded-1 ${errors.salary_amount_type_wise && touched.salary_amount_type_wise ? "is-invalid" : ""}`}
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                      ) =>
                                        numericOnChange(
                                          e,
                                          "salary_amount_type_wise",
                                          setFieldValue,
                                        )
                                      }
                                    />
                                    <ErrorMessage
                                      name="salary_amount_type_wise"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Salary Calculation Month Count
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="salary_cal_month_count"
                                    options={salaryCalMounthCounteOptions}
                                    value={
                                      salaryCalMounthCounteOptions.find(
                                        (o) =>
                                          Number(o.value) ===
                                          Number(values.salary_cal_month_count),
                                      ) || null
                                    }
                                    className={
                                      errors.salary_cal_month_count &&
                                        touched.salary_cal_month_count
                                        ? "is-invalid"
                                        : ""
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) => {
                                      setFieldValue(
                                        "salary_cal_month_count",
                                        selected
                                          ? Number(selected.value)
                                          : null,
                                      );
                                    }}
                                  />
                                  {/* <FormikCustomSearchDropdown
                                    name="salary_cal_month_count"
                                    options={salaryCalMounthCounteOptions}
                                    value={
                                      salaryCalMounthCounteOptions.find(
                                        (o) => String(o.value) == String(values.salary_cal_month_count)
                                      ) || null
                                    }
                                    onChange={(selected: SingleValue<IOption>) =>
                                      setFieldValue("salary_cal_month_count", selected?.value ?? "")
                                    }
                                  /> */}
                                  <ErrorMessage
                                    name="salary_cal_month_count"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {/* ── Salary Structure ── */}
                          {Number(values.salary_type) === 3 && planId !== 1 && (
                            <>
                              <SectionTitle title="Salary Structure" />

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Basic + D.A. (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="basic_da"
                                    placeholder="e.g. 15000"
                                    className="form-control font-size-15 rounded-1"
                                    value={values.basic_da || ""}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );

                                      if ((val.match(/\./g) || []).length > 1) {
                                        val = val.slice(0, -1);
                                      }

                                      setFieldValue("basic_da", val);
                                      updateSalaryComponents(
                                        { basic_da: val },
                                        values,
                                        setFieldValue,
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name="basic_da"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    HRA (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="hra"
                                    placeholder="e.g. 6000"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      if ((val.match(/\./g) || []).length > 1) {
                                        val = val.slice(0, -1);
                                      }
                                      setFieldValue("hra", val);
                                      updateSalaryComponents(
                                        { hra: val },
                                        values,
                                        setFieldValue,
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name="hra"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Medical Allowance (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="medical_allowance"
                                    placeholder="e.g. 1250"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      if ((val.match(/\./g) || []).length > 1) {
                                        val = val.slice(0, -1);
                                      }
                                      setFieldValue("medical_allowance", val);
                                      updateSalaryComponents(
                                        { medical_allowance: val },
                                        values,
                                        setFieldValue,
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name="medical_allowance"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Conveyance Allowance (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="conveyance_allowance"
                                    placeholder="e.g. 1600"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      if ((val.match(/\./g) || []).length > 1) {
                                        val = val.slice(0, -1);
                                      }
                                      setFieldValue("conveyance_allowance", val);
                                      updateSalaryComponents(
                                        { conveyance_allowance: val },
                                        values,
                                        setFieldValue,
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name="conveyance_allowance"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Special Allowance (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="special_allowance"
                                    placeholder="e.g. 2000"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      if ((val.match(/\./g) || []).length > 1) {
                                        val = val.slice(0, -1);
                                      }
                                      setFieldValue("special_allowance", val);
                                      updateSalaryComponents(
                                        { special_allowance: val },
                                        values,
                                        setFieldValue,
                                      );
                                    }}
                                  />
                                  <ErrorMessage
                                    name="special_allowance"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Monthly CTC (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="ctc"
                                    placeholder="e.g. 30000"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      numericOnChange(e, "ctc", setFieldValue)
                                    }
                                  />
                                  <ErrorMessage
                                    name="ctc"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {planId !== 1 && (
                            <>
                              {/* ── Overtime ── */}
                              <SectionTitle title="Overtime" />

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Minimum Overtime Hour (In Hours)
                                  </label>
                                  <TimepickerField
                                    value={values.min_overtime_hours || ""}
                                    onChange={(v) =>
                                      setFieldValue("min_overtime_hours", v)
                                    }
                                    hasError={
                                      !!(
                                        errors.min_overtime_hours &&
                                        touched.min_overtime_hours
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="min_overtime_hours"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Overtime Amount Per Hour (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="overtime_amount_per_hour"
                                    placeholder="e.g. 100"
                                    className={`form-control font-size-15 rounded-1 ${errors.overtime_amount_per_hour && touched.overtime_amount_per_hour ? "is-invalid" : ""}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      numericOnChange(
                                        e,
                                        "overtime_amount_per_hour",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="overtime_amount_per_hour"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Maximum OT (Hours)
                                  </label>
                                  <TimepickerField
                                    value={values.approve_ot_hours || ""}
                                    onChange={(v) =>
                                      setFieldValue("approve_ot_hours", v)
                                    }
                                    hasError={
                                      !!(
                                        errors.approve_ot_hours &&
                                        touched.approve_ot_hours
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="approve_ot_hours"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <FormikStaticSelect
                                    name="regular_ot_type"
                                    label="Regular OT Rate Option"
                                    options={otRateTypeOptions}
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <FormikStaticSelect
                                    name="extra_ot_type"
                                    label="Extra OT Rate Option"
                                    options={otRateTypeOptions}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {planId !== 1 && (
                            <>
                              {/* ── Sandwich Rule ── */}
                              <SectionTitle title="Sandwich Rule" />
                              {/* 
                          <div className="col-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">Sandwich Rule</label>
                              <FormikCustomSearchDropdown
                                name="sandwich_rule"
                                options={yesNoOptions}
                                value={yesNoOptions.find((o) => o.value === String(values.sandwich_rule))}
                                onChange={(selected: SingleValue<IOption>) =>
                                  setFieldValue("sandwich_rule", selected?.value ?? "0")
                                }
                              />
                              <ErrorMessage name="sandwich_rule" component="div" className="field-error text-danger" />
                            </div>
                          </div> */}

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Sandwich Rule Applied On
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="sandwich_rule_applied"
                                    options={sandwichRuleAppliedOn}
                                    value={
                                      sandwichRuleAppliedOn.find(
                                        (o) =>
                                          Number(o.value) ==
                                          Number(values.sandwich_rule_applied),
                                      ) || null
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) =>
                                      setFieldValue(
                                        "sandwich_rule_applied",
                                        selected?.value ?? "",
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="sandwich_rule_applied"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Sandwich Rule Type
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="sandwich_rule_type"
                                    options={sandwichRuleTypeOptions}
                                    value={
                                      sandwichRuleTypeOptions.find(
                                        (o) =>
                                          String(o.value) ===
                                          String(values.sandwich_rule_type),
                                      ) || null
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) =>
                                      setFieldValue(
                                        "sandwich_rule_type",
                                        selected?.value ?? "",
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="sandwich_rule_type"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {planId !== 1 && (
                            <>
                              {/* ── Bonus & Incentive ── */}
                              <SectionTitle title="Bonus & Incentive" />

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Bonus Type
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="bonus_type"
                                    options={bonusTypeOptions}
                                    value={
                                      bonusTypeOptions.find(
                                        (o) =>
                                          String(o.value) ===
                                          String(values.bonus_type),
                                      ) || null
                                    }
                                    onChange={(
                                      selected: SingleValue<IOption>,
                                    ) =>
                                      setFieldValue(
                                        "bonus_type",
                                        selected?.value ?? "",
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="bonus_type"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Bonus Percentage (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="bonus_percentage"
                                    placeholder="e.g. 10"
                                    className={`form-control font-size-15 rounded-1 ${errors.bonus_percentage && touched.bonus_percentage ? "is-invalid" : ""}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "bonus_percentage",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="bonus_percentage"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Performance Incentive (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="performance_incentive"
                                    placeholder="e.g. 500"
                                    className={`form-control font-size-15 rounded-1 ${errors.performance_incentive && touched.performance_incentive ? "is-invalid" : ""}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      numericOnChange(
                                        e,
                                        "performance_incentive",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="performance_incentive"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {planId !== 1 && (
                            <>
                              {/* ── Earnings ── */}
                              <SectionTitle title="Earnings" />

                              {(
                                [
                                  "earning_first",
                                  "earning_second",
                                  "earning_third",
                                ] as const
                              ).map((field, i) => (
                                <div className="col-4" key={field}>
                                  <div className="form-group">
                                    <label className="pb-2 form_label">
                                      Earning {["First", "Second", "Third"][i]}{" "}
                                      (₹)
                                    </label>
                                    <Field
                                      type="text"
                                      name={field}
                                      placeholder="e.g. 1000"
                                      className="form-control font-size-15 rounded-1"
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                      ) =>
                                        numericOnChange(e, field, setFieldValue)
                                      }
                                    />
                                    <ErrorMessage
                                      name={field}
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {planId !== 1 && (
                            <>
                              {/* ── Deductions ── */}

                              <SectionTitle title="Deductions" />

                              {(
                                [
                                  "deduction_first",
                                  "deduction_second",
                                  "deduction_third",
                                ] as const
                              ).map((field, i) => (
                                <div className="col-4" key={field}>
                                  <div className="form-group">
                                    <label className="pb-2 form_label">
                                      Deduction{" "}
                                      {["First", "Second", "Third"][i]} (₹)
                                    </label>
                                    <Field
                                      type="text"
                                      name={field}
                                      placeholder="e.g. 200"
                                      className="form-control font-size-15 rounded-1"
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                      ) =>
                                        numericOnChange(e, field, setFieldValue)
                                      }
                                    />
                                    <ErrorMessage
                                      name={field}
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          {planId !== 1 && (
                            <>
                              {/* ── PF / Tax / Insurance ── */}
                              <SectionTitle title="PF / Tax / Insurance" />

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    PF Percentage (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="pf_percentage"
                                    placeholder="e.g. 12"
                                    className={`form-control font-size-15 rounded-1 ${errors.pf_percentage && touched.pf_percentage ? "is-invalid" : ""}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "pf_percentage",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="pf_percentage"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Company PF Percentage (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="company_pf_percentage"
                                    placeholder="e.g. 12"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "company_pf_percentage",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="company_pf_percentage"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Pradhan Mantri PF Percentage (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="pm_pf_percentage"
                                    placeholder="e.g. 1.16"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "pm_pf_percentage",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="pm_pf_percentage"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    TDS Percentage (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="tds_percentage"
                                    placeholder="e.g. 10"
                                    className={`form-control font-size-15 rounded-1 ${errors.tds_percentage && touched.tds_percentage ? "is-invalid" : ""}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "tds_percentage",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="tds_percentage"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Insurance Amount (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="insurance_amount"
                                    placeholder="e.g. 500"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      numericOnChange(
                                        e,
                                        "insurance_amount",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="insurance_amount"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    PT Amount (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="pt_amount"
                                    placeholder="e.g. 200"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      numericOnChange(
                                        e,
                                        "pt_amount",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="pt_amount"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    ESI Company Side (₹)
                                  </label>
                                  <Field
                                    type="text"
                                    name="esi_company_side"
                                    placeholder="e.g. 3.25"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "esi_company_side",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="esi_company_side"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    ESI Employee Side Percentage (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="esi_employee_side_percentage"
                                    placeholder="e.g. 0.75"
                                    className={`form-control font-size-15 rounded-1 ${errors.esi_employee_side_percentage && touched.esi_employee_side_percentage ? "is-invalid" : ""}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "esi_employee_side_percentage",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="esi_employee_side_percentage"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-4">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Gratuity Calculation (%)
                                  </label>
                                  <Field
                                    type="text"
                                    name="gratuity_calculation"
                                    placeholder="e.g. 4.81"
                                    className="form-control font-size-15 rounded-1"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      percentageOnChange(
                                        e,
                                        "gratuity_calculation",
                                        setFieldValue,
                                      )
                                    }
                                  />
                                  <ErrorMessage
                                    name="gratuity_calculation"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Buttons */}
                        <div
                          className="col-12 pt-4 d-flex justify-content-end modal-buttons"
                          style={{ paddingRight: "20px" }}
                        >
                          <button
                            className="modal-button1"
                            onClick={onHide}
                            type="button"
                          >
                            Close
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                            style={{ backgroundColor: "#f58634" }}
                            disabled={isSubmitting}
                          >
                            {values.payroll_id == null ? "Create" : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* ── LATE IN & EARLY OUT PENALTY RULES TAB ── */}
            {activeTab === "penalty" && (
              <Formik
                enableReinitialize
                initialValues={attendanceValues}
                onSubmit={handleAttendanceSubmit}
              >
                {({ values, setFieldValue, isSubmitting }) => (
                  <Form>
                    <div className="row g-3">
                      <div className="col-12 mb-2">
                        <h6 className="fw-bold border-bottom pb-2">
                          Late In & Early Out Penalty Rules
                        </h6>
                      </div>

                      {/* Late In Rules */}
                      <div className="col-4">
                        <div className="form-group">
                          <label className="pb-2 form_label">
                            Allowed Late In Count (Per Month)
                          </label>
                          <Field
                            type="number"
                            name="late_in_allowed_count"
                            placeholder="e.g. 3"
                            className="form-control font-size-15 rounded-1"
                          />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <FormikStaticSelect
                            name="late_in_penalty_type"
                            label="Late In Penalty Type"
                            options={penaltyTypeOptions}
                          />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <label className="pb-2 form_label">
                            Late In Penalty Value
                          </label>
                          <Field
                            type="number"
                            step="any"
                            name="late_in_penalty_value"
                            placeholder="Penalty Hours or Amount"
                            className="form-control font-size-15 rounded-1"
                          />
                        </div>
                      </div>

                      {/* Early Out Rules */}
                      <div className="col-4">
                        <div className="form-group">
                          <label className="pb-2 form_label">
                            Allowed Early Out Count (Per Month)
                          </label>
                          <Field
                            type="number"
                            name="early_out_allowed_count"
                            placeholder="e.g. 3"
                            className="form-control font-size-15 rounded-1"
                          />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <FormikStaticSelect
                            name="early_out_penalty_type"
                            label="Early Out Penalty Type"
                            options={penaltyTypeOptions}
                          />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <label className="pb-2 form_label">
                            Early Out Penalty Value
                          </label>
                          <Field
                            type="number"
                            step="any"
                            name="early_out_penalty_value"
                            placeholder="Penalty Hours or Amount"
                            className="form-control font-size-15 rounded-1"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-12 text-end mt-4">
                        <button
                          className="modal-button1"
                          onClick={onHide}
                          type="button"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                          style={{ backgroundColor: "#f58634" }}
                          disabled={isSubmitting}
                        >
                          {values.payroll_id == null ? "Create" : "Save"}
                        </button>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* ── HOURLY LEAVE RULES TAB ── */}
            {activeTab === "hourly_leave" && (
              <Formik
                enableReinitialize
                initialValues={attendanceValues}
                onSubmit={handleAttendanceSubmit}
              >
                {({ values, setFieldValue, isSubmitting }) => (
                  <Form>
                    <div className="row g-3">
                      <div className="col-12 mb-2">
                        <h6 className="fw-bold border-bottom pb-2">
                          Hourly Leave Free Allowance Rules
                        </h6>
                      </div>

                      <div className="col-6">
                        <div className="form-group">
                          <label className="pb-2 form_label">
                            Allowed Free Hourly Leave Limit (Hours / Month)
                          </label>
                          <Field
                            type="text"
                            name="hourly_leave_allowed_hours"
                            placeholder="e.g. 04:00 or 4"
                            className="form-control font-size-15 rounded-1"
                          />
                          <small className="text-muted mt-1 d-block">
                            Hourly leaves within this limit will be automatically credited to working time so the employee is not deducted.
                          </small>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-12 text-end mt-4">
                        <div className="modal-footer px-0 border-top pt-3">
                          <button
                            className="modal-button1"
                            onClick={onHide}
                            type="button"
                          >
                            Close
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                            style={{ backgroundColor: "#f58634" }}
                            disabled={isSubmitting}
                          >
                            {values.payroll_id == null ? "Create" : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>

        {/* Add Department Modal */}
        {isOpenAddDepartmentModal && (
          <AddCategoryModal
            show={isOpenAddDepartmentModal}
            onHide={() => {
              setIsOpenAddDepartmentModal(false);
              fetchDepartmentsApi(setDepartments);
            }}
            title="Add Department"
            placeholder="Enter Department"
            btn1="Cancel"
            btn2="Add"
            displayClearButton={true}
            payloadKey="addDepartment"
          />
        )}
      </React.Fragment>
    </>
  );
};

export default EditTeamMemberView;
