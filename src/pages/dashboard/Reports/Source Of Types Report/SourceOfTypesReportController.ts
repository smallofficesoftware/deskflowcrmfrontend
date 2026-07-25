import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";


export interface ISourceOfTypes {
  source_name: string;
  id: number;
  color: string | undefined | null;
}

export const fetchSourceOfTypesApi = async (
  setSourceOfTypesLists: TReactSetState<ISourceOfTypes[]>,
  setLoading: TReactSetState<boolean>,
) => {

  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token")
  const requestData = {
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("sourceOfTypes", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false)
      setSourceOfTypesLists([]);
    }
    setLoading(true)
    setSourceOfTypesLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};