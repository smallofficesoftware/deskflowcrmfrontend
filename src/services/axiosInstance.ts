import axios from "axios";
import { toast } from "react-toastify";
import {
  decryptPayload,
  encryptPayload,
  handleRefresh,
} from "../common/SharedFunction";
import {
  BACKEND_OF_SMALL_OFFICE_CRM_END_POINT,
  IS_ACTUAL,
  IS_PRODUCTION,
} from "../helpers/AppConstants";
import { axiosInstanceFormData } from "./axiosInstanceFormData";
import { axiosInstanceForWpWeb } from "./axiosInstanceForWpWeb";
import { axiosInstanceProductAndContact } from "./axiosInstanceProductAndContact";

// const { id, MobileToken, getID, printFlag } = useParams();

let urlParams: { MobileToken?: string; getID?: string } = {};

export const setUrlParams = (params: {
  MobileToken?: string;
  getID?: string;
}) => {
  urlParams = params;
};

/* ---------- Encryption or config For axiosInstance ---------- */
const axiosInstance = axios.create({
  baseURL: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/api`,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "",
    is_actual: IS_ACTUAL,
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = urlParams.MobileToken || localStorage.getItem("token");
    const uuid = urlParams.getID || localStorage.getItem("UUID");
    const companyId = localStorage.getItem("COMPANY_ID");
    // Owner+PIN gate for Report Builder/Document Designer build routes
    // (requireReportPin, backend's reportPinAuth.js) — a signed, short-lived
    // token set by verifyReportPin on success, attached to every request the
    // same way as the headers above, rather than threading it through each
    // individual call site.
    const reportPinToken = localStorage.getItem("REPORT_PIN_TOKEN");
    if (token) {
      config.headers.Authorization = token;
    }
    if (uuid) {
      config.headers["x-tenant-id"] = uuid;
    }
    if (companyId) {
      config.headers["x-company-id"] = companyId;
    }
    if (reportPinToken) {
      config.headers["x-report-pin-token"] = reportPinToken;
    }
    if ((IS_PRODUCTION || IS_ACTUAL == "1") && config.data) {
      config.data = { payload: encryptPayload(config.data) };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Response Interceptor (decrypt payload)
axiosInstance.interceptors.response.use(
  (response) => {
    if (
      (response.data.ack == -2 || response.data.ack == -1) &&
      response.config.url != "onLoad"
    ) {
      toast.error(response.data.ack_msg);
      localStorage.clear();
      handleRefresh();
    }

    if ((IS_PRODUCTION || IS_ACTUAL == "1") && response.data?.payload) {
      response.data = decryptPayload(response.data.payload);
    }
    return response;
  },
  (error) => Promise.reject(error),
);
/* ---------- Encryption or config For axiosInstance ---------- */

export {
  axiosInstance,
  axiosInstanceFormData,
  axiosInstanceForWpWeb,
  axiosInstanceProductAndContact,
};
