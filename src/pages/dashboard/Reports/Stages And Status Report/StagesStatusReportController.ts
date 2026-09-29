import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { IStageStatusView, orderTypesStageList } from "../../../left-side/header/Setting/stage-status/StageStatusController";

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
// Was its own stale copy of stage-status/StageStatusController.ts's list
// (missing Job Card/Route Planner/Form Submissions entirely) - re-exported
// from the canonical one instead, so this report can't drift out of sync
// with the actual Stages & Status management screen again.
export const orderTypesStageStatusList = orderTypesStageList;

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