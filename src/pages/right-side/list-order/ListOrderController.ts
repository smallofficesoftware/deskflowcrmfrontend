import { toast } from "react-toastify";
import { formatDateTimeSendDataBase } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { IStageStatusView } from "../../left-side/header/Setting/stage-status/StageStatusController";
import { IReminder } from "../RightViewController";

export interface IOrder {
  id: number;
  type: number;
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
  currency_id: number;
  created_date_time: string;
  cart_status: number;
  stage_status_name: string;
  stage_status_color: string;
  to_customer_name: string;
  to_customer_phone: number;
  referance_cart_name: string;
  referance_cart_id: string;
  cart_number: string;
  cart_date: Date;
  due_date: string;
  transaction_mode: string;
  is_reminder: number;
  reminder_data_time: string;
  reminder_remark: string;
  update_Date_time: string;
  approved_by: string;
  created_by: string;
  closing_balance: number | string;
  quotation_view_formate: number;
  invoice_view_formate: number;
  order_view_formate: number;
  purchase_view_formate: number;
  quotation_title: string;
  order_title: string;
  invoice_title: string;
  purchase_title: string;
  purchase_order_title: string;
  purchase_order_view_formate: number;
  return_sales_invoice_view_formate: number;
  return_purchase_invoice_view_formate: number;
  inward_view_formate: number;
  dispatch_view_formate: number;
  proforma_invoice_view_formate: number;
  last_sr_by_no: number;
}

// order Type 10 = Stock Inward and 11 = Stock Outward so do not use this two type he is work in direactly backend side
export const orderTypesList = [
  { id: "1", type: "Quotation" },
  { id: "2", type: "Sales Order" },
  { id: "3", type: "Sales Invoice" },
  { id: "4", type: "Purchase Invoice" },
  { id: "5", type: "Purchase Order" },
  { id: "6", type: "Return Sales Invoice" },
  { id: "7", type: "Return Purchase Invoice" },
  { id: "8", type: "Inward" },
  { id: "9", type: "Dispatch" },
  { id: "12", order_type: "Proforma Invoice" },
];

// order Type 10 = Stock Inward and 11 = Stock Outward so do not use this two type he is work in direactly backend side
export const orderTypesSendList = [
  { id: "1", type: "quotation" },
  { id: "2", type: "order" },
  { id: "3", type: "invoice" },
  { id: "4", type: "purchase_order" },
  { id: "5", type: "order_purchase" },
  { id: "6", type: "return_sales_invoice" },
  { id: "7", type: "return_purchase_invoice" },
  { id: "8", type: "inward" },
  { id: "9", type: "dispatch" },
  { id: "12", order_type: "Proforma Invoice" },
];
export const fetchListOrderApi = async (
  currentPage: number,
  ITEMS_PER_PAGE: number,
  setOrderList: (items: IOrder[]) => void,
  // setOrderList: TReactSetState<IOrder[]>,
  setNoDataFound: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  contactMasterId: number,
  term: string,
  isOrderShowNum: number,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  const start: number = currentPage * ITEMS_PER_PAGE;

  try {
    const { data } = await axiosInstance.post("listOrder", {
      ul: start,
      ll: ITEMS_PER_PAGE,
      a_application_login_id: getUUID,
      contact_master_id: contactMasterId,
      searchTerm: term ? term.trim() : "",
      order_type: isOrderShowNum,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        //   if (page === 0) {
        setLoading(true);
        setOrderList(data.data.item);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setNoDataFound(data.data.item.length === 0);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000);
  }
};

export const fetchOrderByIdApi = async (
  cartId: number,
  setLoading: TReactSetState<boolean>,
  setOrderById: TReactSetState<IOrder | undefined>,
  setIsOrderShowNum: TReactSetState<any>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post("orderById", {
      cart_id: cartId,
      a_application_login_id: Number(getUUID),
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);

        setOrderById(data.data.item);
        setIsOrderShowNum(data.data.item.cart.type);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const handleDeleteOrder = async (
  cartId: number | number[] | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  onSuccess?: () => void,
  isOrderShowNum?: number,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("deleteOrder", {
      cart_id: cartId,
      a_application_login_id: Number(getUUID),
      cart_type: isOrderShowNum,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success("Deleted Successfully");
        if (onSuccess) onSuccess();
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

export const handleConvertIntoOrder = async (
  cartId: number | number[] | undefined,
  cartNumber: string | string[],
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 2,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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
export const handleConvertIntoInvoice = async (
  cartId: number | number[] | undefined,
  cartNumber: string | string[],
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 3,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
      multiConvert: 1, // 1=> true 2=> False
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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

export const handleConvertIntoPurchaseInvoice = async (
  cartId: number | number[] | undefined,
  cartNumber: string | string[],
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 4,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
      multiConvert: 1, // 1=> true 2=> False
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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

export const handleModalConvertIntoReturnSalesInvoices = async (
  cartId: number | undefined,
  cartNumber: string,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 6,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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

export const handleConvertIntoReturnPurchaseInvoice = async (
  cartId: number | undefined,
  cartNumber: string,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 7,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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

export const handleConvertIntoDispath = async (
  cartId: number | undefined,
  cartNumber: string,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 9,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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

export const handleConvertIntoInward = async (
  cartId: number | undefined,
  cartNumber: string,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setIsConversionSuccess?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewCartID?: TReactSetState<any>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("covertOrderSystem", {
      cart_id: cartId,
      cart_type: 8,
      request_flag: 1,
      a_application_login_id: Number(getUUID),
      reference_cart_number: cartNumber,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        setRefreshTransactions(true);
        toast.success(data.ack_msg);
        setIsConversionSuccess && setIsConversionSuccess(true);
        setNewCartID && setNewCartID(data.data.item);
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

interface MakeCopyApiResponse {
  code: number;
  ack: number;
  ack_msg: string;
  data: {
    item: {
      cart_id: number;
    }[];
  };
}

export const handleMakeNewCopy = async (
  cartType: number,
  cartId: number | undefined,
  setIsMakeCartCopyConfirmation: TReactSetState<boolean>,
  setRefreshTransactions: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setOrderById: TReactSetState<any>,
  setIsOrderShowNum1: TReactSetState<number>,
  setIsEditOrderShow: TReactSetState<boolean>,
): Promise<void> => {
  const getUUID = localStorage.getItem("UUID");

  try {
    setLoading(true);

    const { data } = await axiosInstance.post<MakeCopyApiResponse>(
      "covertOrderSystem",
      {
        cart_id: cartId,
        cart_type: cartType,
        request_flag: 2,
        a_application_login_id: Number(getUUID),
      },
    );

    if (data.code === 200 && data.ack === 1) {
      toast.success(data.ack_msg);
      setIsMakeCartCopyConfirmation(false);
      setRefreshTransactions(true);

      // Extract new cart id
      const newId = Number(data.data.item);

      if (newId) {
        // Direct fetch & open modal (NO useEffect, NO conversion logic)
        await fetchOrderByIdApi(
          newId,
          setLoading,
          setOrderById,
          setIsOrderShowNum1,
        );

        setIsEditOrderShow(true); // ✅ modal open
      } else {
        console.error("New cart ID not found");
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error(error);
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  } finally {
    setLoading(false);
  }
};
export const fetchStageStatusForOrderApi = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  isOrderShowNum: number,
  current_status: number | undefined,
) => {
  const orderTypeMap: Record<number, number> = {
    1: 3,
    2: 4,
    3: 5,
    4: 6,
    5: 7,
    6: 9,
    7: 10,
    9: 11,
    8: 12,
  };

  const orderType = orderTypeMap[isOrderShowNum] || 5;

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: orderType,
    a_application_login_id: getUUID,
    action_flag: "update",
    current_status: current_status || "",
  };

  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setStageStatusList([]);
    }
    setStageStatusList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateStageStatusForOrderRadioButton = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
  setIsModalAssignStatusVisible: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "carts",
    where: JSON.stringify({ id: hasOneData }),
    data: `{"cart_status":"${selectedOptions}"}`,
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        setIsModalAssignStatusVisible(false);
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const fetchCompanyForOrderApi = async (
  setCompanyDetail: TReactSetState<any[] | undefined>,
) => {
  const getUUID = localStorage.getItem("UUID");
  const activeCompanyId = localStorage.getItem("COMPANY_ID");
  const isValidCompanyId =
    activeCompanyId &&
    activeCompanyId !== "undefined" &&
    activeCompanyId !== "null" &&
    Number(activeCompanyId) > 0;

  const whereClause = isValidCompanyId
    ? JSON.stringify({ isDelete: 0, id: Number(activeCompanyId) })
    : JSON.stringify({ isDelete: 0, a_application_login_id: Number(getUUID) });

  const requestData = {
    table: "company_masters",
    columns:
      "id,company_name,company_email,terms_and_condition,invoice_view_formate,quotation_view_formate,order_view_formate,purchase_view_formate,purchase_order_view_formate,return_sales_invoice_view_formate,return_purchase_invoice_view_formate,inward_view_formate,dispatch_view_formate,proforma_invoice_view_formate,invoice_title,quotation_title,order_title,purchase_title,purchase_order_title,return_sales_invoice_title,return_purchase_invoice_title,inward_title,dispatch_title,proforma_invoice_title,quotation_terms_conditions,quotation_remark,quotation_note,order_terms_conditions,order_remark,order_note,sales_invoice_terms_conditions,sales_invoice_remark,sales_invoice_note,return_sales_invoice_terms_conditions,return_sales_invoice_remark,return_sales_invoice_note,purchase_order_terms_conditions,purchase_order_remark,purchase_order_note,purchase_invoice_terms_conditions,purchase_invoice_remark,purchase_invoice_note,return_purchase_invoice_terms_conditions,return_purchase_invoice_remark,return_purchase_invoice_note,quotation_packing_charge_title,quotation_transport_charge_title,quotation_tcs_title,quotation_tsc_percentage,order_packing_charge_title,order_transport_charge_title,order_tcs_title,order_tsc_percentage,sales_invoice_packing_charge_title,sales_invoice_transport_charge_title,sales_invoice_tcs_title,sales_invoice_tsc_percentage,return_sales_invoice_packing_charge_title,return_sales_invoice_transport_charge_title,return_sales_invoice_tcs_title,return_sales_invoice_tsc_percentage,purchase_order_packing_charge_title,purchase_order_transport_charge_title,purchase_order_tcs_title,purchase_order_tsc_percentage,purchase_invoice_packing_charge_title,purchase_invoice_transport_charge_title,purchase_invoice_tcs_title,purchase_invoice_tsc_percentage,return_purchase_invoice_packing_charge_title,return_purchase_invoice_transport_charge_title,return_purchase_invoice_tcs_title,return_purchase_invoice_tsc_percentage,proforma_invoice_packing_charge_title,proforma_invoice_transport_charge_title,proforma_invoice_tcs_title,proforma_invoice_tsc_percentage,parent_company_id",
    where: whereClause,
    request_flag: 2,
  };
  try {
    const data = await axiosInstance.post("mainCommonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS || !data.data.data) {
      setCompanyDetail([]);
      return;
    }
    setCompanyDetail(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const createReminderForCart = async (
  insertObj: IReminder,
  contactId: number | undefined,
  cartId: number | undefined,
  setIsReminderConfirmation: TReactSetState<boolean>,
  findType: string,
  setRefreshCarts: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const date = new Date(insertObj.dateTime);

  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds(),
  ).padStart(2, "0")}`;

  const requestData = {
    table: "reminder_messages",
    data: JSON.stringify({
      a_application_login_id: Number(getUUID),
      contact_masters_id: contactId,
      reminder_data_time: formattedDateTime,
      assigned_to: insertObj.selectedCategory?.value,
      remark: insertObj.remark,
      reference_id: cartId,
      reference_table: `cart_${findType}`,
    }),
  };
  try {
    const data = await axiosInstance.post("commonCreate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsReminderConfirmation(false);
      setRefreshCarts(true);
      const requestDataMsg = {
        table: "carts",
        where: `{"id":${cartId}}`,
        data: `{"is_reminder":"1"}`,
      };
      try {
        const data = await axiosInstance.post("commonUpdate", requestDataMsg);
        if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          return true;
        } else {
          return false;
        }
      } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const handleChangeStatusOfReminderCompleted = async (
  cartId: number | undefined,
  setIsReminderConfirmationStatus: TReactSetState<boolean>,
  type: string,
  setRefreshCarts: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const formattedDateTime = formatDateTimeSendDataBase(new Date());
  const requestData = {
    table: "reminder_messages",
    where: `{"a_application_login_id":"${getUUID}","reference_id":"${cartId}","reference_table":"cart_${type}" ,"status":"0"}`,
    data: `{"status":"1","completed_date_time":"${formattedDateTime}"}`,
  };
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsReminderConfirmationStatus(false);

        const requestData = {
          table: "carts",
          where: `{"id":"${cartId}"}`,
          data: JSON.stringify({
            is_reminder: 0,
          }),
        };
        try {
          const data = await axiosInstance.post("commonUpdate", requestData);
          if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setRefreshCarts(true);
            return true;
          } else {
            return false;
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
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

export const syncMiracleInvoice = async (
  item: any,
  setSyncLoading?: (data: boolean) => void,
) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    cart_id: item,
    a_application_login_id: uuid,
  };

  try {
    if (setSyncLoading) setSyncLoading(true);

    const response = await axiosInstance.post("sync-invoice", requestData);

    // Handle Success or Backend-Caught Logical Errors (HTTP 200)
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(response.data.ack_msg || "Invoice synced successfully.");
    } else {
      toast.error(response.data.ack_msg || "Failed to sync invoice.");
    }
  } catch (error: any) {
    console.error("Sync Invoice Error:", error);

    // Carefully extract the error message from the Axios error object
    // This looks for the 'ack_msg' we set up in our backend resBadRequest responses
    const errorMessage =
      error?.response?.data?.ack_msg || // 1. Check for backend custom ack_msg
      error?.response?.data?.message || // 2. Check for standard backend message
      error?.message || // 3. Check for standard JS/Axios error message
      "An unexpected error occurred."; // 4. Ultimate fallback

    toast.error(errorMessage);
  } finally {
    if (setSyncLoading) setSyncLoading(false);
  }
};
