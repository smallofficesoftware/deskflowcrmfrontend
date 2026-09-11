import CryptoJS from "crypto-js";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  DESKFLOW_CRM_PAYLOAD_ENCRYPTION_KEY,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  MINI_TEXT_LENGTH,
} from "../helpers/AppConstants";
import { axiosInstance } from "../services/axiosInstance";
import axiosInstanceForWhatsApp from "../services/axiosInstanceForWhatsApp";
const SECRET_KEY = DESKFLOW_CRM_PAYLOAD_ENCRYPTION_KEY;

export interface SendToWhatsAppPayload {
  numbers: string | string[];
  sessionName: string;
  type:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "location"
    | "contact"
    | "sticker";
  mediaUrls?: string | string[];
  text?: string;
  caption?: string;
  base64?: string;
  documentFileName?: string;
  mimetype?: string;
  duration?: number;
  ptt?: boolean;
  ptv?: boolean;
}

export const checkDuplication = async (
  value: string | number,
  tableName: string,
  columnName: string,
  columnName1?: string,
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: tableName,
    columns: "id",
    where: `{"isDelete":"0","${columnName}":"${value}","a_application_login_id":"${getUUID}"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const getCustomFieldDatavalues = async (
  custom_field_master_id: number | number[],
) => {
  try {
    const requestData = {
      custom_field_master_id: custom_field_master_id,
    };

    const data = await axiosInstance.post(
      "getCustomFieldDatavalues",
      requestData,
    );
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return data.data.data;
    } else {
      return false;
    }
  } catch (e: any) {
    toast.error(e || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

//  export const handelRefreshMessages= async ()=> {
//   try {
//     fetchWhatsAppApiWebhook(setLoading);
//     if (getData?.id) {
//       fetchMessageData(
//         setNoDataFound,
//         "",
//         setLoading,
//         setMessageList,
//         setHasMore,
//         0,
//         setNoDataFound1,
//         getData?.id,
//         checkedReminder,
//         checkedAttachment,
//         selectDate,
//         "-1",
//         setGetCompanyId
//       );
//     }
//   } catch (error) {
//     console.error("Error refreshing contacts:", error);
//   }
// }

export const generateCustomNumber = async () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`; // 8 digits

  const middlePart = "24"; // Fixed 2 digits

  // Generate 4-digit random number
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  // Combine all parts
  const rendomNumber = `${datePart}${middlePart}${randomPart}`;
  return rendomNumber;
};

export const generateCustomEmail = async () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`; // 8 digits

  const middlePart = "@smalloffice.in"; // Fixed 2 digits

  // Generate 4-digit random number
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  // Combine all parts
  const rendomNumber = `${datePart}${randomPart}${middlePart}`;
  return rendomNumber;
};

export const checkDuplicationTwoColum = async (
  value: string | number,
  tableName: string,
  columnName: string,
  columnName1: string,
  value1: string | number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: tableName,
    columns: "id",
    where: `{"isDelete":"0","${columnName}":"${value}","${columnName1}":"${value1}","a_application_login_id":"${getUUID}"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const checkDuplicationUpdate = async (
  value: string | number,
  tableName: string,
  columnName: string,
  UpdateId: number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: tableName,
    columns: "id",
    where: `{"isDelete":"0","${columnName}":"${value}","a_application_login_id":"${getUUID}","id":"${UpdateId}"}`,
    request_flag: 2,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const checkDuplicationUpdateTwoColum = async (
  value: string | number,
  tableName: string,
  columnName: string,
  columnName1: string,
  value1: string | number | undefined,
  UpdateId: number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: tableName,
    columns: "id",
    where: `{"isDelete":"0","${columnName}":"${value}","${columnName1}":${value1},"a_application_login_id":"${getUUID}","id":"${UpdateId}"}`,
    request_flag: 2,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const checkDuplicationWithoutApplicationLogin = async (
  value: string | number,
  tableName: string,
  columnName: string,
) => {
  const requestData = {
    table: tableName,
    columns: "id",
    where: `{"isDelete":"0","${columnName}":"${value}"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const formatDate = (date: any) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

export const formatDateYMDV2 = (date: any) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${year}-${month}-${day}`;
};

export const formatTimeOnly = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";

  let d: Date;

  if (typeof date === "string") {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return "";
  }

  if (isNaN(d.getTime())) {
    return "";
  }

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};

// export const formatTime = (
//   date: string | Date | null | undefined
// ): string => {
//   if (!date) return "";

//   let d: Date;

//   if (typeof date === "string") {
//     d = new Date(date);
//   } else if (date instanceof Date) {
//     d = date;
//   } else {
//     return "";
//   }

//   if (isNaN(d.getTime())) {
//     return "";
//   }

//   let hours = d.getHours();
//   const minutes = d.getMinutes().toString().padStart(2, "0");
//   const ampm = hours >= 12 ? "PM" : "AM";

//   hours = hours % 12 || 12;

//   return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
// };

export const formatDateYMD = (date: any) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${year}-${month}-${day} `;
};

export const formatTimeToAmPm = (dateTime: string): string => {
  try {
    // Convert "DD-MM-YYYY HH:mm" to "YYYY-MM-DDTHH:mm:ss"
    const [datePart, timePart] = dateTime.split(" ");
    const [day, month, year] = datePart.split("-");
    const isoDateTime = `${year}-${month}-${day}T${timePart}`;

    const date = new Date(isoDateTime);

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }

    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: true, // Ensures AM/PM format
    };

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (error: any) {
    console.error("Error formatting time:", error.message);
    return "Invalid Date";
  }
};

export function convert12To24(time12h?: string) {
  if (!time12h) return "";

  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");

  let h = parseInt(hours, 10);

  if (modifier === "AM" && h === 12) h = 0;
  if (modifier === "PM" && h !== 12) h += 12;

  return `${String(h).padStart(2, "0")}:${minutes}`;
}

export const convertTimeToAmPm = (time: string): string => {
  if (!time) {
    return "Invalid Time";
  }

  const [hours, minutes, seconds] = time.split(":").map(Number);

  let hour = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const period = hours >= 12 ? "PM" : "AM";

  const formattedHour = hour.toString().padStart(2, "0");
  const formattedMinute = minutes.toString().padStart(2, "0");
  const formattedSecond = seconds.toString().padStart(2, "0");

  return `${formattedHour}:${formattedMinute}:${formattedSecond} ${period}`;
};

export const formatDateAndTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";

  let d: Date;

  if (typeof date === "string") {
    // Try to parse ISO date string directly
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return ""; // Unsupported format
  }

  if (isNaN(d.getTime())) {
    return ""; // Invalid date
  }

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}-${month}-${year} ${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;
};

export const convertDateTimeFormat = (
  dateTime: string,
): { date: string; time: string } => {
  const [datePart, timePart] = dateTime.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  let period = "AM";

  if (hours >= 12) {
    period = "PM";
    if (hours > 12) {
      hours -= 12;
    }
  } else if (hours === 0) {
    hours = 12;
  }

  const formattedTime = `${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")} ${period}`;

  return { date: datePart, time: formattedTime };
};
export const convertDateTimeSecondsFormat = (
  dateTime: string,
): { date: string; time: string } => {
  const [datePart, timePart] = dateTime.split(" ");
  let [hours, minutes, seconds] = timePart.split(":").map(Number);
  let period = "AM";

  if (hours >= 12) {
    period = "PM";
    if (hours > 12) {
      hours -= 12;
    }
  } else if (hours === 0) {
    hours = 12;
  }

  const formattedTime = `${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`;

  return { date: datePart, time: formattedTime };
};

export const isCurrentDateTime = (reminderDateTime: string): boolean => {
  const currentDateTime = new Date();
  const reminderDate = new Date(reminderDateTime);

  // Comparing date and time
  return (
    currentDateTime.getFullYear() === reminderDate.getFullYear() &&
    currentDateTime.getMonth() === reminderDate.getMonth() &&
    currentDateTime.getDate() === reminderDate.getDate() &&
    currentDateTime.getHours() === reminderDate.getHours() &&
    currentDateTime.getMinutes() === reminderDate.getMinutes()
  );
};
// yyyy-mm-dd HH:MM:SS
export function formatDateTimeSendDataBase(date: Date): string {
  if (!(date instanceof Date)) {
    throw new Error("Invalid date object");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDateTimeSendDataBaseV2(value: string) {
  if (!value) return "";

  const parts = value.split(" ");
  if (parts.length !== 3) return "";

  const [date, time, meridian] = parts;
  const [dd, mm, yyyy] = date.split("-");
  let [hh, min] = time.split(":").map(Number);

  if (Number.isNaN(hh) || Number.isNaN(min)) return "";

  if (meridian === "AM" && hh === 12) hh = 0;
  if (meridian === "PM" && hh !== 12) hh += 12;

  return `${yyyy}-${mm}-${dd} ${String(hh).padStart(2, "0")}:${min}:00`;
}
export function formatDateSendDataBaseV2(dateStr: string) {
  if (!dateStr) return "";

  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";

  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

// yyyy-mm-dd HH:MM:SS
export function formatDateSendDataBase(date: Date): string {
  if (!(date instanceof Date)) {
    throw new Error("Invalid date object");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatNumber(number: number, decimals = 2) {
  return number.toFixed(decimals);
}

type CurrencyConfig = {
  scales: string[]; // Numbering system scales
  suffix: string; // Currency name
};

const currencyConfigs: Record<string, CurrencyConfig> = {
  INR: { scales: ["", "Thousand", "Lakh", "Crore"], suffix: "Rupees" },
  USD: { scales: ["", "Thousand", "Million", "Billion"], suffix: "Dollars" },
  EUR: { scales: ["", "Thousand", "Million", "Billion"], suffix: "Euros" },
  GBP: { scales: ["", "Thousand", "Million", "Billion"], suffix: "Pounds" },
  JPY: { scales: ["", "Thousand", "Million", "Billion"], suffix: "Yen" },
  // Add more currencies here
};

// export const numberToWordsCurrency = (
//   num: number,
//   currency: string,
// ): string => {
//   const config = currencyConfigs[currency];
//   if (!config) {
//     throw new Error(`Unsupported currency: ${currency}`);
//   }

//   const { scales, suffix } = config;

//   const units = [
//     "",
//     "One",
//     "Two",
//     "Three",
//     "Four",
//     "Five",
//     "Six",
//     "Seven",
//     "Eight",
//     "Nine",
//   ];
//   const teens = [
//     "Ten",
//     "Eleven",
//     "Twelve",
//     "Thirteen",
//     "Fourteen",
//     "Fifteen",
//     "Sixteen",
//     "Seventeen",
//     "Eighteen",
//     "Nineteen",
//   ];
//   const tens = [
//     "",
//     "",
//     "Twenty",
//     "Thirty",
//     "Forty",
//     "Fifty",
//     "Sixty",
//     "Seventy",
//     "Eighty",
//     "Ninety",
//   ];

//   const numberToWords = (n: number): string => {
//     if (n === 0) return "";

//     let word = "";
//     const hundreds = Math.floor(n / 100);
//     const remainder = n % 100;
//     const tensValue = Math.floor(remainder / 10);
//     const unitsValue = remainder % 10;

//     if (hundreds > 0) {
//       word += units[hundreds] + " Hundred ";
//     }

//     if (remainder >= 10 && remainder < 20) {
//       word += teens[remainder - 10];
//     } else {
//       if (tensValue > 0) {
//         word += tens[tensValue] + " ";
//       }
//       if (unitsValue > 0) {
//         word += units[unitsValue];
//       }
//     }

//     return word.trim();
//   };

//   const splitNumberIndian = (n: number): number[] => {
//     const parts: number[] = [];
//     parts.push(n % 1000); // Units (3 digits)
//     n = Math.floor(n / 1000);

//     while (n > 0) {
//       parts.push(n % 100); // Next 2 digits (Lakh, Crore, etc.)
//       n = Math.floor(n / 100);
//     }

//     return parts;
//   };

//   const rupees = Math.floor(num);
//   const paise = Math.round((num - rupees) * 100);

//   const rupeeChunks = splitNumberIndian(rupees);

//   let words = "";
//   for (let i = rupeeChunks.length - 1; i >= 0; i--) {
//     const chunk = rupeeChunks[i];
//     if (chunk !== 0) {
//       words += numberToWords(chunk) + (scales[i] ? " " + scales[i] : "") + " ";
//     }
//   }

//   let finalWords = words.trim() + ` ${suffix}`;
//   if (paise > 0) {
//     finalWords += ` and ${numberToWords(paise)} Paise`;
//   }

//   return finalWords.trim();
// };

export const formatTime = (seconds: number): string => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

export const openInNewTab = (path: string, id?: number) => {
  const baseURL = window.location.origin;
  window.open(`${baseURL}${path}/${id}`, "_blank");
};

// escape handle
export const useEscapeKey = (callback: () => void) => {
  useEffect(() => {
    const handleEscapeKey = (event: { key: string }) => {
      if (event.key === "Escape") {
        callback();
      }
    };

    // Add event listener for Escape key press
    window.addEventListener("keydown", handleEscapeKey);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [callback]); // Dependency array to ensure callback updates if needed
};

export const handleRefresh = async () => {
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
  window.location.href =
    window.location.pathname + "?reload=" + new Date().getTime();
};

export const sendToWhatsApp = async ({
  numbers,
  sessionName,
  type = "text",
  mediaUrls,
  text = "",
  caption = "",
  base64,
  documentFileName,
  mimetype = "application/pdf",
  duration,
  ptt,
  ptv,
}: SendToWhatsAppPayload) => {
  try {
    const payload = {
      numbers: Array.isArray(numbers) ? numbers : [numbers],
      sessionName,
      type,
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [mediaUrls],
      text,
      caption,
      documentFileName,
      base64,
      options: {
        mimetype,
        duration,
        ptt,
        ptv,
      },
    };
    const response = await axiosInstanceForWhatsApp.post(
      "/messages/send-message",
      payload,
    );
    if (
      response.status === 404 ||
      response.status === 400 ||
      response.status === 500
    ) {
      toast.error(response.data.error || response.data.message);
      return null;
    } else if (response.status === 200) {
      return response;
    }
  } catch (error: any) {
    toast.error(
      error?.response.data.error ||
        error?.response.data.message ||
        error?.message,
    );
    return null;
  }
};

// hooks/useGlobalKeyHandler.js

// ✅ Encrypt function
export const encryptPayload = (data: any) => {
  const strData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(strData, SECRET_KEY).toString();
};

// ✅ Decrypt function
export const decryptPayload = (cipherText: string) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

export const truncateText = (
  text: string = "",
  maxLength: number = MINI_TEXT_LENGTH,
): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

// // Shared secret (string)
// const SECRET_KEY_W = "my-secret-passphrase";

// // Convert string → crypto key
// async function getKey(secret: string) {
//   const enc = new TextEncoder().encode(secret);
//   const hash = await crypto.subtle.digest("SHA-256", enc); // derive 32-byte key
//   return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
// }

// // ✅ Encrypt function
// export async function encryptPayload(data: any): Promise<string> {
//   const key = await getKey(SECRET_KEY_W);
//   const iv = crypto.getRandomValues(new Uint8Array(12));

//   const encoded = new TextEncoder().encode(JSON.stringify(data));

//   const ciphertext = await crypto.subtle.encrypt(
//     { name: "AES-GCM", iv },
//     key,
//     encoded
//   );

//   // ciphertext includes tag at the end, so we prepend IV
//   const fullData = new Uint8Array(iv.length + ciphertext.byteLength);
//   fullData.set(iv, 0);
//   fullData.set(new Uint8Array(ciphertext), iv.length);

//   return btoa(String.fromCharCode(...fullData)); // Base64
// }

// // ✅ Decrypt function
// export async function decryptPayload(cipherText: string): Promise<any> {
//   const raw = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));

//   const iv = raw.slice(0, 12);
//   const data = raw.slice(12);

//   const key = await getKey(SECRET_KEY_W);

//   try {
//     const decrypted = await crypto.subtle.decrypt(
//       { name: "AES-GCM", iv },
//       key,
//       data
//     );
//     const decoded = new TextDecoder().decode(decrypted);
//     return JSON.parse(decoded);
//   } catch (err) {
//     console.error("Decryption failed:", err);
//     return null;
//   }
// }

export const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Copy failed"));
  } else {
    // Fallback for HTTP / older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      toast.success("Copied");
    } catch (err) {
      toast.error("Copy failed");
    }

    document.body.removeChild(textarea);
  }
};

export function isValidPhone(phone?: string): boolean {
  if (!phone) return false;
  return /^[0-9]{10,15}$/.test(phone);
}

export const newRightsForPrint = async (
  page_id: number,
  a_application_login_id: number | string | null,
) => {
  try {
    const payload = {
      page_id,
      a_application_login_id,
    };
    const { data } = await axiosInstance.post("new-rights-print", payload);
    const rights = data?.data;
    return rights;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
};

export const getWhatsappFlag = async (
  a_application_login_id: number | string | null,
) => {
  try {
    const payload = {
      a_application_login_id,
    };
    const { data } = await axiosInstance.post("wconfigflag", payload);
    const rights = data?.data;
    return rights;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
};
