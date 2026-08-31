import { toast } from "react-toastify";
import * as Yup from "yup";
import { formatDate, formatDateAndTime } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export interface ICreateInquiry {
  product_id: string;
  category_id: string;
  description: number | string;
  company_name: string | undefined;
  qty: string;
  // JSON array string of per-product remarks, paired with product_id.
  product_remarks: string;
  source_type_id: string;
  label_id?: string;
  static: string;
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
}
export const orderTypesInqFormCustomInquiryList = [
  { id: "1", order_type_display: "Number" },
  { id: "2", order_type_display: "Text" },
  { id: "3", order_type_display: "TextArea" },
  { id: "4", order_type_display: "Date" },
  { id: "5", order_type_display: "DateAndTime" },
  { id: "6", order_type_display: "Time" },
  { id: "7", order_type_display: "Switch" },
];
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

const formatDateForDateTimeLocal = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2 digits
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatTime = (time: string | undefined) => {
  if (!time) return "00:00 AM"; // Default value if input is empty or undefined

  const parts = time.split(":"); // Split by ":"

  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`; // Keep only HH:mm
  }

  return "00:00"; // Fallback in case of incorrect input
};

export const createInquiryInitialValues = (
  inquiryToEdit: ICreateInquiry | undefined,
  setIsSwitchActive: TReactSetState<boolean>
): ICreateInquiry => ({
  product_id: inquiryToEdit?.product_id || "",
  category_id: inquiryToEdit?.category_id || "",
  company_name: inquiryToEdit?.company_name || "",
  description: inquiryToEdit?.description || " ",
  qty: inquiryToEdit?.qty || "",
  product_remarks: inquiryToEdit?.product_remarks || "",
  static: inquiryToEdit?.static || "0",
  source_type_id: inquiryToEdit?.source_type_id || "",
  column_number_1: inquiryToEdit?.column_number_1 || "",
  column_number_2: inquiryToEdit?.column_number_2 || "",
  column_number_3: inquiryToEdit?.column_number_3 || "",
  column_number_4: inquiryToEdit?.column_number_4 || "",
  column_number_5: inquiryToEdit?.column_number_5 || "",
  column_text_1: inquiryToEdit?.column_text_1 || "",
  column_text_2: inquiryToEdit?.column_text_2 || "",
  column_text_3: inquiryToEdit?.column_text_3 || "",
  column_text_4: inquiryToEdit?.column_text_4 || "",
  column_text_5: inquiryToEdit?.column_text_5 || "",
  column_text_area_1: inquiryToEdit?.column_text_area_1 || "",
  column_text_area_2: inquiryToEdit?.column_text_area_2 || "",
  column_text_area_3: inquiryToEdit?.column_text_area_3 || "",
  column_text_area_4: inquiryToEdit?.column_text_area_4 || "",
  column_text_area_5: inquiryToEdit?.column_text_area_5 || "",
  column_date_1: inquiryToEdit?.column_date_1 ? formatDate(inquiryToEdit?.column_date_1) : "",
  column_date_2: inquiryToEdit?.column_date_2 ? formatDate(inquiryToEdit?.column_date_2) : "",
  column_date_3: inquiryToEdit?.column_date_3 ? formatDate(inquiryToEdit?.column_date_3) : "",
  column_date_4: inquiryToEdit?.column_date_4 ? formatDate(inquiryToEdit?.column_date_4) : "",
  column_date_5: inquiryToEdit?.column_date_5 ? formatDate(inquiryToEdit?.column_date_5) : "",
  column_date_and_time_1: inquiryToEdit?.column_date_and_time_1
    ? formatDateAndTime(inquiryToEdit?.column_date_and_time_1)
    : "",
  column_date_and_time_2: inquiryToEdit?.column_date_and_time_2
    ? formatDateAndTime(inquiryToEdit?.column_date_and_time_2)
    : "",
  column_date_and_time_3: inquiryToEdit?.column_date_and_time_3
    ? formatDateAndTime(inquiryToEdit?.column_date_and_time_3)
    : "",
  column_date_and_time_4: inquiryToEdit?.column_date_and_time_4
    ? formatDateAndTime(inquiryToEdit?.column_date_and_time_4)
    : "",
  column_date_and_time_5: inquiryToEdit?.column_date_and_time_5
    ? formatDateAndTime(inquiryToEdit?.column_date_and_time_5)
    : "",
  column_time_1:
    inquiryToEdit?.column_time_1 !== "00:00:00"
      ? formatTime(inquiryToEdit?.column_time_1)
      : "00:00 AM",
  column_time_2:
    inquiryToEdit?.column_time_2 !== "00:00:00"
      ? formatTime(inquiryToEdit?.column_time_2)
      : "00:00 AM",
  column_time_3:
    inquiryToEdit?.column_time_3 !== "00:00:00"
      ? formatTime(inquiryToEdit?.column_time_3)
      : "00:00 AM",
  column_time_4:
    inquiryToEdit?.column_time_4 !== "00:00:00"
      ? formatTime(inquiryToEdit?.column_time_4)
      : "00:00 AM",
  column_time_5:
    inquiryToEdit?.column_time_5 !== "00:00:00"
      ? formatTime(inquiryToEdit?.column_time_5)
      : "00:00 AM",
  column_switch_1: inquiryToEdit?.column_switch_1 === 1 ? true : false,
  column_switch_2: inquiryToEdit?.column_switch_2 === 1 ? true : false,
  column_switch_3: inquiryToEdit?.column_switch_3 === 1 ? true : false,
  column_switch_4: inquiryToEdit?.column_switch_4 === 1 ? true : false,
  column_switch_5: inquiryToEdit?.column_switch_5 === 1 ? true : false,
  column_decimal_1: inquiryToEdit?.column_decimal_1 || "",
  column_decimal_2: inquiryToEdit?.column_decimal_2 || "",
  column_decimal_3: inquiryToEdit?.column_decimal_3 || "",
  column_decimal_4: inquiryToEdit?.column_decimal_4 || "",
  column_decimal_5: inquiryToEdit?.column_decimal_5 || "",
  column_dropdown_1: inquiryToEdit?.column_dropdown_1 || "",
  column_dropdown_2: inquiryToEdit?.column_dropdown_2 || "",
  column_dropdown_3: inquiryToEdit?.column_dropdown_3 || "",
  column_dropdown_4: inquiryToEdit?.column_dropdown_4 || "",
  column_dropdown_5: inquiryToEdit?.column_dropdown_5 || "",
  column_radio_1: inquiryToEdit?.column_radio_1 || "",
  column_radio_2: inquiryToEdit?.column_radio_2 || "",
  column_radio_3: inquiryToEdit?.column_radio_3 || "",
  column_radio_4: inquiryToEdit?.column_radio_4 || "",
  column_radio_5: inquiryToEdit?.column_radio_5 || "",
});

export const createInquiryValidationSchema = (
  customFormList: ICustomFromList[]
) => {
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
        default:
          break;
      }
    }
  });

  return Yup.object().shape({
    description: Yup.string().trim().required("Description is required"),
    ...validationSchema,
  });
};
export const createInquiry = async (
  values: ICreateInquiry,
  setRefreshInquiry: any,
  contact_id: number,
  onHide: () => void
) => {

  const getUUID = await localStorage.getItem("UUID");
  const requestData = { ...values, a_application_login_id: getUUID };

  try {
    const requestData = {
      table: "inquiries",
      data: JSON.stringify({
        product_id: values.product_id,
        category_id: values.category_id,
        description: values.description,
        qty: values.qty,
        product_remarks: values.product_remarks,
        source_type_id: values.source_type_id,
        static: values.static,
        contact_master_id: contact_id,
        a_application_login_id: Number(getUUID),
        inquiry_assigned_team_member: Number(getUUID),
        column_number_1: values.column_number_1,
        column_number_2: values.column_number_2,
        column_number_3: values.column_number_3,
        column_number_4: values.column_number_4,
        column_number_5: values.column_number_5,
        column_text_1: values.column_text_1,
        column_text_2: values.column_text_2,
        column_text_3: values.column_text_3,
        column_text_4: values.column_text_4,
        column_text_5: values.column_text_5,
        column_text_area_1: values.column_text_area_1,
        column_text_area_2: values.column_text_area_2,
        column_text_area_3: values.column_text_area_3,
        column_text_area_4: values.column_text_area_4,
        column_text_area_5: values.column_text_area_5,
        column_date_1: values.column_date_1,
        column_date_2: values.column_date_2,
        column_date_3: values.column_date_3,
        column_date_4: values.column_date_4,
        column_date_5: values.column_date_5,
        column_date_and_time_1: values.column_date_and_time_1,
        column_date_and_time_2: values.column_date_and_time_2,
        column_date_and_time_3: values.column_date_and_time_3,
        column_date_and_time_4: values.column_date_and_time_4,
        column_date_and_time_5: values.column_date_and_time_5,
        column_time_1: values.column_time_1.slice(0, 5),
        column_time_2: values.column_time_2.slice(0, 5),
        column_time_3: values.column_time_3.slice(0, 5),
        column_time_4: values.column_time_4.slice(0, 5),
        column_time_5: values.column_time_5.slice(0, 5),
        column_switch_1: values.column_switch_1,
        column_switch_2: values.column_switch_2,
        column_switch_3: values.column_switch_3,
        column_switch_4: values.column_switch_4,
        column_switch_5: values.column_switch_5,
        column_decimal_1: values.column_decimal_1,
        column_decimal_2: values.column_decimal_2,
        column_decimal_3: values.column_decimal_3,
        column_decimal_4: values.column_decimal_4,
        column_decimal_5: values.column_decimal_5,
        column_dropdown_1: values.column_dropdown_1,
        column_dropdown_2: values.column_dropdown_2,
        column_dropdown_3: values.column_dropdown_3,
        column_dropdown_4: values.column_dropdown_4,
        column_dropdown_5: values.column_dropdown_5,
        column_radio_1: values.column_radio_1,
        column_radio_2: values.column_radio_2,
        column_radio_3: values.column_radio_3,
        column_radio_4: values.column_radio_4,
        column_radio_5: values.column_radio_5,
      }),
    };

    const { data } = await axiosInstance.post("commonCreate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg);
        onHide();
        setRefreshInquiry(true);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateInquiry = async (
  values: ICreateInquiry,
  setRefreshInquiry: any,
  contactId: any,
  onHide: () => void
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "inquiries",
    where: `{"id":${contactId?.id}}`,
    data: JSON.stringify({
      product_id: values.product_id,
      category_id: values.category_id,
      description: values.description,
      qty: values.qty,
      product_remarks: values.product_remarks,
      source_type_id: values.source_type_id,
      static: values.static,
      column_number_1: values.column_number_1,
      column_number_2: values.column_number_2,
      column_number_3: values.column_number_3,
      column_number_4: values.column_number_4,
      column_number_5: values.column_number_5,
      column_text_1: values.column_text_1,
      column_text_2: values.column_text_2,
      column_text_3: values.column_text_3,
      column_text_4: values.column_text_4,
      column_text_5: values.column_text_5,
      column_text_area_1: values.column_text_area_1,
      column_text_area_2: values.column_text_area_2,
      column_text_area_3: values.column_text_area_3,
      column_text_area_4: values.column_text_area_4,
      column_text_area_5: values.column_text_area_5,
      column_date_1: values.column_date_1,
      column_date_2: values.column_date_2,
      column_date_3: values.column_date_3,
      column_date_4: values.column_date_4,
      column_date_5: values.column_date_5,
      column_date_and_time_1: values.column_date_and_time_1,
      column_date_and_time_2: values.column_date_and_time_2,
      column_date_and_time_3: values.column_date_and_time_3,
      column_date_and_time_4: values.column_date_and_time_4,
      column_date_and_time_5: values.column_date_and_time_5,
      column_time_1: values.column_time_1,
      column_time_2: values.column_time_2,
      column_time_3: values.column_time_3,
      column_time_4: values.column_time_4,
      column_time_5: values.column_time_5,
      column_switch_1: values.column_switch_1,
      column_switch_2: values.column_switch_2,
      column_switch_3: values.column_switch_3,
      column_switch_4: values.column_switch_4,
      column_switch_5: values.column_switch_5,
      column_decimal_1: values.column_decimal_1,
      column_decimal_2: values.column_decimal_2,
      column_decimal_3: values.column_decimal_3,
      column_decimal_4: values.column_decimal_4,
      column_decimal_5: values.column_decimal_5,
      column_dropdown_1: values.column_dropdown_1,
      column_dropdown_2: values.column_dropdown_2,
      column_dropdown_3: values.column_dropdown_3,
      column_dropdown_4: values.column_dropdown_4,
      column_dropdown_5: values.column_dropdown_5,
      column_radio_1: values.column_radio_1,
      column_radio_2: values.column_radio_2,
      column_radio_3: values.column_radio_3,
      column_radio_4: values.column_radio_4,
      column_radio_5: values.column_radio_5,
    }),
  };
  setRefreshInquiry(false);
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.data.ack_msg);
      onHide();
      setRefreshInquiry(true);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCustomInqFromApiForInquiry = async (
  setCustomFromList: TReactSetState<ICustomFromList[]>,
  setDataScorce: any
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post(
      "getCustomFieldFrom",
      {
        a_application_login_id: Number(getUUID),
        form_type: 2
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

export const fetchCategoryApi = async (
  setCategoryList: TReactSetState<{ id: number; category_name: string }[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setCategoryList([]);
    return;
  }

  const requestData = {
    table: "categories",
    columns: "id,category_name",
    "where": [
      "isDelete=0"
    ],
    "request_flag": 0,
    "order": "{\"id\":\"DESC\"}"
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setCategoryList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setCategoryList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setCategoryList([]);
  }
};
