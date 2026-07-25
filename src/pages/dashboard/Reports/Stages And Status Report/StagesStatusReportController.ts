import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { IStageStatusView } from "../../../left-side/header/Setting/stage-status/StageStatusController";

export interface ICompanyReport {
  invoice_title: string;
  order_title: string;
  quotation_title: string;
  purchase_title: string;
  workorder_title: string;
  purchase_order_title: string;
  return_sales_invoice_title: string;
  return_purchase_invoice_title: string;
  inward_title: string;
  dispatch_title: string;
}
export const orderTypesStageStatusList = [
  { id: "1", order_type_display: "Contact" },
  { id: "2", order_type_display: "Inquiry" },
  { id: "3", order_type_display: "Quotation" },
  { id: "4", order_type_display: "Sales Order" },
  { id: "11", order_type_display: "Dispatch" },
  { id: "5", order_type_display: "Sales Invoice" },
  { id: "9", order_type_display: "Return Sales Invoice" },
  { id: "7", order_type_display: "Purchase Order" },
  { id: "12", order_type_display: "Goods Received Note" },
  { id: "6", order_type_display: "Purchase Invoice" },
  { id: "10", order_type_display: "Return Purchase Invoice" },
  { id: "8", order_type_display: "Task Management" },

];

export const fetchStageStatusApi = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  setLoading: TReactSetState<boolean>,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    status_type: pageType,
    action_flag: "view"
  };
  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setStageStatusList([]);
    }
    setLoading(true);
    setStageStatusList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const fetchCompanyApi = async (
  setTitleList: TReactSetState<ICompanyReport[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "company_masters",
    columns: "invoice_title,order_title,quotation_title,purchase_title,workorder_title,purchase_order_title,inward_title,dispatch_title",
    where: JSON.stringify({ "a_application_login_id": getUUID }),
  };
  try {
    const data = await axiosInstance.post("mainCommonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setTitleList([]);
    }
    setTitleList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};