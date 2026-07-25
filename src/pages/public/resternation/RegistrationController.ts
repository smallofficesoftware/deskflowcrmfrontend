import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export interface IRegistration {
  mobile_number: string;
  username: string;
  recovery_email: string;
  registration_flag: string;
  jointeam_flag: string;
}
export const registrationInitialValues = {
  mobile_number: "",
  username: "",
  recovery_email: "",
  registration_flag: "",
  jointeam_flag: "",
};

export const ContactNumberRegex = /^\+?[0-9]{2} ?[0-9]{6,12}$/;
const regexAlphanumeric = /^(?=.*[a-zA-Z\s])(?=.*[0-9])[a-zA-Z0-9]+$/;
const regexOnlyCharacters = /^[a-zA-Z\s]+$/;
const regexCombined = new RegExp(
  `(${regexAlphanumeric.source})|(${regexOnlyCharacters.source})`
);

export const registrationValidationSchema = () =>
  Yup.object().shape({
    mobile_number: Yup.string()
      .matches(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
    // .required(" Mobile Number is Required"),
    username: Yup.string()
      .matches(regexCombined, "Name must contain only letters")
      .max(50, "Maximum 50 characters are allowed")
      .min(2, "Minimum 2 characters are required")
      .required("Your Name Required"),

    recovery_email: Yup.string()
      .email("Please enter email address")
      // .required("Email address is required")
      .max(100, "Email address cannot exceed 100 characters")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter valid email address"
      )
  });

export const registrationSubmit = async (
  values: IRegistration,
  setShowOtp: TReactSetState<boolean>,
  setShowMenu: TReactSetState<boolean>
) => {
  try {
    const response = await axiosInstance.post("register", {
      username: values.username,
      contact_number: values.mobile_number,
      recovery_email: values.recovery_email,
      registration_flag: values.registration_flag,
      jointeam_flag: values.jointeam_flag,
    });

    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setShowOtp(false);
        setShowMenu(false);
      } else {
        setShowOtp(true);
        toast.error(response.data.ack_msg);
      }
    } else {
      setShowOtp(true);
      toast.error(response.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error.response.data.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
