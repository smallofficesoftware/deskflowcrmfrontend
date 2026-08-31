import { toast } from "react-toastify";
import * as Yup from "yup";
import { handleRefresh } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";



export interface IPersonalSettingCreate {
  id?: number;
  whatsapp_authkey: string;
  whatsapp_appkey: string;
  port_mail_setup: string;
  mail_id_setup: string;
  password_mail_setup: string;
  pop3_host: string
  incoming_port: string
  host_out_going_mail: string;
  whatsapp_phone_number_id?: string;
  whatsapp_waba_id?: string;
  whatsapp_api_key?: string;
  // Per-login opt-in for the socket.io real-time layer - separate from
  // company-wide feature flags. Default 0/off.
  socket_connection_switch?: number;
}

export interface ITeamWABADetails {
  id: string;
  display_phone_number: string;
  verified_name: string;
  waba_id: string;
}

export const createPersonalSettingInitialValues = (
  companyToEdit: IPersonalSettingCreate | undefined,
): IPersonalSettingCreate => ({

  whatsapp_authkey: companyToEdit?.whatsapp_authkey || "",
  whatsapp_appkey: companyToEdit?.whatsapp_appkey || "",
  port_mail_setup: companyToEdit?.port_mail_setup || "",
  mail_id_setup: companyToEdit?.mail_id_setup || "",
  password_mail_setup: companyToEdit?.password_mail_setup || "",
  incoming_port: companyToEdit?.incoming_port || "",
  pop3_host: companyToEdit?.pop3_host || "",
  host_out_going_mail: companyToEdit?.host_out_going_mail || "",
  whatsapp_phone_number_id:
    companyToEdit?.whatsapp_phone_number_id || "",
  whatsapp_waba_id:
    companyToEdit?.whatsapp_waba_id || "",
  whatsapp_api_key:
    companyToEdit?.whatsapp_api_key || "",
  socket_connection_switch: companyToEdit?.socket_connection_switch || 0,
});


export const createPersonalSettingValidationSchema = () =>
  Yup.object().shape({

  });

export const handleSaveData = async (
  values: IPersonalSettingCreate,
  profileId: number,
  onHide: () => void,
  setIsLoadApi: TReactSetState<boolean>,
  shouldRefresh = true
) => {
  // Perform save operation for username (e.g., API call)
  const requestData = {
    table: "a_application_logins",
    where: `{"id":"${profileId}"}`,
    data: JSON.stringify({
      whatsapp_authkey: values.whatsapp_authkey,
      whatsapp_appkey: values.whatsapp_appkey,
      port_mail_setup: values.port_mail_setup,
      mail_id_setup: values.mail_id_setup,
      password_mail_setup: values.password_mail_setup,
      incoming_port: values.incoming_port,
      pop3_host: values.pop3_host,
      host_out_going_mail: values.host_out_going_mail,
      whatsapp_phone_number_id: values.whatsapp_phone_number_id,
      whatsapp_waba_id: values.whatsapp_waba_id,
      whatsapp_api_key: values.whatsapp_api_key,
      socket_connection_switch: values.socket_connection_switch ? 1 : 0,
    })
  };

  try {
    const { data } = await axiosInstance.post("mainCommonUpdate", requestData);

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsLoadApi(true);
        
        if (shouldRefresh) {
          handleRefresh();
          onHide()
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
  }

};

export const fetchWhatsappWABAConfigDetailsTeam = async (
  setWhatsappWABAConfigDetails: TReactSetState<ITeamWABADetails[]>,
) => {
  const a_application_login_id = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const payload = {
    a_application_login_id,
  };

  try {
    const response = await axiosInstance.post(
      "get-whatsapp-waba-config-details-team",
      payload,
      {
        headers: {
          Authorization: `${token}`,
          "x-tenant-id": a_application_login_id,
        },
      }
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setWhatsappWABAConfigDetails(
        response.data.data?.data || []
      );
    }

  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
  }
};