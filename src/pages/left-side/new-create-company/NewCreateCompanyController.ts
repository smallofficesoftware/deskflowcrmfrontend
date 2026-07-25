import { toast } from "react-toastify";
import * as Yup from "yup";
import { handleRefresh } from "../../../common/SharedFunction";
import {
  CONTACT_INSERT_API_LINK,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import {
  axiosInstance,
  axiosInstanceFormData,
} from "../../../services/axiosInstance";

export interface ICreateCompany {
  id?: number;
  order_qty_unit: string | number;
  company_name: string;
  company_email: string;
  company_contact: string;
  trade_india_user_id: string;
  trade_india_profile_id: string;
  trade_india_key: string;
  india_mart_api_key: string;
  whatsapp_authkey: string;
  whatsapp_appkey: string;
  chatgpt_appkey: string;
  gimini_appkey: string;
  google_lead_sheet_for_faceBook_1: string;
  google_sheet_first_name: string;
  google_lead_sheet_for_faceBook_2: string;
  google_sheet_second_name: string;
  google_sheet_key_3: string;
  google_sheet_third_name: string;
  google_sheet_key_4: string;
  google_sheet_fourth_name: string;
  serp_api_key: string;
  host_out_going_mail: string;
  port_mail_setup: string;
  mail_id_setup: string;
  password_mail_setup: string;
  plan_id?: number;
  invitation_key?: number;
  activation_code?: string;
  is_email_verified?: number;
  invoice_prefix: string;
  invoice_title: string;
  invoice_doc_no: string;
  invoice_view_color: string;
  invoice_view_formate: number;
  purchase_ord_prefix: string;
  purchase_order_title: string;
  purchase_order_doc_no: string;
  purchase_order_view_color: string;
  purchase_order_view_formate: number;
  order_prefix: string;
  order_title: string;
  order_doc_no: string;
  order_view_color: string;
  order_view_formate: number;
  workorder_prefix: string;
  workorder_title: string;
  workorder_doc_no: string;
  workorder_view_color: string;
  workorder_view_formate: number;
  quotation_prefix: string;
  quotation_title: string;
  quotation_doc_no: string;
  quotation_view_color: string;
  quotation_view_formate: number;
  purchase_prefix: string;
  purchase_title: string;
  purchase_doc_no: string;
  purchase_view_color: string;
  purchase_view_formate: number;
  return_sales_invoice_prefix: string;
  return_sales_invoice_title: string;
  return_sales_invoice_doc_no: string;
  return_sales_invoice_view_color: string;
  return_sales_invoice_view_formate: number;
  return_purchase_invoice_prefix: string;
  return_purchase_invoice_title: string;
  return_purchase_invoice_doc_no: string;
  return_purchase_invoice_view_color: string;
  return_purchase_invoice_view_formate: number;
  quotation_terms_conditions: string;
  quotation_remark: string;
  quotation_note: string;
  order_terms_conditions: string;
  order_remark: string;
  order_note: string;
  sales_invoice_terms_conditions: string;
  sales_invoice_remark: string;
  sales_invoice_note: string;
  return_sales_invoice_terms_conditions: string;
  return_sales_invoice_remark: string;
  return_sales_invoice_note: string;
  purchase_order_terms_conditions: string;
  purchase_order_remark: string;
  purchase_order_note: string;
  purchase_invoice_terms_conditions: string;
  purchase_invoice_remark: string;
  purchase_invoice_note: string;
  return_purchase_invoice_terms_conditions: string;
  return_purchase_invoice_remark: string;
  return_purchase_invoice_note: string;
  work_order_terms_conditions: string;
  work_order_remark: string;
  work_order_note: string;
  [key: string]: any;
  category_id_b2b: string;
  sub_category_id_b2b: string;
  gst_number: string;
  address: string;
  country_id: string;
  state_id: string;
  city_id: string;
  currency_id: string;
  bank_detail: string;
  upi_id: string;
  upi_name: string;
  terms_and_condition: string;
  header_img: string;
  footer_img: string;
  company_logo: string;
  company_sign: string;
  company_catalog: string;
  pop3_host: string;
  incoming_port: string;
  in_order_image_view: number;
  watermark_in_print: number;
  is_contact_validation: number;
  view_inquiry_form_in_contact: number;
  same_product_multiple_in_cart: number;
  referral_code?: string;
  qr_code?: string;
  inward_prefix: string;
  inward_title: string;
  inward_doc_no: string;
  inward_view_color: string;
  inward_view_formate: number;
  inward_terms_conditions: string;
  inward_remark: string;
  inward_note: string;
  dispatch_prefix: string;
  dispatch_title: string;
  dispatch_doc_no: string;
  dispatch_view_color: string;
  dispatch_view_formate: number;
  dispatch_terms_conditions: string;
  dispatch_remark: string;
  dispatch_note: string;
  banner_img_one: string;
  banner_img_two: string;
  is_strict_check_product_stock: number;
  is_strict_wharehouse_wise_product_stock_check: number;
  quotation_packing_charge_title: string;
  quotation_transport_charge_title: string;
  quotation_tcs_title: string;
  quotation_tsc_percentage: string | number;
  order_packing_charge_title: string;
  order_transport_charge_title: string;
  order_tcs_title: string;
  order_tsc_percentage: string | number;
  sales_invoice_packing_charge_title: string;
  sales_invoice_transport_charge_title: string;
  sales_invoice_tcs_title: string;
  sales_invoice_tsc_percentage: string | number;
  return_sales_invoice_packing_charge_title: string;
  return_sales_invoice_transport_charge_title: string;
  return_sales_invoice_tcs_title: string;
  return_sales_invoice_tsc_percentage: string | number;
  purchase_order_packing_charge_title: string;
  purchase_order_transport_charge_title: string;
  purchase_order_tcs_title: string;
  purchase_order_tsc_percentage: string | number;
  purchase_invoice_packing_charge_title: string;
  purchase_invoice_transport_charge_title: string;
  purchase_invoice_tcs_title: string;
  purchase_invoice_tsc_percentage: string | number;
  return_purchase_invoice_packing_charge_title: string;
  return_purchase_invoice_transport_charge_title: string;
  return_purchase_invoice_tcs_title: string;
  return_purchase_invoice_tsc_percentage: string | number;
  work_order_packing_charge_title: string;
  work_order_transport_charge_title: string;
  work_order_tcs_title: string;
  work_order_tsc_percentage: string | number;
  inward_packing_charge_title: string;
  inward_transport_charge_title: string;
  inward_tcs_title: string;
  inward_tsc_percentage: string | number;
  dispatch_packing_charge_title: string;
  dispatch_transport_charge_title: string;
  dispatch_tcs_title: string;
  dispatch_tsc_percentage: string | number;
}
export interface IGoogleSheetsProps {
  title: string | undefined;
  sheet_type: number | string;
}
const formatText = (input: string) =>
  input
    .replace(/<br\s*\/?>/gi, "\n") // Replace <br> or <br/> with \n
    .replace(/<[^>]*>/g, ""); // Remove other HTML tags
export const createCompanyInitialValues = (
  companyToEdit: ICreateCompany | undefined,
  mobileNumber: any,
  defaultCountry: any,
  additionalValues: {
    in_order_image_view?: number;
    watermark_in_print?: number;
    is_contact_validation?: number;
    is_strict_check_product_stock?: number;
    is_strict_wharehouse_wise_product_stock_check?: number;
    view_inquiry_form_in_contact?: number;
    same_product_multiple_in_cart?: number;
  } = {},
): ICreateCompany => ({
  company_name: companyToEdit?.company_name || "",
  order_qty_unit: companyToEdit?.order_qty_unit || "",
  trade_india_user_id: companyToEdit?.trade_india_user_id || "",
  trade_india_profile_id: companyToEdit?.trade_india_profile_id || "",
  trade_india_key: companyToEdit?.trade_india_key || "",
  india_mart_api_key: companyToEdit?.india_mart_api_key || "",
  whatsapp_authkey: companyToEdit?.whatsapp_authkey || "",
  whatsapp_appkey: companyToEdit?.whatsapp_appkey || "",
  chatgpt_appkey: companyToEdit?.chatgpt_appkey || "",
  gimini_appkey: companyToEdit?.gimini_appkey || "",
  company_email: companyToEdit?.company_email || "",
  company_contact: companyToEdit?.company_contact || mobileNumber,
  google_lead_sheet_for_faceBook_1:
    companyToEdit?.google_lead_sheet_for_faceBook_1 || "",
  google_sheet_first_name:
    companyToEdit?.google_sheet_first_name || "",
  google_lead_sheet_for_faceBook_2:
    companyToEdit?.google_lead_sheet_for_faceBook_2 || "",
  google_sheet_second_name:
    companyToEdit?.google_sheet_second_name || "",
  google_sheet_key_3: companyToEdit?.google_sheet_key_3 || "",
  google_sheet_third_name: companyToEdit?.google_sheet_third_name || "",
  google_sheet_key_4: companyToEdit?.google_sheet_key_4 || "",
  google_sheet_fourth_name: companyToEdit?.google_sheet_fourth_name || "",
  serp_api_key: companyToEdit?.serp_api_key || "",
  host_out_going_mail: companyToEdit?.host_out_going_mail || "",
  port_mail_setup: companyToEdit?.port_mail_setup || "",
  mail_id_setup: companyToEdit?.mail_id_setup || "",
  password_mail_setup: companyToEdit?.password_mail_setup || "",
  invoice_prefix: companyToEdit?.invoice_prefix || "",
  invoice_title: companyToEdit?.invoice_title || "",
  invoice_doc_no: companyToEdit?.invoice_doc_no || "",
  invoice_view_color: companyToEdit?.invoice_view_color || "",
  invoice_view_formate: companyToEdit?.invoice_view_formate || 1,
  purchase_ord_prefix: companyToEdit?.purchase_ord_prefix || "",
  purchase_order_title: companyToEdit?.purchase_order_title || "",
  purchase_order_doc_no: companyToEdit?.purchase_order_doc_no || "",
  purchase_order_view_color: companyToEdit?.purchase_order_view_color || "",
  purchase_order_view_formate: companyToEdit?.purchase_order_view_formate || 1,
  order_prefix: companyToEdit?.order_prefix || "",
  order_title: companyToEdit?.order_title || "",
  order_doc_no: companyToEdit?.order_doc_no || "",
  order_view_color: companyToEdit?.order_view_color || "",
  order_view_formate: companyToEdit?.order_view_formate || 1,
  workorder_prefix: companyToEdit?.workorder_prefix || "",
  workorder_title: companyToEdit?.workorder_title || "",
  workorder_doc_no: companyToEdit?.workorder_doc_no || "",
  workorder_view_color: companyToEdit?.workorder_view_color || "",
  workorder_view_formate: companyToEdit?.workorder_view_formate || 1,
  quotation_prefix: companyToEdit?.quotation_prefix || "",
  quotation_title: companyToEdit?.quotation_title || "",
  quotation_doc_no: companyToEdit?.quotation_doc_no || "",
  quotation_view_color: companyToEdit?.quotation_view_color || "",
  quotation_view_formate: companyToEdit?.quotation_view_formate || 1,
  purchase_prefix: companyToEdit?.purchase_prefix || "",
  purchase_title: companyToEdit?.purchase_title || "",
  purchase_doc_no: companyToEdit?.purchase_doc_no || "",
  purchase_view_color: companyToEdit?.purchase_view_color || "",
  purchase_view_formate: companyToEdit?.purchase_view_formate || 1,
  return_sales_invoice_prefix: companyToEdit?.return_sales_invoice_prefix || "",
  return_sales_invoice_title: companyToEdit?.return_sales_invoice_title || "",
  return_sales_invoice_doc_no: companyToEdit?.return_sales_invoice_doc_no || "",
  return_sales_invoice_view_color:
    companyToEdit?.return_sales_invoice_view_color || "",
  return_sales_invoice_view_formate:
    companyToEdit?.return_sales_invoice_view_formate || 1,
  return_purchase_invoice_prefix:
    companyToEdit?.return_purchase_invoice_prefix || "",
  return_purchase_invoice_title:
    companyToEdit?.return_purchase_invoice_title || "",
  return_purchase_invoice_doc_no:
    companyToEdit?.return_purchase_invoice_doc_no || "",
  return_purchase_invoice_view_color:
    companyToEdit?.return_purchase_invoice_view_color || "",
  return_purchase_invoice_view_formate:
    companyToEdit?.return_purchase_invoice_view_formate || 1,
  gst_number: companyToEdit?.gst_number || "",
  address: companyToEdit?.address || "",
  //defaultCountry
  country_id: companyToEdit?.country_id || "",
  state_id: companyToEdit?.state_id || "",
  city_id: companyToEdit?.city_id || "",
  currency_id: companyToEdit?.currency_id || "INR",
  upi_id: companyToEdit?.upi_id || "",
  upi_name: companyToEdit?.upi_name || "",
  bank_detail: companyToEdit?.bank_detail
    ? formatText(companyToEdit?.bank_detail)
    : "Bank Name :\nBank Account No :\nBank IFSC Code :\nBank Branch :",
  terms_and_condition: companyToEdit?.terms_and_condition
    ? formatText(companyToEdit?.terms_and_condition)
    : "",
  header_img: companyToEdit?.header_img || "",
  footer_img: companyToEdit?.footer_img || "",
  banner_img_one: companyToEdit?.banner_img_one || "",
  banner_img_two: companyToEdit?.banner_img_two || "",
  category_id_b2b: companyToEdit?.category_id_b2b || "",
  sub_category_id_b2b: companyToEdit?.sub_category_id_b2b || "",
  company_logo: companyToEdit?.company_logo || "",
  company_sign: companyToEdit?.company_sign || "",
  company_catalog: companyToEdit?.company_catalog || "",
  incoming_port: companyToEdit?.incoming_port || "",
  pop3_host: companyToEdit?.pop3_host || "",
  in_order_image_view:
    companyToEdit?.in_order_image_view ||
    additionalValues.in_order_image_view ||
    1,
  watermark_in_print:
    companyToEdit?.watermark_in_print ||
    additionalValues.watermark_in_print ||
    1,
  is_contact_validation:
    companyToEdit?.is_contact_validation ||
    additionalValues.is_contact_validation ||
    1,
  is_strict_check_product_stock:
    companyToEdit?.is_strict_check_product_stock ||
    additionalValues.is_strict_check_product_stock ||
    1,
  is_strict_wharehouse_wise_product_stock_check:
    companyToEdit?.is_strict_wharehouse_wise_product_stock_check ||
    additionalValues.is_strict_wharehouse_wise_product_stock_check ||
    1,
  view_inquiry_form_in_contact:
    companyToEdit?.view_inquiry_form_in_contact ||
    additionalValues.view_inquiry_form_in_contact ||
    1,
  same_product_multiple_in_cart:
    companyToEdit?.same_product_multiple_in_cart ||
    additionalValues.same_product_multiple_in_cart ||
    1,
  qr_code: companyToEdit?.qr_code || "",
  quotation_terms_conditions: companyToEdit?.quotation_terms_conditions || "",
  quotation_remark: companyToEdit?.quotation_remark || "",
  quotation_note: companyToEdit?.quotation_note || "",
  order_terms_conditions: companyToEdit?.order_terms_conditions || "",
  order_remark: companyToEdit?.order_remark || "",
  order_note: companyToEdit?.order_note || "",
  sales_invoice_terms_conditions:
    companyToEdit?.sales_invoice_terms_conditions || "",
  sales_invoice_remark: companyToEdit?.sales_invoice_remark || "",
  sales_invoice_note: companyToEdit?.sales_invoice_note || "",
  return_sales_invoice_terms_conditions:
    companyToEdit?.return_sales_invoice_terms_conditions || "",
  return_sales_invoice_remark: companyToEdit?.return_sales_invoice_remark || "",
  return_sales_invoice_note: companyToEdit?.return_sales_invoice_note || "",
  purchase_order_terms_conditions:
    companyToEdit?.purchase_order_terms_conditions || "",
  purchase_order_remark: companyToEdit?.purchase_order_remark || "",
  purchase_order_note: companyToEdit?.purchase_order_note || "",
  purchase_invoice_terms_conditions:
    companyToEdit?.purchase_invoice_terms_conditions || "",
  purchase_invoice_remark: companyToEdit?.purchase_invoice_remark || "",
  purchase_invoice_note: companyToEdit?.purchase_invoice_note || "",
  return_purchase_invoice_terms_conditions:
    companyToEdit?.return_purchase_invoice_terms_conditions || "",
  return_purchase_invoice_remark:
    companyToEdit?.return_purchase_invoice_remark || "",
  return_purchase_invoice_note:
    companyToEdit?.return_purchase_invoice_note || "",
  work_order_terms_conditions: companyToEdit?.work_order_terms_conditions || "",
  work_order_remark: companyToEdit?.work_order_remark || "",
  work_order_note: companyToEdit?.work_order_note || "",
  inward_prefix: companyToEdit?.inward_prefix || "",
  inward_title: companyToEdit?.inward_title || "",
  inward_doc_no: companyToEdit?.inward_doc_no || "",
  inward_view_color: companyToEdit?.inward_view_color || "",
  inward_view_formate: companyToEdit?.inward_view_formate || 1,
  inward_terms_conditions: companyToEdit?.inward_terms_conditions || "",
  inward_remark: companyToEdit?.inward_remark || "",
  inward_note: companyToEdit?.inward_note || "",
  dispatch_prefix: companyToEdit?.dispatch_prefix || "",
  dispatch_title: companyToEdit?.dispatch_title || "",
  dispatch_doc_no: companyToEdit?.dispatch_doc_no || "",
  dispatch_view_color: companyToEdit?.dispatch_view_color || "",
  dispatch_view_formate: companyToEdit?.dispatch_view_formate || 1,
  dispatch_terms_conditions: companyToEdit?.dispatch_terms_conditions || "",
  dispatch_remark: companyToEdit?.dispatch_remark || "",
  dispatch_note: companyToEdit?.dispatch_note || "",
  quotation_packing_charge_title:
    companyToEdit?.quotation_packing_charge_title || "",
  quotation_transport_charge_title:
    companyToEdit?.quotation_transport_charge_title || "",
  quotation_tcs_title: companyToEdit?.quotation_tcs_title || "",
  quotation_tsc_percentage: companyToEdit?.quotation_tsc_percentage || 0,
  order_packing_charge_title: companyToEdit?.order_packing_charge_title || "",
  order_transport_charge_title:
    companyToEdit?.order_transport_charge_title || "",
  order_tcs_title: companyToEdit?.order_tcs_title || "",
  order_tsc_percentage: companyToEdit?.order_tsc_percentage || 0,
  sales_invoice_packing_charge_title:
    companyToEdit?.sales_invoice_packing_charge_title || "",
  sales_invoice_transport_charge_title:
    companyToEdit?.sales_invoice_transport_charge_title || "",
  sales_invoice_tcs_title: companyToEdit?.sales_invoice_tcs_title || "",
  sales_invoice_tsc_percentage:
    companyToEdit?.sales_invoice_tsc_percentage || 0,
  return_sales_invoice_packing_charge_title:
    companyToEdit?.return_sales_invoice_packing_charge_title || "",
  return_sales_invoice_transport_charge_title:
    companyToEdit?.return_sales_invoice_transport_charge_title || "",
  return_sales_invoice_tcs_title:
    companyToEdit?.return_sales_invoice_tcs_title || "",
  return_sales_invoice_tsc_percentage:
    companyToEdit?.return_sales_invoice_tsc_percentage || 0,
  purchase_order_packing_charge_title:
    companyToEdit?.purchase_order_packing_charge_title || "",
  purchase_order_transport_charge_title:
    companyToEdit?.purchase_order_transport_charge_title || "",
  purchase_order_tcs_title: companyToEdit?.purchase_order_tcs_title || "",
  purchase_order_tsc_percentage:
    companyToEdit?.purchase_order_tsc_percentage || 0,
  purchase_invoice_packing_charge_title:
    companyToEdit?.purchase_invoice_packing_charge_title || "",
  purchase_invoice_transport_charge_title:
    companyToEdit?.purchase_invoice_transport_charge_title || "",
  purchase_invoice_tcs_title: companyToEdit?.purchase_invoice_tcs_title || "",
  purchase_invoice_tsc_percentage:
    companyToEdit?.purchase_invoice_tsc_percentage || 0,
  return_purchase_invoice_packing_charge_title:
    companyToEdit?.return_purchase_invoice_packing_charge_title || "",
  return_purchase_invoice_transport_charge_title:
    companyToEdit?.return_purchase_invoice_transport_charge_title || "",
  return_purchase_invoice_tcs_title:
    companyToEdit?.return_purchase_invoice_tcs_title || "",
  return_purchase_invoice_tsc_percentage:
    companyToEdit?.return_purchase_invoice_tsc_percentage || 0,
  work_order_packing_charge_title:
    companyToEdit?.work_order_packing_charge_title || "",
  work_order_transport_charge_title:
    companyToEdit?.work_order_transport_charge_title || "",
  work_order_tcs_title: companyToEdit?.work_order_tcs_title || "",
  work_order_tsc_percentage: companyToEdit?.work_order_tsc_percentage || 0,
  inward_packing_charge_title: companyToEdit?.inward_packing_charge_title || "",
  inward_transport_charge_title:
    companyToEdit?.inward_transport_charge_title || "",
  inward_tcs_title: companyToEdit?.inward_tcs_title || "",
  inward_tsc_percentage: companyToEdit?.inward_tsc_percentage || 0,
  dispatch_packing_charge_title:
    companyToEdit?.dispatch_packing_charge_title || "",
  dispatch_transport_charge_title:
    companyToEdit?.dispatch_transport_charge_title || "",
  dispatch_tcs_title: companyToEdit?.dispatch_tcs_title || "",
  dispatch_tsc_percentage: companyToEdit?.dispatch_tsc_percentage || 0,
  insert_contact_api: companyToEdit?.qr_code
    ? `curl --location '${CONTACT_INSERT_API_LINK}${companyToEdit?.qr_code}' \
    --header 'Content-Type: application/json' \
    --data '{
        "contact_name": "CONTACT PERSON NAME",
        "company_name": "COMPANY NAME",
        "mobile_number": "YOUR_MOBILE_NUMBER_WITHOUT_COUNTRY_PREFIX",
        "contact_email": "YOUR_EMAIL_ADDRESS",
        "your_requirement": "YOUR_REQUIREMENT"
    }'`
    : "NO API FOUND PLEASE GENERATE QR",
});

export const orderQtyList = [
  { id: "1", qty_unit: "Quantity" },
  { id: "2", qty_unit: "Quantity + Inner" },
  { id: "3", qty_unit: "Quantity + Outer" },
  { id: "4", qty_unit: "Quantity + Inner + Outer" },
];

export const createCompanyValidationSchema = () =>
  Yup.object().shape({
    company_name: Yup.string()
      .min(3, "Minimum 3 Characters Required")
      .max(50, "Maximum 50 Characters Allowed")
      .required("Company Name is Required"),
    company_email: Yup.string()
      .email("Please enter email address")
      .required("Email address is required")
      .max(100, "Email address cannot exceed 100 characters")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter valid email address",
      ),
    gst_number: Yup.string()
      .max(15, "Max GST number 15")
      .min(15, "Min GST number 15"),
    // company_contact: Yup.string()
    //   .max(15, "Max mobile number 15")
    //   .min(10, "Min mobile number 10"),
    // mail_id_setup: Yup.string().email("Please write proper Mail"),
    category_id_b2b: Yup.string().required(
      "Please select business sub category",
    ),
    sub_category_id_b2b: Yup.string().required(
      "Please select business category",
    ),
    mail_id_setup: Yup.string()
      .email("Enter Valid Email")
      // .required("Email is required")
      .max(100, "Email address cannot exceed 100 characters")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format",
      ),
  });

export const createCompany = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  onHide: any,
  mobileNumber: number,
  setCheckPlan: TReactSetState<ICreateCompany | undefined>,
  isSetCheckPlan: TReactSetState<boolean>,
) => {
  setCheckPlan(undefined);

  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    activation_code: values.activation_code,
    company_name: values.company_name,
    company_contact: values.company_contact || mobileNumber,
    company_email: values.company_email,
    category_id_b2b: values.category_id_b2b,
    sub_category_id_b2b: values.sub_category_id_b2b,
    a_application_login_id: getUUID,
    referral_code: values.referral_code,
    gst_number: values.gst_number,
  };
  isSetCheckPlan(false);

  setRefresh(false);
  try {
    const { data } = await axiosInstance.post("createCompany", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        onHide();
        setRefresh(true);
        isSetCheckPlan(true);
        setCheckPlan(data.data.item);
        if (values.activation_code) {
          const getUserName = await localStorage.getItem("USERNAME");
          const planBody = data.data.item;
          const requestData = {
            plan_month: planBody.months,
            plan_number: planBody.plan_id,
            a_application_login_id: Number(getUUID),
            application_login_name: getUserName,
          };
          setRefresh(true);
        }
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

export const updateCompanyDetails = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  companyId: any,
  onHide: any,
) => {
  const token = localStorage.getItem("token");
  setRefresh(false);

  const body = {
    company_id: companyId.id,
    company_name: values.company_name,
    company_email: values.company_email,
    gst_number: values.gst_number,
    address: values.address,
    country_id: values.country_id,
    category_id_b2b: values.category_id_b2b,
    sub_category_id_b2b: values.sub_category_id_b2b,
    state_id: values.state_id,
    city_id: values.city_id,
    currency_id: values.currency_id,
    upi_id: values.upi_id,
    upi_name: values.upi_name,
    bank_detail: values.bank_detail.replace(/\n/g, "<br>"),
    terms_and_condition: values.terms_and_condition.replace(/\n/g, "<br>"),
  };

  try {
    const data = await axiosInstanceFormData.post(
      "update-company-detail",
      body,
      {
        headers: {
          "Content-Type": "application/json", // Set content type for body
          Authorization: token,
        },
      },
    );

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // onHide();
      handleRefresh();
      // setRefresh(true);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateThirdParty = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  companyId: any,
  onHide: any,
) => {
  const token = localStorage.getItem("token");

  setRefresh(false);

  const body = {
    company_id: companyId.id,

    trade_india_user_id: values.trade_india_user_id,
    trade_india_profile_id: values.trade_india_profile_id,
    trade_india_key: values.trade_india_key,

    india_mart_api_key: values.india_mart_api_key,

    whatsapp_authkey: values.whatsapp_authkey,
    whatsapp_appkey: values.whatsapp_appkey,

    chatgpt_appkey: values.chatgpt_appkey,
    gimini_appkey: values.gimini_appkey,

    google_lead_sheet_for_faceBook_1: values.google_lead_sheet_for_faceBook_1,
    google_sheet_first_name: values.google_sheet_first_name,
    google_lead_sheet_for_faceBook_2: values.google_lead_sheet_for_faceBook_2,
    google_sheet_second_name: values.google_sheet_second_name,

    google_sheet_key_3: values.google_sheet_key_3,
    google_sheet_third_name: values.google_sheet_third_name,
    google_sheet_key_4: values.google_sheet_key_4,
    google_sheet_fourth_name: values.google_sheet_fourth_name,

    serp_api_key: values.serp_api_key,
  };
  try {
    const data = await axiosInstanceFormData.post("update-third-party", body, {
      headers: {
        "Content-Type": "application/json", // Set content type for FormData
        Authorization: token,
      },
    });

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // onHide();
      handleRefresh();
      // setRefresh(true);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchThirdPartyData = async (
  setThirdPartyData: any,
  companyToEdit: any,
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    company_id: companyToEdit.id,
  };
  try {
    const response = await axiosInstance.post(
      "get-third-party-data",
      requestData,
    );
    // console.log("fffffffffffffffffffffffff",response.data.data.item)
    setThirdPartyData(response.data.data.item);
  } catch (error) {
    console.error("Error fetching countries:", error);
    setThirdPartyData({});
  }
};

export const fetchSetPrefixData = async (
  setPagesAndPrefixData: any,
  companyToEdit: any,
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    company_id: companyToEdit.id,
  };
  try {
    const response = await axiosInstance.post(
      "get-set-prefix-data",
      requestData,
    );
    setPagesAndPrefixData(response.data.data.item);
  } catch (error) {
    console.error("Error fetching countries:", error);
    setPagesAndPrefixData({});
  }
};

export const updateSetPrefix = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  companyId: any,
  onHide: any,
) => {
  const token = localStorage.getItem("token");

  setRefresh(false);

  const body = {
    company_id: companyId.id,

    order_prefix: values.order_prefix,
    order_title: values.order_title,
    order_doc_no: values.order_doc_no,
    order_view_color: values.order_view_color,
    order_view_formate: values.order_view_formate,

    workorder_prefix: values.workorder_prefix,
    workorder_title: values.workorder_title,
    workorder_doc_no: values.workorder_doc_no,
    workorder_view_color: values.workorder_view_color,
    workorder_view_formate: values.workorder_view_formate,

    purchase_prefix: values.purchase_prefix,
    purchase_title: values.purchase_title,
    purchase_doc_no: values.purchase_doc_no,
    purchase_view_color: values.purchase_view_color,
    purchase_view_formate: values.purchase_view_formate,

    quotation_prefix: values.quotation_prefix,
    quotation_title: values.quotation_title,
    quotation_doc_no: values.quotation_doc_no,
    quotation_view_color: values.quotation_view_color,
    quotation_view_formate: values.quotation_view_formate,

    invoice_prefix: values.invoice_prefix,
    invoice_title: values.invoice_title,
    invoice_doc_no: values.invoice_doc_no,
    invoice_view_color: values.invoice_view_color,
    invoice_view_formate: values.invoice_view_formate,

    inward_prefix: values.inward_prefix,
    inward_title: values.inward_title,
    inward_doc_no: values.inward_doc_no,
    inward_view_color: values.inward_view_color,
    inward_view_formate: values.inward_view_formate,
    inward_terms_conditions: values.inward_terms_conditions,
    inward_remark: values.inward_remark,
    inward_note: values.inward_note,

    dispatch_prefix: values.dispatch_prefix,
    dispatch_title: values.dispatch_title,
    dispatch_doc_no: values.dispatch_doc_no,
    dispatch_view_color: values.dispatch_view_color,
    dispatch_view_formate: values.dispatch_view_formate,
    dispatch_terms_conditions: values.dispatch_terms_conditions,
    dispatch_remark: values.dispatch_remark,
    dispatch_note: values.dispatch_note,

    return_sales_invoice_prefix: values.return_sales_invoice_prefix,
    return_sales_invoice_title: values.return_sales_invoice_title,
    return_sales_invoice_doc_no: values.return_sales_invoice_doc_no,
    return_sales_invoice_view_color: values.return_sales_invoice_view_color,
    return_sales_invoice_view_formate: values.return_sales_invoice_view_formate,

    return_purchase_invoice_prefix: values.return_purchase_invoice_prefix,
    return_purchase_invoice_title: values.return_purchase_invoice_title,
    return_purchase_invoice_doc_no: values.return_purchase_invoice_doc_no,
    return_purchase_invoice_view_color:
      values.return_purchase_invoice_view_color,
    return_purchase_invoice_view_formate:
      values.return_purchase_invoice_view_formate,

    purchase_ord_prefix: values.purchase_ord_prefix,
    purchase_order_title: values.purchase_order_title,
    purchase_order_doc_no: values.purchase_order_doc_no,
    purchase_order_view_color: values.purchase_order_view_color,
    purchase_order_view_formate: values.purchase_order_view_formate,

    quotation_terms_conditions: values.quotation_terms_conditions,
    quotation_remark: values.quotation_remark,
    quotation_note: values.quotation_note,

    order_terms_conditions: values.order_terms_conditions,
    order_remark: values.order_remark,
    order_note: values.order_note,

    sales_invoice_terms_conditions: values.sales_invoice_terms_conditions,
    sales_invoice_remark: values.sales_invoice_remark,
    sales_invoice_note: values.sales_invoice_note,

    return_sales_invoice_terms_conditions:
      values.return_sales_invoice_terms_conditions,
    return_sales_invoice_remark: values.return_sales_invoice_remark,
    return_sales_invoice_note: values.return_sales_invoice_note,

    purchase_order_terms_conditions: values.purchase_order_terms_conditions,
    purchase_order_remark: values.purchase_order_remark,
    purchase_order_note: values.purchase_order_note,

    purchase_invoice_terms_conditions: values.purchase_invoice_terms_conditions,
    purchase_invoice_remark: values.purchase_invoice_remark,
    purchase_invoice_note: values.purchase_invoice_note,

    return_purchase_invoice_terms_conditions:
      values.return_purchase_invoice_terms_conditions,
    return_purchase_invoice_remark: values.return_purchase_invoice_remark,
    return_purchase_invoice_note: values.return_purchase_invoice_note,

    work_order_terms_conditions: values.work_order_terms_conditions,
    work_order_remark: values.work_order_remark,
    work_order_note: values.work_order_note,

    quotation_packing_charge_title: values.quotation_packing_charge_title,
    quotation_transport_charge_title: values.quotation_transport_charge_title,
    quotation_tcs_title: values.quotation_tcs_title,
    quotation_tsc_percentage: values.quotation_tsc_percentage,

    order_packing_charge_title: values.order_packing_charge_title,
    order_transport_charge_title: values.order_transport_charge_title,
    order_tcs_title: values.order_tcs_title,
    order_tsc_percentage: values.order_tsc_percentage,

    sales_invoice_packing_charge_title:
      values.sales_invoice_packing_charge_title,
    sales_invoice_transport_charge_title:
      values.sales_invoice_transport_charge_title,
    sales_invoice_tcs_title: values.sales_invoice_tcs_title,
    sales_invoice_tsc_percentage: values.sales_invoice_tsc_percentage,

    return_sales_invoice_packing_charge_title:
      values.return_sales_invoice_packing_charge_title,
    return_sales_invoice_transport_charge_title:
      values.return_sales_invoice_transport_charge_title,
    return_sales_invoice_tcs_title: values.return_sales_invoice_tcs_title,
    return_sales_invoice_tsc_percentage:
      values.return_sales_invoice_tsc_percentage,

    purchase_order_packing_charge_title:
      values.purchase_order_packing_charge_title,
    purchase_order_transport_charge_title:
      values.purchase_order_transport_charge_title,
    purchase_order_tcs_title: values.purchase_order_tcs_title,
    purchase_order_tsc_percentage: values.purchase_order_tsc_percentage,

    purchase_invoice_packing_charge_title:
      values.purchase_invoice_packing_charge_title,
    purchase_invoice_transport_charge_title:
      values.purchase_invoice_transport_charge_title,
    purchase_invoice_tcs_title: values.purchase_invoice_tcs_title,
    purchase_invoice_tsc_percentage: values.purchase_invoice_tsc_percentage,

    return_purchase_invoice_packing_charge_title:
      values.return_purchase_invoice_packing_charge_title,
    return_purchase_invoice_transport_charge_title:
      values.return_purchase_invoice_transport_charge_title,
    return_purchase_invoice_tcs_title: values.return_purchase_invoice_tcs_title,
    return_purchase_invoice_tsc_percentage:
      values.return_purchase_invoice_tsc_percentage,

    work_order_packing_charge_title: values.work_order_packing_charge_title,
    work_order_transport_charge_title: values.work_order_transport_charge_title,
    work_order_tcs_title: values.work_order_tcs_title,
    work_order_tsc_percentage: values.work_order_tsc_percentage,

    inward_packing_charge_title: values.inward_packing_charge_title,
    inward_transport_charge_title: values.inward_transport_charge_title,
    inward_tcs_title: values.inward_tcs_title,
    inward_tsc_percentage: values.inward_tsc_percentage,

    dispatch_packing_charge_title: values.dispatch_packing_charge_title,
    dispatch_transport_charge_title: values.dispatch_transport_charge_title,
    dispatch_tcs_title: values.dispatch_tcs_title,
    dispatch_tsc_percentage: values.dispatch_tsc_percentage,
  };

  try {
    const data = await axiosInstanceFormData.post("update-set-prefix", body, {
      headers: {
        "Content-Type": "application/json", // Set content type for FormData
        Authorization: token,
      },
    });

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // onHide();
      handleRefresh();
      // setRefresh(true);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateMailSetup = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  companyId: any,
  onHide: any,
) => {
  const token = localStorage.getItem("token");
  setRefresh(false);

  const payload = {
    company_id: companyId.id,
    host_out_going_mail: values.host_out_going_mail,
    port_mail_setup: values.port_mail_setup,
    mail_id_setup: values.mail_id_setup,
    password_mail_setup: values.password_mail_setup,
    incoming_port: values.incoming_port,
    pop3_host: values.pop3_host,
  };

  try {
    const data = await axiosInstance.post("update-mail-setup", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // onHide();
      handleRefresh();
      // setRefresh(true);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchMailSetupData = async (
  setMailSetupData: any,
  companyToEdit: any,
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    company_id: companyToEdit.id,
  };
  try {
    const response = await axiosInstance.post(
      "get-mail-setup-data",
      requestData,
    );
    setMailSetupData(response.data.data.item);
  } catch (error) {
    console.error("Error fetching countries:", error);
    setMailSetupData({});
  }
};

export const updateOpenImageSettings = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  companyId: any,
  onHide: any,
  headerImg: any,
  footerImg: any,
  companyLog: any,
  companySign: any,
  companyCatalog: any,
  bannerimgone: any,
  bannerimgtwo: any,
) => {
  const token = localStorage.getItem("token");
  setRefresh(false);

  const formData = new FormData();

  formData.append("company_id", companyId.id);

  formData.append("company_logo", companyLog);
  formData.append("company_sign", companySign);
  formData.append("header_img", headerImg);
  formData.append("footer_img", footerImg);
  formData.append("banner_img_one", bannerimgone);
  formData.append("banner_img_two", bannerimgtwo);
  formData.append("catalog_pdf", companyCatalog);

  try {
    const data = await axiosInstanceFormData.post(
      "update-image-settings",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set content type for body
          Authorization: token,
        },
      },
    );

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // onHide();
      handleRefresh();
      // setRefresh(true);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateModuleSettings = async (
  values: ICreateCompany,
  setRefresh: TReactSetState<boolean>,
  companyId: any,
  onHide: any,
) => {
  console.log("values", values);
  const token = localStorage.getItem("token");
  setRefresh(false);

  const body = {
    company_id: companyId.id,
    in_order_image_view: values.in_order_image_view,
    watermark_in_print: values.watermark_in_print,
    is_contact_validation: values.is_contact_validation,
    is_strict_check_product_stock: values.is_strict_check_product_stock,
    is_strict_wharehouse_wise_product_stock_check:
      values.is_strict_wharehouse_wise_product_stock_check,
    view_inquiry_form_in_contact: values.view_inquiry_form_in_contact,
    same_product_multiple_in_cart: values.same_product_multiple_in_cart,
    order_qty_unit: String(values.order_qty_unit),
  };
  console.log("data", body);
  try {
    const data = await axiosInstanceFormData.post(
      "update-module-settings",
      body,
      {
        headers: {
          "Content-Type": "application/json", // Set content type for FormData
          Authorization: token,
        },
      },
    );

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // onHide();
      handleRefresh();
      // setRefresh(true);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const handelSendOtpForEmailVerifyCompany = async (
  setIsEmailVerifyCloseConfirmation: TReactSetState<boolean>,
  companyId: number,
) => {
  const token = await localStorage.getItem("token");
  setIsEmailVerifyCloseConfirmation(true);
  try {
    const response = await axiosInstance.post(
      "otpSendEmailVerifyCompany",
      {
        company_id: companyId,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      },
    );
    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsEmailVerifyCloseConfirmation(true);
      } else {
        toast.error(response.data.ack_msg);
      }
    } else {
      toast.error(response.data.ack_msg);
    }
  } catch (error) {
    setIsEmailVerifyCloseConfirmation(false);

    toast.error("Failed to send OTP. Please try again.");
  }
};

export const fetchCountryApiForCompany = async (setCountriesList: any) => {
  const requestData = {
    table: "a_countries",
    columns: "id,country_name,country_code",
    where: `{"isDelete": "0"}`,
  };

  const getUUID = localStorage.getItem("UUID");

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCountriesList(response.data.data);
  } catch (error) {
    console.error("Error fetching countries:", error);
    setCountriesList([]);
  }
};
export const fetchStateApiForCompany = async (
  setStateList: any,
  selectedCountryId: any,
) => {
  const requestData = {
    table: "a_states",
    columns: "id,state_name",
    where: `{"country_id": "${selectedCountryId}"}`,
  };

  const getUUID = localStorage.getItem("UUID");

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setStateList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setStateList([]);
  }
};
export const fetchCityApiForCompany = async (
  setCityList: TReactSetState<any>,
  selectedStateId: any,
) => {
  const requestData = {
    table: "a_cities",
    columns: "id,city_name",
    where: `{"state_id": ${selectedStateId}}`,
  };
  const getUUID = localStorage.getItem("UUID");

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCityList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setCityList([]);
  }
};

export const fetchCategoryB2BApi = async (
  setCategoryList: TReactSetState<any>,
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axiosInstance.post(
      "category-b2b",
      {},
      // {
      //   headers: {
      //     Authorization: token,
      //   },
      // }
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setCategoryList(response.data.data.item);
    } else {
      setCategoryList([]);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setCategoryList([]);
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchSubCategoryB2BApi = async (
  setSubCategoryList: TReactSetState<any>,
  categoryId: number,
) => {
  try {
    const response = await axiosInstance.post("subCategory-b2b", {
      category_id: categoryId,
    });

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setSubCategoryList(response.data.data.item);
    } else {
      setSubCategoryList([]);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setSubCategoryList([]);
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const fetchCurrency = async (setCurrency: TReactSetState<any>) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axiosInstance.post(
      "currency",
      {},
      {
        headers: {
          Authorization: token,
        },
      },
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setCurrency(response.data.data.item);
    } else {
      setCurrency([]);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching currency:", error);
    setCurrency([]);
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
