import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { IUserList } from "../../../pages/left-side/LeftSideController";
import { axiosInstance } from "../../../services/axiosInstance";

export interface ICart {
  id: number;
  company_masters_id: number;
  a_application_login_id: number;
  product_name: string;
  product_description: string;
  category_id: number;
  unit: string;
  rate: number | string;
  closing_qty: number;
  GST: number;
  hsn_code: string;
  net_rate: number;
  category_name: string;
  quantity: number;
  serial_numbers?: any;
  is_serial_number?: number;
  product_inner_qty: number;
  product_outer_qty: number;
  inner_qty_unit: string;
  outer_qty_unit: string;
  item_discount_pct: number | string;
  item_discount_pr: any;
  price_list_rate: number;
  price_list_discount: number;
  price_list_dis_amt: number;
  conversion_rate?: string | number;
  advance_payment?: string | number;
  cart_item_id?: any;
  referance_cart_id?: any;
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
  last_sr_by_no: number;
  [key: string]: number | string | boolean | undefined;
  last_item_net_rate: number;
  last_item_dis_pr: number;
  is_point_value_allow: number;
  item_inner_quantity: number;
  item_outer_quantity: number;
  item_loose_quantity: number;

}

export interface ICartItem {
  id: number;
  cart_id: number;
  item_category_id: number;
  item_category_name: string;
  item_product_id: number;
  item_product_name: string;
  item_product_code: number | string;
  item_unit_name: string;
  item_rate: number;
  item_gst: number;
  item_net_rate: number;
  item_qty: number;
  serial_numbers?: any;
  is_serial_number?: number;
  item_total: number;
  item_product_description: string;
  item_discount_pct: number;
  item_discount_pr: number;
  item_inner_quantity: number;
  item_outer_quantity: number;
  item_loose_quantity: number;
  item_hsn_code: string;
  conversion_rate?: string | number;
  advance_payment?: string | number;
  referance_cart_id?: any;
  item_warehouse_id: number;
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
  last_sr_by_no: number;
  [key: string]: number | string | boolean | undefined;
}

export interface ICustomFormList {
  id: number;
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  reference_column_name: string;
  data_sorce: string;
  form_type: number;
  print_or_not: number;
  min_limit: number;
  max_limit: number;
  validation_type: number;
}
export interface ICompanyTerms {
  id: number;
  invoice_view_formate: number;
  quotation_view_formate: number;
  proforma_invoice_view_formate: number;
  order_view_formate: number;
  purchase_view_formate: number;
  purchase_order_view_formate: number;
  return_sales_invoice_view_formate: number;
  return_purchase_invoice_view_formate: number;
  invoice_title: string;
  quotation_title: string;
  proforma_invoice_title: string;
  order_title: string;
  purchase_title: string;
  purchase_order_title: string;
  return_sales_invoice_title: string;
  return_purchase_invoice_title: string;
  currency_id: number;
  in_order_image_view: number;
  same_product_multiple_in_cart: number;
  quotation_terms_conditions: string;
  quotation_remark: string;
  quotation_note: string;
  proforma_invoice_terms_conditions: string;
  proforma_invoice_remark: string;
  proforma_invoice_note: string;
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
  inward_title: string;
  inward_view_formate: number;
  inward_terms_conditions: string;
  inward_remark: string;
  inward_note: string;
  dispatch_title: string;
  dispatch_view_formate: number;
  dispatch_terms_conditions: string;
  dispatch_remark: string;
  dispatch_note: string;
  gst_number: string;
  quotation_packing_charge_title: string;
  quotation_transport_charge_title: string;
  quotation_tcs_title: string;
  quotation_tsc_percentage: string | number;
  proforma_invoice_packing_charge_title: string;
  proforma_invoice_transport_charge_title: string;
  proforma_invoice_tcs_title: string;
  proforma_invoice_tsc_percentage: string | number;
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
  order_qty_unit?: number;
}

export interface ICartAll {
  cart: any;
  items: any;
}

interface ILastPartyCommonDetail {
  contact_id: number;
  type: number;
}

export interface ICustomFormFiledValuesLastParty {
  fieldName: string;
  value: any;
  dataType: number;
}

export const fetchOrderId = async (
  setCustomList: TReactSetState<ICartAll | null>,
  orderId: number | string | undefined | null,
) => {
  if (!orderId) return; // Only fetch if orderId exists

  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post("orderById", {
      cart_id: orderId,
    });

    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setCustomList(null);
      return;
    }

    // Ensure data structure matches ICartAll interface
    const formattedData = {
      cart: data.data.item.cart || null,
      items: data.data.item.items || [],
    };
    setCustomList(formattedData);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setCustomList(null);
  }
};
export const fetchOrderByCartNumber = async (
  cartNumber: string,
  setCustomList: TReactSetState<ICartAll | null>,
  isOrderShowNum: number,

) => {
  if (!cartNumber) return;

  try {
    const { data } = await axiosInstance.post("orderById", {
      cart_number: cartNumber,
      or_cart_type: isOrderShowNum
    });

    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setCustomList(null);
      return null;
    }

    const formattedData = {
      cart: data.data.item.cart || null,
      items: data.data.item.items || [],
    };

    setCustomList(formattedData);
    return formattedData;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );

    setCustomList(null);
    return null;
  }
};
export const fetchCustomInqFromApi = async (
  setCustomList: TReactSetState<ICustomFormList[]>,
  formType: number,
) => {
  const getUUID = localStorage.getItem("UUID");

  try {
    const data = await axiosInstance.post("getCustomFieldFrom", {
      a_application_login_id: Number(getUUID),
      form_type: formType,
    });
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS && data.data.data?.item) {
      setCustomList(data.data.data.item);
    } else {
      setCustomList([]);
    }
  } catch (error: any) {
    setCustomList([]);
  }
};

export const fetchCustomProductFromApi = async (
  setCustomListProduct: TReactSetState<ICustomFormList[]>,
  formType: number,
) => {
  const getUUID = localStorage.getItem("UUID");

  try {
    const data = await axiosInstance.post("getCustomFieldFrom", {
      a_application_login_id: Number(getUUID),
      form_type: 4,
    });
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS && data.data.data?.item) {
      setCustomListProduct(data.data.data.item);
    } else {
      setCustomListProduct([]);
    }
  } catch (error: any) {
    setCustomListProduct([]);
  }
};

export const fetchCompanyForTerms = async (
  setPrintDate: TReactSetState<ICompanyTerms[]>,
  setisOrderClassification: any,
) => {
  const getUUID = localStorage.getItem("UUID");
  const activeCompanyId = localStorage.getItem("COMPANY_ID");
  const isValidCompanyId =
    activeCompanyId &&
    activeCompanyId !== "undefined" &&
    activeCompanyId !== "null" &&
    Number(activeCompanyId) > 0;

  try {
    const whereClause = isValidCompanyId
      ? JSON.stringify({ id: Number(activeCompanyId), isDelete: 0 })
      : JSON.stringify({ a_application_login_id: getUUID, isDelete: 0 });

    const requestData = {
      table: "company_masters",
      columns:
        "id,invoice_view_formate,quotation_view_formate,order_view_formate,purchase_view_formate,purchase_order_view_formate,return_sales_invoice_view_formate,return_purchase_invoice_view_formate,invoice_title,quotation_title,order_title,purchase_title,purchase_order_title,return_sales_invoice_title,return_purchase_invoice_title,currency_id,in_order_image_view,same_product_multiple_in_cart,quotation_terms_conditions,quotation_remark,quotation_note,order_terms_conditions,order_remark,order_note,sales_invoice_terms_conditions,sales_invoice_remark,sales_invoice_note,return_sales_invoice_terms_conditions,return_sales_invoice_remark,return_sales_invoice_note,purchase_order_terms_conditions,purchase_order_remark,purchase_order_note,purchase_invoice_terms_conditions,purchase_invoice_remark,purchase_invoice_note,return_purchase_invoice_terms_conditions,return_purchase_invoice_remark,return_purchase_invoice_note,work_order_terms_conditions,work_order_remark,work_order_note,inward_title,inward_view_formate,inward_terms_conditions,inward_remark,inward_note,dispatch_title,dispatch_view_formate,dispatch_terms_conditions,dispatch_remark,dispatch_note,gst_number,quotation_packing_charge_title,quotation_transport_charge_title,quotation_tcs_title,quotation_tsc_percentage,order_packing_charge_title,order_transport_charge_title,order_tcs_title,order_tsc_percentage,sales_invoice_packing_charge_title,sales_invoice_transport_charge_title,sales_invoice_tcs_title,sales_invoice_tsc_percentage,return_sales_invoice_packing_charge_title,return_sales_invoice_transport_charge_title,return_sales_invoice_tcs_title,return_sales_invoice_tsc_percentage,purchase_order_packing_charge_title,purchase_order_transport_charge_title,purchase_order_tcs_title,purchase_order_tsc_percentage,purchase_invoice_packing_charge_title,purchase_invoice_transport_charge_title,purchase_invoice_tcs_title,purchase_invoice_tsc_percentage,return_purchase_invoice_packing_charge_title,return_purchase_invoice_transport_charge_title,return_purchase_invoice_tcs_title,return_purchase_invoice_tsc_percentage,work_order_packing_charge_title,work_order_transport_charge_title,work_order_tcs_title,work_order_tsc_percentage,inward_packing_charge_title,inward_transport_charge_title,inward_tcs_title,inward_tsc_percentage,dispatch_packing_charge_title,dispatch_transport_charge_title,dispatch_tcs_title,dispatch_tsc_percentage,order_qty_unit,proforma_invoice_view_formate,proforma_invoice_title,proforma_invoice_terms_conditions,proforma_invoice_remark,proforma_invoice_note,proforma_invoice_packing_charge_title,proforma_invoice_transport_charge_title,proforma_invoice_tcs_title,proforma_invoice_tsc_percentage,proforma_invoice_prefix,proforma_invoice_doc_no,proforma_invoice_view_color,proforma_invoice_series_pattern,proforma_invoice_effect_last_data_on_new,proforma_invoice_sr_number_generate_flag,parent_company_id",
      where: whereClause,
      request_flag: 2,
    };
    const data = await axiosInstance.post("mainCommonGet", requestData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS || !data.data.data?.[0]) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
      return;
    }
    const printData = data.data.data[0];
    const orderClassification = data.data.data[0]?.order_qty_unit;
    if (setisOrderClassification) {
      setisOrderClassification(orderClassification);
    }

    const printdate = Array.isArray(printData) ? printData : [printData];
    setPrintDate(printdate);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
interface Product {
  id: number | string; // adjust according to your actual ID type
  // Add other properties you use, e.g.:
  name?: string;
  barcode?: string;
  price?: number;
  // ... any other fields from your API
}

export const fetchProductApiForOrder = async (
  page: number,
  itemsPerPage: number,
  search: string,
  searchBarcodeNum1: number,
  selectedCategory: { label: string; value: string } | null,
  selectedPriceList: { label: string; value: string } | null,
  Contact: IUserList | undefined,
  setProductList: React.Dispatch<React.SetStateAction<Product[]>>, // ← fixed here
  isOrderShowNum: number,
  wherecall: number,
  isPriceListTouched?: boolean,
): Promise<Product[]> => {
  // ← fixed here
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const start: number = page * itemsPerPage;

  const requestData = {
    ul: start,
    ll: itemsPerPage,
    a_application_login_id: getUUID,
    searchTerm: search || "",
    searchBarcodeNum: searchBarcodeNum1,
    searchCategoryId: selectedCategory ? selectedCategory.value : null,
    assinged_to_price_list: isPriceListTouched
      ? selectedPriceList?.value || null
      : Contact?.assinged_to_price_list,
    contact_id: Contact?.id,
    cart_type: isOrderShowNum,
    wherecall,
  };

  try {
    const response = await axiosInstance.post("product", requestData);

    if (response.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      console.warn("API ack failed, no more data");
      return [];
    }

    // Explicitly type the items from API
    const newItems: Product[] = response.data.data.item || [];

    if (page === 0) {
      setProductList(newItems);
    } else {
      setProductList((prev) => {
        const existingIds = new Set(prev.map((item) => item.id)); // item is now Product
        const uniqueNew = newItems.filter((item) => !existingIds.has(item.id)); // item is now Product
        return [...prev, ...uniqueNew];
      });
    }

    return newItems;
  } catch (error: any) {
    console.error("Error fetching products:", error);
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    return [];
  }
};

export const fetchCategoryApiForOrder = async (
  setCategoryList: React.Dispatch<React.SetStateAction<any[]>>,
) => {
  const getUUID = await localStorage.getItem("UUID");
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
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setCategoryList([]);
  }
};

export const fetchpricelistForOrder = async (
  setPriceList: React.Dispatch<React.SetStateAction<any[]>>,
  setSelectedPriceList: React.Dispatch<
    React.SetStateAction<{ label: string; value: string } | null>
  >,
  pricelistOptions: { value: any; label: any }[],
  Contact: IUserList | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "pricelist_masters",
    columns: "id,price_list_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);
    setPriceList(response.data.data);

    const selectedPrice =
      pricelistOptions.find(
        (option) => option.value == Contact?.assinged_to_price_list,
      ) || null;

    setSelectedPriceList(selectedPrice);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setPriceList([]);
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

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS && response.data.data?.item) {
      setCurrency(response.data.data.item);
    } else {
      setCurrency([]);
    }
  } catch (error: any) {
    console.error("Error fetching currency:", error);
    setCurrency([]);
  }
};

export const fetchwrehouse = async (setWarehouse: TReactSetState<any>) => {
  try {
    const token = localStorage.getItem("token");
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      a_application_login_id: uuid,
    };
    const response = await axiosInstance.post("getwarehouse", requestData, {
      headers: {
        Authorization: token,
      },
    });

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS && response.data.data?.item) {
      setWarehouse(response.data.data.item);
    } else {
      setWarehouse([]);
    }
  } catch (error: any) {
    console.error("Error fetching warehouse:", error);
    setWarehouse([]);
  }
};

export const formatDateTimeForInput = (
  dateTime: string | undefined,
): string => {
  if (!dateTime) return "";
  try {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

export const fetchContactDetail = async (
  contact_id: number | undefined,
  setContactDetail: TReactSetState<any>,
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    contact_master_id: contact_id,
    request_flag: 1,
  };
  try {
    const data = await axiosInstance.post("singleContactData", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setContactDetail([]);
    }
    setContactDetail(data.data.data);
  } catch (error: any) {
    setContactDetail([]);
  }
};

export const fetchPaymentTypeApi = async (
  setPaymentTypeList: TReactSetState<
    { id: number; task_category_name: string }[]
  >,
) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  if (!getUUID || !token) {
    setPaymentTypeList([]);
    return;
  }

  const requestData = {
    table: "payment_types",
    columns: "id,payment_type_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS && response.data.data) {
      setPaymentTypeList(response.data.data);
    } else {
      setPaymentTypeList([]);
    }
  } catch (error: any) {
    setPaymentTypeList([]);
  }
};

export const fetchLastPartyCommonDetail = async ({
  contact_id,
  type,
}: ILastPartyCommonDetail) => {
  try {
    const getUUID = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("last-fetch-party-detail", {
      a_application_login_id: getUUID,
      contact_id,
      type,
    });

    // Handle success properly
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return {
        customFormFiledValues: data.data?.customFormFiledValues ?? [],
        cartValues: data.data?.cartValues ?? null,
      };
    }

    // Handle API failure response
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);

    return {
      customFormFiledValues: [],
      cartValues: null,
    };
  } catch (error: any) {
    // Safe error handling
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );

    return {
      customFormFiledValues: [],
      cartValues: null,
    };
  }
};
