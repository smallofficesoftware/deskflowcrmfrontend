import axios from "axios";
import { decryptPayload, encryptPayload } from "../common/SharedFunction";
import {
  BACKEND_OF_SMALL_OFFICE_CRM_END_POINT,
  IS_ACTUAL,
  IS_PRODUCTION,
} from "../helpers/AppConstants";

export const axiosInstanceFormData = axios.create({
  baseURL: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "multipart/form-data",
    "Access-Control-Allow-Origin": "",
    is_actual: IS_ACTUAL,
  },
});

// ✅ Request Interceptor (encrypt payload)
axiosInstanceFormData.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const uuid = localStorage.getItem("UUID");
    const companyId = localStorage.getItem("COMPANY_ID");
    if (token) {
      config.headers.Authorization = token; // ✅ Dynamically set header
    }
    config.headers["x-tenant-id"] = uuid;
    if (companyId) {
      config.headers["x-company-id"] = companyId;
    }
    if ((IS_PRODUCTION || IS_ACTUAL === "1") && config.data) {
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        const newFormData = new FormData();
        const obj: Record<string, any> = {};

        for (const [key, rawValue] of (config.data as FormData).entries()) {
          const value = rawValue as string | Blob; // 👈 explicitly cast

          if (value instanceof File || value instanceof Blob) {
            // 📂 keep file as-is
            newFormData.append(key, value);
          } else {
            // 🔑 collect text fields
            obj[key] = value;
          }
        }

        // 🔒 Encrypt all text fields together
        const encryptedPayload = encryptPayload(obj);
        newFormData.append("payload", encryptedPayload);

        config.data = newFormData;
      } else {
        // For JSON bodies
        config.data = { payload: encryptPayload(config.data) };
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Response Interceptor (decrypt payload)
axiosInstanceFormData.interceptors.response.use(
  (response) => {
    if ((IS_PRODUCTION || IS_ACTUAL == "1") && response.data?.payload) {
      response.data = decryptPayload(response.data.payload);
    }
    return response;
  },
  (error) => Promise.reject(error),
);
