import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ITargetVsIncentiveView {
  id: number;
  assigned_team_member: number;
  target_flag: string;
  product_id: number;
  target_todate: string;
  target_fromdate: string;
  target_type: number;
  target_count: number;
  target_value: number;
  incentive_type: number;
  incentive_value: number;
  created_date_time?: string;
  assigned_team_member_name?: string;
}

export const fetchApiTargetVsIncentive = async (
  setTargetVsIncentiveList: TReactSetState<ITargetVsIncentiveView[]>,
  setLoading: TReactSetState<boolean>,
  term: string
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  setLoading(true);

  const requestData = {
    a_application_login_id: getUUID,
    searchTerm: term
  };

  try {
    const data = await axiosInstance.post("get-target-vs-Incentive", requestData);

    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setTargetVsIncentiveList([]);
      } else {
        setTargetVsIncentiveList(data.data.data.item);
      }
    }
  } catch (error: any) {
    setTargetVsIncentiveList([]);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const handleDeleteTarget = async (
  id: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setTargetVsIncentiveList: TReactSetState<ITargetVsIncentiveView[]>
) => {
  const requestData = {
    table: "target_vs_incentives",
    where: `{"id":${id}}`,
    data: `{"isDelete":"1"}`,
  };
  const getUUID = localStorage.getItem("UUID")
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        toast.success("Target vs Incentive deleted successfully");
        fetchApiTargetVsIncentive(setTargetVsIncentiveList, setLoading, "");
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};