import * as Yup from "yup";

import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../../services/axiosInstance";

export interface ILeaveCreate {
  created_date_time?: string;
  leave_type_id: string;
  remark: string;
  leaveId: number | string;
  leave_status: number;
  attachment?: File | string | null;
  status_remark: string;
  leave_date: string;
  reporting_date: string;
  leave_duration: string;
  leave_hours: string;
  leave_minutes: string;
  start_time?: string;
  end_time?: string;
}

export interface ILeaveCreateStatus {
  leaveId: number | string;
  leave_status: number;
  status_remark: string;
}
export interface ILeaveType {
  id: string;
  leave_name: string;
}
export const createLeaveInitialValues = (
  LeaveToEdit: ILeaveCreate | any,
): any => {
  let start_time = "";
  let end_time = "";
  let remark = LeaveToEdit?.remark || "";

  // Parse start_time and end_time from remark if it matches the pattern
  if (LeaveToEdit?.leave_duration?.toString() === "4" && remark) {
    const match = remark.match(/^(\d{2}:\d{2}) to (\d{2}:\d{2}) - (.*)$/);
    if (match) {
      start_time = match[1];
      end_time = match[2];
      remark = match[3];
    }
  }

  return {
    leave_type_id: LeaveToEdit?.leave_type_id || "",
    remark: remark,
    leaveId: LeaveToEdit?.leaveId || "",
    leave_status: LeaveToEdit?.leave_status || 1,
    attachment: LeaveToEdit?.attachment || "",
    status_remark: LeaveToEdit?.status_remark || "",
    leave_hours: LeaveToEdit?.leave_hours || "",
    leave_minutes: LeaveToEdit?.leave_minutes || "",
    leave_date: LeaveToEdit?.leave_date || "",
    reporting_date: LeaveToEdit?.reporting_date || "",
    leave_duration: LeaveToEdit?.leave_duration?.toString() || "3",
    start_time: start_time,
    end_time: end_time,
  };
};

export const createLeaveValidationSchema = (
  leaveTypesList: any[],
  status?: string,
) =>
  Yup.object().shape({
    leave_type_id: Yup.string().required("Leave Type is required"),
    remark: Yup.string().required("Remark is required"),
    leave_date: Yup.string().required("Leave Date is required"),
    reporting_date: Yup.string()
      .required("Reporting Date is required")
      .test(
        "is-after-or-equal-leave-date",
        "Reporting Date must be greater than or equal to Leave Date",
        function (value) {
          const { leave_date } = this.parent;

          if (!leave_date || !value) return true;

          const leaveDate = new Date(leave_date);
          const reportingDate = new Date(value);

          return reportingDate >= leaveDate;
        },
      ),
    leave_duration: Yup.string().required("Leave Duration is required"),
    leave_hours: Yup.number().when("leave_duration", {
      is: "4",
      then: (schema) => schema.required("Hours is required").min(0).max(11),
    }),
    leave_minutes: Yup.number().when("leave_duration", {
      is: "4",
      then: (schema) => schema.required("Minutes is required").min(0).max(59),
    }),
    start_time: Yup.string().when("leave_duration", {
      is: "4",
      then: (schema) => schema.required("Start Time is required"),
    }),
    end_time: Yup.string().when("leave_duration", {
      is: "4",
      then: (schema) =>
        schema
          .required("End Time is required")
          .test(
            "is-after-start-time",
            "End Time must be greater than Start Time",
            function (value) {
              const { start_time } = this.parent;
              if (!start_time || !value) return true;

              const [startH, startM] = start_time.split(":").map(Number);
              const [endH, endM] = value.split(":").map(Number);

              return endH * 60 + endM > startH * 60 + startM;
            },
          ),
    }),
  });

export const createLeave = async (
  values: ILeaveCreate,
  setRefreshExpense: TReactSetState<boolean>,
  onHide: () => void,
  team_id?: number,
) => {
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) return;

  try {
    const requestFormData = new FormData();

    requestFormData.append("leave_type_id", values.leave_type_id);
    requestFormData.append("leave_duration", values.leave_duration);
    requestFormData.append("leave_hours", values.leave_hours);
    requestFormData.append("leave_minutes", values.leave_minutes);
    requestFormData.append("remark", values.remark);
    requestFormData.append("leave_date", values.leave_date);
    requestFormData.append("reporting_date", values.reporting_date);
    requestFormData.append("leave_status", values.leave_status.toString());
    requestFormData.append("a_application_login_id", team_id?.toString() || "");
    requestFormData.append("created_by", getUUID);

    // 🔹 IMAGE IS OPTIONAL
    if (values.attachment instanceof File) {
      requestFormData.append("attachment", values.attachment);
    }

    const { data } = await axiosInstance.post("create-leave", requestFormData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
      setRefreshExpense(true);
      onHide();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateLeave = async (
  formData: FormData,
  values: ILeaveCreate,
  setRefreshExpense: TReactSetState<boolean>,
  leaveId: number,
  onHide: () => void,
  team_id?: number,
) => {
  const token = await localStorage.getItem("token");

  try {
    const requestFormData = new FormData();

    requestFormData.append("leave_id", leaveId.toString());
    requestFormData.append("leave_type_id", values.leave_type_id);
    requestFormData.append("leave_duration", values.leave_duration);
    requestFormData.append("leave_hours", values.leave_hours);
    requestFormData.append("leave_minutes", values.leave_minutes);
    requestFormData.append("leave_date", values.leave_date);
    requestFormData.append("reporting_date", values.reporting_date);
    requestFormData.append("remark", values.remark);
    requestFormData.append("a_application_login_id", team_id?.toString() || "");

    if (values.attachment instanceof File) {
      requestFormData.append("attachment", values.attachment);
    }

    const { data } = await axiosInstance.post("update-leave", requestFormData, {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
      setRefreshExpense(true);
      onHide();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateLeaveStatus = async (
  values: ILeaveCreateStatus,
  setRefreshExpense: TReactSetState<boolean>,
  leaveId: number | undefined,
  onHide: () => void,
  leaveStatus: number,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) {
    return;
  }

  const requestDataUpdate = {
    leave_id: leaveId,
    leave_status: leaveStatus,
    status_remark: values.status_remark,
    a_application_login_id: getUUID,
  };
  try {
    const { data } = await axiosInstance.post(
      "update-leave",
      requestDataUpdate,
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        onHide();
        setRefreshExpense(true);
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
