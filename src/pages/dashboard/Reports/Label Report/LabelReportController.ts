import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ILabelView } from "../../../left-side/header/Setting/label/LabelController";

export const fetchLabelApi = async (
  setLabelList: TReactSetState<ILabelView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "lable_masters",
    columns: "id,lable_name,color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setLabelList([]);
    }
    setLoading(true);
    setLabelList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};