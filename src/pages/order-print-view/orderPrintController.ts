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

export const handleDownload = async (
  cartId: string | undefined,
  MobileToken: string | undefined,
  getID: string | undefined,
  request_flag?: string | number,
) => {
  try {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    if (request_flag == "downloadPdf") {
      const resops = await axiosInstance.post(
        "/order-pdf",
        { cart_id: cartId },
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
