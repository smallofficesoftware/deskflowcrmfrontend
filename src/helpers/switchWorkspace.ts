import { axiosInstance } from "../services/axiosInstance";
import { DEFAULT_STATUS_CODE_SUCCESS } from "./AppConstants";

export interface ISwitchWorkspaceResult {
  ok: boolean;
  message: string;
}

/**
 * Makes `workspaceId` the active company/workspace for this login (same call
 * the Manage Workspaces modal uses) and stores the new session. The caller
 * shows the message and reloads the page.
 */
export const switchWorkspace = async (
  workspaceId: number,
): Promise<ISwitchWorkspaceResult> => {
  try {
    const token = localStorage.getItem("token");
    const response = await axiosInstance.post(
      "selectWorkspace",
      { companyId: workspaceId },
      { headers: { Authorization: `${token}` } },
    );

    if (
      response.data.code === 200 &&
      response.data.ack === DEFAULT_STATUS_CODE_SUCCESS
    ) {
      const data = response.data?.data;
      localStorage.setItem("token", data?.token);
      localStorage.setItem("UUID", data?.item?.id);
      localStorage.setItem("USERNAME", data?.item?.username);
      localStorage.setItem("COMPANY_ID", workspaceId.toString());
      return { ok: true, message: "Switched workspace successfully!" };
    }
    return {
      ok: false,
      message: response.data.ack_msg || "Failed to switch workspace",
    };
  } catch (error: any) {
    return {
      ok: false,
      message:
        error?.response?.data?.ack_msg || "An error occurred during switch",
    };
  }
};
