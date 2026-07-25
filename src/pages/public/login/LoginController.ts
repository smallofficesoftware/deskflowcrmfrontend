import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export interface ILoginValues {
  mobile_number: string;
}
export const LoginInitialValues = {
  mobile_number: "",
};

export const ContactNumberRegex = /^\+?[0-9]{2} ?[0-9]{6,12}$/;
export const LoginValidationSchema = () =>
  Yup.object().shape({
    mobile_number: Yup.string()
      .required("This field is required")
      .test("is-mobile-or-email", "Please enter a valid mobile number or email address", (value) => {
        // Check if the value matches a mobile number pattern
        const mobileRegex = /^[0-9]{10,15}$/;
        // Check if the value matches an email address pattern
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Return true if it's either a valid mobile number or a valid email address
        return mobileRegex.test(value) || emailRegex.test(value);
      })
      .max(100, "Email address cannot exceed 100 characters") // Limit for email addresses
      .min(10, "Please enter minimum 10 digits") // Mobile number should have at least 10 digits
    // .max(15, "Maximum 15 digits are allowed")
  }
  );

export const loginSubmit = async (
  values: ILoginValues,
  setShowOtp: TReactSetState<boolean>
) => {
  try {
    const contactNumber = values.mobile_number;
    const response = await axiosInstance.post("login", {
      contact_number: contactNumber,
      request_flag: 1,
    });

    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setShowOtp(true);
        return response.data; // Return the full response to access haspin
      } else {
        toast.error(response.data.ack_msg);
        return null;
      }
    } else {
      toast.error(response.data.ack_msg);
      return null;
    }
  } catch (error: any) {
    toast.error(error?.response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
};