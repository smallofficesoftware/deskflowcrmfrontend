import axios from "axios";
import { decryptPayload, encryptPayload } from "../common/SharedFunction";
import {
  BACKEND_OF_SMALL_OFFICE_WHATSAPP_WEB_END_POINT,
  IS_ACTUAL,
  IS_PRODUCTION,
} from "../helpers/AppConstants";

export const axiosInstanceForWpWeb = axios.create({
  baseURL: `${BACKEND_OF_SMALL_OFFICE_WHATSAPP_WEB_END_POINT}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "",
    is_actual: IS_ACTUAL,
  },
});

// ✅ Request Interceptor (encrypt payload)
axiosInstanceForWpWeb.interceptors.request.use(
  (config) => {
    const companyId = localStorage.getItem("COMPANY_ID");
    if (companyId) {
      config.headers["x-company-id"] = companyId;
    }
    if ((IS_PRODUCTION || IS_ACTUAL == "1") && config.data) {
      config.data = { payload: encryptPayload(config.data) };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Response Interceptor (decrypt payload)
axiosInstanceForWpWeb.interceptors.response.use(
  (response) => {
    if ((IS_PRODUCTION || IS_ACTUAL == "1") && response.data?.payload) {
      response.data = decryptPayload(response.data.payload);
    }
    return response;
  },
  (error) => Promise.reject(error),
);
