import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
export interface TemplateButton {
  type: string;
  text: string;
  phone_number?: string;
}

export interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  example?: {
    body_text?: string[][];
  };
  buttons?: TemplateButton[];
}
export interface Template {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: TemplateComponent[];
}
export interface ApiResponse {
  success: boolean;
  data: Template[];
  count: number;
}

export interface ITemplateOptionList {
  value: string | number;
  label: string;
}

type Variable = {
  key: string;
  value: string;
};

type CustomerMobile = {
  customer_id?: number | string;
  customer_mobile_number?: string;
};

export const fetchTemplate = async (
  setApiResponse: TReactSetState<ApiResponse> | null,
  setLoading: TReactSetState<boolean> | null,
  setTemplateOptionList: TReactSetState<ITemplateOptionList[]>,
) => {
  try {
    setLoading && setLoading(true);
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      a_application_login_id: uuid,
    };
    const response = await axiosInstance.post(
      "get-whatsapp-template",
      requestData,
    );
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const optionsList = response.data.data.data.map((template: Template) => {
        return {
          value: template.id,
          label: template.name,
        };
      });
      setTemplateOptionList(optionsList);
      setApiResponse && setApiResponse(response.data.data);
    } else {
      toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
    }
  } catch (error: any) {
    toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
  } finally {
    setLoading && setLoading(false);
  }
};

export const sendTemplateMessagePdf = async (
  template: Template,
  variables: Variable[],
  setWhatsappTemplateShowModal: TReactSetState<boolean>,
  receiverClue: any,
  quickFillVars: any,
) => {
  try {
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      a_application_login_id: uuid,
      template,
      variables,
      is_template_message: 1,
      receiverClue,
      quickFillVars,
    };
    const response = await axiosInstance.post(
      "send-whatsapp-template",
      requestData,
    );
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
    } else {
      toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
    }
  } catch (error: any) {
    toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
  } finally {
    // setWhatsappTemplateShowModal(false);
  }
};

export const whatsappTemplateCloudeSend = async (
  contextParams: Record<string, any>,
  module: string,
  customerMobile?: CustomerMobile,
  user_id?: string | number,
  setIsWhatsAppCloudLoading?: (data: boolean) => void,
): Promise<boolean> => {
  try {
    if (setIsWhatsAppCloudLoading) {
      setIsWhatsAppCloudLoading(true);
    }
    const a_application_login_id = user_id
      ? user_id
      : localStorage.getItem("UUID");

    if (!a_application_login_id) {
      toast.error("User session not found");
      return false;
    }

    let recipientPhone = customerMobile?.customer_mobile_number?.trim();

    // Fetch mobile number only when not directly provided
    if (!recipientPhone && customerMobile?.customer_id) {
      const { data } = await axiosInstance.post("commonGet", {
        table: "contact_masters",
        columns: "mobile_number",
        where: ["isDelete=0", `id=${customerMobile.customer_id}`],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id,
      });

      recipientPhone = data?.data?.[0]?.mobile_number?.trim();
    }

    // No valid phone found
    if (!recipientPhone) {
      toast.error("Recipient mobile number not found");
      return false;
    }

    const { data } = await axiosInstance.post(
      "whatsapp-templates/send-via-config",
      {
        whx_a_application_login_id: a_application_login_id,
        module,
        contextParams,
        recipientPhone,
      },
    );

    if (data?.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data?.data || "Failed to send WhatsApp template");
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("whatsappTemplateCloudeSend Error:", error);

    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong",
    );

    return false;
  }
  finally {
    if (setIsWhatsAppCloudLoading) {
      setIsWhatsAppCloudLoading(false);
    }
  }
};
