import axios from "axios";
import { decryptPayload, encryptPayload } from "../common/SharedFunction";
import {
  BACKEND_OF_SMALL_OFFICE_CRM_END_POINT,
  IS_ACTUAL,
  IS_PRODUCTION,
} from "../helpers/AppConstants";

export const axiosInstanceProductAndContact = axios.create({
  baseURL: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/api`,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "",
    is_actual: IS_ACTUAL,
  },
});

// ✅ Request Interceptor (encrypt payload)
axiosInstanceProductAndContact.interceptors.request.use(
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
    if ((IS_PRODUCTION || IS_ACTUAL == "1") && config.data) {
      config.data = { payload: encryptPayload(config.data) };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// axiosInstanceProductAndContact.interceptors.request.use(
//     (config) => {
//         if (IS_PRODUCTION && config.data instanceof FormData) {
//             const newFormData = new FormData();

//             for (const [key, value] of config.data.entries()) {
//                 // check safely if File/Blob exist
//                 const isFile =
//                     (typeof File !== "undefined" && value instanceof File) ||
//                     (typeof Blob !== "undefined" && value instanceof Blob) ||
//                     value instanceof ArrayBuffer;

//                 if (isFile) {
//                     // ✅ leave binary data as is
//                     newFormData.append(key, value);
//                 } else {
//                     // ✅ encrypt only text fields
//                     newFormData.append('payload', encryptPayload(String({ key: value })));
//                 }
//             }

//             config.data = newFormData;
//         } else if (IS_PRODUCTION && config.data && typeof config.data === "object") {
//             // For normal JSON requests
//             config.data = { payload: encryptPayload(config.data) };
//         }

//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// ✅ Response Interceptor (decrypt payload)
axiosInstanceProductAndContact.interceptors.response.use(
  (response) => {
    if ((IS_PRODUCTION || IS_ACTUAL == "1") && response.data?.payload) {
      response.data = decryptPayload(response.data.payload);
    }
    return response;
  },
  (error) => Promise.reject(error),
);
