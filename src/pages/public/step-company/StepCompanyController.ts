import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export const fetchApiStepCompany = async (
  setRefresh: TReactSetState<boolean>,
  companyId: number | string | undefined,
  setShowError: TReactSetState<string>
) => {

  const getUUID = await localStorage.getItem("UUID");
  const getUserName = await localStorage.getItem("USERNAME");

  const requestData = {
    company_id: companyId,
    a_application_login_id: Number(getUUID),
    application_login_name: getUserName
  };
  setRefresh(false);
  try {
    const data = await axiosInstance.post("step-company", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setRefresh(true);
      const storeToken = data.data?.data;
      localStorage.setItem("token", storeToken);
    } else {
      setShowError(data.data.ack_msg)
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }

};