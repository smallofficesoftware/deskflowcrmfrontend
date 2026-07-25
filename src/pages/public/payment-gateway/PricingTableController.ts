import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
interface IPlanPage {
  page_name: string;
  dataLimit: string;
  is_allow: number;
  page_id: number;
  extra_information: string;
}
export interface IPlanList {
  plan_id: number;
  plan_name: string;
  plan_amount: number;
  months: number;
  plan_pages: [IPlanPage];
  trail_days: number;
  isRenewal: number;
  actual_amount: number;
  monthly_plan_amount: number;
}

export interface IAppPage {
  id: number;
  page_name: string;
}

export const couponCodeGetData = async (
  companyId: number | undefined,
  planId: number,
  duration: string | number,
  couponCode: string,
) => {
  try {
    const response = await axiosInstance.post("get-coupon-code", {
      company_id: companyId,
      plan_id: planId,
      duration,
      coupon_code: couponCode,
    });

    // You can later decide what to do with response here
    // For now, just return it to the component
    return response.data;
  } catch (err: any) {
    toast.error(err.response?.data?.msg || "Coupon validation failed");
    return null;
  }
};

export const updateCompanyForPlan = async (
  setRefresh: TReactSetState<boolean>,
  companyId: number | string | undefined,
  planNumber: number,
  planMonth: number,
  planTrailDays: number,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const getUserName = await localStorage.getItem("USERNAME");

  const requestData = {
    plan_month: planMonth,
    company_id: companyId,
    plan_number: planNumber,
    a_application_login_id: Number(getUUID),
    application_login_name: getUserName,
    trail_days: planTrailDays,
  };
  setRefresh(false);
  try {
    const data = await axiosInstance.post("createPlane", requestData);

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setRefresh(true);
      const storeToken = data.data?.data?.token;
      localStorage.setItem("token", storeToken);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const createCompanyVsPlan = async (
  setRefresh: TReactSetState<boolean>,
  paymentId: string,
  orderId: string,
  razorpaySignature: string,
  amount: string | number,
  planId: string | number,
  plan_name: string | number,
  plan_amount: string | number,
  discountAmount: string | number,
  gstAmount: string | number,
  selectedYear: string | number,
  couponCodeId: number | null,
  RoundOffAmount: number,
) => {
  const date = new Date();

  // Format the date as YYYY-MM-DD
  const formattedDate = `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const getUUID = localStorage.getItem("UUID");

  const requestDataCompanyVsPlan = {
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: razorpaySignature,
    amount: amount,
    created_date_time: formattedDate,
    a_application_login_id: getUUID,
    plan_id: planId,
    plan_name: plan_name,
    plan_amount: plan_amount,
    discount_amount: discountAmount,
    gst_amount: gstAmount,
    plan_duration: selectedYear,
    coupon_code_id: couponCodeId ? Number(couponCodeId) : "",
    round_off_amount: RoundOffAmount,
  };

  setRefresh(false);
  try {
    const data = await axiosInstance.post(
      "PaymentHistory",
      requestDataCompanyVsPlan,
    );

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setRefresh(true);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchApiPlan = async (
  setPlanList: TReactSetState<IPlanList[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const response = await axiosInstance.post("getPlanDetail", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setPlanList(response.data.data.item);
    } else {
      toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
      setPlanList([]);
    }
  } catch (error: any) {
    console.error("Error fetching countries:", error);
    toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
    setPlanList([]);
  }
};


export const createPlanOtp = async (
  companyId: number | string | undefined,
  plan_id: number,
) => {
  const getUUID = localStorage.getItem("UUID");

  const requestData = {
    company_id: companyId,
    plan_id: plan_id,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("plan-create-otp", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return response.data; // ✅ IMPORTANT
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return response.data; // ✅ return even on fail
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return { ack: 0, ack_msg: "API Error" }; // ✅ fallback
  }
};
export const verifyPlanOtp = async (
  companyId: number | string | undefined,
  plan_id: number,
  otp: string,
) => {
  const getUUID = localStorage.getItem("UUID");

  const requestData = {
    company_id: companyId,
    plan_id: plan_id,
    otp: otp,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("plan-verify-otp", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return response.data; // ✅ IMPORTANT
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return response.data; // ✅ return fail response
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return { ack: 0, ack_msg: "API Error" }; // ✅ fallback
  }
};