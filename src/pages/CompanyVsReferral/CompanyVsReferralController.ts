import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";

export interface IReferralCodeData {
  id: number;
  referral_code: string;
}
interface UpdateExpiryPayload {
  a_application_login_id: number;
  plan_expiry_date: string;
  company_id: number;
  referralId?: number | null;  // Make it optional
  master_reffral_code:number| undefined | string;
} 

export interface ICompanyDetail {
  id: number;
  owner_name: string;
  owner_email: string;
  owner_number: string;
  company_category: string;
  company_subcategory: string;
  plan_purchase_date: string;
  plan_expiry_date: string;
  created_date_time: string;
  company_email: string;
  gst_number: string;
  company_name: string;
  contact_count: number;
  reminder_count: number;
  login_time: string;
  logout_time: string;
  plan_type: string;
  company_cityName: string;
  company_team_mamber: number;
  quatation_count: number;
  order_count: number;
  plan_status: string;
  plan_status_color: string;
  product_count: number;
  task_count: number;
  a_application_login_id: number;
}


export const fetchReferralCodeApi = async (
  setReferralCode: TReactSetState<IReferralCodeData[]>
) => {
  const requestData = {
    table: "referral_code_masters",
    columns: "id,referral_code",
  };
  try {
    const data = await axiosInstance.post("mainCommonGet", requestData, {});
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setReferralCode([]);
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } else {
      setReferralCode(data.data.data);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCompanyReferralCodeDetailApi = async (
  referralId: number | undefined,
  setCompanyDetails: React.Dispatch<
    React.SetStateAction<{
      expired: ICompanyDetail[];
      demo: ICompanyDetail[];
      paid: ICompanyDetail[];
    }>
  >,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  masterReferral: string | undefined,
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    referralId,
    masterReferral
  };
  try {
    setLoading(true);
    const response = await axiosInstance.post<{
      ack: number;
      ack_msg: string;
      data: { expired: ICompanyDetail[]; demo: ICompanyDetail[]; paid: ICompanyDetail[] };
    }>("getCompanyVsReferralCode", requestData);

    if (response.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyDetails({ expired: [], demo: [], paid: [] });
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } else {
      setCompanyDetails(response.data.data);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};


export const updatePlanExpiryApi = async (
  payload: UpdateExpiryPayload
): Promise<boolean> => {
  try {
    const response = await axiosInstance.post("/update-plan-expiry", payload);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(response.data.ack_msg || "Plan expiry date updated successfully!");
      return true;
    } else {
      toast.error(response.data.ack_msg || "Failed to update expiry date");
      return false;
    }
  } catch (error: any) {
    const message =
      error.response?.data?.ack_msg ||
      error.message ||
      "Something went wrong while updating expiry date";
    toast.error(message);
    console.error("updatePlanExpiryApi error:", error);
    return false;
  }
};