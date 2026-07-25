import { AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";

export interface AIAssistantResponse {
  success: boolean;
  message: string;
  query: string;
  results?: any[];
  tenant?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Calls the AI assistant API to generate or execute a SQL query based on user prompt.
 * @param prompt User's input describing the data request.
 * @param execute Whether to execute the generated query.
 * @param setTotalContact Optional function to update total contact count state.
 * @returns A response object containing SQL query, results (if executed), tenant, and error if any.
 */
export const askAIAssistant = async (
  prompt: string,
  execute: boolean,
  setTotalContact?: (count: number) => void
): Promise<AIAssistantResponse> => {
  const uuid = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  // Validate authentication
  if (!uuid || !token) {
    const errorMsg = "Missing required authentication information.";
    toast.error(errorMsg, { position: "top-right", autoClose: 5000 });
    return {
      success: false,
      query: "",
      message: errorMsg,
      error: errorMsg,
      errorCode: "AUTHENTICATION_ERROR",
    };
  }

  const loginId = Number(uuid);
  if (isNaN(loginId)) {
    const errorMsg = "Invalid user ID format.";
    toast.error(errorMsg, { position: "top-right", autoClose: 5000 });
    return {
      success: false,
      query: "",
      message: errorMsg,
      error: errorMsg,
      errorCode: "INVALID_UUID",
    };
  }

  try {
    const response = await axiosInstance.post(
      "gimini", // Note: Possible typo, consider correcting to "gemini" if applicable
      {
        prompt,
        execute,
        a_application_login_id: loginId,
      },
      {
        headers: {
          Authorization: `${token}`,
          "x-tenant-id": uuid,
        },
        timeout: 30000,
      }
    );

    const { data } = response;

    // Check if response is successful
    if (data?.code === 200 && data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // Optionally update total contact count if setTotalContact is provided
      if (setTotalContact && data?.data?.results) {
        const totalContactCount = data.data.results.length; // Assuming results array length as contact count
        setTotalContact(totalContactCount);
      }

      return {
        success: true,
        query: data.data?.query || "",
        results: data.data?.results || [],
        tenant: data.data?.tenant || "",
        message: data.developer_msg || data.ack_msg || "Query processed successfully",
      };
    } else {
      const errorMsg = data?.ack_msg || data?.developer_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED;
      toast.error(errorMsg, { position: "top-right", autoClose: 5000 });
      return {
        success: false,
        query: "",
        message: errorMsg,
        error: errorMsg,
        errorCode: data?.errorCode || "API_ERROR",
      };
    }
  } catch (error) {
    let errorMsg = MESSAGE_UNKNOWN_ERROR_OCCURRED;
    let errorCode = "UNKNOWN_ERROR";

    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        errorMsg = "Request timed out. Please try again later.";
        errorCode = "TIMEOUT_ERROR";
      } else if (error.response) {
        errorMsg = error.response.data?.message || error.response.data?.error || error.message;
        errorCode = error.response.data?.errorCode || "API_ERROR";
      } else if (error.request) {
        errorMsg = "No response from server. Check your network connection.";
        errorCode = "NETWORK_ERROR";
      }
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }

    toast.error(errorMsg, { position: "top-right", autoClose: 5000 });
    return {
      success: false,
      query: "",
      message: errorMsg,
      error: errorMsg,
      errorCode,
    };
  }
};