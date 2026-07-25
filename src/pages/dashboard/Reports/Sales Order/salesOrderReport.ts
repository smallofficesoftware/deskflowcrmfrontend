import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ICartItem {
  id: number;
  type: number;
  cart_number: string;
  is_approve: string;
  sr_by_number: number;
  cart_date: string;
  cart_status: number;
  a_application_login_id: number;
  company_masters_id: number;
  to_customer_id: number;
  to_customer_name: string;
  to_customer_phone: string;
  to_customer_gst_number: string;
  to_customer_price_list_id: number;
  country_id: number;
  state_id: number;
  city_id: number;
  area_id: number;
  PinCode: string;
  Address: string;
  shipping_address: string;
  cart_remark: string;
  cart_terms_and_condition: string;
  total_amt: number;
  total_qty: number;
  discount_pct: number;
  discount_pr: number;
  packing_forwarding_charge: number;
  transport_charge: number;
  taxable_amt: number;
  gst_amt: number;
  tcs_amt: number;
  round_off: number;
  grand_total: number;
  is_reminder: number;
  isDelete: number;
  isActive: number;
  s_timestemp: string;
  item_product_name: string;
  item_product_code: string;
  item_qty: number;
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
  customForm?: any[];
  statusDetails: {
    name: string;
    color: string;
  };

  [key: string]: any;
}

export interface ICartData {
  username: string;
  quotation: ICartItem[];
  order: ICartItem[];
  sell_invoice: ICartItem[];
  purchase_invoice: ICartItem[];
  purchase_order: ICartItem[];
}

export interface IFlatCartItem {
  id: number;
  srno: number;
  username: string;
  cart_number: string;
  created_date_time: string;
  update_Date_time?: string;
  cart_status: string;
  statusDetails?: { name: string; color: string };
  status_colour?: string;
  to_customer_name: string;
  to_customer_company_name?: string;
  to_customer_phone?: string;
  taxable_amt: string;
  gst_amt: string;
  tcs_amt: string;
  round_off: string;
  grand_total: string;
  currency_name: string;
  is_approve?: {
    name: string;
    bg_color: string;
    text_color: string;
    border_color: string;
  };
  customForm: any[];
  [key: string]: any; // custom fields ke liye
}

export const handleDownload = async (id: number, handleHide: () => void) => {
  try {
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");

    if (!token || !getUUID) {
      toast.error("Authentication details are missing");
      return;
    }

    const resops = await axiosInstance.post("/order-pdf", { cart_id: id });

    if (resops.data.ack === 1) {
      const fileUrl = resops.data.data.path;

      if (!fileUrl) {
        toast.error("File URL not provided");
        return;
      }

      const response = await axiosInstance.get(fileUrl, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = resops.data.data.title;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch?.[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      handleHide();
    } else {
      toast.error(resops.data.ack_msg || "Failed to generate PDF");
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    console.error("Error downloading the file", error);
  }
};

export const fetchCartReport = async (
  selectedDates: DateObject[] | any | undefined,
  selectedTeamMembers: string[] | null,
  selectedStageStatus?: string[] | null,
  MobileToken?: string,
  getID?: string,
  ul?: number,
  ll?: number,
  globalSearch?: string,
  selectedSeries?: string[] | null,
  setCurrencyName?: any,
  selectedContactId?: string | null,
  referenceWiseContact?: number,
  selectedGstOptions?: string[] | null,
  selectedProduct?: string | null,
  selectedCategory?: string | null,
) => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  if (!token || !getUUID) {
    toast.error("Authentication details are missing");
    return;
  }

  const requestedData = {
    type: 2,
    selectedDates: selectedDates
      ? selectedDates.map((date: DateObject | any) =>
        date instanceof DateObject ? date?.format("YYYY-MM-DD") : date,
      )
      : undefined,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers || undefined,
    selectedStageStatus: selectedStageStatus || undefined,
    selectedSeries: selectedSeries || undefined,
    ul: ul ?? 0,
    ll: ll ?? 50,
    globalSearch,
    selectedContactId: selectedContactId || "",
    referenceWiseContact: referenceWiseContact,
    selectedGstOptions: selectedGstOptions,
    selectedProduct: selectedProduct,
    selectedCategory: selectedCategory,
    

  };

  try {
    const response = await axiosInstance.post("getTeamAllCarts", requestedData);

    const items: IFlatCartItem[] = response?.data?.data?.item || [];
    const getcurrncy = response?.data?.data.currency_name || " ";

    if (response.data.ack == 3) {
      toast.error(response.data.ack_msg);
    }
    return { items, getcurrncy };
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    throw error;
  } finally {
    setTimeout(() => { }, 2000);
  }
};

export const flattenCartDataForExport = (apiItems: any[]): IFlatCartItem[] => {
  return apiItems.map((item: any) => ({
    id: item.id,
    username: item.username,
    cart_number: item.cart_number || item.reference_no,
    created_date_time: item.created_date_time,
    update_Date_time: item.update_Date_time || item.approve_date_time,
    cart_status: item.statusDetails?.name || item.cart_status,
    to_customer_name: item.to_customer_name,
    to_customer_company_name: item.to_customer_company_name,
    to_customer_phone: item.to_customer_phone,
    taxable_amt: item.taxable_amt,
    gst_amt: item.gst_amt,
    tcs_amt: item.tcs_amt,
    round_off: item.round_off,
    grand_total: item.grand_total,
    customForm: Array.isArray(item.customForm)
      ? item.customForm.map((cf: any) => ({
        fieldName: cf.reference_column_name,
        value: cf.value,
      }))
      : [],
    ...item,
  }));
};

export const fetchCartReportForExport = async (
  selectedDates: any,
  selectedTeamMembers: string[] | null,
  selectedStageStatus?: string[] | null,
  MobileToken?: string,
  getID?: string,
  offset = 0,
  limit = 500,
  globalSearch?: string,
  selectedSeries?: string[] | null,
  selectedContactId?: string | null,
  selectedGstOptions?: string[] | null,
  selectedProduct?: string | null,
  selectedCategory?: string | null,
): Promise<IFlatCartItem[]> => {
  const payload: any = {
    type: 2,
    ul: offset,
    ll: limit,
  };
  const getUUID = getID || localStorage.getItem("UUID");
  payload.a_application_login_id = getUUID;
  if (selectedTeamMembers?.length)
    payload.selectedTeamMembers = selectedTeamMembers;
  if (selectedStageStatus?.length)
    payload.selectedStageStatus = selectedStageStatus;
  if (selectedContactId?.length)
    payload.selectedContactId = selectedContactId;
  if (selectedGstOptions?.length)
    payload.selectedGstOptions = selectedGstOptions;
  if (selectedProduct?.length)
    payload.selectedProduct = selectedProduct;
  if (selectedCategory?.length)
    payload.selectedCategory = selectedCategory;
  if (selectedSeries?.length) payload.selectedSeries = selectedSeries;
  if (globalSearch) payload.globalSearch = globalSearch;

  if (selectedDates?.length) {
    payload.selectedDates = selectedDates.map((d: any) =>
      d instanceof DateObject ? d.format("YYYY-MM-DD") : d,
    );
  }

  const response = await axiosInstance.post("getTeamAllCarts", payload);

  const items = response?.data?.data?.item || [];

  return flattenCartDataForExport(items);
};

export const exportAllOrderData = async <T>(
  fetchFn: (offset: number, limit: number) => Promise<T[] | any>,
  limit = 500,
): Promise<T[]> => {
  let offset = 0;
  let allData: T[] = [];

  while (true) {
    const response = await fetchFn(offset, limit);

    const chunk: T[] = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];
    if (chunk.length === 0) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};
