import { toast } from "react-toastify";
import * as Yup from "yup";
import { convert12To24, formatDate, formatDateAndTime, formatTime } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { ITaskView } from "../../left-side/header/Setting/taskList/TaskListController";
import { IStageStatusView } from "../task-chat/TaskChatRightController";

export interface ITaskCreate {
  id: number;
  assigned_team_member: number | string;
  task_enddate: string;
  task_fromdate: string;
  created_date_time?: string;
  task_type?: number;
  task_priority?: number;
  task_template?: number | string | undefined;
  task_title?: string;
  task_remark?: string;
  task_category_id?: number;
  task_selected_date?: string;
  selected_task_days?: string;
  messageId?: number | string;
  contactId?: number | string;
  referenceTable?: string;
  task_attechment?: any;
  is_notification_sand_wp?: number;
  is_notification_sand_email?: number;
  reference_contact?: number | string;
  task_status: number | undefined,
  column_number_1: number | string;
  column_number_2: number | string;
  column_number_3: number | string;
  column_number_4: number | string;
  column_number_5: number | string;
  column_text_1: string;
  column_text_2: string;
  column_text_3: string;
  column_text_4: string;
  column_text_5: string;
  column_text_area_1: string;
  column_text_area_2: string;
  column_text_area_3: string;
  column_text_area_4: string;
  column_text_area_5: string;
  column_date_1: string;
  column_date_2: string;
  column_date_3: string;
  column_date_4: string;
  column_date_5: string;
  column_date_and_time_1: string;
  column_date_and_time_2: string;
  column_date_and_time_3: string;
  column_date_and_time_4: string;
  column_date_and_time_5: string;
  column_time_1: string;
  column_time_2: string;
  column_time_3: string;
  column_time_4: string;
  column_time_5: string;
  column_switch_1: number | boolean;
  column_switch_2: number | boolean;
  column_switch_3: number | boolean;
  column_switch_4: number | boolean;
  column_switch_5: number | boolean;
  column_decimal_1: number | string;
  column_decimal_2: number | string;
  column_decimal_3: number | string;
  column_decimal_4: number | string;
  column_decimal_5: number | string;
  column_dropdown_1: string;
  column_dropdown_2: string;
  column_dropdown_3: string;
  column_dropdown_4: string;
  column_dropdown_5: string;
  column_radio_1: string;
  column_radio_2: string;
  column_radio_3: string;
  column_radio_4: string;
  column_radio_5: string;
  task_column_number_1: number | string;
  task_column_number_2: number | string;
  task_column_number_3: number | string;
  task_column_number_4: number | string;
  task_column_number_5: number | string;
  task_column_text_1: string;
  task_column_text_2: string;
  task_column_text_3: string;
  task_column_text_4: string;
  task_column_text_5: string;
  task_column_text_area_1: string;
  task_column_text_area_2: string;
  task_column_text_area_3: string;
  task_column_text_area_4: string;
  task_column_text_area_5: string;
  task_column_date_1: string;
  task_column_date_2: string;
  task_column_date_3: string;
  task_column_date_4: string;
  task_column_date_5: string;
  task_column_date_and_time_1: string;
  task_column_date_and_time_2: string;
  task_column_date_and_time_3: string;
  task_column_date_and_time_4: string;
  task_column_date_and_time_5: string;
  task_column_time_1: string;
  task_column_time_2: string;
  task_column_time_3: string;
  task_column_time_4: string;
  task_column_time_5: string;
  task_column_switch_1: number | boolean;
  task_column_switch_2: number | boolean;
  task_column_switch_3: number | boolean;
  task_column_switch_4: number | boolean;
  task_column_switch_5: number | boolean;
  task_column_decimal_1: number | string;
  task_column_decimal_2: number | string;
  task_column_decimal_3: number | string;
  task_column_decimal_4: number | string;
  task_column_decimal_5: number | string;
  task_column_dropdown_1: string;
  task_column_dropdown_2: string;
  task_column_dropdown_3: string;
  task_column_dropdown_4: string;
  task_column_dropdown_5: string;
  task_column_radio_1: string;
  task_column_radio_2: string;
  task_column_radio_3: string;
  task_column_radio_4: string;
  task_column_radio_5: string;
  task_column_attechments_1?: File | string | null;
  task_column_attechments_2?: File | string | null;
  task_column_attechments_3?: File | string | null;
  task_column_attechments_4?: File | string | null;
  task_column_attechments_5?: File | string | null;
}

export interface ITaskTypeView {
  id: number | string;
  type_name: string;
}

export const createTaskInitialValues = (
  productToEdit: ITaskView | undefined,
): ITaskCreate => {
  if (!productToEdit) {
    return {
      id: 0,
      assigned_team_member: "",
      task_enddate: "",
      task_fromdate: "",
      created_date_time: "",
      task_title: "",
      task_remark: "",
      task_category_id: 0,
      task_priority: 1,
      task_type: 5,
      task_selected_date: "",
      selected_task_days: "",
      messageId: "",
      contactId: "",
      referenceTable: "",
      task_attechment: "",
      is_notification_sand_wp: 0,
      is_notification_sand_email: 0,
      reference_contact: "",
      task_status: 0,
      task_column_attechments_1: "",
      task_column_attechments_2: "",
      task_column_attechments_3: "",
      task_column_attechments_4: "",
      task_column_attechments_5: ""

    };
  }

  return {
    id: parseInt(String(productToEdit.id)) || 0,
    assigned_team_member: productToEdit.assigned_team_member || "",
    task_enddate: formatDateAndTime(productToEdit.task_enddate) || "",
    task_fromdate: formatDateAndTime(productToEdit.task_fromdate) || "",
    task_category_id: parseInt(String(productToEdit.task_category_id)) || 0,
    task_template: parseInt(String(productToEdit.task_template)) || 0,
    task_priority: parseInt(String(productToEdit.task_priority)) || 1,
    task_type: parseInt(String(productToEdit.task_type)) || 5,
    task_title: productToEdit.task_title || "",
    task_remark: productToEdit.task_remark || "",
    task_selected_date: productToEdit.task_selected_date || "",
    selected_task_days: String(productToEdit.selected_task_days) || "",
    created_date_time: productToEdit.created_date_time || "",
    task_attechment: productToEdit.task_attechment || "",
    is_notification_sand_wp:
      parseInt(String(productToEdit.is_notification_sand_wp)) || 0,
    is_notification_sand_email:
      parseInt(String(productToEdit.is_notification_sand_email)) || 0,
    reference_contact: productToEdit.reference_contact || "",
    task_status: parseInt(String(productToEdit.task_priority)) || 0,
    column_number_1: productToEdit?.column_number_1 || "",
    column_number_2: productToEdit?.column_number_2 || "",
    column_number_3: productToEdit?.column_number_3 || "",
    column_number_4: productToEdit?.column_number_4 || "",
    column_number_5: productToEdit?.column_number_5 || "",
    column_text_1: productToEdit?.column_text_1 || "",
    column_text_2: productToEdit?.column_text_2 || "",
    column_text_3: productToEdit?.column_text_3 || "",
    column_text_4: productToEdit?.column_text_4 || "",
    column_text_5: productToEdit?.column_text_5 || "",
    column_text_area_1: productToEdit?.column_text_area_1 || "",
    column_text_area_2: productToEdit?.column_text_area_2 || "",
    column_text_area_3: productToEdit?.column_text_area_3 || "",
    column_text_area_4: productToEdit?.column_text_area_4 || "",
    column_text_area_5: productToEdit?.column_text_area_5 || "",
    column_date_1: productToEdit?.column_date_1 ? formatDate(productToEdit?.column_date_1) : "",
    column_date_2: productToEdit?.column_date_2 ? formatDate(productToEdit?.column_date_2) : "",
    column_date_3: productToEdit?.column_date_3 ? formatDate(productToEdit?.column_date_3) : "",
    column_date_4: productToEdit?.column_date_4 ? formatDate(productToEdit?.column_date_4) : "",
    column_date_5: productToEdit?.column_date_5 ? formatDate(productToEdit?.column_date_5) : "",
    column_date_and_time_1: productToEdit?.column_date_and_time_1
      ? formatDateAndTime(productToEdit?.column_date_and_time_1)
      : "",
    column_date_and_time_2: productToEdit?.column_date_and_time_2
      ? formatDateAndTime(productToEdit?.column_date_and_time_2)
      : "",
    column_date_and_time_3: productToEdit?.column_date_and_time_3
      ? formatDateAndTime(productToEdit?.column_date_and_time_3)
      : "",
    column_date_and_time_4: productToEdit?.column_date_and_time_4
      ? formatDateAndTime(productToEdit?.column_date_and_time_4)
      : "",
    column_date_and_time_5: productToEdit?.column_date_and_time_5
      ? formatDateAndTime(productToEdit?.column_date_and_time_5)
      : "",
    column_time_1:
      productToEdit?.column_time_1 !== "00:00:00"
        ? formatTime(productToEdit?.column_time_1)
        : "00:00 AM",
    column_time_2:
      productToEdit?.column_time_2 !== "00:00:00"
        ? formatTime(productToEdit?.column_time_2)
        : "00:00 AM",
    column_time_3:
      productToEdit?.column_time_3 !== "00:00:00"
        ? formatTime(productToEdit?.column_time_3)
        : "00:00 AM",
    column_time_4:
      productToEdit?.column_time_4 !== "00:00:00"
        ? formatTime(productToEdit?.column_time_4)
        : "00:00 AM",
    column_time_5:
      productToEdit?.column_time_5 !== "00:00:00"
        ? formatTime(productToEdit?.column_time_5)
        : "00:00 AM",
    column_switch_1: productToEdit?.column_switch_1 === 1 ? true : false,
    column_switch_2: productToEdit?.column_switch_2 === 1 ? true : false,
    column_switch_3: productToEdit?.column_switch_3 === 1 ? true : false,
    column_switch_4: productToEdit?.column_switch_4 === 1 ? true : false,
    column_switch_5: productToEdit?.column_switch_5 === 1 ? true : false,
    column_decimal_1: productToEdit?.column_decimal_1 || "",
    column_decimal_2: productToEdit?.column_decimal_2 || "",
    column_decimal_3: productToEdit?.column_decimal_3 || "",
    column_decimal_4: productToEdit?.column_decimal_4 || "",
    column_decimal_5: productToEdit?.column_decimal_5 || "",
    column_dropdown_1: productToEdit?.column_dropdown_1 || "",
    column_dropdown_2: productToEdit?.column_dropdown_2 || "",
    column_dropdown_3: productToEdit?.column_dropdown_3 || "",
    column_dropdown_4: productToEdit?.column_dropdown_4 || "",
    column_dropdown_5: productToEdit?.column_dropdown_5 || "",
    column_radio_1: productToEdit?.column_radio_1 || "",
    column_radio_2: productToEdit?.column_radio_2 || "",
    column_radio_3: productToEdit?.column_radio_3 || "",
    column_radio_4: productToEdit?.column_radio_4 || "",
    column_radio_5: productToEdit?.column_radio_5 || "",
    task_column_number_1: productToEdit?.task_column_number_1 || "",
    task_column_number_2: productToEdit?.task_column_number_2 || "",
    task_column_number_3: productToEdit?.task_column_number_3 || "",
    task_column_number_4: productToEdit?.task_column_number_4 || "",
    task_column_number_5: productToEdit?.task_column_number_5 || "",
    task_column_text_1: productToEdit?.task_column_text_1 || "",
    task_column_text_2: productToEdit?.task_column_text_2 || "",
    task_column_text_3: productToEdit?.task_column_text_3 || "",
    task_column_text_4: productToEdit?.task_column_text_4 || "",
    task_column_text_5: productToEdit?.task_column_text_5 || "",
    task_column_text_area_1: productToEdit?.task_column_text_area_1 || "",
    task_column_text_area_2: productToEdit?.task_column_text_area_2 || "",
    task_column_text_area_3: productToEdit?.task_column_text_area_3 || "",
    task_column_text_area_4: productToEdit?.task_column_text_area_4 || "",
    task_column_text_area_5: productToEdit?.task_column_text_area_5 || "",
    task_column_date_1: productToEdit?.task_column_date_1 || "",
    task_column_date_2: productToEdit?.task_column_date_2 || "",
    task_column_date_3: productToEdit?.task_column_date_3 || "",
    task_column_date_4: productToEdit?.task_column_date_4 || "",
    task_column_date_5: productToEdit?.task_column_date_5 || "",
    task_column_date_and_time_1: productToEdit?.task_column_date_and_time_1 ? productToEdit?.task_column_date_and_time_1 : "",
    task_column_date_and_time_2: productToEdit?.task_column_date_and_time_2 ? productToEdit?.task_column_date_and_time_2 : "",
    task_column_date_and_time_3: productToEdit?.task_column_date_and_time_3 ? productToEdit?.task_column_date_and_time_3 : "",
    task_column_date_and_time_4: productToEdit?.task_column_date_and_time_4 ? productToEdit?.task_column_date_and_time_4 : "",
    task_column_date_and_time_5: productToEdit?.task_column_date_and_time_5 ? productToEdit?.task_column_date_and_time_5 : "",
    task_column_time_1: convert12To24(productToEdit?.task_column_time_1),
    task_column_time_2: convert12To24(productToEdit?.task_column_time_2),
    task_column_time_3: convert12To24(productToEdit?.task_column_time_3),
    task_column_time_4: convert12To24(productToEdit?.task_column_time_4),
    task_column_time_5: convert12To24(productToEdit?.task_column_time_5),
    task_column_switch_1: productToEdit?.task_column_switch_1 === 1 ? true : false,
    task_column_switch_2: productToEdit?.task_column_switch_2 === 1 ? true : false,
    task_column_switch_3: productToEdit?.task_column_switch_3 === 1 ? true : false,
    task_column_switch_4: productToEdit?.task_column_switch_4 === 1 ? true : false,
    task_column_switch_5: productToEdit?.task_column_switch_5 === 1 ? true : false,
    task_column_decimal_1: productToEdit?.task_column_decimal_1 || "",
    task_column_decimal_2: productToEdit?.task_column_decimal_2 || "",
    task_column_decimal_3: productToEdit?.task_column_decimal_3 || "",
    task_column_decimal_4: productToEdit?.task_column_decimal_4 || "",
    task_column_decimal_5: productToEdit?.task_column_decimal_5 || "",
    task_column_dropdown_1: productToEdit?.task_column_dropdown_1 || "",
    task_column_dropdown_2: productToEdit?.task_column_dropdown_2 || "",
    task_column_dropdown_3: productToEdit?.task_column_dropdown_3 || "",
    task_column_dropdown_4: productToEdit?.task_column_dropdown_4 || "",
    task_column_dropdown_5: productToEdit?.task_column_dropdown_5 || "",
    task_column_radio_1: productToEdit?.task_column_radio_1 || "",
    task_column_radio_2: productToEdit?.task_column_radio_2 || "",
    task_column_radio_3: productToEdit?.task_column_radio_3 || "",
    task_column_radio_4: productToEdit?.task_column_radio_4 || "",
    task_column_radio_5: productToEdit?.task_column_radio_5 || "",
    task_column_attechments_1: productToEdit.task_column_attechments_1 || "",
    task_column_attechments_2: productToEdit.task_column_attechments_2 || "",
    task_column_attechments_3: productToEdit.task_column_attechments_3 || "",
    task_column_attechments_4: productToEdit.task_column_attechments_4 || "",
    task_column_attechments_5: productToEdit.task_column_attechments_5 || "",

  };
};

export const updateTarget = async (
  expenseTypeInput: ITaskCreate,
  setTargetVsIncentiveList: TReactSetState<ITaskView[]>,
  targetEditId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
  selectedButton: string | undefined,
  selectedStageStatusId: number | undefined,
  selectedPriorityId: number | undefined,
  selectedButtonDue: number | undefined,
  supportTicketFlag: number | undefined,
  customFormList: ICustomFromList[]
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const formData = new FormData();

  formData.append("editId", targetEditId?.toString() || "");
  formData.append(
    "assigned_team_member",
    expenseTypeInput.assigned_team_member?.toString() || "",
  );
  formData.append("task_enddate", expenseTypeInput.task_enddate || "");
  formData.append("task_fromdate", expenseTypeInput.task_fromdate || "");
  formData.append("task_title", expenseTypeInput.task_title || "");
  formData.append("task_remark", expenseTypeInput.task_remark || "");
  formData.append(
    "task_selected_date",
    expenseTypeInput.task_selected_date || "",
  );
  formData.append(
    "selected_task_days",
    expenseTypeInput.selected_task_days || "",
  );
  formData.append(
    "task_category_id",
    (expenseTypeInput.task_category_id || 0).toString(),
  );
  formData.append(
    "task_template",
    expenseTypeInput.task_template?.toString() || "0",
  );
  formData.append("task_type", (expenseTypeInput.task_type || 0).toString());
  formData.append(
    "task_priority",
    (expenseTypeInput.task_priority || 1).toString(),
  );
  formData.append("a_application_login_id", getUUID || "");
  formData.append(
    "is_notification_sand_wp",
    expenseTypeInput.is_notification_sand_wp?.toString() || "0",
  );
  formData.append(
    "is_notification_sand_email",
    expenseTypeInput.is_notification_sand_email?.toString() || "0",
  );
  formData.append(
    "reference_contact",
    expenseTypeInput.reference_contact?.toString() || "",
  );
  formData.append("is_support_ticket", supportTicketFlag?.toString() || "");

  // if (customFormList && customFormList.length > 0) {
  //   customFormList.forEach((field) => {
  //     const fieldValue = expenseTypeInput[field.reference_column_name as keyof ITaskCreate];
  //     formData.append(field.reference_column_name, fieldValue !== undefined && fieldValue !== null
  //       ? String(fieldValue)
  //       : "");
  //   });
  // }
  const ATTACHMENT_COLUMNS = [
    "task_column_attechments_1",
    "task_column_attechments_2",
    "task_column_attechments_3",
    "task_column_attechments_4",
    "task_column_attechments_5",
  ];

  customFormList.forEach((field) => {
    const fieldValue =
      expenseTypeInput[field.reference_column_name as keyof ITaskCreate];

    if (ATTACHMENT_COLUMNS.includes(field.reference_column_name)) {

      if (fieldValue instanceof File) {
        formData.append(field.reference_column_name, fieldValue);
      }

    } else {

      formData.append(
        field.reference_column_name,
        fieldValue !== undefined && fieldValue !== null
          ? String(fieldValue)
          : ""
      );

    }
  });
  // Only append file if a new one is selected
  if (expenseTypeInput.task_attechment instanceof File) {
    formData.append("task_attechment", expenseTypeInput.task_attechment || " ");
  }

  try {
    const { data } = await axiosInstance.post("update-task", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `${token}`,
      },
    });

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Task updated successfully!");
      setTargetVsIncentiveList((prev) =>
        prev.map((item) =>
          item.id === targetEditId ? { ...item, ...data.data } : item,
        ),
      );
      clearFormCallback();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Update Task Error:", error);
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};

export const taskTypesList = [
  { id: "1", type_name: "Daily" },
  { id: "2", type_name: "Weekly" },
  { id: "3", type_name: "Monthly" },
  { id: "4", type_name: "Yearly" },
  { id: "5", type_name: "Once" },
  { id: "6", type_name: "Repeat After Two Month" },
  { id: "7", type_name: "Repeat After Three Month" },
  { id: "9", type_name: "Repeat After Four Month" },
  { id: "8", type_name: "Repeat After Six Month" },
  { id: "10", type_name: "Repeat After Eight Month" },
];

export interface ITeamMemberWorkload {
  low: number;
  medium: number;
  high: number;
  critical: number;
  total: number;
}

export const fetchTeamMemberTaskWorkload = async (
  teamMemberIds: (number | string)[],
  getID?: string,
): Promise<Record<string, ITeamMemberWorkload>> => {
  const getUUID = getID || localStorage.getItem("UUID");

  if (!teamMemberIds || teamMemberIds.length === 0) return {};

  try {
    const response = await axiosInstance.post(
      "/get-team-member-task-workload",
      {
        a_application_login_id: getUUID,
        team_member_ids: teamMemberIds,
      },
    );

    return response.data?.data?.item || {};
  } catch (error) {
    console.error("Failed to fetch team member task workload", error);
    return {};
  }
};

export const taskPriorityList = [
  { id: "1", mode_name: "Low", color: "#36a4dd" },
  { id: "2", mode_name: "Medium", color: "#fc6e0f" },
  { id: "3", mode_name: "High", color: "#ff4d4e" },
  { id: "4", mode_name: "Critical", color: "#b30000" },
];

export const taskTemplateList = [
  { id: "1", type_name: "Contact" },
  { id: "2", type_name: "Inquiry" },
  { id: "3", type_name: "Visit" },
  { id: "4", type_name: "Product" },
  { id: "5", type_name: "Quotation" },
  { id: "6", type_name: "Sales Order" },
  { id: "7", type_name: "Sales Invoice" },
  { id: "8", type_name: "Return Sales Invoice" },
  { id: "9", type_name: "Purchase Order" },
  { id: "10", type_name: "Purchase Invoice" },
  { id: "11", type_name: "Return Purchase Invoice" },
];

export const selectWeeklyDays = [
  { id: "1", days_name: "Monday" },
  { id: "2", days_name: "Tuesday" },
  { id: "3", days_name: "Wednesday" },
  { id: "4", days_name: "Thursday" },
  { id: "5", days_name: "Friday" },
  { id: "6", days_name: "Saturday" },
  { id: "7", days_name: "Sunday" },
];

export const createTaskValidationSchema = (
  isTemplateChecked: boolean,
  supportTicketFlag?: number,
  customFormList?: ICustomFromList[]
) => {
  let schema = Yup.object().shape({
    task_category_id: Yup.number()
      // .min(1, "Task Category is Required")
      .required("Task Category is Required"),

    // task_type: Yup.number()
    //   .min(1, "Task Type is Required")
    //   .required("Task Type is Required"),

    // task_priority: Yup.number()
    //   .min(1, "Priority is Required")
    //   .required("Priority is Required"),

    // task_fromdate: Yup.string().required("Start Date is Required"),
    // task_enddate: Yup.string().required("End Date is Required"),

    task_fromdate: Yup.string().when(["task_type"], {
      is: (value: number) => value === 5,
      then: (schema) => schema.required("Start Date is Required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    task_enddate: Yup.string().when(["task_type"], {
      is: (value: number) => value === 5,
      then: (schema) => schema.required("End Date is Required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    task_title: Yup.string().required("Title is Required"),

    // mobile_number: Yup.string().required("Mobile Number is Required"),

    // task_selected_date: Yup.string().when("task_type", {
    //   is: (value: number) => ["3", "4"].includes(String(value)),
    //   then: Yup.string().required("Selected Date is Required"),
    //   otherwise: Yup.string().notRequired(),
    // }),

    // selected_task_days: Yup.string().when("task_type", {
    //   is: (value: number) => value === 2,
    //   then: Yup.string().required("Select Days is Required"),
    //   otherwise: Yup.string().notRequired(),
    // }),

    assigned_team_member: Yup.string().required("Assign User is Required"),

    task_template: isTemplateChecked
      ? Yup.number()
        .min(1, "Task Template is Required")
        .required("Task Template is Required")
      : Yup.number().notRequired(),

    // assigned_team_member and task_remark are not required
  });

  // Add support-ticket specific required fields only when flag is 1
  if (supportTicketFlag === 1) {
    schema = schema.shape({
      reference_contact: Yup.string().required("Contact is Required"),
    });
  }
  const validationSchema: any = {};
  customFormList && customFormList.forEach((item: any) => {
    if (item.required_or_not === 1) {
      switch (item.data_type) {
        case 1: // Number
          validationSchema[item.reference_column_name] = Yup.number()
            .typeError("Must be a number")
            .required("This field is required");

          break;
        case 2: // Text
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );

          break;
        case 3: // Text Area
          validationSchema[item.reference_column_name] = Yup.string()
            .trim()
            .required("This field is required");

          break;
        case 4: // Date
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );
          break;
        case 5: // DateandTime
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );
          break;
        case 6: // Time
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );
          break;
        case 7: // Checkbox        
          validationSchema[item.reference_column_name] =
            Yup.boolean().default(false);
          break;
        case 8: // decimal
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );

          break;
        case 9: // decimal
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );

          break;
        case 10: // decimal
          validationSchema[item.reference_column_name] = Yup.string().required(
            "This field is required"
          );
          break;
        case 13:
          validationSchema[item.reference_column_name] = Yup.mixed().test(
            "fileRequired",
            "This field is required",
            (value) => {
              return (
                value instanceof File ||
                (typeof value === "string" && value.trim() !== "")
              );
            }
          );
          break;
        default:
          break;
      }
    }
  });

  return schema.shape(validationSchema);
};

export const createTask = async (
  expenseTypeInput: ITaskCreate,
  setTargetVsIncentiveList: TReactSetState<ITaskView[]>,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
  selectedButton: string | undefined,
  selectedStageStatusId: number | undefined,
  selectedPriorityId: number | undefined,
  selectedButtonDue: number | undefined,
  selectedAssignmentTypeOption: string,
  supportTicketFlag: number | undefined,
  customFormList: ICustomFromList[],
  onTaskCreated?: () => void,
  setIsLoadedMessage?: any,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const formData = new FormData();

  // Append all form fields
  formData.append(
    "assigned_team_member",
    expenseTypeInput.assigned_team_member?.toString() || "",
  );
  formData.append("task_enddate", expenseTypeInput.task_enddate || "");
  formData.append("task_fromdate", expenseTypeInput.task_fromdate || "");
  formData.append("task_title", expenseTypeInput.task_title || "");
  formData.append("task_remark", expenseTypeInput.task_remark || "");
  formData.append(
    "task_selected_date",
    expenseTypeInput.task_selected_date || "",
  );
  formData.append(
    "selected_task_days",
    expenseTypeInput.selected_task_days || "",
  );
  formData.append(
    "task_category_id",
    (expenseTypeInput.task_category_id || 0).toString(),
  );
  formData.append(
    "task_priority",
    (expenseTypeInput.task_priority || 1).toString(),
  );
  formData.append(
    "task_status",
    (expenseTypeInput.task_status || 0).toString(),
  );
  formData.append("task_type", (expenseTypeInput.task_type || 0).toString());
  formData.append(
    "task_template",
    expenseTypeInput.task_template?.toString() || "0",
  );
  formData.append("reference_id", expenseTypeInput.messageId?.toString() || "");
  formData.append(
    "contact_masters_id",
    expenseTypeInput.contactId?.toString() || "",
  );
  formData.append("reference_table", expenseTypeInput.referenceTable || "");
  formData.append("team_task_assignement_type", selectedAssignmentTypeOption);
  formData.append(
    "is_notification_sand_wp",
    expenseTypeInput.is_notification_sand_wp?.toString() || "0",
  );
  formData.append(
    "is_notification_sand_email",
    expenseTypeInput.is_notification_sand_email?.toString() || "0",
  );
  formData.append(
    "reference_contact",
    expenseTypeInput.reference_contact?.toString() || "",
  );
  formData.append("a_application_login_id", getUUID || "");
  formData.append("is_support_ticket", supportTicketFlag?.toString() || "0");

  if (customFormList && customFormList.length > 0) {
    customFormList.forEach((field) => {
      const fieldValue = expenseTypeInput[field.reference_column_name as keyof ITaskCreate];

      if (fieldValue !== undefined && fieldValue !== null) {
        formData.append(field.reference_column_name, String(fieldValue));
      } else {
        formData.append(field.reference_column_name, ""); // empty field bhi bhejna zaroori hai
      }
    });
  }
  const ATTACHMENT_COLUMNS = [
    "task_column_attechments_1",
    "task_column_attechments_2",
    "task_column_attechments_3",
    "task_column_attechments_4",
    "task_column_attechments_5",
  ];

  customFormList.forEach((field) => {
    const fieldValue =
      expenseTypeInput[field.reference_column_name as keyof ITaskCreate];

    if (ATTACHMENT_COLUMNS.includes(field.reference_column_name)) {

      if (fieldValue instanceof File) {
        formData.append(field.reference_column_name, fieldValue);
      }

    } else {

      formData.append(
        field.reference_column_name,
        fieldValue !== undefined && fieldValue !== null
          ? String(fieldValue)
          : ""
      );

    }
  });

  // Append file if exists
  if (expenseTypeInput.task_attechment instanceof File) {
    formData.append("task_attechment", expenseTypeInput.task_attechment || " ");
  }

  try {
    const { data } = await axiosInstance.post("create-task", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `${token}`,
      },
    });

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Task created successfully!");
      clearFormCallback();
      onTaskCreated?.();
      setIsLoadedMessage?.((prev: boolean) => !prev);
      // Optional: refresh list
      // fetchApiTask(...);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Create Task Error:", error);
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};

export const fetchCategoryApiForProduct = async (
  setTaskCategoryList: TReactSetState<
    { id: number; task_category_name: string }[]
  >,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setTaskCategoryList([]);
    return;
  }

  const requestData = {
    table: "task_categories",
    columns: "id,task_category_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setTaskCategoryList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setTaskCategoryList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setTaskCategoryList([]);
  }
};

export const fetchTemplateName = async (
  setTaskTemplateList: TReactSetState<
    { id: number; task_template_name: string }[]
  >,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setTaskTemplateList([]);
    return;
  }

  const requestData = {
    table: "task_templete_masters",
    columns: "id,name,templete_type",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setTaskTemplateList(response.data.data);
    } else {
      // toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setTaskTemplateList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setTaskTemplateList([]);
  }
};

export const fetchStageStatusApi = async (
  stagesStatusOptions: TReactSetState<IStageStatusView[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    visiblity: "0",
    a_application_login_id: getUUID,
    action_flag: "update",
  };
  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      stagesStatusOptions([]);
    }
    stagesStatusOptions(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export interface ICustomFromList {
  id: number;
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  reference_column_name: string;
  data_sorce: string;
  form_type: number;
  min_limit: number;
  max_limit: number;
  validation_type: number;
}

export const fetchCustomInqFromApiForTask = async (
  setCustomFromList: TReactSetState<ICustomFromList[]>,
  // setDataScorce: any
  formType: number,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post(
      "getCustomFieldFrom",
      {
        a_application_login_id: Number(getUUID),
        form_type: formType
      }
    );
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCustomFromList([]);

      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setCustomFromList(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

