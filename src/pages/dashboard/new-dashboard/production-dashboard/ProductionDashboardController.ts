import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";


export interface IAlljobDashboard  {
  id: number;
  username: string;
  created_date_time: string;
  production_qty: number
};

export const fetchProductionDashoardApi = async (
  selectedDates: Date[] | null,
  setProductCount: TReactSetState<number>,
  setBomCount: TReactSetState<number>,
  setLowStockCount: TReactSetState<number>,
  setHighStockCount: TReactSetState<number>,
  settotalClosingStockRateSum: TReactSetState<number>,
  setJobCount: TReactSetState<number>,
  setAllJob: TReactSetState<IAlljobDashboard[]>,
  leaderBoardSelectedDates: Date[] | null,

) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    selectedDates,
    leaderBoardSelectedDates
  };
  try {
    const data = await axiosInstance.post("production-insight", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setProductCount(0);
      setBomCount(0);
      setLowStockCount(0);
      setHighStockCount(0);
      settotalClosingStockRateSum(0);
      setJobCount(0);
      setAllJob([]);
      return;
    }
    setProductCount(data.data.data.productCount);
    setBomCount(data.data.data.bomCount);
    setLowStockCount(data.data.data.lowStockCount);
    setHighStockCount(data.data.data.highStockCount);
    settotalClosingStockRateSum(data.data.data.totalClosingStockRateSum);
    setJobCount(data.data.data.jobCount);
    setAllJob(data.data.data.allJob);

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};