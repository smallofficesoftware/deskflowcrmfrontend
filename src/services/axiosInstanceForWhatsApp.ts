import axios from "axios";
import {
  BACKEND_OF_WPPCONNECT_BACKEND_END_POINT,
  ENCRYPT_WHATSAPP_PAYLOAD,
} from "../helpers/AppConstants";
import { decryptText, encryptText } from "../helpers/encryption";

const axiosInstanceForWhatsApp = axios.create({
  baseURL: `${BACKEND_OF_WPPCONNECT_BACKEND_END_POINT}/api`,
  timeout: 180000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstanceForWhatsApp.interceptors.request.use(
  async (config) => {
    const companyId = localStorage.getItem("COMPANY_ID");
    if (companyId) {
      config.headers["x-company-id"] = companyId;
    }

    if (!ENCRYPT_WHATSAPP_PAYLOAD) return config;
    const contentType =
      config.headers["Content-Type"] || config.headers["content-type"];
    if (contentType && contentType.includes("multipart/form-data")) {
      // handle multipart: config.data is FormData
      const form = config.data;
      const newForm = new FormData();
      for (const [key, value] of form.entries()) {
        if (value instanceof File) {
          newForm.append(key, value);
        } else {
          // ✅ Encrypt text fields properly
          const valueToEncrypt =
            typeof value === "object" ? JSON.stringify(value) : String(value);
          const encrypted = encryptText(valueToEncrypt);
          newForm.append(key, encrypted);
        }
      }
      config.data = newForm;
      // Let browser set the correct multipart boundary header
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      // JSON / normal request
      if (config.data) {
        const plaintext = JSON.stringify(config.data);
        const encrypted = encryptText(plaintext);
        config.data = { payload: encrypted };
        config.headers["Content-Type"] = "application/json";
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstanceForWhatsApp.interceptors.response.use(
  (response) => {
    if (!ENCRYPT_WHATSAPP_PAYLOAD) return response;
    if (response.data && response.data.payload) {
      const decrypted = decryptText(response.data.payload);
      try {
        response.data = JSON.parse(decrypted);
      } catch (e) {
        response.data = decrypted;
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstanceForWhatsApp;
