import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";

export interface OrderByForPrintIdExist {
  exists: boolean;
}
interface IOrderCompanyDetail {
  company_contact: string;
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
  purchase_order_title: string;
  purchase_order_doc_no: string;
  purchase_order_view_color: string;
  purchase_order_view_formate: number;
  watermark_in_print: number;
}
interface IAccountTransaction {
  id: number;
  type: string;
  mode: string;
  amount: number;
  payment_date_time: string
  remark: string;
  created_date_time: Date;
  approve_by_a_application_login_id: number,
  approve_date_time: string;
  
  companyDetails: IOrderCompanyDetail;
}
interface IAccount {
  item: {
    id: number;
    type: string;
    mode: string;
    amount: number;
    payment_date_time: string;
    remark: string;
    created_date_time: Date;
    approve_by_a_application_login_id: number;
    approve_date_time: string;
    customer_name:{
    person_name:string
  }
  }[];
  companyDetails: IOrderCompanyDetail;
  
 
}

export const fetchApiAccountTransitions = async (
  id: number | string,
  setAccountTransactions: TReactSetState<IAccount | undefined>,
  mobileToken?: string,
  getID?: string

) => {
  const getUUID = getID || localStorage.getItem("UUID");
  const token = mobileToken || localStorage.getItem("token");

  try {
    const { data } = await axiosInstance.post(
      "accountTransactionById",
      {
        id: id,
        a_application_login_id: getUUID
      }
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setAccountTransactions(data.data);
        
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
  catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
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
