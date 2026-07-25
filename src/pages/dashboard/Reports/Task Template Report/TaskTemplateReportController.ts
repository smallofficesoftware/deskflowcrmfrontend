import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ITaskTemplate {
  templete_type: number;
  name: string;
  id: number;
  color: string | undefined | null;
  display_order_type: number;
}

export interface ICompanyView {
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

export const orderTypesStageList = [
  { id: 1, order_type_display: "contact" },
  { id: 2, order_type_display: "Inquiry" },
  { id: 3, order_type_display: "Visit" },
  { id: 5, order_type_display: "Quotation" },
  { id: 6, order_type_display: "Sales Order" },
  { id: 7, order_type_display: "Sales Invoice" },
  { id: 10, order_type_display: "Return Sales Invoice" },
  { id: 9, order_type_display: "Purchase Order" },
  { id: 8, order_type_display: "Purchase Invoice" },
  { id: 11, order_type_display: "Return Purchase Invoice" },
  { id: 12, order_type_display: "Goods Received Note" },
  { id: 13, order_type_display: "Dispatch" },
];

export const fetchTaskTemplateApi = async (
  setTaskTemplateList: TReactSetState<ITaskTemplate[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "task_templete_masters",
    columns: "id,name,color,templete_type,display_order_type",
    // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setTaskTemplateList([]);
    }
    setLoading(true);
    setTaskTemplateList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const fetchCompanyApi = async (
  setTitleList: TReactSetState<ICompanyView[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "company_masters",
    columns: "invoice_title,order_title,quotation_title,purchase_title,workorder_title,purchase_order_title,return_sales_invoice_title,return_purchase_invoice_title,inward_title,dispatch_title",
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