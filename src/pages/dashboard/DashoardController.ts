import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";

export interface ISourceOfTypesForDashBoard {
  source_name: string;
  id: number;
  color: string;
}
export interface ITitle {
  quotation_title: string;
  order_title: string;
  invoice_title: string;
  purchase_title: string;
  purchase_order_title: string;
  return_sales_invoice_title: string;
  return_purchase_invoice_title: string;
  workorder_title: string;
  proforma_invoice_title: string;
  id: number;
  a_application_login_id: number;
  invoice_view_formate: number;
  order_view_formate: number;
  quotation_view_formate: number;
  purchase_view_formate: number;
  workorder_view_formate: number;
  purchase_order_view_formate: number;
  return_sales_invoice_view_formate: number;
  return_purchase_invoice_view_formate: number;
  inward_title: string;
  inward_view_formate: number;
  dispatch_title: string;
  dispatch_view_formate: number;
  proforma_invoice_view_formate: number;


}
interface OptionType {
  value: string | number;
  label: string;
}
export const fetchContactApi = async (
  setTotalContact: TReactSetState<number>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post(
      "Contact",
      {
        ul: 0, // Upper limit based on page number
        ll: 13, // Lower limit based on page number
        a_application_login_id: Number(getUUID),
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    if (data && data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {

        setTotalContact(data?.data?.totalContactCount);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchInquiryApiForTotal = async (
  setTotalInquiry: TReactSetState<number>,
  setInquiryList: TReactSetState<any>,
  setInquiryMontList: TReactSetState<any>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const { data } = await axiosInstance.post(
      "inquiry",
      {
        ul: 0, // Upper limit based on page number
        ll: 13, // Lower limit based on page number
        a_application_login_id: Number(getUUID),
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    if (data && data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTotalInquiry(data?.data?.totalInquiryCount);

        setInquiryList(data.data.sourceTypeVsInquiry);
        setInquiryMontList(data.data.inquiryVsOpportunity);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchReminderApiForTotal = async (
  setTotalReminder: TReactSetState<number>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const { data } = await axiosInstance.post(
      "reminder",
      {
        ul: 0, // Upper limit based on page number
        ll: 13, // Lower limit based on page number
        a_application_login_id: Number(getUUID),
      }
    );
    if (data && data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTotalReminder(data?.data?.totalReminderCount);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchSourceOfTypesApiForDashboard = async (
  setSourceOfTypesLists: TReactSetState<ISourceOfTypesForDashBoard[]>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("sourceOfTypes", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setSourceOfTypesLists([]);
    }
    setSourceOfTypesLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchOrderTotal = async (
  setQuotation: React.Dispatch<React.SetStateAction<number>>,
  setOrder: TReactSetState<number>,
  setInvoice: TReactSetState<number>,
  setTotalReminder: TReactSetState<number>,
  setTotalInquiry: TReactSetState<number>,
  setInquiryList: TReactSetState<any>,
  setInquiryMontList: TReactSetState<any>,
  setTotalContact: TReactSetState<number>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("totalOrder", requestData, {
      headers: {
        Authorization: `${token}`,
      },
    });
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setQuotation(0);
      setOrder(0);
      setInvoice(0);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};



export const fetchAllDashoardApi = async (
  selectedDates: Date[] | null,
  setQuotation: TReactSetState<number>,
  setOrder: TReactSetState<any>,
  setInvoice: TReactSetState<number>,
  setPurchaseCount: TReactSetState<number>,
  setPurchaseOrderCount: TReactSetState<number>,
  setWorkOrderCount: TReactSetState<number>,
  setTotalReminder: TReactSetState<number>,
  setTotalInquiry: TReactSetState<number>,
  setInquiryList: TReactSetState<any>,
  setInquiryMontList: TReactSetState<any>,
  setTotalContact: TReactSetState<number>,
  setTodayVisitCount: TReactSetState<number>,
  setTodayCallCount: TReactSetState<number>,
  setOutOfStockCount: TReactSetState<number>,
  setTotalApprovedQuotation: TReactSetState<number>,
  setTotalApprovedOrder: TReactSetState<number>,
  setTotalApprovedInvoice: TReactSetState<number>,
  setPurchaseApprovedCount: TReactSetState<number>,
  setPurchaseOrderApprovedCount: TReactSetState<number>,
  setWorkOrderApprovedCount: TReactSetState<number>,
  setTotalReturnSalesInvoice: TReactSetState<number>,
  setReturnSalesInvoiceApprovedCount: TReactSetState<number>,
  setTotalReturnPurchaseInvoice: TReactSetState<number>,
  setReturnPurchaseInvoiceApprovedCount: TReactSetState<number>,
  setTotalInward: TReactSetState<number>,
  setInwardCount: TReactSetState<number>,
  setTotalDispath: TReactSetState<number>,
  setDispathCount: TReactSetState<number>,
  setSupportTicketCount: TReactSetState<number>,
  setTaskCount: TReactSetState<number>,
  data: any
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    selectedDates,
    data
  };
  try {
    const data = await axiosInstance.post("insight", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setQuotation(0);
      setOrder(0);
      setInvoice(0);
      setPurchaseCount(0)
      setPurchaseOrderCount(0)
      setWorkOrderCount(0)
      setTodayVisitCount(0)
      setTodayCallCount(0)
      setOutOfStockCount(0)
      setTotalApprovedQuotation(0)
      setTotalApprovedOrder(0)
      setTotalApprovedInvoice(0)
      setPurchaseApprovedCount(0)
      setPurchaseOrderApprovedCount(0)
      setWorkOrderApprovedCount(0)
      setTotalReturnSalesInvoice(0)
      setReturnSalesInvoiceApprovedCount(0)
      setTotalReturnPurchaseInvoice(0)
      setReturnPurchaseInvoiceApprovedCount(0)
      setTotalInward(0)
      setInwardCount(0)
      setTotalDispath(0)
      setDispathCount(0)
      setSupportTicketCount(0)
      setTaskCount(0)
    }
    setInquiryList(data.data.data.sourceTypeVsInquiry);
    setInquiryMontList(data.data.data.barchartData);
    setTotalContact(data.data.data.totalContactCount);
    setTotalInquiry(data.data.data.totalInquiryCount);
    setTotalReminder(data.data.data.totalReminderCount);
    setQuotation(data.data.data.totalQuotation);
    setOrder(data.data.data.totalOrder);
    setInvoice(data.data.data.totalInvoice);
    setPurchaseCount(data.data.data.purchaseCount)
    setPurchaseOrderCount(data.data.data.purchaseOrderCount)
    setWorkOrderCount(data.data.data.workOrderCount)
    setTodayVisitCount(data.data.data.todayVisitCount)
    setTodayCallCount(data.data.data.todayCallCount)
    setOutOfStockCount(data.data.data.outOfStockCount)
    setTotalApprovedQuotation(data.data.data.totalApprovedQuotation)
    setTotalApprovedOrder(data.data.data.totalApprovedOrder)
    setTotalApprovedInvoice(data.data.data.totalApprovedInvoice)
    setPurchaseApprovedCount(data.data.data.purchaseApprovedCount)
    setPurchaseOrderApprovedCount(data.data.data.purchaseOrderApprovedCount)
    setWorkOrderApprovedCount(data.data.data.workOrderApprovedCount)
    setTotalReturnSalesInvoice(data.data.data.totalReturnSalesInvoice) //
    setReturnSalesInvoiceApprovedCount(data.data.data.returnSalesInvoiceApprovedCount)//
    setTotalReturnPurchaseInvoice(data.data.data.totalReturnPurchaseInvoice)
    setReturnPurchaseInvoiceApprovedCount(data.data.data.returnPurchaseInvoiceApprovedCount)
    setTotalInward(data.data.data.TotalInward)
    setInwardCount(data.data.data.inwardCount)
    setTotalDispath(data.data.data.TotalDispath)
    setDispathCount(data.data.data.dispathCount)
    setSupportTicketCount(data.data.data.TotalsupportTicketCount)
    setTaskCount(data.data.data.TotalTaskCount)

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};


export const fetchQuationCount = async (setQuationCount: TReactSetState<ITitle[]>) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    table: "company_masters",
    columns:
      "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,return_purchase_invoice_title,return_sales_invoice_title,id,inward_title,dispatch_title",
    where: JSON.stringify({ a_application_login_id: uuid }),
    request_flag: 2,
  };
  try {
    const response = await axiosInstance.post("mainCommonGet", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setQuationCount(response.data.data || []);
    } else {
      toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
      setQuationCount([]);
      return "";
    }
  } catch (error: any) {
    console.error("Error fetching currencyID: ", error);
    toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
    return "";
  }
};

