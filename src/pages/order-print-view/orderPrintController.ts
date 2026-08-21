import axios from "axios";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";
import { ItemDetails } from "../order-pdf-view/OrderPdfController";

export interface OrderByForPrintIdExist {
  exists: boolean;
}

// export const fetchOrderByForPrintIdApi = async (
//   cartId: number | number[] | undefined,
//   setOrderPrintById: TReactSetState<ItemDetails | undefined>,
//   MobileToken: any,
//   getID: any,
// ) => {
//   const getUUID = getID || localStorage.getItem("UUID");
//   const token = MobileToken || localStorage.getItem("token");
//   try {
//     const { data } = await axiosInstance.post("orderById", {
//       cart_id: cartId,
//       request_flag: 2,
//       isDelete: 0,
//       a_application_login_id: getUUID,
//     });
//     if (data.code === 200) {
//       if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
//         setOrderPrintById(data.data.item);
//       } else {
//         toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//       }
//     } else {
//       toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//     }
//   } catch (error: any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//   }
// };

export const fetchOrderByForPrintIdApi = async (
  cartId: number | number[] | undefined,
  MobileToken: any,
  getID: any,
): Promise<ItemDetails | null> => {
  const getUUID = getID || localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("orderById", {
      cart_id: cartId,
      request_flag: 2,
      isDelete: 0,
      a_application_login_id: getUUID,
    });

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return data.data.item; // ✅ RETURN karo
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return null;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
};
export const fetchMultipleOrdersForPrint = async (
  cartIds: number[],
  setData: any,
  MobileToken: any,
  getID: any
) => {
  const getUUID = getID || localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("orderByMultipleId", {
      cart_id: cartIds,
      request_flag: 2,
      isDelete: 0,
      a_application_login_id: getUUID,
    });

    if (data.ack === 1) {
      setData(data.data.items); // array
    }
  } catch (err) {
    console.error(err);
  }
};

export const fetchCustomForm = async (
  form_type: number | undefined,
  setCustomOrderPdfViewById: TReactSetState<ItemDetails | undefined>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  if (!getUUID || !token || form_type === undefined) {
    console.error("fetchCustomForm: Missing required parameters", {
      getUUID,
      token,
      form_type,
    });
    toast.error("Missing authentication or form type-printController");
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
        if (!item || !item.customCart) {
          console.warn("fetchCustomForm: No customCart in response", item);
          setCustomOrderPdfViewById({ ...item, customCart: [] });
        } else {
          setCustomOrderPdfViewById(item);
        }
      } else {
        console.error(
          "fetchCustomForm: API acknowledged failure",
          data.ack_msg,
        );
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      console.error("fetchCustomForm: API returned non-200 code", data);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("fetchCustomForm error", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
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

export const fetchContactDetail = async (
  setContactDetail: TReactSetState<any>,
  contact_id: number | undefined,
  MobileToken: any,
  getID: any,
) => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");
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
    console.log(error);

    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};

// §7: whenever the company's document_designer flag is on and it has 2+
// templates for this cart's doc type, the caller should show a picker
// before calling handleDownload — same rule Flutter's
// pickDocumentTemplate() and V1's Print action already follow (skip the
// picker below 2 templates). Mirrors orderServices.js's
// PDFME_DOC_TYPE_BY_CART_TYPE — keep both in sync when adding a doc type.
const PDFME_DOC_TYPE_BY_CART_TYPE: Record<number, string> = {
  1: "quotation",
  2: "salesOrder",
  3: "salesInvoice",
  4: "purchaseInvoice",
  5: "purchaseOrder",
  6: "returnSalesInvoice",
  7: "returnPurchaseInvoice",
  8: "inward",
  9: "dispatch",
  12: "proformaInvoice",
};

export const isPdfmeSupportedCartType = (cartType: number | undefined): boolean =>
  !!PDFME_DOC_TYPE_BY_CART_TYPE[Number(cartType)];

export const fetchPdfmeTemplatesForPicker = async (
  cartType: number | undefined,
): Promise<{ id: number; template_name: string; is_default: number }[]> => {
  const docType = PDFME_DOC_TYPE_BY_CART_TYPE[Number(cartType)];
  if (!docType) return [];
  const companyMastersId = localStorage.getItem("COMPANY_ID");
  if (!companyMastersId) return [];
  try {
    const { data: flagData } = await axiosInstance.post("get-feature-flag", {
      company_masters_id: companyMastersId,
      feature_key: "document_designer",
    });
    if (flagData?.ack !== 1 || !flagData.data.item.is_enabled) return [];

    const { data: listData } = await axiosInstance.post("document-templates/list", {
      company_masters_id: companyMastersId,
      doc_type: docType,
    });
    const templates = listData?.ack === 1 ? listData.data.item : [];
    return templates.length > 1 ? templates : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Same rule as fetchPdfmeTemplatesForPicker above, keyed by a literal
// doc_type instead of a cart type -> doc_type map — for non-cart doc types
// like shippingLabel that don't have their own cart type id.
export const fetchTemplatesForDocType = async (
  docType: string,
): Promise<{ id: number; template_name: string; is_default: number }[]> => {
  const companyMastersId = localStorage.getItem("COMPANY_ID");
  if (!companyMastersId) return [];
  try {
    const { data: flagData } = await axiosInstance.post("get-feature-flag", {
      company_masters_id: companyMastersId,
      feature_key: "document_designer",
    });
    if (flagData?.ack !== 1 || !flagData.data.item.is_enabled) return [];

    const { data: listData } = await axiosInstance.post("document-templates/list", {
      company_masters_id: companyMastersId,
      doc_type: docType,
    });
    const templates = listData?.ack === 1 ? listData.data.item : [];
    return templates.length > 1 ? templates : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const handleDownload = async (
  cartId: string | undefined,
  MobileToken: string | undefined,
  getID: string | undefined,
  request_flag?: string | number,
  documentTemplateId?: number,
) => {
  try {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    if (request_flag == "downloadPdf") {
      const resops = await axiosInstance.post(
        "/order-pdf",
        {
          cart_id: cartId,
          ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}),
        },
        {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": getUUID,
          },
        },
      );
      if (resops.data.ack === 1) {
        const fileUrl = resops.data.data.path;
        const response = await axios.get(fileUrl, { responseType: "blob" });
        const fileName = resops.data.data.title;
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        toast.error(resops.data.ack_msg);
      }

      // handleHide();
    } else if (request_flag == "shareInWhatsapp") {
      const { data } = await axiosInstance.post("/send-sales-pdf-whatsapp", {
        cart_id: cartId,
        a_application_login_id: getUUID,
      });
      if (data && data.code == 200) {
        toast.success("WhatsApp message sent successfully.");
      }
    }
  } catch (error: any) {
    console.log(error);

    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};
