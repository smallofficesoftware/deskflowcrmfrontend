import { toast } from "react-toastify";
import * as Yup from "yup";
import { convert12To24 } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { ICustomFromList } from "../../right-side/create-inquiry/CreateInquiryController";
import { IPriceListView } from "../header/Setting/priceList/PriceListController";
export interface ICreateCustomer {
  email_id: string;
  person_name: string;
  mobile_number: number | string;
  country: string;
  state: string;
  company_name: string | undefined;
  district: string;
  city: string;
  area: string;
  pincode: number | string;
  address: string;
  reference_contact: number;
  source_type_id: string;
  assinged_to_price_list: number;
  shipping_address: string;
  gst_number: string;
  gst_reg_type: string;
  gst_reg_date: string;
  qty: string;
  description: string;
  category_id: number;
  product_id: number;
  static: number;
  assinged_to_work_a_application_id: number;
  lable: string | number | undefined;
  cntc_column_number_1: number | string;
  cntc_column_number_2: number | string;
  cntc_column_number_3: number | string;
  cntc_column_number_4: number | string;
  cntc_column_number_5: number | string;
  cntc_column_text_1: string;
  cntc_column_text_2: string;
  cntc_column_text_3: string;
  cntc_column_text_4: string;
  cntc_column_text_5: string;
  cntc_column_text_area_1: string;
  cntc_column_text_area_2: string;
  cntc_column_text_area_3: string;
  cntc_column_text_area_4: string;
  cntc_column_text_area_5: string;
  cntc_column_date_1: string;
  cntc_column_date_2: string;
  cntc_column_date_3: string;
  cntc_column_date_4: string;
  cntc_column_date_5: string;
  cntc_column_date_and_time_1: string;
  cntc_column_date_and_time_2: string;
  cntc_column_date_and_time_3: string;
  cntc_column_date_and_time_4: string;
  cntc_column_date_and_time_5: string;
  cntc_column_time_1: string;
  cntc_column_time_2: string;
  cntc_column_time_3: string;
  cntc_column_time_4: string;
  cntc_column_time_5: string;
  cntc_column_switch_1: number | boolean;
  cntc_column_switch_2: number | boolean;
  cntc_column_switch_3: number | boolean;
  cntc_column_switch_4: number | boolean;
  cntc_column_switch_5: number | boolean;
  cntc_column_decimal_1: number | string;
  cntc_column_decimal_2: number | string;
  cntc_column_decimal_3: number | string;
  cntc_column_decimal_4: number | string;
  cntc_column_decimal_5: number | string;
  cntc_column_dropdown_1: string;
  cntc_column_dropdown_2: string;
  cntc_column_dropdown_3: string;
  cntc_column_dropdown_4: string;
  cntc_column_dropdown_5: string;
  cntc_column_radio_1: string;
  cntc_column_radio_2: string;
  cntc_column_radio_3: string;
  cntc_column_radio_4: string;
  cntc_column_radio_5: string;
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
  client_code: string;
  longitude: string;
  latitude: string;
}

export interface ICreateInquiryFromContact {
  qty: string;
}

const ContactNumberRegex = /^[0-9]+$/;

export const requirementTypesListForContact = [
  { id: "0", requirement_name: "One time" },
  { id: "1", requirement_name: "Recurring" },
];

const formatDateForDateTimeLocal = (dateString: string) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    console.warn(
      "Invalid dateString in formatDateForDateTimeLocal:",
      dateString,
    );
    return "";
  }

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const createCustomerInitialValues = (
  contactData: ICreateCustomer | undefined,
): ICreateCustomer => {
  return {
    person_name: contactData?.person_name || "",
    email_id: contactData?.email_id || "",
    company_name: contactData?.company_name || "",
    mobile_number: contactData?.mobile_number || "",
    country: contactData?.country || "",
    state: contactData?.state || "",
    district: contactData?.district || "",
    city: contactData?.city || "",
    area: contactData?.area || "",
    pincode: contactData?.pincode || "",
    reference_contact: contactData?.reference_contact || 0,
    address: contactData?.address || "",
    source_type_id: contactData?.source_type_id || "",
    lable: contactData?.lable,
    assinged_to_price_list: contactData?.assinged_to_price_list || 0,
    shipping_address: contactData?.shipping_address || "",
    gst_number: contactData?.gst_number || "",
    gst_reg_type:
      (contactData as any)?.gst_reg_type ||
      (contactData?.gst_number ? "Regular" : "Unregistered"),
    gst_reg_date:
      (contactData as any)?.gst_reg_date || "2017-07-01",
    qty: "",
    description: "",
    category_id: 0,
    product_id: 0,
    static: 0,
    assinged_to_work_a_application_id:
      contactData?.assinged_to_work_a_application_id || 0,
    column_number_1: "",
    column_number_2: "",
    column_number_3: "",
    column_number_4: "",
    column_number_5: "",
    cntc_column_text_1: "",
    cntc_column_text_2: "",
    cntc_column_text_3: "",
    cntc_column_text_4: "",
    cntc_column_text_5: "",
    cntc_column_text_area_1: "",
    cntc_column_text_area_2: "",
    cntc_column_text_area_3: "",
    cntc_column_text_area_4: "",
    cntc_column_text_area_5: "",
    cntc_column_date_1: "",
    column_date_2: "",
    column_date_3: "",
    column_date_4: "",
    column_date_5: "",
    column_date_and_time_1: "",
    column_date_and_time_2: "",
    column_date_and_time_3: "",
    column_date_and_time_4: "",
    column_date_and_time_5: "",
    column_time_1: "00:00 AM",
    column_time_2: "00:00 AM",
    column_time_3: "00:00 AM",
    column_time_4: "00:00 AM",
    column_time_5: "00:00 AM",
    column_switch_1: contactData?.column_switch_1 === 1 ? true : false,
    column_switch_2: contactData?.column_switch_2 === 1 ? true : false,
    column_switch_3: contactData?.column_switch_3 === 1 ? true : false,
    column_switch_4: contactData?.column_switch_4 === 1 ? true : false,
    column_switch_5: contactData?.column_switch_5 === 1 ? true : false,
    column_decimal_1: "",
    column_decimal_2: "",
    column_decimal_3: "",
    column_decimal_4: "",
    column_decimal_5: "",
    column_dropdown_1: "",
    column_dropdown_2: "",
    column_dropdown_3: "",
    column_dropdown_4: "",
    column_dropdown_5: "",
    column_radio_1: "",
    column_radio_2: "",
    column_radio_3: "",
    column_radio_4: "",
    column_radio_5: "",
    cntc_column_number_1: contactData?.cntc_column_number_1 || "",
    cntc_column_number_2: contactData?.cntc_column_number_2 || "",
    cntc_column_number_3: contactData?.cntc_column_number_3 || "",
    cntc_column_number_4: contactData?.cntc_column_number_4 || "",
    cntc_column_number_5: contactData?.cntc_column_number_5 || "",
    cntc_column_text_1: contactData?.cntc_column_text_1 || "",
    cntc_column_text_2: contactData?.cntc_column_text_2 || "",
    cntc_column_text_3: contactData?.cntc_column_text_3 || "",
    cntc_column_text_4: contactData?.cntc_column_text_4 || "",
    cntc_column_text_5: contactData?.cntc_column_text_5 || "",
    cntc_column_text_area_1: contactData?.cntc_column_text_area_1 || "",
    cntc_column_text_area_2: contactData?.cntc_column_text_area_2 || "",
    cntc_column_text_area_3: contactData?.cntc_column_text_area_3 || "",
    cntc_column_text_area_4: contactData?.cntc_column_text_area_4 || "",
    cntc_column_text_area_5: contactData?.cntc_column_text_area_5 || "",
    cntc_column_date_1: contactData?.cntc_column_date_1 || "",
    cntc_column_date_2: contactData?.cntc_column_date_2 || "",
    cntc_column_date_3: contactData?.cntc_column_date_3 || "",
    cntc_column_date_4: contactData?.cntc_column_date_4 || "",
    cntc_column_date_5: contactData?.cntc_column_date_5 || "",
    cntc_column_date_and_time_1: contactData?.cntc_column_date_and_time_1
      ? contactData?.cntc_column_date_and_time_1
      : "",
    cntc_column_date_and_time_2: contactData?.cntc_column_date_and_time_2
      ? contactData?.cntc_column_date_and_time_2
      : "",
    cntc_column_date_and_time_3: contactData?.cntc_column_date_and_time_3
      ? contactData?.cntc_column_date_and_time_3
      : "",
    cntc_column_date_and_time_4: contactData?.cntc_column_date_and_time_4
      ? contactData?.cntc_column_date_and_time_4
      : "",
    cntc_column_date_and_time_5: contactData?.cntc_column_date_and_time_5
      ? contactData?.cntc_column_date_and_time_5
      : "",
    cntc_column_time_1: convert12To24(contactData?.cntc_column_time_1),
    cntc_column_time_2: convert12To24(contactData?.cntc_column_time_2),
    cntc_column_time_3: convert12To24(contactData?.cntc_column_time_3),
    cntc_column_time_4: convert12To24(contactData?.cntc_column_time_4),
    cntc_column_time_5: convert12To24(contactData?.cntc_column_time_5),
    cntc_column_switch_1:
      contactData?.cntc_column_switch_1 === 1 ? true : false,
    cntc_column_switch_2:
      contactData?.cntc_column_switch_2 === 1 ? true : false,
    cntc_column_switch_3:
      contactData?.cntc_column_switch_3 === 1 ? true : false,
    cntc_column_switch_4:
      contactData?.cntc_column_switch_4 === 1 ? true : false,
    cntc_column_switch_5:
      contactData?.cntc_column_switch_5 === 1 ? true : false,
    cntc_column_decimal_1: contactData?.cntc_column_decimal_1 || "",
    cntc_column_decimal_2: contactData?.cntc_column_decimal_2 || "",
    cntc_column_decimal_3: contactData?.cntc_column_decimal_3 || "",
    cntc_column_decimal_4: contactData?.cntc_column_decimal_4 || "",
    cntc_column_decimal_5: contactData?.cntc_column_decimal_5 || "",
    cntc_column_dropdown_1: contactData?.cntc_column_dropdown_1 || "",
    cntc_column_dropdown_2: contactData?.cntc_column_dropdown_2 || "",
    cntc_column_dropdown_3: contactData?.cntc_column_dropdown_3 || "",
    cntc_column_dropdown_4: contactData?.cntc_column_dropdown_4 || "",
    cntc_column_dropdown_5: contactData?.cntc_column_dropdown_5 || "",
    cntc_column_radio_1: contactData?.cntc_column_radio_1 || "",
    cntc_column_radio_2: contactData?.cntc_column_radio_2 || "",
    cntc_column_radio_3: contactData?.cntc_column_radio_3 || "",
    cntc_column_radio_4: contactData?.cntc_column_radio_4 || "",
    cntc_column_radio_5: contactData?.cntc_column_radio_5 || "",
    client_code: contactData?.client_code || "",
    longitude: contactData?.longitude || "",
    latitude: contactData?.latitude || "",
  };
};

export const createCustomerValidationSchema = (
  customFormList: ICustomFromList[],
  isFeatureEnabled: boolean,
) => {
  // Validate customFormList
  if (!Array.isArray(customFormList)) {
    console.error("customFormList is not an array:", customFormList);
    return Yup.object().shape({
      person_name: Yup.string().required("Name is required"),
      company_name: isFeatureEnabled
        ? Yup.string().required("Company Name is required")
        : Yup.string(),
      mobile_number: Yup.string()
        .required("Mobile Number is required")
        .matches(/^\+?[\d\s\-()]{7,20}$/, "Enter a valid phone number")
        .max(20, "Max mobile number length 20")
        .min(7, "Min mobile number length 7"),
      email_id: Yup.string()
        .email("Enter a valid email")
        .max(100, "Email cannot exceed 100 characters")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Invalid email format",
        ),
      pincode: Yup.string().matches(
        /^[a-zA-Z0-9]*$/,
        "Pincode should not contain special characters",
      ),
      gst_number: Yup.string()
        .max(15, "Max GST number 15")
        .min(15, "Min GST number 15"),
      client_code: isFeatureEnabled
        ? Yup.string().required("Client Code is required")
        : Yup.string(),
    });
  }

  const dynamicSchema: any = {};

  customFormList.forEach((item) => {
    if (
      item.required_or_not === 1 &&
      item.form_type === 1 &&
      item.data_type !== 7
    ) {
      switch (item.data_type) {
        case 1: // Number
          dynamicSchema[item.reference_column_name] = Yup.number()
            .typeError(`${item.title} must be a number`)
            .required(`${item.title} is required`);
          break;
        case 2: // Text
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 3: // Text Area
          dynamicSchema[item.reference_column_name] = Yup.string()
            .trim()
            .required(`${item.title} is required`);
          break;
        case 4: // Date
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 5: // Date and Time
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 6: // Time
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 7: // Checkbox
          dynamicSchema[item.reference_column_name] =
            Yup.boolean().default(false);
          break;
        case 8: // Decimal
          dynamicSchema[item.reference_column_name] = Yup.number()
            .typeError(`${item.title} must be a valid decimal`)
            .required(`${item.title} is required`);
          break;
        case 9: // Dropdown
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 10: // Radio
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        default:
          console.warn(
            `Unknown data_type: ${item.data_type} for ${item.title}`,
          );
          break;
      }
    }
  });

  return Yup.object().shape({
    person_name: Yup.string().required("Name is required"),
    company_name: isFeatureEnabled
      ? Yup.string().required("Company Name is required")
      : Yup.string(),
    client_code: isFeatureEnabled
      ? Yup.string().required("Client Code is required")
      : Yup.string(),
    mobile_number: Yup.string()
      .required("Mobile Number is required")
      .matches(/^[0-9]+$/, "Only numbers are allowed")
      .max(15, "Max mobile number 15")
      .min(10, "Min mobile number 10"),
    email_id: Yup.string()
      .email("Enter a valid email")
      .max(100, "Email cannot exceed 100 characters")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format",
      ),
    pincode: Yup.string().matches(
      /^[a-zA-Z0-9]*$/,
      "Pincode should not contain special characters",
    ),
    gst_number: Yup.string()
      .max(15, "Max GST number 15")
      .min(15, "Min GST number 15"),
    ...dynamicSchema,
  });
};

export const createContact = async (
  values: ICreateCustomer,
  setContact: any,
  onHide: () => void,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    console.error("Missing UUID or token:", { getUUID, token });
    toast.error("Authentication error: Missing UUID or token");
    onHide();
    return;
  }
  // setContact(false);
  const requestDataCreateContact = {
    person_name: values.person_name,
    mobile_number: values.mobile_number,
    email_id: values.email_id,
    company_name: values.company_name,
    country: values.country,
    state: values.state,
    district: values.district,
    city: values.city,
    area: values.area,
    pincode: values.pincode,
    address: values.address,
    source_type_id: values.source_type_id,
    assinged_to_price_list: values.assinged_to_price_list,
    shipping_address: values.shipping_address,
    lable: values.lable,
    referance_contact: values.reference_contact,
    gst_number: values.gst_number,
    gst_reg_type: values.gst_reg_type,
    gst_reg_date: values.gst_reg_date,
    a_application_login_id: getUUID,
    qty: values.qty,
    description: values.description,
    category_id: values.category_id,
    product_id: values.product_id,
    static: values.static,
    is_unread: 1,
    column_number_1: values.column_number_1,
    column_number_2: values.column_number_2,
    column_number_3: values.column_number_3,
    column_number_4: values.column_number_4,
    column_number_5: values.column_number_5,
    cntc_column_text_1: values.cntc_column_text_1,
    cntc_column_text_2: values.cntc_column_text_2,
    cntc_column_text_3: values.cntc_column_text_3,
    cntc_column_text_4: values.cntc_column_text_4,
    cntc_column_text_5: values.cntc_column_text_5,
    cntc_column_text_area_1: values.cntc_column_text_area_1,
    cntc_column_text_area_2: values.cntc_column_text_area_2,
    cntc_column_text_area_3: values.cntc_column_text_area_3,
    cntc_column_text_area_4: values.cntc_column_text_area_4,
    cntc_column_text_area_5: values.cntc_column_text_area_5,
    cntc_column_date_1: values.cntc_column_date_1,
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
    cntc_column_number_1: values.cntc_column_number_1,
    cntc_column_number_2: values.cntc_column_number_2,
    cntc_column_number_3: values.cntc_column_number_3,
    cntc_column_number_4: values.cntc_column_number_4,
    cntc_column_number_5: values.cntc_column_number_5,
    cntc_column_text_1: values.cntc_column_text_1,
    cntc_column_text_2: values.cntc_column_text_2,
    cntc_column_text_3: values.cntc_column_text_3,
    cntc_column_text_4: values.cntc_column_text_4,
    cntc_column_text_5: values.cntc_column_text_5,
    cntc_column_text_area_1: values.cntc_column_text_area_1,
    cntc_column_text_area_2: values.cntc_column_text_area_2,
    cntc_column_text_area_3: values.cntc_column_text_area_3,
    cntc_column_text_area_4: values.cntc_column_text_area_4,
    cntc_column_text_area_5: values.cntc_column_text_area_5,
    cntc_column_date_1: values.cntc_column_date_1,
    cntc_column_date_2: values.cntc_column_date_2,
    cntc_column_date_3: values.cntc_column_date_3,
    cntc_column_date_4: values.cntc_column_date_4,
    cntc_column_date_5: values.cntc_column_date_5,
    cntc_column_date_and_time_1: values.cntc_column_date_and_time_1,
    cntc_column_date_and_time_2: values.cntc_column_date_and_time_2,
    cntc_column_date_and_time_3: values.cntc_column_date_and_time_3,
    cntc_column_date_and_time_4: values.cntc_column_date_and_time_4,
    cntc_column_date_and_time_5: values.cntc_column_date_and_time_5,
    cntc_column_time_1: values.cntc_column_time_1,
    cntc_column_time_2: values.cntc_column_time_2,
    cntc_column_time_3: values.cntc_column_time_3,
    cntc_column_time_4: values.cntc_column_time_4,
    cntc_column_time_5: values.cntc_column_time_5,
    cntc_column_switch_1: values.cntc_column_switch_1,
    cntc_column_switch_2: values.cntc_column_switch_2,
    cntc_column_switch_3: values.cntc_column_switch_3,
    cntc_column_switch_4: values.cntc_column_switch_4,
    cntc_column_switch_5: values.cntc_column_switch_5,
    cntc_column_decimal_1: values.cntc_column_decimal_1,
    cntc_column_decimal_2: values.cntc_column_decimal_2,
    cntc_column_decimal_3: values.cntc_column_decimal_3,
    cntc_column_decimal_4: values.cntc_column_decimal_4,
    cntc_column_decimal_5: values.cntc_column_decimal_5,
    cntc_column_dropdown_1: values.cntc_column_dropdown_1,
    cntc_column_dropdown_2: values.cntc_column_dropdown_2,
    cntc_column_dropdown_3: values.cntc_column_dropdown_3,
    cntc_column_dropdown_4: values.cntc_column_dropdown_4,
    cntc_column_dropdown_5: values.cntc_column_dropdown_5,
    cntc_column_radio_1: values.cntc_column_radio_1,
    cntc_column_radio_2: values.cntc_column_radio_2,
    cntc_column_radio_3: values.cntc_column_radio_3,
    cntc_column_radio_4: values.cntc_column_radio_4,
    cntc_column_radio_5: values.cntc_column_radio_5,
    client_code: values.client_code,
    longitude: values.longitude,
    latitude: values.latitude,
  };

  try {
    const { data } = await axiosInstance.post(
      "createContact",
      requestDataCreateContact,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
      onHide();
      setContact(true);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      // onHide();
    }
  } catch (error: any) {
    console.error("createContact error:", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    onHide();
  } finally {
    setContact(true);
  }
};

export const updateContact = async (
  values: ICreateCustomer,
  setContact: any,
  contactId: number | string | undefined,
  setIsCreateContact1: TReactSetState<boolean>,
  closeChatAbout: any,
  onHide: () => void,
) => {
  if (!contactId) {
    console.error("Missing contactId");
    toast.error("Contact ID is required");
    onHide();
    return;
  }

  const getUUID = await localStorage.getItem("UUID");
  if (!getUUID) {
    console.error("Missing UUID");
    toast.error("Authentication error: Missing UUID");
    onHide();
    return;
  }
  // setContact(false);
  const requestData = {
    table: "contact_masters",
    where: `{"id":${contactId}}`,
    data: JSON.stringify({
      person_name: values.person_name,
      company_name: values.company_name,
      mobile_number: values.mobile_number,
      email_id: values.email_id,
      country: values.country,
      state: values.state,
      district: values.district,
      city: values.city,
      area: values.area,
      pincode: values.pincode,
      address: values.address,
      source_type_id: values.source_type_id,
      lable: values.lable,
      assinged_to_price_list: values.assinged_to_price_list,
      shipping_address: values.shipping_address,
      referance_contact: values.reference_contact,
      gst_number: values.gst_number,
      gst_reg_type: values.gst_reg_type,
      gst_reg_date: values.gst_reg_date,
      cntc_column_number_1: values.cntc_column_number_1,
      cntc_column_number_2: values.cntc_column_number_2,
      cntc_column_number_3: values.cntc_column_number_3,
      cntc_column_number_4: values.cntc_column_number_4,
      cntc_column_number_5: values.cntc_column_number_5,
      cntc_column_text_1: values.cntc_column_text_1,
      cntc_column_text_2: values.cntc_column_text_2,
      cntc_column_text_3: values.cntc_column_text_3,
      cntc_column_text_4: values.cntc_column_text_4,
      cntc_column_text_5: values.cntc_column_text_5,
      cntc_column_text_area_1: values.cntc_column_text_area_1,
      cntc_column_text_area_2: values.cntc_column_text_area_2,
      cntc_column_text_area_3: values.cntc_column_text_area_3,
      cntc_column_text_area_4: values.cntc_column_text_area_4,
      cntc_column_text_area_5: values.cntc_column_text_area_5,
      cntc_column_date_1: values.cntc_column_date_1,
      cntc_column_date_2: values.cntc_column_date_2,
      cntc_column_date_3: values.cntc_column_date_3,
      cntc_column_date_4: values.cntc_column_date_4,
      cntc_column_date_5: values.cntc_column_date_5,
      cntc_column_date_and_time_1: values.cntc_column_date_and_time_1,
      cntc_column_date_and_time_2: values.cntc_column_date_and_time_2,
      cntc_column_date_and_time_3: values.cntc_column_date_and_time_3,
      cntc_column_date_and_time_4: values.cntc_column_date_and_time_4,
      cntc_column_date_and_time_5: values.cntc_column_date_and_time_5,
      cntc_column_time_1: values.cntc_column_time_1,
      cntc_column_time_2: values.cntc_column_time_2,
      cntc_column_time_3: values.cntc_column_time_3,
      cntc_column_time_4: values.cntc_column_time_4,
      cntc_column_time_5: values.cntc_column_time_5,
      cntc_column_switch_1: values.cntc_column_switch_1,
      cntc_column_switch_2: values.cntc_column_switch_2,
      cntc_column_switch_3: values.cntc_column_switch_3,
      cntc_column_switch_4: values.cntc_column_switch_4,
      cntc_column_switch_5: values.cntc_column_switch_5,
      cntc_column_decimal_1: values.cntc_column_decimal_1,
      cntc_column_decimal_2: values.cntc_column_decimal_2,
      cntc_column_decimal_3: values.cntc_column_decimal_3,
      cntc_column_decimal_4: values.cntc_column_decimal_4,
      cntc_column_decimal_5: values.cntc_column_decimal_5,
      cntc_column_dropdown_1: values.cntc_column_dropdown_1,
      cntc_column_dropdown_2: values.cntc_column_dropdown_2,
      cntc_column_dropdown_3: values.cntc_column_dropdown_3,
      cntc_column_dropdown_4: values.cntc_column_dropdown_4,
      cntc_column_dropdown_5: values.cntc_column_dropdown_5,
      cntc_column_radio_1: values.cntc_column_radio_1,
      cntc_column_radio_2: values.cntc_column_radio_2,
      cntc_column_radio_3: values.cntc_column_radio_3,
      cntc_column_radio_4: values.cntc_column_radio_4,
      cntc_column_radio_5: values.cntc_column_radio_5,
      client_code: values.client_code,
      longitude: values.longitude,
      latitude: values.latitude,
    }),
  };

  try {
    // setIsCreateContact1(false);
    const { data } = await axiosInstance.post("commonUpdate", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
      onHide();
      // setIsCreateContact1(true);
      closeChatAbout();
    } else {
      console.error("createContact API error:", data.ack_msg);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      // onHide();
    }
  } catch (error: any) {
    console.error("updateContact error:", error);
    // toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setContact(true);
  }
};

export const fetchPriceListApiForContact = async (
  setPriceListList: TReactSetState<IPriceListView[]>,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID || !token) {
    console.error("Missing UUID or token:", { getUUID, token });
    toast.error("Authentication error: Missing UUID or token");
    setPriceListList([]);
    return;
  }

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const { data } = await axiosInstance.post("priceListMaster", requestData);

    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      console.error("fetchPriceListApiForContact API error:", data.ack_msg);
      setPriceListList([]);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } else {
      setPriceListList(data.data.item);
    }
  } catch (error: any) {
    console.error("fetchPriceListApiForContact error:", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setPriceListList([]);
  }
};

export const checkContactNumberDuplication = async (
  mobile_number: number | string,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID || !token) {
    console.error("Missing UUID or token:", { getUUID, token });
    toast.error("Authentication error: Missing UUID or token");
    return;
  }

  const requestData = {
    mobile_number: mobile_number,
    a_application_login_id: getUUID,
  };

  try {
    const { data } = await axiosInstance.post(
      "checkNumberDuplication",
      requestData,
    );

    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      if (data.data.isDuplicate == true) {
        toast.error(data.ack_msg || "Mobile number already exists");
      }
    }
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCategoryApiForContact = async (
  setCategoryList: TReactSetState<any>,
) => {
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) {
    console.error("Missing UUID");
    toast.error("Authentication error: Missing UUID");
    setCategoryList([]);
    return;
  }

  const requestData = {
    table: "categories",
    columns: "id,category_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCategoryList(response.data.data);
  } catch (error: any) {
    console.error("fetchCategoryApiForContact error:", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setCategoryList([]);
  }
};

export const fetchProductApiForContact = async (
  setProductList: TReactSetState<any>,
  selectedCategoryId: any,
) => {
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) {
    console.error("Missing UUID");
    toast.error("Authentication error: Missing UUID");
    setProductList([]);
    return;
  }

  const requestData = {
    table: "products",
    columns: "id,product_name",
    where: [
      "isDelete=0",
      `category_id=${selectedCategoryId}`,
      // `a_application_login_id=${getUUID}||0`,
    ],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setProductList(response.data.data);
  } catch (error: any) {
    console.error("fetchProductApiForContact error:", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setProductList([]);
  }
};

export const fetchCustomInqFromApiForContact = async (
  setCustomFromList: TReactSetState<ICustomFromList[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    console.error("Missing UUID or token:", { getUUID, token });
    toast.error("Authentication error: Missing UUID or token");
    setCustomFromList([]);
    return;
  }

  try {
    const { data } = await axiosInstance.post("getCustomFieldFrom", {
      a_application_login_id: Number(getUUID),
    });

    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      console.error("fetchCustomInqFromApiForContact API error:", data.ack_msg);
      setCustomFromList([]);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } else {
      setCustomFromList(data.data.item);
    }
  } catch (error: any) {
    console.error("fetchCustomInqFromApiForContact error:", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setCustomFromList([]);
  }
};
