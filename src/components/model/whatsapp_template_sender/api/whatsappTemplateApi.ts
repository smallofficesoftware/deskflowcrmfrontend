// ============================================================
// api/whatsappTemplateApi.ts
// ADDITION ONLY: uploadStaticAttachment()
// All other functions UNCHANGED from previous version.
// ============================================================

import { axiosInstance } from "../../../../services/axiosInstance";
import type {
  ApiResponse,
  ITemplateOptionList,
  SavedTemplateConfig,
  SendTemplatePayload,
  Template,
} from "../types/windex";

// ── Template Listing (unchanged) ──────────────────────────────

export const fetchTemplates = async (): Promise<{
  apiResponse: ApiResponse;
  optionList: ITemplateOptionList[];
}> => {
  const uuid = localStorage.getItem("UUID");
  const requestData = { a_application_login_id: uuid };
  const { data } = await axiosInstance.post(
    "get-whatsapp-template",
    requestData,
  );

  const templates: Template[] = data?.data?.data ?? [];
  const optionList: ITemplateOptionList[] = templates.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.status})`,
  }));

  return {
    apiResponse: {
      success: data?.data?.success ?? false,
      data: templates,
      count: templates.length,
    },
    optionList,
  };
};

// ── Saved Config (unchanged) ──────────────────────────────────

export const getSavedConfig = async (
  module: string,
  a_application_login_id: string | null,
  templateId?: string,
): Promise<SavedTemplateConfig | null> => {
  const params: Record<string, string> = {
    module,
    a_application_login_id: a_application_login_id ?? "",
  };
  if (templateId) params.templateId = templateId;

  const { data } = await axiosInstance.get("whatsapp-templates/saved-config", {
    params,
  });
  return data?.data?.success ? (data.data.data as SavedTemplateConfig) : null;
};

export const upsertSavedConfig = async (
  config: SavedTemplateConfig,
): Promise<SavedTemplateConfig> => {
  const { data } = await axiosInstance.post(
    "whatsapp-templates/saved-config",
    config,
  );
  if (!data?.data?.success) throw new Error("Failed to save configuration");
  return data.data.data as SavedTemplateConfig;
};

// ── Send Template (unchanged) ─────────────────────────────────

export const sendWhatsAppTemplate = async (
  payload: SendTemplatePayload,
): Promise<void> => {
  const { data } = await axiosInstance.post("send-whatsapp-template", payload);
  if (data?.ack !== 200 && data?.ack !== "200") {
    throw new Error(data?.ack_msg ?? "Failed to send template message");
  }
};

// ── Variable Data Fetch (unchanged) ───────────────────────────

export const fetchVariableData = async (endpoint: string): Promise<any[]> => {
  const { data } = await axiosInstance.post(endpoint);
  return Array.isArray(data) ? data : [data];
};

// ── Static Attachment Upload (NEW) ────────────────────────────

export interface UploadAttachmentResponse {
  url: string;
  fileName: string;
}

/**
 * Uploads a static attachment file chosen by the user (image/document/video).
 * Server stores it and returns a permanent public URL — that URL is what
 * gets saved into the template config (attachmentSourceType: "static").
 */
export const uploadStaticAttachment = async (
  file: File,
  module: string,
): Promise<UploadAttachmentResponse> => {
  const uuid = localStorage.getItem("UUID");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("module", module);
  formData.append("a_application_login_id", String(uuid ?? ""));

  const { data } = await axiosInstance.post(
    "whatsapp-templates/upload-attachment",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  if (data?.ack !== 1 && data?.ack !== "1") {
    throw new Error(data?.ack_msg ?? "Failed to upload attachment");
  }

  return {
    url: data.data.url,
    fileName: data.data.fileName,
  };
};
