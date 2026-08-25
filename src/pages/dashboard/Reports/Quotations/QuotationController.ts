import axios from "axios";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";
import { fetchTemplatesForDocType } from "../../../order-print-view/orderPrintController";

export interface ICartItem {
  id: number;
  type: number;
  cart_number: string;
  sr_by_number: number;
  is_approve: string;
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
  created_date_time: string;
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

export interface IFlatCartItem {
  id: number;
  username: string;
  cart_number: string;
  created_date_time: string;
  update_Date_time?: string;
  cart_status: string;
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
  customForm: {
    fieldName: string;
    value: string;
  }[];
  [key: string]: any;
}
const openInNewTabPrint = (path: string, id: number) => {
  const baseURL = window.location.origin;
  const token = localStorage.getItem("token");

  window.open(`${baseURL}${path}/${id}`, "_blank");
};

export const openPrint = (
  id: number | string,
  viewFormate: number | undefined,
  onlyView?: number,
) => {
  let baseURL = window.location.origin;
  let printUrl;
  if (onlyView == 1) {
    printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${id}/1`;
  } else {
    printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${id}`;
  }

  const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

  if (myWindow) {
    if (onlyView !== 1) {
      let isPrinted = false;
      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 4000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
            console.log("waiting...");
          }
        }, 100);
      };

      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });

      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    }
  } else {
    console.error("Failed to open print");
  }
};
export const openPendingPrint = (
  id: number,
  viewFormate: number | undefined,
  onlyView?: number,
) => {
  // window.open(`${baseURL}/PendingPrintViewV1/${id}/${viewFormate}`, "_blank");
  let baseURL = window.location.origin;

  let printUrl;
  if (onlyView == 1) {
    printUrl = `${baseURL}/PendingPrintViewV1/${id}/${viewFormate}`;
  } else {
    printUrl = `${baseURL}/PendingPrintViewV1/${id}/${viewFormate}`;
  }

  //  printUrl = `${baseURL}/PendingPrintViewV1/${id}/${viewFormate}`;
  const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

  if (myWindow) {
    if (onlyView !== 1) {
      let isPrinted = false;
      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 2000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
            console.log("waiting...");
          }
        }, 100);
      };
      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });
      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    }
  } else {
    console.error("Failed to open print");
  }

  // openInNewTabPrint(`/PendingPrintViewV1`, id);
  // /PendingPrintViewV1/:id/:type
};

const PENDING_DOC_TYPE_BY_CART_TYPE: Record<number, string> = {
  2: "pendingSalesOrder",
  5: "pendingPurchaseOrder",
};

export const generateAndPrintPendingPdf = async (cartId: number, documentTemplateId?: number) => {
  try {
    const resops = await axiosInstance.post("/order-pdf", {
      cart_id: cartId,
      print_variant: "pending",
      ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}),
    });
    if (resops.data.ack !== 1) {
      toast.error(resops.data.ack_msg);
      return;
    }
    const response = await axios.get(resops.data.data.path, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const pdfWindow = window.open(url, "_blank");
    if (pdfWindow) {
      pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
    }
  } catch (error) {
    console.error(error);
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// Click-time check (same shape as ListOrderView.tsx's isPdfmeEnabledForType/
// openPrint) -- called BEFORE opening any window, so only one print path
// ever fires. This is a plain module, not a component, so it can't own the
// picker's React state itself: returns a result the caller (a page
// component) acts on, instead of the old always-navigate-to-the-legacy-
// page behavior openPendingPrint above still has for its other callers.
export type PendingPdfmePrintResult =
  | { status: "handled" }
  | { status: "picker"; choices: { id: number; template_name: string; is_default: number }[] }
  | { status: "legacy" };

export const tryPendingPdfmePrint = async (
  id: number,
  cartType: number,
): Promise<PendingPdfmePrintResult> => {
  const docType = PENDING_DOC_TYPE_BY_CART_TYPE[cartType];
  if (!docType) return { status: "legacy" };

  const companyMastersId = localStorage.getItem("COMPANY_ID");
  if (!companyMastersId) return { status: "legacy" };

  try {
    const { data } = await axiosInstance.post("get-feature-flag", {
      company_masters_id: companyMastersId,
      feature_key: "document_designer",
    });
    if (data?.ack !== 1 || !data.data.item.is_enabled) return { status: "legacy" };
  } catch {
    return { status: "legacy" };
  }

  const choices = await fetchTemplatesForDocType(docType);
  if (choices.length > 1) {
    return { status: "picker", choices };
  }
  await generateAndPrintPendingPdf(id);
  return { status: "handled" };
};

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

      // Create a link and trigger download
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

  const requestedData = {
    type: 1,
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
    selectedCategory: selectedCategory
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
    throw error; // Let the caller handle the error
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
    type: 1,
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

  // ✅ RETURN FLATTENED DATA
  return flattenCartDataForExport(items);
};

export const exportAllQuotationData = async <T>(
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

export const openBulkPrint = (
  ids: number[],
  viewFormate: number | undefined,
  onlyView?: number
) => {
  let baseURL = window.location.origin;

  const idsParam = ids.join(",");

  let printUrl;

  if (onlyView == 1) {
    printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${idsParam}/1`;
  } else {
    printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${idsParam}`;
  }

  const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

  if (myWindow) {
    let isPrinted = false;

    myWindow.onload = () => {
      const checkContent = setInterval(() => {
        const contentElement = myWindow.document.querySelector("body > *");

        if (contentElement && myWindow.document.readyState === "complete") {
          clearInterval(checkContent);

          if (!isPrinted) {
            isPrinted = true;

            setTimeout(() => {
              myWindow.print();
            }, 3000);

            myWindow.onafterprint = () => myWindow.close();
          }
        }
      }, 100);
    };
  }
};