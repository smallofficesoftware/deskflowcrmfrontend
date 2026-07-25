import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export const publicCreateVaiLinkCompany = async (
  data: string,
  setIsJoinConfirmation: TReactSetState<boolean>
) => {

  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const requestData = {
    a_application_login_id: getUUID,
    invitation_key: data,
    company_flag: 2,
  };
  try {
    const { data } = await axiosInstance.post("invitation_key", requestData, {
      headers: {
        Authorization: `${token}`,
      },
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsJoinConfirmation(true);
        const storeToken = data.data?.token;
        localStorage.setItem("token", storeToken);
        toast.success(data.ack_msg);
      }
    } else {
      setIsJoinConfirmation(false);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }

};
