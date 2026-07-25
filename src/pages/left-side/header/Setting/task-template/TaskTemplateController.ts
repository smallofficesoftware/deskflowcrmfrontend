import { toast } from "react-toastify";
import {
  checkDuplicationTwoColum,
  checkDuplicationUpdateTwoColum
} from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ITaskTemplateView {
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

export interface ITaskTemplateCreate {
  name: string;
  color: string | undefined | null;
  templete_type: number;
}
export interface IDisplayOrderCreate {
  display_order_type: number | string;
}
interface IAddTaskTemplateObj {
  name: string;
  color: string | undefined | null;
  templete_type: number;
}

export const orderTypesStageList = [
  { id: "1", order_type_display: "contact" },
  { id: "2", order_type_display: "Inquiry" },
  { id: "3", order_type_display: "Visit" },
  // { id: "4", order_type_display: "Product" },
  { id: "5", order_type_display: "Quotation" },
  { id: "6", order_type_display: "Sales Order" },
  { id: "7", order_type_display: "Sales Invoice" },
  { id: "10", order_type_display: "Return Sales Invoice" },
  { id: "9", order_type_display: "Purchase Order" },
  { id: "8", order_type_display: "Purchase Invoice" },
  { id: "11", order_type_display: "Return Purchase Invoice" },
  { id: "12", order_type_display: "Goods Received Note" },
  { id: "13", order_type_display: "Dispatch" },
];

export const handleDeleteTaskTemplate = async (
  tasktemplateIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setTaskTemplateList: TReactSetState<ITaskTemplateView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    id: tasktemplateIds.join(",")
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("DeleteTaskTemplate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchTaskTemplateApi(setTaskTemplateList, setLoading);
      toast.success(
        tasktemplateIds.length > 1
          ? "Stage Statuses Deleted Successfully"
          : "Status Deleted Successfully"
      );

      // const requestedData = {
      //   table: "task_templete_datasources",
      //   where: `{"task_template_master_id":"${tasktemplateIds.join(",")}"}`,
      //   data: `{"isDelete":"1"}`,
      // };




    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createTaskTemplate = async (
  tasktemplateInput: IAddTaskTemplateObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplicationTwoColum(
      tasktemplateInput.name,
      "task_templete_masters",
      "name",
      "templete_type",
      tasktemplateInput.templete_type
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "task_templete_masters",
      data: `{"name":"${tasktemplateInput.name}","color":"${tasktemplateInput.color
        }","templete_type":"${tasktemplateInput.templete_type
        }","a_application_login_id":${Number(getUUID)}}`,
    };

    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
          clearFormCallback();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Task Template already available");
  }
};

export const fetchTaskTemplateApi = async (
  setTaskTemplateList: TReactSetState<ITaskTemplateView[]>,
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

export const updateTaskTemplate = async (
  tasktemplateInput: ITaskTemplateCreate,
  setLoading: TReactSetState<boolean>,
  editTaskTemplateId: number | undefined,
  clearForm: () => void
) => {
  if (
    !(await checkDuplicationUpdateTwoColum(
      tasktemplateInput.name,
      "task_templete_masters",
      "name",
      "templete_type",
      Number(tasktemplateInput.templete_type),
      editTaskTemplateId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "task_templete_masters",
      where: `{"id":"${editTaskTemplateId}"}`,
      data: `{"name":"${tasktemplateInput.name}","color":"${tasktemplateInput.color
        }","templete_type":"${tasktemplateInput.templete_type
        }","a_application_login_id":${Number(getUUID)}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearForm()
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Task Template already available");
  }
};

export const updateDisplayOrder = async (
  displayOrderInput: IDisplayOrderCreate,
  editTaskTemplateId: number | undefined
) => {
  const requestData = {
    table: "task_templete_masters",
    where: `{"id":"${editTaskTemplateId}"}`,
    data: `{"display_order_type":"${displayOrderInput.display_order_type}" }`,
  };
  const getUUID = localStorage.getItem("UUID")
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
