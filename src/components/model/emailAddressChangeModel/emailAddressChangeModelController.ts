import { toast } from "react-toastify";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { isRealEmail } from "../../../utils/emailValidator";

export interface IRequiredDetail {
  title: string;
  email_address: string | null;
  is_auto_generate_email: boolean;
}
export const verifyEmailAddress = async (
  emailAddress: string | null,
  setIsFirstEmailOTPLoading: TReactSetState<boolean>,
  setOldNumberOTPSendReponseMsg: TReactSetState<string>,
  setIsOTPSend: TReactSetState<boolean>,
  RequiredDetail: IRequiredDetail,
) => {
  if (!emailAddress) {
    toast.error("Email Address is blank.");
    return;
  } else if (!isRealEmail(emailAddress)) {
    toast.error("Please enter a valid email address");
    return;
  }
  try {
    setIsFirstEmailOTPLoading(true);
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      e: emailAddress,
      au: RequiredDetail.is_auto_generate_email,
    };

    const { data } = await axiosInstance.post("verify-old-email", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setOldNumberOTPSendReponseMsg(data.ack_msg);
      setIsOTPSend(true);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setIsFirstEmailOTPLoading(false);
  }
};

export const verifyNewNumberOTP = async (
  newEnteredOTP: string,
  newEnteredEmailAddress: string,
  setIsNewOTPVerified: TReactSetState<boolean>,
  setIsNewNumberFieldDisabled: TReactSetState<boolean>,
  logOutApi: any,
  setIsFirstNewEmailVerifyOTPLoading: TReactSetState<boolean>,
) => {
  if (!newEnteredOTP) {
    toast.error("OTP is blank.");
    return;
  }
  try {
    setIsFirstNewEmailVerifyOTPLoading(true);
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      otp: newEnteredOTP,
      newEnteredEmailAddress: newEnteredEmailAddress,
    };

    const { data } = await axiosInstance.post(
      "verify-new-email-address-otp",
      requestData,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsNewOTPVerified(true);
      setIsNewNumberFieldDisabled(true);
      localStorage.clear();
      setTimeout(logOutApi, 5000);
      setTimeout(() => window.location.reload(), 5000);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setIsFirstNewEmailVerifyOTPLoading(false);
  }
};

export const verifyNewEmailAddress = async (
  newEnteredEmailAddress: string,
  setIsNewOTPSend: TReactSetState<boolean>,
  setNewNumberOTPSendReponseMsg: TReactSetState<string>,
  setIsFirstNewEmailVerifyLoading: TReactSetState<boolean>,
) => {
  if (!newEnteredEmailAddress) {
    toast.error("New Email Address is blank.");
    return;
  }
  try {
    setIsFirstNewEmailVerifyLoading(true);
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      e: newEnteredEmailAddress,
    };

    const { data } = await axiosInstance.post("verify-new-email", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsNewOTPSend(true);
      setNewNumberOTPSendReponseMsg(data.ack_msg);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setIsFirstNewEmailVerifyLoading(false);
  }
};

export const verifyOldEmailOTP = async (
  oldEmailEnteredOTP: string,
  RequiredDetail: IRequiredDetail,
  emailAddress: string | null,
  setIsOldEmailButtonDisabled: TReactSetState<boolean>,
  setIsOTPVerifiedAutoGen: TReactSetState<boolean>,
  setIsOTPVerified: TReactSetState<boolean>,
  logOutApi: any,
  setIsFirstEmailVerifyOTPLoading: TReactSetState<boolean>,
) => {
  if (!oldEmailEnteredOTP) {
    toast.error("Email OTP is blank");
    return;
  }
  try {
    setIsFirstEmailVerifyOTPLoading(true);
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      otp: oldEmailEnteredOTP,
      au: RequiredDetail.is_auto_generate_email,
      e: emailAddress,
    };

    const { data } = await axiosInstance.post(
      "verify-old-email-otp",
      requestData,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      if (RequiredDetail.is_auto_generate_email) {
        setIsOldEmailButtonDisabled(true);
        setIsOTPVerifiedAutoGen(true);
        localStorage.clear();
        toast.info("you are log out and reload the page");
        setTimeout(logOutApi, 5000);
        setTimeout(() => window.location.reload(), 5000);
      } else {
        setIsOTPVerified(true);
        setIsOldEmailButtonDisabled(true);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setIsFirstEmailVerifyOTPLoading(false);
  }
};
