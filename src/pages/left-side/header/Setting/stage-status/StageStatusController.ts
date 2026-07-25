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

export interface IStageStatusView {
  order_type: number;
  name: string;
  id: number;
  color: string | undefined | null;
  display_order_type: number;
  change_status_team_ids: string;
  show_status_data_team_ids: string;
  status_type: string | number;
  change_status_usernames: string;
  show_status_data_usernames: string;
  visibility?: number;
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

export interface IStageStatusCreate {
  name: string;
  color: string | undefined | null;
  order_type: number;
  change_status_team_ids: null | string | { value: number | string, label: string | number }[];
  show_status_data_team_ids: null | string | { value: number | string, label: string | number }[];
  status_type: number;
}
export interface IDisplayOrderCreate {
  display_order_type: number | string;
}
interface IAddStageStatusObj {
  name: string;
  color: string | undefined | null;
  order_type: number;
  change_status_team_ids: null | string | { value: number | string, label: string | number }[];
  show_status_data_team_ids: null | string | { value: number | string, label: string | number }[];
  status_type: number;
  visibility?: number;
}

export const orderTypesStageList = [
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
  { id: "13", order_type_display: "Job Card" },
  { id: "14", order_type_display: "Route Planner" },
];

export const handleDeleteStageStatus = async (
  stageStatusIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  setLoading: TReactSetState<boolean>,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "stage_status_masters",
    where: `{"id":"${stageStatusIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
  };
  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchStageStatusApi(setStageStatusList, setLoading, pageType);
      toast.success(
        stageStatusIds.length > 1
          ? "Stage Statuses Deleted Successfully"
          : "Status Deleted Successfully"
      );
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createStageStatus = async (
  stagestatusInput: IAddStageStatusObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
  pageType: number
) => {
  if (
    !(await checkDuplicationTwoColum(
      stagestatusInput.name,
      "stage_status_masters",
      "name",
      "order_type",
      stagestatusInput.order_type
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");

    const change_status_team_ids_arr = Array.isArray(stagestatusInput.change_status_team_ids) ? stagestatusInput.change_status_team_ids?.map(v => v.value) : [stagestatusInput.change_status_team_ids];
    const change_status_team_ids_fill_arr = change_status_team_ids_arr.filter(Boolean);

    const show_status_data_team_ids_arr = Array.isArray(stagestatusInput.show_status_data_team_ids) ? stagestatusInput.show_status_data_team_ids?.map(v => v.value) : [stagestatusInput.show_status_data_team_ids];
    const show_status_data_team_ids_fill_arr = show_status_data_team_ids_arr.filter(Boolean);

    const change_status_team_ids = change_status_team_ids_fill_arr.length > 0 ? change_status_team_ids_fill_arr.join(",") : "";
    const show_status_data_team_ids = show_status_data_team_ids_fill_arr.length > 0 ? show_status_data_team_ids_fill_arr.join(",") : "";

    const requestData = {
      table: "stage_status_masters",
      data: `{"name":"${stagestatusInput.name}","color":"${stagestatusInput.color
        }","visibility":"${stagestatusInput.visibility
        }","order_type":"${stagestatusInput.order_type}","change_status_team_ids":"${change_status_team_ids}","status_type":"${stagestatusInput.status_type || ""}","show_status_data_team_ids":"${show_status_data_team_ids}","a_application_login_id":${Number(getUUID)}}`,
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
    toast.error("Stage and Status already available");
  }
};

export const fetchStageStatusApi = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  setLoading: TReactSetState<boolean>,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  // const requestData = {
  //   table: "stage_status_masters",
  //   columns: "id,name,color,order_type,display_order_type,change_status_team_ids,show_status_data_team_ids,status_type",
  //   // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
  //  where: [
  //     "isDelete=0",
  //     `order_type=${pageType}`,
  //     // `a_application_login_id=${getUUID}||0`,
  //   ],
  //   request_flag: 0,
  //   order: `{"id":"DESC"}`,
  // };
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
  setTitleList: TReactSetState<ICompanyView[]>,
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

export const updateStageStatus = async (
  stagestatusInput: IAddStageStatusObj,
  setLoading: TReactSetState<boolean>,
  editStageStatusId: number | undefined,
  clearForm: () => void,
  pageType: number
) => {
  if (
    !(await checkDuplicationUpdateTwoColum(
      stagestatusInput.name,
      "stage_status_masters",
      "name",
      "order_type",
      Number(stagestatusInput.order_type),
      editStageStatusId
    ))
  ) {
    const getUUID = localStorage.getItem("UUID");

    const change_status_team_ids_arr = Array.isArray(stagestatusInput.change_status_team_ids) ? stagestatusInput.change_status_team_ids?.map(v => v.value) : [stagestatusInput.change_status_team_ids];
    const change_status_team_ids_fill_arr = change_status_team_ids_arr.filter(Boolean);

    const show_status_data_team_ids_arr = Array.isArray(stagestatusInput.show_status_data_team_ids) ? stagestatusInput.show_status_data_team_ids?.map(v => v.value) : [stagestatusInput.show_status_data_team_ids];
    const show_status_data_team_ids_fill_arr = show_status_data_team_ids_arr.filter(Boolean);

    const change_status_team_ids = change_status_team_ids_fill_arr.length > 0 ? change_status_team_ids_fill_arr.join(",") : "";
    const show_status_data_team_ids = show_status_data_team_ids_fill_arr.length > 0 ? show_status_data_team_ids_fill_arr.join(",") : "";

    const requestData = {
      table: "stage_status_masters",
      where: `{"id":"${editStageStatusId}"}`,
      data: `{"name":"${stagestatusInput.name}","color":"${stagestatusInput.color
        }","visibility":"${stagestatusInput.visibility
        }","order_type":"${stagestatusInput.order_type
        }","change_status_team_ids":"${change_status_team_ids}","show_status_data_team_ids":"${show_status_data_team_ids}","status_type":"${stagestatusInput.status_type || ""}","a_application_login_id":${Number(getUUID)}}`,
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
    toast.error("Stage and Status already available");
  }
};

export const updateDisplayOrder = async (
  displayOrderInput: IDisplayOrderCreate,
  editStageStatusId: number | undefined
) => {
  const requestData = {
    table: "stage_status_masters",
    where: `{"id":"${editStageStatusId}"}`,
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
