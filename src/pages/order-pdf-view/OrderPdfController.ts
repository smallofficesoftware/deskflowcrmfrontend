import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";

interface IOrderCompanyDetail {
  company_contact: string;
  printed_number: string;
  company_email: string;
  company_name: string;
  footer_img: string;
  header_img: string;
  company_sign: string;
  company_logo: string;
  address: string;
  currency_id: number;
  gst_number: string;
  bank_detail: string;
  invoice_title: string;
  invoice_doc_no: string;
  invoice_view_color: string;
  invoice_view_formate: number;
  order_title: string;
  order_doc_no: string;
  order_view_color: string;
  order_view_formate: number;
  quotation_title: string;
  quotation_doc_no: string;
  quotation_view_color: string;
  quotation_view_formate: number;
  purchase_title: string;
  purchase_doc_no: string;
  purchase_view_color: string;
  purchase_view_formate: number;
  workorder_title: string;
  workorder_doc_no: string;
  workorder_view_color: string;
  workorder_view_formate: number;
  state_id: number;
  state_name: string;
  city_name: string;
  purchase_order_title: string;
  purchase_order_doc_no: string;
  purchase_order_view_color: string;
  purchase_order_view_formate: number;
  return_sales_invoice_title: string;
  return_sales_invoice_doc_no: string;
  return_sales_invoice_view_color: string;
  return_sales_invoice_view_formate: number;
  return_purchase_invoice_title: string;
  return_purchase_invoice_doc_no: string;
  return_purchase_invoice_view_color: string;
  return_purchase_invoice_view_formate: number;
  inward_title: string;
  inward_doc_no: string;
  inward_view_color: string;
  inward_view_formate: number;
  dispatch_title: string;
  dispatch_doc_no: string;
  dispatch_view_color: string;
  dispatch_view_formate: number;
  watermark_in_print: number;
  upi_id: string;
  upi_name: string;
  dispatch_terms_conditions: number;
  sales_invoice_terms_conditions: number;
  qr_code: number;
  proforma_invoice_view_color: string;
  proforma_invoice_view_formate: number;
  proforma_invoice_title: string;
}

interface IOrderLoginDetail {
  recovery_email: string;
  recovery_mobile: string;
  username: string;
}

interface IOrderCartPdf {
  id: number;
  type: number;
  cart_date: string;
  cart_note: string;
  cart_status: number;
  a_application_login_id: number;
  company_masters_id: number;
  to_customer_id: number;
  total_qty: number;
  total_amt: number;
  currency_id: number;
  discount_pct: number;
  discount_pr: number;
  packing_forwarding_charge: number;
  transport_charge: number;
  taxable_amt: number;
  gst_amt: number;
  tcs_amt: number;
  round_off: number;
  grand_total: number;
  advance_payment: number;
  to_customer_name: string;
  to_customer_company_name: string;
  to_customer_phone: string;
  to_customer_email: string;
  to_customer_gst_number: string;
  shipping_address: string;
  cart_number: string;
  Address: string;
  state_id: number;
  state_name: string;
  city_name: string;
  PinCode: string;
  cart_remark: string;
  referance_cart_name: string;
  created_date_time: string;
  update_Date_time: string;
  cart_terms_and_condition: string;
  sr_by_number: number;
  carts_column_number_1?: number | string;
  carts_column_number_2?: number | string;
  carts_column_number_3?: number | string;
  carts_column_number_4?: number | string;
  carts_column_number_5?: number | string;
  carts_column_text_1?: string;
  carts_column_text_2?: string;
  carts_column_text_3?: string;
  carts_column_text_4?: string;
  carts_column_text_5?: string;
  carts_column_text_area_1?: string;
  carts_column_text_area_2?: string;
  carts_column_text_area_3?: string;
  carts_column_text_area_4?: string;
  carts_column_text_area_5?: string;
  carts_column_date_1?: string;
  carts_column_date_2?: string;
  carts_column_date_3?: string;
  carts_column_date_4?: string;
  carts_column_date_5?: string;
  carts_column_date_and_time_1?: string;
  carts_column_date_and_time_2?: string;
  carts_column_date_and_time_3?: string;
  carts_column_date_and_time_4?: string;
  carts_column_date_and_time_5?: string;
  carts_column_time_1?: string;
  carts_column_time_2?: string;
  carts_column_time_3?: string;
  carts_column_time_4?: string;
  carts_column_time_5?: string;
  carts_column_switch_1?: number | boolean;
  carts_column_switch_2?: number | boolean;
  carts_column_switch_3?: number | boolean;
  carts_column_switch_4?: number | boolean;
  carts_column_switch_5?: number | boolean;
  carts_column_decimal_1?: number | string;
  carts_column_decimal_2?: number | string;
  carts_column_decimal_3?: number | string;
  carts_column_decimal_4?: number | string;
  carts_column_decimal_5?: number | string;
  carts_column_dropdown_1?: string;
  carts_column_dropdown_2?: string;
  carts_column_dropdown_3?: string;
  carts_column_dropdown_4?: string;
  carts_column_dropdown_5?: string;
  carts_column_radio_1?: string;
  carts_column_radio_2?: string;
  carts_column_radio_3?: string;
  carts_column_radio_4?: string;
  carts_column_radio_5?: string;
  carts_column_page_text_1?: any;
  carts_column_page_text_2?: any;
  carts_column_page_text_3?: any;
  carts_column_page_text_4?: any;
  carts_column_page_text_5?: any;
  carts_column_page_url_1?: any;
  carts_column_page_url_2?: any;
  carts_column_page_url_3?: any;
  carts_column_page_url_4?: any;
  carts_column_page_url_5?: any;
  [key: string]: string | number | boolean | undefined;
}

export interface IOrderItemPdf {
  id: number;
  item_product_name: string;
  item_product_code: string;
  item_product_description: string;
  item_unit_name: string;
  item_rate: number;
  item_gst: number;
  item_net_rate: number;
  item_qty: number;
  item_total: number;
  item_discount_pct: number;
  item_hsn_code: string;
  currency_id: number;
  sales_qty: number;
  serial_numbers?: string[];
  products_column_number_1?: number | string;
  products_column_number_2?: number | string;
  products_column_number_3?: number | string;
  products_column_number_4?: number | string;
  products_column_number_5?: number | string;
  products_column_text_1?: string;
  products_column_text_2?: string;
  products_column_text_3?: string;
  products_column_text_4?: string;
  products_column_text_5?: string;
  products_column_text_area_1?: string;
  products_column_text_area_2?: string;
  products_column_text_area_3?: string;
  products_column_text_area_4?: string;
  products_column_text_area_5?: string;
  products_column_date_1?: string;
  products_column_date_2?: string;
  products_column_date_3?: string;
  products_column_date_4?: string;
  products_column_date_5?: string;
  products_column_date_and_time_1?: string;
  products_column_date_and_time_2?: string;
  products_column_date_and_time_3?: string;
  products_column_date_and_time_4?: string;
  products_column_date_and_time_5?: string;
  products_column_time_1?: string;
  products_column_time_2?: string;
  products_column_time_3?: string;
  products_column_time_4?: string;
  products_column_time_5?: string;
  products_column_switch_1?: number | boolean;
  products_column_switch_2?: number | boolean;
  products_column_switch_3?: number | boolean;
  products_column_switch_4?: number | boolean;
  products_column_switch_5?: number | boolean;
  products_column_decimal_1?: number | string;
  products_column_decimal_2?: number | string;
  products_column_decimal_3?: number | string;
  products_column_decimal_4?: number | string;
  products_column_decimal_5?: number | string;
  products_column_dropdown_1?: string;
  products_column_dropdown_2?: string;
  products_column_dropdown_3?: string;
  products_column_dropdown_4?: string;
  products_column_dropdown_5?: string;
  products_column_radio_1?: string;
  products_column_radio_2?: string;
  products_column_radio_3?: string;
  products_column_radio_4?: string;
  products_column_radio_5?: string;
  product_img?: string;
}

export interface ItemDetails {
  cart: IOrderCartPdf;
  items: IOrderItemPdf[];
  companyDetail: IOrderCompanyDetail;
  loginDetail: IOrderLoginDetail;
  shareRights: boolean;
}
export interface IprintSetting {
  id: number;
  type: number;
  print_version: number;
  setting_details: {
    type: number;
    print_version: number;
    a_application_login_id: string | number | null | undefined;
    headerImage: boolean;
    headerDetails: boolean;
    toBuyer: boolean;
    billingAddress: boolean;
    shippingAddress: boolean;
    rate: boolean;
    gstinNo: boolean;
    orderNo: boolean;
    orderDateTime: boolean;
    contactPerson: boolean;
    debitCredit: boolean;
    orignalDuplicate: boolean;
    hsnColumn: boolean;
    qtycolumn: boolean;
    hsnSummery: boolean;
    discountColumn: boolean;
    gstColumn: boolean;
    note: boolean;
    bankDetails: boolean;
    pageURL: boolean;
    pageText: boolean;
    product_custom_feilds: boolean;
    cart_custom_feilds: boolean;
    termsCondition: boolean;
    signSignatory: boolean;
    footerImage: boolean;
    supplyTo: boolean;
    closingBalance: boolean;
    productImage: boolean;
    productBottomBorder: boolean;
    showLinesBetweenProducts: boolean;
    headerDetailsWithLogo: boolean;
    headerLogoOnRightSide: boolean;
    paymentQR: boolean;
    productImageinColumn: boolean;
    productCode: boolean;
    unitName: boolean;
    orderTimeOnly: boolean;
    displayMainPage: boolean;
    contactDetails: boolean;
    employeeDetails: boolean;
    ContactMobileNumber: boolean;
    ProductSection: boolean;
    ShippingLabelCustomForm: boolean;
  };
  created_date_time: string;
  modify_date_time: string;
  modify_by: number;
  a_application_login_id: number;
  company_masters_id: number;
  isDelete: number;
  isActive: number;
  s_timestemp: string;
}

export const orderTypesListPdf = [
  { id: "1", type: "Quotation" },
  { id: "2", type: "Order" },
  { id: "3", type: "Invoice" },
  { id: "4", type: "Purchase Invoice" },
  { id: "5", type: "Purchase Order" },
  { id: "6", type: "Return Sales Invoice" },
  { id: "7", type: "Return Purchase Invoice" },
  { id: "8", type: "Return Purchase Invoice" },
  { id: "9", type: "Return Purchase Invoice" },
];

export const fetchprintSetting = async (
  setPrintSetting: TReactSetState<IprintSetting | undefined>,
  type?: number,
  print_formate?: number,
  mobileToken?: string,
  getID?: string,
) => {
  const getUUID = getID || localStorage.getItem("UUID");
  const token = mobileToken || localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error(
      "Missing-023465 authentication or cart ID=123456789 " + `${getID}`,
    );
    return;
  } else {
    try {
      const { data } = await axiosInstance.post("getprintSetting", {
        type: type,
        print_version: print_formate,
      });

      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setPrintSetting(data.data);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
};
export const fetchOrderByForPdfIdApi = async (
  cartId: number | undefined,
  setOrderPdfViewById: TReactSetState<ItemDetails | undefined>,
  mobileToken?: string,
  getID?: string,
) => {
  const getUUID = getID || localStorage.getItem("UUID");
  const token = mobileToken || localStorage.getItem("token");

  if (!getUUID || !token || !cartId) {
    toast.error(
      "Missing-023465 authentication or cart ID=123456789 " + `${getID}`,
    );
    return;
  } else {
    try {
      const { data } = await axiosInstance.post("orderById", {
        cart_id: cartId,
        request_flag: 2,
        a_application_login_id: Number(getUUID),
      });

      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setOrderPdfViewById(data.data.item);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
};

export const fetchCustomForm = async (
  form_type: number | undefined,
  setCustomOrderPdfViewById: TReactSetState<ItemDetails | undefined>,
  mobileToken?: string,
  getID?: string,
) => {
  const getUUID = getID || localStorage.getItem("UUID");
  const token = mobileToken || localStorage.getItem("token");

  if (!getUUID || !token || form_type === undefined) {
    toast.error(
      `Missing authentication, form type, or cart ID-pdf-123 ${mobileToken}`,
    );
    return;
  }

  try {
    const { data } = await axiosInstance.post("getCustomFieldFrom", {
      a_application_login_id: getUUID,
      form_type: form_type,
    });

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const item = data.data?.item;
        if (!item) {
          setCustomOrderPdfViewById(undefined);
          return;
        }

        // Set item directly, as custom fields are already in cart and items
        setCustomOrderPdfViewById(item);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
