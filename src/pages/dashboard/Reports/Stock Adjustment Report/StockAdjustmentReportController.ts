import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { IStockAdjustmentView } from "../../../left-side/header/Setting/stock-adjustment/StockAdjustmentViewController";

export const fetchStockAdjustmentApi = async (
  setStockAdjustmentList: (items: IStockAdjustmentView[]) => void,
  setLoading: TReactSetState<boolean>,
  term: string,
) => {
  const getUUID = localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
    searchTerm: term,
  };
  try {
    const data = await axiosInstance.post(
      "get-stock-adjustment-list",
      requestData,
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setStockAdjustmentList([]);
      }
      setLoading(true);
      setStockAdjustmentList(data.data.data.item);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};