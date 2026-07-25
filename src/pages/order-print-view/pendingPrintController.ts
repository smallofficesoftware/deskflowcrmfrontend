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

export const fetchOrderByForPrintIdApi = async (
  cartId: number | undefined,
  setOrderPrintById: TReactSetState<ItemDetails | undefined>,
  MobileToken: any,
  getID: any,
  print_flag:number,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post(
      "orderById",
      {
        cart_id: cartId,
        request_flag: 2,
        isDelete: 0,
        print_flag: print_flag
      });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setOrderPrintById(data.data.item);
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

export const fetchCustomForm = async (
  form_type: number | undefined,
  setCustomOrderPdfViewById: TReactSetState<ItemDetails | undefined>,
  mobileToken?: string,
  getID?: string

) => {
  const getUUID = getID || localStorage.getItem("UUID");
  const token = mobileToken || localStorage.getItem("token");

  if (!getUUID || !token || form_type === undefined) {
    console.error("fetchCustomForm: Missing required parameters", {
      getUUID,
      token,
      form_type,
    });
    toast.error("Missing authentication or form type");
    return;
  }

  try {
  
    const { data } = await axiosInstance.post(
      "getCustomFieldFrom",
      {
        a_application_login_id: getUUID,
        form_type: form_type,
      }
    );

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
        console.error("fetchCustomForm: API acknowledged failure", data.ack_msg);
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


export const fetchCurrency = async (
  setCurrency: TReactSetState<any>,
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axiosInstance.post(
      "currency",
      {},
      {
        headers: {
          Authorization: token,
        },
      }
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
