import { toast } from "react-toastify";
import * as Yup from "yup";
import { formatDateTimeSendDataBase } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export interface IOTPVerifyViewProps {
  handleSubmit: (status: boolean) => void;
  mobileNumber: string;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  position: number;
  haspin?: string; // New prop to indicate if PIN is required
}

export interface IUserInfo {
  username: string;
  recovery_mobile: number;
  recovery_email: string;
}

export interface IOtpValues {
  OTP: string;
}

export const OTPInitialValues = {
  OTP: "",
};

export const OtpValidationSchema = () =>
  Yup.object().shape({
    OTP: Yup.string()
      .min(6, "validationOTPMin")
      .max(6, "validationOTPMax")
      .required("validationOTPRequired"),
  });

export const OTPSubmit = async (
  otp: string,
  username: string,
  setShowMenu: TReactSetState<boolean>,
  position: number,
  setShowMenu1: TReactSetState<boolean>,
  setCheckCompanyAlreadyExists: TReactSetState<number>,
  setUserInfo: TReactSetState<IUserInfo | undefined>,
  setCompanyData: TReactSetState<any>,
  setCheckPlan: TReactSetState<any>,
  setShowRenewPlan: TReactSetState<boolean>,
  setShowRenewPlanFromLogin: TReactSetState<boolean>,
  haspin?: string,
  teamIennerJoin?: number,
  onOtpSuccess?: () => void,
  teamCompanyId?: number,
  setcheckForTeamPlanExpireOrNot?: any,
  setWorkspacesList?: TReactSetState<any[]>,
) => {
  try {
    const currentDate = formatDateTimeSendDataBase(new Date());
    const payload =
      haspin == "1"
        ? {
            contact_number: username,
            otp: otp, // Send as PIN if haspin is present
            request_flag: position,
            platform: "web",
          }
        : {
            contact_number: username,
            otp: otp, // Send as OTP if haspin is not present
            request_flag: position,
            platform: "web",
          };

    const response = await axiosInstance.post("verifyOtp", payload);

    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        if (teamIennerJoin === 1) {
          // Call inner-join-team API with company_id
          const joinPayload = {
            company_id: teamCompanyId, // Use teamIennerJoin as company_id
            team_mobile_number: username,
          };
          const token = localStorage.getItem("token");
          const joinResponse = await axiosInstance.post(
            "inner-join-team",
            joinPayload,
            {
              headers: {
                Authorization: `${token}`,
              },
            },
          );
          if (
            joinResponse.data.code === 200 &&
            joinResponse.data.ack === DEFAULT_STATUS_CODE_SUCCESS
          ) {
            if (onOtpSuccess) {
              onOtpSuccess();
            }
          } else {
            toast.error(
              joinResponse.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
          }
          setCompanyData(response.data?.data.findItShouldPayornot);
          setUserInfo(response.data.data.item);
        } else {
          const storeId = response?.data?.data.item?.id;
          const storeUserName = response?.data?.data.item?.username;
          const storeToken = response.data?.data?.token;
          const storeDevice_id = response.data?.data?.device_id;
          localStorage.setItem("token", storeToken);
          localStorage.setItem("UUID", storeId);
          localStorage.setItem("USERNAME", storeUserName);
          localStorage.setItem("device_id", storeDevice_id);

          const workspaces = response.data?.data?.workspaces || [];
          if (setWorkspacesList) {
            setWorkspacesList(workspaces);
          }

          if (response.data?.data.checkCompanyAlreadyExists === 5) {
            setCheckCompanyAlreadyExists(5);
            setUserInfo(response.data.data.item);
            if (onOtpSuccess) {
              onOtpSuccess();
            }
          } else {
            if (workspaces.length === 1) {
              localStorage.setItem("COMPANY_ID", workspaces[0].id.toString());
            }
            setCheckCompanyAlreadyExists(
              response.data?.data.checkCompanyAlreadyExists,
            );
            setCheckPlan(response.data?.data.findItShouldPayornot);
            setShowRenewPlan(true);
            setUserInfo(response.data.data.item);
            setCompanyData(response.data?.data.findItShouldPayornot); // Assuming company data is included
            setShowMenu1(true);
            setcheckForTeamPlanExpireOrNot(response.data?.data.company_flag);
            setShowRenewPlanFromLogin(false);
            if (
              response.data?.data.daysExpiry === -1 ||
              response.data?.data.daysExpiry === -2
            ) {
              setShowRenewPlanFromLogin(true);
            }
          }
          return response.data;
        }
      } else {
        setShowMenu(false);
        toast.error(response.data.ack_msg);
      }
    } else {
      setShowMenu(false);
      toast.error(response.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error?.response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const WorkspaceSelectSubmit = async (
  companyId: number,
  setCheckCompanyAlreadyExists: TReactSetState<number>,
  setUserInfo: TReactSetState<IUserInfo | undefined>,
  setCompanyData: TReactSetState<any>,
  setCheckPlan: TReactSetState<any>,
  setShowRenewPlan: TReactSetState<boolean>,
  setShowRenewPlanFromLogin: TReactSetState<boolean>,
  setShowMenu1: TReactSetState<boolean>,
  setcheckForTeamPlanExpireOrNot: any,
  onSuccess: () => void,
) => {
  try {
    const tempToken = localStorage.getItem("token");
    const response = await axiosInstance.post(
      "selectWorkspace",
      { companyId },
      {
        headers: {
          Authorization: `${tempToken}`,
        },
      },
    );

    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const storeId = response?.data?.data.item?.id;
        const storeUserName = response?.data?.data.item?.username;
        const storeToken = response.data?.data?.token;

        localStorage.setItem("token", storeToken);
        localStorage.setItem("UUID", storeId);
        localStorage.setItem("USERNAME", storeUserName);
        localStorage.setItem("COMPANY_ID", companyId.toString());

        setCheckCompanyAlreadyExists(
          response.data?.data.checkCompanyAlreadyExists,
        );
        setCheckPlan(response.data?.data.findItShouldPayornot);
        setShowRenewPlan(true);
        setUserInfo(response.data.data.item);
        setCompanyData(response.data?.data.findItShouldPayornot);
        setcheckForTeamPlanExpireOrNot(response.data?.data.company_flag);
        setShowRenewPlanFromLogin(false);
        setShowMenu1(true);

        if (
          response.data?.data.daysExpiry === -1 ||
          response.data?.data.daysExpiry === -2
        ) {
          setShowRenewPlanFromLogin(true);
        }
        onSuccess();
      } else {
        toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  }
};
