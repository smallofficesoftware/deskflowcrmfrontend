import { toast } from "react-toastify";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { isValidPhone } from "../../../common/SharedFunction";
export interface IRequiredDetail {
  title: string;
  phone_number: string | null;
  is_auto_generate_phone: boolean;
}
export interface IPropsMobileNumberChangeModel {
  show: boolean;
  onHide: () => void;
  RequiredDetail: IRequiredDetail;
}
export const verifyOldNumber = async (
  mobileNumber: string | null,
  setOldNumberOTPSendReponseMsg: TReactSetState<string>,
  setIsOTPSend: TReactSetState<boolean>,
  RequiredDetail: IRequiredDetail,
) => {
  if (!mobileNumber) {
    toast.error("Phone number is required");
    return;
  } else if (!isValidPhone(mobileNumber)) {
    toast.error("Please enter a valid phone number");
    return;
  }
  try {
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      m: mobileNumber,
      au: RequiredDetail.is_auto_generate_phone,
    };

    const { data } = await axiosInstance.post("verify-old-number", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setOldNumberOTPSendReponseMsg(data.ack_msg);
      setIsOTPSend(true);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const verifyOldNumberOTP = async (
  oldNumberEnteredOTP: string,
  setIsOTPVerified: TReactSetState<boolean>,
  setIsOldNumberButtonDisabled: TReactSetState<boolean>,
  RequiredDetail: IRequiredDetail,
  mobileNumber: string,
  logOutApi: any,
  setIsOTPVerifiedAutoGen: TReactSetState<boolean>,
) => {
  if (!oldNumberEnteredOTP) {
    toast.error("OTP is blank.");
    return;
  }
  try {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      otp: oldNumberEnteredOTP,
      au: RequiredDetail.is_auto_generate_phone,
      m: mobileNumber,
    };

    const { data } = await axiosInstance.post(
      "verify-old-number-otp",
      requestData,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      if (RequiredDetail.is_auto_generate_phone) {
        setIsOldNumberButtonDisabled(true);
        setIsOTPVerifiedAutoGen(true);
        localStorage.clear();
        toast.info("you are log out and reload the page");
        setTimeout(logOutApi, 5000);
        setTimeout(() => window.location.reload(), 5000);
      } else {
        setIsOTPVerified(true);
        setIsOldNumberButtonDisabled(true);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const verifyNewNumber = async (
  newEnteredNumber: string,
  setIsNewOTPSend: TReactSetState<boolean>,
  setNewNumberOTPSendReponseMsg: TReactSetState<string>,
) => {
  if (!newEnteredNumber) {
    toast.error("New mobile number is blank.");
    return;
  }
  try {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      new_number: newEnteredNumber,
    };

    const { data } = await axiosInstance.post("verify-new-number", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsNewOTPSend(true);
      setNewNumberOTPSendReponseMsg(data.ack_msg);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const verifyNewNumberOTP = async (
  newEnteredOTP: string,
  newEnteredNumber: string,
  setIsNewOTPVerified: TReactSetState<boolean>,
  setIsNewNumberFieldDisabled: TReactSetState<boolean>,
  logOutApi: any,
) => {
  if (!newEnteredOTP) {
    toast.error("OTP is blank.");
    return;
  }
  try {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      otp: newEnteredOTP,
      newEnteredNumber: newEnteredNumber,
    };

    const { data } = await axiosInstance.post(
      "verify-new-number-otp",
      requestData,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsNewOTPVerified(true);
      setIsNewNumberFieldDisabled(true);
      localStorage.clear();
      toast.error("you are log out and reload the page");
      setTimeout(logOutApi, 5000);
      setTimeout(() => window.location.reload(), 5000);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
